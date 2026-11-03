from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from app.core.database import get_database
from app.core.security import decode_token

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user_optional(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[dict]:
    token = None
    # Check Bearer Authorization header first
    if creds:
        token = creds.credentials
    # Fallback to httpOnly cookie 'access_token'
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        return None

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload["sub"]
    try:
        db = get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            user["id"] = str(user["_id"])
            user.pop("_id", None)
            return user
    except Exception:
        return None

    return None

async def get_current_user(
    user: Optional[dict] = Depends(get_current_user_optional)
) -> dict:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

