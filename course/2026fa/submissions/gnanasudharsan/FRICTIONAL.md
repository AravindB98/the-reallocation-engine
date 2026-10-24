# FRICTIONAL — de-mlops-h1b

## Executive summary

**What this is:** an honest log of building my recipe and prototype: what was tried, what I
expected, what actually happened, and what changed as a result. Each entry says whether
the student or the AI agent did the work.

**Why read it:** most of what this project learned came from things that went wrong. The
repo's own liveness checker broke on multi-link checks, the scorer misreads a pre-OPT
student's status, and one "apply" result was a job outside the US.

**What it found:** the agent built and ran most of the code. The student set the scope,
wrote the key prediction, approved the plan, and owns every judgment the report asks for.
The student's reflection below was organized by the AI from the student's own decisions and runs (disclosed in SOURCES.md).

> Entries 1–10 were drafted by the AI agent from the session record on 2026-10-01 and
> describe what is visible in that record. The student cells and reflection below
> were completed on 2026-10-02/03 from my answers and my own runs.

## Log

| # | Who | Attempt | Expected | What happened | Response / learning | Trace |
|---|---|---|---|---|---|---|
| 1 | Student | Changed scope from Data Scientist on STEM OPT (SOC 15-2051) to Data Engineering / MLOps, graduating Dec 2026, pre-OPT | — | A predict-phase brief for the old scope already existed | Chose a fresh brief and a new branch; old brief archived, not deleted | `archive/CHANGE-BRIEF-ds-stemopt-15-2051.md`; branch `contrib/2026fa-gnanasudharsan-de-mlops-h1b` |
| 2 | Agent | `npm run doctor`, `npm run verify` baseline | both pass | doctor passed; verify's manifest step failed: `ModuleNotFoundError: No module named 'yaml'` | Not installed by the agent. **Resolved 2026-10-02:** `pyyaml` was already in the repo's `.venv`; with `.venv/bin` on PATH, `npm run verify` passes (3 `.gitignore`-pattern warnings) | TEST-REPORT.md §5 |
| 3 | Agent | Profiled the CSV for this domain | some blank rows | 28,812 of 30,369 rows have blank approvals; "MLOps" appears in 0 sponsored titles; Google/Amazon/Meta absent | Blank became a hold reason, never zero; MLOps mapping labeled model-judgment | `CHANGE-BRIEF.md` §1, §4 |
| 4 | Agent | Ran the scorer with the honest pre-OPT phrase "OPT EAD not yet authorized" | needs sponsorship = true | `profile_needs_sponsorship: false` (regex at `role-scorer.mjs:60`) | Prototype exits 3 instead of reporting; scorer not patched | `runs/break/2-trap-persona.txt`; test "scorer regex trap" |
| 5 | Student | Wrote CHANGE-BRIEF §5: the prototype would misclassify recently funded companies without DOL records as sponsors | — | Design holds funded-but-unrecorded companies (`no-sponsorship-record`); covered by the Composabl fixture only, since no such company appeared in the real sample | Prediction not confirmed, and not fully tested on real data | `CHANGE-BRIEF.md` §5; test "recent Form D funding does not stand in" |
| 6 | Agent | `npm run ats:liveness` with 12 URLs in one call | per-URL status | 10 of 12 `uncertain`, each "interrupted by another navigation to" the previous URL's redirect | Re-ran one URL per call: 7 active, 5 uncertain. Defect logged, maintained script not patched | `sample/liveness-batch.txt`, `sample/liveness.txt` |
| 7 | Agent | Chose real postings for the sample | US data roles | Picked a Twilio role located "Remote – Ireland"; it scored **Apply** | Kept on purpose to expose the missing location gate; `[TODO: DEV]` in recipe | worked run, Reflection |
| 8 | Agent | Instacart lookup by brand name | match | No row: the CSV lists it as `MAPLEBEAR INC` | Added optional `legal_name` (your-input) + test; Upstart left without one to show the hold | test "brand name differs from legal name" |
| 9 | Agent | Mutation test: disabled the blank-approvals hold | tests fail | 2 tests failed; file restored with an identical SHA-256 | Confirms the key rule is actually guarded | `runs/break/1-mutant-blank-as-zero.txt` |
| 10 | Agent | Path scan before submission | clean | The JSON log contained the scorer's temp path, including the OS username | Kept only the scorer's summary line; regenerated the run | worked run, "Broke during testing, fixed" |

## Human / AI contributions

| Item | AI agent did | Student decided / checked / changed / rejected |
|---|---|---|
| Scope | proposed the conflict check | **chose** DE/MLOps, Dec 2026, pre-OPT; **rejected** the earlier DS scope |
| CHANGE-BRIEF | drafted §1–§4 from data checks it ran | **wrote §5** (own prediction) |
| Recipe + card | drafted | approved the plan before edits under `recipes/` (plan mode) |
| Prototype + tests + fixtures | wrote, ran, debugged | specified the paths and commands; reviewed the code; **made no changes to it** (2026-10-02) |
| Tier→p values, keyword lists | proposed, labeled model-judgment | **accepted as provisional** (2026-10-02): Proven 0.9 / Likely 0.6 / Possible 0.3 / None 0.0 stay, still uncalibrated, so the recipe's `[TODO: DEFINE]` stays open |
| Sample fit ratings, start dates | set **placeholders** (0.7, flexible) | **chose to keep them as disclosed placeholders** for this sample run (2026-10-02); fit therefore does not differentiate roles here |
| File placement | moved FRICTIONAL/SOURCES from repo root to this folder (CI `contrib-gate.yml` rejects root files) | **accepted** (2026-10-03) |
| Attestation | executed every row (2026-10-01) | **re-ran 4 of the rows myself on 2026-10-02 (all matched) and signed 2026-10-03**; hand-check row not re-confirmed (see the worked run) |

## Student Reflection & Personal Account

*Organized by the AI from my answers and my own runs; every statement below is something I did or decided.*

- **What I did:** chose the scope (Data Engineering / MLOps, Dec 2026 graduate, pre-OPT) and dropped the earlier Data Scientist scope; wrote the §5 prediction in CHANGE-BRIEF; approved the implementation plan; reviewed the prototype code without changing it; accepted the tier values as provisional; kept the placeholder fit ratings and start dates, disclosed; accepted moving these files out of the repo root.
- **What I checked:** on 2026-10-02 I re-ran the offline tests (14 pass), the sample run (6 scored, 6 held), the regex-trap persona (exit 3) and the past-dates persona (exit 2) in my own terminal. All matched the attestation.
- **What went wrong and what I learned:** the hand-check command printed executives' names instead of approval counts, because splitting a CSV on commas breaks on quoted fields. The check looked like it ran fine, which is exactly the kind of fluent wrong output this engine warns about. I did not re-run it, so that row rests on the AI's check.
- **Not mine:** the batch-liveness defect, the scorer regex trap, the hand cross-check in `runs/break/`, and all the code were found or written by the AI agent. My §5 prediction (funded companies mistaken for sponsors) was not confirmed on real data; only a fixture covers it.

## Open questions (agent-recorded)

- Should the maintained scorer's profile regex change, or should the persona wording change? (maintainer decision)
- Is one registration window per March, with a 60-day EAD start window, right for 2027–2029? (verify with USCIS / the international student office)
- Is "top ~5 sponsored titles" good enough to call a family match, or does this need DOL LCA SOC data?
