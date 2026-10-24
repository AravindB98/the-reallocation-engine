#!/usr/bin/env python3
"""filter_titles.py: sort posting titles into include / flag / exclude for a network-engineering search.

The rule is deliberately simple and hand-predictable (a DEFINE in the recipe):
  include: a network role title: "network" + engineer / architect / administrator / security /
           infrastructure, and not a software-engineering title.
  flag:    "network" appears, but the title is a software-engineering role ("Software Engineer,
           Network Infrastructure"). It may be SOC 15-1252, not 15-1241, so a HUMAN decides.
  exclude: no "network", or a known false friend ("road network", "social network", "neural network").

Nothing here decides fit; it only narrows what a human reads. Writes to stdout, and to --out (must be
under private/) if given.

Usage:
    python filter_titles.py <postings.json> [--out private/.../titles.json]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import load_postings, private_path  # noqa: E402

NETWORK = re.compile(r"\bnetwork(s|ing)?\b", re.I)
FALSE_FRIEND = re.compile(r"\b(road|social|neural|sales|partner|retail|distribution)\s+network", re.I)
ROLE = re.compile(r"\b(engineer|engineering|architect|administrator|admin|security|infrastructure)\b", re.I)
SOFTWARE = re.compile(r"\bsoftware\b", re.I)


def decide(title: str) -> tuple[str, str]:
    if not NETWORK.search(title):
        return "exclude", "no 'network' in title"
    if FALSE_FRIEND.search(title):
        return "exclude", f"false friend: '{FALSE_FRIEND.search(title).group(0)}'"
    if SOFTWARE.search(title):
        return "flag", "software-engineering title mentioning network; may be SOC 15-1252, human decides"
    if ROLE.search(title):
        return "include", "network role title"
    return "flag", "mentions network but no recognised role word; human decides"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("postings")
    ap.add_argument("--out")
    a = ap.parse_args()
    rows = []
    for p in load_postings(a.postings):
        d, why = decide(p["title"])
        if d != "exclude" or NETWORK.search(p["title"]):  # list every 'network' title, incl. false friends
            rows.append({"job_id": p.get("job_id", ""), "company_slug": p.get("company_slug", ""),
                         "title": p["title"], "decision": d, "reason": why, "source_url": p.get("source_url", "")})
    for r in rows:
        print(f"{r['decision']:8} {r['company_slug']:10} {r['title']}  [{r['reason']}]")
    counts = {k: sum(1 for r in rows if r["decision"] == k) for k in ("include", "flag", "exclude")}
    print(f"[filter] network-mentioning titles: {len(rows)}; include={counts['include']} flag={counts['flag']} exclude={counts['exclude']}")
    if a.out:
        out = private_path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps({"rows": rows, "counts": counts}, indent=2, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
