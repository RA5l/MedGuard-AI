@echo off
echo Starting MedGuard-AI Backend...
call venv\Scripts\activate
uvicorn app.main:app --reload
pause