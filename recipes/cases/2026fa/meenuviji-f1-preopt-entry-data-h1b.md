---
status: DRAFT
todos_open: 6
last_gate: "mode-build runs human review, 2026-10-21, logs/runs/2026fa-meenuviji-2.md"
attestation: null
recipe_version: 0.1.0
---

# F-1 pre-OPT, entry-level data roles: does this employer sponsor my title at my level?

## Executive summary

**What this is.** An operating mode for one situation: an international master's student in data analytics, on a student visa and not yet on post-study work authorization, deciding which entry-level data job postings deserve their limited application hours. It checks each employer's past work-visa sponsorship records, keeps only past sponsored job titles in the data family, and sorts them into senior, mid, and entry-level. It then hands the result, unchanged, to the project's standard scoring engine, which says Apply, Consider or Skip.

**Why read it.** "This company sponsors visas" can hide that it only sponsors senior engineers. This mode is built to catch that gap. It stops for a person instead of guessing whenever the evidence is missing, ambiguous, or out of date.

**What it decides, and what it does not.**
- It decides, per posting: tailor an application, network first, or skip. It also says why, citing the records.
- It treats "is the posting still open?" and "does the start date fit my work-authorization window?" as hard stops, not as points in a score.
- It does not say whether an employer *will* sponsor this student. A company with no record is unknown, not a non-sponsor.
- Six proposed improvements are still open, so the honest status is a draft. The parts that exist have run on sample data, and their output is on file.

---

## Purpose

Use this mode when **all** of these are true:
- The user is an F-1 student who is **pre-OPT** (OPT not yet started) and will need H-1B sponsorship later.
- The target roles are entry-level data-family titles: Data Analyst, Business Intelligence Analyst, Data Engineer, Data Scientist, Machine Learning Engineer, AI Engineer (the `target_titles` in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json`).
- The question is "where do tomorrow's application and networking hours go?", not "is this a good job?"

For each posting, the mode answers three questions:
1. Does the employer resolve to exactly one sponsorship record?
2. Has the employer sponsored data-family titles, and at what level (senior / mid / entry-or-unmarked)?
3. Do the liveness and timeline gates stay open?

Its output is the scorer's recommendation plus a next action chosen by evidence group. The implementation is the existing prototype `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/`. The Oct 3 recipe for that prototype is `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md`; this mode adds the mode-build structure, the liveness check command and the direct scorer run.

---

## Source Inventory

| Source node | Type | Exact path or command | Label | Human check |
|---|---|---|---|---|
| Sponsorship history (80 Days to Stay) | file (CSV, 30,369 rows) | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | SHA-256 must be `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`. The prototype checks it and stops the whole run on a mismatch. |
| National wage context (BLS/O*NET) | file (CSV, 1,016 rows) | `data/bls/compact/soc_occupation_compact.csv` | record | Context only. The scorer's `role_quality` weight is 0.0, so it cannot change a recommendation. |
| Legal-suffix list for name matching | script constant | `scripts/sec/sec-all-quarters.py` (`COMPANY_SUFFIXES`, read with `ast`, not executed) | record | Same list as the repo's Form D normalizer. |
| Rules | file (JSON) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json` | your-input | Every rule carries a `label`; an unlabeled rule stops the run. |
| Run inputs | file (JSON) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json` | your-input | Run inputs only: no name, contact or résumé content. |
| Postings | file (JSON) | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/postings/sample-postings.json` (default; any file in the same shape via `--postings`) | your-input | The sample is frozen: fictional titles, `jobs.example.com` URLs, real CSV company names. |
| Prototype | script | `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` | — | Exit 0 clean · 3 completed with stops · 1 whole-run failure · 2 bad arguments. |
| Role scorer (unmodified) | script | `npm run score` → `node scripts/score/role-scorer.mjs` | record (its output) | Offline (imports only `node:fs`, `node:path`). Never copied or re-implemented. |
| Posting liveness | script | `npm run ats:liveness` → `node scripts/ats/check-liveness.mjs` | record (its output) | Needs Playwright's Chromium. Makes a live network call to the posting URL. Exit 0 only if every URL is `active`. |
| Repo checks | scripts | `npm run verify`, `npm run doctor -- --strict` | — | Plain `npm run doctor` always exits 0; use `--strict`. |

Not used, with reasons: SEC Form D samples (128 of 200 sample records are pooled investment funds, and only one sponsoring company joins; PROBE-REPORT §C); `npm run bls:local-wage` (needs `.venv`, and feeds nothing); `npm run ats:scan` (makes live calls even with `--dry-run`).

---

## Inputs

Paths in this table are relative to `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/`.

| Input | Type | Source | Required? | Label |
|---|---|---|---|---|
| `postings[].posting_id` | string | `postings/*.json` | Yes | your-input |
| `postings[].company_input` | string (employer name as posted) | `postings/*.json` | Yes | your-input |
| `postings[].title` | string (posting title) | `postings/*.json` | Yes | your-input |
| `postings[].target_title` | one of `target_titles` | `postings/*.json` | Yes | your-input |
| `postings[].url` | URL | `postings/*.json` | Yes | your-input |
| `postings[].fit` | `{p, label, reason}`, p a number in 0–1 | `postings/*.json` | Yes | your-input (0.5 constant in the sample) |
| `postings[].liveness` | `{factor, label, determined_by}`, factor a number | `postings/*.json`, or from `npm run ats:liveness` (proposed addition 4) | **Yes: missing means refused** | your-input in the sample (`determined_by: "assumed, not checked"`); record when it comes from the liveness check |
| `target_titles` | list of strings | `run-config.json` | Yes | your-input |
| `as_of` | date | `run-config.json` | Yes | your-input (the real run date) |
| `opt_start` | date | `run-config.json` | Yes | your-input (2027-02-01, the earlier of my expected Feb–Mar start) |
| `window_days` | integer | `run-config.json` | Yes | your-input (90: regulatory figure, not in repo data; verify with the DSO) |
| `hiring_lag_days` | integer | `run-config.json` | Yes | your-input (60: my assumption, not measured) |
| Rules | `data_family_phrases`, `seniority`, `min_approvals_for_proven`, `tier_precedence`, `next_action`, `timeline_factors`, `sample` | `rules.json` | Yes | your-input |

---

## Proposed additions

Each one is a declared gap with its reason. None of them has run. Any output they would produce is *proposed*, never reported as if it ran.

1. **Title- or SOC-level sponsorship records.** `[TODO: DATA SOURCE]` DOL LCA disclosure data (employer, job title, SOC code, wage, dates), ingested by a maintained script. Why: the CSV records sponsorship per company, and its only role-level signal is a short free-text title list. Records per title would replace the title-list heuristic with records, and would carry dates.
2. **A title → SOC map for target and posting titles.** `[TODO: DEFINE]` A your-input mapping from each target title to one SOC code, with one sentence of reasoning per row. Why: only Data Scientist and Business Intelligence Analyst match a BLS `title` today. Data Analyst, Data Engineer, Machine Learning Engineer and AI Engineer show "no SOC row" (`out/report.md`, BLS column).
3. **A role-quality weight.** `[TODO: DEV]` A proposal to the scorer's maintainers for a non-zero `role_quality` weight, with renormalisation. Why: the weight is 0.0 (`scripts/score/role-scorer.mjs`, `CONFIG`), so wage context cannot change any recommendation. A blocker is noted in CHANGE-BRIEF §5f: 15-2051 gives Data Scientists and BI Analysts the same median ($112,590).
4. **Feed the liveness check into the posting.** `[TODO: DEV]` Write the result of `npm run ats:liveness -- <url>` into the posting's `liveness` field: `active` gives factor 1.0, `expired` gives 0.0, and `uncertain` gives no value, so the posting is refused. Label it record with the check date. Why: the check command exists and runs, but the prototype doesn't read its result. In the sample every liveness value is assumed, so the liveness gate never closes in the default run.
5. **Fit from the student's own rating.** `[TODO: DEFINE]` Replace the constant fit of 0.5 with a per-posting rating and a written rubric. Why: a constant fit isolates the sponsorship signal for testing, but it means the recommendation says nothing about whether the job suits the student. In the sample, 8 of 12 scored postings land in Consider.
6. **Duplicate-entity check across the whole CSV.** `[TODO: DEV]` A scan that flags every pair of rows with identical sponsorship columns. Why: today the duplicate-evidence note only compares companies matched in the same run. PATHAI INC and PATHRAI INC carry identical evidence under different names and cities, so neither a name nor a location check catches the case on its own.
7. **Human review of the mode-build runs. Closed:** logged in `logs/runs/2026fa-meenuviji-2.md` (Meena, 2026-10-21). G0 and both liveness break tests were accepted as passes; the direct scorer run was accepted as sample evidence only.

---

## Phase Gates

Liveness and timeline are **gates, not votes**. The scorer multiplies by them (`Composite = (Σ vote·weight) × liveness × timeline`), so a closed gate zeroes the composite whatever the votes say. The scorer silently treats a *missing* gate as 1.0, so this mode refuses the posting before it reaches the scorer.

| Gate | Testable condition | Pass | Fail | Cleared by |
|---|---|---|---|---|
| G0 Pre-flight | `npm run verify` exits 0 **and** `npm run doctor -- --strict` exits 0 | continue | stop the whole run; fix before anything else | the agent reports the result; Meena reads it |
| G1 Company match | the input name matches exactly one CSV row, exactly (upper-case) or by normalized name | continue; the matching rule is named | `no-match` or `more-than-one-row`: the posting stops (exit 3); never a nearest-name guess | Meena picks a row or records "not in data, not confirmed absent" |
| G2 Missing gate value | `liveness.factor` is a number with a label, and `as_of`, `opt_start`, `window_days`, `hiring_lag_days` are all present | the posting goes into `out/roles.json` | refused, never sent to the scorer; the missing field is named in `out/report.md` | Meena supplies the value or skips the posting |
| **G3 Liveness (hard gate)** | Real URL: G3 clears per posting, when that posting's own result line from `npm run ats:liveness` reads `active`. The command's exit code is for the whole batch: exit 1 only means at least one URL in the batch was not `active` (`scripts/ats/check-liveness.mjs:59`), so it neither clears nor fails a single posting. A posting with no result line (for example a `Fatal:` error) does not clear. Sample posting: the factor is labeled your-input "assumed, not checked". Either way the factor must be > 0.05 (the scorer's `gate_zero`). | the factor goes to the scorer | that posting's own line reads `expired` or `uncertain`, or it has no line: stop; do not score. A factor ≤ 0.05 gives Skip, `gated: liveness`. | Meena, after reading the check output |
| G4 Visa timeline (hard gate) | `projected_start = as_of + hiring_lag_days`; `window_end = opt_start + window_days` (inclusive); `projected_start <= window_end` | factor 1.0; a start before `opt_start` adds a non-scoring "deferred start" note | factor 0.0, so Skip, `gated: timeline` | Meena reads the arithmetic in `out/report.md` |
| G5 Human review | a `logs/runs/2026fa-meenuviji-<n>.md` entry names who reviewed which stops and refusals, with date and reasoning | the run's recommendations become usable advice | no entry means the run is not cleared, whatever its exit code | Meena (mode-build runs: `logs/runs/2026fa-meenuviji-2.md`, 2026-10-21) |

Evidence that G3 stops on bad input: the two committed break tests (`course/2026fa/submissions/meenuviji/worked-run-raw/`, commit 2a0c789). `http://localhost:3000` printed `uncertain … blocked host localhost`, and `not-a-real-url` printed `uncertain … invalid URL`. Both gave `Results: 0 active  0 expired  1 uncertain` and `exit code: 1`.

---

## Steps

Run every command from the repo root.

1. **Pre-flight.** Labor: AI, then a human reads the result.
   Command: `npm run verify` and `npm run doctor -- --strict`.
   Input: the working tree. Output: terminal only. Gate: G0.
2. **Check liveness for each real posting URL.** Labor: AI runs it; a human gate follows.
   Command: `npm run ats:liveness -- <url>` (or `npm run ats:liveness -- --file <urls.txt>`).
   Input: posting URLs. Output: one `active` / `expired` / `uncertain` line per URL, and exit 0 only if all are active. Written to: terminal only; the prototype doesn't read it yet (proposed addition 4).
   Skip this step for the sample: its `jobs.example.com` URLs are fictional, and liveness is labeled "assumed, not checked". Gate: G3.
3. **Run the prototype.** Labor: AI.
   Command: `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` (optional: `--postings`, `--config`, `--rules`, `--out <dir>`).
   Input: postings, run-config, rules, the two CSVs. Output: `out/run.json`, `out/report.md`, `out/roles.json`, `out/score/role-scores.json`, `out/score/role-scores.md`. Gates: G1, G2, G3 (factor), G4. It calls the scorer itself.
4. **Run the scorer directly on the gated roles.** Labor: AI.
   Command: `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir <new folder>`.
   Input: `out/roles.json`. Output: `<new folder>/role-scores.json` and `role-scores.md`.
   Always pass `--out-dir`: the default is the input file's own folder, and the tracked `out/score/` files would be rewritten.
5. **Run the offline tests.** Labor: AI.
   Command: `python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v`.
   Output: terminal only; it writes to temp directories. Expected: `Ran 28 tests` … `OK`.
6. **Human review and run log.** Labor: human.
   Meena reads `out/report.md`, decides each stop and refusal, and writes the log entry (template below) to `logs/runs/2026fa-meenuviji-<n>.md`. Gate: G5.

---

## What it can and cannot verify

### Can verify

**Records quoted as-is (record):**
- Whether an employer name resolves to exactly one row of the 80 Days CSV, and by which rule.
- The employer's recorded approvals, denials, approval rate, median salary and sponsored-title list, quoted unchanged.
- That the scorer received exactly the roles that passed the gates, and what it returned, term by term.
- Whether a real posting URL is `active`, `expired` or `uncertain` at the moment `npm run ats:liveness` runs.
- Whether two employers matched **in the same run** carry identical sponsorship columns.

**Your-input rules, applied the same way every time (covered by the 28 tests):** which sponsored titles contain a data-family phrase, and which seniority bucket each falls in. A rule applied consistently is not a rule shown to be correct.

### Cannot verify

- **Recency.** The approval and denial counts carry no year or date range, so an employer with many approvals may have stopped sponsoring.
- **Accuracy against primary sources.** The SHA-256 check proves the file matches the audited file, not DOL or USCIS records. The raw records are not in the repository.
- **Employer identity.** A name match may not be the posting's actual employer: subsidiaries, DBAs, and staffing firms where the agency is the sponsor.
- **That "unmarked" means entry level.** "Data Scientist" with no level marker is bucketed entry-or-unmarked, and many such roles expect experience.
- **That the employer sponsored the posting's exact title.** Data-family evidence is at company level (for example ENTRUPY INC: sponsored `Data Engineer`, posting `Machine Learning Engineer I`).
- **Completeness of the title list.** It holds 1–14 free-text titles per company; unlisted or reordered titles ("Analyst, Data") are invisible.
- **Likelihood of filing.** Approval rate measures filed petitions. No record is not evidence of non-sponsorship.
- **Which entity owns duplicated evidence** (PATHAI INC / PATHRAI INC).
- **Liveness in the default run.** Assumed for the sample. For real URLs, the check result is not yet fed into the score (proposed addition 4), and a page that loads is not proof the role is still being filled.
- **Timeline inputs.** `hiring_lag_days` is my assumption, `window_days` is not in repo data, deferred-start acceptance is unknown, and EAD timing is not modeled.
- **Fit.** Constant 0.5, not measured.
- **Local pay.** National OEWS median only, and only 2 of 6 target titles have a BLS row.

---

## Output Contract

### Agent output

- **File:** `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json` (JSON; or `<--out dir>/run.json`).
- **Fields:** `workflow`, `run_id`, `mode`, `inputs`, `rules`, `run_config`, `data` (CSV path, SHA-256, row counts), `sample`, `roles_json`, `scorer` (command, exit code, stdout, stderr, config), `status`, `exit_code`, `counts`, `evidence_group_counts_scored`, `scored`, `stops`, `refusals`, `notes`.
- **Labels:** every evidence and scoring value carries `{value, label}`, with label one of `record` / `your-input` / `model-judgment`.
- **Scorer twin:** `role-scores.json` in `out/score/` (or the `--out-dir` of step 4), with `_scorer`, `generated`, `config`, `profile_needs_sponsorship`, and `roles[]` with a `trace` per role.

### Human report

- **File:** `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md` (Markdown), plus the scorer's `role-scores.md`.
- **Reader:** the student.
- **Decision enabled:** where tomorrow's application and networking hours go: tailor, network first, or skip, per posting.
- **Sections, in order:**
  1. Executive summary (with the population share of each evidence group and the stratified-sample warning).
  2. Run record.
  3. Scored postings table: posting, employer, recommendation, composite, evidence group, next action, tier · p, evidence, timeline, BLS context.
  4. "Why each one scored as it did".
  5. Sample by evidence group.
  6. Stopped at the company-match gate.
  7. Refused: missing gate value.
  8. Caveats.

**Why one file can't serve both:** the log must be complete and machine-checkable (every value labeled, raw scorer stdout kept), while the report must be read in minutes. A file that does both does neither (P5).

---

## Stop Conditions

Refuse to produce a score, and say why, when:
- an employer name matches no row or more than one row (G1);
- a liveness or timeline input is missing (G2);
- a real posting's liveness check returns `expired` or `uncertain`, or doesn't run (G3);
- the sponsorship CSV's SHA-256 doesn't match (whole run);
- a rule in `rules.json` is unlabeled (whole run);
- `npm run verify` or `npm run doctor -- --strict` fails (G0);
- asked to infer sponsorship for a company with no record;
- asked to fill a missing liveness value with 1.0;
- asked to map a title to a SOC code by guess (proposed addition 2 is open).

---

## Snickerdoodle

The `snickerdoodle` CLI is roadmap (DOMAIN.md, Runtime), so no `snickerdoodle run` commands are given here. These are the real commands, all present in `package.json` or the prototype folder.

### Run Commands

| Run | Command |
|---|---|
| Full sample run | `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` |
| Run on other postings | `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py --postings <file> --out <dir>` |

### Step Commands

| Step | Command |
|---|---|
| 1 Pre-flight | `npm run verify` · `npm run doctor -- --strict` |
| 2 Liveness | `npm run ats:liveness -- <url>` |
| 3 Prototype | `python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` |
| 4 Scorer | `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir <new folder>` |
| 5 Tests | `python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v` |
| Conformance | `node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/ recipes/cases/2026fa/` |

### Gate Commands

There is no gate CLI. A gate clears when Meena writes the decision into a `logs/runs/` entry (who, what, when, reasoning), as in `logs/runs/2026fa-meenuviji-1.md`. `logs/gate-decisions/` does not exist.

### Script Locations

| Step | Script path | Layer |
|---|---|---|
| Pre-flight | `scripts/conformance.mjs`, `scripts/manifest-check.mjs`, `scripts/doctor.mjs` | repo |
| Liveness | `scripts/ats/check-liveness.mjs` (+ `scripts/ats/liveness-browser.mjs`) | ats |
| Match, classify, gates, report | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/lib/` | contrib |
| Scorer | `scripts/score/role-scorer.mjs` (called by `lib/score_bridge.py`) | score |

### Output Locations

| Output | Path | Format |
|---|---|---|
| Agent log | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json` | JSON |
| Human report | `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md` | Markdown |
| Scorer input / output | `out/roles.json`, `out/score/role-scores.json`, `out/score/role-scores.md` | JSON / Markdown |
| Direct scorer run (2026-10-21) | `course/2026fa/submissions/meenuviji/recon/score-worked-run/` | JSON / Markdown |
| Run log | `logs/runs/2026fa-meenuviji-<n>.md` | Markdown |

---

## Provenance

| Source | Verification command | Notes |
|---|---|---|
| 80 Days CSV | `shasum -a 256 data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Must print `eccdee2a…6270` (full hash above); the run enforces it. |
| BLS compact | `test -f data/bls/compact/soc_occupation_compact.csv` | 1,016 rows (recorded in `out/run.json` → `data`). |
| Prototype | `test -f scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py` | Oct 3 fresh-clone run at commit 4a4074e: exit 3, 12 scored (`course/2026fa/submissions/meenuviji/TEST-REPORT.md`). |
| Scorer | `test -f scripts/score/role-scorer.mjs` | Identical to upstream/main. The direct run on 2026-10-21 exited 0 with the same 2 / 8 / 2 (`course/2026fa/submissions/meenuviji/MODE-WORKED-RUN.md`). |
| Liveness check | `test -f scripts/ats/check-liveness.mjs` | Break tests in commit 2a0c789 (`course/2026fa/submissions/meenuviji/worked-run-raw/`): both `uncertain`, exit 1. |
| Gate decisions | `test -f logs/runs/2026fa-meenuviji-1.md && test -f logs/runs/2026fa-meenuviji-2.md` | Oct 3 sample-run review; mode-build runs review, 2026-10-21. |

---

## Log template (logs/RUN_LOG.md)

The fields follow `recipes/_shared.md` (Logging Rules). `logs/RUN_LOG.md` lines 3–5 forbid student edits ("CI rejects PRs that modify this file"), so students file each entry as `logs/runs/2026fa-meenuviji-<n>.md`, and the maintainer adds the index row.

```markdown
## YYYY-MM-DD — f1-preopt-entry-data-h1b <sample | live> run

- **Recipe:** recipes/cases/2026fa/meenuviji-f1-preopt-entry-data-h1b.md v0.1.0
- **Inputs:** <postings file> (<n> postings; sample or real); run-config.json (as_of, opt_start, window_days, hiring_lag_days); rules.json; 80 Days CSV SHA-256 eccdee2a…6270; liveness: <assumed | ats:liveness results with date>
- **Outputs:** out/run.json, out/report.md, out/roles.json, out/score/role-scores.json (+ direct scorer run folder, if any)
- **Result:** exit <code>; scored <n> (Apply <a> · Consider <c> · Skip <s>); stopped <n>; refused <n>; liveness <active/expired/uncertain counts>; tests <passed>/<total>
- **Open issues:** <stops and refusals still to clear; proposed additions still open>
- **Gate cleared by:** <name>, <date> — <what was checked, against what>
```

No secrets, personal contact details or private application notes go in the entry.
