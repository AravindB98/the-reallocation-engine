#!/usr/bin/env python3
"""extract_auth_sentences.py: READ-ONLY extraction of sponsorship / work-authorization sentences.

For each posting, it splits every text field into sentences and keeps those that match the keyword
list below, recording the field each came from and a SHA-256 of the posting text. It does NOT label
anything: every sentence leaves with `label: null`. Labels (supported / contradicted / insufficient)
are proposed by Claude and approved by a human in LABELS.md. That is the mode's gate.

A posting with zero matching sentences is reported as `silent`. Silence becomes the label
"insufficient", never "no".

Usage:
    python extract_auth_sentences.py <postings.json> [--titles <titles.json>] [--out private/<dir>/]
      --titles  keep only postings whose filter decision is include or flag
      --out     write extraction.json + extraction.md there (must be under private/); else stdout only
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import load_postings, private_path, text_sha256  # noqa: E402

KEYWORDS = re.compile(
    r"sponsor\w*|\bvisas?\b|\bh-?1b\b|work authori[sz]ation|authori[sz]ed to work|eligib\w* to work|"
    r"right to work|citizen\w*|green card|permanent resident|lawful permanent|security clearance|"
    r"\bclearance\b|\bitar\b|export control\w*|\bu\.?s\.? persons?\b",
    re.I,
)
SPLIT = re.compile(r"(?<=[.!?])\s+|\s*[•●▪]\s*|\n+")


def sentences(text: str) -> list[str]:
    return [s.strip(" -:;") for s in SPLIT.split(text or "") if s and s.strip(" -:;")]


def extract(postings: list[dict], keep_ids: set[str] | None = None) -> dict:
    rows, per_posting = [], []
    for p in postings:
        if keep_ids is not None and p.get("job_id", "") not in keep_ids:
            continue
        sha = text_sha256(p["fields"])
        hits = []
        for field, text in p["fields"].items():
            for s in sentences(text):
                kw = sorted({m.group(0).lower() for m in KEYWORDS.finditer(s)})
                if kw:
                    hits.append({"job_id": p.get("job_id", ""), "company_slug": p.get("company_slug", ""),
                                 "title": p["title"], "source_url": p.get("source_url", ""), "field": field,
                                 "sentence": s, "keywords": kw, "text_sha256": sha, "label": None})
        rows.extend(hits)
        per_posting.append({"job_id": p.get("job_id", ""), "company_slug": p.get("company_slug", ""),
                            "title": p["title"], "fields_present": sorted(k for k, v in p["fields"].items() if v.strip()),
                            "sentences": len(hits), "status": "has-sentences" if hits else "silent",
                            "text_sha256": sha})
    return {"sentences": rows, "postings": per_posting,
            "summary": {"postings": len(per_posting), "silent": sum(1 for x in per_posting if x["status"] == "silent"),
                        "sentences": len(rows)}}


def to_markdown(res: dict, src: str) -> str:
    s = res["summary"]
    lines = ["# Authorization-sentence extraction", "", "## Executive summary", "",
             f"This lists every sentence in {s['postings']} job postings that mentions sponsorship, visas, work "
             f"authorization, citizenship or clearance. {s['sentences']} sentences were found; {s['silent']} postings "
             "say nothing on the subject. No sentence has been judged yet: a person labels each one.", "",
             "## Run record", "", f"- Source file: `{src}`", "", "| Posting | Field | Sentence | Keywords |", "|---|---|---|---|"]
    for r in res["sentences"]:
        lines.append(f"| {r['company_slug']}: {r['title']} | {r['field']} | {r['sentence'].replace('|', '/')} | {', '.join(r['keywords'])} |")
    lines += ["", "| Posting | Status | Fields with text |", "|---|---|---|"]
    for p in res["postings"]:
        lines.append(f"| {p['company_slug']}: {p['title']} | {p['status']} | {', '.join(p['fields_present'])} |")
    return "\n".join(lines) + "\n"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("postings")
    ap.add_argument("--titles")
    ap.add_argument("--out")
    a = ap.parse_args()
    postings = load_postings(a.postings)
    keep = None
    if a.titles:
        t = json.loads(Path(a.titles).read_text(encoding="utf-8"))
        keep = {r["job_id"] for r in t["rows"] if r["decision"] in ("include", "flag")}
    res = extract(postings, keep)
    for p in res["postings"]:
        print(f"{p['status']:13} {p['sentences']:2} sentence(s)  {p['company_slug']:10} {p['title']}  fields={','.join(p['fields_present'])}")
    s = res["summary"]
    print(f"[extract] postings={s['postings']} silent={s['silent']} sentences={s['sentences']} (labels: none assigned; human gate)")
    if a.out:
        out = private_path(a.out)
        out.mkdir(parents=True, exist_ok=True)
        (out / "extraction.json").write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
        (out / "extraction.md").write_text(to_markdown(res, Path(a.postings).name), encoding="utf-8")
        print(f"[extract] wrote extraction.json + extraction.md under private/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
