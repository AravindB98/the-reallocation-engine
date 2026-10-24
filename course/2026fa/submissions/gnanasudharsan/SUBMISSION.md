# Submission Details

- **Assignment:** The Reallocation Engine — Recipe Design Assignment
- **Student:** Gnanasudharsan Ashokumar
- **GitHub Handle:** Gnanasudharsan
- **Domain / Situation:** International Master's student in Data Analytics Engineering, DE/MLOps H-1B Triage
- **Recipe Path:** `recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md`
- **Prototype Command:** `node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt` (test: `node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/`)
- **GitHub Repository / Branch / PR URL:** https://github.com/Gnanasudharsan/the-reallocation-engine · branch `contrib/2026fa-gnanasudharsan-de-mlops-h1b` · PR: [add the PR URL after opening it]
- **Submitted Commit SHA:** [after the final commit, paste the output of `git rev-parse HEAD`; the ZIP and the PR head must be this same commit]
- **Lifecycle Stage Claimed:** `DRAFT`, with a completed sample run. The recipe has 7 open typed TODOs, so it cannot pass SPECIFIED, and therefore not RUNNABLE-SAMPLE, under the repo's lifecycle rules.
- **Summary of my Changes:** Built a custom recipe and prototype integrating SEC Form D funding samples, 80 Days sponsorship CSV, and ATS liveness checks with the official role scorer.
- **Known Limitations:** Location-less scoring (e.g., Ireland remote roles scoring Apply) and title keyword false positives (Solutions Architect). Also: sample fit ratings and start dates are placeholders; Upstart/brand-name lookups need a legal name; the multi-URL liveness check is unreliable (worked around one URL per call).
