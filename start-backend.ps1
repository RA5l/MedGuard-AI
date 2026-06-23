# start-backend.ps1 — run on its own to test: .\start-backend.ps1
Set-Location "$PSScriptRoot\backend"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
