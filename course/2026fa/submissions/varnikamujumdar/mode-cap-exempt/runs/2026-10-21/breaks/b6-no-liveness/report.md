# Cap-exempt triage report

## Executive summary

This report sorts job postings for a person who was not picked in the H-1B visa lottery and is looking for employers that can sponsor without it — universities, their affiliated nonprofits and nonprofit research institutes. Read it to see which postings are worth asking about and which are not. Of 7 postings: 0 shortlisted; 0 flagged, because a record, the employer's legal form, or a claim resting on the name alone undercuts the claim; 7 held, because nobody confirmed the posting is still open; 0 skipped. 1 have a federal university-list record supporting the claim, and 7 postings (5 distinct employers) have government H-1B approval counts on record. **No employer is confirmed cap-exempt** — no file can confirm that; only the employer (and USCIS) can. The next step is a human one: ask HR. No human decisions (gate G4) are recorded yet.

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
| T1 | Northeastern University · Associate AI Engineer | unchecked | IHE (employer-statement) | private nonprofit | 24 initial / 13 continuing | UNVERIFIED-RECORD-SUPPORTED | $133,080 (15-1252) | $105,892 (-20.4%) | **HELD — liveness unchecked** |
| T2 | Fred Hutchinson Cancer Center · Software Development Engineer II | unchecked | affiliated-nonprofit (employer-statement) | not listed | 20 initial / 24 continuing | UNVERIFIED | $133,080 (15-1252) | $131,581 (-1.1%) | **HELD — liveness unchecked** |
| T3 | Allen Institute for AI · Senior Research Engineer, Olmo + Molmo | unchecked | nonprofit-research (employer-statement) | not listed | 6 initial / 0 continuing | UNVERIFIED | $133,080 (15-1252) | $217,800 (+63.7%) | **HELD — liveness unchecked** |
| T4 | Toyota Research Institute · Senior Research Engineer, Computer Vision | unchecked | nonprofit-research (name-only) | not listed | 1 initial / 2 continuing | CONTRADICTED-BY-SIGNAL | $133,080 (15-1252) | $219,375 (+64.8%) | **HELD — liveness unchecked** |
| T5 | Howard Hughes Medical Institute (Janelia Research Campus) · AI Engineer - AI+CryoET (tier I range) | unchecked | nonprofit-research (name-only) | not listed | 49 initial / 18 continuing | CONTRADICTED-BY-SIGNAL | $133,080 (15-1252) | $112,701 (-15.3%) | **HELD — liveness unchecked** |
| T6 | Allen Institute for AI · BREAK INPUT: constructed dead URL | unchecked | nonprofit-research (employer-statement) | not listed | 6 initial / 0 continuing | UNVERIFIED | $133,080 (15-1252) | — | **HELD — liveness unchecked** |
| T7 | Allen Institute for AI · Research Engineer, Climate Modeling (BREAK INPUT: left out of liveness check) | unchecked | nonprofit-research (employer-statement) | not listed | 6 initial / 0 continuing | UNVERIFIED | $133,080 (15-1252) | $183,600 (+38.0%) | **HELD — liveness unchecked** |

## Why each outcome

- **T1 Northeastern University** — not checked — not scored; run ats:liveness and re-run
  - supporting (record (exact normalized name)): listed in IPEDS as a private nonprofit institution — Northeastern University (MA, UNITID 167358) — private nonprofit
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 24, continuing 13 (denials 0/1); filed as NORTHEASTERN UNIVERSITY; NAICS 61. Counts petitions — not whether any was cap-exempt.
- **T2 Fred Hutchinson Cancer Center** — not checked — not scored; run ats:liveness and re-run
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 20, continuing 24 (denials 1/0); filed as FRED HUTCHINSON CANCER CENTER; NAICS 62. Counts petitions — not whether any was cap-exempt.
- **T3 Allen Institute for AI** — not checked — not scored; run ats:liveness and re-run
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 6, continuing 0 (denials 0/0); filed as THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE; NAICS 54. Counts petitions — not whether any was cap-exempt.
- **T4 Toyota Research Institute** — not checked — not scored; run ats:liveness and re-run
  - signal (your-input): cap-exempt category not stated by the employer — the claim rests on the name or a reading — nonprofit-research
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 1, continuing 2 (denials 0/0); filed as TOYOTA RESEARCH INSTITUTE INC; NAICS 54. Counts petitions — not whether any was cap-exempt.
  - IPEDS candidates for human review (not used): Toyota Technological Institute at Chicago
- **T5 Howard Hughes Medical Institute (Janelia Research Campus)** — not checked — not scored; run ats:liveness and re-run
  - signal (your-input): cap-exempt category not stated by the employer — the claim rests on the name or a reading — nonprofit-research
  - H-1B history (record (link chosen by a human)): FY2023 initial approvals 49, continuing 18 (denials 0/1); filed as HOWARD HUGHES MEDICAL INSTITUTE HHMI; NAICS 54. Counts petitions — not whether any was cap-exempt.
- **T6 Allen Institute for AI** — not checked — not scored; run ats:liveness and re-run
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 6, continuing 0 (denials 0/0); filed as THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE; NAICS 54. Counts petitions — not whether any was cap-exempt.
- **T7 Allen Institute for AI** — not checked — not scored; run ats:liveness and re-run
  - H-1B history (record (exact normalized name)): FY2023 initial approvals 6, continuing 0 (denials 0/0); filed as THE ALLEN INSTITUTE FOR ARTIFICIAL INTELLIGENCE; NAICS 54. Counts petitions — not whether any was cap-exempt.

## Read this before acting

- *Cap-exempt status* is never VERIFIED here. UNVERIFIED means the employer's own page states a qualifying category; RECORD-SUPPORTED adds a federal college-list record. Neither means the employer files cap-exempt petitions for this role.
- H-1B approval counts (USCIS FY2023) show the employer sponsors; they do not show cap-exempt filing. "No exact match" is not "never sponsored" — the employer may file under another spelling (see candidates).
- National medians are BLS OEWS national figures. Cap-exempt employers may use a separate, lower prevailing-wage table (ACWIA) that is not in this repository, so a posted salary below the national median is expected and is not a red flag by itself.
- SOC codes are a judgment about the job title, not a record.
- A cap-exempt H-1B does not count against the cap; moving later to a cap-subject employer would need the lottery.
