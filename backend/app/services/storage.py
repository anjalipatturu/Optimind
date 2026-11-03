import io
import mimetypes
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from bson import ObjectId
from PIL import Image
import pypdf
import docx

from app.core.database import get_database, get_gridfs
from app.core.config import settings

ALLOWED_MIMES = {
    "image/png", "image/jpeg", "image/webp", "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "text/markdown", "text/csv", "application/json"
}

def extract_text_from_file(content: bytes, filename: str, mime: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Extracts text and per-page/section chunks from uploaded file.
    Returns (full_text, pages_or_chunks).
    """
    full_text = ""
    pages = []

    try:
        if mime == "application/pdf":
            reader = pypdf.PdfReader(io.BytesIO(content))
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    full_text += f"\n--- Page {i + 1} ---\n" + page_text
                    pages.append({"page": i + 1, "text": page_text.strip()})
        elif mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            pages.append({"page": 1, "text": full_text})
        elif mime.startswith("text/") or mime == "application/json":
            full_text = content.decode("utf-8", errors="replace")
            pages.append({"page": 1, "text": full_text})
        else:
            # Images or binary formats
            full_text = f"[Image file: {filename}]"
    except Exception as e:
        full_text = f"[Extraction error for {filename}: {str(e)}]"

    return full_text, pages

def create_thumbnail(image_bytes: bytes, max_size: Tuple[int, int] = (200, 200)) -> Optional[bytes]:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail(max_size)
        out_io = io.BytesIO()
        img_format = img.format if img.format in ["JPEG", "PNG", "WEBP"] else "PNG"
        img.save(out_io, format=img_format)
        return out_io.getvalue()
    except Exception:
        return None

async def store_file(
    user_id: str,
    filename: str,
    content: bytes,
    mime_type: Optional[str] = None,
    chat_id: Optional[str] = None
) -> Dict[str, Any]:
    # Size check
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise ValueError(f"File size exceeds limit of {settings.MAX_UPLOAD_MB} MB")

    guessed_mime, _ = mimetypes.guess_type(filename)
    mime = mime_type or guessed_mime or "application/octet-stream"

    # Extract text content
    extracted_text, pages = extract_text_from_file(content, filename, mime)

    # Store in GridFS
    fs = get_gridfs()
    gridfs_id = await fs.upload_from_stream(
        filename,
        content,
        metadata={"user_id": user_id, "mime": mime}
    )

    thumbnail_id = None
    if mime.startswith("image/"):
        thumb_bytes = create_thumbnail(content)
        if thumb_bytes:
            thumb_gridfs_id = await fs.upload_from_stream(
                f"thumb_{filename}",
                thumb_bytes,
                metadata={"user_id": user_id, "is_thumbnail": True}
            )
            thumbnail_id = str(thumb_gridfs_id)

    db = get_database()
    att_doc = {
        "user_id": user_id,
        "chat_id": chat_id,
        "filename": filename,
        "mime": mime,
        "size": len(content),
        "gridfs_id": str(gridfs_id),
        "thumbnail_id": thumbnail_id,
        "extracted_text": extracted_text[:10000], # store preview of extracted text
        "pages_count": len(pages),
        "created_at": datetime.now(timezone.utc)
    }
    insert_res = await db.attachments.insert_one(att_doc)
    attachment_id = str(insert_res.inserted_id)

    # Store document chunks for RAG if text exists
    if pages:
        from app.services.rag import index_document_chunks
        await index_document_chunks(attachment_id, user_id, filename, pages)

    return {
        "id": attachment_id,
        "filename": filename,
        "mime": mime,
        "size": len(content),
        "gridfs_id": str(gridfs_id),
        "thumbnail_id": thumbnail_id,
        "has_text": bool(extracted_text.strip()),
        "created_at": att_doc["created_at"].isoformat()
    }

async def get_file_content(gridfs_id_str: str) -> Tuple[bytes, str]:
    fs = get_gridfs()
    gridfs_id = ObjectId(gridfs_id_str)
    grid_out = await fs.open_download_stream(gridfs_id)
    content = await grid_out.read()
    filename = grid_out.filename or "file"
    return content, filename

