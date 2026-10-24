# Frictional Log — Frontend / Full-Stack Sponsorship Triage

## Purpose

This log records actual problems, checks, corrections, and decisions made while building and testing the Frontend / Full-Stack Sponsorship Triage recipe. It distinguishes my work and judgment from AI assistance.

## 1. Company-name matching failed on the first pass

**Attempt:** I ran the prototype using `A10 Networks` as the company input.

**Expected:** The prototype would find the company's historical sponsorship record in the repository CSV.

**What happened:** The dataset stored the company as `A10 NETWORKS INC`, so my first exact-match implementation did not find it.

**Response:** I inspected the source data and changed the prototype to normalize common trailing legal suffixes before performing an exact normalized comparison.

**Check:** I added and ran an offline test for legal-suffix normalization. The final test suite passed.

**Learning:** A company being unmatched is not evidence that it has never sponsored. Company-name normalization is necessary, but fuzzy matching would introduce additional uncertainty, so the prototype deliberately does not claim fuzzy matches.

## 2. Prototype produced a NameError during development

**Attempt:** I ran an early version of the Python prototype.

**Expected:** It would read the requested company and produce the reports.

**What happened:** Code placement caused a `NameError` because `company` was referenced incorrectly.

**Response:** I corrected the variable/code placement and reran the prototype and tests.

**Learning:** Running the actual command exposed an implementation error that was not obvious from reading the code alone.

## 3. Missing sponsorship fields

**Attempt:** I tested a company row with blank sponsorship fields (`$AVY INC`).

**Expected:** The prototype should not interpret blank fields as evidence that the company does not sponsor.

**What happened:** The case exercised the missing-evidence path.

**Response:** The prototype reports `SPONSORSHIP_EVIDENCE_UNKNOWN` instead of inventing a negative result.

**Learning:** Missing evidence and negative evidence must remain separate. Historical sponsorship data also does not prove that a company will sponsor a current role.

## 4. Company absent from the dataset

**Attempt:** I tested a company name that is not present in the source CSV.

**Expected:** The prototype should fail clearly rather than fabricate a match.

**What happened:** It returned the `COMPANY_NOT_FOUND` state.

**Response:** I retained this as a named failure case and covered it in the offline tests.

**Learning:** An absent company cannot safely be classified as a non-sponsor.

## 5. ATS dry-run setup issue

**Attempt:** I ran the repository ATS dry-run command.

**Expected:** The ATS scanner would run using the repository tooling.

**What happened:** The first attempt failed because `portals.yml` was not present in the expected location.

**Response:** I followed the repository's documented setup and used the provided example configuration. The rerun succeeded.

**Observed successful run:** The dry run checked one configured company and reported 886 jobs found and 61 new offers without writing live changes.

**Learning:** Repository tools may require documented local setup before they are runnable.

## 6. Liveness check required Chromium

**Attempt:** I initially invoked the liveness tooling while learning its command behavior.

**Expected:** I expected to inspect or run the liveness command directly.

**What happened:** One attempt treated `--help` as a URL, and the environment also lacked the Chromium browser required by the liveness checker.

**Response:** I installed Chromium with the Playwright installation command and reran the liveness check against the job URL used in the worked run.

**Observed result:** The posting was reported active.

**Learning:** Liveness is a separate gate from historical sponsorship evidence. A company having sponsorship history says nothing about whether a particular posting is currently live.

## 7. PII scan finding

**Attempt:** I ran:

`node scripts/pii-scan.mjs`

**Expected:** I checked the branch for personal information before submission.

**What happened:** The scanner reported one email-like string:

`package-lock.json — an existing email-like string in package-lock.json`

**Response:** I checked that this was in the repository dependency lockfile rather than personal data introduced by my contribution. I did not modify the lockfile or weaken the scanner merely to make the result appear clean. I documented the finding in the PR.

**Learning:** Scanner findings need to be investigated rather than automatically removed or ignored.

## Human and AI contributions

### My contributions

I chose the career situation and the sponsorship-triage scope based on my own job-search needs. I ran the repository commands and prototype locally, inspected their actual outputs, tested failure cases, checked the sponsorship source data, decided to keep missing evidence distinct from negative evidence, and reviewed the final verified-versus-inferred boundary.

I also decided not to treat historical sponsorship evidence as a guarantee of current sponsorship and not to add fuzzy matching without a defensible verification step.

### AI assistance

I used AI to help interpret repository instructions, explain errors, suggest debugging steps, draft documentation structure, and review whether the implementation matched the assignment requirements.

I did not treat AI-generated claims as source records. Repository data, repository tooling, command output, and tests were used for verification. I accepted suggestions only after running or checking the relevant commands and modified the implementation when actual results disagreed with expectations.

## Traceability

The implementation, tests, recipe, reports, and run log are contained in the `Varun19Aed` contribution namespaces. Detailed commands and observed outputs are recorded in:

- `TEST-REPORT.md`
- `WORKED-RUN.md`
- `CHANGE-BRIEF.md`
- `SOURCES.md`
- `logs/runs/2026fa-Varun19Aed-1.md`

The final Git commit and pull request provide version-level traceability for the submitted work.
