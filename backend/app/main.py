import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.scheduler import start_scheduler, shutdown_scheduler

# Import Routers
from app.routers.auth import router as auth_router
from app.routers.chats import router as chats_router
from app.routers.messages import router as messages_router
from app.routers.optimizer import router as optimizer_router
from app.routers.files import router as files_router
from app.routers.feedback import router as feedback_router
from app.routers.streaks import router as streaks_router
from app.routers.notifications import router as notifications_router
from app.routers.memory import router as memory_router
from app.routers.templates import router as templates_router
from app.routers.analytics import router as analytics_router
from app.routers.voice import router as voice_router
from app.routers.share import router as share_router
from app.routers.features import router as features_router
from app.routers.public_api import router as public_api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("optimind")

limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Optimind Backend...")
    await connect_to_mongo()
    start_scheduler()
    # Run seed check
    try:
        from app.utils.seed import seed_initial_data
        await seed_initial_data()
    except Exception as e:
        logger.warning("Seed warning: %s", e)
    yield
    logger.info("Shutting down Optimind Backend...")
    shutdown_scheduler()
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Self-Evolving Prompt Optimizer AI Chatbot Platform API",
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# SlowAPI Rate Limiting setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "llm_provider": settings.LLM_PROVIDER
    }

# Register all Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(chats_router, prefix=api_prefix)
app.include_router(messages_router, prefix=api_prefix)
app.include_router(optimizer_router, prefix=api_prefix)
app.include_router(files_router, prefix=api_prefix)
app.include_router(feedback_router, prefix=api_prefix)
app.include_router(streaks_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(memory_router, prefix=api_prefix)
app.include_router(templates_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(voice_router, prefix=api_prefix)
app.include_router(share_router, prefix=api_prefix)
app.include_router(features_router, prefix=api_prefix)
app.include_router(public_api_router, prefix=api_prefix)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

