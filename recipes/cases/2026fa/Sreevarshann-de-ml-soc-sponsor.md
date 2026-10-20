---
status: DRAFT
todos_open: 7
last_gate: "live-run 2026-10-20 (not all gates cleared: Brex liveness held), logs/runs/2026fa-Sreevarshann-2.md"
attestation: null
recipe_version: 0.1.0
---

# Sreevarshann-de-ml-soc-sponsor — sponsor and occupation-code evidence for new-grad Data/ML Engineer roles

## Executive summary

**What this is.** A job-search check for an international master's graduate on F-1 OPT who is applying for Data Engineer and Machine Learning Engineer jobs. For each company on a short target list it asks four questions, in order of what can actually be checked: does the company have a recorded history of visa sponsorship; have the job titles it sponsored before included data or ML work; what does national occupation data say about the occupations those roles are usually filed under; and is this posting still live. It also checks the person's visa timeline once for the whole list.

**Why read it.** A new graduate on OPT has a fixed number of unemployment days and cannot afford to spend them on companies that will not sponsor, or on postings that are already closed. Sponsorship history for the whole company is easy to find; whether a company sponsors *data and ML roles specifically* — and under which occupation code it files them — is not. This mode shows what the project's data can and cannot say about that, and refuses to fill the gap with a guess.

**What it decides.** For each company: scoreable, on hold until a person checks the posting, or blocked for missing evidence — and, for the scoreable ones, the existing scorer's Apply / Consider / Skip. In its first live run, three companies came out Apply, one Consider, one Skip (a dead posting), and one was blocked because it is not in the sponsorship data. The central question — which occupation code each employer files these roles under — could not be answered from data in this project; it is reported as proposed, never as a finding.

**Lifecycle:** DRAFT — 7 typed TODOs are open, and SNICKERDOODLE requires zero before SPECIFIED (line 58), so the real live run below cannot promote it; one liveness gate is also still held, which RUNNABLE-LIVE (line 60) does not allow.

Two customers: this file is for the agent; `recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.card.md` is for the human.

**Handoff condition (done when):** a run writes `evidence.json` and `report.md` under `course/2026fa/submissions/Sreevarshann/mode-build/runs/<run-date>/`; every target appears exactly once with one status and every reason that applies; every emitted value carries a `record` / `model-judgment` / `your-input` / `proposed` / `sample` label; `roles.json` contains only roles that passed every gate; and the scorer was run by its CLI on that file. "Looks right" is not the condition.

Chapters claimed: Ch 7 (sponsorship), Ch 8 (liveness), Ch 9 (role quality, report only), Ch 10 (timeline), Ch 11 (composite, via the existing scorer).

## Purpose

Use this mode when **all** of these hold:

- the candidate is on F-1 OPT (post-completion) after a US master's, and needs sponsorship;
- the target roles are Data Engineer, Analytics Engineer, Data Platform, ML Engineer, MLOps, or AI Engineer;
- there is a short list (roughly 5–20) of named companies, each with one real posting URL;
- the question is "where should my next application hours go?", not "is this role legally sponsorable?" (this mode gives no immigration or legal advice).

Do **not** use it for: candidates who do not need sponsorship (the sponsorship vote drops to 0 and the mode adds nothing), non-DE/ML roles (the title keywords will not match), or bulk lists (each uncertain posting needs a human check).

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout and what is runnable.
3. `CONTRIBUTING.md` — where student files go; never edit `logs/RUN_LOG.md`.
4. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md`, `book/chapters/08-is-the-job-real-ats-detection-and-liveness.md`, `book/chapters/10-the-visa-timeline-manager.md`, `book/chapters/11-the-bayesian-role-scorer.md`.
5. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` — states that the sponsor table has no SOC columns.
6. `scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/README.md` and this recipe's card.

## Source Inventory

### Data read (all tracked, public; no private paths)

| Source | Path | Fields used | Label |
|---|---|---|---|
| Sponsorship by company | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with sponsorship fields) | `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `median_salary_offered`, `top_job_titles_sponsored`, `latest_funding_date`, `latest_funding_stage`. Never loaded: `phone`, `executive_officers`, `board_directors`. | record |
| Occupation data | `data/bls/compact/soc_occupation_compact.csv` | `onet_soc_code`, `bls_soc_code`, `title`, `job_zone`, `annual_median_wage` (OEWS 2024 national), `cognitive_pivot_score` | record |
| Form D | `data/sec/form-d/processed/sample/*.sample.json` (4 files × 50 = 200 companies) | `filing.date_filed`, `filing.quarter`, `company_age.funding_recency`, `funding.total_amount_sold` | sample |
| Persona (fictional) | `search/examples/priya-nair/profile.yml` | `needs_sponsorship`, `visa.current_status`, `visa.unemployment_days_used`, `visa.buffer_target` | your-input |
| Targets | `course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv` | `company_name`, `posting_url`, `posting_title` | your-input |
| Human posting checks | `course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv` | `date`, `url`, `status`, `checked_by` | your-input |
| Name rules | `scripts/sec/entity-resolution.py` (`normalize_company_name`) | suffix list + punctuation rule, copied and pinned by a test | — |
| Scorer | `scripts/score/role-scorer.mjs` | CLI only; never imported or re-implemented | — |

### Commands actually run (2026-10-20, real outputs under `course/2026fa/submissions/Sreevarshann/mode-build/runs/`)

| # | Command | Contacts | Writes |
|---|---|---|---|
| 1 | `python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests -v` | nothing (sockets patched to fail) | system temp dirs only |
| 2 | `npm run ats:liveness -- <6 posting URLs>` | `job-boards.greenhouse.io`, `careers.formlabs.com`, `www.brex.com`, plus whatever those pages load (headless Chromium) | nothing (stdout saved by redirect) |
| 3 | `python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets <targets.csv> --persona search/examples/priya-nair/profile.yml --liveness <saved liveness stdout> --checks <posting-checks.csv> --run-date 2026-10-20 --out-dir <run dir> --overwrite` | nothing | `evidence.json`, `report.md`, `roles.json`, `profile.json` in `--out-dir` |
| 4 | `npm run score -- <run dir>/roles.json --profile <run dir>/profile.json --out-dir <run dir>` | nothing | `role-scores.json`, `role-scores.md` in `--out-dir` |
| 5 | `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs --diff main` | nothing | nothing |

Target discovery (not a mode step): read-only GETs to `boards-api.greenhouse.io` (22) and `api.lever.co` (1); raw responses kept outside the repo; filtered output in `course/2026fa/submissions/Sreevarshann/mode-build/runs/target-discovery-2026-10-20.txt`.

## Proposed additions

1. **DOL LCA disclosure data** — [TODO: DATA SOURCE] Per-filing employer, job title, SOC code and wage would turn "which SOC does this employer file DE/ML roles under" from proposed into a count; today the sponsor table has no SOC field at all.
2. **E-Verify enrollment** — [TODO: DATA SOURCE] The STEM OPT extension requires an E-Verify employer, so a non-enrolled company is a dead end for this candidate's year-2 plan, and nothing in the repo records enrollment.
3. **Legal-name alias resolution** — [TODO: DEV] Exact matching reports "Samsara" and "Plaid" as not found although the table lists `SAMSARA NETWORKS INC` and `PLAID TECHNOLOGIES INC`; a reviewed alias table (labelled your-input) would remove these false blocks without fuzzy guessing.
4. **Seniority detection** — [TODO: DEV] Fit is a neutral constant, so a Senior posting scores the same as an entry-level one for a new graduate; a title-based seniority flag (labelled model-judgment) would surface the mismatch.
5. **Scorer reads `needs_sponsorship`** — [TODO: DEV] For maintainers: `scripts/score/role-scorer.mjs:60` infers sponsorship need from free text and treats "work authorized" as not needing sponsorship; reading the explicit field would close the trap this mode currently has to stop on.
6. **Full Form D quarters** — [TODO: DATA SOURCE] The shipped samples hold 200 of ~58,000 companies and matched none of the six targets; the full quarters (fetched by `scripts/sec/download-form-d-quarters.py`, which needs a contact User-Agent) would make the funding check meaningful.
7. **Funding-data freshness** — [TODO: DEFINE] The table's `latest_funding_date` can be years old (Reddit shows 2021 Series D+); a human-defined maximum age, with one sentence of reasoning, would flag stale funding instead of presenting it as current.

## Phase gates

Each gate is a hard stop. Liveness and timeline are **gates, not votes**: they multiply the composite or stop the run; they never add to it.

| Gate | Test (testable condition) | Pass | Fail |
|---|---|---|---|
| G1 input conformance | `targets.csv` has `company_name`, `posting_url`, `posting_title`; every field non-empty; every URL matches `^https?://`; no duplicate URL; no input or output path under `private/`, `data/ats/`, `search/resume.json` | run continues | run halts, exit 2, nothing written |
| G2 timeline | `remaining = 90 − visa.unemployment_days_used`; factor 1 if `remaining > visa.buffer_target`, else 0 (user's definition). Missing either field halts. | factor 1 | every role `skip_gated`, no `roles.json`, exit 3 |
| G3 sponsorship evidence | exactly one exact normalized-name match with approvals and denials present, and not 0/0 | role continues | role `blocked` (`not_found` / `ambiguous` / `no_sponsorship_record`); never scored |
| G4 liveness | the URL appears in the saved `npm run ats:liveness` output as `active` (factor 1) or `expired` (factor 0) | factor recorded (record) | `uncertain` or absent → role `held` |
| G5 human posting check | for an `uncertain` URL, a row in `posting-checks.csv` with an ISO date, the exact URL, `status` ∈ {active, expired}, non-empty `checked_by` | factor 1 or 0 (your-input) | role stays `held`; a malformed row halts the run, exit 2 |
| G6 authorization string | if the persona needs sponsorship, `visa.current_status` must not match the scorer's no-sponsor pattern | run continues | run stops, exit 4, no `roles.json` |
| G7 vote guard | no `proposed`, `model-judgment` or `sample` value feeds a vote or gate in `roles.json` | `roles.json` written | run stops, exit 5 |

Test every gate offline: `python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests -v`.

## Workflow

1. Write `targets.csv` (public companies and posting URLs only).
2. Capture liveness: `npm run ats:liveness -- <url1> <url2> …` and save stdout. Under zsh, pass the URLs as separate words; a single quoted string is checked as one URL (this happened once, and the output is kept as `ats-liveness-attempt1-INVALID-zsh-no-word-split.txt`).
3. For each `uncertain` URL, a human opens it and adds a row to `posting-checks.csv`. The agent never fills this file.
4. Run `run.py` (command 3 above).
5. If `roles.json` exists, run the scorer by CLI (command 4 above).
6. Write the run-log entry under `logs/runs/`.

## Can verify / Cannot verify

### Can verify (from data or a script)

- Whether a company has a sponsorship record in the table under an exactly matching name, and its approval count, denial count, and approval rate.
- Which sponsorship tier the user-defined rule assigns from those counts.
- The text of the company's listed sponsored titles, and whether a fixed keyword list matches them (the match itself is a judgment).
- National median wage, job zone, and cognitive-pivot score for SOC 15-1252, 15-1243, 15-2051 (including O*NET sub-codes) — and that 15-2051.00 has no score.
- Whether the liveness tool saw a posting as active, expired, or uncertain at run time.
- Whether a company appears in the 200-company Form D sample.
- Whether the persona's timeline leaves more unemployment days than its buffer.

### Cannot verify

- **The SOC code a company files DE/ML roles under**, or how many filings per code. The table has no SOC field.
- **Whether this specific role sponsors.** All sponsorship data is company-wide, for unknown fiscal years.
- **E-Verify status**, which the STEM OPT extension requires.
- **Seniority fit.** The mode does not read seniority; fit is a neutral constant.
- **Funding freshness.** Funding dates are reported as recorded, however old.
- **Companies listed under a different legal name.** Exact matching blocks them as not found.
- **Role quality in the decision.** The scorer uses no BLS data and weights `role_quality` at 0; occupation data is report-only.
- What an employer pays for this role (salary is company-wide; wages are national).
- Form D funding for any company outside the 200-company sample.

## Output Contract

One artifact cannot serve both readers (P5): `evidence.json` is for agents, `report.md` is for humans.

### Agent output — `evidence.json`

Every leaf value is `{"value": …, "source": "record|model-judgment|your-input|proposed|sample", "note"?: …}`.

```text
workflow, recipe_version, run_date, mode ("sample"), exit_code
inputs: targets, persona, liveness_output, posting_checks, sponsor_csv, bls_csv,
        formd_sample {files[{file, companies_in_sample, companies_in_quarter}], companies}
persona: name, fictional, needs_sponsorship, authorization
timeline_gate: unemployment_days_used, buffer_days, remaining_days, factor, open
definitions: sponsorship_tiers, tier_p, fit, keyword_socs, scorer_role_quality_weight
counts: scoreable, held, blocked, skip_gated, stopped
stop_conditions[]: {condition, detail}
todo_items[]
roles[]: role_id, company, posting_title, posting_url,
         sponsor {status, reason?, matched_name, approvals, denials, approval_rate_pct,
                  median_salary_company_wide, funding_csv, tier, sponsorship_p},
         title_match {status, titles_listed, de_ml_title_on_record, matches[], per_employer_soc} | null,
         bls {<soc>: {status, occupations[]}},
         formd_sample {status, filings[] | note},
         liveness {state, factor | reason},
         status, reasons[{kind, detail}], reason
```

### Human report — `report.md`

```text
# Data/ML Engineer sponsor-and-SOC evidence pass
## Executive summary            (plain language; no paths, codes, or table syntax)
## Run record                   (date, mode, persona, timeline arithmetic, input paths)
Labels legend
## Per-company evidence         (| # | Company | Status | Sponsor tier | Approvals / denials / rate % |
                                   Company-wide median salary | DE/ML title on record | Candidate SOC |
                                   Per-employer SOC | Liveness |)
   Reasons                      (every reason that applies, per role)
## Matched sponsored titles (judgment)
## Occupation data for candidate SOC codes (record; national, not employer pay)
## Funding (report only)
## What this run cannot verify
```

Reader: the candidate (or an advisor) deciding where the next applications go. Decision enabled: which companies get application hours today, which need a posting checked first, which are dropped.

## Stop conditions

These match `run.py` exactly.

- **Halt, exit 2, nothing written:** targets file missing a column, empty, a blank field, a non-http(s) URL, or a duplicate URL; any input path or the output directory under `private/`, `data/ats/`, or `search/resume.json`; an input file not found; output files already present without `--overwrite`; persona missing `visa.unemployment_days_used` or `visa.buffer_target`; a malformed `posting-checks.csv` row.
- **Timeline closed, exit 3:** every role `skip_gated`; evidence and report written; no `roles.json`.
- **Authorization trap, exit 4:** persona needs sponsorship and its authorization string matches the scorer's no-sponsor pattern; every role `stopped`; no `roles.json`.
- **Vote guard, exit 5:** a `proposed`, `model-judgment` or `sample` value reached a vote or gate; no `roles.json`.
- **Per role, run continues:** `blocked` (not found, ambiguous name, or no sponsorship record) and `held` (liveness not run, or uncertain without a human check) are never scored.
- **Not stop conditions:** a missing BLS value or cognitive-pivot score (report-only), and a company absent from the Form D sample (it is only a sample).

## Run-log template

Student entries go in `logs/runs/2026fa-Sreevarshann-<n>.md` — never in `logs/RUN_LOG.md` (CONTRIBUTING.md:13).

```markdown
## YYYY-MM-DD — Sreevarshann-de-ml-soc-sponsor <run name>

- **Recipe:** Sreevarshann-de-ml-soc-sponsor v0.1.0
- **Inputs:** targets file, persona, saved liveness output, posting checks
- **Outputs:** evidence.json, report.md, roles.json, role-scores.{json,md} (paths)
- **Result:** counts by status; scorer Apply / Consider / Skip; gates cleared and by whom
- **Open issues:** held roles, blocked roles, defects found
```

No secrets, no personal contact details, no private application notes.

## Known issues found

1. **Scorer authorization pattern** — `scripts/score/role-scorer.mjs:60` decides sponsorship need from free text with a pattern that includes `authorized`, so "F-1 STEM OPT — work authorized (EAD)" reads as *not* needing sponsorship, and it never reads `needs_sponsorship`. Not fixed here (maintained file); this mode stops on it (G6, exit 4) and proposes the fix (addition 5).
2. **PATHAI / PATHRAI duplicate** — `PATHAI INC` and `PATHRAI INC` carry identical sponsorship figures (78 approvals, same titles), which looks like one employer joined twice.
3. **HUMAN INC** — shows 1,382 approvals with a single listed title, implausibly high for the name; possibly a mismatched join. Not verified.
4. **Stale funding** — Reddit's `latest_funding_date` is 2021 (Series D+). The table records it as current; the mode reports it as recorded (addition 7).
5. **Stale path in AGENTS.md** — it says the manuscript lives in `chapters/`; it is in `book/chapters/`.

None of these was edited or corrected in the data; they are reported for a maintainer.
