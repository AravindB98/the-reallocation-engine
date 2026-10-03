---
status: DRAFT          # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE
todos_open: 3
last_gate: "sample-run v0.1.1, 2026-10-02, logs/runs/2026fa-anishagaikar0420-1.md (path runs end to end on sample data; 3 open TODOs keep this below SPECIFIED)"
attestation: null
recipe_version: 0.1.1
---

# anishagaikar0420-msis-bi-analyst-opt-countdown — OPT-window countdown for a May-2027 BI-analyst search

## Executive summary

**What it does.** Takes a list of job postings and, for each one, checks whether the job could start inside the student's OPT window and whether the company has a record of H-1B sponsorship. It then hands those facts to the engine's existing scorer and returns Apply, Consider, or Skip — plus a concrete next step — for every posting.

**Who it is for.** An international master's student in Information Systems / Business Analytics on an F-1 visa, graduating in **May 2027**, looking for **business-intelligence analyst** roles (and the analyst titles next to them). In the fall before graduation, most open analyst postings want someone who can start now. She cannot legally start full-time work until her OPT begins, and once it begins she has 90 days before unemployment becomes a status problem. So the real question for each posting is: *does the start date land inside that window, and will this company sponsor me later?*

**What it decides.** Nothing on its own. It produces a sourced recommendation and stops. A posting with a closed gate is skipped. A posting with a missing fact is **blocked, not scored** — it is handed back with the exact thing to check by hand. The student decides at every gate.

**Status: DRAFT.** The sample path runs end to end (see the run log). It stays DRAFT because three proposed additions are still open, and the lifecycle does not allow SPECIFIED with open items. Liveness in the sample run was not checked against the live web.

**Handoff condition (done when).** A run is complete when: the JSON log and Markdown report both exist in the run folder; every role appears exactly once as `scored` or `blocked`; every blocked role has a reason code and a next action; every scored role appears in `roles.json` and in the scorer's `role-scores.json` with a source label on each of its four terms; and no role in `roles.json` carries a value the log marks as missing. "Looks right" is not the condition.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, lifecycle.
2. `DOMAIN.md` → Known gaps (items 3 and 9 — role quality weight 0; local wage feeds nothing).
3. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` — what the SEC↔DOL join does and does not prove.
4. `scripts/score/role-scorer.mjs` header — the composite and its gate semantics.
5. This recipe and its card, `recipes/cases/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown.card.md`.

## Purpose and source inventory

| What | Exact path / command | Used as |
|---|---|---|
| Sponsorship + funding | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows) | G1 gate + sponsorship vote; funding is context only |
| Occupation row | `data/bls/compact/soc_occupation_compact.csv` (1,016 rows) | context only (wage, cognitive pivot score) |
| Form D | `data/sec/form-d/processed/sample/*.sample.json` (4 files × 50 companies) | context only; a non-match proves nothing |
| Liveness | `npm run ats:liveness -- <urls>` → saved stdout → `--liveness-log` | G2 gate |
| Scorer | `scripts/score/role-scorer.mjs` (CLI, called as a child process; not copied) | the composite and decision |
| Prototype | `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs` | runs this recipe |
| Tests | `node --test scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.test.mjs` | offline, fixtures only |
| Student inputs | `…/examples/profile.persona.json`, `…/examples/roles.persona.json` | every date, rating, threshold (your-input) |

The prototype uses no npm dependencies and makes no network call.

## Phase gates

Each role stops at the first failed gate. G0 stops the whole run.

| Gate | Testable condition | Pass | Fail | Human clears it by |
|---|---|---|---|---|
| **G0 OPT window** | `program_end ≤ opt_start ≤ program_end + 60 days` **and** `run_date ≤ opt_start + 90 days` | continue | exit code 3, **nothing written** | reading program end on the I-20, requested OPT start on the I-765, and confirming the 90-day figure with the DSO |
| **G1 company on record** | exactly one CSV row whose name equals the posting's company after suffix stripping (`INC`, `LLC`, `CORP`, …); no fuzzy matching | sponsorship tier from counts | `blocked: company-not-found` or `blocked: ambiguous-company-match` — not scored | looking up the employer in DOL LCA disclosure data by hand |
| **G2 liveness** (gate, not vote) | a result exists for the posting URL, it is dated, the date is ≤ 7 days before the run date, and it is not `uncertain` | factor 1.0 (`active`) or 0.0 (`expired`) | `blocked: liveness-unchecked / -undated / -stale / -uncertain` — not scored | running `npm run ats:liveness -- <url>` and passing the saved output |
| **G3 timeline** (gate, not vote) | `earliest_work = max(opt_start, run_date + hiring_lag, posting_start)`; closed if the posting starts before OPT start (and is not flexible) or `earliest_work > deadline`; soft if slack < 30 days | factor 1.0 (open) or 0.5 (soft → the scorer demotes Apply to Consider) | factor 0.0 → the scorer returns Skip | confirming the start date with the recruiter; editing `start_date` in the roles file |

Every gate points at a path that exists today. No gate writes to `data/raw/`, `data/verified/`, or `logs/gate-decisions/` (planned, not present).

## Workflow (verbatim commands, from the repo root)

1. Toolchain baseline: `npm run doctor` then `npm run verify`.
2. Fill `examples/profile.persona.json` with your own dates (or copy it into `private/` and pass `--profile`).
3. Put candidate postings in a roles file (same shape as `examples/roles.persona.json`).
4. Liveness (needs network + Playwright, run on your own machine):
   `npm run ats:liveness -- <url1> <url2> > private/liveness-YYYY-MM-DD.txt`
5. Run:
   `node scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/opt-countdown.mjs --liveness-log private/liveness-YYYY-MM-DD.txt --liveness-date YYYY-MM-DD --as-of YYYY-MM-DD`
   Sample mode (no liveness log): drop the three flags; liveness then comes from the roles file as `your-input`.
6. Read the report top to bottom. Clear or reject each blocked row by hand.
7. Write a run-log entry under `logs/runs/` (template below). Never edit `logs/RUN_LOG.md`.

## What it can verify

- That a company name has exactly one row in the 80-Days CSV, and what that row says: total H-1B approvals and denials, approval rate, up to five sampled sponsored titles, latest funding stage/amount/date. (record)
- Whether any of those sampled titles contains one of the student's analyst keywords. (your-input rule on record text)
- That a posting URL was reported `active` / `expired` / `uncertain` by `ats:liveness` on a stated date — **only when `--liveness-log` is passed**. (record)
- The arithmetic of the OPT window and each timeline factor, given the dates supplied. (your-input, deterministic)
- That the repo's own scorer produced the decision, with its per-term arithmetic. (script output)
- That an occupation code has (or has no) row in the BLS/O*NET compact file. (record)

## What it cannot verify

- **Whether this company sponsors analysts.** `Total Approvals` is company-wide across all roles. The title list is a sample of at most five. In v0.1.0 a company could reach "Proven" on engineer or data-scientist titles that merely contain "analytics"; v0.1.1 requires the word "analyst" or "BI" in the title, but it is still a keyword match on five sampled titles, not a per-role record.
- **Whether the counts are right.** In the sample run every matched company's approval and denial counts were even numbers (8 of 8), and a check of all 1,557 rows with approvals showed the same. That pattern suggests a possible upstream double count; the cause is not confirmed and this recipe does not correct it. A 2× error could move a company across the 20-approval threshold.
- **That a company with no approvals on record has never sponsored.** The SEC→DOL join does not prove entity resolution (see the audit). `None` means "none on record here".
- **The immigration rules themselves.** The 60-day OPT start limit and the 90-day unemployment allowance are carried as the student's stated inputs, confirmed with a DSO, not read from a regulation. STEM OPT extension rules are out of scope.
- **Start dates and hiring lags.** Both come from the posting or the student. A recruiter can move either.
- **Liveness in sample mode.** Without `--liveness-log`, liveness is whatever the roles file says.
- **Role quality or pay for this employer.** The BLS row is national and occupation-level. It is shown as context and changes no decision.
- **Anything a model would judge.** No model is called. There are no model-judgment values; fit is the student's own rating.

## The Facts that bite — how this recipe handles each

| Fact | Handling |
|---|---|
| 1. `role_quality` weight is 0.0 | Not passed to the scorer. BLS wage and cognitive pivot score appear in the report as labeled context only. No weight is proposed: this recipe's question is timing, and a weight would need its own justification. |
| 2. `bls:local-wage` feeds nothing | Not used. National OEWS only, labeled as national. |
| 3. Only SEC samples ship | The prototype checks the four sample files and says so; a non-match is printed as "proves nothing". Funding comes from the 80-Days CSV columns instead, as context. |
| 4. Planned directories don't exist | Gates read and write only existing paths; outputs go to `course/2026fa/submissions/anishagaikar0420/runs/`. |
| 5. `snickerdoodle` CLI is roadmap | Not referenced as runnable. |
| 7. `bls:local-wage` fails on a fresh clone | Not called. |
| 8. `validate-h1b-join-sample.py` needs full data | Not called; the shipped CSV is used directly. |

## Proposed additions

1. **Done in v0.1.1 (2026-10-02)** — the analyst-title rule now needs one of the analyst keywords **and** the word "analyst" or "BI" in the title. Handoff met: test `v0.1.1: an engineer or data-scientist title alone does not make a company Proven for analysts` passes, and a mutation that drops the new condition makes it fail. Effect on the sample: Figma and Sigma drop from Proven to Likely, so both move from Apply to Consider (see the worked run). Implemented by Claude at Anisha's request after her hand check of Figma's CSV row showed no analyst title.
2. [TODO: DATA SOURCE] Per-SOC sponsorship counts from DOL LCA disclosure files (SOC code is a column there), so "sponsors analysts" becomes a record instead of a keyword match on five titles. Belongs in `data/` behind an ingest script, per P2.
3. [TODO: DATA SOURCE] Posting start dates captured by the ATS scanner (Greenhouse/Lever/Ashby fields) instead of typed by the student, so `start_date` can be labeled `record`.
4. [TODO: DEV] Explain the even-count pattern in the 80-Days CSV (join duplication vs. real data) and, if it is duplication, halve or re-derive the counts upstream — not in this recipe.

## Output contract

Two outputs, two readers (P5). Both are written to `course/2026fa/submissions/anishagaikar0420/runs/<run-date>-v<recipe_version>/` (or `--out-dir`, which refuses `data/`, `recipes/`, `logs/`).

**`opt-countdown-log.json` — for an agent**

```
_recipe, recipe_version, run_date, mode
labels_used            { record, your-input, model-judgment: "none" }
inputs                 { profile, roles, csv{path,sha256,rows}, soc{path,sha256,rows}, formd_samples{…}, liveness_log|null }
opt_window             { program_end, opt_start, unemployment_days_allowed, unemployment_deadline — each {value,label} , days_until_opt_start }
rules                  { value: <all thresholds>, label: "your-input" }
scorer                 { path, input, output[], stdout }
summary                { evaluated, Apply, Consider, Skip, blocked, skip_rate_of_scored, even_approval_counts }
roles[]                { role_id, company, title, soc, posting_url, status: scored|blocked,
                         gates{G1_company, G2_liveness, G3_timeline}, sponsorship{tier,p,raw{…each {value,label}},rule},
                         fit{value,label}, context{soc, funding, formd_sample, csv_company_name},
                         decision, composite, scorer_reason, scorer_arithmetic, blocked_reason, next{bucket,action} }
```

**`opt-countdown-report.md` — for the person.** Opens with an executive summary; then the window dates; a decision table (role, decision, composite, gates, sponsorship, next action); per-role evidence tables where every row names its label and source; and a "what this run did NOT verify" list.

Also written: `roles.json` (scorer input, shape of `data/examples/ch11-roles.json`) and the scorer's own `role-scores.json` / `role-scores.md`.

## Stop conditions

Stop, and do not invent a value, when:

- G0 fails — exit 3, write nothing. The student talks to her DSO.
- A company is missing or ambiguous — block the role; do not assume "no sponsorship".
- Liveness is missing, undated, stale, or uncertain — block the role; do not assume "active".
- Fit is missing — block the role; do not default it.
- An input date is not a real calendar date — exit 2.
- Asked to lower the 20-approval threshold, raise `soft_factor` to ≥ 0.6, or mark sample liveness as `record` so a preferred role reaches Apply — refuse; that is weakening a rule for a result.
- Asked to add a `role_quality` weight inside the scorer — out of scope; it is a maintained file and an open authorial decision (DOMAIN.md item 3).

## Next action per result (the 3-3-2 connection)

| Result | Bucket | Next action |
|---|---|---|
| Apply | 2 h apply | Tailor the application. The research is already done. |
| Consider | 3 h network | Find one alum or analyst at the company first; ask about sponsorship and start dates. |
| Skip — timeline closed, sponsor is Proven/Likely | 3 h network | Don't apply to this posting; network now for that company's next new-grad cycle, which may land in the window. |
| Skip — anything else | skip | Skip. The time goes back to networking and the credibility project. |
| Blocked | human research | The exact check named in the report (DOL lookup, liveness run, rating). |

## Verification checks

- `node scripts/conformance.mjs scripts/contrib/2026fa/anishagaikar0420-msis-bi-analyst-opt-countdown/ recipes/cases/2026fa/` → all conform.
- `node --test …/opt-countdown.test.mjs` → 12/12, offline.
- G0: `--as-of 2027-09-15` → exit 3, run folder does not exist.
- G1: a fictional company → `company-not-found`; two rows normalizing to one name → `ambiguous-company-match`.
- G2: an `❌ expired` line in the liveness log → scorer Skip (gated); a `record` liveness with no date → `liveness-undated`.
- G3: a posting starting after the deadline → composite 0.
- Hand check: pick one scored role and compare approvals, denials, and funding in the report against its CSV row.

## Run-log template (`logs/runs/2026fa-anishagaikar0420-<n>.md`)

```markdown
## YYYY-MM-DD — opt-countdown (sample | live)

- **Recipe:** anishagaikar0420-msis-bi-analyst-opt-countdown v<recipe_version>
- **Inputs:** profile <path>; roles <path> (<n> roles); liveness log <path|none>; CSV sha256 <first 12>
- **Command:** <exact command>
- **Outputs:** course/2026fa/submissions/anishagaikar0420/runs/<date>-v<version>/ (log, report, roles.json, role-scores.*)
- **Result:** evaluated <n> → Apply <a> · Consider <c> · Skip <s> · blocked <b>; skip rate <x>% of scored
- **Gates cleared by:** <name> — <which blocked rows were resolved and how>
- **Open issues:** <what did not work or is still missing>
```
