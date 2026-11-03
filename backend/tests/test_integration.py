import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import connect_to_mongo, close_mongo_connection, get_database
from app.utils.seed import seed_initial_data

@pytest.fixture(autouse=True)
async def setup_db():
    await connect_to_mongo()
    await seed_initial_data()
    yield
    await close_mongo_connection()

@pytest.mark.anyio
async def test_full_system_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Health check
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        # 2. Signup new user
        test_email = f"test_{int(pytest.importorskip('time').time())}@optimind.ai"
        signup_res = await ac.post("/api/v1/auth/signup", json={
            "name": "Integration Tester",
            "email": test_email,
            "password": "Password123!",
            "persona": "Developer",
            "language": "en",
            "timezone": "America/New_York"
        })
        assert signup_res.status_code == 200
        auth_data = signup_res.json()
        access_token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # 3. List templates (seeded system templates)
        templates_res = await ac.get("/api/v1/templates", headers=headers)
        assert templates_res.status_code == 200
        templates = templates_res.json()
        assert len(templates) >= 20

        # 4. Prompt optimization test
        opt_res = await ac.post("/api/v1/optimizer/optimize", headers=headers, json={
            "prompt": "Create an API for order processing",
            "mode": "Balanced",
            "tone_slider": 50,
            "detail_slider": 50,
            "expertise_slider": 50
        })
        assert opt_res.status_code == 200
        opt_data = opt_res.json()
        assert "optimization_id" in opt_data
        assert opt_data["score_after"] >= opt_data["score_before"]
        assert len(opt_data["strategies"]) > 0

        # 5. Record user acceptance outcome (updates Thompson sampling bandit)
        outcome_res = await ac.post("/api/v1/optimizer/outcome", headers=headers, json={
            "optimization_id": opt_data["optimization_id"],
            "outcome": "accepted"
        })
        assert outcome_res.status_code == 200
        assert outcome_res.json()["status"] == "success"

        # 6. Check streak status
        streak_res = await ac.get("/api/v1/streaks/me", headers=headers)
        assert streak_res.status_code == 200
        streak_data = streak_res.json()
        assert "current" in streak_data
        assert "freezes" in streak_data

        # 7. Generate API Key
        key_res = await ac.post("/api/v1/features/api-keys", headers=headers, json={"name": "Test Key"})
        assert key_res.status_code == 200
        raw_key = key_res.json()["api_key"]

        # 8. Test Public API with the generated API Key
        pub_res = await ac.post("/api/v1/public/optimize", headers={"X-API-Key": raw_key}, json={
            "prompt": "Summarize this research paper"
        })
        assert pub_res.status_code == 200
        assert pub_res.json()["status"] == "success"
