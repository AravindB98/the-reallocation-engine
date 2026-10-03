# SUBMISSION

## Executive summary

This is the cover sheet for the Canvas upload. It names the student, the situation the recipe is built for, where everything is, the one command that runs it, and the exact commit the ZIP matches.

---

- **Assignment:** The Reallocation Engine — Recipe Design Assignment
- **Student:** [your name]
- **GitHub handle:** arundhatik26
- **Domain / situation:** F-1 MS Information Systems student (Jan 2026 intake, STEM-designated degree; second semester) choosing a software developer / full-stack **co-op**, graduating Dec 2027 or Apr 2028. The question: has this employer a *recorded* history of sponsoring software roles, so the co-op can convert to a sponsored full-time job? (SOC 15-1252 / 15-1254)
- **Recipe path:** `recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md` (+ `.card.md`)
- **Prototype command:** `python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py` (test: `python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v`)
- **GitHub repository / branch / PR URL:** `https://github.com/arundhatik26/the-reallocation-engine` / `contrib/2026fa-arundhatik26-coop-sponsor-swe-15-1252` / [PR URL after opening]
- **Submitted commit SHA:** [fill in after committing]
- **Lifecycle stage claimed:** **DRAFT**. A full sample run completed, but 5 typed TODOs (1 DEFINE, 1 DATA SOURCE, 3 DEV) are open, so it cannot be SPECIFIED, which must come before RUNNABLE-SAMPLE.
- **Summary of my changes:** a Python prototype that matches each co-op role's employer exactly against the 80 Days CSV, tiers sponsorship by whether *software titles* were sponsored, reads saved `ats:liveness` output as a gate (fail-closed), computes a timeline gate for two graduation scenarios, writes a `roles.json` per scenario, and runs the existing `role-scorer.mjs`. It writes a JSON log and a Markdown report with every value labeled. Also included: 17 offline tests, the recipe and card, a run-log entry, a domain justification, a worked run with real output and break attempts, a test report, FRICTIONAL and SOURCES.
- **Known limitations:**
  - JPMorgan Chase, Goldman Sachs and Morgan Stanley are not in the data: the tool reports "unknown", never "no".
  - Only each company's *top* sponsored titles are visible.
  - BNY Mellon's Workday board was not liveness-checked.
  - The OPT / STEM / lottery rules are assumptions.
  - The tier thresholds are a first guess.
  - Unknown sponsorship scores "Consider" inside the scorer; the recipe's next-action layer corrects the routing, but the scorer does not.
  - Sample data and a fictional persona only.
