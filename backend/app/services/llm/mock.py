from typing import Dict, Any
from . import LLMProvider
from app.services.language import detect_language_and_rules
from app.services.keyword_rules import extract_hints

class MockProvider(LLMProvider):
    def classify(self, text: str, source: str) -> Dict[str, Any]:
        # For mock, we just use the keyword rules to generate a response
        # so it's predictable but looks like a real LLM parsed it.
        lang, rules = detect_language_and_rules(text)
        incident_type, severity = extract_hints(text, rules)
        
        return {
            "type": incident_type,
            "severity": severity,
            "priority": "critical" if severity >= 4 else "high" if severity == 3 else "medium" if severity == 2 else "low",
            "location_name": None,
            "summary": f"{incident_type.capitalize()} reported (severity {severity}): {text[:30]}...",
            "required_resources": [{"type": "ambulance", "count": 1}] if severity > 2 else [],
            "language": lang,
            "is_likely_false": False
        }