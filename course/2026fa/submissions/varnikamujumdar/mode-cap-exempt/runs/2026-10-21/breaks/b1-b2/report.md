# Cap-exempt triage report

## Executive summary

This report sorts job postings for a person who was not picked in the H-1B visa lottery and is looking for employers that can sponsor without it — universities, their affiliated nonprofits and nonprofit research institutes. Read it to see which postings are worth asking about and which are not. Of 3 postings: 1 shortlisted; 0 flagged, because a record, the employer's legal form, or a claim resting on the name alone undercuts the claim; 2 held, because nobody confirmed the posting is still open; 0 skipped. 0 have a federal university-list record supporting the claim, and 1 postings (1 distinct employers) have government H-1B approval counts on record. **No employer is confirmed cap-exempt** — no file can confirm that; only the employer (and USCIS) can. The next step is a human one: ask HR. No human decisions (gate G4) are recorded yet.

## Run record

- Mode: `varnikamujumdar-cap-exempt-triage` v0.1.0 · run date 2026-10-21
- Persona: Priya Nair (fictional) · lottery: FY2027 not-selected
- Status: COMPLETED — human gate open: the person decides which shortlisted employers to contact
- Record checks: IPEDS and USCIS extracts loaded

## Gates

| Gate | Result | Detail |
|---|---|---|
| G1 input | PASS | persona, extension, targets and both CSVs parsed; expected columns present |
| G2 timeline | PASS | 102 days of OPT left vs 66 required (hiring 45 + processing 21, your-input); margin 36 |
| G3 liveness | per row | unchecked or uncertain → HELD, never scored |
| G4 human | OPEN | no decisions file — human gate open |

_STEM-eligible, but a STEM OPT extension needs an E-Verify employer; current employer E-Verify: no (your-input). This gate uses the current OPT end date only._

## Postings

| # | Employer · role | Liveness | Claimed category (basis) | IPEDS (federal college list) | H-1B approvals FY2023 (USCIS) | Cap-exempt status | National median (SOC) | Posted midpoint | Outcome |
|---|---|---|---|---|---|---|---|---|---|
| B1 | Toyota Research Institute · Senior Research Engineer, Computer Vision | active | nonprofit-research (employer-statement) | not listed | 1 initial / 2 continuing | UNVERIFIED | $133,080 (15-1252) | $219,375 (+64.8%) | **SHORTLIST — exemption UNVERIFIED** |
| B2 | CHAPMAN UNIVERSITY ENTERPRISES INC · BREAK: real 80 Days row claimed as a university | unchecked | IHE (employer-statement) | not listed | no exact match | CONTRADICTED-BY-SIGNAL | $112,590 (15-2051) | — | **HELD — liveness unchecked** |
| B8 | University of Phoenix-Arizona · BREAK: real for-profit college claimed as a university | unchecked | IHE (employer-statement) | private for-profit | no exact match | CONTRADICTED-BY-SIGNAL | $133,080 (15-1252) | — | **HELD — liveness unchecked** |

## Why each outcome

- **B1 Toyota Research Institute** — ask HR: do you file H-1B petitions as cap-exempt, and under which category?
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 1, continuing 2 (denials 0/0); filed as TOYOTA RESEARCH INSTITUTE INC; NAICS 54. Counts petitions — not whether any was cap-exempt.
  - IPEDS candidates for human review (not used): Toyota Technological Institute at Chicago
- **B2 CHAPMAN UNIVERSITY ENTERPRISES INC** — not checked — not scored; run ats:liveness and re-run
  - signal (record): appears in the SEC Form D-derived dataset (raises private capital) — CHAPMAN UNIVERSITY ENTERPRISES INC — stage blank
  - IPEDS candidates for human review (not used): Chapman University
  - USCIS candidates for human review (not used): CHAPMAN UNIVERSITY
- **B8 University of Phoenix-Arizona** — not checked — not scored; run ats:liveness and re-run
  - signal (record (exact normalized name)): listed in IPEDS as a private for-profit institution — HEA §101(a) requires a public or other nonprofit institution — University of Phoenix-Arizona (AZ, UNITID 484613) — private for-profit
  - USCIS candidates for human review (not used): ARIZONA STATE UNIVERSITY; ARIZONA STATE UNIVERSITY FOUNDATION FOR A NEW AMERICAN UNIVERSITY; NORTHERN ARIZONA UNIVERSITY

## Read this before acting

- *Cap-exempt status* is never VERIFIED here. UNVERIFIED means the employer's own page states a qualifying category; RECORD-SUPPORTED adds a federal college-list record. Neither means the employer files cap-exempt petitions for this role.
- H-1B approval counts (USCIS FY2023) show the employer sponsors; they do not show cap-exempt filing. "No exact match" is not "never sponsored" — the employer may file under another spelling (see candidates).
- National medians are BLS OEWS national figures. Cap-exempt employers may use a separate, lower prevailing-wage table (ACWIA) that is not in this repository, so a posted salary below the national median is expected and is not a red flag by itself.
- SOC codes are a judgment about the job title, not a record.
- A cap-exempt H-1B does not count against the cap; moving later to a cap-subject employer would need the lottery.
