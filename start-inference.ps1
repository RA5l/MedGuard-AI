# start-inference.ps1 — run on its own to test: .\start-inference.ps1
Set-Location "$PSScriptRoot\inference"
docker run --rm -p 8002:8001 -v "${PWD}/weights:/app/weights:ro" -e MODEL_BUNDLE_PATH=/app/weights/MedGuard_multitask_bundle_v1.pth medguard-inference
