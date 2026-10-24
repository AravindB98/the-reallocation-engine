#!/usr/bin/env python3
"""Sponsor triage for an F-1 new-grad Data Scientist search (SOC 15-2051).

Prototype for recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md.

Stages:
  1. Read the persona and candidate roles (your-input).
  2. Look each company up in the 80 Days to Stay CSV (record).
  3. Hold any role that cannot be verified, instead of inventing a value:
       G1 - company not in CSV, or Total Approvals blank (no record is not zero)
       G2 - posting liveness never checked
  4. Write roles.json and run the EXISTING scorer (scripts/score/role-scorer.mjs).
  5. Write triage-log.json (for an agent) and triage-report.md (for a person).

Standard library only. No network calls.
"""

import argparse
import ast
import csv
import json
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

VERSION = "0.1.0"
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
RECIPE = "recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md"
DEFAULT_TARGETS = REPO / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
DEFAULT_BLS = REPO / "data/bls/compact/soc_occupation_compact.csv"
DEFAULT_PERSONA = HERE / "fixtures/persona.example.json"
SCORER = REPO / "scripts/score/role-scorer.mjs"
ALLOWED_OUT_ROOTS = [
    REPO / "course/2026fa/submissions/rithika-sr",
    HERE,
    Path(tempfile.gettempdir()),  # used by the offline tests only
]

RECORD, INPUT = "record", "your-input"

# Recipe rules: my design choices (your-input), logged with every run.
RULES = {
    "name_match": "case-insensitive exact match on company_name (first pass; see prediction P3)",
    "proven_min_approvals": 10,
    "proven_min_approval_rate": 90.0,
    "proven_needs_title_match": True,
    "tier_p": {"Proven": 0.9, "Likely": 0.6, "None": 0.0},
    "tier_p_provenance": "same values as data/examples/ch11-roles.json",
    "liveness_factor": {"live": 1.0, "closed": 0.0},
}

NEXT_ACTION = {
    "Apply": "Tailor and send an application (research-and-apply block).",
    "Consider": "Network first: ask a contact about the soft spot before applying.",
    "Skip": "Skip. Spend the time on networking or credibility hours.",
}

NOT_VERIFIED = [
    "Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are "
    "company-wide; the title check only looks at top_job_titles_sponsored. "
    "[TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.",
    "Company matching is exact (case-insensitive). A G1 miss may be a naming "
    "difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.",
    "Liveness values are transcribed from ats:liveness checks recorded in the "
    "candidates file; this prototype does not run the check itself. [TODO: DEV]",
    "The timeline formula reflects a general understanding of the 90-day OPT "
    "unemployment limit. It is not legal advice; confirm dates with the school's "
    "international student office.",
    "BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of "
    "15-2051 (a group wage), not an offer. role_quality carries weight 0 in the "
    "scorer, so it does not change any decision.",
    "Funding values come from the CSV; they were not re-checked against new SEC filings.",
]


class InputError(Exception):
    """Bad or missing input. The run stops instead of inventing a value."""


# ---------- small helpers ----------

def parse_date(text, field):
    try:
        return date.fromisoformat(str(text))
    except ValueError:
        raise InputError(f"{field}: not a YYYY-MM-DD date: {text!r}")


def load_json(path):
    path = Path(path)
    if not path.is_file():
        raise InputError(f"file not found: {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def to_float(text):
    """Blank or unparseable -> None (missing). Never 0."""
    if text is None or str(text).strip() == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def normalize_name(name):
    # First pass on purpose: case-insensitive exact match (prediction P3).
    return " ".join(str(name).upper().split())


def check_out_dir(out_dir, allowed_roots):
    """Path containment: only write inside my own folders."""
    resolved = Path(out_dir).resolve()
    for root in allowed_roots:
        root = Path(root).resolve()
        if resolved == root or root in resolved.parents:
            return resolved
    raise InputError(f"--out-dir {out_dir} is outside my allowed folders; refusing to write")


# ---------- stage 1-2: data ----------

def load_targets(csv_path):
    csv_path = Path(csv_path)
    if not csv_path.is_file():
        raise InputError(f"sponsorship CSV not found: {csv_path}")
    index = {}
    with csv_path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            key = normalize_name(row.get("company_name", ""))
            if key and key not in index:  # first row wins on duplicates
                index[key] = row
    return index


def parse_titles(text):
    """The CSV stores titles as a Python-list string, e.g. "['Data Scientist']"."""
    if not text or not str(text).strip():
        return []
    try:
        value = ast.literal_eval(text)
        if isinstance(value, (list, tuple)):
            return [str(t) for t in value]
    except (ValueError, SyntaxError):
        pass
    return [str(text)]


def sponsorship_evidence(row, keywords):
    """Returns None when there is no sponsorship record (blank approvals)."""
    approvals = to_float(row.get("Total Approvals"))
    if approvals is None:
        return None
    rate = to_float(row.get("Approval_Rate"))
    titles = parse_titles(row.get("top_job_titles_sponsored", ""))
    matched = [t for t in titles if any(k.lower() in t.lower() for k in keywords)]
    if approvals == 0:
        tier = "None"
    elif (approvals >= RULES["proven_min_approvals"]
          and rate is not None and rate >= RULES["proven_min_approval_rate"]
          and matched):
        tier = "Proven"
    else:
        tier = "Likely"
    return {
        "tier": tier,
        "p": RULES["tier_p"][tier],
        "approvals": approvals,
        "denials": to_float(row.get("Total Denials")),
        "approval_rate": rate,
        "top_titles": titles,
        "matched_titles": matched,
        "median_salary_offered": to_float(row.get("median_salary_offered")),
        "latest_funding_amount": to_float(row.get("latest_funding_amount")),
        "latest_funding_stage": row.get("latest_funding_stage") or None,
        "latest_funding_date": row.get("latest_funding_date") or None,
        "source": RECORD,
    }


def bls_row(bls_path, soc):
    path = Path(bls_path)
    if not path.is_file():
        raise InputError(f"BLS file not found: {path}")
    with path.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("onet_soc_code") == f"{soc}.00":
                ability_cols = [c for c in row if c.startswith("ability_")]
                return {
                    "status": "ok",
                    "soc": soc,
                    "title": row.get("title"),
                    "oews_year": row.get("oews_year"),
                    "employment": to_float(row.get("employment")),
                    "annual_median_wage": to_float(row.get("annual_median_wage")),
                    "annual_mean_wage": to_float(row.get("annual_mean_wage")),
                    "employment_prse": to_float(row.get("employment_prse")),
                    "abilities_missing": all(not (row[c] or "").strip() for c in ability_cols),
                    "cognitive_pivot_score": to_float(row.get("cognitive_pivot_score")),
                    "note": "OEWS wage is published at the 6-digit SOC, so all O*NET "
                            "sub-occupations of this SOC share it (a group wage).",
                    "source": RECORD,
                }
    return {"status": "missing", "reason": "no-occupation-row", "soc": soc}


# ---------- stage 3: gates ----------

def timeline_factor(visa, hiring_lag_days, today):
    try:
        ead = parse_date(visa["ead_start_date"], "visa.ead_start_date")
        opt_end = parse_date(visa["opt_end_date"], "visa.opt_end_date")
        left = visa["unemployment_ceiling"] - visa["unemployment_days_used"] - visa["buffer_days"]
    except KeyError as e:
        raise InputError(f"persona visa field missing: {e}")
    if not isinstance(hiring_lag_days, (int, float)) or hiring_lag_days <= 0:
        raise InputError("assumptions.hiring_lag_days must be a positive number")
    if today > opt_end:
        return 0.0, f"run date {today} is after OPT end {opt_end}: window closed"
    if left <= 0:
        return 0.0, "no unemployment days left after the buffer: window closed"
    before_ead = max(0, (ead - today).days)
    available = before_ead + left
    factor = round(min(1.0, available / hiring_lag_days), 3)
    why = (f"{before_ead} days until EAD start + {left} unemployment days left "
           f"= {available} available / {hiring_lag_days}-day hiring lag")
    return factor, why


def triage(persona, candidates, targets, today):
    try:
        keywords = persona["target"]["title_keywords"]
        hiring_lag = persona["assumptions"]["hiring_lag_days"]
        visa = persona["visa"]
        roles_in = candidates["roles"]
    except KeyError as e:
        raise InputError(f"required field missing: {e}")

    timeline, timeline_why = timeline_factor(visa, hiring_lag, today)
    scored, held, evidence = [], [], {}

    for c in roles_in:
        base = {"role_id": c.get("role_id"), "company_as_entered": c.get("company"),
                "title": c.get("title"), "url": c.get("url")}

        row = targets.get(normalize_name(c.get("company", "")))
        if row is None:
            held.append({**base, "gate": "G1",
                         "reason": "company not found in sponsorship CSV (exact-name match; may be a naming miss)",
                         "next_action": "Search the CSV by hand for the legal name before deciding."})
            continue

        spons = sponsorship_evidence(row, keywords)
        if spons is None:
            held.append({**base, "gate": "G1",
                         "reason": "company is in the CSV but Total Approvals is blank: no sponsorship record (not zero)",
                         "next_action": "Treat sponsorship as unknown; network to ask before applying."})
            continue

        live = c.get("liveness") or {}
        status = live.get("status")
        if status not in RULES["liveness_factor"]:
            held.append({**base, "gate": "G2",
                         "reason": "posting liveness never checked" if not live
                                   else f"liveness checker said {status!r}, which is neither live nor closed",
                         "next_action": f"Run: npm run ats:liveness -- {c.get('url')}"})
            continue

        fit = c.get("fit")
        if not isinstance(fit, (int, float)) or not 0 <= fit <= 1:
            held.append({**base, "gate": "INPUT",
                         "reason": "fit missing or not between 0 and 1",
                         "next_action": "Rate fit 0-1 in the candidates file."})
            continue

        scored.append({
            "role_id": c["role_id"],
            "company": row["company_name"],
            "title": c.get("title"),
            "sponsorship": {"p": spons["p"], "tier": spons["tier"], "source": RECORD},
            "fit": {"p": fit, "source": INPUT},
            "liveness": {"factor": RULES["liveness_factor"][status], "source": RECORD},
            "timeline": {"factor": timeline, "source": INPUT},
        })
        evidence[c["role_id"]] = {"sponsorship": spons, "liveness": {**live, "source": RECORD}}

    return {"timeline": {"factor": timeline, "why": timeline_why, "source": INPUT},
            "scored": scored, "held": held, "evidence": evidence}


# ---------- stage 4: the existing scorer ----------

def run_scorer(roles_path, out_dir):
    proc = subprocess.run(
        ["node", str(SCORER), str(roles_path), "--out-dir", str(out_dir)],
        cwd=REPO, capture_output=True, text=True)
    if proc.returncode != 0:
        raise InputError(f"scorer failed: {proc.stderr.strip()}")
    data = load_json(Path(out_dir) / "role-scores.json")
    items = data if isinstance(data, list) else None
    if items is None:
        for key in ("scores", "roles", "results"):
            if isinstance(data.get(key), list):
                items = data[key]
                break
    out = {}
    for it in items or []:
        if isinstance(it, dict) and "role_id" in it:
            out[it["role_id"]] = {
                "decision": it.get("rec") or it.get("recommendation") or it.get("decision"),
                "composite": it.get("composite"),
                "reason": it.get("reason"),
            }
    return out, proc.stdout.strip()


# ---------- stage 5: outputs ----------

def rel(path):
    """Repo-relative path, so logs never contain a home folder (privacy)."""
    p = Path(path).resolve()
    try:
        return str(p.relative_to(REPO))
    except ValueError:
        return p.name


def money(x):
    return "—" if x is None else f"${x:,.0f}"


def build_report(log):
    p, s = log["persona"], log["summary"]
    decisions_txt = " · ".join(f"{k} {v}" for k, v in s["decisions"].items()) or "none"
    L = [f"# Sponsor triage — {p['name']} (fictional) · run date {log['run_date']}", "",
         f"Target: {p['target_title']}, SOC {p['soc']}. Recipe `{RECIPE}`, prototype v{VERSION}.",
         "Labels: **[record]** came from repo data; **[your-input]** came from the person. "
         "This run used **no model judgment**.", "",
         f"**Summary:** {s['candidates']} candidate roles → {s['scored']} scored, "
         f"{s['held']} held at a gate. Scorer decisions: {decisions_txt}.", "",
         "## Scored roles (decision from scripts/score/role-scorer.mjs)", ""]

    if not log["scored"]:
        L.append("_No role cleared gates G1 and G2, so the scorer was not run._")
    else:
        L += ["| Role | Decision | Composite | Sponsorship [record] | Fit [your-input] | "
              "Liveness [record] | Timeline [your-input] | Next action |",
              "|---|---|---|---|---|---|---|---|"]
        for r in log["scored"]:
            sp, lv = r["sponsorship"], r["liveness"]
            titles = ", ".join(sp["matched_titles"]) or "no title matched"
            comp = r["composite"]
            comp_txt = f"{comp:.3f}" if isinstance(comp, (int, float)) else "—"
            L.append(f"| {r['company']} — {r['title']} | **{r['decision']}** | {comp_txt} | "
                     f"{sp['tier']} (p {sp['p']}; {sp['approvals']:g} approvals, "
                     f"rate {'—' if sp['approval_rate'] is None else format(sp['approval_rate'], '.1f')}%; {titles}) | {r['fit']} | "
                     f"{lv.get('status')} ({lv.get('checked_on')}) | {r['timeline']} | "
                     f"{NEXT_ACTION.get(r['decision'], 'Human review.')} |")
        flags = [r for r in log["scored"] if r["sponsorship"]["tier"] == "None" and r["decision"] != "Skip"]
        if flags:
            L += ["", "**⚠ Needs a human (G4):** the scorer did not Skip these roles, but the "
                  "record shows 0 approvals. Fit alone kept them above the Skip line:"]
            L += [f"- {r['company']} — {r['title']} ({r['decision']})" for r in flags]

    weak = [r for r in log["scored"] if r["decision"] == "Apply" and r["fit"] < 0.5]
    if weak:
        L += ["", "**⚠ Needs a human (G4):** Apply here comes mainly from sponsorship, not fit "
              "(fit < 0.5). A Proven sponsor alone contributes 0.9 × 0.35 = 0.315, which already "
              "clears the 0.30 Apply threshold:"]
        L += [f"- {r['company']} — {r['title']} (fit {r['fit']})" for r in weak]
    L += ["", "## Held at a gate (not scored, nothing invented)", ""]
    if not log["held"]:
        L.append("_None._")
    else:
        L += ["| Role | Gate | Why held | Next action |", "|---|---|---|---|"]
        for h in log["held"]:
            L.append(f"| {h['company_as_entered']} — {h['title']} | {h['gate']} | {h['reason']} | {h['next_action']} |")

    t = log["timeline"]
    L += ["", "## Visa timeline gate [your-input]", "",
          f"Factor **{t['factor']}**: {t['why']}.", ""]

    b = log["role_quality"]
    L += ["## Role quality (report only — weight 0 in the scorer)", ""]
    if b["status"] != "ok":
        L.append(f"BLS row missing for SOC {b['soc']} ({b['reason']}). No wage shown.")
    else:
        L.append(f"- [record] {b['title']}, OEWS {b['oews_year']}: median {money(b['annual_median_wage'])}, "
                 f"mean {money(b['annual_mean_wage'])}, employment {b['employment']:,.0f}.")
        L.append(f"- [record] {b['note']}")
        if b["abilities_missing"]:
            L.append("- **Missing:** O*NET ability levels and cognitive_pivot_score are empty for this "
                     "row, so AI-resilience cannot be checked from repo data.")

    L += ["", "## What this run did NOT verify", ""] + [f"- {x}" for x in NOT_VERIFIED]
    L += ["", "## Human gate G4", "",
          "These are recommendations. A named person reviews this report and decides "
          "Apply / Network / Skip for each role.", ""]
    return "\n".join(L)


def run(args):
    today = parse_date(args.today, "--today") if args.today else date.today()
    out_dir = check_out_dir(args.out_dir, ALLOWED_OUT_ROOTS)
    persona = load_json(args.persona)
    candidates = load_json(args.candidates)
    targets = load_targets(args.targets)
    soc = persona.get("target", {}).get("soc")
    if not soc:
        raise InputError("persona target.soc missing")
    bls = bls_row(args.bls, soc)

    result = triage(persona, candidates, targets, today)
    out_dir.mkdir(parents=True, exist_ok=True)
    roles_path = out_dir / "roles.json"
    roles_path.write_text(json.dumps(result["scored"], indent=2) + "\n", encoding="utf-8")

    scores, scorer_stdout = ({}, "scorer not run: no role cleared the gates")
    if result["scored"]:
        scores, scorer_stdout = run_scorer(roles_path, out_dir)

    scored_rows = []
    for r in result["scored"]:
        sc = scores.get(r["role_id"], {})
        scored_rows.append({
            "role_id": r["role_id"], "company": r["company"], "title": r["title"],
            "decision": sc.get("decision") or "not found in scorer output",
            "composite": sc.get("composite"), "scorer_reason": sc.get("reason"),
            "sponsorship": result["evidence"][r["role_id"]]["sponsorship"],
            "fit": r["fit"]["p"],
            "liveness": result["evidence"][r["role_id"]]["liveness"],
            "timeline": r["timeline"]["factor"],
        })

    decisions = {}
    for r in scored_rows:
        decisions[r["decision"]] = decisions.get(r["decision"], 0) + 1

    log = {
        "recipe": RECIPE, "prototype_version": VERSION, "run_date": str(today),
        "inputs": {"persona": rel(args.persona), "candidates": rel(args.candidates),
                   "targets": rel(args.targets), "bls": rel(args.bls)},
        "persona": {"name": persona.get("candidate", {}).get("name"),
                    "target_title": persona["target"].get("title"), "soc": soc,
                    "source": INPUT},
        "rules": RULES,
        "timeline": result["timeline"],
        "role_quality": bls,
        "summary": {"candidates": len(candidates.get("roles", [])),
                    "scored": len(scored_rows), "held": len(result["held"]),
                    "decisions": decisions},
        "scored": scored_rows,
        "held": result["held"],
        "scorer_stdout": scorer_stdout,
        "not_verified": NOT_VERIFIED,
    }
    (out_dir / "triage-log.json").write_text(json.dumps(log, indent=2) + "\n", encoding="utf-8")
    (out_dir / "triage-report.md").write_text(build_report(log), encoding="utf-8")
    return log, out_dir


def main(argv=None):
    ap = argparse.ArgumentParser(description="DS new-grad H-1B sponsor triage (SOC 15-2051).")
    ap.add_argument("--candidates", required=True, help="JSON file of candidate roles (your-input)")
    ap.add_argument("--persona", default=str(DEFAULT_PERSONA))
    ap.add_argument("--targets", default=str(DEFAULT_TARGETS), help="80 Days to Stay CSV")
    ap.add_argument("--bls", default=str(DEFAULT_BLS))
    ap.add_argument("--today", help="run date YYYY-MM-DD (pass it for reproducible runs)")
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args(argv)
    try:
        log, out_dir = run(args)
    except InputError as e:
        print(f"✗ stopped: {e}", file=sys.stderr)
        return 2
    s = log["summary"]
    print(log["scorer_stdout"])
    print(f"✓ triage: {s['candidates']} roles → {s['scored']} scored, {s['held']} held "
          f"→ {rel(out_dir)}/triage-log.json + triage-report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
