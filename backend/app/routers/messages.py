import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId

from app.core.database import get_database
from app.schemas import MessageCreate, MessageUpdate
from app.routers.deps import get_current_user
from app.services.llm.factory import get_llm_provider
from app.services.streak import record_user_prompt_activity
from app.services.rag import retrieve_rag_context, format_rag_prompt
from app.services.optimizer.classifier import detect_language

logger = logging.getLogger(__name__)

router = APIRouter(tags=["messages"])

@router.get("/chats/{chat_id}/messages")
async def get_chat_messages(
    chat_id: str,
    limit: int = Query(100, le=500),
    user: dict = Depends(get_current_user)
):
    db = get_database()
    # Verify chat ownership
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    cursor = db.messages.find({"chat_id": chat_id}).sort("created_at", 1).limit(limit)
    messages = []
    async for m in cursor:
        m["id"] = str(m["_id"])
        m.pop("_id", None)
        messages.append(m)
    return messages

@router.post("/chats/{chat_id}/messages")
async def send_message(
    chat_id: str,
    data: MessageCreate,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    chat = await db.chats.find_one({"_id": ObjectId(chat_id), "user_id": user["id"]})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    prompt_text = data.content.strip()
    if not prompt_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_lang = detect_language(prompt_text)

    # 1. Record streak activity (timezone-aware)
    streak_result = await record_user_prompt_activity(user["id"])

    # 2. Persist user message
    user_msg_doc = {
        "chat_id": chat_id,
        "user_id": user["id"],
        "role": "user",
        "content": prompt_text,
        "language": user_lang,
        "attachments": [a.model_dump() for a in data.attachments] if data.attachments else [],
        "tokens": len(prompt_text.split()) * 2,
        "optimization_id": data.optimization_id,
        "created_at": datetime.now(timezone.utc)
    }
    user_msg_res = await db.messages.insert_one(user_msg_doc)
    user_msg_id = str(user_msg_res.inserted_id)

    # 3. Check if chat title needs auto-generation (first message)
    is_first_message = (await db.messages.count_documents({"chat_id": chat_id})) == 1
    if is_first_message and chat.get("title") in ["New Chat", "New Conversation"]:
        # Auto-generate title
        auto_title = prompt_text[:35] + ("..." if len(prompt_text) > 35 else "")
        await db.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"title": auto_title}}
        )

    # 4. RAG context retrieval if attachments exist
    attachment_ids = [a.id for a in data.attachments] if data.attachments else None
    rag_chunks = await retrieve_rag_context(user["id"], prompt_text, attachment_ids=attachment_ids, top_k=3)
    final_prompt = format_rag_prompt(prompt_text, rag_chunks)

    # 5. Build system prompt
    persona = user.get("persona", "General")
    system_prompt = f"You are Optimind, a self-evolving AI assistant. The user's chosen persona is '{persona}'. Reply helpfully in {user_lang}."

    llm = get_llm_provider()
    model = data.model or chat.get("model", "gemini-1.5-flash")

    # 6. Stream SSE response
    async def sse_event_stream() -> AsyncGenerator[str, None]:
        full_assistant_reply = []
        
        # Send initial user_msg_id and streak metadata
        init_event = {
            "type": "init",
            "user_message_id": user_msg_id,
            "streak": streak_result
        }
        yield f"data: {json.dumps(init_event)}\n\n"

        if rag_chunks:
            citations_event = {
                "type": "citations",
                "citations": [{"filename": c["filename"], "page": c["page"]} for c in rag_chunks]
            }
            yield f"data: {json.dumps(citations_event)}\n\n"

        try:
            async for token in llm.generate_stream(prompt=final_prompt, system=system_prompt, model=model):
                full_assistant_reply.append(token)
                yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"
        except Exception as e:
            logger.error("Streaming error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        # Persist assistant reply
        full_text = "".join(full_assistant_reply)
        asst_doc = {
            "chat_id": chat_id,
            "user_id": user["id"],
            "role": "assistant",
            "content": full_text,
            "language": user_lang,
            "attachments": [],
            "tokens": len(full_text.split()) * 2,
            "optimization_id": data.optimization_id,
            "created_at": datetime.now(timezone.utc)
        }
        asst_res = await db.messages.insert_one(asst_doc)
        asst_msg_id = str(asst_res.inserted_id)

        # Update chat updated_at
        await db.chats.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"updated_at": datetime.now(timezone.utc)}}
        )

        done_event = {
            "type": "done",
            "message_id": asst_msg_id,
            "full_content": full_text
        }
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")

@router.post("/messages/{message_id}/regenerate")
async def regenerate_message(message_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    asst_msg = await db.messages.find_one({"_id": ObjectId(message_id), "user_id": user["id"]})
    if not asst_msg or asst_msg.get("role") != "assistant":
        raise HTTPException(status_code=404, detail="Assistant message not found")

    chat_id = asst_msg["chat_id"]
    # Find preceding user message
    user_msg = await db.messages.find_one({
        "chat_id": chat_id,
        "created_at": {"$lt": asst_msg["created_at"]},
        "role": "user"
    }, sort=[("created_at", -1)])

    if not user_msg:
        raise HTTPException(status_code=400, detail="Cannot find preceding user message")

    llm = get_llm_provider()
    prompt = user_msg["content"]

    async def sse_event_stream() -> AsyncGenerator[str, None]:
        full_tokens = []
        async for token in llm.generate_stream(prompt=prompt):
            full_tokens.append(token)
            yield f"data: {json.dumps({'type': 'token', 'token': token})}\n\n"

        full_text = "".join(full_tokens)
        await db.messages.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"content": full_text, "updated_at": datetime.now(timezone.utc)}}
        )
        yield f"data: {json.dumps({'type': 'done', 'message_id': message_id, 'full_content': full_text})}\n\n"

    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")

@router.put("/messages/{message_id}")
async def edit_message(message_id: str, data: MessageUpdate, user: dict = Depends(get_current_user)):
    db = get_database()
    msg = await db.messages.find_one({"_id": ObjectId(message_id), "user_id": user["id"]})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    await db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"content": data.content, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"status": "success", "message_id": message_id, "content": data.content}

