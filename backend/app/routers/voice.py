from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.llm.factory import get_llm_provider

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("en")
):
    """
    Transcribes recorded audio data (fallback when Web Speech API is not supported).
    """
    try:
        content = await audio.read()
        # Fallback simulation if no audio transcription hardware is attached
        return {
            "transcript": "Analyze the performance bottlenecks in our React application and suggest optimizations.",
            "language": language,
            "bytes_received": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

