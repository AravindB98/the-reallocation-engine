"""requirements.py — the first working slice of the posting-requirements check (Fine Print).

What it does, with no model:
  1. turns a posting's text into lines, keeping bullets and headings;
  2. sorts lines into required, preferred, work conditions, or "section unclear", by declared heading
     patterns. A short un-bulleted line that matches no heading rule is never carried silently into the
     section before it: it and the lines after it are kept and flagged for review (rule R4);
  3. reads experience figures ("5+ years", "three years", "6 months to 2 years"), never a ceiling
     ("up to 2 years") as a minimum. A line that offers alternative paths ("BS + 3 years or MS + 1 year")
     is quoted whole and its path left unresolved; no smallest or largest figure is chosen (R5);
  4. compares each remaining minimum with the documented work history, counted by type (R6):
       employment     a job with no co-op, internship or "needs information" title; its type is not stated
                      (never assumed full-time) unless the résumé gives employment_type
       co-op          counted only when the posting explicitly accepts internships or co-ops
       needs info     research or teaching assistantships, contract, fellowship, part-time, freelance or
                      volunteer work: never counted until supporting information is given
     A line that asks for full-time experience is met only by months stated as full-time (a co-op can be
     full-time too). Overlapping months count once. Projects are never employment duration.
        met          the counted months reach the minimum (its duration only; the kind is not checked)
        gap          even every documented month falls short, so the applicant is shown not to meet it
        unclear      reaching it depends on something unresolved (co-op acceptance, supporting information,
                     full-time status); that becomes the question to ask
  5. marks a required line firm only when its own sentence says so and no negation precedes it
     ("not a firm minimum" is not firm) (R7).
The kind of experience a line asks for is shown, never checked. Degree, skills, sponsorship statements and
new-grad windows are typed proposals in the recipe; their lines are listed as not checked.

Labels: the posting text is `record` when fetched live (saved with its hash) and carries the queue's label
when it is a sample fixture; the documented experience is `record` for a fictional persona file in the repo
and `your-input` for a private profile; everything derived through the declared patterns carries the rules'
label.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path

_TAG_BREAK = re.compile(r"<\s*(?:br|/p|/li|/h[1-6]|/div|/ul|/ol|/tr)\s*/?\s*>", re.I)
_TAG_LI = re.compile(r"<\s*li[^>]*>", re.I)
_TAG_ANY = re.compile(r"<[^>]+>")
_TRAILING = r"\s+(?:of|in|with|using|building|working|as|at|on|doing)$"


def text_lines(content: str) -> list[str]:
    """Posting HTML (Greenhouse 'content', HTML-escaped or not) or plain text -> non-empty lines.
    List items keep a leading '- ' so a bullet can be told from a heading."""
    t = html.unescape(content or "")
    t = _TAG_BREAK.sub("\n", t)
    t = _TAG_LI.sub("\n- ", t)
    t = _TAG_ANY.sub("", t)
    t = html.unescape(t).replace("\xa0", " ")
    lines = []
    for raw in t.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if line.startswith(("•", "·", "*")):
            line = "- " + line[1:].strip()
        if line:
            lines.append(line)
    return lines


def compile_rules(rules: dict) -> dict:
    req = rules["requirements"]
    words = req.get("number_words", {})
    figure = "(" + "|".join([r"\d+", *words]) + ")"
    figures = lambda pats: [re.compile(p.replace(r"(\d+)", figure), re.I) for p in pats]  # noqa: E731
    rx = lambda pats: [re.compile(p, re.I) for p in pats]  # noqa: E731
    h = req["headings"]
    return {
        "number_words": {k.lower(): v for k, v in words.items()},
        "required": rx(h["required"]), "preferred": rx(h["preferred"]),
        "conditions": rx(h.get("conditions", [])), "other": rx(h["other"]),
        "heading_max_words": req["heading_max_words"],
        "years": figures(req["years_patterns"]), "months": figures(req["months_patterns"]),
        "ceiling": (re.compile(r"\b(?:" + "|".join(req["maximum_markers"]) + r")\s*$", re.I)
                    if req.get("maximum_markers") else None),
        "coop": rx(req["coop_title_patterns"]),
        "needs_info": rx(req.get("needs_info_title_patterns", [])),
        "accepts_coop": rx(req.get("accepts_coop_patterns", [])),
        "full_time_line": re.compile(req.get("full_time_line_pattern", r"(?!x)x"), re.I),
        "degree": re.compile(req.get("degree_pattern", r"(?!x)x"), re.I),
        "employment_types": req.get("employment_types", {}),
        "firm": rx(req.get("non_negotiable_patterns", [])),
        "negation": re.compile(req.get("negation_pattern", r"(?!x)x"), re.I),
    }


def heading_kind(line: str, c: dict) -> str | None:
    """'required' | 'preferred' | 'conditions' | 'other' for a known heading, None otherwise."""
    if line.startswith("- "):
        return None
    bare = line.rstrip(":").strip()
    if len(bare.split()) > c["heading_max_words"]:
        return None
    for kind in ("preferred", "conditions", "required", "other"):  # "Preferred qualifications" before "qualifications"
        if any(p.search(bare) for p in c[kind]):
            return kind
    return None


def possible_heading(line: str, c: dict) -> bool:
    """A short un-bulleted line with no sentence ending: it may be a heading the rules don't know."""
    bare = line.rstrip(":").strip()
    return (not line.startswith("- ") and len(bare.split()) <= c["heading_max_words"]
            and not bare.endswith((".", "!", "?")))


def sectioned(lines: list[str], c: dict) -> list[dict]:
    """Each line under a required, preferred or work-conditions heading. An unknown possible heading inside
    a section opens a 'section unclear' run that lasts until the next known heading (rule R4)."""
    out, section, heading = [], None, None
    for i, line in enumerate(lines):
        kind = heading_kind(line, c)
        if kind is not None:
            section = kind if kind in ("required", "preferred", "conditions") else None
            heading = line
            continue
        if section is None:
            continue
        if possible_heading(line, c) and section != "unclear":
            section, heading = "unclear", line
            out.append({"line": i + 1, "section": "unclear", "heading": line, "text": line, "possible_heading": True})
            continue
        out.append({"line": i + 1, "section": section, "heading": heading, "text": line.lstrip("- ").strip()})
    return out


def figures(text: str, c: dict) -> list[tuple[int, str, int]]:
    """Every experience figure in a line as (months, the words that stated it, where they end).
    A figure right after a ceiling word ('up to', 'less than', ...) is a maximum and is skipped."""
    value = lambda g: int(g) if g.isdigit() else c["number_words"][g.lower()]  # noqa: E731
    found = []
    for unit, pats in ((12, c["years"]), (1, c["months"])):
        for p in pats:
            for m in p.finditer(text):
                if c["ceiling"] is not None and c["ceiling"].search(text[:m.start()]):
                    continue
                said = re.sub(_TRAILING, "", m.group(0), flags=re.I)
                found.append((value(m.group(1)) * unit, said, m.start() + len(said)))
    # one entry per stated span: overlapping matches of the same words keep the fullest wording
    found.sort(key=lambda f: (f[2], -len(f[1])))
    unique, seen_ends = [], set()
    for f in found:
        if f[2] not in seen_ends:
            unique.append(f)
            seen_ends.add(f[2])
    return unique


def minimum_months(text: str, c: dict) -> tuple[int, str, int] | None:
    """The smallest figure in a line, with its words and where they end (used when a line has one path)."""
    found = figures(text, c)
    return min(found, key=lambda f: (f[0], -len(f[1]))) if found else None


def kind_asked(text: str, end: int) -> str:
    """The kind of experience the line asks for, after its figure ("in ML infra, research engineering, ...").
    Shown so a person can judge it; never checked (the student's prediction: a duration does not prove the
    months were the kind of work the line asks for)."""
    rest = text[end:].strip(" ,:;-")
    rest = re.sub(r"^of\s+", "", rest, flags=re.I)
    rest = re.sub(r"^(?:(?:professional|industry|hands-on|full-time)\s+)*(?:experience|work)\s+"
                  r"(?=(?:in|with|using|building|on|as|at|doing)\b)", "", rest, flags=re.I)
    return rest.strip(" .;,") or "not stated"


def alternative_paths(text: str, c: dict, n_figures: int) -> bool:
    """R5: 'or' plus a degree word, or 'or' with more than one figure, means more than one path."""
    return bool(re.search(r"\bor\b", text, re.I)) and (bool(c["degree"].search(text)) or n_figures > 1)


def is_firm(text: str, c: dict) -> bool:
    """R7: a firm phrase in the line's own sentence, with no negation before it in that sentence."""
    for p in c["firm"]:
        for m in p.finditer(text):
            sentence_start = max(text.rfind(ch, 0, m.start()) for ch in ".;!?") + 1
            if not c["negation"].search(text[sentence_start:m.start()]):
                return True
    return False


def _months(start: str, end: str | None, as_of: date) -> set[int]:
    y1, m1 = (int(x) for x in start[:7].split("-"))
    if end and re.match(r"^\d{4}-\d{2}", str(end)):
        y2, m2 = (int(x) for x in str(end)[:7].split("-"))
    else:  # "present", empty or missing: up to the run date
        y2, m2 = as_of.year, as_of.month
    return set(range(y1 * 12 + m1, y2 * 12 + m2 + 1))


def job_type(entry: dict, c: dict) -> str:
    """R6: an explicit employment_type wins; otherwise the title decides; never 'full-time' by default."""
    explicit = str(entry.get("employment_type") or "").strip().lower()
    if explicit:
        return c["employment_types"].get(explicit, "needs supporting information")
    title = str(entry.get("title", ""))
    if any(p.search(title) for p in c["coop"]):
        return "co-op/internship"
    if any(p.search(title) for p in c["needs_info"]):
        return "needs supporting information"
    return "employment (type not stated)"


def documented_experience(resume: dict, c: dict, as_of: date) -> dict:
    """Months of documented work by type, overlapping months counted once. Projects are not employment."""
    pools = {"full-time": set(), "employment (type not stated)": set(), "co-op/internship": set(),
             "needs supporting information": set()}
    entries, problems = [], []
    for i, e in enumerate(resume.get("experience") or []):
        title, start = str(e.get("title", "")), e.get("start_date")
        if not start or not re.match(r"^\d{4}-\d{2}", str(start)):
            problems.append(f"experience[{i}] ({title or 'untitled'}) has no start_date (YYYY-MM)")
            continue
        months = _months(str(start), e.get("end_date"), as_of)
        kind = job_type(e, c)
        pools[kind].update(months)
        entries.append({"title": title, "company": e.get("company"), "start": start, "end": e.get("end_date"),
                        "months": len(months), "type": kind,
                        "type_from": "employment_type" if e.get("employment_type") else "title"})
    ft, emp, coop, info = (pools[k] for k in ("full-time", "employment (type not stated)", "co-op/internship",
                                              "needs supporting information"))
    return {"entries": entries, "problems": problems,
            "projects_not_counted": len(resume.get("projects") or []),
            "months_full_time_stated": len(ft),
            "months_employment": len(ft | emp),
            "months_with_coop": len(ft | emp | coop),
            "months_full_time_with_coop": len(ft | coop),
            "months_all": len(ft | emp | coop | info),
            "months_coop": len(coop - ft - emp),
            "months_needs_info": len(info - ft - emp - coop),
            "months_type_not_stated": len(emp - ft)}


def compare(need: int, exp: dict, coop_accepted: bool, full_time_line: bool) -> tuple[str, list[str], int]:
    """(result, what is unresolved, months short). R6 and R7: 'gap' only when every month falls short."""
    base = exp["months_full_time_stated"] if full_time_line else exp["months_employment"]
    with_coop = exp["months_full_time_with_coop"] if full_time_line else exp["months_with_coop"]
    if base >= need or (coop_accepted and with_coop >= need):
        return "met", [], 0
    if exp["months_all"] < need:
        return "gap", [], need - exp["months_all"]
    unresolved = []
    if exp["months_coop"] and not coop_accepted:
        unresolved.append("co-op acceptance")
    if exp["months_needs_info"]:
        unresolved.append("supporting information")
    if full_time_line and exp["months_type_not_stated"]:
        unresolved.append("full-time status")
    return "unclear", unresolved, need - (with_coop if coop_accepted else base)


def check(content: str, resume: dict, rules: dict, as_of: date) -> dict:
    """The requirements check for one posting. Returns items plus a summary; never a score."""
    c = compile_rules(rules)
    exp = documented_experience(resume, c, as_of)
    lines = text_lines(content)
    whole = " ".join(lines)
    posting_accepts_coop = any(p.search(whole) for p in c["accepts_coop"])
    items = []
    for item in sectioned(lines, c):
        if item["section"] == "conditions":
            items.append({**item, "check": None, "result": "condition"})
            continue
        found = figures(item["text"], c)
        if not found:
            items.append({**item, "check": None, "result": "not-checked"})
            continue
        if alternative_paths(item["text"], c, len(found)):
            items.append({**item, "check": "experience-paths", "result": "conditional",
                          "figures": [{"months": f[0], "stated_as": f[1]} for f in found],
                          "stated_as": " / ".join(f[1] for f in found), "kind_asked": "see the whole line",
                          "kind_checked": False, "short_by_months": 0, "non_negotiable": is_firm(item["text"], c)})
            continue
        need, said, end = min(found, key=lambda f: (f[0], -len(f[1])))
        full_time_line = bool(c["full_time_line"].search(item["text"]))
        coop_ok = posting_accepts_coop or any(p.search(item["text"]) for p in c["accepts_coop"])
        result, unresolved, short = compare(need, exp, coop_ok, full_time_line)
        items.append({**item, "check": "minimum-experience", "need_months": need, "stated_as": said,
                      "kind_asked": kind_asked(item["text"], end), "kind_checked": False,
                      "full_time_line": full_time_line, "coop_accepted": coop_ok, "result": result,
                      "degree_named": bool(c["degree"].search(item["text"])),
                      "unresolved": unresolved, "short_by_months": short,
                      "non_negotiable": is_firm(item["text"], c)})
    required = [x for x in items if x["section"] == "required"]
    return {
        "items": items,
        "experience": exp,
        "posting_accepts_coop": posting_accepts_coop,
        "summary": {
            "required_lines": len(required),
            "preferred_lines": sum(1 for x in items if x["section"] == "preferred"),
            "required_gap": [x for x in required if x["result"] == "gap"],
            "required_unclear": [x for x in required if x["result"] == "unclear"],
            "required_conditional": [x for x in required if x["result"] == "conditional"],
            "required_met": [x for x in required if x["result"] == "met"],
            "required_not_checked": sum(1 for x in required if x["result"] == "not-checked"),
            "section_unclear": [x for x in items if x["section"] == "unclear"],
            "work_conditions": [x for x in items if x["section"] == "conditions"],
        },
    }


def read_resume(path: Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))
