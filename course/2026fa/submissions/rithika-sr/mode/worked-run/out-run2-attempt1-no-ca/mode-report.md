## Executive summary

This is a screening report for Sasha Jones, a fictional international student looking for an entry-level data scientist job that will sponsor a work visa. It checks 13 job postings and recommends which ones are worth an application.

Read it before applying to anything on the list: a posting is only scored if the company has a record of sponsoring visas and the job is confirmed open on the employer's own website. Job-listing sites are not trusted on their own, because one of them showed a removed job as open in an earlier run.

**What it found:** 0 of 13 postings passed every check and were scored (none). 1 were confirmed closed on the employer's own page and need no action. 12 were held back without a score: 2 because the only sign the job was open came from a job-listing site, 1 because the link was not on a recognized employer or hiring-system site, 6 because the employer's own page could not be confirmed, and the rest for missing sponsorship records or input. Where an employer's hiring system publishes a record of the job, that record decided whether the job is open. Nothing is decided until a person reviews the table below.

## Run record

- Mode `rithika-sr-ds-h1b-liveness` v0.2.0, building on `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`.
- Run date 2026-10-21 (--today). Liveness source: network: npm run --silent ats:liveness -- <url>.
- Visa timeline factor **1.0**: 76 days until EAD start + 70 unemployment days left = 146 available / 60-day hiring lag. [your-input]
- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. No model judgment was used.
- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).

## Roles

| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | G3 timeline | Decision | Score | Flags |
|---|---|---|---|---|---|---|---|---|
| MAPLEBEAR INC | Data Scientist | pass (Proven) | posting: active [page-checker] | held (builtin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| Instacart | Data Scientist | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| Airbnb | Staff Data Scientist, Locations | HELD: not found | — | — | — | **HELD** | HELD — G1: company not found in sponsorship CSV (exact-name match; may be a naming miss) | ⚠ may be a naming miss |
| AIRBNB INC | Data Scientist, Platform | pass (Proven) | posting: expired [page-checker] | n/a | — | **CLOSED** | CLOSED — posting verified closed (posting page checker said expired: HTTP 404) |  |
| AIRBNB INC | Staff Data Scientist, Locations | pass (Proven) | posting: uncertain [ats-record] | n/a | — | **HELD** | HELD — G2a: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) |  |
| FIGMA INC | Data Scientist | pass (Proven) | posting: uncertain [ats-record] | n/a | — | **HELD** | HELD — G2a: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) |  |
| NEXTDOOR INC | Data Scientist - Search (Senior) | pass (Proven) | posting: active [page-checker] | held (builtinaustin.com) | — | **HELD** | HELD — G2b: aggregator-only liveness |  |
| $AVY INC | Data Scientist (no posting found) | HELD: no sponsorship record | — | — | — | **HELD** | HELD — G1: company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) |  |
| MOLOCO INC | Data Scientist II, Product - Moloco Commerce Media | pass (Proven) | posting: uncertain [ats-record] | n/a | — | **HELD** | HELD — G2a: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: uncertain [ats-record] | n/a | — | **HELD** | HELD — G2a: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr)<br>⚠ note: third-party copy says no visa sponsorship for this role; CSV sponsorship is company-wide — G4 review |
| NEXTDOOR INC | Senior Data Scientist - Search | pass (Proven) | posting: active [page-checker]; employer: uncertain [ats-record] | held (builtinaustin.com) | — | **HELD** | HELD — G2b: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MOLOCO INC | Data Scientist (deliberately broken employer_url) | pass (Proven) | posting: uncertain [page-checker]; employer: uncertain [ats-record] | held (builtin.com) | — | **HELD** | HELD — G2b: employer page not active (ATS record: HTTP url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |
| MAPLEBEAR INC | Senior Data Scientist I - Meals (US remote) | pass (Proven) | posting: unrecognized [allowlist] | n/a | — | **HELD** | HELD — G2a: source not recognized as employer or ATS | ⚠ fit is inferred, not verified (proposed by Claude Code, accepted by rithika-sr) |

## Next action for held roles

- **MAPLEBEAR INC — Data Scientist:** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **Instacart — Data Scientist:** Search the CSV by hand for the legal name before deciding.
- **Airbnb — Staff Data Scientist, Locations:** Search the CSV by hand for the legal name before deciding.
- **AIRBNB INC — Staff Data Scientist, Locations:** Open https://boards.greenhouse.io/airbnb/jobs/6768605 by hand, or re-run: npm run ats:liveness -- https://boards.greenhouse.io/airbnb/jobs/6768605
- **FIGMA INC — Data Scientist:** Open https://job-boards.greenhouse.io/figma/jobs/5552580004 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/figma/jobs/5552580004
- **NEXTDOOR INC — Data Scientist - Search (Senior):** Find this job on the employer's own careers page or ATS; add it as employer_url.
- **$AVY INC — Data Scientist (no posting found):** Treat sponsorship as unknown; network to ask before applying.
- **MOLOCO INC — Data Scientist II, Product - Moloco Commerce Media:** Open https://job-boards.greenhouse.io/moloco/jobs/7985823003 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/moloco/jobs/7985823003
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Open https://job-boards.greenhouse.io/instacart/jobs/8236905 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/instacart/jobs/8236905
- **NEXTDOOR INC — Senior Data Scientist - Search:** Open https://job-boards.greenhouse.io/nextdoor/jobs/7948362 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/nextdoor/jobs/7948362
- **MOLOCO INC — Data Scientist (deliberately broken employer_url):** Open https://job-boards.greenhouse.io/moloco/jobs/9999999999 by hand, or re-run: npm run ats:liveness -- https://job-boards.greenhouse.io/moloco/jobs/9999999999
- **MAPLEBEAR INC — Senior Data Scientist I - Meals (US remote):** Find this job on the employer's own careers page or ATS instead of https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals.

## ATS records and redirect chains (employer pages)

| URL | Allowlisted as | ATS record | Redirect hops | Final URL has job id | Decided by |
|---|---|---|---|---|---|
| https://careers.airbnb.com/positions/6632687 | careers.airbnb.com | — | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | page-checker |
| https://boards.greenhouse.io/airbnb/jobs/6768605 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://job-boards.greenhouse.io/figma/jobs/5552580004 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/7985823003 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://job-boards.greenhouse.io/instacart/jobs/8236905 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://job-boards.greenhouse.io/moloco/jobs/9999999999 | greenhouse.io | uncertain (HTTP None, url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081)) | url error: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1081) | yes | ats-record |
| https://jobs.generalcatalyst.com/companies/instacart/jobs/95117801-senior-data-scientist-i-meals | not on allowlist | — | — | — | allowlist |

## Liveness checks (one per URL)

| URL | Aggregator | Checker said | Exit | Parse |
|---|---|---|---|---|
| https://builtin.com/job/data-scientist/3375738 | builtin.com | active | 0 | ok |
| https://careers.airbnb.com/positions/6632687 | no | expired: HTTP 404 | 1 | ok |
| https://boards.greenhouse.io/airbnb/jobs/6768605 | no | active | 0 | ok |
| https://job-boards.greenhouse.io/figma/jobs/5552580004 | no | active | 0 | ok |
| https://www.builtinaustin.com/job/data-scientist-search/9459092 | builtinaustin.com | active | 0 | ok |
| https://job-boards.greenhouse.io/moloco/jobs/7985823003 | no | active | 0 | ok |
| https://job-boards.greenhouse.io/instacart/jobs/8236905 | no | uncertain: content present but no visible apply control found | 1 | ok |
| https://job-boards.greenhouse.io/nextdoor/jobs/7948362 | no | uncertain: content present but no visible apply control found | 1 | ok |
| https://builtin.com/company/moloco/jobs | builtin.com | uncertain: content present but no visible apply control found | 1 | ok |
| https://job-boards.greenhouse.io/moloco/jobs/9999999999 | no | expired: redirect to https://job-boards.greenhouse.io/moloco?error=true | 1 | ok |

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.
- An `active` result means the page loaded and showed a visible apply control. It does not prove the employer is still reviewing applications.
- The aggregator list and the employer allowlist are hand-made rules. A job board missing from both is held as unrecognized; a careers domain missing from the allowlist is held too, even if it is the real employer.
- Only Greenhouse has an ATS record check. Lever, Ashby, Workday and SmartRecruiters pages are allowlisted but still decided by the page checker.
- Whether employer_url is really the same job as posting_url is your-input; this run does not compare the two pages' text.

## Human decision

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role, starting with the ⚠ rows.
