import os
from dotenv import load_dotenv

load_dotenv()
print(f"DEBUG: SUPABASE_URL is {os.getenv('SUPABASE_URL')}")

class Settings:
    """
    Application settings configuration loaded from environment variables.
    """
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    def __init__(self):
        # Validation to ensure all critical environment variables are set
        if not self.SUPABASE_URL or not self.SUPABASE_ANON_KEY or not self.SUPABASE_JWT_SECRET or not self.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError(
                "Configuration Error: Please ensure SUPABASE_URL, SUPABASE_ANON_KEY, "
                "SUPABASE_JWT_SECRET, and SUPABASE_SERVICE_ROLE_KEY are correctly set in the .env file."
            )

settings = Settings()