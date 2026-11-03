import asyncio
import hashlib
import json
import math
from typing import AsyncGenerator, Dict, List, Optional, Any
from app.services.llm.interface import LLMProvider

class MockLLMProvider(LLMProvider):
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        # Check if this is an optimization prompt requesting JSON
        if "JSON" in (system or "") or "JSON" in prompt:
            return json.dumps({
                "optimized": f"Act as an expert. Please {prompt.strip()}. Provide step-by-step guidance, code/examples where relevant, and list any trade-offs or constraints.",
                "explanation": ["Defined clear expert persona", "Requested concrete examples", "Added constraint handling"],
                "tips": ["Adding explicit constraints improves output relevance", "Specify output format"]
            })
        
        # General response
        return f"### Response\n\nThank you for your prompt: **\"{prompt[:60]}...\"**\n\nHere is a comprehensive answer:\n\n1. **Core Concept**: Analyzing your requirements systematically.\n2. **Best Practice**: Ensure constraints and context are clearly framed.\n3. **Example Implementation**:\n```python\n# Automated optimization active\ndef optimize_workflow():\n    return {'status': 'success', 'confidence': 0.96}\n```\n\nIs there anything specific you would like to refine or test?"

    async def generate_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        full_text = await self.generate(prompt, system, model, temperature, max_tokens, attachments)
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.02)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        dim = 128
        results = []
        for text in texts:
            # Deterministic pseudo-embedding based on hash
            vec = []
            for i in range(dim):
                h = hashlib.sha256(f"{text}:{i}".encode("utf-8")).hexdigest()
                val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
                vec.append(val)
            # Normalize vector to unit length
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            norm_vec = [x / norm for x in vec]
            results.append(norm_vec)
        return results

