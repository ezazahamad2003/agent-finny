# app/voice.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import base64

from app.lava_voice import lava_voice

router = APIRouter(prefix="/voice", tags=["voice"])


class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer
    speed: float = 1.0


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """
    Convert text to speech using Lava + OpenAI TTS
    
    Returns audio file and metadata
    """
    try:
        result = await lava_voice.text_to_speech(
            text=req.text,
            voice=req.voice,
            speed=req.speed
        )
        
        return {
            "success": True,
            "audio_url": result["audio_url"],
            "duration": result["duration"],
            "voice": result["voice"],
            "speed": result["speed"]
        }
    
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/tts-stream")
async def text_to_speech_stream(req: TTSRequest):
    """
    Stream TTS audio directly as MP3 file
    """
    try:
        result = await lava_voice.text_to_speech(
            text=req.text,
            voice=req.voice,
            speed=req.speed
        )
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(result["audio_base64"])
        
        # Return as streaming audio
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=speech.mp3"
            }
        )
    
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/tts-chunks")
async def text_to_speech_chunks(req: TTSRequest):
    """
    Convert text to speech in chunks for better playback
    
    Returns array of audio chunks with timing
    """
    try:
        # Split text into chunks
        chunks = lava_voice.split_text_into_chunks(req.text, max_length=200)
        
        audio_chunks = []
        
        for i, chunk in enumerate(chunks):
            result = await lava_voice.text_to_speech(
                text=chunk,
                voice=req.voice,
                speed=req.speed
            )
            
            audio_chunks.append({
                "index": i,
                "text": chunk,
                "audio_url": result["audio_url"],
                "duration": result["duration"],
                "start_time": sum(c["duration"] for c in audio_chunks)
            })
        
        return {
            "chunks": audio_chunks,
            "total_duration": sum(c["duration"] for c in audio_chunks),
            "total_chunks": len(audio_chunks)
        }
    
    except Exception as e:
        raise HTTPException(500, str(e))
