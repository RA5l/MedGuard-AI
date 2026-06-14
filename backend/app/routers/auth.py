from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import (
    LoginRequest, LoginResponse, UserProfile,
    CreateUserRequest, CreateUserResponse,
    ChangePasswordRequest
)
from app.database import supabase, supabase_admin, SCHEMA
from app.routers.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email":    body.email,
            "password": body.password
        })

        session = res.session if hasattr(res, 'session') else None
        user    = res.user    if hasattr(res, 'user')    else None

        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        user_res = supabase_admin.schema(SCHEMA).table("users").select(
            "id, full_name, email, specialty, is_active, roles(role_name)"
        ).eq("id", str(user.id)).single().execute()

        if not user_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Contact admin."
            )

        user_data = user_res.data
        role      = user_data.get("roles", {}).get("role_name", "doctor")

        return LoginResponse(
            access_token = session.access_token,
            token_type   = "bearer",
            user         = UserProfile(
                id        = str(user.id),
                full_name = user_data["full_name"],
                email     = user_data["email"],
                role      = role,
                specialty = user_data.get("specialty"),
                is_active = user_data.get("is_active", True)
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"LOGIN ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed: Invalid email or password"
        )

# ─────────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────────
@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user
    """
    return UserProfile(
        id        = current_user["id"],
        full_name = current_user["full_name"],
        email     = current_user["email"],
        role      = current_user["role"],
        specialty = current_user.get("specialty"),
        is_active = current_user.get("is_active", True)
    )


# ─────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────
@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Log Out
    """
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception:
        return {"message": "Logged out"}


# ─────────────────────────────────────────────
# POST /api/auth/create-user  (Just Admin)
# ─────────────────────────────────────────────
@router.post(
    "/create-user",
    response_model=CreateUserResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_user(
    body: CreateUserRequest,
    admin: dict = Depends(require_admin)
):
    """
    the Admin creates a new user (doctor or admin)
    """
    try:
        # 1. create auth user in Supabase
        auth_res = supabase_admin.auth.admin.create_user({
            "email":            body.email,
            "password":         body.password,
            "email_confirm":    True,  # Don't send confirmation email
            "user_metadata": {
                "full_name": body.full_name,
                "role":      body.role
            }
        })

        if not auth_res.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create auth user"
            )

        new_user_id = str(auth_res.user.id)

        # 2.create user profile in DB via RPC 
        supabase_admin.rpc("create_user_by_admin", {
            "p_user_id":   new_user_id,
            "p_email":     body.email,
            "p_full_name": body.full_name,
            "p_role_name": body.role,
            "p_specialty": body.specialty,
            "p_admin_id":  admin["id"],
            "p_schema":    SCHEMA
        }).execute()

        # 3. log the action in audit_logs
        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     admin["id"],
            "action":      "USER_CREATED",
            "entity_type": "users",
            "entity_id":   new_user_id,
            "metadata": {
                "created_email": body.email,
                "created_role":  body.role,
                "created_by":    admin["email"]
            }
        }).execute()

        return CreateUserResponse(
            id        = new_user_id,
            email     = body.email,
            full_name = body.full_name,
            role      = body.role,
            specialty = body.specialty
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )


# ─────────────────────────────────────────────
# GET /api/auth/users  (Just Admin)
# ─────────────────────────────────────────────
@router.get("/users")
async def list_users(admin: dict = Depends(require_admin)):
    """
    the Admin views all users
    """
    try:
        res = supabase_admin.schema(SCHEMA).table("users").select(
            "id, full_name, email, specialty, is_active, created_at, "
            "roles(role_name)"
        ).order("created_at", desc=True).execute()

        users = []
        for u in res.data:
            users.append({
                "id":        u["id"],
                "full_name": u["full_name"],
                "email":     u["email"],
                "role":      u.get("roles", {}).get("role_name", "doctor"),
                "specialty": u.get("specialty"),
                "is_active": u.get("is_active", True),
                "created_at": u.get("created_at")
            })

        return {"users": users, "total": len(users)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


# ─────────────────────────────────────────────
# PATCH /api/auth/users/{user_id}/deactivate  (Just Admin)
# ─────────────────────────────────────────────
@router.patch("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    admin: dict = Depends(require_admin)
):
    """
    the Admin deactivates a user account
    """
    try:
        supabase_admin.schema(SCHEMA).table("users").update(
            {"is_active": False}
        ).eq("id", user_id).execute()

        # Audit Log
        supabase_admin.schema(SCHEMA).table("audit_logs").insert({
            "user_id":     admin["id"],
            "action":      "USER_DEACTIVATED",
            "entity_type": "users",
            "entity_id":   user_id,
            "metadata":    {"deactivated_by": admin["email"]}
        }).execute()

        return {"message": "User deactivated successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate user: {str(e)}"
        )
