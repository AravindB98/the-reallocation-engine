"""families.py — the shared, inspectable rules for swe-ai-devops-skill-gap.

Every rule here is `your-input` (a documented choice), not a verified taxonomy.
A job title is assigned to ONE family, checked in this order: AI engineer, then
DevOps/SRE, then software engineer, so "Software Engineer, Machine Learning"
counts as AI engineer. Assigning a family from a title is a `model-judgment`.
"""
import re

FAMILIES = ["swe", "ai", "devops"]
FAMILY_LABELS = {"swe": "Software engineer", "ai": "AI engineer", "devops": "DevOps / SRE / platform"}

# checked in this order; the first family that matches wins
FAMILY_PATTERNS = [
    ("ai", re.compile(
        r"\b(ai|ml|machine learning|deep learning|llm|genai|generative ai|mlops)\b.*\b(engineer|developer)\b"
        r"|\b(engineer|developer)\b.*\b(ai|ml|machine learning|llm|genai|generative ai|mlops)\b", re.I)),
    ("devops", re.compile(
        r"\bdevops\b|site reliability|\bsre\b|platform engineer|infrastructure engineer|cloud engineer"
        r"|production engineer|reliability engineer|release engineer|build engineer", re.I)),
    ("swe", re.compile(
        r"software engineer|software developer|software development engineer|back-?end engineer"
        r"|full[- ]?stack|front-?end engineer|mobile engineer|ios engineer|android engineer", re.I)),
]

# a posting counts as US if any of its locations matches this
US_LOCATION = re.compile(
    r"united states|\bU\.?S\.?A?\b|\bremote,? (us|usa|united states)\b|\bremote - (us|usa|united states)\b"
    r"|,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b"
    r"|\b(new york|san francisco|seattle|boston|austin|chicago|denver|atlanta|los angeles|mountain view|palo alto"
    r"|sunnyvale|san jose|san mateo|menlo park|foster city|redwood city|bellevue|cambridge, ma|washington, dc)\b",
    re.I)

SENIOR = re.compile(r"\b(senior|staff|principal|lead|manager|director|head of|sr\.?|iii|iv|architect|distinguished)\b", re.I)


def family_of(title):
    """`model-judgment`: the family a job title belongs to, or None."""
    for family, pattern in FAMILY_PATTERNS:
        if pattern.search(title or ""):
            return family
    return None


def is_us(location):
    return bool(US_LOCATION.search(location or ""))


def is_senior(title):
    return bool(SENIOR.search(title or ""))
