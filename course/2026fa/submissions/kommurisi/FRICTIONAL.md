# FRICTIONAL — data-role-sponsor-match

> The rubric grades *your* attempts, checks and learning, and asks you to separate your work from the AI's. Part A is a factual log of what the AI assistant did in the build session, with times and evidence files, so you can trace it. Part B is yours, in your own words. Don't let the AI write it.

## Part A — AI session log (Claude Code, 2026-10-03; factual, for traceability)

| # | Attempt | Expected | What happened | Response | Evidence |
|---|---|---|---|---|---|
| 1 | `npm run doctor` on a fresh Windows clone | runnable | `✗ python3 MISSING`; recipes "0/33 carry lifecycle frontmatter" | Found two causes: `python3` resolves to the Microsoft Store stub, and git `core.autocrlf=true` produced CRLF files, so the `---\n` frontmatter regex never matches. Added a `python3` shim **outside** the repo and re-checked-out with `core.autocrlf=false`. Doctor then reported `environment: ✓ runnable`, 33/33 frontmatter. | `TEST-REPORT.md` §1 |
| 2 | `npm run ats:scan -- --dry-run` | scan | `Error: portals.yml not found` | Copied `data/ats/portals.example.yml` (output stays gitignored) | `runs/baseline/ats-scan-dry-run.txt` |
| 3 | Profiled the 80 Days CSV | most rows have sponsorship | only 1,557 of 30,369 rows have sponsorship columns; 208 normalized names collide; "Analytical Chemistry" matches a naive `analytic` pattern | Made blank → Unresolved, collisions → Unresolved, and added exclude patterns | `CHANGE-BRIEF.md` §4 |
| 4 | Passed the Aarav Patel persona's authorization text to the maintained scorer | needs sponsorship (persona README says PR #37 fixed this) | `profile_needs_sponsorship: false`, composite 0.21 on a Proven sponsor | Did not patch the maintained file; neutral profile string + exit-4 guard; recipe TODO 3 | `WORKED-RUN.md` attestation |
| 5 | `npm run ats:liveness` on a made-up Greenhouse job id | expired | **active** (redirects to the careers search page with Apply buttons) | Added the Greenhouse API cross-check; API 404 wins | `fixtures/worked-run/liveness.txt`, `greenhouse-api.json` |
| 6 | First test run | — | 10/10 pass first time, which proves nothing yet | Ran mutants M1–M3; each turned tests red | `evidence/mutation-tests.txt` |
| 7 | CLI break attempts | safe failures | Found 3 bugs: out-dir check after `mkdir`, 8.3 temp-path mismatch, stale `role-scores.json` after a blocked re-run; plus one misleading console line | Fixed all; added a regression test (M4 shows it bites) | `WORKED-RUN.md` "Broke during testing, fixed" |
| 7b | Fresh clone of the branch into the temp dir, then the tests | 11/11 pass, clean tree | 1 test failed **and** the run wrote into tracked `data/examples/`. The "temp dir allowed" rule covered the whole clone because the clone lived under temp | Rule changed: inside the repo, only my namespaces. Moved to `lib.mjs` `outDirAllowed()` with a unit test and mutant M5. Failed log kept | `evidence/clean-checkout-1-FAILED.txt`, `clean-checkout-2.txt` |
| 8 | Lifecycle status | RUNNABLE-SAMPLE | SNICKERDOODLE requires zero open TODOs for SPECIFIED; the recipe has 5 | Claimed **DRAFT** | recipe "Lifecycle note" |

Unresolved questions the AI could not settle:
- Is "Senior Credit Risk Analyst" a data role?
- Should a Greenhouse 404 close the gate or only flag it?
- Is the 60-day hiring lag reasonable?

These are judgment calls for you.

## Part B — Student entries (write these yourself)

[STUDENT: for each entry, record what you tried, what you expected, what actually happened, what you checked or changed in response, and what you learned. Be specific and honest. A failed attempt is worth as much as a success.]

1. **Reviewing the AI's output:** what did you read closely, and what did you accept, modify, or reject? Cite file and line.
2. **Your own re-run:** run the one command and the tests yourself from a clean checkout. Paste what you saw and note any difference from `WORKED-RUN.md`.
3. **Your own hand check:** pick a company *not* in the worked run, open its CSV row yourself, and say whether the tier the recipe would give it matches your judgment.
4. **The persona:** does it match your real situation (program, graduation date, target roles)? What did you change, and why?
5. **What you learned** about the gap between "this company sponsors" and "this company sponsors my role".
6. **Open questions** you still have.

Traceability: link each entry to a commit SHA, a test name, or a file in `evidence/`.
