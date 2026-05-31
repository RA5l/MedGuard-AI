from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from enum import Enum
import uuid
import asyncio
from app.database import supabase_admin 

router = APIRouter(prefix="/api/scans", tags=["Radiology Scans"])

# Enum for scan positions
class ViewPosition(str, Enum):
    RCC = "RCC"
    LCC = "LCC"
    RMLO = "RMLO"
    LMLO = "LMLO"

# Pydantic model for saving results
class ScanResult(BaseModel):
    scan_id: str
    ai_classification: str
    ai_confidence_score: float
    generated_report: dict
    heatmap_url: str

async def mock_ai_pipeline(scan_id: str, file_bytes: bytes):
    """
    Background AI pipeline to simulate analysis and database update.
    """
    try:
        await asyncio.sleep(3) # Simulating processing time
        
        diagnostic_report = {
            "summary": "Preliminary analysis shows no malignant indicators.",
            "proposals": [
                {"label": "Benign", "probability": 0.89},
                {"label": "Malignant", "probability": 0.05},
                {"label": "Inconclusive", "probability": 0.06}
            ],
            "recommended_action": "Routine follow-up in 6 months."
        }
        
        update_data = {
            "ai_classification": "Benign",
            "ai_confidence_score": 0.89,
            "generated_report": diagnostic_report,
            "status": "completed"
        }
        
        supabase_admin.table("scans_reports").update(update_data).eq("id", scan_id).execute()
        print(f"AI Pipeline successfully generated report for: {scan_id}")
            
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
        
        # Upload file to Supabase Storage
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
            "status": "pending"
        }
        
        db_res = supabase_admin.table("scans_reports").insert(scan_data).execute()
        scan_id = db_res.data[0]['id']
        
        # Trigger Background Task
        background_tasks.add_task(mock_ai_pipeline, scan_id, file_content)
        
        return {
            "message": "Scan uploaded successfully. AI processing initiated.",
            "scan_id": scan_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/save-result")
def save_scan_result(result: ScanResult):
    """
    Saves AI analysis results and heatmap URL into the database.
    """
    try:
        update_data = {
            "ai_classification": result.ai_classification,
            "ai_confidence_score": result.ai_confidence_score,
            "generated_report": result.generated_report,
            "heatmap_url": result.heatmap_url,
            "status": "completed"
        }
        
        response = supabase_admin.table("scans_reports") \
            .update(update_data) \
            .eq("id", result.scan_id) \
            .execute()
            
        return {"message": "Scan results saved successfully!", "data": response.data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save results: {str(e)}")