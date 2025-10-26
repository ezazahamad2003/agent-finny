# app/lava_voice.py
"""
Lava Voice Integration - TTS and STT
Handles text-to-speech and speech-to-text using Lava API
"""

import httpx
import base64
import json
import os
from typing import Optional, Dict, List
from fastapi import HTTPException


class LavaVoice:
    """Lava TTS/STT service wrapper"""
    
    def __init__(self):
        self.api_key = os.environ.get("LAVA_API_KEY")
        self.connection_secret = os.environ.get("LAVA_SELF_CONNECTION_SECRET")
        self.product_secret = os.environ.get("LAVA_SELF_PRODUCT_SECRET")
        self.forward_url = os.environ.get("LAVA_FORWARD_URL", "")
        
        # OpenAI TTS via Lava
        self.tts_url = f"{self.forward_url}https://api.openai.com/v1/audio/speech"
        
        # Lava STT endpoint (if available)
        self.stt_url = os.environ.get("LAVA_STT_URL", "")
    
    def _get_lava_token(self) -> str:
        """Generate Lava authentication token"""
        payload = {
            "secret_key": self.api_key,
            "connection_secret": self.connection_secret,
            "product_secret": self.product_secret,
        }
        return base64.b64encode(json.dumps(payload).encode()).decode()
    
    async def text_to_speech(
        self,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0
    ) -> Dict:
        """
        Convert text to speech using OpenAI TTS via Lava
        
        Args:
            text: Text to convert to speech
            voice: Voice model (alloy, echo, fable, onyx, nova, shimmer)
            speed: Speech speed (0.25 to 4.0)
        
        Returns:
            Dictionary with audio_url and metadata
        """
        if not self.api_key:
            raise HTTPException(500, "Lava API key not configured")
        
        # Use OpenAI TTS model
        payload = {
            "model": "tts-1",
            "input": text,
            "voice": voice,
            "speed": speed
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._get_lava_token()}"
        }
        
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    self.tts_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code >= 400:
                    raise HTTPException(500, f"TTS error: {response.text}")
                
                # Get audio bytes
                audio_bytes = response.content
                
                # Store in temporary location or return as base64
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                # Calculate duration (rough estimate: 4 chars per second)
                duration = len(text) / (4 * speed)
                
                return {
                    "audio_base64": audio_base64,
                    "audio_url": f"data:audio/mp3;base64,{audio_base64}",
                    "duration": duration,
                    "text": text,
                    "voice": voice,
                    "speed": speed
                }
        
        except Exception as e:
            raise HTTPException(500, f"TTS generation failed: {str(e)}")
    
    async def speech_to_text(
        self,
        audio_file: bytes,
        language: str = "en"
    ) -> str:
        """
        Convert speech to text (placeholder - implement with actual STT service)
        
        Args:
            audio_file: Audio file bytes
            language: Language code
        
        Returns:
            Transcribed text
        """
        # TODO: Implement with actual STT service
        # For now, return placeholder
        return "Speech transcription would appear here. This requires an STT service integration."
    
    def split_text_into_chunks(self, text: str, max_length: int = 200) -> List[str]:
        """
        Split text into chunks for better TTS delivery
        
        Args:
            text: Text to split
            max_length: Maximum characters per chunk
        
        Returns:
            List of text chunks
        """
        # Split by sentences first
        import re
        sentences = re.split(r'[.!?]+', text)
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            sentence_len = len(sentence)
            
            if current_length + sentence_len > max_length and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                current_length = sentence_len
            else:
                current_chunk.append(sentence)
                current_length += sentence_len + 1
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks


# Global instance
lava_voice = LavaVoice()
