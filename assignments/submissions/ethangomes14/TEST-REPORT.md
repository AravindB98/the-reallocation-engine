# Test Report — Data Engineer H-1B sponsor screen (mode build, v0.5.1)

## Executive summary

**What this is.** The record of every test run on the mode for this assignment: the repository's own checks, the real runs on job postings, the offline test suite, deliberate attempts to break it, and the privacy scans. Every block of output below is pasted from a saved transcript, not retyped.

**Why read it.** It shows that the mode actually runs, that its numbers match the source data, and that it refuses to guess when evidence is missing. It is the evidence behind the attestation in the worked run.

**What it found.**
- Everything passes: the repository's checks, all 23 offline tests, and a second-parser check of every sponsorship number (19 out of 19 match).
- The live run on 19 real postings gave Apply 8 · Consider 10 · Skip 1 · unscored 0.
- Six deliberate break attempts on the final code each stopped or gated as designed.
- Two problems were found and fixed during the build: a date mix-up between UTC and local time, and a mislabelled run type.
- No personal data is in the change. The only privacy-scan finding is an email address that was already in the instructor's dependency file.

---

## Record

- **Date:** 2026-10-21 (runs on 2026-10-20 and 2026-10-21)
- **Version tested:** sponsor-screen v0.5.1, recipe `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md` v0.5.1
- **Machine:** Ethan Gomes's laptop · Node v25.8.0 · Python 3.9.6 · git 2.54.0
- **Branch:** `mode/ethangomes14-data-engineer-h1b-triage`, based on `dbac7a2`, with the v0.5.x changes not yet committed. It was renamed from `mode/ethangomes14-data-engineer-h1b` after these runs, so the pasted transcripts below still show the old name.
- **Transcripts:** `runs/terminal-attestation-v0.5.1-2026-10-21.txt` (sections 1, 3, 4, 6, 7), `runs/terminal-live-2026-10-21.txt`, `runs/terminal-greenhouse-2026-10-21.txt`, `runs/terminal-discovery-2026-10-20.txt`, `runs/terminal-discovery-break-2026-10-21.txt`

Files tested, with their sha256 (first 12 characters):

```text
# Attestation re-run, v0.5.1 · 2026-10-21 21:10 EDT · Ethan Gomes's laptop · node v25.8.0 · branch mode/ethangomes14-data-engineer-h1b @ dbac7a2 + uncommitted v0.5.x files
# (re-captured after wording-only edits to the recipe: lifecycle-claim lines and the required-reads pointer to the new change brief; no code or data changed)
# Files attested (sha256, first 12):
#   c5d1d97ac334  recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md
#   151e2c858af1  recipes/cases/2026fa/ethangomes14-data-engineer-h1b.card.md
#   6ad6d9f057ca  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs
#   0cc2daac9040  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/lib.mjs
#   862d23422045  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/rules.json
#   8d73af90403c  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/aliases.json
#   8fb67072f635  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs
#   3211700605f5  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fetch-greenhouse-status.mjs
#   8944466f07f0  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
#   b3282e9224ef  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json
#   275a2a348adc  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt
#   f23f016c8233  scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json
#   8655e182c3c2  scripts/score/role-scorer.mjs
#   e4d8d1e78d86  scripts/ats/check-liveness.mjs
```

## 1. Toolchain

```text
$ npm run verify --silent
conformance: 184 files (88 md · 36 py · 36 js · 20 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]
```

The three warnings were already in the instructor's repository. W2 says `private/` and `data/ats/` are not gitignored; `git check-ignore` shows `/private/*` and `/data/ats/*` are ignored, so it is a pattern-matching false alarm.

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/ recipes/cases/2026fa/ assignments/submissions/ethangomes14/ logs/runs/2026fa-ethangomes14-6.md logs/runs/2026fa-ethangomes14-7.md course/2026fa/submissions/ethangomes14/
conformance: 99 files (45 md · 47 json · 6 js · 1 py)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit 0]
```

## 2. Discovery (2026-10-20, network: `boards-api.greenhouse.io` only)

`node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --boards scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/boards-2026-10-20.txt` (full output: `runs/terminal-discovery-2026-10-20.txt`). Last line:

```text
37 boards asked · 23 answered · 23 Data Engineer-family postings → scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/postings-2026-10-20.json
```

14 of the 37 board names were guesses that returned 404. They are listed in the transcript, not guessed further. Of the 23 postings, 19 (US or no location) became the candidates, with fit rated by Claude from the titles (`model-judgment`).

## 3. Sample run (2026-10-20 inputs, pre-review aliases)

Re-run on the final code with the frozen pre-review alias file, to show the first real run still reproduces:

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json --out-dir $SCRATCH/sample
sponsor-screen: 19 candidates → Apply 5 · Consider 8 · Skip 1 · unscored 5 (skip+unscored 32%)
  fit floor: 2 Apply capped at Consider (fit < 0.4): klaviyo-7809608003, roku-8201216
  unscored: alias-pending-review × 5
  greenhouse cross-check: 19 checked (status file 2026-10-20)
  aliases: 4 in file · matched 0 · pending review 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002)
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  $SCRATCH/sample/screen-log.json  +  $SCRATCH/sample/screen-report.md
[exit 0]
```

## 4. Live run (2026-10-21, every gate cleared by a person)

Liveness was re-checked with `npm run ats:liveness` on the 19 URLs (18 active, 1 uncertain: `samples/liveness-2026-10-21.txt`). The Greenhouse API was re-checked too (19 × 200: `runs/terminal-greenhouse-2026-10-21.txt`). Then:

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode live --today 2026-10-21 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json --out-dir $SCRATCH/live
sponsor-screen: 19 candidates → Apply 8 · Consider 10 · Skip 1 · unscored 0 (skip+unscored 5%)
  fit floor: 2 Apply capped at Consider (fit < 0.4): klaviyo-7809608003, roku-8201216
  greenhouse cross-check: 19 checked (status file 2026-10-21)
  aliases: 4 in file · matched 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002) · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  $SCRATCH/live/screen-log.json  +  $SCRATCH/live/screen-report.md
[exit 0]
```

## 5. Offline tests (fixtures only, no network)

```text
$ node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
✔ CSV parser handles quoted commas and doubled quotes
✔ name normalization strips legal suffixes but never fuzzes
✔ title family includes Data Engineer-type titles and excludes wrong levels
✔ sponsorship tiers follow the rule; empty H-1B fields are missing, not zero
✔ timeline: cannot start before OPT; closes after the practical deadline
✔ liveness: reads ats:liveness output, flags stale checks, refuses missing evidence
✔ Greenhouse URL parsing covers the four link shapes and never guesses a board
✔ cross-check: only a definite API 404 closes an open gate; nothing is assumed
✔ dates: "today" is the local calendar date, and a status file dated after today is never trusted
✔ G0 rejects a row without a fit rating and reason
✔ full run on fixtures: every named failure case is reported, nothing defaulted
✔ F5: after the OPT deadline every scored role is Skip (timeline gate closed)
✔ break: a scorer that ignores the gates is caught (exit 3)
✔ break: refuses to write outside its own folders
✔ break: a named Greenhouse status file that does not exist stops the run
✔ break: a missing sponsor CSV stops the run without inventing anything
✔ aliases: the file is validated and never fuzzes
✔ full run with aliases: reviewed alias scores, pending alias stays unscored, nothing guessed
✔ break: an alias marked reviewed without a date stops the run
✔ break: a named aliases file that does not exist stops the run
✔ posting age is shown and flagged, but never changes a score
✔ mode: defaults to sample, records live when asked, changes no result, and refuses anything else
✔ fit floor: a low-fit Apply is capped at Consider, never raised, and the scorer output is kept
ℹ tests 23
ℹ suites 0
ℹ pass 23
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1482.564167
```

(Per-test timings removed; full output in the transcript.)

## 6. Deliberate break attempts (on the final code)

**Stale liveness evidence.** The live run with the 2026-10-03 liveness file, which holds only 7 of the 19 URLs:

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-21 --mode live --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-03.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json --out-dir $SCRATCH/break-stale
sponsor-screen: 19 candidates → Apply 0 · Consider 0 · Skip 7 · unscored 12 (skip+unscored 100%)
  unscored: url-not-in-liveness-log × 12
  greenhouse cross-check: 7 checked (status file 2026-10-21)
  aliases: 4 in file · matched 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002) · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  $SCRATCH/break-stale/screen-log.json  +  $SCRATCH/break-stale/screen-report.md
[exit 0]
```

**A dead posting the liveness checker calls "active".** An invented Airbnb job ID:

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-ghost-2026-10-03.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-ghost-2026-10-03.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --out-dir $SCRATCH/break-ghost
sponsor-screen: 1 candidates → Apply 0 · Consider 0 · Skip 1 · unscored 0 (skip+unscored 100%)
  greenhouse cross-check: 1 checked (status file 2026-10-20)
  aliases: 4 in file · matched 0 · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  $SCRATCH/break-ghost/screen-log.json  +  $SCRATCH/break-ghost/screen-report.md
[exit 0]
```

**After the OPT deadline:**

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2027-06-01 --mode live --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt --out-dir $SCRATCH/break-late
sponsor-screen: 19 candidates → Apply 0 · Consider 0 · Skip 19 · unscored 0 (skip+unscored 100%)
  greenhouse cross-check: 0 checked (status file 2026-10-03)
  aliases: 4 in file · matched 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002) · pending review 0
  timeline gate: factor 0 [your-input] · earliest start 2027-07-16 · practical deadline 2027-05-20 · slack -57 days
  $SCRATCH/break-late/screen-log.json  +  $SCRATCH/break-late/screen-report.md
[exit 0]
```

**Claiming a status through a flag:**

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode verified --out-dir $SCRATCH/break-mode
STOP: --mode must be one of sample, live, not "verified"
Nothing was scored and no outputs were written.
[exit 2]
```

**Writing into shared data:**

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-21 --out-dir data/80-days-to-stay
STOP: --out-dir data/80-days-to-stay is outside this contribution's folders; refusing to write there
Nothing was scored and no outputs were written.
[exit 2]
```

**Bad input to discovery** (`runs/terminal-discovery-break-2026-10-21.txt`):

```text
# 2026-10-21 20:25 EDT · discovery break attempts (both stop before any network call or write)

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --board ../etc
STOP: not a Greenhouse board token: "../etc"
[exit 2]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --board stripe --out data/x.json
STOP: --out must be inside scripts/contrib/2026fa/ethangomes14-data-engineer-h1b or a temp dir
[exit 2]
```

The test suite also covers four more breaks:
- a deliberately broken scorer that ignores the gates (caught, exit 3);
- a missing sponsor CSV;
- a named status file or aliases file that does not exist;
- an alias marked reviewed with no date.

## 7. Independent check against the source data

`runs/verify-against-csv.py` re-reads the sponsor CSV with Python's `csv` module (not the mode's own parser) and checks every CSV-backed value in the live log:

```text
$ python3 -I assignments/submissions/ethangomes14/runs/verify-against-csv.py $SCRATCH/live/screen-log.json
csv rows: python=30369 log=30369 match=True
csv sha256 match: True
row accounting: 19 == 0+8+10+1 -> True
  sigmacomputing-7809974003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  sigmacomputing-7809973003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  klaviyo-7737707003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-7809608003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-8012938003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  gusto-8099751                GUSTO INC                  approvals csv=218.0   log=218    OK
  gemini-8076827               GEMINI SPACE STATION LLC   approvals csv=24.0    log=24     OK
  airbnb-7998356               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8224032               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8284841               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8242248               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8154705               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8197715               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  robinhood-4738660            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  robinhood-7729014            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  stripe-7230670               STRIPE INC                 approvals csv=1250.0  log=1250   OK
  roku-8201216                 ROKU INC                   approvals csv=654.0   log=654    OK
  upstart-8214129              UPSTART NETWORK INC        approvals csv=316.0   log=316    OK
  uniteus-8840770002           UNITE USA INC              approvals csv=22.0    log=22     OK
fit floor: 2 capped ['klaviyo-7809608003', 'roku-8201216'] · raised above the scorer: 0
mismatches: 0 · closed-gate rows not Skip: 0 · invariant violations in log: 0
[exit 0]
```

## 8. Privacy scans

```text
$ npm run doctor --silent
  …
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
[exit 0]
```

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — i@izs.me
```

The one finding is an npm package author's email in the instructor's `package-lock.json`, which this change does not touch. No file in this change contains personal data. The persona is fictional, and nothing from `private/` or `data/ats/` was read or copied.

## 9. Scope of the change

82 files changed or added before this report and the new submission documents. All of them are in:
- `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/`;
- `recipes/cases/2026fa/ethangomes14-*`;
- `logs/runs/2026fa-ethangomes14-*`;
- `course/2026fa/submissions/ethangomes14/`;
- `assignments/submissions/ethangomes14/` (the folder this assignment names).

No protected path was touched (`logs/RUN_LOG.md`, `SNICKERDOODLE.md`, `DOMAIN.md`, `DATA_CONTRACT.md`, `package.json`, `.github/`, `AGENTS.md`, `CLAUDE.md`). The engine's own scripts and data are unchanged: `git diff HEAD -- scripts/score scripts/ats data` is empty.

The repository's CI warns about the `assignments/` files, because that folder isn't in its student allowlist. That is a warning, not a failure, and will be noted in the PR.

## 10. What the gates required a person to judge

| Gate | What a machine can't decide | What I decided (2026-10-21) |
|---|---|---|
| G1 company match | Whether a brand is the same company as a legal name in the sponsor file | All four aliases accepted after a Google search for each legal name; the six exact matches confirmed |
| G2 liveness | Whether an "active" page shows *this* job, and whether a long-open posting is still being filled | All 18 pages show their job. For the 3 long-open postings, whether they are being filled is unknown, so I am not acting on them |
| G3 timeline | Whether the persona's dates are the intended ones | Confirmed |
| G4 release | Whether the report is fit to act on | Read the live report |

## 11. Broke during testing, fixed

- **A sales job in the Data Engineer family (2026-10-20).** "Account Executive, Product Sales (Data Pipeline)" matched `data pipeline`. Added `account executive` and `\bsales\b` to the exclusions, re-checked against the live Stripe board.
- **Fit had no effect for Proven sponsors (2026-10-20).** Two fit-0.3 lead roles were Apply. I chose a fit floor of 0.4, applied after the scorer.
- **Duplicate checklist questions (2026-10-20).** One question per alias now.
- **UTC dates (2026-10-21).** The Greenhouse status file was stamped 2026-10-22 at 20:40 EDT, so the first live run lost its cross-check, which the summary showed as "0 checked". Fixed with `localToday()` in all three scripts, plus a test. Re-fetched and re-run.
- **Hardcoded run type (2026-10-21).** Added `--mode sample|live`, plus a test.
- **Reproduce commands drifted (2026-10-21).** Froze the pre-review alias file so the sample run reproduces.

## 12. Not tested

- Node 20 (the CI version) and a fresh clone of v0.5.1.
- Lever, Ashby, Workday or company job sites (Greenhouse only).
- Companies headquartered outside CA, NY, MA, WA, TX and IL (all 10 here are in CA, NY or MA).
- Whether any company sponsors today (the approvals have no dates).
- Whether the fit ratings are any good (Claude's, from titles only).
- Whether the three long-open postings are still being filled.
- The legal names beyond a Google search.
