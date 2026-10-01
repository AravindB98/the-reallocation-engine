# CHANGE-BRIEF: pre-OPT backend sponsor tiers

## Executive summary

This is the "predict" document. I am writing it before any code exists, and I will not edit the predictions afterwards: later corrections go in the Revisions section at the bottom, so that anyone can compare what I expected with what happened.

The recipe is for an international master's student who graduates in spring 2027, has not started work authorization yet, and wants a backend software job at a company that will sponsor a work visa. It turns a public table of companies (funding history plus past H-1B approvals) into a short, sourced list. The list separates three things students often blur together: a company that has sponsored this kind of role many times, a company that has sponsored something else, and a company about which the data is simply silent. Silence is never treated as a "no". The recipe stops at two decisions only a person can make: whether the job posting is real, and whether the posting has an eligibility trap the data cannot see.

**Authorship.** Drafted by Claude Code (Sonnet 5.5) in a working session with Aravind Sundaravadivelu on 2026-09-30, after reading the repository and probing the data. Aravind chose the direction (recipe options were put to him in the session); he has not yet reviewed this text line by line. That review, and any change he makes, will be logged under Revisions.

## 1. Situation and engine layers

**Situation (fictional persona, invented dates).** A new persona, Kiran Rao, to be added under `search/examples/kiran-rao/`: F-1 student in a STEM-designated master's program, graduating spring 2027, post-completion OPT planned but the work-authorization clock **not started**, needs employer sponsorship later, targets Software Engineer (Backend / Platform), SOC 15-1252, in the Boston area or remote. Every date and contact detail is invented; none is a real immigration detail.

**Why this is specific.** The four existing personas are already inside OPT or a STEM extension, or hold another status. A pre-authorization student has a different clock (no unemployment days accrue yet), a different risk (start-date alignment), and no tracker yet. A student in exactly this position should recognize the workflow; someone on year-two STEM OPT would not need it.

| Layer | How this recipe uses it |
|---|---|
| Sponsorship (80 Days CSV) | The main vote. Role-level: do the sponsored job titles match backend/platform work, and how many approvals stand behind that? |
| Funding | A pool filter and a displayed fact only. The scorer has no funding term, so funding cannot change Apply/Consider/Skip. |
| Role quality (BLS/O*NET) | Displayed, outside the scorer (its weight is 0.0): the median offered wage against the national median for the SOC code. |
| Visa timeline | A gate (multiplier). The repo has no calculator for it, so this recipe adds one. |
| Liveness | A gate, but a human one: not automated in this recipe. |

## 2. What I reuse (exact paths) and what I propose

**Reused, all present today:**
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sponsorship, funding)
- `data/bls/compact/soc_occupation_compact.csv` (wage and SOC row)
- `data/sec/form-d/processed/sample/*.sample.json` (cross-check attempt only)
- `scripts/score/role-scorer.mjs`, run as `npm run score -- ... --out-dir ...` (the decision core; not re-implemented)
- `npm run ats:liveness -- <url>` (the human liveness gate)
- `data/examples/ch11-roles.json` (the shape of the scorer's input)
- `search/examples/` personas, and `js-yaml` (already a dependency)

**Proposed, not in the repo today (each will be a typed TODO in the recipe):**
1. A timeline-factor calculator. Chapter 10 describes the function; no code implements it and every example role types its factor by hand.
2. A title-to-role-family matcher. The CSV carries job titles but no SOC codes (the data audit says so), so the match is a rule I define and must test.
3. Tiering rules that respect small samples and keep an explicit Unknown bucket.
4. Guards for two scorer behaviours (section 6).
5. A fictional pre-authorization persona.

## 3. Gates and what a human must see to clear each

| Gate | Stops when | Human sees |
|---|---|---|
| G0 data vintage | newest funding date in the CSV is more than 6 months older than the run date, unless the run is explicitly told to accept it | the vintage date, its age, and the acknowledgement recorded in the run log |
| G1 persona | a required persona field is missing or `needs_sponsorship` is not true/false | the exact fields read, all labelled your-input |
| G2 scorer integrity | the scorer's echo of "needs sponsorship" differs from the persona, or a gate value came back labelled `record` when it was a placeholder | the two values side by side |
| G3 timeline (multiplier) | the factor is 0 (start after authorization ends, or unemployment ceiling would be exceeded) | the factor and the dates that produced it, plus a note that STEM eligibility belongs to the school's international office |
| H1 liveness (human) | always open at the end of a run | the posting URL a person found and the `ats:liveness` output |
| H2 posting eligibility (human) | always open at the end of a run | the posting text: U.S.-person or ITAR wording, "no sponsorship", graduation window, start date against the earliest legal start |

An "Apply" from this recipe always means "worth clearing H1 and H2", never "apply now".

## 4. Predicted failure cases and how each will be checked

| # | Failure case | Expected handling | Check |
|---|---|---|---|
| F1 | A watchlist company is not in the CSV (typo, or not funded) | reported as not found; no tier; never scored | fixture row plus a deliberate typo in the real run |
| F2 | A company is in the CSV with no H-1B record | held as Unknown; never sent to the scorer, so it can never appear as Skip | test asserting Unknown rows are absent from the scorer input |
| F3 | The SOC code has no row in the BLS extract | wage comparison reported as missing with a reason; run continues | run with `--soc 99-9999` |
| F4 | The authorization end date is already past | timeline factor 0 for every role, reason stated | run with a run date after the end date |
| F5 | The CSV is a year old | refuses without the explicit acknowledgement flag | run without the flag; expect a non-zero exit |
| F6 | The scorer mis-reads the persona's authorization text | run aborts with a clear message | a hand-made scorer output with the wrong value, plus the real scorer given the trap wording |
| F7 | A CSV column is renamed (schema drift) | stops and names the missing columns | temporary CSV with one header changed |
| F8 | A posting has expired (404) | not automated; the human gate catches it | `npm run ats:liveness -- https://example.com/job/123` (real output already saved: expired, HTTP 404) |

## 5. Predictions about the first pass (written before building)

- **P1 (the main miss).** The first title matcher will misfile some non-backend titles as backend, for example testing, sales-engineering or support titles that contain "Software" or "Engineer", and it will miss unusual titles such as "Member of Technical Staff". I will hand-label 40 matched titles and 40 unmatched titles that contain "engineer", "developer" or "technical", and report the counts.
- **P2.** The timeline gate will be exactly 1.0 for every role in the real run dated today, because the persona's clock has not started. That will look like a dead gate and is correct. It only bites when the run date moves into mid-2027 (I will show that with extra run dates).
- **P3.** The candidate pool (H-1B record, backend-style title, funded within 24 months before the CSV's own newest date) will hold between 60 and 160 companies, and fewer than half of them will reach the top tier.
- **P4.** At least one company on the discovered top-15 will look like a poor hiring target on inspection, for example an entity that looks like a fund or holding vehicle, or a much older company whose "latest funding" is incidental. That would show that "recently funded" is a weak proxy for "hiring".

## 6. Known before predicting (measured on 2026-09-30, not predictions)

- Only 1,557 of 30,369 companies (5.1%) have any H-1B record. The dataset's own README says a blank means "no trace in our data", not "does not sponsor".
- The newest funding date is 2025-09-26, matching the repo's own audit; the data is about 12 months old on the run date.
- The shipped Form D samples hold 200 records; 0 match a CSV company by exact normalized name.
- Every approval and denial count in the CSV is even (0 odd values in 1,557 rows); the cause is undocumented. The approval-rate column equals approvals divided by approvals plus denials in every row.
- The scorer treats the persona wording "F-1 STEM OPT, work authorized (EAD)" as not needing sponsorship and ignores a `needs_sponsorship` field. A proven-sponsor role moves from Apply 0.446 to Skip 0.178 under that wording.
- The scorer defaults a missing gate value to 1.0 and labels it `record`.
- No code in the repo computes the timeline factor.
- Upstream CI on the main branch is already failing (a false positive in the personal-data scan of `package-lock.json`, and four harness scripts named in the workflow do not exist).
- Baseline commands from this session: `npm run doctor` passes; `npm run verify` needed PyYAML installed in a local virtual environment; `npm run ats:scan -- --dry-run` fails on a fresh clone (no `portals.yml`); `npm run ats:liveness` needed a browser download and then reported the example URL as expired.

## 7. Revisions

Append only. Nothing above this line is to be rewritten.

| Date | Revision | Made by |
|---|---|---|
| 2026-09-30 | Correction to section 6, third bullet. The figure "0 of 200 Form D samples match a CSV company" came from my own crude name normalizer (letters and digits only, no legal-suffix stripping). Re-measured with the repo's maintained rule (`normalize_company_name` in `scripts/sec/entity-resolution.py`): 15 of 200 sample records match a CSV company, 2 of them with an H-1B record, and 212 CSV names are shared by more than one row after normalization. Consequences for the build: the funding cross-check can run on a small real subset, and an ambiguous name must be reported as ambiguous, never resolved by guessing. Predictions P1 to P4 are unchanged. | Claude, found during design, before any prototype code |
| 2026-09-30 | Who "I" is. The first person in this document ("I am writing it before any code exists", "a rule I define", "I will hand-label") is the assistant, Claude Code, not the author. The author chose the recipe from three options and has not yet adopted the predictions as their own; they are the assistant's. | Claude, during the review before anything was pushed |
| 2026-09-30 | Section 2, the list of proposed items, says each "will be a typed TODO in the recipe". That was the plan before any code. In the end the timeline calculator (item 1), the title matcher as a rule (item 2), the tiering rules (item 3), the guard for the scorer's two behaviours (item 4) and the persona (item 5) were built, not left as TODOs. The nine typed TODOs in the recipe are a different list: proposals for the engine and the data (recipe, "Proposed additions"). | Claude, after the build |
| 2026-09-30 | Correction to section 6, sixth bullet. It says the scorer defaults a missing gate value to 1.0 and labels it `record`. That is true of a missing liveness value only. A missing timeline value also defaults to 1.0 but is labelled `your-input` (`scripts/score/role-scorer.mjs`, lines 86 and 87). In both cases a value nobody supplied counts as open. | Claude, found by an independent review |
| 2026-09-30 | Correction to section 6, first bullet. The words in quotation marks, "no trace in our data", are a paraphrase, not a quotation. The sentence is in `data/80-days-to-stay/data/README.md` (line 55): a null sponsorship field "does not necessarily mean the company does not sponsor H-1B visas" and means the data holds no "trace of sponsorship activity". The column notes are in that file, not in `80-days-csv/README.md`. | Claude, found by an independent review |
| 2026-09-30 | Correction to section 4, check for F6. "A hand-made scorer output" is a file the assistant wrote under `fixtures/`, not something the author made. | Claude, found by an independent review |
| 2026-09-30 | Predictions P1 to P4 above are unchanged. They were scored against the real run in `worked-run.md`, section 5. | Claude |
| 2026-09-30 | Addition to section 6, last bullet. `npm run ats:scan -- --dry-run` fails on a fresh clone only because `data/ats/portals.yml` does not exist. After copying `data/ats/portals.example.yml` to `data/ats/portals.yml`, as the example file's own first lines say (the copy is ignored by git), the command runs: one company (Databricks), 882 postings found, 389 removed by the title filter. The output is in `worked-run.md`, section 2.1. | Claude, after the brief |
| 2026-09-30 | A last independent check of the finished branch found small problems in the report's wording and labels, in how the privacy guard was described, and in two helper commands. None of them changes a prediction, a gate or a plan in this brief. They are listed in `FRICTIONAL.md` (entry 12) and in `TEST-REPORT.md`, section 9. | Claude, found by an independent review |
