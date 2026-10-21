---
status: DRAFT
todos_open: 11
last_gate: null
attestation: null
recipe_version: 0.2.0
---

# pre-OPT backend sponsor tiers

## Executive summary

This recipe serves one kind of job seeker: an international master's student who graduates soon, has not started work authorization, and wants a backend software job at a company that will sponsor a work visa. It answers two questions the student cannot easily answer alone. Do public records show that a company has sponsored this kind of job, and how much evidence stands behind that? And for the companies that pass, is a real backend job open there today, and does the posting itself shut the student out?

For the first question it reads a public table of about 30,000 companies, turns each company's record into one of three evidence levels, keeps companies the data says nothing about as unknown instead of treating silence as a no, checks whether the student's own calendar leaves room for a hiring process, and passes the result to the repository's existing scoring tool. For the second it finds each shortlisted company's job board, reads that day's postings, picks one backend posting per company, checks that each page is still live, and quotes the sentences about sponsorship, citizenship, clearance and similar terms. Then it stops: a named person reads every posting and makes both calls. It never decides to apply.

Its main finding is a limit, not a list. Only about 5 percent of companies have any sponsorship record. Of the 59 companies the records shortlisted, the live check found a job board for 26, and 7 ended the run with a posting that cleared both human checks; one posting that its job board still listed had already disappeared. Nothing yet checks whether an employer will wait for a candidate who cannot legally start for months. The recipe still calls itself a draft, because eleven proposals for the engine and its data are open; the runs described here do not change that. The rest of this file is for the agent that runs the recipe and the person who signs it off.

## Purpose: when to use it

Use this mode when all of these hold:

- the candidate is an F-1 student in a U.S. STEM master's program, close to graduating, whose OPT has not started;
- the candidate will need an employer to sponsor an H-1B visa later (a candidate who does not is refused, because the scorer would then drop the sponsorship term);
- the target is backend, platform or infrastructure software work, occupation code SOC 15-1252;
- the candidate has a fixed number of applications a week and needs to know where the next hour goes.

Do not use it to decide whether to apply (a person decides), for roles outside software development, or for legal questions about OPT, STEM OPT or the H-1B (the school's international office owns those). It ranks nothing it cannot back with a record, and it says where the records are silent.

## Lifecycle claim

- **Claimed: DRAFT.** The lifecycle table lets a recipe leave DRAFT only when no typed TODO is open, and this one carries 11 (proposed additions 1 to 5 and 8 to 13). No lifecycle gate has been passed, so `last_gate` is null. Version 0.1.0 claimed RUNNABLE-SAMPLE while nine TODOs were open, which the table does not allow; this version corrects the claim.
- **Runs that exist** (they do not change the claim):
  - a sample run on 2026-10-20, on the repository's real company data and a fictional persona, with the folder's tests and the conformance check passing: `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/`;
  - a live run on 2026-10-20 in which the author decided gate H1 on all 8 chosen postings and gate H2 on the 7 that passed H1, each with the time and the answer as given: `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/gate-decisions.json`, logged in `logs/runs/2026fa-aravindkumar2504-2.md`.
- **What each later stage would still need:**
  - SPECIFIED: every open TODO closed with the evidence the closure table asks for.
  - RUNNABLE-SAMPLE: a sample run of that version with its audit written beside it and read by a person (no audit file exists for this run).
  - RUNNABLE-LIVE: a live run with a person clearing every gate, including a start-date check (proposed addition 13) and a named person behind the G0 acceptance.
  - VERIFIED: an attestation by a named person, bound to that version.
- **Attestation:** null. The worked run carries an attestation for the checks it lists; it is not a sign-off of this version.

## Handoff condition (done when)

A run is complete when all of the following hold. "Looks right" is not the condition.

The sample part (the base run):

1. The run command exits 0 and writes a human report and an agent log.
2. Every gate from G0 to G3 has a status in the agent log, and gates H1 and H2 are shown as open on every row that advances.
3. Every role sent to the scorer carries all three terms labelled `your-input`: sponsorship (the tier is classified from records, but the number sent is that tier's fixed value from the parameters), the liveness placeholder, and the timeline factor.
4. No company that is unknown, has an unverified role type, was not found, or has an ambiguous name was sent to the scorer.

The live part:

5. Every shortlisted company has a board result: a board, with the name guess that found it, or none, with every guess tried.
6. The scanner ran unmodified, from an empty folder outside the repository.
7. The liveness checker's output is saved word for word, and every chosen URL has exactly one recorded verdict.
8. A named person decided gate H1 for every chosen posting, and gate H2 wherever H1 passed, with the time and each answer as given.
9. The live report places every shortlisted company in exactly one group (cleared, held, set aside, no board, no fitting posting, left out by the cap), or it refuses to write.

Both parts:

10. `npm run verify`, the folder's tests, and the personal-data scan (`npm run pii-scan`) of the branch history against the base branch all pass. (The scan of the working tree also reports one finding that pre-dates this work: an npm package author's address inside `package-lock.json`. It is a false positive in the base repository, not something this recipe adds.)

## Required reads

Read in this order before running:

1. `SNICKERDOODLE.md`, `DOMAIN.md`, `DATA_CONTRACT.md` (the Zero-Conditions section) and `CONTRIBUTING.md`.
2. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` (tiers; why Unknown is not Avoid), `book/chapters/10-the-visa-timeline-manager.md` (the timeline factor) and `book/chapters/11-the-bayesian-role-scorer.md` (the scorer).
3. `data/80-days-to-stay/data/README.md` and `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` (what the columns mean and the file's own audit).
4. `scripts/ats/README.md` and `scripts/ats/providers/README.md` (the scanner, the liveness checker and the job-board providers).
5. This recipe, `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.card.md`, and the author's decisions in `course/2026fa/submissions/aravindkumar2504/mode-build/author-decisions.md`.

## Source inventory

| Source | Path | Use |
|---|---|---|
| Company table (30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | sponsorship record, sponsored titles, offered wage, funding |
| Its column notes and audit | `data/80-days-to-stay/data/README.md`, `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` | column meaning and the note on blank sponsorship fields; the file's own vintage and SOC-code gap |
| Wage reference | `data/bls/compact/soc_occupation_compact.csv` | national median wage for the SOC code (shown, not scored) |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | a spot check of the table's funding columns |
| Name rule | `scripts/sec/entity-resolution.py` | source of the exact-match normalization the prototype ports |
| Scorer | `scripts/score/role-scorer.mjs`, run as a command (the script `npm run score` runs) | the decision core; never copied |
| Persona | `search/examples/kiran-rao/profile.yml` | the fictional candidate (invented dates) |
| Prototype, sample part | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs` | the base run, end to end |
| Parameters | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/params.json` and `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/live-params.json` | thresholds and posting rules, each with who decided it and why |
| Title rules | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/role-families.json` | the title-to-role-family rule |
| Sample watchlist | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt` | the candidate's own company list |
| Board finder (live step L0) | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/find-boards.mjs` | asks the job-board providers for a board under up to four name guesses per shortlisted company |
| Job-board providers | `scripts/ats/providers/` | the repository's Greenhouse, Lever and Ashby readers, used by the board finder and the scanner |
| Scanner (L1) | `scripts/ats/scan.mjs` (`npm run ats:scan`), run unmodified from an empty folder with `REALLOCATION_ENGINE_PORTALS` naming the board list | the day's postings on every board found |
| Posting choice (L2) | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/select-postings.mjs` | one backend posting per company, in the U.S., with no senior marker in the title, at most 8 |
| Liveness checker (L3) | `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`), wrapped by `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/h1-liveness.mjs` | gate H1, machine half |
| Posting screen (L4) | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/h2-screen.mjs` | quotes sentences from the posting text, read from the Greenhouse and Lever public posting APIs, for gate H2 |
| Live report (L5) | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/live-report.mjs` | joins the evidence and the person's decisions, and applies the gate rules |
| Gate decisions | `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/gate-decisions.json` | the person's H1 and H2 decisions, answer by answer |
| Tests and fixtures | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/fixtures/` | offline tests; synthetic data only, including a stand-in liveness checker that drops a URL on purpose |
| Evidence checks | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs` | the commands behind the pasted evidence in the worked run |
| Deliberate breaks | `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs` | breaks the prototype one way at a time and checks that the tests notice |
| Related drafts (not reused) | `recipes/cases/2026su/case-fullstack-swe-sponsor-triage.md`, `recipes/cases/2026su/case-backend-swe-opt-triage.md`, `recipes/cases/2026su/case-opt-timeline-fit-company-targeting.md` | see below |
| Run outputs | `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/` (this version) and `course/2026fa/submissions/aravindkumar2504/runs/2026-09-30/` (version 0.1.0, kept as history) | reports, agent logs, scorer input and output, the live folder |
| Run-log template | `recipes/_shared.md` | the shape of a run-log entry |

Gate decisions are recorded in the live folder's `gate-decisions.json` and summarized in the run-log entry under `logs/runs/`, because the planned decisions folder named in other recipes does not exist in this repository.

**Related drafts, and what is different here.** Three unbuilt Summer 2026 drafts cover nearby ground: a pre-OPT full-stack/backend sponsor triage, a backend sponsorship triage, and an OPT timeline-fit targeting recipe. Each is status DRAFT with 13 to 14 open typed TODOs, and each names as its only source a `pantry/` placeholder that does not exist in the repository. This recipe reuses none of their text. What it adds is a built prototype with offline tests, exact paths that exist, a tier that keeps small samples from ranking high, the pre-authorization unemployment clock computed from dates, a gate that checks the repository scorer's answer, and a live step that reaches real postings and stops at a person.

## Parameters (who decided each)

These are decisions, not facts. Each is labelled `your-input` in the run. The assistant proposed every value and wrote the options; the author picked one option per question, on 2026-10-19 at 17:43 Pacific time (00:43 UTC on 2026-10-20) and on 2026-10-20 at 20:44 UTC. The questions, the options and the picks are kept word for word in `course/2026fa/submissions/aravindkumar2504/mode-build/author-picks.json`, and summarized in `course/2026fa/submissions/aravindkumar2504/mode-build/author-decisions.md`. For each of the seven parameters asked on 2026-10-19, the author picked the option the assistant had marked as recommended. Three values were set after seeing a run: the two title exclusions (after the first rehearsal chose a contractor role and a PhD-only role) and the export-clause rule (after the author's decision on the Databricks posting). No other value was tuned against a run's outcome.

| Parameter | Value | Decided by | Reasoning in short |
|---|---|---|---|
| Maximum data age | 6 months | proposal by the assistant | funding and filing history go stale; a planning default with no test behind it. The author chose to run past it with the warning (gate G0, 2026-10-19) |
| Funding window for discovery | 24 months back from the data's own newest funding date | the author, 2026-10-19 | a rough signal that a company may still be hiring, not a tested predictor |
| Proven tier | at least 10 reported approvals and at least 90 percent approved, with a matching title | the author, 2026-10-19 (kept as proposed) | one filing or a duplicated count must not carry the top tier (every count in the file is even); 90 percent keeps out a visible denial history |
| Likely tier | at least 4 reported approvals and at least 70 percent approved, with a matching title | the author, 2026-10-19 (kept as proposed) | still at least 2 if the counts are double-counted |
| Thin tier | a matching title exists but the counts fall below Likely | follows from the two rows above | set aside by the recipe's own rule; see the next row |
| Scorer value for a tier | Proven 0.9, Likely 0.6, Thin 0.3 | proposal by the assistant | 0.9 and 0.6 are the chapter 11 worked-example values, not calibrated probabilities. 0.3 is a low value chosen so that the scorer agrees with the rule that thin evidence is set aside (0.3 x 0.35 = 0.105, under the 0.20 Consider line for any timeline factor), so a Thin row is set aside by construction. That is a design decision, not a measured result, and it rests on the scorer's 0.20 line, which the scorer's own source marks as a placeholder not pinned by the book |
| Expected days to start | 75, read from the persona file | the author kept it, 2026-10-19 | about two and a half months for interviews, an offer and onboarding; one assumption applied to every role alike |
| Title rule | `role-families.json` | proposal by the assistant | a set of patterns; its measured errors are in the title check |
| Contract and temporary titles | dropped | the author, 2026-10-19 | such roles rarely come with H-1B sponsorship |
| PhD-only titles | dropped | the author, 2026-10-19 | the candidate is finishing a master's degree |
| Postings sent to the human gates | 8 in all, at most 1 per company | the author, 2026-10-19 | about 20 to 30 minutes of careful reading, spread over eight companies |
| Senior, staff, principal and lead titles | dropped | proposal by the assistant | the candidate has not started work |
| U.S. location | a state name or code, or "US", in the location; a plain "Remote" counts as U.S. and the person checks it | proposal by the assistant | the candidate's authorization is for U.S. work |
| Order of companies for the cap | best score first; ties broken by name | proposal by the assistant | see proposed addition 10: ties decided the cap in this run |
| Conditional export-control clause at gate H2 | not a stop: the posting may clear, and the report keeps the quoted sentence | the author, 2026-10-20 | a condition is not a no (see the phase gates) |

The persona supplies the dates, the unemployment ceiling (90) and the buffer (20). All of it is the candidate's own input.

**The timeline rule (gate G3).** Chapter 10 describes the timeline factor in words and gives no formula, and no code in the repository computes it, so this rule is a proposal:

- expected start = the later of (run date + expected days to start) and the day work authorization starts;
- days projected at start = unemployment days already used + the days from the later of (run date, authorization start) to the expected start (this assumes the candidate stays unemployed until the start);
- slack = the unemployment ceiling minus days projected;
- factor = 0 if the run date or the expected start is after the authorization end, or if slack is 0 or less; 1 if slack is at least the buffer; otherwise slack divided by the buffer.

Worked example, run date 2027-06-01: expected start 2027-08-15; 75 days projected; slack 90 - 75 = 15; buffer 20; factor 15 / 20 = 0.75. The run always reports the dates and day counts behind the factor. It is a planning multiplier, not legal advice.

## Proposed additions

Each is justified and typed. Two were closed by this version, with their evidence; eleven stay open, and they are why the recipe is DRAFT.

1. [TODO: DEV] **Fix the scorer's reading of the candidate's status.** `scripts/score/role-scorer.mjs` decides whether sponsorship is needed by matching free text with a loose pattern (the word "authorized" counts as "no sponsorship needed") and ignores an explicit `needs_sponsorship` field. Measured on 2026-09-30: for a proven sponsor the composite moves from 0.446 (Apply) to 0.178 (Skip) when the older persona's wording is used. `search/examples/README.md` says the authorization-parsing fix landed in PR #37 (`search/examples/aarav-patel/profile.yml` calls it the Summer 2026 fix), but the scorer file here has a single commit and no such fix. It belongs because it silently reverses the recommendation for exactly the students the engine is for. Until it is fixed, gate G2 guards every run.
2. [TODO: DEV] **Make missing gate evidence fail closed.** A missing liveness value defaults to 1.0 (open) and is labelled `record`; a missing timeline value defaults to 1.0 and is labelled `your-input`. Either way a value nobody supplied counts as open, and the liveness default contradicts the engine's own rule that nothing is a record unless a record produced it. This recipe always supplies both values with an honest label; the scorer should refuse, or label the value unchecked.
3. [TODO: DEV] **Give funding a place in the decision.** The scorer has terms for sponsorship, fit and role quality only, so funding cannot change Apply, Consider or Skip, although chapter 7 weights funding recency at 0.20 in its tier composite. This recipe uses funding as a pool filter and a displayed fact. The Form D spot check found one round the table missed although it had been filed before the table's own newest date, and 5 of the 14 matched companies have no funding in the table at all (see the worked run), which is a reason to model funding rather than filter on it.
4. [TODO: DEFINE] **Decide a role-quality weight.** The scorer's weight is 0.0, so wages cannot affect a decision. This recipe shows the offered wage against the national median for the SOC code as a plain ratio, with no threshold, and leaves the judgment to the reader. A weight needs an authorial decision.
5. [TODO: DEV] **Accept a labelled fit input.** Without fit, the composite cannot exceed 0.315, so a timeline factor below about 0.95 moves a Proven company from Apply to Consider, and below about 0.64 to Skip. That is a property of the scorer's weights, not of the evidence. In the 2026-10-20 run every one of the 51 Apply roles scored exactly 0.315, so the score cannot rank them (see 10). An optional fit file, labelled model-judgment or your-input, would fill the missing 0.30.
6. **Closed 2026-10-20 (DEV): the reading part of gate H2 is automated.** `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/h2-screen.mjs` fetches each chosen posting's text from the job board's public posting API (Greenhouse and Lever only; any other host is refused) and quotes every sentence that mentions sponsorship, citizenship or U.S.-person status, clearance or export control, work authorization, degree level, a graduation window or start date, or contract terms. Evidence: the script; two offline tests in `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/live-step.test.mjs` and two deliberate breaks they catch; the live run, where it fetched all 8 chosen postings and quoted 3 sentences (Verkada says it sponsors employment visas for the role, Databricks has an export-control clause, Cohere Health asks for a bachelor's degree). It decides nothing: a person still decides H2, and a posting with no quote is not a pass. Not covered: postings on Ashby, which has no text API in this script (none was chosen in this run). The closure table says a DEV item is closed by the AI through a scored prompt; no scored prompt was used, so this closure rests on the script, its tests and the live run, and the author approved it in the plan on 2026-10-20.
7. **Closed 2026-10-20 (DEV): gate H1 runs as a batch.** `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/h1-liveness.mjs` runs the repository's liveness checker once over the chosen URLs, saves its output word for word, and records one verdict per URL; a URL with no verdict, or more than one, is recorded as uncertain, never active. Evidence: the script; two offline tests (one runs the wrapper end to end with a stand-in checker that leaves a URL out on purpose), and three deliberate breaks they catch; the live run, checked twice (2026-10-20 at 00:49 and 08:53 UTC) with the same result both times: 7 active, and Xage Security expired (HTTP 404). The URLs now come from the scanner, so the person no longer has to find them; the person still confirms each page at H1. As with item 6, no scored prompt was used; the closure rests on the script, its tests and the live run, and the author approved it in the plan on 2026-10-20.
8. [TODO: DATA SOURCE] **SOC-coded sponsorship records.** The company table has job titles but no SOC codes (its own audit says so), so the recipe matches titles with a rule of its own. The raw filing records with SOC codes are not in the repository; the file path is not known.
9. [TODO: DATA SOURCE] **Provenance and vintage for the counts.** The table has no years for its approvals and denials, every count is even for a reason the documentation does not give, and its newest funding date is 2025-09-26. A fresher, documented source, or an explanation from the table's maintainer, would let the tiers rest on firmer ground. Full Form D quarters are fetched by `scripts/sec/download-form-d-quarters.py` and are not committed.
10. [TODO: DEFINE] **A tie-break for the posting cap.** The posting choice takes companies best score first and breaks ties by name. All 9 companies with a fitting posting scored 0.315 (a consequence of 5), so the cap of 8 left out Zscaler (802 approvals at 98.53 percent) for its place in the alphabet and kept Xage Security (24 approvals at 92.31 percent), whose posting turned out to be gone. Proposed value: break ties by approvals, then by approval rate, then by name. The author names this as a next step; it needs the author's value and one sentence of reasoning. The reviewed postings were not re-picked, so the logged decisions stay valid.
11. [TODO: DEV] **Reach companies beyond three job-board systems.** The board finder and the scanner read Greenhouse, Lever and Ashby only (the providers in scripts/ats/providers), so 33 of the 59 shortlisted companies had no board under any name the finder tried, and the live check says nothing about them (the report names all 33). A provider for another system, or a reader for a company's own careers page, would let the live step cover them. It belongs because the companies a student cannot check are exactly the ones the shortlist drops without saying so.
12. [TODO: DATA SOURCE] **A checked list of each company's job board.** Today the board comes from a name guess: that a board answered with jobs is a record, but that it belongs to this company is a judgment made by a rule, and a person confirmed the company only for the 7 chosen postings whose pages were live. A maintained list (company, board, date checked, who checked) would replace the guesses and let "no board" mean no board. No such file exists in the repository yet; its path is not known.
13. [TODO: DEFINE] **A start-date rule for a candidate who cannot start yet.** The fictional candidate's earliest start is 2027-06-01, about seven months after the live run, and the chosen postings were open in October 2026. No chosen posting stated a start date (the screen found no start-date or graduation-window sentence in any of the 8), the author was not asked about dates at gate H2, and the timeline gate (G3) assumes that an employer will wait until authorization starts. A rule is needed, for example: hold a posting at H2 until a recruiter confirms the start date, or prefer postings that name a new-graduate start window. It belongs because this is the pre-OPT trap: a posting open today is often not a job this candidate can take.

## Phase gates

Each gate stops at its first failure. The first four are run by the prototype; the last three are halves of the two human gates. The program evaluates G0 to G3, but only a person can change their outcome: G0 is passed only when a person gives the acceptance flag (the run log records the flag, not the name); G1 and G3 rest on the candidate's own dates, which the program never edits, so a closed timeline reopens only when the candidate corrects the dates or the school's international office says otherwise; and a failed G2 cannot be overridden at all.

| Gate | Testable condition | Pass | Stop |
|---|---|---|---|
| G0 data vintage | the newest `latest_funding_date` in the company table is at most 6 months before the run date | run continues | exit 3, nothing written, unless `--accept-stale-vintage` is given; the acceptance is then recorded in the agent log and stated in the report |
| G1 persona | `needs_sponsorship` is true (this recipe is for a candidate who needs a sponsor; false is refused, because the scorer would then drop the sponsorship term and every company would come back set aside for a reason unrelated to the evidence), and the SOC code, role family, authorization start and end dates, unemployment days used, ceiling, buffer and expected days to start are all present and well typed | run continues | exit 2, naming every problem at once; no defaults are invented |
| G3 timeline (a gate: the factor multiplies the score and never adds to it) | the factor computed from the persona's dates is above the scorer's own closed-gate line (0.05) | the factor is passed to the scorer as `your-input` | the factor is 0, or at or below that line: every role is scored to Skip and the report says why (start after authorization ends, unemployment ceiling reached, authorization already ended, or a factor the scorer treats as closed) |
| G2 scorer integrity | the scorer's echo of "needs sponsorship" equals the persona's value, every gate value came back labelled `your-input`, no unexpected override appeared, and every role sent came back once | outputs are written (a scorer file other than the repository's is named as a stand-in in the log, in G2 and at the top of the report) | exit 4 and nothing written |
| H1 posting live, machine half | `h1-liveness.mjs` runs `scripts/ats/check-liveness.mjs` once over every chosen URL and records exactly one verdict per URL | the verdict is active | expired or uncertain: the posting cannot be cleared. A URL with no verdict, or two, is recorded as uncertain |
| H1 posting live, person half | a named person reads the posting, in a browser tab, and answers: it is live, it is at the right company, and it is the job page itself, not a search or listing page | confirmed live, and the machine half said active | not live, wrong company, or not the job page: set aside. Confirmed live where the machine half did not say active: held as a disagreement, never cleared |
| H2 posting eligibility (human) | the named person has read the posting (the screen's quotes help; finding no quote is not a pass) and found none of: a statement that the employer will not sponsor; a requirement of U.S. citizenship, permanent residence (a green card), U.S.-person status or a clearance. Start dates and graduation windows are not part of H2 yet (proposed addition 13) | no blocker: cleared | blocked: set aside. Unclear wording: held, with the next action "ask a recruiter" |

**Outcome rules, in the order the live report applies them.** No decision from a person: held. Person says live, checker did not say active: held (a disagreement; check again before applying). Person says not live, wrong company or not the job page: set aside. H2 blocked: set aside. H2 unclear: held. Otherwise: cleared. Every posting carries its outcome and the reason in both outputs.

**A conditional clause is not a stop.** A posting may say the employer can decline an applicant if the job turns out to need export-controlled technology and a government license (the Databricks posting in the live run does). On 2026-10-20 the author decided that such a clause states a condition, not a no: the posting may clear, and the report keeps the quoted sentence so the reader sees it.

**Two logged disagreements, kept visible.** Version 0.1.0's H2 stopped a posting on any export-control wording, and on a start date earlier than the earliest legal start. (1) In the live run the author read the Databricks clause and cleared the posting, so the written rule and the decision disagreed. The answer option the author picked had been worded by the assistant and already called the export sentence "only a condition". The author then decided the rule above, from a question that offered pass, hold or block, each with its consequence for the run. The decision came first; the rule was written after it. (2) The live questions did not ask about start dates, so version 0.2.0's H2 covers only the wording the questions asked about, and the start-date check is proposed addition 13. Both are recorded in the run-log entry rather than resolved silently.

**How a person records H1 and H2.** For each chosen posting, open in its own browser tab, the person picks one of four fixed answers ("Looks fine", "Says no sponsorship", "Not sure", "Page broken or wrong"; for a posting the checker found expired: "Page broken or gone", "It is actually open", "Not sure"). The answers go into `gate-decisions.json` with the person's name, the time, and each answer word for word beside the H1 and H2 values it maps to. The assistant wrote the questions and the options; `course/2026fa/submissions/aravindkumar2504/mode-build/author-picks.json` keeps them word for word. The live report refuses a file that names a posting that was not chosen, decides one twice, lacks the name or the time, or uses any other value.

The prototype runs the base gates in this order: G1, then G0, then G3, then G2; the table groups them by what stops the run.

## Workflow

Run from the repository root. Prerequisites: `npm install`, and the browser the liveness checker uses (`npx playwright install chromium`, a download of a few hundred megabytes). Only `npm run verify` and `node scripts/conformance.mjs` need Python's YAML package (put a virtual environment that has it first on the path); the prototype does not.

1. Check the toolchain:

```bash
npm run doctor
```

2. The sample run (real data, fictional persona; the data is a year old, so the acceptance flag is required and is recorded). This writes to `/tmp/tiers-run`, so it changes no tracked file:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

The committed sample in `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/` was made by the same command with `--out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-10-20`.

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

6. The live step, on the sample run from step 2. It reads public job boards, so it needs the network; the scanner writes a data/ats folder wherever it runs, so it runs from an empty folder outside the repository and never touches the repository's private data/ats folder:

```bash
REPO=$PWD
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers
R=/tmp/tiers-run
node $D/find-boards.mjs --scores $R/role-scores.json --out-dir $R/live
rm -rf /tmp/tiers-scan && mkdir -p /tmp/tiers-scan && (cd /tmp/tiers-scan && REALLOCATION_ENGINE_PORTALS=$R/live/live-portals.yml node $REPO/scripts/ats/scan.mjs)
cp /tmp/tiers-scan/data/ats/scan-history.tsv $R/live/scan-history.tsv
node $D/select-postings.mjs --history $R/live/scan-history.tsv --boards $R/live/boards.json --out-dir $R/live
node $D/h1-liveness.mjs --urls $R/live/h1-urls.txt --out-dir $R/live
node $D/h2-screen.mjs --selected $R/live/selected-postings.json --boards $R/live/boards.json --out-dir $R/live
```

7. A person opens each chosen posting, answers the H1 and H2 questions, and the answers are saved as `gate-decisions.json` in the live folder (the shape is in the committed run). Re-run the liveness check right before the person reads, so the two are close in time. Then:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/live-report.mjs --run /tmp/tiers-run --live /tmp/tiers-run/live
```

Without a decisions file the report still writes, with every posting held. The committed live run in `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/` was made by the same steps on the committed base run, with the scan's empty folder in a temporary directory; the commands exactly as run, with their output, are in the worked run.

8. Record the run using the template at the end of this file.

## What it can and cannot verify

This boundary is the point of the recipe. Values carry one of three labels: **record** (read from a repository data file or a job board's answer, or plain arithmetic on record values), **your-input** (the persona, the run date, and the parameters, with who decided each), **model-judgment** (a judgment a rule or a model makes; the prototype makes none about a company, but the board finder's name rule decides which company a board belongs to, and is labelled that way). A person's gate decision is labelled as that person's.

| Can verify (label) | How it was checked |
|---|---|
| A company's row exists under an exact normalized name, is missing, or is ambiguous (record) | the JavaScript name rule was compared with the Python original on all 30,569 names in the table and the Form D samples, and the title-list reader with Python's `ast.literal_eval` on all 1,557 title cells: 0 differences each (`checks.mjs parity-names`, `checks.mjs parity-titles`). The name rule can differ from the Python one on exotic Unicode characters that do not occur in the data |
| Its approvals, denials, approval rate, listed titles, offered median wage and latest funding (record) | the worked run shows the raw table cells beside the run log's values for named companies, with the arithmetic redone (`checks.mjs source`, run by the assistant) |
| The rate column equals approvals divided by approvals plus denials (record) | true in all 1,557 rows that have a record |
| The national median wage for the SOC code (record) | read directly from the BLS extract: 133,080 for 15-1252, 2024 |
| Whether the table's funding agrees with Form D, for the few companies in the samples (record) | 15 of 200 sample records match one company (14 companies: Databricks has two records). A table can only miss what had been filed when it was made, so the filing date is compared with the table's newest funding date (2025-09-26): 4 records agree exactly on date and amount; 1 (Composabl) has a later first sale that was filed before that date, so the table missed it; 5 were filed after that date (RunBuggy, Databricks twice, Crypto Co, Gearflow), so the table may simply predate them and they are not counted as misses; 5 have no funding in the table |
| That a job board answered for a name, and how many jobs it listed (record) | `boards.json` keeps every name tried per company and each answer |
| What a posting page did at a stated time (record) | the liveness checker's own output, saved word for word with its start and end times and the checker's SHA-256; run twice in the live run, eight hours apart, with the same verdicts |
| Which sentences in a posting mention sponsorship, citizenship, clearance, authorization, degree, dates or contract terms (record; the categories are your-input patterns) | quoted word for word from the text the posting API returned, with that text's SHA-256 |
| What the named person decided, and when (the person's) | `gate-decisions.json`, validated by the live report; the questions and options as asked are in `author-picks.json` |
| That every shortlisted company is accounted for (conformance) | the live report refuses to write when its groups do not add up to the shortlist |

| Inferred by a rule (label) | The rule and its weakness |
|---|---|
| The tier (record, rule-derived; thresholds are your-input) | counts are used as reported; they are all even and have no years |
| Whether a title is backend-style (record matched by a rule the assistant proposed) | on a fixed-seed sample labelled by the assistant: of 40 matched titles, 3 were clear false positives (a UX title and two perception specializations) and 5 borderline; of 40 unmatched titles containing "engineer", "developer" or "technical", 1 was a clear miss ("Member, Technical Staff", a comma variant the pattern does not allow) and 3 borderline. One labeller, not yet checked by the author, so treat as indicative |
| Whether a company's matched titles look senior (record read by a rule) | a list of senior markers (senior, staff, principal, lead, architect and others; "Member of Technical Staff" is not counted as senior). Of the 59 companies that advance, 20 list only senior-marked titles, which is no evidence that they sponsor a new graduate |
| The timeline factor (your-input) | a planning multiplier from the candidate's own dates, by the rule above; it assumes the candidate stays unemployed until the start |
| Which company a job board belongs to (model-judgment: a name rule) | the board finder guesses from the company's name; 23 of the 26 boards were found under the full name, 1 hyphenated, 2 without generic words. A person confirmed the company only for the 7 chosen postings whose pages were live |
| Whether a posting fits (your-input rules) | the backend title rule, the U.S.-location rule, the senior-title rule and the author's exclusions; a plain "Remote" location is assumed U.S. The senior-title rule only drops titles with a senior marker, so a title like "Software Engineer II" passes: no senior marker is not the same as entry level |
| Which posting represents a company (your-input rule) | titles without a senior marker first, then titles that name backend, platform, infrastructure, distributed or systems work, then by name; companies best score first, ties by name (proposed addition 10) |

| Cannot know | Why |
|---|---|
| Anything about the 33 shortlisted companies with no board found | their jobs are on another system, on their own site, or under a name the finder did not try; the report lists them |
| That a posting is still open after the check | the checker sees the page at one moment |
| Whether an employer will wait until the candidate can start | the fictional candidate's earliest start is 2027-06-01, about seven months after the run; no gate checks it (proposed addition 13) |
| That the screen caught every trap | it matches patterns sentence by sentence; a trap worded another way, or on another page, is missed, which is why a person reads the posting |
| That a company will sponsor this person, in this role, now | the record is a rear-view mirror, company-wide; the book says so |
| That "recently funded" means "hiring" | the Form D spot check found one matched company whose later round the table missed although it had been filed before the table's own newest date, and 5 of the 14 have no funding in the table; and a very large old company can appear as recently funded (Intel, with a "Series B" dated 2025-03-18) |
| When the company table was made | its newest funding date is 2025-09-26, but nothing says when the snapshot was taken, so a Form D filed after that date may or may not have been available to it |
| That an unmatched title means "does not sponsor this role" | the title list is capped; such companies are held, never skipped |
| That a missing record means "does not sponsor" | `data/80-days-to-stay/data/README.md` says a null sponsorship field does not necessarily mean the company does not sponsor: it means the data holds no "trace of sponsorship activity" for it |
| What the counts mean | all are even, they have no years, and the documentation says "petitions" while the book speaks of filings |
| Whether the candidate fits the job | fit is not scored (proposed addition 5) |
| Legal eligibility, STEM eligibility, the unemployment ceiling | for the school's international office |
| Whether the wage is fair for this candidate | shown as a ratio only; ratios well below 1 (for example 0.55 to 0.75) are a prompt for a person to look |

## Facts about the engine that this recipe takes into account

The Recipe Design assignment listed eight facts that a recipe must not ignore. Where each one touches this recipe:

1. **Role quality has weight 0.0 in the scorer.** The recipe shows the offered wage against the national median as a plain ratio, outside the scorer, and proposes a weight as a typed item (proposed addition 4).
2. **`bls:local-wage` feeds nothing**, and 7. **`npm run bls:local-wage` fails on a fresh clone.** The recipe does not use it. It uses the national median from the compact BLS extract, so a metro-adjusted band is not used and the national ratio can mislead for a candidate who will work in a high-cost metro; ratios are a prompt for a person to look, never a verdict.
3. **Only Form D samples ship.** The Form D check runs on the four shipped sample files (200 records) and says so in every report.
4. **Some directories named in recipes do not exist.** Every gate points at paths that exist; decisions go in the live folder and the run-log entry because the planned decisions folder does not exist.
5. **The `snickerdoodle` CLI is roadmap, not runtime.** It is not used.
6. **"Every top-level recipe is still DRAFT."** The repository's doctor reports four RUNNABLE-SAMPLE recipes and one RUNNABLE-LIVE recipe at the top level, each with zero open TODOs. This recipe has open TODOs, so it claims DRAFT. The doctor reads only top-level recipes; this recipe's TODO count is checked by its own test (`scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/recipe-paths.test.mjs`).
8. **`scripts/sec/validate-h1b-join-sample.py` needs full data it does not have.** It is not used. The join between the company table and Form D is the recipe's own exact-name match on the shipped samples, and the gap (only samples, not the full quarters) is stated above.

## Output contract

The base run writes two files for two readers, plus the scorer's own files, into the folder named by `--out-dir` (by default `private/tiers-run/<run date>`, which git ignores). A run whose inputs all sit in the committed sample locations (`search/examples/`, this recipe's `sample-inputs/` and `fixtures/`, and the repository's own company table, wage file and Form D samples) may write inside the repository only in this recipe's own runs folder. A persona outside `search/examples/`, or a watchlist, company table, wage file or Form D folder outside those locations, makes the run real-data, and its output may go only to `private/` or outside the repository; the program compares where paths really are (through symlinks and letter case) and refuses otherwise. It checks where a file is, not whether git tracks it, so a real file placed in a sample location would be treated as a sample: keep real data in `search/` (outside `examples/`) or in `private/`. Paths outside the repository are written into outputs as `<outside the repository>/name`, never as this machine's folders. The four files this program writes are byte-identical when the same inputs are run again into the same output folder (the run record names that folder); the scorer's two files carry the date the scorer ran (in UTC), so running on another day into the committed sample folder rewrites those two tracked files (discard the change with `git checkout`).

- **`run-log.json` (for the agent).** Recipe name and version; run date; every input path with its SHA-256; the persona as used (no contact details); the parameters; a `labels` dictionary that names the label of every field of a row, and `labels_run_level` for every other value (each label starts with record, your-input or model-judgment, or run-metadata for values that only describe the run); the status of every gate; the timeline factor with the dates and day counts behind it; coverage counts; the Form D cross-check; every row with its evidence, bucket and scorer result; the scorer command and outputs.
- **`report.md` (for the person).** An executive summary in plain words; a "read this first" list; the funnel from the whole table to the shortlist; the gate table; the companies worth a closer look, those set aside, those held (never skipped) and those not resolved; the Form D cross-check; a short run record.
- **Scorer files.** `roles.json` (its input, in the shape of `data/examples/ch11-roles.json`), `scorer-profile.json`, `role-scores.json` and `role-scores.md`.

Row buckets: **advance** (the scorer said Apply or Consider), **skip** (the scorer said Skip: thin evidence or a closed timeline), **hold_unknown**, **hold_role_unverified**, **hold_data_problem**, **not_found**, **ambiguous**. Only advance and skip rows reach the scorer.

The live step writes into a `live/` folder beside the base run. Its inputs are public job postings and the person's decisions, never the candidate's private files.

- **`run-log-live.json` (for the agent).** Every input file with its SHA-256; the funnel counts; per posting: company, title, location, URL, sponsor tier, the checker's verdict and reason, the person's H1 and H2 values and any note, the quoted sentences, the outcome and its reason; the companies the check could not reach, in three groups (no board, no fitting posting, and left out by the cap; the last group also carries each company's score and approvals).
- **`report-live.md` (for the person).** An executive summary in plain words; a "read this first" list (the data's age, that start dates were not checked, the unreachable share, how the cap chose); the funnel from the shortlist to a decision; one row per posting with the tier, both halves of H1, H2, the quotes and the outcome; the gate table with who decided; the unreachable companies by name; what the run can and cannot verify; a short run record.
- **Evidence files, kept as written.** `boards.json` and `live-portals.yml` (L0); `scan-history.tsv` and the scanner's summary lines in `scan.stdout.txt` (L1); `selected-postings.json` and `h1-urls.txt` (L2); `h1-liveness.json` with the checker's output word for word in `h1-liveness.stdout.txt`, and the first check kept beside them as `h1-liveness.first-check.json` (L3); `h2-screen.json` (L4); `gate-decisions.json` (the person).

The base run's own report and log still say, for gate H1, that a person must find the posting URL. The base program does not know about the live step, which now finds and checks the URLs for every company it can reach.

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
| F8 | A posting has expired | gate H1, machine half: recorded expired with the checker's reason, then set aside when the person confirms | the live run (Xage Security, HTTP 404, at both checks) and the author's own check of a made-up job number (expired) |
| F9 | Two table rows share a normalized name | reported ambiguous with both candidates; never resolved by guessing | the fixture and real runs |
| F10 | A record, title list or funding date cannot be read | nothing is guessed. An unreadable record or title list on the candidate's own list is held as a data problem; a discovered company with an unreadable title list or funding date is left out of the funnel counts, and the report says how many were left out | the fixture run, and a test with a damaged funding date |
| F11 | The persona file is not valid YAML | exit 2 with a message, not a stack trace | unit and command-line tests |
| F12 | The persona says it does not need sponsorship | exit 2: the recipe is for a candidate who does, and the scorer would drop the sponsorship term | command-line test |
| F13 | The output folder is a file, or cannot be written | exit 2 with a message, not a stack trace | command-line tests |
| F14 | A Form D folder is named but is missing, empty or a file | exit 2, not a silent zero | command-line tests |
| F15 | The scorer file is not the repository's | the run completes only if the scorer's answer passes G2, and the outputs say the scorer was a stand-in | command-line test |
| F16 | A job board's own listing still shows a posting whose page is gone | the scanner keeps it; H1 records it expired; the person confirms; set aside | the live run (Xage Security: listed by the board, page HTTP 404) |
| F17 | The checker prints no verdict, or two, for a URL | recorded as uncertain, never active | `live-step.test.mjs`, with a stand-in checker that leaves a URL out |
| F18 | A decisions file names a posting that was not chosen, decides one twice, lacks the name or the time, or uses another value | the live report stops (exit 2) and writes nothing | `live-report.test.mjs` |
| F19 | The person says "live" where the checker did not | held as a disagreement, never cleared | `live-report.test.mjs` |
| F20 | The groups do not add up to the shortlist | the live report stops (exit 2) and writes nothing | `live-report.test.mjs` |
| F21 | The cap cuts among companies with equal scores | the report names each company cut, with its score and approvals, and says the cut was by name | `live-report.test.mjs`; the live run (Zscaler) |
| F22 | A posting's text cannot be fetched, or its board has no text API | the screen records that it could not read the text; the person reads the page; no quote is not a pass | `live-step.test.mjs` (which addresses are trusted); not seen in the live run |
| F23 | A posting is open now, but the candidate cannot start for months | not handled yet: no gate checks it; the live report says so in its "read this first" list | proposed addition 13; the live run (earliest start 2027-06-01) |

## Stop conditions and next actions

The mode refuses to produce a score, a clearance or a report, rather than guess, when:

- the table, the BLS extract or the persona cannot be read, or a required column has gone missing (exit 2);
- the persona says it does not need sponsorship (exit 2);
- a base gate stops the run: G0 without the acknowledgement flag (exit 3), G1 (exit 2), G2 (exit 4);
- the scorer fails (exit 5), or the output folder cannot be written (exit 2);
- the liveness checker is missing, or the URL list is empty (exit 2);
- a decisions file is not valid, or the live report's groups do not add up to the shortlist (exit 2; nothing is written over).

And it never clears a posting that no named person has decided, that the checker did not find active, or that the person found unclear.

| Result | Next action | Where it connects to the 3-3-2 day |
|---|---|---|
| Posting cleared at H1 and H2 | re-check that the page is live, then tailor and apply | the 2-hour research-and-apply block |
| Posting held: unclear wording | ask a recruiter the specific question (for example, whether the role needs export-controlled work) | the networking block |
| Posting held: disagreement | open the page again and re-run the liveness check before anything else | a short check |
| Posting set aside | none; the reason is in the report | frees time |
| Apply, not reached by the live check | find the company's careers page by hand, then run H1 and H2 on a posting | the 2-hour research-and-apply block |
| Consider | ask a recruiter or an engineer whether the company sponsors backend hires | the networking block |
| Skip | set aside; the reason is in the report | frees time |
| Held: unknown | look for a direct signal (careers-page wording, a recent hire's post, a recruiter question) | the networking block |
| Held: role type unverified | check whether the company sponsors backend titles before deciding | the networking block |
| Not found or ambiguous | fix the name or pick the entity by hand | a short check |
| Timeline gate closed | stop and talk to the school's international office before applying anywhere | not a search problem |

## Log template for logs/RUN_LOG.md

The repository's `CONTRIBUTING.md` asks students never to edit `logs/RUN_LOG.md` and to write each entry as its own file under `logs/runs/` (this mode's entries are `logs/runs/2026fa-aravindkumar2504-1.md` and `logs/runs/2026fa-aravindkumar2504-2.md`); the shape is the same either way.

```markdown
## YYYY-MM-DD: short task name

### Executive summary

What was run, what it found, and what a person must still do, in plain words.

### Record

- **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.2.0
- **Commands:** the exact commands, with their flags, base run and live step
- **Inputs:** paths and the first 12 characters of each SHA-256
- **Outputs:** the run folder, its live folder, and the files in each
- **Gate results:** G0, G1, G2, G3 statuses; for each chosen posting, the checker's verdict (H1, machine half) and the person's H1 and H2 decisions (name, time, answer as given)
- **Result:** counts by bucket and by scorer verdict; the live funnel and the outcome per posting; anything surprising
- **Disagreements:** any place the recipe, a script and a run disagreed, and what was decided
- **Open issues:** what did not work or is still missing
- **Human read:** the name and date of the person who read the reports, or "not yet read"
```

## Provenance and assistance

Version 0.1.0 was drafted with Claude Code (Sonnet 5.5) on 2026-09-30. Version 0.2.0 was built on 2026-10-19 and 2026-10-20. AI use: following the engine's own rule (AI executes, a person decides), Claude Code (Opus 5.5) did the execution: it proposed the design and the options, wrote the code and the documents, and ran every command not listed under the author's name. The judgment is the author's: choosing the mode, deciding the parameters and rules marked as the author's, reading every chosen posting and deciding both human gates wherever they applied, reading the live report, and running the checks and break attempts recorded under the author's name. In this version the author:
- chose to build on this mode;
- decided the parameters marked as the author's above;
- decided gate H1 on all 8 chosen postings and H2 on the 7 that passed H1;
- decided the rule for conditional export-control clauses;
- ran the checks and break attempts listed under the author's name in the worked run.

Every pick is kept word for word in `course/2026fa/submissions/aravindkumar2504/mode-build/author-picks.json`. Sources are credited in `course/2026fa/submissions/aravindkumar2504/SOURCES.md`.
