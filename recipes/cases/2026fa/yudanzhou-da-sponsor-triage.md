---
status: SPECIFIED
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.2.0
---

# da-sponsor-triage: real Data Analyst openings at funded H-1B sponsors, gated for a new-grad F-1 student

## Executive summary

**What it does.** For an international Information Systems master's student who has settled on **Data Analyst** roles and prefers funded companies, this mode answers one question: *of the analyst jobs that are really open today at funded companies with a record of sponsoring Data Analysts, which are worth my application time?*

It finds those companies in the shipped data, pulls their **real current openings** through the repo's own job-board scanner, checks each posting with the repo's **real liveness checker**, and stops at four hard gates before anything is scored:
- Is the job in the US? (OPT work must be.)
- Is it entry-level enough for a new graduate?
- Do the two liveness records agree?
- Does the OPT timeline fit?

Whatever passes goes to the existing scorer for Apply / Consider / Skip.

**What it decided on 2026-10-20.** There were 17 real analyst-titled openings at the 14 matching companies with public boards. **None was worth applying to.** One was in India; the others were senior roles (3+ or 5+ years required, as their own postings state), or outside the analyst families. That is the finding: today, this persona's time goes to the networking list, not to applications.

**Who it's for, and what it doesn't do.** It is for an F-1 student in a STEM-designated IS program (CIP 14.0903), about eight months before graduation, with post-completion OPT ahead. It never reads "no record" as "won't sponsor", and it never clears a human gate by itself.

This is v0.2 of `recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md` (v0.1). The v0.1 → v0.2 table is in the worked run.

## Purpose — when to use it

Use it at the start of a weekly "2 apply hours" block (the 3-3-2 day), before tailoring anything:
1. Refresh the funded-DA-sponsor list from the 80-Days CSV.
2. Scan their live boards.
3. Liveness-check the hits.
4. Clear the human gates.
5. Score what is left.

**Do not use it** to decide whether a company sponsors in general (a blank is not a no), for non-US roles, or for senior roles.

## Source inventory (all exist; all were run on 2026-10-20)

| What | Exact path / command | Label of what it yields |
|---|---|---|
| Funding + H-1B history | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | `record` |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` | `record` |
| Job-board scanner (repo) | `npm run ats:scan -- --dry-run` (reads local `data/ats/portals.yml`; committed copy `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/fixtures/portals.da.yml`) | `record` (open postings) |
| Liveness checker (repo) | `npm run ats:liveness -- --file <urls.txt>` (`scripts/ats/check-liveness.mjs`, Playwright Chromium) | `record` (active / expired / uncertain) |
| Existing scorer (repo) | `scripts/score/role-scorer.mjs`, called by the triage script, not re-implemented | composite + audit |
| Triage (contrib) | `python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --config …/config.da.json --persona search/examples/is-ms-2027-da-focus/persona.example.json --postings … --liveness-log … --liveness-date … --gate-decisions … --today …` | see Output contract |
| Sensitivity check (contrib) | `python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/sensitivity.py` (same flags + `--out-dir`) | flip counts |
| Tests (contrib) | `python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v` (20 tests) | — |
| Persona (fictional) | `search/examples/is-ms-2027-da-focus/persona.example.json` | `your-input` |
| Rules | `scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/config.da.json` | `your-input` |

Step 0, which builds the company list, is the snippet in the worked run: funded + approvals ≥ 1 + "Data Analyst" family in `top_job_titles_sponsored` gives 38 companies. Probing public board APIs found 14 with a Greenhouse or Lever board.

## Proposed additions — all closed in this version

Each item was a typed TODO in the v0.1 review or the pitch, and each is closed with the evidence the constitution's TODO-closure table requires.

| # | Type | Addition | Why it belongs | Closure evidence |
|---|---|---|---|---|
| 1 | DEV | `--liveness-log`: read `ats:liveness` output directly, so G2 is `record`, not hand-typed | v0.1 liveness was a demo `your-input` | `load_liveness_log()` in `triage.py`; `test_liveness_log_parsing`, `test_url_missing_from_log_is_unchecked`; conformance passes |
| 2 | DEV | Location gate (OPT is US-only) | the 2026-10-20 first pass scored a Bengaluru posting **Apply** | `location_gate()`; `test_location_gate_cases`, `test_non_us_posting_is_not_scored` |
| 3 | DEV | Seniority check for a new-grad persona | first pass: every Apply was a Senior / level-III role | `seniority_flag()`; `test_seniority_check_holds_for_human` |
| 4 | DEV | Liveness-conflict rule | the checker called 4 Pinterest postings "expired" that the board API listed the same day | `test_liveness_conflict` |
| 5 | DEV + APPROVE | Logged human gate decisions (`--gate-decisions`) | gates are cleared by a named human, and logged | `load_gate_decisions()`; `test_gate_decision_clear_and_reject`, `test_gate_decision_rules`; decisions file `assignments/submissions/yudanzhou/gate-decisions-2026-10-20.json` |
| 6 | DEV | `sensitivity.py`: how many decisions flip when each hand-chosen number moves | pitch risk: "numbers I choose can outweigh records" | `sensitivity.py`; `test_sensitivity_counts_flips` |
| 7 | DEFINE | Self-rated fit: **DA 0.8 · BA 0.7 · IT consultant 0.6 · PA 0.5** | v0.1 placeholders (review deduction) | DA: an end-to-end Python/pandas data project plus a stated preference for Python, held below 0.9 because SQL is still being learned. BA: real analyst work, but BA leans on spreadsheets over Python. IT: consulting exposure, but furthest from writing Python. PA: no product-metrics or A/B experience, and needs SQL. Also in the persona file. |
| 8 | DEFINE | Hiring lag **40 days** | v0.1 placeholder (60) | A working assumption for application-to-offer, not from a dataset; `sensitivity.py` shows 30–200 days changes no decision while OPT starts ~8 months out |
| 9 | DEFINE | Seniority markers `Senior, Sr., Staff, Principal, Director, Manager, Lead, Head, III, IV` | needed by #3 | Same idea as the repo's `ats:scan` negative title filter; held for a human, not auto-skipped, because some level-III roles accept ~2 years |
| 10 | DEFINE | Location rule: `us` needs an explicit US marker or a US state code; a bare "Remote" is `unclear` | needed by #2 | A location without a country is not evidence of a US job |

## Phase gates (hard stops, testable, against paths that exist)

| Gate | Kind | Test | Pass | Fail | Cleared by |
|---|---|---|---|---|---|
| **G1 Data** | stop | CSV exists with the six required columns | continue | exit 2, nothing written | restoring the shipped CSV |
| **G1b Board ownership** | human | each `portals.da.yml` board token was guessed from the company name | — | — | a human confirming the board is that company's (recorded in the worked run) |
| **GL Location** | gate | `location_gate(posting.location)` | `us` | `non-us` → not scored; `unclear` → held | a logged gate decision (only `unclear` can be cleared) |
| **GS Seniority** | gate | `seniority_flag(title, markers)` | none | held | a logged gate decision after reading the posting's experience line |
| **G2 Liveness** | gate (multiplier) | URL's result in the `ats:liveness` log | `active` → factor 1 | `expired` → factor 0; not in log → held `liveness-unchecked`; `expired` while `listed_in_board_api` the same day → held `liveness-conflict` | re-running the checker, or a logged gate decision after opening the page |
| **G3 Visa timeline** | gate (multiplier) | `max(today + 40, opt_start) ≤ opt_start + (90 − used)` | factor 1 | factor 0 | confirming persona dates |
| **G4 Decision** | human | `triage-report.md` and `role-scores.md` exist | — | — | the student reading each row term by term |

## What it can verify (record)

- The company's H-1B approvals and denials, its top sponsored titles, its funding stage and date (CSV); whether the company is in the Form D samples.
- Which postings the company's public board listed on the scan date, with their title, location and URL (`ats:scan` / board API).
- What the repo's liveness checker saw at each URL on the check date.
- The exact text of a posting's experience requirement, read by a human at a gate and quoted in the decision log.
- How many recommendations change when each `your-input` number moves (`sensitivity.py`).

## What it cannot verify

- **Whether a company hires OPT graduates or is in E-Verify** (STEM OPT needs E-Verify). Neither is in any shipped file. A blank approval record stays "no record".
- **That a board belongs to the company.** Tokens were guessed from names; a human confirms.
- **Analyst roles outside the keyword families.** "Marketing Insights Analyst" and "Business Applications Analyst" were off-target on 2026-10-20 by rule. Whether they are DA work is not measured (no labelled test set yet).
- **Liveness on JavaScript-rendered career sites.** The checker returned "expired — insufficient content" for 4 Pinterest URLs the board API listed. Only the conflict rule stops this from zeroing a live job.
- **Postings not on Greenhouse/Lever/Ashby.** 24 of the 38 companies had no board found, so their openings were never seen.
- **A sponsorship probability.** `p` is a mapping from counts. The sensitivity check found that for a Proven sponsor (p 0.9) the sponsorship term alone (0.315) clears the 0.3 Apply threshold, so **fit can never change a Proven-tier decision**.
- **Funding after 2025-09-26**, or Form D beyond the 50-company samples.

## Output contract

**Agent log:** `<out-dir>/triage-log.json`. The v0.1 fields, plus per posting: `location`, `location_verdict` (`us|non-us|unclear`), `seniority_marker`, `liveness{result, source:"record", checked_on, via}`, `gate_decisions[{posting_id, gate, decision, reason, by, date}]`. Statuses: `scored | non-us-location | location-unclear | seniority-check | liveness-conflict | liveness-unchecked | no-h1b-record | no-company-row | ambiguous-company-match | off-target-title`.

**Sensitivity log:** `<out-dir>/sensitivity.json` holds `{baseline, variants[{assumption, setting, decisions_changed, flips, status_changes}], fragile_assumptions, robust_assumptions}`.

**Human report:** `<out-dir>/triage-report.md` (executive summary, family table, per-posting status, next action, logged gate decisions) plus `role-scores.md` from the scorer and `sensitivity.md`. One artifact per reader (P5).

## Stop conditions — refuse to score rather than guess

- G1 fails, or a company match is ambiguous.
- The location has no country, or the title carries a seniority marker, unless a human has logged a decision.
- The posting's URL is absent from the liveness log, or the two liveness records disagree.
- Asked to add a keyword so a liked posting passes, to clear a non-US gate, or to set liveness by hand. Refuse.
- The scorer receives zero roles. Report "nothing scored" (the scorer itself prints `skip NaN%` in this case; that is an upstream display bug, recorded, not fixed here).

## Next action per result (the 3-3-2 day)

| Result | Next action | Block |
|---|---|---|
| Apply / Consider / Skip | as v0.1 | 2 apply hours |
| `seniority-check` rejected, `non-us-location` | skip the posting, but keep the **company** on the networking list (it sponsors DAs) | 3 networking hours |
| `location-unclear`, `liveness-conflict` | open the posting; log a decision | 5 minutes |
| no board found (24 companies) | networking list: ask a contact where they post analyst roles | 3 networking hours |

## Run-log template (`logs/runs/`, never `logs/RUN_LOG.md`)

```markdown
## YYYY-MM-DD — da-sponsor-triage <sample|live> run

- **Mode:** recipes/cases/2026fa/yudanzhou-da-sponsor-triage.md v0.2.0
- **Inputs:** CSV · Form D glob · portals.da.yml (N companies) · postings fixture (N, captured YYYY-MM-DD) · liveness log (YYYY-MM-DD) · gate decisions · persona is-ms-2027-da-focus
- **Commands:** npm run ats:scan -- --dry-run · npm run ats:liveness -- --file … · triage.py … · sensitivity.py …
- **Outputs:** <out-dir>/{triage-log.json, triage-report.md, role-scores.*, sensitivity.*}
- **Result:** N postings → scored / held by gate; Apply · Consider · Skip; fragile assumptions
- **Gates:** GL N · GS N · G2 active/expired/conflict · G3 factor · decisions logged by <name>
- **Open issues:** …
```
