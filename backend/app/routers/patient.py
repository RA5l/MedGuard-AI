from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.schemas.patient import PatientCreate, PatientResponse
from app.routers.dependencies import get_current_user
from app.database import supabase

router = APIRouter(prefix="/api/patients", tags=["Patients Management"])

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(patient_data: PatientCreate):
    """
    Register a new patient assigned to the current clinician.
    """
    patient_dict = patient_data.model_dump()
    
    # Hardcoded ID for development/demo phase; replace with get_current_user in production
    patient_dict["clinician_id"] = "ae09ee6c-03b2-4f0d-9048-dbc0bc8c9fea"
    
    try:
        response = supabase.table("patients").insert(patient_dict).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create patient record.")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[PatientResponse])
def get_patients(current_user: dict = Depends(get_current_user)):
    """
    Retrieve all patients managed by the authenticated clinician.
    """
    doctor_id = current_user.get("sub") or "ae09ee6c-03b2-4f0d-9048-dbc0bc8c9fea"
    
    try:
        response = supabase.table("patients").select("*").eq("clinician_id", doctor_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not retrieve patients: {str(e)}")