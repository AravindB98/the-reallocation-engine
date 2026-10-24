# Worked run — data-role-sponsor-match v0.1.0 (sample mode), 2026-10-03

> Who ran what: the commands below were executed on 2026-10-03 on Windows 11 / Node 24.14.0 / Python 3.13.2 by the AI assistant (Claude Code) in the student's session, and the output is pasted unedited. Siddi Kommuri then re-ran the one command and the tests on 2026-10-03 in Git Bash, and the results matched (12/12 tests passed).

## Inputs

- **Persona profile** (`scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/candidates.json`), all your-input: MS Information Systems, F-1, graduating Dec 2026; OPT 2027-01-15 → 2028-01-14; 0 of 90 unemployment days used; assumed hiring lag 60 days; tier→p `Proven 0.9 / Likely 0.6`; data-title include/exclude regexes; title→SOC map.
- **Seven roles:**
  - Four are **real public postings** found on 2026-10-03 with `ats:scan` and the public Greenhouse boards: Klaviyo *Analytics Engineer* (Boston), Databricks *Senior Data Scientist*, and Toast *Staff Data Scientist*. DraftKings *Data Engineer* has no URL captured.
  - Absci *Data Scientist* is a real company with no posting captured.
  - Two are **CONSTRUCTED** test cases: Klaviyo with a nonexistent job id (`1000000001`), and "Northwind Analytics", which is not in the CSV.
- **Fit ratings** are the persona's self-ratings (your-input), not model output.
- **Repo data:** the 80 Days CSV (shipped), the BLS compact CSV (shipped), and Form D **samples only** (first 50 companies per quarter; Fact 3).

## Commands and real output

### 1. Toolchain and scan baseline

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/kommurisi/runs/baseline-ch11
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course\2026fa\submissions\kommurisi\runs\baseline-ch11\role-scores.json  +  course\2026fa\submissions\kommurisi\runs\baseline-ch11\role-scores.md
```

`npm run ats:scan -- --dry-run` failed first with `Error: portals.yml not found. Run onboarding first.`. After `cp data/ats/portals.example.yml data/ats/portals.yml` (gitignored) it scanned Databricks: 886 jobs found, 61 kept. The full output is in `runs/baseline/ats-scan-dry-run.txt`. A second scan with data-only title filters and five boards (local `portals.yml`, not committed):

```text
Scanning 5 companies via providers (0 local parser; 0 skipped — no provider matched)
Companies scanned:     5
Total jobs found:      1347
Filtered by title:     1345 removed
Errors (2):
  ✗ DataRobot: HTTP 404: {"status":404,"error":"Job not found"}
  ✗ DraftKings: HTTP 404: {"status":404,"error":"Job not found"}
New offers:
  + Klaviyo | Analytics Engineer | Boston, MA
  + Databricks | Specialist Solutions Architect - Data Engineering & Warehousing (Financial Services)  | United States
```

### 2. Liveness evidence (the only network steps)

```text
$ node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs --input scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/candidates.json --out scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/greenhouse-api.json
200  https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/7737707003  "Analytics Engineer"
200  https://boards-api.greenhouse.io/v1/boards/databricks/jobs/5634684002  "Senior Data Scientist "
200  https://boards-api.greenhouse.io/v1/boards/toast/jobs/8029049  "Staff Data Scientist"
404  https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/1000000001
wrote scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/greenhouse-api.json (4 checks)
```

```text
$ npm run ats:liveness -- --file scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/urls.txt   # captured 2026-10-03T19:59:31Z
Checking 4 URL(s)...

✅ active     https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003
✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=5634684002
✅ active     https://careers.toasttab.com/jobs?gh_jid=8029049
✅ active     https://job-boards.greenhouse.io/klaviyo/jobs/1000000001

Results: 4 active  0 expired  0 uncertain
```

The last line is the redirect ghost. `curl -L` on that URL lands on `https://www.klaviyo.com/careers/search-jobs` (HTTP 200), a search page with Apply buttons. The Greenhouse API says 404.

### 3. The prototype (offline): one command

```text
$ node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs
✓ 7 roles → Apply 1 · Consider 2 · Skip 1 · Unresolved 3 (scored 4 via scripts/score/role-scorer.mjs)
  timeline gate open: runway 194d vs lag 60d → factor 1 [your-input]
  Apply      klaviyo-analytics-engineer (0.54) — composite 0.540 ≥ 0.3, gates healthy
  Consider   databricks-senior-ds (0.315) — above threshold (0.315) but one soft spot: sponsorship tier "Likely"
  Consider   toast-staff-ds (0.285) — composite 0.285 in the Consider band [0.2, 0.3)
  Skip       klaviyo-dead-job-CONSTRUCTED (0) — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
  Unresolved draftkings-data-engineer — no-sponsorship-record, liveness-unchecked
  Unresolved absci-data-scientist — ambiguous-company-match, liveness-unchecked
  Unresolved northwind-data-analyst-CONSTRUCTED — no-company-match, liveness-unchecked
  wrote course/2026fa/submissions/kommurisi/runs/latest/data-role-sponsor-match.log.json + course/2026fa/submissions/kommurisi/runs/latest/data-role-sponsor-match.report.md
[exit 0]
```

The scorer's own report (`runs/latest/role-scores.md`, written by `scripts/score/role-scorer.mjs`):

```text
**Summary:** 4 roles → Apply 1 · Consider 2 · Skip 1. **Skip rate 25%** (below the ~50% a healthy run skips; check the inputs).
| Klaviyo — Analytics Engineer | 0.540 | **Apply** | … | sponsorship 0.9·0.35 [your-input]; fit 0.75·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Databricks — Senior Data Scientist | 0.315 | **Consider** | … | sponsorship 0.6·0.35 [your-input]; fit 0.35·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Toast — Staff Data Scientist | 0.285 | **Consider** | … | sponsorship 0.6·0.35 [your-input]; fit 0.25·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Klaviyo — Data Analyst (CONSTRUCTED: …) | 0.000 | **Skip** | gated: liveness ≈ 0.000 … | sponsorship 0.9·0.35 [your-input]; fit 0.8·0.3 [your-input] × liveness 0[record]×timeline 1[your-input] |
```

The full person-facing report is `runs/latest/data-role-sponsor-match.report.md`. The full agent log is `runs/latest/data-role-sponsor-match.log.json`.

## Verified vs. inferred, line by line (Klaviyo Analytics Engineer)

| Value | Label | Where it came from |
|---|---|---|
| CSV row `KLAVIYO INC` | record | `mapped_student_employment_targets_v3.csv:14495` |
| 154 approvals, 97.47% approval rate | record | same row, cols 16 and 18 (company-wide, all roles) |
| Top titles incl. "Business Intelligence Engineer" | record | same row, col 20 (top titles only) |
| "BI Engineer" counts as a data role | your-input | my include regex `\bbusiness intelligence` |
| tier = Proven | your-input | derived: record titles × my regex (lowest-trust input wins) |
| sponsorship p = 0.9 | your-input | my tier calibration (Ch.11 example value), not a measured probability |
| fit = 0.75 | your-input | persona self-rating |
| liveness = 1 | record | `ats:liveness` "active" **and** Greenhouse API 200, both captured 2026-10-03 |
| timeline = 1 | your-input | runway 194 d (dates I entered) ≥ 2 × assumed lag 60 d |
| composite 0.540 → Apply | computed by the maintained scorer from the above | `scripts/score/role-scorer.mjs` |
| 15-1243.01 Data Warehousing Specialists | your-input | my title→SOC map |
| national median $135,980; pivot 3.626 | record | `soc_occupation_compact.csv` (OEWS 2024). **Not in the score** (weight 0.0) |
| H-1B median salary $126,000 | record | CSV col 19, across **all** sponsored roles, not this one |
| Series C, 2022-07-26 | record | CSV cols 14–15; Form D sample: not-in-sample |
| model-judgment | — | none; no model was called by the prototype |

The decision rests on three `your-input` terms (tier p, fit, timeline) and one `record` gate. The only record-backed claim about sponsorship is that "Business Intelligence Engineer" appears in Klaviyo's top sponsored titles.

## Verification

1. **Hand cross-check against the source files** (`evidence/hand-cross-check.txt`), read with Python's `csv` module, not my parser:
   ```text
   KLAVIYO INC | 154.0 | 97.46835443037976 | 126000.0 | ['Business Intelligence Engineer', 'Software Engineer II', 'Engineering Manager Data Exchange', 'Engineering Manager II- SMS', 'Senior Software Engineer']
   DATABRICKS INC | 1640.0 | 99.51456310679612 | 149422.5 | ['Software Engineer', 'Senior Software Engineer', 'Solutions Architect', 'Specialist Solutions Architect', 'Senior Solutions Engineer']
   DRAFTKINGS INC | ['', '', '', '', ''] | Series D+ | 2024-12-03
   15-2051.00 | Data Scientists | median | 112590.0 | pivot | ''
   hand arithmetic: 0.54 0.315 0.285
   ```
   These match the log line for line. DraftKings' sponsorship cells really are blank. The Data Scientists pivot score really is empty in the source, and the report says "missing in source row".
2. **Tests:** `node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.test.mjs` → 12 pass, 0 fail (`evidence/test-output.txt`).
3. **Clean checkout:** a fresh clone of the branch was run end to end (`evidence/clean-checkout-2.txt`). The first attempt failed and is kept (`evidence/clean-checkout-1-FAILED.txt`; see "Broke during testing, fixed").
4. **Deliberate breaks:** see the attestation below. Full output is in `evidence/break-attempts.txt` and `evidence/mutation-tests.txt`.

## Attestation

- Recipe: data-role-sponsor-match v0.1.0
- By: Siddi Kommuri · 2026-10-03 (runs and break attempts executed by Claude Code in my session; I re-ran the one command and the tests myself and they matched)

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node …/match.mjs` (worked run) | Apply 1 · Consider 2 · Skip 1 · Unresolved 3, exit 0 | the dead-job role gated to Skip; the three gap roles Unresolved, not scored |
| `node --test …/match.test.mjs` | 12 pass / 0 fail | all pass offline |
| Fresh clone of the branch, one command + tests | first attempt: **1 test failed, and the run wrote into tracked `data/examples/`**; after the fix: 12/12, `git status` clean apart from the regenerated outputs | runs clean from a fresh checkout |
| **Break B1:** `as_of` moved past `opt_end_date` | `✗ blocked at timeline gate: opt-window-closed`, exit 3, no roles.json | stop, score nothing |
| **Break B2:** `--out-dir data/examples` | `✗ refusing to write outside my namespace`, exit 2 | refuse to overwrite tracked files |
| **Break B3:** company typo "Klavyio" | Unresolved `no-company-match`, scorer not run | no fuzzy guess |
| **Break B4:** liveness evidence files missing | all 3 roles Unresolved `liveness-unchecked` | never default the gate open (the scorer would default to 1.0) |
| **Break B5:** hiring lag 120 d | timeline factor 0.617; Databricks and Toast fall to Skip; Klaviyo stays Apply at 0.333 | gate degrades linearly |
| **Mutant M1:** liveness defaults to open | 2 tests fail | suite catches it |
| **Mutant M2:** naive `/data\|analytic/` pattern | 2 tests fail | suite catches it |
| **Mutant M3:** blank sponsorship read as a sponsor | 1 test fails | suite catches it |
| **Mutant M4:** stale-output cleanup removed | 1 test fails | suite catches it |
| **Mutant M5:** temp dir allowed even inside the repo | 1 test fails | suite catches it |
| Same persona text as `search/examples/aarav-patel` (`"F-1 STEM OPT — work authorized (EAD)"`) passed to the **maintained** scorer | `profile_needs_sponsorship: false`, composite 0.21 for a Proven sponsor | `true` (the persona README says this was fixed) |

### Did not test

- Any **live** run against the student's real target list. Everything is sample mode with a persona.
- Lever, Ashby, SmartRecruiters or Workday postings. Only Greenhouse has the API cross-check.
- Whether the Greenhouse API 404 can be wrong (rate limits, board slug changes).
- The real seniority or sponsorship of any of these specific openings. No recruiter or LCA record was checked.
- `npm run bls:local-wage`, which fails on a fresh clone and feeds nothing. It was not run.
- The full Form D quarters, which are not shipped.
- A clean-checkout run on macOS or Linux. Only Windows was used (see `TEST-REPORT.md`).
- CI (`.github/workflows/contrib-gate.yml`). It only runs once the PR is open.

### Broke during testing, fixed

- **Out-dir guard let a temp-dir checkout write into the repo.** This was the worst bug, found only by the clean-checkout run. The guard allowed "anything under the OS temp dir" (for tests). When the fresh clone itself lived under the temp dir, that meant the whole repo, so the namespace test wrote into `data/examples/` and modified the tracked `role-scores.json`. The fix: inside the repo, only my two namespaces are allowed, and the temp allowance applies only outside the repo. The rule moved into `lib.mjs` as `outDirAllowed()`, with a unit test reproducing the layout (mutant M5 proves it bites).
- **Out-dir guard ran after `mkdir`.** A refused path would still have been created. The check now runs first (`match.mjs`, `inside()`/`real()`).
- **Windows 8.3 temp paths** (`SUHASK~1`) made the namespace check compare unequal paths. It now resolves the nearest existing ancestor with `realpathSync.native`.
- **Stale scorer output.** A blocked re-run left the previous `role-scores.json` beside the new report. The prototype now clears its own outputs first, and a regression test was added (M4 proves the test bites).
- **Misleading console line.** It said "scored 0 via role-scorer.mjs" when the scorer never ran. It now says "scorer not run".
- **Uninformative report.** A Form D hit printed as "found". It now prints the filing date and amount.

## Reflection

**What worked:**
- The title-level check separated the two kinds of "sponsor" the way the brief predicted. Databricks (1,640 approvals) landed in Likely. Klaviyo (154) was the only Proven.
- Requiring two liveness observations caught a ghost that the repo's own checker passed.
- Routing gaps to **Unresolved**, instead of letting the scorer treat a missing sponsorship term as zero or a missing liveness factor as 1.0, kept three roles from getting a confident wrong answer.

**What it got wrong or missed:**
- The **skip rate is 25%**, below the 50% the scorer calls healthy. The input was hand-picked data-titled postings, so the run measured the recipe more than it triaged a real week.
- **Seniority is invisible.** "Senior" and "Staff" data-science roles reached Consider for an early-career persona. Only the self-rated fit held them down, and B5 shows a different lag assumption flips them to Skip.
- The **timeline gate did not discriminate** (factor 1.0 for everything), as predicted.
- Toast's "Senior Credit Risk Analyst" is arguably a quantitative-analyst title. My patterns silently decided it isn't a data role. A human should see near-misses like this, and the report doesn't show them.

**One concrete next step:** report **near-miss titles** (sponsored titles that match a broad pattern like `analy|quant|insight` but not the strict include list) as a separate, labeled list. The human can then promote them in one edit, and the tier decision stops being silent. After that comes the DOL LCA per-SOC source (Recipe TODO 1), which removes the "top titles only" limit altogether.
