#!/usr/bin/env python3
"""Evidence helper (not part of the mode): one line per posting from a run's refresh-log.json.

    python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/summarize_run.py <run-folder> [<run-folder-to-compare>]

With one folder: page / API / verdict / score per posting. With two: the second folder's score and recommendation
beside the first (used for the 35-day what-if), marking every recommendation that flips.
"""
import json
import sys
from collections import Counter
from pathlib import Path


def load(folder):
    return json.loads((Path(folder) / "refresh-log.json").read_text(encoding="utf-8"))


a = load(sys.argv[1])
b = load(sys.argv[2]) if len(sys.argv) > 2 else None
print(f"  run: {sys.argv[1]} (refresh v{a['version']}, {a['mode']}, today {a['today']}); timeline factor {a['timeline']['factor']}"
      + (f"; compared with {sys.argv[2]} (timeline factor {b['timeline']['factor']})" if b else ""))
print("  page:", dict(Counter(str(p["liveness"]["page"]["result"]) for p in a["postings"])),
      "| api:", dict(Counter(str(p["liveness"]["api"]["state"]) for p in a["postings"])),
      "| verdicts:", dict(Counter(p["liveness"]["verdict"] for p in a["postings"])))
B = {p["key"]: p for p in b["postings"]} if b else {}
for p in sorted(a["postings"], key=lambda x: -((x.get("score") or {}).get("composite") or -1)):
    s = p.get("score") or {}
    line = (f"  {p['key']:<28} page={str(p['liveness']['page']['result']):<9} api={str(p['liveness']['api']['state']):<8} "
            f"→ {p['liveness']['verdict']:<11} {s.get('composite', '—')} {s.get('recommendation', 'not scored')}")
    if b:
        q = (B.get(p["key"]) or {}).get("score") or {}
        flip = "  ← flips" if q.get("recommendation") != s.get("recommendation") else ""
        line += f"  |  {q.get('composite', '—')} {q.get('recommendation', 'not scored')}{flip}"
    print(line)
