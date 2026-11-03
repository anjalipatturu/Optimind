import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.services.optimizer.engine import optimize_prompt

router = APIRouter(prefix="/public", tags=["public-api"])

class PublicOptimizeRequest(BaseModel):
    prompt: str
    mode: Optional[str] = "Balanced"

@router.post("/optimize")
async def public_optimize(data: PublicOptimizeRequest, x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header required")

    key_hash = hashlib.sha256(x_api_key.encode("utf-8")).hexdigest()
    db = get_database()
    key_doc = await db.api_keys.find_one({"key_hash": key_hash})
    if not key_doc:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Increment requests count
    await db.api_keys.update_one(
        {"_id": key_doc["_id"]},
        {"$inc": {"requests_count": 1}, "$set": {"last_used_at": datetime.now(timezone.utc)}}
    )

    user_id = key_doc["user_id"]
    res = await optimize_prompt(
        user_id=user_id,
        original_prompt=data.prompt,
        mode=data.mode or "Balanced"
    )

    return {
        "status": "success",
        "optimization_id": res["optimization_id"],
        "original": res["original"],
        "optimized": res["optimized"],
        "score_before": res["score_before"],
        "score_after": res["score_after"],
        "explanation": res["explanation"]
    }

