# Submission sheet — The Reallocation Engine, Mode Build Assignment

## Executive summary

**What this is.** The one-page summary of my submission: who the mode is for, where each deliverable is, how to run it, what stage it reached, and what it can't do.

**Why read it.** It's the quickest way to find and check everything I'm submitting.

**What it says.** The mode screens real Data Engineer job postings for an international student who needs H-1B sponsorship. It ran twice on real postings, and its last run was a live run with every human checkpoint cleared by me. Its biggest limit: it can't tell whether a company sponsors *now*.

---

Assignment: The Reallocation Engine — Mode Build Assignment (100 points)
Student: Ethan Gomes
GitHub handle: EthanGomes14
Domain / situation: International F-1 master's student in the final semester before post-completion OPT, seeking new-grad Data Engineer (and same-work titles) roles anywhere in the US, needing H-1B sponsorship. Worked example: fictional persona "Electrifier" (OPT start 2027-03-01, practical deadline 2027-05-20).
Mode file: recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md (+ .card.md for the human reader)
Engine layers used: 80 Days to Stay (sponsorship) · Job-Ops (discovery, ats:liveness gate, Greenhouse cross-check) · visa timeline (gate) · existing role-scorer.mjs
Live-run command: node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode live --today 2026-10-21 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json --out-dir /tmp/de-h1b-live
  Test command: node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
  Real repo scripts run: npm run ats:liveness (19 real URLs, 2026-10-20 and 2026-10-21) · scripts/score/role-scorer.mjs (called by the screen) · npm run verify · npm run doctor · scripts/pii-scan.mjs
Zip of record: reallocation-ethangomes-mode.zip ✍️ (to be built)
GitHub repository / branch / PR URL: https://github.com/EthanGomes14/the-reallocation-engine / mode/ethangomes14-data-engineer-h1b-triage / ✍️ (PR URL after opening; not pushed yet)
Submitted commit SHA: ✍️ (final commit hash after the last push; do not put it in the same commit)
Lifecycle stage claimed: RUNNABLE-LIVE, v0.5.1 (live run 2026-10-21, gates G1–G4 cleared and logged by me). One typed TODO is open (DOL LCA data, a proposed addition off the run path); a strict reading of SNICKERDOODLE.md would stop at DRAFT for that, and the recipe says so.

Deliverables:
  1. Mode file: recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md
  2. Domain justification (one page): JUSTIFICATION.md
  3. Worked run (real output, verified vs. inferred, verification, attestation, reflection): WORKED-RUN.md
  4. RUN_LOG entries: RUN_LOG-ENTRY.md (filed as logs/runs/2026fa-ethangomes14-6.md and -7.md; CONTRIBUTING.md forbids editing logs/RUN_LOG.md)
  Also: TEST-REPORT.md · CHANGE-BRIEF.md · SOURCES.md · FRICTIONAL.md · PRESENTATION.md · assignments/submissions/ethangomes14/runs/ (outputs and transcripts) · scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/ (code, tests, samples)

Summary of my changes:
  - v0.5.0 (2026-10-20): discovery from public Greenhouse boards; a reviewed brand → legal-name alias table; a posting-age ("possibly evergreen") flag; a fit floor (my decision: Apply with fit < 0.4 → Consider, after the scorer); title-rule fix for a sales job. First real run on 19 postings: Apply 5 · Consider 8 · Skip 1 · unscored 5.
  - v0.5.1 (2026-10-21): I cleared every gate (four aliases checked, 18 links opened, timeline confirmed, report read); live run: Apply 8 · Consider 10 · Skip 1 · unscored 0, CSV cross-check 19/19. Fixed a UTC date bug and a hardcoded run type found on that run; froze the pre-review alias file so the first run still reproduces.
  - 23 offline tests; 7 break attempts on real inputs; an independent Python re-parse of the sponsor CSV; attestation signed by me, bound to file hashes.
Known limitations:
  - Approvals are undated and company-wide: it can't tell whether a company sponsors now (open [TODO: DATA SOURCE], DOL LCA data).
  - Sponsor data covers companies headquartered in 6 states only.
  - Aliases were checked with a Google search, not company filings; Unite Us's sponsor-file website (unite-usa.com) still differs.
  - Whether the 3 long-open postings are still being filled is unknown.
  - Fit is Claude's rating from titles only.
  - Greenhouse boards only; 14 of 37 guessed boards were wrong; the boards were chosen because the companies sponsor, so the skip rate (5%) is not a fair test.
  - Not run on Node 20 (CI's version) or from a fresh clone of v0.5.1.
  - E-Verify, funding and wages are out of scope.
