from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/notifications", tags=["notifications"])

class PushSubscriptionPayload(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class SnoozePayload(BaseModel):
    hours: int = 24

class SettingsPayload(BaseModel):
    notifications_push: bool
    notifications_email: bool
    reminder_time: str
    last_chance_enabled: bool

@router.get("/vapid-key")
async def get_vapid_key():
    return {"publicKey": settings.VAPID_PUBLIC_KEY}

@router.post("/subscribe")
async def subscribe_push(sub: PushSubscriptionPayload, user: dict = Depends(get_current_user)):
    db = get_database()
    await db.push_subscriptions.update_one(
        {"user_id": user["id"], "endpoint": sub.endpoint},
        {"$set": {"keys": sub.keys, "updated_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    return {"status": "success", "subscribed": True}

@router.delete("/subscribe")
async def unsubscribe_push(endpoint: str, user: dict = Depends(get_current_user)):
    db = get_database()
    await db.push_subscriptions.delete_one({"user_id": user["id"], "endpoint": endpoint})
    return {"status": "success", "unsubscribed": True}

@router.get("")
async def get_notifications(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).limit(50)
    items = []
    unread_count = 0
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        if not doc.get("read"):
            unread_count += 1
        items.append(doc)
    return {"notifications": items, "unread_count": unread_count}

@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    return {"status": "success"}

@router.put("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    db = get_database()
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "success"}

@router.post("/snooze")
async def snooze_reminders(data: SnoozePayload, user: dict = Depends(get_current_user)):
    db = get_database()
    snooze_until = datetime.now(timezone.utc) + timedelta(hours=data.hours)
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"settings.snooze_until": snooze_until.isoformat()}}
    )
    return {"status": "success", "snooze_until": snooze_until.isoformat()}

