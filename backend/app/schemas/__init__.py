from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models import UserSettings, AttachmentMeta

# Auth schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    language: str = "en"
    timezone: str = "UTC"
    persona: str = "General"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    language: str
    timezone: str
    persona: str
    theme: str
    settings: UserSettings
    xp: int
    level: int
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    persona: Optional[str] = None
    theme: Optional[str] = None
    settings: Optional[UserSettings] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# Chat schemas
class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"
    model: Optional[str] = "gemini-1.5-flash"
    folder_id: Optional[str] = None
    is_temporary: bool = False

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None
    folder_id: Optional[str] = None

class MessageCreate(BaseModel):
    content: str
    model: Optional[str] = None
    attachments: Optional[List[AttachmentMeta]] = None
    optimization_id: Optional[str] = None

class MessageUpdate(BaseModel):
    content: str

# Optimizer schemas
class OptimizeRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    mode: Optional[str] = "Balanced" # Balanced, Concise, Detailed, Creative, Technical, Academic
    task_type: Optional[str] = None
    language: Optional[str] = None
    tone_slider: Optional[int] = 50
    detail_slider: Optional[int] = 50
    expertise_slider: Optional[int] = 50

class ScoreBreakdown(BaseModel):
    clarity: int
    context: int
    specificity: int
    output_format: int
    constraints: int

class OptimizeResponse(BaseModel):
    optimization_id: str
    original: str
    optimized: str
    task_type: str
    strategies: List[str]
    score_before: int
    score_after: int
    score_breakdown_before: ScoreBreakdown
    score_breakdown_after: ScoreBreakdown
    explanation: List[str]
    tips: List[str]

class ScoreRequest(BaseModel):
    prompt: str

class ScoreResponse(BaseModel):
    score: int
    breakdown: ScoreBreakdown
    tips: List[str]

class OutcomeRequest(BaseModel):
    optimization_id: str
    outcome: str # "accepted", "edited", "rejected"
    edited_prompt: Optional[str] = None

class ABTestResponse(BaseModel):
    variant_a: OptimizeResponse
    variant_b: OptimizeResponse

# Feedback schema
class FeedbackCreate(BaseModel):
    message_id: Optional[str] = None
    optimization_id: Optional[str] = None
    type: str = "answer" # answer, optimizer, general
    rating: Optional[int] = None # 1 or -1 or 1..5
    reasons: Optional[List[str]] = None
    comment: Optional[str] = None

# Streak schemas
class StreakResponse(BaseModel):
    current: int
    longest: int
    last_qualified_date: Optional[str]
    freezes: int
    today_prompts: int
    qualified_today: bool
    milestones: List[Dict[str, Any]]

