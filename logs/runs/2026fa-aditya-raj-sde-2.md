# Run log — 2026fa-aditya-raj-sde-2

## Executive summary

This is the run record for a student's second course contribution: a screening procedure for an
experienced Java backend candidate who can start in early 2027. Read it to see which runs
happened, on what data, and with what result. Twelve real public postings were collected under a
rule fixed in advance and screened offline. Five were skipped for stated experience minimums the
fictional test candidate does not meet. Six went to a person. One needs sponsorship evidence. Two
rounds of rule corrections are recorded. No human gate has been cleared yet.

Field layout from `recipes/_shared.md`. Per `CONTRIBUTING.md`, this file lives here and never in
`logs/RUN_LOG.md`.

## 2026-10-21 — java-backend-early2027 live collection + page observations

- **Recipe:** recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md (rules v0.1 at the time; collection code unchanged since)
- **Run by:** Claude (Claude Code), on Aditya Raj's instruction; branch `contrib/2026fa-aditya-raj-sde-java-backend-early2027`
- **Inputs:** sponsorship CSV sha256 `eccdee2addf472b1…`; `SAMPLE-PROTOCOL.md` (committed before collection); Greenhouse boards API
- **Commands:** `collect.mjs --private-dir private/a2 --public-dir …/real-sample` (00:01:47–00:01:55 EDT); `npm run ats:liveness -- <12 URLs>` (00:02:07–00:02:38); `page-probe.mjs` (00:02:55–00:03:46)
- **Outputs:** `…/assignment-2/real-sample/probe-log.json`, `selection.json`; raw responses in gitignored `private/a2/capture/`
- **Result:** 17 employers probed, 3 boards verified (Databricks, Pinterest, Stripe), 12 postings selected. Page checker: 8 active, 4 expired (all Pinterest; the probe saw HTTP 403 "Just a moment...", 272 chars)
- **Open issues:** the maintained checker reports a 403 challenge page as expired (proposed `[DEV]` patch in the recipe)

## 2026-10-21 — java-backend-early2027 runs on the real sample (v0.1 → v0.2 → v0.3)

- **Run by:** Claude
- **Inputs:** `…/real-sample/observations.json` (excerpts; v0.1 extraction preserved as `observations-v0.1-extraction.json`, sha256 `67ba0ec3…`); candidate `config/candidate.tariq-lindqvist.json` (fictional)
- **Outputs:** `…/assignment-2/runs/real-replay-v0.1/`, `real-replay-v0.2/`, `real-replay-v0.3/` (`triage.json` + `triage.md`); private full-text twins in `private/a2/runs/`
- **Result (v0.3):** 5 skip-application (G4), 4 human-liveness-review (G2), 1 human-eligibility-review (G3), 1 human-requirement-review (G4), 1 seek-vacancy-sponsorship-evidence; skip fraction 5/12 (this sample only); full-text vs replay differences **0**; v0.2 vs v0.3 decision differences 0
- **Corrections:** v0.1 misread heading-borne and conjunctive requirements (5 openings); fixed in v0.2. v0.3 fixed "plus N years" as a preference cue (synthetic S27)
- **Open issues:** rules corrected on this same sample (no held-out check yet); no sponsorship or start-date wording in any captured posting; application-form questions not captured

## 2026-10-21 — synthetic fixtures, tests, Assignment 1 comparison, break attempts

- **Run by:** Claude
- **Inputs:** `fixtures/synthetic-cases.json` (29 invented); the Assignment 1 tool on the same 12 real observations (`runs/a1-tool-on-real-sample/a1-input.json`, labelled placeholder fit/timeline)
- **Outputs:** `runs/synthetic-v0.3/`; `runs/a1-tool-on-real-sample/reality-check.{json,md}`; evidence 08–12
- **Result:** tests 45/45 (Assignment 1 suite 18/18). Assignment 1 vs this mode: 11/12 next steps differ. Break: 3/3 mutants caught; real decisions changed 4 (feed ignored), 0 (no preference distinction), 5 (stack overrides experience). Control on unmutated HEAD 45/45. Run 1 harness artifact (worktrees in the temp dir) preserved and corrected
- **Human gates:** none cleared. G8 adequacy review, co-op-silence DEFINE, and routine-value DEFINE are open for Aditya
- **Open issues:** see the recipe's typed TODOs (6 open)
