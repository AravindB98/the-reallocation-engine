---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-run, 2026-10-21, assignments/submissions/tisaac/RUN_LOG-entry.md"
attestation: null
recipe_version: 0.2.0
---

# case-swe-stem-opt-runway — Which real job posts are worth applying to?

## Executive summary

**What this is.** Step-by-step instructions, plus the code they run, for one kind of job seeker: an F-1 Information Systems student starting a 3-year STEM OPT and looking for software jobs. You name a few companies. The mode:

1. downloads every open job those companies post on Greenhouse;
2. keeps the software jobs that fit your written rules, and writes down why it dropped each of the others;
3. checks two things for each kept job, from records rather than guesses: has this company sponsored H-1B visas, and is this job really still open?
4. hands the results to the repo's scorer, which says **Apply**, **Consider**, or **Skip**.

When the records disagree or say nothing, the mode doesn't guess. It holds the job and asks you.

**Why read it.** It tells you which commands to run and what each number in the result is based on. It also tells you when the mode will refuse to score a job.

**What it found on real data (2026-10-21).** Four runs, on up to six companies, each turned up a problem that the earlier offline design couldn't show:

- A Boston company with 150 visa approvals was skipped, because the job says "Toast" and the visa file says "TOAST INC".
- One company hides its application form inside an embedded frame, so all its jobs looked "uncertain".
- A job closed in the 16 minutes between two steps.
- One company lists only "Hybrid" or "In-Office" as the location, so its jobs couldn't be placed until the mode read each job's office list.

On the final run it checked 1,653 jobs at six companies and scored the 66 in scope (plus one deliberately dead link): 28 Apply, 4 Consider, 35 Skip, none held. More than half were skipped, but mostly because one company is missing from the visa file, not because it was shown not to sponsor. And without reading job descriptions, the mode can tell companies apart, but not jobs.

## At a glance

| | |
|---|---|
| Mode file | `recipes/case-swe-stem-opt-runway.md`, version 0.2.0 |
| Stage | **RUNNABLE-SAMPLE**: it ran end to end on real job posts, the format checks and offline tests pass, and a person read the results. It is not RUNNABLE-LIVE yet, because not every check a person must make (below) was made for every job |
| Builds on | my earlier recipe-design assignment (https://github.com/nikbearbrown/the-reallocation-engine/pull/46, offline only, not merged). Its code was copied into `scripts/contrib/2026fa/tisaac-swe-stem-opt/` and extended |
| Engine layers | 80 Days to Stay (visa and funding history) · Job-Ops (job boards, is the job open) |
| Internet use | only the two download steps, and only `boards-api.greenhouse.io` and the job pages themselves |

## Purpose

**Use it when** you have a few companies in mind that hire through Greenhouse, and you want to know which of their software jobs deserve a tailored application this week.

**It saves you two lookups:** finding the company's visa history, and checking that the job is still open.

**It does not** read the job description, judge whether you fit the job, or score salary, location preference, or remote work.

**For this student,** 3 years of OPT means a company doesn't have to sponsor right away. So visa history is a plus, not a requirement, and a company missing from the visa file means "not found", never "doesn't sponsor".

## Source inventory

**Words used below.** *Board*: a company's public list of open jobs on Greenhouse. *Snapshot*: a saved copy of a board at the moment it was downloaded. *Gate*: a hard stop; if it fails, the job is skipped no matter how good it looks. *Held*: the mode refused to score the job and is waiting for a person.

| What | Path or command | What it's used for | How its values are labeled |
|---|---|---|---|
| Visa and funding file (repo) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | has the company sponsored H-1B (`Total Approvals`) or raised money (`total_funding`)? | `record`; `your-input` when the company isn't in it |
| Greenhouse board reader (repo) | `scripts/ats/providers/greenhouse.mjs`, `scripts/ats/providers/_http.mjs` | which jobs a company has open | `record` |
| Job-page checker (repo) | `scripts/ats/liveness-browser.mjs`, the same check as `npm run ats:liveness -- <url>` | does the job page look open? | `record` |
| Scorer (repo, not changed) | `scripts/score/role-scorer.mjs`, the same as `npm run score` | turns the evidence into Apply / Consider / Skip | — |
| Your rules | `scripts/contrib/2026fa/tisaac-swe-stem-opt/scope.json` | which companies, which titles and levels, US only; your own name matches and checks | `your-input` |
| Step 1: pick jobs | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs [--scope <file>] [--from-snapshot <folder>] [--out-dir <folder>] [--date YYYY-MM-DD]` | downloads the boards, applies your rules, writes the job list and an audit | — |
| Step 2: check jobs are open | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs <jobs.json> --out <liveness.json>` | three checks per job (below) | — |
| Step 3: score and report | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js --fixture <jobs.json> --liveness <liveness.json> --out-dir <folder>` | visa lookup, gates, scorer, reports | — |
| Final run's saved data | `scripts/contrib/2026fa/tisaac-swe-stem-opt/final/`: `postings-2026-10-21/` (snapshot of each board + `scope.used.json`, the exact rules used), `postings-2026-10-21-audit.md`, `jobs-2026-10-21.json`, `liveness-2026-10-21.json` | lets anyone re-check or re-run the final run | `record` |
| Offline tests | `node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.test.mjs` (20 checks) · `node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.test.mjs` (32 checks) | prove the code follows its rules, with no internet, on made-up records built for each case (`test-fixtures/jobs.fixture.json`, and a fake board built inside the test) | — |

**How to run it** (from the repo root):

```bash
npx playwright install chromium          # once: the browser the job-page checker uses
P=scripts/contrib/2026fa/tisaac-swe-stem-opt
node $P/select-postings.mjs --out-dir $P/final                                          # Step 1 (internet)
node $P/collect-liveness.mjs --jobs $P/final/jobs-2026-10-21.json --out $P/final/liveness-2026-10-21.json   # Step 2 (internet)
node $P/index.js --fixture $P/final/jobs-2026-10-21.json --liveness $P/final/liveness-2026-10-21.json \
  --out-dir assignments/submissions/tisaac/run-4-final                                   # Step 3 (offline)
```

After you change `scope.json` (a name match, or a check you made), re-run Step 1 with `--from-snapshot $P/final/postings-2026-10-21 --scope $P/scope.json` and then Step 3. Nothing is downloaded again.

**A result is only true as of the moment Step 2 ran** (`checked_at` in the liveness file). Before you apply, run Steps 2 and 3 again.

## Inputs (per job)

| Field | What it is | Label |
|---|---|---|
| `company`, `title`, `location`, `url`, `greenhouse_board`, `greenhouse_job_id` | copied from the company's Greenhouse board | `record` |
| `offices` | the job's office cities from Greenhouse, kept when `location` says only "Hybrid" or "Remote" | `record` |
| `location_unclear` | set when neither `location` nor `offices` names a place | rule applied to a record |
| `csv_name` | the company's legal name in the visa file, matched **by you** | `your-input` |
| `liveness_checked_by_hand`, `location_checked_by_hand` | your answer for a held job: `{result or in_us, date, by}` | `your-input` |
| `fit` | how well you match the job, 0–1. In these runs: 0.5, meaning "job description not read yet" | `your-input` |
| `timeline` | can hiring finish inside your OPT window, 0–1 | `your-input` |

## Phase gates

A job reaches an application only after every gate below is passed.

| Gate | What stops the job | How to test it | Who decides |
|---|---|---|---|
| **G1 Is it open?** | Checked in this order:<br>1. Not on the company's board → **Skip**, whatever the page looks like.<br>2. On the board, and the page shows an apply button → open.<br>3. On the board, and the page holds the Greenhouse application form in a frame → open.<br>4. Otherwise your recorded check decides (open or closed).<br>5. Otherwise → **held** | G1 command below exits 0 | machine; you decide held jobs |
| **G1b Where is it?** | `location` says only "Hybrid", "Remote", "In-Office", or "Distributed":<br>1. The job's Greenhouse offices include a US city → in the US.<br>2. Every office is abroad → dropped.<br>3. No offices → **held** until you record `in_us`.<br>A job that is already closed is just skipped | `mode-run.json` has no held job of `kind: "location"`, or you have answered each one | you |
| **G2 Visa timeline** | `timeline` is your own number; 0 stops the job | G2 command below exits 0, and you have compared your OPT dates with the start date | you |
| **G3 Company name** | A company marked "not found" must be looked up by hand before its 0 is trusted. A match you find goes into `csv_name` | `mode-run.json` → `no_matched` is empty, or each name has a written decision | you |
| **G4 Sponsorship ban** | The job description says "US citizens only", "no sponsorship", or needs a security clearance → Skip | you have read the job description | you |
| **G5 Excluded titles** | Data-science or machine-learning specialist roles → Skip | you have read the title | you |

```bash
# G1: every job with a closed gate was skipped, and no held job was scored
node -e "const d='assignments/submissions/tisaac/run-4-final/'; const s=require('./'+d+'role-scores.json').roles, run=require('./'+d+'mode-run.json'); for (const x of s) { const g=x.trace.gates.find(g=>g.factor==='liveness'); if (g.multiplier<=0.05 && x.recommendation!=='Skip') { console.error('G1 FAIL', x.role_id); process.exit(1) } } for (const h of run.held) if (s.some(x=>x.role_id===h.role_id)) { console.error('G1 FAIL held but scored', h.role_id); process.exit(1) } console.log('G1 ok')"

# G2: every scored job has a timeline number that you supplied
node -e "const r=require('./assignments/submissions/tisaac/run-4-final/my-roles.json'); if (r.some(x=>typeof x.timeline.factor!=='number' || x.timeline.source!=='your-input')) { console.error('G2 FAIL'); process.exit(1) } console.log('G2 ok')"
```

## How the score is made

The repo's scorer adds two **votes**, then multiplies by the two **gates**:

`score = (sponsorship × 0.35 + fit × 0.3) × open × timeline`. A score of 0.30 or more is Apply; 0.20–0.30 is Consider; below that is Skip.

| Vote | How this mode sets it | Label |
|---|---|---|
| Sponsorship | the company has H-1B approvals → 0.8 · only fundraising → 0.4 · in the file with neither → 0 | `record` (the row was found by your `csv_name` or by the posted name, noted in `matched_on`) |
| | not in the file → 0, marked `no-matched` | `your-input` (your rule: missing is not a minus) |
| Fit | copied from your job list | `your-input` |
| Role quality | not produced (the scorer's weight for it is 0) | — |

## What it can and cannot verify

| It can check (from a record) | It cannot check |
|---|---|
| Whether the job is on the company's Greenhouse board when Step 2 runs | Whether it is still open later. On the final day, a GitLab job was on the board at 19:16 and gone at 19:32 |
| Whether the job page shows an apply button, **but** a closed job that redirects to a search page looks open. So the board list wins | Jobs on a company's **other** Greenhouse boards. The mode reads only the boards in your rules. A job added by hand from another board would look closed |
| Whether the page holds the Greenhouse application form inside a frame. The page checker can't see inside frames, and Datadog's pages work this way | Jobs that are internal only, or posted on other systems (Lever, Workday, company-built sites). Google, Nike, and Tesla have no Greenhouse board under their names |
| Where a "Hybrid" or "Remote" job is, from its Greenhouse office list | Where it is when there is no office list. Then a person decides |
| Whether a name appears in the visa file, exactly | Whether "Toast" in a job post is "TOAST INC" in the file. That is your call, and the file can mislead: its website for TOAST INC, `toast.com`, now belongs to another company |
| That company's visa approvals and funding | Visa history for big public companies. The file is built from SEC fundraising filings: Google and Nike are missing, and Tesla shows 2 approvals |
| The scorer's arithmetic, step by step | Whether **this** job will sponsor; the file only shows the company's past |
| That the job filter follows your rules exactly, gives the same result on the same snapshot, and accounts for every job it saw (offline test, audit) | Whether your rules are right (for example, whether "AI Engineer" counts as software). You judge that by reading the audit |
| That a missing input, or evidence that disagrees, stops scoring for that job (offline test) | What the job description says, salary, remote work, and whether `timeline = 1.0` is true for you. Board names are guessed from company names; `draftkings` returned nothing |

## Proposed additions

This mode adds seven things the repo didn't have. **All seven are built, tested, and ran, so no typed TODO is left open.**

| Addition | Why it belongs | Where |
|---|---|---|
| Check the board list, not just the page | The page checker called a job that doesn't exist "active", because the link redirected to a search page. The board list is a record | `collect-liveness.mjs` |
| Look inside the page for the Greenhouse application frame | Datadog's apply form sits in a frame the page checker can't see, so all its jobs were held. The frame loads late, so the step waits for it | `collect-liveness.mjs` |
| Read the job's office list when the location says only "Hybrid" or "Remote" | Cloudflare puts the work style in the location field and the cities in the office list | `select-postings.mjs` |
| Pick jobs with written rules, explain every drop, save the rules with each snapshot | Picking by hand can't be repeated or checked. My first filter dropped good jobs and called "Remote - California" foreign; the audit showed it | `select-postings.mjs`, `scope.json`, `postings-<date>-audit.md`, `scope.used.json` |
| **Hold** a job instead of guessing | The scorer has no "don't know". Without a hold, an unclear job gets a confident Apply or Skip | `index.js` → `mode-run.json` (`held`), `mode-report.md` |
| Let you record your own check for a held job | Otherwise a job you checked stays held. Your answer is labeled `your-input` and never overrides "not on the board" | `scope.json` → `index.js` |
| Let you record the company's legal name (`csv_name`) | Exact matching missed a sponsor with 150 approvals on the first real run | `scope.json` |

## Output contract

Step 3 writes two kinds of files, one for a program and one for you:

| File (in `--out-dir`) | Who reads it | What's in it | What it helps decide |
|---|---|---|---|
| `mode-run.json` | a program or agent | inputs, counts, held jobs (id, reason, kind), companies not found, every score | the G1 / G1b / G3 checks; what to re-run |
| `my-roles.json` | a program, and the scorer | each job's evidence with its label | checking any single number |
| `role-scores.json` | a program | the scorer's full working | the G1 check |
| `mode-report.md` | **you** | one-line summary; scored jobs; held jobs in two tables (*where is it?*, *is it open?*) with an example of how to answer; companies not found; the checks left for you | which jobs to apply to today |
| `role-scores.md` | you, when a score looks odd | the scorer's step-by-step table | why one job got its score |

## Stop conditions

| When | What the mode does |
|---|---|
| `--fixture`, `--liveness`, or `--out-dir` is missing | stops (exit 1). It never guesses whether a job is open, and never writes over a default folder |
| A job is missing `id`, `company`, `title`, `url`, `fit`, or `timeline` | stops, names the field, writes nothing |
| The liveness file or the visa file is missing, or the scorer fails | stops |
| A re-run snapshot lacks a company named in the rules | stops |
| The evidence for a job is missing or disagrees, and you haven't answered | **refuses to score that job**: it's listed as held with the reason, and the other jobs go on |
| A job's location can't be placed, and you haven't answered | **refuses to score that job** (held, `kind: location`), unless the job is already closed |
| The job is not on the board | not a refusal: the board list is a record, so it's a Skip |
| All jobs done | stops normally; you take over at G2–G5 |

## Next step for each result (the 3-3-2 day)

| Result | What to do next |
|---|---|
| **Apply** | if Step 2 didn't run today, run Steps 2–3 again; pass G2–G5; then tailor and apply (the 2 hours for research and applying) |
| **Consider** | find someone at the company first (the 3 hours for networking) |
| **Skip**, job closed | nothing; the job is gone |
| **Skip**, low score, company "not found" | do G3 first: it may be a name mismatch, not a company that doesn't sponsor |
| **Held** | open the job, decide, and record your answer as the report's example shows; re-run Step 1 from the snapshot, then Step 3 |

## Log template (`logs/RUN_LOG.md` format)

Same format as `recipes/_shared.md`. For student pull requests `logs/RUN_LOG.md` is protected, so the entry is filed with the submission instead.

```markdown
## YYYY-MM-DD — case-swe-stem-opt-runway run <n>

- **Recipe:** recipes/case-swe-stem-opt-runway.md v<version> (status <status>)
- **Inputs:** <jobs.json> (<N> public Greenhouse jobs from <companies>, downloaded <date>); <liveness.json> (checked <time>); data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
- **Outputs:** <out-dir>/mode-run.json, mode-report.md, my-roles.json, role-scores.json, role-scores.md
- **Result:** <N → Apply a · Consider b · Skip c · Held h; skip rate; offline tests x/y>
- **Open issues:** <checks not made by a person; companies not found; evidence that disagreed>
```
