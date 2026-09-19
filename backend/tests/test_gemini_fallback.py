import pytest
from app.services.classifier import classify
from unittest.mock import patch
from app.services.llm.gemini import GeminiProvider

def test_gemini_fallback_on_error():
    # Setup mock to force Gemini error
    with patch('httpx.Client.post') as mock_post:
        # Simulate network error or API error
        mock_post.side_effect = Exception("Connection timeout")
        
        # Test that classify catches the error and uses the keyword fallback
        # "Huge flood" -> keyword fallback should classify as "flood"
        result = classify("Huge flood in the area!", "citizen")
        
        assert result["type"] == "flood"
        assert result["severity"] >= 3
        assert result["is_likely_false"] is False
