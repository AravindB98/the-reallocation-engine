#!/usr/bin/env python3
"""
swe-h1b-15-1252 prototype — Reallocation Engine recipe (INFO7375, 2026fa)

For an F-1 OPT student targeting Software Engineer roles (SOC 15-1252):
look up each candidate company's H-1B approval history in the 80 Days to Stay CSV,
apply a visa-timeline gate and a liveness gate, and hand roles that clear every gate
to the EXISTING scorer (scripts/score/role-scorer.mjs via `npm run score`).

Every value carries a label: record | model-judgment | your-input.
Never invents a value: missing company, blank approvals, ambiguous match, missing or
uncertain liveness, or a past OPT date stops that role (or the whole run) with a reason.

Usage (from repo root):
  python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py
Options: --input PATH  --csv PATH  --out-dir PATH  --today YYYY-MM-DD  --no-score

Outputs in --out-dir: run.json (agent log), report.md (person), roles.json (scorer
input), plus role-scores.json / role-scores.md written by the scorer.
No network calls. Reads nothing from private/ or search/resume.json.
"""
import argparse
import ast
import csv
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
DEFAULT_CSV = REPO / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
DEFAULT_INPUT = HERE / "sample-input.json"
DEFAULT_OUT = REPO / "course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample"
ALLOWED_OUT_PREFIXES = [
    REPO / "course/2026fa/submissions/jayant-majji-14",
    HERE,
]

RULE_VERSION = "0.1.0"
# Tier rule: MY choice, not a repo rule. [VERIFY]. Label: your-input.
PROVEN_MIN_APPROVALS = 10
# p values copied from data/examples/ch11-roles.json (Proven 0.9, Likely 0.6, None 0.0).
TIER_P = {"Proven": 0.9, "Likely": 0.6, "None": 0.0}
CSV_COLUMNS = ["company_name", "Total Approvals", "Total Denials", "Approval_Rate",
               "top_job_titles_sponsored", "latest_funding_date", "latest_funding_amount"]
# Deliberately NOT read: phone, executive_officers, board_directors (real people's data).
SUFFIXES = {"INC", "INCORPORATED", "LLC", "CORP", "CORPORATION", "CO", "LTD", "LIMITED", "PBC"}
LABELS = {"record", "model-judgment", "your-input"}


class InputError(Exception):
    pass


def normalize(name):
    s = name.upper().replace("&", " AND ")
    s = re.sub(r"[^A-Z0-9 ]", " ", s)
    toks = s.split()
    while toks and toks[-1] in SUFFIXES:
        toks.pop()
    return " ".join(toks)


def to_float(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def parse_titles(raw):
    if not raw:
        return []
    try:
        v = ast.literal_eval(raw)
        if isinstance(v, (list, tuple)):
            return [str(t) for t in v]
    except (ValueError, SyntaxError):
        pass
    return [raw]


def load_index(csv_path):
    if not csv_path.exists():
        raise InputError(f"CSV not found: {csv_path}")
    index = {}
    with open(csv_path, encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f)
        missing = [c for c in CSV_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise InputError(f"CSV is missing columns: {missing}")
        for row in reader:
            slim = {c: (row.get(c) or "").strip() for c in CSV_COLUMNS}
            index.setdefault(normalize(slim["company_name"]), []).append(slim)
    return index


def sponsorship_for(company, index):
    key = normalize(company)
    rows = index.get(key, [])
    if not rows:
        return {"status": "no_record",
                "reason": f"'{company}' not found in CSV (normalized key '{key}'; exact match after suffix strip only)"}
    if len(rows) > 1:
        names = "; ".join(r["company_name"] for r in rows)
        return {"status": "ambiguous", "reason": f"{len(rows)} CSV rows share key '{key}': {names}"}
    r = rows[0]
    base = {
        "csv_company_name": {"value": r["company_name"], "source": "record"},
        "funding": {"latest_funding_date": r["latest_funding_date"] or None,
                    "latest_funding_amount": to_float(r["latest_funding_amount"]),
                    "source": "record", "note": "context only; the scorer has no funding term"},
    }
    approvals = to_float(r["Total Approvals"])
    if approvals is None:
        return {**base, "status": "no_record",
                "reason": "company is in CSV but 'Total Approvals' is blank (blank is not zero)"}
    titles = parse_titles(r["top_job_titles_sponsored"])
    software = any("software" in t.lower() for t in titles)
    if approvals >= PROVEN_MIN_APPROVALS and software:
        tier = "Proven"
    elif approvals >= 1:
        tier = "Likely"
    else:
        tier = "None"
    return {**base, "status": "ok", "tier": tier, "p": TIER_P[tier],
            "approvals": {"value": approvals, "source": "record"},
            "denials": {"value": to_float(r["Total Denials"]), "source": "record"},
            "approval_rate": {"value": to_float(r["Approval_Rate"]), "source": "record"},
            "software_title_match": {"value": software, "source": "your-input",
                                     "note": "substring 'software' in top_job_titles_sponsored; a proxy for SOC 15-1252, not a SOC code"},
            "tier_rule": {"value": f"Proven: approvals>={PROVEN_MIN_APPROVALS} and software title; Likely: approvals>=1; v{RULE_VERSION}",
                          "source": "your-input"}}


def timeline_for(persona, today):
    try:
        opt_end = date.fromisoformat(persona["opt_end_date"])
        lag = int(persona["hiring_lag_days"])
    except (KeyError, TypeError, ValueError) as e:
        raise InputError(f"persona needs opt_end_date (YYYY-MM-DD) and hiring_lag_days (integer): {e}")
    if lag <= 0:
        raise InputError("hiring_lag_days must be greater than 0")
    days_left = (opt_end - today).days
    if days_left <= 0:
        raise InputError(f"OPT end date {opt_end} is not after today ({today}); refusing to score, no timeline factor is invented")
    if days_left < lag:
        factor = 0.0
    elif days_left >= 2 * lag:
        factor = 1.0
    else:
        factor = round((days_left - lag) / lag, 3)
    return {"factor": factor, "days_left": days_left, "hiring_lag_days": lag,
            "opt_end_date": str(opt_end), "source": "your-input",
            "rule": "0 if days_left < lag; 1 if days_left >= 2*lag; linear in between"}


def liveness_for(role):
    lv = role.get("liveness")
    if not lv:
        return None
    status = (lv.get("status") or "").lower()
    factor = {"active": 1.0, "expired": 0.0}.get(status)
    return {"factor": factor, "status": status or "unknown", "checked_on": lv.get("checked_on"),
            "source": "record", "note": lv.get("note")}


def fit_for(role):
    fit = role.get("fit") or {}
    p = fit.get("p")
    if not isinstance(p, (int, float)) or not 0 <= p <= 1 or fit.get("source") not in LABELS:
        return None
    return {"p": float(p), "source": fit["source"], "note": fit.get("note")}


def evaluate(role, index, timeline):
    sp = sponsorship_for(role["company"], index)
    fit = fit_for(role)
    lv = liveness_for(role)
    out = {"role_id": role["role_id"], "company": role["company"], "title": role.get("title"),
           "posting_url": role.get("posting_url"), "sponsorship": sp, "fit": fit, "liveness": lv}
    if sp["status"] != "ok":
        out["route"], out["reason"] = "held", sp["reason"]
    elif fit is None:
        out["route"], out["reason"] = "held", "fit missing, out of 0..1, or unlabeled"
    elif lv is None:
        if sp["tier"] in ("Proven", "Likely"):
            out["route"], out["reason"] = "network_target", "sponsor evidence but no checked live posting"
        else:
            out["route"], out["reason"] = "skip", "zero recorded approvals and no posting"
    elif lv["factor"] is None:
        out["route"], out["reason"] = "held", f"liveness status '{lv['status']}' is not active/expired"
    else:
        out["route"], out["reason"] = "score", "all gates have evidence"
        out["scorer_role"] = {
            "role_id": role["role_id"], "company": role["company"], "title": role.get("title"),
            "sponsorship": {"p": sp["p"], "tier": sp["tier"], "source": "your-input",
                        "basis": f"Total Approvals={sp['approvals']['value']} (record) -> tier {sp['tier']} by my rule v{RULE_VERSION} -> p {sp['p']} from ch11-roles.json convention (your-input)"},
            "fit": {"p": fit["p"], "source": fit["source"]},
            "liveness": {"factor": lv["factor"], "source": "record"},
            "timeline": {"factor": timeline["factor"], "source": "your-input"},
        }
    return out


def check_out_dir(out_dir):
    out_dir = out_dir.resolve()
    inside_repo = out_dir == REPO or REPO in out_dir.parents
    if inside_repo and not any(out_dir == p or p in out_dir.parents for p in ALLOWED_OUT_PREFIXES):
        raise InputError(f"--out-dir {out_dir} is inside the repo but outside my namespaced folders; refusing to write")
    return out_dir

def rel(p):
    p = Path(p).resolve()
    return str(p.relative_to(REPO)) if p == REPO or REPO in p.parents else str(p)

def run_scorer(roles_path, out_dir):
    cmd = ["npm", "run", "score", "--", rel(roles_path), "--out-dir", rel(out_dir)]
    proc = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    return {"command": " ".join(cmd), "returncode": proc.returncode,
            "stdout": proc.stdout.strip(), "stderr": proc.stderr.strip()}


def write_report(path, run):
    tl = run["timeline"]
    c = run["counts"]
    by = lambda r: [x for x in run["roles"] if x["route"] == r]
    L = [f"# SWE H-1B triage report (SOC 15-1252 target)",
         "",
         f"Run date {run['today']} · rule v{RULE_VERSION} · data: `{run['csv']}` (shipped CSV)",
                 "Labels: [record] = from repo data · [your-input] = my assumption or rule · [model-judgment] = a guess",
         "",
         "## Executive summary",
         f"**What:** sponsor triage for an F-1 OPT student targeting Software Engineer roles; {len(run['roles'])} candidate roles checked.",
         "**Why:** on an OPT clock, a confident guess about sponsorship or a dead posting costs days; this sorts roles by recorded evidence instead.",
         f"**Found:** {c['score']} scored by the engine, {c['network_target']} to network into, {c['held']} held for a human, {c['skip']} skipped.",
         "**Did not do:** verify SOC 15-1252 directly, match brand names to legal names, re-check postings, or let funding affect a decision (see the last section).",
         "",
         "## Timeline gate",
         f"OPT ends {tl['opt_end_date']} [your-input], {tl['days_left']} days left; assumed hiring lag "
         f"{tl['hiring_lag_days']} days [your-input] → factor {tl['factor']} [your-input rule: {tl['rule']}]",
         "",
         "## 1. Scored by the engine → tailor an application (the '2' research-and-apply hours)",
         "| Role | Company | Tier | Approvals [record] | Fit | Liveness [record] |",
         "|---|---|---|---|---|---|"]
    for r in by("score"):
        sp = r["sponsorship"]
        L.append(f"| {r['title']} | {sp['csv_company_name']['value']} | {sp['tier']} | {sp['approvals']['value']:.0f} "
                 f"| {r['fit']['p']} [{r['fit']['source']}] | {r['liveness']['status']} ({r['liveness']['checked_on']}) |")
    sc = run["scorer"]
    L += ["", f"Scorer: `{sc.get('command', 'not run')}`", "", "```", sc.get("stdout") or sc.get("reason", ""), "```",
          "Decisions and per-term audit: see `role-scores.md` in this folder (written by the scorer).",
          f"Note: the scorer's skip rate counts only roles that reached it. This prototype routed "
          f"{len(run['roles']) - run['counts']['score']} of {len(run['roles'])} roles away before scoring.", "",
          "## 2. Network targets → informational interview before a role opens (the '3' networking hours)",
          "| Company | Tier | Approvals [record] | Approval rate [record] | Latest funding [record] |",
          "|---|---|---|---|---|"]
    for r in by("network_target"):
        sp = r["sponsorship"]
        f = sp["funding"]
        L.append(f"| {sp['csv_company_name']['value']} | {sp['tier']} | {sp['approvals']['value']:.0f} "
                 f"| {sp['approval_rate']['value']} | {f['latest_funding_date']} |")
    L += ["", "## 3. Held for a human, or skipped", "| Role | Company | Route | Reason |", "|---|---|---|---|"]
    for r in by("held") + by("skip"):
        L.append(f"| {r['role_id']} | {r['company']} | {r['route']} | {r['reason']} |")
    L += ["", "## What this run did NOT verify",
          "- SOC 15-1252: the CSV has no SOC column; 'software' in sponsored job titles is a proxy.",
          "- Company names: normalized exact match only; a brand name (e.g. '6sense') misses the legal name.",
          "- Liveness: pasted from one `npm run ats:liveness` run on the date shown; not re-checked. Workday is not one of the four ATS the engine claims to detect.",
          "- Funding: CSV columns only; Form D samples not joined [TODO: DATA SOURCE]; the scorer has no funding term.",
          "- Approval counts: as shipped in the CSV; not re-checked against the USCIS H-1B Employer Data Hub.",
          "- Tier thresholds and the timeline rule are my assumptions [VERIFY]."]
    path.write_text("\n".join(L) + "\n", encoding="utf-8")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    ap.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--today", default=None, help="YYYY-MM-DD (default: system date)")
    ap.add_argument("--no-score", action="store_true", help="skip calling npm run score (used by tests)")
    a = ap.parse_args(argv)
    try:
        today = date.fromisoformat(a.today) if a.today else date.today()
        out_dir = check_out_dir(a.out_dir)
        data = json.loads(a.input.read_text(encoding="utf-8"))
        timeline = timeline_for(data["persona"], today)
        index = load_index(a.csv)
        roles = [evaluate(r, index, timeline) for r in data["roles"]]
    except (InputError, FileNotFoundError, json.JSONDecodeError, KeyError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    scorer_roles = [r.pop("scorer_role") for r in roles if "scorer_role" in r]
    roles_path = out_dir / "roles.json"
    roles_path.write_text(json.dumps(scorer_roles, indent=2) + "\n", encoding="utf-8")
    if a.no_score or not scorer_roles:
        scorer = {"skipped": True, "reason": "--no-score" if a.no_score else "no role cleared every gate"}
    else:
        scorer = run_scorer(roles_path, out_dir)

    persona = {k: v for k, v in data["persona"].items() if k not in ("name", "email")}
    run = {"recipe": "swe-h1b-15-1252", "rule_version": RULE_VERSION, "today": str(today),
           "csv": str(a.csv.resolve().relative_to(REPO)) if REPO in a.csv.resolve().parents else str(a.csv),
           "persona": persona, "timeline": timeline, "roles": roles, "scorer": scorer,
           "counts": {k: sum(1 for r in roles if r["route"] == k) for k in ("score", "network_target", "held", "skip")}}
    (out_dir / "run.json").write_text(json.dumps(run, indent=2) + "\n", encoding="utf-8")
    write_report(out_dir / "report.md", run)
    print(f"✓ {len(roles)} roles → score {run['counts']['score']} · network {run['counts']['network_target']} · "
          f"held {run['counts']['held']} · skip {run['counts']['skip']}")
    print(f"  {rel(out_dir / 'run.json')}  +  {rel(out_dir / 'report.md')}")
    if scorer.get("returncode"):
        print(f"ERROR: scorer exited {scorer['returncode']}: {scorer['stderr']}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())