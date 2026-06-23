import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, cases, scans, ai

app = FastAPI(
    title       = "MedGuard AI API",
    description = "Breast cancer screening platform API",
    version     = "1.0.0",
    docs_url    = "/docs" if settings.is_development else None,
    redoc_url   = None
)



# In development, Vite picks a port dynamically (5173, 5174, …) if the
# previous one is busy, so hardcoding a single port causes spurious CORS
# failures. Using a regex in dev matches all localhost ports.
# In production, set CORS_ORIGINS to a comma-separated list of exact
# allowed origins (e.g. "https://medguard.example.com").
_cors_env = os.getenv("CORS_ORIGINS", "")

if _cors_env:
    # Production: explicit comma-separated list from the environment.
    origins        = [o.strip() for o in _cors_env.split(",") if o.strip()]
    origin_regex   = None
else:
    # Development: allow any localhost / 127.0.0.1 origin regardless of port.
    origins        = []
    origin_regex   = r"http://(localhost|127\.0\.0\.1)(:\d+)?"

app.add_middleware(
    CORSMiddleware,
    allow_origins      = origins,
    allow_origin_regex = origin_regex,
    allow_credentials  = True,
    allow_methods      = ["*"],
    allow_headers      = ["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(scans.router)
app.include_router(ai.router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status":      "online",
        "environment": settings.APP_ENV,
        "schema":      settings.DB_SCHEMA,
        "version":     "1.0.0"
    }
