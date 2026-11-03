from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.routers.deps import get_current_user
from app.services.streak import get_user_streak, get_streak_calendar
from app.schemas import StreakResponse

router = APIRouter(prefix="/streaks", tags=["streaks"])

@router.get("/me", response_model=StreakResponse)
async def get_my_streak(user: dict = Depends(get_current_user)):
    streak_data = await get_user_streak(user["id"])
    return streak_data

@router.get("/calendar")
async def get_calendar(
    month: Optional[str] = Query(None, pattern="^\\d{4}-\\d{2}$"),
    user: dict = Depends(get_current_user)
):
    days = await get_streak_calendar(user["id"], month)
    return days
