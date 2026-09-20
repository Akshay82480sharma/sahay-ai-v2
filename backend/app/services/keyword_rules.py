# Mapping of keywords to incident type and severity hints.
# Each entry: "keyword": ("type", severity_score)

GUJARATI_RULES = {
    "પાણી": ("flood", 3),
    "પૂર": ("flood", 4),
    "આગ": ("fire", 4),
    "અકસ્માત": ("accident", 3),
    "મદદ": (None, 1), # generic severity bump
    "બીમાર": ("medical", 3),
    "ઘૂસી": (None, 1), # like water entering
    "ધડાકો": ("industrial", 4),
    "ગેસ": ("industrial", 4),
    "ભૂકંપ": ("other", 5),
    "હુમલો": ("medical", 4)
}

HINGLISH_RULES = {
    "paani": ("flood", 3),
    "baarish": ("flood", 2),
    "aag": ("fire", 4),
    "accident": ("accident", 3),
    "madad": (None, 1),
    "bhari gayun": ("flood", 3),
    "bimar": ("medical", 3),
    "gas": ("industrial", 4),
    "leak": ("industrial", 3),
    "blast": ("industrial", 5),
    "chot": ("medical", 2),
    "khoon": ("medical", 3),
    "behosh": ("medical", 4),
    "heart attack": ("medical", 5),
    "current": ("industrial", 4),
    "fas gaye": (None, 2)
}

ENGLISH_RULES = {
    "flood": ("flood", 4),
    "waterlogging": ("flood", 3),
    "water": ("flood", 2),
    "fire": ("fire", 4),
    "accident": ("accident", 3),
    "crash": ("accident", 3),
    "medical": ("medical", 3),
    "help": (None, 1),
    "explosion": ("industrial", 5),
    "leak": ("industrial", 3),
    "injury": ("medical", 3),
    "blood": ("medical", 3),
    "trapped": (None, 3),
    "unconscious": ("medical", 4),
    "factory": ("industrial", 2)
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