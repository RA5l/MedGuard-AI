import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase
    SUPABASE_URL: str               = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str          = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str        = os.getenv("SUPABASE_JWT_SECRET", "")

    # App
    APP_ENV: str   = os.getenv("APP_ENV", "development")
    DB_SCHEMA: str = os.getenv("DB_SCHEMA", "dev")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # AI inference service (medguard-inference, run separately - see its README)
    INFERENCE_SERVICE_URL: str = os.getenv("INFERENCE_SERVICE_URL", "http://localhost:8001")

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    def __init__(self):
        missing = []
        if not self.SUPABASE_URL:            missing.append("SUPABASE_URL")
        if not self.SUPABASE_ANON_KEY:       missing.append("SUPABASE_ANON_KEY")
        if not self.SUPABASE_SERVICE_ROLE_KEY: missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not self.SUPABASE_JWT_SECRET:     missing.append("SUPABASE_JWT_SECRET")

        if missing:
            raise ValueError(f"Missing environment variables: {', '.join(missing)}")

        print(f"✔ MedGuard AI — Environment: {self.APP_ENV} | Schema: {self.DB_SCHEMA}")

settings = Settings()
