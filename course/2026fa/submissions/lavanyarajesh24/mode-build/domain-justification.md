# Domain justification — network-targets-swe (Mode Build)

## Executive summary

An international software-engineering student months away from OPT can't easily see
three things:
- which employers really sponsor **software developers**;
- which postings are **actually still open**;
- which employers could carry them through a **STEM extension**.

This mode checks all three against public records before ranking anything.

## Who, in exactly what situation

- **Who:** an MS Software Engineering student in Boston, graduating December 2026, on
  F-1.
- **Visa timeline:** OPT from 2027-01-15, with 90 unemployment days. Needs H-1B, and STEM
  OPT if the first lottery fails.
- **Target:** entry-level backend roles (SOC 15-1252) in MA/NY.
- **Timing:** they can't start for 86 days, so the right move is to apply selectively and
  network heavily.

## The information asymmetry

1. **"Sponsors H-1B" ≠ "sponsors software developers."**
   - 80 Days matches sponsorship by title text, with no occupation code and no year. DOL
     wage filings (LCAs) carry the SOC code, and this mode joins them.
   - Ginkgo Bioworks shows 122 approvals under a "software" title match, yet its FY2026
     filings are all biology/chemistry roles: zero software developers.
   - Its live software postings say nothing about that.
2. **"Listed" ≠ "open."**
   - Board APIs keep listing closed jobs. The browser gate caught a dead SeatGeek posting
     that the board still lists.
   - It also caught a Cohere Health posting that closed mid-session.
3. **E-Verify is invisible.**
   - STEM OPT requires an E-Verify employer, and no job posting says whether one is.
   - All 21 employers this mode recommends were checked: all have open accounts.

## Engine layers

- **80 Days to Stay:** approval counts, tier rule, funding.
- **Job-Ops:** `detect-ats.py` board discovery, the Greenhouse/Lever providers, and
  `liveness-browser.mjs` (the logic behind `npm run ats:liveness`) as a hard gate.
- **Cognitive Pivot:** BLS 15-1252 median as context only.
- **New sources, with provenance:** the DOL LCA FY2026 Q1–Q3 extract and the E-Verify
  lookups.

## Domain-specific failure modes

1. **The occupation-code gap, in both directions.**
   - **The error:** title-text sponsorship over-counts employers like Ginkgo.
   - **My first fix over-corrected:** counting MA/NY worksites only, it demoted Abacus
     Insights, Acquia, Lookout and Yieldmo, whose software filings sit at remote
     worksites elsewhere.
   - **Hardest to catch for:** the student. Both errors produce a confident, plausible
     list; only the raw DOL workbook shows the difference.
2. **A wrong job board makes a hiring sponsor look quiet.**
   - **The error:** v0.1.0's slug `cmt` pointed at "CMTelematics", a board with only
     internships. The real Cambridge Mobile Telematics board had over 20 jobs.
   - **Hardest to catch for:** anyone reading "network first" as "not hiring". The new
     identity gate rejects mismatched boards; it also rejected TALENT INC → "Slice Talent
     Community".
