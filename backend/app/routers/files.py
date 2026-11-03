from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from bson import ObjectId

from app.core.database import get_database
from app.routers.deps import get_current_user
from app.services.storage import store_file, get_file_content

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    chat_id: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    content = await file.read()
    try:
        record = await store_file(
            user_id=user["id"],
            filename=file.filename or "upload",
            content=content,
            mime_type=file.content_type,
            chat_id=chat_id
        )
        return record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

@router.get("/gallery")
async def media_gallery(
    mime_type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {"user_id": user["id"]}
    if mime_type:
        query["mime"] = {"$regex": f"^{mime_type}"}
    
    cursor = db.attachments.find(query).sort("created_at", -1)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        items.append(doc)
    return items

@router.get("/{attachment_id}")
async def get_attachment_info(attachment_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    doc = await db.attachments.find_one({"_id": ObjectId(attachment_id), "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

@router.get("/{attachment_id}/content")
async def download_file_content(attachment_id: str, thumbnail: bool = False):
    db = get_database()
    doc = await db.attachments.find_one({"_id": ObjectId(attachment_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    gridfs_id = doc.get("thumbnail_id") if (thumbnail and doc.get("thumbnail_id")) else doc["gridfs_id"]
    try:
        content_bytes, filename = await get_file_content(gridfs_id)
        return Response(
            content=content_bytes,
            media_type=doc.get("mime", "application/octet-stream"),
            headers={"Content-Disposition": f'inline; filename="{filename}"'}
        )
    except Exception:
        raise HTTPException(status_code=404, detail="File content not found")

@router.delete("/{attachment_id}")
async def delete_file(attachment_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    doc = await db.attachments.find_one({"_id": ObjectId(attachment_id), "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    await db.attachments.delete_one({"_id": ObjectId(attachment_id)})
    await db.document_chunks.delete_many({"attachment_id": attachment_id})
    return {"status": "success", "message": "File deleted"}

