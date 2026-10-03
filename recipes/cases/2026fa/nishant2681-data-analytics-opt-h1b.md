---
status: DRAFT
todos_open: 6
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# nishant2681-data-analytics-opt-h1b — Sponsorship-tiered data-role triage under an OPT clock

## Executive summary

**What it does.** Takes a short list of data and analytics job openings and
decides, for each one, whether to apply, network first, or drop it. It looks up
each employer's public visa-sponsorship record. It then checks two hard stops:
is the posting still live, and can the hire realistically start before the
candidate's allowed unemployment time runs out. A role that fails either stop
is dropped, however good it looks otherwise.

**Who it is for.** An international data-analytics graduate starting
post-completion work authorization, with a limited number of unemployment days
and limited hours to spend applying. The sample run uses a fictional person.

**What it decides.** For each role: Apply, Consider or Skip, with the evidence
behind each part of the score shown, plus a next action. Apply means spend the
day's two application hours tailoring an application. Consider means network
into the company first. Skip means drop it, with the reason stated.

**Status.** DRAFT. The prototype is built and has completed a sample run on
fictional jobs (Apply 1 · Consider 4 · Skip 3). Six typed TODOs are still
open:
- three gate sign-offs a named human must log;
- one missing failure-case test;
- folding funding into the score;
- a second sponsorship source for employers this dataset misses.

The status moves up only as each one closes with its required evidence, never
by editing this header.

Two customers: this file is for the agent; the `.card.md` twin is for the
human.

## Run record

- Recipe version 0.1.0, written 2026-10-02 from
  `course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md` (committed `43020cf`).
  Every threshold below is copied from that brief; none is new. Thresholds
  marked **[VERIFY]** are proposals awaiting human review.
- Repo survey behind every citation:
  `course/2026fa/submissions/nishant2681/notes/01-repo-findings.md`.
- Related work: `recipes/cases/2026su/case-data-ml-h1b-triage.md` covers the
  same population. It is an unfilled scaffold (inputs undefined, every step a
  development TODO, cited pantry source absent). It uses BLS role quality and
  ATS discovery; this recipe uses neither.
- **Evidence run (2026-10-02):**
  `course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2/`. It ran
  on the full real CSV, exit 0, with 8 roles: Apply 1 · Consider 4 · Skip 3.
  `runs/2026-10-02-sample-1/` is an earlier identical run, superseded because
  its scorer command cited `.partial` staging paths. Both are kept.
- **Tests:** 42 offline `unittest` tests pass
  (`scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests/`), and
  `node scripts/conformance.mjs` passes on the folder.
- **Known result:** the sample run's skip rate is **38%**, below the healthy
  50% (`DOMAIN.md:8`). The fixtures were not tuned to reach 50%.
- **Sample design:** most sample jobs are at Form D-funded companies, the
  dataset's core. Deloitte and Wayfair are deliberate stress tests: Deloitte
  for multi-entity ambiguity, Wayfair for a heavy sponsor the Form D-based data
  misses entirely.
- **Liveness evidence** (`course/2026fa/submissions/nishant2681/engine-runs/`,
  real `npm run ats:liveness` runs):

  | Test | Input | Result | File |
  |---|---|---|---|
  | 1 | Real TouchCare Greenhouse posting | `active` | `liveness-check-1-retry.txt` |
  | 2 | Closed posting on a VC job board | `uncertain` (`navigation error: page.goto: Download is starting`) | `liveness-check-2-closed.txt` |
  | 3 | Nonexistent Greenhouse job ID | `expired` (redirect to `?error=true`) | `liveness-check-3-removed.txt` |

  - Test 1's first attempt failed because the Playwright browser was not
    installed (`liveness-check-1.txt`); the retry succeeded.
  - `npm run ats:scan -- --dry-run` fails without `portals.yml`
    (`ats-scan-dry-run.txt`).

## Purpose and source inventory

Score a **given** list of data/analytics roles for a candidate who needs H-1B
sponsorship. The score is built from company-level H-1B records, with posting
liveness and the OPT unemployment clock as multiplicative gates. This recipe
does not discover roles, and it does not judge role quality.

| Source | Path / command | Label | Human check |
|---|---|---|---|
| Sponsorship + funding records (80 Days) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: 30,369 companies, 1,557 with H-1B fields; no SOC column | record | Columns `Total Approvals`, `Total Denials`, `Approval_Rate` (0–100 scale), `top_job_titles_sponsored`, `latest_funding_*` still present |
| Persona (fictional) | `search/examples/priya-nair/profile.yml` | your-input | Only F-1/OPT persona that does not trip the scorer's sponsorship check (findings, Follow-up 4) |
| Composite scorer (Ch.11) | `scripts/score/role-scorer.mjs`, run as `npm run score -- <roles.json> --profile <profile.json> --out-dir <run dir>` (`package.json:15`) | — | Called as CLI only; it runs `main()` on load (`role-scorer.mjs:185`) |
| Liveness checker (Job-Ops) | `scripts/ats/check-liveness.mjs`, run as `npm run ats:liveness -- <url>` (`package.json:18`); classifier `scripts/ats/liveness-core.mjs:49` | record | Needs Playwright + network; returns a label, not a number |
| Scorer input shape | `data/examples/ch11-roles.json` | — | Field names match `role-scorer.mjs:76-87` |
| Tier vocabulary / formula | `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md:36,59-61` | — | Thresholds unpinned there |
| Timeline concept | `book/chapters/10-the-visa-timeline-manager.md:30,52,65` | — | No formula there |
| 3-3-2 day | `book/chapters/02-the-reallocation-principle.md:39` | — | 2 h apply · 3 h network · 3 h portfolio |
| Target titles | Data Scientist, Data Analyst, Machine Learning Engineer, Analytics Engineer, Data Engineer, Business Analyst, Business Intelligence, Automation Analyst | your-input | Fixed before any run |

**Prototype command.** **Closed (DEV)**: built, and run as below to produce
`runs/2026-10-02-sample-2/` (exit 0). For a new run, change `--run-id` and
`--out-dir`; an existing folder is never overwritten.

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --today   2026-10-02 \
  --run-id  2026-10-02-sample-2 \
  --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2
```

- **Language:** Python. Stdlib `csv` handles the quoted list field, and
  `ast.literal_eval` parses `top_job_titles_sponsored`. PyYAML (already used
  by `scripts/conformance.mjs:65`, installed in CI by
  `.github/workflows/contrib-gate.yml:22`) reads the persona via
  `yaml.safe_load`. Nothing new is installed.
- **Behavior:**
  - It refuses to run if `--out-dir` (or `<out-dir>.partial`) exists, so it
    never overwrites.
  - It validates every job before writing anything. It collects **every**
    stop, prints each one with its `role_id`, writes nothing, and exits 2.
  - It calls the scorer as a subprocess and never re-implements the composite
    (`CONTRIBUTING.md:46-50`).
  - If the scorer fails, the staging folder `<out-dir>.partial/` is kept with
    a run log of the failure, and the script exits 1.

## Proposed additions

All code lives under `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/`.
The orchestrator itself is the prototype command above.

Below, "tests/" means
`scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests/`. "sample-2"
means `course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2/`. Every
closed DEV item also passes `node scripts/conformance.mjs` on the piece folder.

| # | Addition | Why it belongs | Status and evidence |
|---|---|---|---|
| 1 | Company matcher: casefold + strip legal suffixes, then exact or "query + space" prefix compare; >1 candidate row → stop | Exact-name joins produce false Unknowns (Ch.7 `:30,102-104`); "Deloitte" hits 7 entities | **Closed (DEV)**: `sponsorship.py` `normalize_name`, `find_company`; `tests/test_sponsorship.py` `TestFindCompany` (5 tests), `TestNormalizeName` (2) |
| 2 | Sponsorship tier and p from CSV fields (table below) | No script turns H-1B records into p/tier (findings §b) | **Closed (DEV)**: `sponsorship.assign_tier`; `TestAssignTier` (6, incl. `test_title_match_with_zero_approvals_raises`) |
| 3 | Timeline-factor function that emits every date it used | Ch.10 requires the factor to carry its dates (`10-…md:52`) | **Closed (DEV)**: `gates.timeline_factor`; `tests/test_gates.py` `TestTimelinePriya` (6), `TestTimelineStops` (5); the dates table in sample-2 `report.md` |
| 4 | Liveness label → factor, with validation and evidence-based labeling | `classifyLiveness` returns a label, not a number (`liveness-core.mjs:49-77`); the scorer treats a missing gate as 1 (`role-scorer.mjs:83`) | **Closed (DEV)**: `gates.liveness_factor`; `TestLiveness` (5); `tests/test_run_sample.py` `test_bad_liveness` |
| 5 | Report, run log and `*-audit.md` writer | Two customers, two files; RUNNABLE-SAMPLE needs audit files | **Closed (DEV)**: `report.py`, `run_sample.py`; sample-2 `report.md`, `run-log.json`, `2026-10-02-sample-2-audit.md`; `test_exits_zero_and_writes_outputs`, `test_counts_and_report_shape` |
| 6 | Fixture harness for the six predicted failure cases (brief §6) | Each stop must be shown to fire, not assumed | **Open**: 5½ of 6 cases are tested. Still missing: a test that a **missing input file** stops the run (the code catches it as `OSError` and exits 2, but no test proves it) [TODO: DEV] |
| 7 | Fold funding recency into sponsorship p (Ch.7 weight 0.20, `07-…md:36`) | Future work; funding is context-only in this version | **Open**: not built [TODO: DEV] |
| 8 | `fixtures/jobs.sample.json` | No job list exists in the repo for this persona | **Closed (DATA SOURCE)**: file exists. *Provenance:* fictional postings (your-input) written 2026-10-02 for the sample run; company names are real rows in the 80 Days CSV; URLs on example.com; liveness labels typed |
| 9 | Reasoning for each tier threshold and p value | TODO closure needs the reasoning | **Closed (DEFINE)**: see "Tier reasoning" below |
| 10 | Reasoning for the liveness mapping | Same closure rule | **Closed (DEFINE)**: see "Liveness reasoning" under Phase gates |
| 11 | The "strong fit" cutoff that sends an Unknown-tier role to networking | The brief named the rule but gave no number | **Closed (DEFINE)**: `STRONG_FIT = 0.7` in `run_sample.py`; reasoning under Stop conditions |
| 12 | Report columns, reader and decision | Report-field closure needs all three | **Closed (REPORT FIELD)**: all three are stated in the Output contract and present in sample-2 `report.md` |
| 13 | A second sponsorship source for companies missing from the CSV: the USCIS H-1B Employer Data Hub or DOL OFLC LCA disclosure files, applied to employers **outside** the Form D company list (see note below) | Large sponsors can be missing entirely (Wayfair, TouchCare) | **Open** [TODO: DATA SOURCE] |

**Why addition 13 is needed.**
- **What the repo records:** the 80 Days CSV starts from a list of companies
  that filed SEC Form D, which was then mapped to DOL LCA and USCIS H-1B data
  (`data/80-days-to-stay/README.md:13,170`). Public companies don't file Form
  D, so a large public employer can be missing from the CSV entirely. Wayfair
  and TouchCare (a live Greenhouse posting checked in liveness test 1) both
  have 0 rows in the CSV.
- **Nishant's external check, not verified from repo data:** Wayfair is a
  heavy H-1B sponsor, including for Data Scientist, BI Analyst and Data
  Analyst titles.

**Sponsorship tier and p (record), copied from the brief.**
`Approval_Rate` is stored 0–100; the brief's original 0.90 was corrected to 90
before the first commit.

| Tier | Rule | p |
|---|---|---|
| Proven | title match AND `Total Approvals` ≥ 10 AND `Approval_Rate` ≥ 90 [VERIFY] | 0.9 |
| Likely | title match AND `Total Approvals` ≥ 1 [VERIFY] | 0.6 |
| Possible | H-1B record present, no title match [VERIFY] | 0.3 |
| Unknown | no CSV match, or H-1B fields blank | omitted (never 0) |
| Avoid | not used: the CSV cannot prove non-sponsorship | — |
| *(no tier)* | title match AND `Total Approvals` = 0 fits no rule above → **error** "row fits no tier rule" (0 rows in the real CSV hit this) | — |

A **title match** means a target title appears in `top_job_titles_sponsored`.
It is not a per-title approval count; approvals are per company.

**Tier reasoning** (closes addition 9; quoted exactly):

*Proven cutoffs (≥ 10 approvals, ≥ 90 rate)* (reasoning drafted with Claude, reviewed by Nishant):

> "One or two approvals could just be a one-time thing, like sponsoring one
> specific person. Ten or more shows the company sponsors again and again, so
> it's a habit, not luck. And a 90%+ approval rate means their filings usually
> go through, so they know how to do the process. These are my own cutoffs,
> not from any official rule, and they're per company, not per job title."

*Likely cutoff and p values* (reasoning drafted with Claude, reviewed by Nishant):

> - Likely (≥1 approval + title match): At least one approval shows the company
>   has actually done it before, and my title shows up in their sponsored list.
>   But one or a few could be one-offs, so it's weaker than Proven.
> - p values 0.9 / 0.6 / 0.3: I used 0.9 for Proven and 0.6 for Likely because
>   those are the same numbers the repo's own example file uses
>   (data/examples/ch11-roles.json), so my recipe stays consistent with the
>   engine. I picked 0.3 for Possible because the company does sponsor, just
>   not for my kind of role, so the chance is lower. None of these are measured
>   probabilities. They're my estimates, which is why the thresholds are marked
>   [VERIFY].

Checked: `data/examples/ch11-roles.json` uses `"p": 0.9` for Proven (lines 3,
15) and `"p": 0.6` for Likely (line 21).

**Timeline factor (your-input)**, from the brief and revised in brief §8: the
ceiling is read from the profile, not hard-coded.

```
remaining_days = visa.unemployment_ceiling − visa.unemployment_days_used
deadline       = min(today + remaining_days, visa.opt_end_date)   # OPT end only if known; null = not known
expected_start = today + hiring_lag_weeks × 7      # per role; whole weeks only; default 12 (use recorded)
factor = 0 (with a reason)                if remaining_days ≤ 0 or opt_end_date < today   # checked first
       = 1.0                              elif expected_start ≤ deadline − 30 days
       = 0                                elif expected_start > deadline
       = (deadline − expected_start) / 30 otherwise
```

Worked example, Priya Nair, `--today 2026-10-02`:
- 34 of 90 days used (`profile.yml:22-23`), so 56 remain.
- Deadline = min(2026-11-27, 2027-01-31) = **2026-11-27**.
- At a 12-week lag, expected start is 2026-12-25, so the factor is **0** for
  every role. This is a real finding, not a bug.
- A role passes at all only if its lag is ≤ 8 weeks. It gets full credit at
  ≤ 26 days.

## Phase gates

Each gate is a hard stop. A run stops at the first failed gate and writes no
score for the affected role. **Liveness and timeline are gates (multipliers),
not votes:** a zero there zeroes the composite whatever the votes say
(`role-scorer.mjs:89-97`).

| Gate | Testable condition | Test (existing paths only) | On fail |
|---|---|---|---|
| G0 Inputs | CSV and profile exist; profile parses; `visa.unemployment_days_used`, `visa.unemployment_ceiling` and `visa.opt_end_date` present (`opt_end_date` may be `null` = not known) | `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && python3 -c "import yaml; v=yaml.safe_load(open('search/examples/priya-nair/profile.yml'))['visa']; print(v['unemployment_days_used'], v['unemployment_ceiling'], v['opt_end_date'])"` → `34 90 2027-01-31`; plus `test_missing_ceiling_raises` | Stop; name the missing file or key; never default a date |
| G1 Company match | Each role's company resolves to 0 or 1 CSV rows | Ambiguity evidence: `python3 -c "import csv; print(sum('deloitte' in r['company_name'].lower() for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', encoding='utf-8'))))"` → 7 | 0 rows → Unknown (`no-csv-match`). **More than 1 → STOP**: list every candidate row (name, approvals, rate) for the human to pick. The pick is recorded in the jobs file as `csv_company_name`; never chosen silently. [TODO: APPROVE] |
| G2 Sponsorship record | Tier and p follow the table above exactly | `tests/test_sponsorship.py` `TestAssignTier` | Blank H-1B fields → Unknown (`no-h1b-record`), p omitted |
| G3 **Liveness** | Every role has a label in {active, uncertain, expired}; factor 1.0 / 0.5 / 0.0 | `tests/test_gates.py` `TestLiveness`; `tests/test_run_sample.py` `test_bad_liveness` | Missing or other label → **STOP** naming the role. Never passed through, because the scorer would treat it as 1. Source is `record` only when the role points at a saved `ats:liveness` output; otherwise `your-input (fixture)`, flagged in the report. [TODO: APPROVE] |
| G4 **Timeline** | Every role has a factor in [0, 1] **and** the dates that produced it (days used, remaining, OPT end, today, deadline, lag, expected start) | Recompute Priya's deadline by hand: 2026-11-27 at `--today 2026-10-02` | Missing date → STOP. Factor 0 → listed as a drop with its dates. [TODO: APPROVE] |
| G5 Scorer | Scorer exits 0; `role-scores.json` parses; roles in = roles out | `node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir <scratch dir>` exits 0 (smoke test of the existing CLI) | Stop; keep the scorer's stderr in the run log |
| G6 Report | `run-log.json`, `report.md` and the audit exist; every value carries a source label; skip rate reported | `test -f` on the three files after a run | Stop; the run is not reportable |

Skip rate is reported, not gated. A healthy run skips at least half of the
roles it evaluates (`DOMAIN.md:8`).

**Liveness reasoning** (closes addition 10; uncertain = 0.5) (reasoning drafted with Claude, reviewed by Nishant):

> "I picked 0.5 because 'uncertain' means we don't know if the job is open, so
> it sits in the middle. But in my test, a job I knew was closed came back as
> uncertain, so 0.5 is probably too generous. For this version I'm keeping
> 0.5, because the gate already makes a person check every uncertain result.
> Next version, uncertain should probably count as 0 until someone confirms
> the job is still open."

The test referred to is liveness test 2
(`engine-runs/liveness-check-2-closed.txt`). There the checker reported
`navigation error: page.goto: Download is starting`: the page could not be
read at all.

## What this recipe can and cannot verify

| Can verify (from records or arithmetic) | Cannot verify |
|---|---|
| That a company's `top_job_titles_sponsored` list contains one of the target titles | Per-title approval counts; the CSV's approvals are per company |
| A company's recorded `Total Approvals`, `Total Denials` and `Approval_Rate` | Whether a company **absent** from the CSV sponsors. Wayfair is absent and can only ever be Unknown |
| That a typed company name is ambiguous across several legal entities (Deloitte → 7) | Which Deloitte entity actually employs a given posting's team |
| That a posting returned active / uncertain / expired on the date it was checked | That the posting is still open later, or that the team is actually hiring now |
| The timeline factor, as arithmetic on stated dates | Whether the persona is currently employed (the clock assumption); STEM eligibility; any immigration-law question. These go to a DSO or attorney (Ch.10 `:92`) |
| The composite and its per-term trace from the existing scorer | Current sponsorship **intent**; the record is a rear-view mirror (Ch.7 `:85`) |
| Recorded `latest_funding_*` values, shown as context | Salary or offer level |
| — | SOC code: the CSV has no SOC column, so role quality and local wage cannot be computed |
| — | Fit: the persona's own rating (your-input), not a verified fact |
| That the typed name matches a CSV row by name | **Same-name companies**: that the posting belongs to the company in that row. Searching "Affinity Solutions" jobs returns postings from Affinity (affinity.co), a different company from AFFINITY SOLUTIONS INC (Nishant's check; the closed posting in liveness test 2 is under `…/companies/affinity/…`) |
| That the liveness checker returned `uncertain` | That the job may still be open. **`uncertain` means the page could not be read**, not "maybe open": a known-closed posting came back `uncertain` with a navigation error (liveness test 2) |

## Facts that bite

- **Role quality is not used.** Its scorer weight is 0 (`role-scorer.mjs:37`),
  and the CSV has no SOC column to feed it. The highest possible vote sum is
  0.35 + 0.30 = 0.65.
- **`bls:local-wage` is not used.** It needs a SOC code and a metro
  (`DOMAIN.md:35`). This recipe has neither, and adjusted wages change no
  decision while the role-quality weight is 0 (`DOMAIN.md:61`).
- **Funding comes from the 80 Days CSV's own `latest_funding_amount / _stage /
  _date` fields, not from the SEC Form D samples** that ship in
  `data/sec/form-d/`. It is shown as context and not scored (addition 7).
- **The planned directories do not exist.** `data/raw/`, `data/verified/` and
  `logs/gate-decisions/` are absent (`DOMAIN.md:25`). Every gate output and
  decision goes in the run folder under
  `course/2026fa/submissions/nishant2681/runs/<run-id>/`.
- **The `snickerdoodle` CLI is roadmap, not runtime** (`DOMAIN.md:45`). The
  agent runs the commands in this file directly.
- **All recipes are DRAFT** (`DOMAIN.md:49`), and so is this one.
- **Missing votes are not renormalized** (`role-scorer.mjs:72-73,80`). Fit is
  therefore required. An Unknown tier drops sponsorship's 0.35 entirely, but
  the tier is still read and demotes an Apply to Consider (`:99-104`).
- **A missing gate defaults to 1** (`role-scorer.mjs:83-84`). This is why G3
  and G4 stop before the scorer runs.
- **The profile trap.** The scorer reads only `profile.authorization` (JSON),
  and any text matching `authorized` zeroes the sponsorship weight. It ignores
  the personas' `needs_sponsorship` field (`role-scorer.mjs:56-63`). The
  prototype writes `profile.json` with Priya's `visa.current_status` string,
  which the regex does not match.
- **The scorer stamps the real clock** in `generated` (`role-scorer.mjs:173`).
  `--today` fixes the gate arithmetic; the scorer's date field still varies.
- **`Approval_Rate` is on a 0–100 scale**, not 0–1.
- **Run-log conflict.** `recipes/_shared.md:93` says to log in
  `logs/RUN_LOG.md`, but students may not edit it (`CONTRIBUTING.md:13`). Logs
  go to `logs/runs/`.

## Output contract

All files go to `course/2026fa/submissions/nishant2681/runs/<run-id>/`, which
must not already exist. `--today YYYY-MM-DD` is required: the same inputs and
the same `--today` produce the same gate results.

**(a) Agent log: `run-log.json`.** These are the fields the code writes, as
in sample-2. A multi-match never reaches the log because it stops the run.
- `run_id`, `today`, `mode` (`sample`), `status`
- `inputs`: path + sha256 for `profile`, `jobs`, `csv` and `scorer`
- `target_titles`, `strong_fit {value, source}`
- `stops[]`
- `roles[]`, each with:
  - `role_id`, `company_typed`, `csv_company_name`, `title`, `url`
  - `sponsorship {company_name, tier, p, matched_titles, approvals, denials,
    approval_rate, reason, source}`
  - `funding {amount, stage, date, source, note}`
  - `fit {p, source}`
  - `liveness {label, factor, source, evidence_path, evidence_found}`
  - `timeline {factor, source, reasons, today, unemployment_days_used,
    unemployment_ceiling, remaining_days, opt_end_date, opt_end_known,
    deadline, full_credit_cutoff, hiring_lag_weeks, default_used,
    expected_start}`
  - `scorer {composite, recommendation, machine_recommendation, reason,
    arithmetic, source}`
  - `next_action {text, source}`
- `scorer {command, exit_code, ran_in, renamed_to, gate_zero, generated, note}`
- `outputs[]`

**(b) Human report: `report.md`.** Opens with an executive summary. Reader:
the candidate. Decision enabled: which roles get today's two application hours,
which get networking, which get dropped. Per-role columns:
- company and title
- tier, approvals, rate
- funding context
- fit
- liveness and its evidence
- timeline factor and its dates
- composite
- decision and next action

Then the timeline dates per role, the scorer's arithmetic per role, and what
the report cannot tell the reader. Every input value shows its source:
`record`, `model-judgment` or `your-input`. The report states the counted
number of `model-judgment` values (0 in sample-2; fit is `your-input`).
Values computed by the existing scorer (composite, decision) are labeled
`scorer output`, and the report says so in one line.

**(c) Audit: `<run-id>-audit.md`.** Counts of roles in and scored, no-match,
multi-match, Unknown, liveness-gated, timeline-gated, and each tier.

**Intermediates** (kept for traceability):
- `scorer-input/roles.json` and `scorer-input/profile.json`, the scorer's
  inputs;
- `scorer/role-scores.json` and `scorer/role-scores.md`, the scorer's own
  outputs.

## Stop conditions and next actions

Stop, write no score, and do not invent a value when:
- a required file is missing, or the jobs file is malformed JSON;
- a profile date or day count is missing (never filled in with a plausible
  value);
- a company matches more than one CSV row (the human picks);
- a liveness label is missing or not one of the three;
- `--out-dir` already exists;
- the scorer exits nonzero, returns a different set of roles, or reads the
  profile as not needing sponsorship. In these cases `<out-dir>.partial/` is
  kept with the failure logged, and the run exits 1.

Every validation stop is collected and printed with its `role_id` before
exiting 2, so the human sees all problems at once.

Next action per result, tied to the 3-3-2 day (Ch.2 `02-…md:39`):

| Result | Next action |
|---|---|
| Apply | Tailor an application. This role gets part of the day's **2 application hours** |
| Consider | **Network into the company first** (the 3 networking hours); apply only after a contact confirms the role and sponsorship |
| Skip | Drop it. The report shows the reason (closed gate with its dates, or composite below the band) |
| Unknown tier with fit ≥ `STRONG_FIT` (0.7, your-input) and a decision other than Skip | **Network, don't apply yet**: find a direct sponsorship signal first. Unknown is not Avoid (Ch.7 `:137`). A Skip stays Drop; the scorer's decision is never changed |

**STRONG_FIT reasoning** (closes addition 11; value 0.7) (reasoning drafted with Claude, reviewed by Nishant):

> "0.7 means I match most of what the job asks for, maybe missing one or two
> things. Below that, it's not worth spending networking time on a role I
> probably won't get. This number is my own judgment, not based on data, which
> is why it's labeled your-input."

## Run-log template

Write one file per run at `logs/runs/2026fa-nishant2681-<n>.md`. Based on
`recipes/_shared.md:104-112`; never in `logs/RUN_LOG.md`.

```markdown
## YYYY-MM-DD — nishant2681-data-analytics-opt-h1b sample run <n>

- **Recipe:** nishant2681-data-analytics-opt-h1b v0.1.0 (status at run time: ___)
- **Run id / --today / mode:** ___ / YYYY-MM-DD / sample
- **Inputs:** CSV, profile, jobs file (paths + sha256 from run-log.json)
- **Outputs:** runs/<run-id>/run-log.json, report.md, <run-id>-audit.md, scorer-input/{roles,profile}.json, scorer/role-scores.{json,md}
- **Gate results:** G0 ___ · G1 ___ (multi-match picks: ___) · G2 ___ · G3 ___ · G4 ___ · G5 ___ · G6 ___
- **Result:** Apply ___ · Consider ___ · Skip ___ (skip rate ___%)
- **Gates cleared by:** ___ (name, date)
- **Open issues:** what did not work or is still missing
- **Note:** logged here, not in logs/RUN_LOG.md (CONTRIBUTING.md:13 vs recipes/_shared.md:93)
```

No secrets, real emails or private application notes (`recipes/_shared.md:114-115`).
