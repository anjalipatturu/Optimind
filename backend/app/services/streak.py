from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Dict, Any, List, Optional, Tuple
from bson import ObjectId
from app.core.database import get_database

MILESTONES = [
    {"days": 3, "title": "Spark of Consistency", "icon": "Flame", "xp": 50},
    {"days": 7, "title": "Week Warrior", "icon": "Zap", "xp": 100},
    {"days": 14, "title": "Habit Builder", "icon": "Award", "xp": 250},
    {"days": 30, "title": "Prompt Craftsman", "icon": "Crown", "xp": 500},
    {"days": 100, "title": "Century Architect", "icon": "Star", "xp": 2000},
    {"days": 365, "title": "Legendary Master", "icon": "Trophy", "xp": 10000},
]

def get_user_local_date(tz_name: str, utc_dt: Optional[datetime] = None) -> date:
    """Calculates calendar date in user's IANA timezone."""
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")

    dt = utc_dt or datetime.now(timezone.utc)
    local_dt = dt.astimezone(tz)
    return local_dt.date()

async def record_user_prompt_activity(user_id: str) -> Dict[str, Any]:
    """
    Called whenever a user sends a prompt.
    Increments daily prompt count in user's local timezone.
    If prompt_count reaches 2, qualifies the day and updates streak.
    """
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("User not found")

    user_tz = user.get("timezone", "UTC")
    today_local = get_user_local_date(user_tz)
    today_str = today_local.strftime("%Y-%m-%d")

    # Increment prompt count in daily_activity
    activity = await db.daily_activity.find_one_and_update(
        {"user_id": user_id, "local_date": today_str},
        {"$inc": {"prompt_count": 1}},
        upsert=True,
        return_document=True
    )

    prompt_count = activity.get("prompt_count", 1)
    just_qualified = False
    new_milestone = None

    # Check if newly qualified today
    if prompt_count >= 2 and not activity.get("qualified", False):
        await db.daily_activity.update_one(
            {"user_id": user_id, "local_date": today_str},
            {"$set": {"qualified": True}}
        )
        just_qualified = True
        streak_data, new_milestone = await _update_streak_on_qualification(user_id, today_local)
    else:
        streak_data = await get_user_streak(user_id)

    return {
        "local_date": today_str,
        "prompt_count": prompt_count,
        "qualified": prompt_count >= 2,
        "just_qualified": just_qualified,
        "streak": streak_data,
        "new_milestone": new_milestone
    }

async def _update_streak_on_qualification(user_id: str, today_local: date) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    db = get_database()
    today_str = today_local.strftime("%Y-%m-%d")

    streak_doc = await db.streaks.find_one({"user_id": user_id})
    if not streak_doc:
        streak_doc = {
            "user_id": user_id,
            "current": 0,
            "longest": 0,
            "last_qualified_date": None,
            "freezes": 1
        }

    last_date_str = streak_doc.get("last_qualified_date")
    current_streak = streak_doc.get("current", 0)
    longest_streak = streak_doc.get("longest", 0)
    freezes = streak_doc.get("freezes", 1)

    if last_date_str:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        diff_days = (today_local - last_date).days

        if diff_days == 0:
            # Already qualified today
            pass
        elif diff_days == 1:
            # Consecutive day!
            current_streak += 1
        elif diff_days == 2 and freezes > 0:
            # Missed exactly 1 day, but used a streak freeze!
            freezes -= 1
            current_streak += 1
            # Add notification for freeze used
            await db.notifications.insert_one({
                "user_id": user_id,
                "type": "streak_freeze_used",
                "title": "Streak Freeze Protected You! 🛡️",
                "body": f"A streak freeze was automatically used to save your {current_streak}-day streak.",
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })
        else:
            # Missed days with no freeze; streak resets
            current_streak = 1
    else:
        # First qualification ever
        current_streak = 1

    # Award free freeze every 7 streak days (max 2 held)
    if current_streak > 0 and current_streak % 7 == 0 and freezes < 2:
        freezes = min(2, freezes + 1)

    longest_streak = max(longest_streak, current_streak)

    # Save streak
    await db.streaks.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "current": current_streak,
                "longest": longest_streak,
                "last_qualified_date": today_str,
                "freezes": freezes,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )

    # Award base qualification XP
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"xp": 20}}
    )

    # Check milestones
    new_milestone = None
    for ms in MILESTONES:
        if current_streak == ms["days"]:
            new_milestone = ms
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"xp": ms["xp"]}}
            )
            await db.notifications.insert_one({
                "user_id": user_id,
                "type": "streak_milestone",
                "title": f"Milestone Unlocked: {ms['title']}! 🎉",
                "body": f"Congratulations on reaching a {ms['days']}-day streak! You earned +{ms['xp']} XP.",
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })

    streak_res = {
        "current": current_streak,
        "longest": longest_streak,
        "last_qualified_date": today_str,
        "freezes": freezes
    }
    return streak_res, new_milestone

async def get_user_streak(user_id: str) -> Dict[str, Any]:
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    user_tz = user.get("timezone", "UTC") if user else "UTC"
    today_local = get_user_local_date(user_tz)
    today_str = today_local.strftime("%Y-%m-%d")

    streak_doc = await db.streaks.find_one({"user_id": user_id})
    activity_doc = await db.daily_activity.find_one({"user_id": user_id, "local_date": today_str})

    current = streak_doc.get("current", 0) if streak_doc else 0
    longest = streak_doc.get("longest", 0) if streak_doc else 0
    last_date_str = streak_doc.get("last_qualified_date") if streak_doc else None
    freezes = streak_doc.get("freezes", 1) if streak_doc else 1

    # Check if streak is broken because yesterday was missed (and no freeze available)
    if last_date_str:
        last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        diff_days = (today_local - last_date).days
        if diff_days > 2 or (diff_days == 2 and freezes == 0):
            # Streak has lapsed
            current = 0

    today_prompts = activity_doc.get("prompt_count", 0) if activity_doc else 0
    qualified_today = activity_doc.get("qualified", False) if activity_doc else False

    # Milestones metadata
    milestone_list = []
    for ms in MILESTONES:
        milestone_list.append({
            **ms,
            "achieved": longest >= ms["days"]
        })

    return {
        "current": current,
        "longest": longest,
        "last_qualified_date": last_date_str,
        "freezes": freezes,
        "today_prompts": today_prompts,
        "qualified_today": qualified_today,
        "milestones": milestone_list
    }

async def get_streak_calendar(user_id: str, month: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns calendar days for the requested YYYY-MM month with prompt counts and qualified statuses."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    user_tz = user.get("timezone", "UTC") if user else "UTC"
    today_local = get_user_local_date(user_tz)
    
    prefix = month if month else today_local.strftime("%Y-%m")
    cursor = db.daily_activity.find({
        "user_id": user_id,
        "local_date": {"$regex": f"^{prefix}"}
    }).sort("local_date", 1)

    records = await cursor.to_list(length=35)
    return [
        {
            "date": r["local_date"],
            "prompt_count": r.get("prompt_count", 0),
            "qualified": r.get("qualified", False)
        }
        for r in records
    ]

