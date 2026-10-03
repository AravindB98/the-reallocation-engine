# CHANGE-BRIEF — swe-opt-clock (SOC 15-1252)

## Executive summary

**What this is.** The plan for a new recipe and a small working program, written *before* any of it was built. It says who the recipe is for, which existing data and scripts it reuses, where it stops for a human, and what I predict will go wrong.

**Why read it.** It's the prediction record. Later sections (the test report and the worked run) are checked against it. Predictions here are never edited. Corrections go in the "Revisions" section at the bottom.

**What it decides.** The recipe is for an international master's graduate in computer science on post-completion F-1 OPT who is currently unemployed and looking for new-grad software engineering jobs. For each job they're looking at, it answers two questions they can't easily see from outside. First, has this company actually sponsored software engineers before, and not just senior staff or scientists? Second, can its hiring process finish before the student's 90-day unemployment allowance runs out? The answer is Apply, Consider, or Skip, or "a human must look at this first".

---

## 1. Career situation

| | |
|---|---|
| Who | International MS Computer Science graduate, **F-1 post-completion OPT, year 1**, currently **unemployed**, STEM-eligible but extension **not filed** (filing needs an offer from an E-Verify employer). |
| Target | New-grad / entry-level **Software Engineer (backend / full-stack)**: BLS SOC **15-1252 Software Developers**. |
| Where | Boston-area employers (MA), plus remote. |
| Binding constraint | The **90-day aggregate unemployment ceiling** on OPT, not the OPT end date. With 41 of 90 days used, the hard deadline is about 7 weeks away. The EAD end date is 8 months away. |
| Persona used for every run | New fictional persona `search/examples/neel-kapoor/profile.yml` (no existing persona is an *unemployed* OPT-year-1 SWE: Aarav Patel is STEM-OPT with a 150-day ceiling and 0 days used, and Priya Nair targets ML/AI roles). |

Engine layers drawn on: **80 Days to Stay** (H-1B sponsorship history + Form D funding), **Job-Ops** (posting liveness classifier), **Cognitive Pivot** (BLS/O*NET row for 15-1252), and the **Ch.11 scorer** for the combination.

## 2. What I reuse, and what I propose

### Reused as-is (exact paths)

| What | Path | How |
|---|---|---|
| Sponsorship + funding records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | exact normalized-name lookup; read `Total Approvals`, `Total Denials`, `Approval_Rate`, `top_job_titles_sponsored`, `median_salary_offered`, `latest_funding_*` |
| Form D samples | `data/sec/form-d/processed/sample/companies-sec-2025q{2,3,4}-d.sample.json`, `…2026q1-d.sample.json` | cross-check whether a company filed in the shipped quarters |
| Role-quality row | `data/bls/compact/soc_occupation_compact.csv` | national median wage + job zone for the role's SOC, report-only |
| Liveness classifier | `scripts/ats/liveness-core.mjs` → `classifyLiveness()` | imported, not copied, to classify saved posting snapshots |
| Scorer | `scripts/score/role-scorer.mjs` (`npm run score`) | run as a child process on my `roles.json` with `--out-dir`; never re-implemented |
| Persona | `search/examples/neel-kapoor/profile.yml` (new, fictional) | visa dates, unemployment days, buffer, `needs_sponsorship` |

### Proposed (not in the repo today)

| Proposal | Why it belongs | Type |
|---|---|---|
| A prototype that turns persona + candidate roles into a labeled `roles.json`, runs the scorer, checks the scorer's output against the persona, and writes a JSON log + a Markdown report | The scorer only *combines*; nothing upstream builds sponsorship/liveness/timeline terms for a specific person | built in this PR |
| Timeline factor from the **unemployment clock** (projected to the run date), not only the EAD end date | Ch.10 describes the factor but no script computes it; for an unemployed OPT student the unemployment ceiling binds first | built in this PR |
| A "new-grad" sponsorship rule: a company whose sponsored SWE titles are all senior/staff/principal is not *Proven* for a new grad | Ch.7: "the pipeline … cannot know those fifteen were all for senior principal scientists" | built in this PR |
| Live posting capture via `scripts/ats/liveness-browser.mjs` | sample mode reads saved snapshots only | typed DEV TODO in recipe |
| DOL LCA disclosure records with `SOC_CODE` + fiscal year | the CSV has titles, no SOC, no year | typed DATA SOURCE TODO |
| E-Verify participation by employer | STEM-OPT extension requires an E-Verify employer | typed DATA SOURCE TODO |
| Full Form D quarters joined by name | shipped samples are 4 × 50 filings | typed DATA SOURCE TODO |

## 3. Gates and what a human needs to see

| Gate | Machine test | A human clears it by seeing… |
|---|---|---|
| G0 Persona clock | OPT end ≥ run date; unemployment days remaining > 0; unemployment count not dated in the future; `needs_sponsorship` present | the echoed dates (EAD end, days used, projected days used, hard deadline) match their I-20/EAD and DSO record |
| G1 Entity | company resolves to exactly one CSV row by normalized legal name | for unresolved companies: the legal name to retry, or a decision to drop |
| G2 Liveness (gate) | snapshot classified `active` (factor 1) or `expired` (factor 0) and captured ≤ 7 days before the run | for `uncertain` or stale: they opened the posting themselves |
| G3 Timeline (gate) | expected start ≤ hard deadline (else factor 0) | the date math per role; any 0 < factor < 1 decision; anything legal goes to the DSO |
| G4 Scorer conformance | scorer exits 0; roles in = roles out; scorer's `profile_needs_sponsorship` equals the persona's; every role with a closed gate is Skip | nothing; this one halts the run |
| G5 Decision | `gate-decisions.md` has a name + date per Apply/Consider | they decided, not the report |

## 4. Predicted failure cases and how I'll check each

1. **Company not in the CSV** (e.g. a public company that never filed a Form D, like HubSpot). Check: the role is listed as `unresolved`, is absent from `roles.json`, and has no sponsorship value anywhere.
2. **SOC code with no row** (e.g. a stale 2010 SOC `15-1132` copied from an old LCA). Check: report shows `missing: no-soc-row`; no wage printed; the role is still scored, because role quality carries 0 weight.
3. **Posting 404s** (snapshot status 404). Check: classified `expired` by the engine classifier, liveness factor 0, scorer returns Skip.
4. **OPT date already past** (or unemployment days already ≥ 90). Check: run stops before scoring with a non-zero exit and a stop reason; no report of decisions is written.
5. **Unemployment count is stale** (entered weeks ago). Check: days used are projected forward to the run date; a test proves the deadline moves earlier.
6. **Company in CSV but sponsorship fields empty.** Check: tier `Unknown`, never sent to the scorer as 0, routed to the networking list.

## 5. One prediction about what the first pass gets wrong or misses

**Prediction:** the title match for "software engineer" will be both too loose and too strict on the first pass. It will count titles like "Machine Learning DevOps Engineer" or "Perception Software Engineer" as 15-1252 when an LCA might code them differently. And it will miss SWE sponsorship hidden behind titles like "Member of Technical Staff". I also expect the **skip rate to come out under 50%** on my hand-picked sample, because I chose companies I already knew sponsor. The sample is biased toward sponsors, and the report will have to say so.

**Known before writing this brief, so not counted as predictions** (seen while exploring the repo on 2026-10-02):

- The Form D cross-check finds **0** CSV companies in the shipped samples. 127 of the 200 sample filings are pooled investment funds, and the CSV's newest `latest_funding_date` is 2025-09-26.
- `scripts/score/role-scorer.mjs` reads only the free-text `authorization` field. A string containing "authorized" (e.g. "F-1 STEM OPT — work authorized (EAD)") sets `profile_needs_sponsorship: false` and zeroes the sponsorship weight. With that profile, the Ch.11 example's Proven biotech flips from Apply to Skip. The prototype must not pass persona free text to the scorer, and must check the flag the scorer reports.
- `npm run bls:local-wage` cannot run on this clone. `.venv` is missing, and so is the whole `data/bls/local-wage/` directory.
- A made-up Greenhouse posting ID (`job-boards.greenhouse.io/databricks/jobs/1`) is classified **uncertain**, not expired, by `npm run ats:liveness`.

---

## Revisions (appended after building; originals above are unchanged)

**2026-10-03, after run 1 (`731da4b`) and the fixes (`04a0437`, `dc342fa`):**

- **§4 failure cases:** all six behaved as predicted. 1 → HubSpot held, absent from `roles.json`. 2 → Tulip `missing: no-soc-row`, still scored. 3 → Lendbuzz 404, factor 0, Skip. 4 → exit 3 (OPT past; also ceiling reached and an undated count). 5 → the projection test passes, and the mutation test shows it's load-bearing. 6 → CloudZero held as Unknown.
- **§5 prediction, scorecard:**
  - *Skip rate < 50%*: **correct** (38%).
  - *Title rule too loose*: **correct**. "Perception Software Engineer" counts as SWE.
  - *Title rule too strict*: **untested**. No such title was in the sample.
- **What I didn't predict, and was wrong about:**
  - My own prototype's next-action logic ignored a closed gate on held roles (HubSpot).
  - A stopped run's log could carry a local home-directory path into git.
  - CI's `harness-regression` job references four scripts that don't exist upstream, so CI can't go fully green for any student PR.
- **§3 gates:** added an explicit G5 test (a `grep` over `gate-decisions.md`), checked to return 0 on the blank sheet and 1 on a filled row.
- **§2 proposals:** the four typed TODO items stayed proposals. Status therefore DRAFT, not RUNNABLE-SAMPLE (see the recipe's lifecycle claim).
