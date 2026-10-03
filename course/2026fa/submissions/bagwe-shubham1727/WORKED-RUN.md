# Worked run — swe-opt-clock on a fictional unemployed OPT software engineer

## Executive summary

**What this is.** A record of running the prototype on one realistic scenario: a fictional new-grad software engineer on OPT with 49 unemployment days left, choosing among 12 Boston-area software jobs. It includes the exact commands, their unedited terminal output, which values are records and which are inputs, how I checked them, and what went wrong.

**Why read it.** It's the evidence that the prototype was built and run, not just described. It's also where its limits are stated plainly.

**What it found.** Of 12 jobs, 8 had enough evidence to score: 2 Apply, 3 Consider, 3 Skip. The other 4 were held for a person, because the evidence that would have scored them doesn't exist in the repo. The most useful finding was a Proven sponsor with a strong fit (Klaviyo) that the clock rules out: its typical hiring cycle ends ten weeks after the student's unemployment days run out. Reading the first run's output closely turned up two defects in my own prototype, both fixed and committed. The skip rate (38%) is below the healthy 50%, because the input was hand-picked from known sponsors.

## Inputs

| Input | What | Label |
|---|---|---|
| Persona | `search/examples/neel-kapoor/profile.yml`: **fictional**. F-1 OPT year 1, unemployed, 41/90 days used as of 2026-10-02, EAD end 2027-06-14, buffer 15 days, `needs_sponsorship: true` | your-input |
| Roles | `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/fixtures/sample-roles.json`: 12 jobs. Company legal names are real CSV rows, except HubSpot (deliberately absent). Titles, SOC, time-to-start + basis, and fit are authored inputs | your-input |
| Posting snapshots | `…/fixtures/snapshots/*.json`, `capture_mode: fixture`, at `jobs.example.com` URLs. Authored; they don't claim these companies have these openings | your-input |
| Sponsor CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…`, identical to the hash in the 80 Days audit) | record |
| Form D | the 4 shipped `*.sample.json` quarters, 2025Q2–2026Q1 | record |
| BLS | `data/bls/compact/soc_occupation_compact.csv` | record |
| Run date | `--as-of 2026-10-02` (pinned for reproducibility) | your-input |

The roles file, fit ratings and time-to-start assumptions were committed (`239ed3e`) **before** the first run (`731da4b`), so they can't have been tuned to the verdicts.

## Commands and real output

### 1. Engine baseline (before building anything)

```
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/engine-baseline

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/engine-baseline

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/bagwe-shubham1727/runs/engine-baseline/role-scores.json  +  course/2026fa/submissions/bagwe-shubham1727/runs/engine-baseline/role-scores.md
```

```
$ npm run ats:liveness -- "https://databricks.com/company/careers/open-positions/job?gh_jid=8632401002" "https://job-boards.greenhouse.io/databricks/jobs/1"
Checking 2 URL(s)...

✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8632401002
⚠️ uncertain  https://job-boards.greenhouse.io/databricks/jobs/1
           content present but no visible apply control found

Results: 1 active  0 expired  1 uncertain
```

The second URL is a made-up job ID. The engine calls it **uncertain**, not expired. That's why my recipe holds "uncertain" for a person instead of treating it as live. (The first attempt failed with `Executable doesn't exist … chromium_headless_shell-1234`. I fixed it with `node node_modules/playwright/cli.js install chromium`.)

```
$ npm run bls:local-wage -- --metro "Boston-Cambridge-Newton, MA-NH" --soc 15-1252 --json
missing .venv — create it with:
  python3.13 -m venv .venv
  .venv/bin/pip install -r data/bls/local-wage/requirements.txt
```

`data/bls/local-wage/` doesn't exist in the clone either, so creating `.venv` wouldn't help (Fact 7, confirmed).

### 2. Tests

```
$ node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
✔ clock: unemployment ceiling binds before OPT end (Neel on 2026-10-02) (3.708667ms)
✔ clock: a count entered earlier is projected forward; the deadline does not drift later (0.472167ms)
✔ clock: stops instead of guessing (named failure cases) (1.476667ms)
✔ timeline factor: 1 inside buffer, linear in buffer, 0 after hard deadline (0.306542ms)
✔ entity + tier rules (1.247875ms)
✔ sponsor index never carries phone or officer columns (0.260959ms)
✔ title parsing handles the CSV's list repr and apostrophes (0.565417ms)
✔ liveness: 404 closes the gate, apply button opens it, uncertain and stale are held (1.594ms)
✔ role quality: a 2010 SOC code has no row and no number is invented (19.777125ms)
✔ G4 catches the authorization trap and a gate the scorer ignored (0.232042ms)
✔ e2e: sample run uses the real scorer, labels every term, holds what it cannot verify (330.55475ms)
✔ e2e: OPT end already past → stop with exit 3, no decisions written (45.9935ms)
✔ break: an additive-gates scorer is caught at G4 (exit 4, no report) (275.677959ms)
✔ break: a scorer that flips needs-sponsorship is caught at G4 (327.515958ms)
✔ refuses to write outside its namespace (35.908041ms)
✔ no prototype source imports a network module (0.574542ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1098.449584
```

### 3. The sample run

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02
✓ swe-opt-clock 2026-10-02: 12 evaluated → 8 scored (Apply 2 · Consider 3 · Skip 3) · 4 held for a human
  clock: 41/90 unemployment days used → hard deadline 2026-11-20, safe 2026-11-05
  ✓ scored 8 roles → Apply 2 · Consider 3 · Skip 3 (skip 38%)
  course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/roles.json
  course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/role-scores.json
  course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/run-log.json
  course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/report.md
  course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/gate-decisions.md
```

The second "✓ scored 8 roles" line is printed by the **existing scorer** (`scripts/score/role-scorer.mjs`), which the prototype runs as a child process. Its audit table, from `runs/2026-10-02/role-scores.md`, unedited:

```
| Tulip Interfaces — Software Engineer | 0.510 | **Apply** | composite 0.510 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.65·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Cohere Health — Software Engineer I, Backend | 0.490 | **Apply** | composite 0.490 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[your-input]×timeline 0.933[your-input] |
| Lookout — Software Engineer, Backend | 0.420 | **Consider** | above threshold (0.420) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Zakipoint Health — Full Stack Developer | 0.390 | **Consider** | above threshold (0.390) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Vecna Robotics — Software Engineer, Fleet Management | 0.255 | **Consider** | composite 0.255 in the Consider band [0.2, 0.3) | sponsorship 0.3·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Nodar — Perception Software Engineer (New Grad) | 0.161 | **Skip** | composite 0.161 < 0.2 — time is better spent elsewhere | sponsorship 0.6·0.35 [record]; fit 0.45·0.3 [your-input] × liveness 1[your-input]×timeline 0.467[your-input] |
| Klaviyo — Software Engineer I (New Grad) | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.75·0.3 [your-input] × liveness 1[your-input]×timeline 0[your-input] |
| Lendbuzz — Full Stack Engineer | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.65·0.3 [your-input] × liveness 0[your-input]×timeline 0.6[your-input] |
```

Held for a person (never scored): **CloudZero** (in the CSV, but sponsorship fields empty, so Unknown), **Abacus Insights** (posting snapshot uncertain: content but no apply button), **Nextuple** (snapshot 22 days old), and **HubSpot** (not in the CSV under any spelling). HubSpot's start date is also past the deadline, so its next action is Drop, not "go find the legal name". That was fix #1 below. The full per-job explanation is in `runs/2026-10-02/report.md`.

### 4. Named failure cases, exercised

```
$ export TMP=$(mktemp -d)
$ sed "s/opt_end_date: 2027-06-14/opt_end_date: 2026-09-01/" search/examples/neel-kapoor/profile.yml > $TMP/persona-opt-past.yml
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --persona $TMP/persona-opt-past.yml --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-opt-past
✗ STOP at G0 (persona clock): opt-end-past: OPT end 2026-09-01 is before the run date 2026-10-02: check the input before anything else
  nothing was scored; no report written. Log: course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-opt-past/run-log.json
exit=3

$ sed "s/unemployment_days_used: 41/unemployment_days_used: 90/" search/examples/neel-kapoor/profile.yml > $TMP/persona-ceiling.yml
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --persona $TMP/persona-ceiling.yml --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-ceiling
✗ STOP at G0 (persona clock): unemployment-ceiling-reached: projected unemployment days 90 ≥ ceiling 90: talk to your DSO today; this tool cannot help
  nothing was scored; no report written. Log: course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-ceiling/run-log.json
exit=3

$ grep -v unemployment_days_as_of search/examples/neel-kapoor/profile.yml > $TMP/persona-undated.yml
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --persona $TMP/persona-undated.yml --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-undated
✗ STOP at G0 (persona clock): unemployment-count-undated: visa.unemployment_days_as_of is required while unemployed; an undated count silently makes the deadline later
  nothing was scored; no report written. Log: course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-fail-undated/run-log.json
exit=3
```

The other named cases sit inside the sample run itself: company not in the CSV (HubSpot), SOC with no row (Tulip's `15-1132`, shown as `missing: no-soc-row` with no wage printed), posting 404 (Lendbuzz, liveness 0, Skip), and empty sponsorship fields (CloudZero, held, not sent to the scorer as 0).

### 5. Deliberate attempts to break it

```
$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-break-additive --scorer scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/fixtures/BROKEN-additive-gates-scorer.mjs
✗ HALT at G4: the scorer's output does not conform. No report written.
  • role R02 has a closed gate (liveness 1, timeline 0) but scorer said Apply
  • role R03 has a closed gate (liveness 0, timeline 0.6) but scorer said Apply
exit=4

$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --out-dir course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02-break-sponsor-flag --scorer scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/fixtures/BROKEN-sponsor-flag-scorer.mjs
✗ HALT at G4: the scorer's output does not conform. No report written.
  • scorer reports profile_needs_sponsorship=false but the persona says true
exit=4

$ node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02 --out-dir data/examples
✗ refusing to write to data/examples: outputs must stay under course/2026fa/submissions/bagwe-shubham1727/ or outside the repo
exit=2
```

The sponsor-flag mutant reproduces a **real** behaviour of the shipped scorer. Handed a profile whose authorization says "F-1 STEM OPT — work authorized (EAD)", `role-scorer.mjs` reports `profile_needs_sponsorship: false`, and the book's own Proven biotech flips from Apply to Skip (checked 2026-10-02 against `data/examples/ch11-roles.json`). My prototype never passes free text to the scorer, and it halts if the flag disagrees.

**Mutation testing of my own tests.** I edited `lib.mjs` twice to inject bugs, ran the suite, then restored the file with `git checkout`:

- Removing the unemployment-count projection → `pass 15, fail 1` (the projection test).
- Letting an "uncertain" posting through as live → `pass 14, fail 2` (the liveness unit test and the end-to-end test).

## Verified vs. inferred, line by line

For one Apply (Cohere Health) and one Consider (Lookout). Every other job follows the same pattern in `report.md`.

| Value | Cohere Health | Lookout | Label | Where it came from |
|---|---|---|---|---|
| Company exists in dataset | yes, "COHERE HEALTH INC" | yes, "LOOKOUT INC" | record | CSV exact normalized name |
| H-1B approvals / denials / rate | 104 / 2 / 98.1% | 38 / 0 / 100% | record | CSV columns |
| Fiscal years of those approvals | **unknown** | **unknown** | — | not in the file |
| Sponsored titles | 5 titles incl. "Software Engineer II" | "Staff Software Engineer", "Senior Software Engineer" | record | CSV `top_job_titles_sponsored` |
| Title counts as SOC 15-1252 | yes (regex) | yes (regex) | your-input (rule) | text heuristic, not an LCA SOC code |
| Has a non-senior SWE title | yes | **no** | your-input (rule) | seniority regex |
| Tier → p | Proven → 0.9 | Likely → 0.6 (senior-only) | inputs record; thresholds and p table your-input | recipe rule; 0.9/0.6 from the book's example |
| Posting live | active, factor 1 | active, factor 1 | **your-input** | authored fixture snapshot, classified by the engine |
| Time to start | 35 days ("assumed: Series C…") | 28 days ("recruiter (fictional) said…") | your-input | roles file |
| Deadline | 2026-11-20 hard / 2026-11-05 safe | same | your-input (persona dates) | clock arithmetic |
| Timeline factor | 0.933 | 1 | your-input | (Nov 20 − Nov 6) / 15 |
| Fit | 0.7 | 0.7 | your-input | roles file |
| National median wage 15-1252 | $133,080 (OEWS 2024) | same | record, report-only | BLS compact |
| Latest funding | 2025-05-07, Series C | 2021-03-15, Series B | record, report-only | CSV |
| Composite and decision | 0.4898 → Apply | 0.42 → Consider | scorer output | `role-scorer.mjs` |
| model-judgment values | none | none | — | no model was called |

## Verification

1. **Cross-checked by hand against the source files** (non-personal columns only):

```
CLOUDZERO INC |  |  |  | 2025-02-05 | 
COHERE HEALTH INC | 104.0 | 2.0 | 98.1132075471698 | 2025-05-07 | ['Engineering Manager ', 'Senior Software Engineer, Platform', 'Senior Machine Learning DevOps Engineer', 'Software Engineer II', 'Machine Learning Engineer']
LOOKOUT INC | 38.0 | 0.0 | 100.0 | 2021-03-15 | ['Staff Software Engineer', 'Senior Software Engineer']
VECNA ROBOTICS INC | 8.0 | 4.0 | 66.66666666666666 | 2021-12-22 | ['Test Engineer', 'Industry Solutions Design Engineer']
0                                  ← grep -ci hubspot over the whole CSV
15-1252.00,15-1252,Software Developers
median 133080.0 oews 2024 zone 4
0                                  ← rows starting 15-1132 in the BLS compact
eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270  data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
Cohere 0.4898  Nodar 0.1611  timeline Cohere (Nov20-Nov6)/15= 0.933
```

   Every number matches the report. The scorer's composites match `(0.9·0.35 + 0.7·0.30) × 1 × 0.933 = 0.4898` and `(0.6·0.35 + 0.45·0.30) × 1 × 0.467 = 0.1611` by hand.

2. **Clock by hand:** Aug 23 → Oct 2 inclusive is 41 days; 90 − 41 = 49; Oct 2 + 49 days = Nov 20; minus the 15-day buffer = Nov 5. That matches the report.

3. **Ran the test suite** (16/16) and two mutation tests (both caught). **Tried to break it** five ways (§4–5). Each stopped or halted with no report written.

## Reflection

**What worked.**
- Holding instead of guessing. Four of twelve jobs had a gap the data can't fill, and none of them got a number.
- The clock gate doing what a person wouldn't. The best-looking job on paper (Klaviyo: Proven sponsor, highest fit) is correctly impossible.
- The new-grad rule. It moved Lookout from Proven to Likely for a reason visible in its own title list.
- Reusing the scorer unmodified. Checking its output caught a real trap in it.

**What the recipe or prototype got wrong, or missed.**
- **Two defects in my own code, found by reading the first run's report** (committed unedited as `731da4b`, fixed in `04a0437`):
  - HubSpot was sent to "find the legal name", although its start date is already past the deadline. That would have spent a person's time on a role the clock had already ruled out.
  - Vecna's reason printed "approvals 8 < 2 or rate 66.7% < 75%", which reads as a false statement.
- **A third defect, found before committing the failure runs** (`dc342fa`): a stopped run's log recorded an out-of-repo path that contained a local home directory.
- **Prediction check.** I predicted a skip rate under 50% because the sample is sponsor-biased: it was 38%. I predicted the title rule would be too loose and too strict. It is too loose: "Perception Software Engineer" (Nodar) counts as 15-1252, which an LCA could code differently. No "Member of Technical Staff"-type title appeared in the sample, so the too-strict half wasn't tested.
- **Missed:** every liveness value is your-input because the snapshots are authored. In this sample the liveness gate is exercised, not evidenced.

**One concrete next improvement.** The single biggest inferred step is "this sponsored title is a 15-1252 job". Replacing the title regex with DOL LCA disclosure rows filtered to `SOC_CODE = 15-1252` and the last three fiscal years would turn it into a record and add the missing year. That's the recipe's proposed addition #2 (a typed DATA SOURCE TODO).

## Attestation

- Recipe: swe-opt-clock v0.1.0
- By: Shubham Bagwe · 2026-10-03. The rows below were executed by Claude Code (an AI agent) in my session, and their output is pasted above. **SIGN-OFF PENDING:** I re-run each "Ran" command myself and change this line to "re-run by me on <date>" before submitting.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node --test …/test/swe-opt-clock.test.mjs` | `pass 16, fail 0` | 16/16 |
| `node …/run.mjs --as-of 2026-10-02` | 12 evaluated → 8 scored (2/3/3), 4 held; hard deadline 2026-11-20 | gates hold what can't be verified; deadline = Oct 2 + 49 d |
| Hand check of Cohere / Lookout / Vecna / CloudZero rows, BLS 15-1252, CSV sha256 | all match the report; sha256 = 80 Days audit's | values copied, not invented |
| Persona with OPT end 2026-09-01 | `STOP at G0 … opt-end-past`, exit 3, only `run-log.json` | stop, no decisions |
| Persona with 90/90 days used | `STOP at G0 … unemployment-ceiling-reached`, exit 3 | stop |
| Persona with the count's date removed | `STOP at G0 … unemployment-count-undated`, exit 3 | stop, not "assume today" |
| **Break:** additive-gates mutant scorer | `HALT at G4`, R02 + R03 named, exit 4, no report | halt |
| **Break:** scorer that flips needs-sponsorship | `HALT at G4 … profile_needs_sponsorship=false`, exit 4 | halt |
| **Break:** `--out-dir data/examples` | `refusing to write`, exit 2 | refuse |
| **Break:** removed the clock projection in `lib.mjs` | 1 test failed | a test catches it |
| **Break:** let "uncertain" postings through as live | 2 tests failed | tests catch it |
| Real scorer with "work authorized (EAD)" profile | `profile_needs_sponsorship False`, Proven biotech → Skip | (found, not expected) |

### Did not test

- Any **live** posting through the prototype. All 12 snapshots are authored fixtures. Liveness was exercised, not evidenced.
- Whether any sponsored title was actually filed under SOC 15-1252 (no SOC data in the repo).
- Whether these companies' real hiring timelines match the assumed time-to-start values.
- A persona who is currently **employed** (`currently_employed: true`), or one with `needs_sponsorship: false`. Both code paths exist; neither has a test or a run.
- Funding recency as a signal. 0 of 12 companies matched the Form D samples, so that branch never produced a match.
- A title like "Member of Technical Staff" (the too-strict half of my prediction).
- A second person reading `report.md` and finding it usable. Adequacy is unjudged, and `gate-decisions.md` is unsigned.
- The CI run on GitHub. It hasn't run yet, and see TEST-REPORT for why two CI jobs will fail regardless of this PR.

### Broke during testing, fixed

- Held-but-gated routing: HubSpot sent to "find the legal name" despite a closed timeline gate. Fixed in `run.mjs` (closed gate checked first). Commit `04a0437`.
- Possible-tier reason text printed both conditions. Fixed in `lib.mjs` `sponsorshipTier`. Commit `04a0437`.
- Out-of-repo paths in committed logs carried a home directory. `rel()` in `run.mjs` now records `<outside-repo>/<file>`. Commit `dc342fa`.
- The history-wide PII scan (`pii-scan --diff origin/main`) **failed on the clean-checkout run**, because FRICTIONAL.md quoted the address the scanner flags in upstream's lockfile. The commit was unpushed, so it was amended to describe the address without quoting it. The history scan is now clean (TEST-REPORT §6).
- `npm run ats:liveness` failed on a missing Chromium build. Fixed in the environment, not the repo: `node node_modules/playwright/cli.js install chromium`.
- `npm install` rewrote the tracked `package-lock.json` (36 lines removed). Reverted with `git checkout -- package-lock.json` so it stays out of the diff.
