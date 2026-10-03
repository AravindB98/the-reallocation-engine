"""sponsorship.py — piece 1 of the nishant2681-data-analytics-opt-h1b prototype.

Look a company up in the 80 Days CSV and assign its sponsorship tier and p.
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


# Raised when a typed name matches more than one CSV row; a human must choose.
class AmbiguousCompanyError(Exception):
    def __init__(self, query, candidates):
        self.query = query
        self.candidates = candidates
        listed = "\n".join(f"  - {name}" for name in candidates)
        super().__init__(
            f'"{query}" matches {len(candidates)} CSV rows:\n{listed}\n'
            "Set csv_company_name to the exact name of the one you mean."
        )


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
        "reason": reason, "source": SOURCE,
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
        "reason": reason, "source": SOURCE,
    }
