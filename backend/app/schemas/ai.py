from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ManualROI(BaseModel):
    roi_x: int
    roi_y: int
    roi_w: int
    roi_h: int


class AnalyzeRequest(BaseModel):
    # Optional manual lesion box, original-image pixel coordinates.
    # See medguard-inference/README.md: this is the only mode validated by
    # the model's reported metrics. Omit only as a temporary fallback.
    roi: Optional[ManualROI] = None


class AIResultResponse(BaseModel):
    id:               str
    case_id:          str
    scan_id:          str
    prediction:       str
    confidence:       float
    heatmap_url:      Optional[str]
    generated_report: Optional[dict]
    pipeline_version: Optional[str]
    processing_ms:    Optional[int]
    created_at:       Optional[datetime]
