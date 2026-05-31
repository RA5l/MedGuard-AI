from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    age: int = Field(..., ge=0, le=120)
    gender: str
    phone_number: Optional[str] = None
    medical_history: Optional[str] = None
    medical_record_number: str

class PatientResponse(PatientCreate):
    id: str
    created_at: Optional[datetime] = None
    clinician_id: str  

    class Config:
        from_attributes = True