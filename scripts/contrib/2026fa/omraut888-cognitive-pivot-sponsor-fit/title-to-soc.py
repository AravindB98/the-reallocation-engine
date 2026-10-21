#!/usr/bin/env python3
"""title-to-soc.py — keyword-match a sponsor's job titles to a target SOC code.

v2: matches on MULTI-WORD PHRASES from the SOC's alternate titles, not single
tokens. v1 matched on bare tokens like "engineer" and "scientist", which are
generic suffixes shared across unrelated disciplines (Mechanical Engineer, QA
Engineer, Senior Scientist in Chemistry) and produced a 71% false-positive-
heavy match rate on first real-data run — confirmed by inspecting 10 sample
matches, where 9 of 10 were single-word "engineer"/"scientist" matches with
no connection to computer/AI research. Phrase matching (e.g. "ai engineer",
"computer scientist", "computational scientist") is far more specific and
avoids this.

Whole-phrase, whole-word-boundary matching only — same word-boundary
discipline as PR #3's "llm" vs "Fulfillment" fix, applied to phrases here.

Never guesses: a title that doesn't match a target SOC's known alternate-
title phrase is reported as unmatched, not assigned.

Usage:
  python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/title-to-soc.py --soc 15-1221.00 \
    --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
    --out course/2026fa/submissions/omraut888/run/soc-match-15-1221.00
"""
import argparse
import ast
import csv
import json
import re
import sys
from pathlib import Path

COMPACT_CSV = "data/bls/compact/soc_occupation_compact.csv"

# generic single-word suffixes that, alone, do not identify this SOC code —
# excluded from phrase extraction entirely so they can never fire solo.
# Confirmed too generic by direct inspection of the v1 over-match (see
# docstring above): "engineer" and "scientist" alone matched almost every
# tech/science title in the sponsorship dataset.
GENERIC_SUFFIXES = {"engineer", "scientist", "scientists", "specialist"}


def load_soc_phrases(soc_code: str) -> list[str]:
    """Extract alternate-title PHRASES (not single tokens) for a SOC code.
    Each phrase like "AI Engineer" or "Computer Scientist" is kept whole;
    single generic words are dropped. Returns [] if the SOC isn't found."""
    with open(COMPACT_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["onet_soc_code"] == soc_code:
                raw = row["title"] + "; " + (row.get("alternate_titles_sample") or "")
                # split on ; and strip parenthetical expansions, e.g.
                # "AI Engineer (Artificial Intelligence Engineer)" -> two phrases
                phrases = []
                for chunk in raw.split(";"):
                    chunk = chunk.strip()
                    if not chunk:
                        continue
                    # pull out parenthetical content as its own phrase too
                    paren = re.findall(r"\(([^)]+)\)", chunk)
                    main = re.sub(r"\([^)]*\)", "", chunk).strip()
                    if main:
                        phrases.append(main.lower())
                    phrases.extend(p.lower() for p in paren)
                # keep only multi-word phrases, or single words NOT in the
                # generic-suffix exclusion list
                kept = []
                for p in phrases:
                    words = p.split()
                    if len(words) >= 2:
                        kept.append(p)
                    elif len(words) == 1 and words[0] not in GENERIC_SUFFIXES:
                        kept.append(p)
                return kept
    return []


def phrase_match(title: str, phrases: list[str]) -> list[str]:
    """Whole-word-boundary match: a phrase matches only if every one of its
    words appears as a whole word in the title (order-independent, so
    'Engineer, AI' still matches phrase 'ai engineer')."""
    title_words = set(re.findall(r"[a-zA-Z]+", title.lower()))
    hits = []
    for phrase in phrases:
        phrase_words = re.findall(r"[a-zA-Z]+", phrase)
        if phrase_words and all(w in title_words for w in phrase_words):
            hits.append(phrase)
    return hits


def parse_sponsored_titles(raw: str) -> list[str]:
    """top_job_titles_sponsored is stored as a Python list-literal string
    (confirmed in PR #3's build_roles.py findings)."""
    if not raw or not raw.strip():
        return []
    try:
        parsed = ast.literal_eval(raw)
        if isinstance(parsed, list):
            return [str(t) for t in parsed]
    except (ValueError, SyntaxError):
        pass
    return [raw]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--soc", required=True)
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    phrases = load_soc_phrases(args.soc)
    if not phrases:
        print(f"STOP: SOC code {args.soc} not found in {COMPACT_CSV}, or has "
              f"no usable phrases after excluding generic suffixes — refusing "
              f"to proceed with zero match criteria.", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    matched = []
    unmatched_count = 0
    rows_seen = 0
    rows_with_titles = 0

    with open(args.csv, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_seen += 1
            titles = parse_sponsored_titles(row.get("top_job_titles_sponsored", ""))
            if not titles:
                continue
            rows_with_titles += 1

            company_matches = []
            for title in titles:
                hits = phrase_match(title, phrases)
                if hits:
                    company_matches.append({"title": title, "matched_phrases": hits})

            if company_matches:
                matched.append({
                    "company_name": row.get("company_name"),
                    "soc_code": args.soc,
                    "matched_titles": company_matches,
                    "total_approvals": row.get("Total Approvals"),
                    "total_denials": row.get("Total Denials"),
                    "approval_rate": row.get("Approval_Rate"),
                })
            else:
                unmatched_count += 1

    result = {
        "soc_code": args.soc,
        "phrases_used": sorted(set(phrases)),
        "generic_suffixes_excluded": sorted(GENERIC_SUFFIXES),
        "rows_seen_total": rows_seen,
        "rows_with_any_title": rows_with_titles,
        "companies_matched": len(matched),
        "companies_with_titles_but_no_match": unmatched_count,
        "matches": matched,
    }

    out_json = out_dir / "soc-match-output.json"
    out_json.write_text(json.dumps(result, indent=2))

    print(f"SOC {args.soc}: {len(set(phrases))} phrases (excluding {sorted(GENERIC_SUFFIXES)}); "
          f"{rows_with_titles} companies had sponsored titles; "
          f"{len(matched)} matched, {unmatched_count} did not")
    print(f"  {out_json}")


if __name__ == "__main__":
    main()
