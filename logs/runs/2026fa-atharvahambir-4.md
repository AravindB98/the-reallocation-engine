# Run 4 — data-roles daily check — 2026-10-21

## Executive summary

This records the second real day of the daily data-role check on the student's eight target companies. The same command, run the next morning, caught a real posting that had closed overnight (Waymo, Product Data Scientist), and two independent checks confirmed it. The student then stated that all eight companies are E-Verify enrolled and that Anthropic sponsors H-1B (Proven). Re-run with those statements, four roles came out as Apply. Two stay held because the public data has no sponsorship record for Ramp or Waymo.

## Record

- **Recipe:** case-data-analyst-opt-h1b-15-2051 v0.2.0 (prototype `scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py`)
- **Mode:** live (board APIs `boards-api.greenhouse.io`, `api.ashbyhq.com`), two runs + liveness + one closure cross-check
- **Commands:** verbatim, with output, in `assignments/submissions/atharvahambir/runs/worked-run-2026-10-21/` (`run1-before-inputs/terminal*.txt`, `run2-after-inputs/terminal.txt`, `checks/waymo-closed-crosscheck.txt`); write-up in `assignments/submissions/atharvahambir/WORKED-RUN.md` (Day 2)
- **Inputs:** candidate private (visa details redacted) · targets private, same 8 companies. Before run 2, recorded as *your-input* "stated by me on 2026-10-21; not verified by the tool": E-Verify enrolled ×8 and Anthropic `sponsorship_override` tier Proven.
- **Result:**
  - Run 1: 8/8 boards · 2,116 listed · 6 match (0 new) · Needs you 6 · **closed 1** (Waymo 8286842, first seen 2026-10-20) · network 2.
  - Run 2: 8/8 · 2,116 · 6 match · **Apply 4** (Anthropic Recruiting Analytics DE 0.615; Anthropic DS Safeguards, Discord DS Client Platform, Notion DS Growth 0.555) · Needs you 2 (Ramp, Waymo: no sponsorship record) · network 2 (Robinhood, Datadog).
- **Gates:**
  - G0: passed.
  - G1: 8/8 boards read.
  - G2: 6 active, 1 expired (`npm run ats:liveness`); the closure is also confirmed absent from Waymo's API.
  - G3: factor 1.0 for all.
  - G4: E-Verify now your-input, enrolled ×8.
  - G5: Anthropic via your-input override; Ramp and Waymo held.
  - G6: scorer ran on 4 roles.
- **Human gate (G7):** Atharva Hambir · 2026-10-21 · supplied the E-Verify and Anthropic statements and accepted the run. Applying is the student's own decision, outside the mode.
- **Open issues:**
  - E-Verify and Anthropic's sponsorship are unverified statements; two of the four Apply rows rest on the latter.
  - No sponsorship record for Ramp or Waymo.
  - TODO 8 (dry-run overwrite) is still open.
