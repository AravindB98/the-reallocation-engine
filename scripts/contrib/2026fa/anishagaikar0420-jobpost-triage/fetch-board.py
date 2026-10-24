#!/usr/bin/env python3
"""fetch-board.py — the ONLY network step of the jobpost-triage mode (SNICKERDOODLE P2).

Reads a company's public Greenhouse job board (the same public API `ats:scan` uses) and
writes local files that every other script in this folder reads. Nothing is scraped from
HTML pages and no LLM is involved.

  # a whole board as unified job records (for the skill counter)
  python3 .../fetch-board.py <slug> --company "Klaviyo" --out board.json [--title-regex "analyst|analytics"]
  # ONE posting as plain text: line 1 = title, line 2 = location, then the body
  python3 .../fetch-board.py <slug> --job <job-id> --text-out posting.txt

Write the output files OUTSIDE the repository: postings are third-party content and are
not committed. The slug is validated BEFORE any network call.

Exit: 0 ok; 1 network/HTTP error or empty result; 2 bad input (nothing was fetched).
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,62}$")
API = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
UA = "jobpost-triage/0.1 (course project; public board API)"


def html_to_text(content: str) -> str:
    """Greenhouse returns HTML-escaped HTML: unescape, turn block ends into newlines, strip tags."""
    t = html.unescape(content or "")
    t = re.sub(r"<(?:br|/p|/li|/h\d|/ul)[^>]*>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    return re.sub(r"\n\s*\n+", "\n", t).strip()


def to_record(slug: str, company: str, job: dict) -> dict:
    return {
        "job_id": str(job.get("id", "")),
        "title": (job.get("title") or "").strip(),
        "company_name": company,
        "company_slug": slug,
        "ats_source": "greenhouse",
        "source_url": job.get("absolute_url") or "",
        "location": ((job.get("location") or {}).get("name") or "").strip(),
        "date_posted": job.get("first_published") or job.get("updated_at") or "",
        "description_text": re.sub(r"\s+", " ", html_to_text(job.get("content") or "")).strip(),
    }


def title_filter(records: list[dict], pattern: str | None) -> list[dict]:
    if not pattern:
        return records
    rx = re.compile(pattern, re.I)
    return [r for r in records if rx.search(r["title"])]


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("slug")
    ap.add_argument("--company", default=None, help="company name to stamp on records (default: the slug)")
    ap.add_argument("--out", default=None, help="write the whole board as JSON records here")
    ap.add_argument("--title-regex", default=None, help="keep only titles matching this regex (case-insensitive)")
    ap.add_argument("--job", default=None, help="a single job id; use with --text-out")
    ap.add_argument("--text-out", default=None)
    a = ap.parse_args()

    if not SLUG_RE.match(a.slug):
        print(f"error: invalid board slug {a.slug!r} (lowercase letters, digits, - and _ only); nothing fetched", file=sys.stderr)
        return 2
    if bool(a.job) != bool(a.text_out):
        print("error: --job and --text-out go together", file=sys.stderr)
        return 2
    if not a.job and not a.out:
        print("error: give --out (whole board) or --job with --text-out (one posting)", file=sys.stderr)
        return 2
    if a.job and not re.fullmatch(r"\d{1,15}", a.job):
        print(f"error: invalid job id {a.job!r}; nothing fetched", file=sys.stderr)
        return 2
    if a.title_regex:
        try:
            re.compile(a.title_regex)
        except re.error as e:
            print(f"error: bad --title-regex: {e}", file=sys.stderr)
            return 2

    base = API.format(slug=a.slug)
    try:
        if a.job:
            job = get_json(f"{base}/{a.job}")
            rec = to_record(a.slug, a.company or a.slug, job)
            Path(a.text_out).write_text(f"{rec['title']}\n{rec['location']}\n{html_to_text(job.get('content') or '')}\n", encoding="utf-8")
            print(f"fetch-board: {a.slug}/{a.job} -> {a.text_out} | {rec['title']!r} | {rec['location']!r} | published {rec['date_posted']} | {rec['source_url']}")
            return 0
        data = get_json(base + "?content=true")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as e:
        print(f"error: could not fetch {a.slug}: {e}", file=sys.stderr)
        return 1
    jobs = data.get("jobs") if isinstance(data, dict) else None
    if not jobs:
        print(f"error: board {a.slug!r} returned no jobs", file=sys.stderr)
        return 1
    records = title_filter([to_record(a.slug, a.company or a.slug, j) for j in jobs], a.title_regex)
    Path(a.out).write_text(json.dumps(records), encoding="utf-8")
    print(f"fetch-board: {a.slug}: {len(jobs)} postings on the board -> {len(records)} written to {a.out}" + (f" (title regex {a.title_regex!r})" if a.title_regex else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
