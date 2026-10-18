# Salary floor — software co-op to full-time

## Executive summary

National BLS floor = **A_PCT25** of the SOC code you expect the offer to be filed under, compared with each employer's 80 Days sponsored-salary median. National only: no Boston number exists in this repo. The company median covers all of its sponsored roles, not software only.

Run 2026-10-18 · persona: Ananya Rao (fictional) — F-1, MS Information Systems, SWE / full-stack co-op on CPT, Boston, graduating Dec 2027 or Apr 2028

| Company | Offer title | SOC | Floor | 80 Days record | Company median | Verdict | Code risk |
|---|---|---|---|---|---|---|---|
| State Street | Software Engineer | 15-1252 | $103,050 | not-in-dataset | — | **NO COMPANY NUMBER** | — |
| Fidelity | Full Stack Engineer | 15-1252 | $103,050 | blank-record (line 10030) | — | **NO COMPANY NUMBER** | — |
| JPMorgan Chase | Software Engineer | 15-1252 | $103,050 | not-in-dataset | — | **NO COMPANY NUMBER** | — |
| BNY Mellon | Full Stack Developer | 15-1252 | $103,050 | matched (line 3036) | $145,000 | **COMPANY RECORD ABOVE FLOOR** | — |
| Toast | Software Engineer | 15-1252 | $103,050 | matched (line 27011) | $177,341 | **COMPANY RECORD ABOVE FLOOR** | — |
| Lendbuzz | Full Stack Engineer | 15-1252 | $103,050 | matched (line 15078) | $125,000 | **COMPANY RECORD ABOVE FLOOR** | — |
| Klaviyo | Front End Engineer | 15-1252 | $103,050 | matched (line 14495) | $126,000 | **COMPANY RECORD ABOVE FLOOR** | may be filed 15-1254 → floor $63,140 (−$39,910) |
| Microsoft | Software Engineer | 15-1252 | $103,050 | matched (line 16757) | $156,705 | **COMPANY RECORD ABOVE FLOOR** | — |
| Google | Software Engineer | 15-1252 | $103,050 | blank-record (line 1357) | — | **NO COMPANY NUMBER** | — |
| Robinhood | Back End Engineer | 15-1252 | $103,050 | matched (line 22735) | $186,000 | **COMPANY RECORD ABOVE FLOOR** | may be filed 15-1254 → floor $63,140 (−$39,910) |
| Chime | Full Stack Engineer | 15-1252 | $103,050 | matched (line 5469) | $240,108 | **COMPANY RECORD ABOVE FLOOR** | — |

## BLS bands used (national, May 2024)

| SOC | 10th | 25th | median | 75th | 90th |
|---|---|---|---|---|---|
| 15-1252 Software Developers | $79,850 | $103,050 | $133,080 | $169,000 | $211,450 |
| 15-1254 Web Developers (code-risk comparison) | $48,560 | $63,140 | $90,930 | $124,300 | $162,870 |

## Similar names found but NOT used (exact match only)

- State Street: 1601 STATE STREET HOTEL INVESTORS LP
- Toast: MENTION THE TOASTER LLC, MOONTOAST INC, TOAST EMPIRE INC
- Google: ALPHABET ENERGY INC, ALPHABETA INC

## What this cannot tell you

- Boston pay: `data/bls/local-wage/` is not in the repo.
- H-1B prevailing-wage level (DOL OFLC) for this job: not in the repo.
- What this employer pays *software* hires specifically, or new grads specifically.
- Co-op hourly pay: BLS does not survey students.
