from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ─── Login ───
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
    access_token:  str
    token_type:    str = "bearer"
    user:          "UserProfile"

# ─── User Profile ───
class UserProfile(BaseModel):
    id:         str
    full_name:  str
    email:      EmailStr
    role:       str
    specialty:  Optional[str] = None
    is_active:  bool = True

# ─── Admin creates a new user ───
class CreateUserRequest(BaseModel):
    email:      EmailStr
    password:   str       = Field(..., min_length=8)
    full_name:  str       = Field(..., min_length=3)
    role:       str       = Field(..., pattern="^(admin|doctor|radiologist)$")
    specialty:  Optional[str] = None

class CreateUserResponse(BaseModel):
    id:         str
    email:      EmailStr
    full_name:  str
    role:       str
    specialty:  Optional[str] = None
    created_at: Optional[datetime] = None

# ─── Update Password ───
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=8)
    new_password:     str = Field(..., min_length=8)

LoginResponse.model_rebuild()
