# Run log — 2026fa-hemanthrayuduu-2: weekly apply-queue refresh (Mode Build)

## Executive summary

This is the running record of the weekly apply-queue refresh mode: every run against real data, every TODO closure, every break attempt, and every gate decision, in date order. It exists so anyone can trace a number in the worked run back to the run that produced it.

So far:
- the toolchain was checked;
- the mode's ten typed TODOs were closed with evidence, so the recipe is SPECIFIED;
- one live run recorded the offline sample: all 8 shortlisted postings are still live by two independent checks, and all 8 score Skip for the fictional persona, because her OPT clock eats the buffer;
- a deliberately broken liveness gate was caught before scoring.

Still open: the sample-run gate (the owner reads the audit), then a live run with the three human gates.

---

## 2026-10-17 — toolchain check

- **Recipe:** none yet (setup).
- **Inputs / command:** `npm install`, `npm run verify`, `npm run doctor`.
- **Outputs:** `course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/01-toolchain.txt`.
- **Result:**
  - install OK;
  - verify passes, with 3 warnings that come from the repo's own `.gitignore` (archive/, private/, data/ats/);
  - doctor: environment runnable.
- **Open issues:** `npm install` rewrote the maintained `package-lock.json` (36 lines). It was restored with `git restore`, and must be restored before every commit.

## 2026-10-19 — first live run: the Oct 19 snapshot recorded

- **Recipe:** `recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md` v0.1.0. This run happened *before* the recipe file was written; the tool was at its first version.
- **Inputs:**
  - queue `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/queue.sample.json` (8 postings);
  - persona `search/examples/priya-nair/` (fictional);
  - live liveness (page checker + board API); no baseline.
- **Command:** `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --record scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/snapshot-2026-10-19 --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live-record`
- **Outputs:**
  - `course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live-record/` (log, report, audit, raw/ with 11 files and sha256);
  - the snapshot `sample/snapshot-2026-10-19/` (MANIFEST with sha256; 0 redactions needed);
  - console output in `evidence/02-live-record-2026-10-19.txt`.
- **Result:**
  - 8 queued → 8 live · 0 closed · 0 investigate · 8 scored;
  - the page checker and the board API agreed on all 8;
  - scorer: Apply 0 · Consider 0 · Skip 8;
  - timeline factor 0.7 (expected start 2026-11-30; 14 unemployment days left vs a buffer target of 20).
  - Best match: Databricks "Senior Data Scientist" (fit 0.462). Its composite of 0.279 before the clock fell to 0.195 after it, under the Consider floor of 0.20.
- **Open issues:** two edits came after this run.
  - The rules label changed from "proposed" to "confirmed by Hemanth Rayudu" (values unchanged).
  - The report gained a sensitivity line (factor at 35 / 42 / 70 days).
  - So this run is the recording run only; the attested run will be a fresh one.

## 2026-10-19 — value choices confirmed (DEFINE / REPORT FIELD closures)

- **By:** Hemanth Rayudu, in the session (Claude Code recorded it).
- **Decisions:**
  - time-to-start 42 days (sensitivity shown at 35 / 70);
  - liveness: refuse and investigate unless both checks agree;
  - timeline formula buffer-linear;
  - fit = score ÷ 13;
  - unemployment days read as of the run date;
  - report fields: the columns as in the sample report; reader: the student; decision: which rows to release this week.
- **Where:** `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/rules.json` → `status: confirmed by Hemanth Rayudu, 2026-10-19`.

## 2026-10-19 — break attempt: a deliberately broken liveness gate

- **Inputs:**
  - `fixtures/BROKEN-liveness-gate.py`, which treats every non-closed posting as live;
  - the synthetic fixture queue (4 postings: live, closed, uncertain, page/API disagreement).
- **Outputs:** `evidence/03-break-attempt-broken-gate.txt`.
- **Result:**
  - **Real gate:** 2 postings scored, 0 invariant violations.
  - **Broken gate:** caught *before* scoring by the run's own invariant (`StopRun: invariant violated … quietharbor-201 … page=uncertain, api=present; quietharbor-202 … page=active, api=gone`), with no `role-scores.json` written.
  - **Negative control** (the invariant switched off): both unestablished postings reached the engine scorer with liveness `× 1 ×`. This is the silent failure the invariant prevents.
- **Open issues:** none.

## 2026-10-19 — reused-component checks

- **Commands:**
  - `node scripts/score/gate-harness.mjs --out-dir <scratch>` (= `npm run score:gates`);
  - greenhouse-watch's tests;
  - this mode's tests.
- **Outputs:** `evidence/04-score-gates-harness.txt`, `05-greenhouse-watch-tests.txt`, `06-refresh-tests.txt`.
- **Result:**
  - gate harness `RESULT: PASS` (baseline 10 of 10, structural 3 of 3, negative control caught by 5 assertions; 1 paired-check warning, reported as printed);
  - greenhouse-watch: 23 tests OK;
  - refresh: 37 tests OK.

## 2026-10-19 — TODO-closure batch → SPECIFIED

- **Recipe:** `recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md` v0.1.0 (+ `.card.md`).
- **Closures (10):**
  - **DEV:** `refresh.py`, closed by Claude Code. Evidence: the script exists, 37 tests OK, conformance passes, done-when condition met.
  - **DATA SOURCE × 3**, closed by Hemanth Rayudu through plan approval, each with a provenance note in the recipe:
    - the sample queue;
    - the Oct 19 snapshot;
    - the Oct 3 week-0 baseline.
  - **DEFINE × 5** and **REPORT FIELD × 1:** Hemanth Rayudu (above).
- **Result:** `todos_open: 0`; status DRAFT → **SPECIFIED**.
- **Open issues:**
  - **Sample-run gate:** a full offline sample run, then Hemanth Rayudu reads its `refresh-audit.md` → RUNNABLE-SAMPLE.
  - **Live gate:** a live run with G1–G3 cleared by Hemanth Rayudu → RUNNABLE-LIVE.
  - VERIFIED isn't claimed.

## 2026-10-19 — audit wording fix; offline sample run (the documented command)

- **Change:** the audit printed Python's `None` for "description changed" when there was no baseline; it now says "unknown (no baseline)". A test was added first and seen failing (38 tests; `evidence/08-refresh-tests-38.txt`, OK).
- **Command:** `REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --baseline-liveness course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/00-week0-liveness-2026-10-03.txt --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-offline-sample`
- **Outputs:** `runs/2026-10-19-offline-sample/` (log, report, audit, raw/); console output in `evidence/07-offline-sample-run.txt`.
- **Result:**
  - offline, with the network forbidden: 8 queued → 8 live · 0 closed · 0 investigate · 8 scored;
  - Skip 8; timeline 0.7;
  - all four companies' approval counts match the 80 Days CSV;
  - since Oct 3: all 8 unchanged (active). "Description changed" is unknown, because the Oct 3 description text was never kept.
- **Open issues:** the sample-run gate needs Hemanth Rayudu to read `runs/2026-10-19-offline-sample/refresh-audit.md`.

---

## Gate decisions (to be completed by the named human)

- **Sample-run gate (lifecycle):** ☐ — read `refresh-audit.md` of the offline sample run · by/date: ______
- **G1 liveness (live run):** ☐ — ___ of 8 links opened, each showing a description and an Apply button · by/date: ______
- **G2 timeline (live run):** ☐ — OPT dates, unemployment-day count and time-to-start confirmed · by/date: ______
- **G3 release (live run):** ☐ — rows released for action this week: ______ · by/date: ______
