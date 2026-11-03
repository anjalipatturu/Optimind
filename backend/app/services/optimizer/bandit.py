import random
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.database import get_database
from app.services.optimizer.strategies import STRATEGIES, DEFAULT_TASK_STRATEGIES

class ThompsonSamplingBandit:
    def __init__(self, exploration_rate: float = 0.15):
        self.exploration_rate = exploration_rate

    async def get_strategy_stats(self, user_id: str, task_type: str) -> Dict[str, Dict[str, float]]:
        """
        Fetch (alpha, beta) parameters for all strategies for this task type.
        Combines user-level stats with global prior.
        """
        try:
            db = get_database()
            # Fetch global stats
            global_cursor = db.strategy_stats.find({"scope": "global", "task_type": task_type})
            global_map = {doc["strategy"]: doc for doc in await global_cursor.to_list(length=100)}
            
            # Fetch user stats
            user_cursor = db.strategy_stats.find({"scope": user_id, "task_type": task_type})
            user_map = {doc["strategy"]: doc for doc in await user_cursor.to_list(length=100)}
        except Exception:
            global_map = {}
            user_map = {}

        combined: Dict[str, Dict[str, float]] = {}
        for strat_id in STRATEGIES.keys():
            g_doc = global_map.get(strat_id, {})
            u_doc = user_map.get(strat_id, {})

            # Global prior default is alpha=2.0, beta=1.0 for default task strategies, else 1.0, 1.0
            is_default = strat_id in DEFAULT_TASK_STRATEGIES.get(task_type, [])
            default_alpha = 3.0 if is_default else 1.5
            default_beta = 1.0

            g_alpha = g_doc.get("alpha", default_alpha)
            g_beta = g_doc.get("beta", default_beta)

            u_alpha = u_doc.get("alpha", 0.0)
            u_beta = u_doc.get("beta", 0.0)

            # Blended alpha and beta (user experience weighted over global prior)
            final_alpha = g_alpha + u_alpha
            final_beta = g_beta + u_beta

            combined[strat_id] = {
                "alpha": final_alpha,
                "beta": final_beta,
                "uses": g_doc.get("uses", 0) + u_doc.get("uses", 0)
            }

        return combined

    async def select_strategies(
        self,
        user_id: str,
        task_type: str,
        k: int = 3,
        forced_strategies: Optional[List[str]] = None
    ) -> List[str]:
        """
        Sample from Beta(alpha, beta) for each strategy arm and pick top k arms.
        With probability epsilon, explore an unrepresented strategy.
        """
        if forced_strategies:
            return forced_strategies[:k]

        stats = await self.get_strategy_stats(user_id, task_type)
        samples: Dict[str, float] = {}

        for strat_id, stat in stats.items():
            alpha = max(0.1, stat["alpha"])
            beta = max(0.1, stat["beta"])
            # Sample from Beta distribution
            sample_val = np.random.beta(alpha, beta)
            samples[strat_id] = float(sample_val)

        # Sort by sampled reward probability
        sorted_strats = sorted(samples.keys(), key=lambda s: samples[s], reverse=True)

        # Exploration epsilon-greedy check
        if random.random() < self.exploration_rate:
            all_strats = list(STRATEGIES.keys())
            explore_choice = random.choice(all_strats)
            if explore_choice not in sorted_strats[:k]:
                selected = sorted_strats[: k - 1] + [explore_choice]
                return selected

        return sorted_strats[:k]

    async def update_reward(
        self,
        user_id: str,
        task_type: str,
        strategies: List[str],
        reward: float
    ):
        """
        Update the Bandit with the reward signal (-1.0 to +1.0).
        Positive reward increments alpha, negative reward increments beta.
        Updates both user-level scope and global scope.
        """
        db = get_database()
        now = datetime.now(timezone.utc)

        # Positive reward pushes alpha, negative reward pushes beta
        alpha_delta = max(0.0, reward)
        beta_delta = max(0.0, -reward)

        for strat_id in strategies:
            for scope in [user_id, "global"]:
                # If reward is 0, give minimal increment so trial is recorded
                a_inc = alpha_delta if (alpha_delta > 0 or beta_delta > 0) else 0.1
                b_inc = beta_delta

                await db.strategy_stats.update_one(
                    {"scope": scope, "task_type": task_type, "strategy": strat_id},
                    {
                        "$inc": {"alpha": a_inc, "beta": b_inc, "uses": 1},
                        "$set": {"updated_at": now}
                    },
                    upsert=True
                )

bandit_instance = ThompsonSamplingBandit()

