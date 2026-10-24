#!/usr/bin/env python3
"""data-titles-h1b-entry — one command, no arguments needed:

    python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py

Exit: 0 clean · 3 completed with per-role stops · 1 whole-run failure · 2 bad arguments.
"""
import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[3]
sys.path.insert(0, str(HERE))

from lib import pipeline  # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(description="Sponsored-title evidence -> existing role scorer.")
    ap.add_argument("--postings", default=str(HERE / "postings" / "sample-postings.json"))
    ap.add_argument("--config", default=str(HERE / "run-config.json"))
    ap.add_argument("--rules", default=str(HERE / "rules.json"))
    ap.add_argument("--out", default=str(HERE / "out"))
    args = ap.parse_args(argv)
    if not (REPO_ROOT / "package.json").exists():
        print(f"✗ repo root not found at {REPO_ROOT}", file=sys.stderr)
        return pipeline.EXIT_FAILED
    code, log = pipeline.run(REPO_ROOT, args.postings, args.config, args.rules, args.out)
    if code == pipeline.EXIT_FAILED:
        print(f"✗ whole-run failure: {log.get('error')}", file=sys.stderr)
    else:
        c = log["counts"]["value"]
        r = c["recommendation"]
        print(f"{'✓' if code == 0 else '!'} {c['postings']} postings → scored {c['scored']} "
              f"(Apply {r['Apply']} · Consider {r['Consider']} · Skip {r['Skip']}) · "
              f"stopped {c['stopped_company_match']} · refused {c['refused_missing_gate']}")
    out = pipeline._disp(args.out, REPO_ROOT)
    print(f"  {out}/run.json" + ("" if code == pipeline.EXIT_FAILED else f"  +  {out}/report.md"))
    return code


if __name__ == "__main__":
    sys.exit(main())
