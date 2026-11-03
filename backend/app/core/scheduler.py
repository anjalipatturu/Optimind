import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.reminder import check_and_send_streak_reminders
from app.services.optimizer.reflection import run_self_reflection_job

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def start_scheduler():
    try:
        # Check streak reminders every 5 minutes
        scheduler.add_job(
            check_and_send_streak_reminders,
            "interval",
            minutes=5,
            id="streak_reminders_job",
            replace_existing=True
        )

        # Run self-reflection daily at 02:00 UTC
        scheduler.add_job(
            run_self_reflection_job,
            "cron",
            hour=2,
            minute=0,
            id="self_reflection_job",
            replace_existing=True
        )

        scheduler.start()
        logger.info("APScheduler background scheduler started.")
    except Exception as e:
        logger.error("Failed to start scheduler: %s", e)

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")

