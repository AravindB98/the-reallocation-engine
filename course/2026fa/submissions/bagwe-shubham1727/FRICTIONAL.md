# FRICTIONAL — honest log

## Executive summary

**What this is.** A record of what was actually tried while building this recipe, what happened, what was checked or changed in response, and who did each part: me (Shubham) or the AI agent I worked with (Claude Code, model Claude Opus 5.5).

**Why read it.** It separates my decisions from the AI's execution and links each claim to a commit or a saved output, so a grader can check it.

**What it shows.** The AI did most of the execution: reading the repo, writing code, tests and drafts, and running everything. I chose the situation, the GitHub handle, and how far to take GitHub. The most useful frictions were engine defects found by running things rather than reading about them, and defects in our own prototype. Two were found by the agent reading the first run's report, one while running the failure cases, and four more by an independent review agent.

---

## Who did what

| Part | Who | Accepted / modified / rejected |
|---|---|---|
| Asked for the assignment to be done end to end, against the rubric | Shubham | — |
| Chose the situation the recipe targets: MS CS/SWE, F-1 OPT, SOC 15-1252 (one of three options the AI offered; the AI had recommended a data-science variant) | **Shubham** | AI recommendation **rejected** |
| Chose the GitHub handle and the GitHub plan (local commits; I fork and push; I open the PR) | **Shubham** | — |
| Read SNICKERDOODLE/DOMAIN/CONTRIBUTING/DATA_CONTRACT, the style recipes, the scorer, CI, and the data | Claude | — |
| Narrowed the situation to *unemployed* OPT year 1, where the 90-day ceiling binds first, and created the fictional persona Neel Kapoor | Claude | Shubham to confirm this matches the situation he meant |
| Wrote CHANGE-BRIEF, prototype, tests, fixtures, recipe, card, and all submission docs | Claude | Shubham to review (see bottom) |
| Status DRAFT, not RUNNABLE-SAMPLE (four open typed TODOs; constitution requires zero for SPECIFIED) | Claude proposed | Shubham to accept or change |
| Fit ratings, time-to-start assumptions and posting snapshots for the fictional persona | Claude authored | values fixed in git before the first run (`239ed3e`). First labeled your-input, which was wrong; relabeled model-judgment after review (`6324c8b`) |
| Independent rubric review of the whole submission | a second Claude agent, fresh context, read-only | 8 must-fix findings checked; all held up and were fixed (row 13) |

## Attempts, expectations, what happened, response

| # | Tried | Expected | Happened | Response / learning | Trace |
|---|---|---|---|---|---|
| 1 | `npm install` | install only | it also **rewrote the tracked `package-lock.json`** (−36 lines) | reverted with `git checkout -- package-lock.json`; otherwise it would have shown up in the PR diff | Claude Code session transcript (not committed) |
| 2 | `node scripts/pii-scan.mjs` on a fresh clone | clean | **1 finding**: an npm maintainer's address inside a deprecation notice in upstream's `package-lock.json` | confirmed it's on clean `origin/main` too, not ours. Deliberately **not quoted** here: quoting it in a doc put it into our branch history and the `--diff` scan flagged *us* (caught on the clean-checkout run; the commit was amended before any push) | TEST-REPORT §PII |
| 3 | `npm run ats:scan -- --dry-run` | a dry run | `Error: portals.yml not found` | copied `portals.example.yml` → `data/ats/portals.yml` (gitignored), as `recipes/scan.md` says; then 885 Databricks jobs, 61 passed the filters | Claude Code session transcript (not committed) |
| 4 | `npm run ats:liveness -- <url>` | a liveness result | `Executable doesn't exist … chromium_headless_shell-1234` | `node node_modules/playwright/cli.js install chromium`; then a real posting = **active**, a made-up ID = **uncertain** (not expired). That is why our recipe holds "uncertain" | WORKED-RUN §1 |
| 5 | `npm run bls:local-wage` for Boston 15-1252 | Fact 7: missing `.venv` | missing `.venv`, **and** `data/bls/local-wage/` is absent | didn't use local wage; national median only, labeled national | WORKED-RUN §1 |
| 6 | Join Form D samples to the 80 Days CSV | a few matches | **0 matches** (128 of 200 sample filings, from 127 companies, are pooled investment funds) | funding made report-only, never a vote; stated in recipe and report | CHANGE-BRIEF "known before" |
| 7 | Ran the real scorer with Aarav Patel's free-text status "work authorized (EAD)" | the persona README says the PR #37 fix exists | **`profile_needs_sponsorship: false`**: the Proven biotech flipped Apply → Skip. The fix isn't in this cut | prototype never passes free text; G4 halts on flag mismatch; mutant fixture + test added | `fixtures/BROKEN-sponsor-flag-scorer.mjs`, `94e3fdf` |
| 8 | First sample run, then the agent read `report.md` line by line | correct | **two defects of ours**: HubSpot routed to "find legal name" despite a closed timeline gate; Vecna's reason text was a false statement | committed the output unedited (`731da4b`), fixed (`04a0437`), re-ran; verdicts unchanged | git diff `731da4b..04a0437` |
| 9 | Ran failure cases with mutated personas outside the repo | logs record the input | the stopped run's log recorded `../../../../private/tmp/…-Users-<name>-…`, a **local home path** about to be committed | `rel()` now records `<outside-repo>/<file>`; re-ran; grep confirms no local paths | `dc342fa` |
| 10 | Mutation-tested our own tests (2 injected bugs) | tests fail | 1 and 2 tests failed respectively; code restored | the suite catches the two behaviours that matter most | WORKED-RUN §5 (the exact `sed` commands are listed there) |
| 11 | Ran CI's `harness-regression` steps locally | pass | 4 of 6 scripts **don't exist on upstream `main`**; the 2 that exist don't print what CI greps for | can't fix inside our namespace; documented in TEST-REPORT and the PR body | TEST-REPORT §CI |
| 12 | Checked upstream Actions via the public API | runs | other students' PR workflows show `action_required` (maintainer must approve fork CI) | our PR's CI will wait for approval too; noted | TEST-REPORT §CI |
| 13 | Asked a fresh-context review agent to grade everything against the rubric | a few nits | **8 must-fix findings**: (a) AI-written fit and lag values labeled as the student's own, plus invented "recruiter said" quotes about real companies; (b) the path leak `dc342fa` claimed fixed still went through the scorer's stdout; (c) wording that could tie a real person's immigration details to a name in a public PR; (d) an unbacked "HubSpot never filed a Form D" claim; (e) commit timestamps seconds apart with no explanation; (f) "by hand" checks that the agent did; (g) 127 vs 128; (h) a no-SWE sponsor scoring the same as a senior-only one | each checked before fixing (the leak reproduced; the count recomputed). All fixed; +2 regression tests; verdicts unchanged | `6324c8b` + the docs commit after it |

## A note on commit timing

The commits on this branch are often seconds apart: `239ed3e` build → run 1 (`generated_at` 22:01:41Z) → `731da4b` → `04a0437`. That's because an AI agent did the writing, running and committing, not because history was rewritten after the fact. The order is real: inputs were committed, then run, then the output was committed unedited, then fixed. "Read line by line" means **the agent** read it. The only history rewrite was amending the then-latest unpushed docs commit to remove a quoted email address (row 2). Nothing was pushed before that.

## Unresolved questions

- Is 0.3 the right p for "Possible"? It's a placeholder, and it decides whether Vecna lands in Consider (0.255) or Skip.
- Is linear the right shape for the timeline factor inside the buffer? Ch.10 gives three cases, not a curve.
- Should a senior-only sponsor be Likely, or Possible, for a new grad? We chose Likely as the gentler demotion. After review, a sponsor with *no* SWE title on record became Possible, so senior-only now sits one step above it.
- Should the recipe claim RUNNABLE-SAMPLE, with the proposed additions moved out to an issue? We kept DRAFT to stay within the constitution.
- How does a student *get* `time_to_start_days` honestly? Right now it's an assumption with a stated basis.

## Shubham's own entries

| # | Tried | Expected | Happened | Response | Trace |
|---|---|---|---|---|---|
| S1 | Before signing, I re-ran four checks myself from the repo root (2026-10-03): the test suite; the sample run with `--as-of 2026-10-02`; the additive-gates break attempt (`--scorer …/BROKEN-additive-gates-scorer.mjs`, out-dir `/tmp/mybreak`); and a `grep` of Cohere Health's row in the source CSV | the numbers the worked run reports | all four matched: `pass 18, fail 0`; 12 evaluated → 8 scored (Apply 2 · Consider 3 · Skip 3), 4 held, hard deadline 2026-11-20; `HALT at G4` naming R02 and R03, `exit=4`; `104.0,2.0,98.1132075471698` | signed the attestation, listing only these four as re-run by me; the other rows stay attributed to the agent | `b748147`; WORKED-RUN § Attestation |
| S2 | Committing the signature after my re-run | only WORKED-RUN.md would change | my sample run had also rewritten `run-log.json`, `role-scores.json` and `role-scores.md`. The agent checked the diff: only timestamps. The scorer stamps UTC, so it read 2026-10-04 while my local date was 2026-10-03 | restored the three files, so the commit holds only the signature. Learned: re-running a committed run dirties its outputs even when nothing real changes; check the diff before committing | `b748147` (one file changed) |
