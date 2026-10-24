# SOURCES.md: Reallocation Engine Mode Build

## Executive summary

This file lists what the mode-build work relies on: the repository and its rules, its data and
scripts, and the assignment brief. It also records what the AI assistant did, separately from what
Prathamesh decided. So far the assistant has only inspected things. No mode has been designed or
written.

## Sources

| Source | Version | Note |
|---|---|---|
| Assignment brief "The Reallocation Engine - Mode Build Assignment" | local copy, SHA-256 prefix `c066f03918f1adf7` | the version is waiting on Prathamesh's confirmation |
| The Reallocation Engine, upstream `nikbearbrown/the-reallocation-engine` | `main` @ `015843d` (2026-09-23) | MIT licence. Read: SNICKERDOODLE.md, DOMAIN.md, AGENTS.md, CONTRIBUTING.md, DATA_CONTRACT.md, recipes/README.md |
| Prathamesh's fork `prpathak1/the-reallocation-engine` | `contrib/2026fa-prpathak1-network-eng-h1b-soc-15-1241` @ `6471e2b` | the October 3 Recipe Design work; PR #27 open |
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | tracked in the repo | 80 Days to Stay (Humanitarians AI); contains personal columns that must never be read into outputs |
| `data/bls/compact/soc_occupation_compact.csv` | tracked in the repo | BLS OEWS / O*NET extract |
| GitHub REST API, public pulls list | queried 2026-10-20 | used to confirm PR #27 status, no auth |
| Lever public postings API `https://api.lever.co/v0/postings/<slug>?mode=json` | probed 2026-10-20 13:37 EDT | 12 slugs, one GET each; only counts were recorded, no posting text was stored |
| **32 CFR § 117.10**, "Determination of eligibility for access to classified information for contractor employees" (NISPOM), eCFR point-in-time **2026-10-01** | fetched 2026-10-20 13:56 EDT from `https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-32.xml?part=117&section=117.10` (20,674 B, SHA-256 prefix `e2d77319d907b45f`); human-readable page: https://www.ecfr.gov/current/title-32/subtitle-A/chapter-I/subchapter-D/part-117/section-117.10 | the primary source for the "(inferred)" labels. Quotes below |
| `.github/workflows/contrib-gate.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS` | upstream `main` @ `015843d` | read to determine how the PR rule and paths are enforced |

### 32 CFR § 117.10: the lines relied on (verbatim)

> **§ 117.10(k) Non-U.S. citizens.** (1) Contractors must make every effort to ensure that non-U.S.
> citizens are not employed in duties that may require access to classified information. However,
> compelling reasons may exist to grant access to classified information to a non-U.S. citizen. The
> CSA may grant such individuals a LAA in those rare circumstances where a non-U.S. citizen possesses
> unique or unusual skills or expertise that is urgently needed to support a specific USG contract
> involving access to specified classified information, and a cleared or clearable U.S. citizen is
> not readily available. […]
> (2) An LAA granted under the provisions of this rule is not valid for access to: (i) TOP SECRET
> information. […]

> **§ 117.10(l) Temporary eligibility for access to classified information.** […] Non-U.S. citizens
> are not eligible for access to classified information on a temporary basis.

(Quotes re-checked against the fetched text at 13:58 EDT. A first draft of this section filled in
the end of (k)(1) from memory as "…is not available"; the real text says "…is not readily available".
That draft was corrected before anyone relied on it, and the error is logged in FRICTIONAL.)

How it is used: the postings require the ability to obtain a Secret (or unspecified) clearance, and
this rule generally limits clearance-requiring duties at contractors to U.S. citizens. So those
postings are labeled **contradicted (inferred)**. "Inferred" because the posting never says
"citizen". Three things are **not** verified:
- that Shield AI is a "contractor" covered by this part;
- that the clearance would be processed under this part;
- that an LAA would not be granted. The rule allows it "in those rare circumstances".

## What Prathamesh decided

- **2026-10-20 14:25: attestation confirmed** as accurate, after re-reading it with the G4 changes.
- **TA decision, 2026-10-20 (relayed by Prathamesh):** PR #27 (Recipe Design) and this Mode Build PR
  both stay open.
- **2026-10-20 13:57: every label in LABELS.md** (sentences, the posting combination rule, title
  scope). These are Prathamesh's judgments; Claude's proposals are kept beside them.
- **2026-10-20 13:36:** Mode A (live posting text on sponsorship / work authorization); the repo's CI
  path rules; a new branch from upstream `main`; no PR actions while the TA is consulted about #27; a
  plan before any build.
- The persona direction (an F-1 network engineering student, as in the October 3 recipe), and that
  the new mode must be new relative to that recipe.
- Phase 1 is discovery only. Prathamesh will pick the candidate mode.

## What Claude (Claude Code, model Opus 5.5) contributed

**2026-10-20 13:29–13:34 EDT, Phase 1:** fetched upstream; read the governing docs and the October 3
recipe; inventoried the recipes, scripts and data (counts only, with no personal values printed); ran
`npm install`, `npm run verify` and `npm run doctor` from CMD; wrote this file and FRICTIONAL.md; and
drafted three candidate modes for Prathamesh to choose from.

**2026-10-20 13:36–13:38 EDT, planning research:** read the CI workflow, PR template, CODEOWNERS and
the ATS scrapers; probed 12 public Lever boards (counts only); moved this folder to its planned path;
wrote the build plan for Prathamesh's approval.

**2026-10-20 13:41–13:49 EDT, build up to the label gate:** created the external venv and installed
Chromium (approved in the plan). Wrote `_common.py`, `fetch_lever_full.py`, `filter_titles.py`,
`extract_auth_sentences.py`, two synthetic fixtures and the unit tests. Ran worked-run commands 1–7
twice (run 2 after fixing its own fetch defect). Diagnosed the maintained scraper's silent
employment-type rejection. Proposed every label in `LABELS.md`; **the labels are Claude's proposals
until Prathamesh approves them.**

**2026-10-20 13:56–14:06 EDT, deliverables:** fetched and quoted 32 CFR § 117.10. Recorded
Prathamesh's label decisions in LABELS.md. Wrote the recipe, card, domain justification, worked run
(including the attestation rows, which Prathamesh confirms), README, scripts README and run log. Ran
the unit tests, verify, doctor, pii-scan and the path checks, and redacted email addresses from a
saved check log. The label judgments, scope decisions, path policy and the decision not to open a PR
are Prathamesh's.

**2026-10-20 14:10–14:12 EDT:** ran the liveness check on the 5 remaining in-scope URLs (closing
gate G4), updated the worked run, recipe, labels and run log, re-ran the checks, and drafted the PR
title and description for later use (not submitted).

**2026-10-20 14:26–14:30 EDT, submission:** committed `f3ea8b7`; pushed to the fork; built the ZIP
with `git archive`; created **PR #59** through the GitHub REST API (`POST /repos/.../pulls`), using the
credential git already stores, at Prathamesh's request (token in memory only); verified the PR's file
list and CI status through the public API (CI is waiting for maintainer approval:
`action_required`); wrote FRICTIONAL Entry 9; made the log commit. The decisions to create the PR and
keep #27 open are Prathamesh's (the latter per the TA).

Additional sources: the Lever public postings API (fetched 2026-10-20T17:44:31Z and 17:48:28Z;
Shield AI, Zoox, Palantir; Plaid as the not-found test); the maintained
`scripts/ats/fetch-real-postings.py`, `scrapers/lever/scraper.py`,
`scrapers/common/schema_validator.py` and `scripts/ats/check-liveness.mjs` (run, not modified);
Playwright 1.62.1 Chromium.
