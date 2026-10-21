---
status: RUNNABLE-SAMPLE   # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED
todos_open: 4             # all four are Proposed additions outside the sample run (see section below); none is needed for the run that was done
last_gate: "sample-run, 2026-10-21, logs/RUN_LOG.md#2026-10-21-ms-is-swe-opt-shortlist-mode-build-sample-run (audits generated; the student reopened the Apply and bridge postings the same day and confirmed them live)"
attestation: null         # attestation is in the worked run, not a VERIFIED-stage record
recipe_version: 0.2.0
---

# ms-is-swe-opt-shortlist — sponsor shortlist with an OPT countdown

## Executive summary

**What it is.** A procedure for an international master's student in Information Systems, graduating December 2026 and looking for entry-level software engineer jobs on F-1 OPT. You give it a short list of companies (and, for any posting you have checked, whether it is live). It looks each company up in the repository's sponsorship data, runs your OPT dates through a countdown, and returns Apply, Consider or Skip for each, plus a list of strong sponsors you should approach through people instead of through an application.

**Why it exists.** From outside, you cannot tell which companies have actually sponsored software roles, or whether your clock leaves enough time to wait for a slow hiring process. A chatbot will answer both confidently without a record behind it.

**What it decides and what it doesn't.** It ranks effort. It does not decide to apply; a person confirms each posting is live and signs the gate. It cannot tell whether a company sponsors **entry-level** roles, and its funding data ends in September 2025.

Two customers: this file is for the agent; `recipes/cases/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist.card.md` is for the student.

**Handoff condition (done when):** `shortlist-log.json` and `shortlist-report.md` exist in the out-dir; every input row has exactly one status; every scored row has a composite and a printed arithmetic trace from the existing scorer; every unscored row carries a reason; `human_gate.cleared` is `false` until a named human changes it.

## Purpose and when to use

Use this mode when you are an international MS student on (or about to start) F-1 OPT, you have a list of companies and postings for entry-level software engineer roles (SOC 15-1252), and you must decide where to spend limited application hours before your unemployment allowance runs out. Do not use it for a role family other than 15-1252, for a company you have not named, or to decide whether to accept an offer. It ranks effort; it does not predict outcomes.

## Source inventory

| Input | Path / command | Label |
|---|---|---|
| Sponsorship history, funding date/stage | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (columns `Total Approvals`, `Approval_Rate`, `top_job_titles_sponsored`, `latest_funding_date`, `latest_funding_stage`) | record |
| Role quality for the SOC | `data/bls/compact/soc_occupation_compact.csv`, row `bls_soc_code = 15-1252` | record, informational only |
| Combiner | `scripts/score/role-scorer.mjs` via `npm run score` (called by the prototype; not copied) | engine |
| Posting liveness | `npm run ats:liveness -- <url>`, run by the human; result typed into the postings file with a date | your-input (transcribed) |
| OPT dates, unemployment window, hiring lag, fit | command-line flags | your-input |
| Prototype | `node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs --postings <file> --as-of <date> --opt-start <date> --out-dir <dir>` | script |
| Tests | `node --test scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.test.mjs` | script |

Which data ran: the **full** 80 Days CSV that ships in the repo (30,369 rows; newest `latest_funding_date` 2025-09-26). No SEC Form D file was read; see the proposed additions.

## Proposed additions

1. `[TODO: DEV]` A funding term in the scorer. `role-scorer.mjs` has only sponsorship, fit and role-quality votes, so funding recency is displayed in the report and changes no decision. Belongs because the assignment treats funding as a vote.
2. `[TODO: DATA SOURCE]` A Form D cross-check. Only `data/sec/form-d/processed/sample/*.sample.json` (first 50 companies per quarter) ship, so a join would test almost nothing. A full quarter file would let the CSV's funding date be confirmed against the filing.
3. `[TODO: DEV]` Call the liveness checker from the prototype. Today the human runs `npm run ats:liveness` and types the result, so the program cannot vouch for it. Requires a Playwright browser and network, which the offline test suite deliberately avoids.

4. `[TODO: DATA SOURCE]` Department of Labor LCA / H-1B disclosure records for employers absent from the 80 Days CSV. The CSV is built from startup funding filings, so large or public employers (found in the worked run: Intuit) have no row, and "not-in-csv" says nothing about whether they sponsor. The full DOL file is not in the repo.
5. Not a TODO, a stated limit: no data in the repo can read a posting's **eligibility text** (for example "U.S. citizenship required"). The prototype accepts a human-supplied `excluded_reason` instead; see gate G2b.

Role quality (engine fact 1): the scorer's `role_quality` weight is 0 and `bls:local-wage` feeds no decision (fact 2). This recipe shows the national median wage and cognitive pivot score for 15-1252 in the report as context only and does not put them in `roles.json`. It proposes no weight.

## Phase gates

Each gate stops the row at the first failure. A person clears gates; the program only reports.

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G0 inputs | CSV has the six required columns; SOC row exists in the compact file; dates parse as `YYYY-MM-DD`; `--fit` in [0,1]; out-dir is not under `data/`, `recipes/`, `logs/`, `chapters/`, `book/`, `reports/` or `scripts/` (except `scripts/contrib/`) | continue | exit code 2 with the reason; no output written |
| G1 company match | exact match after upper-casing and removing `.` and `,` | one row | none → `not-in-csv`; several → `ambiguous`; neither is scored |
| G2b eligibility (human) | a person reads the posting text; if it rules the student out (citizenship required, security clearance, location) they set `excluded_reason` on that posting | no `excluded_reason`: continue | non-empty `excluded_reason` → `excluded`, never scored, shown as a labeled `your-input` Skip. A blank reason excludes nothing |
| G2c track | `track` is absent or `"sponsorship"` (default: scored on sponsorship history) or `"opt-bridge"` (a role you would take on OPT without sponsorship, e.g. a contract role); any other value is rejected | continue on that track | unknown value → `invalid-posting`, never silently scored |
| G2d bridge checks | `opt-bridge` rows use only G2 (liveness) and G3 (timeline); no sponsorship vote, and the scorer is not called | live and timeline factor > 0 → `opt-bridge-open` | not live or timeline factor 0 → `opt-bridge-closed` (Skip); undated or uncertain liveness → `liveness-unresolved`; no URL → `opt-bridge-no-posting` |
| G2 liveness (gate) | posting has a URL and a `liveness` object with `status` of `live` or `dead` **and** a `checked_on` date | factor 1 or 0 | no URL → `no-posting`; anything else → `liveness-unresolved`; never defaulted to live |
| G3 timeline (gate) | `slack = (opt_start + unemployment_days) − as_of − hiring_lag`; factor 0 if slack ≤ 0, 1 if slack ≥ lag, else slack/lag | factor passed to scorer | window already past or lag does not fit → factor 0, scorer returns Skip (gated) |
| G4 human | a named person opens each Apply/Consider posting and confirms it is live | `human_gate` edited by that person in a run log | stays `cleared: false` |

Skip is a success. The scorer prints a skip rate; a healthy run skips at least half of what it scored.

## What it can and can't verify

This is the boundary the grade rests on.

| Can verify (record) | Cannot verify |
|---|---|
| A company's row exists in the CSV, with its approval count, approval rate, top sponsored titles, latest funding date and stage, exactly as shipped (CSV sha256 is logged) | That a company **currently** sponsors, or sponsors **entry-level** roles. The CSV lists top titles, not levels |
| The date arithmetic of the countdown, given the dates you typed | Your real OPT dates, the true length of your unemployment allowance, or H-1B cap-season timing. These are your-input and not modelled |
| That the scorer was run on the exact `roles.json` written beside the log | That a posting is live. A human ran the checker and typed the result |
| That a name was matched exactly, not fuzzily | That the matched legal entity is the employer you mean. A staffing agency's row (or absence) says nothing about its unnamed client |
| That a company is **absent** from the CSV | That absence means "does not sponsor". The data covers funded startups; large employers are often missing |
| That an `opt-bridge` posting is live (as typed) and that your timeline has room | That the role is a contract, is in your field, is allowed on your OPT, or meets the employer's own requirements. The program does not check any of those; a person confirms with the school's international office and the employer. The scorer's sponsorship weight is not rescaled for a no-sponsorship profile (its maximum score would be 0.30 × fit), which is why this track bypasses the scorer instead of reusing it |
| That a posting's liveness was typed with a date | Whether a posting is open to you: citizenship, clearance and location text is read only by a human |
| The national median wage and pivot score for SOC 15-1252 | Entry-level pay, local pay, or what any employer offers |

The sponsorship probability is **not** a record. Tier thresholds (≥10 approvals plus a non-senior software title = Proven) and the tier-to-probability map (0.9 / 0.6 / 0.3 / 0) are the student's own choices, justified only by being simple and printed. The scorer is told the source is `record` because the counts come from a record; that label should not be read as "the probability is a measurement".

Engine facts (DOMAIN.md, task brief): fact 1 and 2 handled as above; fact 3 — only Form D samples ship, so no Form D file is used; fact 4 — gates point only at paths that exist (`course/2026fa/submissions/Vrajesh-works/`); fact 5 — the `snickerdoodle` CLI is not used; fact 6 — this recipe is DRAFT; fact 7 — `npm run bls:local-wage` was not run (it needs a missing `.venv`); fact 8 — `validate-h1b-join-sample.py` was not run.

## Workflow

1. Write a postings file: a JSON array of `{company, title, url, liveness, excluded_reason?}`; leave `url` as `null` if you have no posting, and `liveness` as `null` until you have run the checker. Read each posting; add `excluded_reason` if its text rules you out. Strip tracking parameters (`jr_id`, `cid`) from stored URLs.
2. For each URL, run `npm run ats:liveness -- <url>` and, if it says active or expired, copy `status` (`live`/`dead`) and the date into `liveness`. Anything ambiguous: leave `null`.
3. Run the prototype:

```bash
node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
  --postings course/2026fa/submissions/Vrajesh-works/mode-build/postings-2026-10-21.json \
  --as-of 2026-10-21 --opt-start 2027-01-15 --out-dir course/2026fa/submissions/Vrajesh-works/mode-build/runs
```

4. Read `shortlist-report.md` row by row. Stop at G4.

## Output contract

- **For the agent:** `<out-dir>/shortlist-log.json` — `inputs` (dates, flags, CSV path, CSV sha256, snapshot end date), `labels`, `timeline`, `counts`, `scorer_summary`, `human_gate`, and `results[]` with `status`, `tier`, `evidence` (raw record values), `composite`, `recommendation`, `reason`, `trace`, `next_action`. Also `roles.json` and the scorer's own `role-scores.json` / `role-scores.md`.
- **For the person:** `<out-dir>/shortlist-report.md` — plain-language summary first, then a table, a verified-vs-inferred table, and the human gate status.
- Never written into a tracked repo file.

## Stop conditions and next action

The mode **refuses to produce a score** (no number, no Apply/Consider/Skip) in each of these cases, rather than guess:

- the company is not found by exact name, or matches more than one row (`not-in-csv`, `ambiguous`);
- a posting's liveness is missing, undated, or anything other than `live`/`dead` (`liveness-unresolved`);
- a human has set `excluded_reason` (`excluded`);
- the posting has no URL (`no-posting`);
- an input date is not a real calendar date, `--fit` is outside [0,1], `track` is unknown, or the out-dir is a tracked repo folder (exit code 2, nothing written);
- the CSV is missing a required column.

Funding recency, sponsorship of entry-level roles, and current-year sponsorship stance are never scored, because no record in the repo establishes them.

| Result | Next action (3-3-2 day) |
|---|---|
| Apply | Tailor an application — spends the 2 hours |
| Consider | Tailor only if Apply is exhausted; the soft spot is printed |
| `opt-bridge-open` | Candidate for a job you can start soon without sponsorship. A person confirms the role is in your field and allowed on your OPT, then tailors an application |
| `opt-bridge-closed` | Skip (posting not live, or the timeline gate is closed) |
| Skip, posting dead, tier Proven/Likely | Network, don't apply — feeds the networking 3 |
| `no-posting`, tier Proven/Likely | Network target |
| `liveness-unresolved` | Run the liveness checker, retype, re-run |
| `not-in-csv` / `ambiguous` | Check the legal name by hand; do not assume sponsorship |
| exit code 2 | Fix the named input; nothing was written |

## Run-log template (`logs/runs/`)

```markdown
## YYYY-MM-DD — ms-is-swe-opt-shortlist run N  (append to `logs/RUN_LOG.md`)

- **Recipe:** ms-is-swe-opt-shortlist v0.1.0
- **Inputs:** postings file, --as-of, --opt-start, CSV sha256
- **Outputs:** shortlist-log.json, shortlist-report.md
- **Result:** counts (scored / unscored), skip rate
- **Gate:** G4 cleared by <name> on <date> — or "not cleared"
- **Open issues:** ...
```
