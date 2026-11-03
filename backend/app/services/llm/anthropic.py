import json
import logging
from typing import AsyncGenerator, Dict, List, Optional, Any
import httpx
from app.core.config import settings
from app.services.llm.interface import LLMProvider
from app.services.llm.mock import MockLLMProvider

logger = logging.getLogger(__name__)

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.base_url = "https://api.anthropic.com/v1"
        self.mock_fallback = MockLLMProvider()

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

        model_name = model or settings.DEFAULT_MODEL_POWERFUL
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        
        messages = [{"role": "user", "content": prompt}]
        payload: Dict[str, Any] = {
            "model": model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(f"{self.base_url}/messages", headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                text_parts = [c["text"] for c in data.get("content", []) if c.get("type") == "text"]
                return "".join(text_parts)
        except Exception as e:
            logger.error("Anthropic generate error: %s, falling back to mock", e)
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

        model_name = model or settings.DEFAULT_MODEL_POWERFUL
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", f"{self.base_url}/messages", headers=headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if line.startswith("data: "):
                            raw_data = line[6:]
                            if raw_data == "[DONE]":
                                break
                            try:
                                event = json.loads(raw_data)
                                if event.get("type") == "content_block_delta":
                                    delta = event.get("delta", {})
                                    if delta.get("type") == "text_delta":
                                        yield delta.get("text", "")
                            except json.JSONDecodeError:
                                pass
        except Exception as e:
            logger.error("Anthropic stream error: %s, falling back to mock", e)
            async for chunk in self.mock_fallback.generate_stream(prompt, system, model, temperature, max_tokens, attachments):
                yield chunk

    async def embed(self, texts: List[str]) -> List[List[float]]:
        # Anthropic doesn't have an embedding endpoint; fallback to mock or generic embedding
        return await self.mock_fallback.embed(texts)

