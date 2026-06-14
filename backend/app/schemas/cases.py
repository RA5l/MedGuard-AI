from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CaseStatus(str, Enum):
    pending     = "pending"
    processing  = "processing"
    ai_complete = "ai_complete"
    reviewed    = "reviewed"
    reported    = "reported"
    archived    = "archived"

class CasePriority(int, Enum):
    routine = 0
    low     = 1
    high    = 2
    urgent  = 3

class CaseCreate(BaseModel):
    case_code:          str = Field(..., min_length=1, max_length=50)
    patient_alias:      Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    priority:           CasePriority  = CasePriority.routine
    notes:              Optional[str] = None

class CaseUpdate(BaseModel):
    assigned_doctor_id: Optional[str]          = None
    status:             Optional[CaseStatus]   = None
    priority:           Optional[CasePriority] = None
    notes:              Optional[str]          = None

class CaseResponse(BaseModel):
    id:                   str
    case_code:            str
    patient_alias:        Optional[str]   = None
    status:               str
    priority:             int
    notes:                Optional[str]   = None
    created_by:           str
    assigned_doctor_id:   Optional[str]   = None
    created_at:           Optional[datetime] = None
    updated_at:           Optional[datetime] = None
    created_by_name:      Optional[str]   = None
    assigned_doctor_name: Optional[str]   = None
    total_scans:          Optional[int]   = 0
    ai_prediction:        Optional[str]   = None
    ai_confidence:        Optional[float] = None
    report_finalized:     Optional[bool]  = False

class CaseListResponse(BaseModel):
    cases: List[CaseResponse]
    total: int