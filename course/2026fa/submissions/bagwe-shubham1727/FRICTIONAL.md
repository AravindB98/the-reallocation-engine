# FRICTIONAL — honest log

## Executive summary

**What this is.** A record of what was actually tried while building this recipe, what happened, what was checked or changed in response, and who did each part: me (Shubham) or the AI agent I worked with (Claude Code, model Claude Opus 5.5).

**Why read it.** It separates my decisions from the AI's execution and links each claim to a commit or a saved output, so a grader can check it.

**What it shows.** The AI did most of the execution: reading the repo, writing code, tests and drafts, and running everything. I chose the situation, the GitHub handle, and how far to take GitHub. The most useful frictions were three engine defects found by running things rather than reading about them, and three defects in our own prototype found by reading its first output line by line.

---

## Who did what

| Part | Who | Accepted / modified / rejected |
|---|---|---|
| Asked for the assignment to be done end to end, against the rubric | Shubham | — |
| Chose the situation: "MS CS/SWE, F-1 OPT, SOC 15-1252" (from three options the AI offered; the AI had recommended a data-science variant) | **Shubham** | AI recommendation **rejected** in favour of my real situation |
| Chose the GitHub handle and the GitHub plan (local commits; I fork and push; I open the PR) | **Shubham** | — |
| Read SNICKERDOODLE/DOMAIN/CONTRIBUTING/DATA_CONTRACT, the style recipes, the scorer, CI, and the data | Claude | — |
| Narrowed the situation to *unemployed* OPT year 1, where the 90-day ceiling binds first, and created the fictional persona Neel Kapoor | Claude | Shubham to confirm this matches the situation he meant |
| Wrote CHANGE-BRIEF, prototype, tests, fixtures, recipe, card, and all submission docs | Claude | Shubham to review (see bottom) |
| Status DRAFT, not RUNNABLE-SAMPLE (four open typed TODOs; constitution requires zero for SPECIFIED) | Claude proposed | Shubham to accept or change |
| Fit ratings and time-to-start assumptions for the fictional persona | Claude authored | fixed in git before the first run (`239ed3e`) |

## Attempts, expectations, what happened, response

| # | Tried | Expected | Happened | Response / learning | Trace |
|---|---|---|---|---|---|
| 1 | `npm install` | install only | it also **rewrote the tracked `package-lock.json`** (−36 lines) | reverted with `git checkout -- package-lock.json`; otherwise it would have shown up in the PR diff | baseline transcript |
| 2 | `node scripts/pii-scan.mjs` on a fresh clone | clean | **1 finding**: an npm maintainer's address inside a deprecation notice in upstream's `package-lock.json` | confirmed it's on clean `origin/main` too, not ours. Deliberately **not quoted** here: quoting it in a doc put it into our branch history and the `--diff` scan flagged *us* (caught on the clean-checkout run; the commit was amended before any push) | TEST-REPORT §PII |
| 3 | `npm run ats:scan -- --dry-run` | a dry run | `Error: portals.yml not found` | copied `portals.example.yml` → `data/ats/portals.yml` (gitignored), as `recipes/scan.md` says; then 885 Databricks jobs, 61 passed the filters | baseline transcript |
| 4 | `npm run ats:liveness -- <url>` | a liveness result | `Executable doesn't exist … chromium_headless_shell-1234` | `node node_modules/playwright/cli.js install chromium`; then a real posting = **active**, a made-up ID = **uncertain** (not expired). That is why our recipe holds "uncertain" | WORKED-RUN §1 |
| 5 | `npm run bls:local-wage` for Boston 15-1252 | Fact 7: missing `.venv` | missing `.venv`, **and** `data/bls/local-wage/` is absent | didn't use local wage; national median only, labeled national | WORKED-RUN §1 |
| 6 | Join Form D samples to the 80 Days CSV | a few matches | **0 matches** (127/200 sample filings are pooled investment funds) | funding made report-only, never a vote; stated in recipe and report | CHANGE-BRIEF "known before" |
| 7 | Ran the real scorer with Aarav Patel's free-text status "work authorized (EAD)" | the persona README says the PR #37 fix exists | **`profile_needs_sponsorship: false`**: the Proven biotech flipped Apply → Skip. The fix isn't in this cut | prototype never passes free text; G4 halts on flag mismatch; mutant fixture + test added | `fixtures/BROKEN-sponsor-flag-scorer.mjs`, `94e3fdf` |
| 8 | First sample run, then read `report.md` line by line | correct | **two defects of ours**: HubSpot routed to "find legal name" despite a closed timeline gate; Vecna's reason text was a false statement | committed the output unedited (`731da4b`), fixed (`04a0437`), re-ran; verdicts unchanged | git diff `731da4b..04a0437` |
| 9 | Ran failure cases with mutated personas outside the repo | logs record the input | the stopped run's log recorded `../../../../private/tmp/…-Users-<name>-…`, a **local home path** about to be committed | `rel()` now records `<outside-repo>/<file>`; re-ran; grep confirms no local paths | `dc342fa` |
| 10 | Mutation-tested our own tests (2 injected bugs) | tests fail | 1 and 2 tests failed respectively; code restored | the suite catches the two behaviours that matter most | WORKED-RUN §5 |
| 11 | Ran CI's `harness-regression` steps locally | pass | 4 of 6 scripts **don't exist on upstream `main`**; the 2 that exist don't print what CI greps for | can't fix inside our namespace; documented in TEST-REPORT and the PR body | TEST-REPORT §CI |
| 12 | Checked upstream Actions via the public API | runs | other students' PR workflows show `action_required` (maintainer must approve fork CI) | our PR's CI will wait for approval too; noted | TEST-REPORT §CI |

## Unresolved questions

- Is 0.3 the right p for "Possible"? It's a placeholder, and it decides whether Vecna lands in Consider (0.255) or Skip.
- Is linear the right shape for the timeline factor inside the buffer? Ch.10 gives three cases, not a curve.
- Should a senior-only sponsor be Likely, or Possible, for a new grad? We chose Likely as the gentler demotion.
- Should the recipe claim RUNNABLE-SAMPLE, with the proposed additions moved out to an issue? We kept DRAFT to stay within the constitution.
- How does a student *get* `time_to_start_days` honestly? Right now it's an assumption with a stated basis.

## Shubham's own entries (to complete before submitting)

<!-- STUDENT: Add your own attempts below in the same style. For example: re-running the commands
     yourself, anything that didn't match, what you changed in the docs, which AI choices you
     accepted or rejected after reading them. Don't backfill struggle that didn't happen. -->

| # | Tried | Expected | Happened | Response | Trace |
|---|---|---|---|---|---|
| S1 | | | | | |
