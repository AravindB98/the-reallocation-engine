# Worked Run -- ghost-job-radar (Mode Build)

## Executive summary

This document records one real test of the ghost-job-radar mode on 2026-10-19, with the actual terminal output pasted in. The mode is for an international master's student looking for data analyst jobs: it checks whether a posting is still open and whether there is enough time left on the student's work authorization before looking at the company's visa-sponsorship history. The test used one public Stripe posting, "Data Analyst, NYC", from a company listed in the 80 Days to Stay data. The open posting passed both checks and the repository's scorer put it in its top bucket (composite 0.525). A made-up job number on the same board was stopped at the first check. The test also found two real weaknesses in the liveness tool (it calls a removed job "uncertain", and it cannot say "unsupported site"), and three things broke along the way. The honest status is sample-run level: one company, one day, with a person carrying one result between steps by hand.

## Inputs

- Company: STRIPE INC (one row in `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; chosen because it is in the 80 Days data with sponsorship history and has a public Greenhouse board with an open data-analyst posting, from a search of the 400 companies in that file with the most approvals).
- Posting: "Data Analyst, NYC", Greenhouse job 8189909, `https://job-boards.greenhouse.io/stripe/jobs/8189909`.
- Break-test posting: made-up id 1111111111 on the same board.
- Unsupported-site URL: `https://example.com/careers/data-analyst`.
- CPT/program end date 2027-05-15 and hiring lag 6 weeks: the same fictional values used in the earlier worked run, not real personal dates.
- Fit: default 0.7 (model-judgment).
- Public data only. Nothing from `private/` or `data/ats/` was read. Raw outputs: `assignments/submissions/dmehta1310/evidence/2026-10-19/` (home-directory paths in them are replaced with `~`). The evidence folder was moved here from `course/2026fa/submissions/dmehta1310/evidence/` after the run, so the `--out` paths inside the pasted commands below still show the old location; they are left unedited because they record the commands as run.

## Commands and real output

Each block below is the saved evidence file, pasted unedited (apart from the privacy replacement noted at the top of each file).

### 1. Posting discovery: `ats:scan` dry run (from a scratch directory, public portals file)

The scan's default files live under `data/ats/` (private), so it was run from an empty scratch directory with `REALLOCATION_ENGINE_PORTALS` pointing to a public file. This is `node scripts/ats/scan.mjs --dry-run`, the command `npm run ats:scan -- --dry-run` wraps, not the `npm run` form itself.

Portals file used:

```text
# Public-only portals file for the evidence run (no private data).
title_filter:
  positive:
    - "Data Analyst"
  negative:
    - "Intern"
location_filter:
  always_allow:
    - "United States"
    - "New York"
tracked_companies:
  - name: Stripe
    enabled: true
    provider: greenhouse
    careers_url: https://job-boards.greenhouse.io/stripe
```

Run:

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output. The scratch-directory path is shown as <scratch-dir>.
# date: 2026-10-19T23:52:03Z (local 2026-10-19)
# cwd: <scratch-dir>/scan-cwd
# command: REALLOCATION_ENGINE_PORTALS=<scratch-dir>/portals.yml node ~/Documents/the-reallocation-engine/scripts/ats/scan.mjs --dry-run
# ---- output ----
Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      726
Filtered by title:     721 removed
Filtered by location:  0 removed
Duplicates:            0 skipped
New offers added:      5

New offers:
  + Stripe | Data Analyst | Canada
  + Stripe | Data Analyst, Global Growth | Singapore
  + Stripe | Data Analyst, NYC  | New York
  + Stripe | Data Analyst, Payments | Singapore
  + Stripe | Staff Data Analyst | US

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
# ---- exit code: 0 ----
```

### 2. Playwright browser (first liveness attempt failed)

All three liveness commands first failed because the installed Playwright had no matching Chromium. First attempt (the live-posting URL; the other two were identical apart from the URL, files `04b-...attempt1-no-browser.txt` and `04c-...attempt1-no-browser.txt`):

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:52:11Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/8189909
# ---- output ----

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/stripe/jobs/8189909

Checking 1 URL(s)...

Fatal: browserType.launch: Executable doesn't exist at ~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
# ---- exit code: 1 ----
```

Fix (progress-bar lines between 0% and 100% omitted here; the full file is in the evidence folder):

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:52:20Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npx playwright install chromium
# ---- output ----
Downloading Chrome for Testing 151.0.7922.34 (playwright chromium v1234)[2m from https://cdn.playwright.dev/builds/cft/151.0.7922.34/mac-arm64/chrome-mac-arm64.zip[22m
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% of 178.7 MiB
Chrome for Testing 151.0.7922.34 (playwright chromium v1234) downloaded to ~/Library/Caches/ms-playwright/chromium-1234
Downloading Chrome Headless Shell 151.0.7922.34 (playwright chromium-headless-shell v1234)[2m from https://cdn.playwright.dev/builds/cft/151.0.7922.34/mac-arm64/chrome-headless-shell-mac-arm64.zip[22m
|■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■| 100% of 94.7 MiB
Chrome Headless Shell 151.0.7922.34 (playwright chromium-headless-shell v1234) downloaded to ~/Library/Caches/ms-playwright/chromium_headless_shell-1234
# ---- exit code: 0 ----
```

### 3a. Liveness: open posting

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:52:39Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/8189909
# ---- output ----

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/stripe/jobs/8189909

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/stripe/jobs/8189909

Results: 1 active  0 expired  0 uncertain
# ---- exit code: 0 ----
```

### 3b. Liveness: made-up id on the same board (break test)

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:52:47Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1111111111
# ---- output ----

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/stripe/jobs/1111111111

Checking 1 URL(s)...

⚠️ uncertain  https://job-boards.greenhouse.io/stripe/jobs/1111111111
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
# ---- exit code: 1 ----
```

### 3c. Liveness: a URL from a site the tool does not support (break test)

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:52:51Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run ats:liveness -- https://example.com/careers/data-analyst
# ---- output ----

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://example.com/careers/data-analyst

Checking 1 URL(s)...

❌ expired    https://example.com/careers/data-analyst
           HTTP 404

Results: 0 active  1 expired  0 uncertain
# ---- exit code: 1 ----
```

### 3d. Cross-check with the board's public API

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:02Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: for id in 8189909 1111111111; do echo "job $id:"; curl -s -o /dev/null -w "  HTTP %{http_code}\n" https://boards-api.greenhouse.io/v1/boards/stripe/jobs/$id; done; curl -s https://boards-api.greenhouse.io/v1/boards/stripe/jobs/8189909 | python3 -I -c "import json,sys;d=json.load(sys.stdin);print(\"  title:\",d[\"title\"],\"| updated_at:\",d[\"updated_at\"])"
# ---- output ----
job 8189909:
  HTTP 200
job 1111111111:
  HTTP 404
  title: Data Analyst, NYC  | updated_at: 2026-10-07T19:02:27-04:00
# ---- exit code: 0 ----
```

### 4. Timeline gate

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:03Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2027-05-15 --lag-weeks 6
# ---- output ----
{
  "gate": "cpt_program_timeline",
  "result": "pass",
  "today": {
    "value": "2026-10-19",
    "source": "system-clock"
  },
  "cpt_program_end_date": {
    "value": "2027-05-15",
    "source": "your-input"
  },
  "hiring_lag_weeks": {
    "value": 6,
    "source": "your-input"
  },
  "projected_hire_date": {
    "value": "2026-11-30",
    "source": "script-computed"
  },
  "days_of_margin": 166,
  "note": "This gate checks arithmetic compatibility only. It cannot verify that the hiring-lag estimate is realistic for this company -- that is a human judgment call per Phase Gate 2 of the recipe."
}
# ---- exit code: 0 ----
```

### 5. Build labeled roles file: open posting

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:11Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company 'STRIPE INC' --title 'Data Analyst, NYC' --role-id stripe-data-analyst-nyc --liveness-result live --timeline-result pass --out course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-live.json && cat course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-live.json
# ---- output ----
{
  "role_id": "stripe-data-analyst-nyc",
  "company": "STRIPE INC",
  "title": "Data Analyst, NYC",
  "sponsorship": {
    "p": 0.9,
    "tier": "Proven",
    "source": "record"
  },
  "fit": {
    "p": 0.7,
    "source": "model-judgment"
  },
  "liveness": {
    "factor": 1.0,
    "source": "record"
  },
  "timeline": {
    "factor": 1.0,
    "source": "record"
  },
  "funding_context": {
    "total_funding": "9596970797.0",
    "latest_funding_stage": "Series D+",
    "latest_funding_date": "2024-04-08",
    "note": "From the 80-days-to-stay mapped sample CSV.",
    "source": "record"
  },
  "company_found_in_sample": true
}
[
  {
    "role_id": "stripe-data-analyst-nyc",
    "company": "STRIPE INC",
    "title": "Data Analyst, NYC",
    "sponsorship": {
      "p": 0.9,
      "tier": "Proven",
      "source": "record"
    },
    "fit": {
      "p": 0.7,
      "source": "model-judgment"
    },
    "liveness": {
      "factor": 1.0,
      "source": "record"
    },
    "timeline": {
      "factor": 1.0,
      "source": "record"
    },
    "funding_context": {
      "total_funding": "9596970797.0",
      "latest_funding_stage": "Series D+",
      "latest_funding_date": "2024-04-08",
      "note": "From the 80-days-to-stay mapped sample CSV.",
      "source": "record"
    },
    "company_found_in_sample": true
  }
]# ---- exit code: 0 ----
```

### 6. Build labeled roles file: made-up id (deliberate break test; liveness typed as `unknown` because 3b returned `uncertain`)

**Deliberate break test.** In normal use the mode stops at the liveness gate (3b was `uncertain`) and produces no scorer bucket. This step intentionally ran past the gate, with liveness recorded as `unknown` (factor 0.0), only to check that the scorer also closes the gate (composite 0.000).

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:11Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company 'STRIPE INC' --title 'Data Analyst (made-up id 1111111111)' --role-id stripe-madeup-1111111111 --liveness-result unknown --timeline-result pass --out course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-uncertain.json && cat course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-uncertain.json
# ---- output ----
{
  "role_id": "stripe-madeup-1111111111",
  "company": "STRIPE INC",
  "title": "Data Analyst (made-up id 1111111111)",
  "sponsorship": {
    "p": 0.9,
    "tier": "Proven",
    "source": "record"
  },
  "fit": {
    "p": 0.7,
    "source": "model-judgment"
  },
  "liveness": {
    "factor": 0.0,
    "source": "record"
  },
  "timeline": {
    "factor": 1.0,
    "source": "record"
  },
  "funding_context": {
    "total_funding": "9596970797.0",
    "latest_funding_stage": "Series D+",
    "latest_funding_date": "2024-04-08",
    "note": "From the 80-days-to-stay mapped sample CSV.",
    "source": "record"
  },
  "company_found_in_sample": true
}
[
  {
    "role_id": "stripe-madeup-1111111111",
    "company": "STRIPE INC",
    "title": "Data Analyst (made-up id 1111111111)",
    "sponsorship": {
      "p": 0.9,
      "tier": "Proven",
      "source": "record"
    },
    "fit": {
      "p": 0.7,
      "source": "model-judgment"
    },
    "liveness": {
      "factor": 0.0,
      "source": "record"
    },
    "timeline": {
      "factor": 1.0,
      "source": "record"
    },
    "funding_context": {
      "total_funding": "9596970797.0",
      "latest_funding_stage": "Series D+",
      "latest_funding_date": "2024-04-08",
      "note": "From the 80-days-to-stay mapped sample CSV.",
      "source": "record"
    },
    "company_found_in_sample": true
  }
]# ---- exit code: 0 ----
```

### 7. SOC lookup in the repository's BLS/O*NET data

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:19Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: python3 -I - <<'PY'
import csv
for r in csv.DictReader(open('data/bls/compact/soc_occupation_compact.csv',encoding='utf-8')):
    if r['onet_soc_code'] in ('15-2051.00','15-2051.01'):
        print(r['onet_soc_code'], '|', r['title'], '| BLS SOC', r['bls_soc_code'], '| job_zone', r['job_zone'], '| OEWS year', r['oews_year'])
        print('   employment', r['employment'], '| annual_median_wage', r['annual_median_wage'], '| cognitive_pivot_score', r.get('cognitive_pivot_score'))
        print('   alternate_titles_sample:', r['alternate_titles_sample'][:200])
PY
echo; echo 'source file: data/bls/compact/soc_occupation_compact.csv (data/bls/BLS-audit.md describes it; sha256 in audit)'
# ---- output ----
15-2051.00 | Data Scientists | BLS SOC 15-2051 | job_zone 4 | OEWS year 2024
   employment 233440.0 | annual_median_wage 112590.0 | cognitive_pivot_score 
   alternate_titles_sample: Analytics Consultant; Applied Scientist; Data Analyst; Data Analytic Scientist; Data Analytics Manager; Data Analytics Scientist; Data Analytics Specialist; Data Architect
15-2051.01 | Business Intelligence Analysts | BLS SOC 15-2051 | job_zone 4 | OEWS year 2024
   employment 233440.0 | annual_median_wage 112590.0 | cognitive_pivot_score 3.903
   alternate_titles_sample: Analytical Data Miner; Business Analyst; Business Consultant; Business Data Analyst; Business Database Analyst; Business Information Analyst; Business Intelligence Analyst (BI Analyst); Business Intel

source file: data/bls/compact/soc_occupation_compact.csv (data/bls/BLS-audit.md describes it; sha256 in audit)
# ---- exit code: 0 ----
```

### 8. Scorer: open posting

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:19Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run score -- course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-live.json --out-dir course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live --md course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live/role-scores.md && cat course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live/role-scores.md
# ---- output ----

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-live.json --out-dir course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live --md course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live/role-scores.md

✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live/role-scores.json  +  course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-live/role-scores.md
# Role Scorer report — 2026-10-19

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 1 roles → Apply 1 · Consider 0 · Skip 0. **Skip rate 0%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| STRIPE INC — Data Analyst, NYC | 0.525 | **Apply** | composite 0.525 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 1[record] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
# ---- exit code: 0 ----
```

### 9. Scorer: made-up id (deliberate break test, past the gate on purpose)

**Deliberate break test.** In normal use the mode stops at the liveness gate (3b was `uncertain`) and produces no scorer bucket. This step intentionally ran past the gate, with liveness recorded as `unknown` (factor 0.0), only to check that the scorer also closes the gate (composite 0.000).

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-19T23:53:20Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: npm run score -- course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-uncertain.json --out-dir course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain --md course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain/role-scores.md && cat course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain/role-scores.md
# ---- output ----

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs course/2026fa/submissions/dmehta1310/evidence/2026-10-19/roles-stripe-uncertain.json --out-dir course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain --md course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain/role-scores.md

✓ scored 1 roles → Apply 0 · Consider 0 · Skip 1 (skip 100%)
  course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain/role-scores.json  +  course/2026fa/submissions/dmehta1310/evidence/2026-10-19/score-uncertain/role-scores.md
# Role Scorer report — 2026-10-19

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 1 roles → Apply 0 · Consider 0 · Skip 1. **Skip rate 100%** (healthy — a good run skips at least half).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| STRIPE INC — Data Analyst (made-up id 1111111111) | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 0[record]×timeline 1[record] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
# ---- exit code: 0 ----
```

### 10. Count check of the Stripe row against the CSV

```text
# NOTE: home-directory path replaced with ~ for privacy; scratch path shown as <scratch-dir>. Only the columns used by the run are printed (officer names and phone columns of the CSV row are deliberately not shown).
# date: 2026-10-19T23:57:40Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: grep -c '^STRIPE INC,' data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv; python3 -I <scratch-dir>/stripe_cols.py data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
# ---- output ----
1
company_name = STRIPE INC
total_funding = 9596970797.0
latest_funding_stage = Series D+
latest_funding_date = 2024-04-08
Total Approvals = 1250.0
Total Denials = 22.0
Approval_Rate = 98.27044025157232
# ---- exit code: 0 ----
```

### 11. Unit tests, run exactly as the README says

Saved as `evidence/2026-10-19/05-unit-tests.txt`:

```text
# NOTE: home-directory path replaced with ~ for privacy; all other text is raw output.
# date: 2026-10-20T00:02:32Z (local 2026-10-19)
# cwd: ~/Documents/the-reallocation-engine
# command: python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_timeline_gate.py; python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_build_roles_json.py
# ---- output ----
......
----------------------------------------------------------------------
Ran 6 tests in 0.002s

OK
..........
----------------------------------------------------------------------
Ran 10 tests in 0.002s

OK
# ---- exit code: 0 ----
```

## Verified vs. inferred

| Line | Status | Basis |
|---|---|---|
| Posting 8189909 returned `active` at 2026-10-19T23:52:39Z | Verified | Liveness run 3a, exit 0; API returned HTTP 200 and `updated_at` 2026-10-07 (3d) |
| Made-up id 1111111111 is not an open posting | Verified | Liveness 3b was not `active`; API returned HTTP 404 (3d) |
| The tool called the made-up id `uncertain`, not "removed" | Verified | Output of 3b |
| `example.com` URL returned `expired`, "HTTP 404" | Verified (output only) | 3c. This is not a statement about any job board: the tool has no "unsupported" state |
| Stripe row: 1,250 approvals, 22 denials, 98.27% rate, total funding 9,596,970,797.0, Series D+, 2024-04-08 | Verified | Count check: exactly 1 row begins `STRIPE INC,`; columns printed (section 10) |
| Sponsorship p 0.9, tier "Proven" | Script-computed from the company-level record | `build_roles_json.py` output (5). I did not independently check how the script maps approvals to the tier; this is a company-level historical figure, not role-level |
| Timeline pass, 166 days margin, projected hire 2026-11-30 | Script-computed from your-input | `timeline_gate.py` (4); the two dates are the student's input |
| Liveness factor 1.0 (open) and 0.0 (made-up) | Typed by hand from liveness runs | `--liveness-result live` and `unknown` were typed by me; no code links 3a/3b to the roles file |
| Fit 0.7 | Model-judgment | Default in `build_roles_json.py`; no record behind it |
| Composite 0.525 | Verified by hand | 0.9 x 0.35 + 0.7 x 0.3 = 0.315 + 0.21 = 0.525; times liveness 1 and timeline 1 |
| Composite 0.000 for the made-up id | Verified by hand (deliberate break test; normal use stops at the gate) | Votes times liveness 0 = 0 |
| Scorer bucket "Apply" / "Skip" | Scorer output | Unmodified `role-scorer.mjs`. A scorer bucket, not advice: `role_quality` weight is 0 and `fit` is a default |
| SOC 15-2051 as the closest match for data analyst | Verified present; judgment on closeness | Rows 15-2051.00 and 15-2051.01 in `soc_occupation_compact.csv` list "Data Analyst" as an alternate title; there is no exact "Data Analyst" title. The scorer does not read it |

## Verification

- Independent API check: the board's public API gave HTTP 200 for the open posting and 404 for the made-up id (3d).
- Count check: `grep -c '^STRIPE INC,'` returned 1, and the printed columns match the values in `roles-stripe-live.json` (section 10).
- JSON parse: `python3 -m json.tool` succeeded on `roles-stripe-live.json`, `roles-stripe-uncertain.json`, and both `role-scores.json` files.
- Hand arithmetic: composite recomputed (table above).
- Unit tests re-run: 6 and 10 passed (section 11, saved as 05-unit-tests.txt).
- Not repeated: each liveness command succeeded once (after the browser fix); I did not run them twice to see whether results were stable.
- Deliberate break attempts: 3b and 3c, below in the attestation.

## Reflection

**What went well.** The gate structure worked: the open posting passed, and the made-up id was stopped at the liveness gate (the deliberate break test past the gate confirmed the scorer also zeroes it). Every step used an existing script or one of my two scripts; the scorer was unmodified. The API cross-check gave a definite answer where the liveness tool did not. Running the scan from a scratch directory kept all private files out of the run.

**What the mode got wrong or missed.**
- The liveness tool does not say "removed" for a Greenhouse job; it says `uncertain`. My earlier recipe text said the tool recognizes a fixed list of job sites and returns "unknown" for others. Today's run did not show that: `example.com` came back `expired`. I corrected the recipe and card.
- The sponsorship number is company-level and historical. A reader could take 0.9 as a probability for this role.
- The chain is manual: I typed the liveness result into the roles builder and chose how to map `uncertain`.
- The occupation code is not used by the scorer at all, so the role-quality layer did nothing.
- One company, one day. Nothing here shows the mode works across boards or over time.

**Next steps.** Build the four proposed additions in the recipe (API status check, unsupported-site state, SOC into `role_quality` with the maintainer, a chaining command); run it on a Lever board and on a partial-name company match; have a named human clear both gates on a real posting and log it, which is what moving beyond sample level requires.

## Attestation
- Recipe: ghost-job-radar v0.2.0
- By: Dhruvi Mehta · 2026-10-19

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/8189909` (3a) | `active`, exit 0; API HTTP 200 | `active` for an open posting |
| **Break attempt:** `npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1111111111` (3b, made-up id on the same board) | `uncertain` ("content present but no visible apply control found"), exit 1; API HTTP 404 | Not `active`; ideally a definite "removed". Got a non-active result, but not the definite one |
| **Break attempt:** `npm run ats:liveness -- https://example.com/careers/data-analyst` (3c, a site the tool does not support) | `expired`, "HTTP 404", exit 1 | A non-`active` result, ideally an explicit "unsupported". Got a verdict-style label instead |
| `timeline_gate.py --end-date 2027-05-15 --lag-weeks 6` | `pass`, 166 days margin | `pass` for a window this long |
| `build_roles_json.py --company 'STRIPE INC' ... --liveness-result live --timeline-result pass` | sponsorship p 0.9 "Proven", funding fields match the CSV columns | Values equal to the CSV row |
| **Break test:** `build_roles_json.py ... --liveness-result unknown` then `npm run score` (deliberately run past the liveness gate to check the scorer also closes it; in normal use the mode stops at the gate and produces no scorer bucket) | liveness factor 0.0; composite 0.000; scorer bucket Skip | A closed gate zeroes the composite |
| `npm run score` on the open-posting roles file | composite 0.525; scorer bucket Apply; skip rate 0% | 0.9 x 0.35 + 0.7 x 0.3 = 0.525 |
| `grep -c '^STRIPE INC,'` and column print | 1 row; values match | Exactly one row, same values |
| Unit tests for both scripts | 6 and 10 pass | All pass |

### Did not test
- A named human clearing both gates on a real posting with a logged decision (so the recipe is not RUNNABLE-LIVE).
- A Lever or Ashby board, or a Greenhouse job on a company-branded URL such as `stripe.com/jobs/search?gh_jid=...`.
- A company name with a partial or near match to a CSV row.
- A failed timeline gate with an open posting, end to end through the scorer.
- Whether the liveness results are stable across repeated runs.
- How the roles builder maps approvals to the "Proven" tier.
- `ats:scan` without `--dry-run`, or with a real (private) portals file.

### Broke during testing, fixed
- **Hooks permission:** the two scripts in `.claude/hooks/` were not executable. Fixed with `chmod +x` and `git config core.fileMode false` so the mode change is not a diff. The archive-guard hook then correctly blocked one of my own `rm` commands in a later step; I re-ran without it.
- **Missing Playwright Chromium:** all three liveness commands failed. Fixed with `npx playwright install chromium` (download to the user cache, outside the repository); first-attempt outputs are kept in the evidence folder.
- **`ats:scan` reads private files:** by default it reads `data/ats/portals.yml` and history files. Fixed by running it from an empty scratch directory with a public portals file.
- **Evidence showed more than needed:** my first count check printed officer names and a phone number from the CSV row. I re-ran it to print only the columns used and replaced the file.
