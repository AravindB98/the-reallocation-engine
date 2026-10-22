# Run Log — H-1B Wage-Floor Triage, 2026-10-21

## Executive summary

My working log for the day I built and ran this mode, in the order things happened. It's here
so anyone can see what was run, when, and what came out. Short version: built the wage data
and the checks, broke them on purpose to make sure the tests notice, then ran everything on
five real postings. Nothing passed; three were ruled out by their own wording, two stopped on
missing start dates. I haven't made an application decision on any of them yet.

(Submitted here instead of appended to `logs/RUN_LOG.md` — the assignment allows it and the
repo's contributor rules reserve that file.)

## Log

All times Eastern (EDT). Where I have a timestamp, it came from a commit, a `generated_at`
field, or a file's modified time. Where I don't, I say so and give the window it falls in.

**2026-10-21 — chethangowda-git-h1b-wage-floor-sde v0.1.0**

- **16:23** — Downloaded the DOL OFLC wage data for wage year 2026–27 by hand
  (`OFLC_Wages_2026-27`, 8 files). Kept it in Downloads; not committed.
- **before 16:57** *(no timestamp)* — `npm run verify` passed, 158 files. `npm run doctor`:
  no private paths tracked. Manifest check gives 3 warnings; the two about `private/` and
  `data/ats/` are false alarms.
- **before 16:57** *(no timestamp)* — First extractor run → 20 areas, 40 cities, 3 cities
  split across two wage areas (Raleigh, Durham, Huntsville). Spot-checked San Jose and
  Huntsville against the raw file — match.
- **16:57** — Tried to break the extractor: empty source folder → exit 2; fake county
  ("Nowhere County") → exit 2, names Boulder. Real outputs unchanged (SHA-256 checked).
- **17:02** — Commit `feb8739` (data layer).
- **17:02–17:47** *(no timestamp)* — Gate test, first run: 25/25.
- **17:47** — Mutant A (removed the "no start date → stop" rule): test crashed, 4/25, exit 1.
  Good — the test can fail.
- **17:47–20:27** *(no timestamp)* — Mutant B (missing start date treated as open, the quiet
  version): 23/25, exit 1, flags only `stop-no-start`.
- **20:27** — Commit `15377a8` (gate, fixtures, test, county map).
- **20:33** — Fetched 5 real postings from the Greenhouse job-board API (approved first).
  5 × HTTP 200. Raw files in `private/`, not committed. Anonymized as A1, A2, B, C, D.
- **20:34** — `npm run ats:liveness` on all 5 → 5 active, 0 expired, 0 uncertain. (Browser
  problem from the last assignment is gone.)
- **after 20:34** *(no timestamp)* — Looked the 4 companies up in the 80 Days CSV, sponsorship
  columns only. C: 154 approvals / 4 denials. D: 272 / 4. A and B: no record.
- **20:50** — Re-ran the extractor after adding San Mateo → 41 cities, 44 counties; wage table
  unchanged.
- **20:50–22:15** *(no timestamp)* — Added the visa/clearance text check and the converter.
  Test 29/29, then 36/36. Re-built mutant B against the new gate — still caught.
- **~22:15** *(no timestamp)* — First real-run attempt failed, exit 2 "missing file". My
  mistake: zsh doesn't split `$RAW` into separate words. The scripts refused the bad input,
  which is what they should do. Re-ran with a zsh array.
- **22:15** — Real run, two scenarios:
  - as posted: PASS 0 · UNCERTAIN 0 · FAIL 0 · SKIP 3 · STOP 2
  - start assumed 2027-06 (my input): PASS 0 · UNCERTAIN 2 · FAIL 0 · SKIP 3 · STOP 0
  - SKIPs: A1, A2 need TS/SCI; B says "without sponsorship". C and D straddle their L3/L4
    floors and ask for 7+ and 5+ years.
- **22:16** — Commit `40b2042` (text check, converter, San Mateo).
- **22:21** — Commit `33fb146` (recipe + card, RUNNABLE-SAMPLE).
- **22:23** — Re-captured output for the worked run on the final code: test 36/36,
  mutant A 11/36, mutant B 34/36, both extractor break tests exit 2.
- **22:25** — Commit `4c417c2` (justification, worked run, this log).
- **22:52** — Opened PR #90.
- **23:26** — Commit `de2b9e4` (worked-run commands made verbatim). Built the zip from it.

**Human gate G7:** not cleared. I read the text-flag snippets but haven't decided on C or D.

**Open issues**
- No check for "asks for more experience than I have" — both survivors did.
- ×2,080 annual conversion and the meaning of `GeoLvl` still unconfirmed.
- The 80 Days lookup was a one-off, not a script yet.
- Only Greenhouse boards work (no Lever / Ashby / Workday).
- Repo things I noticed but didn't fix: doctor misreads a status line with an inline comment
  and skips `recipes/cases/`; conformance doesn't check Markdown under `data/` or `assignments/`.
