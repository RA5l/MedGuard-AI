"""
Orchestrates a single scan's AI analysis:
  1. Look up the scan (original_scan_url, case_id)
  2. Download the image bytes
  3. Call the medguard-inference service's /predict (see ../../../medguard-inference)
  4. Upload the returned heatmap + segmentation mask PNGs to Storage
  5. Insert a row into ai_results
  6. Move the case to status='ai_complete'
  7. Audit log

This route does NOT contain any model code itself - it is a thin client of
the separate inference service (INFERENCE_SERVICE_URL). The actual model
weights, preprocessing, and inference logic live there.

IMPORTANT CAVEAT (do not remove this comment): the inference service has no
real lesion detector yet. Without `roi` in the request, it falls back to a
center-crop that the model was not validated on (see medguard-inference
README, "roi_source" field). Predictions from that fallback path should be
treated as unvalidated, not clinical-grade.
"""
import base64
import time
import uuid

import httpx
from fastapi import APIRouter, HTTPException, Depends, status

from app.config import settings
from app.database import supabase_admin, SCHEMA
from app.routers.dependencies import require_doctor
from app.schemas.ai import AnalyzeRequest, AIResultResponse

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])


@router.post("/analyze/{scan_id}", response_model=AIResultResponse, status_code=status.HTTP_201_CREATED)
async def analyze_scan(
    scan_id: str,
    body: AnalyzeRequest = AnalyzeRequest(),
    current_user: dict = Depends(require_doctor),
):
    scan_res = supabase_admin.schema(SCHEMA).table("scans").select(
        "id, case_id, original_scan_url"
    ).eq("id", scan_id).execute()

    if not scan_res.data:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan = scan_res.data[0]
    case_id = scan["case_id"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            img_resp = await client.get(scan["original_scan_url"])
            img_resp.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Could not download scan image: {e}")

        files = {"image": ("scan.png", img_resp.content, "image/png")}
        data = {}
        if body.roi:
            data = {
                "roi_x": body.roi.roi_x, "roi_y": body.roi.roi_y,
                "roi_w": body.roi.roi_w, "roi_h": body.roi.roi_h,
            }

        try:
            infer_resp = await client.post(
                f"{settings.INFERENCE_SERVICE_URL}/predict",
                files=files, data=data, timeout=60.0,
            )
            infer_resp.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Inference service call failed ({settings.INFERENCE_SERVICE_URL}): {e}"
            )

    result = infer_resp.json()

    batch_id = uuid.uuid4()
    heatmap_bytes = base64.b64decode(result["heatmap_png_base64"])
    mask_bytes = base64.b64decode(result["segmentation_mask_png_base64"])

    heatmap_path = f"{SCHEMA}/{case_id}/ai-results/{batch_id}_heatmap.png"
    mask_path = f"{SCHEMA}/{case_id}/ai-results/{batch_id}_mask.png"

    supabase_admin.storage.from_("mammograms").upload(
        path=heatmap_path, file=heatmap_bytes, file_options={"content-type": "image/png"}
    )
    supabase_admin.storage.from_("mammograms").upload(
        path=mask_path, file=mask_bytes, file_options={"content-type": "image/png"}
    )
    heatmap_url = supabase_admin.storage.from_("mammograms").get_public_url(heatmap_path)
    mask_url = supabase_admin.storage.from_("mammograms").get_public_url(mask_path)

    # 5. Upsert ai_results row (was insert - switched after a real 23505
    # unique_violation on constraint "ai_results_scan_id_key" confirmed a
    # genuine UNIQUE constraint on scan_id). Re-running analysis on the same
    # scan now updates that scan's existing row instead of crashing with a
    # 500. This means analysis HISTORY per scan is not kept - only the
    # latest run survives. If history matters later, this needs a separate
    # ai_results_history table instead of upsert.
    # NOTE: probabilities/roi_source/model_metadata/mask_url have no
    # dedicated columns in the live schema - stored inside generated_report
    # (jsonb) rather than inventing new columns.
    ai_row = supabase_admin.schema(SCHEMA).table("ai_results").upsert({
        "case_id": case_id,
        "scan_id": scan_id,
        "prediction": result["prediction"],
        "confidence": result["confidence"],
        "heatmap_url": heatmap_url,
        "pipeline_version": result["pipeline_version"],
        "processing_ms": result["processing_ms"],
        "generated_report": {
            "probabilities": result["probabilities"],
            "threshold_used": result["threshold_used"],
            "roi_source": result["roi_source"],
            "segmentation_mask_url": mask_url,
            "model_metadata": result["model_metadata"],
        },
    }, on_conflict="scan_id").execute()

    if not ai_row.data:
        raise HTTPException(status_code=500, detail="Failed to save AI result")

    # 6. Move the case to ai_complete - forward-only (never regress a case
    # that's already further along, e.g. 'reported', back to 'ai_complete'
    # just because analysis was re-run). Mirrors caseService.bumpStatusForward
    # on the frontend (kept in sync manually - no shared module between the
    # two codebases for this small enum-ordering rule).
    STATUS_RANK = {"pending": 0, "processing": 1, "ai_complete": 2, "reviewed": 3, "reported": 4}
    case_row = supabase_admin.schema(SCHEMA).table("cases").select("status").eq("id", case_id).execute()
    current_status = case_row.data[0]["status"] if case_row.data else None
    if current_status in STATUS_RANK and STATUS_RANK["ai_complete"] > STATUS_RANK[current_status]:
        supabase_admin.schema(SCHEMA).table("cases").update({
            "status": "ai_complete",
        }).eq("id", case_id).execute()

    supabase_admin.schema(SCHEMA).table("audit_logs").insert({
        "user_id": current_user["id"],
        "action": "AI_ANALYSIS_COMPLETED",
        "entity_type": "ai_results",
        "entity_id": ai_row.data[0]["id"],
        "metadata": {
            "case_id": case_id,
            "scan_id": scan_id,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "roi_source": result["roi_source"],
        },
    }).execute()

    row = ai_row.data[0]
    return AIResultResponse(
        id=row["id"],
        case_id=row["case_id"],
        scan_id=row["scan_id"],
        prediction=row["prediction"],
        confidence=row["confidence"],
        heatmap_url=row.get("heatmap_url"),
        generated_report=row.get("generated_report"),
        pipeline_version=row.get("pipeline_version"),
        processing_ms=row.get("processing_ms"),
        created_at=row.get("created_at"),
    )
