# SOURCES

## Repository and governance

- The Reallocation Engine, by Nik Bear Brown — https://github.com/nikbearbrown/the-reallocation-engine
- Governing documents read before building: `SNICKERDOODLE.md`, `DOMAIN.md`,
  `CONTRIBUTING.md`, `DATA_CONTRACT.md` (§Zero-Conditions), `recipes/README.md`,
  `recipes/_shared.md`.
- Recipe style modeled on `recipes/local-wage-adjustment.md` and
  `recipes/local-wage-adjustment.card.md` (chosen over the `recipes/cases/2026su/`
  template, which references the `snickerdoodle` CLI — flagged in the
  assignment brief as not runtime today).

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` —
  shipped with the repo (80 Days to Stay dataset: company funding + H-1B
  sponsorship history).
- `data/bls/compact/soc_occupation_compact.csv` — shipped with the repo
  (BLS OEWS / O*NET compact extract).
- `data/examples/ch11-roles.json` — the existing example used as the shape
  reference for this prototype's `roles.json` output.

## Tools reused, not reimplemented

- `scripts/score/role-scorer.mjs` (`npm run score`) — the Bayesian Role Scorer
  from book Chapter 11. This submission writes input to it; it does not
  modify or copy its logic.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) — the repo's
  Playwright posting-liveness checker, run as-is on five postings on
  2026-10-14; its output is saved unedited in the prototype's `liveness/`
  folder.
- `scripts/conformance.mjs`, `scripts/manifest-check.mjs`,
  `scripts/pii-scan.mjs`, `scripts/doctor.mjs` — the repo's own verification
  scripts, run as-is.

## AI contribution vs. what I personally decided, checked, changed, or rejected

See `FRICTIONAL.md` for the full account. In summary: Claude (the AI agent)
performed the repository exploration, wrote all code and documentation files,
and ran every command reported in `TEST-REPORT.md` and `WORKED-RUN.md`. I
personally chose the domain, the recipe angle (sponsorship + funding filter,
over two alternatives offered), the OPT-date placeholder, the slug/branch
name, approved the implementation plan before any `recipes/`/`data/`-adjacent
file was written, and reviewed the real run's output rather than accepting a
described summary of it. I did not independently re-derive the keyword list
or the scorer's gate-threshold math; I accepted Claude's explanation of
`role-scorer.mjs`'s existing behavior (the `?? 1` default for missing
liveness/timeline) as accurate after it quoted the exact line from the file.

### Revision after grading (2026-10-14)

Claude Code (Claude Opus) made the post-grading fixes at my request: it
changed `build_roles.py` so unchecked roles are held out instead of getting an
invented liveness value, added the tests and fixtures for that, re-marked the
recipe DRAFT, recorded the CLARI INC hand-check value, picked five current
postings from the companies' public job boards (Greenhouse, Ashby and
Datadog's careers site), ran the repo's liveness checker on them, re-ran the
prototype, and rewrote `WORKED-RUN.md`, `TEST-REPORT.md` and this file. I
decided to check real postings rather than leave everything unscored, gave the
time numbers in `DOMAIN-JUSTIFICATION.md` (5 minutes per posting, 40–50
postings a day), approved the recipe edits, and reviewed the posting list. I
opened the Datadog posting the checker marked `uncertain`, found it live, took
the screenshot in `liveness/`, and made the gate decision recorded in
`liveness/gate-decisions.csv`; Claude Code then added the code and test that
read that file.

## Job postings checked (2026-10-14)

Public pages, used only as liveness inputs: WHOOP (jobs.ashbyhq.com), Discord
and Life360 (job-boards.greenhouse.io), Skydio (jobs.ashbyhq.com), Datadog
(careers.datadoghq.com). Exact URLs are in
`scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/posting-urls.csv`.

## Course materials

- INFO 7375 "The Reallocation Engine — Recipe Design Assignment," Fall 2026
  (assignment brief, pasted into this session by the student).
