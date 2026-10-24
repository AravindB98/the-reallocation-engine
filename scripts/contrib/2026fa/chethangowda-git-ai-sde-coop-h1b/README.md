# AI Engineer co-op to H-1B triage: prototype

## Executive summary

**What this is.** A small script that checks a list of AI Engineer roles against real visa-sponsorship records. It stops any role whose company or posting facts are missing, then hands the rest to the project's existing scoring tool under two start-date plans: a Spring co-op path and a no-co-op path.

**Why read it.** It shows the one command to run, what the script reads and writes, and where it refuses to guess.

**What it decides.** It decides nothing final. It writes an Apply / Consider / Skip suggestion for each role and plan, with every value tagged as a record, the author's input, or a model judgment. A person makes the call. It cannot check whether a co-op turns into a full-time offer, because no data for that exists here.

## Run

From the repo root:

```bash
node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs
```

Test (offline, fixtures only, writes to a temp dir):

```bash
node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs
```

Options: `--candidates <json>` (default `fixtures/candidates.sample.json`), `--csv <csv>` (default the 80 Days CSV), `--out <dir>` (default `out/` in this folder).

## What it reads and writes

| | Path | Label |
|---|---|---|
| reads | `fixtures/candidates.sample.json`: hypothetical roles, start windows, liveness, persona adjustment | your-input (SOC per role: model-judgment) |
| reads | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`: only `company_name`, `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored` | record |
| runs | `scripts/score/role-scorer.mjs` (CLI, unmodified), once per scenario, with `--out-dir out/<scenario>` | — |
| writes | `out/triage-log.json` (agent), `out/triage-report.md` (human), `out/<scenario>/roles.json`, `out/<scenario>/role-scores.{json,md}` | — |

## Stops (no value invented)

| Reason code | When |
|---|---|
| `no-company-match` | exact company name not in the CSV |
| `ambiguous-match` | more than one CSV row with that exact name |
| `no-sponsorship-record` | row exists but `Total Approvals` is blank (not read as 0) |
| `missing-gate-value: liveness` | no liveness factor (the scorer would default it to 1, i.e. open) |
| `missing-gate-value: timeline` | no start window (the scorer would default it to 1) |

Fixtures: `fixtures/sponsorship.fixture.csv` + `fixtures/candidates.fixture.json` (all fictional) drive the test. `fixtures/BROKEN-missing-gate-sent-to-scorer.json` shows the unmodified scorer scoring a role with no gates as Apply.
