from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.routers.deps import get_current_user
from app.services.memory import get_user_memories, create_memory, update_memory, delete_memory

router = APIRouter(prefix="/memory", tags=["memory"])

class MemoryCreate(BaseModel):
    text: str
    category: str = "preference"

class MemoryUpdatePayload(BaseModel):
    text: Optional[str] = None
    enabled: Optional[bool] = None

@router.get("")
async def list_memories(user: dict = Depends(get_current_user)):
    return await get_user_memories(user["id"])

@router.post("")
async def add_memory(data: MemoryCreate, user: dict = Depends(get_current_user)):
    return await create_memory(user["id"], data.text, data.category)

@router.put("/{memory_id}")
async def edit_memory(memory_id: str, data: MemoryUpdatePayload, user: dict = Depends(get_current_user)):
    res = await update_memory(user["id"], memory_id, data.text, data.enabled)
    if not res:
        raise HTTPException(status_code=404, detail="Memory not found")
    return res

@router.delete("/{memory_id}")
async def remove_memory(memory_id: str, user: dict = Depends(get_current_user)):
    success = await delete_memory(user["id"], memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "success", "message": "Memory deleted"}

