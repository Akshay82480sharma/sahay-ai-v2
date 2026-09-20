import httpx
import os
import time
import json
import logging
from typing import Dict, Any
from app.services.llm import LLMProvider
from collections import OrderedDict

logger = logging.getLogger(__name__)

# Constants from design
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"] # Using real available models for 2026/now
LLM_TIMEOUT = 5.0
COOLDOWN_SECONDS = 60
CACHE_MAX_SIZE = 500

class GeminiProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.cache = OrderedDict()
        
        self.cooldowns = {model: 0.0 for model in GEMINI_MODELS}
        
        if not self.api_key or self.api_key == "your_key_here":
            logger.warning("GEMINI_API_KEY is missing. Gemini calls will fall back to keyword extraction.")

    def classify(self, text: str, source: str) -> dict:
        if not self.api_key:
            raise ValueError("No Gemini API key")

        # 1. Cache hit?
        cache_key = f"{source}:{text}"
        if cache_key in self.cache:
            self.cache.move_to_end(cache_key) # Mark as recently used
            return self.cache[cache_key]

        prompt = f"""
        You are an emergency dispatch AI. Classify the following incident report.
        Source: {source}
        Report text: "{text}"
        
        Return ONLY a JSON object matching this schema exactly (no markdown formatting):
        {{
            "type": "flood" | "fire" | "accident" | "medical" | "industrial" | "other",
            "severity": integer (1 to 5, where 5 is most severe),
            "priority": "low" | "medium" | "high" | "critical",
            "location_name": string (extract if present, else null),
            "summary": string (a short, clear 1-sentence English summary),
            "required_resources": [
                {{"type": "rescue_boat" | "ambulance" | "fire_engine" | "police", "count": integer}}
            ],
            "language": string (e.g., "hi-Latn", "gu-IN", "en-US"),
            "is_likely_false": boolean (true if spam/fake)
        }}
        """
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }

        # 2. Iterate through tiers
        models_to_try = [os.environ.get("GEMINI_MODEL")] if os.environ.get("GEMINI_MODEL") else GEMINI_MODELS
        
        for model in models_to_try:
            # Skip if cooling down
            if time.time() < self.cooldowns.get(model, 0):
                continue
                
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=LLM_TIMEOUT) as client:
                    resp = client.post(url, json=payload)
                    
                if resp.status_code == 429:
                    logger.warning(f"Model {model} hit 429. Cooling down.")
                    self.cooldowns[model] = time.time() + COOLDOWN_SECONDS
                    continue
                elif resp.status_code != 200:
                    logger.error(f"Model {model} failed with {resp.status_code}")
                    continue
                
                # Parse
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                
                # Clean markdown if present
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                    
                result = json.loads(raw_text.strip())
                
                # Cache and return
                self.cache[cache_key] = result
                if len(self.cache) > CACHE_MAX_SIZE:
                    self.cache.popitem(last=False) # Remove oldest
                return result
                
            except httpx.TimeoutException:
                logger.warning(f"Model {model} timed out. Trying next tier.")
                continue
            except Exception as e:
                logger.warning(f"Model {model} failed: {e}")
                continue
        
        # 3. If all tiers fail, throw to trigger keyword fallback
        raise RuntimeError("All Gemini tiers exhausted or failed. Falling back to Keyword engine.")
