"""sponsorship.py — piece 1 of the nishant2681-data-analytics-opt-h1b prototype.

Look a company up in the 80 Days CSV and assign its sponsorship tier and p.
If the 80 Days CSV has no row for it, look it up in the USCIS FY2022 extract,
where the best possible tier is Possible.
Rules come from course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md §3 and
recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md. Missing data is
always an explicit Unknown with a reason, never a 0.

Standard library only (csv, ast, re).
"""

import ast
import csv
import re

# Words dropped from the end of a company name before comparing names.
LEGAL_SUFFIXES = {"INC", "LLC", "LLP", "CORP", "CORPORATION", "CO", "LTD", "LP"}

# Tier thresholds, copied from CHANGE-BRIEF.md §3 [VERIFY].
# Approval_Rate is stored on a 0-100 scale in the CSV, so 90 means 90%.
PROVEN_MIN_APPROVALS = 10
PROVEN_MIN_RATE = 90
LIKELY_MIN_APPROVALS = 1
P_BY_TIER = {"Proven": 0.9, "Likely": 0.6, "Possible": 0.3}

# The four CSV columns that make up one employer's H-1B record.
H1B_FIELDS = ["Total Approvals", "Total Denials", "Approval_Rate", "top_job_titles_sponsored"]

SOURCE = "record"
DATASET = "80 Days CSV"

# USCIS H-1B Employer Data Hub, FY2022 archive CSV: the fallback for employers
# with no row in the 80 Days CSV (recipe additions 13-14, decided by Nishant,
# 2026-10-20). Only "Initial Approval" counts; the file has no job titles, so a
# USCIS-only match can reach USCIS_TIER_CAP and no higher.
USCIS_DATASET = "USCIS FY2022"
USCIS_APPROVAL_COLUMN = "Initial Approval"
USCIS_DENIAL_COLUMN = "Initial Denial"
USCIS_CONTEXT_COLUMNS = ["Continuing Approval", "Continuing Denial"]
USCIS_REQUIRED_COLUMNS = ["Employer", "Tax ID", USCIS_APPROVAL_COLUMN, USCIS_DENIAL_COLUMN] + USCIS_CONTEXT_COLUMNS
USCIS_TIER_CAP = "Possible"


# Raised when a typed name matches more than one CSV row; a human must choose.
class AmbiguousCompanyError(Exception):
    def __init__(self, query, candidates, source_name="CSV",
                 hint="Set csv_company_name to the exact name of the one you mean."):
        self.query = query
        self.candidates = candidates
        listed = "\n".join(f"  - {name}" for name in candidates)
        super().__init__(f'"{query}" matches {len(candidates)} {source_name} rows:\n{listed}\n{hint}')


# Raised when csv_company_name is given but no CSV row has exactly that name.
class CompanyNotFoundError(Exception):
    pass


# Raised when a row's numbers fit none of the brief's tier rules.
class NoTierRuleError(Exception):
    pass


# Read every row of a CSV file into a list of dicts keyed by column name.
def load_rows(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


# Make two spellings of one company comparable: uppercase, turn punctuation
# into spaces, then drop legal suffixes like INC or LLC from the end.
def normalize_name(name):
    text = re.sub(r"[^A-Z0-9 ]", " ", name.upper())
    words = text.split()
    while words and words[-1] in LEGAL_SUFFIXES:
        words.pop()
    return " ".join(words)


# True if a CSV name is the query itself, or the query followed by more words
# (so "DELOITTE" matches "DELOITTE TAX" but not "DELOITTEX").
def _name_matches(csv_key, query_key):
    return csv_key == query_key or csv_key.startswith(query_key + " ")


# Find the one CSV row for a company. Returns the row, or None if nothing
# matches. Raises if the name is ambiguous, so the human picks, not the code.
def find_company(query, rows, csv_company_name=None):
    if csv_company_name is not None:
        exact = [r for r in rows if r["company_name"] == csv_company_name]
        if not exact:
            raise CompanyNotFoundError(f'no CSV row is named exactly "{csv_company_name}"')
        if len(exact) > 1:
            raise AmbiguousCompanyError(csv_company_name, [r["company_name"] for r in exact])
        return exact[0]

    query_key = normalize_name(query)
    if not query_key:
        raise ValueError(f'company query "{query}" is empty after normalizing')
    matches = [r for r in rows if _name_matches(normalize_name(r["company_name"]), query_key)]
    if len(matches) > 1:
        raise AmbiguousCompanyError(query, [r["company_name"] for r in matches])
    return matches[0] if matches else None


# Say whether a row has an H-1B record. In the real CSV the four fields are
# always all filled or all blank; a mix is a data problem, so we stop.
def _has_h1b_record(row):
    filled = [bool(row[field].strip()) for field in H1B_FIELDS]
    if all(filled):
        return True
    if not any(filled):
        return False
    raise ValueError(f'{row["company_name"]}: H-1B fields are partly blank {dict(zip(H1B_FIELDS, filled))}')


# Turn the CSV's Python-list text, e.g. "['Data Analyst', 'Manager']",
# into a real list of strings. literal_eval reads data only, never runs code.
def parse_titles(text):
    titles = ast.literal_eval(text)
    if not isinstance(titles, list) or not all(isinstance(t, str) for t in titles):
        raise ValueError(f"top_job_titles_sponsored is not a list of strings: {text!r}")
    return titles


# List every sponsored title that contains a target title (ignoring case),
# with the target it matched, so a human can reject a bad match.
def match_titles(sponsored_titles, target_titles):
    matched = []
    for title in sponsored_titles:
        for target in target_titles:
            pair = {"sponsored_title": title, "target_title": target}
            if target.lower() in title.lower() and pair not in matched:
                matched.append(pair)
    return matched


# Apply the brief's tier rules, in order, to one H-1B record.
# A title match with 0 approvals fits no rule (0 real rows), so we stop.
def _tier_rule(has_title_match, approvals, rate):
    if has_title_match and approvals >= PROVEN_MIN_APPROVALS and rate >= PROVEN_MIN_RATE:
        return "Proven", f"title match, approvals {approvals} >= {PROVEN_MIN_APPROVALS}, rate {rate} >= {PROVEN_MIN_RATE}"
    if has_title_match and approvals >= LIKELY_MIN_APPROVALS:
        return "Likely", f"title match, approvals {approvals} >= {LIKELY_MIN_APPROVALS}"
    if not has_title_match:
        return "Possible", "H-1B record present, no target title among top sponsored titles"
    raise NoTierRuleError(f"row fits no tier rule: title match with {approvals} approvals")


# Build the Unknown result: no tier evidence, so p is None (never 0).
def _unknown(reason, row=None):
    return {
        "company_name": row["company_name"] if row else None,
        "tier": "Unknown", "p": None, "matched_titles": [],
        "approvals": None, "denials": None, "approval_rate": None,
        "reason": reason, "source": SOURCE, "dataset": DATASET if row else None,
    }


# Give one company its sponsorship tier and p, with the evidence behind it.
# row=None means the company was not found in the CSV.
def assign_tier(row, target_titles):
    if row is None:
        return _unknown("no-csv-match")
    if not _has_h1b_record(row):
        return _unknown("no-h1b-record", row)

    approvals = int(float(row["Total Approvals"]))
    denials = int(float(row["Total Denials"]))
    rate = float(row["Approval_Rate"])
    if not 0 <= rate <= 100:
        raise ValueError(f'{row["company_name"]}: Approval_Rate {rate} is outside the 0-100 scale')

    matched = match_titles(parse_titles(row["top_job_titles_sponsored"]), target_titles)
    tier, reason = _tier_rule(bool(matched), approvals, rate)
    return {
        "company_name": row["company_name"],
        "tier": tier, "p": P_BY_TIER[tier], "matched_titles": matched,
        "approvals": approvals, "denials": denials, "approval_rate": rate,
        "reason": reason, "source": SOURCE, "dataset": DATASET,
    }


# Read the USCIS file (it may start with a byte-order mark) and check it has
# every column the lookup needs, so a changed layout stops instead of guessing.
def load_uscis_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        missing = [col for col in USCIS_REQUIRED_COLUMNS if col not in (reader.fieldnames or [])]
        if missing:
            raise ValueError(f"{path}: USCIS file is missing column(s) {missing}")
        return list(reader)


# Read one whole-number count from a USCIS row; a blank or non-number stops.
def _uscis_count(row, column):
    text = row[column].strip()
    if not text.isdigit():
        raise ValueError(f'{row["Employer"]}: USCIS {column} is not a whole number: {text!r}')
    return int(text)


# Find one employer in the USCIS rows. Exact match after normalize_name only,
# never a prefix or fuzzy match. One employer has one row per address, so rows
# sharing a name and Tax ID are summed; one name with several Tax IDs stops
# for a human to pick, via uscis_tax_id. Returns None if nothing matches.
def find_uscis_employer(query, rows, tax_id=None):
    query_key = normalize_name(query)
    if not query_key:
        raise ValueError(f'company query "{query}" is empty after normalizing')
    matches = [r for r in rows if normalize_name(r["Employer"]) == query_key]
    if tax_id is not None:
        matches = [r for r in matches if r["Tax ID"].strip() == str(tax_id)]
        if not matches:
            raise CompanyNotFoundError(f'no {USCIS_DATASET} row for "{query}" has Tax ID {tax_id}')
    groups = {}
    for row in matches:
        groups.setdefault(row["Tax ID"].strip(), []).append(row)
    if len(groups) > 1:
        candidates = [f'{group[0]["Employer"]} (Tax ID {tax})' for tax, group in sorted(groups.items())]
        raise AmbiguousCompanyError(query, candidates, source_name=USCIS_DATASET,
                                    hint="Set uscis_tax_id to the Tax ID of the one you mean.")
    if not groups:
        return None
    (tax, group), = groups.items()
    return {
        "employer_names": sorted({row["Employer"] for row in group}), "tax_id": tax, "rows": len(group),
        "approvals": _uscis_total(group, USCIS_APPROVAL_COLUMN),
        "denials": _uscis_total(group, USCIS_DENIAL_COLUMN),
        "continuing_approvals": _uscis_total(group, USCIS_CONTEXT_COLUMNS[0]),
        "continuing_denials": _uscis_total(group, USCIS_CONTEXT_COLUMNS[1]),
    }


# Add up one count column over all of an employer's address rows.
def _uscis_total(group, column):
    return sum(_uscis_count(row, column) for row in group)


# Give a USCIS-only employer its tier. Any initial approval → the cap tier
# (Possible, same p); 0 initial approvals → Unknown with the count kept as
# context; no USCIS match either → Unknown. Continuing counts are context only.
def assign_uscis_tier(record):
    if record is None:
        return _unknown("no-match-either-source")
    result = {
        "company_name": ", ".join(record["employer_names"]), "matched_titles": [],
        "approvals": record["approvals"], "denials": record["denials"], "approval_rate": None,
        "source": SOURCE, "dataset": USCIS_DATASET,
        "uscis": {key: record[key] for key in ["tax_id", "rows", "continuing_approvals", "continuing_denials"]}
        | {"note": "continuing counts are context only, not scored"},
    }
    if record["approvals"] >= 1:
        reason = (f"{USCIS_DATASET} only: {record['approvals']} initial approvals; "
                  f"capped at {USCIS_TIER_CAP} (no job titles)")
        return {**result, "tier": USCIS_TIER_CAP, "p": P_BY_TIER[USCIS_TIER_CAP], "reason": reason}
    return {**result, "tier": "Unknown", "p": None, "reason": "uscis-zero-approvals"}
