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

## Part B — My side of the work (Siddi)

*Drafted by Claude from the session record at my request, then reviewed by me. It describes only what I actually did.*

**How I split the work.** I gave Claude the assignment PDF, then pasted the full assignment text, and let it pick the domain and do the build. Claude asked me three things up front: my career situation, my GitHub handle, and how much it should do. I didn't answer them; I re-sent the assignment instead. So the persona (MS Information Systems, Dec 2026 graduation, data/BI roles) and the handle `kommurisi` were Claude's inferences from my other repos, not choices I made. That was a real trade-off: I got a working build fast, but the "designed for my own situation" part rests on a guess I hadn't confirmed when the work was pushed.

**What I did myself.**
- I tried to hand GitHub over completely: I offered to log in for Claude and asked it to fork the repo for me. Claude said it can't enter passwords. When it tried to open the GitHub sign-in page in its browser pane so I could sign in there, the app's safety check blocked it. I forked `nikbearbrown/the-reallocation-engine` myself in my own browser.
- Claude then pushed the branch to my fork. Git printed a "create a pull request" link pointing at my own fork. Claude told me the PR has to target the instructor's repo and gave me the right compare link. I opened the PR from that link: https://github.com/nikbearbrown/the-reallocation-engine/pull/31
- I asked Claude to write this section and the student part of SOURCES.md. It agreed only on the condition that it stick to what actually happened.

**What I accepted without changing.** Everything in the build: the recipe, the prototype, the tests, the DRAFT status, the worked-run inputs, and the three judgment calls listed at the end of Part A (the credit-risk-analyst title, the 404 rule, the 60-day lag).

**My own re-run.** At first I asked Claude to run it for me and to write that I had done it. Claude refused to put my name on its run, so I ran it myself on 2026-10-03 in Git Bash on my laptop, with the one-line command from the README (`match.mjs`, then `node --test … match.test.mjs`). What I saw matched `WORKED-RUN.md`: `7 roles → Apply 1 · Consider 2 · Skip 1 · Unresolved 3`, Klaviyo Analytics Engineer Apply at 0.54, Databricks Consider at 0.315 (sponsorship tier "Likely"), Toast Consider at 0.285, the constructed dead Klaviyo job Skip (liveness gate 0), and DraftKings / Absci / Northwind Unresolved. Tests: 12 pass, 0 fail (`duration_ms 427`).

**Still not done.** I haven't hand-checked a CSV row myself. **Persona:** after the build, I confirmed that the persona Claude inferred (MS Information Systems, graduating Dec 2026, targeting data engineering / analytics / BI roles) matches my real situation. The dates in the committed persona are still invented.

**What I'm taking from it.** Big sponsor count doesn't mean they will sponsor

Traceability: commits `4943dfb`, `027a519`, `5619ff0` on `contrib/2026fa-kommurisi-data-role-sponsor-match`; PR #31; the AI's actions are in Part A.
