#!/usr/bin/env python3
"""seniority-gate.py — does the posting BODY contradict a junior-looking TITLE?

Titles mislead ("Analytics Engineer" whose body says "We're looking for a Senior
Analytics Engineer ... 5+ years of experience"). This reads the posting text and reports,
with quoted snippets, what the body says about experience and seniority. Pure regex:
no network, no LLM.

Input: a text file whose FIRST LINE is the job title and whose remaining lines are the
posting body (the format used by the worked run).

Checks (statuses: flag | pass | no_statement):
  experience  numbers followed by years/months that sit next to the word "experience"
              ("5+ years of experience", "36 months of experience", "three (3) years of
              experience", ranges like "2-4 years"). The REQUIREMENT is the lower bound.
              minimum >= --flag-years (default 3)                      -> flag
  title-body  the title appears in the body with a senior prefix
              ("Senior <title>", "Staff <title>", ...) while the title itself has none -> flag
  title       the title itself carries a senior marker                 -> flag

No experience statement and no senior wording -> no_statement. That is ABSENCE of
evidence, never evidence that the role is entry-level.

WHAT THIS CANNOT DO: judge what a requirement really means (companies hire below their
stated years), read requirements written as images/PDFs, or catch seniority expressed
only in prose with no number and no title prefix ("you will own our data strategy").

Usage:
  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.py <posting.txt> [--flag-years 3] [--json out.json]
Exit: 0 no flag; 1 flagged (a human must read the snippets); 2 bad input.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

FLAG_YEARS = 3.0  # [DEFINE] a stated minimum of 3+ years is not an entry-level requirement; a floor, not a theory.
SENIOR_WORDS = r"(?:senior|sr\.?|staff|lead|principal)"
TITLE_SENIOR_RE = re.compile(r"\b(?:senior|sr|staff|lead|principal|manager|director|head|vp|iii|iv)\b", re.I)
NUM_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
# order matters: ranges first so "2-4 years" is read as a range, not as "4 years"
RANGE_RE = re.compile(r"(\d+)\s*(?:-|–|to)\s*(\d+)\s*\+?\s*(years?|yrs?)\b", re.I)
NUM_RE = re.compile(r"(?<![\d.])(\d+)\s*\+?\s*(years?|yrs?|months?)\b", re.I)
PAREN_RE = re.compile(r"\((\d+)\)\s*(years?|yrs?)\b", re.I)
NEAR = re.compile(r"experience", re.I)


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.replace("’", "'")).strip()


def near_experience(text: str, start: int, end: int) -> bool:
    """'experience' must sit right next to the number: within 80 chars after or 40 before."""
    return bool(NEAR.search(text[end:end + 80]) or NEAR.search(text[max(0, start - 40):start]))


def experience_requirements(text: str) -> list[dict]:
    found, taken = [], []
    for m in RANGE_RE.finditer(text):
        if near_experience(text, m.start(), m.end()):
            found.append({"min_years": float(m.group(1)), "max_years": float(m.group(2)), "snippet": norm(text[max(0, m.start() - 30):m.end() + 60])})
            taken.append((m.start(), m.end()))
    for rx in (PAREN_RE, NUM_RE):
        for m in rx.finditer(text):
            if any(a <= m.start() < b for a, b in taken):
                continue
            if not near_experience(text, m.start(), m.end()):
                continue
            n = float(m.group(1))
            years = n / 12.0 if m.group(2).lower().startswith("month") else n
            found.append({"min_years": round(years, 2), "max_years": None, "snippet": norm(text[max(0, m.start() - 30):m.end() + 60])})
            taken.append((m.start(), m.end()))
    return found


def analyse(text: str, flag_years: float = FLAG_YEARS) -> dict:
    lines = text.splitlines()
    if not lines or not lines[0].strip():
        raise ValueError("first line must be the job title")
    title = norm(lines[0])
    body = "\n".join(lines[1:])
    reqs = experience_requirements(body)
    checks = []

    if reqs:
        top = max(reqs, key=lambda r: r["min_years"])
        st = "flag" if top["min_years"] >= flag_years else "pass"
        checks.append({"check": "experience", "status": st,
                       "detail": f"highest stated minimum = {top['min_years']:g} years (threshold {flag_years:g})",
                       "snippets": [r["snippet"] for r in reqs]})
    else:
        checks.append({"check": "experience", "status": "no_statement", "detail": "no 'N years/months of experience' statement found", "snippets": []})

    core = re.sub(r"\b(?:senior|sr\.?|staff|lead|principal)\b\s*", "", title, flags=re.I).strip(" ,-")
    title_has_senior = bool(TITLE_SENIOR_RE.search(title))
    body_hits = []
    if core and not title_has_senior:
        for m in re.finditer(rf"\b{SENIOR_WORDS}\s+{re.escape(core)}", body, re.I):
            body_hits.append(norm(body[max(0, m.start() - 30):m.end() + 40]))
    if body_hits:
        checks.append({"check": "title-body", "status": "flag", "detail": f"title '{title}' has no senior marker but the body says a senior version of it", "snippets": body_hits})
    else:
        checks.append({"check": "title-body", "status": "pass" if not title_has_senior else "no_statement", "detail": "no senior-prefixed copy of the title in the body", "snippets": []})

    if title_has_senior:
        checks.append({"check": "title", "status": "flag", "detail": f"title '{title}' itself carries a senior marker", "snippets": []})
    else:
        checks.append({"check": "title", "status": "pass", "detail": "no senior marker in the title", "snippets": []})

    flagged = [c for c in checks if c["status"] == "flag"]
    # no flag and no experience statement = ABSENCE of evidence; never reported as "pass"
    overall = "flag" if flagged else ("no_statement" if checks[0]["status"] == "no_statement" else "pass")
    return {"schema": "seniority-gate/1", "title": title, "flag_years": flag_years, "overall": overall, "checks": checks}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("posting")
    ap.add_argument("--flag-years", type=float, default=FLAG_YEARS)
    ap.add_argument("--json", default=None)
    a = ap.parse_args()
    try:
        rep = analyse(Path(a.posting).read_text(encoding="utf-8"), a.flag_years)
    except (OSError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if a.json:
        Path(a.json).write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8")
    print(f"seniority-gate: {rep['title']!r} -> {rep['overall']}")
    for c in rep["checks"]:
        print(f"  {c['status']:<12} {c['check']:<11} {c['detail']}")
        for sn in c["snippets"]:
            print(f"               \"...{sn}...\"")
    return 1 if rep["overall"] == "flag" else 0


if __name__ == "__main__":
    sys.exit(main())
