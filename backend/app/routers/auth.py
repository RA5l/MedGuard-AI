from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.auth import DoctorCreate, DoctorResponse
from app.database import supabase 

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(doctor_data: DoctorCreate):
    try:
        auth_response = supabase.auth.sign_up({
            "email": doctor_data.email,
            "password": doctor_data.password,
            "options": {
                "data": {
                    "name": doctor_data.name,
                    "specialty": doctor_data.specialty
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed. Please check your credentials.")
            
        return {
            "id": auth_response.user.id,
            "name": doctor_data.name,
            "email": auth_response.user.email,
            "specialty": doctor_data.specialty
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration error: {str(e)}")

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": form_data.username, 
            "password": form_data.password
        })
        
        if not response or not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials or account not active.")
            
        return {
            "access_token": response.session.access_token, 
            "token_type": "bearer"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Login failed: Invalid email or password."
        )