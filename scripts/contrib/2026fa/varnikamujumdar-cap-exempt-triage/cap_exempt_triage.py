#!/usr/bin/env python3
"""Cap-exempt employer triage after a lost H-1B lottery.

Two subcommands:

  audit   How much can the 80 Days dataset (SEC Form D x H-1B) see of the
          employers this mode is about? Writes an audit report. No verdict.
  triage  For a fictional persona and a list of real postings, apply the
          input gate (G1), the timeline gate (G2) and the liveness gate (G3),
          then show the evidence signals for each employer's cap-exempt claim.

The mode never outputs "cap-exempt: yes". Cap-exempt status is decided by
USCIS on a petition; no dataset in this repository records it. The best the
mode can do is: UNVERIFIED (employer states a qualifying category),
CONTRADICTED-BY-SIGNAL (a record or the employer's legal form points the
other way), or HUMAN-ATTESTED (the person recorded an HR answer).

Every value in the run log carries a provenance label:
  record         read from a file in the repository
  script-output  computed by this script from records and inputs
  your-input     typed in by the person (assumptions, claims, posted salary)
  model-judgment a judgment, e.g. which SOC code a job title belongs to
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_80DAYS = ROOT / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
DEFAULT_BLS = ROOT / "data/bls/compact/soc_occupation_compact.csv"
HERE = Path(__file__).resolve().parent
DEFAULT_IPEDS = HERE / "data/extracts/ipeds_hd2024.csv"
DEFAULT_USCIS = HERE / "data/extracts/uscis_h1b_hub_fy2023.csv"
IPEDS_COLUMNS = ["UNITID", "INSTNM", "IALIAS", "STABBR", "CONTROL", "CYACTIVE", "CLOSEDAT"]
USCIS_COLUMNS = ["Employer", "Initial Approval", "Initial Denial", "Continuing Approval", "Continuing Denial", "NAICS", "State"]
IPEDS_CONTROL = {"1": "public", "2": "private nonprofit", "3": "private for-profit"}
G4_DECISIONS = {"contact-hr", "open-posting-myself", "keep-held", "drop"}
NEAR_MISS_STOP = {"the", "of", "for", "and", "at", "a", "an", "in", "inc", "llc", "co", "corp", "corporation",
                  "company", "ltd", "lp", "pllc", "pc"}

REQUIRED_80DAYS_COLUMNS = [
    "company_name", "industry", "latest_funding_stage", "latest_funding_date",
    "total_funding", "Total Approvals", "Total Denials",
]
REQUIRED_BLS_COLUMNS = ["onet_soc_code", "bls_soc_code", "title", "annual_median_wage", "oews_year"]

CATEGORIES = {"IHE", "affiliated-nonprofit", "nonprofit-research", "governmental-research", "none"}
CLAIM_BASES = {"employer-statement", "name-only"}

# Names that *sound* like a university, hospital or research nonprofit.
CAP_EXEMPT_SOUNDING = re.compile(
    r"\b(university|college|institute of technology|school of medicine|"
    r"research (institute|foundation|center)|medical center|hospital|foundation)\b",
    re.IGNORECASE,
)
# LLC / LP / LLP / PBC / L3C are for-profit forms. "Inc." and "Corp." are not
# evidence either way: nonprofit corporations use them too.
STRONG_FOR_PROFIT = re.compile(r"[\s,](llc|l\.l\.c\.?|lp|l\.p\.?|llp|pbc|l3c)\.?$", re.IGNORECASE)
AMBIGUOUS_CORPORATE = re.compile(r"[\s,](inc|incorporated|corp|corporation)\.?$", re.IGNORECASE)

LIVENESS_LINE = re.compile(r"^\S+\s+(active|expired|uncertain)\s+(\S+)\s*$")
# ats:liveness calls a page "expired" when its top-level text is under 300
# characters. Job boards that render the posting inside an iframe (iCIMS, used
# by many hospitals and universities) trip this on live postings, so that one
# reason is held for a human look instead of skipped.
SOFT_EXPIRED_REASON = "insufficient content"


class GateHalt(Exception):
    """G1 failure: inputs are not usable. Nothing is written."""


# ---------------------------------------------------------------- reuse

def _load_normalizer():
    """Reuse normalize_company_name from scripts/sec/entity-resolution.py."""
    path = ROOT / "scripts/sec/entity-resolution.py"
    spec = importlib.util.spec_from_file_location("entity_resolution", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.normalize_company_name


normalize_company_name = _load_normalizer()


# ---------------------------------------------------------------- helpers

def sha256(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def to_number(value):
    """Blank is unknown, not zero."""
    if value is None or str(value).strip() == "":
        return None
    try:
        return float(str(value).replace(",", ""))
    except ValueError:
        return None


def read_csv_checked(path: Path, required: list, label: str) -> list:
    path = Path(path)
    if not path.exists():
        raise GateHalt(f"{label} not found at {path}")
    with path.open(encoding="utf-8", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in required if c not in (reader.fieldnames or [])]
        if missing:
            raise GateHalt(f"{label} is missing expected column(s): {', '.join(missing)}")
        return list(reader)


def parse_date(value, label: str) -> dt.date:
    if isinstance(value, dt.date):
        return value
    try:
        return dt.date.fromisoformat(str(value))
    except ValueError:
        raise GateHalt(f"{label} is not a valid YYYY-MM-DD date: {value!r}")


def rel(path) -> str:
    """Repo-relative path for reports, so no machine-specific path is committed."""
    p = Path(path).resolve()
    return str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else p.name


def normalize_url(url: str) -> str:
    return url.strip().rstrip("/")


def legal_form(name: str) -> str:
    if STRONG_FOR_PROFIT.search(name.strip()):
        return "for-profit-form"
    if AMBIGUOUS_CORPORATE.search(name.strip()):
        return "corporate-ambiguous"
    return "no-suffix"


# ---------------------------------------------------------------- audit

def run_audit(csv_path: Path, ipeds_path=None) -> dict:
    rows = read_csv_checked(csv_path, REQUIRED_80DAYS_COLUMNS, "80 Days CSV")
    approvals = [to_number(r["Total Approvals"]) for r in rows]
    hits = [r for r in rows if CAP_EXEMPT_SOUNDING.search(r["company_name"])]
    hit_rows = []
    for r in hits:
        hit_rows.append({
            "company_name": r["company_name"],
            "industry": r["industry"],
            "latest_funding_stage": r["latest_funding_stage"],
            "total_approvals": to_number(r["Total Approvals"]),
            "legal_form": legal_form(r["company_name"]),
        })
    industries = sorted({r["industry"].strip() for r in rows if r["industry"].strip()})
    overlap = None
    if ipeds_path and Path(ipeds_path).exists():
        ipeds = read_csv_checked(ipeds_path, IPEDS_COLUMNS, "IPEDS extract")
        eighty = {normalize_company_name(r["company_name"]) for r in rows}
        open_pn = [r for r in ipeds if r["CONTROL"] in ("1", "2") and r["CLOSEDAT"].strip() in ("", "-2")]
        ipeds_names = {normalize_company_name(r["INSTNM"]) for r in ipeds}
        overlap = {
            "ipeds_source": rel(ipeds_path),
            "open_public_nonprofit_institutions": len(open_pn),
            "found_in_80days_exact_name": sum(1 for r in open_pn if normalize_company_name(r["INSTNM"]) in eighty),
            "sounding_names_matching_any_ipeds_institution": sum(
                1 for r in hits if normalize_company_name(r["company_name"]) in ipeds_names),
        }
    return {
        "source": rel(csv_path),
        "source_sha256": sha256(csv_path),
        "rows_total": len(rows),
        "rows_with_approvals_gt0": sum(1 for a in approvals if a and a > 0),
        "rows_with_approvals_blank": sum(1 for a in approvals if a is None),
        "distinct_industries": len(industries),
        "education_like_industries": [i for i in industries if re.search(r"educat|universit|college|research|non-?profit", i, re.I)],
        "cap_exempt_sounding_names": len(hits),
        "sounding_with_approvals_gt0": sum(1 for h in hit_rows if h["total_approvals"] and h["total_approvals"] > 0),
        "sounding_with_approvals_blank": sum(1 for h in hit_rows if h["total_approvals"] is None),
        "sounding_with_for_profit_form": sum(1 for h in hit_rows if h["legal_form"] == "for-profit-form"),
        "sounding_with_corporate_ambiguous": sum(1 for h in hit_rows if h["legal_form"] == "corporate-ambiguous"),
        "sounding_with_funding_stage": sum(1 for h in hit_rows if h["latest_funding_stage"].strip()),
        "sounding_rows": hit_rows,
        "ipeds_overlap": overlap,
    }


def audit_markdown(a: dict) -> str:
    lines = [
        "# 80 Days coverage audit — cap-exempt employers",
        "",
        "## Executive summary",
        "",
        "This report checks whether the engine's main company dataset can see the employers that sponsor "
        "work visas without the H-1B lottery: universities, their affiliated nonprofits, and nonprofit "
        "research institutes. Read it before trusting any sponsorship number for those employers. "
        f"It found that the dataset holds {a['rows_total']:,} companies, of which "
        f"{a['cap_exempt_sounding_names']} have names that sound like a university, hospital or foundation — "
        f"and {a['sounding_with_approvals_gt0']} of those have any visa approvals on record. "
        f"{a['sounding_with_funding_stage']} of the {a['cap_exempt_sounding_names']} record a private funding round and "
        f"{a['sounding_with_for_profit_form']} carry a for-profit legal form (LLC, LP and similar): "
        "a name that sounds like a university or hospital is not evidence of one. "
        "A blank approval count means *unknown*, not zero "
        f"({a['rows_with_approvals_blank']:,} of {a['rows_total']:,} rows are blank, so a zero among the 31 says little on its own). "
        + (f"The stronger measure: of {a['ipeds_overlap']['open_public_nonprofit_institutions']:,} open public and nonprofit "
           f"institutions in the federal college list (IPEDS), {a['ipeds_overlap']['found_in_80days_exact_name']} appear in this "
           f"dataset by exact name, and {a['ipeds_overlap']['sounding_names_matching_any_ipeds_institution']} of the 31 "
           "university-sounding names is a listed institution. "
           if a.get("ipeds_overlap") else "")
        + "This audit reports counts; it does not say pass or fail.",
        "",
        "## Run record",
        "",
        f"- Source: `{rel(a['source'])}`",
        f"- SHA-256: `{a['source_sha256']}`",
    ] + ([f"- IPEDS extract for the overlap measure: `{a['ipeds_overlap']['ipeds_source']}`"] if a.get("ipeds_overlap") else []) + [
        "- Name pattern: university | college | institute of technology | school of medicine | "
        "research institute/foundation/center | medical center | hospital | foundation",
        "",
        "## Counts (script-output from records)",
        "",
        "| Measure | Count |",
        "|---|---:|",
        f"| Rows in dataset | {a['rows_total']:,} |",
        f"| Rows with H-1B approvals > 0 | {a['rows_with_approvals_gt0']:,} |",
        f"| Rows with approvals blank (unknown) | {a['rows_with_approvals_blank']:,} |",
        f"| Distinct industry labels | {a['distinct_industries']} |",
        f"| Industry labels that mention education / research / nonprofit | {len(a['education_like_industries'])} |",
        f"| Names that sound cap-exempt | {a['cap_exempt_sounding_names']} |",
        f"| … of which approvals > 0 | {a['sounding_with_approvals_gt0']} |",
        f"| … of which approvals blank (unknown) | {a['sounding_with_approvals_blank']} |",
        f"| … of which for-profit legal form (LLC/LP/LLP/PBC/L3C) | {a['sounding_with_for_profit_form']} |",
        f"| … of which Inc./Corp. (ambiguous — nonprofits incorporate too) | {a['sounding_with_corporate_ambiguous']} |",
        f"| … of which a Form D funding stage is recorded | {a['sounding_with_funding_stage']} |",
    ] + ([
        f"| … of which match an IPEDS institution exactly | {a['ipeds_overlap']['sounding_names_matching_any_ipeds_institution']} |",
        f"| Open public + nonprofit IPEDS institutions | {a['ipeds_overlap']['open_public_nonprofit_institutions']:,} |",
        f"| … of which appear in this dataset (exact name) | {a['ipeds_overlap']['found_in_80days_exact_name']} |",
    ] if a.get("ipeds_overlap") else []) + [
        "",
        "## Every name that sounds cap-exempt",
        "",
        "| Company (as filed) | Industry | Funding stage | H-1B approvals | Legal form |",
        "|---|---|---|---:|---|",
    ]
    for h in a["sounding_rows"]:
        appr = "blank" if h["total_approvals"] is None else f"{h['total_approvals']:g}"
        lines.append(f"| {h['company_name']} | {h['industry']} | {h['latest_funding_stage'] or 'blank'} | {appr} | {h['legal_form']} |")
    lines += [
        "",
        "## What this audit cannot say",
        "",
        "- Whether any employer is cap-exempt. No file in the repository records that.",
        "- Whether real universities are absent because of how the dataset was built (Form D filers only) or "
        "because of name matching. The pattern finds names, not institutions.",
        "",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------- triage inputs

def load_inputs(persona_path, ext_path, targets_path):
    try:
        persona = yaml.safe_load(Path(persona_path).read_text())
        ext = json.loads(Path(ext_path).read_text())
        targets = json.loads(Path(targets_path).read_text())
    except FileNotFoundError as err:
        raise GateHalt(f"input file not found: {err.filename}")
    except (yaml.YAMLError, json.JSONDecodeError) as err:
        raise GateHalt(f"input does not parse: {err}")
    if not isinstance(persona, dict) or "visa" not in persona:
        raise GateHalt("persona has no visa section")
    visa = persona["visa"]
    for key in ("opt_end_date", "unemployment_days_used", "unemployment_ceiling", "buffer_target"):
        if visa.get(key) is None:
            raise GateHalt(f"persona visa.{key} is missing")
    parse_date(visa["opt_end_date"], "persona visa.opt_end_date")
    for key in ("hiring_lag_days", "h1b_processing_days"):
        if not isinstance(ext.get("assumptions", {}).get(key), int):
            raise GateHalt(f"extension assumptions.{key} must be an integer number of days")
    if ext.get("lottery", {}).get("result") != "not-selected":
        raise GateHalt("this mode is for a person not selected in the H-1B lottery (extension lottery.result)")
    rows = targets.get("targets")
    if not rows:
        raise GateHalt("targets file has no targets")
    for t in rows:
        for key in ("id", "employer", "title", "url", "claimed_category", "claim_basis", "soc"):
            if not t.get(key):
                raise GateHalt(f"target {t.get('id', '?')} is missing {key}")
        if t["claimed_category"] not in CATEGORIES:
            raise GateHalt(f"target {t['id']} claimed_category must be one of {sorted(CATEGORIES)}")
        if t["claim_basis"] not in CLAIM_BASES:
            raise GateHalt(f"target {t['id']} claim_basis must be one of {sorted(CLAIM_BASES)}")
    return persona, ext, targets


def parse_liveness(paths) -> dict:
    """Parse saved stdout of `npm run ats:liveness`, one or more files in order.

    A later file is a re-check: its result for a URL supersedes an earlier one.
    No file = nothing checked.
    """
    if paths is None:
        paths = []
    elif isinstance(paths, (str, Path)):
        paths = [paths]
    results = {}
    for path in paths:
        if not Path(path).exists():
            continue
        current = None
        for raw in Path(path).read_text(encoding="utf-8", errors="replace").splitlines():
            match = LIVENESS_LINE.match(raw.strip())
            if match:
                current = normalize_url(match.group(2))
                results[current] = {"result": match.group(1), "reason": "", "file": rel(path)}
            elif current and raw.startswith("           ") and raw.strip():
                results[current]["reason"] = raw.strip()
                current = None
    return results


# ---------------------------------------------------------------- gates

def yes_no(value) -> str:
    return {True: "yes", False: "no"}.get(value, "unknown")


def timeline_gate(persona: dict, ext: dict, run_date: dt.date) -> dict:
    visa = persona["visa"]
    opt_end = parse_date(visa["opt_end_date"], "persona visa.opt_end_date")
    a = ext["assumptions"]
    required = a["hiring_lag_days"] + a["h1b_processing_days"]
    days_left = (opt_end - run_date).days
    unemployment_left = visa["unemployment_ceiling"] - visa["unemployment_days_used"] - visa["buffer_target"]
    employed = bool(ext.get("currently_employed_on_opt"))
    checks = [
        {"check": "OPT end after run date", "value": days_left, "need": "> 0", "pass": days_left > 0},
        {"check": "days left on OPT >= hiring lag + H-1B processing", "value": days_left,
         "need": f">= {required}", "pass": days_left >= required},
    ]
    if not employed:
        checks.append({"check": "unemployment days left (after buffer) >= hiring lag + processing",
                       "value": unemployment_left, "need": f">= {required}", "pass": unemployment_left >= required})
    passed = all(c["pass"] for c in checks)
    return {
        "gate": "G2 timeline",
        "pass": passed,
        "run_date": {"value": run_date.isoformat(), "provenance": "your-input"},
        "opt_end_date": {"value": opt_end.isoformat(), "provenance": "your-input (fictional persona)"},
        "days_left_on_opt": {"value": days_left, "provenance": "script-output"},
        "required_days": {"value": required, "provenance": "script-output from your-input assumptions",
                          "parts": {"hiring_lag_days": a["hiring_lag_days"], "h1b_processing_days": a["h1b_processing_days"]}},
        "margin_days": {"value": days_left - required, "provenance": "script-output"},
        "unemployment_days_left_after_buffer": {"value": unemployment_left, "provenance": "script-output"},
        "currently_employed_on_opt": {"value": employed, "provenance": "your-input (fictional extension)"},
        "stem_extension_note": (
            "STEM-eligible, but a STEM OPT extension needs an E-Verify employer; "
            f"current employer E-Verify: {yes_no(ext.get('current_employer_everify'))} (your-input). "
            "This gate uses the current OPT end date only."
            if visa.get("stem_eligible") else "not STEM-eligible"
        ),
        "checks": checks,
    }


# ---------------------------------------------------------------- per-target

def index_80days(rows: list) -> dict:
    index = {}
    for r in rows:
        key = normalize_company_name(r["company_name"])
        if key:
            index.setdefault(key, []).append(r)
    return index


def bls_median(bls_rows: list, soc: str):
    candidates = [r for r in bls_rows if r["bls_soc_code"] == soc]
    if not candidates:
        return None
    exact = [r for r in candidates if r["onet_soc_code"] == f"{soc}.00"]
    row = (exact or candidates)[0]
    return {"soc": soc, "title": row["title"], "annual_median_wage": to_number(row["annual_median_wage"]),
            "oews_year": row["oews_year"]}


def tokens(name: str) -> set:
    return {w for w in re.findall(r"[a-z0-9]+", name.lower()) if w not in NEAR_MISS_STOP}


def load_records(ipeds_path, uscis_path) -> dict:
    """Index the IPEDS and USCIS extracts by normalized name. A missing extract
    switches that check off (and says so); it is never treated as 'no record'."""
    records = {"ipeds": None, "uscis": None, "notes": [], "inputs": {}}
    if ipeds_path and Path(ipeds_path).exists():
        rows = read_csv_checked(ipeds_path, IPEDS_COLUMNS, "IPEDS extract")
        index = {}
        for r in rows:
            names = [r["INSTNM"]] + [a for a in r["IALIAS"].split("|") if a.strip()]
            for n in names:
                key = normalize_company_name(n)
                if key and r not in index.setdefault(key, []):
                    index[key].append(r)
        records["ipeds"] = {"index": index, "by_unitid": {r["UNITID"]: r for r in rows},
                            "names": sorted({r["INSTNM"] for r in rows})}
        records["inputs"]["ipeds_extract"] = {"path": rel(ipeds_path), "sha256": sha256(ipeds_path)}
    else:
        records["notes"].append("IPEDS extract not present — university-list check switched off")
    if uscis_path and Path(uscis_path).exists():
        rows = read_csv_checked(uscis_path, USCIS_COLUMNS, "USCIS extract")
        index = {}
        for r in rows:
            key = normalize_company_name(r["Employer"])
            if key:
                index.setdefault(key, []).append(r)
        records["uscis"] = {"index": index, "names": sorted({r["Employer"] for r in rows if r["Employer"].strip()})}
        records["inputs"]["uscis_extract"] = {"path": rel(uscis_path), "sha256": sha256(uscis_path)}
    else:
        records["notes"].append("USCIS extract not present — H-1B history check switched off")
    return records


def near_misses(names: list, pool: list, limit: int = 3) -> list:
    """Token-overlap candidates for a human to review. Never used as a signal."""
    wanted = [tokens(n) for n in names if n]
    scored = []
    for candidate in pool:
        ct = tokens(candidate)
        best = max((len(q & ct) / len(q) for q in wanted if q), default=0)
        overlap = max((len(q & ct) for q in wanted if q), default=0)
        if best >= 0.6 and overlap >= 2:
            scored.append((-best, candidate))
    return [c for _, c in sorted(scored)[:limit]]


def ipeds_check(t: dict, records: dict) -> dict:
    ip = records["ipeds"]
    if ip is None:
        return {"status": "off"}
    if t.get("ipeds_unitid"):
        row = ip["by_unitid"].get(str(t["ipeds_unitid"]))
        rows, how = ([row] if row else []), "record (link chosen by a human: UNITID)"
    else:
        names = [t["employer"], t.get("legal_name")]
        rows, how = [], "record (exact normalized name)"
        for n in names:
            for r in ip["index"].get(normalize_company_name(n or ""), []):
                if r not in rows:
                    rows.append(r)
        if len(rows) > 1 and t.get("state"):
            rows = [r for r in rows if r["STABBR"] == t["state"]] or rows
    if not rows:
        return {"status": "no-match", "candidates": near_misses([t["employer"], t.get("legal_name")], ip["names"])}
    if len(rows) > 1:
        return {"status": "ambiguous", "candidates": [f"{r['INSTNM']} ({r['STABBR']}, UNITID {r['UNITID']})" for r in rows[:5]]}
    r = rows[0]
    closed = r["CLOSEDAT"].strip() not in ("", "-2")
    return {"status": "match", "provenance": how, "unitid": r["UNITID"], "name": r["INSTNM"], "state": r["STABBR"],
            "control": IPEDS_CONTROL.get(r["CONTROL"], f"code {r['CONTROL']}"), "closed": closed,
            "closed_date": r["CLOSEDAT"] if closed else None}


def uscis_check(t: dict, records: dict) -> dict:
    us = records["uscis"]
    if us is None:
        return {"status": "off"}
    if t.get("uscis_employer"):
        keys, how = [normalize_company_name(t["uscis_employer"])], "record (link chosen by a human)"
    else:
        keys, how = [normalize_company_name(n) for n in (t["employer"], t.get("legal_name")) if n], "record (exact normalized name)"
    rows, seen = [], set()
    for k in keys:
        for r in us["index"].get(k, []):
            if id(r) not in seen:
                seen.add(id(r))
                rows.append(r)
    if not rows:
        return {"status": "no-match", "candidates": near_misses([t["employer"], t.get("legal_name")], us["names"])}

    def total(col):
        return sum(int(to_number(r[col]) or 0) for r in rows)

    return {"status": "match", "provenance": how, "fiscal_year": 2023,
            "names": sorted({r["Employer"] for r in rows}), "rows": len(rows),
            "states": sorted({r["State"] or "blank" for r in rows}), "naics": sorted({r["NAICS"] for r in rows}),
            "initial_approvals": total("Initial Approval"), "initial_denials": total("Initial Denial"),
            "continuing_approvals": total("Continuing Approval"), "continuing_denials": total("Continuing Denial")}


def triage_target(t: dict, liveness: dict, index: dict, bls_rows: list, records: dict = None) -> dict:
    url = normalize_url(t["url"])
    live = liveness.get(url)
    live_result = live["result"] if live else "unchecked"

    signals = []
    names = [n for n in (t["employer"], t.get("legal_name")) if n]
    matches = []
    for n in names:
        matches = matches or index.get(normalize_company_name(n), [])
    form_d = None
    if matches:
        m = matches[0]
        form_d = {"company_name": m["company_name"], "latest_funding_stage": m["latest_funding_stage"] or None,
                  "latest_funding_date": m["latest_funding_date"] or None,
                  "total_funding": to_number(m["total_funding"]), "total_approvals": to_number(m["Total Approvals"])}
        signals.append({"signal": "appears in the SEC Form D-derived dataset (raises private capital)",
                        "detail": f"{m['company_name']} — stage {m['latest_funding_stage'] or 'blank'}",
                        "provenance": "record"})
    # The legal name, when given, is what the legal form is read from; the posting name otherwise.
    form_name = t.get("legal_name") or t["employer"]
    form = legal_form(form_name)
    if form == "for-profit-form":
        signals.append({"signal": "for-profit legal form in name (LLC/LP/LLP/PBC/L3C)",
                        "detail": form_name, "provenance": "script-output"})
    # Recipe stop condition: a claim with no recorded source is treated as resting on the name only.
    basis = t["claim_basis"] if str(t.get("claim_source", "")).strip() else "name-only"
    if t["claimed_category"] != "none" and basis == "name-only":
        detail = t["claimed_category"] + ("" if basis == t["claim_basis"] else " (no claim_source recorded)")
        signals.append({"signal": "cap-exempt category not stated by the employer — the claim rests on the name or a reading",
                        "detail": detail, "provenance": "your-input"})

    wage = bls_median(bls_rows, t["soc"])
    posted = [x for x in (t.get("posted_salary_min"), t.get("posted_salary_max")) if isinstance(x, (int, float))]
    wage_view = {"soc": t["soc"], "soc_basis": t.get("soc_basis", ""), "soc_provenance": "model-judgment",
                 "national_median": None, "posted_midpoint": None, "posted_vs_national_pct": None}
    if wage:
        wage_view.update({"soc_title": wage["title"], "national_median": wage["annual_median_wage"],
                          "national_median_provenance": f"record (BLS OEWS May {wage['oews_year']}, national)"})
    if posted:
        mid = sum(posted) / len(posted)
        wage_view["posted_midpoint"] = mid
        wage_view["posted_provenance"] = "your-input (copied from the posting)"
        if wage and wage["annual_median_wage"]:
            wage_view["posted_vs_national_pct"] = round(100 * (mid - wage["annual_median_wage"]) / wage["annual_median_wage"], 1)

    records = records or {"ipeds": None, "uscis": None}
    ipeds = ipeds_check(t, records)
    uscis = uscis_check(t, records)
    support = []
    if ipeds["status"] == "match":
        detail = f"{ipeds['name']} ({ipeds['state']}, UNITID {ipeds['unitid']}) — {ipeds['control']}"
        if ipeds["control"] == "private for-profit":
            signals.append({"signal": "listed in IPEDS as a private for-profit institution — HEA §101(a) "
                                      "requires a public or other nonprofit institution", "detail": detail,
                            "provenance": ipeds["provenance"]})
        elif ipeds["closed"]:
            signals.append({"signal": f"IPEDS records the institution as closed ({ipeds['closed_date']})",
                            "detail": detail, "provenance": ipeds["provenance"]})
        else:
            support.append({"signal": "listed in IPEDS as a " + ipeds["control"] + " institution",
                            "detail": detail, "provenance": ipeds["provenance"]})

    if t.get("exemption_evidence"):
        exempt_status = "HUMAN-ATTESTED"
    elif signals:
        exempt_status = "CONTRADICTED-BY-SIGNAL"
    elif support:
        exempt_status = "UNVERIFIED-RECORD-SUPPORTED"
    else:
        exempt_status = "UNVERIFIED"

    if live_result == "expired" and live["reason"].startswith(SOFT_EXPIRED_REASON):
        live_result = "uncertain"
        outcome = "HELD — liveness uncertain"
        why = ("checker said expired on its page-length rule only (" + live["reason"] + "); "
               "iframe-based job boards trip this on live postings — open the posting yourself")
    elif live_result == "expired":
        outcome, why = "SKIP — expired", live["reason"] or "liveness: expired"
    elif live_result in ("unchecked", "uncertain"):
        outcome = "HELD — liveness " + live_result
        why = "not checked — not scored; run ats:liveness and re-run" if live_result == "unchecked" else (live["reason"] or "uncertain")
    elif t["claimed_category"] == "none":
        outcome, why = "SKIP — no cap-exempt claim", "employer does not claim a qualifying category; out of scope"
    elif signals:
        outcome, why = "FLAG — claim contradicted", "; ".join(s["signal"] for s in signals)
    elif exempt_status == "HUMAN-ATTESTED":
        outcome, why = "SHORTLIST — HR answer recorded", "human-attested, not machine-verified"
    elif support:
        outcome = "SHORTLIST — exemption UNVERIFIED (record-supported)"
        why = "a federal record supports the category; still ask HR: do you file H-1B petitions as cap-exempt for this role?"
    else:
        outcome, why = "SHORTLIST — exemption UNVERIFIED", "ask HR: do you file H-1B petitions as cap-exempt, and under which category?"

    return {
        "id": t["id"], "employer": t["employer"], "title": t["title"], "url": t["url"],
        "liveness": {"result": live_result, "reason": live["reason"] if live else "",
                     "checker_said": live["result"] if live else None,
                     "source_file": live.get("file") if live else None,
                     "provenance": "script-output (ats:liveness)" if live else "none — not checked"},
        "claimed_category": {"value": t["claimed_category"], "basis": basis,
                             "source": t.get("claim_source", ""), "provenance": "your-input"},
        "cap_exempt_status": exempt_status,
        "signals": signals,
        "support": support,
        "ipeds": ipeds,
        "uscis_h1b_fy2023": uscis,
        "form_d_match": form_d,
        "legal_form": form,
        "wage": wage_view,
        "outcome": outcome,
        "why": why,
    }


# ---------------------------------------------------------------- triage run

def run_triage(args) -> dict:
    run_date = parse_date(args.run_date, "--run-date")
    persona, ext, targets = load_inputs(args.persona, args.ext, args.targets)
    rows_80 = read_csv_checked(args.csv, REQUIRED_80DAYS_COLUMNS, "80 Days CSV")
    bls_rows = read_csv_checked(args.bls, REQUIRED_BLS_COLUMNS, "BLS compact CSV")
    liveness = parse_liveness(args.liveness)
    records = load_records(args.ipeds, args.uscis)

    inputs = {}
    liveness_files = args.liveness or []
    named = [("persona", args.persona), ("extension", args.ext), ("targets", args.targets)]
    named += [(f"liveness_{i + 1}", p) for i, p in enumerate(liveness_files)] or [("liveness", None)]
    named += [("80days_csv", args.csv), ("bls_csv", args.bls)]
    for label, path in named:
        if path and Path(path).exists():
            inputs[label] = {"path": rel(path), "sha256": sha256(path)}
        else:
            inputs[label] = {"path": rel(path) if path else None, "sha256": None, "note": "not provided"}
    inputs.update(records["inputs"])

    g2 = timeline_gate(persona, ext, run_date)
    log = {
        "mode": "varnikamujumdar-cap-exempt-triage",
        "recipe_version": "0.1.0",
        "run_date": run_date.isoformat(),
        "persona": persona.get("candidate", {}).get("name", "unknown") + " (fictional)",
        "lottery": ext["lottery"],
        "inputs": inputs,
        "gates": {"G1 input": {"pass": True}, "G2 timeline": g2},
        "rows": [],
    }
    if not g2["pass"]:
        log["status"] = "STOPPED at G2 timeline — no employer is evaluated; talk to your DSO before applying"
        log["record_checks"] = ["not run — stopped at G2"]
        log["summary"] = {"evaluated": 0}
        return log

    index = index_80days(rows_80)
    log["record_checks"] = records["notes"] or ["IPEDS and USCIS extracts loaded"]
    log["rows"] = [triage_target(t, liveness, index, bls_rows, records) for t in targets["targets"]]
    outcomes = [r["outcome"].split(" — ")[0] for r in log["rows"]]
    n = len(outcomes)
    g4 = g4_gate(log["rows"], getattr(args, "g4", None))
    log["gates"]["G4 human"] = g4
    if g4["cleared"]:
        log["status"] = f"COMPLETED — G4 cleared by {g4['by']} on {g4['date']}: {g4_counts_text(g4)}"
    else:
        log["status"] = ("COMPLETED — human gate open: the person decides which shortlisted employers to contact"
                         + (f" ({g4['reason']})" if g4.get("source_file") else ""))
    if getattr(args, "g4", None) and Path(args.g4).exists():
        log["inputs"]["g4_decisions"] = {"path": rel(args.g4), "sha256": sha256(args.g4)}
    log["summary"] = {
        "evaluated": n,
        "shortlist": outcomes.count("SHORTLIST"),
        "flag": outcomes.count("FLAG"),
        "held": outcomes.count("HELD"),
        "skip": outcomes.count("SKIP"),
        "not_shortlisted_rate": round((n - outcomes.count("SHORTLIST")) / n, 3) if n else None,
        "liveness_checked": sum(1 for r in log["rows"] if r["liveness"]["result"] != "unchecked"),
        "record_supported": sum(1 for r in log["rows"] if r["cap_exempt_status"] == "UNVERIFIED-RECORD-SUPPORTED"),
        "uscis_matched": sum(1 for r in log["rows"] if r["uscis_h1b_fy2023"]["status"] == "match"),
        "uscis_matched_employers": len({tuple(r["uscis_h1b_fy2023"]["names"]) for r in log["rows"]
                                        if r["uscis_h1b_fy2023"]["status"] == "match"}),
        "cap_exempt_verified": 0,
    }
    return log


def g4_gate(rows: list, g4_path) -> dict:
    """G4 is cleared only when a named person dated a decision for every row the
    gates did not skip. Anything less leaves the human gate open."""
    gate = {"gate": "G4 human", "cleared": False, "provenance": "human decision"}
    if not g4_path:
        gate["reason"] = "no decisions file — human gate open"
        return gate
    try:
        d = json.loads(Path(g4_path).read_text())
    except (FileNotFoundError, json.JSONDecodeError) as err:
        gate["reason"] = f"decisions file unusable: {err}"
        return gate
    decisions = d.get("decisions") or {}
    need = [r["id"] for r in rows if not r["outcome"].startswith("SKIP")]
    problems = []
    if not str(d.get("by", "")).strip():
        problems.append("no 'by' (who decided)")
    try:
        dt.date.fromisoformat(str(d.get("date")))
    except ValueError:
        problems.append("no valid 'date'")
    missing = [i for i in need if i not in decisions]
    invalid = {i: v for i, v in decisions.items() if v not in G4_DECISIONS}
    counts = {k: sum(1 for i in need if decisions.get(i) == k) for k in sorted(G4_DECISIONS)}
    gate.update({"by": d.get("by"), "date": d.get("date"), "source_file": rel(g4_path),
                 "rows_needing_a_decision": need, "missing": missing, "invalid": invalid,
                 "problems": problems, "counts": counts,
                 "cleared": not (missing or invalid or problems)})
    if not gate["cleared"]:
        gate["reason"] = "; ".join(problems + ([f"no decision for {', '.join(missing)}"] if missing else [])
                                   + ([f"invalid decision for {', '.join(invalid)}"] if invalid else []))
    for r in rows:
        if r["id"] in decisions:
            r["g4_decision"] = {"value": decisions[r["id"]], "by": d.get("by"), "date": d.get("date"),
                                "provenance": "human decision"}
    return gate


def g4_counts_text(g4: dict) -> str:
    return ", ".join(f"{n} {k}" for k, n in g4.get("counts", {}).items() if n) or "no decisions"


def failed_checks_text(g2: dict) -> str:
    failed = [c for c in g2["checks"] if not c["pass"]]
    return "; ".join(f"{c['check']}: {c['value']} (need {c['need']})" for c in failed) or "none"


def g4_table_row(log: dict) -> str:
    g4 = log["gates"].get("G4 human")
    if not g4:
        return "| G4 human | not reached | the run stopped earlier |"
    if g4["cleared"]:
        return f"| G4 human | CLEARED | by {g4['by']} on {g4['date']}: {g4_counts_text(g4)} |"
    return f"| G4 human | OPEN | {g4.get('reason', 'no decisions recorded')} |"


def ipeds_cell(check: dict) -> str:
    return {"off": "check off", "no-match": "not listed", "ambiguous": "ambiguous"}.get(
        check.get("status"), f"{check.get('control')}{' (closed)' if check.get('closed') else ''}")


def uscis_cell(check: dict) -> str:
    if check.get("status") != "match":
        return {"off": "check off", "no-match": "no exact match"}.get(check.get("status"), "—")
    return f"{check['initial_approvals']} initial / {check['continuing_approvals']} continuing"


def fmt_money(x):
    return "—" if x is None else f"${x:,.0f}"


def report_markdown(log: dict) -> str:
    g2 = log["gates"]["G2 timeline"]
    s = log["summary"]
    lines = ["# Cap-exempt triage report", "", "## Executive summary", ""]
    if not log["rows"]:
        lines += [
            "This report was meant to sort job postings at employers that can sponsor a work visa without the "
            "H-1B lottery. It stopped before looking at any employer, because the person's work authorization "
            f"does not leave enough time ({failed_checks_text(g2)}; {g2['required_days']['value']} days are assumed "
            "for hiring plus visa processing). "
            "Read this as a reason to talk to a school immigration adviser now, not as a ranking.",
            "",
        ]
    else:
        lines += [
            "This report sorts job postings for a person who was not picked in the H-1B visa lottery and is "
            "looking for employers that can sponsor without it — universities, their affiliated nonprofits and "
            "nonprofit research institutes. Read it to see which postings are worth asking about and which are not. "
            f"Of {s['evaluated']} postings: {s['shortlist']} shortlisted; {s['flag']} flagged, because a record, the "
            f"employer's legal form, or a claim resting on the name alone undercuts the claim; {s['held']} held, because "
            f"nobody confirmed the posting is still open; {s['skip']} skipped. "
            f"{s['record_supported']} have a federal university-list record supporting the claim, and "
            f"{s['uscis_matched']} postings ({s['uscis_matched_employers']} distinct employers) have government H-1B approval "
            "counts on record. **No employer is confirmed cap-exempt** — no file "
            "can confirm that; only the employer (and USCIS) can. The next step is a human one: ask HR. "
            + (f"The person's own decisions (gate G4) were recorded by {log['gates']['G4 human']['by']}: "
               f"{g4_counts_text(log['gates']['G4 human'])}."
               if log["gates"].get("G4 human", {}).get("cleared") else "No human decisions (gate G4) are recorded yet."),
            "",
        ]
    lines += [
        "## Run record", "",
        f"- Mode: `{log['mode']}` v{log['recipe_version']} · run date {log['run_date']}",
        f"- Persona: {log['persona']} · lottery: {log['lottery'].get('registration_fy', '?')} {log['lottery'].get('result')}",
        f"- Status: {log['status']}",
        f"- Record checks: {'; '.join(log.get('record_checks', []))}",
        "", "## Gates", "",
        "| Gate | Result | Detail |", "|---|---|---|",
        "| G1 input | PASS | persona, extension, targets and both CSVs parsed; expected columns present |",
        f"| G2 timeline | {'PASS' if g2['pass'] else 'STOP — ' + failed_checks_text(g2)} | {g2['days_left_on_opt']['value']} days of OPT left vs "
        f"{g2['required_days']['value']} required (hiring {g2['required_days']['parts']['hiring_lag_days']} + "
        f"processing {g2['required_days']['parts']['h1b_processing_days']}, your-input); margin {g2['margin_days']['value']} |",
        "| G3 liveness | per row | unchecked or uncertain → HELD, never scored |",
        g4_table_row(log),
        "", f"_{g2['stem_extension_note']}_", "",
    ]
    if log["rows"]:
        lines += [
            "## Postings", "",
            "| # | Employer · role | Liveness | Claimed category (basis) | IPEDS (federal college list) | H-1B approvals FY2023 (USCIS) | Cap-exempt status | National median (SOC) | Posted midpoint | Outcome |",
            "|---|---|---|---|---|---|---|---|---|---|",
        ]
        for r in log["rows"]:
            w = r["wage"]
            pct = "" if w["posted_vs_national_pct"] is None else f" ({w['posted_vs_national_pct']:+.1f}%)"
            lines.append(
                f"| {r['id']} | {r['employer']} · {r['title']} | {r['liveness']['result']} | "
                f"{r['claimed_category']['value']} ({r['claimed_category']['basis']}) | {ipeds_cell(r['ipeds'])} | "
                f"{uscis_cell(r['uscis_h1b_fy2023'])} | {r['cap_exempt_status']} | "
                f"{fmt_money(w['national_median'])} ({w['soc']}) | {fmt_money(w['posted_midpoint'])}{pct} | **{r['outcome']}** |"
            )
        g4 = log["gates"].get("G4 human", {})
        if g4.get("cleared"):
            lines += ["", "## G4 human decisions", "",
                      f"Recorded by **{g4['by']}** on {g4['date']} (`{g4['source_file']}`). These are the person's "
                      "decisions, not the tool's.", "",
                      "| # | Employer | Tool outcome | Decision |", "|---|---|---|---|"]
            for r in log["rows"]:
                dec = r.get("g4_decision", {}).get("value", "— (skipped by a gate)")
                lines.append(f"| {r['id']} | {r['employer']} | {r['outcome']} | **{dec}** |")
        lines += ["", "## Why each outcome", ""]
        for r in log["rows"]:
            lines.append(f"- **{r['id']} {r['employer']}** — {r['why']}")
            for sig in r["signals"]:
                lines.append(f"  - signal ({sig['provenance']}): {sig['signal']} — {sig['detail']}")
            for sup in r.get("support", []):
                lines.append(f"  - supporting ({sup['provenance']}): {sup['signal']} — {sup['detail']}")
            u = r.get("uscis_h1b_fy2023", {})
            if u.get("status") == "match":
                lines.append(f"  - H-1B history ({u['provenance']}): FY2023 initial approvals {u['initial_approvals']}, "
                             f"continuing {u['continuing_approvals']} (denials {u['initial_denials']}/{u['continuing_denials']}); "
                             f"filed as {', '.join(u['names'])}; NAICS {', '.join(u['naics'])}. Counts petitions — not whether any was cap-exempt.")
            for label, check in (("IPEDS", r.get("ipeds", {})), ("USCIS", u)):
                if check.get("status") in ("no-match", "ambiguous") and check.get("candidates"):
                    lines.append(f"  - {label} candidates for human review (not used): " + "; ".join(check["candidates"]))
        lines += [
            "", "## Read this before acting", "",
            "- *Cap-exempt status* is never VERIFIED here. UNVERIFIED means the employer's own page states a qualifying "
            "category; RECORD-SUPPORTED adds a federal college-list record. Neither means the employer files cap-exempt "
            "petitions for this role.",
            "- H-1B approval counts (USCIS FY2023) show the employer sponsors; they do not show cap-exempt filing. "
            "\"No exact match\" is not \"never sponsored\" — the employer may file under another spelling (see candidates).",
            "- National medians are BLS OEWS national figures. Cap-exempt employers may use a separate, lower "
            "prevailing-wage table (ACWIA) that is not in this repository, so a posted salary below the national "
            "median is expected and is not a red flag by itself.",
            "- SOC codes are a judgment about the job title, not a record.",
            "- A cap-exempt H-1B does not count against the cap; moving later to a cap-subject employer would need the lottery.",
            "",
        ]
    return "\n".join(lines)


# ---------------------------------------------------------------- CLI

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("audit", help="coverage audit of the 80 Days CSV")
    pa.add_argument("--csv", default=str(DEFAULT_80DAYS))
    pa.add_argument("--ipeds", default=str(DEFAULT_IPEDS), help="IPEDS extract for the overlap measure (missing = skipped)")
    pa.add_argument("--out", help="write the audit Markdown here (default: stdout)")
    pa.add_argument("--json", action="store_true", help="print the audit counts as JSON to stderr")

    pt = sub.add_parser("triage", help="gate and triage a list of postings for one persona")
    pt.add_argument("--persona", required=True)
    pt.add_argument("--ext", required=True, help="fictional persona extension (lottery result, assumptions)")
    pt.add_argument("--targets", required=True)
    pt.add_argument("--liveness", action="append",
                    help="saved stdout of `npm run ats:liveness`; repeat for re-checks (later supersedes); omitted = nothing checked")
    pt.add_argument("--csv", default=str(DEFAULT_80DAYS))
    pt.add_argument("--bls", default=str(DEFAULT_BLS))
    pt.add_argument("--ipeds", default=str(DEFAULT_IPEDS), help="IPEDS extract from ingest.py (missing = check off)")
    pt.add_argument("--uscis", default=str(DEFAULT_USCIS), help="USCIS FY2023 extract from ingest.py (missing = check off)")
    pt.add_argument("--g4", help="human G4 decisions JSON {by, date, decisions{id: contact-hr|open-posting-myself|keep-held|drop}}")
    pt.add_argument("--run-date", default=dt.date.today().isoformat())
    pt.add_argument("--out-dir", required=True)

    args = parser.parse_args(argv)
    try:
        if args.cmd == "audit":
            audit = run_audit(Path(args.csv), args.ipeds)
            text = audit_markdown(audit)
            if args.out:
                Path(args.out).parent.mkdir(parents=True, exist_ok=True)
                Path(args.out).write_text(text)
                print(f"wrote {args.out}")
            else:
                print(text)
            if args.json:
                counts = {k: v for k, v in audit.items() if k != "sounding_rows"}
                print(json.dumps(counts, indent=2), file=sys.stderr)
            return 0

        log = run_triage(args)
    except GateHalt as err:
        print(f"✗ G1 input gate: {err}. Nothing written.", file=sys.stderr)
        return 2

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / "run.json").write_text(json.dumps(log, indent=2) + "\n")
    (out / "report.md").write_text(report_markdown(log))
    g2 = log["gates"]["G2 timeline"]
    print(f"✓ G1 input gate: inputs parsed")
    print(f"{'✓' if g2['pass'] else '✗'} G2 timeline gate: {g2['days_left_on_opt']['value']} days of OPT left, "
          f"{g2['required_days']['value']} required, OPT margin {g2['margin_days']['value']}")
    if not g2["pass"]:
        print(f"  failed: {failed_checks_text(g2)}")
    for r in log["rows"]:
        print(f"  {r['id']:<4} {r['liveness']['result']:<10} {r['cap_exempt_status']:<28} {r['outcome']:<36} {r['employer']}")
    g4 = log["gates"].get("G4 human")
    if g4:
        print(f"{'✓' if g4['cleared'] else '…'} G4 human gate: "
              + (f"cleared by {g4['by']} on {g4['date']} ({g4_counts_text(g4)})" if g4["cleared"] else g4.get("reason", "open")))
    print(f"status: {log['status']}")
    print(f"summary: {json.dumps(log['summary'])}")
    print(f"wrote {out / 'run.json'} and {out / 'report.md'}")
    return 0 if g2["pass"] else 3


if __name__ == "__main__":
    sys.exit(main())
