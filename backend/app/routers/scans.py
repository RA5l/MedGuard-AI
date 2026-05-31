from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from enum import Enum
import uuid
import cv2
import numpy as np
import asyncio
from app.database import supabase_admin 

router = APIRouter(prefix="/api/scans", tags=["Radiology Scans"])

class ViewPosition(str, Enum):
    RCC = "RCC"
    LCC = "LCC"
    RMLO = "RMLO"
    LMLO = "LMLO"

async def mock_ai_pipeline(scan_id: str, file_bytes: bytes):
    """
    Enhanced AI Pipeline that returns a structured JSON object 
    containing diagnostic proposals, confidence levels, and clinical recommendations.
    """
    try:
        # Simulating processing time
        await asyncio.sleep(3)
        
        # Structured JSON diagnostic report
        diagnostic_report = {
            "summary": "Preliminary analysis shows no malignant indicators.",
            "proposals": [
                {"label": "Benign", "probability": 0.89},
                {"label": "Malignant", "probability": 0.05},
                {"label": "Inconclusive", "probability": 0.06}
            ],
            "recommended_action": "Routine follow-up in 6 months.",
            "meta": {
                "method": "CLAHE_Contrast_Enhancement",
                "model_version": "v1.0-beta",
                "processed_at": "2026-05-31T15:00:00Z"
            }
        }
        
        # Prepare the update payload
        update_data = {
            "ai_classification": "Benign",
            "ai_confidence_score": 0.89,
            "generated_report": diagnostic_report  # Saving as JSON/JSONB
        }
        
        # Update record in Supabase
        supabase_admin.table("scans_reports").update(update_data).eq("id", scan_id).execute()
        print(f"AI Pipeline successfully generated JSON report for: {scan_id}")
            
    except Exception as e:
        print(f"Error in background AI pipeline for {scan_id}: {str(e)}")

@router.post("/upload")
async def upload_scan(
    background_tasks: BackgroundTasks,
    patient_id: str = Form(...),
    clinician_id: str = Form(...),
    view_position: ViewPosition = Form(...),
    file: UploadFile = File(...)
):
    file_path = f"scans/{patient_id}/{uuid.uuid4()}_{file.filename}"
    
    try:
        file_content = await file.read()
        
        supabase_admin.storage.from_("mammograms").upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        scan_data = {
            "patient_id": patient_id,
            "clinician_id": clinician_id,
            "scan_view_type": view_position.value,
            "original_scan_url": file_path,
        }
        
        db_res = supabase_admin.table("scans_reports").insert(scan_data).execute()
        scan_id = db_res.data[0]['id']
        
        background_tasks.add_task(mock_ai_pipeline, scan_id, file_content)
        
        return {
            "message": "Scan uploaded successfully. AI processing initiated.",
            "view": view_position.value,
            "scan": db_res.data[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")