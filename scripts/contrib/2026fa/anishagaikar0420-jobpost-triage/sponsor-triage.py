#!/usr/bin/env python3
"""sponsor-triage.py — gate one company against the 80 Days to Stay dataset.

Answers, from the committed CSV only (no network, no LLM): does this company have a
sponsorship record, is it evidenced for MY role family, how old is the funding signal
relative to the data snapshot AND to today, and how much visa runway is left?

Gates are HARD STOPS, not votes. Status per gate: pass | flag | stop.
  G1 snapshot-age   data snapshot older than --max-snapshot-days  -> stop (refuse)
  G2 company-match  exactly one exact-normalized match            -> else stop
  G3 sponsor-record Total Approvals present                       -> else flag (no_record)
  G4 role-family    a sponsored title contains a role keyword     -> else flag
  G5 timeline       --opt-end in the future with >= --min-runway-days -> else flag/stop

It never emits a composite score. Tier -> probability is undefined in this repo
(recipes/case-msis-bi-analyst-sponsor-triage.md, TODO DEFINE), so a score would
be invented.

Usage:
  python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company "Cohere Health" --opt-end 2027-05-31 \
      [--today YYYY-MM-DD] [--csv PATH] [--keywords "machine learning,data scientist"] \
      [--json out.json] [--md out.md]

Exit code: 0 = ran to completion (gates may be flag); 2 = a gate STOPPED the run.
"""
from __future__ import annotations

import argparse
import ast
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

DEFAULT_CSV = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
# Default role family: BI / analyst titles. Switch with --keywords (e.g. AI: "machine learning,data scientist,ai engineer,applied scientist,prompt,nlp,llm").
DEFAULT_KEYWORDS = "business intelligence,bi analyst,bi developer,data analyst,business analyst,systems analyst,reporting analyst,analytics analyst,insights analyst"
LEGAL_SUFFIXES = {"INC", "LLC", "CORP", "CORPORATION", "LTD", "CO", "COMPANY", "LP", "LLP", "PBC"}

# [DEFINE] thresholds — authorial choices, not statistical facts (see recipe §Gates).
MAX_SNAPSHOT_DAYS = 730
WARN_SNAPSHOT_DAYS = 365
MIN_RUNWAY_DAYS = 90
SENIOR_RE = re.compile(r"\b(senior|sr|staff|lead|principal|manager|director|head|vp|iii|iv)\b", re.I)


def normalize(name: str) -> str:
    """Deterministic, inspectable: uppercase, drop punctuation, drop trailing legal suffix.
    No fuzzy matching — a near-miss must fail rather than silently pick a different company."""
    s = re.sub(r"[^A-Z0-9 ]", " ", name.upper().replace("&", " AND "))
    toks = s.split()
    while toks and toks[-1] in LEGAL_SUFFIXES:
        toks.pop()
    return " ".join(toks)


def parse_titles(raw: str) -> list[str]:
    raw = (raw or "").strip()
    if not raw:
        return []
    try:
        val = ast.literal_eval(raw)
        return [str(t).strip() for t in val] if isinstance(val, (list, tuple)) else [str(val)]
    except (ValueError, SyntaxError):
        return [raw]


def num(x: str):
    x = (x or "").strip()
    try:
        return float(x)
    except ValueError:
        return None


def iso(x: str):
    try:
        return date.fromisoformat((x or "").strip())
    except ValueError:
        return None


def build(args) -> dict:
    today = date.fromisoformat(args.today) if args.today else date.today()
    rec = {
        "schema": "sponsor-triage/1",
        "run_date": today.isoformat(),
        "inputs": {"company": args.company, "csv": args.csv, "opt_end": args.opt_end,
                   "keywords": [k.strip().lower() for k in args.keywords.split(",") if k.strip()]},
        "gates": [],
        "status": "complete",
    }

    def gate(gid, name, status, detail, **extra):
        rec["gates"].append({"id": gid, "name": name, "status": status, "detail": detail, **extra})
        if status == "stop":
            rec["status"] = "stopped"
        return status

    # --- input gate: timeline input must exist before anything else (stop condition)
    opt_end = iso(args.opt_end) if args.opt_end else None
    if opt_end is None:
        gate("G5", "timeline", "stop", "opt_end missing or not YYYY-MM-DD; refusing to triage without a visa timeline")
        return rec

    if (opt_end - today).days <= 0:  # fail fast: nothing downstream matters if the clock has run out
        gate("G5", "timeline", "stop", f"opt_end {opt_end} is not in the future ({(opt_end - today).days} days)", days=(opt_end - today).days)
        return rec

    with open(args.csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    rec["csv_rows"] = len(rows)

    # G1 snapshot age
    newest = max((iso(r["latest_funding_date"]) for r in rows if iso(r["latest_funding_date"])), default=None)
    if newest is None:
        gate("G1", "snapshot-age", "stop", "no parseable latest_funding_date in CSV")
        return rec
    age = (today - newest).days
    rec["snapshot_newest_funding_date"] = newest.isoformat()
    if age > MAX_SNAPSHOT_DAYS:
        gate("G1", "snapshot-age", "stop", f"newest funding date {newest} is {age} days old (> {MAX_SNAPSHOT_DAYS})", age_days=age)
        return rec
    gate("G1", "snapshot-age", "flag" if age > WARN_SNAPSHOT_DAYS else "pass",
         f"newest funding date in data is {newest}; {age} days before {today}. 'Recent' here means recent as of the snapshot, not today.",
         age_days=age)

    # G2 exact company match (CSV line number = index + 2: header is line 1)
    want = normalize(args.company)
    hits = [(i + 2, r) for i, r in enumerate(rows) if normalize(r["company_name"]) == want]
    if len(hits) != 1:
        gate("G2", "company-match", "stop",
             f"{len(hits)} exact matches for normalized name '{want}'"
             + (": " + "; ".join(f"line {n} {r['company_name']}" for n, r in hits) if hits else " (no fuzzy fallback)"),
             matches=len(hits))
        return rec
    line, r = hits[0]
    gate("G2", "company-match", "pass", f"matched CSV line {line}: {r['company_name']}", csv_line=line)

    # G3 sponsorship record
    approvals = num(r["Total Approvals"])
    record = {
        "csv_line": line, "company_name": r["company_name"], "state": r["state"],
        "latest_funding_stage": r["latest_funding_stage"], "latest_funding_date": r["latest_funding_date"],
        "latest_funding_amount": num(r["latest_funding_amount"]),
        "total_approvals": approvals, "total_denials": num(r["Total Denials"]),
        "approval_rate": num(r["Approval_Rate"]),
        "median_salary_offered_all_sponsored_titles": num(r["median_salary_offered"]),
        "top_job_titles_sponsored": parse_titles(r["top_job_titles_sponsored"]),
    }
    rec["record"] = record
    if approvals is None:
        gate("G3", "sponsor-record", "flag", "no approval count on record. This is absence of evidence, NOT evidence the company does not sponsor.")
    else:
        gate("G3", "sponsor-record", "pass", f"{int(approvals)} approvals on record")

    # G4 role-family evidence
    kws = rec["inputs"]["keywords"]
    matched = [t for t in record["top_job_titles_sponsored"] if any(k in t.lower() for k in kws)]
    record["role_family_matched_titles"] = matched
    junior = [t for t in matched if not SENIOR_RE.search(t)]
    record["role_family_non_senior_titles"] = junior
    if matched and junior:
        gate("G4", "role-family", "pass", f"{len(matched)} sponsored title(s) match role keywords; {len(junior)} not senior-flagged")
    elif matched:
        gate("G4", "role-family", "flag", f"{len(matched)} title(s) match role keywords but ALL are senior-flagged (senior/sr/staff/lead/principal/manager/director/head/vp/III/IV); weak evidence for a junior role")
    else:
        gate("G4", "role-family", "flag", "no sponsored title in the record matches the role keywords (the list holds top titles only)")

    # G5 timeline (arithmetic only — no legal conclusions)
    days = (opt_end - today).days
    rec["days_to_opt_end"] = days
    if days <= 0:
        gate("G5", "timeline", "stop", f"opt_end {opt_end} is not in the future ({days} days)", days=days)
    elif days < MIN_RUNWAY_DAYS:
        gate("G5", "timeline", "flag", f"{days} days to opt_end (< {MIN_RUNWAY_DAYS}); a named human must clear this gate", days=days)
    else:
        gate("G5", "timeline", "pass", f"{days} days to opt_end (arithmetic only; no rule about cap-gap/STEM OPT is checked)", days=days)
    return rec


def to_md(rec: dict) -> str:
    out = ["## Executive summary", ""]
    stopped = rec["status"] == "stopped"
    c = rec["inputs"]["company"]
    if stopped:
        g = next(g for g in rec["gates"] if g["status"] == "stop")
        out.append(f"This report checks whether **{c}** is worth an application using only the committed sponsorship dataset. "
                   f"The run **stopped** at gate {g['id']} ({g['name']}): {g['detail']}. No result is given because guessing would be worse than stopping.")
    else:
        r = rec["record"]
        flags = [g for g in rec["gates"] if g["status"] == "flag"]
        out.append(f"This report checks whether **{c}** is worth an application using only the committed sponsorship dataset. "
                   f"It found a record ({r['total_approvals'] if r['total_approvals'] is not None else 'no'} approvals, last funding {r['latest_funding_stage']} on {r['latest_funding_date']}). "
                   f"{len(flags)} gate(s) raised a flag that a human must read before acting. It deliberately gives no score.")
    out += ["", "## Gates", "", "| Gate | Status | Detail |", "|---|---|---|"]
    for g in rec["gates"]:
        out.append(f"| {g['id']} {g['name']} | {g['status']} | {g['detail']} |")
    if not stopped:
        r = rec["record"]
        out += ["", "## Record (source: CSV line %d)" % r["csv_line"], "", "| Field | Value |", "|---|---|"]
        for k, v in r.items():
            out.append(f"| {k} | {v} |")
    out += ["", "## Run record", "", f"- run_date: {rec['run_date']}", f"- csv: {rec['inputs']['csv']} ({rec.get('csv_rows', '?')} rows)"]
    return "\n".join(out) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--company", required=True)
    ap.add_argument("--opt-end", dest="opt_end", default=None, help="YYYY-MM-DD (required; the run refuses without it)")
    ap.add_argument("--today", default=None, help="YYYY-MM-DD override, for reproducible tests")
    ap.add_argument("--csv", default=DEFAULT_CSV)
    ap.add_argument("--keywords", default=DEFAULT_KEYWORDS)
    ap.add_argument("--json", default=None)
    ap.add_argument("--md", default=None)
    args = ap.parse_args()
    if not Path(args.csv).exists():
        print(f"error: csv not found: {args.csv}", file=sys.stderr)
        return 1
    rec = build(args)
    text = json.dumps(rec, indent=2, sort_keys=True)
    if args.json:
        Path(args.json).write_text(text + "\n", encoding="utf-8")
    if args.md:
        Path(args.md).write_text(to_md(rec), encoding="utf-8")
    if not (args.json or args.md):
        print(text)
    else:
        print(f"sponsor-triage: status={rec['status']}  gates=" + ",".join(f"{g['id']}:{g['status']}" for g in rec["gates"]))
    return 2 if rec["status"] == "stopped" else 0


if __name__ == "__main__":
    sys.exit(main())
