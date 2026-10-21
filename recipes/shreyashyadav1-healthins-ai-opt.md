---
status: DRAFT
todos_open: 8
last_gate: null
attestation: null
recipe_version: 0.2.0
---

# healthins-ai-opt — insurance/health applied-AI roles under an OPT clock

## Executive summary

**What it does.** It looks at real, currently open software jobs at insurance and health-technology companies and tells an international student which ones deserve their limited application hours. For every opening it asks five questions, cheapest first: can the public visa-sponsorship records even identify this company; is the title something a new graduate can hold; does the posting itself rule out an F-1 student; is the posting still open today (checked by opening it in a browser); and can hiring finish before the student's unemployment days run out. Only what survives goes to the repository's existing scorer, which answers apply, network first, or skip, and shows its arithmetic.

**Who it is for.** An international master's student in a STEM-designated information-systems or computer-science program, graduating in December and starting post-completion work authorization in January, who wants applied-AI or LLM engineering work (occupation code 15-1252).

**What the first real run found (20 October 2026).** 32 public job boards held 1,729 openings. 162 are software-type titles, but 48 of those belong to ten companies the sponsorship data cannot identify, so they were not scored. Another 96 ask for senior or staff level and 8 are outside the U.S.; one asks for five-plus years. Nine postings survived, and all nine were open. None earned "apply now": eight are "network first" and one is "skip". Two of those eight, at the companies with the strongest sponsorship records, would have been "apply now" on the repository scorer's own rule, because a sponsorship record alone clears its bar. The author held them back with a fit floor that was added after the first run, once reading the postings showed that the top-scored role was customer-facing rather than applied-AI work.

**What it cannot do.** It cannot see whether a company has sponsored this kind of role (the data lists job titles, not occupation codes), whether a company is enrolled in E-Verify, what a posting requires beyond the phrases it matches, how long a company will really take to hire, or whether a job board truly belongs to the company it is filed under (that link is the person's claim). It is a planning aid, not immigration advice.

## Technical header

**Readers.** This file is for the agent and the reviewer. The person reads the card (`recipes/shreyashyadav1-healthins-ai-opt.card.md`) and the run's `report.md`.

**Handoff condition (done when):** `candidates.snapshot.json`, `run-log.json` and `report.md` exist in the out-dir; `run-log.json.funnel` accounts for every offer (the arithmetic closes: software-type = entity-stopped + level + non-U.S. + cap + read); every board that failed to load is listed as failed, never counted as empty; every role is either scored by `role-scorer.mjs`, listed `Excluded` with a stage and reason, or listed `BLOCKED` with a non-empty reason; no role reaches the scorer without a numeric liveness factor from a dated check no older than `liveness_max_age_days`; every term in `role-scores.json` carries exactly one of `record`, `your-input`, `model-judgment`; `run-log.json.coverage.scorer_terms_labeled_record` states how many of those terms are records.

## Status (honest)

`last_gate` is null because no gate has been cleared by a named human; the real-data run of 2026-10-20 is logged in `logs/runs/2026fa-shreyashyadav1-2.md`.

| Stage | Claimed | Evidence or what is missing |
|---|---|---|
| DRAFT | **yes, current** | 8 typed TODOs below are open (`todos_open: 8`, counted by hand against the body: the repository's doctor reads only the top level of `recipes/` and never opens this file) |
| SPECIFIED | no | needs zero open TODOs, each closed with its evidence |
| RUNNABLE-SAMPLE | not claimed (needs SPECIFIED) | but the sample run is logged (`logs/runs/2026fa-shreyashyadav1-1.md`) and 45 offline tests drive the same code end to end on fixtures |
| RUNNABLE-LIVE | no | needs a live run with a named human clearing every gate; G7 is not cleared (the persona is fictional, nothing was applied for) |
| VERIFIED | no | the student signed the worked-run attestation on 2026-10-21 for the 2026-10-20 run (the name and date were typed by the agent at the student's instruction); no VERIFIED attestation record exists (`attestation: null`) and 8 TODOs are open |

What the real-data run did earn: it ran end to end against live public boards, through a real browser, into the unmodified scorer; its outputs were recounted independently, matched against the repository's own scanner and reproduced byte for byte, and nine deliberate attempts were made to break or stress it: five attack the mode itself, one breaks a copy of the code to prove the tests notice, one probes the repository's scorer, and two move one input to see what depends on it (worked run, `assignments/submissions/shreyashyadav1/WORKED-RUN.md`). Of the 29 numbers the scorer multiplied, 9 are records (the liveness gates, read by the repository's own checker); in v0.1.0 it was 0 of 27.

## Required reads

1. `SNICKERDOODLE.md`, `DOMAIN.md` (known gaps 3 and 9), `DATA_CONTRACT.md` §Zero-Conditions (fictional personas only; raw postings stay in `private/`).
2. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` (Unknown is not Avoid), `book/chapters/10-the-visa-timeline-manager.md` (the gate inputs and the three hiring-loop figures used below), `book/chapters/11-the-bayesian-role-scorer.md`.
3. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` and `…-join-validation-audit.md` (the join's false-positive rate is not measured by the repository).
4. `scripts/score/role-scorer.mjs` (read `applyProfile`, the liveness default and the `override` field before running), `scripts/ats/README.md`.

## Purpose

Answer one question for one kind of person: **of the openings that exist today at the insurance and health companies I care about, which can I realistically land before my unemployment days run out, and what should I do about each?**

Use it when: you are on F-1 and OPT has not started or has just started; you have a list of target employers whose job boards are on Greenhouse, Lever or Ashby; you will read the flags, not just the verdict.

Do not use it for: citizens or permanent residents (the sponsorship and clock gates do not apply), a ranking of "all jobs", or any immigration answer. STEM eligibility, E-Verify status and day counts are the DSO's and the employer's to confirm.

## Source inventory

| Evidence | Source (exists today) | Label | Role in the decision |
|---|---|---|---|
| H-1B approvals, denials, rate, sponsored titles | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 have H-1B fields) | record | sponsorship tier (through a rule) |
| Industry, website, funding stage and date | same CSV | record | sector flag, sibling check, board corroboration, funding context |
| Form D filing date | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` (50 companies per quarter) | record | funding recency when the sample has the company (0 of 9 on the real run) |
| National OEWS median, SOC 15-1252 | `data/bls/compact/soc_occupation_compact.csv` | record | context only (scorer weight 0.0) |
| Open offers: title, URL, location | the public board APIs, read through `scripts/ats/providers/{greenhouse,lever,ashby}.mjs` and `_http.mjs` | record | the candidate list |
| Posting text | the same board APIs; kept only in `private/real-postings/` | record | phrase screen |
| Posting still open | `scripts/ats/liveness-browser.mjs` (`checkUrlLiveness`, Playwright) | record | liveness gate |
| Which legal entity runs each board; hiring-loop size | `inputs/portals.healthins.yml` (`csv_company`, `bucket`) | your-input | entity gate; process days |
| OPT dates, unemployment days, buffer, level and years tolerance, fit floor | `inputs/persona.example.json` (fictional) | your-input | timeline gate; exclusions; fit floor |
| Title rule, tier thresholds, fit rule, break-even | `lib.mjs` | your-input (author's rules) | turn records into a tier, a fit and a factor |
| Combiner | `scripts/score/role-scorer.mjs` (CLI, unmodified) | n/a | Apply / Consider / Skip and the audit trace |

Commands (every one exists; every one was run; transcripts are in `evidence/`):

```bash
npm run verify && npm run doctor                          # needs PyYAML on PATH (fact 12)
python3 scripts/ats/detect-ats.py --csv <sponsors.csv> --company-column company_name --output <out.csv>   # 8 of 105 found
REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/portals.healthins.yml npm run ats:scan -- --dry-run
npm run ats:liveness -- <url> [<url> …]
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs                     # the only networked step
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 \
     --candidates assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json \
     --out-dir assignments/submissions/shreyashyadav1/runs/2026-10-20
node --test "scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/*.test.mjs"      # 45 tests, offline
```

Verification and discovery tools (`scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/`, 12, plus three small input files for the break attempts): `recount.py` (independent CSV recount), `diff-runs.mjs` (determinism), `screen-all.mjs` (the posting screen over every real posting; networked), `sweep.mjs` (move one persona number), `break-dead-url.mjs`, `inspect.mjs`, `export-sponsors.mjs`, `sector-gap.mjs`, `regression-v01.mjs`, `clean-checkout.sh`, `discover-boards.mjs` (the board probe; networked, run by hand), `board-coverage.mjs` (which boards the probe found and which were added by name) and `sync-notes.mjs` (checks that a snapshot's board list equals the portals file, and copies reworded notes without a re-ingest).

Not used, and why: `npm run bls:local-wage` (needs metro OEWS files that do not ship; it feeds nothing, fact 2); `scripts/sec/validate-h1b-join-sample.py` (needs full data); `python3 scripts/sec/refresh-recent-sec-quarters.py` (run once: fails on a fresh clone because `pandas` is missing, and would then stop because the quarters must first be downloaded with an SEC identity; TODO 3); `npm run resumes:pdf` (reads private résumés; this mode uses a fictional persona); any `snickerdoodle` command (roadmap).

## Facts that bite, and how this recipe handles each

| Fact | Effect here |
|---|---|
| 1. `role_quality` weight is 0.0 `[VERIFY]` | The OEWS median is context in the report and is not passed to the scorer. |
| 2. `bls:local-wage` feeds nothing | Not used. |
| 3. Only Form D samples ship | Form D hits are reported as `k/n` (0 of 9 on the real run). |
| 4. The CSV's newest funding date is 2025-09-26 (13 months before the run) | "Not recent" is only ever "not recent in the dataset"; the report states the data horizon, and when it is older than the recency window every funding label becomes `unknown-beyond-horizon`. v0.1.0 printed "stale", which overclaimed. |
| 5. Only 1,557 of 30,369 rows (5%) have H-1B fields, and all 1,557 counts are even (consistent with a doubled join) | Counts are compared with thresholds only, never quoted as facts. |
| 6. Carriers and public companies are largely invisible: the "Insurance" industry has 123 rows and 6 with H-1B data (upstream audit); Oscar, Clover and Komodo have no row at all | Boards whose company cannot be identified are stopped at the entity gate and listed; they are never fuzzy-matched. |
| 7. The four sector codes keep 105 of 1,552 sponsors; at least 27 sponsors whose names say health or insurance are filed as Other Technology or Other (Cohere Health, Flatiron Health, Hinge Health) | The candidate list is the person's list of boards, not a sector filter; `in_target_sector` is shown, not enforced. |
| 8. The repository's detector (Greenhouse and Lever only, slug from the legal name) found 8 of 105 in-sector sponsors; hand probing found more (Clarify on Lever under another slug, CodaMetrix and Lemonade on Ashby) | Absence of a detected board is not absence of an ATS; TODO 8. |
| 9. The scorer lets sponsorship alone clear its Apply bar (Proven: 0.9 × 0.35 = 0.315 ≥ 0.30), so fit cannot veto an Apply | G6c: a persona-set fit floor downgrades such an Apply to Consider through the scorer's own `override` field. The scorer file is not touched; TODO 7. |
| 10. A missing liveness term becomes 1.0 labeled `record` in `role-scorer.mjs` | A role without a fresh, dated, repo-checked liveness record never reaches the scorer. |
| 11. `--profile` with persona text containing "authorized" drops the sponsorship weight to 0 | This recipe never passes `--profile`; the default (`needs_sponsorship=true`) is correct here. |
| 12. `npm run verify` fails on a machine whose Python lacks PyYAML (`manifest-check`) | Environment, not repository: CI installs `pyyaml`. A throwaway venv on PATH fixes it. |
| 13. v0.1.0 cited Chapter 10's large-firm loop as 6–7 months; the chapter says about five months | v0.2.0 uses the chapter's three figures: startup about 6 weeks (42 days), mid-size about 12 weeks (84), large firm about 5 months (150). |

## Proposed additions (typed TODOs)

Closed since v0.1.0, with evidence: the `ats:liveness` wiring. `ingest.mjs` calls the repository's liveness checker, `livenessGate` accepts its three results (and v0.1.0's older `closed` and `not-found` spellings) and relabels any claimed `record` that does not name it, and the real run read 9 postings with it (`evidence/07-ingest.txt`, `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/liveness-properties.test.mjs`).

Still open, each with why it belongs:

1. `[TODO: DATA SOURCE]` DOL LCA disclosure extract with `SOC_CODE` and `EMPLOYER_NAME`, FY2023–FY2025, filtered to 15-1252, under `data/80-days-to-stay/`. It would replace the title proxy with a record and could settle the even-count question. Closure evidence: the file at the named path plus a one-line provenance note.
2. `[TODO: DATA SOURCE]` An E-Verify employer list (a public search export, if one exists) so the STEM-extension requirement can be checked. Today a posting that mentions E-Verify is a record of the posting, not of enrolment. Closure evidence: file plus provenance note.
3. `[TODO: DATA SOURCE]` Full Form D quarters 2025Q2 onward through `python3 scripts/sec/download-form-d-quarters.py` (gitignored output). It needs `pandas` and an SEC User-Agent with a real name and email, which this run did not send. It would move the data horizon forward and replace "not recent in the dataset" with something checkable. Closure evidence: files plus provenance note.
4. `[TODO: DATA SOURCE]` A sourced hiring-lag table per company (offer date to start date), with origin and date, to replace the size buckets. The sweep shows how much hangs on this one input: no decision changes between 84 and 144 days, four of the eight "network first" roles become "skip" at 150 days (the book's large-firm figure), and all nine at 171. Closure evidence: file plus provenance note.
5. `[TODO: DATA SOURCE]` A parent and subsidiary or acquisition table. Augmedix (Proven, 18 approvals) was, by public reporting that this run did not verify, acquired by Commure, whose row has none; the CSV links them nowhere. Closure evidence: file plus provenance note.
6. `[TODO: DEV]` A funding term for the scorer. Funding changes no decision today; it only orders the network list. A maintainer decision: a vote `funding_recency` with a weight to be argued. Not implemented here because it changes a maintained file.
7. `[TODO: DEV]` A scorer change so an Apply cannot rest on sponsorship alone (fact 9), instead of this recipe's fit floor. A maintainer decision for the same reason.
8. `[TODO: DEV]` Detector coverage: add Ashby and alternate slugs (website label, brand name) to `scripts/ats/detect-ats.py`, which found 8 of 105 where hand probing found more. A maintained script, so a proposal only.

## Phase gates

Each role stops at the first failed gate. G1 to G5 hold a role back before scoring; G6 is the scorer's; G7 is the human release.

| Gate | Testable condition | Pass | Fail | Exercised by |
|---|---|---|---|---|
| G0 persona | `validatePersona()` returns no errors: EAD date valid, authorization end after EAD and not before `--today`, used < ceiling, buffer < ceiling | run continues | **whole run stops**, exit 2, `status: failed`, no scores | test; break 7 |
| G1 entity | the board's claimed company resolves to exactly one CSV row by exact normalised name, and no other row with the same website holds approvals (the sibling check is skipped, and the log says so, when the row has no website or the website is shared by more than 6 rows) | the board's roles are examined | board stopped: `entity-not-found`, `entity-ambiguous`, `entity-sibling-has-approvals` | pipeline test; real run (10 of 32 boards); break 2 |
| G2 role filters (offline, cheap) | title is software-type; its level word is not in `persona.exclude_levels`; location is not explicitly non-U.S. | role proceeds | `Excluded` (stage `level` or `location`) | unit tests; real run (96 and 8) |
| G3 posting text | text read (at least 200 characters); no citizenship, clearance or U.S.-person requirement; years asked not above `persona.max_years_experience_ok` | role proceeds | `Excluded` (`posting-screen`, `experience`) or `BLOCKED: posting-text-missing` | unit and pipeline tests; real run (1 by years); the screen over all 1,729 real postings found 2 requirement hits |
| G4 liveness | the repository checker's `active` or `expired`, dated within `liveness_max_age_days` of `--today`; `uncertain` is never a factor | factor 1 or 0 | `BLOCKED: liveness-unchecked`, `liveness-stale`, `liveness-dated-after-today`, `liveness-uncertain:<code>` | property suite plus the BROKEN mutant; breaks 1 and 5 |
| G5 process days | an integer from the role or from the persona's size bucket | timeline computed | `BLOCKED: process-days-missing` | unit test |
| G6a liveness gate (scorer) | factor ≤ 0.05 | n/a | Skip (gated) | break 1 |
| G6b timeline gate (scorer) | factor ≤ 0.05 | n/a | Skip (gated) | break 8 |
| G6c fit floor | an Apply whose fit is below `persona.apply_fit_floor` | stays Apply | held at Consider via the scorer's `override`, machine recommendation kept | pipeline test; real run (2 held) |
| G7 human release | a named human reads `report.md`, opens each Apply or Consider posting, re-checks the dates against their own EAD card, and records the decision in `logs/runs/` | act | nothing is sent | **not cleared** on the real run |

Who clears what. G0 to G6 are machine rules that hold or release a role: a person clears a held role by fixing the input the report names and running again, and nothing is clicked. G7 is the only gate that needs a named human's decision. This recipe has no mechanism for it beyond the `Gate decisions` line of the run-log template, and on the real run nobody cleared it.

**Timeline formula** (your-input; Chapter 10 names the inputs but pins no formula):

```
expected_start      = max(today + process_days, EAD start)
unemployed_at_start = days_used + max(0, expected_start − max(today, EAD start))
factor = 1                         if unemployed_at_start ≤ ceiling − buffer
       = (ceiling − u) / buffer    if inside the buffer
       = 0                         if u ≥ ceiling, or expected_start > auth end
```

**Break-even** (estimate-free, computed by walking the formula itself): for the persona in `inputs/`, a hiring loop up to 143 days keeps the factor at 1, it starts to fall at 144, the scorer treats the gate as closed from 172, and it reaches 0 at 173. The ceiling is 90 until a STEM extension is approved; the recipe never raises it to 150 on a plan to file.

**Sponsorship tier** (your-input rule over record inputs): Proven (p 0.9) needs at least 4 approvals, a rate of 90 or more, and one sponsored title that passes the title rule; Likely (p 0.6) needs at least 2 approvals; in the CSV with none is Unknown (no p, never Avoid).

## What it can and cannot verify

| Can verify, and how | Cannot verify |
|---|---|
| The claimed company has exactly one CSV row under this exact normalised name (record) | That the claim is **true**. The board-to-company link is the person's. Claiming "Abridged Inc" for the Abridge board passes the name gate; only a website-versus-board-name hint flags it (break 2). Nothing in this repository checks it, and 12 of the 32 boards were added by name with no saved discovery output |
| Approvals, denials, rate and sponsored title strings, as the CSV states them | That the counts are right (all 1,557 are even), or that any petition was for 15-1252 (no SOC column) |
| A posting exists on a public board with this title, URL and location (record) | Roles on Workday, iCIMS, Taleo or a company's own site; the detector's 8 of 105 shows how much is missed |
| On the check date, the page loaded and showed an apply control, or showed the closed message (repository checker, record) | That it is open tomorrow; that the `record` label is true (it is given when the result names the repository checker, so a hand-edited snapshot that names it would be believed: there is no signature); that the page it read is the posting itself, because its apply test is a word match: Coalition's stored link shows an Apply button, then redirects to the careers listing within about two seconds, where an FAQ link containing the word still reads as an apply control (the role is open at its real address, `/job-posting/<id>`; worked-run transcripts 100 and 100b); the `uncertain` class was never seen live (0 of 9), only injected |
| A phrase in the posting text, quoted: citizenship, clearance, U.S.-person; years asked; "unable to sponsor"; E-Verify mention; "new grads" (record) | That silence means no requirement. The screen was precise on the 2 real hits it found among 1,729 postings, and it missed one phrasing until real text was read |
| The date arithmetic of the timeline gate and its break-even in days | The process-days estimate, the EAD date, STEM eligibility, the unemployment-day count |
| The funding date the CSV holds, and the data horizon | Any funding after 2025-09-26; whether a company is "funded" or "dry" |
| Level and location as the title and location strings say | Real seniority (a title is not a level) and where a bare "Remote" is remote |
| Which tier the records put a company in | Any scorer number as a record: 9 of 29 are (liveness only). Tier p, fit and timeline are your-input |
| That a note in the report is the author's own (the report says so above the table) | That any note about a company in the world is true: "acquired", "public company" and "a different business" are outside knowledge or judgment, were not checked, and appear only with a hedge |
| That 10 of 32 boards cannot be scored, and why | Their sponsorship history: the engine is blind there, which is the finding |
| n/a | What the employer pays, whether a role is applied-AI beyond a title rule, or whether anyone gets hired |

## Output contract

**Agent log** — `run-log.json`:

```
recipe, recipe_version, status [ok|failed], today, inputs{persona, candidates, csv, form_d_samples[], bls},
data_mode, data_horizon{date, months_before_today, source, file, note}, snapshot{…}|null, funnel{…}|null, boards[]|null,
rules{title_rule, posting_exclude, exclude_levels, tier_rule, funding_recent_months, fit_rule{mode, table[]},
      apply_fit_floor{value, why}, process_days_by_bucket{value, basis}, liveness_max_age_days, timeline_formula}  (all your-input),
coverage{candidates, entity_matched_in_csv "k/n", form_d_sample_hits "k/n", excluded_before_scoring, excluded_by_stage{},
         scored, blocked, blocked_reasons{}, scorer_terms_labeled_record "k/n", scorer_record_terms_are[]},
data_quality{approval_counts_even, denial_counts_even, note}, persona_visa{…}, timeline_slack{buffer_narrows_at_days,
         scorer_gate_closes_at_days, factor_zero_at_days}, role_quality_context{…},
scorer{path, invoked_as, invocations, stdout, stdout_first_pass, profile_passed: false, gate_zero_drift},
summary{Apply, Consider, Skip, BLOCKED, Excluded},
roles[]{role_id, company, title, posting{url, source, from}, location{value, source, class, class_source}, level, excluded{stage, reason}|absent,
        industry, sponsorship{status, tier, p, inputs{…each with source, file}}, entity_siblings{…}, board_corroboration{…},
        funding{csv, form_d_sample, recency, data_horizon}, liveness{factor, source, checked_on, method}|{status: missing, reason},
        timeline{factor, band, dates{…}}|{status: missing, reason}, jd_screen{…quotes…}|null, fit{p, source, rule}, process_days_estimate,
        e_verify{status: unverified, posting_mentions}, blocked[]|null,
        decision{recommendation, composite, reason, arithmetic, machine_recommendation, override}, flags[], next_action{block, action}},
network_targets[]
```

**Snapshot** — `candidates.snapshot.json`: the reduced ingest result (titles, URLs, locations, findings, funnel counts, per-board status). Posting text is never in it; it lives in `private/real-postings/` and is never committed.

**Person report** — `report.md`: executive summary; your clock with the break-even and the data horizon; how many roles survived each gate; decisions (with flags); boards the engine could not score; roles excluded before scoring, with quotes; why, role by role, every term labeled; network list; role-quality context; what this run could not verify. The scorer's own `role-scores.json` and `role-scores.md` are written beside them unchanged, except that the second scorer pass carries the fit-floor `override` when one applies.

## Stop conditions

Stop and invent nothing when:

- G0 fails (bad or past dates): exit 2.
- The CSV is missing, or the Form D sample directory is missing or holds no `.json` file: exit 2, name the path (a missing directory would otherwise print "0 of N hits", which reads as "looked, found none"). A missing BLS file does not stop the run: it feeds no score (weight 0.0), and the log and report say `missing`.
- `--out-dir` points at a tracked path outside this contribution's namespaces (or `output/`), or `--raw-dir` is not under `private/`: exit 2.
- Asked to fill a missing liveness check, EAD date or process estimate with a "reasonable" value: refuse; the role stays BLOCKED.
- Asked to treat an `uncertain` liveness result as active: refuse.
- Liveness evidence is older than the limit or dated after `--today`: hold every affected role; if nothing remains, do not run the scorer (break 5: 9 of 9 held at 224 days).
- The data horizon is older than the recency window: refuse every recency label (`unknown-beyond-horizon`).
- A board fails to load: report it as failed, never as "no jobs".
- A posting's text cannot be read: BLOCKED, never "no requirement".
- Asked to fuzzy-match a company name to clear G1: refuse; resolving the entity is the human's step.
- Asked to raise the ceiling to 150 because a STEM extension is planned: refuse until it is approved.
- Asked whether the student is STEM-eligible or an employer uses E-Verify: route to the DSO or the employer.

## Next action per result (the 3-3-2 hand-off)

| Result | Block of the day | Action |
|---|---|---|
| Apply | 2h apply | Tailor the application; ask about E-Verify before the final round. |
| Consider | 3h network | Find a contact first; confirm sponsorship for this role type and E-Verify; read the flags; then decide. |
| Skip, gate closed | reallocate | Drop now; move the hours to networking or the credibility project. |
| Skip, otherwise | skip | Nothing. |
| Excluded | skip | Nothing; the reason and quote are in the report if you disagree. |
| BLOCKED | human gate | Open the posting, resolve the company, or re-run the ingest; then re-run. |
| Board could not be scored | network | Find the employing entity's sponsorship history outside this dataset before spending hours there. |

## Run-log template (`logs/runs/2026fa-shreyashyadav1-<n>.md`; for `logs/RUN_LOG.md` the same fields)

```markdown
## YYYY-MM-DD — healthins-ai-opt <scenario>

- **Recipe:** recipes/shreyashyadav1-healthins-ai-opt.md v<version>
- **Inputs:** persona <path>, portals <path>, snapshot <path>, --today <date>; data: 80 Days CSV, Form D samples (<k> files), BLS compact; boards fetched <date>
- **Commands:** <exact commands, in order>
- **Outputs:** <out-dir>/{candidates.snapshot.json, roles.json, role-scores.json, role-scores.md, run-log.json, report.md}
- **Result:** boards n (failed f) · offers o · software-type s · stopped at entity e · excluded by stage {…} · live a/b · Apply a · Consider c · Skip s · BLOCKED b; scorer terms that are records k/n
- **Gate decisions:** G7 cleared by <name> on <date> for <role ids> | not cleared
- **Open issues:** <what did not work or is still missing>
```

## Changelog

- **0.2.0 (2026-10-20).** Real boards instead of hypothetical postings; liveness from the repository checker (a record, dated, expiring); entity sibling check and board-name corroboration; posting-text screen; level, location and experience exclusions; data horizon instead of "stale"; estimate-free break-even; fit floor through the scorer's override; process-days buckets from Chapter 10's own figures (v0.1.0 misquoted one); 45 tests including a negative control. Regression: v0.1.0's first sample scenario still gives all nine of its original decisions; its second now returns BLOCKED for all seven roles, because its hand-typed liveness checks are dated 2026-10-02 while the run is dated 2027-02-20 (141 days old), which the stale-evidence stop condition correctly refuses.
- **0.1.0 (2026-10-03).** Design plus a prototype on a fictional persona and hypothetical postings (0 of 27 scorer terms were records).
