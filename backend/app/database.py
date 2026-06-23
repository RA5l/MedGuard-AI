from supabase import create_client, Client
from app.config import settings

# Regular client: bound by Row Level Security (RLS)
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)

# Admin client: uses service role key to bypass Row Level Security (RLS)
supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

# Schema used in queries (e.g., "dev" for development, "public" for production)
SCHEMA = settings.DB_SCHEMA  # "dev" or "public"
