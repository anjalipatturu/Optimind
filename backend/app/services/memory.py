import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from app.core.database import get_database
from app.services.llm.factory import get_llm_provider

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    a = np.array(v1, dtype=float)
    b = np.array(v2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

async def create_memory(user_id: str, text: str, category: str = "preference", source_message_id: Optional[str] = None) -> Dict[str, Any]:
    db = get_database()
    llm = get_llm_provider()
    
    embeddings = await llm.embed([text])
    embedding = embeddings[0] if embeddings else None

    doc = {
        "user_id": user_id,
        "text": text.strip(),
        "category": category,
        "embedding": embedding,
        "enabled": True,
        "source_message_id": source_message_id,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.memories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

async def get_user_memories(user_id: str, enabled_only: bool = False) -> List[Dict[str, Any]]:
    db = get_database()
    query: Dict[str, Any] = {"user_id": user_id}
    if enabled_only:
        query["enabled"] = True
    
    cursor = db.memories.find(query).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        results.append(doc)
    return results

async def update_memory(user_id: str, memory_id: str, text: Optional[str] = None, enabled: Optional[bool] = None) -> Optional[Dict[str, Any]]:
    db = get_database()
    updates: Dict[str, Any] = {}
    if text is not None:
        updates["text"] = text.strip()
        llm = get_llm_provider()
        embeddings = await llm.embed([text])
        if embeddings:
            updates["embedding"] = embeddings[0]
    if enabled is not None:
        updates["enabled"] = enabled

    if not updates:
        return None

    res = await db.memories.find_one_and_update(
        {"_id": ObjectId(memory_id), "user_id": user_id},
        {"$set": updates},
        return_document=True
    )
    if res:
        res["id"] = str(res["_id"])
        res.pop("_id", None)
        return res
    return None

async def delete_memory(user_id: str, memory_id: str) -> bool:
    db = get_database()
    res = await db.memories.delete_one({"_id": ObjectId(memory_id), "user_id": user_id})
    return res.deleted_count > 0

async def retrieve_relevant_memories(user_id: str, prompt: str, top_k: int = 3) -> List[str]:
    """Retrieve enabled user memories relevant to the prompt using vector similarity."""
    memories = await get_user_memories(user_id, enabled_only=True)
    if not memories:
        return []

    llm = get_llm_provider()
    prompt_embeddings = await llm.embed([prompt])
    if not prompt_embeddings:
        # Fallback to returning recent memories
        return [m["text"] for m in memories[:top_k]]

    p_vec = prompt_embeddings[0]
    scored = []
    for m in memories:
        if m.get("embedding"):
            sim = cosine_similarity(p_vec, m["embedding"])
            scored.append((sim, m["text"]))
        else:
            scored.append((0.0, m["text"]))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [text for sim, text in scored[:top_k]]

