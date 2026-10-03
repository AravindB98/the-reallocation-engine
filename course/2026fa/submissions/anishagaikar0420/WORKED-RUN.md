# Worked run — OPT-window countdown (sample)

## Executive summary

This is a real run of the tool on a realistic sample: ten analyst postings at eight real companies from the repository's sponsorship data, plus one made-up company and one posting nobody checked. It recommended applying to three, looking closer at one, and skipping four; it refused to score two because a fact was missing. It also surfaced two problems we did not expect — a keyword rule that is too generous, and a pattern in the source data (every H-1B count is even) that may mean the counts are doubled. The output below is pasted exactly as the terminal printed it.

**Who ran what.** Everything in this file was run by Claude (the AI assistant) in Anisha's session on 2026-09-30, on a Linux sandbox. Anisha's own re-run on her laptop is recorded in the section marked for her at the end. Nothing here claims she ran a command she did not run.

## Inputs

- **Persona** (`scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/examples/profile.persona.json`): MS Information Systems / Business Analytics, F-1, program end **2027-05-15**, requested OPT start **2027-06-01**, 90 unemployment days, run date **2026-09-30**. No name, email, or phone. All values your-input.
- **Roles** (`…/examples/roles.persona.json`): 10 postings. Company names are real rows in the 80-Days CSV (Gusto, Sigma Computing, Figma, Virtusa, Remitly, Site Technologies, Copart, Haus Analytics, Pinterest) plus a fictional "Northwind Insights". **Titles, URLs (ids end in `EXAMPLE`), start dates, fit ratings and liveness results are invented** for the sample and labeled your-input.
- **Repo data**: 80-Days CSV (30,369 rows, sha256 `eccdee2addf4…`), BLS/O*NET compact (1,016 rows, sha256 `bac5acf77ca2…`), 4 Form D sample files (200 companies total).

## Commands and real output

Baseline — the engine's own example through the scorer:

```
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/anishagaikar0420/runs/baseline-ch11

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/anishagaikar0420/runs/baseline-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/anishagaikar0420/runs/baseline-ch11/role-scores.json  +  course/2026fa/submissions/anishagaikar0420/runs/baseline-ch11/role-scores.md
```

The recipe's sample run:

```
$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 3 · Consider 1 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 3 · Consider 1 · Skip 4 (skip 50%)
  scorer: course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/role-scores.md
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-log.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30/opt-countdown-report.md
(exit 0)
```

The scorer's own report for that run (`runs/2026-09-30/role-scores.md`, written by `scripts/score/role-scorer.mjs`):

```
| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Figma — Data Analyst, Product (University Grad) | 0.555 | **Apply** | composite 0.555 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Gusto — Business Intelligence Analyst, New Grad 2027 | 0.525 | **Apply** | composite 0.525 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Sigma Computing, Inc. — Analytics Analyst (2027 start) | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| VIRTUSA CORP — Associate Business Analyst | 0.247 | **Consider** | composite 0.247 in the Consider band [0.2, 0.3) | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 0.5[your-input] |
| Haus Analytics — BI Analyst | 0.180 | **Skip** | composite 0.180 < 0.2 — time is better spent elsewhere | sponsorship 0·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Remitly — Marketing Analytics Analyst (start ASAP) | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.75·0.3 [your-input] × liveness 1[your-input]×timeline 0[your-input] |
| Site Technologies Inc — Business Analyst | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.65·0.3 [your-input] × liveness 1[your-input]×timeline 0[your-input] |
| Copart — Product Analyst | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 0[your-input]×timeline 1[your-input] |
```

The full human report with a next action per role is `runs/2026-09-30/opt-countdown-report.md`; the machine log is `runs/2026-09-30/opt-countdown-log.json`.

## Verified vs. inferred — line by line

| Value in the run | Label | Why that label |
|---|---|---|
| Company matched to a CSV row (all 9 real names matched; the fictional Northwind was not found) | record | exact name equality after suffix stripping |
| H-1B approvals / denials / approval rate per company | record | columns `Total Approvals`, `Total Denials`, `Approval_Rate` |
| Sampled sponsored titles | record | column `top_job_titles_sponsored` (≤ 5 titles) |
| Which titles count as "analyst" | your-input | a keyword list in the profile — this is where the over-match came from |
| Tier (Proven/Likely/Possible/None) and p (0.9/0.6/0.3/0) | your-input rule applied to record counts | **Note:** the scorer prints this term as `[record]`, following the repo's own example; the counts are record, the mapping to p is my rule |
| Funding stage, amount, date | record | context only; the scorer has no funding term |
| Form D sample match (none of 10) | record | 4 sample files only — proves nothing |
| BLS median wage + cognitive pivot score (and "missing" for 15-2059) | record | context only; role_quality weight is 0.0 |
| Program end, OPT start, 90 days, deadline 2027-08-30 | your-input | persona dates; regulatory figures stated, not read from a regulation |
| Posting start dates, hiring lags | your-input | invented for the sample |
| Timeline factors (1 / 0.5 / 0) | your-input (derived) | deterministic arithmetic on the dates above |
| Liveness (active/expired) | your-input | **not checked against the web in this run** |
| Fit ratings | your-input | the student's own rating; no model was asked |
| Composite, Apply/Consider/Skip | script output | `scripts/score/role-scorer.mjs`, arithmetic shown |
| Model judgments | — | none. The prototype calls no model. |

## Verification — how we know the output is real

1. **Hand cross-check against the source CSV.** Pulled the Gusto row directly from the CSV (Python `csv` reader, printing the funding and sponsorship columns):

   ```
   GUSTO INC | 114274414.0 | Series D+ | 2021-07-15 | 218.0 | 4.0 | 98.1981981981982 | 193000.0 | ['Software Engineer', 'Senior Analyst, Marketing Insights & Analytics', 'Software Engineer Manager', 'Business Intelligence Engineer', 'Head of Product Management, Tax Credits']
   ```

   The report says: 218 approvals, 4 denials, 98.2%, Series D+, $114,274,414, 2021-07-15. **Matches.** BLS row for 15-2051.01: `Business Intelligence Analysts 112590.0 3.903` → report says $112,590 and 3.903. **Matches.**
2. **Arithmetic by hand.** Gusto: 0.9 × 0.35 + 0.7 × 0.30 = 0.315 + 0.210 = 0.525, × 1 × 1 = 0.525 → ≥ 0.30 → Apply. Virtusa: (0.315 + 0.18) × 0.5 = 0.2475 → Consider band. Window: 2027-06-01 + 90 days = 2027-08-30. **All match.**
3. **Offline tests:** 11/11 pass (TEST-REPORT.md).
4. **Deliberate breaks** (below): a run date after the deadline, an output folder inside `data/`, and two code mutations.

## Attestation

- Recipe: anishagaikar0420-msis-bi-analyst-opt-countdown v0.1.0
- By: Claude (AI assistant), in Anisha's session · 2026-09-30. *Not a human attestation — the recipe's `attestation` field stays null.*

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `node …/opt-countdown.mjs` (persona) | 10 → Apply 3 · Consider 1 · Skip 4 · blocked 2; exit 0; 5 files written | every role scored or blocked with a reason; skip ≥ ~50% of scored |
| Gusto row vs. CSV, 15-2051.01 vs. BLS file | all values equal | equal |
| **Break:** `--as-of 2027-09-15` | `✗ G0 OPT window already closed…`, exit 3, output folder does not exist | hard stop, nothing written |
| **Break:** `--out-dir data/examples` | `✗ refusing to write into a maintained repo folder`, exit 2 | refuse |
| **Break:** mutated `lib.mjs` so a past-deadline start returns factor 1 instead of 0 | tests 4 and 8 failed (9 pass, 2 fail) | the tests catch it |
| **Break:** mutated company lookup so "not found" returns a match | tests 5 and 8 failed (9 pass, 2 fail) | the tests catch it |
| **Break:** a liveness result labeled `record` with no date (fixture `break-record-without-date`) | `blocked: liveness-undated` | blocked, not trusted |
| `node --test …/opt-countdown.test.mjs` | 11 pass, 0 fail | all pass offline |

### Did not test

- Liveness against real postings — `npm install` failed in the sandbox (registry 403 on `wrap-ansi`), so `ats:liveness` and `ats:scan` never ran here.
- Brand-name vs. legal-name mismatches beyond the fixture (e.g. "Meta" vs. "Meta Platforms, Inc.").
- Real postings, real start dates, real hiring lags — all sample inputs were invented.
- Node 20 specifically (ran on Node 22.22.2). macOS (ran on Linux).
- Whether the even-count pattern is a real double count.
- STEM OPT extension timelines.

### Broke during testing, fixed

- `node --test <folder>` failed on Node 22 (it treats a folder as a module path). Changed the documented test command to the test file.
- The even-count summary said "8 of 9" because the denominator counted a company with no approvals. Fixed in `opt-countdown.mjs` to count only companies with approval numbers → "8 of 8".
- The decision table showed "0 approvals / 0 denials" for Haus Analytics, whose counts are *empty*, not zero. Fixed to print "no approvals on record" — an empty cell must not look like a recorded zero.
- Pasting the full `pii-scan` output into TEST-REPORT.md copied a pre-existing npm author email from `package-lock.json` into our own file, and `pii-scan --diff` then flagged **our** report. Redacted the address in TEST-REPORT.md and re-cut the branch history so the address never appears in a commit on this branch.
- The first report had no gate column for liveness, so the expired Copart posting looked like a Skip with an "open" timeline and no reason. Added "liveness · timeline" to the decision table.

## Reflection

**What worked.** The gates behave as gates: an expired posting, an ASAP start, and an October start all went to zero regardless of strong sponsorship, and the two roles with missing facts were held out of the scorer instead of being scored as zeros. Using the real scorer as a child process meant every decision carries the repo's own audit trail.

**What it got wrong or missed.**
- The analyst keyword rule is too generous: Gusto, Sigma and Figma reached *Proven* partly on "Business Intelligence Engineer", "Senior Analytics Engineer" and "Data Scientist, Product Analytics". The report says "Proven" with no warning. A student would likely trust it.
- It cannot tell whether the H-1B counts are doubled. Every count in the dataset is even.
- The scorer labels the sponsorship term `[record]`, but the 0.9 is my rule applied to a record. The report says so; the scorer's own table does not.
- For "ASAP" roles the report prints "slack 90 days" beside "closed" — correct arithmetic, confusing to read.
- Liveness wasn't checked, so the three Apply rows are not yet safe to act on.

**One concrete next improvement.** Require the token "analyst" (or standalone "BI") in a sampled title before it counts toward *Proven*, and add a fixture row with only "Senior Analytics Engineer" that must tier as *Likely*. (Proposed addition 1 in the recipe.) → **Done in v0.1.1, below.** The next improvement after that is proposed addition 2: per-SOC sponsorship counts from DOL LCA files, so "sponsors analysts" stops being a keyword match on five titles.

## Anisha's re-run on her Mac (2026-10-02)

- **Machine:** MacBook Air, macOS 26.2, Node v26.9.0, Python 3.14.7, in `~/Desktop/the-reallocation-engine` on branch `contrib/2026fa-anishagaikar0420-msis-bi-analyst-opt-countdown`.
- **Commands I ran:** `npm install`, `npm run doctor`, `npm run verify`, the test command, the run command and `node scripts/pii-scan.mjs`. The real output of each is pasted in TEST-REPORT.md → "Student's re-run on her Mac". Results: tests 11/11, run `Apply 3 · Consider 1 · Skip 4 · blocked 2` (v0.1.0), identical to the sandbox.
- **Hand check against the CSV:**

  ```
  $ grep "^FIGMA INC," data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
  (row printed; phone and people's names left out here. Relevant fields:)
  latest_funding_stage = Series D+, latest_funding_date = 2024-05-15,
  Total Approvals = 188.0, Total Denials = 2.0, Approval_Rate = 98.947…
  top_job_titles_sponsored = ['Software Engineer', 'Account Manager, Enterprise',
    'Software Engineer - Infrastructure', 'Motion Designer, Brand Studio',
    'Data Scientist, Product Analytics']
  ```

  The report said 188 approvals, 2 denials, 98.9%, Series D+, 2024-05-15. **All five values match.** None of Figma's five sampled titles is an analyst job; its v0.1.0 "Proven" tier came only from the word "Analytics" in a data-scientist title.

  I was surprised. I had assumed "Proven" meant Figma had a record of sponsoring analysts, but none of the five sampled titles was an analyst job.

- **Something I tried to break:** I set the run date after my unemployment deadline.

  ```
  $ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs --as-of 2027-09-15
  ✗ G0 OPT window already closed: run date 2027-09-15 is after the 90-day unemployment deadline 2027-08-30. This recipe cannot help; talk to your DSO today.
  ```

  It refused at the first gate instead of producing a report.

## Revision v0.1.1 — the analyst-title fix

**Why.** The Figma hand check above confirmed the over-match from the Reflection: a "Proven" analyst sponsor whose sampled titles contain no analyst.

**What changed** (`lib.mjs` → `sponsorshipTier`). A sampled title now counts as analyst evidence only if it contains one of the analyst keywords **and** the word "analyst" or "BI". New test: `v0.1.1: an engineer or data-scientist title alone does not make a company Proven for analysts`. Output folder now includes the version (`runs/2026-09-30-v0.1.1/`), so the v0.1.0 evidence in `runs/2026-09-30/` is kept, not overwritten.

**Who did it.** Code, test and this section were written by Claude at Anisha's request on 2026-10-02. Run below was in the sandbox; Anisha's Mac run is under it.

```
$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
# tests 12
# pass 12
# fail 0

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 1 · Consider 3 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 1 · Consider 3 · Skip 4 (skip 50%)
  scorer: course/2026fa/submissions/anishagaikar0420/runs/2026-09-30-v0.1.1/role-scores.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30-v0.1.1/role-scores.md
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30-v0.1.1/opt-countdown-log.json  +  course/2026fa/submissions/anishagaikar0420/runs/2026-09-30-v0.1.1/opt-countdown-report.md
```

**What moved, and why** (from `runs/2026-09-30-v0.1.1/role-scores.md`):

| Role | v0.1.0 | v0.1.1 | Reason |
|---|---|---|---|
| Figma — Data Analyst | Apply 0.555 | **Consider 0.450** | only "Data Scientist, Product Analytics" matched before → now no analyst title → tier Likely (p 0.6); the scorer demotes a Likely tier to Consider |
| Sigma — Analytics Analyst | Apply 0.465 | **Consider 0.360** | only "Senior Analytics Engineer" matched before → Likely |
| Gusto — BI Analyst | Apply 0.525 | Apply 0.525 | "Senior Analyst, Marketing Insights & Analytics" is a real analyst title → still Proven |
| all others | — | unchanged | |

Arithmetic, Figma: (0.6 × 0.35 + 0.8 × 0.30) × 1 × 1 = 0.21 + 0.24 = 0.45 → above 0.30, but tier "Likely" is a soft spot → Consider.

**Mutation check.** Removing the new `analyst`/`BI` condition makes the new test fail (`# pass 11`, `# fail 1`); restoring it gives `# pass 12`, `# fail 0`.

**Still not fixed by this:** the rule still looks at five sampled titles, and approval counts are still company-wide. That is proposed addition 2.

**Anisha's Mac run of v0.1.1 (2026-10-02):**

```
$ node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs
✔ v0.1.1: an engineer or data-scientist title alone does not make a company Proven for analysts (0.060292ms)
ℹ tests 12
ℹ pass 12
ℹ fail 0

$ node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs
✓ OPT window 2027-06-01 → 2027-08-30 (run date 2026-09-30, 244 days until OPT start)
✓ evaluated 10 roles → Apply 1 · Consider 3 · Skip 4 · blocked 2
  scorer: ✓ scored 8 roles → Apply 1 · Consider 3 · Skip 4 (skip 50%)
  ⛔ pinterest-data-analyst-unchecked: blocked (liveness-unchecked)
  ⛔ northwind-bi-not-in-csv: blocked (company-not-found)
```

Same as the sandbox run.

## Attestation — Anisha

- Recipe: anishagaikar0420-msis-bi-analyst-opt-countdown v0.1.1
- By: Anisha Gaikar · 2026-10-02

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run doctor` on my Mac | `environment: ✓ runnable`, no private paths tracked | runnable |
| `npm run verify` (first try) | `ModuleNotFoundError: No module named 'yaml'` | pass |
| `npm run verify` (after installing PyYAML by hand) | `✓ all conform`, `✓ manifest check passed (3 warnings)` | pass |
| tests, v0.1.0 | 11 pass, 0 fail | all pass |
| run, v0.1.0 | Apply 3 · Consider 1 · Skip 4 · blocked 2 | same as sandbox |
| `node scripts/pii-scan.mjs` | 1 finding, in `package-lock.json` (upstream, not mine) | nothing in my folders |
| Figma row: `grep "^FIGMA INC," …` vs report | 188 / 2 / 98.9% / Series D+ / 2024-05-15 all match | match |
| tests, v0.1.1 | 12 pass, 0 fail | 12 pass, 0 fail |
| run, v0.1.1 | Apply 1 · Consider 3 · Skip 4 · blocked 2 | Apply 1 · Consider 3 · Skip 4 · blocked 2 |
| **Break:** `--as-of 2027-09-15` | `✗ G0 OPT window already closed: run date 2027-09-15 is after the 90-day unemployment deadline 2027-08-30` | `✗ G0 OPT window already closed`, nothing written |

### Did not test

- Live liveness against real postings, unless I add the `ats:liveness` output below.
- Real postings, start dates or hiring lags. All 10 sample roles are invented except the company names.
- Whether the even H-1B counts are a real double count.
- Brand-name vs legal-name mismatches (e.g. "Meta").
- STEM OPT extension timelines.

### Broke during testing, fixed

- `npm run verify` failed on my Mac: no PyYAML. `pip` was refused, then crashed reading macOS 26.2's version. Fixed by copying PyYAML 6.0.2's pure-Python source into my user site-packages.
- v0.1.0's analyst-title rule rated Figma and Sigma "Proven" from non-analyst titles. Fixed in v0.1.1 (see above).
