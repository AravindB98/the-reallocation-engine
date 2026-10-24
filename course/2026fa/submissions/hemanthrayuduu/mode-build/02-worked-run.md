# Worked run: the weekly apply-queue refresh, run for real (2026-10-19 → 2026-10-21)

## Executive summary

**What this is:** the record of actually running the mode:
- the engine's own commands, run on a fresh copy of the repository;
- the mode's tool, run live against real job boards on 2026-10-19 and 2026-10-21: four runs on the 8-posting queue, plus four break-test runs;
- every attempt to break it;
- an independent review, and the fixes it led to.

**Why read it:** the mode file says what should happen; this says what did, with the real output pasted in. That includes a posting that closed while we watched, four report problems that real data exposed, and five more defects found by a reviewer.

**What it found:**
- Of 8 shortlisted AI and data postings that were live on Oct 3, **one closed on Oct 19, between the morning and the afternoon**. Both independent checks caught it, and the owner's own run two days later confirmed it.
- For the fictional persona, all 8 score Skip this week. *For the scorer*, the deciding factor is the OPT clock: a 7-day shorter expected start moves three Databricks roles to Consider. *Reading the postings* (a judgment, not a score), most ask 3–5+ years against the persona's one co-op, so a human would likely hold them anyway.
- The engine's page checker can't be trusted alone: it called a made-up Figma job id `uncertain`, and a made-up Verkada id `expired`. The job board's own record returned 404 for both, so neither is ever scored as live: one is closed, the other is held for a human.
- The mode is **RUNNABLE-LIVE at v0.1.2**: the owner ran it live and cleared every gate. It is not VERIFIED, because one live run of 8 postings is thin.

## Inputs (nothing here is private)

- **Persona:** Priya Nair, a repository persona that is **fictional by design** (`search/examples/priya-nair/`). AI / ML Engineer, F-1 post-completion OPT, needs sponsorship, 34 of 90 unemployment days used, buffer target 20. No real person's profile is used in any tracked file.
- **Queue:** 8 public postings, the Consider list of a sponsorship-pipeline run on 2026-10-03 (the swe-sponsor-pipeline contribution), at `scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/queue.sample.json`.
  - **Carried:** posting identity, SOC code (with how it was chosen), and the sponsorship tier (p 0.4, `your-input`).
  - **Not carried:** fit and timeline, which are recomputed.
  - **Re-read:** sponsorship records, from the 80 Days CSV.
- **Value choices** (`rules.json`, confirmed by Hemanth Rayudu, 2026-10-19): time-to-start 42 days, shown at 35 / 42 / 70; unemployment days read as of the run date; a buffer-linear clock; live only when both checks agree; fit = score ÷ 13.
- **Week-0 baseline:** the 2026-10-03 page-check output for the same 8 URLs (`evidence/00-week0-liveness-2026-10-03.txt`: all 8 `active`).
- **Versions:**
  - v0.1.0 (first runs);
  - v0.1.1 (fixes from the first live run);
  - **v0.1.2** (fixes from the independent review; the final version). Each version had its own gates.

## Commands and the real output

### 1. The engine's own commands, on a fresh clone at v0.1.2 (untrimmed)

```text
# Engine checks, untrimmed, on a fresh clone of branch mode/hemanthrayuduu-ai-data-opt at 5e999d1 (v0.1.2), run by Claude Code 2026-10-21 15:02 EDT; node v23.11.0, playwright 1.62.1, Python 3.9.10

$ npm run verify
conformance: 184 files (88 md · 39 py · 30 js · 23 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit=0

$ node scripts/conformance.mjs recipes/cases/2026fa course/2026fa/submissions/hemanthrayuduu logs/runs/2026fa-hemanthrayuduu-2.md scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh
conformance: 132 files (28 md · 5 py · 99 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit=0

$ npm run doctor
RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v23.11.0
  ✓ python3    Python 3.9.10

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.6.3
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit=0

# The doctor scans only top-level recipes/. To count this recipe the way it counts the others, copy it there in this scratch clone and run it again:
$ cp recipes/cases/2026fa/hemanthrayuduu-ai-data-opt-apply-queue-refresh.md recipes/ && npm run doctor | grep -E "with lifecycle|open TODOs|mismatch"
  with lifecycle frontmatter: 34   missing: 0
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies
(no 'mismatch' line above = declared and body counts agree)

$ npm run ats:liveness -- <live Verkada posting> <the posting that closed 2026-10-19> <made-up id, boards.greenhouse.io/figma (the reference run's case)> <made-up id, job-boards.greenhouse.io/verkada>
Checking 4 URL(s)...

✅ active     https://job-boards.greenhouse.io/verkada/jobs/4128624007
❌ expired    https://job-boards.greenhouse.io/verkada/jobs/5195995007
           redirect to https://job-boards.greenhouse.io/verkada?error=true
⚠️ uncertain  https://boards.greenhouse.io/figma/jobs/1000000001
           content present but no visible apply control found
❌ expired    https://job-boards.greenhouse.io/verkada/jobs/1000000001
           redirect to https://job-boards.greenhouse.io/verkada?error=true

Results: 1 active  2 expired  1 uncertain
exit=1

$ npm run bls:local-wage -- --metro "Boston-Cambridge-Newton, MA-NH" --soc 15-1221
missing .venv — create it with:
  python3.13 -m venv .venv
  .venv/bin/pip install -r data/bls/local-wage/requirements.txt
exit=2
$ ls data/bls/local-wage; git log --oneline --all -- data/bls/local-wage | wc -l
ls: data/bls/local-wage: No such file or directory
       0

$ node scripts/score/gate-harness.mjs --out-dir <scratch>   # = npm run score:gates
      negative control: 5/5 gate-sensitive assertions correctly failed under mutation
=== SUMMARY ===
baseline cases    : 10 passed, 0 failed  (of 10)
structural checks : 3 passed, 0 failed  (of 3)
paired checks     : 1 warning(s)
negative control  : PASS — mutation caught by 5 assertion(s)
RESULT            : PASS
exit=0

$ python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py'
Ran 47 tests in 2.507s

OK

$ REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py   # the documented command
✓ apply-queue refresh (offline): 8 queued → 8 live · 0 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 0 · Skip 8 (skip 100%)
  timeline factor 0.7 (expected start 2026-12-02)
  scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/.build/runs/2026-10-21-offline/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0

$ git status --short   # package-lock.json is the npm install rewrite; the refresh writes only to its gitignored .build/
 M package-lock.json
```

Two facts in this output:
- `bls:local-wage` can't run: the data folder has never been in any commit, which matches the professor's reference run.
- With this recipe copied into top-level `recipes/`, the doctor counts 34 recipes and still 318 declared = 318 markers. So this recipe declares 0 open TODOs and carries 0 bracketed TODO markers. (The doctor doesn't scan `recipes/cases/`; that's why the copy is needed.)

### 2. The mode's tests at v0.1.2

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py' -v   # run by Claude Code 2026-10-21 15:02 EDT, v0.1.2
test_description_edit_is_flagged_against_last_weeks_log (test_refresh.Baselines) ... ok
test_liveness_change_against_a_verbatim_baseline_output (test_refresh.Baselines) ... ok
test_metadata_only_change_is_reported (test_refresh.Baselines)
Review finding 2026-10-21: an updated_at change with the same text was counted as 'nothing changed'. ... ok
test_posting_gone_since_the_baseline_says_so_not_no_baseline (test_refresh.Baselines)
Found on real data 2026-10-19: a posting that closed after the baseline was reported as 'no baseline'. ... ok
test_broken_gate_is_caught_before_the_scorer_runs (test_refresh.BreakAttempts) ... ok
test_real_gate_passes_the_same_invariant (test_refresh.BreakAttempts) ... ok
test_documented_default_command_runs_offline_on_the_committed_sample (test_refresh.DocumentedCommand) ... ok
test_audit_counts_records_in_and_out (test_refresh.OfflineRun) ... ok
test_audit_says_unknown_not_none_without_a_baseline (test_refresh.OfflineRun) ... ok
test_closed_posting_is_zeroed_by_the_engine_scorer_itself (test_refresh.OfflineRun) ... ok
test_evidence_lines_surface_the_deciding_sentences (test_refresh.OfflineRun) ... ok
test_fit_is_greenhouse_watch_judge_on_the_scheme_scale (test_refresh.OfflineRun) ... ok
test_live_posting_is_scored_with_both_gates_explicit (test_refresh.OfflineRun) ... ok
test_missing_bls_score_is_unknown_never_guessed (test_refresh.OfflineRun) ... ok
test_offline_report_says_the_liveness_comes_from_a_recording (test_refresh.OfflineRun) ... ok
test_raw_outputs_are_kept_redacted_and_hashed (test_refresh.OfflineRun) ... ok
test_report_and_audit_open_with_an_executive_summary (test_refresh.OfflineRun) ... ok
test_rules_are_confirmed_by_the_owner_not_proposals (test_refresh.OfflineRun) ... ok
test_run_exits_zero_and_writes_log_report_audit_and_engine_scores (test_refresh.OfflineRun) ... ok
test_run_record_names_the_liveness_source_in_words (test_refresh.OfflineRun) ... ok
test_scorer_output_in_the_log_carries_no_temporary_paths (test_refresh.OfflineRun) ... ok
test_scorer_runs_without_profile_and_confirms_sponsorship_needed (test_refresh.OfflineRun) ... ok
test_soc_choice_is_labeled_when_the_queue_does_not_say (test_refresh.OfflineRun) ... ok
test_sponsorship_records_are_cross_checked_against_the_csv (test_refresh.OfflineRun) ... ok
test_timeline_gate_for_priya_at_42_days_is_partial_with_its_dates (test_refresh.OfflineRun) ... ok
test_timeline_sensitivity_shows_the_other_start_times (test_refresh.OfflineRun) ... ok
test_uncertain_and_disagreeing_liveness_are_refused_not_scored (test_refresh.OfflineRun) ... ok
test_dry_run_writes_nothing (test_refresh.StopConditions) ... ok
test_malformed_queue_halts (test_refresh.StopConditions) ... ok
test_non_example_persona_must_write_into_private (test_refresh.StopConditions) ... ok
test_persona_not_needing_sponsorship_is_refused (test_refresh.StopConditions) ... ok
test_persona_without_explicit_needs_sponsorship_is_refused (test_refresh.StopConditions) ... ok
test_record_folder_must_be_private_for_non_example_inputs (test_refresh.StopConditions) ... ok
test_refuses_a_folder_it_did_not_write (test_refresh.StopConditions) ... ok
test_untracked_persona_inside_examples_is_not_treated_as_committed (test_refresh.StopConditions)
Review finding 2026-10-21: the guard checked the folder's location, not whether git tracks it. ... ok
test_untracked_queue_inside_the_tool_folder_is_not_public (test_refresh.StopConditions) ... ok
test_buffer_eaten_is_partial (test_refresh.TimelineGate) ... ok
test_ceiling_reached_before_start_is_zero (test_refresh.TimelineGate) ... ok
test_clock_not_started_yet_counts_from_the_opt_start (test_refresh.TimelineGate) ... ok
test_comfortable_runway_is_one (test_refresh.TimelineGate) ... ok
test_missing_input_stops_the_run (test_refresh.TimelineGate) ... ok
test_start_after_authorization_end_is_zero (test_refresh.TimelineGate) ... ok
test_stem_what_if_is_shown_but_never_used_as_the_gate (test_refresh.TimelineGate) ... ok
test_liveness_gate_table (test_refresh.Units) ... ok
test_parse_liveness_reads_every_line_and_reason (test_refresh.Units) ... ok
test_redact_removes_emails_and_phones (test_refresh.Units) ... ok
test_scheme_max_of_the_default_scheme (test_refresh.Units) ... ok

----------------------------------------------------------------------
Ran 47 tests in 2.553s

OK
```

### 3. Recording the sample: the first live run (2026-10-19, 01:57, v0.1.0)

```text
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --record scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/snapshot-2026-10-19 --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live-record   # run by Claude Code, 2026-10-19 01:57 EDT
✓ apply-queue refresh (live): 8 queued → 8 live · 0 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 0 · Skip 8 (skip 100%)
  timeline factor 0.7 (expected start 2026-11-30)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live-record/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0
```

This run saved every raw output, including each posting's description, as the committed offline sample `sample/snapshot-2026-10-19/` (sha256 in its `MANIFEST.json`; no emails or phone numbers needed redacting).

### 4. The documented offline command, against the Oct 3 baseline (v0.1.2)

```text
$ REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --baseline-liveness course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/00-week0-liveness-2026-10-03.txt --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-offline-sample-v012   # run by Claude Code, 2026-10-21 15:03 EDT, v0.1.2
✓ apply-queue refresh (offline): 8 queued → 8 live · 0 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 0 · Skip 8 (skip 100%)
  timeline factor 0.7 (expected start 2026-12-02)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-offline-sample-v012/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0
```

From its audit (`runs/2026-10-21-offline-sample-v012/refresh-audit.md`), the table the owner checked for the sample-run gate:

#### Records in and out

| Stage | Count |
|---|---:|
| queued | 8 |
| page check: active / expired / uncertain / missing | 8 / 0 / 0 / 0 |
| board API: present / gone / error / missing | 8 / 0 / 0 / 0 |
| live (both agree) | 8 |
| closed (both agree) | 0 |
| investigate (not scored) | 0 |
| sent to the scorer | 8 |
| Apply / Consider / Skip | 0 / 0 / 8 |

#### Input cross-checks (queue vs the 80 Days CSV)

| Company | Queue approvals | CSV approvals | Result |
|---|---:|---:|---|
| DATABRICKS INC | 1640 | 1640 | match |
| VERKADA INC | 272 | 272 | match |
| APPTRONIK INC | 56 | 56 | match |
| DILIGENT ROBOTICS INC | 20 | 20 | match |

### 5. A real closure, caught live (2026-10-19, 15:35, v0.1.0)

```text
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --baseline course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-offline-sample/refresh-log.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live   # run by Claude Code, 2026-10-19 15:35 EDT
✓ apply-queue refresh (live): 8 queued → 7 live · 1 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 0 · Skip 8 (skip 100%)
  timeline factor 0.7 (expected start 2026-11-30)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-19-live/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0
```

Independent cross-check of the one closed posting (`evidence/10`):

```text
# Independent cross-check of the posting the live run marked closed (Claude Code, 2026-10-19 15:35 EDT)

$ curl -s -o /dev/null -w '%{http_code}' https://boards-api.greenhouse.io/v1/boards/verkada/jobs/5195995007
404

$ curl -s -o /dev/null -w '%{http_code}' https://boards-api.greenhouse.io/v1/boards/verkada/jobs/4128624007   # control: a sibling posting the run marked live
200

$ npm run ats:liveness -- https://job-boards.greenhouse.io/verkada/jobs/5195995007
Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/verkada/jobs/5195995007
           redirect to https://job-boards.greenhouse.io/verkada?error=true

Results: 0 active  1 expired  0 uncertain
exit=1
```

### 6. The final run: the owner's live run of v0.1.2 (2026-10-21, 15:28)

```text
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --baseline course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner/refresh-log.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/$(date +%F)-live-owner-v012   # typed by the owner (Hemanth Rayudu) in the session prompt, 2026-10-21, v0.1.2 at b736d30 (the session shows output, not the exit code)
✓ apply-queue refresh (live): 8 queued → 7 live · 1 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 0 · Skip 8 (skip 100%)
  timeline factor 0.7 (expected start 2026-12-02)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner-v012/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
```

From its report (`runs/2026-10-21-live-owner-v012/refresh-report.md`):

#### This week's queue

| # | Company | Posting | Liveness | Timeline | Fit | Sponsorship | Score | Recommendation |
|---:|---|---|---|---:|---:|---|---:|---|
| 1 | DATABRICKS INC | [Senior Data Scientist](https://databricks.com/company/careers/open-positions/job?gh_jid=5634684002) | live `record` | 0.7 `your-input` | 0.462 `record` | Possible (p 0.4) `your-input` | 0.195 | **Skip** |
| 2 | DATABRICKS INC | [AI Engineer – Forward Deployed Engineering (AI FDE)](https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002) | live `record` | 0.7 `your-input` | 0.308 `record` | Possible (p 0.4) `your-input` | 0.163 | **Skip** |
| 3 | DATABRICKS INC | [Senior Applied ML Engineer - ML4Sys](https://databricks.com/company/careers/open-positions/job?gh_jid=8656900002) | live `record` | 0.7 `your-input` | 0.308 `record` | Possible (p 0.4) `your-input` | 0.163 | **Skip** |
| 4 | VERKADA INC | [Software Engineer - Data Platform](https://job-boards.greenhouse.io/verkada/jobs/4129304007) | live `record` | 0.7 `your-input` | 0.154 `record` | Possible (p 0.4) `your-input` | 0.130 | **Skip** |
| 5 | APPTRONIK INC | [Senior Software Engineer, ML Infrastructure](https://boards.greenhouse.io/apptronik/jobs/6176116004?gh_jid=6176116004) | live `record` | 0.7 `your-input` | 0.154 `record` | Possible (p 0.4) `your-input` | 0.130 | **Skip** |
| 6 | DILIGENT ROBOTICS INC | [ML Engineer, Manipulation](https://job-boards.greenhouse.io/diligentrobotics/jobs/7651459003) | live `record` | 0.7 `your-input` | 0.154 `record` | Possible (p 0.4) `your-input` | 0.130 | **Skip** |
| 7 | VERKADA INC | [Senior Software Engineer - Computer Vision](https://job-boards.greenhouse.io/verkada/jobs/4128624007) | live `record` | 0.7 `your-input` | 0.038 `record` | Possible (p 0.4) `your-input` | 0.106 | **Skip** |
| 8 | VERKADA INC | [Software Engineer - Computer Vision](https://job-boards.greenhouse.io/verkada/jobs/5195995007) | closed `record` | 0.7 `your-input` | — `record` | Possible (p 0.4) `your-input` | 0 | **Skip** |

#### Changed since the last refresh

Compared with: refresh-log course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner/refresh-log.json (2026-10-21).
- nothing changed.

#### The OPT clock (Chapter 10)

- Today 2026-10-21; expected start 2026-12-02 (42 days, your-input); authorization end 2027-01-31.
- Unemployment days used 34 → 76 at the expected start; ceiling 90; buffer target 20.
- Factor **0.7** — formula buffer-linear (rules.json): 14 unemployment days left at the expected start 2026-12-02; buffer target 20 -> factor 0.7.
- Sensitivity to the time-to-start (your-input): 35 days → 1.0 · 42 days → 0.7 · 70 days → 0.0.
- Note: unemployment_days_used (34) is read as of 2026-10-21 (profile.yml gives no date for it) — your-input assumption
- What-if, 150-day ceiling: factor 1.0 — only if a STEM OPT extension is approved — the extension also moves the end date; confirm both with your DSO. Shown, never used as the gate.

## Verified versus inferred (the final run, v0.1.2)

| Statement | Status | Where it comes from |
|---|---|---|
| 7 of 8 postings are live by both the page checker and the board API; 1 is closed | **verified** (record) | `runs/2026-10-21-live-owner-v012/raw/liveness.txt` (7 active, 1 expired); `raw/api-status.json` (7 × 200, 1 × 404) |
| The closed posting is Verkada "Software Engineer – Computer Vision", closed between 01:57 and 15:35 on 2026-10-19 | **verified** | the 01:57 snapshot (active, description kept) vs the 15:35 run; `curl` 404 against a 200 control; the page checker on its own says expired (`evidence/10`) |
| Nothing changed between the owner's two runs on 2026-10-21 (01:12 and 15:28) | **verified** (same sha256, same `updated_at`) | the report's "Changed since the last refresh" section |
| Each company's H-1B approval count in the queue equals the 80 Days CSV (4 of 4) | **verified** | the audit's input cross-check |
| Every posting's sponsorship tier is "Possible" (p 0.4) | **your-input** (the queue builder's rule: the posting's job family isn't among the families the company's sponsored titles fall into) | `sample/queue.sample.json` notes |
| Fit values from 0.038 to 0.462 | **verified as a computation** (a record-based string match of the persona's résumé against the posting text), **not** a judgment of suitability | `postings[].fit.lines` in the log |
| Timeline factor 0.7 (expected start 2026-12-02; 76 days used by then; 14 left vs the 20-day buffer) | **computation on your-input values** (persona dates; 42 days; the day count taken as current, since it doesn't accrue between runs) | `timeline` in the log; confirmed at G2 |
| The engine scores all 8 Skip (best 0.195) | **verified arithmetic, on an unpinned threshold**: the Consider floor of 0.20 is a `[VERIFY]` placeholder in `role-scorer.mjs`, and the best score is 0.005 under it | `role-scores.json`, `trace.arithmetic` |
| At 35 days, three Databricks rows would be Consider | **verified as a what-if run** | `evidence/22-what-if-35-days-v012.txt` |
| Most of these roles ask more experience than the persona has (3+ to 5+ years vs one co-op) | **judgment**, from the quoted sentences | the report's "What the descriptions say" section |
| The SOC code for 6 of 8 postings | **your-input** (a family hint from the queue builder); only 2 are O*NET title matches | `soc_source` in the queue; the report's "SOC chosen by" column |
| BLS median wage and cognitive-pivot score for each SOC | **verified** (record), shown but not scored | `data/bls/compact/soc_occupation_compact.csv` |
| "We do sponsor … for this role" (two Verkada postings) | **verified that the sentence is there**; what it means for this applicant is a human reading | `description.evidence_lines` |
| These postings are still being filled | **cannot verify** (a filled role can keep a live page) | — |
| These companies will sponsor this persona for these roles | **cannot verify** | — |
| G1–G3 decisions | **human decision** (Hemanth Rayudu, 2026-10-21, answers quoted in the log) | gate lines in `logs/runs/2026fa-hemanthrayuduu-2.md` |

## Verification

### Re-running with `--dry-run`, and parsing the JSON (`evidence/24`)

```text
# Verification: re-run with --dry-run, and parse the JSON (Claude Code, 2026-10-21 22:43 EDT, refresh v0.1.2 at 72b4da4)

## 1. Re-run with --dry-run (the plan only: no network, nothing written)
$ REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --dry-run --out-dir <scratch>/dry
DRY RUN — no network, nothing written. Mode would be offline.
  queue   scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/queue.sample.json (8 postings)
  persona search/examples/priya-nair
  liveness from: snapshot scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/sample/snapshot-2026-10-19
  timeline factor 0.7 (14 unemployment days left at the expected start 2026-12-02; buffer target 20 -> factor 0.7)
  would run: node scripts/score/role-scorer.mjs <scratch>/dry/roles.json --out-dir <scratch>/dry
  would write: <scratch>/dry/refresh-log.json, refresh-report.md, refresh-audit.md, raw/
exit=0
$ ls <scratch>/dry   # must not exist: a dry run writes nothing
ls: <scratch>/dry: No such file or directory

## 2. Parse the final run's JSON and check it agrees with itself (evidence/helpers/parse_check.py)
$ python3 -m json.tool course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner-v012/refresh-log.json > /dev/null && echo 'refresh-log.json is valid JSON'
refresh-log.json is valid JSON
$ python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/parse_check.py course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner-v012
parsed: refresh-log.json (8 postings), roles.json (8 roles), role-scores.json (8 scored)
  OK   log 'scored' == roles sent == roles scored
  OK   log Apply/Consider/Skip == scorer's own
  OK   every role has numeric liveness and timeline factors
  OK   no 'investigate' posting reached the scorer
  OK   scorer ran with sponsorship required
  OK   every raw file's sha256 matches the log
counts in the log: {"queued": 8, "live": 7, "closed": 1, "investigate": 0, "scored": 8, "apply": 0, "consider": 0, "skip": 8}
exit=0
```

The dry run prints the plan, and the folder it names is never created. The final run's three JSON outputs parse, and agree with each other on all six checks (`evidence/helpers/parse_check.py`).

### Cross-checking counts against the source

- **Liveness counts vs the raw output:** the final run's audit says 7 active / 1 expired and 7 present / 1 gone. The raw page-checker output (`raw/liveness.txt`: `Results: 7 active  1 expired  0 uncertain`) and the raw API statuses (`raw/api-status.json`: seven 200s, one 404) say the same.
- **Sponsorship records vs the CSV:** all 4 companies' approval counts in the queue match `mapped_student_employment_targets_v3.csv` (1640, 272, 56, 20).
- **The closed posting vs the board itself:** `curl` returns 404 for it and 200 for a sibling posting at the same company; the page checker on its own says `expired` (`evidence/10`).
- **The recipe's own TODO count vs the repository's doctor:** 0 declared = 0 markers (section 1).

### Deliberate attempts to break it

Summary lines come from the committed helpers in `evidence/helpers/`. The earlier versions' break attempts (`evidence/03`, `14`) used the same code inline, before it was committed.

**A deliberately broken liveness gate** (`fixtures/BROKEN-liveness-gate.py`), with and without the run's invariant (`evidence/21`):

```text
$ python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/negative_control.py   # run by Claude Code 2026-10-21 15:04 EDT
# Break attempt: fixtures/BROKEN-liveness-gate.py (treats every non-closed posting as live), refresh v0.1.2

## 1. Real gate
scored: ['lumenbyte-101', 'lumenbyte-102'] | invariant violations: []

## 2. BROKEN gate, with the run's invariant check ON
CAUGHT — StopRun: invariant violated before scoring — nothing written: invariant: quietharbor-201 reached the scorer with page=uncertain, api=present; invariant: quietharbor-202 reached the scorer with page=active, api=gone
role-scores.json written? False

## 3. BROKEN gate with the invariant check switched OFF (negative control: what the check prevents)
quietharbor-201 page/api = uncertain/present -> scored Skip (0.4·0.35 + 0.308·0.3) × 1 × 0.7 = 0.163
quietharbor-202 page/api = active/gone -> scored Skip (0.4·0.35) × 1 × 0.7 = 0.098
```

**On real data, v0.1.2** (`evidence/20`):
- made-up job ids;
- a board-API outage;
- a persona who doesn't need sponsorship;
- a real profile aimed at a tracked folder;
- two cases new in v0.1.2: an untracked profile hidden inside `search/examples/`, and a `--record` folder outside `private/`.

```text
# Break attempts on real data, refresh v0.1.2 (run by Claude Code, 2026-10-21 15:03 EDT). Summary lines come from evidence/helpers/summarize_run.py.

## (a) Job ids that do not exist, next to one real live posting (live run)
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --queue scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/fixtures/queue.break-made-up-ids.json --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids-v012
✓ apply-queue refresh (live): 3 queued → 1 live · 1 closed · 1 investigate · 2 scored
  scorer: ✓ scored 2 roles → Apply 0 · Consider 0 · Skip 2 (skip 100%)
  timeline factor 0.7 (expected start 2026-12-02)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids-v012/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0
$ python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/summarize_run.py course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids-v012
  run: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-made-up-ids-v012 (refresh v0.1.2, live, today 2026-10-21); timeline factor 0.7
  page: {'active': 1, 'uncertain': 1, 'expired': 1} | api: {'present': 1, 'gone': 2} | verdicts: {'live': 1, 'investigate': 1, 'closed': 1}
  verkada-4129304007           page=active    api=present  → live        0.1303 Skip
  figma-1000000001             page=uncertain api=gone     → investigate — not scored
  verkada-1000000001           page=expired   api=gone     → closed      0 Skip

## (b) An outage: the board API unreachable (a dead proxy at 127.0.0.1:9 stands in for it), live run on the 8-posting sample queue
$ https_proxy=http://127.0.0.1:9 HTTPS_PROXY=http://127.0.0.1:9 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-outage-v012
✓ apply-queue refresh (live): 8 queued → 0 live · 0 closed · 8 investigate · 0 scored
  scorer: ✓ scored 0 roles → Apply 0 · Consider 0 · Skip 0 (skip NaN%)
  timeline factor 0.7 (expected start 2026-12-02)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-outage-v012/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0
$ python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/summarize_run.py course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-outage-v012
  run: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-outage-v012 (refresh v0.1.2, live, today 2026-10-21); timeline factor 0.7
  page: {'active': 7, 'expired': 1} | api: {'error': 8} | verdicts: {'investigate': 8}
  databricks-8546367002        page=active    api=error    → investigate — not scored

## (c) A persona who does not need sponsorship (Rohan Desai, fictional)
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --persona search/examples/rohan-desai --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-rohan-v012
ERROR: this persona does not need sponsorship — the mode is for F-1 OPT holders who do
exit=1
ls: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-rohan-v012: No such file or directory

## (d) A persona outside the committed examples, output aimed at a tracked folder
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --persona <a folder outside search/examples/> --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-private-v012
ERROR: the persona or queue is not one of the committed fictional examples, so the output must go under private/ (got course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-private-v012) — real profiles and queues never reach a tracked folder
exit=1
ls: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-private-v012: No such file or directory

## (e) NEW in v0.1.2: an untracked profile placed INSIDE search/examples/ (the guard used to trust the folder's location)
$ git status --short search/examples   # untracked
?? search/examples/zz-untracked-real-profile/
$ python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --persona search/examples/zz-untracked-real-profile --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-untracked-v012
ERROR: the persona or queue is not one of the committed fictional examples, so the output must go under private/ (got course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-untracked-v012) — real profiles and queues never reach a tracked folder
exit=1
ls: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-break-untracked-v012: No such file or directory

## (f) NEW in v0.1.2: a --record folder outside private/ with a non-example persona (output folder under private/)
$ REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live --persona <a folder outside search/examples/> --record <a folder outside private/> --out-dir private/zz-break-record
ERROR: the persona or queue is not one of the committed fictional examples, so the --record folder must be under private/ too (got <scratch>/rec-outside)
exit=1
ls: <scratch>/rec-outside: No such file or directory
ls: private/zz-break-record: No such file or directory
```

**The clock as a gate, not a vote** (`evidence/22`): the same snapshot and date, with only the time-to-start changed:

```text
# What-if (Claude Code, 2026-10-21 15:04 EDT, v0.1.2): the same recorded snapshot and date as the v0.1.2 sample run; only the time-to-start changes, 42 → 35 days
$ REFRESH_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --today 2026-10-21 --time-to-start-days 35 --out-dir course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-what-if-35-days-v012
✓ apply-queue refresh (offline): 8 queued → 8 live · 0 closed · 0 investigate · 8 scored
  scorer: ✓ scored 8 roles → Apply 0 · Consider 3 · Skip 5 (skip 63%)
  timeline factor 1.0 (expected start 2026-11-25)
  course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-what-if-35-days-v012/refresh-report.md  +  refresh-log.json  +  refresh-audit.md
exit=0

$ python3 course/2026fa/submissions/hemanthrayuduu/mode-build/evidence/helpers/summarize_run.py course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-offline-sample-v012 course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-what-if-35-days-v012   # left: 42 days, right: 35 days
  run: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-offline-sample-v012 (refresh v0.1.2, offline, today 2026-10-21); timeline factor 0.7; compared with course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-what-if-35-days-v012 (timeline factor 1.0)
  page: {'active': 8} | api: {'present': 8} | verdicts: {'live': 8}
  databricks-5634684002        page=active    api=present  → live        0.195 Skip  |  0.2786 Consider  ← flips
  databricks-8546367002        page=active    api=present  → live        0.1627 Skip  |  0.2324 Consider  ← flips
  databricks-8656900002        page=active    api=present  → live        0.1627 Skip  |  0.2324 Consider  ← flips
  verkada-4129304007           page=active    api=present  → live        0.1303 Skip  |  0.1862 Skip
  apptronik-6176116004         page=active    api=present  → live        0.1303 Skip  |  0.1862 Skip
  diligentrobotics-7651459003  page=active    api=present  → live        0.1303 Skip  |  0.1862 Skip
  verkada-4128624007           page=active    api=present  → live        0.106 Skip  |  0.1514 Skip
  verkada-5195995007           page=active    api=present  → live        0.106 Skip  |  0.1514 Skip
```

### What broke during the run, and the fixes

- **v0.1.0:** the audit printed Python's `None` for an unknown description change. Fixed, test first.
- **v0.1.1, from the first live run:** it caught a real closure, and exposed four report problems, each fixed with a failing test first:
  - a posting gone since the baseline was labeled "no baseline";
  - the run record printed a raw Python dictionary;
  - the BLS table hid that 6 of 8 SOC codes are a guess;
  - two lines of awkward wording.
- **v0.1.2, from an independent review** (a fresh-context reviewer graded the submission against the assignment, the rubric, the data contract and the professor's reference; it checked 11 numbers and found all correct). Fixed, each with a failing test first:
  - the privacy guard trusted a folder's *location*, so an untracked profile inside `search/examples/` passed. It now requires git-tracked examples;
  - the `--record` folder wasn't guarded;
  - the log carried a temporary path and named a command that hadn't run;
  - a metadata-only change wasn't reported;
  - offline reports didn't say they were replaying a recording.
  In the recipe, closed TODO markers would have made the doctor count 10 open TODOs against `todos_open: 0`; they're now written `[CLOSED: …]`.
- **Process:** every script or recipe change after a gate made a new version, and each version had its own gates (v0.1.0, v0.1.1, v0.1.2).
- **Tooling:** `npm install` rewrites the repository's `package-lock.json` (36 lines). It's restored before every commit, and the fresh-clone evidence shows it.

## Reflection

**What went well:**
- The gates did their job on real data: a closure was caught within a day by two independent checks that agreed, and the owner's run two days later confirmed it.
- A page the engine's checker couldn't classify was held for a human instead of being scored.
- An outage produced zero scores, not eight "live" ones.
- Every number in the report traces to a raw output kept beside it, including the description of a posting that no longer exists.
- The independent review found real defects, and each became a test.

**What the mode got wrong or missed:**
- It can't see a **ghost posting**: a page and a board entry can both stay up after the role is filled.
- **The clock is only as current as the day count.** The mode reads the count as of each run date and doesn't add days between runs, so a stale count understates the pressure; only G2 catches it.
- **One time-to-start for every company**, and the result is sensitive to it: 35 vs 42 days flips three rows.
- **The Skip verdict rests on an unpinned floor:** the engine's 0.20 is a placeholder, and the best score is 0.005 under it.
- **Sponsorship evidence is per title family,** so every AI / data posting is capped at "Possible", and 6 of 8 SOC codes are a guess.
- **The fit is literal string matching:** "Anywhere in the US" isn't read as remote.
- **No description baseline for the first refresh,** so it couldn't say whether Oct 3's descriptions had changed.

**Next version (v0.2.0): typed proposals** (none is on this version's path, so the recipe's `todos_open` stays 0):
1. `[TODO: DATA SOURCE]` a **dated** unemployment-day count (`unemployment_days_as_of` in `profile.yml`), with the run stopping when the count is more than 7 days old.
2. `[TODO: DEV]` posting age from the board's `first_published` field as a ghost signal; `[TODO: DEFINE]` the age the person treats as "probably filled".
3. `[TODO: DATA SOURCE]` a per-company time-to-start (each company's stated interview process), replacing the single 42-day value.
4. `[TODO: DATA SOURCE]` per-petition SOC codes (the DOL LCA disclosure), so AI / data roles aren't capped by software-title history.
5. `[TODO: DEV]` re-apply the eligibility phrase rules (citizenship, clearance, "unable to sponsor", years) automatically whenever a description's hash changes, rather than only quoting the sentences.
6. `[TODO: DATA SOURCE]` the BLS local-wage files (`data/bls/local-wage/`), so role-quality context is local, not national.
7. `[TODO: DEFINE]` a pinned Consider floor for the engine scorer: an engine decision, outside this mode.
8. `[TODO: DEV]` Lever and Ashby boards (both have public posting APIs).

## Attestation

- Recipe: hemanthrayuduu-ai-data-opt-apply-queue-refresh v0.1.2 (rules 0.1.0)
- By: Hemanth Rayudu · 2026-10-21 (signed in the session after the owner's own v0.1.2 live run and gates; rows marked "(Claude Code)" were run by Claude Code, not by the signer)

### Tested

| Ran | Saw | Expected |
|---|---|---|
| **(owner)** live refresh v0.1.2 on the 8 postings | 7 live · 1 closed · 0 investigate; Skip 8; timeline 0.7; nothing changed since the 01:12 run | consistent with the earlier runs |
| **(owner)** opened the 8 links (G1) | "7 live, #8 gone" | matches the run's verdicts |
| **(owner)** checked the clock (G2) | "Confirmed": 34 → 76 days by 2026-12-02; 14 left vs the 20-day buffer → 0.7 | the arithmetic matches the persona and the rules |
| **(owner)** release decision (G3) | "None; recheck Databricks" | a decision, recorded |
| **(owner)** read the v0.1.2 sample-run audit and quoted its counts | 8 queued; 8 / 0 / 0 / 0; 8 live; 0 investigate; 0 / 0 / 8 | matches the file |
| (Claude Code) 47 offline tests, on a fresh clone at v0.1.2 | OK | all pass |
| (Claude Code) the documented offline command, network forbidden, on a fresh clone | exit 0; outputs only under `.build/` | it runs offline |
| (Claude Code) verify / conformance / doctor (with the recipe copied top-level) / `score:gates` | exit 0 / exit 0 / 34 recipes, 318 = 318 / PASS | pass; 0 open = 0 markers |
| (Claude Code) **break:** a broken liveness gate swapped in | caught before scoring, nothing written; with the invariant off, unestablished postings scored `× 1 ×` | caught |
| (Claude Code) **break:** the professor's made-up Figma job id | page `uncertain`, API 404 → investigate, not scored | never scored as live |
| (Claude Code) **break:** a made-up Verkada job id | `expired` + 404 → closed, gated to 0 | zeroed |
| (Claude Code) **break:** board API unreachable (dead proxy) | 8 investigate, 0 scored | an outage never becomes "live" |
| (Claude Code) **break:** a persona who doesn't need sponsorship | refused, nothing written | refusal |
| (Claude Code) **break:** a non-example profile with a tracked output folder | refused, nothing written | refusal |
| (Claude Code) **break:** an untracked profile inside `search/examples/` | refused (v0.1.2 fix) | refusal |
| (Claude Code) **break:** a `--record` folder outside `private/` | refused before any network use (v0.1.2 fix) | refusal |
| (Claude Code) cross-check: `curl` the closed posting's API | 404 (control 200) | 404 |
| (Claude Code) what-if: 35 instead of 42 days | factor 1.0; 3 rows → Consider | for the scorer, the clock decides |

### Did not test

- A dated or accruing unemployment-day count (not implemented; the count is taken as current).
- Posting age or any other ghost signal (not implemented).
- A real description edit: none happened between the baselines; only the fixture edit was tested.
- A per-company time-to-start (one value is used for all).
- Whether 0.20 is the right Consider floor (an engine placeholder).
- Boards other than Greenhouse (Lever, Ashby, Workday, iCIMS).
- Real STEM-extension or pre-completion-OPT eligibility: only arithmetic and a what-if; a DSO decides.
- The local wage (`bls:local-wage` can't run on `main`).
- Queues larger than 8 postings, and the board API's rate limits.
- Any operating system other than macOS; CI doesn't run contributed tests.

### Broke during testing, fixed

- v0.1.0: the audit printed `None` → "unknown (no baseline)" (test first).
- v0.1.1, all found by the first live run, each with a test first:
  - "gone since the baseline" was mislabeled;
  - the run record printed a raw dictionary;
  - the BLS table hid how each SOC was chosen;
  - two lines of wording.
- v0.1.2, all found by the independent review, each with a test first:
  - the privacy guard trusted location instead of git-tracking;
  - the `--record` folder wasn't guarded;
  - the log carried temporary paths;
  - metadata-only changes went unreported;
  - offline reports didn't name the recording.
  The recipe's closed TODO markers were miscounted.
- Process: each script or recipe change after a gate got a new version and its own gates.

## AI use

- **Claude Code (Anthropic) did this:**
  - wrote `refresh.py`, its 47 tests and fixtures, the evidence helpers, the mode file, the card, these documents and the run log;
  - ran every command marked "(Claude Code)" or "run by Claude Code" in `evidence/`;
  - dispatched the independent reviewer (a fresh-context Claude Code subagent, read-only) and fixed what it found.
- **Hemanth Rayudu decided:**
  - the mode;
  - the persona (Priya Nair, after the data-contract explanation);
  - the lifecycle path;
  - the five value choices and the report fields;
  - the data-source closures;
  - the full fix after the review;
  - closing the earlier PR when this one opens.
- **Hemanth Rayudu also did this:** ran the final live refresh, read the sample-run audits, cleared every gate, and reviewed this attestation.

