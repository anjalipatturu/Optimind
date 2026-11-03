from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class UserSettings(BaseModel):
    auto_optimize: bool = False
    preferred_optimization_mode: str = "Balanced" # Balanced, Concise, Detailed, Creative, Technical, Academic
    tone_slider: int = 50 # 0=casual, 100=formal
    detail_slider: int = 50 # 0=short, 100=detailed
    expertise_slider: int = 50 # 0=beginner, 100=expert
    dyslexia_font: bool = False
    reduced_motion: bool = False
    high_contrast: bool = False
    font_size: str = "medium" # small, medium, large
    notifications_push: bool = True
    notifications_email: bool = True
    reminder_time: str = "19:00" # 7:00 PM
    last_chance_enabled: bool = True
    snooze_until: Optional[str] = None

class UserModel(BaseModel):
    id: Optional[str] = None
    email: str
    password_hash: str
    name: str
    avatar: Optional[str] = None
    language: str = "en"
    timezone: str = "UTC"
    persona: str = "General" # Student, Developer, Writer, Researcher, Business, General
    theme: str = "dark" # dark, light, system
    settings: UserSettings = Field(default_factory=UserSettings)
    xp: int = 0
    level: int = 1
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class ChatModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str = "New Conversation"
    pinned: bool = False
    folder_id: Optional[str] = None
    model: str = "gemini-1.5-flash"
    is_temporary: bool = False # Privacy control: temporary chat not stored or used for memory
    shared_token: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class AttachmentMeta(BaseModel):
    id: str
    filename: str
    mime: str
    size: int
    gridfs_id: str
    thumbnail_id: Optional[str] = None
    extracted_text: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class MessageModel(BaseModel):
    id: Optional[str] = None
    chat_id: str
    user_id: str
    role: str # "user" or "assistant" or "system"
    content: str
    language: Optional[str] = "en"
    attachments: List[AttachmentMeta] = Field(default_factory=list)
    tokens: int = 0
    optimization_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class OptimizationModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    message_id: Optional[str] = None
    original: str
    optimized: str
    task_type: str
    strategies: List[str] = Field(default_factory=list)
    score_before: int = 0
    score_after: int = 0
    score_breakdown_before: Dict[str, int] = Field(default_factory=dict)
    score_breakdown_after: Dict[str, int] = Field(default_factory=dict)
    explanation: List[str] = Field(default_factory=list)
    outcome: str = "pending" # pending, accepted, edited, rejected
    reward: float = 0.0
    created_at: datetime = Field(default_factory=utc_now)

class FeedbackModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    message_id: Optional[str] = None
    type: str # answer, optimizer, general
    rating: Optional[int] = None # 1 (up) or -1 (down) or 1-5
    reasons: List[str] = Field(default_factory=list)
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class StrategyStatsModel(BaseModel):
    scope: str # "global" or user_id
    task_type: str
    strategy: str
    alpha: float = 1.0 # Thompson Sampling Beta prior successes
    beta: float = 1.0  # Thompson Sampling Beta prior failures
    uses: int = 0
    updated_at: datetime = Field(default_factory=utc_now)

class MemoryModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    text: str
    category: str # "tone", "preference", "domain", "format", "instruction"
    embedding: Optional[List[float]] = None
    enabled: bool = True
    source_message_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

class StreakModel(BaseModel):
    user_id: str
    current: int = 0
    longest: int = 0
    last_qualified_date: Optional[str] = None # YYYY-MM-DD in user's timezone
    freezes: int = 1 # Starts with 1 freeze
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

class DailyActivityModel(BaseModel):
    user_id: str
    local_date: str # YYYY-MM-DD
    prompt_count: int = 0
    qualified: bool = False # True when prompt_count >= 2

class TemplateModel(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None # null for system seeded templates
    title: str
    description: Optional[str] = None
    content: str
    tags: List[str] = Field(default_factory=list)
    persona: str = "General"
    variables: List[str] = Field(default_factory=list) # e.g. ["topic", "audience"]
    is_public: bool = True
    upvotes: int = 0
    created_at: datetime = Field(default_factory=utc_now)

class NotificationModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    type: str # "streak_reminder", "streak_milestone", "badge", "system"
    title: str
    body: str
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)

