import random
from typing import Dict, Any, List
from app.services.optimizer.engine import optimize_prompt
from app.services.optimizer.strategies import STRATEGIES

async def generate_ab_optimizations(
    user_id: str,
    prompt: str,
    mode: str = "Balanced"
) -> Dict[str, Any]:
    """
    Generates two distinct optimized variations using two different sets of strategies.
    Variant A uses the top bandit strategies.
    Variant B forces a different exploratory combination of strategies.
    """
    # Variant A
    variant_a = await optimize_prompt(
        user_id=user_id,
        original_prompt=prompt,
        mode=mode
    )

    # Variant B: Select different strategies from remaining set
    all_strats = list(STRATEGIES.keys())
    used_a = set(variant_a["strategies"])
    remaining = [s for s in all_strats if s not in used_a]
    if len(remaining) < 2:
        remaining = all_strats

    forced_b = random.sample(remaining, min(3, len(remaining)))

    variant_b = await optimize_prompt(
        user_id=user_id,
        original_prompt=prompt,
        mode="Detailed" if mode == "Balanced" else "Balanced",
        forced_strategies=forced_b
    )

    return {
        "variant_a": variant_a,
        "variant_b": variant_b
    }

