This mode is adapted from my Recipe Design submission (PR #5).

# Worked run — tushar-patel28-swe-h1b-title-opt-window (2026-10-21)

## Executive summary

**What this is.** A record of one day's run of this mode. It shows what went in, every command and its real output, and which parts of each result come from public data and which come from my own definitions.

**Why read it.** It shows what the mode can and cannot establish for an international student deciding where to spend application time. Every number below is pasted from saved output, not retyped from memory.

**What it found.**
- The sample list of 12 job openings, for a fictional student, gave 11 scored openings and 1 rejected for a missing start date. Nine came out "consider" and two "skip". None reached "apply", because applying needs a person's check of government labor-filing records, and none was done.
- The project's own scoring tool, run separately on the same input, gave the same counts.
- One real, public job posting at a company on the list was checked and was live. The sample's openings are invented, so they stay unchecked.
- In three deliberate break attempts, no value was invented. Two showed weaknesses: the tool accepts a work-permit start date that is already in the past without saying so, and a list made only of unknown companies stops with a message that never names the missing company.
- Only 2 of 11 scored openings were skipped, well short of the project's guideline that a healthy run skips at least half.

## 1. Inputs

All inputs are `your-input` except the two public data files.

- **Persona: fictional.** `scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/sample/persona.json`. An invented student ("Ishani Morrow", `ishani.morrow@example.com`): F-1, MS in Software Engineering (STEM-designated), post-completion OPT, graduation 2026-12-18, EAD start 2027-01-22, a 90-day unemployment allowance, and priority order SWE > AI > Cloud. Not a real person.
- **Candidate roles.** `sample/candidate-roles.json` lists 12 roles. The company names are real; the titles, start dates and posting URLs (`jobs.example.com`) are fictional.

  | role_id | Company | Family | start_date |
  |---|---|---|---|
  | databricks-swe | Databricks, Inc. | SWE | 2027-02-08 |
  | stripe-swe | Stripe, Inc. | SWE | 2027-01-11 |
  | toast-swe | Toast, Inc. | SWE | 2027-03-29 |
  | google-swe | Google | SWE | 2027-02-22 |
  | mongodb-swe | MongoDB, Inc. | SWE | TBD |
  | aiera-ai | Aiera, Inc. | AI | 2027-02-01 |
  | anyscale-ai | Anyscale, Inc. | AI | 2027-03-01 |
  | huggingface-ai | Hugging Face, Inc. | AI | 2027-02-01 |
  | datadog-cloud | Datadog, Inc. | Cloud | 2027-02-15 |
  | everquote-cloud | EverQuote, Inc. | Cloud | 2027-03-08 |
  | salesforce-cloud | Salesforce.com, Inc. | Cloud | 2027-02-16 |
  | coherehealth-cloud | Cohere Health, Inc. | Cloud | 2027-05-03 |

- **G4 overrides.** `sample/overrides.json` is empty, because no real labor-filing (LCA) check has been done.
- **Definitions:**
  - `crosswalk.json` maps titles to role families;
  - `mappings.json` holds the tier and p values, fit p, timeline bands and the next-action rule.
- **Public data (`record`):**
  - the 80 Days sponsorship CSV, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`;
  - the BLS compact table, `data/bls/compact/soc_occupation_compact.csv`.
- **Input hashes.** The run report records the first 16 hex characters of each SHA-256:

  | Input | sha256 (prefix) |
  |---|---|
  | csv | `eccdee2addf472b1` |
  | bls | `bac5acf77ca2d252` |
  | persona | `810ced8c1fef7115` |
  | roles | `ee13467af470e0a3` |
  | overrides | `6c8f8f8f69073a37` |
  | crosswalk | `0ec0579f29dc4545` |
  | mappings | `a474aa5b9f8edc41` |

- **Break inputs.** All fictional, and printed in full with each break attempt below. They are in `runs/break/`:
  - `past-ead/persona-past-ead.json`: the sample persona with the EAD start moved to 2025-01-22;
  - `missing-company/roles-missing-company.json`: one role at an invented company;
  - `missing-company-plus-known/roles-missing-company-plus-known.json`: that invented role plus the sample Databricks role.

## 2. Commands and real output

Everything was run from the repository root on branch `mode/tushar-patel28-swe-h1b-opt`, at commit `d70d578` with the uncommitted move to the CONTRIBUTING.md layout. These are re-runs made on 2026-10-22 UTC (still 2026-10-21 local time) after that move. The first runs, earlier on 2026-10-21, are in commit `d70d578`. They gave the same results apart from paths and timestamps, except that the job board listed the same filtered postings in a different order and one more job in total. Each block below is the full contents of one file in `runs/evidence/`: the command line, a `#` note written when it ran, the output, and the exit code. Paths in this section are relative to `course/2026fa/submissions/tushar-patel28/mode-build/`.

### 2.1 The prototype (`evidence/01-prototype-run.txt`)

```text
$ python3 scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/title_sponsor_opt.py --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/
# run at 2026-10-22T00:01:39Z from the repo root, branch mode/tushar-patel28-swe-h1b-opt @ d70d578 (uncommitted working tree)
  ! role 'mongodb-swe': start_date 'TBD' is missing or not a valid YYYY-MM-DD date; no default is used, so this role is not scored
✓ 12 roles · scored 11 · not scored 1 · scorer {'Consider': 9, 'not scored': 1, 'Skip': 2} · final {'Consider': 9, 'not scored': 1, 'Skip': 2} · G4 accepted 0 refused 0 · next actions {'tailor an application': 5, 'network into the company': 4, 'blocked: fix the input and re-run': 1, 'blocked: pick the right company row, then re-run': 1, 'skip': 1}
  report course/2026fa/submissions/tushar-patel28/mode-build/runs/swe-title-sponsor-opt-2026-10-21.md
  log    course/2026fa/submissions/tushar-patel28/mode-build/runs/swe-title-sponsor-opt-2026-10-21.json
[exit 0]
```

### 2.2 The repo scorer on the prototype's `roles.json` (`evidence/02-scorer-on-prototype-roles.txt`)

```text
$ npm run score -- course/2026fa/submissions/tushar-patel28/mode-build/runs/roles.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/
# run at 2026-10-22T00:01:40Z from the repo root

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs course/2026fa/submissions/tushar-patel28/mode-build/runs/roles.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/

✓ scored 11 roles → Apply 0 · Consider 9 · Skip 2 (skip 18%)
  course/2026fa/submissions/tushar-patel28/mode-build/runs/role-scores.json  +  course/2026fa/submissions/tushar-patel28/mode-build/runs/role-scores.md
[exit 0]
```

### 2.3 Finding a real posting (`evidence/03-greenhouse-board-databricks.txt`, excerpt)

This is an excerpt: the file is 174 lines. It shows the command, the run note, the board total, the chosen line (line 79 of the file) and the exit line. The command queried Databricks' public, read-only Greenhouse job-board API and filtered it to SWE and new-grad titles. The board had no SWE new-grad posting, so I took the closest match: a non-senior, US-based Software Engineer role. That choice was a judgment, not a rule (see section 3).

```text
$ curl -sS --max-time 30 https://boards-api.greenhouse.io/v1/boards/databricks/jobs | python3 -c "import json,sys,re; d=json.load(sys.stdin); js=d[\"jobs\"]; print(\"total jobs on board:\", len(js)); [print(j[\"id\"], \"|\", j[\"title\"], \"|\", j[\"location\"][\"name\"], \"|\", j[\"updated_at\"], \"|\", j[\"absolute_url\"]) for j in js if re.search(r\"new grad|university|early career|software engineer\", j[\"title\"], re.I)]"
# run at 2026-10-22T00:01:40Z; public Greenhouse job-board API, read-only; filtered to SWE / new-grad titles
total jobs on board: 897
…
8560779002 | Software Engineer, Web Products | Mountain View, California | 2026-10-06T06:27:56-04:00 | https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002
…
[exit 0]
```

### 2.4 Liveness check on that posting (`evidence/04-liveness-databricks.txt`)

```text
$ npm run ats:liveness -- https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002
# run at 2026-10-22T00:01:41Z; URL taken verbatim from absolute_url of Greenhouse job 8560779002 in 03-greenhouse-board-databricks.txt; Playwright chromium-headless-shell v1234 (installed earlier on 2026-10-21)

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002

Checking 1 URL(s)...

✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002

Results: 1 active  0 expired  0 uncertain
[exit 0]
```

### 2.5 Break A: an EAD start date already in the past (`evidence/05-break-past-ead.txt`)

```text
# break A: OPT/EAD start date already in the past (2025-01-22; run date 2026-10-21). Prediction written before running: no crash, no invented date; every dated role lands >90 days after the EAD start, so G2 gives factor 0 and the scorer gates each one to Skip; the tool does NOT flag the date as past (it has no such check).
# re-run at 2026-10-22T00:01:44Z after the move to the CONTRIBUTING.md layout; the prediction above was written before this break's first run (2026-10-21, before 19:50Z).
$ cat course/2026fa/submissions/tushar-patel28/mode-build/runs/break/past-ead/persona-past-ead.json
{
  "_label": "your-input",
  "_fictional": "BREAK INPUT: the fictional sample persona with ead_start_date moved into the past (today is 2026-10-21). Not a real person.",
  "name": "Ishani Morrow",
  "email": "ishani.morrow@example.com",
  "program": "MS in Software Engineering (STEM-designated)",
  "graduation_date": "2026-12-18",
  "visa_type": "F-1",
  "opt_type": "post-completion OPT, STEM degree",
  "ead_start_date": "2025-01-22",
  "unemployment_allowance_days": 90,
  "priority_order": [
    "SWE",
    "AI",
    "Cloud"
  ]
}
$ python3 scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/title_sponsor_opt.py --persona course/2026fa/submissions/tushar-patel28/mode-build/runs/break/past-ead/persona-past-ead.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/break/past-ead/
  ! role 'mongodb-swe': start_date 'TBD' is missing or not a valid YYYY-MM-DD date; no default is used, so this role is not scored
✓ 12 roles · scored 11 · not scored 1 · scorer {'Skip': 11, 'not scored': 1} · final {'Skip': 11, 'not scored': 1} · G4 accepted 0 refused 0 · next actions {'skip': 10, 'blocked: fix the input and re-run': 1, 'blocked: pick the right company row, then re-run': 1}
  report course/2026fa/submissions/tushar-patel28/mode-build/runs/break/past-ead/swe-title-sponsor-opt-2026-10-21.md
  log    course/2026fa/submissions/tushar-patel28/mode-build/runs/break/past-ead/swe-title-sponsor-opt-2026-10-21.json
[exit 0]
```

### 2.6 Break B: a company that isn't in the data (`evidence/06-break-missing-company.txt`)

```text
# break B: a company that is not in the 80 Days dataset. Prediction written before running: G1 not-found, tier Unknown, no sponsorship vote (p=null, never 0, never "does not sponsor"), next action "network into the company".
# re-run at 2026-10-22T00:01:44Z after the move to the CONTRIBUTING.md layout; the prediction above was written before this break's first run (2026-10-21, before 19:50Z).
$ cat course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company/roles-missing-company.json
{
  "_label": "your-input",
  "_fictional": "BREAK INPUT: one role at a company name invented so it cannot be in the dataset; fictional posting.",
  "roles": [
    {
      "role_id": "missing-co-swe",
      "company": "Zyxwv Quantum Widgets, Inc.",
      "title": "Software Engineer, New Grad",
      "role_family": "SWE",
      "start_date": "2027-02-08",
      "posting_url": "https://jobs.example.com/zyxwv/9001"
    }
  ]
}
$ python3 scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/title_sponsor_opt.py --roles course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company/roles-missing-company.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company/
✗ scorer: no sponsorship term in the scorer output — the weight guard cannot be checked
[exit 3]
```

### 2.7 Break B2: the missing company plus one known company (`evidence/07-break-missing-company-plus-known.txt`)

```text
# break B2 (follow-up to B, which stopped at the weight guard): the invented company plus the sample Databricks role. Prediction written before running: the invented company is G1 not-found -> Unknown, p=null (no vote), next action "network into the company"; Databricks unchanged from the sample run (0.450 Consider).
# re-run at 2026-10-22T00:01:44Z after the move to the CONTRIBUTING.md layout; the prediction above was written before this break's first run (2026-10-21, before 19:50Z).
$ cat course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/roles-missing-company-plus-known.json
{
  "_label": "your-input",
  "_fictional": "BREAK INPUT: the invented company from break B plus the sample Databricks role (unchanged), so the weight guard has one sponsorship term to check. Fictional postings.",
  "roles": [
    {
      "role_id": "missing-co-swe",
      "company": "Zyxwv Quantum Widgets, Inc.",
      "title": "Software Engineer, New Grad",
      "role_family": "SWE",
      "start_date": "2027-02-08",
      "posting_url": "https://jobs.example.com/zyxwv/9001"
    },
    {
      "role_id": "databricks-swe",
      "company": "Databricks, Inc.",
      "title": "Software Engineer, New Grad",
      "role_family": "SWE",
      "start_date": "2027-02-08",
      "posting_url": "https://jobs.example.com/databricks/1001"
    }
  ]
}
$ python3 scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/title_sponsor_opt.py --roles course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/roles-missing-company-plus-known.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/
✓ 2 roles · scored 2 · not scored 0 · scorer {'Consider': 2} · final {'Consider': 2} · G4 accepted 0 refused 0 · next actions {'network into the company': 1, 'tailor an application': 1}
  report course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/swe-title-sponsor-opt-2026-10-21.md
  log    course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/swe-title-sponsor-opt-2026-10-21.json
[exit 0]
```

## 3. Verified vs. inferred

Every label below is copied from today's run report, `runs/swe-title-sponsor-opt-2026-10-21.md`, or from the agent log, `runs/swe-title-sponsor-opt-2026-10-21.json`, except two:
- the liveness result, which is the liveness script's printed output;
- the posting choice, which is the one judgment in this run.

- `record` means the value came from a data file or a script's output, unchanged.
- `your-input` means it is my definition or input, or a value derived from a record by one of my definitions.
- `model-judgment` means it was decided by an AI, not by a rule or a record.

| Output value | This run | Label | Basis |
|---|---|---|---|
| Company match status | 9 matched-h1b · 1 not-found (Google) · 1 no-h1b-trace (Hugging Face) · 1 ambiguous (Salesforce, 2 rows) | record | exact match on the repo's own name normalizer against the 80 Days CSV |
| Matched CSV row | e.g. `DATADOG INC (NEW YORK, NY; row 7258)`, `EVERQUOTE INC (CAMBRIDGE, MA; row 9170)` | record | the row's own name, city and state; the row number counts the header as line 1 |
| Normalized company key | e.g. `datadog`, `salesforcecom` | your-input | my company name, run through the maintained normalizer |
| Top sponsored titles | e.g. Datadog `['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']` | record | the `top_job_titles_sponsored` cell, parsed |
| Role family of each opening | SWE / AI / Cloud | your-input | my candidate-roles file |
| Family check result | in-top-titles 7 · not-in-top-titles 2 · not-applicable 3 | your-input | my crosswalk applied to the record titles; a title match only, nothing about the visa job category (SOC) |
| Days after EAD start, and band | e.g. Databricks 17 (0-60-days-after); Cohere Health 101 (more-than-90-days-after) | your-input | my dates and my band definitions |
| Timeline factor | 1 for 8 roles, 0.5 for 2 (Stripe, Toast), 0 for 1 (Cohere Health) | your-input | my band → factor mapping |
| Liveness factor sent to the scorer | 1, "assumed, not checked", for all 11 scored roles | your-input | an assumption that lets the scorer run; no sample posting was checked |
| Sponsorship tier and p | Likely 0.6 (6) · Possible 0.4 (2) · Unknown, no vote (3) | your-input | my evidence → tier mapping |
| Fit p | SWE 0.8 · AI 0.7 · Cloud 0.6 | your-input | my priority order |
| G4 entries accepted / refused | 0 / 0 | your-input | the overrides file is empty |
| Composite score | 0.000 to 0.450 (per role below) | record | the scorer's arithmetic on the inputs above |
| Scorer recommendation | Consider 9 · Skip 2 · not scored 1; Apply 0 | record | the scorer's output, confirmed by its separate run in 2.2 |
| Skip rate of scored roles | 2/11 (scorer prints "skip 18%") | record | scorer output |
| Shown decision (with the liveness block note) | e.g. "Consider — blocked at G3 until npm run ats:liveness is run by a human" | your-input | my display rule |
| Next action | tailor 5 · network 4 · fix input 1 · pick company row 1 · skip 1 | your-input | my next-action rule |
| Roles in / scored / not scored | 12 / 11 / 1 | your-input / record / record | the input count is mine; the scored counts are the run's |
| BLS median wage per family | e.g. Software Developers (15-1252) $133,080, OEWS 2024 | record (wage) · your-input (family → SOC mapping) | context only: the scorer's role-quality weight is 0, so wages do not enter any score |
| Dataset title coverage | of 1,557 companies with sponsorship data: SWE 511 · AI 86 · Cloud 68 · none 967 | record (1,557) · your-input (family counts) | my crosswalk applied to every company's record titles |
| Liveness of the real Databricks posting 8560779002 | `✅ active` | record | output of `npm run ats:liveness` (2.4) |
| Choice of posting 8560779002 as the closest match to the sample's Databricks role | Software Engineer, Web Products, Mountain View | **model-judgment** | chosen by Claude Code from the filtered board listing (2.3), because the board had no SWE new-grad posting |

No other value in this run is `model-judgment`.

Per-role values, copied from the run report's decision table. Each column header carries that column's label.

| Role | Match `[record]` | Family check `[your-input]` | Days (band) `[your-input]` | Timeline factor `[your-input]` | Tier, p `[your-input]` | Fit p `[your-input]` | Composite `[record]` | Scorer `[record]` | Next action `[your-input]` |
|---|---|---|---|---|---|---|---|---|---|
| databricks-swe | matched-h1b | in-top-titles | 17 (0-60-days-after) | 1 | Likely, 0.6 | 0.8 | 0.450 | Consider | tailor an application |
| stripe-swe | matched-h1b | in-top-titles | −11 (1-30-days-before) | 0.5 | Likely, 0.6 | 0.8 | 0.225 | Consider | tailor an application; negotiate the start date to on or after the EAD start |
| toast-swe | matched-h1b | in-top-titles | 66 (61-90-days-after) | 0.5 | Likely, 0.6 | 0.8 | 0.225 | Consider | tailor an application |
| google-swe | not-found | not-applicable | 31 (0-60-days-after) | 1 | Unknown, no vote | 0.8 | 0.240 | Consider | network into the company |
| mongodb-swe | matched-h1b | in-top-titles | TBD — error | — | — | — | — | not scored | blocked: fix the input and re-run |
| aiera-ai | matched-h1b | in-top-titles | 10 (0-60-days-after) | 1 | Likely, 0.6 | 0.7 | 0.420 | Consider | tailor an application |
| anyscale-ai | matched-h1b | not-in-top-titles | 38 (0-60-days-after) | 1 | Possible, 0.4 | 0.7 | 0.350 | Consider | network into the company |
| huggingface-ai | no-h1b-trace | not-applicable | 10 (0-60-days-after) | 1 | Unknown, no vote | 0.7 | 0.210 | Consider | network into the company |
| datadog-cloud | matched-h1b | not-in-top-titles | 24 (0-60-days-after) | 1 | Possible, 0.4 | 0.6 | 0.320 | Consider | network into the company |
| everquote-cloud | matched-h1b | in-top-titles | 45 (0-60-days-after) | 1 | Likely, 0.6 | 0.6 | 0.390 | Consider | tailor an application |
| salesforce-cloud | ambiguous | not-applicable | 25 (0-60-days-after) | 1 | Unknown, no vote | 0.6 | 0.180 | Skip | blocked: pick the right company row, then re-run |
| coherehealth-cloud | matched-h1b | in-top-titles | 101 (more-than-90-days-after) | 0 | Likely, 0.6 | 0.6 | 0.000 | Skip | skip |

**What no record supports.**
- The visa job category (SOC) a role would be filed under: the CSV has no SOC field.
- Current intent to sponsor: the CSV has no filing years.
- Whether any sample posting is live.
- Approval counts as sizes: they are not used.

## 4. Verification

### Hand-check (by Tushar)

Both rows are in `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, in the `top_job_titles_sponsored` column. The line numbers count the header as line 1.

| Output value to check | Row | What the run report says | What I saw |
|---|---|---|---|
| EverQuote: Cloud family is in the top titles (Likely) | line 9170, `EVERQUOTE INC` (Cambridge, MA) | `['Senior Cloud Engineer I', 'Senior Quantitative Analyst', 'Senior Engineer ', 'Senior Quantitative Analyst (Business) ', 'Product Manager', 'Quantitative Analyst ']`; matched `['Senior Cloud Engineer I']` | Row is EVERQUOTE INC, Cambridge, MA. Header col 20 is top_job_titles_sponsored. Col 20 matches the report exactly, 6 titles in the same order with trailing spaces. The role’s family is Cloud, and “Senior Cloud Engineer I” is in the list, so Likely is correct.|
| Datadog: Cloud family is not in the top titles (Possible) | line 7258, `DATADOG INC` (New York, NY) | `['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']`; matched none | Row is DATADOG INC, New York, NY. Col 20 matches the report exactly, 5 titles in the same order. The role’s family is Cloud, and there’s no Cloud title, so Possible is correct. The SWE titles don’t count because the role targets Cloud.|

## 5. Liveness note

One real, public Databricks posting (Greenhouse job 8560779002) was checked with `npm run ats:liveness` and was **active** on 2026-10-21 (section 2.4). It shows only that the liveness command works on a real posting at a company on the list. Every sample role uses a fictional `jobs.example.com` posting, so the liveness gate stays **closed** for all of them: each is still sent as "assumed, not checked", and every "tailor an application" step is still shown as blocked until a person runs the liveness check on that role's real posting.

## Attestation
- Recipe: tushar-patel28-swe-h1b-title-opt-window v0.3.0. The script's run record prints `tushar-patel28-swe-title-sponsor-opt v0.1.0`; see the known issues below.
- By: Tushar Patel · 2026-10-21. The commands were run by Claude Code at my direction, and the break predictions were written by Claude Code before each run. Hand-check of EverQuote (line 9170) and Datadog (line 7258) done by hand by Tushar, 2026-10-21. Both passed.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| The prototype on the sample inputs (2.1) | `✓ 12 roles · scored 11 · not scored 1 · scorer {'Consider': 9, 'not scored': 1, 'Skip': 2}` … `G4 accepted 0 refused 0`; MongoDB `start_date 'TBD'` rejected by name; exit 0 | Apply 0 · Consider 9 · Skip 2 (11 scored, 1 not scored) |
| `npm run score` on the prototype's `roles.json` (2.2) | `✓ scored 11 roles → Apply 0 · Consider 9 · Skip 2 (skip 18%)`; exit 0 | the scorer accepts the file and gives the same Consider / Skip counts as 2.1 |
| `npm run ats:liveness` on real Databricks posting 8560779002 (2.4) | `✅ active` · `Results: 1 active  0 expired  0 uncertain`; exit 0 | a real status for a real public posting (no particular status expected) |
| **Break A:** EAD start moved to 2025-01-22, a date already past (2.5) | exit 0; Skip 11, not scored 1; next actions skip 10, fix input 1, pick company row 1; no warning that the date is past | no crash, no invented date; every dated role more than 90 days out, so a gated Skip; no past-date flag (no such check exists) — **matched** |
| **Break B:** one role at an invented company (2.6) | `✗ scorer: no sponsorship term in the scorer output — the weight guard cannot be checked`; exit 3; no report | not-found → Unknown, no vote, "network into the company" — **did not match**: the run stopped at the guard, and the message does not name the company |
| The prototype's test suite, `python3 -m unittest discover -s scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/tests -v` (`evidence/08-tests.txt`) | `Ran 40 tests in 1.311s` · `OK`; exit 0 | all 40 offline tests pass, each end-to-end test calling the real scorer |
| `npm run verify` (`evidence/09-npm-verify.txt`) | `conformance: 177 files (89 md · 38 py · 34 js · 12 json · 4 sh)` · `✓ all conform` · `✓ manifest check passed (3 warnings)`; exit 0 | conformance passes on the whole tree, including the script folder and the recipe |
| `npm run doctor` (`evidence/10-npm-doctor.txt`) | `✓ no private/PII paths are tracked` · `open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies` · `environment: ✓ runnable`; exit 0 | no private paths tracked. Doctor counts only top-level `recipes/`, so this recipe, now under `recipes/cases/2026fa/`, is not in its TODO count; its own `todos_open: 2` matches its 2 body markers. |
| `npm run score` on `runs/roles.json` into a temp folder, then `cmp` against `runs/role-scores.json` and `runs/role-scores.md` (`evidence/11-scorer-byte-compare.txt`) | `✓ scored 11 roles → Apply 0 · Consider 9 · Skip 2 (skip 18%)`; both `cmp` commands print nothing and exit 0 | a fresh scorer run on the same input produces byte-identical outputs |
| **Break B2:** invented company plus the sample Databricks role (2.7) | exit 0; Consider 2; next actions network 1, tailor 1. The run report shows the invented company as not-found, Unknown, no vote, composite 0.240, Consider, and Databricks at 0.450, Consider | invented company not-found → Unknown, no vote, "network into the company"; Databricks unchanged at 0.450 Consider — **matched** |

### Did not test
- **Real G4 evidence.** No labor-filing (LCA) record was checked and the overrides file is empty, so the Apply path was not exercised on real data.
- **Liveness of any sample role.** Their postings are fictional; only one real Databricks posting was checked.
- **A list made only of unknown companies.** Whether it can produce a report with a message that names the missing company was not tested. Known, not fixed (break B).
- **A past-date check.** None exists to test, so a past EAD start was accepted silently. Known, not fixed (break A).
- **Whether the skip rate meets the engine's at-least-half guideline.** Only measured: 18% (2/11). Known, not fixed.
- **Role-by-role comparison of the break runs** against the sample run, beyond the counts and the B2 rows quoted above.
- **Whether the matched CSV rows are current**, and which Salesforce row is the right company.
- **Any role list other than the sample**, and any data other than the shipped CSV and BLS table.

### Broke during testing, fixed
Nothing was fixed in this run. These are known, not fixed:
- **Break B's guard message doesn't say the company is missing.** A list whose only company is not in the data stops with exit 3 and "no sponsorship term in the scorer output — the weight guard cannot be checked". The run fails safely, inventing no value, but the message points at the guard, not at the missing company, and no report is written.
- **No past-date check (break A).** An EAD start of 2025-01-22 on a 2026-10-21 run was accepted without a warning. Every role was gated to Skip by the more-than-90-days band, not by any check that the date had already passed.
- **Skip rate 18% (2/11) against the engine's at-least-half guideline.** Most Unknown and Possible roles still reach Consider, for example the invented company in B2 at 0.240 on fit alone.
- **The scorer and the prototype date the same run differently.** The scorer stamps its output with the UTC date and the prototype with the local date. In these re-runs, `role-scores.json` and `role-scores.md` say 2026-10-22, while the prototype's report and log are named and dated 2026-10-21.
- **Recipe name and version in the run record are stale.** The script prints `tushar-patel28-swe-title-sponsor-opt v0.1.0`, while the recipe is `tushar-patel28-swe-h1b-title-opt-window` v0.3.0.

## Reflection

### What went well

Today’s run scored 11 roles: Apply 0, Consider 9, Skip 2. Running the repo’s own npm run score separately gave byte-identical output, so the mode uses the real scorer, not a copy. The liveness checker ran against a real Databricks posting and returned active. My hand-check of two values against the source CSV passed.

### What it got wrong or missed

Break B fails safely, but its message says the weight guard can’t be checked instead of saying the company wasn’t found, and a list of only unknown companies can never produce a report. There’s no check for an OPT/EAD date already in the past (break A); those roles just fall to Skip without a warning. The skip rate was 18%, well under the engine’s guideline that a healthy run skips at least half. The run record prints v0.1.0 while the recipe is v0.3.0. Liveness can’t open the gate for any sample role, because they all use jobs.example.com URLs.

### Next steps

Make break B report “company not found in sponsorship data” by name. Add a past-date check that stops with a clear message. Replace the sample URLs with real postings so the liveness gate is tested on actual inputs.
