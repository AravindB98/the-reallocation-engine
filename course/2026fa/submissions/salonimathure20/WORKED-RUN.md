# Worked run — opt-countdown, fictional persona `ananya-rao-example`

## Summary

This is one complete run of the opt-countdown recipe on eight real Boston-area job postings for a fictional MS student on F-1 OPT with 53 days of search runway left. It recommends **applying to one posting (Formlabs), networking first on two (PathAI, Iterative Health), and skipping three**:

- two strong sponsors whose hiring is assumed slower than the clock allows;
- one fake "ghost" posting that the engine's own liveness checker wrongly called live.

Two more postings (HubSpot, DraftKings) could not be scored because the sponsorship data has no H-1B record for them. They are handed to a person instead of being skipped. The run also found that the only Apply depends on a model-judged fit number, and that the H-1B counts in the source CSV look doubled.

All output below is pasted from the terminal, not described. Run date: 2026-10-03 (America/New_York). The scorer stamps its report with the UTC date, 2026-10-04.

## Inputs

| Input | Value | Label |
|---|---|---|
| Persona | `scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/persona.json`: fictional; MS Information Systems, F-1 OPT year 1, OPT end 2027-06-30, 27 of 90 unemployment days used (contract job ended 2026-09-05), buffer 10, as of 2026-10-03 | your-input |
| Candidates | `fixtures/worked-run/candidates.json`: 8 roles. 6 are real public postings observed 2026-10-03; 1 is a deliberately fake Klaviyo job ID (break attempt); 2 (HubSpot, DraftKings) are title-only, to test missing sponsorship data | your-input (fit values: model-judgment) |
| Liveness | `fixtures/worked-run/liveness.txt`: saved output of `npm run ats:liveness` | record |
| Greenhouse API | `fixtures/worked-run/greenhouse-api.txt`: saved output of the curl loop | record |
| Sponsorship | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Occupation | `data/bls/compact/soc_occupation_compact.csv` | record |

## Commands and real output

### 0. Engine baseline: the shared scorer on the book's example

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/salonimathure20/runs/ch11-baseline

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/salonimathure20/runs/ch11-baseline

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/salonimathure20/runs/ch11-baseline/role-scores.json  +  course/2026fa/submissions/salonimathure20/runs/ch11-baseline/role-scores.md
```

### 1. Liveness: browser checker (network)

```text
$ npm run ats:liveness -- --file scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/urls.txt > scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/liveness.txt 2>&1
$ cat scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/liveness.txt

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/urls.txt

Checking 6 URL(s)...

✅ active     https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003
✅ active     https://www.pathai.com/careers/8696763002?gh_jid=8696763002
✅ active     https://careers.toasttab.com/jobs?gh_jid=8103307
⚠️ uncertain  https://careers.formlabs.com/job/7954978/apply/?gh_jid=7954978
           content present but no visible apply control found
✅ active     https://job-boards.greenhouse.io/iterativehealth/jobs/4687861006
✅ active     https://boards.greenhouse.io/klaviyo/jobs/1000000003

Results: 5 active  0 expired  1 uncertain
```

The last URL is a **job ID that does not exist**, and the checker says `active`.

### 2. Liveness: Greenhouse API (network)

```text
$ for bj in klaviyo/7727703003 pathai/8696763002 toast/8103307 formlabs/7954978 iterativehealth/4687861006 klaviyo/1000000003; do b=${bj%/*}; j=${bj#*/}; curl -s -o /dev/null -w "%{http_code} $b/$j\n" "https://boards-api.greenhouse.io/v1/boards/$b/jobs/$j"; done | tee scripts/contrib/2026fa/salonimathure20-opt-countdown/fixtures/worked-run/greenhouse-api.txt
200 klaviyo/7727703003
200 pathai/8696763002
200 toast/8103307
200 formlabs/7954978
200 iterativehealth/4687861006
404 klaviyo/1000000003
```

```text
$ curl -s -o /dev/null -w "%{http_code} -> %{url_effective}\n" -L "https://boards.greenhouse.io/klaviyo/jobs/1000000003"
200 -> https://www.klaviyo.com/careers/search-jobs
```

That is why the browser check is fooled: the dead job redirects to a live search page.

### 3. The prototype (offline)

```text
$ node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
✓ opt-countdown: runway 53 days (start by 2026-11-25, bound by unemployment-clock)
  8 roles → scored 6 (Apply 1 · Consider 2 · Skip 3) · blocked for a human 2
  scorer: ✓ scored 6 roles → Apply 1 · Consider 2 · Skip 3 (skip 50%)
  course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-log.json  +  course/2026fa/submissions/salonimathure20/runs/opt-countdown/opt-countdown-report.md
exit=0
```

Scorer output, pasted from `runs/opt-countdown/role-scores.md`, which `scripts/score/role-scorer.mjs` wrote:

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Formlabs Inc — Business Systems Analyst (Somerville, MA) | 0.317 | **Apply** | composite 0.317 ≥ 0.3, gates healthy | sponsorship 0.875·0.35 [record]; fit 0.65·0.3 [model-judgment] × liveness 1[record]×timeline 0.633[your-input] |
| Iterative Health — Clinical Data Specialist (NYC, BOS or Dallas) | 0.294 | **Consider** | composite 0.294 in the Consider band [0.2, 0.3) | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [model-judgment] × liveness 1[record]×timeline 0.633[your-input] |
| PathAI Inc — Senior Software Engineer, Fullstack (Boston, hybrid) | 0.282 | **Consider** | composite 0.282 in the Consider band [0.2, 0.3) | sponsorship 0.975·0.35 [record]; fit 0.35·0.3 [model-judgment] × liveness 1[record]×timeline 0.633[your-input] |
| Klaviyo Inc — Full Stack Software Engineer - People Systems (Boston) | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.975·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0[your-input] |
| Toast Inc — Principal Software Engineer, Tech Lead (Remote US) | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.974·0.35 [record]; fit 0.15·0.3 [model-judgment] × liveness 1[record]×timeline 0[your-input] |
| Klaviyo Inc — Data Analyst (link copied from a job aggregator) | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.975·0.35 [record]; fit 0.75·0.3 [model-judgment] × liveness 0[record]×timeline 0[your-input] |

Blocked, from `opt-countdown-report.md`:

| Role | Decision | Why | Next action (3-3-2 block) |
|---|---|---|---|
| DraftKings Inc — Data Analyst (Boston) | **Blocked** | sponsorship: no-h1b-record-joined; liveness: liveness-unchecked | Resolve before scoring: sponsorship: no-h1b-record-joined, liveness: liveness-unchecked · 2 (research) h |
| HubSpot Inc — Data Analyst (Cambridge, MA) | **Blocked** | sponsorship: no-company-row; liveness: liveness-unchecked | Resolve before scoring: sponsorship: no-company-row, liveness: liveness-unchecked · 2 (research) h |

The full human report is at `runs/opt-countdown/opt-countdown-report.md`; the agent log is at `runs/opt-countdown/opt-countdown-log.json`.

## Verified vs. inferred, line by line

| Value | Label | Where it came from |
|---|---|---|
| Runway 53 days = min(270 days to OPT end, 90 − 27 − 10) | your-input (script arithmetic) | persona dates. Not checked against any record; a real user checks their EAD and SEVP portal |
| Start-by 2026-11-25 | your-input (arithmetic) | as_of + 53 |
| Klaviyo 154 approvals, 97.47%; PathAI 78, 97.5%; Toast 150, 97.40%; Formlabs 70, 87.5%; Iterative Scopes 18, 100% | **record** | 80 Days CSV, exact name rows |
| Sponsorship p (0.975, 0.975, 0.974, 0.875, 0.9) and tier Proven | record inputs × **recipe-defined formula** | `rate/100 × min(1, approvals/20)`. The cap of 20 is my design choice |
| Iterative Health = ITERATIVE SCOPES INC | **your-input** | human-asserted alias; not checked against SEC or DOL |
| DraftKings blank H-1B; HubSpot no row | **record** (of absence) | CSV. *Not* evidence that they don't sponsor |
| Fit 0.7 / 0.35 / 0.15 / 0.65 / 0.5 / 0.75 | **model-judgment** | proposed by the AI agent from title vs. persona level; accepted by the human. Not checked against the full posting text |
| Liveness 1.0 for 5 roles, 0.0 for the ghost | **record** | Greenhouse API 200/404 (wins over the browser checker) |
| Formlabs: checker "uncertain" vs. API 200 | record conflict, flagged | the report lists it under Flags for a human to open |
| Hiring lag 45 / 60 days | **your-input** | size-band assumption. No data |
| Timeline 0.633 (slack 8) / 0 (slack −7) | your-input (arithmetic) | `0.5 + slack/60`, closed below 0 |
| Composite and Apply/Consider/Skip | script output | `scripts/score/role-scorer.mjs`, unmodified |
| BLS national medians ($133,080; $103,790; $112,590), pivot scores | **record**, context only | BLS compact CSV; weight 0 in the scorer |

## Verification

**1. Cross-checked one row by hand against the source files:**

```text
$ grep "^FORMLABS INC," data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv | python3 -c "import csv,sys; r=next(csv.reader(sys.stdin)); print(r[0], r[15:19])"
FORMLABS INC ['70.0', '10.0', '87.5', '111000.0']
$ grep "^15-1211.00," data/bls/compact/soc_occupation_compact.csv | cut -d, -f1,3
15-1211.00,Computer Systems Analysts
$ python3 -c "print(round((0.875*0.35 + 0.65*0.30) * 1.0 * 0.633, 4))"
0.3173
```

70 / (70 + 10) = 87.5%, which matches the CSV's rate. p = 0.875 × min(1, 70/20) = 0.875. The composite of 0.3173 matches the log (`"composite": 0.3173`) and the scorer table (0.317).

**2. Offline tests:** `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/` gives 12 pass, 0 fail (full output in `TEST-REPORT.md`).

**3. Break attempts:** see the Attestation below. These were a past OPT date, a missing API file, and a mutant that ignores the 404.

## Reflection

**What worked.** The timeline gate did what the recipe is for: two Proven sponsors (Klaviyo, Toast) were moved from "apply" to "network, don't apply", because a 60-day hiring process does not fit a 53-day runway. Blocking instead of skipping kept HubSpot and DraftKings visible as things a person should check, rather than silently dropping two of Boston's larger employers. Plugging into the existing scorer meant every decision arrived with its arithmetic attached.

**What the prototype or recipe got wrong or missed:**

- I predicted the browser liveness checker would mark the fake job as expired. **It said active.** Without the Greenhouse API record, the ghost posting is only skipped by coincidence: its assumed 60-day lag also closes the timeline gate (break attempt 2). For a non-Greenhouse posting there is no second record at all.
- **The only Apply is fragile.** Formlabs scores 0.317 against a 0.30 threshold. A fit of 0.55 instead of 0.65 (a model judgment) would flip it to Consider (break-even fit is 0.559; I first wrote 0.59 here and corrected it after recomputing). The recipe surfaces the arithmetic, but it does not yet warn when a decision is within a hair of the threshold.
- **The hiring-lag inputs decide more than the data does.** Changing Klaviyo's assumed lag from 60 to 50 days would reopen its gate. The recipe labels this honestly, but it is still a guess.
- **The CSV's H-1B counts are all even.** I did not correct for it (rates are unaffected and the volume cap hides it for most rows), but a company with 22 listed approvals may really have 11.
- **Small thing:** the scorer dates its report in UTC (2026-10-04) while the run was on 2026-10-03 local time.

**One concrete next improvement.** Add a **margin flag**: when `|composite − 0.30| < 0.03`, or when a single model-judgment term could flip the decision, the report should say *"this decision hangs on the fit judgment"* and route the role to the human gate as Consider. It is a few lines in `opt-countdown.mjs`, needs no scorer change, and would have flagged Formlabs.

## Attestation

- Recipe: opt-countdown (`recipes/cases/2026fa/salonimathure20-opt-countdown.md`) v0.1.0
- By: commands run by Claude Code (AI agent) in a session directed by salonimathure20 · 2026-10-03. **Not yet signed by the human:** the G4 adequacy gate and this attestation need the student's own review, so the recipe stays DRAFT and `attestation: null`.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs` | exit 0; runway 53 days; 8 roles → Apply 1 · Consider 2 · Skip 3 · Blocked 2; both outputs written | a complete run, both outputs, skip rate ≥ 50% of scored |
| `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/` | 12 pass, 0 fail | all pass, offline |
| Hand cross-check of Formlabs against the CSV and BLS rows | 70 / 10 / 87.5 / $103,790; composite 0.3173 by hand | same numbers as the log |
| **Break 1:** persona with `opt_end_date` 2026-09-30 (`--persona <scratch>/persona-opt-past.json`) | `HALT at gate G1 (runway): opt-end-date-already-past. No role was scored.` exit=3 | halt, exit 3, no `roles.json` |
| **Break 2:** `--greenhouse-api <nonexistent file>` | warning printed; ghost posting liveness = 1 (single-source), skipped only because timeline also closed; Formlabs became *Blocked* (checker uncertain); Apply 0 | the recipe should at least warn. It did only after a fix (below) |
| **Break 3:** mutant `lib.mjs` with the API-404 rule changed to factor 1.0 | `not ok 8` and `not ok 10`, 10 pass / 2 fail; original restored, 12/12 again | tests must catch a weakened gate |
| Fake job ID through `npm run ats:liveness` | `✅ active` | `expired`. **Prediction wrong; defect in the shared checker** |
| `node scripts/conformance.mjs scripts/contrib/2026fa/salonimathure20-opt-countdown/` | `✓ all conform` | pass |

(Break-attempt paths were in the session scratch folder; in the pasted output they are shortened to `/tmp/…`.)

```text
$ node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --persona /tmp/persona-opt-past.json --out-dir /tmp/optc-break1
✗ opt-countdown: HALT at gate G1 (runway): opt-end-date-already-past. No role was scored. Log: /tmp/optc-break1/opt-countdown-log.json
exit=3
$ node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs --greenhouse-api /tmp/does-not-exist.txt --out-dir /tmp/optc-break2
! greenhouse-api file not found (/tmp/does-not-exist.txt): liveness is checker-only, which reads a redirected dead job as "active". Every live role will carry a single-source flag.
✓ opt-countdown: runway 53 days (start by 2026-11-25, bound by unemployment-clock)
  8 roles → scored 5 (Apply 0 · Consider 2 · Skip 3) · blocked for a human 3
  scorer: ✓ scored 5 roles → Apply 0 · Consider 2 · Skip 3 (skip 60%)
  /tmp/optc-break2/opt-countdown-log.json  +  /tmp/optc-break2/opt-countdown-report.md
exit=0
```

### Did not test

- Any live run with a human clearing G4. The sign-off checklist in the report is unfilled.
- Lever, Ashby, SmartRecruiters or Workday postings. Every worked-run posting is Greenhouse-hosted, so the "single-source liveness" path has only been exercised by the break attempt.
- Whether the hiring-lag bands resemble reality for any of these companies.
- Fit values against the full job descriptions. They were judged from titles only.
- The `ats:liveness` checker against a posting that is genuinely *expired* (not a fake ID).
- STEM-OPT personas (150-day ceiling), or a persona whose OPT end date, not the unemployment clock, binds. Covered by a unit test only.
- Fresh-clone install on CI's Linux runner. Local runs were macOS, Node 20.20.2.

### Broke during testing, fixed

- **Silent fallback when the API file is missing.** At first the prototype treated a missing `--greenhouse-api` file as "no API records" without saying so. Fixed in `opt-countdown.mjs`: it now prints a warning that liveness is checker-only, and each live role carries a single-source flag.
- **Fake job reported active.** This is not fixed in the shared checker (out of scope, proposed as a typed TODO in the recipe). Worked around in this recipe by gate G3: the API status wins when present.
- **Persona inconsistency.** The EAD started 2026-07-01 but only 27 unemployment days were used by 2026-10-03, with no explanation. Fixed by adding a contract job that ended 2026-09-05 to the fictional persona.
