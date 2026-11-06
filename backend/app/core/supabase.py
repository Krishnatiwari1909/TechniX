"""
Supabase Backend Client & Auth Middleware
Provides token verification dependency for secure FastAPI endpoints.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, Header, status
from supabase import create_client, Client

try:
    from app.core.config import SUPABASE_URL, SUPABASE_KEY
except ImportError:
    from backend.app.core.config import SUPABASE_URL, SUPABASE_KEY

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[Supabase Core] Client initialized for URL: {SUPABASE_URL}")
    except Exception as e_sb:
        print(f"[Supabase Core] Client initialization notice: {e_sb}")


async def verify_supabase_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Verifies user's Supabase JWT token from Authorization header ('Bearer <token>').
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'"
        )

    token = parts[1]
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase client not configured on server"
        )

    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Supabase token"
            )
        return {
            "id": user_res.user.id,
            "email": user_res.user.email,
            "user_metadata": user_res.user.user_metadata or {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )
