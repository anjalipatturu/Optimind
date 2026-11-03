import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Dict, Any, List
from app.core.database import get_database
from app.core.config import settings
from app.services.streak import get_user_local_date

logger = logging.getLogger(__name__)

async def check_and_send_streak_reminders():
    """
    Periodic job (runs every 5 minutes).
    Finds active users whose local time aligns with their reminder time
    and who haven't yet qualified for their streak today.
    """
    try:
        db = get_database()
    except Exception:
        return

    utc_now = datetime.now(timezone.utc)
    users_cursor = db.users.find({})

    async for user in users_cursor:
        user_id = str(user["_id"])
        user_tz_str = user.get("timezone", "UTC")
        settings_data = user.get("settings", {})
        
        # Check if notifications are enabled
        push_enabled = settings_data.get("notifications_push", True)
        email_enabled = settings_data.get("notifications_email", True)
        if not push_enabled and not email_enabled:
            continue

        # Check snooze
        snooze_until = settings_data.get("snooze_until")
        if snooze_until:
            try:
                snooze_dt = datetime.fromisoformat(snooze_until)
                if utc_now < snooze_dt:
                    continue
            except Exception:
                pass

        # Compute user's local time
        try:
            user_tz = ZoneInfo(user_tz_str)
        except Exception:
            user_tz = ZoneInfo("UTC")

        local_dt = utc_now.astimezone(user_tz)
        local_time_str = local_dt.strftime("%H:%M") # e.g. "19:00"
        local_date_str = local_dt.strftime("%Y-%m-%d")

        # Check if already qualified today
        activity = await db.daily_activity.find_one({"user_id": user_id, "local_date": local_date_str})
        prompt_count = activity.get("prompt_count", 0) if activity else 0
        if activity and activity.get("qualified", False):
            continue

        reminder_time = settings_data.get("reminder_time", "19:00")
        is_regular_reminder = (local_time_str == reminder_time)
        is_last_chance = (local_time_str == "21:30" and settings_data.get("last_chance_enabled", True))

        if is_regular_reminder or is_last_chance:
            # Fetch current streak
            streak_doc = await db.streaks.find_one({"user_id": user_id})
            current_streak = streak_doc.get("current", 0) if streak_doc else 0
            prompts_needed = max(1, 2 - prompt_count)

            if is_last_chance:
                title = "🚨 Last Chance to Save Your Streak!"
                body = f"Only a few hours left today! Send {prompts_needed} prompt{'s' if prompts_needed > 1 else ''} to keep your {current_streak}-day streak alive."
            else:
                title = "🔥 Keep Your Streak Burning!"
                body = f"You're on a {current_streak}-day streak! Send {prompts_needed} prompt{'s' if prompts_needed > 1 else ''} today to qualify."

            # 1. Create in-app notification
            await db.notifications.insert_one({
                "user_id": user_id,
                "type": "streak_reminder",
                "title": title,
                "body": body,
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })

            # 2. Send Web Push
            if push_enabled:
                await send_web_push(user_id, title, body)

async def send_web_push(user_id: str, title: str, body: str, url: str = "/chat"):
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.debug("VAPID keys not configured, skipping web push.")
        return

    db = get_database()
    subs_cursor = db.push_subscriptions.find({"user_id": user_id})
    payload = json.dumps({"title": title, "body": body, "url": url})

    try:
        from pywebpush import webpush, WebPushException
        async for sub in subs_cursor:
            subscription_info = {
                "endpoint": sub["endpoint"],
                "keys": sub["keys"]
            }
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": settings.VAPID_SUBJECT}
                )
            except WebPushException as ex:
                if ex.response and ex.response.status_code in (404, 410):
                    # Subscription expired or unsubscribed
                    await db.push_subscriptions.delete_one({"_id": sub["_id"]})
    except ImportError:
        logger.debug("pywebpush not installed or error in sending")
    except Exception as e:
        logger.error("WebPush sending error: %s", e)

