from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.schemas.cases import CaseCreate, CaseUpdate, CaseResponse, CaseListResponse
from app.database import supabase_admin, SCHEMA
from app.routers.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/cases", tags=["Cases"])


# ─────────────────────────────────────────────
# GET /api/cases — list cases
# Admin sees all, doctor sees only assigned
# ─────────────────────────────────────────────
@router.get("", response_model=CaseListResponse)
async def list_cases(
    status:   Optional[str] = Query(None),
    priority: Optional[int] = Query(None),
    search:   Optional[str] = Query(None),
    limit:    int           = Query(20, ge=1, le=100),
    offset:   int           = Query(0,  ge=0),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = supabase_admin.schema(SCHEMA).table("v_case_dashboard").select("*")

        # Doctors see only their cases
        if current_user["role"] != "admin":
            query = query.eq("assigned_doctor_id", current_user["id"])

        # Filters
        if status:
            query = query.eq("status", status)
        if priority is not None:
            query = query.eq("priority", priority)
        if search:
            query = query.ilike("case_code", f"%{search}%")

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        res   = query.execute()

        cases = []
        for row in (res.data or []):
            cases.append(CaseResponse(
                id                   = row["case_id"],
                case_code            = row["case_code"],
                patient_alias        = row.get("patient_alias"),
                status               = row["status"],
                priority             = row["priority"],
                notes                = row.get("notes"),
                created_by           = row.get("created_by_name", ""),
                assigned_doctor_id   = row.get("assigned_doctor_name"),
                created_at           = row.get("created_at"),
                updated_at           = row.get("updated_at"),
                created_by_name      = row.get("created_by_name"),
                assigned_doctor_name = row.get("assigned_doctor_name"),
                total_scans          = row.get("total_scans", 0),
                ai_prediction        = row.get("ai_prediction"),
                ai_confidence        = row.get("ai_confidence"),
                report_finalized     = row.get("report_finalized", False),
            ))

        return CaseListResponse(cases=cases, total=len(cases))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# POST /api/cases — create case
# ─────────────────────────────────────────────
@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Check case_code is unique
        exists = supabase_admin.schema(SCHEMA).table("cases").select("id").eq(
            "case_code", body.case_code
        ).execute()

        if exists.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Case code '{body.case_code}' already exists"
            )

        new_case = {
            "case_code":          body.case_code,
            "patient_alias":      body.patient_alias,
            "created_by":         current_user["id"],
            "assigned_doctor_id": body.assigned_doctor_id or current_user["id"],
            "priority":           body.priority,
            "notes":              body.notes,
            "status":             "pending"
        }

        res = supabase_admin.schema(SCHEMA).table("cases").insert(new_case).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create case")

        # Audit log
        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     current_user["id"],
            "action":      "CASE_CREATED",
            "entity_type": "cases",
            "entity_id":   res.data[0]["id"],
            "metadata":    {"case_code": body.case_code}
        }).execute()

        row = res.data[0]
        return CaseResponse(
            id                   = row["id"],
            case_code            = row["case_code"],
            patient_alias        = row.get("patient_alias"),
            status               = row["status"],
            priority             = row["priority"],
            notes                = row.get("notes"),
            created_by           = row["created_by"],
            assigned_doctor_id   = row.get("assigned_doctor_id"),
            created_at           = row.get("created_at"),
            updated_at           = row.get("updated_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# GET /api/cases/{case_id} — single case
# ─────────────────────────────────────────────
@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.schema(SCHEMA).table("v_case_dashboard").select("*").eq(
            "case_id", case_id
        ).single().execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")

        row = res.data

        # Doctors can only view their assigned cases
        if current_user["role"] != "admin":
            if row.get("assigned_doctor_name") != current_user["full_name"]:
                raise HTTPException(status_code=403, detail="Access denied")

        return CaseResponse(
            id                   = row["case_id"],
            case_code            = row["case_code"],
            patient_alias        = row.get("patient_alias"),
            status               = row["status"],
            priority             = row["priority"],
            notes                = row.get("notes"),
            created_by           = row.get("created_by_name", ""),
            assigned_doctor_id   = row.get("assigned_doctor_name"),
            created_at           = row.get("created_at"),
            updated_at           = row.get("updated_at"),
            created_by_name      = row.get("created_by_name"),
            assigned_doctor_name = row.get("assigned_doctor_name"),
            total_scans          = row.get("total_scans", 0),
            ai_prediction        = row.get("ai_prediction"),
            ai_confidence        = row.get("ai_confidence"),
            report_finalized     = row.get("report_finalized", False),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# PATCH /api/cases/{case_id} — update case
# ─────────────────────────────────────────────
@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        updates = body.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        res = supabase_admin.schema(SCHEMA).table("cases").update(updates).eq(
            "id", case_id
        ).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Case not found")

        # Audit log
        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     current_user["id"],
            "action":      "CASE_UPDATED",
            "entity_type": "cases",
            "entity_id":   case_id,
            "metadata":    updates
        }).execute()

        return await get_case(case_id, current_user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# DELETE /api/cases/{case_id} — admin only
# ─────────────────────────────────────────────
@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    admin: dict = Depends(require_admin)
):
    try:
        supabase_admin.schema(SCHEMA).table("cases").delete().eq("id", case_id).execute()

        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     admin["id"],
            "action":      "CASE_DELETED",
            "entity_type": "cases",
            "entity_id":   case_id,
            "metadata":    {"deleted_by": admin["email"]}
        }).execute()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))