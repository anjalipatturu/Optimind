import json
import logging
from typing import AsyncGenerator, Dict, List, Optional, Any
import httpx
from app.core.config import settings
from app.services.llm.interface import LLMProvider
from app.services.llm.mock import MockLLMProvider

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.mock_fallback = MockLLMProvider()

    def _normalize_model(self, model: Optional[str]) -> str:
        if not model:
            return settings.DEFAULT_MODEL_FAST
        if not model.startswith("models/"):
            return model
        return model.replace("models/", "")

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        if not self.api_key:
            return await self.mock_fallback.generate(prompt, system, model, temperature, max_tokens, attachments)

        model_name = self._normalize_model(model)
        url = f"{self.base_url}/models/{model_name}:generateContent?key={self.api_key}"

        contents: List[Dict[str, Any]] = []
        parts: List[Dict[str, Any]] = []
        if attachments:
            for att in attachments:
                if att.get("mime", "").startswith("image/") and att.get("base64"):
                    parts.append({
                        "inline_data": {
                            "mime_type": att.get("mime"),
                            "data": att.get("base64")
                        }
                    })
        parts.append({"text": prompt})
        contents.append({"role": "user", "parts": parts})

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
                return ""
        except Exception as e:
            logger.error("Gemini generate error: %s, falling back to mock", e)
            return await self.mock_fallback.generate(prompt, system, model, temperature, max_tokens, attachments)

    async def generate_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            async for chunk in self.mock_fallback.generate_stream(prompt, system, model, temperature, max_tokens, attachments):
                yield chunk
            return

        model_name = self._normalize_model(model)
        url = f"{self.base_url}/models/{model_name}:streamGenerateContent?alt=sse&key={self.api_key}"

        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if line.startswith("data: "):
                            raw_data = line[6:]
                            try:
                                data = json.loads(raw_data)
                                candidates = data.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    for p in parts:
                                        if "text" in p:
                                            yield p["text"]
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            logger.error("Gemini stream error: %s, falling back to mock", e)
            async for chunk in self.mock_fallback.generate_stream(prompt, system, model, temperature, max_tokens, attachments):
                yield chunk

    async def embed(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            return await self.mock_fallback.embed(texts)
        try:
            url = f"{self.base_url}/models/text-embedding-004:batchEmbedContents?key={self.api_key}"
            requests = [
                {"model": "models/text-embedding-004", "content": {"parts": [{"text": t}]}}
                for t in texts
            ]
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json={"requests": requests})
                res.raise_for_status()
                data = res.json()
                embeddings = [e.get("values", []) for e in data.get("embeddings", [])]
                if embeddings and len(embeddings) == len(texts):
                    return embeddings
                return await self.mock_fallback.embed(texts)
        except Exception as e:
            logger.error("Gemini embed error: %s, falling back to mock", e)
            return await self.mock_fallback.embed(texts)

