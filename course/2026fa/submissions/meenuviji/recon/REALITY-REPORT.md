# Reality Report — Phase 0 reconnaissance (meenuviji)

## Executive summary

**What this is.** A first-look inspection of the job-search engine repository before any design work: does the toolchain run on this machine, what does the scoring code actually expect, and what do the three main datasets really contain.

**Why read it.** Every later design decision depends on these facts, and several of them differ from what the project's own documentation says.

**What it found.**
- The tools mostly run. Environment check passes and the role scorer reproduces the book's worked example exactly. Two commands fail: the full verification step fails because a Python YAML library is missing on this machine, and the job-board scan refuses to run because its personal configuration file has not been created.
- Sponsorship history is recorded **per company, not per occupation code**. Only about 1 in 20 companies has any sponsorship record at all.
- The two company datasets write names differently (one is all capitals with punctuation stripped; the other uses the filer's own casing and punctuation). Across the 200 sampled funding filings, only **2 names match exactly**; 14 match after stripping case and punctuation, and only **1** of those 14 (Databricks) carries any sponsorship history.
- Each funding-filing sample covers a **single day** (the last day of its quarter), from 30 June 2025 to 31 March 2026.
- The role-quality signal currently carries **zero weight** in the scorer, so it cannot change any recommendation.

Statements below come from files read or commands run on 2026-10-03; anything not checked is marked **NOT CHECKED**.

---

## Run record

- Repo: fork `meenuviji/the-reallocation-engine`, cloned at commit `015843d`; `upstream` = `nikbearbrown/the-reallocation-engine`.
- Branch: `contrib/2026fa-meenuviji-recon` (uncommitted; nothing pushed).
- Machine: macOS (Darwin), zsh. Raw output of every command: [`raw-output.txt`](raw-output.txt).
- Files read in full: `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `recipes/README.md`, `recipes/_shared.md`, `recipes/scan.md`, `recipes/local-wage-adjustment.md`, `recipes/local-wage-adjustment.card.md`, `scripts/score/role-scorer.mjs`, `scripts/conformance.mjs`, `data/examples/ch11-roles.json`.
- Not read (per instructions): `private/`, `search/resume.json`, `data/ats/` contents. (The existence of `data/ats/portals.example.yml` and absence of `data/ats/portals.yml` was observed via `ls` only.)

## 1. Toolchain results

| Command | Exit | Result (from `raw-output.txt`) |
|---|---|---|
| `node --version` | 0 | `v24.21.0` (requirement: 20+ ✓) |
| `npm --version` | 0 | `11.19.0` |
| `python3 --version` | 0 | `Python 3.9.6` |
| `npm install` | 0 | `added 55 packages`; `3 high severity vulnerabilities`; deprecation warning for `glob@10.5.0`; install scripts for `fsevents@2.3.2` and `sharp@0.33.5` reported as "not yet covered by allowScripts" |
| `npm run doctor` | 0 | `environment: ✓ runnable`; pandoc and libreoffice `not found` (optional); all 24 npm script targets present; `no private/PII paths are tracked`; `RECIPES (33)`, 33/33 with lifecycle frontmatter; status `DRAFT 28 · RUNNABLE-SAMPLE 4 · … VERIFIED 1`; `318 declared … 318 [TODO markers in bodies` |
| `npm run verify` | **1** | Conformance half passed: `conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)` / `✓ all conform`. Manifest half **failed**: `ModuleNotFoundError: No module named 'yaml'` → `E1 .ai/manifest.yaml does not parse` → `✗ manifest check FAILED (1 error)`. Cause: PyYAML not installed for system `python3` 3.9.6. Not a shell issue. No workaround attempted. |
| `npm run ats:scan -- --dry-run` | **1** | `Error: portals.yml not found. Run onboarding first.` `recipes/scan.md` says to copy `data/ats/portals.example.yml` to `data/ats/portals.yml`; not done. |
| `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score` | 0 | `✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)`; wrote `role-scores.json` + `role-scores.md` only under the `--out-dir`. `git status` afterwards shows only `?? course/2026fa/` — no tracked file modified. |

Not run: `ats:liveness` (skipped per instructions); `bls:local-wage` (**NOT CHECKED**; also `.venv` does not exist in the clone, which that script requires per `recipes/local-wage-adjustment.md`).

Observation (not a fix): conformance's `yaml` check in `scripts/conformance.mjs:65` also shells out to PyYAML, but the default surfaces happened to contain 0 YAML files in this run (`158 files` breakdown lists no `yaml`), so it passed.

## 2. What `role-scorer.mjs` expects

**Input** (`scripts/score/role-scorer.mjs:167-168`): a JSON array of role records, or an object with a `roles` array. Shape per record (as used at lines 76-78, 83-88, 99, 116-125; example from `data/examples/ch11-roles.json`):

```json
{
  "role_id": "string",
  "company": "string",
  "title": "string",
  "sponsorship":  { "p": 0.9,  "tier": "Proven", "source": "record" },
  "fit":          { "p": 0.7,  "source": "model-judgment" },
  "role_quality": { "p": 0.0,  "source": "record" },
  "liveness":     { "factor": 1.0,  "source": "record" },
  "timeline":     { "factor": 0.85, "source": "your-input" },
  "override":     { "decision": "Apply", "reason": "non-empty text required" }
}
```

- Votes read `.p` (must be a finite number or the vote is dropped — `num()` line 65, `push` line 73). Gates read `.factor`; **a missing gate defaults to 1** (lines 83-84).
- `role_quality` is accepted (line 78) but is absent from all five example roles.
- `tier` matters only for the soft-spot demotion: `likely`, `possible`, `unknown` (case-insensitive) when the profile needs sponsorship (lines 48, 99-100).
- `--profile p.json` optional; reads `profile.authorization`. If it matches `/citizen|permanent|green|gc|pr\b|no.?sponsor|authorized/`, sponsorship weight → 0. No profile ⇒ assumes sponsorship needed (lines 56-63).

**Source-label values** (`SRC`, line 51): `"record"`, `"model-judgment"`, `"your-input"`. Defaults when `source` is omitted: sponsorship → `record`, fit → `model-judgment`, role_quality → `record`, liveness → `record`, timeline → `your-input`. The code does **not** validate the label — any string passed as `source` is copied through.

**Output** (`role-scores.json`, line 176): `{ _scorer: "bayesian-role-scorer", _chapter: 11, generated, config, profile_needs_sponsorship, roles: [ { role_id, company, title, composite, recommendation, machine_recommendation, reason, override, trace: { votes[{factor,value,weight,contribution,source}], vote_sum, gates[{factor,multiplier,source}], gate_product, arithmetic } } ] }`.

## 3. Current weights and gates (`CONFIG`, lines 33-49)

| Key | Value | Code's own provenance note |
|---|---|---|
| `weights.sponsorship` | 0.35 | `[Ch.11] stated`, profile-conditional |
| `weights.fit` | 0.30 | `[Ch.11] stated. Model judgment.` |
| `weights.role_quality` | **0.0** | `[VERIFY]` — unpinned; contributes nothing |
| `apply_threshold` | 0.30 | `[Ch.11]` |
| `consider_floor` | 0.20 | `[VERIFY]` placeholder |
| `gate_zero` | 0.05 | gate ≤ this ⇒ Skip (gated) |
| `soft_sponsorship_tiers` | `likely`, `possible`, `unknown` | demote Apply→Consider |

Composite = `(Σ p·weight) × liveness × timeline`. Classification order (lines 93-112): closed gate → Skip; composite ≥ 0.30 → Apply unless soft sponsor tier or `timeline < 0.6` (hard-coded, not in CONFIG) → Consider; ≥ 0.20 → Consider; else Skip. Override honoured only with a non-blank `reason`; otherwise kept with a `_warning` and ignored.

Note: weights sum to 0.65, and are not renormalised, so max possible composite is 0.65.

## 4. What `conformance.mjs` checks

Syntax/well-formedness only — "the MACHINE half of P4", explicitly "NOT the adequacy gate" (lines 3-10):

- `.json` → `JSON.parse`; `.yaml/.yml` → PyYAML `safe_load`; `.mjs/.js` → `node --check`; `.py` → `python3 -m py_compile`; `.sh` → `bash -n`; `.md` → even number of lines starting with ```` ``` ```` and terminated front-matter if the file starts with `---`.
- Default paths: `prompts`, `brand`, `recipes`, `scripts`, `DOMAIN.md`, `CLAUDE.md`, `AGENTS.md`, `SNICKERDOODLE.md`, `README.md`, `metadata.yaml`, `package.json` (lines 32-36). Accepts explicit paths as args.
- Skips directories named `.git`, `node_modules`, `.build`, `output`, `images`, `d3`, `data`, `MD`, `PSD`, `epub`, `front-back`, `wayback-machine`, `ingest`, `gigo`, `tools` (lines 21-25) — so nothing under `data/` and nothing in any `tools/` dir is checked.
- It does not check schemas, field presence, values, or behaviour. Exit 1 on any failure.
- `npm run verify` additionally runs `scripts/manifest-check.mjs` (from `package.json`); that script was not read — its contents are **NOT CHECKED** beyond the error it printed.

## 5. Data facts

### 5a. `data/80-days-to-stay/` (70 files)

Listing (from `find`): `LICENSE`, `README.md`, `.gitignore`; `80-days-day-01…08/README.md` (8 READMEs); `80-days-csv/README.md` + `80-days-csv/mapped_student_employment_targets_v3.csv` (6,438,295 bytes); `data/README.md` + three audits (`SEC_DOL_H1b_data_mapped-audit.md`, `…-join-validation-audit.md`, `…-entity-resolution-readiness-audit.md`); `biojobs/LICENSE`, `biojobs/README.md`; `scripts/` (10 Python scripts + `requirements.txt` + `webpage_processor_README.MD`); `ats-scripts/` (scraper package, tests, reference scripts, docs; `data/.gitkeep`).

**The only tabular data file is `80-days-csv/mapped_student_employment_targets_v3.csv`.** Individual READMEs, scripts, and the other audits were listed but not read in full (**NOT CHECKED**), except `80-days-csv/README.md`, `data/README.md` and the first 30 lines of `SEC_DOL_H1b_data_mapped-audit.md`.

Header row (verbatim):

```
company_name,industry,website,city,state,zip_code,phone,year_incorporated,company_age_years,executive_officers,board_directors,total_funding,latest_funding_amount,latest_funding_stage,latest_funding_date,Total Approvals,Total Denials,Approval_Rate,median_salary_offered,top_job_titles_sponsored
```

Three example rows — the first three rows that have sponsorship data (selected columns; `phone`, `executive_officers`, `board_directors`, `website`, `zip_code` omitted here deliberately because they contain real phone numbers and real people's names):

| company_name | industry | city | state | latest_funding_stage | latest_funding_date | Total Approvals | Total Denials | Approval_Rate | median_salary_offered | top_job_titles_sponsored |
|---|---|---|---|---|---|---|---|---|---|---|
| 1LIFE HEALTHCARE INC | Hospitals and Physicians | San Francisco | CA | Series D+ | 2018-08-21 | 2.0 | 0.0 | 100.0 | 108181.0 | `['Senior Data Engineer']` |
| 1UPHEALTH INC | Other Technology | BOSTON | MA | Series C | 2023-04-03 | 12.0 | 0.0 | 100.0 | 127500.0 | `['Senior Software Engineer']` |
| 23ANDME INC | Other Technology | Sunnyvale | CA | Series C | 2020-12-09 | 52.0 | 2.0 | 96.29629629629628 | 183195.0 | `['Technical Lead', 'Lead BI Engineer', 'Sr. Software Engineer III', 'Sr. Mobile Engineer III', 'Offensive Security Engineer']` |

(The very first file rows, e.g. `$AVY INC`, `011235813 INC`, `0XCORD INC`, have all five sponsorship columns empty.)

Facts computed by script:
- 30,369 rows, 30,369 distinct `company_name` (no duplicates).
- 1,557 rows have sponsorship data; all five sponsorship columns are populated together on exactly those 1,557 rows. 28,812 rows have none. Per `data/README.md`, null "does not necessarily mean the company does not sponsor".
- `latest_funding_date` range: 1995-12-31 → 2025-09-26.
- **SHA-256 of `mapped_student_employment_targets_v3.csv` = `eccdee2a…6270`, identical to the SHA-256 recorded in `SEC_DOL_H1b_data_mapped-audit.md` for `SEC_DOL_H1b_data_mapped.csv`.** That file name is referenced by `recipes/_shared.md`, `recipes/scan.md` and `data/README.md`, but `find` returns no file of that name anywhere in the clone. `80-days-csv/README.md` refers to it as `mapped_student_employment_targets.csv` (no `_v3`).
- City casing is inconsistent (`San Francisco` vs `BOSTON`).

**Is sponsorship company-level or SOC-level? Company-level.** One row per company; sponsorship is aggregate counts/rate/median salary per company. No SOC column exists (script check found none; the audit says "No SOC code columns are present"). The only role signal is `top_job_titles_sponsored`, a Python-list-formatted string of free-text titles — not SOC codes.

### 5b. `data/sec/form-d/processed/sample/` (4 files)

Files: `companies-sec-2025q2-d.sample.json`, `…2025q3…`, `…2025q4…`, `…2026q1…`. Each is a JSON object `{ "metadata": {...}, "companies": [ ...50 records... ] }`. Metadata example (2025Q2): `"quarter": "2025Q2_d"`, `"total_companies": 13325`, `"_sample": "first 50 of 13325 companies — full file fetched via scripts/sec (see DATA.md)"`.

"Header" (record keys, from the first record):

```
accession_number
company: { name, company_name_normalized, fein, address{street1,street2,city,state,zip,phone}, entity_type, year_incorporated, industry }
funding: { total_offering_amount, total_amount_sold, total_remaining, number_of_investors, date_of_first_sale, stage_estimate }
filing:  { date_filed, submission_type, quarter }
company_age: { years_since_incorporation, months_since_funding, funding_recency }
related_persons: [ { name, first_name, middle_name, last_name, relationships[], city, state } ]
metadata: { source_quarter, processed_date, prediction_scores{ international_hiring, recent_grad_hiring } }
```

Three example records (selected fields; addresses, phones and `related_persons` omitted because they are real contact details / people):

| company.name | company_name_normalized | entity_type | industry | total_offering_amount | stage_estimate | date_filed | quarter |
|---|---|---|---|---|---|---|---|
| DICKERSON PIKE LLC | dickersonpike | Limited Liability Company | Other | 1800000.0 | null | 30-JUN-2025 | 2025Q2_d |
| Ballast Rock Real Estate Private Credit Fund LLC | ballastrockrealestateprivatecreditfund | Limited Liability Company | Pooled Investment Fund | 20000000.0 | Pre-Seed | 30-JUN-2025 | 2025Q2_d |
| CNL Strategic Residential Credit, Inc. | cnlstrategicresidentialcredit | Corporation | REITS and Finance | 250000000.0 | null | 30-JUN-2025 | 2025Q2_d |

Facts computed by script:
- 50 records per file, 200 total, 196 distinct names. Full-quarter sizes per metadata: 13,325 / 14,138 / 14,885 / 15,981.
- `prediction_scores` were `null` in the records displayed.

**Date range:** `filing.date_filed` spans **2025-06-30 → 2026-03-31**, but each file's 50 records all share **one date**: 2025Q2 = 2025-06-30, 2025Q3 = 2025-09-30, 2025Q4 = 2025-12-31, 2026Q1 = 2026-03-31. The "first 50" sample is therefore the last filing day of each quarter, not a spread across the quarter.

### 5c. Company-name formats and overlap (80 Days vs Form D samples)

- **80 Days:** all 30,369 names are entirely upper-case; punctuation appears stripped (e.g. `DATABRICKS INC`, `COMPOSABL INC`); 27,867 end in INC/LLC/CORP/CORPORATION/LTD.
- **Form D:** filer's own casing and punctuation (e.g. `Databricks, Inc.`, `Alpha Hedge Fund, LLC/FL`, `Brightstar Horizon Fund I, L.P.`); only 15 of 200 are all upper-case. Also carries `company_name_normalized` (lower-case, alphanumeric-only, legal suffix removed: `dickersonpike`).

Overlap counts (computed over the 200 sample names vs all 30,369 80 Days names):

| Match rule | Overlapping names |
|---|---|
| Exact raw string | **2** — `DICKERSON PIKE LLC`, `MAP THE SKY LLC` |
| Upper-case + whitespace-collapse | 5 — adds `13G30 LONDON LTD LIABILITY CO`, `BG HOLDING CO LLC`, `CRYPTO CO` |
| Lower-case + strip all non-alphanumerics | 14 |

Of the 14 normalized matches, only **`Databricks, Inc.` ↔ `DATABRICKS INC`** has sponsorship data in 80 Days; the other 13 (including both exact matches) have none. Matching against Form D's own `company_name_normalized` field (suffix-stripped) was **NOT CHECKED**.

### 5d. `data/bls/compact/soc_occupation_compact.csv`

Header row (verbatim):

```
onet_soc_code,bls_soc_code,title,description,job_zone,alternate_title_count,alternate_titles_sample,oews_year,employment,annual_mean_wage,annual_median_wage,hourly_mean_wage,hourly_median_wage,employment_prse,ability_originality_lv,ability_problem_sensitivity_lv,ability_deductive_reasoning_lv,ability_inductive_reasoning_lv,ability_selective_attention_lv,ability_oral_comprehension_lv,skill_programming_lv,skill_critical_thinking_lv,skill_judgment_decision_making_lv,skill_complex_problem_solving_lv,skill_systems_analysis_lv,skill_systems_evaluation_lv,skill_social_perceptiveness_lv,skill_active_listening_lv,skill_persuasion_lv,skill_instructing_lv,skill_service_orientation_lv,cognitive_pivot_score
```

Three example rows (first three in file; `description` and `alternate_titles_sample` truncated here, ability/skill columns omitted):

| onet_soc_code | bls_soc_code | title | job_zone | oews_year | employment | annual_mean_wage | annual_median_wage | cognitive_pivot_score |
|---|---|---|---|---|---|---|---|---|
| 11-1011.00 | 11-1011 | Chief Executives | 5 | 2024 | 211850.0 | 262930.0 | 206420.0 | 4.877 |
| 11-1011.03 | 11-1011 | Chief Sustainability Officers | 5 | 2024 | 211850.0 | 262930.0 | 206420.0 | 4.137 |
| 11-1021.00 | 11-1021 | General and Operations Managers | 4 | 2024 | 3584420.0 | 133120.0 | 102950.0 | 3.694 |

Facts computed by script: 1,016 rows, 32 columns, all `oews_year = 2024`; 867 distinct `bls_soc_code`; 76 BLS codes have more than one O*NET row, and those rows **repeat the parent BLS wage** (e.g. `15-2051` Data Scientists / Business Intelligence Analysts / Clinical Data Managers all `112590.0`); 54 rows have an empty `annual_median_wage`. Wages are **national** only (no area column).

## 6. DOMAIN.md "known gaps" — what I reproduced

| # | Gap | Status in this recon |
|---|---|---|
| 1 | BLS extract reads `Skills.txt` | NOT CHECKED |
| 2 | RUN_LOG path | NOT CHECKED (observed `logs/RUN_LOG.md` exists) |
| 3 | `role_quality: 0.0` | **Reproduced.** `CONFIG.weights.role_quality = 0.0`; scorer output header prints `role_quality 0`; no example role carries `role_quality`. Ch.11 worked example **reproduced**: Cambridge biotech → Apply 0.446; household non-sponsor → Skip 0.178. |
| 4 | `oferta` sample run artifacts | NOT CHECKED |
| 5 | `npm run doctor` built | **Reproduced** — runs, exit 0. |
| 6 | Anonymized case studies | NOT CHECKED |
| 7 | skill → recipe rename | NOT CHECKED |
| 8 | All 42 recipes carry frontmatter; declared 518 = body 518 | **Discrepancy.** Doctor now reports `RECIPES (33)` and `318 declared … 318` in bodies; `ls recipes/*.md` counts 41 `.md` files (including `README.md` and `.card.md` files). Counts differ from DOMAIN.md's 42 / 518. |
| 9 | Local wage adjustment "feeds nothing yet" | **Reproduced** for the scorer side (role_quality weight 0). The local-wage script itself was not run: NOT CHECKED (no `.venv` in clone). |

Other doc-vs-reality mismatches observed:
- DOMAIN.md layout lists `chapters/` and `pantry/`; neither exists at repo root (`book/chapters` exists).
- `SEC_DOL_H1b_data_mapped.csv` (referenced by recipes) is absent; the same bytes ship as `mapped_student_employment_targets_v3.csv` (see 5a).
- The scorer's own demo run skips 40%, below the DOMAIN.md norm that "a healthy run skips at least half"; the report itself flags this.

## 7. What CONTRIBUTING.md says about file locations

From `CONTRIBUTING.md` ("Where your work goes"):

| What | Where |
|---|---|
| Code + tests + fixtures | `scripts/contrib/<term>/<handle>-<component>/` |
| Recipe + card pair | `recipes/cases/<term>/<handle>-<slug>.md` + `.card.md` |
| Run-log entries | `logs/runs/<term>-<handle>-<n>.md` — never edit `logs/RUN_LOG.md` |
| Justification / worked run / reports | `course/<term>/submissions/<handle>/` |

- **`CHANGE-BRIEF.md`, `FRICTIONAL.md`, `SUBMISSION.md`:** CONTRIBUTING.md does **not** name any of them. By grep, they appear only in `course/assignments/greenhouse-watch.md` (line 157 lists `CHANGE-BRIEF.md` and `FRICTIONAL.md` under `course/2026fa/submissions/<handle>/`; line 170 describes `SUBMISSION.md` as accompanying a source ZIP). That assignment file was not read in full and may not be this assignment — **NOT CHECKED** whether it applies.
- **Scorer output files:** CONTRIBUTING.md does not name a location for `role-scores.json`/`.md`. It says harnesses may "run the CLI and read `role-scores.json`", and that worked runs/reports go under `course/<term>/submissions/<handle>/`.
- **May outputs be committed?** CONTRIBUTING.md does not say so explicitly. What it does say: keep the diff scoped (touching shared logs or another student's namespace fails the contrib gate); no real PII anywhere in branch history; demos/fixtures use only the fictional personas. `DATA_CONTRACT.md` adds that generated files must be checked for privacy and size before committing, and `data/ats/` outputs are private by default. The CI workflow `contrib-gate.yml` that enforces this was **NOT CHECKED**.
- Branch naming: `contrib/<term>-<handle>-<component>`; one open PR per student.
