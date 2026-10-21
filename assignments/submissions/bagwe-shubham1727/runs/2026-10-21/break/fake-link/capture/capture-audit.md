# Board capture audit — 2026-10-21

## Executive summary

**What this is.** A record of what the public job boards of 20 Massachusetts companies with a software-engineer sponsorship history showed on 2026-10-21, and what a browser saw when it opened the postings a new graduate could take.

**Why read it.** Every later decision starts from this list. If a board belongs to the wrong company, a filter dropped something it shouldn't have, or a page couldn't be read, it shows here first. Boards marked *proposed* below are waiting for you to decide whether they belong to the company named.

**What it found.** 1300 postings on 20 reachable boards. 15 passed the software-title and US-location filters, the same list the engine's own board scan produced. 16 look like new-grad software jobs and were opened: 10 active, 6 uncertain. This file makes no recommendation.

## Run record

- Portals file: `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/portals-boston-swe.yml` (sha256 `833f3b2402e7…`) · captured at 2026-10-21T06:21:43.596Z
- Cross-check against `REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/fixtures/portals-boston-swe.yml node scripts/ats/scan.mjs --dry-run`, run inside this capture: **match**. Scan: 1300 found, 1265 / 19 removed by title / location, 1 duplicates, 15 new. Only in scan: 0; only in capture: 0 (allowed: 0, the scan's extra duplicates from a private scan history). A mismatch means the boards changed between the two reads or the mirror has drifted, and the evaluate step refuses the capture.

## Records in, records out

| Stage | Count |
|---|---|
| Boards listed / reachable | 20 / 20 |
| Postings found | 1300 |
| Removed by title filter | 1265 |
| Removed by location filter | 19 |
| Duplicates (same URL or same company + title) | 1 |
| **Passed scan filters** | **15** |
| Manual links added | 1 |
| New-grad titles opened in a browser / not opened (cap) | 16 / 0 |

## Boards

| Company (80 Days name) | Board | Ownership decision (gate G1a) | Postings | Passed filters |
|---|---|---|---|---|
| KLAVIYO INC | https://job-boards.greenhouse.io/klaviyo | confirmed (Shubham Bagwe, 2026-10-20) | 165 | 4 |
| TOAST INC | https://job-boards.greenhouse.io/toast | confirmed (Shubham Bagwe, 2026-10-20) | 311 | 1 |
| COHERE HEALTH INC | https://job-boards.greenhouse.io/coherehealth | confirmed (Shubham Bagwe, 2026-10-20) | 76 | 0 |
| COHERE HEALTH INC | https://jobs.ashbyhq.com/cohere | rejected (Shubham Bagwe, 2026-10-20) | 116 | 1 |
| FORMLABS INC | https://job-boards.greenhouse.io/formlabs | confirmed (Shubham Bagwe, 2026-10-20) | 246 | 3 |
| TULIP INTERFACES INC | https://job-boards.greenhouse.io/tulip | confirmed (Shubham Bagwe, 2026-10-20) | 63 | 2 |
| LENDBUZZ INC | https://jobs.lever.co/lendbuzz | proposed | 55 | 0 |
| PATHAI INC | https://job-boards.greenhouse.io/pathai | confirmed (Shubham Bagwe, 2026-10-20) | 14 | 2 |
| CAMBRIDGE MOBILE TELEMATICS INC | https://job-boards.greenhouse.io/cambridgemobiletelematics | confirmed (Shubham Bagwe, 2026-10-20) | 24 | 0 |
| NETBRAIN TECHNOLOGIES INC | https://job-boards.greenhouse.io/netbrain | confirmed (Shubham Bagwe, 2026-10-20) | 42 | 0 |
| ACUITYMD INC | https://job-boards.greenhouse.io/acuitymd | confirmed (Shubham Bagwe, 2026-10-20) | 10 | 0 |
| ABACUS INSIGHTS INC | https://job-boards.greenhouse.io/abacusinsights | confirmed (Shubham Bagwe, 2026-10-20) | 17 | 0 |
| ABACUS INSIGHTS INC | https://job-boards.greenhouse.io/abacus | rejected (Shubham Bagwe, 2026-10-20) | 44 | 0 |
| VESTMARK INC | https://job-boards.greenhouse.io/vestmark | confirmed (Shubham Bagwe, 2026-10-20) | 5 | 0 |
| OVERJET INC | https://jobs.ashbyhq.com/overjet | proposed | 31 | 0 |
| LOOKOUT INC | https://job-boards.greenhouse.io/lookout | proposed | 2 | 0 |
| ISEE INC | https://jobs.lever.co/isee | proposed | 31 | 0 |
| CLOAKED INC | https://jobs.ashbyhq.com/cloaked | proposed | 15 | 0 |
| REGENT CRAFT INC | https://jobs.ashbyhq.com/regent | proposed | 32 | 2 |
| 1UPHEALTH INC | https://jobs.ashbyhq.com/1uphealth | proposed | 1 | 0 |

## Postings opened, and what the browser saw

| Company | Title | Location | Liveness | Stayed on posting? |
|---|---|---|---|---|
| KLAVIYO INC | Full Stack Software Engineer - People Systems | Boston, MA | active (apply_control_visible) | yes |
| KLAVIYO INC | Software Engineer II (Mobile Developer - Android/Kotlin) - Mobile App Growth | Boston, MA | active (apply_control_visible) | yes |
| KLAVIYO INC | Software Engineer II - Recommendations | Boston, MA | active (apply_control_visible) | yes |
| KLAVIYO INC | Software Engineer II, Test Frameworks & Tooling | Boston, MA | active (apply_control_visible) | yes |
| TOAST INC | Software Engineer II, Developer Experience | Remote, US | active (apply_control_visible) | yes |
| COHERE HEALTH INC | Software Engineer, Security Agents | United States | active (apply_control_visible) | yes |
| FORMLABS INC | Embedded Software Engineer  | Somerville, MA | uncertain (no_apply_control) | yes |
| FORMLABS INC | Software Engineer, E-commerce  | Somerville, MA | uncertain (no_apply_control) | yes |
| FORMLABS INC | Software Engineer - Print Pipeline | Somerville, MA | uncertain (no_apply_control) | yes |
| TULIP INTERFACES INC | Software Engineer, Agentic AI | Somerville, MA | uncertain (no_apply_control) | yes |
| TULIP INTERFACES INC | Software Engineer, Frameworks | Somerville, MA | uncertain (no_apply_control) | yes |
| PATHAI INC | Software Development Engineer in Test (SDET) | Boston, MA | active (apply_control_visible) | yes |
| PATHAI INC | Software Engineer I, Fullstack | Boston, MA (Hybrid) | active (apply_control_visible) | yes |
| REGENT CRAFT INC | Software Engineer II, Sensor Fusion & Autonomy | North Kingstown, Rhode Island, USA | active (apply_control_visible) | yes |
| REGENT CRAFT INC | Embedded Systems Software Engineer | North Kingstown, Rhode Island, USA | active (apply_control_visible) | yes |
| FORMLABS INC | Software Engineer, Backend | Somerville, MA | uncertain (no_apply_control) | **no** |

## Passed the scan filters but not the new-grad title rule

| Company | Title | Rule |
|---|---|---|
