# Sources and contributions — ml-tailor-or-ask

## Executive summary

This page credits everything the mode is built on, and says who did what. Claude Code wrote the code, tests,
fixtures and document drafts. The student set the situation, the design boundary and every rule, ran both worked
runs, and made every gate decision in their own words. An automated session the student used separately made two
earlier checks, credited below. Nothing personal from the student is in this repository.

## The repository and its governing documents

- nikbearbrown/the-reallocation-engine @ `015843d`: `SNICKERDOODLE.md` (constitution: lifecycle, gates,
  attestation), `DOMAIN.md`, `CONTRIBUTING.md` (Fall 2026 paths and rules), `DATA_CONTRACT.md` (the privacy zero
  conditions), and `recipes/_shared.md`.
- The assignment brief: "The Reallocation Engine — Mode Build" (Canvas), the same text as
  `course/summer-2026/reallocation-engine-mode-build.md`.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`), with its audits
  `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` and `…-join-validation-audit.md`. Only non-personal
  columns are read.
- The fictional persona `search/examples/priya-nair/` and `resumes/priya-nair-cv.md`, maintained in the repo.
- Two public job postings read live through Greenhouse's public API, as test cases: Goodfire, "Machine Learning
  Engineer", and Orenda, "Machine Learning Engineer". Naming them does not imply confirmed sponsorship.
- Identity sources the student cited: Goodfire's legal terms (goodfire.com/legal/tos), an SEC Form D filing
  (sec.gov, CIK 2070813), and orendapower.com.

## Code reused, unchanged

- `scripts/score/role-scorer.mjs` (through its CLI), `scripts/ats/liveness-core.mjs`, `scripts/ats/check-liveness.mjs`,
  and `normalize_company_name` from `scripts/sec/entity-resolution.py`.
- `fetch_board` from `.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py`.

## Reused from the author's Assignment 3

From branch `contrib/2026fa-sukethrp-ml-newgrad-sponsor-match` @ `95d4982` (nikbearbrown/the-reallocation-engine#12):
- `node_bridge.mjs`, byte-identical;
- the record functions in `evidence.py`, each change named in its docstring;
- the title rules, then reviewed and changed by the student (R1–R8);
- four synthetic page snapshots and the fictional 11-row test CSV, to which this mode added two rows.

## Who did what

| Work | Who |
|---|---|
| The situation, the design boundary, the privacy boundary (Checkpoint 1) | the student |
| ASK FIRST for gaps (with the question's wording), fit as their own number, "duration is not kind" (design answers) | the student |
| Calls R1–R8 on every screening rule, and adopting rules 0.2.0 | the student; Claude Code drafted the patterns and built the calls |
| Gate decisions in the live run: Goodfire's identity confirmed with sources, Orenda kept as a candidate, fit and timeline left unset, both decisions HOLD | the student |
| Running the sample, live, anchor and break commands, and checking CSV row 11308 by hand | the student, in their own terminal |
| All code, tests, fixtures, the recipe, the card, the run-log entries, and the first drafts of this folder's documents | Claude Code (Claude Opus 5.5), at the student's direction |
| The engine survey, the Assignment 3 review, the rules-review evidence | Claude Code and two Claude Code subagents |
| The Checkpoint 2 scorer reading, the CP2 fallback browser check, and the `runs/live/round-1/` attempt | an automated session the student used separately (not named). The student later re-ran these checks personally in their own terminal: `runs/anchor/`, `runs/break-demo-panel/` and `runs/live/round-3-panel/` |
| Reflection, attestation and approval of the domain justification | the student (Checkpoint 4) |

## What the student accepted, changed or rejected

**Rejected:**
- MOVE ON as the default for experience gaps. They chose ASK FIRST, with their own question.
- Clearing Orenda's identity on an exact name match.
- Setting fit or timeline numbers without facts to justify them.
- Treating every untitled job as full-time.

**Changed:**
- the title rules: counting II/L2 titles, and "needs context" for Lead, Founding, Architect and Fellow;
- the heading rules: work conditions shown separately, and unknown headings flagged;
- alternative experience paths: left unresolved;
- the reading of firm minimums: negation-aware.

**Accepted:**
- the mode's structure and gates;
- the requirements boundary;
- three readings at adoption: "distinguished" is senior, unclear lines flag without changing the suggestion, and
  RA/TA mean assistantships.

The student's words for each are in FRICTIONAL.md.
