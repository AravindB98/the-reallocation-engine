---
status: DRAFT
todos_open: 5
last_gate: "sample-run completed 2026-10-02, logs/runs/2026fa-arundhatik26-1.md — not a lifecycle promotion: 5 typed TODOs are still open, so this cannot be SPECIFIED, and SPECIFIED must come before RUNNABLE-SAMPLE"
attestation: null
recipe_version: 0.1.0
---

# coop-sponsor-swe-15-1252 — will this co-op lead to a sponsored software job?

## Executive summary

**What it does.** For a student on an F-1 visa who is choosing a co-op, this recipe checks each employer against government sponsorship records. The question is whether the company has a recorded history of sponsoring *software* jobs, not just any job. A co-op there then has a real path to a full-time job that can sponsor a work visa after graduation. It also checks that the posting is real and that the co-op fits before graduation, under each graduation date the student might end up with.

**Who it is for.** A second-semester international master's student in Information Systems (or a similar program), looking for a software developer or full-stack co-op, who is not sure yet whether they will graduate in December 2027 or April 2028.

**What it decides.** Each role gets one of five next actions:
- **tailor an application**
- **network first** (strong sponsor, but no confirmed live posting)
- **network to ask** (no record either way)
- **a human must check the company match**
- **skip**

When there is no record, it says "unknown" and sends you to ask a person. It never treats a missing record as "no."

**What it cannot do.** It cannot tell you whether a company that is missing from the dataset sponsors. It cannot tell whether a company sponsored software roles outside its top few listed titles. It cannot tell whether the immigration timing rules it assumes are current. A human confirms every company match and makes every final decision.

---

## Technical header

| Field | Value |
|---|---|
| Agent twin of | `recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.card.md` (human card) |
| Prototype | `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py` |
| One command | `python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py` |
| Test | `python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v` |
| Engine layers | 80 Days to Stay (sponsorship), Cognitive Pivot (BLS occupation row), Job-Ops (liveness) |
| Data mode | **sample**: a fictional persona, real repo data, and one real liveness check |
| Related earlier case | `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md` (DRAFT template, no script; this recipe narrows it to co-op conversion and makes it run) |

## Purpose

Most sponsorship lookups answer "does this company sponsor?" For a co-op student, that is the wrong question in two ways:

1. **Co-op on CPT needs no sponsorship.** The visa question arrives later, at full-time conversion and the H-1B lottery. So the useful question is about the *employer's* track record for the *kind of work* the student would convert into.
2. **"Sponsors" is not "sponsors software."** A bank can sponsor hundreds of analysts and no developers. The 80 Days CSV records each company's *top* sponsored titles (`top_job_titles_sponsored`). Nothing in the repo reads that column per role. This recipe does.

## Source inventory

All paths were checked as present on 2026-10-02.

| Source | Path / command | Used for | Label |
|---|---|---|---|
| 80 Days master CSV (30,369 rows; SHA-256 `eccdee2a…cfdae6270`) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `Total Approvals`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date`, `median_salary_offered` | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | `annual_median_wage`, `oews_year` for SOC 15-1252 / 15-1254 (context only) | record |
| Liveness checker | `npm run ats:liveness -- <url> [url…]` → `scripts/ats/check-liveness.mjs` | saved output is parsed for `active` / `expired` / `uncertain` | record |
| Existing scorer | `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>` (the prototype calls it once per scenario) | composite, Apply / Consider / Skip, per-term trace | computed |
| Input shape reference | `data/examples/ch11-roles.json` | the `roles.json` shape | — |
| Persona input | `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/sample-persona.json` | companies, titles, SOC, fit, co-op dates, graduation scenarios, rules | your-input |
| Saved liveness record | `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/liveness-2026-10-02.txt` | real `ats:liveness` output from 2026-10-02 | record |

**Not used, and why:**
- **Form D samples** (`data/sec/form-d/processed/sample/`): only 200 filings, and none of the persona's target employers are in them. The funding date shown comes from the CSV's `latest_funding_date` column instead.
- **`npm run bls:local-wage`**: it fails on a fresh clone (no `.venv`), and the scorer reads no wage anyway.
- **`scripts/sec/validate-h1b-join-sample.py`**: it needs the full Form D data, which a fresh clone doesn't have.

## Inputs (all `your-input`)

| Field | Meaning | Required |
|---|---|---|
| `persona` | fictional persona string, `@example.com` only | yes |
| `as_of` | ISO date the run is "as of" (fixed, so reruns reproduce) | yes |
| `rules.proven_min_approvals`, `p_proven`, `p_likely`, `p_sponsors_not_software` | the tier → probability mapping | yes |
| `scenarios[]` | `name`, `graduation` (ISO), `opt_months`, `stem_months` | yes, ≥1 |
| `roles[]` | `role_id`, `company`, `match_names[]`, `title`, `soc`, `fit` ∈ [0,1], `coop_start`, `coop_end`, optional `posting_url` or `liveness_manual` | yes, ≥1 |
| `liveness_record` | path to saved `ats:liveness` output | optional |

## Steps

1. **Validate the input** (gate G1). Any missing field, a fit outside [0,1], or a non-ISO date stops the run with `✗ stopped: <reason>` and exit 2. No output is written.
2. **Resolve each company** (gate G2). Strip punctuation and legal-form words (`INC`, `CORP`, `LLC`…), then require an **exact** match against any of `match_names`. There is no substring or fuzzy matching. Outcomes:
   - `matched`: exactly one row with approvals > 0
   - `no-sponsorship-record`: one row, approvals blank or 0
   - `not-in-dataset`: no row
   - `ambiguous`: more than one row; 209 normalized names repeat in the CSV
3. **Tier the sponsorship.** Applies to `matched` rows only:
   - a software title in the top titles **and** approvals ≥ `proven_min_approvals` → **Proven** (`p_proven`)
   - a software title with fewer approvals → **Likely** (`p_likely`)
   - approvals but no software title → **Possible** (`p_sponsors_not_software`)

   "Software title" means the regex `software|full-stack|back-end|front-end|developer|programmer|application development`. **Threshold: `proven_min_approvals` = 100** (set by the student on 2026-10-03, raised from a first guess of 50). Reason, in her words as chosen: her targets are big employers anyway, so 100 still includes them. Re-running at 100 changed no result in the sample (BNY 704, Databricks 1,640, Stripe 1,250). **Probabilities:** 0.9 (Proven) and 0.6 (Likely) copy the values in `data/examples/ch11-roles.json`. **[TODO: DEFINE]** 0.3 for "sponsors, but no software title" is still a first guess with no reasoning recorded.
4. **Liveness** (gate G3). If `posting_url` is in the saved checker output, `active` gives 1.0 and `expired` or `uncertain` gives 0.0 (record). Otherwise, a typed-in `liveness_manual` gives 1.0 or 0.0 (your-input). Otherwise the result is **unchecked, factor 0.0 (fail-closed)**. The prototype never leaves liveness out, because the scorer quietly treats a missing liveness as 1.0.
5. **Timeline**, per scenario (gate G4). The gate is closed if any of these hold:
   - graduation ≤ `as_of`
   - co-op start < `as_of`
   - co-op end > graduation (CPT requires enrolment)
   - end < start

   Factor 1.0 if open, 0.0 if closed. No partial values are invented. The OPT end, STEM OPT end and March-lottery count are reported as `your-input` arithmetic. **[TODO: DATA SOURCE]** Save the current USCIS OPT / STEM OPT / H-1B registration rules as a dated file in the repo, then cite it here. Until then the 12 / 24 months and "March" are assumptions.
6. **Score.** Write `<out>/<scenario>/roles.json` in the `ch11-roles.json` shape and run the **existing** scorer once per scenario. Unknown sponsorship is sent as `{"tier": "Unknown"}` **with no `p`**, so no 0.0 is invented. Fit is sent as `your-input`; no model is called.
7. **Next action** (gate G5 is the human's). The rules are applied in this order:
   - `ambiguous` → **HUMAN CHECK (G2)**
   - `not-in-dataset` / `no-sponsorship-record` → **NETWORK** (ask an alum or recruiter)
   - closed liveness on a Proven or Likely sponsor → **NETWORK, DON'T APPLY YET**
   - scenarios disagree → **DEPENDS ON GRADUATION DATE**
   - any Apply → **TAILOR APPLICATION**
   - any Consider → **CONSIDER**
   - otherwise **SKIP**
8. **Write the outputs** (contract below) and the run-log entry in `logs/runs/`.

## Phase gates (hard stops)

| Gate | Testable condition | Fail → | Who clears it, and what they see |
|---|---|---|---|
| G1 input | `validate_input` passes; every date parses as ISO | stop, exit 2, nothing written | machine |
| G2 company match | status `matched`, **and** a human confirms the CSV row (`csv_line`, `csv_name`) is this employer | `ambiguous` → HUMAN CHECK; `not-in-dataset` / `no-sponsorship-record` → NETWORK | **human**: compares the `csv_name` and `csv_line` printed in `run-log.json` with the employer; records the result in the `logs/runs/` entry |
| G3 liveness (gate) | factor = 1.0 from a record or a dated manual check | factor 0 → Skip (gated) | **human**: re-opens the URL if the result was `uncertain`. The checker returned `uncertain`, not `expired`, for a fabricated Greenhouse job id |
| G4 timeline (gate) | open under the scenario the student actually expects | factor 0 → Skip (gated) for that scenario | **human**: decides which graduation scenario is real |
| G5 decision | `report.md` exists; every term in each `role-scores.json` trace has a source label | — | **human**: decides apply / network / skip. The tool never applies |

`logs/gate-decisions/` does not exist. Gate decisions are recorded in the run's `logs/runs/2026fa-arundhatik26-<n>.md` entry.

## What it can and cannot verify

| Can verify (record) | Cannot verify |
|---|---|
| A CSV row with this exact normalized name exists, at a stated line, in a file with a stated SHA-256 | That the row *is* this employer (G2 is human) |
| Its `Total Approvals`, `Approval_Rate`, top sponsored titles, funding date | Whether software roles were sponsored **outside the top titles**. **[TODO: DEV]** A per-SOC count from DOL LCA disclosure data would replace the top-titles proxy |
| Whether a title in that list matches the software regex | Whether the company sponsors *co-op conversions*, or will sponsor *this* student |
| What `ats:liveness` printed for a URL on a date | Liveness for Workday-hosted boards (BNY Mellon's careers site) through a supported provider. **[TODO: DEV]** Add a Workday provider to `scripts/ats/`, or document that the generic Playwright check is the only one |
| The national median wage for the SOC (OEWS 2024) | What this employer pays. The wage also changes **no** decision, because the scorer's `role_quality` weight is 0.0 |
| — | Whether a company **missing** from the CSV sponsors. JPMorgan Chase, Goldman Sachs and Morgan Stanley are all absent: the CSV is built from Form D filers, and large public banks rarely appear |
| — | That two legal names are the same company (e.g. `SOFI TECHNOLOGIES INC`, blank, vs `SOCIAL FINANCE INC`, 182 approvals). **[TODO: DEV]** An alias table with a provenance note per alias |
| — | The OPT / STEM OPT / lottery rules (see the DATA SOURCE TODO in step 5) |

**Facts from the assignment that apply, and how this recipe handles them:**
1. **`role_quality` weight is 0.0.** The wage is shown as context only and never sent to the scorer, so no reader thinks it moved a decision.
2. **`bls:local-wage` feeds nothing.** Not used; the reason is stated above.
3. **Only Form D samples ship.** Funding comes from the CSV column instead. The run says which data it used, with hashes.
4. **Planned directories don't exist.** Every path above exists; gate decisions go to `logs/runs/`.
5. **The `snickerdoodle` CLI doesn't run.** Not referenced.
6. **`validate-h1b-join-sample.py` needs full data.** Not used.

## Output contract

Two files, two readers.

**`<out>/run-log.json`** (for the agent). The top-level keys are:
- `_tool`
- `persona`, `as_of` (labeled)
- `inputs`: the paths and SHA-256 of both CSVs, the liveness record path, and the labeled rules
- `scenarios`: graduation date and scorer stdout per scenario
- `soc_context`: status, plus the labeled wage when present
- `roles[]`

Each `roles[]` entry holds:
- `company_input`, `title`, `soc`, `fit` (labeled)
- `company`: status; on a match, every field `{value, source, csv_line, csv_name, column}`
- `liveness`: `{status, factor}`
- `scenarios`: per scenario, the `timeline`, `composite`, `recommendation`, `reason` and the full `scorer_trace`
- `gates`: G1–G5 states
- `next_action`

Every leaf value carries `source` ∈ {`record`, `your-input`}. Scorer trace terms carry `record`, `model-judgment` or `your-input`.

**`<out>/report.md`** (for the person). It has these sections:
- Executive summary
- Decisions table: role, company evidence, liveness, scorer result per scenario, next action
- Verified vs. inferred
- Occupation context (not scored)
- Timeline by scenario
- What this cannot tell you
- Gates held for a human

The scorer's own outputs (`<out>/<scenario>/roles.json`, `role-scores.json`, `role-scores.md`) are kept beside them as the audit trail.

The default `<out>` is `course/2026fa/submissions/arundhatik26/runs/sample/`. The prototype never writes over a tracked repo file.

## Stop conditions

- G1 fails → stop, exit 2, nothing written.
- The sponsor CSV or BLS CSV is missing, or the CSV lacks a required column → stop, exit 2.
- The scorer exits non-zero → stop, exit 2, with the scorer's stderr shown.
- A **healthy** run skips at least half its roles. If a scenario's skip rate is below 50%, the person reads that as "check the inputs", not as good news.

## Next action per result → the 3-3-2 day

| Next action | Goes to | What the person does |
|---|---|---|
| TAILOR APPLICATION | the **2 hours** of research and applying | tailor the résumé to this posting |
| NETWORK, DON'T APPLY YET | the **3 hours** of networking | the employer has a record of sponsoring software roles but no posting is confirmed: message an alum or co-op advisor before the role opens |
| NETWORK (unknown sponsorship) | the **3 hours** of networking | ask a person: "Has your team converted international co-ops to full-time software roles?" |
| HUMAN CHECK (G2) | 5 minutes, before anything else | decide which CSV row (if any) is this employer, then re-run |
| DEPENDS ON GRADUATION DATE | the advising conversation | settle the co-op and graduation plan, then re-run with one scenario |
| SKIP | nothing | a success: that time goes back into the day |

## Run-log template (for `logs/runs/2026fa-arundhatik26-<n>.md`)

```markdown
## YYYY-MM-DD — coop-sponsor-swe-15-1252 run <n>

- **Recipe:** recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md v<version>
- **Inputs:** <persona file>, sponsor CSV sha256 <hash>, BLS CSV sha256 <hash>, liveness record <path>
- **Outputs:** <out>/run-log.json, <out>/report.md, <out>/<scenario>/role-scores.{json,md}
- **Result:** per scenario: Apply / Consider / Skip counts and skip %; next-action counts
- **Gate decisions:** G2 per company (who, what row, confirmed/rejected, date) · G3 re-checks · G4 scenario chosen
- **Open issues:** what did not work or is still missing
```
