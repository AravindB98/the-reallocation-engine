Drafted by Claude Code from the saved 2026-10-20 outputs; reviewed by Nishant, 2026-10-20.

# Mode Build worked run — nishant2681-data-analytics-opt-h1b v0.2.0

## Executive summary

This is the checked record of running a job-triage recipe on 2026-10-20. The
recipe sorts data and analytics job postings into apply, network first, or
drop, for an international graduate who needs visa sponsorship and has few
unemployment days left. It is the build-and-run successor to the October
design.

**Why read it.** Every number below is pasted from a saved command output or
checked by hand against its source. Each item says which, and the lines that
are judgments are labeled as judgments.

**What it found.**
- Eight fictional postings at real companies gave **Apply 1 · Consider 4 ·
  Skip 3**, the same counts as October.
- The change that matters: Wayfair, a large sponsor the main dataset misses,
  now has real federal evidence (78 initial-employment approvals in
  FY2022). It is rated "Possible", deliberately no higher, because that data
  has no job titles. Its decision did not change: network first.
- A deliberate attempt to break the rating cap was caught by the tests.
- The posting checker still reads a known-closed job as "uncertain", not
  "expired". That is a real limit.

The recipe reached "runnable on sample data". It has not been run on real
postings.

## Run record

- **Recipe:** `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md`
  v0.2.0, status RUNNABLE-SAMPLE (promoted 2026-10-20). Card:
  `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.card.md`.
- **Run log, gate decisions and promotions:** `logs/runs/2026fa-nishant2681-2.md`.
- **Evidence run:** `runs/2026-10-20-sample-3/`.
- **Saved outputs:** `engine-runs/2026-10-20-*.txt` and
  `mode-build-evidence/2026-10-20-*.txt`.
- **Earlier version:** v0.1.0 is described in `WORKED-RUN.md` and
  `TEST-REPORT.md`, and preserved at the git tag `mode-design-submission`.
- **Paths:** unless given in full, relative to
  `course/2026fa/submissions/nishant2681/`. Local home-directory paths
  are redacted to `~` (none occurred).

## 1. Inputs

| Input | Path | sha256 | Real or fictional |
|---|---|---|---|
| Persona profile | `search/examples/priya-nair/profile.yml` | `3a1f85a6cb0aabb297b728cc3ade90df6bbefb96294bae71c713a6cd43b6c4f6` | **Fictional** persona, Priya Nair (F-1 OPT year 1, 34 of 90 unemployment days used, OPT end 2027-01-31) |
| Jobs | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json` | `c1d01083e3b67aa51687af2b67ee676f3077fbdb72bb72498202e08121e92d45` | **Fictional** postings (example.com URLs, typed fit and liveness) at real company names |
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` | **Real** repo data (30,369 companies) |
| USCIS FY2022 extract | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv` | `886a4d2f974906a07706b194afa8bd43bf05f4065a5fd5dfb312693e8b315b65` | **Real**: 4 rows cut from the USCIS H-1B Employer Data Hub FY2022 export (provenance: `fixtures/uscis-fy2022.extract.provenance.md`) |
| Scorer | `scripts/score/role-scorer.mjs` | `8655e182c3c2256c176f530f1a467b0dfa9fc99f3b13c2311a4b63eeae3933d2` | Existing engine code, run unchanged |

The profile, jobs, CSV and scorer hashes are identical to October's sample-2
(`logs/runs/2026fa-nishant2681-1.md`). Only the USCIS extract is new.

## 2. Commands and real output

### 2a. The sample run (v0.2.0)

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --uscis   scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv \
  --today   2026-10-20 \
  --run-id  2026-10-20-sample-3 \
  --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-20-sample-3
```
```
OK: 8 roles -> Apply 1 / Consider 4 / Skip 3
  outputs in course/2026fa/submissions/nishant2681/runs/2026-10-20-sample-3
exit: 0
```

The scorer arithmetic, pasted from `runs/2026-10-20-sample-3/report.md`:
```
- `affinity-data-analyst`: (0.9·0.35 + 0.8·0.3) × 1 × 1 = 0.555 → Apply (composite 0.555 ≥ 0.3, gates healthy)
- `adeptid-data-scientist`: (0.6·0.35 + 0.75·0.3) × 1 × 0.9333333333333333 = 0.406 → Consider (above threshold (0.406) but one soft spot: sponsorship tier "Likely")
- `deloitte-consulting-analyst`: (0.3·0.35 + 0.7·0.3) × 1 × 1 = 0.315 → Consider (above threshold (0.315) but one soft spot: sponsorship tier "Possible")
- `wayfair-data-analyst`: (0.3·0.35 + 0.85·0.3) × 1 × 1 = 0.360 → Consider (above threshold (0.360) but one soft spot: sponsorship tier "Possible")
- `0xcord-data-engineer`: (0.5·0.3) × 1 × 1 = 0.150 → Skip (composite 0.150 < 0.2 — time is better spent elsewhere)
- `affinity-data-scientist-expired`: (0.9·0.35 + 0.8·0.3) × 0 × 1 = 0.000 → Skip (gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes))
- `adeptid-data-analyst-uncertain`: (0.6·0.35 + 0.8·0.3) × 0.5 × 1 = 0.225 → Consider (composite 0.225 in the Consider band [0.2, 0.3))
- `affinity-analytics-engineer-nolag`: (0.9·0.35 + 0.9·0.3) × 1 × 0 = 0.000 → Skip (gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes))
```

The Wayfair row of the report's Roles table:
```
| Wayfair — Data Analyst (USCIS FY2022: WAYFAIR LLC) | Possible p=0.3 [record: USCIS FY2022; capped at Possible, no job titles]; initial approvals 78, initial denials 2 [record] | — (no CSV row) [record; context only, not scored] | 0.85 [your-input] | active → 1.0 [your-input (fixture); no saved check output] | 1.000 [your-input]; lag 3 wk, start 2026-11-10, deadline 2026-12-15 | 0.360 [scorer output] | **Consider** [scorer output] | Network into the company first (3-hour block) |
```

The audit, `runs/2026-10-20-sample-3/2026-10-20-sample-3-audit.md`, counts:
```
| Roles in | 8 |
| Roles scored | 8 |
| Matched to a CSV row | 7 |
| No CSV row | 1 |
| No CSV row, matched in USCIS FY2022 | 1 |
| USCIS FY2022 match with 0 initial approvals (Unknown) | 0 |
| No match in either source (Unknown) | 0 |
| Matched, but no H-1B record (Unknown) | 1 |
| Multi-match (would have stopped the run) | 0 |
| Unknown tier, total | 1 |
| Liveness-gated (factor <= 0.05) | 1 |
| Timeline-gated (factor <= 0.05) | 1 |
| Tier Proven | 3 |
| Tier Likely | 2 |
| Tier Possible | 2 |
| Tier Unknown | 1 |
| Decision Apply | 1 |
| Decision Consider | 4 |
| Decision Skip | 3 |
```

**Compared with October's sample-2:**
- Wayfair went from `Unknown (no-csv-match)`, composite 0.255, "Network,
  don't apply yet", to Possible p 0.3, composite 0.360, "Network into the
  company first". Its decision (Consider) is unchanged.
- The deadline moved from 2026-11-27 to 2026-12-15, because `--today` moved
  18 days.
- Every other role's tier, timeline factor, composite and decision is
  unchanged.

### 2b. `npm run ats:scan -- --dry-run` (exit 1)

Saved in `engine-runs/2026-10-20-ats-scan-dry-run.txt`:
```

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
```
Exit 1. Not run further: onboarding would write private files.

### 2c. `npm run ats:liveness` on October's three URLs

`engine-runs/2026-10-20-liveness-1-touchcare.txt` (exit 0):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/touchcare/jobs/4393220009

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/touchcare/jobs/4393220009

Results: 1 active  0 expired  0 uncertain
```

`engine-runs/2026-10-20-liveness-2-closed.txt` (closed control, exit 1):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://talent.swayvc.com/companies/affinity/jobs/86140979-data-analyst

Checking 1 URL(s)...

⚠️ uncertain  https://talent.swayvc.com/companies/affinity/jobs/86140979-data-analyst
           navigation error: page.goto: Download is starting

Results: 0 active  0 expired  1 uncertain
```

`engine-runs/2026-10-20-liveness-3-removed.txt` (removed control, exit 1):
```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/touchcare/jobs/1000000001

Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/touchcare/jobs/1000000001
           redirect to https://job-boards.greenhouse.io/touchcare?error=true

Results: 0 active  1 expired  0 uncertain
```

All three match October. The only live posting (TouchCare) has not expired.

### 2d. Scorer smoke test (exit 0)

`engine-runs/2026-10-20-score-smoke.txt`; the scorer's own files are in
`engine-runs/2026-10-20-score-smoke/`:
```

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/nishant2681/engine-runs/2026-10-20-score-smoke

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course\2026fa\submissions\nishant2681\engine-runs\2026-10-20-score-smoke\role-scores.json  +  course\2026fa\submissions\nishant2681\engine-runs\2026-10-20-score-smoke\role-scores.md
```

### 2e. The 58 tests (exit 0)

`python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests`,
saved in `mode-build-evidence/2026-10-20-tests.txt`:
```
..........................................................
----------------------------------------------------------------------
Ran 58 tests in 1.343s

OK
```

### 2f. `npm run verify` (exit 0)

`mode-build-evidence/2026-10-20-verify.txt`:
```

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 178 files (89 md · 46 py · 30 js · 6 json · 3 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

### 2g. `npm run doctor` (exit 0)

`mode-build-evidence/2026-10-20-doctor.txt`:
```

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v22.17.1
  ✓ python3    Python 3.12.10

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
```

Doctor's recipe dashboard reads only top-level `recipes/`, so it does not
count this recipe (in `recipes/cases/2026fa/`). That recipe's open-TODO count
was checked separately: `grep -c '\[TODO'` → 0.

## 3. Verified vs inferred (sample-3)

Labels: **record** comes from a public dataset. **your-input** is set by
Nishant, and **your-input (fixture)** is typed into the fictional jobs file.
**scorer output** is computed by the existing scorer. **inference** is a
judgment by Nishant or Claude, not established by any record.

| # | Item | Value in sample-3 | Label | How it is established |
|---|---|---|---|---|
| 1 | The postings themselves (titles, URLs, fit, lags) | 8 roles at 5 companies | your-input (fixture) | `jobs.sample.json`; fictional |
| 2 | "Affinity Solutions" → `AFFINITY SOLUTIONS INC`; "Adept ID" → `ADEPT ID INC`; "0xCord" → `0XCORD INC` | one CSV row each | record | suffix-stripping exact match (`sponsorship.find_company`) |
| 3 | "Deloitte" → `DELOITTE CONSULTING LLP` | chosen out of 7 entities | your-input | `csv_company_name` in the fixture; G1 signed by Nishant |
| 4 | Wayfair has no 80 Days row | 0 rows | record | `extract_uscis.py`: "missing from the 80 Days CSV: Wayfair" |
| 5 | Wayfair → `WAYFAIR LLC`, Tax ID 8108, 4 MA rows | exact normalized match | record (USCIS FY2022) | the extract; G1 signed |
| 6 | Affinity: 40 approvals, 0 denials, rate 100, "DATA SCIENTIST" etc. in top titles | Proven | record | CSV fields |
| 7 | Adept ID: 4 approvals, "Research Data Scientist" | Likely | record | CSV fields |
| 8 | Deloitte Consulting: 8,810 approvals, rate 97.5, no target title | Possible | record | CSV fields |
| 9 | 0xCord: H-1B fields blank | Unknown (`no-h1b-record`) | record | CSV fields |
| 10 | Wayfair: 78 initial approvals, 2 initial denials (540 continuing, context only) | Possible | record (USCIS FY2022) | the extract; hand check §4a |
| 11 | Tier thresholds (≥ 10 approvals and ≥ 90 rate for Proven, ≥ 1 for Likely) and p 0.9 / 0.6 / 0.3 | — | your-input [VERIFY] | recipe "Tier reasoning"; not measured probabilities |
| 12 | USCIS cap at Possible, p 0.3; exact match only; grouping by Tax ID; initial approvals only; FY2022 | — | your-input | Nishant's rules, 2026-10-20 (recipe "USCIS fallback rules") |
| 13 | Funding amounts, stages, dates | shown, not scored | record (context) | CSV `latest_funding_*` |
| 14 | Funding weight in sponsorship p | 0 | your-input | recipe addition 7 (DEFINE) |
| 15 | Fit values (0.5–0.9) | per role | your-input (fixture) | typed |
| 16 | Liveness labels in the run: 6 active, 1 expired, 1 uncertain; factors 1.0 / 0.0 / 0.5 | per role | your-input (fixture) (labels); your-input [VERIFY] (factor mapping) | no `evidence_path`, so not `record`; G3 signed |
| 17 | Real liveness checks today: TouchCare active, closed control uncertain, removed control expired | separate from the run | record | `engine-runs/2026-10-20-liveness-*.txt` |
| 18 | Days used 34, ceiling 90, OPT end 2027-01-31 | — | your-input (fictional persona) | `profile.yml:21-23` |
| 19 | Deadline 2026-12-15, full-credit cutoff 2026-11-15, expected starts, factors 1.000 / 0.933 / 0.000 | per role | arithmetic on your-input | hand check §4b; G4 signed |
| 20 | 12-week default lag; 30-day full-credit margin | — | your-input [VERIFY] | Ch.10 Role C example; recipe |
| 21 | Weights 0.35 / 0.30, role-quality weight 0, threshold 0.3, Consider band 0.2 | — | scorer configuration | `role-scorer.mjs:34-37`; unchanged |
| 22 | Composites and Apply / Consider / Skip | per role | scorer output | arithmetic in §2a |
| 23 | Next-action text | per role | derived from scorer decision (`STRONG_FIT` 0.7 is your-input) | `run_sample.next_action` |
| 24 | Wayfair sponsors **data** titles | not used in scoring | inference (Nishant's outside check) | not in any record here; USCIS has no titles |
| 25 | FY2023 export is a partial year | led to choosing FY2022 | **inference** | last modified 2023-05-31, before FY2023 ended; about half FY2022's size; not stated by USCIS |
| 26 | "Initial" ≈ new hires such as a student moving from OPT | basis of the approvals rule | **inference** | USCIS does not define which petition types are in Initial |
| 27 | Deloitte Consulting is under-rated by title matching | not acted on | inference | generic top titles ("Manager", "Senior Consultant") |

## 4. Verification

### 4a. Wayfair's 78, by hand and against the full file

The extract (`fixtures/uscis-fy2022.extract.csv`):
```
Fiscal Year,Employer,Initial Approval,Initial Denial,Continuing Approval,Continuing Denial,NAICS,Tax ID,State,City,ZIP
2022,WAYFAIR LLC,1,0,0,0,33,8108,MA,BOSTON,02116
2022,WAYFAIR LLC,77,2,537,10,45,8108,MA,BOSTON,02116
2022,WAYFAIR LLC,0,0,1,0,45,8108,MA,DALTON,01226
2022,WAYFAIR LLC,0,0,2,0,45,8108,MA,BOSTON,02216
```
- Initial Approval: 1 + 77 + 0 + 0 = **78**.
- Initial Denial: 0 + 2 + 0 + 0 = **2**.
- Both match the report.

Cross-check against the full downloaded file
(`mode-build-evidence/2026-10-20-uscis-fullfile-wayfair.txt`):
```
57807:2022,"WAYFAIR LLC",1,0,0,0,33,8108,MA,BOSTON,02116
57808:2022,"WAYFAIR LLC",77,2,537,10,45,8108,MA,BOSTON,02116
57809:2022,"WAYFAIR LLC",0,0,1,0,45,8108,MA,DALTON,01226
57810:2022,"WAYFAIR LLC",0,0,2,0,45,8108,MA,BOSTON,02216
692cc11c7d48739d5ff4363a6ba7cbe0c422334c417dd88813aa1ff596d5f879 *data/80-days-to-stay/scratch/uscis-fy2022/h1b_datahubexport-2022.csv
886a4d2f974906a07706b194afa8bd43bf05f4065a5fd5dfb312693e8b315b65 *scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv
```
- The full file holds the same 4 rows, with the same values.
- The only difference is that the full file quotes the name; the extract's
  CSV writer does not.
- Both sha256 values match the provenance note and the run log.

### 4b. Priya's deadline, by hand

From `search/examples/priya-nair/profile.yml:21-23`:
- **Days left:** 90 − 34 = **56**.
- **2026-10-20 + 56 days:** 11 days to 2026-10-31, then 30 in November
  (41 so far), then 15 in December (56) = **2026-12-15**.
- **Deadline:** min(2026-12-15, OPT end 2027-01-31) = **2026-12-15**.
- **Full-credit cutoff:** 2026-12-15 − 30 days = **2026-11-15**.

The timeline factors follow from those dates:
- **3-week lag:** expected start 2026-11-10, on or before 2026-11-15 →
  **1.000**.
- **4-week lag (Adept ID Data Scientist):** start 2026-11-17, (2026-12-15 −
  2026-11-17) / 30 = 28 / 30 = **0.933**.
- **12-week default:** start 2027-01-12, after 2026-12-15 → **0**.

All of these match the report.

### 4c. Re-running the tests

The 58 tests passed after every change on 2026-10-20 and again when this
document was written (§2e). The attestation's break attempts were re-run on
their own with `-v` (`mode-build-evidence/2026-10-20-attestation-tests.txt`):
```
test_cap_check_catches_mutant (test_uscis.TestBreakAttempt.test_cap_check_catches_mutant) ... ok
test_near_name_does_not_match (test_uscis.TestFindUscisEmployer.test_near_name_does_not_match) ... ok
test_two_tax_ids_go_to_the_gate (test_uscis.TestFindUscisEmployer.test_two_tax_ids_go_to_the_gate) ... ok
test_capped_at_possible (test_uscis.TestAssignUscisTier.test_capped_at_possible) ... ok
test_missing_uscis_file (test_run_sample.TestMissingInputs.test_missing_uscis_file) ... ok
test_uscis_role_capped (test_run_sample.TestSampleRun.test_uscis_role_capped) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.361s

OK
```
What each break attempt actually printed
(`mode-build-evidence/2026-10-20-break-attempts.txt`):
```
$ (cap_violations on real vs BROKEN mutant)
real  : []
mutant: ['10 approvals -> Proven p=0.9', '5000 approvals -> Proven p=0.9']
two Tax IDs -> "Acme" matches 2 USCIS FY2022 rows:
  - ACME LLC (Tax ID 1111)
  - ACME INC (Tax ID 2222)
Set uscis_tax_id to the Tax ID of the one you mean.
near-name Wayfair vs WAYFAIR HOLDINGS LLC -> None

$ run_sample.py ... --uscis does/not/exist.csv ... (out-dir in scratch)
STOP: 1 problem(s); nothing was written.
  [inputs] [Errno 2] No such file or directory: 'does/not/exist.csv'
exit: 2
ls: cannot access '/tmp/break-missing-uscis': No such file or directory
```
The "Acme" rows are made-up test rows, not records. In the two-Tax-ID
message, "rows" means employer groups (one per Tax ID), not raw file rows.

## 5. Reflection

*Draft for Nishant to edit.*

**What went well.**
- Wayfair now has real evidence. In October it could only be "Unknown". Now
  a federal record shows 78 initial-employment approvals in FY2022, and
  the report says exactly where that number comes from.
- The safety rules held when tested on purpose: the rating cap and the
  exact-name matching.
  - A copy of the rule with the cap removed was caught by the tests.
  - A near-miss name ("Wayfair" vs "WAYFAIR HOLDINGS LLC") did not match.
  - Two employers sharing a name stopped the run for a person to choose.
- Checking the data before trusting it paid off:
  - The FY2023 file turned out to be probably a partial year, and it would
    have shown Wayfair with 0 initial approvals.
  - The column I planned to count did not exist.

  Both were caught before any number was used.

**What the mode got wrong or missed.**
- **Wayfair's decision did not change.** It was Consider (network first)
  before and after. The new evidence raised its score from 0.255 to 0.360,
  but not enough to reach Apply. The cap means a USCIS-only employer can
  never be rated above Possible, however many approvals it has.
- **The liveness gate reads a closed posting as "uncertain".** It did so
  again today. That scores 0.5, so a dead posting is penalized but not
  dropped, and a person still has to open every uncertain link.
- **Title matching under-rates Deloitte.** Deloitte Consulting has 8,810
  approvals but rates only Possible, because none of its top sponsored
  titles contains a target title. The CSV row's `top_job_titles_sponsored`
  is, exactly: `['Manager', 'Senior Consultant', 'Senior Solution
  Specialist', 'Consultant', 'Solution Specialist', 'Senior Consultant',
  'Manager', 'Consultant', 'Senior Solution Specialist', 'Solution
  Specialist']`. My belief, not checked against data: consulting firms often
  hire data analysts under generic titles like 'Consultant', which title
  matching would miss.
- **`ats:scan` needs onboarding.** It stops at "portals.yml not found", so
  the mode cannot discover postings on its own. It only triages a list it is
  given.

**Next steps.**
1. **A RUNNABLE-LIVE run on real postings.** Save each posting's
   `ats:liveness` output and point `evidence_path` at it, so liveness is
   labeled `record`, not typed. Clear every gate live.
2. **Title-level sponsorship evidence from the DOL OFLC LCA disclosure
   files.** They carry `JOB_TITLE` and `SOC_CODE`. Take only the employer,
   title, SOC and status columns, because those files also contain contact
   names and emails.
3. **Resolve the duplicate Deloitte rows.** Two Deloitte Touche Tohmatsu
   entities carry identical H-1B fields in the CSV. Find out why before
   trusting either.

## Attestation
- Recipe: nishant2681-data-analytics-opt-h1b v0.2.0
- By: Nishant U · 2026-10-20

### Tested
| Ran | Saw | Expected |
|---|---|---|
| Sample run 3: `run_sample.py … --uscis …extract.csv --today 2026-10-20 --run-id 2026-10-20-sample-3` | `OK: 8 roles -> Apply 1 / Consider 4 / Skip 3`, `exit: 0`; audit: 8 in, 8 scored, 1 matched in USCIS FY2022, 0 multi-match (§2a) | Exit 0, all roles scored, Wayfair from USCIS and no higher than Possible |
| 58 offline tests | `Ran 58 tests in 1.343s` · `OK` (`mode-build-evidence/2026-10-20-tests.txt`) | All pass |
| `npm run verify` | `conformance: 178 files … ✓ all conform`, `✓ manifest check passed (3 warnings)`, exit 0 | Pass; the same 3 known warnings |
| `npm run doctor` | `✓ no private/PII paths are tracked`, `environment: ✓ runnable`, exit 0 | Pass |
| `npm run score -- data/examples/ch11-roles.json --out-dir …` (G5 smoke test) | `✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)`, exit 0 | Apply 2 · Consider 1 · Skip 2 (the book's example) |
| Hand check: Wayfair's initial approvals from the extract | 1 + 77 + 0 + 0 = 78; denials 0 + 2 + 0 + 0 = 2 (§4a) | 78 and 2, as in the report |
| Cross-check: the same rows in the full USCIS file | lines 57807–57810, identical values; sha256 `692cc11c…5f879` (full) and `886a4d2f…15b65` (extract) | Identical rows; hashes as in the provenance note |
| Hand check: Priya's deadline | 90 − 34 = 56; 2026-10-20 + 56 = 2026-12-15; min with OPT end 2027-01-31 = 2026-12-15 (§4b) | 2026-12-15, as in the report |
| **Break attempt:** the `fixtures/BROKEN-uscis-no-cap.py` mutant (cap removed) through `cap_violations` | real: `[]`; mutant: `['10 approvals -> Proven p=0.9', '5000 approvals -> Proven p=0.9']`; `test_cap_check_catches_mutant ... ok` | The real rule has no violations; the mutant is caught |
| **Break attempt:** `--uscis does/not/exist.csv` | `STOP: 1 problem(s); nothing was written.` … `No such file or directory: 'does/not/exist.csv'`, `exit: 2`, no out-dir created | Stop, name the path, write nothing |
| **Break attempt:** near-name, "Wayfair" vs `WAYFAIR HOLDINGS LLC` (and `WAYFAIRS INC`) | `None` (no match); `test_near_name_does_not_match ... ok` | No match: no prefix or fuzzy matching |
| **Break attempt:** one name with two Tax IDs ("Acme": 1111, 2222) | `"Acme" matches 2 USCIS FY2022 rows: - ACME LLC (Tax ID 1111) - ACME INC (Tax ID 2222) Set uscis_tax_id …`; `test_two_tax_ids_go_to_the_gate ... ok` | Stop and list both for a human; resolved only by `uscis_tax_id` |
| A USCIS-only employer with 5,000 initial approvals | `Possible`, p 0.3, dataset `USCIS FY2022` (`test_capped_at_possible ... ok`) | Possible, never Likely or Proven |
| `npm run ats:liveness` on the live TouchCare posting | `✅ active`, exit 0 | active |
| **Break attempt:** `npm run ats:liveness` on the known-closed control | `⚠️ uncertain … navigation error: page.goto: Download is starting`, exit 1 | **expired**. Not met: the checker cannot read the page, and the recipe scores uncertain as 0.5 |
| `npm run ats:liveness` on the removed control | `❌ expired`, redirect to `?error=true`, exit 1 | expired |
| `npm run ats:scan -- --dry-run` | `Error: portals.yml not found. Run onboarding first.`, exit 1 | Fails without onboarding (known); not run further |

### Did not test
- **Live postings in the sample.** All 8 are fictional; their liveness labels
  are typed (`your-input (fixture)`), not linked to saved checker output.
- **RUNNABLE-LIVE.** No run on real postings with every gate cleared live.
- **Why the two Deloitte Touche Tohmatsu rows in the CSV are identical.**
  `…SERVICES INC` and `…SERVICES LLC` carry the same H-1B fields (242
  approvals, 2 denials, rate 99.18). Whether that is one record duplicated
  by the join is unknown.
- **Whether title matching under-rates consulting firms.** Deloitte
  Consulting has 8,810 approvals but rates Possible (no title match). Only
  one firm was looked at.
- **The three timeline [VERIFY] assumptions:**
  - whether Priya is currently employed (the clock is assumed to run from
    today);
  - whether 90 is the right ceiling to read from the profile, when the
    profile also says `stem_eligible: true`, and STEM OPT would raise the
    ceiling to 150 (Ch.10);
  - the profile's `buffer_target: 20` versus the fixed 30-day full-credit
    margin.
- **Which petition types USCIS puts in "Initial".** USCIS's guide does not
  define the split; the approvals rule rests on an inference.
- **Current-year sponsorship.** FY2022 is the newest full year found. Whether
  Wayfair sponsors now was not tested.
- **`ats:scan` beyond the dry-run.** Onboarding was not run, because it would
  write private files.
- **Linux or macOS.** Every run was on Windows with Git Bash.

### Broke during testing, fixed
- **The FY2023 file was probably a partial year.** It was last modified
  2023-05-31, before FY2023 ended, and is about half FY2022's size. In it,
  Wayfair had 0 initial approvals. Switched to FY2022, a full year, by
  Nishant's choice. The FY2023 file stays untracked in the scratch folder.
- **The planned columns did not exist.** The rule was to count New
  Employment + Change of Employer. Both archive files have only Initial and
  Continuing totals. Changed to Initial Approval only, by Nishant's choice
  (recipe "USCIS fallback rules"); Continuing is kept as context.
- **Plain grep found no Wayfair rows in the full file.** The full file
  quotes the name (`2022,"WAYFAIR LLC",…`), so searching for `2022,WAYFAIR
  LLC,` returned 0. Searching for `WAYFAIR` found the 4 rows; the CSV reader
  was never affected.
- **An inaccurate reason was corrected before recording.** Nishant's first
  wording called initial approvals "USCIS's first-time decisions on an
  employer's petitions". USCIS's guide says every Data Hub count, Continuing
  included, reflects its first decision. The corrected sentence is the one
  in the recipe (`logs/runs/2026fa-nishant2681-2.md`).
