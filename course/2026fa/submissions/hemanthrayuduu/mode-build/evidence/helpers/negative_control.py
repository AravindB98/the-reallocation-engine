#!/usr/bin/env python3
"""Evidence helper (not part of the mode): the break attempt with the deliberately broken liveness gate.

Runs the refresh in-process on the synthetic fixture queue three ways and prints what happened:
  1. with the real liveness gate;
  2. with fixtures/BROKEN-liveness-gate.py swapped in (the run's own invariant should stop it before scoring);
  3. the negative control: the broken gate with the invariant switched off, to show what the invariant prevents.

    python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/negative_control.py
"""
import importlib.util
import json
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[7]
TOOL = REPO / "scripts" / "contrib" / "2026fa" / "hemanthrayuduu-apply-queue-refresh"


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


R = load("refresh", TOOL / "refresh.py")
B = load("broken", TOOL / "fixtures" / "BROKEN-liveness-gate.py")
BASE = ["--queue", str(TOOL / "fixtures" / "queue.fixture.json"), "--snapshot", str(TOOL / "fixtures" / "snapshot"),
        "--csv", str(TOOL / "fixtures" / "80days.fixture.csv"), "--today", "2026-10-19"]

print(f"# Break attempt: fixtures/BROKEN-liveness-gate.py (treats every non-closed posting as live), refresh v{R.VERSION}")
print("\n## 1. Real gate")
with tempfile.TemporaryDirectory() as t:
    log = R.run(R.parse_args(BASE + ["--out-dir", f"{t}/run"]))
    print("scored:", sorted(p["key"] for p in log["postings"] if p["scored"]), "| invariant violations:", log["invariant_violations"])

print("\n## 2. BROKEN gate, with the run's invariant check ON")
real_gate, real_check = R.liveness_gate, R.check_invariants
R.liveness_gate = B.liveness_gate
with tempfile.TemporaryDirectory() as t:
    try:
        R.run(R.parse_args(BASE + ["--out-dir", f"{t}/run"]))
        print("NOT CAUGHT")
    except R.StopRun as e:
        print("CAUGHT — StopRun:", str(e)[:400])
        print("role-scores.json written?", (Path(t) / "run" / "role-scores.json").exists())

print("\n## 3. BROKEN gate with the invariant check switched OFF (negative control: what the check prevents)")
R.check_invariants = lambda roles, postings: []
with tempfile.TemporaryDirectory() as t:
    log = R.run(R.parse_args(BASE + ["--out-dir", f"{t}/run"]))
    scores = {x["role_id"]: x for x in json.loads((Path(t) / "run" / "role-scores.json").read_text())["roles"]}
    for key in ("quietharbor-201", "quietharbor-202"):
        p = next(x for x in log["postings"] if x["key"] == key)
        print(key, "page/api =", f"{p['liveness']['page']['result']}/{p['liveness']['api']['state']}",
              "-> scored", scores[key]["recommendation"], scores[key]["trace"]["arithmetic"])
R.liveness_gate, R.check_invariants = real_gate, real_check
