from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, cases, scans

app = FastAPI(
    title       = "MedGuard AI API",
    description = "Breast cancer screening platform API",
    version     = "1.0.0",
    docs_url    = "/docs" if settings.is_development else None,
    redoc_url   = None
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins     = origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(scans.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status":      "online",
        "environment": settings.APP_ENV,
        "schema":      settings.DB_SCHEMA,
        "version":     "1.0.0"
    }
