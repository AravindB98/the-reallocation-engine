---
status: DRAFT
todos_open: 16
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

**Status.** DRAFT. The design is complete, but the prototype is not built.
Sixteen typed TODOs are open. The status moves up only as each one closes with
its required evidence, never by editing this header.

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

**Prototype command** (not built yet) [TODO: DEV]:

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --today   2026-10-02 \
  --run-id  2026-10-02-sample-1 \
  --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-1
```

- **Language:** Python. Stdlib `csv` handles the quoted list field, and
  `ast.literal_eval` parses `top_job_titles_sponsored`. PyYAML (already used
  by `scripts/conformance.mjs:65`, installed in CI by
  `.github/workflows/contrib-gate.yml:22`) reads the persona via
  `yaml.safe_load`. Nothing new is installed.
- **Behavior:** the script refuses to run if `--out-dir` exists, so it never
  overwrites. It exits nonzero at the first hard stop. It calls the scorer as
  a subprocess and never re-implements the composite
  (`CONTRIBUTING.md:46-50`).

## Proposed additions

All code lives under `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/`.
The orchestrator itself is the prototype command above.

| # | Addition | Why it belongs | Tag |
|---|---|---|---|
| 1 | Company matcher: casefold + strip legal suffixes (Inc, LLC, LLP, Corp), then exact compare; >1 candidate row → stop | Exact-name joins produce false Unknowns (Ch.7 `:30,102-104`); "Deloitte" hits 7 entities | [TODO: DEV] |
| 2 | Sponsorship tier and p from CSV fields (table below) | No script turns H-1B records into p/tier (findings §b) | [TODO: DEV] |
| 3 | Timeline-factor function that emits every date it used | Ch.10 requires the factor to carry its dates (`10-…md:52`); no implementation exists | [TODO: DEV] |
| 4 | Liveness label → factor, with validation and evidence-based labeling | `classifyLiveness` returns a label, not a number (`liveness-core.mjs:49-77`); the scorer treats a missing gate as 1 (`role-scorer.mjs:83`) | [TODO: DEV] |
| 5 | Report, run log and `*-audit.md` writer | Two customers, two files; RUNNABLE-SAMPLE needs audit files | [TODO: DEV] |
| 6 | Fixture harness for the six predicted failure cases (brief §6) | Each stop must be shown to fire, not assumed | [TODO: DEV] |
| 7 | Fold funding recency into sponsorship p (Ch.7 weight 0.20, `07-…md:36`) | Future work; funding is context-only in this version | [TODO: DEV] |
| 8 | `fixtures/jobs.sample.json`: fictional postings at real CSV company names, `example.com` URLs, typed fit / hiring lag / liveness label | No job list exists in the repo for this persona | [TODO: DATA SOURCE] |
| 9 | One sentence of reasoning for each tier threshold (≥ 10 approvals, ≥ 90 rate, ≥ 1 approval; p 0.9 / 0.6 / 0.3) | Values are fixed by the brief; TODO closure needs the reasoning | [TODO: DEFINE] |
| 10 | Reasoning for the liveness mapping active 1.0 / uncertain 0.5 / expired 0.0 | Same closure rule | [TODO: DEFINE] |
| 11 | The "strong fit" cutoff that sends an Unknown-tier role to networking | The brief names the rule but gives no number; none is invented here | [TODO: DEFINE] |
| 12 | Confirm the report columns, reader and decision drafted in the Output contract | Report-field closure needs all three confirmed by a human | [TODO: REPORT FIELD] |

**Sponsorship tier and p (record), copied from the brief.**
`Approval_Rate` is stored 0–100; the brief's original 0.90 was corrected to 90
before the first commit.

| Tier | Rule | p |
|---|---|---|
| Proven | title match AND `Total Approvals` ≥ 10 AND `Approval_Rate` ≥ 90 | 0.9 |
| Likely | title match AND `Total Approvals` ≥ 1 | 0.6 |
| Possible | H-1B record present, no title match | 0.3 |
| Unknown | no CSV match, or H-1B fields blank | omitted (never 0) |
| Avoid | not used: the CSV cannot prove non-sponsorship | — |

A **title match** means a target title appears in `top_job_titles_sponsored`.
It is not a per-title approval count; approvals are per company.

**Timeline factor (your-input), copied from the brief:**

```
remaining_days = 90 − visa.unemployment_days_used
deadline       = min(today + remaining_days, visa.opt_end_date)
expected_start = today + hiring_lag_weeks × 7      # per role; default 12
factor = 1.0                              if expected_start ≤ deadline − 30 days
       = 0                                if expected_start > deadline
       = (deadline − expected_start) / 30 otherwise         
```

Worked example, Priya Nair, `--today 2026-10-02`:
- 34 days used (`profile.yml:22`), so 56 remain.
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
| G0 Inputs | CSV and profile exist; profile parses; `visa.unemployment_days_used` and `visa.opt_end_date` present | `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && python3 -c "import yaml; v=yaml.safe_load(open('search/examples/priya-nair/profile.yml'))['visa']; print(v['unemployment_days_used'], v['opt_end_date'])"` | Stop; name the missing file or key; never default a date |
| G1 Company match | Each role's company resolves to 0 or 1 CSV rows | Ambiguity evidence: `python3 -c "import csv; print(sum('deloitte' in r['company_name'].lower() for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv', encoding='utf-8'))))"` → 7 | 0 rows → Unknown (`no-csv-match`). **More than 1 → STOP**: list every candidate row (name, approvals, rate) for the human to pick. The pick is recorded in the jobs file as `csv_company_name`; never chosen silently. [TODO: APPROVE] |
| G2 Sponsorship record | Tier and p follow the table above exactly | Prototype unit check (addition 6) | Blank H-1B fields → Unknown (`no-h1b-record`), p omitted |
| G3 **Liveness** | Every role has a label in {active, uncertain, expired}; factor 1.0 / 0.5 / 0.0 | Checked on the jobs fixture once addition 8 exists | Missing or other label → **STOP** naming the role. Never passed through, because the scorer would treat it as 1. Source is `record` only when the role points at a saved `ats:liveness` output; otherwise `your-input (fixture)`, flagged in the report. [TODO: APPROVE] |
| G4 **Timeline** | Every role has a factor in [0, 1] **and** the dates that produced it (days used, remaining, OPT end, today, deadline, lag, expected start) | Recompute Priya's deadline by hand: 2026-11-27 at `--today 2026-10-02` | Missing date → STOP. Factor 0 → listed as a drop with its dates. [TODO: APPROVE] |
| G5 Scorer | Scorer exits 0; `role-scores.json` parses; roles in = roles out | `node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir <scratch dir>` exits 0 (smoke test of the existing CLI) | Stop; keep the scorer's stderr in the run log |
| G6 Report | `run-log.json`, `report.md` and the audit exist; every value carries a source label; skip rate reported | `test -f` on the three files after a run | Stop; the run is not reportable |

Skip rate is reported, not gated. A healthy run skips at least half of the
roles it evaluates (`DOMAIN.md:8`).

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

**(a) Agent log: `run-log.json`.** Fields:
- `run_id`, `today`, `mode` (`sample`)
- `inputs` (path + sha256 for CSV, profile, jobs)
- `target_titles`
- `roles[]`: each with `role_id`, `company_typed`, `csv_company_name`,
  `match` (`one` | `none` | `multi` + candidates), `sponsorship`
  `{tier, p, approvals, denials, approval_rate, title_match, source}`,
  `funding_context {amount, stage, date, source}`, `fit {p, source}`,
  `liveness {label, factor, evidence, source}`, `timeline {factor,
  days_used, remaining_days, opt_end, deadline, hiring_lag_weeks,
  expected_start, source}`
- `stops[]`
- `scorer {command, exit_code}`
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

Then the skip rate, the stops, and the scorer's arithmetic per role. Every
value shows its source: `record`, `model-judgment` or `your-input`. The
sample run should produce no `model-judgment` values; fit is `your-input`.

**(c) Audit: `<run-id>-audit.md`.** Counts of roles in and scored, no-match,
multi-match, Unknown, liveness-gated, timeline-gated, and each tier.

**Intermediates** (kept for traceability): `roles.json` and `profile.json`
(the scorer's inputs), plus the scorer's own `role-scores.json` and
`role-scores.md`.

## Stop conditions and next actions

Stop, write no score, and do not invent a value when:
- a required file is missing, or the jobs file is malformed JSON;
- a profile date or day count is missing (never filled in with a plausible
  value);
- a company matches more than one CSV row (the human picks);
- a liveness label is missing or not one of the three;
- `--out-dir` already exists;
- the scorer exits nonzero.

Next action per result, tied to the 3-3-2 day (Ch.2 `02-…md:39`):

| Result | Next action |
|---|---|
| Apply | Tailor an application. This role gets part of the day's **2 application hours** |
| Consider | **Network into the company first** (the 3 networking hours); apply only after a contact confirms the role and sponsorship |
| Skip | Drop it. The report shows the reason (closed gate with its dates, or composite below the band) |
| Unknown tier with strong fit (cutoff: addition 11) | **Network, don't apply**: find a direct sponsorship signal first. Unknown is not Avoid (Ch.7 `:137`) |

## Run-log template

Write one file per run at `logs/runs/2026fa-nishant2681-<n>.md`. Based on
`recipes/_shared.md:104-112`; never in `logs/RUN_LOG.md`.

```markdown
## YYYY-MM-DD — nishant2681-data-analytics-opt-h1b sample run <n>

- **Recipe:** nishant2681-data-analytics-opt-h1b v0.1.0 (status at run time: ___)
- **Run id / --today / mode:** ___ / YYYY-MM-DD / sample
- **Inputs:** CSV, profile, jobs file (paths + sha256 from run-log.json)
- **Outputs:** runs/<run-id>/run-log.json, report.md, <run-id>-audit.md, role-scores.{json,md}
- **Gate results:** G0 ___ · G1 ___ (multi-match picks: ___) · G2 ___ · G3 ___ · G4 ___ · G5 ___ · G6 ___
- **Result:** Apply ___ · Consider ___ · Skip ___ (skip rate ___%)
- **Gates cleared by:** ___ (name, date)
- **Open issues:** what did not work or is still missing
- **Note:** logged here, not in logs/RUN_LOG.md (CONTRIBUTING.md:13 vs recipes/_shared.md:93)
```

No secrets, real emails or private application notes (`recipes/_shared.md:114-115`).
