## Executive summary

This is a screening report for Sasha Jones, a fictional international student looking for an entry-level data scientist job that will sponsor a work visa. It checks 11 job postings and recommends which ones are worth an application.

Read it before applying to anything on the list: a posting is only scored if the company has a record of sponsoring visas and the job is confirmed open on the employer's own website. Job-listing sites are not trusted on their own, because one of them showed a removed job as open in an earlier run.

**What it found:** 3 of 11 postings passed every check and were scored (1 Apply, 2 Consider). 2 were confirmed closed on the employer's own page and need no action. 6 were held back without a score: 1 because the only sign the job was open came from a job-listing site, 3 because the employer's own page could not be confirmed, and the rest for missing sponsorship records or input. Nothing is decided until a person reviews the table below.

## Run record

- Mode `rithika-sr-ds-h1b-liveness` v0.1.0, building on `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.
- Run date 2026-10-03 (--today). Liveness source: offline fixture scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json.
- Visa timeline factor **1.0**: 94 days until EAD start + 70 unemployment days left = 164 available / 60-day hiring lag. [your-input]
- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. No model judgment was used.
- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).

## Roles

| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | G3 timeline | Decision | Score | Flags |
|---|---|---|---|---|---|---|---|---|
| NORTHWIND ANALYTICS INC | Data Scientist I | pass (Proven) | posting: active | held (builtin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| NORTHWIND ANALYTICS INC | Data Scientist II | pass (Proven) | posting: active; employer: active | pass (linkedin.com) | 1.0 | **Apply** | 0.495 | ⚠ posting is on an aggregator; the employer page decided liveness |
| KITE METRICS CORP | Applied Scientist | pass (Likely) | posting: active; employer: expired | closed (indeed.com) | — | **CLOSED** | CLOSED — posting verified closed (employer page checker said expired: HTTP 404) |  |
| BLUEFIN ROBOTICS LLC | Data Scientist | pass (Likely) | posting: active | n/a | 1.0 | **Consider** | 0.420 |  |
| KITE METRICS CORP | Applied Scientist II | pass (Likely) | posting: expired | n/a | — | **CLOSED** | CLOSED — posting verified closed (posting page checker said expired: HTTP 404) |  |
| BLUEFIN ROBOTICS LLC | Senior Data Scientist | pass (Likely) | posting: uncertain | n/a | — | **HELD** | HELD — G2a: employer page not active (checker said uncertain: content present but no visible apply control found) |  |
| NORTHWIND ANALYTICS INC | Data Scientist III | pass (Proven) | posting: uncertain (unparseable) | n/a | — | **HELD** | HELD — G2a: employer page not active (liveness output unparseable: expected 1 result line, found 0) |  |
| Quiet Harbor Labs Inc | Data Scientist | HELD: no sponsorship record | — | — | — | **HELD** | HELD — G1: company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) |  |
| Nimbus Data Co | Data Scientist | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| CEDAR LOOP HEALTH INC | Data Scientist | pass (None) | posting: active | n/a | 1.0 | **Consider** | 0.270 | ⚠ 0 approvals on record, yet not Skip |
| KITE METRICS CORP | Data Scientist | pass (Likely) | posting: uncertain (unparseable) | n/a | — | **HELD** | HELD — G2a: employer page not active (no liveness check recorded: no check output (URL not in the offline fixture)) |  |

## Next action for held roles

- **NORTHWIND ANALYTICS INC — Data Scientist I:** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **BLUEFIN ROBOTICS LLC — Senior Data Scientist:** Open https://jobs.example.com/bluefin/senior by hand, or re-run: npm run ats:liveness -- https://jobs.example.com/bluefin/senior
- **NORTHWIND ANALYTICS INC — Data Scientist III:** Open https://jobs.example.com/northwind/ds3 by hand, or re-run: npm run ats:liveness -- https://jobs.example.com/northwind/ds3
- **Quiet Harbor Labs Inc — Data Scientist:** Treat sponsorship as unknown; network to ask before applying.
- **Nimbus Data Co — Data Scientist:** Search the CSV by hand for the legal name before deciding.
- **KITE METRICS CORP — Data Scientist:** Open https://jobs.example.com/kite/unknown by hand, or re-run: npm run ats:liveness -- https://jobs.example.com/kite/unknown

## Liveness checks (one per URL)

| URL | Aggregator | Checker said | Exit | Parse |
|---|---|---|---|---|
| https://builtin.com/job/data-scientist/1000001 | builtin.com | active | 0 | ok |
| https://www.linkedin.com/jobs/view/1000002 | linkedin.com | active | 0 | ok |
| https://jobs.example.com/northwind/ds2 | no | active | 0 | ok |
| https://www.indeed.com/viewjob?jk=1000003 | indeed.com | active | 0 | ok |
| https://jobs.example.com/kite/as | no | expired: HTTP 404 | 1 | ok |
| https://boards.greenhouse.io/bluefin/jobs/1000004 | no | active | 0 | ok |
| https://jobs.example.com/bluefin/senior | no | uncertain: content present but no visible apply control found | 1 | ok |
| https://jobs.example.com/northwind/ds3 | no | — | 1 | expected 1 result line, found 0 |
| https://jobs.example.com/cedarloop/ds | no | active | 0 | ok |
| https://jobs.example.com/kite/unknown | no | — | None | no check output (URL not in the offline fixture) |

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.
- An `active` result means the page loaded and showed a visible apply control. It does not prove the employer is still reviewing applications.
- The aggregator list is a hand-made rule. A job board missing from it is treated as an employer page.
- Whether employer_url is really the same job as posting_url is your-input; this run does not compare the two pages' text.

## Human decision

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role, starting with the ⚠ rows.
