# Mapping of keywords to incident type and severity hints.
# Each entry: "keyword": ("type", severity_score)

GUJARATI_RULES = {
    "પાણી": ("flood", 3),
    "પૂર": ("flood", 4),
    "આગ": ("fire", 4),
    "અકસ્માત": ("accident", 3),
    "મદદ": (None, 1), # generic severity bump
    "બીમાર": ("medical", 3),
    "ઘૂસી": (None, 1) # like water entering
}

HINGLISH_RULES = {
    "paani": ("flood", 3),
    "baarish": ("flood", 2),
    "aag": ("fire", 4),
    "accident": ("accident", 3),
    "madad": (None, 1),
    "bhari gayun": ("flood", 3),
    "bimar": ("medical", 3)
}

ENGLISH_RULES = {
    "flood": ("flood", 4),
    "waterlogging": ("flood", 3),
    "water": ("flood", 2),
    "fire": ("fire", 4),
    "accident": ("accident", 3),
    "crash": ("accident", 3),
    "medical": ("medical", 3),
    "help": (None, 1)
}

def extract_hints(text: str, rules: dict):
    text = text.lower()
    incident_type = "other"
    severity = 1
    
    for kw, (t, sev) in rules.items():
        if kw in text:
            if t and incident_type == "other":
                incident_type = t
            severity = max(severity, sev)
            
    return incident_type, severity