# SOURCES — what this submission is built on, and who did what

## Executive summary

This file credits the repository, data and tools this work uses, and states plainly
which parts were done by me (AdityaHasija37) and which by the AI assistant (Claude, in
Claude Code). In short: I chose the situation, the angle, every rule and threshold, every
gate decision, and ran every test and break attempt reported as mine. The AI read the
repository, wrote the code, tests and first drafts of the documents, gathered the Gate A
evidence, and suggested commands. The dated, step-by-step record is in `FRICTIONAL.md`.

## Repository and governing documents

- *The Reallocation Engine*, `nikbearbrown/the-reallocation-engine` (forked as
  `AdityaHasija37/the-reallocation-engine`): `SNICKERDOODLE.md` (constitution: gates,
  provenance, lifecycle, attestation format), `DOMAIN.md` (known gaps), `CONTRIBUTING.md`,
  `DATA_CONTRACT.md` §Zero-Conditions, `recipes/README.md`, `recipes/_shared.md` (run-log
  template), `recipes/local-wage-adjustment.{md,card.md}` and `recipes/scan.md` (style).
- Code reused **unchanged**: `scripts/score/role-scorer.mjs` (run as a CLI),
  `scripts/ats/providers/{greenhouse,lever,ashby,_http}.mjs` (imported),
  `scripts/ats/check-liveness.mjs`, `scripts/conformance.mjs`, `scripts/doctor.mjs`,
  `scripts/pii-scan.mjs`, `scripts/manifest-check.mjs`.
- Example input shape: `data/examples/ch11-roles.json`.
- The essay *The 3-3-2 Split* (Nik Bear Brown), cited for the day structure only; none of
  its figures are used as records here.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: 80 Days to
  Stay (Humanitarians AI), SEC + DOL/USCIS mapping. Read only. Its `phone`,
  `executive_officers` and `board_directors` columns are excluded from every fixture and
  output.
- `data/80-days-to-stay/data/README.md` and `SEC_DOL_H1b_data_mapped-audit.md`: column
  meanings, null semantics, funding age.
- `data/bls/compact/soc_occupation_compact.csv`: BLS OEWS and O*NET (context only).
- `data/sec/form-d/processed/sample/*.sample.json`: checked for overlap (0 companies);
  not used.
- Public job-board APIs read on 2026-10-03: `boards-api.greenhouse.io`, `api.lever.co`,
  `api.ashbyhq.com` (responses trimmed to title, url, location, and saved). Company
  careers pages were viewed for Gate A evidence only; nothing from them is stored except
  the URLs in `boards.sample.json`.

## Tools

Node.js 22, Python 3.13, git, curl, Playwright Chromium (for `ats:liveness`), the Claude
desktop app's in-app browser (Gate A evidence), and Claude (Anthropic) via Claude Code as
the AI assistant.

## Collaborators

None. The persona "Meera Iyer" and "Quillfeather Product Labs Inc" are fictional.

## Who did what

| Area | Me (AdityaHasija37) | AI assistant |
|---|---|---|
| Situation and angle | My degree, dates, experience, target roles; chose "PM network-targets" | Measured data coverage; recommended the angle; flagged the overlap with a classmate's PR |
| Predictions | Prediction #2 (50–75% board coverage; wrong, measured 35%); accepted the other four as drafted | Drafted predictions #1, #3, #4, #5 |
| Rules | Senior PM in; two tiers; ≥10 at <90% → Likely; 1–2 approvals skipped ("too thin to trust", chosen from offered options); 60-day lag; Product Owner out; manager titles out | Proposed options; set fit = 0.7 when I delegated it; wrote the rules as code |
| Next actions | Apply, Consider, Network (changed from "watch only" to "outreach first" after the AI pointed out the contradiction) | Pointed out the contradiction |
| Gate A | Checked 4 boards by hand; made every confirm/reject decision, including widening the rule to indirect evidence, reversing my Datadog "no", and adding the 2 corrected boards | Gathered evidence for all 10 (HTML, in-app browser, ID/title cross-checks); confirmed nothing on its own |
| Code and tests | Reviewed; ran the tests | Wrote `rules.mjs`, `network-targets.mjs`, the tests, fixtures and README |
| Testing | Ran the clean checkout, both break attempts, and the hand cross-check | Wrote and dry-ran the commands; diagnosed why break 1 failed by crash; filled in TEST-REPORT |
| Lifecycle stage | Chose DRAFT with 3 TODOs open | Explained the options |
| Documents | Reflection content (skip rate, next improvement), time estimate; reviewed every document | Drafted the brief, recipe, card, test report, justification, worked run, run log and this file; tidied the grammar of my answers without changing their meaning; wrote the "flat 0.525 score" reflection paragraph at my request (labeled in place) |
| Git | Set my noreply identity; approved each commit | Ran the approved commits; nothing pushed without approval |

### What I accepted, changed, or rejected from the AI
- **Changed:** my network action (watch → outreach first); my Datadog Gate A answer (no →
  yes, on evidence); the Gate A rule (direct only → direct or indirect).
- **Rejected:** claiming RUNNABLE-SAMPLE (kept DRAFT); including Product Owner.
- **Accepted:** the angle, the code structure (reusing providers and the scorer), the
  break-attempt commands, the fit value.
