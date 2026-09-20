import pytest
from app.services.classifier import classify, fallback_classify
from unittest.mock import patch

def test_fallback_gujarati():
    res = fallback_classify("પાણી ઘરમાં ઘૂસી ગયું છે, મદદ મોકલો", "citizen")
    assert res["type"] == "flood"
    assert res["severity"] == 3
    assert res["priority"] == "high"
    assert res["language"] == "gu"
    assert res["summary"] == "High priority Flood reported. Original text: પાણી ઘરમાં ઘૂસી ગયું છે, મદદ મોકલો"
    
def test_fallback_hinglish():
    res = fallback_classify("aag lag gayi hai building me, madad chahiye", "citizen")
    assert res["type"] == "fire"
    assert res["severity"] == 4
    assert res["priority"] == "critical"
    assert res["language"] == "hi-Latn"

def test_fallback_english():
    res = fallback_classify("huge accident on the highway, medical help needed", "citizen")
    assert res["type"] == "accident"
    assert res["severity"] == 3
    assert res["priority"] == "high"
    assert res["language"] == "en"

@patch('app.services.classifier.get_provider')
def test_classify_exception_triggers_fallback(mock_get_provider):
    # Make the provider raise an exception to simulate downtime
    mock_provider = mock_get_provider.return_value
    mock_provider.classify.side_effect = Exception("LLM is down!")
    
    # It should not crash, but return fallback data
    res = classify("waterlogging in the street", "citizen")
    assert res["type"] == "flood"
    assert res["severity"] == 3
    assert res["priority"] == "high"
    assert res["language"] == "en"