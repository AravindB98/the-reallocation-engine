# Run log — 2026fa-hemanthrayuduu-2: weekly apply-queue refresh (Mode Build)

## Executive summary

This is the running record of the weekly apply-queue refresh mode: every run against real data, every TODO closure, every break attempt, and every gate decision, in date order. It exists so anyone can trace a number in the worked run back to the run that produced it.

So far:
- the toolchain was checked;
- the mode's ten typed TODOs were closed with evidence, so the recipe is SPECIFIED;
- one live run recorded the offline sample: all 8 shortlisted postings are still live by two independent checks, and all 8 score Skip for the fictional persona, because the persona's OPT clock eats the buffer;
- a deliberately broken liveness gate was caught before scoring.

The owner then read the offline sample run's audit and cleared the sample-run gate for v0.1.0.
- The first live run caught a real closure: one Verkada posting went from active to removed within the day, and it was cross-checked independently.
- That run also exposed four report problems. Fixing them made v0.1.1, whose own sample-run gate the owner also cleared, so the recipe is RUNNABLE-SAMPLE at v0.1.1.

The owner then ran the live refresh in person and cleared all three gates, so the recipe is RUNNABLE-LIVE at v0.1.1. VERIFIED is not claimed.

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

## 2026-10-19 — sample-run gate cleared → RUNNABLE-SAMPLE

- **Gate test** (SNICKERDOODLE, SPECIFIED → RUNNABLE-SAMPLE): a full sample run completed (the entry above); conformance passes; the audit was generated and read.
- **Decision:** Hemanth Rayudu, 2026-10-19: "read the audit, counts look right".
- **Result:** the recipe moves SPECIFIED → **RUNNABLE-SAMPLE**; `last_gate` is set to this entry.
- **Open issues:** the live gate, which needs a live run with G1–G3 cleared by Hemanth Rayudu → RUNNABLE-LIVE.

## 2026-10-19 — live run (v0.1.0): a real closure caught

- **Command:** `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --baseline course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-offline-sample/refresh-log.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live` (run by Claude Code, 15:35 EDT).
- **Outputs:** `runs/2026-10-19-live/`; console output in `evidence/09-live-run-2026-10-19.txt`.
- **Result:**
  - 8 queued → 7 live · **1 closed** · 0 investigate · 8 scored; Skip 8; timeline 0.7.
  - Verkada "Software Engineer – Computer Vision" (`verkada-5195995007`) was active at 01:57 and closed at 15:35. The page redirects to `…/verkada?error=true`, and the board API returns 404. The engine gated it: `(0.4·0.35) × 0 × 0.7 = 0`.
  - The other 7 descriptions are unchanged since 01:57 (same sha256).
- **Cross-check** (`evidence/10-cross-check-closed-posting.txt`):
  - `curl` of the board API: 404 for the closed posting, 200 for a sibling Verkada posting (the control);
  - `npm run ats:liveness -- <url>` on its own: expired.
- **Found on this run:**
  - a posting gone since the baseline was reported as "no baseline";
  - the run record printed a raw dictionary;
  - the BLS table hid how the SOC code was chosen.

  These are fixed in v0.1.1 (next entry). This run's files are kept as produced.

## 2026-10-19 — v0.1.1: report fixes from the live run (tests first)

- **Changes in `refresh.py`, each with a test seen failing first:**
  - "n/a (no description now — the posting is gone)" when the baseline has a description and today's run doesn't;
  - the run record names the liveness source in words;
  - the role-quality table gains a "SOC chosen by" column. 2 of the 8 sample SOCs come from an O*NET title match (record) and 6 from a family hint (your-input);
  - two wording fixes.
- **Unchanged:** matching, gates and scoring.
- **Tests:** 41 OK (`evidence/11-refresh-tests-41-v011.txt`).
- **Lifecycle:** recipe → v0.1.1 and status **SPECIFIED** for v0.1.1. v0.1.0's sample-run gate doesn't carry over (the recipe's versioning rule).

## 2026-10-19 — offline sample run (v0.1.1)

- **Command:** `REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --baseline-liveness course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/00-week0-liveness-2026-10-03.txt --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-offline-sample-v011`
- **Outputs:** `runs/2026-10-19-offline-sample-v011/`; console output in `evidence/12-offline-sample-run-v011.txt`.
- **Result:** same counts as the v0.1.0 sample run: 8 live by both checks, Skip 8, all approval counts match the CSV, 8 of 8 unchanged since 2026-10-03.
- **Open issues:** the sample-run gate for v0.1.1 needs Hemanth Rayudu to read `runs/2026-10-19-offline-sample-v011/refresh-audit.md`.

## 2026-10-19 — sample-run gate cleared for v0.1.1 → RUNNABLE-SAMPLE

- **Gate test:** the full offline sample run for v0.1.1 completed (entry above); conformance passes; the audit was generated and read.
- **Decision:** Hemanth Rayudu, 2026-10-19: "read the v0.1.1 audit, counts look right".
- **Result:** v0.1.1 moves SPECIFIED → **RUNNABLE-SAMPLE**.
- **Open issues:** the live gate (a live run of v0.1.1 by the owner, with G1–G3 cleared) → RUNNABLE-LIVE.

## 2026-10-21 — engine checks on a fresh clone (v0.1.1, commit 276bb5c)

- **Where:** a fresh clone of branch `mode/hemanthrayuduu-ai-data-opt` (node v23.11.0, playwright 1.62.1 from the lockfile, Python 3.9.10), after `npm install`.
- **Outputs:**
  - `evidence/engine-01-verify.txt`: passes, 3 warnings that come from the repo itself;
  - `engine-02-doctor.txt`: environment runnable, 33 recipes, 318 declared = 318 body TODO markers;
  - `engine-03-ats-liveness.txt`: one live Verkada posting `active`; the real closed one, and two made-up Verkada ids, `expired` (redirect to `?error=true`);
  - `engine-04-local-wage-blocked.txt`: "missing .venv", exit 2; `data/bls/local-wage/` is absent and has never been in any commit;
  - `engine-05-score-gates.txt`: `RESULT: PASS`, exit 0;
  - `13-fresh-clone-tests-and-offline-run.txt`: 41 tests OK; the documented offline command exits 0. `git status` shows only `package-lock.json`, rewritten by `npm install`, not by the refresh.
- **Open issues:** none from these checks.

## 2026-10-21 — break attempts on real data, and the 35-day what-if (v0.1.1)

- **Outputs:** `evidence/14-break-attempts-real-data.txt`, `evidence/15-what-if-35-days.txt`; runs `2026-10-21-break-made-up-ids/`, `2026-10-21-break-outage/`, `2026-10-21-what-if-35-days/`.
- **Results:**
  - **(a) Made-up job ids** (`fixtures/queue.break-made-up-ids.json`):
    - the professor's reference URL on Figma's board: page `uncertain` (as in his run), API 404 → **investigate**, not scored;
    - a made-up Verkada id: `expired` + 404 → **closed**, gated to 0;
    - the control posting: live, scored.
  - **(b) Outage** (a dead proxy for the board API): 8 of 8 → **investigate**, 0 scored. Never "live" by default. Engine quirk noted: given 0 roles, the scorer prints `skip NaN%`.
  - **(c) Rohan Desai** (doesn't need sponsorship): refused, exit 1, nothing written.
  - **(d) A persona outside the examples** with output aimed at a tracked folder: refused, exit 1, nothing written.
  - **(e) What-if, 35 vs 42 days,** same snapshot and date: the timeline factor goes 0.7 → 1.0, and 3 Databricks rows flip Skip → Consider (0.195 → 0.279; 0.163 → 0.232 twice).
- **Open issues:** none from these attempts.

## 2026-10-21 — the owner's live run (v0.1.1) and the live gate → RUNNABLE-LIVE

- **Command (typed by Hemanth Rayudu):** `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --baseline course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live/refresh-log.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/$(date +%F)-live-owner` (01:12 EDT).
- **Outputs:** `runs/2026-10-21-live-owner/` (log, report, audit, raw/ with 10 files, 0 redactions); console output in `evidence/16-owner-live-rerun.txt`.
- **Result:**
  - 8 queued → 7 live · 1 closed · 0 investigate · 8 scored; Skip 8; timeline 0.7 (expected start 2026-12-02); no invariant violations.
  - Versus the 2026-10-19 15:35 run: the 7 live descriptions are unchanged, and the Verkada closure persists.
- **Gates:** G1, G2 and G3 cleared by Hemanth Rayudu (below). G3 released no rows.
- **Gate test** (SNICKERDOODLE, RUNNABLE-SAMPLE → RUNNABLE-LIVE): a live run with a human clearing every gate, with the gate decisions logged → **RUNNABLE-LIVE** at v0.1.1.
- **Open issues:** VERIFIED isn't claimed (one live run of 8 postings is thin).

## 2026-10-21 — independent review; v0.1.2 (tests first)

- **Review:** a fresh-context reviewer (a Claude Code subagent, read-only) graded the submission against the assignment, the rubric, `DATA_CONTRACT.md` and the professor's reference. It checked 11 numbers against `evidence/` and `runs/`, and all matched. It reported defects; those in code and in the recipe are fixed here, and the document fixes land with the documents.
- **Fixed in `refresh.py` (v0.1.2), each with a test seen failing first:**
  - the privacy guard requires the persona and the queue to be **git-tracked** examples, not merely inside the examples folder;
  - the `--record` folder is guarded too;
  - the scorer's output in the log carries no temporary paths, and its command is recorded as it ran;
  - a metadata-only change (`updated_at` changed, same text) is reported;
  - offline reports say their liveness comes from a recording.

  47 tests OK (`evidence/17-refresh-tests-47-v012.txt`).
- **Fixed in the recipe and card (v0.1.2):**
  - closed items are written `[CLOSED: TYPE]`, so the bracketed TODO count (0) matches `todos_open: 0`;
  - the frontmatter has no inline comments;
  - "cannot verify" names the unpinned Consider floor (`[VERIFY]` in the scorer), the unemployment-day count not accruing between runs, and the SOC family hints;
  - the DATA SOURCE closures carry a file check with sha256 (2026-10-21);
  - the card's failure modes match the domain justification's;
  - `rules.json` wording.
- **Repo defect logged** (the constitution vs the repo): SNICKERDOODLE's DEV closure names a "scored prompt", and the repository defines none. The DEV item is closed on the other evidence the constitution requires.
- **Evidence helpers committed:** `evidence/helpers/negative_control.py` (the broken-gate break attempt) and `summarize_run.py` (the per-posting summaries), so every pasted summary has visible code behind it.
- **Lifecycle:** v0.1.2 → **SPECIFIED**. It needs its own sample-run gate and live gate; the v0.1.0 and v0.1.1 gates above stay as history.

---

## Gate decisions (to be completed by the named human)

- **Sample-run gate, v0.1.0 (lifecycle):** ☑ cleared — "read the audit, counts look right" (`runs/2026-10-19-offline-sample/refresh-audit.md`: 8 queued, 8 live by both checks, 0 investigate, 8 scored, approval counts match the CSV, 8 of 8 unchanged since 2026-10-03) · by: Hemanth Rayudu · date: 2026-10-19
- **Sample-run gate, v0.1.1 (lifecycle):** ☑ cleared — "read the v0.1.1 audit, counts look right" (`runs/2026-10-19-offline-sample-v011/refresh-audit.md`: 8 queued, 8 live by both checks, 0 investigate, 8 scored, approval counts match the CSV, 8 of 8 unchanged since 2026-10-03) · by: Hemanth Rayudu · date: 2026-10-19
- **G1 liveness (live run, `runs/2026-10-21-live-owner/`):** ☑ cleared — opened all 8 links: 7 show a description and an Apply button; #8 (Verkada "Software Engineer – Computer Vision") no longer opens as a posting, matching the run's *closed* · by: Hemanth Rayudu · date: 2026-10-21
- **G2 timeline (live run):** ☑ cleared — confirmed: 34 unemployment days used (read as of the run date), expected start 2026-12-02 (42 days), 76 used by then, 14 left against the 20-day buffer → factor 0.7 (35 days → 1.0, 70 → 0.0); STEM eligibility stays a what-if for a DSO · by: Hemanth Rayudu · date: 2026-10-21
- **G3 release (live run):** ☑ cleared — rows released for action this week: **none** (all 8 score Skip for the persona at 42 days) · by: Hemanth Rayudu · date: 2026-10-21
