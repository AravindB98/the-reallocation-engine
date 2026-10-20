# Run 3 — data-roles daily check — 2026-10-20

## Executive summary

This records the first live run of the daily data-role check against a full real target list: eight companies' job boards, using the student's own private inputs. The boards held 2,108 postings, and 7 matched the student's requirements. All 7 are confirmed still open. All were held for the student because E-Verify hasn't been looked up and five lack a usable sponsorship record. The student reviewed the kept and dropped lists and cleared them. Break attempts found one real defect (a dry run overwrites the day's report) and one real limit (a wrong legal name is accepted silently).

## Record

- **Recipe:** case-data-analyst-opt-h1b-15-2051 v0.2.0 (`recipes/case-data-analyst-opt-h1b-15-2051.md`; prototype id `atharvahambir-reallocation-engine`. The live runs printed v0.1.0 because the version string was bumped before the dry-run repeat, with no logic change.)
- **Mode:** live (board APIs `boards-api.greenhouse.io`, `api.ashbyhq.com`), two runs + liveness + break attempts
- **Commands:** verbatim, with output, in `assignments/submissions/atharvahambir/runs/worked-run-2026-10-20/` (`run1-7-companies/terminal*.txt`, `run2-8-companies/terminal*.txt`, `breaks/*.txt`); write-up in `assignments/submissions/atharvahambir/WORKED-RUN.md`
- **Inputs:**
  - candidate: private (real; visa dates, unemployment days and buffer redacted)
  - targets: private. Robinhood, Anthropic, Datadog, Discord, Waymo (Greenhouse) and Ramp, Perplexity, Notion (Ashby)
  - sponsorship CSV sha256 `eccdee2addf472b1…`
- **Outputs:** private `daily-check.{json,md}`, `roles.json`, `role-scores.{json,md}`, `state.json`; redacted copies tracked in the evidence folder
- **Result:**
  - Run 1 (7 companies): 7/7 boards · 1,737 listed · 1 match (1 new) · Needs you 1 · network 4.
  - Run 2 (+ Waymo, + title "data scientist"): 8/8 boards · 2,108 listed · 7 match (6 new) · Apply 0 · Consider 0 · Skip 0 · Needs you 7 · closed 0 · network 2 (Robinhood, Datadog) · not checked 0.
- **Gates:**
  - G0: stopped twice on real input gaps (future as-of date; missing fit values), both fixed by the person, then passed.
  - G1: 8/8 boards read.
  - G2: 7/7 kept postings in today's API, plus `npm run ats:liveness` active ×7.
  - G3: factor 1.0 for all (8-week default).
  - G4: E-Verify not checked for 7 of 8 companies, so those postings are held.
  - G5: Anthropic and Waymo have no row; Ramp and Perplexity have no H-1B fields; all held.
  - G6: scorer ran on 2 roles (Discord, Notion) and would say Apply 0.555 once E-Verify is recorded.
- **Verification:**
  - independent `urllib` re-fetch matched all 8 counts and all 7 posting IDs
  - dry-run repeat gave identical counts, and the state sha256 was unchanged
  - 18 tests OK, 4/4 mutants caught after the file moves
- **Human gate (G7):** Atharva Hambir · 2026-10-20 · **cleared**. The kept and dropped lists are correct, including the "staff" drops. Noted: Anthropic Data Scientist, Safeguards is a borderline keep (mixed experience statements) to read by hand.
- **Open issues:**
  - TODO 8: `--dry-run` overwrites `<date>/daily-check.{md,json}`. The run-2 report was replaced by the dry-run copy; its terminal output survives.
  - A `csv_name` pointing at the wrong entity (Anthropic → an investment fund) is accepted without warning.
  - E-Verify is unchecked for 7 companies.
  - Sponsorship is unknown for Anthropic, Waymo, Ramp and Perplexity.
  - The new/closed diff hasn't been exercised on a second real day.
