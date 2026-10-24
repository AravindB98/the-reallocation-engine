#!/usr/bin/env python3
"""fetch_postings.py: the ingest step. Fetch public Greenhouse postings into a local postings file.

This is the only script in this folder that reads data from the network. wage_level.py then works
from the saved file, so a run can be repeated and checked against exactly what was fetched.

    # list candidate postings (non-senior software titles in the four metros, with a pay range)
    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --discover pinterest stripe

    # save chosen postings: board:job_id:Company name as in the sponsorship CSV
    python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py \
        --out assignments/submissions/pavithra-prasad/inputs/postings-live.json \
        --jobs "pinterest:7212345:Pinterest" "stripe:8128744:Stripe"

Only the title, location, link, update time, the sentences that contain a dollar amount and a
SHA-256 of the full posting text are kept; the rest of the posting text is not stored.
"""
import argparse
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wage_level as w  # noqa: E402

API = "https://boards-api.greenhouse.io/v1/boards/%s/jobs%s"
SENIOR_RE = re.compile(r"senior|staff|principal|lead|manager|director|head|architect|\bsr\b\.?|\bII\b|\bIII\b|\bIV\b|\b[2-5]\b|intern", re.I)
METRO_RE = re.compile(r"new york|san francisco|seattle|boston|cambridge|san jose|palo alto|mountain view|sunnyvale|menlo park"
                      r"|bellevue|redmond|kirkland|oakland|santa clara|cupertino|jersey city|brooklyn|bay area", re.I)


def get(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, OSError, ValueError) as e:
        return None, {"error": str(e)}


def clean(content):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(html.unescape(content or "")))).strip()


def pay_sentences(text):
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p[:400] for p in parts if re.search(r"\$\s?\d", p)][:6]


def discover(boards):
    for b in boards:
        status, body = get(API % (b, "?content=true"))
        if status != 200:
            print("%s: HTTP %s" % (b, status))
            continue
        for j in body.get("jobs", []):
            t, loc = j["title"], j["location"]["name"]
            if SENIOR_RE.search(t) or not w.SWE_TITLE_RE.search(t) or not METRO_RE.search(loc):
                continue
            ranges, _ = w.parse_pay(pay_sentences(clean(j.get("content"))))
            print("%s:%s | %s | %s | %s" % (b, j["id"], t, loc, ", ".join(r["raw"] for r in ranges) or "no range"))


def fetch(jobs, out):
    w.check_out_dir(os.path.dirname(os.path.abspath(out)))
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    postings = []
    for spec in jobs:
        board, job_id, company = (spec.split(":", 2) + [None])[:3]
        status, body = get(API % (board, "/%s?content=true" % job_id))
        rec = {"posting_id": "%s-%s" % (board, job_id), "company": company or board, "api_status": status,
               "fetched_at": now, "source": "greenhouse-api", "greenhouse": {"board": board, "job_id": job_id}}
        if status == 200:
            text = clean(body.get("content"))
            rec.update({"title": body.get("title"), "location": (body.get("location") or {}).get("name", ""),
                        "url": body.get("absolute_url"), "updated_at": body.get("updated_at"),
                        "pay_text": pay_sentences(text), "content_sha256": hashlib.sha256(text.encode()).hexdigest()})
        else:
            rec.update({"title": None, "location": "", "url": "https://boards.greenhouse.io/%s/jobs/%s" % (board, job_id), "pay_text": []})
        postings.append(rec)
        print("%s HTTP %s %s | %s" % (rec["posting_id"], status, rec["title"], rec["location"]))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(postings, f, indent=2)
        f.write("\n")
    print("wrote %d postings to %s" % (len(postings), os.path.relpath(out, w.REPO)))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--discover", nargs="+", metavar="BOARD")
    ap.add_argument("--jobs", nargs="+", metavar="BOARD:JOB_ID:COMPANY")
    ap.add_argument("--out")
    a = ap.parse_args(argv)
    try:
        if a.discover:
            discover(a.discover)
        elif a.jobs and a.out:
            fetch(a.jobs, a.out)
        else:
            ap.error("use --discover BOARD ... or --jobs ... --out FILE")
    except w.Halt as e:
        print("HALT:", e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
