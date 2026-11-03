from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user
from app.services.optimizer.reward import process_answer_feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackSubmit(BaseModel):
    message_id: Optional[str] = None
    optimization_id: Optional[str] = None
    type: str = "answer" # answer, optimizer, general_bug
    rating: Optional[int] = None # 1 or -1
    reasons: Optional[List[str]] = None
    comment: Optional[str] = None

@router.post("")
async def submit_feedback(data: FeedbackSubmit, user: dict = Depends(get_current_user)):
    if data.message_id and data.rating:
        res = await process_answer_feedback(
            message_id=data.message_id,
            user_id=user["id"],
            rating=data.rating,
            reasons=data.reasons,
            comment=data.comment
        )
        return res
    
    # General feedback
    db = get_database()
    doc = {
        "user_id": user["id"],
        "type": data.type,
        "rating": data.rating,
        "reasons": data.reasons or [],
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc)
    }
    await db.feedback.insert_one(doc)
    return {"status": "success", "recorded": True}

@router.get("/mine")
async def get_my_feedback(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.feedback.find({"user_id": user["id"]}).sort("created_at", -1).limit(50)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        items.append(doc)
    return items

