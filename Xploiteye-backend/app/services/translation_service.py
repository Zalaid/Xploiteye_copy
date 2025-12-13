"""
Translation Service - Translate text to Urdu using OpenAI
"""

import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TranslationService:
    """Handle text translation to Urdu"""

    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv('OPENAI_API_KEY')

        try:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                openai_api_key=self.openai_api_key
            )
            self.available = True
            logger.info("✅ Translation Service initialized")
        except Exception as e:
            logger.warning(f"Translation service not available: {str(e)}")
            self.available = False

    async def translate_to_urdu(self, text: str) -> Dict[str, str]:
        """Translate English text to Urdu"""

        if not self.available:
            return {
                "success": False,
                "original": text,
                "translated": "",
                "language": "ur",
                "error": "Translation service not available"
            }

        if not text or not text.strip():
            return {
                "success": False,
                "original": text,
                "translated": "",
                "language": "ur",
                "error": "Text cannot be empty"
            }

        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            prompt = f"""Translate the following English text to Urdu. Keep the meaning and structure intact.

English text:
{text}

Provide only the Urdu translation without any explanations."""

            messages = [
                SystemMessage(content="You are an expert translator. Translate English to Urdu accurately."),
                HumanMessage(content=prompt)
            ]

            response = self.llm.invoke(messages)
            translated_text = response.content

            logger.info(f"✅ Translated {len(text)} chars to Urdu")

            return {
                "success": True,
                "original": text,
                "translated": translated_text,
                "language": "ur",
                "error": None
            }

        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return {
                "success": False,
                "original": text,
                "translated": "",
                "language": "ur",
                "error": str(e)
            }

    async def translate_to_language(
        self,
        text: str,
        target_language: str = "ur"
    ) -> Dict[str, str]:
        """Translate text to specified language"""

        if not self.available:
            return {
                "success": False,
                "original": text,
                "translated": "",
                "target_language": target_language,
                "error": "Translation service not available"
            }

        if not text or not text.strip():
            return {
                "success": False,
                "original": text,
                "translated": "",
                "target_language": target_language,
                "error": "Text cannot be empty"
            }

        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            language_name = {
                "ur": "Urdu",
                "es": "Spanish",
                "fr": "French",
                "de": "German",
                "ar": "Arabic",
                "zh": "Chinese",
                "ja": "Japanese"
            }.get(target_language, target_language)

            prompt = f"""Translate the following English text to {language_name}.

English text:
{text}

Provide only the translation without explanations."""

            messages = [
                SystemMessage(content=f"You are an expert translator. Translate English to {language_name} accurately."),
                HumanMessage(content=prompt)
            ]

            response = self.llm.invoke(messages)
            translated_text = response.content

            logger.info(f"✅ Translated to {language_name}")

            return {
                "success": True,
                "original": text,
                "translated": translated_text,
                "target_language": target_language,
                "error": None
            }

        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return {
                "success": False,
                "original": text,
                "translated": "",
                "target_language": target_language,
                "error": str(e)
            }
