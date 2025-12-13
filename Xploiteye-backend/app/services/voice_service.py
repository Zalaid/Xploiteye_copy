"""
Voice Service - Convert audio to text using OpenAI Whisper
"""

import os
import io
import logging
from typing import Dict, Optional
import tempfile

logger = logging.getLogger(__name__)


class VoiceService:
    """Handle voice-to-text conversion"""

    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')

        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.openai_api_key)
            self.available = True
            logger.info("✅ Voice Service initialized")
        except Exception as e:
            logger.warning(f"Voice service not available: {str(e)}")
            self.available = False

    async def audio_to_text(
        self,
        audio_bytes: bytes,
        filename: str = "audio.mp3"
    ) -> Dict[str, str]:
        """Convert audio to text"""

        if not self.available:
            return {
                "success": False,
                "text": "",
                "error": "Voice service not available"
            }

        try:
            # Create temporary audio file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name

            try:
                # Transcribe using OpenAI Whisper
                with open(tmp_path, 'rb') as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="en"
                    )

                text = transcript.text
                logger.info(f"✅ Audio transcribed: {len(text)} chars")

                return {
                    "success": True,
                    "text": text,
                    "error": None
                }

            finally:
                # Clean up
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as e:
            logger.error(f"Voice transcription error: {str(e)}")
            return {
                "success": False,
                "text": "",
                "error": str(e)
            }

    async def audio_to_text_multilingual(
        self,
        audio_bytes: bytes,
        language: str = "auto",
        filename: str = "audio.mp3"
    ) -> Dict[str, str]:
        """Convert audio to text with language detection"""

        if not self.available:
            return {
                "success": False,
                "text": "",
                "language": None,
                "error": "Voice service not available"
            }

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name

            try:
                with open(tmp_path, 'rb') as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=None if language == "auto" else language
                    )

                text = transcript.text

                return {
                    "success": True,
                    "text": text,
                    "language": getattr(transcript, 'language', language),
                    "error": None
                }

            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as e:
            logger.error(f"Multilingual transcription error: {str(e)}")
            return {
                "success": False,
                "text": "",
                "language": None,
                "error": str(e)
            }
