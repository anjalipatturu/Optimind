from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])

class TemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content: str
    tags: List[str] = []
    persona: str = "General"
    variables: List[str] = []
    is_public: bool = True

@router.get("")
async def list_templates(
    persona: Optional[str] = None,
    tag: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {
        "$or": [
            {"user_id": None}, # System templates
            {"user_id": user["id"]},
            {"is_public": True}
        ]
    }
    if persona and persona != "All":
        query["persona"] = persona
    if tag:
        query["tags"] = tag

    cursor = db.templates.find(query).sort("created_at", -1)
    templates = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        templates.append(doc)
    return templates

@router.post("")
async def create_template(data: TemplateCreate, user: dict = Depends(get_current_user)):
    db = get_database()
    doc = {
        "user_id": user["id"],
        "title": data.title,
        "description": data.description,
        "content": data.content,
        "tags": data.tags,
        "persona": data.persona,
        "variables": data.variables,
        "is_public": data.is_public,
        "upvotes": 0,
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.templates.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc

@router.get("/{template_id}")
async def get_template(template_id: str):
    db = get_database()
    doc = await db.templates.find_one({"_id": ObjectId(template_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

@router.delete("/{template_id}")
async def delete_template(template_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    res = await db.templates.delete_one({"_id": ObjectId(template_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=403, detail="Cannot delete template")
    return {"status": "success", "message": "Template removed"}

@router.post("/{template_id}/use")
async def use_template(template_id: str):
    db = get_database()
    await db.templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$inc": {"uses_count": 1}}
    )
    return {"status": "success"}

@router.post("/{template_id}/fork")
async def fork_template(template_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    tmpl = await db.templates.find_one({"_id": ObjectId(template_id)})
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    
    new_doc = {
        "user_id": user["id"],
        "title": f"{tmpl['title']} (Copy)",
        "description": tmpl.get("description"),
        "content": tmpl["content"],
        "tags": tmpl.get("tags", []),
        "persona": tmpl.get("persona", "General"),
        "variables": tmpl.get("variables", []),
        "is_public": False,
        "forked_from": template_id,
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.templates.insert_one(new_doc)
    new_doc["id"] = str(res.inserted_id)
    new_doc.pop("_id", None)
    return new_doc

