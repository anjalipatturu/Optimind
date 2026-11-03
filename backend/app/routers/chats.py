import secrets
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse
from bson import ObjectId

from app.core.database import get_database
from app.schemas import ChatCreate, ChatUpdate
from app.routers.deps import get_current_user
from app.services.export import export_chat_as_markdown, export_chat_as_docx, export_chat_as_pdf

router = APIRouter(prefix="/chats", tags=["chats"])

@router.get("")
async def list_chats(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.chats.find({"user_id": user["id"]}).sort("updated_at", -1)
    chats = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        chats.append(doc)
    return chats

@router.post("")
async def create_chat(data: ChatCreate, user: dict = Depends(get_current_user)):
    db = get_database()
    doc = {
        "user_id": user["id"],
        "title": data.title or "New Chat",
        "pinned": False,
        "folder_id": data.folder_id,
        "model": data.model or "gemini-1.5-flash",
        "is_temporary": data.is_temporary,
        "shared_token": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    res = await db.chats.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

@router.get("/search")
async def search_chats(q: str = Query(..., min_length=1), user: dict = Depends(get_current_user)):
    db = get_database()
    # Search chat titles
    title_matches = await db.chats.find({
        "user_id": user["id"],
        "title": {"$regex": q, "$options": "i"}
    }).to_list(length=20)

    # Search message content
    msg_matches = await db.messages.find({
        "user_id": user["id"],
        "$text": {"$search": q}
    }).to_list(length=30)
    
    chat_ids = set([str(c["_id"]) for c in title_matches] + [m["chat_id"] for m in msg_matches])
    
    matching_chats = []
    for c_id in chat_ids:
        try:
            c = await db.chats.find_one({"_id": ObjectId(c_id)})
            if c:
                c["id"] = str(c["_id"])
                c.pop("_id", None)
                matching_chats.append(c)
        except Exception:
            pass

    return matching_chats

@router.get("/{chat_id}")
async def get_chat(chat_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat["id"] = str(chat["_id"])
    chat.pop("_id", None)
    return chat

@router.put("/{chat_id}")
async def update_chat(chat_id: str, data: ChatUpdate, user: dict = Depends(get_current_user)):
    db = get_database()
    updates = {"updated_at": datetime.now(timezone.utc)}
    if data.title is not None:
        updates["title"] = data.title
    if data.pinned is not None:
        updates["pinned"] = data.pinned
    if data.folder_id is not None:
        updates["folder_id"] = data.folder_id

    res = await db.chats.find_one_and_update(
        {"_id": ObjectId(chat_id), "user_id": user["id"]},
        {"$set": updates},
        return_document=True
    )
    if not res:
        raise HTTPException(status_code=404, detail="Chat not found")
    res["id"] = str(res["_id"])
    res.pop("_id", None)
    return res

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    res = await db.chats.delete_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    # Clean up messages and attachments
    await db.messages.delete_many({"chat_id": chat_id})
    return {"status": "success", "message": "Chat deleted"}

@router.post("/{chat_id}/pin")
async def toggle_pin(chat_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    new_pinned = not chat.get("pinned", False)
    await db.chats.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"pinned": new_pinned, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"status": "success", "pinned": new_pinned}

@router.post("/{chat_id}/share")
async def share_chat(chat_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    token = secrets.token_urlsafe(16)
    await db.chats.update_one(
        {"_id": ObjectId(chat_id), "user_id": user["id"]},
        {"$set": {"shared_token": token, "shared_at": datetime.now(timezone.utc)}}
    )
    return {"status": "success", "shared_token": token, "share_url": f"/share/{token}"}

@router.get("/{chat_id}/export")
async def export_chat(
    chat_id: str,
    format: str = Query("md", pattern="^(md|pdf|docx)$"),
    user: dict = Depends(get_current_user)
):
    db = get_database()
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    msg_cursor = db.messages.find({"chat_id": chat_id}).sort("created_at", 1)
    messages = await msg_cursor.to_list(length=500)

    filename = f"chat_{chat_id[:8]}"
    if format == "md":
        content = export_chat_as_markdown(chat, messages)
        return PlainTextResponse(content, headers={"Content-Disposition": f'attachment; filename="{filename}.md"'})
    elif format == "docx":
        content_bytes = export_chat_as_docx(chat, messages)
        return Response(
            content=content_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}.docx"'}
        )
    else: # pdf
        content_bytes = export_chat_as_pdf(chat, messages)
        return Response(
            content=content_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'}
        )
