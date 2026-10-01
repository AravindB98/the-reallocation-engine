---
status: RUNNABLE-SAMPLE
todos_open: 9
last_gate: "sample run completed 2026-09-30, logs/runs/2026fa-aravindkumar2504-1.md; adequacy NOT yet signed by a named human"
attestation: null
recipe_version: 0.1.0
---

# pre-OPT backend sponsor tiers

## Executive summary

This recipe serves one kind of job seeker: an international master's student who graduates soon, has not started work authorization yet, and wants a backend software job at a company that will sponsor a work visa. It answers a question the student cannot easily answer alone: for a given company, do public records show that it has sponsored this kind of job, and how much evidence stands behind that?

It reads a public table of about 30,000 companies (most with a funding date, some with a history of visa approvals), turns each company's record into a tier (Proven, Likely or Thin), keeps companies the data says nothing about as Unknown (listed when they are on the candidate's own list, counted otherwise) instead of treating silence as a no, works out whether the student's own calendar leaves room for a hiring process, and passes the result to the repository's existing scoring tool. It decides only whether a company deserves a person's next hour. It never decides to apply: a person must still confirm that a live posting exists and read it for traps the data cannot see.

Its main finding on the sample data is a limit, not a list: only about 5 percent of companies have any sponsorship record at all, so an honest run produces a short shortlist and a very large "unknown" remainder. The rest of this file is for the agent that runs the recipe and the person who signs it off.

## Lifecycle claim

- **Claimed:** RUNNABLE-SAMPLE, for the sample path only: the shipped company table, the BLS extract, the Form D samples, and a fictional persona. Evidence: the sample run recorded in `logs/runs/2026fa-aravindkumar2504-1.md`, the run outputs under `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/`, a passing offline test suite (its size and results are in the test report), and a conformance pass.
- **Not claimed:** RUNNABLE-LIVE (no live run; no person has cleared gate H1 or H2 on any company), VERIFIED (the attestation field is null; an attestation is included in the worked run but is not a named human's sign-off).
- **An honest caveat:** the lifecycle table asks for zero open TODOs before a recipe leaves DRAFT, and for a person to have read the audit before RUNNABLE-SAMPLE. The repository's four other RUNNABLE-SAMPLE recipes (`gate-behavior`, `gate-harness`, `local-wage-adjustment`, `skill-demand-monitor`) each carry zero open TODOs; this one carries nine typed TODOs, and no person has yet read the report. The TODOs are proposals for the engine and for the data, none is needed for the sample path, and each is justified below, because the assignment asks for them; but by the letter of the lifecycle this is the weaker claim, and a strict reader may lower it to DRAFT. The assignment itself says a recipe honestly marked RUNNABLE-SAMPLE, with a clear list of what it cannot do, scores higher than one that claims more, and this recipe lists what it cannot do below. The author decides which stage to claim; lowering it is a one-line change to `status:` above (the tests accept DRAFT, SPECIFIED or RUNNABLE-SAMPLE), after which the places that name the stage (the prototype's README, the test report and the pull-request text) are changed to match.
- **Sign-off:** the adequacy of the sample run is recorded only in the run-log entry. Until a named person signs it there, `last_gate` above says so.

## Handoff condition (done when)

A sample run is complete when all of the following hold. "Looks right" is not the condition.

1. The run command exits 0 and writes a human report and an agent log.
2. Every gate from G0 to G3 has a status in the agent log, and gates H1 and H2 are shown as open on every row that advances.
3. Every role sent to the scorer carries all three terms labelled `your-input`: sponsorship (the tier is classified from records, but the number sent is that tier's fixed value from the parameters), the liveness placeholder, and the timeline factor. The book's own example labels the sponsorship probability `record`; here the number is a parameter, so it says so.
4. No company that is unknown, has an unverified role type, was not found, or has an ambiguous name was sent to the scorer.
5. `npm run verify`, the folder's tests, and the personal-data scan of the branch history against the base branch all pass. (The scan of the working tree also reports one finding that pre-dates this work: an npm package author's address inside `package-lock.json`. It is a false positive in the base repository, not something this recipe adds.)

## Required reads

Read in this order before running:

1. `SNICKERDOODLE.md`, `DOMAIN.md`, `DATA_CONTRACT.md` (the Zero-Conditions section) and `CONTRIBUTING.md`.
2. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` (tiers; why Unknown is not Avoid), `book/chapters/10-the-visa-timeline-manager.md` (the timeline factor) and `book/chapters/11-the-bayesian-role-scorer.md` (the scorer).
3. `data/80-days-to-stay/data/README.md` and `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` (what the columns mean and the file's own audit).
4. This recipe and `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.card.md`.

## Purpose and source inventory

| Source | Path | Use |
|---|---|---|
| Company table (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | sponsorship record, sponsored titles, offered wage, funding |
| Its column notes and audit | `data/80-days-to-stay/data/README.md`, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` | column meaning and the note on blank sponsorship fields; the file's own vintage and SOC-code gap |
| Wage reference | `data/bls/compact/soc_occupation_compact.csv` | national median wage for the SOC code (shown, not scored) |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | a spot check of the table's funding columns |
| Name rule | `scripts/sec/entity-resolution.py` | source of the exact-match normalization the prototype ports |
| Scorer | `scripts/score/role-scorer.mjs`, run as a command (the script `npm run score` runs) | the decision core; never copied |
| Liveness check | `scripts/ats/check-liveness.mjs`, run as `npm run ats:liveness` | gate H1, run by a person |
| Persona | `search/examples/kiran-rao/profile.yml` | the fictional candidate (invented dates) |
| Prototype | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs` | runs the recipe end to end |
| Parameters | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/params.json` | thresholds with their reasoning |
| Title rules | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/role-families.json` | the title-to-role-family rule |
| Sample watchlist | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt` | the candidate's own company list |
| Tests and fixtures | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/fixtures/` | offline tests; synthetic data only |
| Evidence checks | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs` | the commands behind the pasted evidence in the worked run |
| Deliberate breaks | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs` | breaks the prototype one way at a time and checks that the tests notice |
| Related drafts (not reused) | `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md`, `recipes/cases/2026su/case-backend-swe-opt-triage.md`, `recipes/cases/2026su/case-opt-timeline-fit-company-targeting.md` | see the next section |
| Run outputs | `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/` | report, agent log, scorer input and output |
| Run-log template | `recipes/_shared.md` | the shape of a run-log entry |

Gate decisions are recorded in the run-log entry under `logs/runs/` because the planned decisions folder named in other recipes does not exist in this repository.

**Related drafts, and what is different here.** Three unbuilt Summer 2026 drafts cover nearby ground: a pre-OPT full-stack/backend sponsor triage, a backend sponsorship triage, and an OPT timeline-fit targeting recipe. Each is status DRAFT with 13 to 14 open typed TODOs, and each names as its only source a `pantry/` placeholder that does not exist in the repository. This recipe reuses none of their text. What it adds is a built prototype with offline tests, exact paths that exist, a tier that keeps small samples from ranking high, the pre-authorization unemployment clock computed from dates, and a gate that checks the repository scorer's answer.

## Parameters (proposed by the assistant, not yet confirmed by the author)

These are decisions, not facts. The assistant proposed each, with one sentence of reasoning in `params.json`; the author has not yet confirmed or changed any of them. They are labelled `your-input` in the run because they are inputs to the run, and none was tuned against the outcome of a run.

| Parameter | Value | Reasoning in short |
|---|---|---|
| Maximum data age | 6 months | funding and filing history go stale; a planning default with no test behind it |
| Funding window for discovery | 24 months back from the data's own newest funding date | a heuristic for "may be hiring", not a tested predictor |
| Proven tier | at least 10 reported approvals and at least 90 percent approved, with a matching title | one filing or a duplicated count must not carry the top tier (every count in the file is even) |
| Likely tier | at least 4 reported approvals and at least 70 percent approved, with a matching title | still at least 2 if the counts are double-counted |
| Thin tier | a matching title exists but the counts fall below Likely | set aside by the recipe's own rule; see the next row |
| Scorer value for a tier | Proven 0.9, Likely 0.6, Thin 0.3 | 0.9 and 0.6 are the chapter 11 worked-example values, not calibrated probabilities. 0.3 is a low value chosen so that the scorer agrees with the rule that thin evidence is set aside (0.3 x 0.35 = 0.105, under the 0.20 Consider line for any timeline factor), so a Thin row is set aside by construction. That is a design decision, not a measured result, and the scorer adds nothing to a Thin row's verdict |
| Expected days to start | 75 (from the persona) | one assumption applied to every role alike |
| Title rule | `role-families.json` | a set of patterns proposed by the assistant; its measured errors are in the title check |

The persona supplies the dates, the unemployment ceiling (90) and the buffer (20). All of it is the candidate's own input.

**The timeline rule (gate G3).** Chapter 10 describes the timeline factor in words and gives no formula, and no code in the repository computes it, so this rule is a proposal:

- expected start = the later of (run date + expected days to start) and the day work authorization starts;
- days projected at start = unemployment days already used + the days from the later of (run date, authorization start) to the expected start (this assumes the candidate stays unemployed until the start);
- slack = the unemployment ceiling minus days projected;
- factor = 0 if the run date or the expected start is after the authorization end, or if slack is 0 or less; 1 if slack is at least the buffer; otherwise slack divided by the buffer.

Worked example, run date 2027-06-01: expected start 2027-08-15; 75 days projected; slack 90 - 75 = 15; buffer 20; factor 15 / 20 = 0.75. The run always reports the dates and day counts behind the factor. It is a planning multiplier, not legal advice.

## Proposed additions

Each is justified and typed. None is needed for the sample path.

1. [TODO: DEV] **Fix the scorer's reading of the candidate's status.** `scripts/score/role-scorer.mjs` decides whether sponsorship is needed by matching free text with a loose pattern (the word "authorized" counts as "no sponsorship needed") and ignores an explicit `needs_sponsorship` field. Measured on 2026-09-30: for a proven sponsor the composite moves from 0.446 (Apply) to 0.178 (Skip) when the older persona's wording is used. `search/examples/README.md` says the authorization-parsing fix landed in PR #37 (`search/examples/aarav-patel/profile.yml` calls it the Summer 2026 fix), but the scorer file here has a single commit and no such fix. It belongs because it silently reverses the recommendation for exactly the students the engine is for. Until it is fixed, gate G2 guards every run.
2. [TODO: DEV] **Make missing gate evidence fail closed.** A missing liveness value defaults to 1.0 (open) and is labelled `record`; a missing timeline value defaults to 1.0 and is labelled `your-input`. Either way a value nobody supplied counts as open, and the liveness default contradicts the engine's own rule that nothing is a record unless a record produced it. This recipe always supplies both values with an honest label; the scorer should refuse, or label the value unchecked.
3. [TODO: DEV] **Give funding a place in the decision.** The scorer has terms for sponsorship, fit and role quality only, so funding cannot change Apply, Consider or Skip, although chapter 7 weights funding recency at 0.20 in its tier composite. This recipe uses funding as a pool filter and a displayed fact. The Form D spot check found one round the table missed although it had been filed before the table's own newest date, and 5 of the 14 matched companies have no funding in the table at all (see the worked run), which is a reason to model funding rather than filter on it.
4. [TODO: DEV] **Decide a role-quality weight.** The scorer's weight is 0.0, so wages cannot affect a decision. This recipe shows the offered wage against the national median for the SOC code as a plain ratio, with no threshold, and leaves the judgment to the reader. A weight needs an authorial decision.
5. [TODO: DEV] **Accept a labelled fit input.** Without fit, the composite cannot exceed 0.315, so a timeline factor below about 0.95 moves a Proven company from Apply to Consider, and below about 0.64 to Skip. That is a property of the scorer's weights, not of the evidence. An optional fit file, labelled model-judgment or your-input, would fill the missing 0.30.
6. [TODO: DEV] **Automate the reading part of gate H2.** A screen over posting text for U.S.-person or export-control wording, "no sponsorship", graduation windows and start dates, quoting the matching sentence, would save time. It must still be cleared by a person. It belongs because this is the failure a student is least able to see: the company record is fine and the posting is closed to them.
7. [TODO: DEV] **Batch gate H1.** Run `npm run ats:liveness` over posting URLs a person supplies and write the results back as evidence. It needs URLs the data does not contain.
8. [TODO: DATA SOURCE] **SOC-coded sponsorship records.** The company table has job titles but no SOC codes (its own audit says so), so the recipe matches titles with a rule of its own. The raw filing records with SOC codes are not in the repository; the file path is not known.
9. [TODO: DATA SOURCE] **Provenance and vintage for the counts.** The table has no years for its approvals and denials, every count is even for a reason the documentation does not give, and its newest funding date is 2025-09-26. A fresher, documented source, or an explanation from the table's maintainer, would let the tiers rest on firmer ground. Full Form D quarters are fetched by `scripts/sec/download-form-d-quarters.py` and are not committed.

## Phase gates

Each gate stops at its first failure. The first four are run by the prototype; the last two are for people.

| Gate | Testable condition | Pass | Stop |
|---|---|---|---|
| G0 data vintage | the newest `latest_funding_date` in the company table is at most 6 months before the run date | run continues | exit 3, nothing written, unless `--accept-stale-vintage` is given; the acceptance is then recorded in the agent log and stated in the report |
| G1 persona | `needs_sponsorship` is true (this recipe is for a candidate who needs a sponsor; false is refused, because the scorer would then drop the sponsorship term and every company would come back set aside for a reason unrelated to the evidence), and the SOC code, role family, authorization start and end dates, unemployment days used, ceiling, buffer and expected days to start are all present and well typed | run continues | exit 2, naming every problem at once; no defaults are invented |
| G3 timeline (a multiplier) | the factor computed from the persona's dates is above the scorer's own closed-gate line (0.05) | the factor is passed to the scorer as `your-input` | the factor is 0, or at or below that line: every role is scored to Skip and the report says why (start after authorization ends, unemployment ceiling reached, authorization already ended, or a factor the scorer treats as closed) |
| G2 scorer integrity | the scorer's echo of "needs sponsorship" equals the persona's value, every gate value came back labelled `your-input`, no unexpected override appeared, and every role sent came back once | outputs are written (a scorer file other than the repository's is named as a stand-in in the log, in G2 and at the top of the report) | exit 4 and nothing written |
| H1 liveness (human) | `npm run ats:liveness -- <url>` reports the posting as active, and a person confirms it is a backend role | the row may move to H2 | the row stops; an expired posting means Skip |
| H2 posting eligibility (human) | a person has read the posting and found none of: U.S.-person or export-control wording, a no-sponsorship statement, a graduation window the candidate misses, a start date earlier than the earliest legal start | the row may earn a tailored application | the row stops |

A person clears H1 and H2 by writing the company, the date and the decision into the run-log entry. The prototype runs the gates in this order: G1, then G0, then G3, then G2; the table groups them by what stops the run.

## Workflow

Run from the repository root. Prerequisites: `npm install`. Only `npm run verify` and `node scripts/conformance.mjs` need Python's YAML package (put a virtual environment that has it first on the path); the prototype does not.

1. Check the toolchain:

```bash
npm run doctor
```

2. The sample run (real data, fictional persona; the data is a year old, so the acceptance flag is required and is recorded). This writes to `/tmp/tiers-run`, so it changes no tracked file:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

The committed sample in `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/` was made by the same command with `--out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30`.

3. Read the report first (`report.md`), then the agent log (`run-log.json`) for any row you doubt. Check that the watchlist rows land where the comments in the watchlist file say they should.
4. See the timeline gate move by changing only the run date and the days already used:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-06-01 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-june
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-08-01 --days-used 61 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-august
```

(`node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scenarios` runs five such scenarios and prints the table.)

5. Run the offline tests (no network; the real scorer is run as a command):

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

To see that the tests would notice if the code were wrong, `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs` breaks the code one way at a time in a private copy and reports whether a test failed (it takes a few minutes).

6. For each company that advances: a person finds a live backend posting, runs `npm run ats:liveness -- <posting url>` (gate H1), reads the posting (gate H2), and records the decision.
7. Record the run using the template at the end of this file.

## What it can and cannot verify

This boundary is the point of the recipe. Values carry one of three labels: **record** (read from a repository data file, or plain arithmetic on record values), **your-input** (the persona, the run date, and the parameters, which the assistant proposed and the author has not yet confirmed), **model-judgment** (a judgment a model makes about a company; the prototype makes none, although the thresholds and the title rule were proposed by the assistant, which is why they are listed as unconfirmed parameters).

| Can verify (label) | How it was checked |
|---|---|
| A company's row exists under an exact normalized name, is missing, or is ambiguous (record) | the JavaScript name rule was compared with the Python original on all 30,569 names in the table and the Form D samples, and the title-list reader with Python's `ast.literal_eval` on all 1,557 title cells: 0 differences each (`checks.mjs parity-names`, `checks.mjs parity-titles`). The name rule can differ from the Python one on exotic Unicode characters that do not occur in the data |
| Its approvals, denials, approval rate, listed titles, offered median wage and latest funding (record) | the worked run shows the raw table cells beside the run log's values for named companies, with the arithmetic redone (`checks.mjs source`, run by the assistant) |
| The rate column equals approvals divided by approvals plus denials (record) | true in all 1,557 rows that have a record |
| The national median wage for the SOC code (record) | read directly from the BLS extract: 133,080 for 15-1252, 2024 |
| Whether the table's funding agrees with Form D, for the few companies in the samples (record) | 15 of 200 sample records match one company (14 companies: Databricks has two records). A table can only miss what had been filed when it was made, so the filing date is compared with the table's newest funding date (2025-09-26): 4 records agree exactly on date and amount; 1 (Composabl) has a later first sale that was filed before that date, so the table missed it; 5 were filed after that date (RunBuggy, Databricks twice, Crypto Co, Gearflow), so the table may simply predate them and they are not counted as misses; 5 have no funding in the table |

| Inferred by a rule (label) | The rule and its weakness |
|---|---|
| The tier (record, rule-derived; thresholds are your-input) | counts are used as reported; they are all even and have no years |
| Whether a title is backend-style (record matched by a rule the assistant proposed) | on a fixed-seed sample labelled by the assistant: of 40 matched titles, 3 were clear false positives (a UX title and two perception specializations) and 5 borderline; of 40 unmatched titles containing "engineer", "developer" or "technical", 1 was a clear miss ("Member, Technical Staff", a comma variant the pattern does not allow) and 3 borderline. One labeller, not yet checked by the author, so treat as indicative |
| Whether a company's matched titles look senior (record read by a rule) | a list of senior markers (senior, staff, principal, lead, architect and others; "Member of Technical Staff" is not counted as senior). Of the 59 companies that advance, 20 list only senior-marked titles, which is no evidence that they sponsor a new graduate |
| The timeline factor (your-input) | a planning multiplier from the candidate's own dates, by the rule above; it assumes the candidate stays unemployed until the start |

| Cannot know | Why |
|---|---|
| That any posting exists, or is open to this candidate | the table holds history, not postings (gates H1 and H2) |
| That the company will sponsor this person, in this role, now | the record is a rear-view mirror; the book says so |
| That "recently funded" means "hiring" | the Form D spot check found one matched company whose later round the table missed although it had been filed before the table's own newest date, and 5 of the 14 have no funding in the table; and a very large old company can appear as recently funded (Intel, with a "Series B" dated 2025-03-18) |
| When the company table was made | its newest funding date is 2025-09-26, but nothing says when the snapshot was taken, so a Form D filed after that date may or may not have been available to it |
| That an unmatched title means "does not sponsor this role" | the title list is capped; such companies are held, never skipped |
| That a missing record means "does not sponsor" | `data/80-days-to-stay/data/README.md` says a null sponsorship field does not necessarily mean the company does not sponsor: it means the data holds no "trace of sponsorship activity" for it |
| What the counts mean | all are even, they have no years, and the documentation says "petitions" while the book speaks of filings |
| Legal eligibility, STEM eligibility, the unemployment ceiling | for the school's international office |
| Whether the wage is fair for this candidate | shown as a ratio only; ratios well below 1 (for example 0.55 to 0.75) are a prompt for a person to look |

## Facts about the engine that this recipe takes into account

The assignment lists eight facts that a recipe must not ignore. Where each one touches this recipe:

1. **Role quality has weight 0.0 in the scorer.** The recipe shows the offered wage against the national median as a plain ratio, outside the scorer, and proposes a weight as a typed item (proposed addition 4).
2. **`bls:local-wage` feeds nothing**, and 7. **`npm run bls:local-wage` fails on a fresh clone.** The recipe does not use it. It uses the national median from the compact BLS extract, so a metro-adjusted band is not used and the national ratio can mislead for a candidate who will work in a high-cost metro; ratios are a prompt for a person to look, never a verdict.
3. **Only Form D samples ship.** The Form D check runs on the four shipped sample files (200 records) and says so in every report.
4. **Some directories named in recipes do not exist.** Every gate points at paths that exist; decisions go in the run-log entry because the planned decisions folder does not exist.
5. **The `snickerdoodle` CLI is roadmap, not runtime.** It is not used.
6. **"Every top-level recipe is still DRAFT."** The repository's doctor reports four RUNNABLE-SAMPLE recipes at the top level, which is why the lifecycle caveat above compares this recipe with them.
8. **`scripts/sec/validate-h1b-join-sample.py` needs full data it does not have.** It is not used. The join between the company table and Form D is the recipe's own exact-name match on the shipped samples, and the gap (only samples, not the full quarters) is stated above.

## Output contract

The run writes two files for two readers, plus the scorer's own files, into the folder named by `--out-dir` (by default `private/tiers-run/<run date>`, which git ignores). A run whose inputs all sit in the committed sample locations (`search/examples/`, this recipe's `sample-inputs/` and `fixtures/`, and the repository's own company table, wage file and Form D samples) may write inside the repository only in this recipe's own runs folder. A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside those locations, makes the run real-data, and its output may go only to `private/` or outside the repository; the program compares where paths really are (through symlinks and letter case) and refuses otherwise. It checks where a file is, not whether git tracks it, so a real file placed in a sample location would be treated as a sample: keep real data in `search/` (outside `examples/`) or in `private/`. Paths outside the repository are written into outputs as `<outside the repository>/name`, never as this machine's folders. The four files this program writes are byte-identical when the same inputs are run again into the same output folder (the run record names that folder); the scorer's two files carry the date the scorer ran (in UTC), so running on another day into the committed sample folder rewrites those two tracked files (discard the change with `git checkout`).

- **`run-log.json` (for the agent).** Recipe name and version; run date; every input path with its SHA-256; the persona as used (no contact details); the parameters; a `labels` dictionary that names the label of every field of a row, and `labels_run_level` for every other value (each label starts with record, your-input or model-judgment, or run-metadata for values that only describe the run); the status of every gate; the timeline factor with the dates and day counts behind it; coverage counts; the Form D cross-check; every row with its evidence, bucket and scorer result; the scorer command and outputs.
- **`report.md` (for the person).** An executive summary in plain words; a "read this first" list; the funnel from the whole table to the shortlist; the gate table; the companies worth a closer look, those set aside, those held (never skipped) and those not resolved; the Form D cross-check; a short run record.
- **Scorer files.** `roles.json` (its input, in the shape of `data/examples/ch11-roles.json`), `scorer-profile.json`, `role-scores.json` and `role-scores.md`.

Row buckets: **advance** (the scorer said Apply or Consider), **skip** (the scorer said Skip: thin evidence or a closed timeline), **hold_unknown**, **hold_role_unverified**, **hold_data_problem**, **not_found**, **ambiguous**. Only advance and skip rows reach the scorer.

## Named failure cases

| # | Case | Handling | Where tested |
|---|---|---|---|
| F1 | A watchlist company is not in the table | reported as not found; no tier; never scored | the fixture run and the real run (a typo and an invented company) |
| F2 | A company has no sponsorship record | held as unknown; never sent to the scorer, so it cannot appear as Skip | the fixture run |
| F3 | The SOC code has no BLS row, or an unreadable median | the wage comparison is reported missing with a reason; the run continues | BLS unit test and a command-line test |
| F4 | The authorization end date is already past | timeline factor 0, every scored role Skip, reason stated | timeline unit test and a command-line test |
| F5 | The table is more than 6 months old | refuses without the acknowledgement flag; nothing written | command-line test; the real run needs the flag |
| F6 | The scorer mis-reads the persona or mislabels a gate | exit 4, nothing written | a deliberately wrong output file, a wrong stand-in scorer run end to end, and a canary that reports whether the real defect is still there |
| F7 | A column of the table is renamed | exit 2 naming the missing column | unit and command-line tests |
| F8 | A posting has expired | not automated; gate H1 catches it (real output for the repository's own example URL: expired, HTTP 404) | run manually by the assistant |
| F9 | Two table rows share a normalized name | reported ambiguous with both candidates; never resolved by guessing | the fixture and real runs |
| F10 | A record, title list or funding date cannot be read | nothing is guessed. An unreadable record or title list on the candidate's own list is held as a data problem; a discovered company with an unreadable title list or funding date is left out of the funnel counts, and the report says how many were left out | the fixture run, and a test with a damaged funding date |
| F11 | The persona file is not valid YAML | exit 2 with a message, not a stack trace | unit and command-line tests |
| F12 | The persona says it does not need sponsorship | exit 2: the recipe is for a candidate who does, and the scorer would drop the sponsorship term | command-line test |
| F13 | The output folder is a file, or cannot be written | exit 2 with a message, not a stack trace | command-line tests |
| F14 | A Form D folder is named but is missing, empty or a file | exit 2, not a silent zero | command-line tests |
| F15 | The scorer file is not the repository's | the run completes only if the scorer's answer passes G2, and the outputs say the scorer was a stand-in | command-line test |

## Stop conditions and next actions

Stop and do not invent a value when: the table, the BLS extract or the persona cannot be read; the persona says it does not need sponsorship; a gate stops the run (G0, G1, G2); a required column has gone missing; the output folder cannot be written; or the scorer fails (exit 5).

| Result | Next action | Where it connects to the 3-3-2 day |
|---|---|---|
| Apply, both human gates open | find a live backend posting, run H1, read it for H2; only then tailor | the 2-hour research-and-apply block |
| Consider | ask a recruiter or an engineer whether the company sponsors backend hires | the networking block |
| Skip | set aside; the reason is in the report | frees time |
| Held: unknown | look for a direct signal (careers-page wording, a recent hire's post, a recruiter question) | the networking block |
| Held: role type unverified | check whether the company sponsors backend titles before deciding | the networking block |
| Not found or ambiguous | fix the name or pick the entity by hand | a short check |
| Timeline gate closed | stop and talk to the school's international office before applying anywhere | not a search problem |

## Run-log template for `logs/runs/`

```markdown
## YYYY-MM-DD: short task name

Summary in plain words: what was run, what it found, what a person must still do.

- **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.1.0
- **Command:** the exact command, with its flags
- **Inputs:** paths and the first 12 characters of each SHA-256
- **Outputs:** the run folder and the files in it
- **Gate results:** G0, G1, G2, G3 statuses; H1 and H2 decisions per company (name, date, cleared or stopped)
- **Result:** counts by bucket and by scorer verdict; anything surprising
- **Open issues:** what did not work or is still missing
- **Human read:** the name and date of the person who read the report, or "not yet read"
```

## Provenance and assistance

Drafted with Claude Code (Sonnet 5.5) in a working session on 2026-09-30. Aravind Sundaravadivelu chose the recipe from three options; the assistant wrote the rest. Three rounds of independent read-only review by separate assistant tasks audited the branch; their reports are model output, and each claim was re-checked before anything was changed (see `FRICTIONAL.md`). The author has not yet confirmed the parameters or signed the sample run, and the run-log entry says so; a sign-off, if given, is recorded there, not here. Sources are credited in `course/2026fa/submissions/aravindkumar2504/SOURCES.md`, and what the assistant did versus what the author decided or checked is in `course/2026fa/submissions/aravindkumar2504/FRICTIONAL.md`.
