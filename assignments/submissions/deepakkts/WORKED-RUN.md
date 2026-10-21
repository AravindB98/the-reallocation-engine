# Worked Run: case-aiml-cognitive-floor v0.1.0, 2026-10-21

## Executive summary

This document is the record of running the AI/ML cognitive-floor mode on a real
scenario: an international student finishing a master's degree in December
2026 who wants an AI/ML or data job starting in January 2027. It shows the
exact commands, their unedited output, which results came from data and which
were judgment calls, and the checks used to confirm the output. The mode
checked 12 real postings at 7 employers with H-1B history. One posting had
closed and was skipped. Seven cleared the reasoning-and-judgment floor. Four
data-scientist postings were held because the federal occupation data has no
ratings for Data Scientists. A deliberate attempt to make the mode fill that
gap silently, either with a zero or with a neighbouring occupation's score,
was caught.

## Run record

- Date: 2026-10-21. Branch `mode/deepakkts-aiml-cognitive-floor`, base `015843d` (upstream/main).
- Commits: `1ee850f` (mode code), `0ff57e4` (tracked outputs, README, network trap in the harness).
- Node v24.21.0, Python 3.13.2.
- Redaction applied to every pasted block below: the local workspace path prefix is replaced with `<workspace>`, and the session scratch directory with `<scratch>`. In some lines npm had already masked part of that scratch path as `***`. In the doctor output, the opening square bracket before the word TODO is shown as `<bracket>`, because that token may not appear in tracked files. In the privacy-scan output, the `@` of the one email address it reports is shown as `<at>`, so that pasting the scan result does not create a new scan finding. Nothing else is changed.

## Worked Run

### Inputs

Scenario file: `scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/scenario.json`. No private data is used. The persona is anonymous.

| Input | Value | Label | Basis |
|---|---|---|---|
| needs_sponsorship | true | your-input | F-1, post-completion OPT now, H-1B later |
| program_completion_month | 2026-12 | your-input | scenario as given |
| target_start_month | 2027-01 | your-input | scenario as given |
| ead_expected_month | 2027-01 | model-judgment | assistant assumption: an OPT application filed before completion yields an EAD by January. USCIS processing time is not in this checkout |
| latest_opt_start_month | 2027-02 | model-judgment | assistant reading of the rule that the requested OPT start falls within 60 days of program end. Not a record here |
| cognitive_floor.percentile | 75 | model-judgment | top quartile of scored occupations. The cutoff value is computed from data |
| posting selection | 12 postings below | model-judgment | 11 chosen from the scan output below (United States locations, early-career titles), plus Airbnb job 7708224 (see note) |
| SOC candidates per posting | column below | model-judgment | postings never state the SOC code |

| role_id | Company | Greenhouse job id | Title (from API, or from the record where the job is gone) | SOC candidates [model-judgment] |
|---|---|---|---|---|
| pathai-mle-ii | PathAI | 8696752002 | Machine Learning Engineer II (Applied Research & Model Development) | 15-1221.00, 15-1252.00 |
| discord-ds-client-platform | Discord | 8840756002 | Data Scientist - Client Platform | 15-2051.00 |
| figma-ai-applied-scientist | Figma | 5707966004 | AI Applied Scientist | 15-1221.00 |
| figma-data-scientist | Figma | 5552580004 | Data Scientist | 15-2051.00 |
| figma-swe-ml | Figma | 5551532004 | Software Engineer - Machine Learning | 15-1252.00, 15-1221.00 |
| moloco-ds-ii-product | Moloco | 7985823003 | Data Scientist II, Product - Moloco Commerce Media | 15-2051.00, 15-2041.00 |
| moloco-mle-expression-of-interest | Moloco | 7655058003 | Expression of Interest: Machine Learning Engineer | 15-1252.00, 15-1221.00 |
| reddit-mle | Reddit | 7131932 | Machine Learning Engineer | 15-1252.00, 15-1221.00 |
| airbnb-mle-assistance | Airbnb | 7826337 | Machine Learning Engineer, Assistance Engineering | 15-1252.00, 15-1221.00 |
| airbnb-mle-relevance-2026-09-16 | Airbnb | 7708224 | Machine Learning Engineer, Relevance and Personalization (from the 2026-09-16 record) | 15-1252.00, 15-1221.00 |
| applovin-measurement-ds | AppLovin | 4705264006 | Measurement Data Scientist | 15-2051.00, 15-2041.00 |
| applovin-swe-ml | AppLovin | 4712559006 | Software Engineer, Machine Learning | 15-1252.00, 15-1221.00 |

Note on Airbnb job 7708224. Its id and title come from the committed example
`.claude/skills/greenhouse-watch/examples/airbnb-aarav-2026-09-16/run-second-run.json`
(`run_at` 2026-09-16), where it is listed under `relevant`. That file's
`source` field reads `fixture:<out>/out/raw-2026-09-16T22-13-52.json`, so it
is a recorded example. It is not an independent capture of the live board. The
job was absent from the 2026-10-21 board listing.

Student confirmations (the student's words, inserted verbatim):

- your-input values: program_completion_month 2026-12, target_start_month 2027-01, needs_sponsorship true. Confirmed.
- Gate G4: G4 cleared by Deepak Kumaran T S on October 21, 2026. I confirm the SOC candidate lists, the floor percentile of 75, ead_expected_month 2027-01 and latest_opt_start_month 2027-02 as stated.
- Audits: I have read run/report.md and run/run-log.json. Yes.

### Real command output from a real or realistic scenario, pasted not described

**1. Discovery: the repository's ATS scanner, dry run (no files written).** Run 2026-10-21, output file written 19:26:24Z.

```
$ REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/targets/portals.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 11 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-21
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     11
Total jobs found:      1179
Filtered by title:     1155 removed
Filtered by location:  5 removed
Duplicates:            1 skipped
New offers added:      18

New offers:
  + PathAI | Machine Learning Engineer II (Applied Research & Model Development) | Boston (Onsite), New York (Onsite) Preferred, or Remote
  + PathAI | Machine Learning Engineer III (Applied Research & Model Development) | Boston (Onsite), New York (Onsite) Preferred, or Remote
  + Discord | Data Scientist - Client Platform | San Francisco Bay Area
  + Twilio | Machine Learning Engineer | Remote - Spain
  + Twilio | Machine Learning Engineer (L3) | Remote - India
  + Figma | AI Applied Scientist | San Francisco, CA • New York, NY • United States
  + Figma | Data Scientist   | San Francisco, CA • New York, NY • United States
  + Figma | Software Engineer - Machine Learning | San Francisco, CA • New York, NY • United States
  + Moloco | Data Scientist II, Product - Moloco Commerce Media | Menlo Park, California, United States
  + Moloco | Expression of Interest: Machine Learning Engineer | Menlo Park, California, United States; New York, New York, United States; Seattle, Washington, United States
  + Roblox | Distinguished Engineer, Machine Learning - Discovery | San Mateo, CA, United States
  + Roblox | Distinguished Engineer, Machine Learning - Economy | San Mateo, CA, United States
  + Reddit | Machine Learning Engineer | Remote - United States
  + Reddit | Machine Learning Engineer, Answers Relevance | Remote - United States
  + Airbnb | Machine Learning Engineer, Assistance Engineering | Remote-USA
  + AppLovin | Data Scientist – Analytics  | Palo Alto, CA
  + AppLovin | Measurement Data Scientist | Palo Alto, CA
  + AppLovin | Software Engineer, Machine Learning | Palo Alto, CA

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
```

**2. The one command, from the repository root in a clean shell** (`env -i`, `bash --noprofile --norc`, `set -x`). This run wrote the committed `assignments/submissions/deepakkts/run/run-log.json` and `report.md` (`started_at` 2026-10-21T19:32:31.191Z).

```
+ pwd
<workspace>/the-reallocation-engine
+ node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run
cognitive-floor: 12 roles · floor P75 cutoff 3.749 · timeline gate open
  CLEARS_FLOOR                 pathai-mle-ii
  HOLD_MISSING_EVIDENCE        discord-ds-client-platform
  CLEARS_FLOOR                 figma-ai-applied-scientist
  HOLD_MISSING_EVIDENCE        figma-data-scientist
  CLEARS_FLOOR                 figma-swe-ml
  HOLD_MISSING_EVIDENCE        moloco-ds-ii-product
  CLEARS_FLOOR                 moloco-mle-expression-of-interest
  CLEARS_FLOOR                 reddit-mle
  CLEARS_FLOOR                 airbnb-mle-assistance
  SKIP_GATED_LIVENESS          airbnb-mle-relevance-2026-09-16
  HOLD_MISSING_EVIDENCE        applovin-measurement-ds
  CLEARS_FLOOR                 applovin-swe-ml
  counts: CLEARS_FLOOR 7 · HOLD_MISSING_EVIDENCE 4 · SKIP_GATED_LIVENESS 1
  wrote assignments/submissions/deepakkts/run/run-log.json + report.md
+ echo exit=0
exit=0
```

The per-role table from the human report that run wrote (`assignments/submissions/deepakkts/run/report.md`):

| Role | Liveness gate [record] | SOC candidates [model-judgment] → score [record] | Sponsorship history [record] | Disposition |
|---|---|---|---|---|
| PathAI: Machine Learning Engineer II (Applied Research & Model Development) (job 8696752002) | open (api_listed, HTTP 200) | 15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor<br>15-1252.00 Software Developers: 3.834 → clears_floor | PATHAI INC: 78 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Discord: Data Scientist - Client Platform (job 8840756002) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings | DISCORD INC: 122 approvals, 0 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Figma: AI Applied Scientist (job 5707966004) | open (api_listed, HTTP 200) | 15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor (O*NET sample title hit: Applied Scientist) | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Figma: Data Scientist (job 5552580004) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Figma: Software Engineer - Machine Learning (job 5551532004) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | FIGMA INC: 188 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Moloco: Data Scientist II, Product - Moloco Commerce Media (job 7985823003) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings<br>15-2041.00 Statisticians: 3.958 → clears_floor | MOLOCO INC: 200 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| Moloco: Expression of Interest: Machine Learning Engineer (job 7655058003) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | MOLOCO INC: 200 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Reddit: Machine Learning Engineer (job 7131932) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | REDDIT INC: 408 approvals, 12 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Airbnb: Machine Learning Engineer, Assistance Engineering (job 7826337) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | AIRBNB INC: 1000 approvals, 10 denials [suffix-normalized] | **CLEARS_FLOOR** |
| Airbnb: Machine Learning Engineer, Relevance and Personalization (job 7708224) | closed (http_gone, HTTP 404) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | AIRBNB INC: 1000 approvals, 10 denials [suffix-normalized] | **SKIP_GATED_LIVENESS** |
| AppLovin: Measurement Data Scientist (job 4705264006) | open (api_listed, HTTP 200) | 15-2051.00 Data Scientists: no score → missing_ratings<br>15-2041.00 Statisticians: 3.958 → clears_floor | APPLOVIN CORP: 130 approvals, 2 denials [suffix-normalized] | **HOLD_MISSING_EVIDENCE** |
| AppLovin: Software Engineer, Machine Learning (job 4712559006) | open (api_listed, HTTP 200) | 15-1252.00 Software Developers: 3.834 → clears_floor<br>15-1221.00 Computer and Information Research Scientists: 4.516 → clears_floor | APPLOVIN CORP: 130 approvals, 2 denials [suffix-normalized] | **CLEARS_FLOOR** |

**3. The one command on a fresh clone of the branch at `0ff57e4`, with no `npm ci`.** The clone was made with `git clone -b mode/deepakkts-aiml-cognitive-floor ./the-reallocation-engine <scratch>/rae-scratch-head`. The `git status` lines show that the run rewrote the committed run outputs in the clone. A `git diff` of the clone changed only `started_at`, `checked_at` and the report's "Run at" line.

```
$ date -u
2026-10-21T19:50:32Z
$ git clone -b mode/deepakkts-aiml-cognitive-floor ./the-reallocation-engine <scratch>/rae-scratch-head
$ git log -1 --oneline
0ff57e4 contrib(2026fa/deepakkts): track run outputs, add contrib README, trap fetch in offline harness
$ ls node_modules
ls: node_modules: No such file or directory
$ node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run
cognitive-floor: 12 roles · floor P75 cutoff 3.749 · timeline gate open
  CLEARS_FLOOR                 pathai-mle-ii
  HOLD_MISSING_EVIDENCE        discord-ds-client-platform
  CLEARS_FLOOR                 figma-ai-applied-scientist
  HOLD_MISSING_EVIDENCE        figma-data-scientist
  CLEARS_FLOOR                 figma-swe-ml
  HOLD_MISSING_EVIDENCE        moloco-ds-ii-product
  CLEARS_FLOOR                 moloco-mle-expression-of-interest
  CLEARS_FLOOR                 reddit-mle
  CLEARS_FLOOR                 airbnb-mle-assistance
  SKIP_GATED_LIVENESS          airbnb-mle-relevance-2026-09-16
  HOLD_MISSING_EVIDENCE        applovin-measurement-ds
  CLEARS_FLOOR                 applovin-swe-ml
  counts: CLEARS_FLOOR 7 · HOLD_MISSING_EVIDENCE 4 · SKIP_GATED_LIVENESS 1
  wrote assignments/submissions/deepakkts/run/run-log.json + report.md
exit=0
$ git status --short
 M assignments/submissions/deepakkts/run/report.md
 M assignments/submissions/deepakkts/run/run-log.json
$ node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs
0. network trap
  ✓ fetch throws in the harness process
  ✓ trap reaches a child: a live run fails every liveness check with the trap message
1. offline end-to-end run (fetch trapped)
  ✓ exit code 1 because two stop conditions fire
  ✓ report.md written beside run-log.json
  ✓ report.md opens with an executive summary
  ✓ f01-clears → CLEARS_FLOOR
  ✓ f02-below → BELOW_FLOOR
  ✓ f03-soc-sensitive → SOC_SENSITIVE
  ✓ f04-data-scientist-unrated → HOLD_MISSING_EVIDENCE
  ✓ f05-bare-bls-code → STOP_SOC_INPUT
  ✓ f06-gone-404 → SKIP_GATED_LIVENESS
  ✓ f07-200-but-filled → SKIP_GATED_LIVENESS
  ✓ f08-not-in-board-listing → HOLD_LIVENESS_UNCERTAIN
  ✓ f09-network-error → STOP_LIVENESS_CHECK_FAILED
  ✓ f10-deadline-passed → SKIP_GATED_LIVENESS
  ✓ f11-legal-name-pinned → CLEARS_FLOOR
  ✓ f12-partial-ratings → HOLD_MISSING_EVIDENCE
  ✓ f07 closed by the body pattern, not by status
  ✓ f09 failed check carries no liveness value
  ✓ f05 lists sibling O*NET codes without using them
  ✓ exactly two stops recorded
2. lookups and gates
  ✓ "Figma, Inc." matches FIGMA INC by suffix normalization and says so
  ✓ duplicate company rows are reported once, never summed
  ✓ absent company is not_in_dataset with no number
  ✓ display name with a different legal name does not match by itself
  ✓ timeline gate with a missing input needs a human
  ✓ timeline gate closes when the EAD lands after the start
  ✓ out-dir inside the repo but outside the namespace is refused, exit 2
  ✓ missing --out-dir is refused, exit 2
3. break attempt: the silent wrong answers for 15-2051.00 Data Scientists
  ✓ real mode: Data Scientists has no score (missing evidence)
    BROKEN-number-coercion on 15-2051.00 → status below_floor, score 0
    BROKEN-sibling-join   on 15-2051.00 → status clears_floor, score 3.903, profile actually from "Business Intelligence Analysts"
  ✓ harness catches BROKEN-number-coercion
  ✓ harness catches BROKEN-sibling-join

32/32 checks passed
exit=0
```

**4. The repository's Playwright liveness checker on the same 12 URLs, run twice.** First run: output file written 2026-10-21T19:33:15Z; exit code not captured. Second run: from 19:45:15Z to 19:45:44Z, exit code captured. The result lines are identical.

```

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs --file <scratch>/liveness-urls.txt

Checking 12 URL(s)...

✅ active     https://www.pathai.com/careers/8696752002?gh_jid=8696752002
✅ active     https://job-boards.greenhouse.io/discord/jobs/8840756002
✅ active     https://boards.greenhouse.io/figma/jobs/5707966004?gh_jid=5707966004
✅ active     https://boards.greenhouse.io/figma/jobs/5552580004?gh_jid=5552580004
✅ active     https://boards.greenhouse.io/figma/jobs/5551532004?gh_jid=5551532004
✅ active     https://job-boards.greenhouse.io/moloco/jobs/7985823003
✅ active     https://job-boards.greenhouse.io/moloco/jobs/7655058003
✅ active     https://job-boards.greenhouse.io/reddit/jobs/7131932
✅ active     https://careers.airbnb.com/positions/7826337?gh_jid=7826337
❌ expired    https://careers.airbnb.com/positions/7708224?gh_jid=7708224
           HTTP 404
✅ active     https://boards.greenhouse.io/applovin/jobs/4705264006?gh_jid=4705264006
✅ active     https://boards.greenhouse.io/applovin/jobs/4712559006?gh_jid=4712559006

Results: 11 active  1 expired  0 uncertain
exit=1
```

**5. Conformance, doctor and privacy scans on the branch.**

```
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 169 files (87 md · 36 py · 35 js · 6 json · 1 yaml · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit=0
```

```
$ npm run doctor

> the-reallocation-engine@1.0.0 doctor
> node scripts/doctor.mjs

RECIPE DOCTOR — The Reallocation Engine
==========================================

ENVIRONMENT (required)
  ✓ node       v24.21.0
  ✓ python3    Python 3.13.2

ENVIRONMENT (optional — features degrade without these)
  — pandoc     not found (resume/PDF rendering)
  — libreoffice not found (PDF fallback)
  ✓ playwright installed

RUNNABLE COMMANDS (npm script → target file present?)
  ✓ verify         scripts/conformance.mjs
  ✓ manifest-check scripts/manifest-check.mjs
  ✓ eval:score     scripts/eval/score-run.mjs
  ✓ eval:report    scripts/eval/report.mjs
  ✓ doctor         scripts/doctor.mjs
  ✓ bls:local-wage scripts/bls/local-wage-adjustment.py
  ✓ build-instructions scripts/build-instructions.mjs
  ✓ to-markdown    scripts/to-markdown.mjs
  ✓ score          scripts/score/role-scorer.mjs
  ✓ score:gates    scripts/score/gate-harness.mjs
  ✓ ats:dedup      scripts/ats/dedup-tracker.mjs
  ✓ ats:liveness   scripts/ats/check-liveness.mjs
  ✓ ats:merge      scripts/ats/merge-tracker.mjs
  ✓ ats:normalize  scripts/ats/normalize-statuses.mjs
  ✓ ats:scan       scripts/ats/scan.mjs
  ✓ ats:verify     scripts/ats/verify-pipeline.mjs
  ✓ resumes:pdf    scripts/resumes/generate-pdf.mjs
  ✓ svg-to-png     scripts/svg-to-png.mjs
  ✓ audit:layout   scripts/svg-layout-audit.mjs
  ✓ postsvg-to-png scripts/svg-layout-audit.mjs
  ✓ skill-demand   scripts/score/skill-demand-monitor.mjs
  ✓ skill-demand:test scripts/score/skill-demand-monitor.test.mjs
  ✓ fetch-postings scripts/ats/fetch-real-postings.py
  ✓ pii-scan       scripts/pii-scan.mjs

DOMAIN DIRECTORIES
  ✓ data/sec
  ✓ data/bls
  ✓ data/ats
  ✓ data/80-days-to-stay
  ✓ scripts/sec
  ✓ scripts/bls
  ✓ scripts/ats
  ✓ scripts/resumes

PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (34)
  with lifecycle frontmatter: 34   missing: 0
  by status: DRAFT 28 · RUNNABLE-LIVE 1 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 <bracket>TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 34/34 carry lifecycle frontmatter — all tracked
  next: continue
exit=0
```

```
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — i<at>izs.me

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit=1
$ node scripts/pii-scan.mjs --diff upstream/main
pii-scan: clean ✓
exit=0
```

The `package-lock.json` finding is present, byte for byte, in a fresh clone of
upstream/main (`/tmp/rae-baseline`, lockfile sha256 `491847f2…`). The branch
history scan against upstream/main is clean.

**6. Context: the repository's `npm run score`.** This is the Chapter 11
combiner, `(Σ vote·weight) × liveness × timeline`, with `role_quality` weighted
0.0. It is not a BLS/O*NET role-quality scorer. It was run on the committed
book example to show that weight. The mode does not feed it.

```
$ npm run score -- data/examples/ch11-roles.json --out-dir <scratch>/score-ch11

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir <scratch>/score-ch11

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  <scratch>/score-ch11/role-scores.json  +  <scratch>/score-ch11/role-scores.md
exit=0
```

### Verified-vs-inferred split is explicit

Line by line for this run. "Record" means read from a committed file or
returned by an employer's board API during the run.

| Output in this run | Verified (record) | Inferred (judgment) |
|---|---|---|
| 11 postings answer HTTP 200 and appear in their board listing | Greenhouse API, 2026-10-21; Playwright agrees (11 active) | that a listed posting is a real, funded opening. The Moloco "Expression of Interest" posting shows the gap |
| Airbnb 7708224 is gone | HTTP 404 from the API; Playwright `expired HTTP 404` | that it was a live posting on 2026-09-16 rests on a committed example file whose source is labelled fixture |
| Timeline gate open | the three month comparisons were computed | `ead_expected_month` 2027-01 and `latest_opt_start_month` 2027-02 are model-judgment. The gate is only as good as those two values |
| SOC candidate lists for all 12 postings | none | model-judgment in every row |
| 15-1221.00 score 4.516, 15-1252.00 score 3.834, 15-2041.00 score 3.958 | compact table; each equals its recomputed 9-field mean | none |
| 15-2051.00 Data Scientists has no score | compact table: 0 of 9 fields filled | none |
| Floor cutoff 3.749 | rank 671 of 894 scored occupations | the 75th percentile is model-judgment |
| 7 rows `CLEARS_FLOOR` | the scores and the cutoff | the SOC lists, the percentile, and the premise that `cognitive_pivot_score` tracks AI-substitution resilience |
| 4 rows `HOLD_MISSING_EVIDENCE` | blank ratings for 15-2051.00 | that 15-2051.00 belongs in those rows' SOC lists |
| "O*NET sample title hit: Applied Scientist" on the Figma row | `alternate_titles_sample` for 15-1221.00 | that the employer would file under that code |
| Sponsorship counts (e.g. FIGMA INC 188 approvals, 2 denials) | 80 Days table row | that "Figma" and "FIGMA INC" are the same employer (`suffix-normalized` match), and that company-level counts say anything about this role |
| needs_sponsorship true | none | your-input |

### Verification

#### Hand cross-check against the source files

Run with grep, python3's `csv`
module and `bc`, independent of the mode's own code:

```
$ head -1 data/bls/compact/soc_occupation_compact.csv | tr , "\n" | cat -n   (columns used)
     1	onet_soc_code
     3	title
    15	ability_originality_lv
    16	ability_problem_sensitivity_lv
    17	ability_deductive_reasoning_lv
    18	ability_inductive_reasoning_lv
    22	skill_critical_thinking_lv
    23	skill_judgment_decision_making_lv
    24	skill_complex_problem_solving_lv
    25	skill_systems_analysis_lv
    26	skill_systems_evaluation_lv
    32	cognitive_pivot_score
$ grep -n "^15-1252.00,\|^15-2051.00,\|^15-2051.01," data/bls/compact/soc_occupation_compact.csv | cut -c1-60
124:15-1252.00,15-1252,Software Developers,"Research, design
144:15-2051.00,15-2051,Data Scientists,"Develop and implemen
145:15-2051.01,15-2051,Business Intelligence Analysts,Produc
$ python3 (csv module) print columns 15-18, 22-26, 32 for those rows
15-1252.00 Software Developers ['3.38', '3.88', '4.0', '3.88', '4.12', '3.75', '3.5', '3.88', '4.12'] cognitive_pivot_score='3.834'
15-2051.00 Data Scientists ['', '', '', '', '', '', '', '', ''] cognitive_pivot_score=''
15-2051.01 Business Intelligence Analysts ['3.25', '3.5', '4.5', '4.38', '4.25', '4.0', '3.75', '3.75', '3.75'] cognitive_pivot_score='3.903'
$ echo "3.38+3.88+4.0+3.88+4.12+3.75+3.5+3.88+4.12" | bc
34.51
$ echo "34.51/9" | bc -l
3.83444444444444444444
$ python3: nearest-rank 75th percentile of non-blank cognitive_pivot_score
scored=894  0.75*scored=670.5  rank=671  value=3.749  neighbours=[3.748, 3.748, 3.749, 3.749, 3.749]
scores <= 3.834 (Software Developers): 715 of 894
$ python3: sponsorship columns for FIGMA INC, PATHAI INC, PATHRAI INC
FIGMA INC | 188.0 | 2.0 | 98.94736842105264
PATHAI INC | 78.0 | 2.0 | 97.5
PATHRAI INC | 78.0 | 2.0 | 97.5
$ echo "188/(188+2)*100" | bc -l
98.94736842105263157800
$ grep run-log.json values the mode emitted for these
floor cutoff=3.749 rank=671 of=894
figma-data-scientist 15-2051.00 score=None recomputed_mean=None status=missing_ratings
figma-data-scientist sponsor FIGMA INC 188 2 98.94736842105264
figma-swe-ml 15-1252.00 score=3.834 recomputed_mean=3.834444 status=clears_floor
figma-swe-ml 15-1221.00 score=4.516 recomputed_mean=4.515556 status=clears_floor
figma-swe-ml sponsor FIGMA INC 188 2 98.94736842105264
```

| Value | Arithmetic from the source rows | Mode output | Reconciles |
|---|---|---|---|
| 15-1252.00 Software Developers score | 3.38+3.88+4.0+3.88+4.12+3.75+3.5+3.88+4.12 = 34.51; 34.51 / 9 = 3.8344, stored as 3.834 | score 3.834, recomputed_mean 3.834444 | yes |
| Floor cutoff at the 75th percentile | ceil(0.75 × 894) = ceil(670.5) = 671; the 671st smallest score is 3.749 | cutoff 3.749, rank 671 of 894 | yes |
| FIGMA INC approval rate | 188 / (188 + 2) × 100 = 98.947 | 98.94736842105264 | yes |
| 15-2051.00 Data Scientists | all 9 fields blank, `cognitive_pivot_score` blank | score None, missing_ratings | yes |

#### Attestation includes a deliberate break attempt

The target is 15-2051.00
Data Scientists, the code with blank ratings. Two plausible implementations
would give a wrong answer silently:

- `fixtures/BROKEN-number-coercion.mjs` reads ratings with plain `Number()`. In
  JavaScript `Number('')` is 0. The occupation scores 0 and falls `below_floor`,
  so every data-scientist posting would be skipped with a precise-looking score.
- `fixtures/BROKEN-sibling-join.mjs` joins on the 6-digit BLS code and takes the
  first sibling with a score. Data Scientists silently gets 3.903 from
  15-2051.01 Business Intelligence Analysts and `clears_floor`.

The harness runs the real lookup and both mutants. It passes only if the real
lookup returns missing evidence and it flags both mutants. Lines from block 3
above:

```
3. break attempt: the silent wrong answers for 15-2051.00 Data Scientists
  ✓ real mode: Data Scientists has no score (missing evidence)
    BROKEN-number-coercion on 15-2051.00 → status below_floor, score 0
    BROKEN-sibling-join   on 15-2051.00 → status clears_floor, score 3.903, profile actually from "Business Intelligence Analysts"
  ✓ harness catches BROKEN-number-coercion
  ✓ harness catches BROKEN-sibling-join
```

The offline fixture exercises the other silent-error shapes the mode guards
against:
- a posting that returns HTTP 200 with "This position has been filled" (closed by the body pattern);
- an employer name with punctuation and a suffix ("Figma, Inc." matching FIGMA INC, labelled `suffix-normalized`);
- duplicate company rows (PELOTON INTERACTIVE INC and LLC, reported once and not summed);
- a bare BLS code (`15-2051`, refused, with siblings listed and unused).

The harness disables `fetch` before it runs, and proves that the trap reaches
the child process.

### Reflection names what went well, what the mode missed, and concrete next steps

The bullets in this section are assistant observations, which are model
judgments. They are not the student's. The student's own lines are under
"Student reflection".

What went well (assistant observation):
- The two gates agreed with an independent check. The API gate and the Playwright checker both reported 11 open and 1 gone.
- The mode refused to score the occupation that matters most for data roles, and it said why in the report row.
- The whole path ran from one command on a clean clone with nothing installed.

What the mode got wrong or missed (assistant observation):
- At the 75th-percentile floor, every ML-engineer candidate code clears. The floor separated nothing in this run, and only 1 of 12 rows was skipped, against the repository's rule of thumb that a healthy run skips at least half. Software Developers sits at or below 715 of 894 scored occupations, so the SOC choice would only change outcomes above about the 80th percentile.
- The liveness gate passed an "Expression of Interest" posting that may not be a funded opening.
- With the run outputs tracked, running the documented command rewrites them in place (timestamps only on 2026-10-21).
- The two code paths for `ambiguous` sponsorship and `score_inconsistent` have no fixture case.

Concrete next steps (assistant observation):
- Add fixture cases for the ambiguous-sponsor and score-mismatch paths.
- Decide the floor percentile with the SOC sensitivity in view.
- Add a per-posting flag for evergreen titles such as "Expression of Interest".

Student reflection (the student's words, inserted verbatim):
- What went well: The live and offline runs helped me understand how the mode handles real job postings and separates available evidence from missing data.
- What the mode missed: It cannot reliably determine the correct SOC code for every job title, and a live API response does not guarantee that a posting is still available or reproducible later.
- What I learned from running it: A missing sponsorship record is not the same as a negative result, and model judgments must be distinguished from verified records.
- Next steps: Improve SOC candidate validation, document the limitations of live data, and expand the tests for missing evidence and edge cases.

## Attestation
- Recipe: case-aiml-cognitive-floor v0.1.0
- By: Deepak Kumaran T S · October 21, 2026

The rows below record commands the assistant ran on 2026-10-21. The byline was
supplied by the student.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir assignments/submissions/deepakkts/run` from the repo root, clean shell | exit 0; 12 roles; CLEARS_FLOOR 7, HOLD_MISSING_EVIDENCE 4, SKIP_GATED_LIVENESS 1 | exit 0, a disposition for every role, no stop |
| Same command on a fresh clone at `0ff57e4` with no `node_modules` | identical dispositions, exit 0 | runs with nothing installed |
| `node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs` | `32/32 checks passed`, exit 0 | all checks pass with `fetch` disabled |
| `npm run ats:liveness -- --file <12 urls>` | 11 active, 1 expired (HTTP 404), exit 1 | agrees with the mode's liveness gate |
| `npm run ats:scan -- --dry-run` with the mode's portals file | 11 companies, 1179 jobs, 18 kept, no files written | candidate postings at sponsor-history employers |
| Break attempt: `BROKEN-number-coercion` on 15-2051.00 | `below_floor`, score 0; harness flags it | real mode returns missing evidence |
| Break attempt: `BROKEN-sibling-join` on 15-2051.00 | `clears_floor`, 3.903 from Business Intelligence Analysts; harness flags it | real mode returns missing evidence |
| Fixture: HTTP 200 posting whose text says "This position has been filled" | `SKIP_GATED_LIVENESS`, code `expired_body` | closed although the status is 200 |
| Fixture: bare BLS code `15-2051` | `STOP_SOC_INPUT`; siblings 15-2051.00, .01, .02 listed and unused | refusal, no score |
| Fixture: network error on the job endpoint | `STOP_LIVENESS_CHECK_FAILED`, no liveness value | failed check recorded as failed |
| Harness live run with `fetch` trapped | all 12 roles `STOP_LIVENESS_CHECK_FAILED` with the trap message | trap reaches the child process |
| `--out-dir data/bls/compact` | exit 2, nothing written | refused |
| Hand cross-check of 15-1252.00 score, the cutoff and the FIGMA INC rate | 3.834, 3.749 (rank 671 of 894), 98.947 | each reconciles with the source rows |
| `npm run verify`; `npm run doctor`; `node scripts/pii-scan.mjs --diff upstream/main` | conform, manifest 3 warnings (same as baseline); 34 recipes, 318 declared = 318 body markers; history scan clean | no new failure |

### Did not test
- Any board other than Greenhouse.
- A real (non-fixture) posting that returns HTTP 200 with closed text, or a real network failure mid-run.
- The `ambiguous` sponsorship path and the `score_inconsistent` path: no fixture case exists for either.
- `SKIP_GATED_TIMELINE` and `HOLD_TIMELINE_INPUT` end to end. Only the gate function was unit-checked.
- Whether any listed posting is a funded opening.
- Which SOC code any employer actually files for these roles.
- The timeline gate against real USCIS processing dates.
- Rounding agreement between the Python extractor and the mode's tolerance at exact half-way values.
- Node 20, which the repository CI uses. All runs used Node 24.21.0.
- The GitHub contrib-gate CI workflow.
- Running the command from a directory other than the repository root.

### Broke during testing, fixed
- The human report's summary sentence read "1 are skipped at a gate". `renderReport` in `run.mjs` was reworded to a count list before commit `1ee850f`.
- The first `npm run ats:liveness` run lost its exit code in a shell pipe. It was re-run at 19:45:15Z with the exit code captured (exit 1).
- The offline harness spawned child processes with the network available, so "offline" was asserted and never tested. `fixtures/no-network.mjs` now replaces `fetch` in the harness and in every child via `node --import`. Checks went from 30 to 32 (`0ff57e4`).
- The run outputs were untracked, so a `git archive` of HEAD would have left them out. They were tracked in `0ff57e4`.
