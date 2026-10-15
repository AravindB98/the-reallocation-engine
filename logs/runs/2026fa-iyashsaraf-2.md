## 2026-10-14 — SWE/AI/DevOps sponsor + funding triage, re-run with real liveness checks

- **Recipe:** `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage.md` v0.1.0 (DRAFT)
- **Inputs:**
  `npm run ats:liveness -- <5 posting URLs from liveness/posting-urls.csv>`
  (2026-10-14 15:35 EDT, output saved to `.../liveness/liveness-check.txt`), then
  `bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh`
  (reads `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
  and `data/bls/compact/soc_occupation_compact.csv`; `--opt-end-date 2027-03-15`,
  default `--hiring-lag-days 45`)
- **Outputs:**
  `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json`,
  `.../run/role-scores.json`, `.../run/role-scores.md`,
  `.../run/held-out.json`, `.../run/held-out.md`
- **Result:** liveness: 4 active, 0 expired, 1 uncertain (Datadog). 30,369 CSV
  rows read → 386 candidates (19,100 wrong-industry, 10,416 no-approvals,
  0 no-titles, 467 no-title-match excluded) → 5 scored (4 checker-active,
  1 human-decided), 381 held out (no posting chosen). Scorer: Apply 5 ·
  Consider 0 · Skip 0 (0% skip rate, flagged by the scorer).
- **Gate decisions:** G4 (liveness) — cleared by the checker for the 4
  `active` postings; Datadog's `uncertain` result was cleared by Yash Saraf on
  2026-10-14 after opening the page (live, requisition R21399, embedded
  application form), recorded in `.../liveness/gate-decisions.csv` with a
  screenshot. G5 (timeline) — placeholder OPT date, factor 1.0 for all.
- **Open issues:** the checker misreads pages with an embedded application
  form as `uncertain`. The five scored postings were chosen at strong sponsors, so
  the 0% skip rate says nothing about the recipe's skip behavior; next step is
  to check postings for a random sample of held-out companies. Replaces the
  2026-10-01 approach (entry `2026fa-iyashsaraf-1.md`), which gave every role
  an invented liveness of 0.5.
