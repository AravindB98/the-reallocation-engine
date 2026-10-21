# Network targets — Meera Iyer (fictional) — 2026-10-21

## Executive summary

This report sorts software-engineering employers in MA and NY that have sponsored H-1B visas for software job titles into four groups, for a student who cannot start work until 2027-01-15.

- **Apply now: 4**: a matching software posting was listed on the company's own verified job board **and** showed an apply button in a real browser, and the engine's scorer said Apply or Consider.
- **Network first: 17**: strong sponsorship history, confirmed by Department of Labor software-developer wage filings, but no live matching opening. These are people to meet before a role opens, not applications.
- **Check the job board first: 108**: the board was not found or not confirmed as this company's, or its postings could not be read, so nothing is decided about them.
- **Skip: 4**.

Every number below is labeled: **record** (read from a dataset or a saved job board), **your-input** (an assumption or rule you set), or **model-judgment** (none in this run). Nothing here has been sent anywhere. A person must read this before any outreach or application.

## Run record

| Item | Value | Source |
|---|---|---|
| persona | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/persona.json` | — |
| csv | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | — |
| formd_dir | `data/sec/form-d/processed/sample` | — |
| bls | `data/bls/compact/soc_occupation_compact.csv` | — |
| boards | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/boards-snapshot.json` | — |
| liveness | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/liveness.json` | — |
| everify | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/everify.csv` | — |
| lca | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/data/lca-15-1252.csv` | — |
| scorer | `scripts/score/role-scorer.mjs` | — |
| out_dir | `course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live` | — |
| timeline.today | 2026-10-21 | your-input |
| timeline.opt_start_date | 2027-01-15 | your-input |
| timeline.opt_end_date | 2028-01-14 | your-input |
| timeline.unemployment_days_remaining | 90 | your-input |
| timeline.hiring_lag_days | 60 | your-input |
| timeline.work_window_end | 2027-04-15 | your-input |
| timeline.earliest_start | 2027-01-15 | your-input |
| timeline.slack_days | 90 | your-input |
| timeline.start_wait_days | 86 | your-input |
| timeline.factor | 1 | your-input |
| CSV rows read | 30369 | record |
| candidates after state + sponsored-title filter | 133 | record (filter is your-input) |
| Form D sample filings checked | 200 in 4 file(s) | record |
| candidates matched to a Form D sample filing | 0 of 133 | record |
| DOL LCA (SOC-coded) | LCA_Disclosure_Data_FY2026_Q3.xlsx, received 2025-09-24 … 2026-06-23; 64 matched; 50 tier(s) capped | record |
| E-Verify looked up | 22 of 133 (22 open) | record |
| browser liveness gate | browser (checked 2026-10-21T19:23:43.619Z); postings active 9, expired 1, uncertain 5 | record |
| scorer skip rate (scored roles only) | scored 29 roles → Apply 7 · Consider 0 · Skip 22 (skip 76%) | scorer output |

## Apply now

*Next action:* Tailor an application (2-hour research-and-apply block). First confirm the role can start on or after your OPT start date.

| Company | Location | Sponsorship [record → your-input tier] | SWE LCAs [record] | E-Verify [record] | Matching postings [record] · browser check | Why |
|---|---|---|---|---|---|---|
| COHERE HEALTH INC | BOSTON, MA | 104 approved / 2 denied → **Proven** | 12 US · 4 MA/NY · Level I 1 / II 3 · last 2026-05-29 | open | Software Engineer I, Integrations (United States) · **active** | scorer: Apply — composite 0.315 ≥ 0.3, gates healthy |
| JUSTWORKS INC | NEW YORK, NY | 80 approved / 2 denied → **Proven** | 2 US · 2 MA/NY · Level I 0 / II 0 · last 2026-05-20 | open | Software Engineer, Backend (New York, New York) · **active**<br>Software Engineer, Solutions Engineering (New York, New York) · **active** | scorer: Apply — composite 0.315 ≥ 0.3, gates healthy |
| KLAVIYO INC | BOSTON, MA | 154 approved / 4 denied → **Proven** | 36 US · 30 MA/NY · Level I 7 / II 4 · last 2026-06-12 | open | Full Stack Software Engineer - People Systems (Boston, MA) · **active**<br>Software Engineer II - Recommendations (Boston, MA) · **active**<br>Software Engineer II, Test Frameworks & Tooling (Boston, MA) · **active** | scorer: Apply — composite 0.315 ≥ 0.3, gates healthy |
| PATHAI INC | CAMBRIDGE, MA | 78 approved / 2 denied → **Proven** | 1 US · 1 MA/NY · Level I 0 / II 0 · last 2026-05-04 | open | Software Engineer I, Fullstack (Boston, MA (Hybrid)) · **active** | scorer: Apply — composite 0.315 ≥ 0.3, gates healthy |

## Network first

*Next action:* Informational-interview target (3-hour networking block). No live opening to apply to yet.

| Priority | Company | Location | Sponsorship | SWE LCAs [record] | E-Verify [record] | Latest funding [record] | Board checked [record] |
|---|---|---|---|---|---|---|---|
| A | ABACUS INSIGHTS INC | BOSTON, MA | 22 approved / 0 denied → **Proven** | 1 US · 0 MA/NY · Level I 1 / II 0 · last 2026-04-28 | open | Series A 2024-10-01 (recent) | 14 jobs, 0 matching, 2026-10-21T19:22:32.979Z |
| B | DATADOG INC | NEW YORK, NY | 340 approved / 0 denied → **Proven** | 27 US · 24 MA/NY · Level I 2 / II 3 · last 2026-06-15 | open | Series C 2015-12-28 (old) | 438 jobs, 0 matching, 2026-10-21T19:22:33.480Z |
| B | TOAST INC | BOSTON, MA | 150 approved / 4 denied → **Proven** | 17 US · 2 MA/NY · Level I 6 / II 0 · last 2026-06-16 | open | Series B 2015-12-23 (old) | 316 jobs, 0 matching, 2026-10-21T19:22:34.406Z |
| B | FLATIRON HEALTH INC | NEW YORK, NY | 98 approved / 0 denied → **Proven** | 6 US · 5 MA/NY · Level I 0 / II 3 · last 2026-05-20 | open | Series A 2012-10-29 (old) | 23 jobs, 0 matching, 2026-10-21T19:22:33.615Z |
| B | ATTENTIVE MOBILE INC | NEW YORK, NY | 96 approved / 0 denied → **Proven** | 8 US · 4 MA/NY · Level I 1 / II 0 · last 2026-06-16 | open | Series D+ 2020-09-09 (old) | 28 jobs, 0 matching, 2026-10-21T19:22:36.379Z |
| B | SQUARESPACE INC | New York, NY | 94 approved / 2 denied → **Proven** | 5 US · 5 MA/NY · Level I 0 / II 0 · last 2026-06-10 | open | Series D+ 2021-03-31 (old) | 28 jobs, 0 matching, 2026-10-21T19:22:34.268Z |
| B | CAMBRIDGE MOBILE TELEMATICS INC | CAMBRIDGE, MA | 72 approved / 0 denied → **Proven** | 4 US · 3 MA/NY · Level I 1 / II 0 · last 2026-05-08 | open | Seed 2014-08-11 (old) | 22 jobs, 0 matching, 2026-10-21T19:22:33.340Z |
| B | YEXT INC | NEW YORK, NY | 68 approved / 0 denied → **Proven** | 7 US · 6 MA/NY · Level I 0 / II 1 · last 2026-06-17 | open | Series C 2014-05-28 (old) | 25 jobs, 0 matching, 2026-10-21T19:22:34.605Z |
| B | LENDBUZZ INC | BOSTON, MA | 60 approved / 0 denied → **Proven** | 6 US · 6 MA/NY · Level I 1 / II 4 · last 2026-04-29 | open | Series C 2021-05-13 (old) | 55 jobs, 0 matching, 2026-10-21T19:22:34.759Z |
| B | SEATGEEK INC | NEW YORK, NY | 54 approved / 0 denied → **Proven** | 8 US · 2 MA/NY · Level I 1 / II 3 · last 2026-06-16 | open | Series C 2017-04-05 (old) | 38 jobs, 0 matching, 2026-10-21T19:22:34.221Z |
| B | VESTMARK INC | WAKEFIELD, MA | 52 approved / 0 denied → **Proven** | 5 US · 3 MA/NY · Level I 1 / II 1 · last 2026-06-03 | open | Series A 2017-09-27 (old) | 4 jobs, 0 matching, 2026-10-21T19:22:34.519Z |
| B | LOOKOUT INC | BOSTON, MA | 38 approved / 0 denied → **Proven** | 1 US · 0 MA/NY · Level I 0 / II 0 · last 2026-05-18 | open | Series B 2021-03-15 (old) | 2 jobs, 0 matching, 2026-10-21T19:22:33.985Z |
| B | MAVEN CLINIC CO | NEW YORK, NY | 32 approved / 0 denied → **Proven** | 3 US · 2 MA/NY · Level I 0 / II 1 · last 2026-06-05 | open | Series A 2017-06-13 (old) | 30 jobs, 0 matching, 2026-10-21T19:22:34.035Z |
| B | ZOCDOC INC | New York, NY | 32 approved / 2 denied → **Proven** | 8 US · 7 MA/NY · Level I 0 / II 0 · last 2026-05-27 | open | Series C 2015-07-23 (old) | 59 jobs, 0 matching, 2026-10-21T19:22:34.712Z |
| B | YIELDMO INC | NEW YORK, NY | 22 approved / 0 denied → **Proven** | 3 US · 0 MA/NY · Level I 0 / II 1 · last 2026-04-29 | open | Series A 2017-06-09 (old) | 3 jobs, 0 matching, 2026-10-21T19:22:34.663Z |
| B | ACQUIA INC | BURLINGTON, MA | 18 approved / 0 denied → **Proven** | 1 US · 0 MA/NY · Level I 0 / II 0 · last 2026-03-26 | open | Series C 2015-09-22 (old) | 5 jobs, 0 matching, 2026-10-21T19:22:33.182Z |
| B | ACUITYMD INC | SOMMERVILLE, MA | 16 approved / 0 denied → **Proven** | 2 US · 1 MA/NY · Level I 0 / II 1 · last 2026-06-09 | open | Series B 2022-03-09 (old) | 10 jobs, 0 matching, 2026-10-21T19:22:33.229Z |

## Check the job board first

*Next action:* Find this company's job board, add it to boards.json, run capture-boards.mjs, re-run. Decide nothing until then.

| Company | Location | Sponsorship | Latest funding | Why unchecked |
|---|---|---|---|---|
| 1UPHEALTH INC | BOSTON, MA | 12 approved / 0 denied → **Possible** (capped from Proven) | Series C 2023-04-03 (old) | liveness unchecked (no-snapshot) |
| ACTIONIQ INC | NEW YORK, NY | 16 approved / 0 denied → **Possible** (capped from Proven) | Series C 2021-03-08 (old) | liveness unchecked (no-snapshot) |
| AFFICIENCY INC | New York, NY | 20 approved / 2 denied → **Proven** | Series A 2022-03-21 (old) | liveness unchecked (no-snapshot) |
| AGENT TECHNOLOGIES INC | BROOKLYN, NY | 216 approved / 4 denied → **Possible** (capped from Proven) | Seed 2022-03-02 (old) | liveness unchecked (no-snapshot) |
| AION BIOSYSTEMS INC | LOWELL, MA | 2 approved / 0 denied → **Possible** | Seed 2024-04-01 (recent) | liveness unchecked (no-snapshot) |
| ALCOVE LABS INC | New York, NY | 2 approved / 0 denied → **Possible** | Seed 2022-08-24 (old) | liveness unchecked (no-snapshot) |
| AMPION PBC | BOSTON, MA | 18 approved / 0 denied → **Possible** (capped from Proven) | Series A 2020-12-11 (old) | liveness unchecked (no-snapshot) |
| APPLAUSE APP QUALITY INC | FRAMINGHAM, MA | 38 approved / 0 denied → **Possible** (capped from Proven) | Series B 2016-08-24 (old) | liveness unchecked (no-snapshot) |
| AUGMENTED REALITY CONCEPTS INC | SYRACUSE, NY | 10 approved / 0 denied → **Proven** | Series D+ 2022-12-19 (old) | liveness unchecked (no-snapshot) |
| AVA ROBOTICS INC | CAMBRIDGE, MA | 2 approved / 0 denied → **Possible** | Seed 2019-04-08 (old) | liveness unchecked (no-snapshot) |
| BARKING LABS CORP | BROOKLYN, NY | 2 approved / 0 denied → **Possible** | Series B 2021-02-05 (old) | liveness unchecked (no-snapshot) |
| BELFRY SOFTWARE INC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series B 2024-10-28 (recent) | liveness unchecked (no-snapshot) |
| BENEFITS SCIENCE LLC | WALTHAM, MA | 18 approved / 0 denied → **Possible** (capped from Proven) | Seed 2018-07-16 (old) | liveness unchecked (no-snapshot) |
| BILT TECHNOLOGIES INC | NEW YORK, NY | 12 approved / 0 denied → **Proven** | Series D+ 2024-01-22 (recent) | liveness unchecked (no-snapshot) |
| BITSIGHT TECHNOLOGIES INC | CAMBRIDGE, MA | 30 approved / 0 denied → **Proven** | Series C 2018-06-26 (old) | liveness unchecked (no-snapshot) |
| BLUECORE INC | NEW YORK, NY | 20 approved / 0 denied → **Possible** (capped from Proven) | Series B 2024-10-29 (recent) | liveness unchecked (board-identity-unverified) |
| BOZBURUN INC | BROOKLYN, NY | 2 approved / 0 denied → **Possible** | Seed 2019-03-25 (old) | liveness unchecked (no-snapshot) |
| BRIDGE IT INC | NEW YORK, NY | 26 approved / 0 denied → **Proven** | Pre-Seed 2019-02-12 (old) | liveness unchecked (no-snapshot) |
| CADENCE GROUP INC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series A 2021-03-29 (old) | liveness unchecked (no-snapshot) |
| CARDFLIGHT INC | NEW YORK, NY | 10 approved / 0 denied → **Possible** (capped from Proven) | Pre-Seed 2014-09-09 (old) | liveness unchecked (no-snapshot) |
| CATCHPOINT SYSTEMS INC | NEW YORK, NY | 16 approved / 0 denied → **Possible** (capped from Proven) | Series B 2016-10-17 (old) | liveness unchecked (no-snapshot) |
| CELERO SYSTEMS INC | BROOKLINE, MA | 100 approved / 4 denied → **Possible** (capped from Proven) | Seed 2019-06-19 (old) | liveness unchecked (no-snapshot) |
| CENTAGE CORP | NATICK, MA | 2 approved / 0 denied → **Possible** | Series A 2019-01-24 (old) | liveness unchecked (no-snapshot) |
| CHAINALYSIS INC | NEW YORK, NY | 62 approved / 0 denied → **Proven** | Series C 2021-03-23 (old) | liveness unchecked (board-identity-unverified) |
| CINCH TECHNOLOGIES INC | NEW YORK, NY | 94 approved / 8 denied → **Possible** (capped from Proven) | Seed 2019-03-07 (old) | liveness unchecked (no-snapshot) |
| CINDER TECHNOLOGIES INC | New York, NY | 2 approved / 0 denied → **Possible** | Series A 2022-11-18 (old) | liveness unchecked (no-snapshot) |
| CLARAPATH INC | Hawthorne, NY | 6 approved / 0 denied → **Likely** | Series B 2023-03-20 (old) | liveness unchecked (no-snapshot) |
| DATAMINR INC | NEW YORK, NY | 58 approved / 2 denied → **Proven** | Series D+ 2021-03-22 (old) | liveness unchecked (board-identity-unverified) |
| DEEPFRAUD TECHNOLOGIES INC | NEW YORK, NY | 40 approved / 0 denied → **Possible** (capped from Proven) | Series A 2023-06-02 (old) | liveness unchecked (no-snapshot) |
| DELOITTE TAX LLP | NEW YORK, NY | 2176 approved / 16 denied → **Proven** | Series B 2022-01-07 (old) | liveness unchecked (no-snapshot) |
| DELOITTE TOUCHE TOHMATSU SERVICES INC | NEW YORK, NY | 242 approved / 2 denied → **Proven** | Pre-Seed 2018-01-12 (old) | liveness unchecked (no-snapshot) |
| DELOITTE TOUCHE TOHMATSU SERVICES LLC | NEW YORK, NY | 242 approved / 2 denied → **Proven** | Seed 2024-01-12 (recent) | liveness unchecked (no-snapshot) |
| DENVER TECHNOLOGIES INC | NEW YORK, NY | 4 approved / 0 denied → **Possible** (capped from Likely) | Series A 2020-06-02 (old) | liveness unchecked (no-snapshot) |
| DIMENSION TECHNOLOGIES INC | ROCHESTER, NY | 36 approved / 0 denied → **Possible** (capped from Proven) | — no date (unknown) | liveness unchecked (no-snapshot) |
| DYNOCARDIA INC | NEWTON CENTRE, MA | 2 approved / 0 denied → **Possible** | Pre-Seed 2025-03-04 (recent) | liveness unchecked (no-snapshot) |
| ELION THERAPEUTICS INC | NEW YORK, NY | 68 approved / 0 denied → **Possible** (capped from Proven) | Series B 2024-06-11 (recent) | liveness unchecked (no-snapshot) |
| ETSY INC | BROOKLYN, NY | 222 approved / 2 denied → **Proven** | Series A 2014-04-29 (old) | liveness unchecked (board-identity-unverified) |
| EXAMITY INC | Natick, MA | 6 approved / 0 denied → **Possible** (capped from Likely) | Seed 2018-04-17 (old) | liveness unchecked (no-snapshot) |
| EXTREME REACH INC | NEEDHAM, MA | 18 approved / 0 denied → **Proven** | Series C 2015-06-15 (old) | liveness unchecked (no-snapshot) |
| FIRST HELP FINANCIAL LLC | NEWTON, MA | 30 approved / 0 denied → **Proven** | Series C 2021-11-03 (old) | liveness unchecked (no-snapshot) |
| FORMLABS INC | Somerville, MA | 70 approved / 10 denied → **Likely** | Series A 2018-07-16 (old) | liveness unchecked (posting-liveness-unverified) |
| FOURSQUARE LABS INC | New York, NY | 56 approved / 0 denied → **Possible** (capped from Proven) | Seed 2025-04-07 (recent) | liveness unchecked (no-snapshot) |
| GENEVA TECHNOLOGIES INC | NEW YORK, NY | 4 approved / 0 denied → **Possible** (capped from Likely) | Series B 2022-09-02 (old) | liveness unchecked (no-snapshot) |
| GLIA TECHNOLOGIES INC | NEW YORK, NY | 30 approved / 0 denied → **Possible** (capped from Proven) | Series B 2022-06-22 (old) | liveness unchecked (no-snapshot) |
| GREENLIGHT BIOSCIENCES INC | Medford, MA | 16 approved / 0 denied → **Possible** (capped from Proven) | Series D+ 2020-06-15 (old) | liveness unchecked (no-snapshot) |
| GRO INTELLIGENCE INC | New York, NY | 12 approved / 0 denied → **Possible** (capped from Proven) | Series C 2020-12-22 (old) | liveness unchecked (no-snapshot) |
| HEALTHEDGE SOFTWARE INC | BURLINGTON, MA | 156 approved / 4 denied → **Proven** | Series B 2014-09-08 (old) | liveness unchecked (no-snapshot) |
| IMAGEN TECHNOLOGIES INC | NEW YORK, NY | 12 approved / 0 denied → **Proven** | Series A 2017-03-03 (old) | liveness unchecked (no-snapshot) |
| IMPRINT PAYMENTS INC | NEW YORK, NY | 52 approved / 0 denied → **Proven** | Series A 2021-01-06 (old) | liveness unchecked (no-snapshot) |
| INSIGHTFINDER INC | BROOKLYN, NY | 4 approved / 0 denied → **Likely** | Seed 2019-12-16 (old) | liveness unchecked (no-snapshot) |
| INVISIONAPP INC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series C 2015-06-25 (old) | liveness unchecked (no-snapshot) |
| ISEE INC | CAMBRIDGE, MA | 8 approved / 0 denied → **Possible** (capped from Likely) | Seed 2017-09-01 (old) | liveness unchecked (board-identity-unverified) |
| ITERATIVE SCOPES INC | Cambridge, MA | 18 approved / 0 denied → **Possible** (capped from Proven) | Series D+ 2021-12-06 (old) | liveness unchecked (no-snapshot) |
| KONEKSA HEALTH INC | NEW YORK, NY | 4 approved / 0 denied → **Possible** (capped from Likely) | Series A 2020-03-25 (old) | liveness unchecked (no-snapshot) |
| LEARNING MACHINE TECHNOLOGIES INC | NEW YORK, NY | 16 approved / 2 denied → **Possible** (capped from Likely) | Seed 2018-04-06 (old) | liveness unchecked (no-snapshot) |
| MAIN TECHNOLOGIES INC | NEW YORK, NY | 6 approved / 0 denied → **Possible** (capped from Likely) | — no date (unknown) | liveness unchecked (no-snapshot) |
| MONGODB INC | NEW YORK, NY | 462 approved / 4 denied → **Proven** | Series C 2014-12-10 (old) | liveness unchecked (posting-liveness-unverified) |
| MOTIVEMETRICS INC | STONEHAM, MA | 2 approved / 0 denied → **Possible** | Series A 2021-07-08 (old) | liveness unchecked (no-snapshot) |
| MULTIPLIER INC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series B 2023-12-05 (recent) | liveness unchecked (no-snapshot) |
| NETBRAIN TECHNOLOGIES INC | BURLINGTON, MA | 36 approved / 4 denied → **Proven** | Series B 2014-04-07 (old) | liveness unchecked (no-snapshot) |
| NEXTUPLE INC | ANDOVER, MA | 18 approved / 0 denied → **Possible** (capped from Proven) | Pre-Seed 2021-12-07 (old) | liveness unchecked (no-snapshot) |
| NODAR INC | Somerville, MA | 2 approved / 0 denied → **Possible** | Series A 2022-04-05 (old) | liveness unchecked (no-snapshot) |
| NUANCE COMMUNICATIONS INC | BURLINGTON, MA | 60 approved / 4 denied → **Possible** (capped from Proven) | Series C 2016-08-16 (old) | liveness unchecked (no-snapshot) |
| ONEVISION RESOURCES INC | BOSTON, MA | 14 approved / 0 denied → **Possible** (capped from Proven) | Seed 2020-01-31 (old) | liveness unchecked (no-snapshot) |
| OVERJET INC | BOSTON, MA | 48 approved / 2 denied → **Proven** | Series C 2024-02-16 (recent) | liveness unchecked (board-identity-unverified) |
| PALLET LABS INC | New York, NY | 2 approved / 0 denied → **Possible** | Seed 2021-07-02 (old) | liveness unchecked (no-snapshot) |
| PARADIGM CONNECT INC | NEW YORK, NY | 6 approved / 0 denied → **Possible** (capped from Likely) | Seed 2020-05-22 (old) | liveness unchecked (no-snapshot) |
| PEGASYSTEMS INC | CAMBRIDGE, MA | 180 approved / 2 denied → **Proven** | Pre-Seed 2019-05-10 (old) | liveness unchecked (no-snapshot) |
| PELOTON INTERACTIVE INC | NEW YORK, NY | 310 approved / 8 denied → **Proven** | Series C 2015-11-30 (old) | liveness unchecked (no-snapshot) |
| PELOTON INTERACTIVE LLC | NEW YORK, NY | 310 approved / 8 denied → **Proven** | Seed 2014-11-25 (old) | liveness unchecked (no-snapshot) |
| PETAL CARD INC | NEW YORK, NY | 10 approved / 0 denied → **Possible** (capped from Proven) | Pre-Seed 2016-12-15 (old) | liveness unchecked (no-snapshot) |
| PINECONE SYSTEMS INC | New York, NY | 22 approved / 0 denied → **Proven** | Series C 2023-04-10 (old) | liveness unchecked (no-snapshot) |
| PIONEAR TECHNOLOGIES INC | Allston, MA | 10 approved / 0 denied → **Possible** (capped from Proven) | Pre-Seed 2020-11-11 (old) | liveness unchecked (no-snapshot) |
| PRIME CONSULTING GROUP LLC | HOLDEN, MA | 46 approved / 2 denied → **Possible** (capped from Proven) | Series A 2015-06-12 (old) | liveness unchecked (no-snapshot) |
| PUBMARK INC | CAMBRIDGE, MA | 4 approved / 0 denied → **Likely** | Seed 2015-05-07 (old) | liveness unchecked (no-snapshot) |
| REGENT CRAFT INC | BURLINGTON, MA | 18 approved / 0 denied → **Proven** | Series B 2021-12-29 (old) | liveness unchecked (no-snapshot) |
| RESURETY INC | BOSTON, MA | 14 approved / 2 denied → **Likely** | Series B 2021-10-14 (old) | liveness unchecked (no-snapshot) |
| RIBBON HEALTH INC | NEW YORK, NY | 4 approved / 0 denied → **Possible** (capped from Likely) | Seed 2021-02-19 (old) | liveness unchecked (no-snapshot) |
| ROCKPORT VAL LLC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series A 2017-10-10 (old) | liveness unchecked (no-snapshot) |
| RODO INC | New York, NY | 2 approved / 0 denied → **Possible** | Series B 2021-06-25 (old) | liveness unchecked (no-snapshot) |
| RUBIK INC | New York, NY | 490 approved / 14 denied → **Possible** (capped from Proven) | Seed 2022-04-22 (old) | liveness unchecked (no-snapshot) |
| SECEON INC | WESTFORD, MA | 12 approved / 0 denied → **Proven** | Pre-Seed 2015-09-25 (old) | liveness unchecked (no-snapshot) |
| SILVERRAIL TECHNOLOGIES INC | WOBURN, MA | 4 approved / 0 denied → **Likely** | Series B 2014-04-08 (old) | liveness unchecked (no-snapshot) |
| SOCURE INC | NEW YORK, NY | 82 approved / 0 denied → **Proven** | Series C 2021-03-05 (old) | liveness unchecked (board-identity-unverified) |
| SPARK NEURO INC | NEW YORK, NY | 2 approved / 0 denied → **Possible** | Series A 2018-07-06 (old) | liveness unchecked (no-snapshot) |
| SPOTNANA TECHNOLOGY INC | NEW YORK, NY | 58 approved / 0 denied → **Proven** | Series B 2021-07-28 (old) | liveness unchecked (no-snapshot) |
| SYNACOR INC | BUFFALO, NY | 4 approved / 0 denied → **Possible** (capped from Likely) | Seed 2015-09-14 (old) | liveness unchecked (no-snapshot) |
| TALENT INC | NEW YORK, NY | 72 approved / 0 denied → **Possible** (capped from Proven) | Pre-Seed 2014-09-24 (old) | liveness unchecked (board-identity-unverified) |
| TEACHABLE INC | NEW YORK, NY | 6 approved / 0 denied → **Possible** (capped from Likely) | Seed 2018-04-09 (old) | liveness unchecked (no-snapshot) |
| TELADOC HEALTH INC | PURCHASE, NY | 510 approved / 16 denied → **Proven** | Series D+ 2020-07-01 (old) | liveness unchecked (no-snapshot) |
| TETRASCIENCE INC | BOSTON, MA | 10 approved / 0 denied → **Possible** (capped from Proven) | Series C 2021-03-26 (old) | liveness unchecked (no-snapshot) |
| THERMO FISHER SCIENTIFIC INC | WALTHAM, MA | 1096 approved / 22 denied → **Proven** | Series D+ 2014-02-03 (old) | liveness unchecked (no-snapshot) |
| THIRTY MADISON INC | New York, NY | 14 approved / 0 denied → **Possible** (capped from Proven) | Series D+ 2022-03-14 (old) | liveness unchecked (no-snapshot) |
| TODYL INC | BROOKLYN, NY | 6 approved / 0 denied → **Likely** | Seed 2020-05-14 (old) | liveness unchecked (no-snapshot) |
| TRACELINK INC | WAKEFIELD, MA | 112 approved / 4 denied → **Proven** | Series C 2018-05-25 (old) | liveness unchecked (no-snapshot) |
| TULIP INTERFACES INC | SOMERVILLE, MA | 18 approved / 0 denied → **Proven** | Series C 2021-07-19 (old) | liveness unchecked (no-snapshot) |
| UFA INC | BURLINGTON, MA | 2 approved / 0 denied → **Possible** | Series A 2021-04-29 (old) | liveness unchecked (no-snapshot) |
| UIPATH INC | NEW YORK, NY | 158 approved / 4 denied → **Proven** | Series D+ 2021-02-01 (old) | liveness unchecked (no-snapshot) |
| UNITE USA INC | New York, NY | 22 approved / 0 denied → **Proven** | Series D+ 2021-03-12 (old) | liveness unchecked (no-snapshot) |
| UNIVERSAL NAVIGATION INC | MONSEY, NY | 6 approved / 0 denied → **Possible** (capped from Likely) | Series A 2020-06-05 (old) | liveness unchecked (no-snapshot) |
| VERINT SYSTEMS INC | Melville, NY | 22 approved / 0 denied → **Possible** (capped from Proven) | Series D+ 2021-04-06 (old) | liveness unchecked (no-snapshot) |
| VIDEAHEALTH INC | Boston, MA | 14 approved / 2 denied → **Possible** (capped from Likely) | Series B 2022-03-04 (old) | liveness unchecked (no-snapshot) |
| VIDMOB INC | NEW YORK, NY | 22 approved / 0 denied → **Possible** (capped from Proven) | Series A 2025-04-24 (recent) | liveness unchecked (no-snapshot) |
| VIEW THE SPACE INC | NEW YORK, NY | 10 approved / 0 denied → **Proven** | Series C 2019-05-03 (old) | liveness unchecked (no-snapshot) |
| VIRALGAINS INC | BOSTON, MA | 6 approved / 0 denied → **Possible** (capped from Likely) | Series A 2015-12-22 (old) | liveness unchecked (no-snapshot) |
| WHEELS UP PARTNERS HOLDINGS LLC | NEW YORK, NY | 38 approved / 0 denied → **Possible** (capped from Proven) | Series D+ 2019-05-17 (old) | liveness unchecked (no-snapshot) |
| WW INTERNATIONAL INC | NEW YORK, NY | 74 approved / 0 denied → **Possible** (capped from Proven) | Series B 2023-04-10 (old) | liveness unchecked (no-snapshot) |
| ZAKIPOINT HEALTH INC | CAMBRIDGE, MA | 14 approved / 2 denied → **Possible** (capped from Likely) | Pre-Seed 2023-08-29 (old) | liveness unchecked (no-snapshot) |

## Skip

*Next action:* No action this cycle.

| Company | Sponsorship | Why |
|---|---|---|
| FAIRMARKIT INC | 2 approved / 0 denied → **Possible** | scorer: Skip — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes); sponsorship Possible too weak to network into |
| GINKGO BIOWORKS INC | 122 approved / 12 denied → **Possible** (capped from Proven) | scorer: Skip — composite 0.105 < 0.2 — time is better spent elsewhere |
| SOFAR SOUNDS LTD | 2 approved / 0 denied → **Possible** | scorer: Skip — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes); sponsorship Possible too weak to network into |
| UNQORK INC | 38 approved / 0 denied → **Possible** (capped from Proven) | scorer: Skip — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes); sponsorship Possible too weak to network into |

## Wage context (outside the scorer)

BLS national median for Software Developers (SOC 15-1252, OEWS 2024): **$133,080** [record]. Each company's H-1B median salary above covers *all* its sponsored titles, not just software roles, so compare loosely. The engine's scorer gives role quality a weight of 0, so this number changes no decision.

## What this run could not check

- That a certified LCA became an H-1B **approval** or a **new hire**: an LCA is a wage attestation filed before the petition, it also covers extensions and transfers, and one LCA can cover several workers.
- That a "software developer" LCA (SOC 15-1252) is a **backend new-grad** role: Level I/II wage counts are entry-level evidence, not proof.
- Employers whose DOL filing name differs from the 80 Days name: the LCA join is exact on a name key, so a zero can be a naming mismatch.
- Sponsorship outside the extracted DOL release (see the received-date range in the run record), and the dates of the 80 Days approvals, which have no years.
- Whether a browser-active posting is real hiring, or can wait for a start date months away.
- Postings on company career sites that the browser check cannot read (reported as uncertain → check the board).
- Companies whose job board was not found or not confirmed: they stay unchecked.
- E-Verify for companies not looked up, or enrolled under a different legal name: a missing row means "not looked up", never "not enrolled".
- Funding accuracy: the 80 Days funding columns contain visible mismatches (e.g. a large professional-services firm listed with a "Seed" round).

## Human gate (H1)

Before acting on any row: open each "Apply now" posting and confirm it is still open and can start after your OPT start date; for "Network first", decide whom to contact yourself. This tool sends nothing and applies nowhere.
