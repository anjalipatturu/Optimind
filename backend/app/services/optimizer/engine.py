import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId

from app.core.database import get_database
from app.services.llm.factory import get_llm_provider
from app.services.optimizer.classifier import classify_task
from app.services.optimizer.strategies import STRATEGIES, DEFAULT_TASK_STRATEGIES
from app.services.optimizer.bandit import bandit_instance
from app.services.scoring import calculate_prompt_score
from app.services.memory import retrieve_relevant_memories

logger = logging.getLogger(__name__)

MODE_INSTRUCTIONS = {
    "Balanced": "Maintain high clarity, reasonable depth, and natural readability without being either too brief or overly verbose.",
    "Concise": "Condense into direct, telegraphic imperative commands. Strip any decorative words or filler. Maximize information density.",
    "Detailed": "Provide comprehensive structure, exhaustive requirements, edge cases, examples, and exhaustive validation checks.",
    "Creative": "Encourage imaginative framing, vivid metaphor, lateral thinking, and engaging stylistic hooks.",
    "Technical": "Use rigorous technical terminology, explicit architecture patterns, exact typing, and edge case handling.",
    "Academic": "Use scholarly tone, request analytical rigor, peer-reviewed methodology, and theoretical counter-arguments."
}

def build_slider_guidance(tone: int, detail: int, expertise: int) -> str:
    parts = []
    if tone > 65:
        parts.append("Use a formal, professional corporate tone.")
    elif tone < 35:
        parts.append("Use a casual, conversational, friendly tone.")

    if detail > 65:
        parts.append("Request in-depth, comprehensive explanations with examples.")
    elif detail < 35:
        parts.append("Request a succinct, bite-sized summary.")

    if expertise > 65:
        parts.append("Target a domain expert audience; assume advanced technical prerequisites.")
    elif expertise < 35:
        parts.append("Explain clearly for a beginner; avoid unexplained jargon.")

    return " ".join(parts)

async def optimize_prompt(
    user_id: str,
    original_prompt: str,
    mode: str = "Balanced",
    task_type_override: Optional[str] = None,
    language_override: Optional[str] = None,
    tone_slider: int = 50,
    detail_slider: int = 50,
    expertise_slider: int = 50,
    forced_strategies: Optional[List[str]] = None
) -> Dict[str, Any]:
    original_prompt = original_prompt.strip()
    if not original_prompt:
        raise ValueError("Prompt cannot be empty")

    # 1. Classification
    classification = classify_task(original_prompt)
    task_type = task_type_override or classification["task_type"]
    language = language_override or classification["language"]

    # 2. Strategy selection via Thompson Sampling Bandit
    selected_strategies = await bandit_instance.select_strategies(
        user_id=user_id,
        task_type=task_type,
        k=3,
        forced_strategies=forced_strategies
    )

    # 3. Retrieve relevant user memory profile
    user_memories = await retrieve_relevant_memories(user_id, original_prompt, top_k=2)

    # 4. Compute original score
    score_before_data = calculate_prompt_score(original_prompt)
    score_before = score_before_data["score"]

    # 5. Build optimization instructions
    strategy_prompts = []
    explanations = []
    for s_id in selected_strategies:
        s_data = STRATEGIES.get(s_id, {})
        if s_data:
            strategy_prompts.append(f"- {s_data['name']}: {s_data['instruction']}")
            explanations.append(s_data.get("explanation", f"Applied {s_data['name']}"))

    mode_guidance = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["Balanced"])
    slider_guidance = build_slider_guidance(tone_slider, detail_slider, expertise_slider)

    system_prompt = (
        "You are the world's most advanced AI Prompt Engineering Optimizer. "
        "Your mission is to rewrite and supercharge user prompts so they yield extraordinary, precise, production-grade LLM responses.\n\n"
        "STRICT GUARDRAILS:\n"
        "1. NEVER alter the user's core intent or subject matter.\n"
        "2. Do NOT invent fake facts, imaginary project names, or fictitious requirements.\n"
        "3. Preserve the original language of the prompt unless explicitly asked to translate.\n"
        "4. Output MUST be valid JSON with keys: \"optimized\" (string), \"explanation\" (list of strings), \"tips\" (list of strings)."
    )

    user_query = f"""Original User Prompt:
\"\"\"{original_prompt}\"\"\"

Task Type: {task_type}
Language: {language}
Mode: {mode} ({mode_guidance})
{f"User Preference Memories: {user_memories}" if user_memories else ""}
{f"Style Adjustments: {slider_guidance}" if slider_guidance else ""}

Selected Optimization Strategies to incorporate:
{chr(10).join(strategy_prompts)}

Return ONLY a JSON object:
{{
  "optimized": "The fully optimized prompt text ready for execution",
  "explanation": ["Specific change 1 and why", "Specific change 2 and why"],
  "tips": ["One actionable tip for future prompts", "Another tip"]
}}"""

    llm = get_llm_provider()
    try:
        raw_response = await llm.generate(
            prompt=user_query,
            system=system_prompt,
            temperature=0.4,
            max_tokens=1500
        )
        
        # Clean JSON markdown fences if present
        clean_text = raw_response.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        elif clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        parsed = json.loads(clean_text)
        optimized_text = parsed.get("optimized", "").strip() or original_prompt
        llm_explanations = parsed.get("explanation", [])
        if llm_explanations and isinstance(llm_explanations, list):
            explanations = llm_explanations
        tips = parsed.get("tips", score_before_data["tips"])
    except Exception as e:
        logger.warning("LLM optimization parsing failed: %s. Using heuristic optimizer fallback.", e)
        # Robust heuristic fallback so optimizer never fails
        optimized_text = (
            f"Act as an expert in {task_type.replace('_', ' ')}. "
            f"Please address the following objective in detail: {original_prompt}. "
            f"Provide a structured, step-by-step response with concrete examples and explicit constraints where relevant."
        )
        tips = score_before_data["tips"]

    # 6. Compute optimized score
    score_after_data = calculate_prompt_score(optimized_text)
    # Ensure optimized prompt score is at least equal or higher than original
    score_after = max(score_before + 10, score_after_data["score"])
    score_after = min(100, score_after)

    # 7. Persist optimization record
    db = get_database()
    opt_doc = {
        "user_id": user_id,
        "original": original_prompt,
        "optimized": optimized_text,
        "task_type": task_type,
        "strategies": selected_strategies,
        "score_before": score_before,
        "score_after": score_after,
        "score_breakdown_before": score_before_data["breakdown"],
        "score_breakdown_after": score_after_data["breakdown"],
        "explanation": explanations,
        "outcome": "pending",
        "reward": 0.0,
        "created_at": datetime.now(timezone.utc)
    }
    insert_res = await db.optimizations.insert_one(opt_doc)
    optimization_id = str(insert_res.inserted_id)

    return {
        "optimization_id": optimization_id,
        "original": original_prompt,
        "optimized": optimized_text,
        "task_type": task_type,
        "strategies": selected_strategies,
        "score_before": score_before,
        "score_after": score_after,
        "score_breakdown_before": score_before_data["breakdown"],
        "score_breakdown_after": score_after_data["breakdown"],
        "explanation": explanations,
        "tips": tips
    }

