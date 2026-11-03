import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from bson import ObjectId
from app.core.database import get_database
from app.services.optimizer.bandit import bandit_instance

logger = logging.getLogger(__name__)

async def process_optimizer_outcome(
    optimization_id: str,
    outcome: str, # "accepted", "edited", "rejected"
    user_id: str,
    edited_prompt: Optional[str] = None
) -> Dict[str, Any]:
    db = get_database()
    opt = await db.optimizations.find_one({"_id": ObjectId(optimization_id), "user_id": user_id})
    if not opt:
        return {"status": "error", "message": "Optimization record not found"}

    # Base reward calculation
    if outcome == "accepted":
        base_reward = 1.0
    elif outcome == "edited":
        base_reward = 0.4
    elif outcome == "rejected":
        base_reward = -0.8
    else:
        base_reward = 0.0

    # Score improvement delta bonus
    score_delta = max(0, opt.get("score_after", 0) - opt.get("score_before", 0))
    delta_bonus = (score_delta / 100.0) * 0.5
    total_reward = round(base_reward + delta_bonus, 3)

    # Update optimization document
    await db.optimizations.update_one(
        {"_id": ObjectId(optimization_id)},
        {
            "$set": {
                "outcome": outcome,
                "reward": total_reward,
                "edited_prompt": edited_prompt,
                "resolved_at": datetime.now(timezone.utc)
            }
        }
    )

    # Award XP to user if accepted or edited
    if outcome in ["accepted", "edited"]:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"xp": 15 if outcome == "accepted" else 10}}
        )

    # Update the Bandit arm stats
    task_type = opt.get("task_type", "general_qa")
    strategies = opt.get("strategies", [])
    await bandit_instance.update_reward(
        user_id=user_id,
        task_type=task_type,
        strategies=strategies,
        reward=total_reward
    )

    return {
        "status": "success",
        "outcome": outcome,
        "reward": total_reward,
        "task_type": task_type,
        "strategies": strategies
    }

async def process_answer_feedback(
    message_id: str,
    user_id: str,
    rating: int, # 1 for up, -1 for down
    reasons: Optional[list] = None,
    comment: Optional[str] = None
) -> Dict[str, Any]:
    db = get_database()
    
    # Record feedback
    feedback_doc = {
        "user_id": user_id,
        "message_id": message_id,
        "type": "answer",
        "rating": rating,
        "reasons": reasons or [],
        "comment": comment,
        "created_at": datetime.now(timezone.utc)
    }
    await db.feedback.insert_one(feedback_doc)

    # Check if the message had an associated optimization
    msg = await db.messages.find_one({"_id": ObjectId(message_id)})
    if msg and msg.get("optimization_id"):
        opt = await db.optimizations.find_one({"_id": ObjectId(msg["optimization_id"])})
        if opt:
            reward_delta = 0.5 if rating > 0 else -0.6
            task_type = opt.get("task_type", "general_qa")
            strategies = opt.get("strategies", [])
            await bandit_instance.update_reward(
                user_id=user_id,
                task_type=task_type,
                strategies=strategies,
                reward=reward_delta
            )
            # Update cumulative reward on optimization
            await db.optimizations.update_one(
                {"_id": opt["_id"]},
                {"$inc": {"reward": reward_delta}}
            )

    return {"status": "success", "recorded": True}

