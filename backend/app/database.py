from supabase import create_client, Client
from app.config import settings

# ─────────────────────────────────────────────
# supabase       ← for regular queries (RLS applies)
# supabase_admin ← for administrative operations (bypasses RLS)
# ─────────────────────────────────────────────

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)

supabase_admin: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

# Schema used in queries (e.g., "dev" for development, "public" for production)
SCHEMA = settings.DB_SCHEMA  # "dev" or "public"
