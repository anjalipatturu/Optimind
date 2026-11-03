import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from app.core.database import get_database
from app.services.llm.factory import get_llm_provider
from app.services.optimizer.strategies import STRATEGIES

logger = logging.getLogger(__name__)

async def run_self_reflection_job() -> Dict[str, Any]:
    """
    Analyzes recent rejected optimizations across users,
    finds the lowest-performing strategy, and proposes a candidate template evolution.
    """
    db = get_database()
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    
    # 1. Find recent rejected optimizations
    rejected_cursor = db.optimizations.find({
        "outcome": "rejected",
        "created_at": {"$gte": cutoff}
    })
    rejected_opts = await rejected_cursor.to_list(length=100)
    
    if not rejected_opts:
        logger.info("Self-reflection: No rejected optimizations in the last 7 days.")
        return {"status": "skipped", "message": "No rejected optimizations to reflect on."}

    # Count strategy frequency in rejected cases
    strategy_rejections: Dict[str, int] = {}
    for opt in rejected_opts:
        for s in opt.get("strategies", []):
            strategy_rejections[s] = strategy_rejections.get(s, 0) + 1

    if not strategy_rejections:
        return {"status": "skipped", "message": "No strategies linked to rejections."}

    weakest_strategy = max(strategy_rejections, key=strategy_rejections.get)
    strat_meta = STRATEGIES.get(weakest_strategy, {})

    # 2. Ask LLM to propose candidate enhancement
    llm = get_llm_provider()
    prompt = f"""You are an expert AI system architect reflecting on strategy performance.
Strategy '{weakest_strategy}' ({strat_meta.get('name')}) had {strategy_rejections[weakest_strategy]} user rejections this week.
Current instruction:
\"{strat_meta.get('instruction')}\"

Sample rejected original prompt:
\"{rejected_opts[0].get('original')}\"

Propose an improved version of this strategy instruction to make it less intrusive and more effective.
Output a concise 2-3 sentence evolved instruction."""

    try:
        new_instruction = await llm.generate(prompt=prompt, temperature=0.5, max_tokens=300)
        new_version_doc = {
            "strategy": weakest_strategy,
            "version": datetime.now(timezone.utc).strftime("v%Y%m%d%H%M"),
            "old_instruction": strat_meta.get("instruction"),
            "new_instruction": new_instruction.strip(),
            "status": "candidate",
            "rejections_analyzed": strategy_rejections[weakest_strategy],
            "created_at": datetime.now(timezone.utc)
        }
        await db.strategy_versions.insert_one(new_version_doc)
        logger.info("Self-reflection: Generated candidate strategy version for %s", weakest_strategy)
        return {"status": "success", "strategy": weakest_strategy, "candidate": new_instruction.strip()}
    except Exception as e:
        logger.error("Self-reflection error: %s", e)
        return {"status": "error", "error": str(e)}

