# MedGuard Inference Service

A standalone FastAPI service that wraps the trained classifier + segmenter
bundle. It is stateless: it takes an image in, returns a prediction out. It
knows nothing about Supabase, cases, or scans.

## ROI / lesion localization

This service now implements the AI team's recommended production flow
(confirmed via deployment_notes in the delivered bundle), in priority order:

1. **manual_roi** - if the caller supplies roi_x/roi_y/roi_w/roi_h, that box
   is used directly (context-expanded the same way as training crops).
2. **segmentation_predicted_mask** (default, automatic) - the segmenter
   first runs on the FULL uploaded image to predict a coarse lesion mask.
   The largest connected component of that mask becomes the ROI, which is
   then context-expanded and cropped from the full-resolution original
   image. Classification, Grad-CAM++, and a second (fine) segmentation pass
   all run on that crop.
3. **center_crop_fallback** - only used if the coarse segmenter finds no
   component at all (empty mask) on a given image.

Every response's `roi_source` field tells you which path was actually
taken - always check it. `model_metadata.roi_caveat` carries the AI team's
own warning text about this verbatim from the bundle.

## Running locally (no Docker)

```bash
cd medguard-inference
pip install -r requirements.txt
mkdir -p weights
cp /path/to/your-bundle.pth weights/
# point MODEL_BUNDLE_PATH at whatever you actually named the file
$env:MODEL_BUNDLE_PATH="weights/your-bundle.pth"
uvicorn app.main:app --reload --port 8001
```

## Running with Docker

```bash
docker build -t medguard-inference .
docker run --rm -p 8002:8001 -v "${PWD}/weights:/app/weights:ro" -e MODEL_BUNDLE_PATH=/app/weights/your-bundle.pth medguard-inference
```

The bundle file must be reachable at the path given by `MODEL_BUNDLE_PATH`
inside the container (mount a host folder as shown, or `COPY` it into the
image - do not bake real model weights into a public image without
checking your org's policy on that).

**Important:** Docker uses whatever code was present at the last
`docker build` - editing files on disk does NOT update a running or
previously-built container. Re-run `docker build` after any code change.

## API

### `GET /health`

Returns status, device, label_names, threshold, image_size, pipeline_version.
If the bundle failed to load, returns HTTP 503 with `status: model_not_loaded`.

### `POST /predict`

`multipart/form-data` fields:
- `image` (required, file): the mammography image
- `roi_x`, `roi_y`, `roi_w`, `roi_h` (optional, int): manual lesion box in
  original-image pixels; all four or none. If omitted, automatic
  segmentation-based localization is used (see above).

Example:
```bash
curl -X POST http://localhost:8002/predict -F "image=@sample.png"
```

Response fields:
- `prediction`: "Benign" or "Malignant"
- `confidence`: float
- `probabilities`: object with both class probabilities
- `threshold_used`: float (the tuned decision threshold from the bundle)
- `heatmap_png_base64`: base64 PNG of the Grad-CAM++ overlay
- `segmentation_mask_png_base64`: base64 PNG of the binary lesion mask
  (from the fine pass, on the same crop used for classification)
- `roi_source`: `"manual_roi"` | `"segmentation_predicted_mask"` | `"center_crop_fallback"` - always check this
- `pipeline_version`: string (this service's own version, not the bundle's)
- `processing_ms`: int
- `model_metadata`: image_size, label_names, test_metrics (from the bundle,
  for traceability), roi_caveat, recommended_api_flow, context_ratio_used,
  context_ratio_source

`heatmap_png_base64` and `segmentation_mask_png_base64` are raw PNG bytes,
base64-encoded - decode and upload to Storage (or save directly) on the
caller side; this service does not touch Supabase.

## What's NOT done yet (by design, for this round)

- No auth/rate limiting on this service - it is meant to sit behind the
  app's backend, not be exposed directly to the internet.
- No GPU-specific Dockerfile included (CPU image only) - swap the base image
  if GPU inference is needed for latency.
- Not load-tested. The coarse + fine double segmentation pass roughly
  doubles per-request compute versus the old single-pass flow - worth
  profiling before assuming current latency is acceptable at scale.
