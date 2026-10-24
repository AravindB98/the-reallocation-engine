---
owner: meenuviji
term: 2026fa
component: data-titles-h1b-entry
status: DRAFT
promoted_to: null
---

# data-titles-h1b-entry

## Executive summary

**What this is.** A small tool for an international student looking for entry-level data jobs. Knowing an employer has sponsored work visas before isn't enough; the student needs to know whether it sponsored *entry-level data* jobs. The tool reads each employer's list of past sponsored job titles, sorts them into data or not-data and senior, mid or entry, turns that into a sponsorship score using rules the student wrote, and passes the score to the project's existing recommendation engine unchanged.

**Why read it.** It explains how to run the tool, which rules it applies, and where it stops and asks a person instead of guessing.

**What it decided.** The tool never guesses a company: an unknown name, or one that could be several companies, stops for a human. It never sends a posting with a missing date or posting status to the scorer, because the scorer would quietly assume the best case. An employer with no sponsorship record is treated as unknown, not as a non-sponsor. Status: draft. The tests pass on sample data, and no person has yet signed off on the results.

---

## Run

From the repository root, no arguments:

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
```

Writes `out/roles.json`, `out/score/role-scores.{json,md}` (from the unmodified scorer), `out/run.json` (agent log) and `out/report.md` (human report). Options: `--postings`, `--config`, `--rules`, `--out`.

Labels apply to every evidence and scoring value. Posting identifiers (posting_id, title, target_title, url, company_input, purpose) are your-input from the fictional sample postings. Stop and refusal reasons and run metadata (status, exit_code, run_id, scorer command and stdout) are produced by the prototype itself and are not evidence, so they carry no record/model-judgment/your-input label.

Exit codes: `0` clean · `3` completed, but at least one posting stopped at the company-match gate or was refused for a missing gate value · `1` whole-run failure (missing/changed data file, SHA-256 mismatch, unlabeled rule, scorer failure) · `2` bad arguments.

## Test

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

Offline. Uses the real repo CSVs and the real scorer (`npm run score`, needs Node). Every test writes to a temp directory; the suite fails if it changes `out/`.

## Requirements

Python 3.9+ standard library only; Node 20+ (for the existing scorer). No pip packages, no network calls.

## Files

| File | Role |
|---|---|
| `rules.json` | Every rule and threshold, each labeled `your-input` (or `record` for provenance). |
| `run-config.json` | Run inputs only (`your-input`): target titles, `as_of`, `opt_start`, `window_days`, `hiring_lag_days`. It holds no name, contact, or résumé content. No persona in `search/examples/` fits a pre-OPT F-1 data student, so none is referenced. |
| `postings/sample-postings.json` | Frozen sample: 2 companies from each of six evidence groups (no record · record but no data title · proven · entry title but < 5 approvals · only mid · only senior), drawn with one `random.Random(42)`, plus 3 failure-case postings. Built by `build_sample.py` (refuses to overwrite without `--force`). |
| `run.py` | The one command. |
| `lib/` | `inputs` (load + label/hash checks), `match` (company gate), `classify` (titles, tier, p), `gates` (liveness/timeline), `bls` (wage context), `score_bridge` (calls the scorer), `pipeline`, `report`. |
| `fixtures/`, `tests/` | One fixture + test per failure case, happy path, null p through the real scorer. |

## Rules (all `your-input`, from `rules.json`)

**Data-family phrase allowlist** (case-insensitive substring): `data analyst`, `data engineer`, `data scientist`, `business intelligence`, `bi analyst`, `bi engineer`, `bi developer`, `analytics engineer`, `machine learning engineer`, `ml engineer`, `ai engineer`.

**Seniority** (whole tokens, anywhere in the title; first bucket that fires wins: senior → mid → entry-or-unmarked):
- senior: `senior, sr, lead, staff, principal, director, manager, head, vp`, level `III`/`IV`, or any standalone number ≥ 3
- mid: level `II` or `2`
- entry-or-unmarked: `junior, jr, associate, new grad`, level `I` or `1`, or no marker at all. Unmarked is not proof of entry level.

**Tier precedence** (first match wins): no sponsorship record → `unknown`, p null · record but no data-family title → `possible`, 0.3 · ≥1 entry-or-unmarked data-family title and Total Approvals ≥ 5 → `Proven`, 0.7 · otherwise → `possible`, 0.5. The p values are ordered labels, not probabilities.

**Company match:** exact upper-case name → that row. Otherwise the name is normalized using the repo's own suffix list from `scripts/sec/sec-all-quarters.py` (read with `ast`, not executed), applied in that file's order and repeated until stable. Then non-alphanumerics are stripped and the name is lower-cased. Exactly one row means continue; more than one, or none, means stop. When an exact match also shares its normalized key with other rows, those rows are listed as a note rather than a stop.

**Timeline** (corrected in CHANGE-BRIEF Revision 1): `projected_start = as_of + hiring_lag_days`; `window_end = opt_start + window_days` (inclusive). `projected_start <= window_end` → 1.0. A projected start *before* `opt_start` is a deferred start, not a failure: the role keeps 1.0, and a note says the employer must accept a start N days after the offer. `projected_start > window_end` → 0.0, with the arithmetic shown.

**Next action** (`rules.json` → `next_action`, advice only; it never changes the scorer's recommendation). If the scorer says Skip because a gate closed: "Skip: <gate> closed." Otherwise it's chosen by evidence group (proven, entry-under-min-approvals, only-mid, only-senior, no-data-title, no-record). It appears for every scored posting in the report table, the per-posting detail and `run.json`.

**Non-scoring notes** (in both `run.json` and `report.md`, never change a score):
- *deferred-start*: the projected start falls before `opt_start`. It is kept per role in `run.json`. Because `hiring_lag_days` is one global value, the report shows it once, in the executive summary and run record.
- *duplicate-evidence*: two matched companies in the run have identical sponsorship columns (approvals, denials, rate, median salary, title list); the evidence may belong to only one of them. This is checked within the run only, not across the whole CSV.
- *title-family*: the employer's sponsored data titles matched allowlist phrases, but the posting title contains none of those phrases, so the match is at company level only.
- *sibling-rows*: an exact name match shares its normalized name with other CSV rows, which are listed.

## Known gaps

- **The scorer exports nothing.** `CONTRIBUTING.md` says harnesses may import `CONFIG, SRC, applyProfile, scoreRole` from `scripts/score/role-scorer.mjs`, but that file has no exports and runs `main()` when loaded. This tool uses the CLI, as CONTRIBUTING also allows. Not fixed here.
- **"authorized" in a profile zeroes the sponsorship weight.** `role-scorer.mjs` line 60 treats any `authorization` text containing `authorized` as not needing sponsorship. So "not authorized to work without sponsorship" would set the sponsorship weight to 0. `search/examples/README.md` describes a fix (PR #37) for this, but it is not in the scorer at the commit this branch is based on. This tool passes no `--profile`, so the scorer's default (sponsorship needed) applies. Not fixed here.
- **No sponsorship record can still produce Consider.** With p null the scorer drops the sponsorship vote, and fit ≥ 0.67 alone reaches the Consider floor (0.20). Not overridden; the report adds the no-record next action instead.
- **The sample is stratified,** with 2 postings per evidence group, so its skip rate is not representative of the CSV, where 94.9% of companies have no sponsorship record. The report states the population shares.
- **Possible duplicate entities in the CSV.** In the default sample, `PATHAI INC` and `PATHRAI INC` carry identical sponsorship evidence (78 approvals / 2 denials, same title list). They don't normalize to the same name, so the match rule cannot catch it; the duplicate-evidence note flags it when both appear in a run.
- **Liveness is not checked.** Sample postings are `assumed, not checked`; fit is held at 0.5. Both are `your-input`.
- **BLS context covers few targets.** Only Data Scientist and Business Intelligence Analyst titles match a BLS title; the other targets show "no SOC row". Wage is context only (`role_quality` weight is 0.0 in the scorer).
- **The allowlist misses reordered titles** such as "Analyst, Data" or "Engineer – Data Platform" (accepted false negatives, CHANGE-BRIEF §9).
- **Non-alphanumerics are stripped differently from the repo.** The repo's normalizer removes only `, . whitespace - & '`; this tool removes all non-alphanumerics, per CHANGE-BRIEF §5a.
