# FRICTIONAL — honest log

## Executive summary

This is an honest log of building the co-op sponsor check: what was tried, what broke, what was checked, and who did what (me or the AI assistant). Most of the code and documents were drafted by an AI coding assistant (Claude Code) in one session on 2026-10-02. I chose the situation, the target companies and the direction, set the limits, and own the review. The sections marked **[Student]** record my own answers: I chose them from options Claude offered, and Claude wrote them down.

---

## Timeline of what actually happened (2026-10-02, one session)

*The facts in this table were recorded by Claude from the session transcript; I (the student) have checked them.*

| # | What was tried | Expected | What happened | Response | Who |
|---|---|---|---|---|---|
| 1 | Read the assignment; asked Claude to explain it | — | Claude summarized it into 11 deliverables and 5 steps | Decided to fork and work in the terminal, not VS Code | Student asked; Claude explained |
| 2 | Forked `nikbearbrown/the-reallocation-engine` in the browser | fork under my account | fork created as `arundhatik26/the-reallocation-engine`. My handle is `arundhatik26`, not the `arundhati-k` I used for Week 1 | all paths use `arundhatik26` | Student |
| 3 | Clone, `npm install`, `npm run doctor`, `npm run verify` | all pass | all passed; verify shows 3 warnings that were already there | push to `upstream` disabled, so nothing can go to the instructor's repo | Claude ran; student's fork |
| 4 | `npm run ats:scan -- --dry-run` | a list of postings | **failed**: `portals.yml not found` | re-ran with `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml`, so no private config file was created | Claude |
| 5 | `npm run score -- data/examples/ch11-roles.json --out-dir …` | a scored example | 5 roles, **skip 40%**, below the "healthy" 50% | noted as an observation | Claude |
| 6 | Stated my situation: MS IS, F-1, Jan 2026 intake, SWE / full-stack, target JPMC, Goldman, Visa, Morgan Stanley | — | Claude searched the 80 Days CSV: **JPMC, Goldman and Morgan Stanley are not in it; Visa has a row with no sponsorship data** | the recipe's core became "absence is not a no" | Student's situation; Claude's search |
| 7 | Said I'm in second semester; graduation Dec 2027 or Apr 2028 depending on co-op | — | Claude pointed out that a co-op on CPT needs no sponsorship, so the real question is conversion | the recipe became a **co-op** sponsor check with **two graduation scenarios** | Student's facts; Claude's reframing, accepted by student |
| 8 | Asked to drop the word "fintech" | — | Claude removed it from the framing and slug | slug `coop-sponsor-swe-15-1252` | **Student decision** |
| 9 | Asked whether the professor provided a company list | — | Claude showed the CSV counts: 1,552 with any approvals, 573 with software titles, 27 with full-stack (the prototype's slightly broader title filter later gave 585) | — | Claude |
| 10 | Said MSIS is STEM-designated | — | recorded as `your-input`, not checked | — | Student |
| 11 | Chose **BNY Mellon** | — | its CSV row: 704 approvals, top titles include Full-Stack Developer. Searching "MELLON" also hit `TAMARA MELLON BRAND INC` | **exact matching only**, plus a human gate G2 | **Student choice**; Claude found the trap |
| 12 | Said: don't commit or push until finished | — | nothing committed or pushed | — | **Student decision** |
| 13 | `npm run ats:liveness` on a real Databricks intern URL and a fake job id | active / expired | **failed**: Playwright browser missing | `npx playwright install chromium`, re-ran | Claude |
| 14 | Same, re-run | fake id → expired | fake id → **`uncertain`**, not `expired` | the recipe treats uncertain as a closed gate | Claude |
| 15 | Looked for a BNY posting to check | a URL | BNY's careers site is Workday, not one of the 4 supported providers; the API probes returned 422 | BNY liveness left `unchecked → 0`, with a typed `[TODO: DEV]` | Claude |
| 16 | First full prototype run | — | Stripe showed `TAILOR APPLICATION` even though it was Skip under Dec 2027 | added `DEPENDS ON GRADUATION DATE` | Claude noticed and fixed |
| 17 | Read the scorer's output | — | **JPMorgan (no data) scored Consider 0.225**, because the scorer drops a vote with no `p`; and the scorer treats a missing liveness as 1.0 | the next-action layer routes unknown to NETWORK; liveness is never omitted | Claude |
| 18 | Tests | pass | 17/17 pass; `ResourceWarning`s fixed | — | Claude |
| 19 | `node scripts/pii-scan.mjs` | clean | 1 finding, in `package-lock.json` (an npm author's email), **already on main** | not changed; documented | Claude |
| 20 | Fresh-clone run | pass | first attempt failed (my script created a branch the clone already had); second attempt passed, with identical next actions | — | Claude |
| 21 | Ran the prototype myself in my own Terminal (2026-10-03) | same output as the worked run | identical: dec-2027 Apply 1 · Consider 2 · Skip 4 (57%); apr-2028 Apply 2 · Consider 2 · Skip 3 (43%); same 7 next actions | outputs in `runs/sample/` regenerated (scorer's `generated` date is now 2026-10-03) | **Student** |
| 22 | Asked for an initial commit before answering my sections | — | Claude made commit `8bb1db2` (29 files, my folders only); I had meant to run it myself | kept it; `pii-scan --diff origin/main`: clean ✓ | Claude committed; **Student** pushed the branch |
| 23 | Chose the Proven threshold | — | raised `proven_min_approvals` from 50 to 100 (reason: my targets are big employers anyway); re-ran: output identical | recipe TODO narrowed to the 0.3 probability only | **Student** decided; Claude edited and re-ran |

## What I checked, changed, or learned

> **[Student]** (my answers)

*(I chose these answers from options Claude offered on 2026-10-03; Claude wrote down my choices.)*

- I ran the prototype in my Terminal and read report.md.
- **Surprised me most:** a fake job link came back "uncertain", not "expired".
- **What I learned most:** the difference between CPT, OPT and H-1B: a co-op on CPT needs no sponsorship, and the visa question comes at full-time conversion.
- **Changed in response:** raised the Proven threshold from 50 to 100, because my targets are big employers anyway (row 23).

**Unresolved questions** (Claude listed these; the student can add more):
- Does JPMorgan / Goldman / Morgan Stanley actually sponsor software co-op conversions? Not answerable from this repo. To ask: alumni, the co-op advisor.
- Are the 12 + 24 month OPT / STEM OPT numbers and the March lottery timing current? To check with OGS.
- ~~Is 50 approvals a sensible threshold for "Proven"?~~ I raised it to 100 (see row 23).
- Is 0.3 a sensible probability for "sponsors, but no software title"? Not decided.

## Human / AI contributions

| Item | AI (Claude Code) did | I (student) did | Accepted / modified / rejected |
|---|---|---|---|
| Understanding the assignment | summarized it | asked questions, decided the order | accepted |
| Domain / situation | proposed options; pointed out the co-op (CPT) angle | gave my real situation in general terms; chose co-op software roles; **removed "fintech"**; **chose BNY Mellon** | modified Claude's proposal |
| Company research | searched the CSV; found the missing big banks, Visa blank, SoFi two names, Tamara Mellon | — | accepted |
| Prototype code + tests | wrote all of `coop_sponsor_check.py` and the tests and fixtures | ran it myself in my Terminal (row 21) | accepted as is; I did not change it |
| Recipe + card | drafted | read it | accepted as is |
| Domain justification | drafted, including the time estimate | read it | accepted; I agree with the 3–4 h/week estimate |
| CHANGE-BRIEF predictions §5–6 | left blank on purpose; explained what "predictions" means | I made none before building and said so | my own (honest "none") |
| Reflection + attestation | offered answer options; wrote down my choices | chose each answer; ran the prototype myself; signed the attestation | my choices |
| Commit / push / PR | made initial commit `8bb1db2` when asked | asked to hold, then asked for an initial commit; **pushed it myself**; PR not yet opened | accepted the commit |

## Traceability

- Branch: `contrib/2026fa-arundhatik26-coop-sponsor-swe-15-1252` (initial commit `8bb1db2`; final commit SHA: recorded in the Canvas ZIP copy of SUBMISSION.md)
- Run log: `logs/runs/2026fa-arundhatik26-1.md`
- Test output: [TEST-REPORT.md](TEST-REPORT.md); real run output: [WORKED-RUN.md](WORKED-RUN.md)
- Saved liveness record: `scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/inputs/liveness-2026-10-02.txt`
- Session: Claude Code desktop session, 2026-10-02 (transcript available on request)
