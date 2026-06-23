"""
FastAPI inference server for the MedGuard mammography classifier.

Endpoints:
  GET  /health   - readiness probe (also reports model metadata)
  POST /predict   - run classification + segmentation + Grad-CAM++ on an
                    uploaded image, with an optional manual ROI box

This service is intentionally stateless and knows nothing about cases,
scans, or Supabase - it only does inference. The caller (the app's FastAPI
backend) is responsible for fetching the image, calling this service, and
writing the response into the `ai_results` table.
"""
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.inference import InferenceEngine, PIPELINE_VERSION

BUNDLE_PATH = os.environ.get("MODEL_BUNDLE_PATH", "/app/weights/medguard_multitask_bundle_v3_cost_sensitive.pth")
DEVICE = os.environ.get("INFERENCE_DEVICE")  # "cpu", "cuda", or unset for auto-detect

app = FastAPI(title="MedGuard Inference Service", version="1.0.0")

engine: InferenceEngine | None = None


@app.on_event("startup")
def load_model():
    global engine
    if not os.path.exists(BUNDLE_PATH):
        # Do not crash the container on startup - /health will report the
        # problem clearly instead of the process exiting silently in Docker.
        print(f"[startup] WARNING: bundle not found at {BUNDLE_PATH}. "
              f"/predict will return 503 until a valid bundle is mounted.")
        return
    print(f"[startup] Loading model bundle from {BUNDLE_PATH} ...")
    engine = InferenceEngine(BUNDLE_PATH, device=DEVICE)
    print(f"[startup] Model loaded on device={engine.device}. "
          f"Labels={engine.label_names} threshold={engine.threshold}")


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict
    threshold_used: float
    heatmap_png_base64: str
    segmentation_mask_png_base64: str
    roi_source: str
    pipeline_version: str
    processing_ms: int
    model_metadata: dict


@app.get("/health")
def health():
    if engine is None:
        return JSONResponse(status_code=503, content={"status": "model_not_loaded", "bundle_path": BUNDLE_PATH})
    return {
        "status": "ok",
        "device": str(engine.device),
        "label_names": engine.label_names,
        "threshold": engine.threshold,
        "image_size": engine.image_size,
        "pipeline_version": PIPELINE_VERSION,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(..., description="Mammography image file (the scan to analyze)"),
    roi_x: int | None = Form(None, description="Manual ROI top-left X (pixels, original image)"),
    roi_y: int | None = Form(None, description="Manual ROI top-left Y (pixels, original image)"),
    roi_w: int | None = Form(None, description="Manual ROI width (pixels)"),
    roi_h: int | None = Form(None, description="Manual ROI height (pixels)"),
):
    if engine is None:
        raise HTTPException(status_code=503, detail=f"Model not loaded. Expected bundle at {BUNDLE_PATH}.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload.")

    roi = None
    roi_fields = [roi_x, roi_y, roi_w, roi_h]
    if any(v is not None for v in roi_fields):
        if not all(v is not None for v in roi_fields):
            raise HTTPException(status_code=400, detail="If providing a manual ROI, all of roi_x, roi_y, roi_w, roi_h are required.")
        roi = (roi_x, roi_y, roi_w, roi_h)

    try:
        result = engine.run(image_bytes, roi=roi)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    return result
