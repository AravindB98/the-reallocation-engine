---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "SPECIFIED -> RUNNABLE-SAMPLE (sample run 2026-10-20-sample-3, audit read, gates G1, G3, G4 signed), approved by nishant2681 (GitHub handle), 2026-10-20, logs/runs/2026fa-nishant2681-2.md; earlier: DRAFT -> SPECIFIED same day, same log"
attestation: null
recipe_version: 0.2.0
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

**Status.** RUNNABLE-SAMPLE, version 0.2.0 (promoted by Nishant on
2026-10-20, DRAFT → SPECIFIED → RUNNABLE-SAMPLE; logged in
`logs/runs/2026fa-nishant2681-2.md`). Version 0.1.0 completed a sample run on
fictional jobs (Apply 1 · Consider 4 · Skip 3), and the three gate sign-offs
that need a person are logged in `logs/runs/2026fa-nishant2681-1.md`. Version
0.2.0 closes the last two open items:
- funding stays shown but not scored, by the candidate's decision;
- employers missing from the main dataset are now looked up in the federal
  USCIS FY2022 H-1B employer file, where the best possible rating is
  "Possible", because that file has no job titles.

No typed TODOs are open. The version 0.2.0 sample run of 2026-10-20 gave
Apply 1 · Consider 4 · Skip 3; Nishant read its audit and signed its three
human gates. The next stage, RUNNABLE-LIVE, needs a run on real postings with
every gate cleared live. The status moves up only with that evidence, never
by editing this header.

Two customers: this file is for the agent; the `.card.md` twin is for the
human.

## Run record

- Recipe version 0.1.0, written 2026-10-02 from
  `course/2026fa/submissions/nishant2681/CHANGE-BRIEF.md` (committed `43020cf`).
  Every threshold below is copied from that brief; none is new. Thresholds
  marked **[VERIFY]** are proposals awaiting human review.
- **Recipe version 0.2.0, 2026-10-20:** additions 7, 13 and 14 closed (see
  Proposed additions); the closure batch and the scope change for addition 7
  are logged in `logs/runs/2026fa-nishant2681-2.md`. The USCIS rules (tier cap,
  exact match, grouping, initial approvals only) are Nishant's decisions of
  2026-10-20, quoted below; none is new beyond them.
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
  its scorer command cited `.partial` staging paths. Both are kept. **Both
  were produced by version 0.1.0**, before the USCIS fallback; in them Wayfair
  is Unknown.
- **Version 0.2.0 run (2026-10-20):**
  `course/2026fa/submissions/nishant2681/runs/2026-10-20-sample-3/`, exit 0,
  8 roles: Apply 1 · Consider 4 · Skip 3. Wayfair is now Possible [USCIS
  FY2022]. Audit read and gates G1, G3 and G4 signed by nishant2681,
  2026-10-20. This is the RUNNABLE-SAMPLE evidence; logged in
  `logs/runs/2026fa-nishant2681-2.md`.
- **Tests:** 58 offline `unittest` tests pass in version 0.2.0 (45 from
  0.1.0 plus 13 for the USCIS fallback)
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
| Fallback sponsorship record (USCIS FY2022) | `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv`: 4 rows (WAYFAIR LLC, Tax ID 8108) cut from the USCIS H-1B Employer Data Hub FY2022 export by `extract_uscis.py`; provenance in `fixtures/uscis-fy2022.extract.provenance.md`. Used only when the 80 Days CSV has no row | record (`dataset: USCIS FY2022`) | Columns `Employer`, `Tax ID`, `Initial Approval`, `Initial Denial` present; extract sha256 matches the provenance note |
| Persona (fictional) | `search/examples/priya-nair/profile.yml` | your-input | Only F-1/OPT persona that does not trip the scorer's sponsorship check (findings, Follow-up 4) |
| Composite scorer (Ch.11) | `scripts/score/role-scorer.mjs`, run as `npm run score -- <roles.json> --profile <profile.json> --out-dir <run dir>` (`package.json:15`) | — | Called as CLI only; it runs `main()` on load (`role-scorer.mjs:185`) |
| Liveness checker (Job-Ops) | `scripts/ats/check-liveness.mjs`, run as `npm run ats:liveness -- <url>` (`package.json:18`); classifier `scripts/ats/liveness-core.mjs:49` | record | Needs Playwright + network; returns a label, not a number |
| Scorer input shape | `data/examples/ch11-roles.json` | — | Field names match `role-scorer.mjs:76-87` |
| Tier vocabulary / formula | `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md:36,59-61` | — | Thresholds unpinned there |
| Timeline concept | `book/chapters/10-the-visa-timeline-manager.md:30,52,65` | — | No formula there |
| 3-3-2 day | `book/chapters/02-the-reallocation-principle.md:39` | — | 2 h apply · 3 h network · 3 h portfolio |
| Target titles | Data Scientist, Data Analyst, Machine Learning Engineer, Analytics Engineer, Data Engineer, Business Analyst, Business Intelligence, Automation Analyst | your-input | Fixed before any run |

**Prototype command.** **Closed (DEV)**. Version 0.1.0 ran it without
`--uscis` to produce `runs/2026-10-02-sample-2/` (exit 0). Version 0.2.0
requires `--uscis`, so a run cannot silently skip the fallback. For a new run,
change `--today`, `--run-id` and `--out-dir`; an existing folder is never
overwritten.

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --uscis   scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv \
  --today   YYYY-MM-DD \
  --run-id  <run-id> \
  --out-dir course/2026fa/submissions/nishant2681/runs/<run-id>
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
| 6 | Fixture harness for the six predicted failure cases (brief §6) | Each stop must be shown to fire, not assumed | **Closed (DEV)**: all 6 brief §6 cases are tested. Not in CSV → `test_unknown_no_csv_match_wayfair`; blank H-1B → `test_unknown_no_h1b_record`; deadline passed → `test_days_exhausted`, `test_opt_ended`; multi-match → `test_ambiguous_company`; liveness missing/invalid → `test_missing_label_raises`, `test_bad_liveness`; input missing/malformed → `tests/test_run_sample.py` `TestMissingInputs` (`test_missing_jobs_file`, `test_missing_profile_file`, `test_missing_csv_file`: exit 2, path named, nothing written) and `test_malformed_json`. Also `test_existing_out_dir_refused` |
| 7 | ~~Fold funding recency into sponsorship p (Ch.7 weight 0.20, `07-…md:36`)~~ → **Funding weight in sponsorship p** (retyped from DEV to DEFINE by Nishant, 2026-10-20) | ~~Future work; funding is context-only in this version~~ → Ch.7 proposes 0.20; this recipe sets it | ~~**Open**: not built (typed DEV)~~ → **Closed (DEFINE)**: value **0**, funding stays context-only (`run_sample.funding_context`, report "context only, not scored"); reasoning under "Funding reasoning" below; scope change signed in `logs/runs/2026fa-nishant2681-2.md` |
| 8 | `fixtures/jobs.sample.json` | No job list exists in the repo for this persona | **Closed (DATA SOURCE)**: file exists. *Provenance:* fictional postings (your-input) written 2026-10-02 for the sample run; company names are real rows in the 80 Days CSV; URLs on example.com; liveness labels typed |
| 9 | Reasoning for each tier threshold and p value | TODO closure needs the reasoning | **Closed (DEFINE)**: see "Tier reasoning" below |
| 10 | Reasoning for the liveness mapping | Same closure rule | **Closed (DEFINE)**: see "Liveness reasoning" under Phase gates |
| 11 | The "strong fit" cutoff that sends an Unknown-tier role to networking | The brief named the rule but gave no number | **Closed (DEFINE)**: `STRONG_FIT = 0.7` in `run_sample.py`; reasoning under Stop conditions |
| 12 | Report columns, reader and decision | Report-field closure needs all three | **Closed (REPORT FIELD)**: all three are stated in the Output contract and present in sample-2 `report.md` |
| 13 | A second sponsorship source for companies missing from the CSV: the USCIS H-1B Employer Data Hub or DOL OFLC LCA disclosure files, applied to employers **outside** the Form D company list (see note below) | Large sponsors can be missing entirely (Wayfair, TouchCare) | **Closed (DATA SOURCE)**: file exists at `fixtures/uscis-fy2022.extract.csv`. *Provenance:* USCIS H-1B Employer Data Hub FY2022 archive export (`https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2022.csv`), downloaded 2026-10-20, 4,040,115 bytes, sha256 `692cc11c…5f879`; full details in `fixtures/uscis-fy2022.extract.provenance.md`. USCIS was chosen over DOL LCA by Nishant (CSV, no login, no personal contact columns) |
| 14 | Wire the USCIS extract into the matcher: used only when the 80 Days CSV has 0 rows; exact match after normalizing; rows grouped by name + Tax ID; initial approvals only; tier capped at Possible (rules below) | Wiring is code, so it is its own DEV item (added 2026-10-20) | **Closed (DEV)**: `sponsorship.load_uscis_rows`, `find_uscis_employer`, `assign_uscis_tier`; `run_sample.sponsorship_for` and required `--uscis`; `extract_uscis.py`; `tests/test_uscis.py` (11 tests, incl. the break attempt on `fixtures/BROKEN-uscis-no-cap.py`) and `tests/test_run_sample.py` `test_uscis_role_capped`, `test_missing_uscis_file`. *Handoff condition:* a role with no 80 Days row gets a USCIS tier no higher than Possible, labeled `USCIS FY2022`, and the cap test catches the mutant. Met: 58/58 tests pass |

**Why addition 13 is needed.**
- **What the repo records:** the 80 Days CSV starts from a list of companies
  that filed SEC Form D, which was then mapped to DOL LCA and USCIS H-1B data
  (`data/80-days-to-stay/README.md:13,170`). A company that is not on that
  Form D list is not in the CSV at all, so a large public employer can be
  missing entirely. Wayfair and TouchCare (a live Greenhouse posting checked
  in liveness test 1) both have 0 rows in the CSV. (Version 0.1.0 said
  "public companies don't file Form D"; that was broader than the record
  shows and is corrected here.)
- **Nishant's external check, not verified from repo data:** Wayfair is a
  heavy H-1B sponsor, including for Data Scientist, BI Analyst and Data
  Analyst titles.
- **What the USCIS record now shows (version 0.2.0):** WAYFAIR LLC, Tax ID
  8108, 4 address rows in FY2022: 78 initial approvals, 2 initial denials
  (plus 540 continuing approvals, context only). That confirms Wayfair
  sponsors. It does not confirm the data titles: the USCIS file has no job
  titles, so Wayfair is rated Possible, not Likely or Proven.

**Sponsorship tier and p (record), copied from the brief.**
`Approval_Rate` is stored 0–100; the brief's original 0.90 was corrected to 90
before the first commit.

| Tier | Rule | p |
|---|---|---|
| Proven | title match AND `Total Approvals` ≥ 10 AND `Approval_Rate` ≥ 90 [VERIFY] | 0.9 |
| Likely | title match AND `Total Approvals` ≥ 1 [VERIFY] | 0.6 |
| Possible | H-1B record present, no title match [VERIFY] | 0.3 |
| Unknown | CSV row with H-1B fields blank (`no-h1b-record`) | omitted (never 0) |
| Possible (USCIS FY2022 only) | **no CSV row**, exact USCIS match, `Initial Approval` summed over the employer's rows ≥ 1. Capped: never Likely or Proven | 0.3 |
| Unknown (USCIS FY2022, 0 approvals) | no CSV row, USCIS match with 0 initial approvals (`uscis-zero-approvals`); the report shows "USCIS FY2022: initial approvals 0" as context | omitted (never 0) |
| Unknown (neither source) | no CSV row and no USCIS match (`no-match-either-source`) | omitted (never 0) |
| Avoid | not used: neither source can prove non-sponsorship | — |
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

**Funding reasoning** (closes addition 7 as DEFINE, value 0; decided by
Nishant 2026-10-20) (reasoning drafted with Claude, reviewed by Nishant):

> "Funding recency stays context-only: Form D funding shows whether a startup
> has money, not whether it sponsors visas, and Wayfair has no row in the
> Form D-based CSV, so scoring funding would penalize the sponsors #13 adds."

Checked: Wayfair has 0 rows in the 80 Days CSV (`test_wayfair_not_found_returns_none`;
`extract_uscis.py` output "missing from the 80 Days CSV: Wayfair").

**USCIS fallback rules** (addition 14; decided by Nishant 2026-10-20; each
quoted exactly) (reasoning drafted with Claude, reviewed by Nishant):

- *Tier cap: a USCIS-only match reaches at most Possible.*
  > "USCIS counts approvals across all occupations at the employer, not data
  > roles, so it shows the company sponsors, not that it sponsors this role."

  Checked: USCIS's guide to the Data Hub says there is no job title field.
- *Matching: exact after normalizing case, punctuation and legal suffixes; no
  fuzzy match; more than one employer goes to the human gate.*
  > "a fuzzy match could attach another company's sponsorship history, the
  > worst error for this user."
- *Grouping: rows with the same normalized name and Tax ID (last 4 digits) are
  summed; the gate fires only when one name has different Tax IDs.*
  > "one employer gets one row per address, so separate rows aren't separate
  > companies."

  Checked: WAYFAIR LLC has 4 FY2022 rows, all Tax ID 8108.
- *Zero approvals → Unknown, not Possible, with the count shown as context.*
  > "filing without success isn't evidence the employer can sponsor."
- *p for a USCIS-only Possible: 0.3, the same as the 80 Days Possible tier.*
  > "the cap means it's the same strength of evidence, so it gets the same
  > number."
- *Scope: the USCIS lookup is used only when the 80 Days CSV returns 0 rows;
  the CSV matcher is unchanged.*
- *Which approvals count: `Initial Approval` only.* Nishant first chose New
  Employment + Change of Employer, with this reason:
  > "those are petitions for workers new to that employer, which is this
  > user's situation; Continuation and Amended cover people already working
  > there."

  The downloaded files have no such columns. They give only `Initial` and
  `Continuing` totals, and USCIS's guide does not say which petition types
  each total contains. On 2026-10-20 Nishant chose `Initial Approval` only:
  > "Initial approvals count petitions for initial employment, the closest
  > column this file has to new hires like a student moving from OPT;
  > Continuing appears to cover people already employed there, though USCIS
  > does not define the split."

  Continuing counts are kept in the run log as context and never scored.
- *Which year: FY2022, not FY2023.* Nishant chose this on 2026-10-20. The
  FY2023 export was last modified 2023-05-31, before FY2023 ended
  (2023-09-30), and is about half the size of FY2022 (2,202,574 vs 4,040,115
  bytes). It is therefore probably a partial year that misses the spring cap
  season. That is an inference from the file dates and sizes, not a USCIS
  statement. In it Wayfair has 0 initial approvals.

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

Worked example, Priya Nair, `--today 2026-10-20` (sample run 3):
- 34 of 90 days used (`profile.yml:22-23`), so 56 remain.
- Deadline = min(2026-12-15, 2027-01-31) = **2026-12-15**; full-credit
  cutoff 2026-11-15.
- A 3-week lag starts 2026-11-10, so the factor is **1.0**. A 4-week lag
  starts 2026-11-17: (2026-12-15 − 2026-11-17) / 30 = 28 / 30 = **0.933**.
  The 12-week default starts 2027-01-12, after the deadline, so the factor
  is **0**. Only slow processes are gated out; this is a real finding, not a
  bug.
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
| G1 Company match | Each role's company resolves to 0 or 1 CSV rows; if 0, to 0 or 1 USCIS employers (one Tax ID) | Ambiguity evidence: `python3 -c "import csv; print(sum('deloitte' in r['company_name'].lower() for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', encoding='utf-8'))))"` → 7; USCIS: `tests/test_uscis.py` `test_two_tax_ids_go_to_the_gate` | 0 CSV rows → USCIS lookup (exact normalized name only). **One name with several USCIS Tax IDs → STOP**: list each `name (Tax ID ####)`; the human's pick is recorded as `uscis_tax_id`. No match in either → Unknown (`no-match-either-source`). **More than 1 CSV row → STOP**: list every candidate row (name, approvals, rate) for the human to pick. The pick is recorded in the jobs file as `csv_company_name`; never chosen silently. **Closed (APPROVE)**: logged gate decision in `logs/runs/2026fa-nishant2681-1.md`, nishant2681, 2026-10-02 (DELOITTE CONSULTING LLP chosen) |
| G2 Sponsorship record | Tier and p follow the table above exactly; a USCIS-only tier is never above Possible | `tests/test_sponsorship.py` `TestAssignTier`; `tests/test_uscis.py` `TestAssignUscisTier`, `test_cap_check_catches_mutant` | Blank H-1B fields → Unknown (`no-h1b-record`), p omitted; a blank or non-numeric USCIS count → STOP |
| G3 **Liveness** | Every role has a label in {active, uncertain, expired}; factor 1.0 / 0.5 / 0.0 | `tests/test_gates.py` `TestLiveness`; `tests/test_run_sample.py` `test_bad_liveness` | Missing or other label → **STOP** naming the role. Never passed through, because the scorer would treat it as 1. Source is `record` only when the role points at a saved `ats:liveness` output; otherwise `your-input (fixture)`, flagged in the report. **Closed (APPROVE)**: logged gate decision in `logs/runs/2026fa-nishant2681-1.md`, nishant2681, 2026-10-02 |
| G4 **Timeline** | Every role has a factor in [0, 1] **and** the dates that produced it (days used, remaining, OPT end, today, deadline, lag, expected start) | Recompute Priya's deadline by hand: 2026-12-15 at `--today 2026-10-20` (sample run 3) | Missing date → STOP. Factor 0 → listed as a drop with its dates. **Closed (APPROVE)**: logged gate decision in `logs/runs/2026fa-nishant2681-1.md`, nishant2681, 2026-10-02 (deadline 2026-11-27 recomputed by hand) |
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
| A company's recorded `Total Approvals`, `Total Denials` and `Approval_Rate` | Whether a company absent from **both** sources sponsors: it stays Unknown, which is not "doesn't sponsor" |
| For a company absent from the CSV, its USCIS FY2022 initial approvals and denials (Wayfair: 78 and 2) | Whether that company sponsors **data roles**: the USCIS file has no job titles, so the tier is capped at Possible |
| — | Whether a USCIS-only company sponsors **now**: FY2022 is not current. FY2023 exists but is probably a partial year |
| — | USCIS counts beyond what they are: they count workers, USCIS's first decision only, and are filed under the petitioner's mailing address, not the worksite. Which petition types make up "Initial" is not stated by USCIS |
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
  `data/sec/form-d/`. It is shown as context and not scored: its weight in
  sponsorship p is 0 by Nishant's decision (addition 7).
- **The absent sponsor.** Wayfair has 0 rows in the 80 Days CSV because that
  CSV is built from Form D filers. In version 0.1.0 it could only be Unknown.
  The USCIS FY2022 record shows 78 initial approvals for WAYFAIR LLC, so
  version 0.2.0 rates it Possible. The shape of the error: a heavy sponsor
  looks like a stranger because of which list the dataset started from. It is
  hardest to catch for a candidate who reads Unknown as "doesn't sponsor".
  TouchCare is a second example (0 CSV rows; it is not in the sample, and no
  posting was invented for it).
- **The planned directories do not exist.** `data/raw/`, `data/verified/` and
  `logs/gate-decisions/` are absent (`DOMAIN.md:25`). Every gate output and
  decision goes in the run folder under
  `course/2026fa/submissions/nishant2681/runs/<run-id>/`.
- **The `snickerdoodle` CLI is roadmap, not runtime** (`DOMAIN.md:45`). The
  agent runs the commands in this file directly.
- **All core recipes are DRAFT** (`DOMAIN.md:49`). This one reached
  RUNNABLE-SAMPLE on 2026-10-20, on fictional postings only; it is not
  RUNNABLE-LIVE.
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
- `inputs`: path + sha256 for `profile`, `jobs`, `csv`, `uscis` and `scorer`
- `target_titles`, `strong_fit {value, source}`
- `stops[]`
- `roles[]`, each with:
  - `role_id`, `company_typed`, `csv_company_name`, `title`, `url`
  - `sponsorship {company_name, tier, p, matched_titles, approvals, denials,
    approval_rate, reason, source, dataset}`; `dataset` is `80 Days CSV`,
    `USCIS FY2022`, or null when neither source matched. A USCIS-only tier
    also carries `uscis {tax_id, rows, continuing_approvals,
    continuing_denials, note}`, with `approvals`/`denials` being initial
    counts and `approval_rate` null
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
- company and title (plus the matched USCIS employer when the tier came from
  USCIS)
- tier, approvals, rate; for a USCIS-only tier: `record: USCIS FY2022`, the
  cap, and the initial approvals and denials
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

**(c) Audit: `<run-id>-audit.md`.** Counts of roles in and scored, no CSV
row, matched in USCIS FY2022, USCIS with 0 initial approvals, no match in
either source, multi-match, Unknown, liveness-gated, timeline-gated, and each
tier.

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
- a company matches more than one CSV row, or (with no CSV row) one USCIS name
  with several Tax IDs (the human picks);
- the USCIS file lacks a required column, or a USCIS count is blank or not a
  whole number;
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

- **Recipe:** nishant2681-data-analytics-opt-h1b v0.2.0 (status at run time: ___)
- **Run id / --today / mode:** ___ / YYYY-MM-DD / sample
- **Inputs:** CSV, USCIS FY2022 extract, profile, jobs file (paths + sha256 from run-log.json)
- **Outputs:** runs/<run-id>/run-log.json, report.md, <run-id>-audit.md, scorer-input/{roles,profile}.json, scorer/role-scores.{json,md}
- **Gate results:** G0 ___ · G1 ___ (multi-match picks: ___; USCIS Tax ID picks: ___) · G2 ___ · G3 ___ · G4 ___ · G5 ___ · G6 ___
- **Result:** Apply ___ · Consider ___ · Skip ___ (skip rate ___%)
- **Gates cleared by:** ___ (name, date)
- **Open issues:** what did not work or is still missing
- **Note:** logged here, not in logs/RUN_LOG.md (CONTRIBUTING.md:13 vs recipes/_shared.md:93)
```

No secrets, real emails or private application notes (`recipes/_shared.md:114-115`).
