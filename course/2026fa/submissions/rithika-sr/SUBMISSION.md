# SUBMISSION

Assignment: The Reallocation Engine — Recipe Design Assignment
Student: Rithika Sankar Rajeswari
GitHub handle: rithika-sr
Domain / situation: international F-1 MS data-science student graduating Dec 2026, OPT EAD expected Jan 2027, triaging entry-level Data Scientist roles (SOC 15-2051) that need H-1B sponsorship (fictional persona Sasha Jones)
Recipe path: recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md (card: .card.md)
Prototype command: python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
Test command: python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py" -v
GitHub repository: https://github.com/rithika-sr/the-reallocation-engine
Branch: contrib/2026fa-rithika-sr-ds-newgrad-h1b-15-2051
PR URL: https://github.com/nikbearbrown/the-reallocation-engine/pull/22
Submitted commit SHA: the commit that adds this file (HEAD of the PR branch). A file cannot contain its own commit's SHA, so the exact value is in the Canvas submission comment. Last content commit before it: b24e1190725ae66f2fab2876ec10a95874bfcea8
Lifecycle stage claimed: RUNNABLE-SAMPLE

Summary of my changes:
- Recipe + card for a sponsor-triage workflow with gates G0-G4 and 7 typed TODOs.
- Python prototype (standard library only) that reads the shipped sponsorship CSV and BLS file, holds unverifiable roles, calls the unchanged scripts/score/role-scorer.mjs, and writes triage-log.json + triage-report.md.
- 17 offline tests on invented fixtures; worked run on the real CSV, reproduced on a fresh clone.
- CHANGE-BRIEF (predictions + revision), DOMAIN-JUSTIFICATION, WORKED-RUN with attestation, TEST-REPORT, FRICTIONAL, SOURCES, run log in logs/runs/.

Known limitations:
- The liveness gate passed a job removed on Jun 11, 2025 (aggregator page); its Apply is a documented false positive.
- A Proven sponsor alone clears the Apply threshold; flagged in the report, not fixed.
- No SOC-specific sponsorship counts (CSV has no SOC column); title matching cannot tell entry-level from senior.
- Exact name matching misses brand names (Instacart / MAPLEBEAR INC).
- Liveness results are transcribed into the candidates file, not run by the prototype.
- Timeline formula is my understanding of the OPT 90-day rule, not legal advice.
- No CI checks were shown on the PR when submitted; local verify, doctor, pii-scan, and tests are pasted in the PR.
