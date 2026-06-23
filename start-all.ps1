# start-all.ps1
# One command to launch everything for local testing. Run from the
# medguard-project root folder:
#
#   .\start-all.ps1
#
# Opens three separate PowerShell windows, one per service, so you can
# watch each one's logs independently and Ctrl+C any single one without
# killing the others:
#   1) start-inference.ps1  -> Docker, http://localhost:8002
#   2) start-backend.ps1    -> uvicorn (venv),  http://localhost:8000
#   3) start-frontend.ps1   -> Vite dev server, http://localhost:5174
#
# PREREQUISITES (one-time, not part of this script):
#   - Docker image already built:  cd inference; docker build -t medguard-inference .
#   - Real weights placed at:      inference\weights\MedGuard_multitask_bundle_v1.pth
#   - backend\.env has:            INFERENCE_SERVICE_URL=http://localhost:8002
#
# If any one service fails to start, run its own script directly
# (e.g. .\start-backend.ps1) in a single window to see the full error
# without the other two windows' output mixed in.

$here = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-File", "$here\start-inference.ps1"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-File", "$here\start-backend.ps1"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-File", "$here\start-frontend.ps1"

Write-Host ""
Write-Host "Launched in 3 separate windows:" -ForegroundColor Green
Write-Host "  Inference: http://localhost:8002/health"
Write-Host "  Backend:   http://localhost:8000/docs"
Write-Host "  Frontend:  http://localhost:5174"
