import re
from .keyword_rules import GUJARATI_RULES, HINGLISH_RULES, ENGLISH_RULES

def detect_language_and_rules(text: str):
    """
    Detect language based on unicode ranges and keywords.
    Returns: (language_code, rules_dict)
    """
    # Gujarati Unicode Range: 0A80-0AFF
    if re.search(r'[\u0A80-\u0AFF]', text):
        return "gu", GUJARATI_RULES
    
    # Devanagari (Hindi) Unicode Range: 0900-097F
    if re.search(r'[\u0900-\u097F]', text):
        return "hi", HINGLISH_RULES # Reusing hinglish logic/keywords for Hindi or create specific if needed
    
    text_lower = text.lower()
    
    # Check Hinglish keywords
    for kw in HINGLISH_RULES.keys():
        if kw in text_lower and kw not in ENGLISH_RULES:
            return "hi-Latn", HINGLISH_RULES
            
    # Default to English
    return "en", ENGLISH_RULES