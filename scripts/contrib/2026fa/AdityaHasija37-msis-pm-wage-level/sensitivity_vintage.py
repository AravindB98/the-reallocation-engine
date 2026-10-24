#!/usr/bin/env python3
"""Vintage sensitivity: is the national proxy's overstatement just one year of wage growth?

The national percentiles are May 2024; the OFLC levels are built on May 2025. If the
proxy's disagreements were only a vintage effect, scaling the national percentiles up by a
plausible one-year growth factor would remove most of them. This re-counts disagreements
(current rule, all offer points) at several scale factors. Read-only; writes nothing.

    python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/sensitivity_vintage.py
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import wage_level as wl  # noqa: E402

FACTORS = [1.00, 1.03, 1.05, 1.10, 1.20]
ORDER = ["below-I"] + wl.LEVELS


def main() -> int:
    log = json.loads((HERE / "out" / "run-log.json").read_text())
    socs = set(log["soc_candidates"]["codes"])
    national = wl.read_national_xlsx(wl.DEFAULT_NATIONAL, socs)
    rows = [r for s in log["scenarios"] for r in s["rows"] if r["level"]]
    print(f"rows with an official level: {len(rows)}  (national OEWS May 2024 vs OFLC 2026-27 / May 2025)")
    print("scale | disagrees | too high | too low")
    for f in FACTORS:
        over = under = 0
        for r in rows:
            pct = {k: ((v * f) if v is not None else None, top) for k, (v, top) in national[r["soc"]]["pct"].items()}
            b = wl.proxy_bracket(r["salary"], pct, wl.REGIMES["current-2005"])
            lvl = ORDER.index(r["level"])
            if ORDER.index(b["min"]) > lvl:
                over += 1
            elif ORDER.index(b["max"]) < lvl:
                under += 1
        print(f"{f:5.2f} | {over + under:9d} | {over:8d} | {under:7d}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
