### 2026-10-20 — case-pavan-majji-14-data-bi-15-2051 v0.1.0 · sample run on real postings · DRAFT (human gate signed by Pavan Jayant Majji at G0/G1/G4/G6)

Inputs: fictional F-1 OPT persona (OPT end 2027-05-31, 60-day lag); 6 real Data/BI/Business Analyst postings from company career sites; shipped occupation table and 80 Days CSV.
Commands: read-only Python lookups (no stored script exists); `npm run ats:liveness -- <6 URLs>`; `npm run score -- roles-1.json --out-dir run1`; `npm run score -- roles-break.json --out-dir run-break`.
Results: scored 3 → Apply 1 · Consider 1 · Skip 1; held 3 (Fetch: no CSV match; Amazon, McKinsey: out of scope and not in CSV).
Gate decisions: G0 cleared; G1 held 2 Business Analyst titles; G4 Pinterest hand-checked live; G6 report read.
Disagreements: `ats:liveness` said Pinterest expired; human saw it live; script value kept.
Open issues: 7 proposed additions (mapper, runner, SOC-level sponsorship, coverage, scorer missing-source default, liveness false-expired, seniority). No personal data, contacts, or application notes.