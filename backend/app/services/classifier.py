import logging
from typing import Dict, Any
from app.services.llm import get_provider
from app.services.language import detect_language_and_rules
from app.services.keyword_rules import extract_hints

logger = logging.getLogger(__name__)

def calculate_priority(severity: int) -> str:
    if severity >= 4:
        return "critical"
    elif severity == 3:
        return "high"
    elif severity == 2:
        return "medium"
    return "low"

def classify(text: str, source: str) -> Dict[str, Any]:
    """
    Attempts to classify using the configured LLM provider.
    Falls back to keyword rules if the LLM fails or times out.
    """
    try:
        provider = get_provider()
        return provider.classify(text, source)
    except Exception as e:
        logger.error(f"LLM Provider failed: {str(e)}. Falling back to keyword rules.")
        return fallback_classify(text, source)

def fallback_classify(text: str, source: str) -> Dict[str, Any]:
    lang, rules = detect_language_and_rules(text)
    incident_type, severity = extract_hints(text, rules)
    
    type_str = incident_type.replace('_', ' ').capitalize() if incident_type != "other" else "Unknown incident"
    pri_str = calculate_priority(severity).capitalize()
    summary = f"{pri_str} priority {type_str} reported. Original text: {text[:100]}{'...' if len(text)>100 else ''}"
    
    return {
        "type": incident_type,
        "severity": severity,
        "priority": calculate_priority(severity),
        "location_name": None,
        "summary": summary,
        "required_resources": [],
        "language": lang,
        "is_likely_false": False
    }