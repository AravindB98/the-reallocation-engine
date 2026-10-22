# RUN_LOG entry — backend-pivot-range (ashwinthankachan26)

## Executive summary

This is the run-log entry the assignment asks for, in the format of the repository's main run log. Students may not edit that file (the pull-request checks reject any change to it), so the full record is in `logs/runs/2026fa-ashwinthankachan26-6.md` and this page restates it for the submission. The mode ran on 95 real job postings from 11 Boston-area job boards (fetched October 20, 2026), with the repo's posting checker applied to every shortlisted posting. On October 21 I cleared every gate and the final run was made. Nothing was applied to, and no personal data was used.

---

## Index row (for the maintainer to paste into `logs/RUN_LOG.md` → Index)

| term | student | file | recipe | date |
|---|---|---|---|---|
| 2026fa | ashwinthankachan26 | `logs/runs/2026fa-ashwinthankachan26-6.md` | `recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md` v0.1.5 | 2026-10-20 → 2026-10-21 |

## Entry

### 2026-10-20 → 2026-10-21 — backend-pivot-range · DRAFT v0.1.5 · ashwinthankachan26

- **Recipe:** backend-pivot-range (Cognitive Pivot + Job-Ops liveness gate) for an F-1 new-grad backend engineer (fictional persona Aarav Patel, `search/examples/aarav-patel/`), anchor O*NET 15-1252.00
- **Inputs:** O*NET 30.2 text database (SHA-256-verified against `data/bls/BLS-audit.md`) → `data/onet_elements_15.csv`, `data/onet_titles.csv` · `data/bls/compact/soc_occupation_compact.csv` · 95 public postings from `boards-api.greenhouse.io` (11 boards, 2026-10-20T14:41:26Z, contacts removed) · `npm run ats:liveness` output for 90 URLs · `config.json` (drafted by Claude, approved by Ashwin 2026-10-21)
- **Outputs:** `course/2026fa/submissions/ashwinthankachan26/mode-build/runs/pivot-2026-10-21-run7-final/pivot-log.json` (agent) + `pivot-report.md` (person); runs 1–6 kept
- **Result:** run 1 `PRIORITIZE 67 · STANDARD 15 · PIN-SOC 13` → 4 defects found and fixed test-first → run 3 `PRIORITIZE 50 · STANDARD 22 · PIN-SOC 5 · CHECK-LIVENESS 18`; checker `72 active · 0 expired · 18 uncertain`; tests 32/32 at v0.1.2, **37/37 at the final v0.1.5**; the extract reproduces all 31 stored group-15 pivot scores; outputs deterministic (byte-identical re-run)
- **Findings:** "Back End Software Engineer" is an O*NET title of Web Developers (3.584, rated 2017), while "Software Engineer, Backend" matches Software Developers (3.834, rated 2025). The data-engineering occupations are indistinguishable from the anchor under O*NET's errors, and with fully correlated errors no occupation in the family is. The duties rule read 62/62 readable postings as judgment-heavy.
- **Breaks:** tampered stored score → exit 2 · pin without reason → exit 2 · mutant partial-average library → 3 tests fail · modified O*NET file → ingest exit 2
- **2026-10-21 (v0.1.2):** duties-signal check added (reports "62 of 62 in one class"); 18 unconfirmed postings re-checked on the employers' boards: 18/18 still listed; blind sheet of 20 postings made for the person to label
- **2026-10-21 run 4 (after config approval and the 3 SRE pins; superseded by run 5):** `PRIORITIZE 52 · STANDARD 23 · PIN-SOC 2 · CHECK-LIVENESS 18` · `runs/pivot-2026-10-21-run4-final/` · the 3 newly shortlisted checked: 3 active
- **2026-10-21 run 5 (v0.1.3; superseded by run 6):** `PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18` · `runs/pivot-2026-10-21-run5-final/` · gate commands G1–G4 all exit 0
- **2026-10-21 evening (v0.1.4):** Ashwin's own O*NET OnLine check confirms "Back End Software Engineer" → Web Developers first. TODO #3 decided (keep spellings separate); TODO #5 built (both error assumptions). **Run 6 (superseded by run 7):** same counts as run 5, `runs/pivot-2026-10-21-run6-final/`. No occupation is real under both assumptions.
- **2026-10-21 late (v0.1.5, after an outside review):** refuse to rank on a non-discriminating duties reading; honest match labels; corrected wording; fictional persona Aarav Patel instead of the author's own profile (branch re-cut). **Run 7 (final):** `STANDARD 75 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18` (`runs/pivot-2026-10-21-run7-final/`). G4 per-posting checks by Ashwin; 8-posting blind sheet made, not labelled.
- **Gates:** all cleared by Ashwin S Thankachan, 2026-10-21: G2 (config approved; 3 SRE pins; 2 Developer Advocate postings out of target) · G3 (75/75 shortlisted active via checker; he opened the other 18, all open) · G4 · G5 (tailor list of 6). Attestation signed.
- **Open issues:** 3 typed TODOs open (#1, #2, #3, #5 closed 2026-10-21) · duties rule doesn't discriminate · 24 postings with no recognised duties header · `npm run ats:scan -- --dry-run` fails on a fresh clone (`portals.yml not found`)
