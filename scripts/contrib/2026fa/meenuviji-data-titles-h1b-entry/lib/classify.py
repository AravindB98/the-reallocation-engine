"""Title classification and sponsorship tier (CHANGE-BRIEF §5b-§5d, decisions Q5 and Q8).
Every threshold, token list and p value comes from rules.json."""
import ast
import re

from . import RunFailure


def tokens(title):
    return re.findall(r"[a-z0-9]+", title.lower())


def data_phrase(title, phrases):
    """First allowlist phrase found as a case-insensitive substring, else None."""
    t = title.lower()
    for p in phrases:
        if p.lower() in t:
            return p
    return None


def bucket(title, seniority):
    """Returns (bucket, [markers that fired]). Whole-token matching; first bucket in
    bucket_precedence that has a marker wins; no marker at all = entry-or-unmarked/'unmarked'."""
    toks = tokens(title)
    tokset = set(toks)
    padded = " " + " ".join(toks) + " "
    levels = seniority["level_tokens"]
    fired = {"senior": [], "mid": [], "entry-or-unmarked": []}
    fired["senior"] += [w for w in seniority["senior_words"] if w in tokset]
    fired["senior"] += [f"level {t}" for t in toks if t in levels.get("senior", [])]
    fired["senior"] += [f"level {t}" for t in toks if t.isdigit() and int(t) >= seniority["senior_min_level_number"]]
    fired["mid"] += [f"level {t}" for t in toks if t in levels.get("mid", [])]
    fired["entry-or-unmarked"] += [w for w in seniority["entry_words"] if w in tokset]
    fired["entry-or-unmarked"] += [p for p in seniority["entry_phrases"] if " " + p.lower() + " " in padded]
    fired["entry-or-unmarked"] += [f"level {t}" for t in toks if t in levels.get("entry-or-unmarked", [])]
    for b in seniority["bucket_precedence"]:
        if fired.get(b):
            return b, fired[b]
    return "entry-or-unmarked", ["unmarked"]


def parse_titles(raw, company):
    try:
        v = ast.literal_eval(raw)
    except (ValueError, SyntaxError) as e:
        raise RunFailure(f"top_job_titles_sponsored for '{company}' does not parse: {e}")
    if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
        raise RunFailure(f"top_job_titles_sponsored for '{company}' is not a list of strings")
    return v


def _num(x, field, company):
    try:
        return float(x)
    except (TypeError, ValueError):
        raise RunFailure(f"'{field}' for '{company}' is not a number: {x!r}")


def evidence(row, rules):
    """Record values from the matched CSV row + the rule applied to them."""
    company = row["company_name"]
    has_record = bool((row["Total Approvals"] or "").strip())
    ev = {"has_sponsorship_record": has_record, "total_approvals": None, "total_denials": None,
          "approval_rate": None, "median_salary_offered": None, "titles": []}
    if has_record:
        ev["total_approvals"] = _num(row["Total Approvals"], "Total Approvals", company)
        ev["total_denials"] = _num(row["Total Denials"], "Total Denials", company)
        ev["approval_rate"] = _num(row["Approval_Rate"], "Approval_Rate", company)
        ev["median_salary_offered"] = (row.get("median_salary_offered") or "").strip() or None
        for t in parse_titles(row["top_job_titles_sponsored"], company):
            phrase = data_phrase(t, rules["data_family_phrases"])
            b, markers = bucket(t, rules["seniority"])
            ev["titles"].append({"title": t, "data_family": phrase is not None, "matched_phrase": phrase,
                                 "bucket": b if phrase else None, "markers": markers if phrase else []})
    return ev


def _condition(name, ev, rules):
    data = [t for t in ev["titles"] if t["data_family"]]
    if name == "no_sponsorship_record":
        return not ev["has_sponsorship_record"]
    if name == "no_data_family_title":
        return not data
    if name == "entry_or_unmarked_title_and_min_approvals":
        return (any(t["bucket"] == "entry-or-unmarked" for t in data)
                and ev["total_approvals"] is not None
                and ev["total_approvals"] >= rules["min_approvals_for_proven"])
    if name == "otherwise":
        return True
    raise RunFailure(f"rules.json tier_precedence: unknown condition '{name}'")


def tier(ev, rules):
    for step in rules["tier_precedence"]:
        if _condition(step["condition"], ev, rules):
            return {"rule_id": step["id"], "tier": step["tier"], "p": step["p"]}
    raise RunFailure("rules.json tier_precedence: no rule matched (add an 'otherwise' rule)")


EVIDENCE_GROUPS = ("no-record", "no-data-title", "proven", "entry-under-min-approvals", "only-mid", "only-senior")


def evidence_group(ev, rules):
    """Which of the six evidence groups a company's record falls in (Revision: sampling by
    evidence, not tier). Several groups share a tier; the group says *why*."""
    data = [t for t in ev["titles"] if t["data_family"]]
    if not ev["has_sponsorship_record"]:
        return "no-record"
    if not data:
        return "no-data-title"
    buckets = {t["bucket"] for t in data}
    if "entry-or-unmarked" in buckets:
        return ("proven" if ev["total_approvals"] >= rules["min_approvals_for_proven"]
                else "entry-under-min-approvals")
    return "only-mid" if "mid" in buckets else "only-senior"
