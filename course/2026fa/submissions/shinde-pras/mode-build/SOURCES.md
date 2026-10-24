## Executive summary

This note lists everything the mode build relied on: the repository and its rules, one public dataset, the repository code used as is, a few helpers reused from my earlier pull request, the precedents consulted for structure, and the assignment brief. It ends with a plain split between what I decided and did and what the AI assistants did.

## Repository and governing documents

- Upstream repository nikbearbrown/the-reallocation-engine; my fork shinde-pras/the-reallocation-engine, branch mode/shinde-pras-pm-apm-live-sponsor.
- This branch started from upstream commit 015843d (git merge-base HEAD upstream/main).
- SNICKERDOODLE.md, DOMAIN.md, DATA_CONTRACT.md, CONTRIBUTING.md, recipes/README.md, recipes/_shared.md, recipes/cases/README.md.

## Data

- data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv, read only, never edited.
- The test fixtures under scripts/contrib/2026fa/shinde-pras-pm-apm-live-sponsor/fixtures/ are invented.

## Code used unchanged

- npm run ats:liveness (posting liveness check).
- npm run score (the repository's role scorer).
- scripts/ats/scrapers/common/normalize.py:22 and config.py:42-58 (company-name normalizer), loaded by file path.

## Reused from my earlier PR

- From scripts/contrib/2026fa/shinde-pras-pm-apm-opt-clock/pm_opt_clock.py at 4d4af4b, as named in the gate script's own comment (live_sponsor_gate.py:46-47): parse_number, parse_titles, is_pm_family, pm_title_level and classify_company's rule body. In the gate script, is_pm_family's pattern is used inline (PM_FAMILY_RE) and the rule body became classify_row.
- PR #16 (my earlier recipe assignment) was open when this was written; it is closed with a link to this PR when this PR is opened (CONTRIBUTING.md:22-23).

## Precedent

- recipes/cases/2026su/case-ds-faang-opt-runway.md: structure reference only; nothing copied.
- The old card (recipes/cases/2026fa/shinde-pras-pm-apm-opt-clock.card.md on the PR #16 branch): format only.

## The brief and the course AI policy

- The Canvas brief, plus the repository copy course/summer-2026/reallocation-engine-mode-build.md.
- The course AI policy is not in this repository: course/assignments/greenhouse-watch.md:7 links ../prerequisites/ai-policy.md, and that folder does not exist here.

## AI use

What I decided and did (the reflection mentioned below is in WORKED-RUN.md):
- Before the first live run I opened all three postings in my browser; all three were open with an Apply button visible, and I read their locations by hand (all US).
- Immediately before pass 2 I checked posting 1 in my browser and saw it open.
- In pass 2 I confirmed by hand that posting 1's candidate row is the same employer; I did not verify the filing entity.
- I chose the persona numbers (timeline 0.8, fit 0.7 each); they are fictional.
- I wrote the guesses P1-P4 and P6-P11 before the runs they concern; P5 and the expected composites were derived from the scorer's code, not guessed.
- I wrote the reflection below in my own words; Claude suggested four small factual wording changes and I accepted them.
- I approved each plan and read each report before the next step.

What the AI did: the planning chat (Claude) drafted plans and prompts and reviewed reports; the terminal assistant (Claude Code) ran commands and git and wrote code, tests and documents. Commits carrying the Claude co-author trailer: every commit on this branch carries the Claude co-author trailer (checked with git log before submission).
