#!/usr/bin/env python3
"""Convert saved Greenhouse job JSON files into input for wage-timeline-gate.py.

Reads job records already saved from the public Greenhouse job-board API
(boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>?pay_transparency=true) and writes
one gate-input JSON list. Offline: it never fetches anything. Every field carries a label
saying where it came from.

Usage:
  python3 -I scripts/oflc/greenhouse-to-gate-input.py <job.json> [...] -o <gate-input.json> \
      [--assume-start-month 2027-06]

Real postings belong in private/real-postings/ and are never committed (private/README.md).

Exit code: 0 on success; 2 if a file is missing, is not JSON, or is not a job record.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from pathlib import Path

MONTH = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
YEARS = re.compile(
    r"\(?(\d+)\)?\s*\+?\s*(?:(?:-|–|to)\s*\d+\s*\+?\s*)?years?['’]?\s+(?:of\s+)?(?:[\w-]+\s+){0,6}?experience",
    re.IGNORECASE)
COUNTRY_SUFFIX = re.compile(r",?\s*(?:United States(?: of America)?|USA|US)\s*$", re.IGNORECASE)
STATES = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
    "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA",
    "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}
CODES = set(STATES.values())


def halt(message: str) -> None:
    sys.stderr.write(f"greenhouse-to-gate-input: {message}\n")
    sys.exit(2)


def plain_text(content: str) -> str:
    text = html.unescape(html.unescape(content or ""))
    return " ".join(re.sub(r"<[^>]+>", " ", text).split())


def parse_location(name: str) -> tuple[str | None, str | None]:
    parts = [p.strip() for p in COUNTRY_SUFFIX.sub("", name or "").split(",") if p.strip()]
    if len(parts) < 2:
        return None, None
    state = parts[1]
    state = state.upper() if state.upper() in CODES else STATES.get(state.title())
    return (parts[0], state) if state else (None, None)


def convert(path: Path, assume_start: str | None) -> dict:
    try:
        job = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        halt(f"missing file: {path.name}")
    except json.JSONDecodeError as err:
        halt(f"{path.name} is not valid JSON: {err}")
    if not isinstance(job, dict) or "id" not in job:
        halt(f"{path.name} is not a Greenhouse job record (no 'id')")

    location = (job.get("location") or {}).get("name", "")
    city, state = parse_location(location)
    text = plain_text(job.get("content", ""))
    ranges = [r for r in job.get("pay_input_ranges") or [] if r.get("currency_type") == "USD"]
    salary_min = salary_max = None
    if len(ranges) == 1:
        salary_min, salary_max = ranges[0]["min_cents"] / 100, ranges[0]["max_cents"] / 100
    years = YEARS.search(text)

    return {
        "id": f"{path.stem}",
        "company": job.get("company_name") or path.stem.rsplit("-", 1)[0],
        "title": job.get("title"),
        "url": job.get("absolute_url"),
        "city": city,
        "state": state,
        "location_as_posted": location,
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_period": "year" if ranges else None,
        "pay_ranges_posted": len(ranges),
        "years_required": int(years.group(1)) if years else None,
        "years_match": years.group(0) if years else None,
        "start_month": assume_start,
        "description_text": text,
        "labels": {
            "title": "record", "url": "record", "city": "record", "state": "record",
            "salary_min": "record", "salary_max": "record",
            "salary_period": "record (assumed annual) [verify]",
            "years_required": "record (text match)",
            "description_text": "record",
            "start_month": "your-input (scenario)" if assume_start else "missing",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("files", type=Path, nargs="+")
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--assume-start-month", default=None)
    args = parser.parse_args()
    if args.assume_start_month and not MONTH.match(args.assume_start_month):
        halt(f"--assume-start-month must be YYYY-MM, got {args.assume_start_month!r}")

    postings = [convert(path, args.assume_start_month) for path in args.files]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(postings, indent=2) + "\n", encoding="utf-8")

    for p in postings:
        salary = (f"${p['salary_min']:,.0f}-${p['salary_max']:,.0f}"
                  if p["salary_min"] is not None else f"none ({p['pay_ranges_posted']} ranges)")
        print(f"{p['id']}: {p['city']}, {p['state']} | {salary} | "
              f"years={p['years_required']} | start={p['start_month']}")
    print(f"Wrote {len(postings)} postings to {args.output}")


if __name__ == "__main__":
    main()
