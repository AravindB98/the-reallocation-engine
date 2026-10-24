#!/usr/bin/env python3
"""build_roles.py — SWE/AI/DevOps H-1B sponsor + funding triage (recipe
swe-ai-devops-sponsor-triage). Reads the 80-Days-to-Stay CSV (company-level
funding + H-1B sponsorship history, already joined), filters to companies with
a real sponsorship record and a title match for Software Engineer / AI /
DevOps roles, and writes a roles.json shaped for the existing Bayesian role
scorer (scripts/score/role-scorer.mjs).

Every evidence value is labeled "record" (read verbatim from the CSV),
"model-judgment" (the title-keyword match), or "your-input" (the OPT end date
and the hiring-lag assumption).

Liveness is a gate, and this script never invents it. A role reaches the scorer
only if its posting was actually checked with `npm run ats:liveness` and the
saved terminal output says "active" (factor 1.0, record) or "expired" (factor
0.0, record, so the scorer gates it to Skip). Every other role is held out of
the scorer and listed, with the reason, in held-out.json (for the agent) and
held-out.md (for the person). The scorer would otherwise default a missing
liveness factor to 1 (fully live), so omitting it is not an option either.

When the checker returns "uncertain", a named person may open the page and
record a gate decision (gate-decisions.csv). Only then does that role go to the
scorer, with the human's decision labeled your-input, never record.

Usage:
  python3 build_roles.py [--csv PATH] [--soc-csv PATH] [--opt-end-date YYYY-MM-DD]
                          [--hiring-lag-days N] [--out-dir DIR] [--limit N]
                          [--posting-urls CSV --liveness-log TXT]
                          [--gate-decisions CSV]
"""
import argparse
import csv
import json
import os
import re
import sys
from datetime import date, datetime

DEFAULT_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
DEFAULT_SOC_CSV = "data/bls/compact/soc_occupation_compact.csv"
TECH_INDUSTRIES = {"Other Technology", "Computers"}
DEFAULT_OPT_END_DATE = "2027-03-15"
DEFAULT_HIRING_LAG_DAYS = 45

# Target SOC codes for this student's situation (Software Developers; Computer
# Occupations All Other, which includes the "Artificial Intelligence
# Specialist" alternate title; Network and Computer Systems Administrators,
# DevOps-adjacent).
TARGET_SOC_CODES = ["15-1252", "15-1299", "15-1244"]

# Keyword -> SOC code this title most plausibly maps to, for the role_quality
# lookup (context only; role_quality carries zero weight in the scorer today).
# Matching is word-boundary-aware to avoid short-substring false positives
# (e.g. a naive "ai" match hitting "Maintenance" or "Claims").
KEYWORD_SOC = [
    (r"\bdevops\b", "15-1244"),
    (r"\bsite reliability\b", "15-1244"),
    (r"\bsre\b", "15-1244"),
    (r"\bsystems? admin", "15-1244"),
    (r"\bplatform engineer", "15-1244"),
    (r"\bmachine learning\b", "15-1299"),
    (r"\bml engineer\b", "15-1299"),
    (r"\bartificial intelligence\b", "15-1299"),
    (r"\bai engineer\b", "15-1299"),
    (r"\bai\b", "15-1299"),
    (r"\bmlops\b", "15-1299"),
    (r"\bsoftware engineer", "15-1252"),
    (r"\bsoftware developer", "15-1252"),
    (r"\bbackend engineer", "15-1252"),
    (r"\bfull.?stack engineer", "15-1252"),
    (r"\bmobile engineer", "15-1252"),
]
KEYWORD_SOC_COMPILED = [(re.compile(pat, re.IGNORECASE), soc) for pat, soc in KEYWORD_SOC]


def classify_titles(top_job_titles_sponsored):
    """Return (matched: bool, matched_titles: list[str], soc_code: str|None).
    Model-judgment: a keyword/word-boundary string match, not a semantic one.
    """
    if not top_job_titles_sponsored or not top_job_titles_sponsored.strip():
        return False, [], None
    # Field is stored as a Python-list-literal string, e.g. "['Senior Software Engineer']".
    titles = re.findall(r"'([^']*)'|\"([^\"]*)\"", top_job_titles_sponsored)
    titles = [a or b for a, b in titles]
    if not titles:
        titles = [top_job_titles_sponsored]
    matched_titles = []
    matched_soc = None
    for title in titles:
        for pattern, soc in KEYWORD_SOC_COMPILED:
            if pattern.search(title):
                matched_titles.append(title)
                if matched_soc is None:
                    matched_soc = soc
                break
    return (len(matched_titles) > 0), matched_titles, matched_soc


def sponsorship_tier(approval_rate):
    if approval_rate >= 80:
        return "Proven"
    if approval_rate >= 50:
        return "Likely"
    if approval_rate > 0:
        return "Possible"
    return "None"


def safe_float(x, default=None):
    try:
        if x is None or x == "":
            return default
        return float(x)
    except (ValueError, TypeError):
        return default


def load_soc_quality(soc_csv_path):
    """Map SOC code -> {annual_median_wage, cognitive_pivot_score} (record)."""
    quality = {}
    if not os.path.exists(soc_csv_path):
        return quality
    with open(soc_csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            soc = row.get("bls_soc_code", "")
            if soc in TARGET_SOC_CODES and soc not in quality:
                quality[soc] = {
                    "annual_median_wage": safe_float(row.get("annual_median_wage")),
                    "cognitive_pivot_score": safe_float(row.get("cognitive_pivot_score")),
                }
    return quality


def compute_timeline_factor(opt_end_date_str, hiring_lag_days, today=None):
    """your-input: opt_end_date composed with a disclosed hiring-lag assumption.
    Returns (factor, days_remaining). factor=0 when opt_end_date is already past —
    never clamped up to a fake positive number.
    """
    today = today or date.today()
    opt_end = datetime.strptime(opt_end_date_str, "%Y-%m-%d").date()
    days_remaining = (opt_end - today).days
    if days_remaining <= 0:
        return 0.0, days_remaining
    factor = min(1.0, days_remaining / float(hiring_lag_days))
    return round(factor, 4), days_remaining


LIVENESS_LINE = re.compile(r"\b(active|expired|uncertain)\s+(https?://\S+)")


def load_posting_urls(path):
    """your-input: company_name -> {url, posting_title} of the posting chosen to check."""
    urls = {}
    if not path:
        return urls
    if not os.path.exists(path):
        print(f"ERROR: posting-URL file not found: {path}", file=sys.stderr)
        sys.exit(2)
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            company = (row.get("company_name") or "").strip()
            url = (row.get("url") or "").strip()
            if company and url:
                urls[company] = {"url": url, "posting_title": (row.get("posting_title") or "").strip() or None}
    return urls


def parse_liveness_log(path):
    """record: url -> active|expired|uncertain, read from the saved stdout of
    `npm run ats:liveness -- <url> ...` (lines like '✅ active     https://...')."""
    results = {}
    if not path:
        return results
    if not os.path.exists(path):
        print(f"ERROR: liveness log not found: {path}", file=sys.stderr)
        sys.exit(2)
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = LIVENESS_LINE.search(line)
            if m:
                results[m.group(2)] = m.group(1)
    return results


def load_gate_decisions(path):
    """your-input: url -> a named person's decision on a posting the checker could not judge."""
    decisions = {}
    if not path:
        return decisions
    if not os.path.exists(path):
        print(f"ERROR: gate-decisions file not found: {path}", file=sys.stderr)
        sys.exit(2)
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            url = (row.get("url") or "").strip()
            decision = (row.get("decision") or "").strip()
            decided_by = (row.get("decided_by") or "").strip()
            if url and decision in ("active", "expired") and decided_by:
                decisions[url] = {
                    "decision": decision,
                    "decided_by": decided_by,
                    "date": (row.get("date") or "").strip(),
                    "evidence": (row.get("evidence") or "").strip(),
                    "note": (row.get("note") or "").strip(),
                }
    return decisions


def liveness_for(company, posting_urls, liveness_results, log_path, gate_decisions=None, decisions_path=None):
    """Return (liveness dict, None) for a checked posting, or (None, reason) to hold it out."""
    chosen = posting_urls.get(company)
    if not chosen:
        return None, "liveness not checked: no posting URL chosen for this company"
    url = chosen["url"]
    result = liveness_results.get(url)
    if result is None:
        return None, f"liveness not checked: {url} is not in the liveness log"
    if result == "uncertain":
        human = (gate_decisions or {}).get(url)
        if not human:
            return None, f"liveness uncertain for {url}: the checker could not confirm it is open"
        # a named person opened the page and decided; label it as their judgment, not a record
        return {
            "factor": 1.0 if human["decision"] == "active" else 0.0,
            "source": "your-input",
            "result": "uncertain",
            "gate_decision": human["decision"],
            "decided_by": human["decided_by"],
            "decided_on": human["date"],
            "decision_evidence": human["evidence"],
            "decision_note": human["note"],
            "url": url,
            "posting_title": chosen["posting_title"],
            "evidence": [log_path, decisions_path],
        }, None
    return {
        "factor": 1.0 if result == "active" else 0.0,
        "source": "record",
        "result": result,
        "url": url,
        "posting_title": chosen["posting_title"],
        "evidence": log_path,
    }, None


def build_roles(csv_path, soc_csv_path, opt_end_date, hiring_lag_days, limit=None,
                posting_urls_path=None, liveness_log_path=None, gate_decisions_path=None):
    if not os.path.exists(csv_path):
        print(f"ERROR: source CSV not found: {csv_path}", file=sys.stderr)
        sys.exit(2)

    soc_quality = load_soc_quality(soc_csv_path)
    timeline_factor, days_remaining = compute_timeline_factor(opt_end_date, hiring_lag_days)
    posting_urls = load_posting_urls(posting_urls_path)
    liveness_results = parse_liveness_log(liveness_log_path)
    gate_decisions = load_gate_decisions(gate_decisions_path)

    roles = []
    held_out = []
    counts = {
        "rows_read": 0,
        "skipped_wrong_industry": 0,
        "skipped_no_approvals": 0,
        "skipped_no_titles": 0,
        "skipped_no_title_match": 0,
        "emitted": 0,
        "liveness_checked": 0,
        "held_out_liveness": 0,
    }

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            counts["rows_read"] += 1

            if row.get("industry") not in TECH_INDUSTRIES:
                counts["skipped_wrong_industry"] += 1
                continue

            approvals = safe_float(row.get("Total Approvals"), default=0.0) or 0.0
            if approvals <= 0:
                counts["skipped_no_approvals"] += 1
                continue

            titles_field = row.get("top_job_titles_sponsored", "")
            if not titles_field or not titles_field.strip():
                counts["skipped_no_titles"] += 1
                continue

            matched, matched_titles, matched_soc = classify_titles(titles_field)
            if not matched:
                counts["skipped_no_title_match"] += 1
                continue

            approval_rate = safe_float(row.get("Approval_Rate"), default=0.0) or 0.0
            tier = sponsorship_tier(approval_rate)
            fit_p = round(min(1.0, 0.5 + 0.15 * len(matched_titles)), 4)

            role = {
                "role_id": re.sub(r"[^a-z0-9]+", "-", row["company_name"].lower()).strip("-"),
                "company": row["company_name"],
                "title": matched_titles[0],
                "sponsorship": {
                    "p": round(approval_rate / 100.0, 4),
                    "tier": tier,
                    "source": "record",
                    "approvals": approvals,
                    "denials": safe_float(row.get("Total Denials"), default=0.0),
                },
                "fit": {
                    "p": fit_p,
                    "source": "model-judgment",
                    "matched_titles": matched_titles,
                },
                "timeline": {
                    "factor": timeline_factor,
                    "source": "your-input",
                    "opt_end_date": opt_end_date,
                    "hiring_lag_days_assumed": hiring_lag_days,
                    "days_remaining": days_remaining,
                },
                "funding": {
                    "latest_funding_stage": row.get("latest_funding_stage") or None,
                    "latest_funding_date": row.get("latest_funding_date") or None,
                    "total_funding": safe_float(row.get("total_funding")),
                    "source": "record",
                },
            }
            if matched_soc and matched_soc in soc_quality:
                role["role_quality"] = {
                    **soc_quality[matched_soc],
                    "soc_code": matched_soc,
                    "source": "record",
                    "note": "context only — role_quality carries zero weight in scripts/score/role-scorer.mjs today",
                }
            else:
                role["role_quality_status"] = "no-soc-match"

            counts["emitted"] += 1
            liveness, reason = liveness_for(row["company_name"], posting_urls, liveness_results,
                                            liveness_log_path, gate_decisions, gate_decisions_path)
            if liveness is None:
                # keep the checked evidence so a person can review it; only liveness is missing
                held_out.append({**role, "reason": reason})
                counts["held_out_liveness"] += 1
            else:
                role["liveness"] = liveness
                # the role to apply to is the checked posting; the sponsored titles stay as fit evidence
                if liveness["posting_title"]:
                    role["sponsored_title_example"] = role["title"]
                    role["title"] = liveness["posting_title"]
                roles.append(role)
                counts["liveness_checked"] += 1

            if limit is not None and counts["emitted"] >= limit:
                break

    return roles, held_out, counts


def render_held_out_md(held_out, counts):
    lines = [
        "# Held out: liveness not checked",
        "",
        "## Executive summary",
        "",
        f"These {len(held_out)} roles passed the sponsorship and job-title filters but were not scored, "
        "because nobody has checked whether their job posting is real and still open. "
        "Liveness is a gate, so a role with an unchecked posting is held out instead of being given a guessed value. "
        f"{counts['liveness_checked']} role(s) had a checked posting and went to the scorer.",
        "",
        "To score a held-out role: pick its posting URL, run the liveness checker on it, save the output, and re-run.",
        "",
        "## Roles held out",
        "",
        "| Company | Matched title | Why held out |",
        "|---|---|---|",
    ]
    for h in held_out:
        lines.append(f"| {h['company']} | {h['title']} | {h['reason']} |")
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", default=DEFAULT_CSV)
    ap.add_argument("--soc-csv", default=DEFAULT_SOC_CSV)
    ap.add_argument("--opt-end-date", default=DEFAULT_OPT_END_DATE)
    ap.add_argument("--hiring-lag-days", type=int, default=DEFAULT_HIRING_LAG_DAYS)
    ap.add_argument("--out-dir", required=True, help="never a tracked repo path")
    ap.add_argument("--limit", type=int, default=None, help="cap number of emitted roles")
    ap.add_argument("--posting-urls", default=None, help="CSV company_name,url of postings you chose to check (your-input)")
    ap.add_argument("--liveness-log", default=None, help="saved stdout of npm run ats:liveness for those URLs (record)")
    ap.add_argument("--gate-decisions", default=None, help="CSV of named human decisions on uncertain postings (your-input)")
    args = ap.parse_args()

    roles, held_out, counts = build_roles(
        args.csv, args.soc_csv, args.opt_end_date, args.hiring_lag_days, args.limit,
        args.posting_urls, args.liveness_log, args.gate_decisions,
    )

    os.makedirs(args.out_dir, exist_ok=True)
    out_path = os.path.join(args.out_dir, "roles.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(roles, f, indent=2)
    with open(os.path.join(args.out_dir, "held-out.json"), "w", encoding="utf-8") as f:
        json.dump({"reason": "liveness gate: posting not checked", "count": len(held_out), "roles": held_out}, f, indent=2)
    with open(os.path.join(args.out_dir, "held-out.md"), "w", encoding="utf-8") as f:
        f.write(render_held_out_md(held_out, counts))

    print(f"rows_read={counts['rows_read']}")
    print(f"skipped_wrong_industry={counts['skipped_wrong_industry']}")
    print(f"skipped_no_approvals={counts['skipped_no_approvals']}")
    print(f"skipped_no_titles={counts['skipped_no_titles']}")
    print(f"skipped_no_title_match={counts['skipped_no_title_match']}")
    print(f"emitted={counts['emitted']}")
    print(f"liveness_checked={counts['liveness_checked']}")
    print(f"held_out_liveness_unchecked={counts['held_out_liveness']}")
    print(f"wrote {out_path} ({len(roles)} roles for the scorer)")
    print(f"wrote {os.path.join(args.out_dir, 'held-out.json')} and held-out.md ({len(held_out)} held out)")
    if counts["emitted"] == 0:
        print("WARNING: zero roles emitted — check source CSV and keyword list", file=sys.stderr)


if __name__ == "__main__":
    main()
