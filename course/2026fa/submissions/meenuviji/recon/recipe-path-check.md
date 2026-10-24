# Recipe path and command check — data-titles-h1b-entry

## Executive summary

This file checks the new recipe and its human card against the repository. Every file path and command they mention was extracted by a script and tested. The prototype's own commands were actually run. All commands exist and run. Seven named paths do not exist, and each is named because it is missing: an absent data file, three planned folders, and a future run-log file. The recipe's open-item count matches its header. Both files pass the syntax check. The final section holds the recomputed headline numbers for the next change-brief revision.

---

## Run record

- Files checked: `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md`, `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.card.md`
- Extraction: every backticked token containing `/` or ending .md/.json/.csv/.py/.mjs, and every npm/node/python3 command in code blocks or backticks. Paths beginning `out/` or `postings/` are resolved relative to the prototype folder, as the recipe states.
- Branch: `contrib/2026fa-meenuviji-data-titles-h1b-entry`

## Paths

| Path (as written) | In file | Exists | Note |
|---|---|---|---|
| `CONTRIBUTING.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `DOMAIN.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `SEC_DOL_H1b_data_mapped.csv` | meenuviji-data-titles-h1b-entry.md | NO | named BECAUSE it is missing (Facts that bite); the recipe uses the _v3 file instead |
| `SNICKERDOODLE.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `book/chapters/02-the-reallocation-principle.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `course/2026fa/submissions/meenuviji/CHANGE-BRIEF.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `course/2026fa/submissions/meenuviji/recon/raw-output.txt` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/80-days-to-stay/data/README.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` | meenuviji-data-titles-h1b-entry.md | NO | named BECAUSE it is missing (Facts that bite); the recipe uses the _v3 file instead |
| `data/ats/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/bls/compact/soc_occupation_compact.csv` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/raw/` | meenuviji-data-titles-h1b-entry.md | NO | named BECAUSE it does not exist (assignment known gap); the recipe points nothing at it |
| `data/sec/form-d/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/sec/form-d/processed/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/sec/form-d/processed/recent-sec-quarters-audit.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/sec/form-d/processed/sample/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `data/verified/` | meenuviji-data-titles-h1b-entry.md | NO | named BECAUSE it does not exist (assignment known gap); the recipe points nothing at it |
| `logs/RUN_LOG.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `logs/gate-decisions/` | meenuviji-data-titles-h1b-entry.md | NO | named BECAUSE it does not exist (assignment known gap); the recipe points nothing at it |
| `logs/runs/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `logs/runs/2026fa-meenuviji-1.md` | meenuviji-data-titles-h1b-entry.md | NO | future file; the recipe says it does not exist yet and ties it to its [TODO: APPROVE] |
| `logs/runs/<term>-<handle>-<n>.md` | meenuviji-data-titles-h1b-entry.md | template/pattern — not a concrete path | n/a |
| `out/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/report.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/roles.json` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/run.json` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/score/role-scores.json` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/score/role-scores.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `out/…` | meenuviji-data-titles-h1b-entry.md | template/pattern — not a concrete path | n/a |
| `postings/…` | meenuviji-data-titles-h1b-entry.md | template/pattern — not a concrete path | n/a |
| `private/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `recipes/_shared.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.card.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md` | meenuviji-data-titles-h1b-entry.card.md | yes |  |
| `scripts/bls/local-wage-adjustment.py` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/README.md` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/manifest-check.mjs` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/score/role-scorer.mjs` | meenuviji-data-titles-h1b-entry.card.md, meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/sec/sec-all-quarters.py` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `scripts/sec/validate-h1b-join-sample.py` | meenuviji-data-titles-h1b-entry.md | yes |  |
| `search/examples/README.md` | meenuviji-data-titles-h1b-entry.md | yes |  |

## Commands

| Command (as written) | In file | Target exists | Note |
|---|---|---|---|
| `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` | meenuviji-data-titles-h1b-entry.md | yes | script file exists; prototype commands run below |
| `python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v` | meenuviji-data-titles-h1b-entry.md | RUN | run below |
| `node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` | meenuviji-data-titles-h1b-entry.md | yes | script file exists |
| `npm run verify` | meenuviji-data-titles-h1b-entry.md | yes | package.json script → `node scripts/conformance.mjs && node scripts/manifest-check.mjs` |
| `npm run doctor` | meenuviji-data-titles-h1b-entry.md | yes | package.json script → `node scripts/doctor.mjs` |
| `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py --force` | meenuviji-data-titles-h1b-entry.md | yes | script file exists; prototype commands run below |
| `npm run score` | meenuviji-data-titles-h1b-entry.md | yes | package.json script → `node scripts/score/role-scorer.mjs` |
| `npm run ats:liveness -- <url>` | meenuviji-data-titles-h1b-entry.md | yes | package.json script → `node scripts/ats/check-liveness.mjs` |
| `npm run ats:scan -- --dry-run` | meenuviji-data-titles-h1b-entry.md | yes | package.json script → `node scripts/ats/scan.mjs` |

## Prototype commands, actually run

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v  [2026-10-03T18:23:51Z]
test_bad_argument_exits_2 (test_pipeline.Pipeline) ... ok
test_company_matches_more_than_one_row (test_pipeline.Pipeline) ... ok
test_company_not_in_csv (test_pipeline.Pipeline) ... ok
test_duplicate_evidence_note_for_pathai_and_pathrai (test_pipeline.Pipeline) ... ok
test_exact_match_with_siblings_is_noted_not_stopped (test_pipeline.Pipeline) ... ok
test_gate_closed_skip_gets_gate_next_action (test_pipeline.Pipeline) ... ok
test_happy_path (test_pipeline.Pipeline) ... ok
test_in_csv_without_sponsorship_gives_null_p (test_pipeline.Pipeline) ... ok
test_missing_liveness_is_refused (test_pipeline.Pipeline) ... ok
test_missing_timeline_input_is_refused (test_pipeline.Pipeline) ... ok
test_next_action_differs_by_evidence_group_with_same_recommendation (test_pipeline.Pipeline) ... ok
test_no_duplicate_note_for_distinct_evidence (test_pipeline.Pipeline) ... ok
test_null_sponsorship_p_through_real_scorer (test_pipeline.Pipeline) ... ok
test_only_senior_data_titles (test_pipeline.Pipeline) ... ok
test_opt_window_closed_gates_to_skip (test_pipeline.Pipeline) ... ok
test_projected_start_before_opt_start_is_deferred_not_failed (test_pipeline.Pipeline) ... ok
test_projected_start_on_window_end_is_inside (test_pipeline.Pipeline) ... ok
test_projected_start_one_day_after_window_end_fails (test_pipeline.Pipeline) ... ok
test_run_config_holds_run_inputs_only (test_pipeline.Pipeline) ... ok
test_sha_mismatch_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_target_title_without_bls_row (test_pipeline.Pipeline) ... ok
test_title_family_note_only_when_posting_title_lacks_matched_phrase (test_pipeline.Pipeline) ... ok
test_unlabeled_rule_is_whole_run_failure (test_pipeline.Pipeline) ... ok
test_allowlist_is_substring_and_precise (test_pipeline.Rules) ... ok
test_entry_markers_and_unmarked (test_pipeline.Rules) ... ok
test_evidence_groups (test_pipeline.Rules) ... ok
test_level_tokens (test_pipeline.Rules) ... ok
test_whole_word_seniority (test_pipeline.Rules) ... ok

----------------------------------------------------------------------
Ran 28 tests in 12.096s

OK
[exit code: 0]
```

```text
$ python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py ; echo "exit: $?"  [2026-10-03T18:24:04Z]
! 15 postings → scored 12 (Apply 2 · Consider 8 · Skip 2) · stopped 2 · refused 1
  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json  +  scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md
exit: 3
[exit code: 0]
```

`build_sample.py --force` was **not** run, because it would rewrite the frozen sample. Run without `--force` instead, to show the script exists and that the freeze holds (expected: refuses, exit 1):

```text
$ python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py
✗ scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json exists; the sample is frozen. Use --force only if you mean to redraw it.
[exit code: 1]
```

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/  [2026-10-03T18:24:04Z]
conformance: 38 files (3 md · 12 py · 23 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit code: 0]
```

## TODO count

Frontmatter `todos_open`: 7

Markers in the body (`grep -o '\[TODO: [A-Z ]*\]'`):
```text
   1 [TODO: APPROVE]
   1 [TODO: DATA SOURCE]
   2 [TODO: DEFINE]
   3 [TODO: DEV]
total: 7
```

## Conformance on the recipe folder

```text
$ node scripts/conformance.mjs recipes/cases/2026fa/  [2026-10-03T18:24:05Z]
conformance: 2 files (2 md)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit code: 0]
```

## npm run doctor

```text
$ npm run doctor  [2026-10-03T18:24:05Z]

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.21.0
  ✓ python3    Python 3.9.6

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
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
[exit code: 0]
```

## CHANGE-BRIEF Revision 2 numbers (computed, not yet written to the brief)

Under the final rules in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json` (allowlist substring, whole-token seniority, level tokens), over all 30,369 rows of the 80 Days CSV:

```text
$ python3 <scratch>/rev2.py   # read-only; imports lib.inputs and lib.classify from the prototype; applies rules.json to every CSV row
CSV SHA-256: eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270
Rules: scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json (data_family_phrases, seniority, min_approvals_for_proven=5)
Companies with >=1 data-family title: 248
  of which all data-family titles are senior: 94
  of which Approval_Rate == 100 and Total Approvals <= 3: 39
Evidence-group sizes (cross-check): {'no-record': 28812, 'only-senior': 94, 'no-data-title': 1309, 'entry-under-min-approvals': 41, 'proven': 99, 'only-mid': 14}
[exit code: 0]
```

- Companies with ≥1 data-family title: **248** (probe's substring rule gave 421)
- …whose data-family titles are all senior: **94** (probe: 171)
- …with Approval_Rate = 100 and Total Approvals ≤ 3: **39** (probe: 68)

## Note on the prototype run

Running `run.py` for this check rewrote the tracked `out/report.md` and `out/run.json` (committed in e93e817). The only difference was the run timestamp (`2026-10-03T18:13:45Z` → `2026-10-03T18:24:04Z`; `git diff` showed 1 line changed in each file). Both files were restored with `git checkout --` so that no tracked file outside the new recipe files is modified.

---

## lifecycle check

Read-only. Quotes are verbatim, with line numbers (`grep -n` and `sed -n`). Generated by a scratch script.

### (a) Passages defining lifecycle statuses, todos_open vs status, and TODO types

**SNICKERDOODLE.md**

```text
  28  **P6 — Intent lives in the recipe; truth lives in the run.** The recipe is authoritative for what should happen; the audit is authoritative for what did happen. A recipe's authority grows with its lifecycle stage (below): a DRAFT is a hypothesis; only a VERIFIED recipe carries evidence its intent is achievable. Disagreement between recipe, script, and run is a logged defect — no artifact silently wins.
```

```text
  39  ## The Verification Stack
  40  
  41  Four layers, in order. Each layer feeds the next; none substitutes for the next.
  42  
  43  1. **Conformance checks** — what the machine genuinely can judge: a JSON file that doesn't parse, a missing schema field, a script that exits nonzero. These **halt the run**. They never become polite reports.
  44  2. **Audits** — scripts that count, compare, and surface: records in, records out, rejects and why, anomalies, examples. Audits are **reports for human judgment**, written beside the data they inspect as `*-audit.md`. An audit does not say pass; it says what it found.
  45  3. **Attestation** — the human's record of having judged the audits and the running system. The record **is** the attestation; there is no verdict field (see format below). Thin testing exposes itself.
  46  4. **VERIFIED** — the status transition is the verdict; the record is the justification.
```

~~~text
  48  ## Recipe Lifecycle
  49  
  50  Every recipe carries status frontmatter. The status is a claim; per P3, each transition needs a logged evidence artifact. Editing the status field without the evidence is a violation, not a promotion.
  51  
  52  ```
  53  DRAFT ──► SPECIFIED ──► RUNNABLE-SAMPLE ──► RUNNABLE-LIVE ──► VERIFIED
  54  ```
  55  
  56  | Transition | Gate test | Evidence |
  57  |---|---|---|
  58  | DRAFT → SPECIFIED | zero open `[TODO]` items; each closure has its required evidence (table below) | the closures themselves, in the recipe |
  59  | SPECIFIED → RUNNABLE-SAMPLE | full sample run completes; conformance checks pass; audits generated and read | RUN_LOG entry + audit files |
  60  | RUNNABLE-SAMPLE → RUNNABLE-LIVE | live run with a human clearing every gate | logged gate decisions |
  61  | RUNNABLE-LIVE → VERIFIED | attestation recorded, bound to this recipe version | attestation record |
  62  
  63  ```yaml
  64  ---
  65  status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED
  66  todos_open: 0
  67  last_gate: null        # e.g. "sample-run, 2026-06-14, logs/RUN_LOG.md#2026-06-14"
  68  attestation: null      # path to attestation record, set only at VERIFIED
  69  recipe_version: 0.1.0
  70  ---
  71  ```
  72  
  73  ## TODO Closure
  74  
  75  A `[TODO]` without evidence of closure is still open, whatever the text says.
  76  
  77  | TODO type | Closed by | Evidence required |
  78  |---|---|---|
  79  | `DATA SOURCE` | human | file exists at the named path + one-line provenance note (origin, date) |
  80  | `DEFINE` | human | the value, in the recipe, with one sentence of reasoning |
  81  | `DEV` | AI (via scored prompt) | script exists + conformance checks pass + handoff condition met |
  82  | `APPROVE` | human | a logged gate decision — this is a gate, not a checkbox |
  83  | `REPORT FIELD` | human | all three: exact columns/sections, reader role, decision enabled |
  84  
  85  ## Attestation Format
~~~

**recipes/README.md** — no passage mentions DRAFT, SPECIFIED, RUNNABLE-*, VERIFIED, `todos_open`, lifecycle, or TODO types (`grep -n -E "DRAFT|SPECIFIED|RUNNABLE|VERIFIED|todos_open|TODO|lifecycle|Lifecycle"` returned nothing).

**recipes/cases/README.md**

```text
   1  # recipes/cases/ — student case recipes, by term
   2  
   3  A student recipe is born here (`cases/<term>/<handle>-<slug>.md` + `.card.md`)
   4  and can only enter top-level `recipes/` by maintainer promotion, which
   5  requires lifecycle status ≥ RUNNABLE-SAMPLE with its RUN_LOG evidence link
   6  filled in. The directory encodes "assignment artifact"; promotion encodes
   7  "operating surface." Honest frontmatter is graded: `status: VERIFIED` with
   8  `attestation: null` is a contract violation, not a promotion.
```

**DATA_CONTRACT.md** — no passage mentions any lifecycle status, `todos_open`, or TODO types (same grep returned nothing).

### (b) Recipes under recipes/cases/ (all terms) and top-level RUNNABLE-SAMPLE recipes

| Path | status | todos_open | last_gate | [TODO: …] tags in body (count) | body `[TODO` total |
|---|---|---|---|---|---|
| `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.card.md` | (no frontmatter) | — | — | — | 0 |
| `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md` | RUNNABLE-SAMPLE | 7 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×2, DEV ×3 | 7 |
| `recipes/cases/2026su/case-backend-swe-opt-triage.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-data-ml-h1b-triage.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-ds-faang-opt-runway.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-funded-systems-analyst.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-h1b-sponsorship-audit.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-ic-layout-fit.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-ml-sponsorship-triage.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-new-grad-platform-data-engineering.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-nlp-ml-sponsorship-triage.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-opt-timeline-fit-company-targeting.md` | DRAFT | 14 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×8 | 14 |
| `recipes/cases/2026su/case-phd-econ-to-industry.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-tpm-pivot.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/cases/2026su/case-ux-designer-stem-opt.md` | DRAFT | 13 | null | APPROVE ×1, DATA SOURCE ×1, DEFINE ×4, DEV ×7 | 13 |
| `recipes/gate-behavior.card.md` | RUNNABLE-SAMPLE | 0 | "sample-run, 2026-08-09, logs/RUN_LOG.md" | — | 0 |
| `recipes/gate-behavior.md` | RUNNABLE-SAMPLE | 0 | "sample-run, 2026-08-09, logs/RUN_LOG.md" | — | 0 |
| `recipes/gate-harness.card.md` | RUNNABLE-SAMPLE | 0 | "verification gate — passed 2026-08-11" | — | 0 |
| `recipes/gate-harness.md` | RUNNABLE-SAMPLE | 0 | "verification gate — passed 2026-08-11" | — | 0 |
| `recipes/local-wage-adjustment.md` | RUNNABLE-SAMPLE | 0 | "sample-run adequacy signed by a human (Atharva Kurlekar, 2026-08-16), logs/RUN_LOG.md#2026-08-16----local-wage-adjustment-g2-reason-code-split--corrected-re-run; sample-run attestation kept at logs/attestations/local-wage-adjustment.md" | — | 0 |
| `recipes/skill-demand-monitor.md` | RUNNABLE-SAMPLE | 0 | "sample-run, 2026-08-14, logs/RUN_LOG.md#2026-08-14" | — | 0 |

Top-level recipes whose frontmatter status is RUNNABLE-SAMPLE: `recipes/gate-behavior.card.md`, `recipes/gate-behavior.md`, `recipes/gate-harness.card.md`, `recipes/gate-harness.md`, `recipes/local-wage-adjustment.md`, `recipes/skill-demand-monitor.md`.

### The 7 markers in recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md

| Line | Full text (verbatim) | Kind | Closable now without new data or code? |
|---|---|---|---|
| 100 | 1. **Title- or SOC-level sponsorship records.** `[TODO: DATA SOURCE]` DOL LCA disclosure data (employer, job title, SOC code, wage, dates), ingested by a maintained script. Why: the CSV records sponsorship per company. The sponsored-title list is the only role-level signal, and it is short free text. Records per title would replace the title-list heuristic with records. | Proposed addition (future work) | Needs new data (DOL LCA disclosure files) and an ingest script; cannot be closed now. |
| 101 | 2. **A title → SOC map for target and posting titles.** `[TODO: DEFINE]` a `your-input` mapping from each target title to one SOC code, with a sentence of reasoning per row. Why: under the current rule only Data Scientist and Business Intelligence Analyst match a BLS `title`. Data Analyst, Data Engineer, Machine Learning Engineer and AI Engineer show "no SOC row" (`out/report.md`, BLS column). | Proposed addition (future work) | Partly: it is a your-input table (no new data or code to *write* it), but nothing in the prototype reads such a map yet, so using it needs new code. Writing the table alone would close the DEFINE per SNICKERDOODLE (value + one sentence of reasoning per row). |
| 102 | 3. **A role-quality weight.** `[TODO: DEV]` A proposal to the scorer's maintainers for a non-zero `role_quality` weight, with renormalisation. Why: `role_quality` is 0.0 (scorer `CONFIG`, recorded in `out/run.json` → `scorer.config`), so wage context cannot change any recommendation. Blocker noted in CHANGE-BRIEF §5f: 15-2051 gives Data Scientists and Business Intelligence Analysts the same median ($112,590), so the national wage can't separate two of the target titles. | Proposed addition (future work) | No: needs a change to the maintained scorer or a maintainer decision; the brief keeps role_quality at 0.0. |
| 103 | 4. **Live liveness for real postings.** `[TODO: DEV]` Feed `npm run ats:liveness -- <url>` output into the posting's `liveness` field, labeled `record` with the check date. Why: in the sample every posting's liveness is `your-input`, `determined_by: "assumed, not checked"`, so the liveness gate never closes in the default run. | Proposed addition (future work) | No: needs new code to feed `npm run ats:liveness` output into postings, and live network calls. |
| 104 | 5. **Fit from the student's own rating.** `[TODO: DEFINE]` Replace the constant fit of 0.5 (held constant to isolate the sponsorship signal) with a per-posting rating and a written rubric. | Proposed addition (future work) | Partly: a rubric and per-posting ratings are your-input values that need no new data or code (postings already carry `fit.p`); closing it means writing the rubric and the ratings. |
| 105 | 6. **Duplicate-entity check across the whole CSV.** `[TODO: DEV]` Today the duplicate-evidence note only compares companies matched in the same run. | Proposed addition (future work) | No: needs new code (CSV-wide duplicate scan). |
| 129 | Gate decisions by a named human are not yet logged anywhere. `logs/gate-decisions/` does not exist. `[TODO: APPROVE]` Record the first human clearance of a sample run in a `logs/runs/` entry (template below), with name and date. | Gate, not future work | Yes, without new data or code: a named human runs the existing command, reads the outputs, and writes the logs/runs/ entry with name and date. Per SNICKERDOODLE an APPROVE closes only with a logged gate decision. |

