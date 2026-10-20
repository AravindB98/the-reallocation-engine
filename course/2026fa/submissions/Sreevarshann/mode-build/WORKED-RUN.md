# Worked run — Data/ML Engineer sponsor and occupation-code mode, 2026-10-20

## Executive summary

**What this is.** The record of one real run of a job-search check built for an international master's graduate on F-1 OPT who is applying for Data Engineer and Machine Learning Engineer roles. It ran on 20 October 2026 against six real job postings, using the project's own sponsorship, occupation, and funding data and its existing posting-liveness tool and scorer.

**Why read it.** Every number below comes from a saved terminal output, quoted as it was printed. The document separates what the data and scripts established from what was a judgment, shows five deliberate attempts to break the check, and lists what was not tested.

**What it found.** Three postings came out Apply, one Consider, and one Skip (a deliberately dead link). One company was blocked because it is not in the sponsorship data, and its posting was never checked by a person. The check could not answer the question it was built around — which occupation code each employer files data and ML roles under — because the project's sponsorship data has no occupation code at all; that stays a proposed addition. Four of the five break attempts behaved exactly as expected. The fifth stopped the run safely but for a different reason than expected.

## Run record

- Mode: `recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.md` v0.1.0, status DRAFT
- Code: `scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/` (`run.py`, `lookup.py`)
- Commits: `1cdcd21` (script and tests), `0f27b77` (live run), `64803cf` (recipe, card, run log)
- All saved outputs: `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/`; absolute paths replaced by `<repo>`

## 1. Inputs

**Persona (fictional):** `search/examples/priya-nair/profile.yml` — F-1 OPT (post-completion, year 1), needs sponsorship, 34 unemployment days used, 20-day buffer. Target roles in the persona: AI/ML Engineer, Data Engineer. No real personal data was used anywhere in this run.

**Targets:** `course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv`

| # | Company | Role | Why it is on the list |
|---|---|---|---|
| r1 | Reddit | Machine Learning Engineer | in the sponsor data, proven tier |
| r2 | Discord | Senior Data Engineer | in the sponsor data, proven tier |
| r3 | Sigma Computing | Data Engineer | in the sponsor data, proven tier |
| r4 | Formlabs | Data Engineer | in the sponsor data, likely tier (rate 87.5% < 90%) |
| r5 | Brex | Data Engineer | deliberately **not** in the sponsor data |
| r6 | Twilio | constructed job ID | deliberately expected-expired URL |

The four in-dataset companies and their postings were found through the public Greenhouse job-board API (read-only); the filtered discovery output is in `course/2026fa/submissions/Sreevarshann/mode-build/runs/target-discovery-2026-10-20.txt`.

**Human posting check:** `course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv`

```text
date,url,status,checked_by
2026-10-20,https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437,active,Sreevarshann
```

**Data files read:**

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — sponsorship by company (record)
- `data/bls/compact/soc_occupation_compact.csv` — national occupation data (record)
- `data/sec/form-d/processed/sample/*.sample.json` — 200-company Form D sample (sample)

## 2. Commands and real output

### 2.1 Liveness — first attempt (invalid)

zsh passed all six URLs as a single argument, so the tool checked one long string and got a 404. Kept as evidence; not used.

```text
$ npm run ats:liveness -- https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/discord/jobs/8485884002 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437 https://www.brex.com/careers/8366850002?gh_jid=8366850002 https://job-boards.greenhouse.io/twilio/jobs/1000000

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/discord/jobs/8485884002 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437 https://www.brex.com/careers/8366850002?gh_jid=8366850002 https://job-boards.greenhouse.io/twilio/jobs/1000000

Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/discord/jobs/8485884002 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437 https://www.brex.com/careers/8366850002?gh_jid=8366850002 https://job-boards.greenhouse.io/twilio/jobs/1000000
           HTTP 404

Results: 0 active  1 expired  0 uncertain
exit: 1
```

### 2.2 Liveness — the run used

```text
$ npm run ats:liveness -- https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/discord/jobs/8485884002 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437 https://www.brex.com/careers/8366850002?gh_jid=8366850002 https://job-boards.greenhouse.io/twilio/jobs/1000000

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/discord/jobs/8485884002 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437 https://www.brex.com/careers/8366850002?gh_jid=8366850002 https://job-boards.greenhouse.io/twilio/jobs/1000000

Checking 6 URL(s)...

✅ active     https://job-boards.greenhouse.io/reddit/jobs/7131932
✅ active     https://job-boards.greenhouse.io/discord/jobs/8485884002
✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003
⚠️ uncertain  https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437
           content present but no visible apply control found
⚠️ uncertain  https://www.brex.com/careers/8366850002?gh_jid=8366850002
           content present but no visible apply control found
❌ expired    https://job-boards.greenhouse.io/twilio/jobs/1000000
           redirect to https://job-boards.greenhouse.io/twilio?error=true

Results: 3 active  1 expired  2 uncertain
exit: 1
```

### 2.3 Evidence pass (`run.py`)

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv --persona search/examples/priya-nair/profile.yml --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20 --overwrite
de-ml-soc-sponsor: 6 targets → scoreable 5 · held 0 · blocked 1 · skip_gated 0 · stopped 0
timeline gate: remaining 56 vs buffer 20 → factor 1
wrote course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/evidence.json, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/report.md, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/roles.json, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/profile.json
next: npm run score -- course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/roles.json --profile course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/profile.json --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20
exit: 0
```

### 2.4 Scorer (existing CLI)

```text
$ npm run score -- course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/roles.json --profile course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/profile.json --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/roles.json --profile course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/profile.json --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20

✓ scored 5 roles → Apply 3 · Consider 1 · Skip 1 (skip 20%)
  course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/role-scores.json  +  course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/role-scores.md
exit: 0
```

### 2.5 Tests

```text
$ python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests
...................................................
----------------------------------------------------------------------
Ran 51 tests in 0.072s

OK
exit: 0
```

### 2.6 `npm run verify`

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 167 files (88 md · 41 py · 30 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit: 0
```

### 2.7 `npm run doctor`

```text
$ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.13.0
  ✓ python3    Python 3.13.9

ENVIRONMENT (optional — features degrade without these)
  ✓ pandoc     pandoc 3.8
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
exit: 0
```

`doctor` reads only the top level of `recipes/`, so it does not check this mode's `todos_open`. That was checked separately with doctor's own count:

```text
$ node <scratchpad>/check_recipe.mjs recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.md recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.card.md logs/runs/2026fa-Sreevarshann-2.md
OK  recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.md: todos_open 7 · body [TODO 7
    path not found: search/resume.json
OK  recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.card.md: todos_open (no frontmatter) · body [TODO 0
OK  logs/runs/2026fa-Sreevarshann-2.md: todos_open (no frontmatter) · body [TODO 0
exit: 0
```

### 2.8 `node scripts/pii-scan.mjs --diff main` (after commit `64803cf`)

```text
$ node scripts/pii-scan.mjs --diff main
pii-scan: clean ✓
exit: 0
```

The earlier failing run of the same scan (before the fix described under the attestation) is kept as `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/pii-scan-diff-main-FAILED-before-fix.txt`.

### 2.9 Report and scores

The full human report is `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/report.md`. The scorer's report:

```text
# Role Scorer report — 2026-10-20

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 5 roles → Apply 3 · Consider 1 · Skip 1. **Skip rate 20%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Reddit — Machine Learning Engineer | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record (tier rule and tier->p map: user definition)]; fit 0.5·0.3 [your-input (neutral constant)] × liveness 1[record]×timeline 1[your-input (persona dates, user's formula)] |
| Discord — Senior Data Engineer | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record (tier rule and tier->p map: user definition)]; fit 0.5·0.3 [your-input (neutral constant)] × liveness 1[record]×timeline 1[your-input (persona dates, user's formula)] |
| Sigma Computing — Data Engineer | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record (tier rule and tier->p map: user definition)]; fit 0.5·0.3 [your-input (neutral constant)] × liveness 1[record]×timeline 1[your-input (persona dates, user's formula)] |
| Formlabs — Data Engineer | 0.395 | **Consider** | above threshold (0.395) but one soft spot: sponsorship tier "likely" | sponsorship 0.7·0.35 [record (tier rule and tier->p map: user definition)]; fit 0.5·0.3 [your-input (neutral constant)] × liveness 1[your-input]×timeline 1[your-input (persona dates, user's formula)] |
| Twilio — Expected-expired test URL (constructed job ID) | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record (tier rule and tier->p map: user definition)]; fit 0.5·0.3 [your-input (neutral constant)] × liveness 0[record]×timeline 1[your-input (persona dates, user's formula)] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
```

## 3. Verified vs inferred

One row per claim in `report.md`. "Verified" means a data file or script established it; "Inferred" means it is a judgment. Generated from `evidence.json`.

| Claim | Established by (command/file) | Verified or Inferred |
|---|---|---|
| r1 Reddit: status **scoreable** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r1 Reddit: matched dataset row `REDDIT INC` | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified |
| r1 Reddit: approvals 408.0 / denials 12.0 / rate 97.1% | `mapped_student_employment_targets_v3.csv` | Verified |
| r1 Reddit: sponsor tier proven | `mapped_student_employment_targets_v3.csv` counts + the user's tier rule | Verified (rule is a user definition) |
| r1 Reddit: company-wide median salary 220,000 | `mapped_student_employment_targets_v3.csv` | Verified (company-wide, not this role) |
| r1 Reddit: latest funding 2021-08-11 Series D+ | `mapped_student_employment_targets_v3.csv` | Verified as recorded; freshness not verified |
| r1 Reddit: sponsored title "Software Engineer, Machine Learning" is on record | `mapped_student_employment_targets_v3.csv` | Verified |
| r1 Reddit: that title is DE/ML work (keywords machine learning) | keyword list (user definition) | Inferred |
| r1 Reddit: candidate SOC 15-1252, 15-2051 | title-to-SOC mapping (user definition) | Inferred |
| r1 Reddit: per-employer SOC | no data source | Not established (proposed) |
| r1 Reddit: liveness factor 1 (active) | `ats:liveness` output | Verified (tool result) |
| r1 Reddit: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r1 Reddit: scorer Apply at 0.465 | `npm run score` → `role-scores.json` | Verified (computation; fit is a neutral constant) |
| r2 Discord: status **scoreable** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r2 Discord: matched dataset row `DISCORD INC` | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified |
| r2 Discord: approvals 122.0 / denials 0.0 / rate 100.0% | `mapped_student_employment_targets_v3.csv` | Verified |
| r2 Discord: sponsor tier proven | `mapped_student_employment_targets_v3.csv` counts + the user's tier rule | Verified (rule is a user definition) |
| r2 Discord: company-wide median salary 218,000 | `mapped_student_employment_targets_v3.csv` | Verified (company-wide, not this role) |
| r2 Discord: latest funding 2023-01-17 Series B | `mapped_student_employment_targets_v3.csv` | Verified as recorded; freshness not verified |
| r2 Discord: sponsored title "Software Engineer, Machine Learning" is on record | `mapped_student_employment_targets_v3.csv` | Verified |
| r2 Discord: that title is DE/ML work (keywords machine learning) | keyword list (user definition) | Inferred |
| r2 Discord: candidate SOC 15-1252, 15-2051 | title-to-SOC mapping (user definition) | Inferred |
| r2 Discord: per-employer SOC | no data source | Not established (proposed) |
| r2 Discord: liveness factor 1 (active) | `ats:liveness` output | Verified (tool result) |
| r2 Discord: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r2 Discord: scorer Apply at 0.465 | `npm run score` → `role-scores.json` | Verified (computation; fit is a neutral constant) |
| r3 Sigma Computing: status **scoreable** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r3 Sigma Computing: matched dataset row `SIGMA COMPUTING INC` | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified |
| r3 Sigma Computing: approvals 136.0 / denials 0.0 / rate 100.0% | `mapped_student_employment_targets_v3.csv` | Verified |
| r3 Sigma Computing: sponsor tier proven | `mapped_student_employment_targets_v3.csv` counts + the user's tier rule | Verified (rule is a user definition) |
| r3 Sigma Computing: company-wide median salary 150,000 | `mapped_student_employment_targets_v3.csv` | Verified (company-wide, not this role) |
| r3 Sigma Computing: latest funding 2024-04-05 Series D+ | `mapped_student_employment_targets_v3.csv` | Verified as recorded; freshness not verified |
| r3 Sigma Computing: sponsored title "Senior Analytics Engineer" is on record | `mapped_student_employment_targets_v3.csv` | Verified |
| r3 Sigma Computing: that title is DE/ML work (keywords analytics engineer) | keyword list (user definition) | Inferred |
| r3 Sigma Computing: candidate SOC 15-1243, 15-1252 | title-to-SOC mapping (user definition) | Inferred |
| r3 Sigma Computing: per-employer SOC | no data source | Not established (proposed) |
| r3 Sigma Computing: liveness factor 1 (active) | `ats:liveness` output | Verified (tool result) |
| r3 Sigma Computing: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r3 Sigma Computing: scorer Apply at 0.465 | `npm run score` → `role-scores.json` | Verified (computation; fit is a neutral constant) |
| r4 Formlabs: status **scoreable** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r4 Formlabs: matched dataset row `FORMLABS INC` | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified |
| r4 Formlabs: approvals 70.0 / denials 10.0 / rate 87.5% | `mapped_student_employment_targets_v3.csv` | Verified |
| r4 Formlabs: sponsor tier likely | `mapped_student_employment_targets_v3.csv` counts + the user's tier rule | Verified (rule is a user definition) |
| r4 Formlabs: company-wide median salary 111,000 | `mapped_student_employment_targets_v3.csv` | Verified (company-wide, not this role) |
| r4 Formlabs: latest funding 2018-07-16 Series A | `mapped_student_employment_targets_v3.csv` | Verified as recorded; freshness not verified |
| r4 Formlabs: no DE/ML keyword in its sponsored titles | `mapped_student_employment_targets_v3.csv` + keyword list | Inferred |
| r4 Formlabs: per-employer SOC | no data source | Not established (proposed) |
| r4 Formlabs: posting live (factor 1) | `ats:liveness` uncertain → human check in `posting-checks.csv` | Verified by a person |
| r4 Formlabs: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r4 Formlabs: scorer Consider at 0.395 | `npm run score` → `role-scores.json` | Verified (computation; fit is a neutral constant) |
| r5 Brex: status **blocked** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r5 Brex: not found in the sponsor table | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified (exact match only) |
| r5 Brex: per-employer SOC | no data source | Not established (proposed) |
| r5 Brex: liveness held | `ats:liveness` said uncertain; no human check | Verified (tool result) |
| r5 Brex: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r6 Twilio: status **scoreable** | `run.py` → `evidence.json` (gates applied by script) | Verified |
| r6 Twilio: matched dataset row `TWILIO INC` | exact normalized-name join on `mapped_student_employment_targets_v3.csv` | Verified |
| r6 Twilio: approvals 802.0 / denials 20.0 / rate 97.6% | `mapped_student_employment_targets_v3.csv` | Verified |
| r6 Twilio: sponsor tier proven | `mapped_student_employment_targets_v3.csv` counts + the user's tier rule | Verified (rule is a user definition) |
| r6 Twilio: company-wide median salary 160,000 | `mapped_student_employment_targets_v3.csv` | Verified (company-wide, not this role) |
| r6 Twilio: latest funding 2021-07-14 Series D+ | `mapped_student_employment_targets_v3.csv` | Verified as recorded; freshness not verified |
| r6 Twilio: sponsored title "Machine Learning Engineer (L2)" is on record | `mapped_student_employment_targets_v3.csv` | Verified |
| r6 Twilio: that title is DE/ML work (keywords machine learning) | keyword list (user definition) | Inferred |
| r6 Twilio: candidate SOC 15-1252, 15-2051 | title-to-SOC mapping (user definition) | Inferred |
| r6 Twilio: per-employer SOC | no data source | Not established (proposed) |
| r6 Twilio: liveness factor 0 (expired) | `ats:liveness` output | Verified (tool result) |
| r6 Twilio: not in the Form D sample | `data/sec/form-d/processed/sample/` | Verified (200-company sample only) |
| r6 Twilio: scorer Skip at 0.000 | `npm run score` → `role-scores.json` | Verified (computation; fit is a neutral constant) |
| Timeline gate open: 56 days remaining vs buffer 20 | persona file + the user's formula | Verified arithmetic on fictional inputs |
| 15-1252.00 Software Developers: national median 133,080, job zone 4, cognitive-pivot 3.8 | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| 15-2051.00 Data Scientists: national median 112,590, job zone 4, cognitive-pivot missing | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| 15-2051.01 Business Intelligence Analysts: national median 112,590, job zone 4, cognitive-pivot 3.9 | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| 15-2051.02 Clinical Data Managers: national median 112,590, job zone 4, cognitive-pivot 3.7 | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| 15-1243.00 Database Architects: national median 135,980, job zone 4, cognitive-pivot 3.9 | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| 15-1243.01 Data Warehousing Specialists: national median 135,980, job zone 4, cognitive-pivot 3.6 | `soc_occupation_compact.csv` | Verified (national, not employer pay) |
| Which SOC applies to each posting | inherited from the title match | Inferred |

## 4. Verification

- **Scorer arithmetic, by hand.** Composite = (sponsorship × 0.35 + fit × 0.30) × liveness × timeline. Proven: 0.9 × 0.35 + 0.5 × 0.30 = 0.315 + 0.150 = **0.465** (Reddit, Discord, Sigma Computing). Likely: 0.7 × 0.35 + 0.5 × 0.30 = 0.245 + 0.150 = **0.395** (Formlabs). Twilio: 0.465 × 0 (liveness) × 1 = **0.000**. All match `role-scores.md`.
- **Re-runs from saved liveness, no network.** After the report changes in `0f27b77`, `run.py` was re-run with `--overwrite` on the same saved liveness output and checks; the counts were unchanged (5 scoreable, 0 held, 1 blocked) and so were the scorer's results (Apply 3, Consider 1, Skip 1).
- **Name normalizer against 200 real names.** The test `test_agrees_with_shipped_formd_normalized_names` checks the mode's normalizer against the stored normalized name of all 200 companies in the shipped Form D samples and asserts the count is exactly 200; it passes (2.5).
- **Human check of an uncertain posting.** The liveness tool marked Formlabs and Brex "uncertain". Sreevarshann opened the Formlabs posting and recorded it active (the row in section 1). Brex was not checked and stays held.
- **Five break attempts on the real command line** — section 5.

My check:

My check:

## 5. Break attempts

All against `run.py` on the real data, with no network. Modified inputs are minimal fictional files in `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/`; the real persona was not edited.

| # | Attempt | Expected | Observed | Match |
|---|---|---|---|---|
| 1 | Company "Samsara" (dataset lists `SAMSARA NETWORKS INC`) | blocked as not found | blocked: not_found; control row "Samsara Networks" blocked: no_sponsorship_record | yes — and the control row shows the dataset has **no** sponsorship figures for Samsara |
| 2 | Persona authorization "F-1 STEM OPT — work authorized (EAD)" | run stops, exit 4 | STOP (7), 6 stopped, no roles.json, exit 4 | yes |
| 3 | Persona with 75 unemployment days used | all roles Skipped as gated | remaining 15 vs buffer 20 → factor 0; 6 skip_gated; exit 3 | yes |
| 4 | Targets row with an empty posting_url | whole run stops | `halt: line 3: empty posting_url`, exit 2, nothing written | yes |
| 5 | `--targets private/targets.csv` | refused as a private path | `halt: input file not found: private/targets.csv`, exit 2, nothing read | **no** — stopped safely, but by the existence check, which runs before the private-path check |

### 5.1 Samsara, plus the control row

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/targets-samsara.csv --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/1-samsara-exact-name
de-ml-soc-sponsor: 2 targets → scoreable 0 · held 0 · blocked 2 · skip_gated 0 · stopped 0
timeline gate: remaining 56 vs buffer 20 → factor 1
wrote course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/1-samsara-exact-name/evidence.json, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/1-samsara-exact-name/report.md
exit: 0
```

Follow-up lookups (common name vs legal name):

```text
$ python3 course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/legal-name-lookup.py
Samsara                  -> not_found               no exact normalized-name match in the sponsorship dataset
Samsara Networks         -> no_sponsorship_record  SAMSARA NETWORKS INC no sponsorship record for this company in the dataset
Plaid                    -> not_found               no exact normalized-name match in the sponsorship dataset
Plaid Technologies       -> no_sponsorship_record  PLAID TECHNOLOGIES INC no sponsorship record for this company in the dataset
Instacart                -> not_found               no exact normalized-name match in the sponsorship dataset
Maplebear                -> found                  MAPLEBEAR INC tier=proven appr=498 den=4
One Medical              -> not_found               no exact normalized-name match in the sponsorship dataset
1Life Healthcare         -> found                  1LIFE HEALTHCARE INC tier=likely appr=2 den=0
exit: 0
```

Samsara and Plaid have dataset rows under their legal names but no sponsorship figures, so a better name match would still block them. The real hidden-sponsor cases are Instacart and One Medical: their common names are not found, while `MAPLEBEAR INC` (proven, 498 approvals) and `1LIFE HEALTHCARE INC` (likely, 2 approvals) are. That those are the same companies is my own knowledge (inferred), not something the repository records.

### 5.2 Authorization trap

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv --persona course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/persona-trap.yml --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/2-authorization-trap
de-ml-soc-sponsor: 6 targets → scoreable 0 · held 0 · blocked 0 · skip_gated 0 · stopped 6
timeline gate: remaining 56 vs buffer 20 → factor 1
STOP (7): authorization string would make the scorer treat this sponsorship-needing persona as not needing sponsorship
wrote course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/2-authorization-trap/evidence.json, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/2-authorization-trap/report.md
exit: 4
```

### 5.3 Timeline closed

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv --persona course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/persona-timeline-closed.yml --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/3-timeline-closed
de-ml-soc-sponsor: 6 targets → scoreable 0 · held 0 · blocked 0 · skip_gated 6 · stopped 0
timeline gate: remaining 15 vs buffer 20 → factor 0
STOP (5): timeline gate closed: all roles Skipped as gated
wrote course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/3-timeline-closed/evidence.json, course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/3-timeline-closed/report.md
exit: 3
```

### 5.4 Missing posting URL

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/targets-missing-url.csv --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/4-missing-posting-url
halt: line 3: empty posting_url
exit: 2
```

### 5.5 Private targets path

```text
$ python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets private/targets.csv --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/5-private-targets-path
halt: input file not found: private/targets.csv
exit: 2
```

## 6. Why DRAFT

The mode ran live on 2026-10-20 against real postings, with real liveness checks, one human posting check, and the existing scorer — but it stays DRAFT. SNICKERDOODLE.md:58 lets a recipe leave DRAFT only with zero open TODO items, and this one has 7. Those 7 are the proposed additions the assignment asks for (per-employer occupation-code data, E-Verify data, legal-name aliases, seniority detection, the scorer fix, full Form D quarters, and a funding-freshness rule), so closing them is future work, not paperwork. Separately, the next stages need audits that a human has read (line 59) and a human clearing every gate on a live run (line 60), and Brex's liveness gate was never cleared.

## 7. Reflection

### What went well

### What the mode got wrong or missed

### Next steps

## Attestation

- Recipe: Sreevarshann-de-ml-soc-sponsor v0.1.0
- By: Sreevarshann · 2026-10-20 (drafted from saved outputs; to be reviewed and signed by Sreevarshann)

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests` | `Ran 51 tests` · `OK` · exit 0 | all pass, offline |
| `npm run ats:liveness -- $U` (zsh, URLs in one variable) | `Checking 1 URL(s)...`, one expired line, HTTP 404, exit 1 | six URLs checked |
| `npm run ats:liveness -- <6 URLs as separate words>` | 3 active · 2 uncertain (Formlabs, Brex: no visible apply control) · 1 expired (Twilio, redirect to `?error=true`), exit 1 | the constructed Twilio URL expired; the others live |
| Human opened the Formlabs posting | active; recorded in `posting-checks.csv` | uncertain postings cleared only by a person |
| `run.py` on the 6 targets, saved liveness, 1 human check | 5 scoreable · 0 held · 1 blocked (Brex: not_found, and liveness held); timeline 56 vs 20 → factor 1; exit 0 | Brex blocked; every other role scoreable |
| `npm run score -- roles.json --profile profile.json` | Apply 3 (0.465) · Consider 1 (Formlabs 0.395, soft spot "likely") · Skip 1 (Twilio, liveness gate); exit 0 | matches the hand calculation in section 4 |
| Break 1: company "Samsara" | blocked: not_found; control "Samsara Networks" blocked: no_sponsorship_record | blocked as not_found |
| Break 2: authorization "F-1 STEM OPT — work authorized (EAD)" | STOP (7), 6 stopped, no roles.json, exit 4 | run stops, exit 4 |
| Break 3: 75 unemployment days used | remaining 15 vs buffer 20 → factor 0, 6 skip_gated, exit 3 | all roles Skipped as gated |
| Break 4: empty posting_url | `halt: line 3: empty posting_url`, exit 2, nothing written | whole run stops |
| Break 5: `--targets private/targets.csv` | `halt: input file not found`, exit 2, nothing read | refused as a private path (not observed: see section 5) |
| Test `test_broken_mutant_is_caught` (missing values read as 0) | the missing-value check fails under the mutant | the suite catches the mutant |
| `npm run verify` / `npm run doctor` / `node scripts/pii-scan.mjs --diff main` after `64803cf` | exit 0 / exit 0 / `pii-scan: clean ✓` | all pass |

### Did not test

- The Brex posting, checked by a human — it stays held.
- Full Form D quarters — only the 200-company shipped samples, which matched none of the six targets.
- Any per-employer occupation-code data — none exists in the repository.
- E-Verify enrollment for any target.
- Sponsorship tiers other than proven, apart from Formlabs (likely); no "possible" company was run live.
- Seniority — Discord's Senior posting scored Apply for a new-graduate persona.
- The scorer on a second persona.
- The private-path refusal with a file that actually exists under `private/` (deliberately not created).
- A second live liveness run, to see whether results change over time.

### Broke during testing, fixed

- **zsh word-split.** The first liveness run passed six URLs as one argument; re-run with the URLs as separate words. The invalid output is kept under its own name.
- **Personal-data scanner hit in a saved output.** A saved scan output quoted the npm package author's email from `package-lock.json`; the branch-history scan flagged it. Both saved scan outputs were redacted to `<npm-author-email>` with a note, and the unpushed commit was rebuilt as `1cdcd21`.
- **Report summary wording.** The summary said both blocked companies lacked a sponsorship record when one was blocked for an ambiguous name; reworded in `run.py` before the first commit.
