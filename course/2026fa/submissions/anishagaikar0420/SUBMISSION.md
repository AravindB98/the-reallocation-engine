# SUBMISSION

## Executive summary

Cover sheet for the Canvas upload: what was built, where it lives, how to run it, and what it cannot do.

- **Assignment:** The Reallocation Engine — Recipe Design Assignment
- **Student:** Anisha Gaikar
- **GitHub handle:** anishagaikar0420
- **Domain / situation:** International MS Information Systems / Business Analytics student, F-1, graduating May 2027, targeting Business Intelligence Analyst roles (SOC 15-2051.01) that must start inside the OPT window and sponsor H-1B later.
- **Recipe path:** `recipes/cases/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown.md` (card: `.card.md`)
- **Prototype command:** `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs` (tests: `node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs`)
- **GitHub repository / branch / PR URL:** https://github.com/anishagaikar0420/the-reallocation-engine / `contrib/2026fa-anishagaikar0420-msis-bi-analyst-opt-countdown` / _(paste PR URL)_
- **Submitted commit SHA:** _(paste output of `git rev-parse HEAD`)_
- **Lifecycle stage claimed:** DRAFT (recipe v0.1.1) — the sample path runs end to end, but 3 proposed additions are open, so it has not reached SPECIFIED.
- **Summary of my changes:** A recipe + card and a small Node prototype that computes the OPT-window timeline gate from real dates (nothing in the repo computed it before), looks up H-1B history in the 80-Days CSV with exact name matching, blocks roles with missing facts instead of scoring them as zero, runs the existing scorer, and writes a JSON log and a Markdown report with every value labeled record / your-input. 12 offline tests. v0.1.1 tightened the analyst-title rule after a hand check of Figma's CSV row (Figma and Sigma moved Apply → Consider). AI assistance (Claude) is disclosed in SOURCES.md and FRICTIONAL.md.
- **Known limitations:** Liveness was not checked against the live web in the recorded run. H-1B counts are company-wide, not per role, and every count in the dataset is even (possible double count, unconfirmed). Sponsorship tiers still rest on five sampled titles, not per-role records. OPT rules are stated inputs, not read from regulation. Sample postings are invented; company rows are real.
