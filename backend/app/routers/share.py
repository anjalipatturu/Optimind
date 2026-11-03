from fastapi import APIRouter, HTTPException
from app.core.database import get_database

router = APIRouter(prefix="/shared", tags=["share"])

@router.get("/{token}")
async def get_shared_chat(token: str):
    db = get_database()
    chat = await db.chats.find_one({"shared_token": token})
    if not chat:
        raise HTTPException(status_code=404, detail="Shared conversation not found or expired")

    chat_id = str(chat["_id"])
    msg_cursor = db.messages.find({"chat_id": chat_id}).sort("created_at", 1)
    messages = []
    async for m in msg_cursor:
        m["id"] = str(m["_id"])
        m.pop("_id", None)
        messages.append(m)

    chat["id"] = chat_id
    chat.pop("_id", None)
    return {
        "chat": chat,
        "messages": messages
    }

