# Worked run: da-sponsor-triage v0.2.0 (2026-10-20)

## Executive summary

I ran the mode end to end on **real data**:
- 38 funded companies that have sponsored Data Analysts (shipped CSV);
- the live job boards of the 14 that have one (the repo's `ats:scan`);
- 17 real analyst-titled openings, each page checked by the repo's `ats:liveness`.

The first pass recommended **Apply** to three postings. All three were wrong for this persona: one is in Bengaluru, and two require 3+ or 5+ years. I added a location gate and a seniority check, re-ran, and cleared the held postings by hand with logged decisions. **The final answer is 0 applications today.**

The run also showed that two of nine guessed job boards belong to other companies, and that the liveness checker mislabels JavaScript-rendered career pages as "expired". The sensitivity check found that none of my hand-chosen numbers changes any decision. For a Proven sponsor, fit cannot change the outcome at all.

## What is new in v0.2 (vs. v0.1, the Recipe Design submission)

| | v0.1 (`yudanzhou-is-funded-sponsor-triage.md`, 2026-10-02) | v0.2 (this mode) |
|---|---|---|
| Postings | 9 invented demo postings | **17 real openings** from public boards, captured 2026-10-20 |
| Liveness | hand-typed demo values (`your-input`) | **`npm run ats:liveness` output** (`record`) + conflict rule |
| Company list | — | `find_da_boards.py` → `npm run ats:scan -- --dry-run` |
| Gates | data, liveness, timeline | + **US location**, **seniority**, **logged human decisions** |
| Fit / hiring lag | placeholders (review deduction) | values with written reasons (DEFINE closed) |
| Sensitivity | promised in the pitch | `sensitivity.py`, 30 variants |
| Lifecycle | claimed RUNNABLE-SAMPLE with 4 open TODOs (review deduction) | v0.1 corrected to **DRAFT**; v0.2 `todos_open: 0` → SPECIFIED, see Lifecycle below |
| Tests | 11 | **21** |

## Inputs

- **Data** (`record`): `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, plus `data/sec/form-d/processed/sample/*.sample.json`.
- **Persona** (`your-input`, fictional): `search/examples/is-ms-2027-da-focus/persona.example.json`.
  - Fit: DA 0.8, BA 0.7, IT 0.6, PA 0.5, each with a one-sentence reason.
  - Hiring lag: 40 days, with its basis.
  - OPT start assumed 2027-06-01.
- **Postings** (`record`): `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/fixtures/postings.real-2026-10-20.json`. These are 17 real postings from the board APIs on 2026-10-20, with company, title, URL, location and `listed_in_board_api`.
- **Gate decisions** (human, logged): `assignments/submissions/yudanzhou/gate-decisions-2026-10-20.json`.
- **Rules** (`your-input`): `config.da.json`. The role-family keywords and tier mapping are unchanged from v0.1. I did not add a keyword to make any posting pass.

## Commands and real output

Full terminal output is saved verbatim in `runs/00…06-*.txt`. The key lines are below.

**Step 0: which funded DA sponsors have a board** (`runs/00-step0-and-scan.txt`):
```
$ python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/find_da_boards.py --out-yml data/ats/portals.yml --out-json assignments/submissions/yudanzhou/runs/00-da-boards.json
✓ 38 funded DA sponsors (record) · 14 answered a Greenhouse/Lever board probe → data/ats/portals.yml
  PINTEREST INC                greenhouse pinterest       157 jobs  [ownership unconfirmed]
  MOLOCO INC                   greenhouse moloco           42 jobs  [ownership unconfirmed]
  ZOOMINFO TECHNOLOGIES INC    greenhouse zoominfo        107 jobs  [ownership unconfirmed]
  …(11 more)…
$ npm run ats:scan -- --dry-run
Companies scanned:     14
Total jobs found:      380
Filtered by title:     378 removed
New offers added:      2
  + CREDIBLE LABS INC | BI Analyst III | Remote, United States
  + PINTEREST INC | Software Engineer II, Data Analytics & Engineering | San Francisco, CA, US; Remote, US
```
`ats:scan`'s own title filter left only two jobs, one of them a software-engineer role. So the postings fixture keeps **every** analyst/analytics/BI-titled opening (17) and lets the mode's gates decide.

**Board ownership** (`runs/00b-board-ownership.txt`, Greenhouse board-name API):
```
TALENT INC                   greenhouse talent       board name: Slice Talent Community
WATERSHED TECHNOLOGY INC     greenhouse watershed    board name: Watershed Informatics
CREDIBLE LABS INC            greenhouse credible     board name: Credible
ZOOMINFO TECHNOLOGIES INC    greenhouse zoominfo     board name: ZoomInfo Technologies LLC
```

**Liveness** (`runs/01-ats-liveness-2026-10-20.txt`):
```
$ npm run ats:liveness -- --file <17 URLs from fixtures/postings.real-2026-10-20.json>
❌ expired    https://www.pinterestcareers.com/jobs/?gh_jid=8015360
           insufficient content — likely nav/footer only
…(3 more Pinterest, same reason)…
✅ active     https://job-boards.greenhouse.io/credible/jobs/8267115
✅ active     https://www.zoominfo.com/careers?gh_jid=8632787002
…
Results: 13 active  4 expired  0 uncertain
```

**Pass 1: v0.2 before the new gates** (`runs/02-pass1-output.txt`):
```
✓ triage: 17 postings → 3 scored · 14 held out (timeline gate 1.0)
✓ scored 3 roles → Apply 3 · Consider 0 · Skip 0 (skip 0%)
| ZOOMINFO TECHNOLOGIES INC — Senior Business Intelligence Analyst – Product Analytics | 0.555 | **Apply** | … liveness 1[record] …
| ZOOMINFO TECHNOLOGIES INC — Senior Data Analyst | 0.555 | **Apply** | … liveness 1[record] …
| CREDIBLE LABS INC — BI Analyst III | 0.555 | **Apply** | … liveness 1[record] …
```
"Senior Data Analyst" is located in *Bengaluru, Karnataka, India*. The Senior BI role's location is just *Remote*.

**Pass 2: with location gate + seniority check** (`runs/03-pass2-output.txt`):
```
✓ triage: 17 postings → 0 scored · 17 held out (timeline gate 1.0)
 r13 Senior Business Intelligence Analyst – Product Analytics | ZOOMINFO | location-unclear
 r14 Senior Data Analyst                                       | ZOOMINFO | non-us-location
 r15 BI Analyst III                                            | CREDIBLE | seniority-check
```

**Human gates.** The assistant pulled each held posting's requirement line from the Greenhouse posting API. I read those lines on 2026-10-20 and logged:
- **r15** (Credible): "3+ years of work experience as a data analyst" → **reject**.
- **r13** (ZoomInfo): "Must-Have: 5+ years of experience" and no country given → **reject**.

**Final** (`runs/04-final-output.txt`):
```
✓ triage: 17 postings → 0 scored · 17 held out (timeline gate 1.0)
✓ scored 0 roles → Apply 0 · Consider 0 · Skip 0 (skip NaN%)
```

**Sensitivity** (`runs/05-sensitivity-output.txt`):
```
✓ sensitivity: 30 variants over 8 assumptions · baseline scored 0 · fragile: none → …/sensitivity-real/sensitivity.md
✓ sensitivity: 30 variants over 8 assumptions · baseline scored 5 · fragile: none → …/sensitivity-demo/sensitivity.md
```
The real run has nothing scored, so it cannot flip. I therefore also ran the v0.1 demo postings (**constructed**, `your-input`), labelled as such in the file's own first line, under the v0.1 rules. Baseline: p1 Apply, p2 Apply, p3 Apply, p4 Skip, p8 Apply. Moving each of fit (4 families × 4 settings), hiring lag (30–200 days) and tier `p` (±0.1/0.2) changed **0 of 5** decisions.

**That "0" is a property of the ranges I chose, not evidence of robustness.** The break-even table in `runs/sensitivity-demo/sensitivity.md` uses the scorer's own weights and thresholds:
```
| p2 | Apply (0.555) | sponsorship | 0.9 | below 0.171 | yes | 0.7 |
| p2 | Apply (0.555) | fit         | 0.8 | below -0.050 | no | 0.6 |
```
With fit at 0.8, a Proven posting stays above the 0.30 Apply line until sponsorship `p` falls below 0.171, and I only tested down to 0.7. Fit alone can never flip it, because it would need a negative value. The values that would matter lie below the tiers I assigned.

## Verified vs. inferred, line by line

| Value | Label | Source |
|---|---|---|
| 38 funded companies with Data Analyst in top sponsored titles | `record` (counted) on `your-input` keyword rules | CSV × `config.da.json` |
| 14 of 38 answered a board probe; 24 did not | `record` (HTTP responses, 2026-10-20) | `find_da_boards.py` |
| Board *belongs* to the company | **unverified** for 5 Lever boards; **false** for TALENT INC and WATERSHED TECHNOLOGY INC | Greenhouse board-name API |
| 380 jobs, 17 analyst-titled, their titles and locations | `record` | board APIs / `ats:scan` |
| 13 active, 4 "expired" | `record` from the checker, but the 4 conflict with the board API | `ats:liveness` |
| Credible 44 approvals, 2 denials, Series A 2016-12-20; ZoomInfo 98 / 6, "Pre-Seed" 2024-04-01 | `record` | CSV rows (hand-checked, `runs/06-break-attempts.txt`) |
| "ZoomInfo is not really a pre-seed startup" | **model-judgment** (a 98-approval company labelled Pre-Seed looks like a Form D artifact) | not verified |
| 3+ / 5+ years required | `record` (posting text, quoted) | Greenhouse posting API; lines pulled by the assistant, read by me |
| Reject r13, r15 | human decision, logged | `gate-decisions-2026-10-20.json` |
| Fit 0.8/0.7/0.6/0.5, hiring lag 40, tier `p` values | `your-input` | persona, config |
| "No decision flips" | `record` of a computation over `your-input` values | `sensitivity.py` |
| No model judgment is used to *score* | — | no LLM call in any script |

## Verification

1. **Re-ran step 0 and the scan.** The first ad-hoc probe found 14 boards; `find_da_boards.py` re-run found the same 14. `ats:scan` found 379 jobs at first and 380 on the re-run (one job was posted in between), with the same 2 title-filter hits both times.
2. **Cross-checked the CSV by hand.** `grep` of the CSV rows for CREDIBLE LABS INC and ZOOMINFO TECHNOLOGIES INC matches the approvals, stage and date the triage log reports (`runs/06-break-attempts.txt`).
3. **Read the requirement lines** of the two seniority-held postings (quoted from the posting API) before deciding, and copied them into the decision log.
4. **Tests:** `python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v` gives `Ran 21 tests … OK`.
5. **Deliberately broke it** (see Attestation).

## Attestation
- Recipe: da-sponsor-triage v0.2.0
- By: Yudan Zhou (yudanzhou) · 2026-10-20

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `find_da_boards.py` → `npm run ats:scan -- --dry-run` | 38 sponsors, 14 boards, 380 jobs, 2 title hits | real postings, no writes |
| `npm run ats:liveness -- --file <17 URLs>` | 13 active, 4 expired (all Pinterest, "insufficient content") | one result per URL |
| `triage.py` pass 1 (no new gates) | Apply ×3, including a Bengaluru job | — this exposed the gap |
| `triage.py` pass 2 / final | 0 scored; r14 non-US, r13 location-unclear, r15 seniority-check; both rejected by logged decision | no Apply for a non-US or senior role |
| `sensitivity.py` real + demo | 30 variants each; 0 decisions changed | flip counts reported, nothing invented when 0 scored |
| **Break 1:** `--liveness-log runs/does-not-exist.txt` | `✗ STOP: G2 liveness log not found`, exit 2 | hard stop |
| **Break 2:** gate decision that *clears* the non-US gate for r14 | `✗ STOP: gate decision not allowed`, exit 2 | a human cannot wave a posting into OPT eligibility |
| **Break 3:** real postings with **no** liveness log (`--no-score`) | 0 scored; gates hold the 3 analyst roles before liveness is consulted | nothing scored without evidence |
| 21 offline tests | `OK` | — |

### Did not test
- Ashby boards (none answered the probe), and companies with no public board (24 of 38).
- Whether any company hires OPT graduates or is in E-Verify (no data).
- Ownership of the 5 Lever boards; the liveness checker on any site other than these 17 URLs.
- A posting that *passes* every gate on real data. None existed on 2026-10-20, so the end-to-end real path to Apply is covered only by tests and the demo run.
- macOS/Linux; full Form D quarters; any run on a date other than 2026-10-20.

### Broke during testing, fixed
- **Bengaluru posting scored Apply** (pass 1). Added `location_gate()` and `test_non_us_posting_is_not_scored` (`triage.py`).
- **Senior / level-III roles scored Apply** for a new graduate (pass 1). Added `seniority_flag()` and a human gate.
- **Location rule misread "Remote, United States" as non-US.** The `\b` word boundaries were lost when the regex was written. Rewrote `US_WORDS` / `STATE_CODE`, and `test_location_gate_cases` pins it.
- **Tests failed when run from the script folder** (persona path is repo-relative). Documented: run from the repo root.
- **`sensitivity.py` printed the scorer's lines for every variant.** Its stdout is now captured.
- **Pre-submission review (a written review I obtained and checked against the files, 2026-10-20):**
  - The demo sensitivity file did not say *in itself* that it ran on constructed data. Added `--data-note`; the first line of each sensitivity file now states its data.
  - "0 changed" came from ranges that could not reach any flip point. Added the break-even table.
  - Fixed a broken sentence ("0 of them changed…: none").
  - The report footnote pointed at an empty `role-scores.md` (NaN); it now says nothing was scored.
  - The dataset counts in the summary informed no decision; they are now marked "context only".
  - `liveness-conflict` was described but never hit; this is now stated.
  - The review's claim that 8 files were missing came from a partial upload, not the repo. Every file it named is in the branch and the ZIP.
- **Found while reading the audits:** the triage report's "did not verify" section still said the postings and liveness were demo `your-input`, which is v0.1 text and false for this run. It is now chosen by whether `--liveness-log` was used (`write_report`).
- **Found while reading the audits:** `sensitivity.md` said "those decisions rest on a number I chose" even when 0 assumptions were fragile. It now states the zero-flip case correctly. The final and sensitivity outputs were re-run after both fixes.

## Reflection

**What went well.** The gates did their job on real data, and they found real problems I had not predicted: a non-US posting, senior roles, a wrong board, a misleading "expired". Keeping the keyword rules unchanged meant the result "0 applications" is not something I tuned for. Every scored term traces to a `record` or a stated `your-input`.

**What the mode got wrong or missed:**
- My pitch said the risk was "numbers I choose outweigh records". The sensitivity check says the opposite for votes. With the scorer's weights, a Proven sponsor (p 0.9 × 0.35 = 0.315) clears the 0.3 threshold even at fit 0, so my fit ratings can never change a Proven-tier decision. What actually decided every outcome was the **gates and the records behind them**. The v0.1 Tredence case was also a gate (liveness).
- The keyword families miss real analyst work ("Marketing Insights Analyst", "Business Applications Analyst").
- Guessed board tokens silently attach other companies' jobs.
- 24 of 38 sponsors were never scanned at all.
- The CSV's funding labels are unreliable for "startup": ZoomInfo is "Pre-Seed", Deloitte "Series C" (v0.1). That is a judgment, not verified.
- The upstream scorer prints `skip NaN%` with zero roles.

**Next steps (concrete):**
1. Build the **labelled test set** promised in the pitch. Hand-label the 17 real titles plus ~40 sponsored titles as DA / not DA, and measure the keyword classifier's precision and recall instead of asserting it.
2. Use Greenhouse's board name as an **automatic ownership check** (`record`). Hold any board whose name does not match the CSV company for a human.
3. Add an **experience-years extractor** that quotes the "N+ years" line into the log, so the seniority gate shows the human the evidence directly.

## Lifecycle

`todos_open: 0`: every proposed addition in the mode is closed with the evidence the TODO-closure table asks for (DEV: script + conformance + tests; DEFINE: value + reason; APPROVE: logged decision). That earns **SPECIFIED**. SPECIFIED → RUNNABLE-SAMPLE also requires "full sample run completes; conformance checks pass; audits generated **and read**; RUN_LOG entry". The run, conformance and audits exist, and the RUN_LOG entry is `logs/runs/2026fa-yudanzhou-2.md`. I read `runs/final/triage-report.md` and `runs/sensitivity-*/sensitivity.md` on 2026-10-20, with the assistant walking me through them in Chinese, before raising the status. **Claimed: RUNNABLE-SAMPLE.**

**Not claimed: RUNNABLE-LIVE.** That needs a live run with a human clearing *every* gate and the decisions logged. Here, only the held postings were human-cleared, the board-ownership check (G1b) is recorded but not a logged gate decision, the persona's dates were not confirmed as a real person's, and the SEC data is the shipped sample.

## AI assistance

Claude Code wrote the v0.2 code (`find_da_boards.py`, `sensitivity.py`, the new gates, `test_mode_v02.py`) and drafted this write-up. I chose the target role, the fit values and the hiring lag (from the assistant's suggestions, which I accepted), and I made both gate decisions after reading the postings.
