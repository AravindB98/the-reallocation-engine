---
status: DRAFT
todos_open: 5
last_gate: "sample-run executed 2026-10-03 (logs/runs/2026fa-kommurisi-1.md) — not a lifecycle promotion: 5 open TODOs block DRAFT → SPECIFIED"
attestation: null
recipe_version: 0.1.0
---

# data-role-sponsor-match — Has this sponsor ever sponsored a *data* role?

## Executive summary

**Who it is for:** an F-1 master's student in a STEM-designated MS Information Systems / analytics program, in or near the final semester, targeting early-career **data engineering, analytics engineering, and BI** roles (O*NET 15-1243.01, 15-2051.01, 15-2051.00) who will need H-1B sponsorship after OPT.

**What it does:** takes a short list of candidate postings and, for each one, checks the 80 Days CSV for the company's *recorded sponsored job titles* — not just its approval count — and asks whether any of them is a data role. It then applies two gates (visa timeline, posting liveness), hands the survivors to the existing Ch.11 scorer, and returns Apply / Consider / Skip / **Unresolved** with every value labeled `record` or `your-input`.

**What it decides:** where the next week's hours go — tailor an application (Apply), find a contact on the data team first (Consider), drop it (Skip), or fix a named evidence gap before spending any time (Unresolved).

**Why the existing engine does not already do this:** the sponsorship vote in `data/examples/ch11-roles.json` is company-level. Databricks has 1,640 recorded approvals and a 99.5% approval rate — and none of its five recorded top titles is a data role. A company-level number tells a data student nothing about whether *their* kind of role gets sponsored.

**Two customers:** this file is for the agent; `recipes/cases/2026fa/kommurisi-data-role-sponsor-match.card.md` is for the person.

**Handoff condition (done when):** `match.mjs` exits 0, both `data-role-sponsor-match.log.json` and `data-role-sponsor-match.report.md` exist in the out-dir, every role appears in the log exactly once with a decision or a named unresolved reason, `role-scores.json` was written by `scripts/score/role-scorer.mjs` with `profile_needs_sponsorship: true`, and a human has read the Gates section of the report.

## Lifecycle note (why DRAFT)

A full sample run completed and conformance passes — the evidence SNICKERDOODLE asks for at SPECIFIED → RUNNABLE-SAMPLE. But SNICKERDOODLE's DRAFT → SPECIFIED gate is *zero open TODOs*, and this recipe carries five (the proposed additions below). So the honest status is **DRAFT**. It is not promoted past a gate it has not passed.

## Required reads

1. `SNICKERDOODLE.md`, `DOMAIN.md` (Known gaps 3 and 9), `DATA_CONTRACT.md` §Zero-Conditions.
2. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` — what the 80 Days sponsorship columns are.
3. `book/chapters/08-is-the-job-real-ats-detection-and-liveness.md` and `book/chapters/10-the-visa-timeline-manager.md` — the two gates.
4. `book/chapters/11-the-bayesian-role-scorer.md` and `scripts/score/role-scorer.mjs` — the combiner this recipe feeds.
5. `scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/README.md`.

## Source inventory

| Source | Path / command | Layer | Used for | Label |
|---|---|---|---|---|
| 80 Days CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; 1,557 with sponsorship columns) | 80 Days to Stay | company match, `Total Approvals`, `Approval_Rate`, `top_job_titles_sponsored`, `median_salary_offered`, `latest_funding_*` | record |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` (first 50 companies per quarter) | 80 Days to Stay | funding context only | record |
| BLS/O*NET compact | `data/bls/compact/soc_occupation_compact.csv` | Cognitive Pivot | national median wage, `cognitive_pivot_score` — **context only** | record |
| ATS scan | `npm run ats:scan -- --dry-run` (reads gitignored `data/ats/portals.yml`) | Job-Ops | finding candidate postings | record |
| Liveness (page) | `npm run ats:liveness -- --file <urls.txt>` → saved as `liveness.txt` | Job-Ops | gate input #1 | record |
| Liveness (API) | `node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs --input <candidates.json> --out <greenhouse-api.json>` — contacts **only** `boards-api.greenhouse.io` | Job-Ops | gate input #2 | record |
| Prototype | `node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs [--input …] [--out-dir …]` (offline) | — | joins, gates, report | — |
| Scorer | `scripts/score/role-scorer.mjs` (called by `match.mjs`, never copied) | — | composite + Apply/Consider/Skip | — |
| Candidate list + profile | `candidates.json` (persona; dates, lag, patterns, tier→p, self-rated fit) | — | all assumptions | your-input |

**Not used:** `scripts/sec/validate-h1b-join-sample.py` (needs full data a fresh clone does not have — Fact 8); `npm run bls:local-wage` (fails on a fresh clone without `.venv` — Fact 7; and it feeds nothing — Fact 2). No model is called anywhere in this recipe, so nothing is labeled `model-judgment`.

## Inputs

`candidates.json` — one file, all `your-input`:

| Field | Meaning |
|---|---|
| `profile.as_of`, `opt_start_date`, `opt_end_date`, `unemployment_days_used`, `unemployment_ceiling_days` | the visa clock (check against the EAD card) |
| `profile.hiring_lag_days` | one assumed application→start lag for every company (see TODO 2) |
| `profile.needs_sponsorship` | must be `true` for this recipe |
| `profile.sponsorship_p_by_tier` | my calibration: `Proven` 0.9, `Likely` 0.6 (Ch.11 example values, not measured) |
| `profile.data_title_include` / `data_title_exclude` | regexes deciding what counts as a "data role" title |
| `profile.title_soc_map` | posting title → O*NET code, for role-quality context |
| `roles[]` | `role_id`, `company`, `title`, `url`, optional `greenhouse_board`, optional `csv_company_name` (human tie-break), `fit.p` (self-rating) |
| `evidence.liveness_log`, `evidence.greenhouse_api` | saved outputs of the two liveness steps |

## Phase gates

Hard stops. Every test runs against a path that exists in a fresh clone plus the out-dir.

| Gate | Test (from repo root) | Pass | Fail → |
|---|---|---|---|
| G0 inputs | `node -e "JSON.parse(require('fs').readFileSync('<candidates.json>','utf8'))"` and `test -f data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | continue | stop; fix the file |
| G1 **visa timeline** (gate, not vote) | `match.mjs` exit code ≠ 3; `timeline_gate.status == "open"` in the log | factor ∈ (0,1] passed to scorer | exit 3, log says `opt-window-closed` / `unemployment-days-exhausted` / `timeline-input-missing`; **nothing scored** |
| G2 liveness evidence present | `test -f <liveness.txt> && test -f <greenhouse-api.json>` | per-role liveness | roles without an observation → `liveness-unchecked` (Unresolved), **never** defaulted to 1.0 |
| G3 **liveness** per role (gate, not vote) | log `evidence.liveness` exists for every scored role | Greenhouse 404 → factor 0 even if the page "looked" active; page `active` + API 200 (or no Greenhouse board) → 1 | `liveness-uncertain` / `liveness-unconfirmed` / `liveness-unchecked` → Unresolved |
| G4 company + sponsorship record | log role `status == "scored"` | exact normalized match to one CSV row with sponsorship columns filled | `no-company-match` / `ambiguous-company-match` / `no-sponsorship-record` → Unresolved (blank ≠ "never sponsors") |
| G5 scorer consistency | `node -e "process.exit(require('./<out>/role-scores.json').profile_needs_sponsorship===true?0:1)"` | report written | exit 4 — refuse to report scores computed with the sponsorship weight zeroed |
| G6 **human adequacy** | a named person reads the report's Gates section and every Unresolved row | act on next actions | do not apply anywhere off this run |

## What it can verify

- Whether the company appears in the 80 Days CSV under exactly one normalized name, with the file and line number.
- Whether that row has sponsorship columns at all, and what the company-wide approvals and approval rate are.
- Which **recorded top titles** the company sponsored, and which of them match the stated data-role patterns. `"Scientist, Analytical Chemistry"` and `"Clinical Data Manager"` are excluded on purpose.
- Whether, on the capture date, the Greenhouse job API had the job id (200) or not (404), and what the repo's page-level liveness check said. Where they disagree, both are shown.
- How many days of OPT runway exist under the stated dates, and what timeline factor the stated formula gives.
- That the decision came from the maintained scorer, with its per-term arithmetic.

## What it cannot verify

- **That this company will sponsor this opening.** The CSV is historical, company-level, and lists only the *top* sponsored titles. A Proven tier means "a data title appears in that short list." A Likely tier means "the list is silent," not "no."
- **Seniority.** "Business Intelligence Engineer" sponsored at a senior level does not show that a new-grad hire gets sponsored. Seniority lives only in the self-rated fit.
- **How the employer will classify the job.** The title→SOC map is mine. The employer's LCA may file an "Analytics Engineer" under 15-1252 or 15-2051, not 15-1243.
- **Hiring lag at this company.** One assumed number is used for all companies.
- **Funding recency for most companies.** The Form D samples cover 50 of roughly 13–16 thousand companies per quarter (Fact 3). The CSV's `latest_funding_date` is shown but is not a vote, because the scorer has no funding term.
- **Role quality as a decision input.** The scorer's `role_quality` weight is 0.0 (Fact 1). This recipe reports the national OEWS median and the cognitive-pivot score beside the decision and does not feed them in. It proposes no weight, because nothing in the repo calibrates one. `15-2051.00 Data Scientists` has a **blank** `cognitive_pivot_score` in the source, and the report says "missing" instead of filling it.
- **Local pay.** The wage shown is national. `bls:local-wage` would localize it but does not run on a fresh clone (Fact 7) and feeds no decision (Fact 2).
- **Fit.** It is a self-rating. No model or recruiter judged it.

## Workflow

1. Copy `data/ats/portals.example.yml` to `data/ats/portals.yml` (gitignored) and add the target companies' boards and data-title filters. Then run `npm run ats:scan -- --dry-run`.
2. Write `candidates.json`, using a persona for anything committed. Copy the shape of `scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/fixtures/worked-run/candidates.json`.
3. Capture the liveness evidence. These are the **only network steps**, and they contact only the named hosts:
   ```bash
   npm run ats:liveness -- --file <urls.txt> > <dir>/liveness.txt
   node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs --input <dir>/candidates.json --out <dir>/greenhouse-api.json
   ```
4. Run the prototype (offline):
   ```bash
   node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs --input <dir>/candidates.json --out-dir course/2026fa/submissions/<handle>/runs/<date>
   ```
5. Read `data-role-sponsor-match.report.md`. Clear G6 by hand.
6. Write the run log (template below).

## Output contract

Two files with two audiences. One file can't serve both.

**Agent: `<out>/data-role-sponsor-match.log.json`**

```
{ recipe, recipe_version, mode: "sample", as_of{value,source}, labels, inputs[{path, sha256}],
  profile{<field>{value,source}}, timeline_gate{status, runway_days, hiring_lag_days, factor | reason, detail},
  roles[{ role_id, company, title, url, status: "scored"|"unresolved",
          unresolved[{reason, detail, candidates?}],
          evidence{ company_match, sponsorship{total_approvals, approval_rate, sponsored_titles,
                    matched_data_titles, tier, p}, liveness_observations, liveness, fit,
                    role_quality_context{…, in_scorer:false}, h1b_median_salary_all_roles,
                    funding_80days, form_d_sample },
          decision{composite, recommendation, reason, arithmetic, source}, next_action }],
  scorer{script, output, stdout, weights_used}, summary{evaluated, scored, apply, consider, skip, unresolved} }
```

Every leaf is `{ value, source }` with `source ∈ {record, your-input, model-judgment}`, plus `provenance` (file:line) where it is a record. Derived values take the label of their **lowest-trust** input. For example, `tier` is `your-input` because my regexes decide it, even though the titles are records.

**Person: `<out>/data-role-sponsor-match.report.md`**: a decision table with next actions, evidence per role with inline labels, the Gates a human must judge, and "What this run cannot verify". The scorer's own `role-scores.md` sits beside it.

Unresolved reason codes: `no-company-match`, `ambiguous-company-match`, `no-sponsorship-record`, `liveness-unchecked`, `liveness-uncertain`, `liveness-unconfirmed`, `fit-missing`, `no-p-for-tier`. Timeline block codes: `opt-window-closed`, `unemployment-days-exhausted`, `timeline-input-missing`.

## Stop conditions and next action per result

| Result | Next action | 3-3-2 slot |
|---|---|---|
| **Apply** | Tailor one application this week, citing the role. | the 2 research-and-apply hours |
| **Consider** | Find a person on the company's data team and ask whether this level of role is sponsored *before* tailoring anything. | the 3 networking hours |
| **Skip** | Nothing this week. A healthy run skips at least half of what reached the scorer. | — |
| **Unresolved** | Fix the named gap first: pick the CSV row (`csv_company_name`), find the posting URL, or check the employer's LCA history by hand. Don't let it default to Skip or Apply. | 10-minute human check |
| Exit 3 (timeline blocked) | Stop the whole run. Recheck dates against the EAD/I-20. | — |
| Exit 4 (scorer disagreement) | Stop. The scorer read the profile as not needing sponsorship (see TODO 3). | — |

Stop immediately and invent nothing when the out-dir would land outside `course/2026fa/submissions/<handle>/` or the prototype folder (exit 2), or when any input file is missing.

## Proposed additions

1. **[TODO: DATA SOURCE]** Per-title, per-SOC sponsorship counts from the DOL LCA disclosure files, replacing the five-title `top_job_titles_sponsored` list. This is the single biggest limit: it is why "Likely" exists at all. It belongs in the 80 Days layer, because every data, biostat, or design student needs sponsorship *for their SOC*, not company-wide.
2. **[TODO: DATA SOURCE]** Company-level time-to-hire to replace the single `hiring_lag_days`. Without it, the timeline gate can't tell a 3-week startup loop from a 4-month enterprise loop.
3. **[TODO: DEV]** Maintainer patch to `scripts/score/role-scorer.mjs` `applyProfile`. The regex `/…|authorized/` reads `"F-1 STEM OPT — work authorized (EAD)"` (the Aarav Patel persona text) as *not needing sponsorship* and zeroes the sponsorship weight. Observed 2026-10-03: `profile_needs_sponsorship: false`, composite 0.21 on a Proven sponsor. The scorer also ignores an explicit `needs_sponsorship` field. This recipe works around it (a neutral `authorization` string plus the G5 guard) and does not patch the maintained file in this PR.
4. **[TODO: DEV]** Maintainer patch to `scripts/ats/liveness-core.mjs`. A nonexistent Greenhouse job id (`/klaviyo/jobs/1000000001`) redirects to the company's careers search page, which has Apply buttons, so `ats:liveness` reports **active**. The Greenhouse job API returns 404 for the same id. This recipe requires both checks to agree (G3). The engine's liveness check alone does not.
5. **[TODO: DEV]** Decide whether funding (Form D / `latest_funding_date`) becomes a scorer vote. The assignment table calls it "a vote", but `role-scorer.mjs` has no funding term. This recipe shows it as context only until a maintainer decides.

## Verification checks

- `node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.test.mjs` runs 10 tests offline against fixtures and the real scorer.
- `node scripts/conformance.mjs scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/ recipes/cases/2026fa/` passes.
- Hand check: pick one scored role, open the CSV at the logged line number, and confirm the approvals and titles. Recompute `p·0.35 + fit·0.30` by hand.
- Break attempts: liveness defaulted open, a naive `data|analytic` pattern, and blank sponsorship treated as a record. Each must turn at least one test red (see `course/2026fa/submissions/kommurisi/TEST-REPORT.md`).

## Logging rules

- One file per run at `logs/runs/<term>-<handle>-<n>.md`. **Never** edit `logs/RUN_LOG.md`.
- Commit only persona inputs. A real target list stays in gitignored `data/ats/` or `private/`.

### Run-log template

```markdown
# <term>-<handle>-<n> — data-role-sponsor-match v<version>

- **Date:** YYYY-MM-DD
- **Recipe:** recipes/cases/<term>/<handle>-data-role-sponsor-match.md v<version> (status <STATUS>)
- **Mode:** sample | live
- **Inputs:** candidates.json (persona? y/n), liveness.txt captured <ts>, greenhouse-api.json captured <ts>, 80 Days CSV sha256 <…>
- **Commands:** <verbatim>
- **Gates:** G1 <open/blocked + runway/lag/factor> · G2 <files present> · G3 <n active / n closed / n unresolved> · G4 <n unresolved by reason> · G5 <needs_sponsorship true?> · G6 <who read it, when>
- **Result:** Apply n · Consider n · Skip n · Unresolved n (scored n)
- **Outputs:** <out-dir>/data-role-sponsor-match.{log.json,report.md}, role-scores.{json,md}
- **Verified vs inferred:** <one line>
- **Open issues:** <what did not work>
```
