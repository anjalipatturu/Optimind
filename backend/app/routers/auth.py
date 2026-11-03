from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from bson import ObjectId

from app.core.database import get_database
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserUpdate,
    PasswordChange, ForgotPasswordRequest, ResetPasswordRequest
)
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False, # Set to True in production HTTPS
        max_age=86400 * 1
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400 * 30
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserRegister, response: Response):
    db = get_database()
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_doc = {
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name,
        "avatar": None,
        "language": data.language,
        "timezone": data.timezone,
        "persona": data.persona,
        "theme": "dark",
        "settings": {
            "auto_optimize": False,
            "preferred_optimization_mode": "Balanced",
            "tone_slider": 50,
            "detail_slider": 50,
            "expertise_slider": 50,
            "dyslexia_font": False,
            "reduced_motion": False,
            "high_contrast": False,
            "font_size": "medium",
            "notifications_push": True,
            "notifications_email": True,
            "reminder_time": "19:00",
            "last_chance_enabled": True
        },
        "xp": 50, # Initial signup bonus XP
        "level": 1,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    res = await db.users.insert_one(user_doc)
    user_id = str(res.inserted_id)

    # Initialize streak
    await db.streaks.insert_one({
        "user_id": user_id,
        "current": 0,
        "longest": 0,
        "last_qualified_date": None,
        "freezes": 1,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    user_doc["id"] = user_id
    user_doc.pop("_id", None)
    user_doc.pop("password_hash", None)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_doc
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, response: Response):
    db = get_database()
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    user["id"] = user_id
    user.pop("_id", None)
    user.pop("password_hash", None)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Check header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header[7:]

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token required")

    payload = decode_token(refresh_token, is_refresh=True)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = payload["sub"]
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    set_auth_cookies(response, new_access, new_refresh)

    user["id"] = user_id
    user.pop("_id", None)
    user.pop("password_hash", None)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user.pop("password_hash", None)
    return user

@router.put("/me")
async def update_me(data: UserUpdate, user: dict = Depends(get_current_user)):
    db = get_database()
    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.avatar is not None:
        updates["avatar"] = data.avatar
    if data.language is not None:
        updates["language"] = data.language
    if data.timezone is not None:
        updates["timezone"] = data.timezone
    if data.persona is not None:
        updates["persona"] = data.persona
    if data.theme is not None:
        updates["theme"] = data.theme
    if data.settings is not None:
        updates["settings"] = data.settings.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc)

    updated = await db.users.find_one_and_update(
        {"_id": ObjectId(user["id"])},
        {"$set": updates},
        return_document=True
    )
    updated["id"] = str(updated["_id"])
    updated.pop("_id", None)
    updated.pop("password_hash", None)
    return updated

@router.put("/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    db = get_database()
    full_user = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not verify_password(data.old_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"status": "success", "message": "Password changed successfully"}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    # Simulated password reset flow: returns a reset token for testing
    db = get_database()
    user = await db.users.find_one({"email": data.email.lower()})
    if user:
        reset_token = create_access_token(str(user["_id"]), expires_delta=timedelta(hours=1), extra_claims={"action": "pwd_reset"})
        return {"status": "success", "message": "Reset email dispatched", "reset_token": reset_token}
    return {"status": "success", "message": "If this email exists, a reset link was sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    payload = decode_token(data.token)
    if not payload or payload.get("action") != "pwd_reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user_id = payload["sub"]
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"status": "success", "message": "Password reset successfully"}

@router.delete("/me")
async def delete_account(response: Response, user: dict = Depends(get_current_user)):
    """Full data deletion (Privacy control: delete-all-my-data)."""
    db = get_database()
    u_id = user["id"]
    await db.users.delete_one({"_id": ObjectId(u_id)})
    await db.chats.delete_many({"user_id": u_id})
    await db.messages.delete_many({"user_id": u_id})
    await db.attachments.delete_many({"user_id": u_id})
    await db.document_chunks.delete_many({"user_id": u_id})
    await db.optimizations.delete_many({"user_id": u_id})
    await db.memories.delete_many({"user_id": u_id})
    await db.streaks.delete_one({"user_id": u_id})
    await db.daily_activity.delete_many({"user_id": u_id})
    clear_auth_cookies(response)
    return {"status": "success", "message": "All user data deleted permanently."}

