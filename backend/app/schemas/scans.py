from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ScanViewType(str, Enum):
    RCC  = "RCC"
    LCC  = "LCC"
    RMLO = "RMLO"
    LMLO = "LMLO"

class ScanResponse(BaseModel):
    id:                str
    case_id:           str
    original_scan_url: str
    scan_view_type:    str
    laterality:        Optional[str]
    mime_type:         Optional[str]
    file_size_bytes:   Optional[int]
    uploaded_by:       str
    created_at:        Optional[datetime]