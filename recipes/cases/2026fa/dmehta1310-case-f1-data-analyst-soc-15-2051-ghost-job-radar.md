---
status: RUNNABLE-SAMPLE
todos_open: 5
last_gate: "sample-run, 2026-10-19, logs/runs/2026fa-dmehta1310-2.md"
attestation: null
recipe_version: 0.2.0
---

# ghost-job-radar -- Liveness-Gated Trust Check for a Data Analyst Search

## Executive summary

**What this is.** A step-by-step mode, with scripts, for an international
master's student on F-1 who is looking for data analyst jobs. Before the
student spends research time on a posting, it makes three checks. Two can end
the check immediately: is the posting still open, and is there enough time
left on the student's work authorization for a hire to finish? Only if both
answers are yes does the third run: the company's history of visa sponsorship
and funding, which is passed to the repository's existing scorer as a vote,
not a gate.

**Why read it.** Job boards keep showing postings that were filled weeks ago.
A student on a short clock cannot afford to find that out after tailoring an
application. This recipe makes the cheap checks first and says plainly what
it cannot know.

**What it found.** A real run on 2026-10-19 against one public posting
(Stripe, "Data Analyst, NYC", 80 Days to Stay data) went through every step.
The open posting passed both gates and the scorer put it in its top bucket.
A made-up job number on the same company's board was stopped at the first
gate. The run also exposed two weak spots in the liveness tool: it reported a
removed job as "uncertain" rather than "removed", and it has no way to say
"I do not support this site". Both are listed below as work still to do. The
recipe is honestly rated sample-run level: one company, one day, with a
person carrying one result between steps by hand.

## Purpose

Check a specific job posting for a specific person before they spend
research hours on it. It answers one question first -- is this posting still
real -- and then whether enough time remains for a hire to complete. These
two are gates. Only after both pass does it compute the third check,
company-level sponsorship history and funding signals, as votes. Built for an
F-1 international MS student targeting data analyst roles (BLS SOC 15-2051),
whose offer has to start inside the CPT/OPT window, for whom an hour spent on
a posting that has quietly been filled is an hour lost. Use it on one posting
at a time, before tailoring any application.

## Source Inventory

| Source Node | Node Type | Exact path or command | Human Check |
|---|---|---|---|
| Posting discovery | Script | `node scripts/ats/scan.mjs --dry-run`, run from a scratch directory with `REALLOCATION_ENGINE_PORTALS=<public portals file>` | The default portals file and the scan's history files live under `data/ats/`, which is private; running from an empty scratch directory with a public portals file means none of it is read. Dry-run writes nothing. Evidence: `assignments/submissions/dmehta1310/evidence/2026-10-19/03-portals-public.yml` and `03-ats-scan-dry-run.txt`. |
| Liveness | Script | `npm run ats:liveness -- <url>` (`scripts/ats/check-liveness.mjs`; needs Playwright Chromium: `npx playwright install chromium`) | Exit 0 = active; exit 1 = expired or uncertain. Treat anything but `active` as STOP. |
| Liveness cross-check | Public API | `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>` (HTTP status) | Used by hand in the 2026-10-19 run: 200 for the open posting, 404 for the made-up id. Not yet scripted (see Proposed additions). |
| Sponsorship + funding | Data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Company name must match the `company_name` column exactly; no fuzzy matching. Absence is "no record in sample", never "no". |
| Role quality reference | Data | `data/bls/compact/soc_occupation_compact.csv` (15-2051.00 Data Scientists, 15-2051.01 Business Intelligence Analysts; "Data Analyst" appears as an alternate title) | There is no exact "Data Analyst" occupation title in this file; 15-2051 is the closest match. Read for context only: the scorer does not use it yet. |
| CPT/program-timeline gate | Script | `python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date <YYYY-MM-DD> --lag-weeks <n>` | Both inputs are the student's own; the script checks arithmetic only. Tests: `test_timeline_gate.py` (6 pass). |
| Role builder | Script | `python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company "<name as in CSV>" --title <t> --role-id <id> --liveness-result <live\|dead\|unknown> --timeline-result <pass\|fail> --out <roles.json>` | Liveness result is typed in by hand from the liveness run. Tests: `test_build_roles_json.py` (10 pass). |
| Existing scorer | Script | `npm run score -- <roles.json> --out-dir <dir> --md <report.md>` (`scripts/score/role-scorer.mjs`, unmodified) | Weights: sponsorship 0.35, fit 0.3, role_quality 0 (unpinned upstream). Threshold 0.3. |

## Proposed additions

Each item is not built; any output described here is *proposed*, never shown as if it ran.

1. [TODO: DEV] **Removed-vs-live check using the Greenhouse API status.** Why: on 2026-10-19 `npm run ats:liveness` returned `uncertain` ("content present but no visible apply control found") for a made-up job id on a Greenhouse board, while the public API returned HTTP 404 for the same id and 200 for the open posting. A status check would turn a vague `uncertain` into a definite "removed" for Greenhouse boards.
2. [TODO: DEV] **An explicit unsupported-site state.** Why: on 2026-10-19 the liveness tool ran a generic page check on `https://example.com/careers/data-analyst` and reported `expired` ("HTTP 404"). The tool's only built-in refusals are a bad protocol or a blocked host, so a site it does not understand can be mislabeled as a verdict instead of "not supported".
3. [TODO: DEV] **Wire SOC 15-2051 into `role_quality`.** Why: the scorer's `role_quality` weight is 0.0 and it accepts no occupation code, so the role-quality layer contributes nothing today. This needs a decision by the maintainer who owns `scripts/score/`, because that directory is outside a student namespace.
4. [TODO: DEV] **One command that chains every step** (liveness, timeline, roles file, scorer, report). Why: today a person carries the liveness result into `build_roles_json.py` and maps `uncertain` to `unknown` by hand; a chain would remove that hand-off.
5. [TODO: APPROVE] **A named human clears both gates on a real posting and the decision is logged.** Why: moving from sample to live status requires logged gate decisions; none exist yet.

## Phase Gates

1. **Liveness gate (hard stop, not a vote).** Test: `npm run ats:liveness -- <url>` exits 0 and prints `active`. Mapping: `active` = continue; `uncertain` or `expired` = STOP, recorded as liveness `unknown` (factor 0.0) in `roles.json`, and no scorer bucket is produced in normal use. A liveness result is never inferred or typed in without the command having run.
2. **CPT/program-timeline gate (hard stop, not a vote).** Test: `timeline_gate.py` prints `"result": "pass"`. `fail` = STOP. Human check: the student states where the hiring-lag estimate came from; the script cannot judge it.
3. **Data-shape gate.** Test: `python3 -m json.tool <roles.json>` succeeds before the scorer runs.
4. **Script-readiness gate.** Test: `test -f scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py && test -f scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py`.
5. **Report gate.** Both an agent file (JSON) and a human file (Markdown) exist before the run counts as complete.

Gates multiply the score to zero; they are never averaged against votes. A
closed gate is a successful outcome (skip), not an error.

## What it can and cannot verify

**Can verify (shown by the 2026-10-19 run):**

- that a specific posting URL returned `active` from a real browser check at a stated time;
- that a made-up job id on the same board does not come back `active`;
- that a company appears (or does not) in the 80 Days sample, and what approvals, denials, funding stage and date the row records;
- that a hiring-lag estimate is arithmetically compatible with a stated end date;
- that the scorer's output traces term by term to labeled sources.

**Cannot verify:**

- whether a removed Greenhouse job is *definitely* removed: the liveness tool says `uncertain`, not "removed" (the API status check is proposed, not built);
- whether a site the tool does not understand is supported: it applies a generic check and may return `expired`;
- whether the company will sponsor *this role, this year*: the sample records company-level historical H-1B approvals, not role-level or current-year intent;
- how long this company's hiring will take: the lag is the student's estimate;
- anything about role quality in the score: `role_quality` carries weight 0.0 today;
- whether the `fit` value means anything: 0.7 is a default labeled model-judgment, not a measurement;
- whether anyone will respond to an application.

## Inputs

| Input | Type | Source | Required? |
|---|---|---|---|
| Job posting URL | String | Student-provided or a public-board scan | Yes |
| Company name | String | Must equal `company_name` in the CSV | Yes |
| CPT / program end date | Date | Student input (your-input) | Yes |
| Hiring-lag estimate (weeks) | Integer | Student input (your-input) | Yes |
| Fit | Number 0-1 | Default 0.7, labeled model-judgment | No |

## Steps

1. **Discover** (optional): `node scripts/ats/scan.mjs --dry-run` from a scratch directory with a public portals file. Output: candidate postings in the terminal.
2. **Liveness gate**: `npm run ats:liveness -- <url>`. STOP unless `active`.
3. **Timeline gate**: `timeline_gate.py`. STOP unless `pass`.
4. **Look up company**: `build_roles_json.py` writes a labeled `roles.json` (record / model-judgment / your-input).
5. **Score**: `npm run score -- <roles.json> --out-dir <dir> --md <report.md>` (unmodified).
6. **Verify one row by hand** against the CSV (`grep -c '^<COMPANY>,'` plus the columns used).
7. **Log**: per-run log in `logs/runs/`, never in `logs/RUN_LOG.md` (CONTRIBUTING).

## Output Contract

**Agent output (JSON):** `roles.json` (one object per role: `role_id`, `company`, `title`, `sponsorship`, `fit`, `liveness`, `timeline`, `funding_context`, `company_found_in_sample`; each value carries a `source` of record, model-judgment or your-input) and `role-scores.json` from the scorer.

**Human report (Markdown):** the scorer's `role-scores.md` table with columns Role, Composite, scorer bucket, Why, Audit. The scorer's Apply / Consider / Skip is shown as a **scorer bucket** -- the output of a formula with an unpinned weight -- and is never written as advice about whether to apply. The report opens with a plain-language summary of what was checked, which gates closed, and what is unverified.

## Stop Conditions

Refuse to produce a scorer bucket (say "not run" and log why) when:

- liveness is anything other than `active` (`uncertain` or `expired` = STOP, recorded as liveness `unknown`, factor 0.0, in `roles.json`);
- the timeline gate is `fail`, or its inputs are missing;
- the company name does not match the CSV exactly (report "no record in sample", do not guess a near match);
- the roles file does not parse;
- a liveness result would have to be typed in without the command having run.

## Log Template

Copy into `logs/runs/<term>-<handle>-<n>.md`; the same shape works as a `RUN_LOG` entry in the submission zip.

```
### <YYYY-MM-DD> -- ghost-job-radar v<version> (<status>)
Mode: ghost-job-radar | Inputs: <posting URL, company as in CSV, end date + lag (label fictional or real)>
Commands: <each, verbatim, with exit code>
Outputs: <files written, evidence folder>
Gates: liveness <active|uncertain|expired>; timeline <pass|fail>
Result: <scorer bucket and composite, or "stopped at <gate>">
Verified vs inferred: <one line each>
Open issues: <what the run could not establish>
```
