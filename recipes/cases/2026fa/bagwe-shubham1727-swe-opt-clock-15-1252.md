---
status: DRAFT
todos_open: 4
last_gate: "sample-run 2026-10-02: machine gates G0-G4 pass, logs/runs/2026fa-bagwe-shubham1727-1.md; human adequacy gate (G5) not signed"
attestation: null
recipe_version: 0.1.0
---

# swe-opt-clock — new-grad SWE sponsor triage under the OPT unemployment clock

## Executive summary

**What it does.** For an international master's graduate in computer science on post-completion OPT who is **currently unemployed** and looking for **new-grad software engineering jobs**, this recipe checks each candidate job against three things the student can't easily see:

1. whether the company has actually sponsored H-1B visas for *software engineers*, and not only for senior staff or scientists;
2. whether the posting is real and still open;
3. whether the company's hiring process can finish before the student's **90-day unemployment allowance** runs out. For this student that comes months before the OPT end date.

**Who it's for.** One situation: F-1 OPT year 1, unemployed, STEM extension not yet filed, targeting SOC 15-1252 Software Developers. A student on STEM OPT with a long runway, or one already employed, would get little from it.

**What it decides.** A recommended Apply / Consider / Skip per job, using the engine's existing scorer. Each job also gets a next action that maps to the 3-3-2 day: tailor an application (the 2 hours), network first (the 3 networking hours), or drop it. Anything that would need a guess (a company the records can't find, a posting nobody checked recently, a company with no sponsorship record) is **held for the person** and never scored. A human signs every decision.

**Lifecycle claim.** A full sample run completed on 2026-10-02 with every machine gate passing. The status stays **DRAFT** because four proposed additions below are open typed TODO items, and the constitution requires zero open items before SPECIFIED. Promotion path: close or move those four items, then claim RUNNABLE-SAMPLE on the existing run evidence.

Two customers: this file is for the agent; `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.card.md` is for the person.

**Handoff condition (done when):** `run.mjs` exits 0. `run-log.json` has `status: completed` and `gates.G4_scorer_conformance.result: pass`. Every role in `run-log.json` is either `scored` (present in `role-scores.json`) or `not-scored` with at least one hold code. Every vote and gate term in `role-scores.json` carries a `source` in {record, your-input, model-judgment}. And `gate-decisions.md` exists with every decision column blank. "The report looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, TODO closure.
2. `DOMAIN.md`: layout and known gaps (items 3 and 9 apply here).
3. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md`: tiers; Unknown is not Avoid.
4. `book/chapters/10-the-visa-timeline-manager.md`: the timeline factor and its three cases.
5. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`: 30,369 rows, 1,557 with H-1B fields, no SOC column, newest funding date 2025-09-26. Its SHA-256 `eccdee2a…` matches the shipped `mapped_student_employment_targets_v3.csv` (checked 2026-10-02).
6. `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/README.md`.

## Purpose and source inventory

| Source | Path (exists in a fresh clone) | Used for | Label |
|---|---|---|---|
| 80 Days sponsor + funding CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | G1 entity match; tier inputs (`Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`); report-only `median_salary_offered`, `latest_funding_*` | record |
| Form D samples | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` | report-only "filed in a shipped quarter?" | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | report-only national median wage, job zone for the role's SOC | record |
| Liveness classifier | `scripts/ats/liveness-core.mjs` (`classifyLiveness`, imported) | G2 on saved snapshots | (applied) |
| Ch.11 scorer | `scripts/score/role-scorer.mjs` (`npm run score`), unmodified | the decision | its trace |
| Persona | `search/examples/neel-kapoor/profile.yml` (fictional) | G0 clock, `needs_sponsorship` | your-input |
| Role list | `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/fixtures/sample-roles.json` | legal name, title, SOC, time-to-start + basis, fit, snapshot path | your-input |
| Posting snapshots | `…/fixtures/snapshots/*.json` (`capture_mode: fixture`) | G2 input | your-input (a fixture is not a record) |
| Prototype | `node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs` | this recipe's steps 1–7 | — |
| Tests | `node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs` | conformance of the prototype | — |

Not used, and why: `npm run bls:local-wage` (fails on a fresh clone: no `.venv`, and `data/bls/local-wage/` is absent); `scripts/sec/validate-h1b-join-sample.py` (needs the unshipped full join); the `snickerdoodle` CLI (roadmap, not runtime); `data/raw/`, `data/verified/`, `logs/gate-decisions/` (do not exist; gate records go to the run's own `gate-decisions.md`).

## Phase gates

Every gate is a hard stop with a test against paths that exist. G2 (liveness) and G3 (timeline) are **gates**: multipliers in the scorer, never votes.

| Gate | Test (machine) | Pass | Fail | Human clears by |
|---|---|---|---|---|
| **G0 persona clock** (whole run) | `needs_sponsorship` is boolean; `opt_end_date ≥ as-of`; `unemployment_days_as_of` present (if unemployed) and ≤ as-of; projected days used < ceiling | clock dates computed | exit 3, `run-log.json status: stopped`, no report | checking the echoed dates against the I-20/EAD/DSO record (`gate-decisions.md` § G0) |
| **G1 entity** | exactly one CSV row whose normalized `company_name` equals the normalized legal name | tier computed | hold `unresolved-company` (not scored) | supplying the legal entity name, or dropping |
| **Tier** (not a gate) | H-1B fields present | Proven / Likely / Possible → p | Unknown → hold `unknown-sponsorship` (not scored, never sent as 0) | asking the company; Unknown is not Avoid |
| **G2 liveness** | snapshot dated ≤ 7 days before as-of and not after it; classifier `active` → factor 1, `expired` → factor 0 | factor to scorer | `uncertain`, stale, undated, or missing → hold | opening the posting and re-capturing |
| **G3 timeline** | numeric `time_to_start_days`; factor per the formula below | factor to scorer | missing lag → hold `no-time-to-start` | judging any 0 < factor < 1; legal questions go to the DSO |
| **G4 scorer conformance** | scorer exit 0; roles in = roles out; `profile_needs_sponsorship` = persona's; every role with a gate ≤ 0.05 is `Skip`; every term source in the allowed set | report written | exit 4, `status: halted`, **no report** | nothing; it halts |
| **G5 decision** | `grep -E '^\| R[0-9]+ .*\| (apply|network|drop|re-check) \| [A-Za-z]' course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/gate-decisions.md` returns one line per Apply/Consider job | the person may act | unsigned, so the report stays a recommendation | writing decision + name + date per job |

### Rules the gates use (each is a recipe choice: your-input)

- **Tier.** If approvals < 2 or approval rate < 75%, the tier is **Possible** (p 0.3). If approvals ≥ 10, rate ≥ 90%, and at least one SWE title on record is non-senior, it's **Proven** (p 0.9). Anything else with H-1B fields is **Likely** (p 0.6). Empty H-1B fields mean **Unknown** (not scored).
  - Proven 0.9 and Likely 0.6 are the values in the book's worked example (`data/examples/ch11-roles.json`). Possible 0.3 is this recipe's placeholder; it sits inside the scorer's soft-tier list, so it can never reach Apply.
  - 10 approvals is the median among the 1,557 mapped sponsors (80 Days audit). 84 of 1,557 sponsors fall below 90% (measured 2026-10-02).
- **SWE title.** A regex over `top_job_titles_sponsored`: software engineer/developer, backend/full-stack/frontend engineer/developer, platform engineer, site reliability engineer, SDE. **Non-senior** means no senior/sr/staff/principal/lead/manager/director/head/vp/chief/architect. This is a text heuristic, not an LCA SOC code.
- **New-grad rule.** If every SWE title on record is senior, the tier is at most **Likely**. Ch.7: the record "cannot know those fifteen were all for senior principal scientists".
- **Clock.**
  - Unemployed: `used_now = used + (as_of − unemployment_days_as_of)`, `exhaustion = as_of + (ceiling − used_now)`, `hard = min(opt_end, exhaustion)`, `safe = hard − buffer`. The count is projected forward because the clock keeps running while the student researches.
  - Timeline factor:
    - expected start = as_of + time_to_start_days
    - start > hard → **0**
    - start ≤ safe → **1**
    - otherwise → `(hard − start) / buffer`, a linear shape this recipe chose (Ch.10 gives three cases, not a formula).

## Workflow (verbatim commands, from the repo root)

1. Confirm inputs exist:

```bash
test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv && test -f data/bls/compact/soc_occupation_compact.csv && ls data/sec/form-d/processed/sample/*.sample.json && test -f search/examples/neel-kapoor/profile.yml
```

2. Run the offline tests (must be 16/16 before any run is trusted):

```bash
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
```

3. Sample run (writes to `course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/`). Inside, `run.mjs` calls the existing scorer itself, as `node scripts/score/role-scorer.mjs <out>/roles.json --out-dir <out>`:

```bash
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02
```

4. Conformance on everything this recipe touches:

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/ recipes/cases/2026fa/ search/examples/neel-kapoor/
```

5. Stop. Hand `report.md` and `gate-decisions.md` to the person. Do not act on any recommendation until G5 is signed.
6. Log the run as `logs/runs/2026fa-bagwe-shubham1727-<n>.md` using the template below. Never edit `logs/RUN_LOG.md`.

## What it can verify, and what it can't

This boundary is the point of the recipe. The report repeats it for every job.

| Can verify (from a record, by a script) | Cannot verify |
|---|---|
| The company has a row in the 80 Days CSV under this exact legal name | That an *absent* company doesn't sponsor. Public companies that never filed a Form D (e.g. HubSpot) aren't in the file at all |
| The row's H-1B approvals, denials, approval rate, and up to five sponsored titles | **When** those approvals happened: the file has no fiscal year. A sponsor may have frozen sponsorship since |
| Whether a sponsored title *text* looks like software engineering, and whether any is non-senior | That the LCA was filed under SOC 15-1252. The file has no SOC column. "Member of Technical Staff"-style titles are missed |
| What the engine's classifier says about a saved snapshot, and how old the snapshot is | That the posting is live **today**. In sample mode every snapshot is an authored fixture, labeled your-input |
| The date arithmetic from the persona's own dates | Immigration law: what counts as employment, STEM-extension eligibility, cap-gap. That belongs to the DSO |
| The BLS national median wage and job zone for a 2018 SOC code | Local pay (Fact 2: `bls:local-wage` can't run here) or what this employer pays |
| Whether the company appears in the four shipped Form D samples | Whether it raised money recently. The CSV's newest funding date is 2025-09-26, and the samples matched 0 of 12 companies |
| — | E-Verify enrollment (needed for a STEM extension with this employer) |
| — | The time-to-start for a specific company. It's an assumption with a stated basis (your-input) |

### Facts that bite, and how this recipe handles each

- **Role quality has weight 0.0 in the scorer.** Not changed. Every role in this domain has the same SOC (15-1252), so a role-quality vote would add the **same constant** to every composite: it would shift scores without telling roles apart. The BLS row is used **outside the scorer**, report-only, beside the company's sponsored median salary, as a pay sanity check.
- **`bls:local-wage` feeds nothing / fails on a fresh clone.** Confirmed on 2026-10-02: `missing .venv`, and `data/bls/local-wage/` is absent. Not used; national median only, labeled national.
- **Only Form D samples ship.** The run says which files it used (sha256 in `run-log.json`) and reports 0 matches. Funding is report-only and never a vote, and its staleness is stated.
- **Planned directories don't exist.** Gates point at `course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/`, which the prototype creates.
- **`snickerdoodle` CLI is roadmap.** No command in this recipe uses it.
- **`validate-h1b-join-sample.py` needs unshipped data.** Not used. Entity match is exact-normalized-name only, and misses are held, not fuzzed.
- **Scorer authorization trap (found 2026-10-02, not in DOMAIN.md's list).** `role-scorer.mjs` treats any authorization text containing "authorized" as not needing sponsorship. The prototype never passes persona free text to the scorer and halts (G4) if the scorer's flag disagrees with the persona's explicit `needs_sponsorship`.

## Proposed additions

1. **Live liveness capture.** [TODO: DEV] Write a capture step that drives `checkUrlLiveness` in `scripts/ats/liveness-browser.mjs` (Playwright) and saves each result in this recipe's snapshot schema with `capture_mode: live-fetch`. Then G2's label becomes `record` with a fetch timestamp. *Why:* sample snapshots are authored, so today liveness is never a record. *Handoff:* a snapshot written by the capture step passes G2 and is labeled `record` in `role-scores.json`. *Network hosts:* only the posting URLs in the role list.
2. **SOC-coded sponsorship with fiscal years.** [TODO: DATA SOURCE] DOL OFLC LCA disclosure files (`SOC_CODE`, `EMPLOYER_NAME`, `CASE_STATUS`, `RECEIVED_DATE`) for FY2023–FY2025, filtered to 15-1252, written to `data/dol/lca/15-1252-sample.csv` with a provenance note. *Why:* this replaces the title-text heuristic with a record of "sponsored *this* occupation in the last three fiscal years". It is the largest inferred step in the recipe.
3. **E-Verify participation.** [TODO: DATA SOURCE] USCIS E-Verify participating-employer list, written to `data/uscis/e-verify/employers-sample.csv`. *Why:* for this student a STEM extension, and so a runway past the 90-day ceiling, depends on the employer being enrolled. Today that's unknowable from the repo.
4. **Fresh funding.** [TODO: DATA SOURCE] Full Form D quarters 2025Q4–2026Q2 via `python3 scripts/sec/download-form-d-quarters.py` + `refresh-recent-sec-quarters.py`, joined by normalized name. *Why:* funding is report-only today because the newest funding date in the CSV is over a year before the run.

## Output contract

### Agent output: `course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/run-log.json`

Fields: `workflow`, `recipe`, `recipe_version`, `mode`, `run_id`, `as_of`, `generated_at`, `status` (completed | stopped | halted), `inputs{name: {path, sha256}}`, `rules`, `gates.G0_persona_clock{result, clock}`, `gates.G4_scorer_conformance{result, problems?}`, `roles[]{role_id, company, company_legal_name, title, soc, disposition (scored | not-scored), holds[]{code, detail}, gates.{G1_entity,G2_liveness,G3_timeline}, sponsorship{tier, p, reason, evidence, label, rule_label}, liveness{factor, code, captured_at, age_days, capture_mode, label}, timeline{factor, band, expected_start, math, lag_days, lag_basis, label}, fit{p, note, label}, role_quality{status, reason?, national_median_wage?, label}, funding{…, form_d_sample_match, label}, decision{recommendation, composite, reason}, next{block, action}}`, `scorer{command, exit, stdout, stderr}`, `summary{evaluated, scored, not_scored, apply, consider, skip, skip_rate_of_scored, not_applying_rate_of_evaluated, form_d_sample_matches}`, `stop_conditions[]`, `outputs{}`.

Also written: `roles.json` (scorer input) and, by the scorer itself, `role-scores.json` / `role-scores.md`.

### Human report: `course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/report.md`

Reader: the student, deciding where the next day's hours go. Decision enabled: which jobs get the 2-hour application block, which get networking first, and which to drop. Sections, in order:

1. executive summary (with a skip-rate warning when < 50%)
2. the clock
3. decisions with next action
4. where each number came from, per job, with labels
5. what this run can't tell you
6. run record

Plus `gate-decisions.md`, the blank G5 sheet.

One file can't serve both readers. The log has field paths and hashes. The report has none in its summary.

## Stop conditions

- **G0 fails**: stop the whole run (exit 3). A wrong date makes every factor wrong, and Ch.10 names a mis-entered date as the catastrophic error.
- **G4 fails**: halt (exit 4) and write no report. A scorer that ignores a gate or misreads sponsorship need would produce confident wrong advice.
- **Asked to give an Unknown or unresolved company a sponsorship number "to see how it scores"**: refuse. That is the Unknown-as-Avoid error in reverse.
- **Asked to raise a fit rating, lower a threshold, or edit `sample-roles.json` after a run so a preferred job passes**: refuse. Inputs are fixed before the run (committed in git history before run 1).
- **Asked to decide STEM-extension eligibility or what counts as unemployment**: refuse and route to the DSO.
- **`--out-dir` inside the repo but outside this namespace**: refuse (exit 2).

## Next action per result (the 3-3-2 connection)

| Result | Block | Action |
|---|---|---|
| Apply | **2 h research and apply** | Tailor and apply. In the first recruiter call, ask whether the team sponsors new-grad SWE H-1B registrations |
| Consider | **3 h networking** | One conversation with an engineer there first, about sponsorship for new grads or about start speed (whichever soft spot the scorer named) |
| Skip, dead posting, Proven/Likely sponsor | **3 h networking** | Informational chat; watch the board for a reopen; don't apply to the dead posting |
| Skip, timeline closed | drop | Drop now. Revisit only on a written start date before the safe deadline |
| Skip, low composite | drop | Drop |
| Not scored, timeline already closed | drop | The missing evidence can't change the outcome |
| Not scored, unresolved company | person, ≤ 5 min | Find the legal entity name; re-run |
| Not scored, liveness held | person, ≤ 5 min | Open the posting; re-capture; re-run |
| Not scored, Unknown sponsorship | **3 h networking** | Ask directly; no record either way |

## Run-log template (`logs/runs/2026fa-bagwe-shubham1727-<n>.md`)

```markdown
## YYYY-MM-DD — swe-opt-clock sample run <n>

- **Recipe:** recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md v<version>
- **Inputs:** persona <path> · roles <path> · sponsor CSV sha256 <first 12> · as-of <date>
- **Outputs:** course/2026fa/submissions/bagwe-shubham1727/runs/<as-of>/{roles.json, role-scores.json, role-scores.md, run-log.json, report.md, gate-decisions.md}
- **Result:** <evaluated> evaluated → <scored> scored (Apply / Consider / Skip) · <held> held · gates G0 <r> G4 <r> · tests <n>/<n>
- **Open issues:** <what did not work, what is still unverified, whether G5 was signed and by whom>
```

## Logging rules

- One file per run under `logs/runs/`. Never edit `logs/RUN_LOG.md`.
- Don't log real names, contact details, or a real person's visa dates. The persona is fictional, and a real student's own run belongs in `private/`.
- Never copy the CSV's `phone`, `executive_officers` or `board_directors` columns into any output (the prototype drops them at load).
