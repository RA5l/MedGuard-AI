from pydantic import BaseModel, EmailStr, Field

# Schema for registering a new doctor
class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50, description="Full name of the doctor")
    email: EmailStr = Field(..., description="Official email address")
    password: str = Field(..., min_length=8, description="Password (at least 8 characters)")
    specialty: str = Field(..., description="Medical specialty")

# Schema for the server response after successful registration
class DoctorResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    specialty: str

    class Config:
        from_attributes = True