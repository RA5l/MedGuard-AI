from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from app.schemas.scans import ScanResponse, ScanViewType
from app.database import supabase_admin, SCHEMA
from app.routers.dependencies import get_current_user
from PIL import Image
import io, uuid

router = APIRouter(prefix="/api/scans", tags=["Scans"])

ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/jpg",
    "image/avif", "image/webp",
    "image/dicom", "application/dicom",
    "application/octet-stream"
}
MAX_SIZE_MB = 20

@router.post("", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def upload_scan(
    case_id:        str          = Form(...),
    scan_view_type: ScanViewType = Form(...),
    file:           UploadFile   = File(...),
    current_user:   dict         = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    content = await file.read()

    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_SIZE_MB}MB")

    case = supabase_admin.schema(SCHEMA).table("cases").select("id").eq("id", case_id).execute()
    if not case.data:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        # Convert any image format to PNG for Supabase Storage compatibility
        img = Image.open(io.BytesIO(content))
        output = io.BytesIO()
        img.convert("RGB").save(output, format="PNG")
        content           = output.getvalue()
        file_content_type = "image/png"
        file_name         = f"{SCHEMA}/{case_id}/{uuid.uuid4()}.png"

        supabase_admin.storage.from_("mammograms").upload(
            path         = file_name,
            file         = content,
            file_options = {"content-type": file_content_type}
        )

        public_url = supabase_admin.storage.from_("mammograms").get_public_url(file_name)

        res = supabase_admin.schema(SCHEMA).table("scans").insert({
            "case_id":           case_id,
            "original_scan_url": public_url,
            "scan_view_type":    scan_view_type.value,
            "mime_type":         file_content_type,
            "file_size_bytes":   len(content),
            "uploaded_by":       current_user["id"]
        }).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save scan record")

        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     current_user["id"],
            "action":      "SCAN_UPLOADED",
            "entity_type": "scans",
            "entity_id":   res.data[0]["id"],
            "metadata": {
                "case_id":        case_id,
                "scan_view_type": scan_view_type.value,
                "file_size_mb":   round(len(content) / 1024 / 1024, 2)
            }
        }).execute()

        row = res.data[0]
        return ScanResponse(
            id                = row["id"],
            case_id           = row["case_id"],
            original_scan_url = row["original_scan_url"],
            scan_view_type    = row["scan_view_type"],
            laterality        = row.get("laterality"),
            mime_type         = row.get("mime_type"),
            file_size_bytes   = row.get("file_size_bytes"),
            uploaded_by       = row["uploaded_by"],
            created_at        = row.get("created_at")
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/case/{case_id}")
async def get_case_scans(
    case_id:      str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.schema(SCHEMA).table("scans").select("*").eq(
            "case_id", case_id
        ).order("created_at", desc=False).execute()
        return {"scans": res.data or [], "total": len(res.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
