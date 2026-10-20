# Sources and contributions — ml-tailor-or-ask

## Executive summary

This page credits everything the mode is built on, and says who did what. Claude Code wrote the code, tests,
fixtures, the fictional live-run persona and most document drafts; the domain justification, the v0.2.1 attestation
and the reflection are the student's own text. The student set the situation, the design boundary and every rule, ran both worked
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
- The fictional persona `search/examples/priya-nair/` and `resumes/priya-nair-cv.md`, maintained in the repo (the sample).
- The fictional persona `search/examples/kavya-raman/`, written by Claude Code for this mode (the live runs). Her
  history is invented; it is no one's.
- Seven companies' public Greenhouse job boards, read through their public API by `discover.py` on 2026-10-19:
  Databricks, Stripe, Airbnb, Pinterest, Figma, Reddit, Roblox. The raw listings and posting texts are kept outside
  the repo; the logs record their SHA-256. One company contact address in a posting line is redacted in the committed
  copy (`runs/discover-v0.2.0/round-2/judged/NOTE.md`).
- The book's chapter 10 (`book/chapters/10-the-visa-timeline-manager.md`) for the timeline method, and its
  illustration of process lengths, which the student used for their 22-week assumption.
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
| Reflection, attestation and approval of the domain justification | the student: Checkpoint 4 for v0.1.0; for v0.2.1, the attestation (signed 2026-10-20), the three-part reflection and the domain justification itself, all written by the student (Claude Code only added the justification's section headings) |
| The upgrade to discovery (v0.2.0): the request, the scope, the public target list, the filters (including their own "Data Engineering Entry level, and New Grad"), records-first, the computed timeline, the 5-posting sample | the student, choosing among options Claude Code wrote or writing their own |
| Rules 0.3.0 and 0.3.1: every screening decision in the adoption (review flags, unclear locations, availability wording, categories, the cap as a sample, the headings, the 12-word limit) | the student; Claude Code drafted the patterns and built the decisions |
| 22 weeks to start, seven company identities (with the Stripe, LLC note), three fit calls with reasons, the Reddit question, the Pinterest HOLD, the review of two Pinterest postings | the student |
| Their own break attempt (fit 1.5) and its prediction | the student, run on v0.1.1, v0.1.2, v0.2.0 and v0.2.1 |
| The v0.1.1 namesake fix (option a), the v0.1.2 fixes (all four) | the student chose; Claude Code built |
| The Kavya Raman persona, `discover.py`, `timeline.py`, the target-list file (with the legal names), dry runs before each student run | Claude Code. The dry runs wrote only to the gitignored `output/` and are not evidence |

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
