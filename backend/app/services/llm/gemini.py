import httpx
import os
import json
import logging
from app.services.llm import LLMProvider

logger = logging.getLogger(__name__)

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

class GeminiProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key or self.api_key == "your_key_here":
            logger.warning("GEMINI_API_KEY is not set or invalid. Gemini calls will fail.")

    def classify(self, text: str, source: str) -> dict:
        if not self.api_key:
            raise ValueError("No Gemini API key")

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
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        
        with httpx.Client(timeout=5.0) as client:
            response = client.post(
                f"{GEMINI_URL}?key={self.api_key}",
                json=payload
            )
            response.raise_for_status()
            
            data = response.json()
            try:
                # The response could be nested
                text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_response)
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                logger.error(f"Failed to parse Gemini response: {e}")
                raise ValueError("Invalid response format from Gemini")
