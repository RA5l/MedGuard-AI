from fastapi import FastAPI, Depends
from app.database import supabase 
from app.routers.dependencies import get_current_user
from app.routers import auth, patient, scans

# 1. Initialize FastAPI application
app = FastAPI(
    title="MedGuard AI API",
    description="Backend system for medical imaging management and AI-powered diagnostic analysis.",
    version="1.0.0"
)

# 2. Include Routers
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(scans.router)

# 3. Root Endpoint
@app.get("/")
def read_root():
    if supabase:
        return {
            "status": "online",
            "message": "Welcome to the MedGuard-AI system.",
            "database_connected": True
        }
    return {
        "status": "error",
        "message": "Server is running, but there is a connection issue with Supabase.",
        "database_connected": False
    }

# 4. Protected Demo Endpoint
@app.get("/api/medical-records", tags=["Medical Data"])
def get_secure_data(current_user: dict = Depends(get_current_user)):
    doctor_id = current_user.get("sub")
    
    return {
        "message": "Access to secure records granted.",
        "secure_info": "This is sensitive medical data accessible only by authorized clinicians.",
        "doctor_profile": {
            "id": doctor_id
        }
    }