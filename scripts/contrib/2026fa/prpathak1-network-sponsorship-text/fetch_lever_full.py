#!/usr/bin/env python3
"""fetch_lever_full.py: fetch public Lever postings WITH all text fields (one GET per board).

Why it exists: the maintained scraper (scripts/ats/scrapers/lever/scraper.py) keeps only
`descriptionPlain`. On Lever, the bulleted sections (`lists`) and the closing text (`additionalPlain`)
are separate fields, and that is where work-authorization wording usually sits. This script keeps all
three. It uses the same public endpoint the maintained scraper uses
(https://api.lever.co/v0/postings/<slug>?mode=json): no login, no browser, one request per board.

Usage:
    python fetch_lever_full.py shieldai zoox palantir -o ../../../../private/real-postings/<run>-full.json

Writes ONLY under private/ (refuses anything else). A board that is not found is recorded in
`not_found` and the run continues; no posting is ever invented.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import REPO, private_path  # noqa: E402

API = "https://api.lever.co/v0/postings/{slug}?mode=json"
UA = "INFO7375-coursework (Reallocation Engine mode build; public postings API)"


def strip_html(s: str) -> str:
    """Tags → spaces, then HTML entities decoded (run 1 left '&nbsp;' in the text; fixed 2026-10-20)."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).replace("\xa0", " ").strip()


def list_lines(lists: list) -> str:
    """One line per bullet, prefixed with its section heading ("Required qualifications: …").

    Run 1 flattened each list into one run-on string, so a Required bullet and a Preferred bullet
    became one 126-word "sentence" and the section was lost. A bullet's section is evidence
    (required vs preferred), so it is kept on every line.
    """
    out = []
    for l in lists or []:
        head = strip_html(l.get("text", "")).rstrip(": ")
        items = [strip_html(i) for i in re.split(r"</li>", l.get("content", "") or "", flags=re.I)]
        out += [f"{head}: {i}" for i in items if i]
    return "\n".join(out)


def fetch_board(slug: str, timeout: int = 30) -> dict:
    req = urllib.request.Request(API.format(slug=slug), headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"slug": slug, "ok": False, "status": e.code, "error": f"http_{e.code}"}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        return {"slug": slug, "ok": False, "status": None, "error": type(e).__name__}
    if not isinstance(data, list):
        return {"slug": slug, "ok": False, "status": 200, "error": "not_a_board"}
    postings = []
    for j in data:
        lists = list_lines(j.get("lists"))
        postings.append({
            "job_id": str(j.get("id") or ""),
            "title": str(j.get("text") or ""),
            "company_slug": slug,
            "source_url": str(j.get("hostedUrl") or ""),
            "location": str((j.get("categories") or {}).get("location") or ""),
            "fields": {
                "descriptionPlain": html.unescape(str(j.get("descriptionPlain") or "")).replace("\xa0", " "),
                "lists": lists,
                "additionalPlain": html.unescape(str(j.get("additionalPlain") or "")).replace("\xa0", " "),
            },
        })
    return {"slug": slug, "ok": True, "status": 200, "postings": postings}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slugs", nargs="+", help="Lever board slugs, e.g. shieldai zoox palantir")
    ap.add_argument("-o", "--output", required=True, help="output JSON path (must be under private/)")
    a = ap.parse_args()
    out = private_path(a.output)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    postings, found, not_found = [], [], []
    for i, slug in enumerate(a.slugs):
        if i:
            time.sleep(1.0)  # polite spacing between boards
        r = fetch_board(slug)
        if r["ok"]:
            found.append({"slug": slug, "postings": len(r["postings"])})
            postings.extend(r["postings"])
            print(f"[lever-full] {slug}: {len(r['postings'])} postings")
        else:
            not_found.append({"slug": slug, "status": r["status"], "error": r["error"]})
            print(f"[lever-full] {slug}: NOT FOUND ({r['error']})")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"fetched_at": fetched_at, "source": "lever-public-api-full-fields",
                               "found": found, "not_found": not_found, "postings": postings},
                              indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[lever-full] {len(postings)} postings from {len(found)} board(s); {len(not_found)} not found; fetched_at {fetched_at}")
    print(f"[lever-full] wrote {out.relative_to(REPO).as_posix()}")
    return 0 if found else 1


if __name__ == "__main__":
    sys.exit(main())
