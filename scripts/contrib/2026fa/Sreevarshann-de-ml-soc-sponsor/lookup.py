"""Offline evidence lookups for the de-ml-soc-sponsor mode (steps 1-4 and 6).

Every emitted value is wrapped as {"value": ..., "source": <label>} where the
label is one of: record, model-judgment, your-input, proposed, sample.

Standard library only. No network. Reads only tracked public data:
  data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
  data/bls/compact/soc_occupation_compact.csv
  data/sec/form-d/processed/sample/*.sample.json
"""

from __future__ import annotations

import ast
import csv
import json
import re
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SPONSOR_CSV = REPO / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
BLS_CSV = REPO / "data/bls/compact/soc_occupation_compact.csv"
FORMD_SAMPLE_DIR = REPO / "data/sec/form-d/processed/sample"
SCORER = REPO / "scripts/score/role-scorer.mjs"

REC, JUDG, INPUT, PROPOSED, SAMPLE = "record", "model-judgment", "your-input", "proposed", "sample"

# Only these sponsor-CSV columns are ever read into memory. phone,
# executive_officers and board_directors hold people's details and are never
# loaded, so they cannot leak into an output.
SPONSOR_COLUMNS = [
    "company_name",
    "Total Approvals",
    "Total Denials",
    "Approval_Rate",
    "median_salary_offered",
    "top_job_titles_sponsored",
    "latest_funding_date",
    "latest_funding_stage",
]
BLS_COLUMNS = ["onet_soc_code", "bls_soc_code", "title", "job_zone", "annual_median_wage", "oews_year", "cognitive_pivot_score"]

NULLS = {"", "null", "none", "nan", "n/a"}

# ── Decisions recorded in the recipe ([TODO: DEFINE] closures, by the user) ──
# Sponsorship tier rule (decision 3). Company-wide, not role-specific.
PROVEN_MIN_APPROVALS = 10
PROVEN_MIN_RATE = 90.0
# Tier -> sponsorship.p. The scorer has no tier->p convention (its fixtures
# use 1.0, 0.9 and 0.5 for "proven"), so this mapping is the user's definition.
TIER_P = {"proven": 0.9, "likely": 0.7, "possible": 0.3}
# Fit (decision 4): neutral constant so fit cannot drive the ranking.
FIT_NEUTRAL = 0.5
# Timeline (decision 1): remaining = 90 - unemployment_days_used;
# gate = 1 if remaining > buffer_target else 0.
OPT_UNEMPLOYMENT_LIMIT = 90
# Title keywords -> candidate SOC codes (decision 5). A model-judgment mapping.
DATA_SOCS = ["15-1252", "15-1243"]
ML_SOCS = ["15-1252", "15-2051"]
KEYWORD_SOCS = {
    "data engineer": DATA_SOCS,
    "etl": DATA_SOCS,
    "data platform": DATA_SOCS,
    "analytics engineer": DATA_SOCS,
    "machine learning": ML_SOCS,
    "ml engineer": ML_SOCS,
    "mlops": ML_SOCS,
    "ai engineer": ML_SOCS,
}
CANDIDATE_SOCS = sorted({s for socs in KEYWORD_SOCS.values() for s in socs})

# Copied verbatim from scripts/score/role-scorer.mjs:60 (applyProfile). If this
# matches the authorization string, the scorer decides the profile does NOT
# need sponsorship. A test pins this copy to the scorer source.
SCORER_NO_SPONSOR_RE = r"citizen|permanent|green|gc|pr\b|no.?sponsor|authorized"

PER_EMPLOYER_SOC_TODO = (
    "[TODO: DATA SOURCE] DOL OFLC LCA disclosure data (per-filing employer, "
    "job title, SOC code, wage). Not in the repo; this check has not run."
)

PRIVATE_PREFIXES = ("private/", "data/ats/")
PRIVATE_FILES = ("search/resume.json",)


class InputError(ValueError):
    """A conformance failure in an input: the run halts."""


def labelled(value, source, note=None):
    out = {"value": value, "source": source}
    if note:
        out["note"] = note
    return out


def missing(source, note):
    return labelled(None, source, note)


# ── paths ────────────────────────────────────────────────────────────────

def repo_relative(path) -> str:
    p = Path(path).resolve()
    try:
        return p.relative_to(REPO).as_posix()
    except ValueError:
        return p.as_posix()


def is_private_path(path) -> bool:
    rel = repo_relative(path)
    if rel in PRIVATE_FILES:
        return True
    return any(rel == pre.rstrip("/") or rel.startswith(pre) for pre in PRIVATE_PREFIXES)


# ── name normalization ───────────────────────────────────────────────────
# Same rules as normalize_company_name in scripts/sec/entity-resolution.py
# (lines 44-58, 77-92) and scripts/sec/sec-all-quarters.py, which share one
# suffix list. Copied, not imported: entity-resolution.py has a hyphenated
# filename. A test pins this copy to both originals.
COMPANY_SUFFIXES = [
    r"\s+inc\.?$",
    r"\s+incorporated$",
    r"\s+llc\.?$",
    r"\s+l\.?l\.?c\.?$",
    r"\s+ltd\.?$",
    r"\s+limited$",
    r"\s+corp\.?$",
    r"\s+corporation$",
    r"\s+co\.?$",
    r"\s+company$",
    r"\s+l\.?p\.?$",
    r"\s+lp$",
    r"\s+plc\.?$",
]


def normalize(name) -> str:
    if name is None or str(name).strip().lower() in NULLS:
        return ""
    cleaned = str(name).strip()
    changed = True
    while changed:
        changed = False
        for suffix in COMPANY_SUFFIXES:
            result = re.sub(suffix, "", cleaned, flags=re.IGNORECASE)
            if result != cleaned:
                cleaned = result.strip()
                changed = True
    cleaned = re.sub(r"[,.\s\-&']", "", cleaned)
    return cleaned.lower()


def parse_number(raw):
    """Return a float, or None when the field is empty. Missing is never 0."""
    if raw is None or str(raw).strip().lower() in NULLS:
        return None
    return float(raw)


# ── step 1: targets ──────────────────────────────────────────────────────

TARGET_COLUMNS = ["company_name", "posting_url", "posting_title"]
URL_RE = re.compile(r"^https?://[^\s/]+\.[^\s/]+(/\S*)?$")


def read_targets(path) -> list[dict]:
    if is_private_path(path):
        raise InputError(f"refusing to read a private path: {repo_relative(path)}")
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        header = reader.fieldnames or []
        absent = [c for c in TARGET_COLUMNS if c not in header]
        if absent:
            raise InputError(f"targets file is missing column(s): {', '.join(absent)}")
        rows = list(reader)
    if not rows:
        raise InputError("targets file has no rows")
    problems = []
    for i, row in enumerate(rows, start=2):
        for col in TARGET_COLUMNS:
            if not (row.get(col) or "").strip():
                problems.append(f"line {i}: empty {col}")
        url = (row.get("posting_url") or "").strip()
        if url and not URL_RE.match(url):
            problems.append(f"line {i}: posting_url is not an http(s) URL")
    urls = [(r.get("posting_url") or "").strip() for r in rows]
    for u in {u for u in urls if u and urls.count(u) > 1}:
        problems.append(f"duplicate posting_url: {u}")
    if problems:
        raise InputError("; ".join(problems))
    return [{c: row[c].strip() for c in TARGET_COLUMNS} for row in rows]


# ── step 2: sponsor lookup ───────────────────────────────────────────────

def load_sponsor_index(path=SPONSOR_CSV) -> dict[str, list[dict]]:
    index: dict[str, list[dict]] = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            kept = {c: row.get(c, "") for c in SPONSOR_COLUMNS}
            key = normalize(kept["company_name"])
            if key:
                index.setdefault(key, []).append(kept)
    return index


def sponsorship_tier(approvals, denials, rate):
    """Decision 3. Returns (tier, reason). tier None means blocked."""
    if approvals is None or denials is None:
        return None, "no sponsorship record for this company in the dataset"
    if approvals >= PROVEN_MIN_APPROVALS and rate is not None and rate >= PROVEN_MIN_RATE:
        return "proven", f"approvals {approvals:g} >= {PROVEN_MIN_APPROVALS} and approval rate {rate:g} >= {PROVEN_MIN_RATE:g}"
    if approvals >= 1:
        return "likely", f"approvals {approvals:g} >= 1"
    if denials >= 1:
        return "possible", f"0 approvals, {denials:g} denial(s) on record"
    return None, "0 approvals and 0 denials on record"


def sponsor_lookup(company_name, index) -> dict:
    key = normalize(company_name)
    rows = index.get(key, []) if key else []
    out = {"query": company_name, "normalized": key}
    if not rows:
        out["status"] = "not_found"
        out["reason"] = "no exact normalized-name match in the sponsorship dataset"
        return out
    if len(rows) > 1:
        out["status"] = "ambiguous"
        out["reason"] = f"{len(rows)} dataset rows normalize to the same name"
        out["candidates"] = [r["company_name"] for r in rows]
        return out
    row = rows[0]
    approvals = parse_number(row["Total Approvals"])
    denials = parse_number(row["Total Denials"])
    rate = parse_number(row["Approval_Rate"])
    salary = parse_number(row["median_salary_offered"])
    note_missing = "field empty in the dataset"
    out["matched_name"] = labelled(row["company_name"], REC)
    out["approvals"] = labelled(approvals, REC) if approvals is not None else missing(REC, note_missing)
    out["denials"] = labelled(denials, REC) if denials is not None else missing(REC, note_missing)
    out["approval_rate_pct"] = labelled(rate, REC) if rate is not None else missing(REC, note_missing)
    out["median_salary_company_wide"] = (
        labelled(salary, REC, "one figure for the whole company, not per role or SOC")
        if salary is not None else missing(REC, note_missing)
    )
    out["funding_csv"] = {
        "latest_funding_date": _str_or_missing(row["latest_funding_date"]),
        "latest_funding_stage": _str_or_missing(row["latest_funding_stage"]),
    }
    out["top_job_titles_raw"] = row["top_job_titles_sponsored"]
    tier, reason = sponsorship_tier(approvals, denials, rate)
    if tier is None:
        out["status"] = "no_sponsorship_record"
        out["reason"] = reason
        return out
    out["status"] = "found"
    out["tier"] = labelled(tier, REC, reason)
    out["sponsorship_p"] = labelled(TIER_P[tier], INPUT, "tier->p mapping is the user's definition, not a scorer convention")
    return out


def _str_or_missing(raw):
    if raw is None or str(raw).strip().lower() in NULLS:
        return missing(REC, "field empty in the dataset")
    return labelled(str(raw).strip(), REC)


# ── step 3: title-keyword match (a judgment) ─────────────────────────────

def parse_titles(raw):
    """Return (titles, error). Uses ast.literal_eval, never eval."""
    if raw is None or str(raw).strip().lower() in NULLS:
        return [], None
    try:
        value = ast.literal_eval(str(raw))
    except (ValueError, SyntaxError):
        return None, "top_job_titles_sponsored is not a parseable list"
    if not isinstance(value, list) or not all(isinstance(t, str) for t in value):
        return None, "top_job_titles_sponsored is not a list of strings"
    return value, None


def _keyword_re(keyword):
    return re.compile(r"(?<![a-z0-9])" + re.escape(keyword) + r"(?![a-z0-9])")


KEYWORD_RES = {kw: _keyword_re(kw) for kw in KEYWORD_SOCS}


def title_match(raw_titles) -> dict:
    titles, error = parse_titles(raw_titles)
    if error:
        return {"status": "unparseable", "reason": error, "matches": []}
    matches = []
    for title in titles:
        low = title.lower()
        hits = [kw for kw, rx in KEYWORD_RES.items() if rx.search(low)]
        if hits:
            socs = sorted({s for kw in hits for s in KEYWORD_SOCS[kw]})
            matches.append({
                "title": labelled(title, REC),
                "keywords": labelled(hits, JUDG, "keyword list is the user's definition; a title match is not a filing"),
                "candidate_socs": labelled(socs, JUDG, "title-to-SOC mapping is a judgment; titles do not map cleanly to SOC"),
            })
    return {
        "status": "matched" if matches else "no_match",
        "titles_listed": labelled(len(titles), REC),
        "de_ml_title_on_record": labelled(bool(matches), JUDG),
        "matches": matches,
        "per_employer_soc": labelled(None, PROPOSED, PER_EMPLOYER_SOC_TODO),
    }


# ── step 4: BLS lookup ───────────────────────────────────────────────────

def load_bls_rows(path=BLS_CSV) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        return [{c: row.get(c, "") for c in BLS_COLUMNS} for row in csv.DictReader(fh)]


def bls_lookup(socs, rows) -> dict:
    out = {}
    for soc in socs:
        occs = [r for r in rows if r["bls_soc_code"] == soc]
        if not occs:
            out[soc] = {"status": "missing", "reason": "SOC code not in the BLS compact table", "occupations": []}
            continue
        occupations = []
        for r in occs:
            cps = parse_number(r["cognitive_pivot_score"])
            occupations.append({
                "onet_soc_code": labelled(r["onet_soc_code"], REC),
                "title": labelled(r["title"], REC),
                "job_zone": labelled(int(float(r["job_zone"])), REC) if parse_number(r["job_zone"]) is not None else missing(REC, "job zone empty"),
                "national_median_wage": (
                    labelled(parse_number(r["annual_median_wage"]), REC, f"OEWS {r['oews_year']} national, per occupation — not an employer's pay")
                    if parse_number(r["annual_median_wage"]) is not None else missing(REC, "median wage empty")
                ),
                "cognitive_pivot_score": (
                    labelled(cps, REC) if cps is not None
                    else missing(REC, "blank in the BLS table; not imputed from sibling codes")
                ),
            })
        out[soc] = {"status": "found", "occupations": occupations}
    return out


# ── step 6: Form D (shipped samples only) ────────────────────────────────

def load_formd_sample_index(directory=FORMD_SAMPLE_DIR) -> tuple[dict[str, list[dict]], dict]:
    index: dict[str, list[dict]] = {}
    meta = {"files": [], "companies": 0}
    for f in sorted(Path(directory).glob("*.sample.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        companies = data.get("companies", [])
        meta["files"].append({"file": repo_relative(f), "companies_in_sample": len(companies),
                              "companies_in_quarter": data.get("metadata", {}).get("total_companies")})
        meta["companies"] += len(companies)
        for c in companies:
            key = normalize((c.get("company") or {}).get("name"))
            if key:
                index.setdefault(key, []).append({
                    "quarter": (c.get("filing") or {}).get("quarter"),
                    "date_filed": (c.get("filing") or {}).get("date_filed"),
                    "funding_recency": (c.get("company_age") or {}).get("funding_recency"),
                    "total_amount_sold": (c.get("funding") or {}).get("total_amount_sold"),
                })
    return index, meta


def formd_sample_lookup(company_name, index, meta) -> dict:
    key = normalize(company_name)
    filings = index.get(key, []) if key else []
    scope = f"{meta['companies']}-company sample (first 50 per quarter), not the full Form D quarters"
    if not filings:
        return {"status": "not_in_sample", "note": f"absent from the {scope}; this does not mean the company filed no Form D"}
    return {"status": "in_sample", "filings": [labelled(f, SAMPLE, scope) for f in filings]}


# ── persona + timeline gate ──────────────────────────────────────────────

def _scalar(raw: str):
    v = raw.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    if v.lower() in ("null", "~", ""):
        return None
    if v.lower() in ("true", "false"):
        return v.lower() == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    return v


def _strip_comment(line: str) -> str:
    quote = None
    for i, ch in enumerate(line):
        if ch in "\"'":
            quote = None if quote == ch else (quote or ch)
        elif ch == "#" and quote is None and (i == 0 or line[i - 1].isspace()):
            return line[:i]
    return line


def parse_persona_yaml(text: str) -> dict:
    """Minimal reader for the two-level key: value shape of search/examples/*/profile.yml."""
    out: dict = {}
    current = None
    for raw in text.splitlines():
        line = _strip_comment(raw).rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        key, sep, value = line.strip().partition(":")
        if not sep:
            continue
        if indent == 0:
            if value.strip() == "":
                out[key] = {}
                current = key
            else:
                out[key] = _scalar(value)
                current = None
        elif current is not None:
            out[current][key] = _scalar(value)
    return out


def read_persona(path) -> dict:
    if is_private_path(path):
        raise InputError(f"refusing to read a private path: {repo_relative(path)}")
    return parse_persona_yaml(Path(path).read_text(encoding="utf-8"))


def timeline_gate(persona) -> dict:
    visa = persona.get("visa") or {}
    used, buffer = visa.get("unemployment_days_used"), visa.get("buffer_target")
    if not isinstance(used, int) or not isinstance(buffer, int):
        raise InputError("persona is missing visa.unemployment_days_used or visa.buffer_target")
    remaining = OPT_UNEMPLOYMENT_LIMIT - used
    factor = 1 if remaining > buffer else 0
    return {
        "unemployment_days_used": labelled(used, INPUT),
        "buffer_days": labelled(buffer, INPUT),
        "remaining_days": labelled(remaining, INPUT, f"{OPT_UNEMPLOYMENT_LIMIT} - unemployment_days_used"),
        "factor": labelled(factor, INPUT, f"1 if remaining > buffer else 0 (user's definition)"),
        "open": factor == 1,
    }


def scorer_would_drop_sponsorship(authorization: str) -> bool:
    return re.search(SCORER_NO_SPONSOR_RE, (authorization or "").lower()) is not None


# ── step 5 inputs: liveness tool output + human posting checks ───────────

LIVENESS_LINE = re.compile(r"^\S+\s+(active|expired|uncertain)\s+(https?://\S+)\s*$")


def parse_liveness_output(text: str) -> dict[str, str]:
    """Parse `npm run ats:liveness` stdout lines: '<icon> <result> <url>'."""
    results = {}
    for line in text.splitlines():
        m = LIVENESS_LINE.match(line.strip())
        if m:
            results[m.group(2)] = m.group(1)
    return results


CHECK_COLUMNS = ["date", "url", "status", "checked_by"]


def read_posting_checks(path) -> dict[str, dict]:
    if is_private_path(path):
        raise InputError(f"refusing to read a private path: {repo_relative(path)}")
    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        absent = [c for c in CHECK_COLUMNS if c not in (reader.fieldnames or [])]
        if absent:
            raise InputError(f"posting-checks file is missing column(s): {', '.join(absent)}")
        rows = list(reader)
    checks, problems = {}, []
    for i, row in enumerate(rows, start=2):
        status = (row["status"] or "").strip().lower()
        try:
            date.fromisoformat((row["date"] or "").strip())
        except ValueError:
            problems.append(f"line {i}: date is not YYYY-MM-DD")
        if status not in ("active", "expired"):
            problems.append(f"line {i}: status must be active or expired")
        if not (row["checked_by"] or "").strip():
            problems.append(f"line {i}: empty checked_by")
        checks[(row["url"] or "").strip()] = {"date": row["date"].strip(), "status": status, "checked_by": row["checked_by"].strip()}
    if problems:
        raise InputError("; ".join(problems))
    return checks


def liveness_state(url, tool_results, checks) -> dict:
    """Gate. active=1, expired=0, uncertain=held until a human check."""
    if tool_results is None or url not in tool_results:
        return {"state": "held", "reason": "liveness check not run for this URL"}
    result = tool_results[url]
    if result == "active":
        return {"state": "open", "factor": labelled(1, REC, "ats:liveness result: active")}
    if result == "expired":
        return {"state": "closed", "factor": labelled(0, REC, "ats:liveness result: expired")}
    check = (checks or {}).get(url)
    if not check:
        return {"state": "held", "reason": "ats:liveness result: uncertain; awaiting a human posting check"}
    factor = 1 if check["status"] == "active" else 0
    return {
        "state": "open" if factor else "closed",
        "factor": labelled(factor, INPUT, f"human check {check['date']} by {check['checked_by']}: {check['status']} (tool said uncertain)"),
    }


# ── vote guard ───────────────────────────────────────────────────────────

FORBIDDEN_VOTE_SOURCES = (PROPOSED, JUDG, SAMPLE)


def assert_votes_clean(roles) -> None:
    """Stop condition 6: no proposed / judgment / sample value may feed a vote or gate."""
    for role in roles:
        for key in ("sponsorship", "fit", "role_quality", "liveness", "timeline"):
            src = str((role.get(key) or {}).get("source", ""))
            if any(bad in src for bad in FORBIDDEN_VOTE_SOURCES):
                raise ValueError(f"{role.get('role_id')}: {key} is fed by a '{src}' value")
