from fastapi import Request, HTTPException, status

async def get_current_user(request: Request):
    """
    Dependency to get the current authenticated user.
    Uses 'Bearer dev-mode-token' for development purposes.
    """
    # Extracting the Authorization header
    token = request.headers.get("Authorization")
    
    # Development bypass for rapid testing
    if token == "Bearer dev-mode-token": 
        return {"sub": "ae09ee6c-03b2-4f0d-9048-dbc0bc8c9fea"}
    
    # In a production environment, you would validate the JWT here using supabase.auth.get_user(token)
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token. Please provide 'Bearer dev-mode-token' for development."
    )