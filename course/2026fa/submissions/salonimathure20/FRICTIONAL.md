# FRICTIONAL — opt-countdown (salonimathure20)

## Summary

This is an honest log of what was tried, what was expected, what went wrong, and what changed in response, while building the opt-countdown recipe in one session on 2026-10-03. Most of the hands-on work was done by an AI coding agent (Claude Code) that I directed. Each entry says who did what. The most important friction: the engine's own liveness checker called a fake job posting "live", and the recipe's design changed because of it.

**Traceability:** the session transcript (Claude desktop app, Code tab, 2026-10-03); the branch `contrib/2026fa-salonimathure20-opt-countdown` and its commits; the tests in `scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.test.mjs`; and outputs in `course/2026fa/submissions/salonimathure20/runs/`.

## Log

| # | Tried (who) | Expected | What happened | Response / what I learned |
|---|---|---|---|---|
| 1 | Run `npm run doctor` / `npm run verify` on the fresh clone (AI) | both pass | default Node was 18.10; the assignment needs 20+. Switched to nvm's 20.20.2. `verify` then **failed**: `ModuleNotFoundError: No module named 'yaml'` in `manifest-check.mjs` | installed `pyyaml` into a throwaway virtualenv, not globally; `verify` passed with 3 warnings. Baseline friction is recorded in `TEST-REPORT.md`. CI installs pyyaml itself, so this only bites locally |
| 2 | `npm run ats:scan -- --dry-run` (AI) | a dry-run scan | `Error: portals.yml not found` | used `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml`, as the tutorial suggests, instead of creating a private `portals.yml` |
| 3 | `npm run ats:liveness` (AI) | a liveness report | Playwright browser missing | **I approved** a ~95 MB Chromium download; it then ran |
| 4 | Fed a deliberately fake Greenhouse job ID to `ats:liveness` (AI; break attempt planned in CHANGE-BRIEF P3) | `expired` | **`active`**. `curl -L` showed a 200 redirect to Klaviyo's careers search page; the Greenhouse API returned 404 | changed the design: added the API status as a second liveness record that wins when present (gate G3); proposed a fix to the shared checker as a typed TODO |
| 5 | Looked up known Boston employers in the 80 Days CSV (AI) | either a row with H-1B numbers or no row | three different shapes: no row (HubSpot), a row with blank H-1B columns (DraftKings), and a row under an old name (Iterative Scopes → Iterative Health) | blank → *Unknown → blocked*, never `p = 0`. Renames need a human-asserted alias labeled your-input |
| 6 | Sanity check of the H-1B counts (AI) | a mix of odd and even counts | **all 1,557** filled rows have even approvals *and* even denials | not corrected (rates are unaffected); listed under *can't verify*. Open question: is the join doubling rows? |
| 7 | First test run (AI) | some failures to fix | 12/12 passed first time, which is suspicious | ran a mutant (API-404 rule set to 1.0): 2 tests failed as they should, then restored. The tests can fail |
| 8 | Ran without the API file (AI, break attempt) | some warning | **silent fallback**: the ghost posting got liveness 1.0 and was skipped only because its timeline gate also closed; Formlabs became Blocked | added a loud warning and a single-source flag |
| 9 | Wrote the reflection (AI) | — | claimed "a fit of 0.59 flips Formlabs to Consider". Recomputing gave 0.3059, still Apply; the real break-even is 0.559 | corrected in the worked run and the recipe. Lesson: recompute every number written in prose |
| 10 | Re-read the persona (AI) | consistent | EAD start 2026-07-01, but only 27 unemployment days used by 2026-10-03, with nothing explaining the gap | added an ended contract job (2026-07-01 → 2026-09-05) to the fictional persona |
| 11 | Chose the lifecycle stage (AI proposed, explained to me) | RUNNABLE-SAMPLE | the constitution requires zero open TODOs for SPECIFIED, and the assignment requires typed TODOs for proposed additions; also no human attestation yet | claimed **DRAFT**, with the sample run logged. Promotion needs TODO closure plus my G4 sign-off |
| 12 | Scorer output date (AI) | 2026-10-03 | the scorer stamps its report in UTC (2026-10-04) | noted only; not my file to change |
| 13 | Committed TEST-REPORT, then ran `pii-scan --diff main` (AI) | clean | **flagged my own file**: I had pasted the upstream `package-lock.json` finding (an email inside npm's deprecation notice) verbatim into TEST-REPORT | not yet pushed, so I amended the commit, expired the reflog and gc'd, so the address is in no reachable commit; re-scan clean. Lesson: quoting a scanner's finding re-creates the finding |

## Human vs. AI contributions

- **I decided:** the target situation (MS, data/SWE roles, OPT), the recipe (*opt-countdown*, from three offered options), the GitHub path (I fork and open the PR myself), and approval of the Playwright download.
- **The AI did:** all exploration, code, tests, fixture capture and documents, plus the break attempts and self-corrections listed above.
- **Accepted as proposed (by me, pending my review):** the runway and timeline formulas, the volume cap of 20, the hiring-lag bands, and the fit values.
- **Rejected:** nothing yet. I picked the AI's recommended option (opt-countdown) from three. The AI itself dropped RUNNABLE-SAMPLE as over-claiming (row 11). Anything I reject on review goes in the section below.

## Unresolved questions

- Are the 80 Days H-1B counts doubled by the SEC × DOL join? The check is to compare one company against USCIS's Employer Data Hub.
- What is a defensible hiring-lag source? Repeated `ats:scan` runs could measure how long postings stay open.
- Should the shared liveness checker compare the final URL with the requested one? That is the proposed fix, and it is untested.

## My own review notes (to add before presenting)

- [ ] I read the recipe, card and report end to end and can explain each gate and each number in the worked run.
- [ ] Changes I made after review (with commit SHAs):
- [ ] What I personally checked by hand:
