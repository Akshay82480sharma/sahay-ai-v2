from abc import ABC, abstractmethod
from typing import Dict, Any
import importlib
from app.core.config import settings

class LLMProvider(ABC):
    @abstractmethod
    def classify(self, text: str, source: str) -> Dict[str, Any]:
        """
        Takes raw text and source, returns a dict matching the classification schema:
        type, severity, location_name, summary, required_resources, language, is_likely_false
        """
        pass

def get_provider() -> LLMProvider:
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "mock":
        from .mock import MockProvider
        return MockProvider()
    elif provider_name == "gemini":
        from .gemini import GeminiProvider
        return GeminiProvider()
    elif provider_name == "claude":
        from .claude import ClaudeProvider
        return ClaudeProvider()
    else:
        # Fallback to mock if unknown
        from .mock import MockProvider
        return MockProvider()