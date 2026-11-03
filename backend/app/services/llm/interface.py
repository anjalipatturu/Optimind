from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, List, Optional, Any

class LLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Generate non-streaming response text."""
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response tokens one by one."""
        pass

    @abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for list of texts."""
        pass

