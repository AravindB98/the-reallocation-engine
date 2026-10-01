# SUBMISSION — SmitPatel-31

- **Assignment:** The Reallocation Engine — Recipe Design Assignment
- **Student:** Smit Patel
- **GitHub handle:** SmitPatel-31
- **Domain / situation:** International MS student (F-1, STEM degree), graduating December 2026, OPT not yet started, targeting new-grad Software Developer roles (SOC 15-1252) at companies with ≥ 100 H-1B approvals. The recipe checks whether a big sponsor's record shows *entry-level* software titles, and whether a role's start date fits a December graduate's 90-day OPT unemployment window.
- **Recipe path:** `recipes/cases/2026fa/SmitPatel-31-newgrad-swe-bigsponsor.md` (+ `.card.md`)
- **Prototype command:** `node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs` (test: `node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs`)
- **GitHub repository / branch / PR URL:** https://github.com/SmitPatel-31/the-reallocation-engine · `contrib/2026fa-SmitPatel-31-newgrad-swe-bigsponsor` · PR: [TO FILL after the PR is opened]
- **Submitted commit SHA:** [TO FILL after the commit]
- **Lifecycle stage claimed:** DRAFT. The sample path runs end to end with passing offline tests; 4 typed v0.2 TODOs remain open, and SNICKERDOODLE requires zero before leaving DRAFT.
- **Summary of my changes:** a recipe + human card; a dependency-free Node prototype that reads the shipped 80 Days CSV and BLS compact file, classifies each company's sponsored titles by level, gates postings on company match, liveness and the OPT timeline, and runs the existing `role-scorer.mjs` unmodified; 13 offline tests including end-to-end runs against the real scorer; a fictional persona and postings; the change brief, domain justification, worked run with attestation, test report, run log, Frictional log and sources.
- **Known limitations:** sample data only (fictional postings, fixture liveness); the title rule misreads some titles (e.g. `JAVA ENGINEER 2`); the CSV has no per-title counts and no year; the CSV omits most non-Form-D sponsors (Google, Amazon, NVIDIA…); a self-rated fit can nearly lift a no-SWE-evidence sponsor into Consider; OPT rules not confirmed with the DSO; not run on Node 20 or in CI yet. Most of the code and prose was written by an AI agent. See SOURCES.md for the split.
