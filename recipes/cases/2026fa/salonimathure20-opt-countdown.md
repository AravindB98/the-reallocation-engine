---
status: DRAFT
todos_open: 5
last_gate: "sample-run, 2026-10-03, logs/runs/2026fa-salonimathure20-1.md (machine gates G0-G3 passed; human adequacy gate G4 not yet signed)"
attestation: null
recipe_version: 0.1.0
---

# opt-countdown — sponsor history checked against the OPT clock

## Executive summary

**What it does.** For an international master's student on F-1 OPT, this recipe takes a short list of job postings and asks one question before the usual ones: *can this employer realistically hire you before your OPT clock runs out?* It computes how many search days you have left, from your OPT end date and your remaining unemployment days. It checks each employer's H-1B approval history in the engine's sponsorship dataset and confirms each posting is still open. Then it hands the evidence to the engine's existing scorer for an Apply / Consider / Skip decision.

**Who it is for.** An MS student in Information Systems, Data Science or Computer Science who is on post-completion OPT (year 1), unemployed or about to be, and targeting data-analyst, BI-analyst or new-grad software roles (SOC 15-2051, 15-1211, 15-1252) that need H-1B sponsorship later. The 90-day unemployment limit is the binding constraint for this person, not the 12-month OPT end date.

**What it decides, and what it doesn't.** It sorts postings into *apply now*, *network first*, *keep warm but don't apply* (good sponsor, slower hiring than your clock allows), *skip*, and *blocked: a person must check something*. It never decides for you. Every number is labeled as a record, a model judgment, or your own input. A missing fact blocks the role instead of being guessed.

Two customers: this file is for the agent; `salonimathure20-opt-countdown.card.md` is for the person.

**Handoff condition (done when):** the run writes `opt-countdown-log.json` and `opt-countdown-report.md` to the output folder, every term in `roles.json` carries one of the three source labels, every blocked role lists a reason code, the scorer's own `role-scores.json` exists (proving the shared scorer, not a copy, made the decision), and the human has signed or rejected every Apply/Consider row in the run log.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, lifecycle.
2. `DOMAIN.md`: especially *Known gaps* 3 (role quality weight 0) and 9 (local wage feeds nothing).
3. `scripts/score/role-scorer.mjs`: the composite this recipe feeds; read `CONFIG`.
4. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md`: how the SEC × DOL join was built and where it misses.
5. This recipe and its card.

## Purpose and source inventory

| Evidence | Path or command (all exist today) | Label | Role in decision |
|---|---|---|---|
| H-1B approvals, denials, approval rate, top sponsored titles, H-1B median salary | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with H-1B columns filled) | record | vote (sponsorship) |
| Latest funding date/amount/stage | same CSV (`latest_funding_*`, mapped from SEC Form D) | record | context only, no scorer term |
| Posting liveness (browser) | `npm run ats:liveness -- --file <urls.txt>` → saved stdout | record | gate |
| Posting liveness (Greenhouse API) | `curl -s -o /dev/null -w "%{http_code} <board>/<id>\n" https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` → saved lines | record | gate (wins over the browser check, see G3) |
| National median wage, cognitive pivot score | `data/bls/compact/soc_occupation_compact.csv` (exact O*NET code) | record | context only (scorer weight 0) |
| OPT end date, unemployment days used, buffer, as-of date | persona JSON, e.g. `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/persona.json` | your-input | gate (timeline) |
| Hiring lag per role (days from application to start) | candidates JSON, `hiring_lag_days` | your-input | gate (timeline) |
| Fit of the role to the person | candidates JSON, `fit` | model-judgment | vote |
| Decision | `node scripts/score/role-scorer.mjs` (called by the prototype; equals `npm run score`) | script output | — |

**Prototype (one command, from the repo root):**

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
```

Defaults read the worked-run fixtures and the real CSVs above and write to `course/2026fa/submissions/salonimathure20/runs/opt-countdown/`. Every input is overridable: `--persona --candidates --liveness --greenhouse-api --sponsors-csv --soc-csv --out-dir`. Offline tests: `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/`.

**Data actually used:** the shipped 80 Days CSV and BLS compact table. The Form D samples in `data/sec/form-d/processed/sample/` were **not** used: they hold 2–3 filings per quarter and none of the target companies. Funding context comes from the CSV's own `latest_funding_*` columns instead.

## Definitions this recipe fixes

**Runway (days):** `min(opt_end_date − as_of, unemployment_ceiling − unemployment_days_used − buffer_target)`. The *start-by* date is `as_of + runway`. Labeled your-input, because every operand is the person's input and the script only does the arithmetic.

**Timeline factor:** `slack = runway − hiring_lag_days`. If slack < 0 the factor is **0**, a closed gate. Otherwise `min(1, 0.5 + slack / 60)`, which gives 0.5 with zero slack and full credit at 30 or more days of slack. A factor under 0.6 is treated by the scorer as a "soft spot" (Apply → Consider). Reason: a hire that lands on your last day of runway leaves no room for a background check or a slipped start date.

**Sponsorship mapping (DEFINE, closed here):** `p = (Approval_Rate / 100) × min(1, Total Approvals / 20)`. Tiers use the system design document's cut-offs (`docs/chapter-research-map.md` §Ch.5): Proven ≥ 0.65, Likely ≥ 0.35, otherwise Possible. Reason: the approval rate alone treats one approval out of one as equal to 150 out of 154, so volume saturates at 20 approvals. The 20 is this recipe's own choice, not a published constant. Counts are **not** halved even though they look doubled (see *Can't verify*). A blank H-1B record is **Unknown → blocked**, never `p = 0`.

**Hiring-lag assumptions (your-input):** ≤ 200 staff: 30 days; 200–2,000: 45 days; > 2,000: 60 days. These are the person's own estimates, written into each candidate with a `basis`. No repo dataset measures time-to-hire.

## Phase gates

All conditions are testable against paths that exist. The prototype enforces G0–G3; G4 is a person.

| Gate | Hard stop when | Testable condition | Who clears it, and what they must see |
|---|---|---|---|
| **G0 Input** | a persona/candidate file does not parse, a candidate lacks `role_id/company/title/soc`, or any `fit`/`hiring_lag_days`/`csv_name` carries a source label other than record / model-judgment / your-input | prototype exits **2** | The person fixes the file. No output is written past this point. |
| **G1 Runway** | OPT end date is on or before `as_of`, or unemployment days after buffer ≤ 0 | prototype exits **3**; `opt-countdown-log.json` has `"status": "halted"`; `roles.json` does **not** exist | The person checks their dates against their EAD card and SEVP portal (privately; never committed) and talks to their DSO. **Nothing is scored.** |
| **G2 Evidence (per role)** | no exact CSV row (`no-company-row`), blank H-1B columns (`no-h1b-record-joined`), no liveness record, or no hiring-lag input | role appears in the log with a `blocked` array and is absent from `roles.json` | The person resolves each reason: asserts a name alias with a `basis` (labeled your-input), or runs the liveness step. |
| **G3 Liveness** | Greenhouse API returns 404, or (without an API record) the browser checker says expired | `liveness.factor = 0` → scorer returns `Skip`, `gated: liveness`; disagreement between the two checks is written to `flags` | Machine gate. If the API record is missing, the report flags every live role as *single-source*, and the person opens those postings themselves. |
| **G4 Adequacy (human)** | always, before acting on any Apply or Consider | run-log entry in `logs/runs/` has a filled sign-off line per Apply/Consider row | The person opens each posting and confirms three things: it is the job described, it is in the target SOC, and the lag assumption is reasonable. They then record *apply / network / drop*, with their name and the date. |

Liveness and timeline are **gates** (multipliers in the scorer), never votes.

## Workflow (agent)

1. **Read** the persona and candidates. Run G0.
2. **Runway.** Compute runway and start-by date. Run G1, and halt on failure.
3. **Liveness evidence** (the only network step; it is not run by the prototype):
   - write the candidate URLs to a `urls.txt`;
   - run `npm run ats:liveness -- --file urls.txt > liveness.txt 2>&1`;
   - for each Greenhouse-hosted posting, run the curl line from the source inventory and append it to `greenhouse-api.txt`;
   - save both files beside the candidates.
4. **Run the prototype** with those files. It joins each company to the CSV by **exact upper-case name** (no fuzzy matching), builds labeled evidence, applies G2/G3, writes `roles.json` plus `scorer-profile.json`, and calls `scripts/score/role-scorer.mjs`.
5. **Stop at G4.** Show the person `opt-countdown-report.md`. Do not draft applications until they sign.
6. **Log** the run in `logs/runs/2026fa-<handle>-<n>.md` using the template below. Never edit `logs/RUN_LOG.md`.

## What it can and can't verify

**Can verify (record-backed):**

- that a company name **exactly** matches a row in the 80 Days CSV, and what that row's approvals, denials, rate, titles and H-1B median salary are;
- that a Greenhouse job ID is or is not in the board's public API at the time of the check (200 / 404);
- what the browser liveness checker reported for a URL at the time of the check;
- the arithmetic of runway, slack and timeline factor, given the person's inputs;
- the BLS national median wage and O*NET-derived pivot score for an exact O*NET code, or that the row/score is missing;
- that the decision came from the shared scorer (`role-scores.json` carries `_scorer: bayesian-role-scorer`).

**Cannot verify. Each of these is inferred or simply unknown:**

- **That a blank or missing company is a non-sponsor.** In the worked run, DraftKings has blank H-1B columns and HubSpot has no row at all; both are large Boston employers. The join misses names, so blank means *unknown*.
- **That a renamed company is the same entity.** "Iterative Health" only matched because the person asserted the alias "ITERATIVE SCOPES INC" (your-input).
- **That the approval counts are exact.** All 1,557 filled rows have *even* approvals and *even* denials (checked 2026-10-03). That pattern suggests a doubled join. Rates are unaffected, but counts may be 2×. This is a suspicion, not a confirmed defect.
- **That past sponsorship predicts sponsoring this role, or registering this person, in the next lottery.**
- **Real hiring speed.** Every lag is an assumption.
- **Role fit.** It is a model judgment. In the worked run the only Apply (0.317) sits 0.017 above the threshold, so a fit of 0.55 instead of 0.65 would make it a Consider (break-even fit 0.559).
- **What a posting pays, or what Boston pays.** The BLS figure is a national median; `bls:local-wage` is not wired in (DOMAIN gap 9).
- **Immigration rules:** cap-gap, STEM-extension timing, or whether part-time or volunteer work stops the unemployment clock. A DSO answers these, not this recipe.
- **Liveness for non-Greenhouse postings beyond the browser check**, which has a known false positive (next section).

**Found while building (2026-10-03):** `npm run ats:liveness` reported `https://boards.greenhouse.io/klaviyo/jobs/1000000003` (a job ID that does not exist) as **active**. The page redirects to Klaviyo's careers search page, which has apply-like controls. The Greenhouse API returned 404 for the same ID. Hence the G3 rule: the API record wins when present.

## Facts that bite, and how this recipe handles them

- **Role quality weight 0:** this recipe does not propose a weight. BLS wage and pivot score are shown in a separate *context* table that the decision does not read. It says so on the report.
- **`bls:local-wage` feeds nothing / fails on a fresh clone:** not used; the report says the wage shown is national.
- **Only SEC samples ship:** not used. The samples don't cover the targets, so funding comes from the CSV's mapped columns.
- **Planned directories (`data/raw/`, `data/verified/`, `logs/gate-decisions/`):** not referenced. Gate evidence lives in the output folder and in `logs/runs/`.
- **`snickerdoodle` CLI:** not referenced.
- **`validate-h1b-join-sample.py` needs full data:** not used; the shipped CSV is read directly.

## Output contract

**Agent log:** `<out-dir>/opt-countdown-log.json`. Top level: `recipe, recipe_version, mode, run_at, status (complete|halted), persona, runway{days,start_by,binding,days_to_opt_end,unemployment_left_after_buffer,source}, summary{evaluated,scored,blocked,apply,consider,skip,skip_rate_of_scored}, scorer_stdout, inputs{…paths}, human_gates_open[]`. One entry per role with:

- `csv_lookup{name_used,alias,found}`;
- `sponsorship{status,p,tier,source,derivation,record{…},title_keyword_match}` *or* `{status:missing,reason}`;
- `funding_context`, `role_quality_context`, `fit`, `hiring_lag`, `liveness{factor,source,basis,flags}`, `timeline{factor,slack_days,source}`;
- `blocked[]` (only when blocked), `decision{recommendation,composite,reason,arithmetic,source}`, `gated_by`, `next{bucket,action,hours}`.

A halted run writes `{status:"halted", gate, reason, detail, inputs}` only.

**Human report:** `<out-dir>/opt-countdown-report.md`, in this order:

1. executive summary;
2. *Your clock*;
3. *Decisions and next actions*, sorted by bucket;
4. *Verified vs. inferred, per role*;
5. *Context the score does not use*;
6. *What this run could not check*;
7. *Your sign-off (G4)*;
8. *Run record*.

Reader: the student. Decision enabled: which postings get the week's apply hours and which get networking hours.

**Scorer artifacts**, written by the shared scorer, not by this recipe: `roles.json` (its input), `scorer-profile.json`, `role-scores.json`, `role-scores.md`.

## Stop conditions and next action per result

| Result | Bucket | Next action | Where it goes in the 3-3-2 day |
|---|---|---|---|
| G0 fails | stop | fix the input file | — |
| G1 fails | **stop the whole run** | talk to the DSO; consider bridge employment that stops the clock | — |
| Apply | apply | tailor and submit this week; ask one contact for a referral first | 2 h apply + 3 h network |
| Consider | network-first | informational chat with someone on the team, then decide | 3 h network |
| Skip, gated by timeline | network-not-apply | a good sponsor whose hiring is slower than your runway: keep warm, revisit once bridge work or the STEM extension changes the clock | 3 h network |
| Skip, gated by liveness | skip | dead or ghost posting: do not apply | 0 |
| Skip, low score | skip | drop it | 0 |
| Blocked | human-check | resolve the reason code (alias, manual USCIS lookup, run liveness) | part of the 2 h research block |

A healthy run skips at least half of the **scored** roles; the report prints the skip rate.

## Proposed additions

1. **[TODO: DEV]** Patch `scripts/ats/liveness-browser.mjs` to compare `page.url()` with the requested URL and return `uncertain` when a job URL lands on a generic careers or search page. *Why:* the redirect false positive above lets a ghost posting pass the engine's own liveness gate; every recipe that trusts `ats:liveness` inherits it.
2. **[TODO: DEV]** Add the Greenhouse API status check (step 3's curl line) as a small maintained script under `scripts/ats/` that writes `greenhouse-api.txt`. *Why:* today it is a shell loop the person runs by hand. It is the only record that caught the ghost posting.
3. **[TODO: DATA SOURCE]** A USCIS H-1B Employer Data Hub extract (FY2023–FY2025, employer + NAICS + approvals) under `data/` with a provenance note. *Why:* it would turn the `no-company-row` / `no-h1b-record-joined` blocks (HubSpot, DraftKings) into records instead of manual lookups.
4. **[TODO: DATA SOURCE]** Any time-to-hire source (for example, posting-open to posting-closed durations from repeated `ats:scan` runs). *Why:* the timeline gate is the heart of this recipe and its main input, hiring lag, is pure assumption today.
5. **[TODO: DEV]** An employer alias table (former name → current name, with source) used before the exact match. *Why:* renames like Iterative Scopes → Iterative Health silently fail the exact join; today the person must assert each alias by hand.

## Run-log template (`logs/runs/2026fa-<handle>-<n>.md`)

```markdown
# Run <n> — opt-countdown — YYYY-MM-DD

## Summary
<two plain sentences: what ran, what it decided, what is still open>

- **Recipe:** recipes/cases/2026fa/<handle>-opt-countdown.md v<version>
- **Mode:** sample | live
- **Inputs:** persona <path>, candidates <path>, liveness <path>, greenhouse-api <path>, sponsors CSV <path>, SOC CSV <path>
- **Command:** <exact command>
- **Outputs:** <out-dir>/opt-countdown-log.json, opt-countdown-report.md, roles.json, role-scores.{json,md}
- **Result:** runway <d> days (bound by <x>); <n> evaluated → Apply <a> · Consider <c> · Skip <s> · Blocked <b>; skip rate <r>%
- **Gates:** G0 <pass/fail> · G1 <pass/halt> · G2 <n blocked, reasons> · G3 <n gated> · G4 <signed by / not yet signed>
- **Open issues:** <what did not work or is still missing>

## G4 sign-off (human)
| Role | Opened posting? | In target SOC? | Lag OK? | Decision | Name · date |
|---|---|---|---|---|---|
```
