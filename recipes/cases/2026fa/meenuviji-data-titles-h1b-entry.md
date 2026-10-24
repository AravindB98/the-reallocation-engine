---
status: DRAFT
todos_open: 6
last_gate: "sample-run human review, 2026-10-03, logs/runs/2026fa-meenuviji-1.md"
attestation: null
recipe_version: 0.1.0
---

# data-titles-h1b-entry — sponsored-title evidence for entry-level data roles

## Executive summary

**What it does.** Many employers have sponsored work visas before, but a new graduate needs to know whether an employer has sponsored *entry-level data jobs*. This recipe reads each employer's list of past sponsored job titles and keeps only data-family titles (data analyst, data engineer, data scientist, business intelligence, machine learning or AI engineer). It sorts those titles into senior, mid, or entry/unmarked, and turns the result into a sponsorship score using the student's own written rules. It then hands that score, unchanged, to the project's existing recommendation engine, which returns Apply, Consider or Skip.

**Who it is for.** An international MS Data Analytics student on an F-1 visa, not yet on OPT, applying for entry-level data-family roles, who will need an employer willing to file an H-1B later.

**What it decides.**
- For each posting, it decides whether the employer's sponsorship history supports applying, networking first, or skipping, and what to do next.
- It never guesses an employer: an unknown or ambiguous name stops for a person.
- It never sends a posting with a missing date or posting status to the scorer, which would silently assume the best case.
- A company with no sponsorship record is treated as unknown, not as a non-sponsor.

**Handoff condition (done when).** A sample run is complete when all of the following hold:
- The single command exits 0 or 3.
- Both outputs are written.
- Every scored posting in the agent log carries a source label on every value.
- Every company-match stop and every refusal is listed in both outputs.
- The offline test suite passes.

"Looks right" is not the condition.

Status is DRAFT under SNICKERDOODLE.md's lifecycle rules because six proposed additions remain open TODO items; the prototype itself runs end to end on sample data with 28 offline tests (scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/).

---

## Purpose and source inventory

### Required reads (in order)

1. `SNICKERDOODLE.md` — gates, provenance, lifecycle.
2. `DOMAIN.md` — layout and known gaps.
3. `course/2026fa/submissions/meenuviji/CHANGE-BRIEF.md` — the spec, including Revision 1 (corrected timeline rule).
4. `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/README.md` — rules, files, known gaps.
5. This recipe, then `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.card.md`.

### Sources

| Source | Path | Label | Human check |
|---|---|---|---|
| Sponsorship history (80 Days to Stay) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | SHA-256 must equal `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`, the hash recorded for `SEC_DOL_H1b_data_mapped.csv` in `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`. The run checks this and stops on mismatch. |
| National wage context | `data/bls/compact/soc_occupation_compact.csv` | record | Context only; not scored. |
| Legal-suffix list for name matching | `scripts/sec/sec-all-quarters.py` (`COMPANY_SUFFIXES`, read with `ast`, not executed) | record | Same list and order as the repo's Form D normalizer. |
| Rules (allowlist, seniority tokens, approvals cutoff, tier precedence, p values, next actions, timeline factors, sample seed) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json` | your-input | Every entry carries `label`; an unlabeled rule stops the run. |
| Run inputs (target titles, `as_of`, `opt_start`, `window_days`, `hiring_lag_days`) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json` | your-input | Run inputs only: no name, contact, or résumé content. |
| Sample postings (fictional titles, real CSV company names) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json` | your-input | Frozen; `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py` refuses to overwrite without `--force`. |
| Scorer (unmodified) | `scripts/score/role-scorer.mjs` via `npm run score` | record (its output) | Never copied or re-implemented. |

### Commands

Paths written as `out/…` or `postings/…` in this recipe are relative to `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/`.

Run (from repo root, no arguments; exit 0 clean, 3 completed with stops, 1 whole-run failure, 2 bad arguments):

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
```

Offline tests (uses the real CSVs and the real scorer; writes only to temp directories):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

Conformance on the prototype folder:

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/
```

Repo checks before any push:

```bash
npm run verify
```

```bash
npm run doctor
```

Rebuild the frozen sample (only if you mean to break the freeze):

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/build_sample.py --force
```

---

## Proposed additions (not built)

Each one is a declared gap, not a hidden one.

1. **Title- or SOC-level sponsorship records.** `[TODO: DATA SOURCE]` DOL LCA disclosure data (employer, job title, SOC code, wage, dates), ingested by a maintained script. Why: the CSV records sponsorship per company. The sponsored-title list is the only role-level signal, and it is short free text. Records per title would replace the title-list heuristic with records.
2. **A title → SOC map for target and posting titles.** `[TODO: DEFINE]` a `your-input` mapping from each target title to one SOC code, with a sentence of reasoning per row. Why: under the current rule only Data Scientist and Business Intelligence Analyst match a BLS `title`. Data Analyst, Data Engineer, Machine Learning Engineer and AI Engineer show "no SOC row" (`out/report.md`, BLS column).
3. **A role-quality weight.** `[TODO: DEV]` A proposal to the scorer's maintainers for a non-zero `role_quality` weight, with renormalisation. Why: `role_quality` is 0.0 (scorer `CONFIG`, recorded in `out/run.json` → `scorer.config`), so wage context cannot change any recommendation. Blocker noted in CHANGE-BRIEF §5f: 15-2051 gives Data Scientists and Business Intelligence Analysts the same median ($112,590), so the national wage can't separate two of the target titles.
4. **Live liveness for real postings.** `[TODO: DEV]` Feed `npm run ats:liveness -- <url>` output into the posting's `liveness` field, labeled `record` with the check date. Why: in the sample every posting's liveness is `your-input`, `determined_by: "assumed, not checked"`, so the liveness gate never closes in the default run.
5. **Fit from the student's own rating.** `[TODO: DEFINE]` Replace the constant fit of 0.5 (held constant to isolate the sponsorship signal) with a per-posting rating and a written rubric.
6. **Duplicate-entity check across the whole CSV.** `[TODO: DEV]` Today the duplicate-evidence note only compares companies matched in the same run.

---

## Phase gates (hard stops)

Liveness and timeline are **gates, not votes**: the scorer multiplies by them, so a closed gate zeroes the composite whatever the votes say (`scripts/score/role-scorer.mjs`, `Composite = (Σ vote·weight) × liveness × timeline`). The scorer silently treats a *missing* gate as 1.0, so this recipe refuses the role before it reaches the scorer.

| Gate | Testable condition | Pass | Fail (role stops; run continues; exit 3) | Human sees, to clear it |
|---|---|---|---|---|
| G1 Company match | Input name matches one CSV row, either exactly (upper-case) or by normalized name | continue; rule named (`exact-upper-case` / `normalized`) | `no-match` or `more-than-one-row`; never a nearest-name guess | Input name and candidate rows (name, city, state only) in `out/report.md` → "Stopped at the company-match gate"; pick a row or confirm "not in data" |
| G2 Missing gate value | `liveness.factor` numeric with a label, and all of `as_of`, `opt_start`, `window_days`, `hiring_lag_days` present | role written to `out/roles.json` | refused; never written to `out/roles.json`; the missing field is named | `out/report.md` → "Refused: missing gate value" |
| G3 Liveness (gate) | `liveness.factor` > 0.05 (the scorer's `gate_zero`) | multiplier passed to scorer | scorer returns Skip, `gated: liveness`; next action "Skip: liveness closed." | How liveness was determined (`determined_by`) |
| G4 Timeline (gate, Revision 1) | `projected_start = as_of + hiring_lag_days`; `window_end = opt_start + window_days` (inclusive); `projected_start <= window_end` | factor 1.0; if `projected_start < opt_start`, a non-scoring note: "deferred start: employer must accept a start N days after offer" | factor 0.0 → scorer Skip, `gated: timeline`; next action "Skip: timeline closed." | The arithmetic string, shown in `out/report.md` |

Whole-run failures (exit 1, no `out/report.md`, the reason is recorded in `out/run.json`):
- a missing or changed sponsorship CSV (SHA-256 mismatch);
- missing required columns;
- an unlabeled or missing rule in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json`;
- unparseable postings;
- a sponsored-title list that does not parse for a matched company;
- npm or scorer failure;
- scorer output whose role ids differ from the roles sent.

`logs/gate-decisions/` does not exist; gate decisions are logged in `logs/runs/` instead. Closed: human review of the sample run logged in logs/runs/2026fa-meenuviji-1.md (Meena, 2026-10-03).

---

## What it can and cannot verify

### Can verify

#### Records quoted as-is (record)

- Whether an employer name resolves to exactly one row of the 80 Days CSV, and by which rule.
- The employer's recorded approvals, denials, approval rate, median salary and sponsored-title list, quoted from the CSV.
- That the scorer received exactly the roles that passed the gates, and what it returned, term by term.
- Whether two employers **matched within the same run** carry identical sponsorship columns. The recipe does not scan the whole CSV for duplicate evidence.

#### Your-input rules applied consistently (your-input, covered by tests)

- Which sponsored titles contain a data-family phrase from the allowlist, and which seniority bucket each falls in under the stated token rules. The tests in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests/test_pipeline.py` cover:
  - level tokens;
  - whole-word seniority;
  - entry markers;
  - allowlist precision;
  - evidence groups;
  - tier and p;
  - next action.
- A rule applied consistently is not a rule shown to be correct.

### Cannot verify

- **Recency.** The CSV's approval and denial counts carry no year or date range:
  - The CSV header's only date-like columns are `year_incorporated`, `company_age_years` and `latest_funding_date`, and none of them describes the sponsorship counts.
  - `data/80-days-to-stay/data/README.md` lines 50–51 define them only as "Count of approved H-1B petitions" and "Count of denied H-1B petitions".
  - `data/80-days-to-stay/README.md` line 13 names the sources (DOL LCA Disclosure Data, USCIS H-1B Employer Data Hub) without years.
  - The year table in `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` is headed "Funding Dates by Year", so it covers funding dates, not approvals.
  - `data/80-days-to-stay/80-days-day-08/README.md` line 24 lists "`total_h1b_filings` (Last 3 years)" in a planned schema, but no such column exists in the CSV, so it does not date these counts.

  An employer with many approvals may have stopped sponsoring.
- **Accuracy of the CSV against primary sources.** The SHA-256 check confirms the file matches the audited file, not that it matches DOL or USCIS records. No cross-check against primary data was done. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md` line 10 states the raw DOL/LCA and USCIS records are not in the repository.
- **Employer identity.** A name match may not be the posting's actual employer. Subsidiaries, DBAs, and staffing or consulting firms where the agency is the sponsor all break the link. `data/80-days-to-stay/80-days-day-08/README.md` line 21 describes the original SEC-to-LCA join as fuzzy matching ("Use the `RapidFuzz` library").
- **Timeline inputs.**
  - `hiring_lag_days` is my assumption.
  - `window_days` is a regulatory figure that isn't present in repo data.
  - Whether an employer accepts a deferred start is unknown.
  - EAD timing is not modeled.
- **Next actions.** They are my advice (your-input), not validated outcomes.
- **Live liveness.** `npm run ats:liveness` is optional and untested in this recipe.
- **Role-level sponsorship.** The CSV records sponsorship per company, not per role or SOC code (REALITY-REPORT §5a: no SOC column; 1,557 of 30,369 rows have any sponsorship data).
- **Completeness of the title list.** `top_job_titles_sponsored` is short free text: 1 to 14 titles per company (PROBE-REPORT §A2). Titles the employer sponsored but that aren't in the list are invisible, and reordered titles such as "Analyst, Data" are missed by the allowlist.
- **That "unmarked" means entry level.** A title with no level marker, such as "Data Scientist", is bucketed entry-or-unmarked. Many such roles expect experience.
- **Likelihood of filing.** Approval rate measures how often *filed* petitions were approved. It says nothing about whether this employer will file for this student. No record is not evidence of non-sponsorship.
- **Posting liveness.** It is assumed in the sample (`determined_by: "assumed, not checked"`, `out/run.json`).
- **Fit.** It is held constant at 0.5 for every sample posting, labeled `your-input` and not measured.
- **Local or employer-specific pay.** BLS context is the national OEWS median only (`oews_year` 2024).
  - Of the 6 **target titles** in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json` → `target_titles`, only 2 match a BLS `title` row by case-insensitive substring: Business Intelligence Analyst → 15-2051.01, and Data Scientist → 15-2051.00.
  - Both have the same national median, $112,590.
  - Data Analyst, Data Engineer, Machine Learning Engineer and AI Engineer show "no SOC row" (`out/report.md`, BLS context column).
  - The match uses the target titles, not the 11 data-family allowlist phrases in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json`.
- **Which entity owns duplicated evidence.** `PATHAI INC` (Cambridge, MA) and `PATHRAI INC` (Mountain View, CA) carry identical sponsorship columns: 78 approvals, 2 denials, 97.5% rate, $145,600 median and the same title list (`out/report.md`, duplicate-evidence note). The evidence may belong to only one of them, and the recipe cannot tell which.
- **That the employer sponsored the posting's exact title.** A data-family match is at company level. Example: `ENTRUPY INC` lands in the proven group on a single sponsored data title, `Data Engineer`, while the sample posting there is `Machine Learning Engineer I` (`out/report.md`, title-family note).

---

## Output contract

### Agent log — `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json`

Top-level keys (from the current `out/run.json`): `workflow`, `run_id`, `mode`, `inputs`, `rules`, `run_config`, `data` (CSV path, SHA-256, row counts, suffix patterns), `sample` (seed, per_group, group order, group sizes), `roles_json`, `scorer` (command, exit code, captured stdout/stderr, scorer config), `status`, `exit_code`, `counts`, `evidence_group_counts_scored`, `scored`, `stops`, `refusals`, `notes`.

Each `scored[]` entry holds:
- `company_match`, `sponsorship_evidence` and `bls_context`, labeled record;
- `title_classification`, `sponsorship_term`, `evidence_group`, `fit`, `timeline` and `next_action`, labeled your-input;
- `liveness`, labeled with its own label plus `determined_by`;
- `scorer_result`, labeled record, which is the scorer's output with its own trace labels;
- `notes`, which are non-scoring (deferred-start, title-family, sibling-rows, duplicate-evidence).

Every value carries `{value, label}` with label ∈ `record` / `your-input` / `model-judgment`.

Labels apply to every evidence and scoring value. Posting identifiers (posting_id, title, target_title, url, company_input, purpose) are your-input from the fictional sample postings. Stop and refusal reasons and run metadata (status, exit_code, run_id, scorer command and stdout) are produced by the prototype itself and are not evidence, so they carry no record/model-judgment/your-input label.

The scorer's own files are written beside it: `out/roles.json` (the input sent) and `out/score/role-scores.json` + `out/score/role-scores.md`.

### Human report — `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md`

The report has these sections, in order:
1. A plain-language executive summary, which includes the population share of each evidence group and the stratified-sample warning.
2. The run record.
3. The scored-postings table: posting, employer, recommendation, composite, evidence group, next action, tier · p, evidence, timeline, BLS context.
4. A "why each one scored as it did" block per posting.
5. Sample by evidence group.
6. Stopped at the company-match gate.
7. Refused: missing gate value.
8. Caveats.

**Reader:** the student. **Decision it enables:** where to spend tomorrow's application and networking hours.

### Why one file cannot serve both

The log must be complete and machine-checkable. Every value is labeled, the scorer's raw stdout is kept, and the deferred-start note repeats for every role. A person cannot read that. The report must be read in a few minutes, so it states the deferred start once, translates group names into plain language, and leaves out the raw stdout. That makes it unfit for a machine check (SNICKERDOODLE P5).

---

## Stop conditions and next action per result

Stop and do not invent a value when:
- a company does not resolve to exactly one row (G1);
- a gate value is missing (G2);
- the CSV hash does not match;
- a rule is unlabeled;
- asked to infer sponsorship for a company with no record;
- asked to fill a missing liveness value with 1.0;
- asked to map a title to a SOC code by guess.

Next actions are advice from `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json` → `next_action` (your-input). They never change the scorer's recommendation. If the scorer's recommendation is Skip because a gate closed, the gate action applies; otherwise the action is chosen by evidence group. Each maps onto the book's 3-3-2 day (`book/chapters/02-the-reallocation-principle.md`: two hours applying, three hours networking, three hours portfolio):

| Result | Next action (verbatim from the rules file) | 3-3-2 time |
|---|---|---|
| Skip, gate closed | "Skip: {gate} closed." (`{gate}` = `liveness` or `timeline`) | none on this posting; hours go back to the other two blocks |
| proven | "Tailor an application (research-and-apply hours)." | research-and-apply hours |
| entry-under-min-approvals | "Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring." | networking hours first; apply hours only after confirmation |
| only-mid | "They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team." | networking hours |
| only-senior | "They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring." | networking hours |
| no-data-title | "They sponsor, but not data roles. Low priority: network only through a warm contact." | networking hours, warm contacts only |
| no-record | "No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring." | networking hours |

In the current sample run, 2 Apply, 8 Consider and 2 Skip, so the skip rate is 17% of scored (`out/run.json` → `counts`). That is below the 50% DOMAIN.md calls healthy. The sample is stratified at 2 per evidence group, while 94.9% of CSV companies are in the no-record group (`out/report.md`), so the sample's skip rate is not representative.

---

## Facts that bite

### Known gaps from the assignment, and how each applies here

| Gap | Applies? | How |
|---|---|---|
| `role_quality` weight is 0.0 | Yes | BLS wage context is shown but cannot move a recommendation. Proposed addition 3. |
| `bls:local-wage` feeds nothing | Yes, by design | Not used. National OEWS only (CHANGE-BRIEF §6). |
| Only SEC Form D samples ship | Yes | `data/sec/form-d/` holds only `data/sec/form-d/processed/` (four 50-record samples in `data/sec/form-d/processed/sample/` plus `data/sec/form-d/processed/recent-sec-quarters-audit.md`). Form D is excluded: 128 of 200 sample records are pooled investment funds, and only 14 names match the 80 Days CSV after normalization, 1 of them (Databricks) with sponsorship data (PROBE-REPORT §C). |
| `data/raw/`, `data/verified/`, `logs/gate-decisions/` do not exist | Yes | Confirmed absent. This recipe writes only to its own `out/` folder and points at no planned directory. Gate clearances go to a `logs/runs/` entry (`logs/runs/2026fa-meenuviji-1.md`). |
| The `snickerdoodle` CLI is roadmap | Yes | No CLI commands are given here. The agent runs the Python command and stops at each gate (DOMAIN.md, Runtime). |
| All recipes DRAFT | Partly | `npm run doctor` currently reports DRAFT 28 · RUNNABLE-SAMPLE 4 · VERIFIED 1 (`course/2026fa/submissions/meenuviji/recon/raw-output.txt`, Phase 0). |
| `bls:local-wage` fails without `.venv` | Not used | `scripts/bls/local-wage-adjustment.py` stops with "missing .venv" when `.venv` is absent (it is absent in this clone). |
| `scripts/sec/validate-h1b-join-sample.py` needs full data | Not used | Its default input is `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`, which does not exist here, and it writes an audit next to its input. Not run. |

### Gaps found during this work

| Gap | Effect on this recipe |
|---|---|
| `SEC_DOL_H1b_data_mapped.csv` is missing; recipes and `data/80-days-to-stay/data/README.md` still name it | The `_v3` CSV is used instead. Its SHA-256 equals the one recorded for the missing file, and the run enforces it. |
| `applyProfile` zeroes the sponsorship weight when `authorization` contains "authorized" (`scripts/score/role-scorer.mjs`, `applyProfile`) | No `--profile` is passed, so the scorer defaults to "needs sponsorship". `search/examples/README.md` describes a fix (PR #37) that is not in this scorer. |
| `CONTRIBUTING.md` says harnesses may import `CONFIG, SRC, applyProfile, scoreRole`; the scorer exports nothing | The CLI and `out/score/role-scores.json` are used instead. |
| `npm run verify` prints "private path not gitignored" for `private/` and `data/ats/` although `git check-ignore` shows both ignored | False warnings from `scripts/manifest-check.mjs` text matching (`course/2026fa/submissions/meenuviji/recon/raw-output.txt`, "gitignore check"). Not fixed. |
| `npm run ats:scan -- --dry-run` makes live network calls (886 Databricks jobs fetched, `course/2026fa/submissions/meenuviji/recon/raw-output.txt`, "Phase 0 fixes") | Not part of this recipe or its tests. |
| Form D samples are mostly pooled funds and barely join | Funding is not a vote here (see above). |
| The scorer treats a missing `liveness`/`timeline` as 1.0 | G2 refuses the role before scoring. |

---

## Run-log template (`logs/runs/`)

Per `CONTRIBUTING.md`, run logs go in `logs/runs/<term>-<handle>-<n>.md` and never in `logs/RUN_LOG.md`. The first entry is `logs/runs/2026fa-meenuviji-1.md`. Fields follow `recipes/_shared.md`:

```markdown
## YYYY-MM-DD — data-titles-h1b-entry sample run

- **Recipe:** recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md v0.1.0
- **Inputs:** postings/sample-postings.json (seed 42, 2 per evidence group); run-config.json; rules.json; 80 Days CSV SHA-256 eccdee2a…6270
- **Outputs:** out/run.json, out/report.md, out/roles.json, out/score/role-scores.json
- **Result:** exit <code>; scored <n> (Apply <a> · Consider <c> · Skip <s>); stopped <n>; refused <n>; tests <passed>/<total>
- **Open issues:** <stops and refusals still to clear; notes a human must read>
- **Gate cleared by:** <name>, <date> — <what was checked, against what>
```
