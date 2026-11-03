from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user
from app.services.optimizer.strategies import STRATEGIES

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/evolution")
async def get_evolution_analytics(user: dict = Depends(get_current_user)):
    db = get_database()
    u_id = user["id"]

    # 1. Fetch user optimizations
    opts_cursor = db.optimizations.find({"user_id": u_id}).sort("created_at", 1)
    optimizations = await opts_cursor.to_list(length=500)

    total_optimizations = len(optimizations)
    accepted_count = sum(1 for o in optimizations if o.get("outcome") == "accepted")
    edited_count = sum(1 for o in optimizations if o.get("outcome") == "edited")
    rejected_count = sum(1 for o in optimizations if o.get("outcome") == "rejected")
    acceptance_rate = round(((accepted_count + edited_count) / total_optimizations * 100), 1) if total_optimizations > 0 else 0.0

    # 2. Score progression over time
    score_history = []
    total_score_before = 0
    total_score_after = 0
    for idx, o in enumerate(optimizations[-30:]): # Last 30 optimizations
        sb = o.get("score_before", 0)
        sa = o.get("score_after", 0)
        total_score_before += sb
        total_score_after += sa
        score_history.append({
            "index": idx + 1,
            "date": o["created_at"].strftime("%m/%d"),
            "score_before": sb,
            "score_after": sa,
            "delta": max(0, sa - sb),
            "task_type": o.get("task_type", "general_qa")
        })

    avg_score_before = round(total_score_before / total_optimizations, 1) if total_optimizations > 0 else 52.0
    avg_score_after = round(total_score_after / total_optimizations, 1) if total_optimizations > 0 else 84.0
    improvement_pct = round(((avg_score_after - avg_score_before) / max(1, avg_score_before)) * 100, 1) if total_optimizations > 0 else 61.5

    # 3. Strategy efficiency stats
    stats_cursor = db.strategy_stats.find({"$or": [{"scope": u_id}, {"scope": "global"}]})
    strat_stats = await stats_cursor.to_list(length=200)
    strategy_scores = []
    for s_id, s_meta in STRATEGIES.items():
        matching = [s for s in strat_stats if s.get("strategy") == s_id]
        total_a = sum(s.get("alpha", 1.0) for s in matching) or 1.0
        total_b = sum(s.get("beta", 1.0) for s in matching) or 1.0
        win_rate = round((total_a / (total_a + total_b)) * 100, 1)
        strategy_scores.append({
            "id": s_id,
            "name": s_meta["name"],
            "win_rate": win_rate,
            "uses": sum(s.get("uses", 0) for s in matching)
        })
    strategy_scores.sort(key=lambda x: x["win_rate"], reverse=True)

    # 4. Prompt DNA Profile (radar chart)
    # Average breakdown scores
    clarity_sum = sum(o.get("score_breakdown_after", {}).get("clarity", 16) for o in optimizations) or 18
    context_sum = sum(o.get("score_breakdown_after", {}).get("context", 15) for o in optimizations) or 17
    spec_sum = sum(o.get("score_breakdown_after", {}).get("specificity", 15) for o in optimizations) or 18
    format_sum = sum(o.get("score_breakdown_after", {}).get("output_format", 15) for o in optimizations) or 19
    constraints_sum = sum(o.get("score_breakdown_after", {}).get("constraints", 14) for o in optimizations) or 16
    count = max(1, total_optimizations)

    radar_data = [
        {"metric": "Clarity", "value": min(100, int((clarity_sum / count) * 5))},
        {"metric": "Context", "value": min(100, int((context_sum / count) * 5))},
        {"metric": "Specificity", "value": min(100, int((spec_sum / count) * 5))},
        {"metric": "Format", "value": min(100, int((format_sum / count) * 5))},
        {"metric": "Constraints", "value": min(100, int((constraints_sum / count) * 5))},
    ]

    # Personality Archetype
    if spec_sum >= clarity_sum and spec_sum >= format_sum:
        dna_title = "The Precise Architect"
        dna_tagline = "Your prompts demonstrate deep technical precision and concrete specification."
    elif format_sum >= context_sum:
        dna_title = "The Structured Strategist"
        dna_tagline = "You excel at demanding strict, clean output schemas and actionable layouts."
    else:
        dna_title = "The Visionary Explorer"
        dna_tagline = "You provide rich narrative grounding and broad contextual foundations."

    return {
        "total_optimizations": total_optimizations,
        "acceptance_rate": acceptance_rate,
        "accepted_count": accepted_count,
        "edited_count": edited_count,
        "rejected_count": rejected_count,
        "avg_score_before": avg_score_before,
        "avg_score_after": avg_score_after,
        "improvement_pct": improvement_pct,
        "score_history": score_history,
        "top_strategies": strategy_scores[:5],
        "all_strategies": strategy_scores,
        "radar_data": radar_data,
        "dna_profile": {
            "title": dna_title,
            "tagline": dna_tagline,
            "level": user.get("level", 1),
            "xp": user.get("xp", 0)
        }
    }

@router.get("/heatmap")
async def get_activity_heatmap(user: dict = Depends(get_current_user)):
    """Returns 365-day GitHub-style prompt activity heatmap."""
    db = get_database()
    cursor = db.daily_activity.find({"user_id": user["id"]}).sort("local_date", 1)
    items = []
    async for doc in cursor:
        items.append({
            "date": doc["local_date"],
            "count": doc.get("prompt_count", 0),
            "qualified": doc.get("qualified", False)
        })
    return items

