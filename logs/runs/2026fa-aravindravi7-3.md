## 2026-10-21 — pm-sponsor-title-match v0.2.0 — live run (A4)

### Executive summary
I ran the mode live on 21 October 2026, 18 days after the first run. It used the Department of Labor's FY2026 Q1–Q3 per-filing data and rule values set by Aravind Ravi. Of 14 postings, 2 had closed. After his gate decisions, 7 are Apply and 7 are held: six declined for the unemployment margin, one with no tier possible. E-Verify was not checked, so every Apply still needs that before tailoring.

- **Recipe:** recipes/cases/2026fa/aravindravi7-pm-sponsor-title-match.md v0.2.0 (DRAFT — 1 open typed TODO)
- **Mode:** live (`--as-of 2026-10-21`; the scanner stamped the UTC date 2026-10-22)
- **Inputs:**
  - `course/2026fa/submissions/aravindravi7/a4-mode-build/runs/live-2026-10-21/{persona.json, rules.json (a4-2026-10-21, set by Aravind Ravi), shortlist.json, shortlist.pass2.json, liveness.jsonl}`
  - DOL extract `lca-pm-filings-fy2026_q3.csv` (pinned) and employer index (pinned)
  - 80 Days CSV
- **Commands, each command's own exit code:**
  - ingest re-run 0
  - `npm run ats:scan` 0
  - `liveness-json.mjs` 0
  - triage pass 1: 0
  - triage pass 2: 0
- **Outputs:** `runs/live-2026-10-21/{scan-2026-10-21.txt, liveness-stdout.txt, ingest-2026-10-21.txt, pass1/, pass2/}`
- **Result:**
  - scan: 26 new postings since 2026-10-03 (not triaged);
  - liveness: 9 active · 1 expired · 4 uncertain;
  - pass 1: 14 HOLD;
  - pass 2: Apply 7 · Consider 0 · Skip 0 · HOLD 7.
- **Gate decisions (Aravind Ravi, 2026-10-21):**
  - **G1:** Stripe Inc./LLC resolved by record (FEIN 27-0465600), human resolution concurring; w12 Anthropic held (no tier possible).
  - **G2:** w02 expired; w03, w04, w05 active.
  - **E1:** accepted w03, w04, w06, w07, w10, w11, w13; declined w01, w02, w05, w08, w09, w14, each with a basis.
  - **G4:** not recorded.
- **Open issues:**
  - E-Verify not checked for any role.
  - Eligibility-cap gate (open TODO).
  - Anthropic title check.
  - 38% of Proven employers are lca-unknown under the name join.
  - FEIN grouping across trade names (1,249 FEINs).
