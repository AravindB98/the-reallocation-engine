#!/usr/bin/env python3
"""Evidence helper (not part of the mode): parse a run's JSON outputs and check that they agree with each other.

    python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/parse_check.py <run-folder>

Parses refresh-log.json, roles.json and role-scores.json with json.load (any syntax error stops it), then checks:
the log's counts match the scorer's own recommendations; every role sent to the scorer carries numeric liveness and
timeline factors; the scorer ran with sponsorship required; every raw file's sha256 matches the log.
"""
import hashlib
import json
import sys
from pathlib import Path

run = Path(sys.argv[1])
log = json.loads((run / "refresh-log.json").read_text(encoding="utf-8"))
roles = json.loads((run / "roles.json").read_text(encoding="utf-8"))
scores = json.loads((run / "role-scores.json").read_text(encoding="utf-8"))
print(f"parsed: refresh-log.json ({len(log['postings'])} postings), roles.json ({len(roles)} roles), "
      f"role-scores.json ({len(scores['roles'])} scored)")
recs = [s["recommendation"] for s in scores["roles"]]
c = log["counts"]
checks = {
    "log 'scored' == roles sent == roles scored": c["scored"] == len(roles) == len(scores["roles"]),
    "log Apply/Consider/Skip == scorer's own": (c["apply"], c["consider"], c["skip"]) == (recs.count("Apply"), recs.count("Consider"), recs.count("Skip")),
    "every role has numeric liveness and timeline factors": all(isinstance(r["liveness"]["factor"], (int, float)) and isinstance(r["timeline"]["factor"], (int, float)) for r in roles),
    "no 'investigate' posting reached the scorer": not ({p["key"] for p in log["postings"] if p["liveness"]["verdict"] == "investigate"} & {r["role_id"] for r in roles}),
    "scorer ran with sponsorship required": scores.get("profile_needs_sponsorship") is True,
    "every raw file's sha256 matches the log": all(hashlib.sha256((run / k).read_bytes()).hexdigest() == v["sha256"] for k, v in log["raw_files"].items()),
}
for name, ok in checks.items():
    print(f"  {'OK  ' if ok else 'FAIL'} {name}")
print(f"counts in the log: {json.dumps({k: c[k] for k in ('queued', 'live', 'closed', 'investigate', 'scored', 'apply', 'consider', 'skip')})}")
sys.exit(0 if all(checks.values()) else 1)
