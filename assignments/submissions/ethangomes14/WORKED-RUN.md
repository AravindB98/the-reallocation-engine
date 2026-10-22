# Worked Run — Data Engineer H-1B sponsor screen (sample run v0.5.0, 2026-10-20 · live run v0.5.1, 2026-10-21)

## Executive summary

On 2026-10-20 I ran the mode end to end on **real data found that day**. It asked 37 Greenhouse boards for jobs, kept 23 Data Engineer-family postings, narrowed them to 19 in the US, checked every link with the engine's own liveness checker and the Greenhouse API, and screened them against the 80 Days to Stay sponsor file through the engine's existing scorer. Result: **Apply 5 · Consider 8 · Skip 1 · unscored 5**. Two of the Considers are Applies capped by the new fit floor; all 5 unscored rows are brand names waiting for a person to confirm their legal name. Every number in the log matched the source CSV under a second, independent parser (19/19). Seven deliberate break attempts each stopped or gated as designed. The run also found three problems I didn't predict: a sales job slipping through the title rule (fixed), a posting open for almost four years (now flagged), and fit having no effect on Proven sponsors (logged as a `[TODO: DEFINE]`, then closed by the author's decision: a fit floor of 0.4).

On 2026-10-21 I cleared every gate myself:
- I checked the four legal names with a Google search and accepted the aliases.
- I opened all 18 live links, and each one showed its job.
- I confirmed the timeline inputs.

Then I re-checked liveness and the Greenhouse API that day and re-ran the screen as a **live** run. Result: **Apply 8 · Consider 10 · Skip 1 · unscored 0**, with the CSV cross-check again 19/19. Three long-open postings are on the page, but whether they are still being filled is unknown, so I am not acting on them.

The live run found one more problem: two scripts dated "today" in UTC, so an evening check looked like it came from tomorrow and was ignored. It failed safe, and it is fixed in v0.5.1.

Lifecycle reached: **RUNNABLE-LIVE** (v0.5.1, 2026-10-21). RUNNABLE-SAMPLE was reached on 2026-10-20.

## Inputs

| Input | Path | Notes |
|---|---|---|
| Persona | `scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fixtures/persona-electrifier.json` | **Fictional** ("Electrifier"). No real person's dates, résumé or contacts. OPT 2027-03-01, 90-day limit, 10-day buffer, 45-day hiring lag. |
| Board list | `…/samples/boards-2026-10-20.txt` | 37 tokens: the 7 boards from 2026-10-03 plus guessed tokens for Proven/Likely-tier sponsors |
| Discovery output | `…/samples/postings-2026-10-20.json` | 23 postings, `fit: null` |
| Candidates | `…/samples/candidates-2026-10-20.json` | 19 postings (US or location unstated), fit rated by Claude from title, level and location |
| Liveness | `…/samples/liveness-2026-10-20.txt` | `npm run ats:liveness` stdout, checked 2026-10-20 |
| Greenhouse status | `…/samples/greenhouse-status-2026-10-20.json` | API answers for the 19 links + the invented-ID break test |
| Aliases | `…/aliases.json` | 4 entries proposed by Claude, **0 reviewed** |
| Sponsor CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | 30,369 rows, read-only |

No private data was read. Nothing in `private/` or `data/ats/` was used.

## Commands and real output

### 0. Toolchain

Run from the copied repo (dependencies already installed). `verify` is shown in full. It was re-run on 2026-10-21 against the same v0.5.0 files because the 2026-10-20 capture kept only its last 6 lines, which dropped the conformance result. That re-run is saved in `runs/terminal-verify-2026-10-21.txt`. `doctor` is from 2026-10-20 and keeps only its last 25 lines, because the top half just lists every script it found. That capture is saved in `runs/terminal-checks-2026-10-20.txt`.

```text
$ npm run verify   # 2026-10-21 20:19 EDT · branch mode/ethangomes14-data-engineer-h1b · dbac7a2 + uncommitted v0.5.0 changes

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 181 files (88 md · 36 py · 36 js · 17 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]

$ npm run doctor
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

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

### 1. Discovery (network, `boards-api.greenhouse.io` only)

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --boards scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/boards-2026-10-20.txt
200  sigmacomputing       78 jobs · 2 Data Engineer-family
       Data Engineer — New York City, NY
       Data Engineer — San Francisco, CA
200  klaviyo             160 jobs · 3 Data Engineer-family
       Analytics Engineer — Boston, MA
       Senior Lead Software Engineer - Data Platform — Boston, MA
       Senior Software Engineer - Data Automation — Boston, MA
200  gusto               101 jobs · 1 Data Engineer-family
       Senior Data Engineer — Denver, CO - Hybrid; New York, NY - Hybrid; San Francisco, CA - Hybrid
200  gemini               31 jobs · 1 Data Engineer-family
       Senior Data Engineer — New York, New York; Miami, Florida; Remote (USA)
200  airbnb              179 jobs · 6 Data Engineer-family
       Senior Staff Data Engineer - Data Stewardship — United States
       Senior Staff Data Engineer, Foundational Data — United States
       Staff Data Engineer, Tech Foundations — San Francisco, CA
       Staff Software Engineer, Data Authoring — USA
       Staff Software Engineer, Data Catalog — USA
       Staff Software Engineer, Data Warehouse — USA
200  robinhood           151 jobs · 2 Data Engineer-family
       Senior Software Engineer, Data Engineering — Menlo Park, CA
       Senior Staff Software Engineer, Data Platform — Bellevue, WA
200  stripe              727 jobs · 4 Data Engineer-family
       Account Executive, Product Sales (Data Pipeline)  — Singapore
       Software Engineer, Data Orchestration — N/A
       Software Engineer, Stripe Data Pipeline — Bangalore
       Staff Software Engineer, Risk Data Engineering — Toronto
404  zoox               board not available
404  docusign           board not available
200  roku                 94 jobs · 1 Data Engineer-family
       Senior Data Engineer, Data Governance Lead — Austin, Texas
200  upstart              91 jobs · 1 Data Engineer-family
       Senior Data Platform Engineer — United States | Remote
200  ripple              102 jobs · 0 Data Engineer-family
404  procore            board not available
200  anaplan             132 jobs · 1 Data Engineer-family
       Senior Data Engineer — Gurugram, India
200  coursera             25 jobs · 0 Data Engineer-family
404  nerdwallet         board not available
404  socure             board not available
200  yext                 24 jobs · 0 Data Engineer-family
404  integralads        board not available
404  dataminr           board not available
404  23andme            board not available
200  inmarket             11 jobs · 0 Data Engineer-family
404  treasuredata       board not available
404  airbyte            board not available
200  sendbird              5 jobs · 0 Data Engineer-family
404  wheelsup           board not available
200  uniteus              15 jobs · 1 Data Engineer-family
       Senior Data Engineer  — United States
200  yieldmo               3 jobs · 0 Data Engineer-family
200  dv01                  5 jobs · 0 Data Engineer-family
404  thirtymadison      board not available
200  entrupy              15 jobs · 0 Data Engineer-family
200  exabeam               0 jobs · 0 Data Engineer-family
200  veracyte             27 jobs · 0 Data Engineer-family
200  twinhealth           42 jobs · 0 Data Engineer-family
404  proveidentity      board not available
404  quartethealth      board not available
200  happymoney            6 jobs · 0 Data Engineer-family

37 boards asked · 23 answered · 23 Data Engineer-family postings → scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/postings-2026-10-20.json
```

This ran **before** the exclusion fix (see "Broke during testing, fixed"): `Account Executive, Product Sales (Data Pipeline)` is a sales job. After the fix, the same board:

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/find-greenhouse-postings.mjs --board stripe --out $TMPDIR/stripe-recheck.json
200  stripe              728 jobs · 3 Data Engineer-family
       Software Engineer, Data Orchestration — N/A
       Software Engineer, Stripe Data Pipeline — Bangalore
       Staff Software Engineer, Risk Data Engineering — Toronto

1 boards asked · 1 answered · 3 Data Engineer-family postings → $TMPDIR/stripe-recheck.json
```

### 2. Liveness (`npm run ats:liveness`, saved as the screen's input)

```text
# checked: 2026-10-20
# command: npm run ats:liveness -- <the 19 URLs below>

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003 https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003 https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003 https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003 https://job-boards.greenhouse.io/gusto/jobs/8099751 https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827 https://careers.airbnb.com/positions/7998356?gh_jid=7998356 https://careers.airbnb.com/positions/8224032?gh_jid=8224032 https://careers.airbnb.com/positions/8284841?gh_jid=8284841 https://careers.airbnb.com/positions/8242248?gh_jid=8242248 https://careers.airbnb.com/positions/8154705?gh_jid=8154705 https://careers.airbnb.com/positions/8197715?gh_jid=8197715 https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660 https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014 https://stripe.com/jobs/search?gh_jid=7230670 https://www.weareroku.com/jobs/8201216?gh_jid=8201216 https://careers.upstart.com/jobs?gh_jid=8214129 https://job-boards.greenhouse.io/uniteus/jobs/8840770002

Checking 19 URL(s)...

✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003
✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003
✅ active     https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003
✅ active     https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003
✅ active     https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003
✅ active     https://job-boards.greenhouse.io/gusto/jobs/8099751
✅ active     https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827
✅ active     https://careers.airbnb.com/positions/7998356?gh_jid=7998356
✅ active     https://careers.airbnb.com/positions/8224032?gh_jid=8224032
✅ active     https://careers.airbnb.com/positions/8284841?gh_jid=8284841
✅ active     https://careers.airbnb.com/positions/8242248?gh_jid=8242248
✅ active     https://careers.airbnb.com/positions/8154705?gh_jid=8154705
✅ active     https://careers.airbnb.com/positions/8197715?gh_jid=8197715
✅ active     https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660
✅ active     https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014
⚠️ uncertain  https://stripe.com/jobs/search?gh_jid=7230670
           content present but no visible apply control found
✅ active     https://www.weareroku.com/jobs/8201216?gh_jid=8201216
✅ active     https://careers.upstart.com/jobs?gh_jid=8214129
✅ active     https://job-boards.greenhouse.io/uniteus/jobs/8840770002

Results: 18 active  0 expired  1 uncertain
# ats:liveness exited non-zero (it exits 1 if any URL is expired or uncertain)
```

### 3. Greenhouse cross-check (network)

The first fetch wrote `samples/greenhouse-status-2026-10-20.json`. The output below is a second fetch the same day into a temp file, so the screen's input stayed unchanged; its 20 answers are identical to the saved file (checked by comparing the two JSON files).

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fetch-greenhouse-status.mjs --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-ghost-2026-10-03.json
200  exists   sigmacomputing/7809974003  https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003
200  exists   sigmacomputing/7809973003  https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003
200  exists   klaviyo/7737707003  https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003
200  exists   klaviyo/7809608003  https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003
200  exists   klaviyo/8012938003  https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003
200  exists   gusto/8099751  https://job-boards.greenhouse.io/gusto/jobs/8099751
200  exists   gemini/8076827  https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827
200  exists   airbnb/7998356  https://careers.airbnb.com/positions/7998356?gh_jid=7998356
200  exists   airbnb/8224032  https://careers.airbnb.com/positions/8224032?gh_jid=8224032
200  exists   airbnb/8284841  https://careers.airbnb.com/positions/8284841?gh_jid=8284841
200  exists   airbnb/8242248  https://careers.airbnb.com/positions/8242248?gh_jid=8242248
200  exists   airbnb/8154705  https://careers.airbnb.com/positions/8154705?gh_jid=8154705
200  exists   airbnb/8197715  https://careers.airbnb.com/positions/8197715?gh_jid=8197715
200  exists   robinhood/4738660  https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660
200  exists   robinhood/7729014  https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014
200  exists   stripe/7230670  https://stripe.com/jobs/search?gh_jid=7230670
200  exists   roku/8201216  https://www.weareroku.com/jobs/8201216?gh_jid=8201216
200  exists   upstart/8214129  https://careers.upstart.com/jobs?gh_jid=8214129
200  exists   uniteus/8840770002  https://job-boards.greenhouse.io/uniteus/jobs/8840770002
404  gone     airbnb/1  https://boards.greenhouse.io/airbnb/jobs/1

20 checked · 0 skipped → $TMPDIR/gh-recheck.json
```

### 4. The screen, the reproduction and the break attempts (offline)

All eight runs, the tests and conformance, captured in one pass on the final code (`runs/terminal-2026-10-20.txt`):

```text
$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-20
sponsor-screen: 19 candidates → Apply 5 · Consider 8 · Skip 1 · unscored 5 (skip+unscored 32%)
  fit floor: 2 Apply capped at Consider (fit < 0.4): klaviyo-7809608003, roku-8201216
  unscored: alias-pending-review × 5
  greenhouse cross-check: 19 checked (status file 2026-10-20)
  aliases: 4 in file · matched 0 · pending review 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002)
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/screen-2026-10-20/screen-log.json  +  assignments/submissions/ethangomes14/runs/screen-2026-10-20/screen-report.md
[exit 0]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-03
sponsor-screen: 7 candidates → Apply 3 · Consider 1 · Skip 1 · unscored 2 (skip+unscored 43%)
  unscored: alias-pending-review × 2
  greenhouse cross-check: 7 checked (status file 2026-10-03)
  aliases: 4 in file · matched 0 · pending review 2 (gemini-senior-data-engineer, robinhood-senior-swe-data-engineering)
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/screen-sample/screen-log.json  +  assignments/submissions/ethangomes14/runs/screen-sample/screen-report.md
[exit 0]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --out-dir assignments/submissions/ethangomes14/runs/break-stale-liveness
sponsor-screen: 7 candidates → Apply 0 · Consider 0 · Skip 5 · unscored 2 (skip+unscored 100%)
  unscored: alias-pending-review × 2
  greenhouse cross-check: 0 checked (status file 2026-10-03)
  aliases: 4 in file · matched 0 · pending review 2 (gemini-senior-data-engineer, robinhood-senior-swe-data-engineering)
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/break-stale-liveness/screen-log.json  +  assignments/submissions/ethangomes14/runs/break-stale-liveness/screen-report.md
[exit 0]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-ghost-2026-10-03.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-ghost-2026-10-03.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --out-dir assignments/submissions/ethangomes14/runs/break-ghost
sponsor-screen: 1 candidates → Apply 0 · Consider 0 · Skip 1 · unscored 0 (skip+unscored 100%)
  greenhouse cross-check: 1 checked (status file 2026-10-20)
  aliases: 4 in file · matched 0 · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/break-ghost/screen-log.json  +  assignments/submissions/ethangomes14/runs/break-ghost/screen-report.md
[exit 0]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/postings-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-20.json --out-dir assignments/submissions/ethangomes14/runs/break-no-fit
sponsor-screen: 23 candidates → Apply 0 · Consider 0 · Skip 0 · unscored 23 (skip+unscored 100%)
  unscored: invalid-input-row × 23
  greenhouse cross-check: 0 checked (status file 2026-10-20)
  aliases: 4 in file · matched 0 · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/break-no-fit/screen-log.json  +  assignments/submissions/ethangomes14/runs/break-no-fit/screen-report.md
[exit 0]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --out-dir data/80-days-to-stay
STOP: --out-dir data/80-days-to-stay is outside this contribution's folders; refusing to write there
Nothing was scored and no outputs were written.
[exit 2]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-20 --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/fixtures/aliases-BROKEN-unreviewed-date-fixture.json --out-dir assignments/submissions/ethangomes14/runs/break-alias
STOP: aliases file rejected: alias #1 ("Acme Data Holdings") is marked reviewed but has no reviewed_on date
Nothing was scored and no outputs were written.
[exit 2]

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2027-06-01 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-20.txt --out-dir assignments/submissions/ethangomes14/runs/break-after-deadline
sponsor-screen: 19 candidates → Apply 0 · Consider 0 · Skip 14 · unscored 5 (skip+unscored 100%)
  unscored: alias-pending-review × 5
  greenhouse cross-check: 0 checked (status file 2026-10-03)
  aliases: 4 in file · matched 0 · pending review 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002)
  timeline gate: factor 0 [your-input] · earliest start 2027-07-16 · practical deadline 2027-05-20 · slack -57 days
  assignments/submissions/ethangomes14/runs/break-after-deadline/screen-log.json  +  assignments/submissions/ethangomes14/runs/break-after-deadline/screen-report.md
[exit 0]

$ node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs
✔ CSV parser handles quoted commas and doubled quotes (1.287583ms)
✔ name normalization strips legal suffixes but never fuzzes (0.132625ms)
✔ title family includes Data Engineer-type titles and excludes wrong levels (0.411459ms)
✔ sponsorship tiers follow the rule; empty H-1B fields are missing, not zero (0.316666ms)
✔ timeline: cannot start before OPT; closes after the practical deadline (0.770375ms)
✔ liveness: reads ats:liveness output, flags stale checks, refuses missing evidence (0.584375ms)
✔ Greenhouse URL parsing covers the four link shapes and never guesses a board (0.88075ms)
✔ cross-check: only a definite API 404 closes an open gate; nothing is assumed (0.319666ms)
✔ G0 rejects a row without a fit rating and reason (0.089916ms)
✔ full run on fixtures: every named failure case is reported, nothing defaulted (124.773583ms)
✔ F5: after the OPT deadline every scored role is Skip (timeline gate closed) (123.614792ms)
✔ break: a scorer that ignores the gates is caught (exit 3) (121.328375ms)
✔ break: refuses to write outside its own folders (61.5065ms)
✔ break: a named Greenhouse status file that does not exist stops the run (60.92625ms)
✔ break: a missing sponsor CSV stops the run without inventing anything (61.858875ms)
✔ aliases: the file is validated and never fuzzes (1.235916ms)
✔ full run with aliases: reviewed alias scores, pending alias stays unscored, nothing guessed (124.319084ms)
✔ break: an alias marked reviewed without a date stops the run (64.674084ms)
✔ break: a named aliases file that does not exist stops the run (62.288458ms)
✔ posting age is shown and flagged, but never changes a score (135.682583ms)
✔ fit floor: a low-fit Apply is capped at Consider, never raised, and the scorer output is kept (121.223625ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1143.092708
[exit 0]

$ node scripts/conformance.mjs scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/ recipes/cases/2026fa/
conformance: 23 files (3 md · 14 json · 6 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit 0]
```

### 5. The report the person reads (priority list, verbatim from `runs/screen-2026-10-20/screen-report.md`)

#### Priority list (highest priority first)

Order: **Apply now** → **Consider** → **Research first** (live posting, but no usable sponsorship record yet) → **Network, don't apply** (strong sponsor, posting closed) → **Skip** → **Out of scope**. Within a group, the higher score comes first.

| # | Priority | Company | Job | Location | Score | Sponsorship record | Fit | Posting live? | First posted `record` | What to do | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Apply now** | Sigma Computing | Data Engineer | New York City, NY | 0.525 | Proven · 136 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (89 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003) |
| 2 | **Apply now** | Sigma Computing | Data Engineer | San Francisco, CA | 0.525 | Proven · 136 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (89 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003) |
| 3 | **Apply now** | Klaviyo | Analytics Engineer | Boston, MA | 0.525 | Proven · 154 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (89 d) | Tailor an application (research-and-apply hours). | [open](https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003) |
| 4 | **Apply now** | Klaviyo | Senior Software Engineer - Data Automation | Boston, MA | 0.465 | Proven · 154 approvals | 0.5 | ✅ open · API 200 | 2026-10-19 (1 d) | Tailor an application (research-and-apply hours). | [open](https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003) |
| 5 | **Apply now** | Gusto, Inc. | Senior Data Engineer | Denver, CO - Hybrid; New York, NY - Hybrid; San Francisco, CA - Hybrid | 0.465 | Proven · 218 approvals | 0.5 | ✅ open · API 200 | 2026-08-14 (67 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/gusto/jobs/8099751) |
| 6 | **Consider** | Klaviyo | Senior Lead Software Engineer - Data Platform | Boston, MA | 0.405 (scorer: Apply; capped, fit below floor) | Proven · 154 approvals | 0.3 | ✅ open · API 200 | 2026-07-22 (90 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003) |
| 7 | **Consider** | Roku | Senior Data Engineer, Data Governance Lead | Austin, Texas | 0.405 (scorer: Apply; capped, fit below floor) | Proven · 654 approvals | 0.3 | ✅ open · API 200 | 2026-09-14 (36 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://www.weareroku.com/jobs/8201216?gh_jid=8201216) |
| 8 | **Consider** | Airbnb | Senior Staff Data Engineer - Data Stewardship | United States | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-06-10 (132 d) ⚠️ possibly evergreen | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/7998356?gh_jid=7998356) |
| 9 | **Consider** | Airbnb | Senior Staff Data Engineer, Foundational Data | United States | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-22 (28 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8224032?gh_jid=8224032) |
| 10 | **Consider** | Airbnb | Staff Data Engineer, Tech Foundations | San Francisco, CA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-10-16 (4 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8284841?gh_jid=8284841) |
| 11 | **Consider** | Airbnb | Staff Software Engineer, Data Authoring | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-10-09 (11 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8242248?gh_jid=8242248) |
| 12 | **Consider** | Airbnb | Staff Software Engineer, Data Catalog | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-09 (41 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8154705?gh_jid=8154705) |
| 13 | **Consider** | Airbnb | Staff Software Engineer, Data Warehouse | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-11 (39 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8197715?gh_jid=8197715) |
| 14 | **Research first** | Gemini | Senior Data Engineer | New York, New York; Miami, Florida; Remote (USA) | — | pending alias review → GEMINI SPACE STATION LLC (would be Proven · 24 approvals; not used) | 0.5 | ✅ open · API 200 | 2026-07-21 (91 d) | An alias to a legal name is proposed but not yet reviewed. Confirm it is the same employer (G1), set reviewed_by_person in aliases.json, then re-run. | [open](https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827) |
| 15 | **Research first** | Robinhood | Senior Software Engineer, Data Engineering | Menlo Park, CA | — | pending alias review → ROBINHOOD MARKETS INC (would be Possible · 824 approvals; not used) | 0.5 | ✅ open · API 200 | 2022-12-08 (1412 d) ⚠️ possibly evergreen | An alias to a legal name is proposed but not yet reviewed. Confirm it is the same employer (G1), set reviewed_by_person in aliases.json, then re-run. | [open](https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660) |
| 16 | **Research first** | Upstart | Senior Data Platform Engineer | United States | Remote | — | pending alias review → UPSTART NETWORK INC (would be Proven · 316 approvals; not used) | 0.5 | ✅ open · API 200 | 2026-09-29 (21 d) | An alias to a legal name is proposed but not yet reviewed. Confirm it is the same employer (G1), set reviewed_by_person in aliases.json, then re-run. | [open](https://careers.upstart.com/jobs?gh_jid=8214129) |
| 17 | **Research first** | Unite Us | Senior Data Engineer  | United States | — | pending alias review → UNITE USA INC (would be Proven · 22 approvals; not used) | 0.5 | ✅ open · API 200 | 2026-09-23 (27 d) | An alias to a legal name is proposed but not yet reviewed. Confirm it is the same employer (G1), set reviewed_by_person in aliases.json, then re-run. | [open](https://job-boards.greenhouse.io/uniteus/jobs/8840770002) |
| 18 | **Research first** | Robinhood | Senior Staff Software Engineer, Data Platform | Bellevue, WA | — | pending alias review → ROBINHOOD MARKETS INC (would be Possible · 824 approvals; not used) | 0.3 | ✅ open · API 200 | 2026-03-18 (216 d) ⚠️ possibly evergreen | An alias to a legal name is proposed but not yet reviewed. Confirm it is the same employer (G1), set reviewed_by_person in aliases.json, then re-run. | [open](https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014) |
| 19 | **Skip** | Stripe | Software Engineer, Data Orchestration | N/A | 0.000 | Possible · 1250 approvals | 0.7 | ❌ uncertain · API 200 | 2025-11-07 (347 d) ⚠️ possibly evergreen | Skip. Time is better spent elsewhere. | [open](https://stripe.com/jobs/search?gh_jid=7230670) |

Full report: `runs/screen-2026-10-20/screen-report.md`. Agent log: `runs/screen-2026-10-20/screen-log.json`.

### 6. Live run, 2026-10-21: every gate cleared by a person (v0.5.1)

On 2026-10-21 I went through the 2026-10-20 report's "You must confirm" list myself:
- **G1:** I accepted all four aliases, checking each legal name with a Google search, and I confirmed the six exact matches.
- **G2:** I opened all 18 "active" links. Each one shows its job.
- **The three long-open postings:** each page shows the job, but I did not find out whether they are still being filled, so I am not acting on them.
- **G3:** I confirmed the timeline inputs.

The decisions are recorded in `aliases.json` (`reviewed_by_person`, `reviewed_on`, `review_note`) and in `logs/runs/2026fa-ethangomes14-7.md`. Liveness and the Greenhouse API were then re-checked the same day, and the screen was re-run with `--mode live`. I read the new report (G4).

**Liveness, re-checked** (`samples/liveness-2026-10-21.txt`, verbatim):

```text
# checked: 2026-10-21
# command: npm run ats:liveness -- <the 19 URLs below>

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003 https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003 https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003 https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003 https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003 https://job-boards.greenhouse.io/gusto/jobs/8099751 https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827 https://careers.airbnb.com/positions/7998356?gh_jid=7998356 https://careers.airbnb.com/positions/8224032?gh_jid=8224032 https://careers.airbnb.com/positions/8284841?gh_jid=8284841 https://careers.airbnb.com/positions/8242248?gh_jid=8242248 https://careers.airbnb.com/positions/8154705?gh_jid=8154705 https://careers.airbnb.com/positions/8197715?gh_jid=8197715 https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660 https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014 https://stripe.com/jobs/search?gh_jid=7230670 https://www.weareroku.com/jobs/8201216?gh_jid=8201216 https://careers.upstart.com/jobs?gh_jid=8214129 https://job-boards.greenhouse.io/uniteus/jobs/8840770002

Checking 19 URL(s)...

✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003
✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003
✅ active     https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003
✅ active     https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003
✅ active     https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003
✅ active     https://job-boards.greenhouse.io/gusto/jobs/8099751
✅ active     https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827
✅ active     https://careers.airbnb.com/positions/7998356?gh_jid=7998356
✅ active     https://careers.airbnb.com/positions/8224032?gh_jid=8224032
✅ active     https://careers.airbnb.com/positions/8284841?gh_jid=8284841
✅ active     https://careers.airbnb.com/positions/8242248?gh_jid=8242248
✅ active     https://careers.airbnb.com/positions/8154705?gh_jid=8154705
✅ active     https://careers.airbnb.com/positions/8197715?gh_jid=8197715
✅ active     https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660
✅ active     https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014
⚠️ uncertain  https://stripe.com/jobs/search?gh_jid=7230670
           content present but no visible apply control found
✅ active     https://www.weareroku.com/jobs/8201216?gh_jid=8201216
✅ active     https://careers.upstart.com/jobs?gh_jid=8214129
✅ active     https://job-boards.greenhouse.io/uniteus/jobs/8840770002

Results: 18 active  0 expired  1 uncertain
# ats:liveness exited non-zero (it exits 1 if any URL is expired or uncertain)
```

**Greenhouse API, re-checked** (`runs/terminal-greenhouse-2026-10-21.txt`; the last lines, all 19 rows are `200 exists`):

```text
200  exists   uniteus/8840770002  https://job-boards.greenhouse.io/uniteus/jobs/8840770002

19 checked · 0 skipped → scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json
[exit 0]
```

**The live screen and its CSV cross-check** (`runs/terminal-live-2026-10-21.txt`, verbatim):

```text
# Live run · 2026-10-21 20:42 EDT · gates G1 (aliases) and G2 (links) reviewed by Ethan Gomes 2026-10-21 · fresh ats:liveness and Greenhouse checks the same day

$ node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --mode live --today 2026-10-21 --candidates scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/candidates-2026-10-20.json --liveness scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/liveness-2026-10-21.txt --greenhouse-status scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/greenhouse-status-2026-10-21.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-21-live
sponsor-screen: 19 candidates → Apply 8 · Consider 10 · Skip 1 · unscored 0 (skip+unscored 5%)
  fit floor: 2 Apply capped at Consider (fit < 0.4): klaviyo-7809608003, roku-8201216
  greenhouse cross-check: 19 checked (status file 2026-10-21)
  aliases: 4 in file · matched 5 (gemini-8076827, robinhood-4738660, robinhood-7729014, upstart-8214129, uniteus-8840770002) · pending review 0
  timeline gate: factor 1 [your-input] · earliest start 2027-03-01 · practical deadline 2027-05-20 · slack 80 days
  assignments/submissions/ethangomes14/runs/screen-2026-10-21-live/screen-log.json  +  assignments/submissions/ethangomes14/runs/screen-2026-10-21-live/screen-report.md
[exit 0]

$ python3 -I assignments/submissions/ethangomes14/runs/verify-against-csv.py assignments/submissions/ethangomes14/runs/screen-2026-10-21-live/screen-log.json
csv rows: python=30369 log=30369 match=True
csv sha256 match: True
row accounting: 19 == 0+8+10+1 -> True
  sigmacomputing-7809974003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  sigmacomputing-7809973003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  klaviyo-7737707003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-7809608003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-8012938003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  gusto-8099751                GUSTO INC                  approvals csv=218.0   log=218    OK
  gemini-8076827               GEMINI SPACE STATION LLC   approvals csv=24.0    log=24     OK
  airbnb-7998356               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8224032               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8284841               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8242248               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8154705               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8197715               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  robinhood-4738660            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  robinhood-7729014            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  stripe-7230670               STRIPE INC                 approvals csv=1250.0  log=1250   OK
  roku-8201216                 ROKU INC                   approvals csv=654.0   log=654    OK
  upstart-8214129              UPSTART NETWORK INC        approvals csv=316.0   log=316    OK
  uniteus-8840770002           UNITE USA INC              approvals csv=22.0    log=22     OK
fit floor: 2 capped ['klaviyo-7809608003', 'roku-8201216'] · raised above the scorer: 0
mismatches: 0 · closed-gate rows not Skip: 0 · invariant violations in log: 0
[exit 0]
```

**Priority list from the live report** (verbatim from `runs/screen-2026-10-21-live/screen-report.md`):

| # | Priority | Company | Job | Location | Score | Sponsorship record | Fit | Posting live? | First posted `record` | What to do | Link |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Apply now** | Sigma Computing | Data Engineer | New York City, NY | 0.525 | Proven · 136 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (90 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/sigmacomputing/jobs/7809974003) |
| 2 | **Apply now** | Sigma Computing | Data Engineer | San Francisco, CA | 0.525 | Proven · 136 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (90 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/sigmacomputing/jobs/7809973003) |
| 3 | **Apply now** | Klaviyo | Analytics Engineer | Boston, MA | 0.525 | Proven · 154 approvals | 0.7 | ✅ open · API 200 | 2026-07-23 (90 d) | Tailor an application (research-and-apply hours). | [open](https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003) |
| 4 | **Apply now** | Klaviyo | Senior Software Engineer - Data Automation | Boston, MA | 0.465 | Proven · 154 approvals | 0.5 | ✅ open · API 200 | 2026-10-19 (2 d) | Tailor an application (research-and-apply hours). | [open](https://www.klaviyo.com/careers/jobs/8012938003?gh_jid=8012938003) |
| 5 | **Apply now** | Gusto, Inc. | Senior Data Engineer | Denver, CO - Hybrid; New York, NY - Hybrid; San Francisco, CA - Hybrid | 0.465 | Proven · 218 approvals | 0.5 | ✅ open · API 200 | 2026-08-14 (68 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/gusto/jobs/8099751) |
| 6 | **Apply now** | Gemini | Senior Data Engineer | New York, New York; Miami, Florida; Remote (USA) | 0.465 | Proven · 24 approvals (via alias → GEMINI SPACE STATION LLC) | 0.5 | ✅ open · API 200 | 2026-07-21 (92 d) | Tailor an application (research-and-apply hours). | [open](https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827) |
| 7 | **Apply now** | Upstart | Senior Data Platform Engineer | United States | Remote | 0.465 | Proven · 316 approvals (via alias → UPSTART NETWORK INC) | 0.5 | ✅ open · API 200 | 2026-09-29 (22 d) | Tailor an application (research-and-apply hours). | [open](https://careers.upstart.com/jobs?gh_jid=8214129) |
| 8 | **Apply now** | Unite Us | Senior Data Engineer  | United States | 0.465 | Proven · 22 approvals (via alias → UNITE USA INC) | 0.5 | ✅ open · API 200 | 2026-09-23 (28 d) | Tailor an application (research-and-apply hours). | [open](https://job-boards.greenhouse.io/uniteus/jobs/8840770002) |
| 9 | **Consider** | Klaviyo | Senior Lead Software Engineer - Data Platform | Boston, MA | 0.405 (scorer: Apply; capped, fit below floor) | Proven · 154 approvals | 0.3 | ✅ open · API 200 | 2026-07-22 (91 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://www.klaviyo.com/careers/jobs/7809608003?gh_jid=7809608003) |
| 10 | **Consider** | Roku | Senior Data Engineer, Data Governance Lead | Austin, Texas | 0.405 (scorer: Apply; capped, fit below floor) | Proven · 654 approvals | 0.3 | ✅ open · API 200 | 2026-09-14 (37 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://www.weareroku.com/jobs/8201216?gh_jid=8201216) |
| 11 | **Consider** | Robinhood | Senior Software Engineer, Data Engineering | Menlo Park, CA | 0.290 | Possible · 824 approvals (via alias → ROBINHOOD MARKETS INC) | 0.5 | ✅ open · API 200 | 2022-12-08 (1413 d) ⚠️ possibly evergreen | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://boards.greenhouse.io/robinhood/jobs/4738660?t=gh_src=&gh_jid=4738660) |
| 12 | **Consider** | Airbnb | Senior Staff Data Engineer - Data Stewardship | United States | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-06-10 (133 d) ⚠️ possibly evergreen | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/7998356?gh_jid=7998356) |
| 13 | **Consider** | Airbnb | Senior Staff Data Engineer, Foundational Data | United States | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-22 (29 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8224032?gh_jid=8224032) |
| 14 | **Consider** | Airbnb | Staff Data Engineer, Tech Foundations | San Francisco, CA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-10-16 (5 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8284841?gh_jid=8284841) |
| 15 | **Consider** | Airbnb | Staff Software Engineer, Data Authoring | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-10-09 (12 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8242248?gh_jid=8242248) |
| 16 | **Consider** | Airbnb | Staff Software Engineer, Data Catalog | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-09 (42 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8154705?gh_jid=8154705) |
| 17 | **Consider** | Airbnb | Staff Software Engineer, Data Warehouse | USA | 0.230 | Possible · 1000 approvals | 0.3 | ✅ open · API 200 | 2026-09-11 (40 d) | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://careers.airbnb.com/positions/8197715?gh_jid=8197715) |
| 18 | **Consider** | Robinhood | Senior Staff Software Engineer, Data Platform | Bellevue, WA | 0.230 | Possible · 824 approvals (via alias → ROBINHOOD MARKETS INC) | 0.3 | ✅ open · API 200 | 2026-03-18 (217 d) ⚠️ possibly evergreen | Check the soft spot named in "why"; if it holds up, talk to someone at the company before applying (networking hours). | [open](https://boards.greenhouse.io/robinhood/jobs/7729014?t=gh_src=&gh_jid=7729014) |
| 19 | **Skip** | Stripe | Software Engineer, Data Orchestration | N/A | 0.000 | Possible · 1250 approvals | 0.7 | ❌ uncertain · API 200 | 2025-11-07 (348 d) ⚠️ possibly evergreen | Skip. Time is better spent elsewhere. | [open](https://stripe.com/jobs/search?gh_jid=7230670) |

**What changed from the sample run.**
- **The five alias rows are scored.** Gemini, Upstart and Unite Us came out Apply (Proven), and both Robinhood postings came out Consider (Possible: no Data Engineer title in their top five).
- **Unscored dropped from 5 to 0.** Skip plus unscored fell from 32% to 5%. That is well below the ~50% a healthy run skips (the scorer warns about it), but these boards were chosen *because* the companies sponsor. A low skip rate is expected here and is not evidence the gates are loose.

**What broke on the live run, and the fix.** The first Greenhouse fetch ran at 20:40 EDT. The script dated it with the UTC date, **2026-10-22**, a day "ahead" of the screen's local `--today 2026-10-21`. The screen treated a check dated in the future as unusable, so the first live output reported `greenhouse cross-check: 0 checked (status file 2026-10-22)`. It failed safe: no gate opened, and the counts were the same. But the run had silently lost its API cross-check.
- **The fix:** `localToday()` in `lib.mjs`, now used by the screen, the fetch script and discovery, plus a test.
- **Re-fetched and re-run:** 19/19 cross-checked.
- **Kept as evidence:** the mis-dated file and that first output, as `samples/greenhouse-status-2026-10-21-BUG-utc-dated.json` and `runs/screen-2026-10-21-live-BUG-before-date-fix/`.

The same run showed the log's `mode` field was hardcoded `sample`. `--mode live` now records it.

## Verified vs. inferred

| Claim in the output | Verified (data or script) | Inferred (judgment) | By |
|---|---|---|---|
| These 23 postings were listed on these boards on 2026-10-20, with these titles, locations and first-published dates | ✅ Greenhouse API, saved | | `find-greenhouse-postings.mjs` |
| These titles are "Data Engineer-family" | | ✅ the title rule | Claude's rule, accepted by the author |
| These 19 of 23 are the candidates (US or unstated location) | | ✅ selection | Claude |
| Each posting's fit (0.3 / 0.5 / 0.7) | | ✅ from title, level, location only | Claude |
| 18 links `active`, Stripe `uncertain` | ✅ `ats:liveness` output | | engine script |
| All 19 job IDs exist; invented Airbnb ID `1` is gone | ✅ API 200 / 404 | | `fetch-greenhouse-status.mjs` |
| The `active` pages show *this* job, not a careers page | | not checked yet | **G2: needs a person** |
| Sigma 136, Klaviyo 154, Gusto 218, Roku 654, Airbnb 1000, Stripe 1250 approvals | ✅ CSV row, cross-checked 19/19 with Python `csv` | | sponsor CSV |
| Those approvals mean the company sponsors *now*, for *Data Engineers* | | ❌ cannot be inferred: undated, company-wide | — |
| Sigma / Klaviyo / Gusto / Roku are **Proven**; Airbnb / Stripe are **Possible** | ✅ arithmetic on record values | ✅ the tier rule and p values | rule: Claude; inputs: record |
| "Gemini" = GEMINI SPACE STATION LLC, "Robinhood" = ROBINHOOD MARKETS INC, "Upstart" = UPSTART NETWORK INC, "Unite Us" = UNITE USA INC | ✅ each target row exists, exactly once | ✅ that brand and entity are the same company | **G1: needs a person** (aliases unreviewed, so not used) |
| Earliest start 2027-03-01, deadline 2027-05-20, slack 80 days → factor 1 | ✅ arithmetic | inputs are `your-input` (fictional persona) | `lib.mjs` |
| Composite scores and Apply / Consider / Skip | ✅ existing scorer's arithmetic (`(0.9·0.35 + 0.7·0.3) × 1 × 1 = 0.525`) | the weights and thresholds are the scorer's authored choices | `role-scorer.mjs` |
| Klaviyo "Senior Lead" and Roku "Governance Lead" are Consider, not Apply | ✅ the rule is applied mechanically and can only lower a result (checked again in Python: 0 raised) | ✅ the 0.4 floor itself | rule: your-input (author, 2026-10-20) |
| Robinhood's 2022 posting is "possibly evergreen" | ✅ age 1,412 days (record) | ✅ the 120-day threshold, and the word "evergreen" | rule: your-input |
| No closed gate scored above Skip | ✅ invariant check in the screen, and again in the Python cross-check | | both |
| **Live run, 2026-10-21:** each of the four aliases is the same company as its legal name | ✅ each target row exists, exactly once | ✅ same employer, checked with a Google search | **Ethan (G1)**, recorded in `aliases.json` |
| **Live:** each of the 18 "active" pages shows that job | ✅ `ats:liveness` active and API 200 on 2026-10-21 | ✅ a person looked at each page | **Ethan (G2)** |
| **Live:** the three long-open postings are still being filled | | ❌ not established, so not acted on | Ethan (G2, recorded as unknown) |
| **Live:** Apply 8 · Consider 10 · Skip 1 · unscored 0 | ✅ screen and scorer arithmetic; CSV cross-check 19/19 | the alias decisions above feed it | `sponsor-screen.mjs` |

## Verification: how I know the output is real

1. **Independent re-parse.** `runs/verify-against-csv.py` reads the CSV with Python's `csv` module (not the mode's own parser) and checks every CSV-backed value in the log:

```text
$ python3 -I assignments/submissions/ethangomes14/runs/verify-against-csv.py assignments/submissions/ethangomes14/runs/screen-2026-10-20/screen-log.json
csv rows: python=30369 log=30369 match=True
csv sha256 match: True
row accounting: 19 == 5+5+8+1 -> True
  sigmacomputing-7809974003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  sigmacomputing-7809973003    SIGMA COMPUTING INC        approvals csv=136.0   log=136    OK
  klaviyo-7737707003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-7809608003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  klaviyo-8012938003           KLAVIYO INC                approvals csv=154.0   log=154    OK
  gusto-8099751                GUSTO INC                  approvals csv=218.0   log=218    OK
  gemini-8076827               GEMINI SPACE STATION LLC   approvals csv=24.0    log=24     OK
  airbnb-7998356               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8224032               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8284841               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8242248               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8154705               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  airbnb-8197715               AIRBNB INC                 approvals csv=1000.0  log=1000   OK
  robinhood-4738660            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  robinhood-7729014            ROBINHOOD MARKETS INC      approvals csv=824.0   log=824    OK
  stripe-7230670               STRIPE INC                 approvals csv=1250.0  log=1250   OK
  roku-8201216                 ROKU INC                   approvals csv=654.0   log=654    OK
  upstart-8214129              UPSTART NETWORK INC        approvals csv=316.0   log=316    OK
  uniteus-8840770002           UNITE USA INC              approvals csv=22.0    log=22     OK
fit floor: 2 capped ['klaviyo-7809608003', 'roku-8201216'] · raised above the scorer: 0
mismatches: 0 · closed-gate rows not Skip: 0 · invariant violations in log: 0
[exit 0]
```

2. **Row accounting.** 19 = 5 unscored + 5 Apply + 8 Consider + 1 Skip (in the output above).
3. **Input hashes.** The log records the sha256 of every input; the CSV hash matches the file on disk.
4. **Reproduction.** The 2026-10-03 inputs on v0.5.0 (`--today 2026-10-03`) give the same Apply 3 · Consider 1 · Skip 1 · unscored 2 as v0.4.0. The only difference is that Gemini and Robinhood's reason changed from `not-in-csv` to `alias-pending-review`.
5. **Repeat checks against the same postings 17 days apart.** The 7 postings from 2026-10-03 were all still listed, still `active` (Stripe still `uncertain`), and still API 200 on 2026-10-20.
6. **Deliberate break attempts.** See the attestation: seven on real inputs, plus the test suite.
7. **Conformance and repo checks.** `node scripts/conformance.mjs …` passes. `npm run verify` and `npm run doctor` pass, with three pre-existing warnings. W2 claims `private/` and `data/ats/` are not gitignored; `git check-ignore` shows `/private/*` and `/data/ats/*` are ignored, so the warning is a pattern-matching false alarm, unchanged from upstream.

## Attestation

- Recipe: ethangomes14-data-engineer-h1b v0.5.1
- By: Ethan Gomes · 2026-10-21

This is the current attestation. It covers v0.5.1 after the live run. That run changed code (the `--mode` label and the local-date fix) and `aliases.json` (my reviews), which voided the v0.5.0 attestation below; that one is kept for the record.

Every row below was run on the final files. The sha256 of each attested file is at the top of `runs/terminal-attestation-v0.5.1-2026-10-21.txt`; for example, recipe `c5d1d97ac334`, `sponsor-screen.mjs` `6ad6d9f057ca`, `lib.mjs` `0cc2daac9040` and `aliases.json` `8d73af90403c`. The suite was re-run after wording-only edits to the recipe (its lifecycle lines, and its pointer to the new change brief); the results were identical each time. Any later edit to one of them voids this attestation.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| **G1 (me):** checked each alias's legal name with a Google search; reviewed the six exact matches | All four aliases are the same companies; the exact matches and their titles are right. Recorded in `aliases.json` | A recorded decision for every company |
| **G2 (me):** opened all 18 "active" links | Each page shows its job. The three long-open postings show the job, but whether they are still being filled is unknown | A recorded decision for every link |
| **G3 (me):** checked the persona timeline | OPT 2027-03-01, 90 days, 0 used, 10-day buffer, 45-day lag → deadline 2027-05-20, slack 80 | The values I intend |
| `npm run ats:liveness` on the 19 URLs, 2026-10-21 | 18 active, 1 uncertain (Stripe) | A fresh verdict for every URL |
| `fetch-greenhouse-status.mjs` (after the date fix) | 19 × 200, file dated 2026-10-21 | Every job exists; dated today |
| Live screen, `--mode live --today 2026-10-21` | Apply 8 · Consider 10 · Skip 1 · unscored 0; Greenhouse cross-check 19/19; log says `mode: live` | Every row scored now that the aliases are reviewed; no gate opened by the aliases |
| **G4 (me):** read `runs/screen-2026-10-21-live/screen-report.md` | The priority list matches the run | A report I can act on |
| Python `csv` cross-check of the live log | 19/19 values match; CSV hash match; 0 closed-gate rows not Skip | Exact agreement |
| Sample run with the frozen alias file | Apply 5 · Consider 8 · Skip 1 · unscored 5 | Identical to 2026-10-20 |
| **Break:** live run with the 2026-10-03 liveness file (stale; 7 of the 19 URLs in it) | Skip 7 · unscored 12 (`url-not-in-liveness-log`); nothing Apply | A stale or missing liveness check closes the gate |
| **Break:** invented Airbnb job ID that `ats:liveness` calls active | Skip; API 404 closes the gate | A dead posting is never Apply |
| **Break:** live run evaluated on 2027-06-01 | Skip 19; timeline closed (and the liveness file is stale) | Nothing Apply after the OPT deadline |
| **Break:** `--mode verified` | `STOP: --mode must be one of sample, live`, exit 2, nothing written | A status can't be claimed through a flag |
| **Break:** `--out-dir data/80-days-to-stay` | `STOP …refusing to write there`, exit 2 | Never write into shared data |
| **Break:** discovery with a malformed board token / `--out data/x.json` (2026-10-21, `runs/terminal-discovery-break-2026-10-21.txt`) | `STOP`, exit 2 both times; no file written | Refuse bad input and writes outside its folder |
| `node --test …/sponsor-screen.test.mjs` | 23/23 pass | All pass |
| `node scripts/conformance.mjs` on everything I changed · `npm run verify` · `npm run doctor` | all pass; "no private/PII paths are tracked" | Pass |

### Did not test

- **Whether the three long-open postings are being filled** (Robinhood ×2, Airbnb Data Stewardship). I didn't ask a recruiter. Recorded as unknown; I am not acting on them.
- **The legal names beyond a Google search.** I didn't read each company's terms page or an SEC filing. The Unite Us row's website field (`unite-usa.com`) still differs from the company's domain.
- **A fresh discovery run.** The live run re-checked the 19 postings found on 2026-10-20; it didn't search the boards again for new postings.
- **Whether any company sponsors today.** The sponsor file's approvals have no dates.
- **Whether the fit ratings are any good.** They are Claude's, from titles only; no job descriptions or résumé were read.
- **Non-Greenhouse boards** (Lever, Ashby, Workday), and companies headquartered outside CA, NY, MA, WA, TX and IL.
- **Node 20** (the CI version). Run on Node v25.8.0 only.
- **A clean checkout of v0.5.1** (only v0.4.0 was tested from a fresh clone).

### Broke during testing, fixed

- **UTC dates.** `fetch-greenhouse-status.mjs` stamped my 20:40 EDT check as 2026-10-22. The screen (local date 2026-10-21) treated it as unusable, so the first live run reported "0 checked" and lost its API cross-check. That was safe, but it was easy to miss. Fixed with `localToday()` in `lib.mjs`, used by all three scripts, plus a test. The same bug was fixed in `find-greenhouse-postings.mjs` before it bit. The broken outputs are kept: `samples/greenhouse-status-2026-10-21-BUG-utc-dated.json` and `runs/screen-2026-10-21-live-BUG-before-date-fix/`.
- **The live run would have been logged as "sample".** `mode` was hardcoded. Added `--mode sample|live` (default `sample`, anything else refused), plus a test.
- **The reproduce commands would have drifted.** Reviewing the aliases changed `aliases.json`, so the documented 2026-10-20 command no longer gave its documented result. I froze the pre-review file as `samples/aliases-2026-10-20.json` (same hash as the 2026-10-20 run) and updated the commands in the README, the card and the recipe.

## Attestation — v0.5.0, 2026-10-21 (superseded by the v0.5.1 attestation above; kept for the record)

- Recipe: ethangomes14-data-engineer-h1b v0.5.0
- By: Ethan Gomes · 2026-10-21

This attestation replaces the one from 2026-10-20, which is kept below for the record. The constitution says any edit to a recipe after attestation voids it. On 2026-10-21 three text-only edits were made:
- a Purpose section was added to the recipe;
- the full `npm run verify` output was pasted into §0;
- the run log's break-attempt count was corrected from six to seven.

No script, rules file, alias file or sample input changed after 2026-10-20 08:48. Everything below was re-run after those edits, on the final files. The sha256 of every attested file is at the top of `runs/terminal-attestation-2026-10-21.txt`; recipe `f8071a1ccb2a`, `sponsor-screen.mjs` `1e7e067c4f6b`, `lib.mjs` `8367c7d968d3`, `rules.json` `862d23422045`. A later edit to any of them voids this attestation.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| I ran the README's reproduce commands (screen, tests, CSV cross-check) on my laptop | Apply 5 · Consider 8 · Skip 1 · unscored 5; 21/21 tests; 19/19 values match | The 2026-10-20 results |
| I read `runs/screen-2026-10-20/screen-report.md` | The priority list, the results table, the timeline gate, the "You must confirm" checklist, and the "cannot tell you" section | A report I can act on without opening the JSON log |
| Screen on the 19 postings (`--today 2026-10-20`), after the text edits | Apply 5 · Consider 8 · Skip 1 · unscored 5; fit floor capped 2 | Identical to 2026-10-20 |
| Python `csv` cross-check of that log | CSV hash match; 0 mismatches; 0 closed-gate rows not Skip; 0 invariant violations | Exact agreement |
| **Break:** the 2026-10-03 liveness file evaluated on 2026-10-20 (stale) | Skip 5 · unscored 2; nothing Apply | A stale liveness check closes the gate |
| **Break:** `--out-dir data/80-days-to-stay` | `STOP …refusing to write there`, exit 2 | Never write into shared data |
| **Break:** discovery with a malformed board token / `--out data/x.json` | `STOP`, exit 2 both times; no file written (`runs/terminal-discovery-break-2026-10-21.txt`) | Refuse bad input and writes outside its folder |
| `node --test …/sponsor-screen.test.mjs` (includes the gate-ignoring scorer, missing-CSV and alias break tests) | 21/21 pass | All pass |
| `node scripts/conformance.mjs` on the scripts, recipe, submission and run log · `npm run verify` · `npm run doctor` | all pass; doctor: "no private/PII paths are tracked" | Pass |

Transcript of the re-run after the edits: `runs/terminal-attestation-2026-10-21.txt`. The remaining break attempts (invented job ID, no-fit skeleton, unreviewed-date alias, past the OPT deadline) ran on 2026-10-20 against the same unchanged scripts; see the superseded attestation below and `runs/terminal-2026-10-20.txt`.

### Did not test

- **G1 and G2 by a person.** None of the four aliases has been reviewed, and nobody has opened the 18 "active" links to confirm each shows the job. Until then, no Apply should be acted on, and the recipe stays below RUNNABLE-LIVE. Reading the report did not clear G4's "You must confirm" list, which depends on G1 and G2.
- **A fresh live run.** The network steps (discovery, `ats:liveness`, Greenhouse API) were not repeated on 2026-10-21. This attestation covers the saved 2026-10-20 inputs.
- **Non-Greenhouse boards** (Lever, Ashby, Workday). Discovery and the API cross-check cover Greenhouse only.
- **Companies headquartered outside CA, NY, MA, WA, TX, IL (P3).** All 10 companies here are in CA, NY or MA.
- **Node 20** (the CI version). Run on Node v25.8.0 only.
- **Whether any company sponsors today.** Not testable with this data.
- **Whether the fit ratings are any good.** No job descriptions or résumé were read.
- The 14 board tokens that returned 404 were wrong guesses. I did not look up their real boards.

### Broke during testing, fixed

- Nothing broke in the 2026-10-21 re-run. The three fixes found on 2026-10-20 are listed in the superseded attestation below.

## Attestation — 2026-10-20 (superseded by the 2026-10-21 attestation above; kept for the record)

- Recipe: ethangomes14-data-engineer-h1b v0.5.0
- By: prepared with Claude Code for Ethan Gomes · 2026-10-20. Ethan's own re-run on his laptop is still to be recorded (see "Did not test").

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `find-greenhouse-postings.mjs --boards samples/boards-2026-10-20.txt` | 37 asked, 23 answered, 23 family postings, written with `fit: null` | Real postings only from the allowed host; 404 boards listed, not guessed |
| `npm run ats:liveness -- <19 URLs>` | 18 active, 1 uncertain (Stripe) | A real verdict per URL |
| `fetch-greenhouse-status.mjs` on the 19 + ghost | 19 × 200, ghost × 404 | 200 for listed jobs, 404 for the invented ID |
| Screen on the 19 (`--today 2026-10-20`) | Apply 5 · Consider 8 · Skip 1 · unscored 5 (all `alias-pending-review`); fit floor capped 2; 0 invariant violations | Every row accounted for; nothing scored on an unreviewed alias; no low-fit Apply |
| Python `csv` cross-check of the log | 30,369 rows, hash match, 19/19 values match, 0 closed-gate non-Skips, 2 capped and 0 raised by the fit floor | Exact agreement |
| Screen on the 2026-10-03 sample (`--today 2026-10-03`) | Apply 3 · Consider 1 · Skip 1 · unscored 2 | Same counts as v0.4.0 |
| **Break:** the 17-day-old liveness file, evaluated on 2026-10-20 | Skip 5 · unscored 2; nothing Apply; Greenhouse check reported stale | A stale liveness check closes the gate; it is never trusted |
| **Break:** invented Airbnb job ID that `ats:liveness` calls active, with the fresh API file | Skip; `closed_by: greenhouse-api-404` | The API 404 closes the gate |
| **Break:** the discovery skeleton fed straight to the screen (no fit ratings) | 23 × `invalid-input-row`; nothing reached the scorer | Refuse to score without a fit rating |
| **Break:** `--out-dir data/80-days-to-stay` | `STOP …refusing to write there`, exit 2 | Never write into shared data |
| **Break:** an alias marked reviewed with no review date | `STOP: aliases file rejected…`, exit 2, no output | A review claim without evidence stops the run |
| **Break:** `--today 2027-06-01` on the 19 | Skip 14 · unscored 5; timeline factor 0, slack −57 | Past the OPT deadline nothing is Apply. The liveness file is also stale by then, so both gates are closed here; the F5 unit test isolates the timeline gate |
| **Break:** discovery with a malformed board token / `--out data/x.json` | `STOP`, exit 2 both times, no file written (re-captured 2026-10-21: `runs/terminal-discovery-break-2026-10-21.txt`) | Refuse bad input and writes outside its folder |
| `node --test …/sponsor-screen.test.mjs` | 21/21 pass | All pass |
| `node scripts/conformance.mjs …` · `npm run verify` · `npm run doctor` | all pass; 3 pre-existing warnings | Pass |

### Did not test

- **G1 and G2 by a person.** None of the four aliases has been reviewed, and nobody has opened the 18 "active" links to confirm each shows the job. Until then, no Apply should be acted on, and the recipe stays below RUNNABLE-LIVE.
- **Ethan's own re-run** of these commands on his machine (done for v0.4.0, not yet for v0.5.0).
- **Non-Greenhouse boards** (Lever, Ashby, Workday). Discovery and the API cross-check cover Greenhouse only.
- **Companies headquartered outside CA, NY, MA, WA, TX, IL (P3).** All 10 companies here are in CA, NY or MA.
- **Node 20** (the CI version). Run on the local Node only.
- **Whether any company sponsors today.** Not testable with this data.
- **Whether the fit ratings are any good.** No job descriptions or résumé were read.
- The 14 board tokens that returned 404 were wrong guesses. I did not look up their real boards.

### Broke during testing, fixed

- **Sales job in the Data Engineer family.** Discovery matched Stripe's "Account Executive, Product Sales (Data Pipeline)" through the `data pipeline` pattern. Fixed in `rules.json` → `exclusion_patterns` (`account executive`, `\bsales\b`), logged in the CHANGE-BRIEF revisions, covered by the title-family test, and re-checked against the live Stripe board (3 matches, sales job gone).
- **Fit had no effect for Proven sponsors.** The first 2026-10-20 run rated Klaviyo "Senior Lead" and Roku "Governance Lead" (fit 0.3) **Apply** (Apply 7 · Consider 6). After the author chose a fit floor of 0.4 (`rules.json` → `fit_floor`), both are capped at Consider, the scorer's own output is kept in the log, and a new test checks that the rule only ever lowers a result. Re-run: Apply 5 · Consider 8.
- **Duplicate checklist lines.** The report asked the same G1 alias question twice when one company had two postings (Robinhood). Fixed in `sponsor-screen.mjs` (one question per alias).
## Reflection

**What went well.**
- The gates held on real data. Nothing reached the scorer without evidence; the stale, ghost and skeleton break attempts all closed or refused.
- The alias design turned the biggest v0.4.0 miss into a five-minute human task. The report shows the tier each alias *would* unlock (Gemini and Upstart → Proven) without using it.
- Discovery made the mode usable on a fresh day. The 2026-10-03 run depended on postings found by hand.

**What the mode got wrong or missed.**
- **Fit didn't matter for a Proven sponsor.** 0.9 × 0.35 = 0.315 already clears the scorer's 0.3 Apply line, so Klaviyo's "Senior Lead" and Roku's "Governance Lead" (fit 0.3) came out **Apply** next to true new-grad roles: the Apply list was a sponsor list, not a fit list. I logged it as a `[TODO: DEFINE]` instead of changing the scorer. The author chose a floor of 0.4, applied after the scorer. It is still a blunt rule, and its value rests on Claude's title-only fit ratings.
- **The title rule leaked.** A sales role got through. I fixed this one, but a regex family will keep leaking at the edges.
- **The "Possible" tier hides big sponsors.** Airbnb (1,000 approvals) and Stripe (1,250) rate only Possible, because their top-5 titles have no Data Engineer title. Only dated, title-level data (the `[TODO: DATA SOURCE]`) fixes that.
- **Coverage.** 14 of 37 guessed boards were wrong, so discovery is only as good as the board list.
- **Dates (found on the live run).** Two network scripts used the UTC date, the screen the local one. After 8 pm Eastern they disagree, and an evening check looked like it came from tomorrow. The screen ignored it, which was safe, but the run silently lost a check, and only the one-line summary showed it ("0 checked"). Fixed in v0.5.1. Lesson: a fail-safe gate can still hide a lost check, so read the summary counts every run.
- **The human review is only as good as its method.** I checked the legal names with a Google search, which is quicker than reading each company's terms page or an SEC filing. The Unite Us row's website field (`unite-usa.com`) still doesn't match the company's domain.

**Next steps.**
1. ~~Ethan reviews the four aliases (G1), opens the 18 active links (G2), and asks about the three evergreen postings. Then re-run and log it as the first **RUNNABLE-LIVE** candidate.~~ Done on 2026-10-21, except the evergreen question: whether those three postings are being filled is still unknown. A recruiter or employee could answer it.
2. Ingest one fiscal year of DOL LCA disclosure data for SOC 15-1242 / 15-1252 (`[TODO: DATA SOURCE]`) to date sponsorship and see past the top-5 titles.
3. Add Lever and Ashby to discovery and the liveness cross-check.
