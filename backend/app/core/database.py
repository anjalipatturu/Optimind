import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from pymongo import ASCENDING, DESCENDING, TEXT
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    fs: Optional[AsyncIOMotorGridFSBucket] = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB at %s...", settings.MONGODB_URI)
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=10
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        db_instance.fs = AsyncIOMotorGridFSBucket(db_instance.db)
        
        # Ping the database
        await db_instance.db.command("ping")
        logger.info("Connected to MongoDB database: %s", settings.DATABASE_NAME)
        
        # Setup indexes
        await setup_indexes()
    except Exception as e:
        logger.error("Failed to connect to MongoDB: %s", e)
        # We don't crash here so app can start even in restricted environments
        db_instance.client = None
        db_instance.db = None
        db_instance.fs = None

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

async def setup_indexes():
    if db_instance.db is None:
        return
    db = db_instance.db
    try:
        # Users indexes
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("created_at", DESCENDING)])

        # Chats indexes
        await db.chats.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.chats.create_index([("shared_token", ASCENDING)], sparse=True)

        # Messages indexes
        await db.messages.create_index([("chat_id", ASCENDING), ("created_at", ASCENDING)])
        await db.messages.create_index([("content", TEXT)])

        # Attachments indexes
        await db.attachments.create_index([("user_id", ASCENDING)])
        await db.attachments.create_index([("chat_id", ASCENDING)])
        await db.attachments.create_index([("message_id", ASCENDING)])

        # Optimizations indexes
        await db.optimizations.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.optimizations.create_index([("task_type", ASCENDING)])

        # Feedback indexes
        await db.feedback.create_index([("user_id", ASCENDING)])
        await db.feedback.create_index([("message_id", ASCENDING)])

        # Strategy stats indexes
        await db.strategy_stats.create_index([("scope", ASCENDING), ("task_type", ASCENDING), ("strategy", ASCENDING)], unique=True)

        # Memories indexes
        await db.memories.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])

        # Streaks and daily activity indexes
        await db.streaks.create_index([("user_id", ASCENDING)], unique=True)
        await db.daily_activity.create_index([("user_id", ASCENDING), ("local_date", ASCENDING)], unique=True)

        # Templates indexes
        await db.templates.create_index([("user_id", ASCENDING)])
        await db.templates.create_index([("tags", ASCENDING)])
        await db.templates.create_index([("is_public", ASCENDING)])

        # Notifications & push indexes
        await db.notifications.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.push_subscriptions.create_index([("user_id", ASCENDING)])
        
        # Public API keys
        await db.api_keys.create_index([("key_hash", ASCENDING)], unique=True)
        await db.api_keys.create_index([("user_id", ASCENDING)])

        logger.info("MongoDB indexes verified and created.")
    except Exception as e:
        logger.warning("Index setup warning: %s", e)

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        raise RuntimeError("Database not initialized")
    return db_instance.db

def get_gridfs() -> AsyncIOMotorGridFSBucket:
    if db_instance.fs is None:
        raise RuntimeError("GridFS not initialized")
    return db_instance.fs

