from supabase import create_client
from app.config import settings

# Initialize Supabase clients using the settings object
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)