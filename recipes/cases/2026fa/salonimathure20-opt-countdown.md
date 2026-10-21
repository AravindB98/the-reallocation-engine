---
status: DRAFT
todos_open: 5
last_gate: "live-run, 2026-10-21, logs/runs/2026fa-salonimathure20-2.md (machine gates G0, G1, G2, G2b, G3 passed on 12 live postings; human adequacy gate G4 not yet signed)"
attestation: null
recipe_version: 0.2.0
---

# opt-countdown — sponsor history checked against the OPT clock

## Executive summary

**What it does.** For an international master's student on F-1 OPT, this mode takes a short list of job postings and asks one question before the usual ones: *can this employer realistically hire you before your OPT clock runs out?* It computes how many search days you have left from your OPT end date and your remaining unemployment days. It checks each employer's H-1B approval history in the engine's sponsorship dataset. It confirms each posting is still open *today*, and reads what the posting itself says about sponsorship and experience. Then it hands the evidence to the engine's existing scorer for an Apply / Consider / Skip decision.

**Who it is for.** An MS student in Information Systems, Data Science or Computer Science. They are on post-completion OPT (year 1), unemployed, and targeting data/BI-analyst, systems-analyst or new-grad software roles (SOC 15-2051, 15-1211, 15-1252) in the Boston area that need H-1B sponsorship later. For this person the binding limit is the 90-day unemployment clock, not the 12-month OPT end date.

**What changed in v0.2, and why.** The v0.1 sample run on 2026-10-03 was re-checked live on 2026-10-21.

- The posting v0.1 had marked "Apply" had already closed, so v0.2 refuses to act on posting evidence more than 2 days old.
- One live posting at a company with a perfect H-1B record said, in its own text, that the role is "not eligible for immigration sponsorship". v0.2 reads the posting text and lets that sentence close the role.
- v0.1 had judged one role a good new-grad fit from its title. The posting actually asks for 5+ years, so v0.2 records the years each posting asks for.
- Three of v0.1's five proposed additions are now built and tested.

**What it decides, and what it doesn't.** It sorts postings into *apply now*, *network first*, *keep warm but don't apply* (good sponsor, slower hiring than your clock allows), *skip*, and *blocked: a person must check something*. It never decides for you. Every number is labeled as a record, a model judgment, or your own input. A missing or stale fact blocks the role instead of being guessed.

Two customers: this file is for the agent; `salonimathure20-opt-countdown.card.md` is for the person.

**Lifecycle, honestly.** The mode has completed a live run with every machine gate passing, but it stays **DRAFT**. The constitution's ladder needs zero open typed TODOs before SPECIFIED, and five remain (two data sources nobody has, one threshold a person must define, one maintainer decision, one ATS extension). The human gate G4 is also unsigned. Running live does not skip stages.

**Handoff condition (done when):**

- the run writes `opt-countdown-log.json` and `opt-countdown-report.md` to the output folder;
- every term in `roles.json` carries one of the three source labels;
- every blocked role lists a reason code;
- every live-mode liveness record is dated within `MAX_EVIDENCE_AGE_DAYS` of `as_of`;
- the scorer's own `role-scores.json` exists, proving the shared scorer (not a copy) made the decision;
- the human has signed or rejected every Apply/Consider row in the run log.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, lifecycle.
2. `DOMAIN.md`: especially *Known gaps* 3 (role quality weight 0) and 9 (local wage feeds nothing).
3. `scripts/score/role-scorer.mjs`: the composite this mode feeds; read `CONFIG`. Note that the sponsorship weight (0.35) is larger than the Apply threshold (0.30) (see *Cannot verify*).
4. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md`: how the SEC × DOL join was built and where it misses.
5. This mode and its card.

## Purpose and source inventory

| Evidence | Path or command (all exist and were run on 2026-10-21) | Label | Role in decision |
|---|---|---|---|
| H-1B approvals, denials, approval rate, top sponsored titles, H-1B median salary | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with H-1B columns filled) | record | vote (sponsorship) |
| Latest funding date/amount/stage | same CSV (`latest_funding_*`, mapped from SEC Form D) | record | context only, no scorer term |
| **Posting evidence** (v0.2): Greenhouse API status 200/404, `checked_at`, `first_published`, and three facts read from the posting text: an explicit no-sponsorship phrase, the minimum years asked, a printed pay range | `node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates <c.json> --out <posting-evidence.json>` (`--dry-run` lists the requests and writes nothing) | record | liveness **gate**; no-sponsorship phrase **gate G2b**; age, years, pay are context and flags |
| Posting liveness (browser) | `npm run ats:liveness -- --file <urls.txt>` → saved stdout. v0.2 patches the shared checker (`scripts/ats/liveness-browser.mjs`): a job URL redirected to a page without its job ID now reads `uncertain`, not `active` | record | second opinion; disagreements with the API are flagged |
| Employer alias (posting name → CSV name) | `scripts/contrib/2026fa/salonimathure20-opt-countdown/aliases.json`, each entry with a `basis` | your-input | exact-match join key |
| National median wage, cognitive pivot score | `data/bls/compact/soc_occupation_compact.csv` (exact O*NET code) | record | context only (scorer weight 0) |
| OPT end date, unemployment days used, buffer, as-of date, years of experience | persona JSON, e.g. `…/fixtures/live-2026-10-21/persona.json` | your-input | gate (timeline); experience-gap flag |
| Hiring lag per role (days from application to start) | candidates JSON, `hiring_lag_days` | your-input | gate (timeline) |
| Fit of the role to the person | candidates JSON, `fit` (judged from the posting's stated requirements, not its title) | model-judgment | vote |
| Decision | `node scripts/score/role-scorer.mjs` (called by the prototype; equals `npm run score`) | script output | — |

**Run it live (from the repo root, Node 20+):**

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/posting-evidence.mjs --candidates <dir>/candidates.json --out <dir>/posting-evidence.json
npm run ats:liveness -- --file <dir>/urls.txt > <dir>/liveness.txt 2>&1
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --mode live --persona <dir>/persona.json --candidates <dir>/candidates.json --liveness <dir>/liveness.txt --posting-evidence <dir>/posting-evidence.json --out-dir <out>
```

With no flags, the prototype still reproduces the v0.1 sample run (`--mode sample`, fixtures from 2026-10-03), so earlier evidence stays checkable. Offline tests: `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/` (20 tests).

**Data not used:** the Form D samples in `data/sec/form-d/processed/sample/` hold 2–3 filings per quarter and none of the target companies; funding context comes from the CSV's own `latest_funding_*` columns instead.

## Definitions this mode fixes

**Runway (days):** `min(opt_end_date − as_of, unemployment_ceiling − unemployment_days_used − buffer_target)`. The *start-by* date is `as_of + runway`. Labeled your-input, because every operand is the person's input and the script only does the arithmetic.

**Timeline factor:** `slack = runway − hiring_lag_days`. If slack < 0 the factor is **0**, a closed gate. Otherwise `min(1, 0.5 + slack / 60)`, which gives 0.5 at zero slack and full credit at 30 or more days of slack. The scorer treats a factor under 0.6 as a "soft spot" (Apply → Consider). Reason: a hire that lands on your last day of runway leaves no room for a background check or a slipped start date.

**Sponsorship mapping (DEFINE, closed in v0.1):** `p = (Approval_Rate / 100) × min(1, Total Approvals / 20)`. Tiers use the system design document's cut-offs (`docs/chapter-research-map.md` §Ch.5): Proven ≥ 0.65, Likely ≥ 0.35, otherwise Possible. The approval rate alone treats one approval out of one as equal to 150 out of 154, so volume saturates at 20 approvals. The 20 is this mode's own choice, not a published constant. A blank H-1B record is **Unknown → blocked**, never `p = 0`.

**Evidence freshness (DEFINE, closed in v0.2):** `MAX_EVIDENCE_AGE_DAYS = 2`. Posting evidence checked more than 2 days before `as_of`, or after it, blocks the role as `liveness-stale`. Reason: in the 2026-10-21 re-check, 2 of the 5 real postings that were live on 2026-10-03 had closed within 18 days, including the only Apply. Two days is short enough to act inside the same 3-3-2 week, and long enough not to force a re-fetch between drafting and submitting.

**Long-open posting (DEFINE, closed in v0.2):** `LONG_OPEN_DAYS = 90`, measured from Greenhouse `first_published` to `as_of`. A flag, never a gate. Reason: in the live run four postings had been open 142–295 days. That pattern fits an evergreen requisition, but a re-posted job can also reset the date. The flag asks the person to look; it proves nothing.

**Sponsorship-exclusion phrase (DEFINE, closed in v0.2):** the fixed patterns in `lib.mjs` (`SPONSORSHIP_EXCLUSION_PATTERNS`). They match explicit refusals ("not eligible for immigration sponsorship", "cannot provide sponsorship", "without the need for current or future visa sponsorship", "US citizenship is required"). They deliberately do not match the bare word *sponsor*, because a Formlabs posting contains "Regular sponsored professional development".

**Hiring-lag assumptions (your-input):** ≤ 200 staff: 30 days; 200–2,000: 45 days; > 2,000: 60 days. These are the person's own estimates, written into each candidate with a `basis`. The company-size bands are also the person's estimates. No repo dataset measures time-to-hire or headcount.

## Phase gates

All conditions are testable against paths that exist. The prototype enforces G0–G3; G4 is a person.

| Gate | Hard stop when | Testable condition | Who clears it, and what they must see |
|---|---|---|---|
| **G0 Input** | a persona/candidate file does not parse; a candidate lacks `role_id/company/title/soc`; a `fit`/`hiring_lag_days`/`csv_name` carries a label other than record / model-judgment / your-input; `--mode` is not `sample`/`live`; or `--mode live` has no posting-evidence file | prototype exits **2** | The person fixes the file or runs `posting-evidence.mjs`. No output is written past this point. |
| **G1 Runway** | OPT end date is on or before `as_of`, or unemployment days after buffer ≤ 0 | prototype exits **3**; `opt-countdown-log.json` has `"status": "halted"`; `roles.json` does **not** exist | The person checks their dates against their EAD card and SEVP portal (privately; never committed) and talks to their DSO. **Nothing is scored.** |
| **G2 Evidence (per role)** | no exact CSV row (`no-company-row`); blank H-1B columns (`no-h1b-record-joined`); no liveness record; liveness evidence **stale** (`liveness-stale`); or no hiring-lag input | role appears in the log with a `blocked` array and is absent from `roles.json` | The person resolves each reason: adds an alias with a `basis` to `aliases.json`, looks the employer up by hand, or re-runs `posting-evidence.mjs`. |
| **G2b Posting says no** (v0.2) | the live posting text matches a sponsorship-exclusion phrase | log entry has `gated_before_scoring: "sponsorship-policy"` and the matched phrase; role is absent from `roles.json`; decision `Skip` with source `mode gate G2b` | Machine gate, applied before scoring. A company's H-1B history does not outvote the posting's own sentence. The person may still network at the company for other roles. |
| **G3 Liveness** | Greenhouse API returns 404, or (without an API record, sample mode only) the browser checker says expired | `liveness.factor = 0` → scorer returns `Skip`, `gated: liveness`; any disagreement between the API and the browser check is written to `flags` | Machine gate. Without an API record the report flags every live role as *single-source*, and the person opens those postings themselves. |
| **G4 Adequacy (human)** | always, before acting on any Apply or Consider | run-log entry in `logs/runs/` has a filled sign-off line per Apply/Consider row | The person opens each posting and confirms four things: it is the job described; it is in the target SOC; the lag assumption is reasonable; the years asked are within reach. They record *apply / network / drop*, with their name and the date. |

Liveness, posting policy and timeline are **gates**, never votes.

## Workflow (agent)

1. **Read** the persona and candidates. Run G0.
2. **Runway.** Compute runway and start-by date. Run G1, and halt on failure.
3. **Posting evidence** (the only network step; do it the same day you decide):
   - run `posting-evidence.mjs --dry-run`, then without `--dry-run`;
   - write the candidate URLs to `urls.txt` and run `npm run ats:liveness -- --file urls.txt > liveness.txt 2>&1`;
   - save both files beside the candidates.
4. **Run the prototype** with `--mode live`. It joins each company to the CSV by **exact upper-case name**, via `aliases.json` when an alias is listed (no fuzzy matching). It builds labeled evidence, applies G2/G2b/G3, writes `roles.json` plus `scorer-profile.json`, and calls `scripts/score/role-scorer.mjs`.
5. **Stop at G4.** Show the person `opt-countdown-report.md`. Do not draft applications until they sign.
6. **Log** the run in `logs/runs/2026fa-<handle>-<n>.md` using the template below. Never edit `logs/RUN_LOG.md`; it is a protected path for contributors.

## What it can and can't verify

**Can verify (record-backed, as of the check time):**

- that a company name **exactly** matches a row in the 80 Days CSV, and what that row's approvals, denials, rate, titles and H-1B median salary are;
- that a Greenhouse job ID is or is not in the board's public API (200 / 404), *when* that was checked, and when the posting was first published;
- that the posting text contains (or does not contain) one of the fixed no-sponsorship phrases, the lowest number of years it asks for, and any pay range it prints;
- what the browser liveness checker reported for a URL;
- the arithmetic of runway, slack and timeline factor, given the person's inputs;
- the BLS national median wage and O*NET-derived pivot score for an exact O*NET code, or that the row or score is missing;
- that the decision came from the shared scorer (`role-scores.json` carries `_scorer: bayesian-role-scorer`), and that the composite can be recomputed independently (`assignments/submissions/salonimathure20/verify-run.py`).

**Cannot verify. Each of these is inferred or simply unknown:**

- **That a blank or missing company is a non-sponsor.** CarGurus, a large Boston employer, has no row at all in the CSV. HubSpot and DraftKings (v0.1) are missing or blank too. Blank means *unknown*.
- **That a posting silent on sponsorship will sponsor.** G2b only catches refusals the posting states. Most postings say nothing; silence is not a promise.
- **That a renamed company is the same entity.** "Iterative Health" matches only because a person asserted the alias "ITERATIVE SCOPES INC" in `aliases.json`.
- **That the approval counts are exact.** All 1,557 filled rows have *even* approvals and *even* denials. That pattern suggests a doubled join: rates are unaffected, but counts may be 2×. It is a suspicion, not a confirmed defect. The CSV has no fiscal-year column to test it against.
- **That past sponsorship predicts sponsoring this role, or registering this person, in the next lottery.**
- **Real hiring speed.** Every lag is an assumption. How long a posting has been open is not how long hiring takes.
- **Role fit.** Fit is a model judgment, and **the shared scorer can be carried by sponsorship alone**. The sponsorship weight is 0.35 and the Apply threshold 0.30, so a role with fit 0 at a Proven sponsor with open gates scores 0.341 → **Apply** (break attempt B6). In the live run, the only Consider (Abacus Insights, 0.230) asks for 7+ years against the persona's 1. The mode flags the gap but does not gate it (open item 3 under *Proposed additions*).
- **Years asked as a hard requirement.** "5+ years" is read from the text; whether the employer means it is unknown.
- **What a posting pays, or what Boston pays.** A printed range is shown when present. The BLS figure is a national median; `bls:local-wage` is not wired in (DOMAIN gap 9).
- **Immigration rules:** cap-gap, STEM-extension timing, or whether part-time or volunteer work stops the unemployment clock. A DSO answers these, not this mode.
- **Postings not on Greenhouse.** They get no API record and no posting-text check; the patched browser check is the only evidence (open item 5 under *Proposed additions*).

## Facts that bite, and how this mode handles them

- **Evidence goes stale fast.** Formlabs' Business Systems Analyst (v0.1's only Apply) and Iterative Health's Clinical Data Specialist both returned 404 on 2026-10-21, 18 days after they were live. Handled by the freshness rule.
- **Company history and posting policy disagree.** EverQuote (56 approvals, 100% rate, tier Proven) posts a Data Scientist role "not eligible for immigration sponsorship, now or in the future". Handled by G2b.
- **The browser checker and the API disagree in both directions.** v0.1 saw a dead job read as *active*; fixed in the shared checker. On 2026-10-21, four live postings read *uncertain* (no visible apply control) while the API said 200. When both exist the API wins, and every disagreement is flagged.
- **Role quality weight 0:** this mode does not propose a weight. BLS wage and pivot score are shown in a separate *context* table that the decision does not read.
- **`bls:local-wage` feeds nothing:** not used; the report says the wage shown is national.
- **Planned directories (`data/raw/`, `data/verified/`, `logs/gate-decisions/`) and the `snickerdoodle` CLI:** not referenced.
- **CI harnesses:** four harness scripts named in `.github/workflows/contrib-gate.yml` do not exist on upstream `main`. Not caused by this mode; recorded in the worked run.

## Output contract

**Agent log:** `<out-dir>/opt-countdown-log.json`. Top level: `recipe, recipe_version, mode (sample|live), run_at, status (complete|halted), persona, runway{days,start_by,binding,days_to_opt_end,unemployment_left_after_buffer,source}, summary{evaluated,scored,gated_before_scoring,blocked,apply,consider,skip,skip_rate_of_scored}, scorer_stdout, inputs{…paths}, human_gates_open[]`. One entry per role with:

- `csv_lookup{name_used,alias{value,basis,source,from?},found}`;
- `sponsorship{status,p,tier,source,derivation,record{…},title_keyword_match}` *or* `{status:missing,reason}`;
- `sponsorship_policy{status:open|closed|unchecked,phrase?}`, `posting_age{first_published,days_open,long_open}`, `experience_gap{required_min,persona_years,gap,phrase}`, `pay_printed{text}`;
- `funding_context`, `role_quality_context`, `fit`, `hiring_lag`, `liveness{factor,source,basis,checked_at,flags}`, `timeline{factor,slack_days,source}`;
- `blocked[]` (only when blocked), `gated_before_scoring` (only for G2b), `decision{recommendation,composite,reason,arithmetic?,source}`, `gated_by`, `next{bucket,action,hours}`.

A halted run writes `{recipe_version, mode, status:"halted", gate, reason, detail, inputs}` only.

**Human report:** `<out-dir>/opt-countdown-report.md`, in this order:

1. executive summary;
2. *Your clock*;
3. *Decisions and next actions*, sorted by bucket;
4. *Verified vs. inferred, per role*;
5. *What the posting itself says*;
6. *Context the score does not use*;
7. *What this run could not check*;
8. *Your sign-off (G4)*;
9. *Run record*.

Reader: the student. Decision enabled: which postings get the week's apply hours and which get networking hours.

**Scorer artifacts**, written by the shared scorer, not by this mode: `roles.json` (its input), `scorer-profile.json`, `role-scores.json`, `role-scores.md`.

## Stop conditions and next action per result

The mode **refuses to produce a score** when: the runway is zero or negative (G1, whole run); any input lacks a source label (G0); live mode has no dated evidence (G0); or, per role, the sponsor record is missing or blank, liveness is missing, stale or uncertain, or the hiring lag is missing (G2). It **refuses to send a role to the scorer at all** when the posting says it will not sponsor (G2b).

| Result | Bucket | Next action | Where it goes in the 3-3-2 day |
|---|---|---|---|
| G0 fails | stop | fix the input file / fetch evidence | — |
| G1 fails | **stop the whole run** | talk to the DSO; consider bridge employment that stops the clock | — |
| Apply | apply | tailor and submit this week; ask one contact for a referral first | 2 h apply + 3 h network |
| Consider | network-first | informational chat with someone on the team, then decide | 3 h network |
| Skip, gated by timeline | network-not-apply | a good sponsor whose hiring is slower than your runway: keep warm, revisit once bridge work or the STEM extension changes the clock | 3 h network |
| Skip, gated by G2b | skip | the posting refuses sponsorship: don't apply to it; the company may still be a networking target for other roles | 0 |
| Skip, gated by liveness | skip | dead or ghost posting: do not apply | 0 |
| Skip, low score | skip | drop it | 0 |
| Blocked | human-check | resolve the reason code (alias, manual USCIS lookup, re-fetch evidence) | part of the 2 h research block |

A healthy run skips at least half of the **scored** roles; the report prints the skip rate. If **every** scored role is gated by timeline, the finding is the clock, not the postings: the next action is bridge employment or smaller employers, not more applications.

## Additions: closed in v0.2

1. **[CLOSED: DEV]** Shared liveness checker redirect fix. `scripts/ats/liveness-browser.mjs` now exports `jobIdsIn` and `redirectedOffJob`: an *active* verdict on a URL whose job ID is missing from the final URL becomes `uncertain / redirected_off_job`. Evidence: on 2026-10-21 the unpatched checker still read `klaviyo/jobs/1000000003` as active; the patched one reads it as uncertain (`runs/live-2026-10-21/terminal/03a` vs `03b`). Unit test in `opt-countdown-v02.test.mjs`.
2. **[CLOSED: DEV]** Greenhouse status script. Delivered as `posting-evidence.mjs`, which saves dated status, publish date and posting-text facts instead of the bare curl loop. Evidence: `terminal/01` (dry run), `02a`/`02b` (live), tests.
3. **[CLOSED: DEV]** Employer alias table: `aliases.json`, exact match only, each alias with a `basis`. Evidence: the Iterative Health row resolves through it; the test checks that no fuzzy match happens.

## Proposed additions (open)

1. **[TODO: DATA SOURCE]** A USCIS H-1B Employer Data Hub extract (FY2023–FY2025, employer + NAICS + approvals) under `data/` with a provenance note. *Why:* it would turn `no-company-row` / `no-h1b-record-joined` blocks (CarGurus, HubSpot, DraftKings) into records. It would also settle whether the 80 Days counts are doubled, by comparing a few employers' counts.
2. **[TODO: DATA SOURCE]** Any time-to-hire source. One candidate is posting-open → posting-closed durations from repeated `posting-evidence.mjs` runs; this mode now saves `first_published` and dated 404s, so the history starts accumulating. *Why:* hiring lag is the heart of the timeline gate and is still pure assumption.
3. **[TODO: DEFINE]** An experience floor: a person-set rule such as "posting minimum years − my years ≥ 3 → Skip (gated: experience)", or a minimum fit below which a role cannot be Apply or Consider. *Why:* break attempt B6 shows the shared scorer gives **Apply** to a role with fit 0 at a Proven sponsor. In the live run, the only Consider asks for 7+ years against 1. The threshold is a judgment about the person, so a human must set it.
4. **[TODO: APPROVE]** Maintainer decision: should "the posting says it will not sponsor" become a third gate in the shared scorer (`scripts/score/role-scorer.mjs`), next to liveness and timeline? *Why:* today G2b lives only in this mode, so every other mode that scores EverQuote's Data Scientist role sees a Proven sponsor.
5. **[TODO: DEV]** Posting-text facts for Lever, Ashby and Workday postings (all three have public JSON for a single posting). *Why:* Greenhouse covers the boards in this run, but WHOOP, DataRobot and HealthEdge, all MA sponsors in the CSV, are not on Greenhouse. Their postings get no G2b check and no dated API record.

## Run-log template (`logs/runs/2026fa-<handle>-<n>.md`)

```markdown
# Run <n> — opt-countdown — YYYY-MM-DD

## Summary
<two plain sentences: what ran, what it decided, what is still open>

- **Recipe:** recipes/cases/2026fa/<handle>-opt-countdown.md v<version>
- **Mode:** sample | live
- **Inputs:** persona <path>, candidates <path>, posting-evidence <path> (checked <date>), liveness <path>, aliases <path>, sponsors CSV <path>, SOC CSV <path>
- **Commands:** <exact commands, in order>
- **Outputs:** <out-dir>/opt-countdown-log.json, opt-countdown-report.md, roles.json, role-scores.{json,md}
- **Result:** runway <d> days (bound by <x>); <n> evaluated → Apply <a> · Consider <c> · Skip <s> · G2b <g> · Blocked <b>; skip rate <r>%
- **Gates:** G0 <pass/fail> · G1 <pass/halt> · G2 <n blocked, reasons> · G2b <n, phrases> · G3 <n gated> · G4 <signed by / not yet signed>
- **Open issues:** <what did not work or is still missing>

## G4 sign-off (human)
| Role | Opened posting? | In target SOC? | Lag OK? | Years within reach? | Decision | Name · date |
|---|---|---|---|---|---|---|
```
