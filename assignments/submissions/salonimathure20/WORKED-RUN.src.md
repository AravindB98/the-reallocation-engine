# Worked run — opt-countdown v0.2, live, 2026-10-21

## Executive summary

**What this is.** The record of one real run of the opt-countdown job-search mode against twelve live job postings on 21 October 2026. It holds every command as typed, its unedited output, how the output was checked, the ways I tried to break the mode, and what I learned.

**Why read it.** It shows what the mode established from data versus what a person or a model judged. It also names the mistakes the run exposed, both in my earlier version and in the engine's shared scorer.

**What it found.**

- For a fictional student with 35 days of runway left, **no posting was worth applying to now**. Six of the ten scorable postings were at strong H-1B sponsors whose hiring (by the student's own estimate) takes longer than 35 days.
- One posting at a company with a perfect sponsorship record says in its text that it will not sponsor.
- Two postings that were open 18 days earlier, including v0.1's only "Apply", have closed.
- Break attempt B6 exposed a flaw in the shared scorer: it recommends "Apply" for a role with zero fit if the company sponsors enough. That is not fixed here; it is proposed as a typed TODO.
- The machine gates all passed. At the human gate I dropped the one Consider row (7+ years asked against 1).

## Run record

| Item | Value |
|---|---|
| Mode | `recipes/cases/2026fa/salonimathure20-opt-countdown.md` v0.2.0, `--mode live` |
| Lifecycle claimed | **DRAFT** (live run done; 5 typed TODOs open; G4 signed, Consider row dropped) |
| Branch | `mode/salonimathure20-opt-countdown` |
| Date | 2026-10-21 (network steps ~19:00–19:13 UTC) |
| Machine | macOS, Node v20.20.2, Python 3.13 (`pyyaml` from a throwaway venv, only for `npm run verify`) |
| Persona | **fictional** (`ananya-rao-example`), the same persona as the 2026-10-03 sample run, 18 days later. No real person's data. |
| Postings | 12: 11 real public Greenhouse postings at Massachusetts employers + 1 deliberately fake job ID |
| Agent log | `runs/live-2026-10-21/out/opt-countdown-log.json` |
| Human report | `runs/live-2026-10-21/out/opt-countdown-report.md` (inlined in full below) |

## 1. Inputs

**Persona (your-input, fictional).** MS Information Systems, graduated May 2026, F-1 OPT year 1. OPT end date 2027-06-30. Unemployed since 2026-09-06, so 45 of 90 unemployment days used on 2026-10-21. Buffer 10 days. 1 year of experience (a summer internship plus a 2-month contract, rounded up). Targets: BI/data analyst (15-2051.01), software developer (15-1252.00), systems analyst (15-1211.00).

**Candidates.** How the 12 postings were chosen:

- I listed every Massachusetts company in the 80 Days CSV with an H-1B record (227 rows).
- I probed 25 of them for a public Greenhouse board (13 board names answered, though `cmt` and `cambridgemobiletelematics` may be one company), plus 10 more Boston employers, which found CarGurus. This sweep was exploratory and its raw output was not saved; every chosen posting is re-verified in §2.2.
- I kept non-senior data, analyst and software titles located in MA or US-remote.
- I added three carried over from the v0.1 run to see what changed: Formlabs BSA, Iterative Health, and the fake Klaviyo ID.
- I added CarGurus, a Boston employer with no row in the CSV.

| # | Role | Why it is in the run |
|---|---|---|
| 1 | PathAI — Software Engineer I, Fullstack | the one clearly new-grad title in the sweep |
| 2 | Formlabs — Software Engineer, Business Systems | asks 0–3 years; open 295 days |
| 3 | Cohere Health — Healthcare Analyst II | analyst role at a 104-approval sponsor |
| 4 | Formlabs — Data Engineer | asks 3+ years |
| 5 | Klaviyo — Full Stack SWE, People Systems | carried from v0.1, where its fit was judged from the title alone |
| 6 | Klaviyo — Analytics Engineer | primary-target work, asks 5+ years |
| 7 | EverQuote — Data Scientist | Proven sponsor; the posting refuses sponsorship |
| 8 | Abacus Insights — Forward Deployed Data Engineer | small employer (short lag), asks 7+ years |
| 9 | CarGurus — Performance Marketing Analyst | company has **no row** in the CSV |
| 10 | Formlabs — Business Systems Analyst | v0.1's only Apply; re-checked |
| 11 | Iterative Health — Clinical Data Specialist | v0.1 Consider; alias now from `aliases.json` |
| 12 | Klaviyo — "Data Analyst", job ID 1000000003 | **deliberate break:** the ID does not exist |

**Fit (model-judgment).** Proposed by Claude from each posting's stated requirements (years asked, stack, domain), not from the title. Reviewed and accepted by me (Saloni Mathure) at gate G4 on 2026-10-21.

**Hiring lag (your-input).** Size-band assumptions (30/45/60 days). The size bands themselves are estimates, not checked.

## 2. Commands and real output

### 2.1 Conformance before and after (verify, doctor, PII, CI harnesses, tests)

<!-- include: runs/live-2026-10-21/terminal/00-conformance-and-ci-equivalents.txt -->

Two failures are upstream, not mine:

- **PII scan.** The working-tree scan flags an npm author address inside `package-lock.json`, an upstream file this branch does not touch. The branch-history scan against `origin/main` is clean (§3).
- **CI harnesses.** Four harnesses that CI calls are missing from upstream `main`. I confirmed this in a clean worktree of `origin/main`, so every student PR's `harness-regression` job will fail.

### 2.2 Posting evidence: dry run, then live

<!-- include: runs/live-2026-10-21/terminal/01-posting-evidence-dry-run.txt -->

The first live fetch (02a) used an exclusion regex that I later found had a false negative (§5). I fixed it, re-fetched (02b), and diffed the extracted facts (02c). They were identical, so no decision changed.

<!-- include: runs/live-2026-10-21/terminal/02b-posting-evidence-live-after-regex-fix.txt -->

<!-- include: runs/live-2026-10-21/terminal/02c-evidence-diff-first-vs-second.txt -->

### 2.3 Browser liveness: the shared checker before and after the v0.2 patch

The same 12 URLs, unpatched checker (a copy of `scripts/ats/` at HEAD `81d0161`) and then `npm run ats:liveness` with the patch:

<!-- include: runs/live-2026-10-21/terminal/03a-liveness-UNPATCHED.txt -->

<!-- include: runs/live-2026-10-21/terminal/03b-liveness-patched.txt -->

The only change is the last line. The fake job ID goes from `active` to `uncertain: redirected off the job`. Separately, four **live** postings read `uncertain` in both versions because the checker found no visible apply button. The Greenhouse API says 200 for all four, so the API record wins and each disagreement is flagged in the report.

### 2.4 What happened to the v0.1 postings in 18 days

<!-- include: runs/live-2026-10-21/terminal/09-v01-postings-recheck.txt -->

### 2.5 The mode, live

<!-- include: runs/live-2026-10-21/terminal/04-opt-countdown-live.txt -->

The human report it wrote, unedited:

<!-- include: runs/live-2026-10-21/out/opt-countdown-report.md as markdown -->

The unticked sign-off box at the end of the report is how the tool printed it, before my review. My G4 decision on that row is recorded in `logs/runs/2026fa-salonimathure20-2.md`: **Drop** (Saloni Mathure, 2026-10-21).

One agent-log entry (EverQuote; the BLS and funding context fields are omitted for length):

<!-- include: runs/live-2026-10-21/terminal/08-log-excerpt-everquote.txt -->

## 3. Verification: how I know the output is real

1. **Independent recomputation.** `verify-run.py` does not import the mode's code. It re-parses the 80 Days CSV with Python's `csv` module and recomputes every p-value, the runway, every slack and timeline factor, and every composite (from `roles.json` and the weights the scorer itself wrote). It then re-derives the summary counts from the per-role entries.

<!-- include: runs/live-2026-10-21/terminal/05-verify-independent.txt -->

2. **Same input, same output.** Running the mode twice on the same saved evidence gave identical `opt-countdown-log.json` and `role-scores.json` apart from timestamps and the output-folder path. `rerun-offline.sh` reproduces steps 04–06 from the saved evidence with one command.
3. **The posting text is really there.** The EverQuote phrase was re-read with `curl | grep`, not the mode's regex (B1, §4). The Formlabs decoy word was confirmed present in the raw posting (B2).
4. **The tests can fail.** In a scratch copy I put back two bugs (the en-dash bug, and G2b switched off). The tests caught both:

<!-- include: runs/live-2026-10-21/terminal/07-mutation-check.txt -->

5. **Branch-history PII scan** (`node scripts/pii-scan.mjs --diff origin/main`): `pii-scan: clean ✓`.

## 4. Break attempts

<!-- include: runs/live-2026-10-21/terminal/06a-break-attempts-B1-B6.txt -->

B3–B6 re-run after the last code change (`rerun-offline.sh`):

<!-- include: runs/live-2026-10-21/terminal/06b-break-attempts-offline.txt -->

## 5. Verified vs. inferred, line by line

| Claim in the report | Established by | Label |
|---|---|---|
| Runway is 35 days; a job must start by 2026-11-25; the unemployment clock binds | script arithmetic on persona dates (re-derived by `verify-run.py`) | your-input → arithmetic |
| PathAI 78 approvals / 97.5%; Formlabs 70 / 87.5%; Cohere 104 / 98.1%; Klaviyo 154 / 97.5%; EverQuote 56 / 100%; Abacus 22 / 100%; Iterative (as ITERATIVE SCOPES INC) 18 / 100% | 80 Days CSV, exact name; re-parsed independently | record |
| CarGurus has no CSV row | CSV, exact name; re-checked independently | record (of absence, not of non-sponsorship) |
| "Iterative Health" = "ITERATIVE SCOPES INC" | a person's assertion in `aliases.json` | your-input |
| 9 postings live, 3 gone (Formlabs BSA, Iterative, fake Klaviyo ID) at ~19:07 UTC | Greenhouse API 200/404, dated | record |
| The fake Klaviyo ID is not a live job | API 404 **and** patched checker `redirected_off_job` | record (two sources) |
| EverQuote's posting refuses sponsorship | posting text, fixed pattern; confirmed by raw `grep` | record |
| Formlabs/PathAI/Cohere/Klaviyo/Abacus/CarGurus postings contain no refusal phrase | posting text, fixed patterns | record of absence only, **not** a promise to sponsor |
| Years asked (0, 2, 3, 5, 7) and printed pay ranges | posting text, fixed patterns | record (what the text says, not what the employer enforces) |
| Four postings open 142–295 days | Greenhouse `first_published` | record (a repost can reset the date) |
| Hiring takes 30 / 45 / 60 days by company size | the persona's estimate | your-input |
| Company size bands (Abacus ≤ 200 staff, Klaviyo > 2,000, …) | the persona's estimate, unchecked | your-input |
| 6 roles gated by timeline (slack −10 or −25 days) | arithmetic on the two inputs above | your-input → arithmetic |
| Fit 0.75 / 0.7 / 0.5 / 0.45 / 0.4 / 0.3 / 0.15 | Claude's judgment from posting requirements; reviewed and accepted by me at G4 | model-judgment |
| Abacus = Consider (0.230) | shared scorer on the labeled inputs; recomputed independently | script output |
| "Network, don't apply" for the six timeline-gated sponsors | the mode's next-action table (a recipe rule) | recipe rule, not data |
| National median wages, pivot scores | BLS/O*NET compact table | record (national, context only) |
| H-1B counts may be doubled | every filled row is even (pattern observed in v0.1) | inference, unconfirmed |

## Attestation

- Recipe: salonimathure20-opt-countdown v0.2.0
- By: Saloni Mathure (salonimathure20) · 2026-10-21
- How this was made: I built and ran the mode with Claude Code. The rows marked **(me)** are commands I ran myself in my own terminal after the build, and decisions I made myself. The other rows come from the recorded runs above, which I read against the files. The recipe's `attestation:` field stays `null` because the status is DRAFT, not VERIFIED.

### Tested

| Ran | Saw | Expected |
|---|---|---|
| **(me)** `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/` | `# tests 20` · `# pass 20` · `# fail 0` | all pass |
| **(me)** `bash assignments/submissions/salonimathure20/rerun-offline.sh` | `12 roles → scored 10 (Apply 0 · Consider 1 · Skip 9) · posting excludes sponsorship 1 · blocked for a human 1`; `ALL CHECKS AGREE`; both steps `[exit 0]` | same decisions as the committed run; verifier agrees |
| **(me)** G4: opened the Abacus Insights posting | it asks 7+ years against the persona's 1, and its SOC (15-1243) is outside the targets | decide apply / network / drop → **Drop** |
| **(me)** reviewed the nine fit judgments against the postings' requirements | they match the stated years and stack | accept or change → **accepted all** |
| `npm run verify` | `✓ all conform` · `✓ manifest check passed (3 warnings)`, exit 0 | exit 0 |
| `npm run doctor` | `✓ no private/PII paths are tracked` · `33/33 carry lifecycle frontmatter`, exit 0 | exit 0, no todos_open mismatch |
| `node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/` | 20 pass, 0 fail | all pass |
| `posting-evidence.mjs --dry-run` | 12 `GET` lines, nothing written | lists requests, no file |
| `posting-evidence.mjs` (live) | 9 × 200, 3 × 404, EverQuote flagged | one dated record per posting |
| `npm run ats:liveness` (patched) on 12 URLs | 5 active, 2 expired, 5 uncertain; fake ID `redirected_off_job` | fake ID not "active" |
| Same URLs, unpatched checker | fake ID **active** | reproduces the v0.1 defect |
| `opt-countdown.mjs --mode live` | runway 35; scored 10 → Apply 0 · Consider 1 · Skip 9; G2b 1; blocked 1; exit 0 | complete run, every role decided or blocked |
| `verify-run.py` | 36 checks, `ALL CHECKS AGREE` | independent numbers match |
| Rerun on same evidence | logs identical apart from timestamps and paths | deterministic |
| **Break B1** · raw `curl \| grep` for EverQuote's phrase | `not eligible for immigration sponsorship, now or in the future` | phrase really in the posting |
| **Break B2** · decoy "sponsored professional development" (Formlabs) | in the raw posting; mode recorded `matched: false` | not gated |
| **Break B3** · evidence 3 days old (as_of moved to 10-24) | 11 blocked `liveness-stale`, 0 scored | nothing scored on stale evidence |
| **Break B4** · `--mode live` with no evidence file | exit 2, refuses | refuses |
| **Break B5** · 81/90 days used | exit 3, `HALT at gate G1`, only the log written | halt, no `roles.json` |
| **Break B6** · fit 0 at a Proven sponsor, gates open, shared scorer | **Apply 0.341** | Skip or Consider. **NOT caught**: see open TODO 3 |
| **Break** · fake job ID with fit set to 0.8 | API 404 → liveness 0 → Skip | gate zeroes it regardless of fit |
| Mutation · en-dash bug restored | 1 test fails | test catches it |
| Mutation · G2b disabled | 2 tests fail | tests catch it |

### Did not test

- Any posting not on Greenhouse (Lever, Ashby, Workday). There is no posting-text check for them at all.
- Whether the patched liveness checker produces new false "uncertain" verdicts on ATSs whose job pages drop the ID from the URL. I ran it on 12 URLs from 8 Greenhouse boards only.
- `npm run ats:scan -- --verify` with the patch. Reading `scripts/ats/scan.mjs` shows that an `uncertain / redirected_off_job` result falls into the same "keep, retry next scan" branch a false `active` used to. So `scan --verify` is no worse, but it still does not drop a redirected ghost. Routing the new code like `no_apply_control` would be a second shared-file change, so I left it out.
- The exclusion patterns against a large sample of real postings. I checked 12 real postings plus 13 hand-written sentences. Phrasings I didn't think of will be missed.
- That the 80 Days counts are doubled or not. There is no second source in the repo.
- Real hiring lags and real company sizes. Both are inputs, and nothing checks them.
- `ats:scan`, `score:gates`, the SEC refresh and `bls:local-wage`. The mode doesn't use them.
- That my fit acceptances would survive a second reader. I reviewed the judgments alone, against the posting text only, with no recruiter or team contact.
- On Linux CI. Tests ran on macOS only; the CI job will also fail for the upstream reasons in §2.1.

### Broke during testing, fixed

- **Years extractor read "0–3 years" as 3.** The en dash wasn't in the pattern. Fixed in `lib.mjs` `extractPostingFacts`; regression test added; the mutation check confirms the test catches it.
- **Exclusion regex missed "We cannot provide sponsorship."** The pattern needed a separate "not". Rewritten so negation is explicit (`cannot`, `can't`, `won't`, `do not`, `unable to`), with a second pattern for "will not sponsor …". Re-fetched the evidence (02b) and diffed (02c): no fact changed for these 12 postings.
- **404 postings showed "Years asked: none stated"**, which wrongly implied the text was read. `experienceGap` now returns `no-posting-text` and the report says "not checked". Test added.
- **The live-mode run record listed the 2026-10-03 Greenhouse file as an input** even though it was never used. Live mode now ignores the undated file and says so.
- **A recording command for B2 had a stray `head -0`.** Re-recorded the whole break file with a fixed command rather than editing the output.

## 6. Reflection

**What went well.**

- Re-running the v0.1 postings 18 days later was the most useful thing I did. It produced the freshness rule from evidence instead of from a guess.
- Reading the posting text found the EverQuote contradiction, which no sponsor database would show.
- Patching the shared checker means every other mode using `ats:liveness` stops trusting a redirected dead link.
- The independent Python verifier and the mutation check give me reason to believe the numbers, not just the tests.

**What the mode got wrong or missed.**

- **v0.1 judged fit from titles.** Klaviyo's full-stack role was 0.7 "non-senior title". The posting asks 5+ years, so it is now 0.3. That was my error, and it was invisible until I read the posting.
- **The scorer lets sponsorship stand in for fit.** v0.2 still sends the 7+-years Abacus role to Consider, purely because Abacus sponsors and is small enough to hire fast. Break B6 shows the shared scorer gives Apply to a role with fit 0. I flag the gap, but I did not gate it, because the threshold is a judgment about the person (open TODO 3).
- **The headline decision rests on my own guesses.** At 35 days of runway the outcome is driven almost entirely by the hiring-lag guesses. If PathAI actually hires in 30 days (5 days of slack, timeline 0.583), it jumps from Skip to Consider at 0.330, just short of Apply because of the soft timeline. The mode is very sensitive to the least-verified input.
- **Coverage is Greenhouse-only.** A student targeting Workday-heavy employers gets much weaker evidence.

**My own review notes (Saloni Mathure, 2026-10-21).**

- **What surprised me most: stale postings.** On October 3rd the mode told me to apply to Formlabs' Business Systems Analyst role. Eighteen days later the posting was gone. Iterative Health's was gone too. A list of good postings goes out of date faster than I expected. From now on I re-check a posting on the day I apply, which is exactly what the 2-day freshness rule enforces.
- **The G4 decision.** I opened the Abacus Insights posting. It asks for 7+ years of data engineering, and its occupation code is not one of my three targets, so I dropped it. That is the one row the mode left at Consider. It shows why the sign-off gate exists: the score was carried by Abacus's sponsorship record, not by fit.
- **The fit judgments.** I checked all nine against the years and stack each posting asks for, and accepted them.

**Next steps.**

1. Define the experience floor (TODO 3) with a person and re-run.
2. Run `posting-evidence.mjs` daily for two weeks on the same boards, to start a real posting-open → closed duration record (TODO 2).
3. Propose G2b to the maintainer as a third scorer gate (TODO 4).
4. Add Lever and Ashby posting-text readers (TODO 5).
