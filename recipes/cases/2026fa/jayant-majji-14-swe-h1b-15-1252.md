---
status: RUNNABLE-SAMPLE
todos_open: 5
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# swe-h1b-15-1252 — SWE sponsor triage against an OPT clock

## Executive summary

For an **F-1 MS student on OPT targeting Software Engineer roles (SOC 15-1252)**, take a list of
candidate roles and decide, per role, whether it is worth tailoring an application, worth
networking into, or not worth the time — and say exactly which evidence backed that call.

It looks up each company's H-1B approval history in the shipped 80 Days to Stay CSV, applies a
visa-timeline gate from the student's OPT end date, applies a liveness gate from a recorded
`npm run ats:liveness` result, and sends only roles with evidence at every gate to the existing
scorer. Companies with sponsorship evidence but no live posting become a **network-target list**.
Anything without evidence is **held for a human** — never scored on a guess.

Two customers: this file is for the agent; `recipes/cases/2026fa/jayant-majji-14-swe-h1b-15-1252.card.md` is for the person.

**Handoff condition (done when):** the prototype exits 0; `run.json` lists every input role with
exactly one route (`score`, `network_target`, `held`, `skip`) and a reason; every value in
`run.json` and `roles.json` carries a `source` of `record`, `your-input`, or `model-judgment`;
no held role appears in `roles.json`; and `role-scores.md` exists in the same folder. "Looks right"
is not the condition.

## Required reads

1. `SNICKERDOODLE.md`, `DOMAIN.md` (Known gaps), `DATA_CONTRACT.md` (§Zero-Conditions)
2. `recipes/_shared.md` (Verified-Data Rules)
3. `scripts/score/role-scorer.mjs` CONFIG block (weights, thresholds, default source labels)
4. `scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/README.md`

## Source inventory

| What | Path / command | Used for | Label |
|---|---|---|---|
| Sponsorship + funding data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with approvals) | `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date`, `latest_funding_amount` | record |
| Scorer | `npm run score -- <roles.json> --out-dir <dir>` → `scripts/score/role-scorer.mjs` | composite + decision + audit trace | (scorer) |
| Input shape + tier p values | `data/examples/ch11-roles.json` | Proven 0.9 · Likely 0.6 · None 0.0 | — |
| Liveness | `npm run ats:liveness -- <url>` → `scripts/ats/check-liveness.mjs`, run by hand; result pasted into the input file | `active` → 1.0, `expired` → 0.0 | record |
| Persona | `scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/sample-input.json` (fictional) | OPT end date, hiring lag, fit per role | your-input |
| Prototype | `python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py` | runs every gate, writes all outputs | — |
| Tests | `python3 -m unittest discover -s scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252 -p "test_*.py" -v` | 7 offline tests on fixtures | — |

Columns deliberately **not** read: `phone`, `executive_officers`, `board_directors` (real people's data).

## Proposed additions (not in the repo)

1. **Approval-count → tier rule** (the repo has none; `role-scorer.mjs` only lists soft tiers).
   Proven = `Total Approvals` ≥ 10 **and** a sponsored title containing "software";
   Likely = ≥ 1 approval otherwise; None = 0 approvals. Thresholds are my choice. **[VERIFY]**, labeled your-input.
2. **Timeline factor** from OPT end date and an assumed hiring lag: 0 if days left < lag; 1 if
   days left ≥ 2×lag; linear in between. Lag of 60 days is an assumption. **[VERIFY]**, labeled your-input.
3. [TODO: DATA SOURCE] SOC-level sponsorship — DOL LCA disclosure rows filtered to SOC 15-1252, so
   "sponsors software roles" stops being a title-substring proxy.
4. [TODO: DATA SOURCE] Join the Form D samples in `data/sec/form-d/processed/sample/` for funding
   recency; today funding comes from the CSV's own columns and is report-only.
5. [TODO: DEV] A company alias table (brand name → legal name, e.g. "6sense" → "6SENSE INSIGHTS INC"),
   human-reviewed, so legal-name mismatches stop landing in `held`.
6. [TODO: DEV] Read `ats:liveness` output from a file instead of hand-pasted status, with a staleness
   limit on `checked_on`.
7. [TODO: DEV] A seniority check: flag "Senior/Staff/Principal" titles for an MS-level persona
   instead of relying on the human to lower `fit`.

## Phase gates

Each role stops at the first failed gate. Gate decisions are written to `run.json` in the run's
`--out-dir` (default `course/2026fa/submissions/jayant-majji-14/runs/swe-h1b-sample/`).

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G0 run inputs | Persona has `opt_end_date` (YYYY-MM-DD) **after today** and `hiring_lag_days` > 0; CSV exists with the needed columns; `--out-dir` is in my namespace | evaluate roles | **whole run stops**, exit 2, no outputs |
| G1 company match | Normalized name (uppercase, punctuation stripped, trailing INC/LLC/CORP/CO/LTD dropped) matches **exactly one** CSV row | G2 | `held: no_record` (absent) or `held: ambiguous` (2+ rows) |
| G2 sponsorship evidence | `Total Approvals` is a number (blank is **not** zero) | tier assigned | `held: no_record` |
| G3 fit labeled | `fit.p` in 0..1 with a valid `source` | G4 | `held` |
| G4 liveness (gate) | A recorded `ats:liveness` status exists and is `active` or `expired` | G5 | missing + tier Proven/Likely → `network_target`; missing + tier None → `skip`; other status → `held` |
| G5 timeline (gate) | factor from G0 rule; passed to scorer as a multiplier | scorer | factor 0 → scorer zeroes the composite |
| G6 human review | A person reads `report.md` and `role-scores.md` before acting | act | — |

**What the human must judge at G6:** title seniority vs. the persona; whether a held company is
really absent or just has a different legal name; whether a liveness check older than a week
still holds; whether the scorer's decision survives the "can't verify" list below.

## What it can verify

- A company's normalized name matches exactly one CSV row, and that row's approval / denial /
  approval-rate values — as shipped in the CSV.
- Whether the shipped `top_job_titles_sponsored` text contains "software".
- That a blank approvals field was treated as no record, not zero (tested).
- That `ats:liveness` returned `active`/`expired` for a URL on the date recorded.
- The arithmetic: composite = (0.35 × sponsorship + 0.30 × fit) × liveness × timeline, done by the
  existing scorer and reproducible by hand.

## What it cannot verify

- **That the company sponsored SOC 15-1252.** The CSV has no SOC column; "software" in a title list
  is a proxy. A company may sponsor only non-software roles under a title containing "software".
- **That a held company truly has no sponsorship history.** Exact matching misses brand names.
- **That the approval counts are current or correct.** Not re-checked against the USCIS Employer Data Hub.
- **That the posting is still open now** — only on the `checked_on` date. Workday (used by one sample
  posting) is not among the four ATS the engine claims to detect, yet returned `active`.
- **Funding recency.** Form D samples are not joined; the scorer has no funding term, so funding
  cannot change a decision.
- **That the tier thresholds or the 60-day lag are right.** Both are assumptions.
- **Role quality.** `role_quality` weight is 0 in the scorer; this recipe adds no role-quality signal.

## Facts that bite (addressed)

| Fact | How this recipe handles it |
|---|---|
| Role quality weight is 0 | Not used; listed under "cannot verify" |
| `bls:local-wage` feeds nothing | Not used |
| Only SEC samples ship | Form D not joined; marked as a data-source TODO |
| Planned dirs don't exist | Gate decisions go to `run.json` in my submissions folder, not `logs/gate-decisions/` |
| `snickerdoodle` CLI is roadmap | Not referenced as a runnable command |
| Scorer defaults a missing `source` to `record` (found in `role-scorer.mjs`) | Prototype always sets `source`; held roles never reach the scorer |

## Output contract

| File | Customer | Contents |
|---|---|---|
| `run.json` | agent | `recipe`, `rule_version`, `today`, `csv`, `persona` (no name/email), `timeline`, `roles[]` (each with `route`, `reason`, labeled `sponsorship`/`fit`/`liveness`), `scorer` (command, returncode, stdout), `counts` |
| `report.md` | person | timeline gate; scored roles; network targets; held/skipped with reasons; "what this run did NOT verify" |
| `roles.json` | scorer | only `route=score` roles, shaped like `data/examples/ch11-roles.json`, every term with `source` |
| `role-scores.json` / `.md` | both | written by the existing scorer |

## Stop conditions

- G0 fails → stop the run, exit 2, write nothing.
- Scorer exits non-zero → prototype exits 1; treat all decisions as absent.
- Every role held → no scorer call; `report.md` still ships with reasons.

## Next action per result (the 3-3-2 day)

| Result | Next action | Which hours |
|---|---|---|
| Scorer **Apply** / **Consider** | Human checks seniority + posting, then tailors the application | the 2 research-and-apply hours |
| **network_target** (sponsor evidence, no live posting) | Find an engineer there for an informational interview before a role opens | the 3 networking hours |
| **held** | Human looks up the legal name or posting by hand, then re-runs; else drop | 2 hours (short) |
| **skip** / scorer Skip | Drop; no further time | — |

## Run-log template (for `logs/runs/`)

See `logs/runs/2026fa-jayant-majji-14-1.md` for a filled example. Fields: date · recipe + version ·
command(s) · data used (sample vs full) · input file · counts by route · scorer summary line ·
gates that stopped roles · what a human judged · what broke · next step.