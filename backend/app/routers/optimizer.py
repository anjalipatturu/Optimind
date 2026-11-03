from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.schemas import (
    OptimizeRequest, OptimizeResponse, ScoreRequest, ScoreResponse,
    OutcomeRequest, ABTestResponse
)
from app.routers.deps import get_current_user
from app.services.optimizer.engine import optimize_prompt
from app.services.scoring import calculate_prompt_score
from app.services.optimizer.reward import process_optimizer_outcome
from app.services.optimizer.ab import generate_ab_optimizations
from app.services.optimizer.strategies import STRATEGIES
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/optimizer", tags=["optimizer"])

class MagicRewriteRequest(BaseModel):
    text: str
    action: str # "improve", "shorten", "expand", "simplify", "fix_grammar", "translate"
    target_language: Optional[str] = None

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(data: OptimizeRequest, user: dict = Depends(get_current_user)):
    try:
        res = await optimize_prompt(
            user_id=user["id"],
            original_prompt=data.prompt,
            mode=data.mode or "Balanced",
            task_type_override=data.task_type,
            language_override=data.language,
            tone_slider=data.tone_slider or 50,
            detail_slider=data.detail_slider or 50,
            expertise_slider=data.expertise_slider or 50
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score", response_model=ScoreResponse)
async def score_prompt(data: ScoreRequest):
    """Fast heuristic scorer for live prompt coach (debounced 800ms) with zero LLM latency."""
    res = calculate_prompt_score(data.prompt)
    return {
        "score": res["score"],
        "breakdown": res["breakdown"],
        "tips": res["tips"]
    }

@router.post("/outcome")
async def record_outcome(data: OutcomeRequest, user: dict = Depends(get_current_user)):
    """Receives user decision: accepted, edited, rejected. Updates multi-armed bandit."""
    res = await process_optimizer_outcome(
        optimization_id=data.optimization_id,
        outcome=data.outcome,
        user_id=user["id"],
        edited_prompt=data.edited_prompt
    )
    return res

@router.post("/ab", response_model=ABTestResponse)
async def ab_test(data: OptimizeRequest, user: dict = Depends(get_current_user)):
    """Generates two distinct variations with different strategies for side-by-side comparison."""
    res = await generate_ab_optimizations(
        user_id=user["id"],
        prompt=data.prompt,
        mode=data.mode or "Balanced"
    )
    return res

@router.get("/strategies")
async def list_strategies():
    return list(STRATEGIES.values())

@router.get("/autopsy")
async def prompt_autopsy(prompt: str = Query(..., min_length=1)):
    """Prompt Autopsy: highlights weak parts inline with hover tooltips and fixes."""
    scored = calculate_prompt_score(prompt)
    return {
        "prompt": prompt,
        "score": scored["score"],
        "breakdown": scored["breakdown"],
        "autopsy_items": scored.get("autopsy_items", []),
        "tips": scored["tips"]
    }

@router.post("/rewrite")
async def magic_rewrite(data: MagicRewriteRequest, user: dict = Depends(get_current_user)):
    """Magic Rewrite on selection: Improve, Shorten, Expand, Simplify, Translate, Fix grammar."""
    actions = {
        "improve": "Improve clarity, flow, and vocabulary while keeping original meaning:",
        "shorten": "Make this more concise, punchy, and direct, cutting fluff:",
        "expand": "Expand this with more depth, context, and clear explanations:",
        "simplify": "Explain this in simple, everyday language that anyone can understand:",
        "fix_grammar": "Correct all grammar, punctuation, and phrasing errors:",
        "translate": f"Translate this text into {data.target_language or 'English'}:"
    }
    instruction = actions.get(data.action, "Improve this text:")
    llm = get_llm_provider()
    prompt = f"{instruction}\n\n\"{data.text}\"\n\nReturn ONLY the rewritten text."
    rewritten = await llm.generate(prompt=prompt, temperature=0.3, max_tokens=1000)
    return {
        "original": data.text,
        "action": data.action,
        "rewritten": rewritten.strip().strip('"')
    }

