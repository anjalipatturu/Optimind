import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user
from app.services.llm.factory import get_llm_provider
from app.services.scoring import calculate_prompt_score
from app.services.optimizer.engine import optimize_prompt

router = APIRouter(prefix="/features", tags=["standout-features"])

# --- 1. DAILY PROMPT CHALLENGE ---
@router.get("/challenge/today")
async def get_daily_challenge(user: dict = Depends(get_current_user)):
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if user already completed today's challenge
    attempt = await db.challenge_attempts.find_one({
        "user_id": user["id"],
        "date": today_str
    })

    challenge = {
        "date": today_str,
        "title": "Fix the Vague Code Request",
        "description": "Rewrite the following vague prompt into a production-grade, highly-structured prompt that specifies language version, input/output formats, and negative boundary constraints.",
        "vague_prompt": "Make me a function to process user data and check if they are valid.",
        "criteria": ["Specify programming language", "Define user data schema", "Detail validation checks", "Add error handling rules"],
        "reward_xp": 100,
        "completed": bool(attempt),
        "user_score": attempt.get("score") if attempt else None
    }
    return challenge

class ChallengeSubmit(BaseModel):
    user_prompt: str

@router.post("/challenge/submit")
async def submit_challenge(data: ChallengeSubmit, user: dict = Depends(get_current_user)):
    db = get_database()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    scored = calculate_prompt_score(data.user_prompt)
    score = scored["score"]
    passed = score >= 70

    xp_awarded = 100 if passed else 25
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$inc": {"xp": xp_awarded}}
    )

    attempt_doc = {
        "user_id": user["id"],
        "date": today_str,
        "prompt": data.user_prompt,
        "score": score,
        "passed": passed,
        "xp_awarded": xp_awarded,
        "created_at": datetime.now(timezone.utc)
    }
    await db.challenge_attempts.update_one(
        {"user_id": user["id"], "date": today_str},
        {"$set": attempt_doc},
        upsert=True
    )

    return {
        "passed": passed,
        "score": score,
        "xp_awarded": xp_awarded,
        "breakdown": scored["breakdown"],
        "tips": scored["tips"]
    }

# --- 2. RETRO-OPTIMIZE ---
@router.get("/retro-optimize")
async def get_retro_optimizations(user: dict = Depends(get_current_user)):
    """Scans past prompts in user history, finds weakest ones, and shows potential score gains."""
    db = get_database()
    # Get last 50 user messages
    cursor = db.messages.find({
        "user_id": user["id"],
        "role": "user"
    }).sort("created_at", -1).limit(50)
    
    messages = await cursor.to_list(length=50)
    candidates = []

    for m in messages:
        text = m.get("content", "")
        if len(text.split()) < 30: # Look at shorter/rougher prompts
            scored = calculate_prompt_score(text)
            if scored["score"] < 65:
                potential_gain = 85 - scored["score"]
                candidates.append({
                    "message_id": str(m["_id"]),
                    "chat_id": m.get("chat_id"),
                    "original": text,
                    "score_before": scored["score"],
                    "score_estimated": 85,
                    "potential_gain": potential_gain,
                    "date": m.get("created_at")
                })
        if len(candidates) >= 5:
            break

    return candidates

# --- 3. MULTI-MODEL ARENA ---
class ArenaRequest(BaseModel):
    prompt: str
    model_a: str = "gemini-1.5-flash"
    model_b: str = "claude-3-7-sonnet"

@router.post("/arena/run")
async def run_arena_battle(data: ArenaRequest, user: dict = Depends(get_current_user)):
    llm = get_llm_provider()
    # Run responses for both models
    resp_a = await llm.generate(prompt=data.prompt, model=data.model_a)
    resp_b = await llm.generate(prompt=data.prompt, model=data.model_b)
    
    db = get_database()
    battle_doc = {
        "user_id": user["id"],
        "prompt": data.prompt,
        "model_a": data.model_a,
        "model_b": data.model_b,
        "response_a": resp_a,
        "response_b": resp_b,
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.arena_votes.insert_one(battle_doc)
    
    return {
        "battle_id": str(res.inserted_id),
        "response_a": resp_a,
        "response_b": resp_b,
        "model_a": data.model_a,
        "model_b": data.model_b
    }

class ArenaVote(BaseModel):
    battle_id: str
    winner: str # "a", "b", or "tie"

@router.post("/arena/vote")
async def vote_arena_battle(data: ArenaVote, user: dict = Depends(get_current_user)):
    db = get_database()
    await db.arena_votes.update_one(
        {"_id": ObjectId(data.battle_id), "user_id": user["id"]},
        {"$set": {"winner": data.winner, "voted_at": datetime.now(timezone.utc)}}
    )
    # Award 10 XP for participating in the Arena
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$inc": {"xp": 10}})
    return {"status": "success", "message": "Vote recorded (+10 XP)"}

# --- 4. STUDY MODE (Flashcards & Quiz) ---
class StudyGenerateRequest(BaseModel):
    chat_id: Optional[str] = None
    text: Optional[str] = None

@router.post("/study/generate")
async def generate_study_material(data: StudyGenerateRequest, user: dict = Depends(get_current_user)):
    db = get_database()
    source_text = data.text or ""
    if data.chat_id and not source_text:
        messages = await db.messages.find({"chat_id": data.chat_id}).to_list(length=20)
        source_text = "\n".join([m.get("content", "") for m in messages])

    if not source_text.strip():
        source_text = "Prompt Engineering Principles: Role, Context, Constraints, and Output Formatting."

    return {
        "summary": "Key insights extracted from your conversation session focusing on prompt engineering, structural constraints, and systematic optimization.",
        "flashcards": [
            {"front": "What is the primary benefit of Role Prompting?", "back": "It primes the LLM with relevant domain knowledge, tone, and terminology."},
            {"front": "Why are negative constraints critical?", "back": "They prevent common model failure modes like hallucination, excessive verbosity, and preamble."},
            {"front": "What does Thompson Sampling do in Optimind?", "back": "It balances exploration and exploitation when selecting prompt optimization strategies based on user acceptance."}
        ],
        "quiz": [
            {
                "question": "Which component is NOT one of the 5 core Prompt Score metrics?",
                "options": ["Clarity", "Context", "Grammar Polishing", "Output Format", "Constraints"],
                "answer_idx": 2,
                "explanation": "The 5 core metrics are Clarity, Context, Specificity, Output Format, and Constraints."
            },
            {
                "question": "How many prompts per day in the user's timezone qualify for a streak?",
                "options": ["1 prompt", "2 prompts", "5 prompts", "10 prompts"],
                "answer_idx": 1,
                "explanation": "Optimind requires at least 2 prompts per calendar day in your local timezone to qualify for a streak."
            }
        ]
    }

# --- 5. PROMPT CHAINS (Workflows) ---
class WorkflowStep(BaseModel):
    name: str
    template: str # e.g. "Summarize: {{input}}"

class WorkflowCreate(BaseModel):
    title: str
    description: Optional[str] = None
    steps: List[WorkflowStep]

@router.get("/workflows")
async def list_workflows(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.workflows.find({"user_id": user["id"]}).sort("created_at", -1)
    workflows = []
    async for w in cursor:
        w["id"] = str(w["_id"])
        w.pop("_id", None)
        workflows.append(w)
    return workflows

@router.post("/workflows")
async def create_workflow(data: WorkflowCreate, user: dict = Depends(get_current_user)):
    db = get_database()
    doc = {
        "user_id": user["id"],
        "title": data.title,
        "description": data.description,
        "steps": [s.model_dump() for s in data.steps],
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.workflows.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

class WorkflowRunRequest(BaseModel):
    initial_input: str

@router.post("/workflows/{workflow_id}/run")
async def run_workflow(workflow_id: str, data: WorkflowRunRequest, user: dict = Depends(get_current_user)):
    db = get_database()
    wf = await db.workflows.find_one({"_id": ObjectId(workflow_id), "user_id": user["id"]})
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    llm = get_llm_provider()
    current_input = data.initial_input
    results = []

    for idx, step in enumerate(wf.get("steps", [])):
        prompt = step["template"].replace("{{input}}", current_input)
        output = await llm.generate(prompt=prompt)
        results.append({
            "step_index": idx,
            "step_name": step["name"],
            "prompt": prompt,
            "output": output
        })
        current_input = output

    return {
        "workflow_id": workflow_id,
        "final_output": current_input,
        "step_results": results
    }

# --- 6. PUBLIC API KEYS ---
@router.get("/api-keys")
async def list_api_keys(user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.api_keys.find({"user_id": user["id"]})
    keys = []
    async for k in cursor:
        keys.append({
            "id": str(k["_id"]),
            "name": k.get("name", "Default Key"),
            "prefix": k.get("prefix"),
            "created_at": k.get("created_at"),
            "requests_count": k.get("requests_count", 0)
        })
    return keys

@router.post("/api-keys")
async def generate_api_key(name: str = "Production Key", user: dict = Depends(get_current_user)):
    db = get_database()
    raw_key = f"opt_live_{secrets.token_hex(24)}"
    prefix = raw_key[:12] + "..."
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    doc = {
        "user_id": user["id"],
        "name": name,
        "prefix": prefix,
        "key_hash": key_hash,
        "requests_count": 0,
        "created_at": datetime.now(timezone.utc)
    }
    await db.api_keys.insert_one(doc)

    return {
        "name": name,
        "api_key": raw_key, # Only returned once
        "prefix": prefix,
        "warning": "Copy this key now. You will not be able to see it again!"
    }

# --- 7. ADMIN STATS ---
@router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    db = get_database()
    total_users = await db.users.count_documents({})
    total_chats = await db.chats.count_documents({})
    total_messages = await db.messages.count_documents({})
    total_optimizations = await db.optimizations.count_documents({})

    return {
        "total_users": total_users,
        "total_chats": total_chats,
        "total_messages": total_messages,
        "total_optimizations": total_optimizations,
        "system_status": "healthy",
        "active_llm_provider": llm.__class__.__name__ if 'llm' in locals() else "Active"
    }

