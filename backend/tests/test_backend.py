import pytest
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from app.services.streak import get_user_local_date
from app.services.scoring import calculate_prompt_score
from app.services.optimizer.classifier import classify_task, detect_language
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.services.optimizer.bandit import ThompsonSamplingBandit
from app.services.optimizer.engine import build_slider_guidance

def test_password_hashing():
    pwd = "SecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_tokens():
    user_id = "user_123456"
    token = create_access_token(user_id)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["type"] == "access"

def test_prompt_scoring():
    # Weak prompt
    weak_res = calculate_prompt_score("make something good")
    assert weak_res["score"] < 40
    assert len(weak_res["tips"]) > 0
    assert any(a["type"] == "vague_term" for a in weak_res["autopsy_items"])

    # High quality prompt
    strong_prompt = (
        "Act as a Senior Database Administrator. Analyze the PostgreSQL query below for full table scans. "
        "Format your answer as a Markdown table comparing index strategies. "
        "Do not include introductory pleasantries or deprecations."
    )
    strong_res = calculate_prompt_score(strong_prompt)
    assert strong_res["score"] >= 75
    assert strong_res["breakdown"]["output_format"] > 5
    assert strong_res["breakdown"]["constraints"] > 5

def test_task_classification():
    code_res = classify_task("How do I fix this async MongoDB connection pool in Python FastAPI?")
    assert code_res["task_type"] == "coding"
    assert code_res["language"] == "en"

    math_res = classify_task("Calculate the derivative and integral of this formula.")
    assert math_res["task_type"] == "math"

    spanish_text = "Como puedo traducir este texto al espanol con buena gramatica?"
    assert detect_language(spanish_text) == "es"

def test_timezone_aware_streak_date():
    # 2026-11-03 23:30 UTC -> Next calendar day in Tokyo (+9 hours)
    utc_dt = datetime(2026, 11, 3, 23, 30, tzinfo=timezone.utc)
    tokyo_date = get_user_local_date("Asia/Tokyo", utc_dt)
    ny_date = get_user_local_date("America/New_York", utc_dt)
    
    assert tokyo_date == date(2026, 11, 4)
    assert ny_date == date(2026, 11, 3)

def test_slider_guidance():
    formal_detailed = build_slider_guidance(tone=80, detail=90, expertise=80)
    assert "formal" in formal_detailed
    assert "in-depth" in formal_detailed
    assert "expert" in formal_detailed

    casual_short = build_slider_guidance(tone=20, detail=20, expertise=20)
    assert "casual" in casual_short
    assert "succinct" in casual_short
    assert "beginner" in casual_short

