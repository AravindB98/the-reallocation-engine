---
status: DRAFT
todos_open: 8
last_gate: "live-run 2026-10-21: capture + evaluate on 20 real boards; machine gates C0, G0–G4 pass; G1a cleared by Shubham Bagwe (11 confirmed, 2 rejected); logs/runs/2026fa-bagwe-shubham1727-2.md; G5 not signed"
attestation: null
recipe_version: 0.1.0
---

# swe-opt-clock-live — today's real new-grad SWE postings, checked against the OPT unemployment clock

## Executive summary

**What it does.** This mode is for an international master's graduate in computer science on post-completion OPT who is **currently unemployed** and looking for **new-grad software engineering jobs** around Boston. Each morning it reads the **real public job boards** of Massachusetts companies that have sponsored H-1B software engineers. It keeps the postings a new graduate could take, opens each one in a browser to see whether it is really still open, and checks each against three things the student can't easily see:

1. whether the board really belongs to the company in the sponsorship record (two companies with similar names are easy to confuse);
2. whether that company has sponsored *software engineers*, not only senior staff;
3. whether the job could start before the student's **90-day unemployment allowance** runs out.

**Who it's for.** One situation: F-1 OPT year 1, unemployed, STEM extension not yet filed, targeting SOC 15-1252 Software Developers. It is not for a student on a long STEM-OPT runway, someone already employed, or anyone who doesn't need sponsorship. The mode refuses to run for them.

**What it decides.** A recommended Apply / Consider / Skip per posting, from the engine's existing scorer, plus where the posting goes in the student's day.
- **Held for the person, never guessed:** a board nobody has tied to the company, a page the checker couldn't read, and a company with no sponsorship record.
- **Fit is asked for last.** It is the one judgment no record answers, and it is asked for only on postings that pass every other check.
- **Weak-fit Applies go to networking.** When the scorer says Apply only because of a strong sponsorship history, the posting goes to networking, not to the application block.
- A person signs every decision.

**What its first live run found (2026-10-21).**
- **Boards:** 20 boards, 1,300 postings, 15 new-grad software postings, all 15 opened. 10 were open. 5 put their application form inside an embedded frame, which the engine's checker doesn't look into, so they were held for a person (a later probe confirmed the frames).
- **Today's clock:** with 30 unemployment days left, every posting starts too late under a typical hiring time.
- **A longer what-if clock:** the scorer said Apply to 6 postings, but 5 of those rested on sponsorship alone. One asked for five years of experience. So 1 posting got the application block.
- **Board check:** one slug guess for a sponsor resolved to a different company's board, which was kept on purpose as a decoy. The engine's scan printed that company's posting under the sponsor's name, because it labels every job with the name it is given. The mode's board-ownership gate dropped it.

**How far it has got.** It ran live, against real boards, and every automatic check passed. It is still a draft: eight proposed improvements are open, and nobody has yet signed the final decisions.

## Run record and lifecycle

**Lifecycle claim: DRAFT.**
- The live run on 2026-10-21 completed. The machine gates (C0, G0–G4) pass. Evidence: `logs/runs/2026fa-bagwe-shubham1727-2.md`; `assignments/submissions/bagwe-shubham1727/WORKED-RUN.md`, with verbatim transcripts in `…/runs/2026-10-21/terminal/`.
- A named human cleared the board-ownership gate (G1a): Shubham Bagwe, 2026-10-21, 11 confirmed and 2 rejected.
- The status stays **DRAFT** because the eight proposed additions below are open typed TODOs, and SNICKERDOODLE requires zero before SPECIFIED.
- Promotion path:
  1. close or retire the eight TODOs → SPECIFIED;
  2. the committed live run already has the RUNNABLE-SAMPLE evidence (full run, conformance, an audit generated and read);
  3. a run with G1a **and** G5 signed by the student → RUNNABLE-LIVE.
- `attestation` stays null: SNICKERDOODLE sets it only at VERIFIED. The worked run's attestation was signed by Shubham Bagwe on 2026-10-21, for v0.1.0 as committed with that signature.

**What it builds on.** This is the live successor to `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md` (sample mode).
- It imports that recipe's evidence rules unchanged: sponsor tiers, the clock, the timeline factor, and the closed-gate check of the scorer.
- It closes that recipe's proposed addition #1 ("live liveness capture"), which is now `capture.mjs`.
- The sample recipe and its scripts are not edited, so its attestation is not voided.

Two customers: this file is for the agent; `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.card.md` is for the person.

**Handoff condition (done when):**
- `capture.mjs` exits 0.
- `evaluate.mjs` exits 0, with `run-log.json` showing `status: completed`, `gates.G0_scan_crosscheck.result: pass`, and `gates.G4_scorer_conformance.result` ∈ {pass, skipped}.
- Every candidate in `run-log.json` is `scored`, `not-scored` with at least one hold code, or `dropped`.
- Every vote and gate term in `role-scores.json` carries a `source` in {record, your-input, model-judgment}.
- `gate-decisions.md` exists with every decision column blank.

"The report looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, TODO closure, lifecycle.
2. `DOMAIN.md`: the runnable commands and known gaps (items 3 and 9 apply: role quality has weight 0; local wage can't run here).
3. `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md` § "Rules the gates use". The tiers, clock and timeline formula are inherited verbatim.
4. `book/chapters/08-is-the-job-real-ats-detection-and-liveness.md` (liveness is a gate) and `book/chapters/10-the-visa-timeline-manager.md` (the three timeline cases).
5. `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/README.md`.

## Purpose — when to use it, and when not

**Use it** every morning before the "research and apply" block, when all of these are true:
- you are on post-completion OPT;
- you are unemployed, so the 90-day count is running;
- you need sponsorship;
- you are targeting new-grad backend, full-stack or platform SWE roles in or near Boston;
- you need to know, today, which real postings deserve an application, which deserve a networking message first, and which to drop.

**Don't use it**:
- when you are employed or on STEM OPT with months of runway. The timeline gate then rarely binds, and a broad sponsor triage fits better.
- for non-SWE roles. The title rule and the SOC 15-1252 row are wrong for them.
- when you don't need sponsorship. It stops with `persona-out-of-scope`.
- for anything legal. That goes to the DSO.

## Source inventory (every path exists in this branch; every command was run on 2026-10-21)

| Source / command | Exact path or command | Used for | Label |
|---|---|---|---|
| Board list (public) | `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/portals-boston-swe.yml` | which boards; title/location filters | record (boards) |
| Board-ownership decisions | `…/swe-opt-clock-live/fixtures/board-decisions.yml` (append-only; the last entry per board wins) | gate G1a | human-gate |
| Engine scan | `REALLOCATION_ENGINE_PORTALS=<portals> npm run ats:scan -- --dry-run` (= `node scripts/ats/scan.mjs --dry-run`) | discovery; the cross-check inside every capture | (applied) |
| Engine ATS providers | `scripts/ats/providers/{greenhouse,lever,ashby}.mjs`, `_http.mjs`, imported by `capture.mjs` | the same feeds the scan reads, with URLs | record |
| Engine location filter | `buildLocationFilter`, exported by `scripts/ats/scan.mjs` | the identical US/MA filter | (applied) |
| Engine liveness | `checkUrlLiveness` in `scripts/ats/liveness-browser.mjs` (imported); CLI `npm run ats:liveness -- <url>` for spot checks | G2 | record |
| 80 Days sponsor + funding CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | G1b entity; tier inputs; report-only funding | record |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | report-only "in a shipped quarter?" | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | report-only national median wage and job zone for 15-1252 | record |
| Ch.11 scorer | `scripts/score/role-scorer.mjs` (`npm run score`), unmodified, spawned by `evaluate.mjs` | the recommendation | its trace |
| Sample-mode rules | `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/lib.mjs` (imported, unchanged) | clock, timeline, tiers, closed-gate check | your-input (rules) |
| Persona (fictional) | `search/examples/neel-kapoor/profile.yml`; what-if `…/swe-opt-clock-live/fixtures/persona-neel-whatif-day10.yml` | G0 clock, `needs_sponsorship` | your-input |
| Hiring-time assumption | `…/swe-opt-clock-live/fixtures/time-to-start.json` (45 days, basis stated) | G3 | your-input |
| Fit ratings | `<run>/fit-ratings.json`, filled from the generated `fit-template.json` | the fit vote, open-gate postings only | your-input or model-judgment, as declared |
| Mode scripts | `node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs` · `…/evaluate.mjs` | workflow steps 3–6 | — |
| Tests | `node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs` (21 offline tests) | conformance of the mode's code | — |

**Tried and could not run (2026-10-21), so not used.** Transcripts are in the worked run, step 9:
- `python3 scripts/ats/detect-ats.py`: `ModuleNotFoundError: requests`. Board discovery used the scan instead (207 slug guesses → 24 boards).
- `npm run bls:local-wage`: `missing .venv`, and `data/bls/local-wage/` is absent.
- `python3 scripts/sec/refresh-recent-sec-quarters.py`: `ModuleNotFoundError: pandas`. The raw quarters it processes are not in this clone either.

**Not used:**
- the `snickerdoodle` CLI (roadmap);
- `data/raw/`, `data/verified/`, `logs/gate-decisions/` (these don't exist). G1a decisions live in `board-decisions.yml`; G5 lives in each run's `gate-decisions.md`.

## Phase gates

Every gate is a hard stop with a machine test. **G2 liveness and G3 timeline are gates, not votes**: they are multipliers in the scorer, and a gate at or below 0.05 (the scorer's own `gate_zero`) means Skip whatever the votes say.

| Gate | Test (machine) | Pass | Fail | Human clears by |
|---|---|---|---|---|
| **C0 capture** (whole capture) | browser launches; every board fetched or its error logged (one retry) | `capture.json` written | browser: exit 7, **no capture written** | installing the browser; re-running |
| **G0 clock, scope, capture** (whole run) | persona: `needs_sponsorship` is `true`; `opt_end_date ≥ as-of`; count dated and ≤ as-of; projected days < ceiling. Capture: dated ≤ 3 days before as-of, not after it; **its posting list equals the engine scan's**, recomputed from both lists (not the capture's own verdict), and found = found | clock computed | exit 3, `status: stopped`, no report | checking the echoed dates against the I-20/EAD/DSO record (`gate-decisions.md` § G0); re-capturing |
| **G1a board ownership** (human gate) | the board's latest entry in `board-decisions.yml` is `confirmed` or `rejected` **with** `by` and `date` | confirmed → the sponsor record may be looked up; rejected → **dropped**, never matched to a sponsor | `proposed`, missing, or unsigned → hold `board-ownership-unconfirmed` | opening the board, comparing names and locations with the CSV row, appending status + name + date |
| **G1b entity** | exactly one CSV row whose normalized `company_name` equals the board's legal name | tier computed | hold `unresolved-company` | fixing the legal name, or dropping |
| **Tier** (not a gate) | H-1B fields present | Proven / Likely / Possible → p | Unknown → hold `unknown-sponsorship` (never sent as 0) | asking the company. Unknown is not Avoid |
| **G2 liveness** | the engine's verdict on the live page, checked ≤ 3 days before as-of (local date). `active` counts **only if** the posting id survived the navigation | `active` → 1, `expired` → 0 | `uncertain`, redirected off the posting, stale, or unchecked → hold | opening the posting and recording what they saw |
| **G3 timeline** | start = as-of + max(hiring time, days to a cohort date printed in the title); factor per the inherited formula | factor to scorer | no hiring time → hold | judging any 0.05 < factor < 1. Legal questions go to the DSO |
| **Fit** (judgment, last) | only when every gate above is open: `p` in [0, 1] with a declared source. Bad values and unknown ids are warned and ignored | vote to scorer | hold `needs-fit-rating`, listed on `fit-worksheet.md` | rating it, or asking an AI and labeling it model-judgment |
| **G4 scorer conformance** | (a) inherited: exit 0; roles in = roles out; `profile_needs_sponsorship` = persona's; a gate ≤ 0.05 → Skip; every source in the allowed set. (b) new: the trace shows exactly the votes and gates fed, and composite = (Σ value·weight) × Π gates | report written | exit 4, `status: halted`, no report, scorer output removed | nothing. It halts |
| **G5 decision** | `gate-decisions.md`: G0 box ticked with name and date, and every job row has a decision, a name and an ISO date | the person may act | any row unsigned, so the report stays a recommendation | writing decision + name + date per job |

**Order matters.**
- A posting with a closed gate goes to the scorer **without** a fit rating. The answer is Skip either way.
- A closed gate decides only when every gate value is known. The scorer reads a missing liveness factor as 1, which would invent an open posting, so a held liveness is never sent.

### Rules the gates use (each is a recipe choice, labeled your-input)

Inherited unchanged from the sample-mode recipe: the tier thresholds and tier→p table, the SWE/senior title regexes, the new-grad cap on senior-only sponsors, the unemployment projection, and the linear timeline factor.

New in live mode:
- **New-grad title rule.**
  - The title must match the SWE regex and must not match the senior regex.
  - It must not state level III or higher, in any format: "Software Engineer III", "- II", "(III)", "Level 3".
  - Level I and II pass. A II is flagged, because it usually asks for experience.
- **Cohort date.** A title with a new-grad/graduate/university marker and a date ("June 2027 New Grads", "Dec 2026 & May 2027 Graduates") can't start before the earliest date it names. A season counts from its first month, and a year alone from Jan 1. **The hiring time is a floor:** a cohort date can push the start later, never earlier.
- **Redirect rule.** A dead Greenhouse posting can redirect, with HTTP 200, to the careers home page, which may show an "Apply" button. So `active` counts only if the posting's own id (Greenhouse number, or Lever/Ashby UUID) appears as a whole token in the final URL.
- **Freshness.** Every liveness check must be ≤ 3 days old, by local calendar date. New-grad postings at these companies close in days.
- **Default hiring time.** 45 days: about 4 weeks to an offer for a new-grad loop, plus 2 weeks to start. It is an assumption, printed on every job that uses it.
- **Block routing.** The 3-3-2 mapping is this mode's own, not the scorer's. When the scorer says Apply **and** the sponsorship vote alone clears its threshold (Proven 0.9 × 0.35 = 0.315 ≥ 0.30) **and** fit < 0.5, the posting goes to the networking block. The scorer's "Apply" is printed unchanged, flagged `sponsorship-only-apply`.
  - Found on the first live run: a posting asking for 5+ years, with fit 0.1, came out Apply.

## Workflow (verbatim commands, from the repo root)

1. Tests must be green before a run is trusted: 21/21 here, and the sample-mode suite it imports must stay 18/18.

```bash
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
```

2. Discovery and spot check with the engine's own scan. It is side-effect free and writes nothing:

```bash
REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/portals-boston-swe.yml npm run ats:scan -- --dry-run
```

3. Capture. It reads the boards, runs the same scan and compares posting lists, then opens every new-grad candidate. This is the only network step:

```bash
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs
```

4. **Stop. Read `capture-audit.md`.**
   - Clear G1a for any board marked `proposed` that you want evaluated: open the board, then **append** your decision, name and date to `board-decisions.yml`.
   - Spot-check two or three verdicts:

```bash
npm run ats:liveness -- <url from capture-audit.md> <url> <url>
```

5. Evaluate (offline):

```bash
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/<date>/capture/capture.json
```

6. If `fit-worksheet.md` was written, rate those postings in `fit-template.json`, save it as `fit-ratings.json`, and re-run with `--fit <that file>`. An AI may draft ratings only if each is labeled `model-judgment` with a one-line basis taken from the posting.
7. Conformance on everything the mode touches:

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/ recipes/cases/2026fa/ assignments/submissions/bagwe-shubham1727/
```

8. **Stop.** Hand `report.md` and `gate-decisions.md` to the person. Do not act on a recommendation until G5 is signed.
9. Log the run as `logs/runs/2026fa-bagwe-shubham1727-<n>.md` with the template below. Never edit `logs/RUN_LOG.md`: CI rejects student edits to it.

## What it can verify, and what it can't

This boundary is the point of the mode. The report repeats the right-hand column on every run.

| Can verify (a record, read by a script, today) | Cannot verify |
|---|---|
| What each company's public board listed at capture time: title, location, URL | Jobs on boards this mode doesn't read (Workday, iCIMS, company-built sites), or sponsors whose slug wasn't found. 37 sponsors were probed; 20 boards are read |
| That the mode's filters pass exactly the postings the engine's own scan passes, on the same boards | That the filters are *right* for this student. An unmarked title can hide a senior role (a "Full Stack Software Engineer" posting asked for 5+ years), and an unusual title ("Member of Technical Staff") is missed |
| That a named person tied a board to a sponsor record, and when | That the person was right. A careless confirmation attaches another company's sponsor history (break 3 in the worked run). The mode can't check the human |
| What the engine's checker saw on the posting page, when, and whether the page stayed on the posting | That an *uncertain* posting is open or closed. On 2026-10-21, 5 of 15 had their application form in an embedded Greenhouse frame the checker doesn't inspect (confirmed by a separate probe). A made-up posting id looked the same to the CLI. Held, not guessed |
| The company's H-1B approvals, denials, rate and top sponsored titles in the 80 Days CSV | **When** the approvals happened (no fiscal year), or that they were filed under SOC 15-1252 (no SOC column) |
| A start date printed in a posting title | How long this company actually takes to hire. Without a printed date it's the 45-day assumption, and on 2026-10-21 that one number decided every outcome under the real clock |
| That the scorer's composite is its own printed arithmetic on exactly the inputs fed | That the scorer's *weights* are right. A strong sponsorship record alone clears its Apply threshold; the mode routes around that, it doesn't fix it |
| The date arithmetic from the persona's own dates | Immigration law: what counts as employment, STEM eligibility, cap-gap. That is the DSO's call |
| Who supplied each judgment (fit, hiring time): declared in the input files, printed in the report | Whether a fit rating is *right* |
| — | How old a posting is. The feeds have the date, but the engine's providers drop it (proposed addition 4) |
| — | E-Verify enrollment, local pay (`bls:local-wage` can't run here), or a recent funding round (newest CSV funding date 2025-09-26) |

## Proposed additions

1. **SOC-coded sponsorship with fiscal years.** [TODO: DATA SOURCE]
   - *What:* DOL OFLC LCA disclosure files (`SOC_CODE`, `EMPLOYER_NAME`, `CASE_STATUS`, `RECEIVED_DATE`) for FY2023–FY2025, filtered to 15-1252 and the 18 employers in the portals file, at `data/dol/lca/15-1252-ma-sample.csv` with a provenance note.
   - *Why:* it turns "a title on record looks like SWE" into "sponsored this occupation, in these years". That is the largest inferred step left in the sponsorship evidence.
2. **E-Verify participation.** [TODO: DATA SOURCE]
   - *What:* the USCIS E-Verify participating-employer list for the same employers, at `data/uscis/e-verify/employers-sample.csv`.
   - *Why:* a STEM extension, and so any runway past the 90-day ceiling, needs an E-Verify employer.
3. **Time-to-hire evidence.** [TODO: DATA SOURCE]
   - *What:* replace the 45-day default with measured days from application to start. The source would be the student's own tracker (`data/ats/applications.md`), which is private and stays local, aggregated to per-company medians in `private/`.
   - *Why:* the timeline gate decided every outcome under the real clock on 2026-10-21, and its main input is a guess.
4. **Posting age.** [TODO: DEV]
   - *What:* the providers drop the feeds' own dates (Greenhouse `first_published`/`updated_at`, Lever `createdAt`, Ashby `publishedAt`). Keep them in `scripts/ats/providers/*.mjs` (the one declared maintained-file patch) and report the age per posting.
   - *Why:* on 2026-10-21 one candidate had been up since 2026-05-29. A months-old posting at a company with no recent hires is the classic ghost-job shape, and liveness can't see it.
   - *Handoff:* a provider test shows the date field, and `capture.json` carries `first_published` per posting.
5. **Liveness inside embedded application frames.** [TODO: DEV]
   - *What:* teach `scripts/ats/liveness-browser.mjs` to look for the apply control inside a Greenhouse/Lever iframe.
   - *Why:* 5 of 15 live postings on 2026-10-21 were held only because their form is framed. A probe confirmed a `job-boards.greenhouse.io` iframe with "Apply" or "Submit application" on all 5 (`assignments/submissions/bagwe-shubham1727/runs/2026-10-21/terminal/17-evidence-frames.txt`).
   - *Handoff:* those 5 URLs classify `active`, while `https://job-boards.greenhouse.io/formlabs/jobs/1` (a made-up id) does not.
6. **Export the scan's title filter.** [TODO: DEV]
   - *What:* `scripts/ats/scan.mjs` exports `buildLocationFilter` but not `buildTitleFilter`. Export it and delete the mirror in `live-lib.mjs`. After that, the cross-check can become a warning.
   - *Why:* a copied rule can drift. Today the per-capture posting-list comparison and a source-text test are what catch it.
   - *Handoff:* `live-lib.mjs` imports the filter, and the cross-check still matches.
7. **Decide the weak-tie boards.** [TODO: APPROVE]
   - *What:* a logged G1a decision for LENDBUZZ INC (left out of the 2026-10-21 question by mistake) and the six name- or product-only ties: Regent Craft, Overjet, Lookout, ISEE, Cloaked, 1upHealth.
   - *Why:* until then their postings are held. On 2026-10-21 that was two live Regent Craft postings.
8. **Set the fit floor for the 2-hour block.** [TODO: DEFINE]
   - *What:* 0.5 (`LIVE_RULES.apply_block_min_fit`) is a placeholder, chosen as "at least as likely a fit as not".
   - *Why:* it decides which of the scorer's Applies reach the application block. The student should set it, with one sentence of reasoning, after a week of real decisions.

## Output contract

### Agent outputs (JSON, for the next script or agent)

- `capture/capture.json`:
  - `workflow`, `step: capture`, `capture_version`, `captured_at`, `capture_date` (local)
  - `inputs{portals{path, sha256}}`, `filters`
  - `counts{boards, boards_ok, found, filtered_title, filtered_location, duplicates, scan_passed, opened, not_opened_cap, liveness_verdicts}`
  - `scan_crosscheck{command, exit, scan{found, filtered_title, filtered_location, duplicates, new_offers, offer_keys[]}, capture{…, offer_keys[]}, result{match, only_in_scan[], only_in_capture[]}}`
  - `boards[]{name, provider, careers_url, fetch{ok, total|error}}`
  - `postings[]{posting_id, source, listed_in_feed, company, board, title, location, url, liveness?{result, code, reason, final_url, id_retained, checked_at, checked_date}}`
  - It holds **observations only**. Every rule is re-applied by evaluate.
- `<run>/run-log.json`:
  - `workflow`, `step: evaluate`, `recipe`, `recipe_version`, `mode: live`, `run_id`, `as_of`, `status` (completed | stopped | halted)
  - `capture{…}`, `inputs{name: {path, sha256}}` (capture, persona, board_decisions, time_to_start, fit, sponsor CSV, BLS, scorer, Form D)
  - `rules`, `warnings[]`
  - `gates{G0_persona_clock, G0_capture_fresh, G0_scan_crosscheck, G4_scorer_conformance}`
  - `roles[]{role_id, company, title, url, title_rule, cohort_start, disposition (scored | not-scored | dropped), holds[], flags[], gates{G1a_board_ownership, G1b_entity, G2_liveness, G3_timeline}, sponsorship, liveness, timeline{…, lag_kind, lag_source}, fit, fit_needed, role_quality, funding, decision, next{block, action}}`
  - `scorer{command, exit, stdout, stderr}` (paths redacted)
  - `summary{candidates, dropped_wrong_board, scored, scored_gate_closed, not_scored, needs_fit_rating, apply, consider, skip, skip_rate_of_scored, timeline_closed, liveness_held, sponsorship_only_apply, apply_block}`
  - `stop_conditions[]`, `outputs{}`
- `<run>/roles.json` is the scorer input. `role-scores.json` and `role-scores.md` are written by the scorer itself.
- `<run>/fit-template.json` is written only when open-gate postings lack a rating, and is never pre-filled.

### Human outputs (Markdown, for the student)

- `capture/capture-audit.md` is the audit. Reader: the student, before evaluating. Decision enabled: which `proposed` boards to clear at G1a, and whether to trust today's capture. Sections: executive summary, run record (with the scan comparison), records in/out, boards with their G1a status, postings opened and what the browser saw, titles the new-grad rule removed.
- `<run>/report.md`. Reader: the student, deciding where today's hours go. Decision enabled: which postings get the 2-hour application block, which get networking first, and which to drop. Sections, in order:
  1. executive summary, with warnings for a skip rate under 50% and for sponsorship-only Applies
  2. the clock, including "starts within N days"
  3. decisions with the next action
  4. where each number came from, per posting, labeled
  5. dropped wrong-board postings
  6. what this run cannot tell you
  7. run record
- `<run>/fit-worksheet.md`: the open-gate postings that need only a fit rating.
- `<run>/gate-decisions.md`: the blank G5 sheet.

One artifact can't serve both readers (P5). The JSON carries field paths and hashes. The Markdown summaries carry none.

## Stop conditions — the mode refuses to produce a score rather than guess

- **The browser won't launch**: no capture is written (exit 7). An unchecked capture must never be readable as checked.
- **The capture is undated, older than 3 days, or dated after the run, or its posting list differs from the engine scan's**: stop (exit 3).
- **G0 fails, or the persona doesn't need sponsorship**: stop the whole run (exit 3).
- **G4 fails, including a composite that doesn't match the scorer's own trace**: halt (exit 4), write no report, and remove the scorer output.
- **A bad input file** (a persona, decisions, hiring-time or fit file that doesn't parse): exit 2, and no earlier log or report is left behind.
- **Asked to score a posting from a `proposed`, unsigned or `rejected` board "just to see"**: refuse. That puts another company's sponsorship history on this posting.
- **Asked to treat an *uncertain* page as open, or to raise the 3-day limit, so a preferred posting scores**: refuse. Re-capture instead.
- **Asked to give an Unknown-sponsorship company a number**: refuse. Unknown is not Avoid, and it is not 0.
- **Asked to pre-fill fit ratings without a label, or to change a rating after seeing the result**: refuse.
- **Asked to decide STEM eligibility or what counts as unemployment**: refuse and route to the DSO.
- **`--out-dir` inside the repo but outside `assignments/submissions/bagwe-shubham1727/`**: refuse (exit 2).

## Next action per result (the 3-3-2 connection)

| Result | Block | Action |
|---|---|---|
| Apply, fit ≥ 0.5 or not carried by sponsorship alone | **2 h research and apply** | Tailor and apply. In the first recruiter call, ask whether the team sponsors new-grad SWE H-1B registrations |
| Apply carried by sponsorship alone (fit < 0.5) | **3 h networking** | Talk to an engineer there about the experience the posting asks for, before spending the 2-hour block |
| Consider | **3 h networking** | One conversation with an engineer there first, about the soft spot the scorer named |
| Skip, closed posting, Proven/Likely sponsor | **3 h networking** | Informational chat; watch the board for a reopen |
| Skip, timeline closed | drop | Drop. Revisit only on a written start date before the safe deadline |
| Not scored, a gate already closed | drop | The missing evidence can't change the outcome |
| Not scored, board ownership unconfirmed | person, ≤ 5 min | Open the board; append a G1a decision with name and date; re-run |
| Not scored, liveness held | person, ≤ 5 min | Open the posting; record what you saw |
| Not scored, needs fit rating only | person | Rate it on the worksheet; re-run with `--fit` |
| Not scored, Unknown sponsorship | **3 h networking** | Ask directly; there is no record either way |
| Dropped, wrong board | drop | The posting belongs to a different company |

## Run-log template (`logs/runs/2026fa-bagwe-shubham1727-<n>.md`; students never edit `logs/RUN_LOG.md`)

```markdown
## YYYY-MM-DD — swe-opt-clock-live run <n>

- **Recipe:** recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md v<version>
- **Inputs:** portals <path> sha256 <first 12> · board-decisions <path> sha256 <first 12> · persona <path> · time-to-start <path> · fit <path or none> · sponsor CSV sha256 <first 12>
- **Commands:** capture.mjs [args] · evaluate.mjs --capture <path> [--persona] [--fit] · npm run ats:liveness -- <spot-check urls>
- **Outputs:** assignments/submissions/bagwe-shubham1727/runs/<date>/{capture/{capture.json, capture-audit.md}, <run>/{roles.json, role-scores.json, role-scores.md, run-log.json, report.md, gate-decisions.md, fit-worksheet.md?}}
- **Result:** <ok>/<boards> boards · <found> found → <passed> passed (scan comparison <match|mismatch>) → <opened> opened (active/expired/uncertain) · <scored> scored (Apply / Consider / Skip; <n> sponsorship-only) · <held> held · <dropped> dropped · gates G0 <r> G4 <r> · tests <n>/<n>
- **Gate decisions:** G1a <who, date, which boards> · G5 <signed by whom, or "not signed">
- **Open issues:** <what did not work; what is still unverified>
```

## Logging and privacy rules

- One file per run under `logs/runs/`. No real names except the person clearing a gate, no contact details, and no real visa dates. The persona is fictional. A real student's own run, with real dates or a real tracker, belongs in `private/`.
- Board data is public. Never copy the CSV's `phone`, `executive_officers` or `board_directors` columns into any output: the inherited loader drops them.
- A capture is a record of public pages on one day. Commit it as evidence. Never edit one; re-capture instead.
- `board-decisions.yml` is append-only. To change a decision, add an entry; never rewrite one.
