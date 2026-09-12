from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.security import decode_access_token
from backend.app.db.postgres_direct import DirectDB

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication session. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user profile from database
    user = DirectDB.get_profile_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or has been disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory that enforces specific roles.
    Example: Depends(require_roles(["official", "admin"]))
    """
    async def role_checker(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "citizen")
        if user_role not in allowed_roles:
            role_names = ", ".join(r.capitalize() for r in allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This action requires {role_names} privileges."
            )
        return user

    return role_checker
