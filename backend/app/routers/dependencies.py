from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase_admin, SCHEMA

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials

    try:
        # authenticate token and get user ID
        user_auth = supabase_admin.auth.get_user(token)

        if not user_auth or not user_auth.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        user_id = str(user_auth.user.id)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    # get user profile from DB
    try:
        res = supabase_admin.schema(SCHEMA).table("users").select(
            "id, full_name, email, specialty, is_active, roles(role_name)"
        ).eq("id", user_id).single().execute()

        if not res.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile not found. Contact admin."
            )

        user = res.data

        if not user.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        user["role"] = user.get("roles", {}).get("role_name", "doctor")
        return user

    except HTTPException:
        raise
    except Exception as e:
        print(f"DEPS ERROR: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not fetch user data: {str(e)}"
        )


def require_role(*allowed_roles: str):
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(allowed_roles)}"
            )
        return current_user
    return role_checker


require_admin       = require_role("admin")
require_doctor      = require_role("admin", "doctor")
require_radiologist = require_role("admin", "doctor", "radiologist")