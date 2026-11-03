from app.core.config import settings
from app.services.llm.interface import LLMProvider
from app.services.llm.mock import MockLLMProvider
from app.services.llm.anthropic import AnthropicProvider
from app.services.llm.gemini import GeminiProvider

_provider_instance = None

def get_llm_provider() -> LLMProvider:
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    choice = (settings.LLM_PROVIDER or "").lower().strip()
    if choice == "anthropic" and settings.ANTHROPIC_API_KEY:
        _provider_instance = AnthropicProvider()
    elif choice == "gemini" and settings.GEMINI_API_KEY:
        _provider_instance = GeminiProvider()
    elif settings.GEMINI_API_KEY:
        _provider_instance = GeminiProvider()
    elif settings.ANTHROPIC_API_KEY:
        _provider_instance = AnthropicProvider()
    else:
        _provider_instance = MockLLMProvider()

    return _provider_instance

