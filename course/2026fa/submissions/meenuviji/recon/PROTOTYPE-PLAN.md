# PROTOTYPE-PLAN — data-titles-h1b-entry (Phase 3a, plan only)

## Executive summary

**What this is.** A build plan for a small tool that looks inside each employer's list of past visa-sponsored job titles, decides whether the employer has sponsored entry-level data jobs, and hands that judgment to the project's existing role scorer. Nothing has been built yet; this document is the plan only.

**Why read it.** Before any code is written, you should agree with how it will behave when things go wrong — an unknown company, two companies with the same name, missing dates — and settle the open questions at the end. Several of those questions change what the tool outputs.

**What it found.**
- The plan is feasible with the standard Python library and the existing scorer, called unchanged.
- Real employers exist in the data for every failure case in the brief, so only one test needs an invented company name.
- About 213 groups of company names collapse into the same name after cleaning (for example an "Inc." and an "LLC" with the same name). But the brief's "exact name first" rule means those duplicates only trip the stop if the user types the name *without* a suffix.
- Under your new title rule, 248 employers (not 421) have a data title, and 93 (not 171) have only senior ones. The brief's headline numbers will need the revision it already promises.
- **The scorer still recommends "Consider" for an employer with no sponsorship record if your fit rating is 0.7 or higher.** Dropping the sponsorship vote does not stop a role from scoring. This needs your decision (question Q7).
- Only 2 of your 9 target titles (Data Scientist, BI Analyst) have a matching row in the wage table; the other 7 will show "no SOC row".

---

## Run record

- Spec: `course/2026fa/submissions/meenuviji/CHANGE-BRIEF.md` (commit `53cc80a`), §5, §7, §8 followed.
- Read: `scripts/score/role-scorer.mjs`, `data/examples/ch11-roles.json`, `recipes/_shared.md`, `CONTRIBUTING.md`, `scripts/conformance.mjs`, `recon/probe/PROBE-REPORT.md`, `scripts/sec/sec-all-quarters.py` lines 10–49 (suffix list + normalizer), `.gitignore` (grep). Listed (not read): `search/examples/`.
- Commands/scripts run for this plan (scratch, outside the repo): `grep` for exports in the scorer; a Python check of name collisions, tier groups, fixture candidates and BLS title matches; one call of the real scorer on a 3-role scratch file (null p, no gates). Outputs quoted below.
- Not read: `private/`, `search/resume.json`, `data/ats/`.

---

## 1. File layout

All under `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` (CONTRIBUTING: "Code + tests + fixtures").

| File | Purpose |
|---|---|
| `README.md` | Executive summary; the final data-family phrase allowlist (§5b says it lives here); run command; test command; known misses. |
| `rules.json` | Every `your-input` value, each as `{"value": …, "label": "your-input", "why": "…"}`: data-family phrase allowlist, seniority tokens (senior / mid / entry), `min_approvals_for_proven` (5), p per tier (0.7 / 0.5 / 0.3 / null), tier names, liveness closed-gate cutoff (0.05), sample seed and per-tier sample sizes. Also a `provenance` block (CSV paths, expected SHA-256 of the 80 Days CSV) labelled `record`. |
| `persona.json` | Fictional persona, `@example.com` only: target titles, `opt_start`, `window_days`, `hiring_lag_days`, `as_of` date — all `your-input`. Location is an open question (Q1). |
| `postings/sample-postings.json` | Fictional entry-level data postings: company (real CSV name), title, fit p (`your-input`), liveness factor + how determined (fixture), URL `https://jobs.example.com/...`. |
| `build_sample.py` | One-off, seeded: draws companies per tier from the CSV and writes `postings/sample-postings.json`. Run once; output committed so the sample is frozen before any scoring. |
| `run.py` | The one command. `argparse`; default `--postings postings/sample-postings.json`, `--out out/`. Orchestrates the steps in §2. |
| `lib/match.py` | §5a normalization + company-match gate. |
| `lib/classify.py` | Parse `top_job_titles_sponsored` (`ast.literal_eval`), data-family test, seniority bucket, tier + p. |
| `lib/gates.py` | Liveness and timeline presence checks + timeline arithmetic. |
| `lib/bls.py` | Target title → BLS row (title field only) or "no SOC row". |
| `lib/score_bridge.py` | Writes `roles.json`, calls `npm run score`, reads `role-scores.json`. |
| `lib/report.py` | Writes `out/run.json` (agent log) and `out/report.md` (human report). |
| `fixtures/*.json` | One posting file per test case (§3). |
| `tests/test_pipeline.py` | `unittest`, offline; one test per §8 case + happy path + null-p-through-scorer. |
| `out/` | Generated: `roles.json`, `score/role-scores.{json,md}`, `run.json`, `report.md`. Whether it is committed is Q2. |

## 2. Data flow and labels

| Step | What happens | Values produced → label |
|---|---|---|
| 0 | Load `rules.json`; fail run if any rule lacks a `label`. Load persona + postings. | rule values → `your-input`; persona dates → `your-input`; posting fit → `your-input`; posting liveness → `record` if from a live check, else labelled `your-input` with `determined_by: "fixture"` (Q8) |
| 1 | SHA-256 the 80 Days CSV, compare with `provenance.expected_sha256` (`eccdee2a…6270`, from `SEC_DOL_H1b_data_mapped-audit.md`). Mismatch = whole-run failure. | hash → `record` |
| 2 | Company match (§5a). Exact upper-case match on `company_name` → one row; else normalized key → exactly one row; else STOP. | matched row, rule used (`exact` / `normalized`) → `record` |
| 3 | Read sponsorship columns of the matched row. | `Total Approvals`, `Total Denials`, `Approval_Rate`, title list → `record` |
| 4 | Classify each title: data-family (allowlist), bucket (senior / mid / entry-or-unmarked). | the title strings → `record`; data-family flag + bucket → `your-input` (rule output) |
| 5 | Tier + p per §5d. | tier, p → `your-input` (as §5d says) |
| 6 | Gate presence: refuse the role if `liveness.factor` or any of `opt_start` / `window_days` / `hiring_lag_days` is missing. | refusal reason |
| 7 | Timeline factor: projected start vs OPT window → 1.0 or 0.0; arithmetic string kept. | factor + arithmetic → `your-input` (all three inputs are yours, §7) |
| 8 | BLS context: target title → BLS row by title field, or "no SOC row". | wage, SOC → `record`; "no SOC row" → stated, not guessed |
| 9 | Write `out/roles.json` (only roles that passed steps 2 and 6), shaped like `data/examples/ch11-roles.json`: `role_id, company, title, sponsorship{p,tier,source:"your-input"}, fit{p,source:"your-input"}, liveness{factor,source}, timeline{factor,source:"your-input"}`. | — |
| 10 | Call scorer (§5). | composite, recommendation, trace → as returned by the scorer (its own labels carried through) |
| 11 | Write `out/run.json` and `out/report.md`: every scored role, every gate stop, every refusal, with the step 3 record values next to the step 5 judgment. | — |

## 3. Failure-case fixtures (§8)

Found by script against the real CSV with the §5a normalizer, the §5b allowlist and the §5c buckets. Random picks used `random.Random(42)`.

| §8 case | Fixture | Company (real unless marked) | Expected behaviour |
|---|---|---|---|
| Company not in CSV | `fixtures/not-in-csv.json` | **Invented:** `Quillfeather Data Labs, Inc.` — the script confirmed its normalized key is not in the CSV | Company-match gate stop with the input name; not in `roles.json`; listed in both outputs. Exit code: see §6/Q3. |
| >1 normalized match | `fixtures/multi-match.json` | Input `Arcturus Therapeutics` (no suffix) → normalizes to `arcturustherapeutics` → 2 rows: `ARCTURUS THERAPEUTICS INC` and `ARCTURUS THERAPEUTICS LTD` (both 12 approvals). Alternative: `Avidity Biosciences` → `AVIDITY BIOSCIENCES INC` / `LLC`. | Gate stop listing both candidates (name, city, state only). |
| In CSV, no sponsorship | `fixtures/no-sponsorship.json` | `BANYAN WATER INC` (seeded pick from the 28,812 rows with empty sponsorship; exact match, one row) | Tier `unknown`, p `null` in `roles.json` (assert `is None`, not 0); report says "no record ≠ does not sponsor". |
| Only senior data-family titles | `fixtures/senior-only.json` | `GINGERIO INC` (24 approvals; titles include `Staff Data Engineer `, `Lead Machine Learning Engineer`) | Tier `possible`, p 0.5; report names those titles. |
| Missing liveness / timeline | `fixtures/missing-gate.json` | Two postings at `CENTIFIC GLOBAL SOLUTIONS INC`, one without `liveness`, one with persona `hiring_lag_days` removed | Refused; error names the missing field; role id absent from `roles.json`. |
| OPT window closed | `fixtures/opt-closed.json` | `CENTIFIC GLOBAL SOLUTIONS INC` with a persona `opt_start` before `as_of − window_days` | Timeline 0.0 → scorer "gated" Skip; arithmetic shown. |
| Target title with no BLS row | `fixtures/no-bls-row.json` | Any matched company; title `Data Engineer` | "no SOC row" in report; scoring identical to the same posting with a BLS-matched title. |
| Happy path | `fixtures/happy.json` | `CENTIFIC GLOBAL SOLUTIONS INC` (22 approvals; `Data Engineer` unmarked → `Proven`, p 0.7) | Scored; appears in scorer output with all labels. |
| Null p through real scorer | `fixtures/null-p.json` | `BANYAN WATER INC` with fit 0.7, liveness 1.0, timeline 1.0 | See below. |

**What the real scorer does with null p (observed, scratch run):**

| Input | composite | machine_recommendation | reason | votes in trace |
|---|---|---|---|---|
| p null, tier `unknown`, fit 1.0, gates 1/1 | 0.3 | Consider | `above threshold (0.300) but one soft spot: sponsorship tier "unknown"` | `['fit']` |
| p null, tier `unknown`, fit 0.7, gates 1/1 | 0.21 | **Consider** | `composite 0.210 in the Consider band [0.2, 0.3)` | `['fit']` |
| p 0.7, no `liveness`/`timeline` keys | 0.455 | Apply | `gates healthy` | gates both `1` |

So the null-p test will assert: sponsorship absent from `trace.votes`, and recommendation **Consider** for fit 0.7. The third row confirms §7's premise that a missing gate becomes 1.0.

Other seeded picks (for the sample, not failure cases): Proven `RYAN SPECIALTY GROUP LLC` (14; `Data Analyst, Catastrophe Modeling`); entry-but-<5 `ADEPT ID INC` (4), `NAUTILUS LABS INC` (2); mid/senior `DV01 INC` (`Data Engineer II`); no data title `BOUNCE IMAGING INC`, `SWELL ENERGY INC`; none `PLANSPEAK INC`.

Group sizes under the §5b/§5c rules as I implemented them (whole-word seniority tokens; see Q5): no sponsorship 28,812 · sponsorship but no data title 1,309 · Proven 100 · entry-or-unmarked but <5 approvals 41 · only mid-or-senior 14 · only senior 93. Companies with ≥1 allowlist title: **248**.

## 4. Do two CSV names normalize to the same string under §5a?

Yes. Using the repo's own suffix list (`scripts/sec/sec-all-quarters.py:10-24`: inc, incorporated, llc, l.l.c., ltd, limited, corp, corporation, co, company, l.p., lp, plc — applied repeatedly, then non-alphanumerics removed and lower-cased): **30,369 names → 30,155 keys; 213 keys shared by 427 rows.** Examples: `3AM INNOVATIONS INC` / `3AM INNOVATIONS LLC`; `ABSCI CORP` / `ABSCI LLC`. 15 colliding keys involve at least one sponsorship row, e.g. `ARCTURUS THERAPEUTICS INC` / `LTD` (12 / 12), `AVAVA INC` (2) / `AVAVA LLC` (none), `AXIA TECHNOLOGIES INC` (none) / `LLC` (2).

Important: the 80 Days names are unique (0 duplicates, REALITY-REPORT §5a), so the §5a "exact upper-case match" row always returns exactly one row. Input `ARCTURUS THERAPEUTICS INC` matches exactly and **never reaches** the collision. That is why the multi-match fixture uses the suffix-less input (Q4).

## 5. Scorer invocation and parsing

- Command (subprocess, `cwd` = repo root, list form, no shell): `npm run score -- out/roles.json --out-dir <folder>/out/score`. No `--profile` (Q6).
- Before calling, remove the old `out/score/role-scores.json` so a stale file can never be read as this run's output (it is regenerated output, not a hand-made file).
- **Stdout is never parsed.** npm prints its own banner (`> the-reallocation-engine@1.0.0 score` / `> node scripts/score/role-scorer.mjs …`, seen in `raw-output.txt`) and the scorer prints a `✓ scored …` summary. Both are captured verbatim into `run.json` as `scorer_stdout` / `scorer_stderr`. Extra or changed lines therefore cannot break parsing.
- The result is read from the file the scorer writes (`role-scorer.mjs:175-176`): `out/score/role-scores.json`. Checks, each a whole-run failure if it fails: npm exit code 0; file exists and parses; `_scorer == "bayesian-role-scorer"`; the set of `role_id`s equals the set written to `roles.json`; `generated` present.
- The scorer has **no exports** (`grep` for `export` found none; `main()` runs at import), so the CLI is the only way to use it — consistent with "never copy or reimplement".
- The scorer's `config` block (weights, thresholds) is copied into `run.json` as `record` of what the scorer used.

## 6. Exit-code policy (proposed — confirm with Q3)

| Situation | Kind | Proposed exit |
|---|---|---|
| All roles scored | success | 0 |
| Some roles stopped at the company-match gate or refused for a missing gate value; the rest scored; outputs written | per-role stop | **3** ("completed with stops"); outputs still written |
| Every role stopped/refused (nothing to score) | per-role stops only | 3; scorer not called; outputs written |
| Bad arguments | whole-run | 2 (argparse default) |
| Missing/unreadable CSV, CSV header mismatch, SHA-256 mismatch, `rules.json` invalid or a rule missing its label, persona/postings not parseable, `top_job_titles_sponsored` fails to parse for the matched row, npm non-zero, scorer file missing/invalid or role ids mismatched | whole-run failure | 1; no `report.md` claiming results; `run.json` records the failure |

Rationale: §8 asks the not-in-CSV test to assert a non-zero exit, while the constraints say match failures stop only that role. Exit 3 satisfies both: the run continues, but a caller can't mistake it for a clean run.

## 7. Conflicts and ambiguities — questions for you

**Q1. Persona location.** CHANGE-BRIEF §4 says "a fictional persona I invent". `DATA_CONTRACT.md` §Zero-Conditions says resume- or profile-shaped files must use the personas in `search/examples/` (Aarav Patel, Priya Nair, Maya Sehgal, Rohan Desai), or a new fictional one added **under `search/examples/`**. Do you (a) reuse one of the four (I have not read their contents — NOT CHECKED whether any is an F-1 data student), (b) add a new persona under `search/examples/`, or (c) keep `persona.json` in the contrib folder?

**Q2. Where outputs live, and whether they are committed.** CONTRIBUTING puts "worked run / reports" in `course/<term>/submissions/<handle>/`, but your constraint puts `out/run.json` and `out/report.md` in the contrib folder. Keep `out/` there and commit it? Keep it there but gitignore it, and copy one worked run to `submissions/`? (A new `.gitignore` would be a file in your folder, not a tracked repo file.)

**Q3. Exit code for per-role stops.** Is the §6 proposal (3 = completed with stops) acceptable, or should any gate stop exit 1?

**Q4. Exact match vs normalized collision.** §5a checks the exact match first, so `ARCTURUS THERAPEUTICS INC` passes even though `… LTD` exists with the same normalized key. Is that intended, or should a normalized collision stop the role even when the exact match succeeds?

**Q5. How tokens match.** §5b says a title "contains" a phrase (substring), and §5c lists `sr`, `head`, `lead` etc. Raw substrings can misfire: `sr` matches inside any word containing those letters, and `head` inside `ahead`. PROBE-REPORT §A3 notes this risk; I did not count actual instances. I counted seniority tokens as **whole words** and allowlist phrases as substrings. Confirm? And for §5c "level III/IV/3+": does a bare number anywhere (`Professional 3, Business Analytics`) count, or only a trailing level?

**Q6. Suffix list.** §5a says "strip legal suffixes" without listing them. Use the repo's list (13 patterns incl. `limited`, `company`, `plc`, giving 213 collisions), or the probe's list (INC/LLC/CORP/CORPORATION/LTD/CO/LP, 210 collisions)?

**Q7. Null p still recommends Consider.** With the sponsorship vote dropped, fit ≥ 0.67 alone reaches the 0.20 Consider floor (observed: fit 0.7 → 0.21 Consider). So "no sponsorship record" can rank level with "possible, p 0.3". §5d says null means "vote dropped, not zero-filled", which is what happens. Do you accept that, or should `unknown` be handled differently (it would need a rule in your code, not a scorer change)?

**Q8. §5d tier rows overlap.** Row 2 says "only mid or senior **OR** approvals < 5 → 0.5". A company with **no** data-family title and < 5 approvals matches row 2 (0.5) and row 3 (0.3). Should row order decide (first match wins → 0.5, higher than having no data title), or should row 3 win? Also confirm that an entry title with < 5 approvals → 0.5 (41 companies).

**Q9. Timeline arithmetic.** §7 says "projected start falls within the OPT window", but doesn't define projected start or the window. Proposal: projected start = `as_of + hiring_lag_days`; window = `[opt_start, opt_start + window_days]`; `as_of` is a fixed persona date so tests do not depend on today. OK? Is the window end inclusive?

**Q10. Liveness label for fixture values.** §7 lists liveness evidence as "fixture value". The scorer defaults liveness to `record`. A value you typed is not a record. Label fixture liveness `your-input` (my proposal) or `record`?

**Q11. Matching titles to BLS.** "No title-field match": I checked whether the target phrase appears inside the BLS `title`. Only `data scientist` → 15-2051.00 Data Scientists and `business intelligence analyst` → 15-2051.01 match. `data analyst`, `data engineer`, `bi analyst`, `analytics engineer`, `machine learning engineer`, `ml engineer`, `ai engineer` all → no row. Is substring on the title field the rule? (Matching on `alternate_titles_sample` would add rows like Biofuels Processing Technicians, per PROBE-REPORT §B.)

**Q12. Allowed standard-library modules.** Your list is csv, json, ast, re, subprocess, unittest, argparse, random. The plan also needs `hashlib` (SHA check), `datetime` (timeline), `pathlib`/`os`/`sys` (paths, exit codes), and `shutil`/`tempfile` for tests. Were those meant to be allowed?

**Q13. Headline counts in CHANGE-BRIEF §2.** The 421/171/68 figures came from the probe's substring rule. Under §5b/§5c they become 248 / 93 (68 not yet recomputed). The brief says revisions are appended at the bottom — do that before or after the build?

**Q14. Branch name.** CHANGE-BRIEF line 6 says `contrib/2026fa-meenuviji-data-titles-h1b-entry`; the checked-out branch is `contrib/2026fa-meenuviji-recon`. Rename before the first prototype commit?

**Q15. Repo-side conflict (not yours to fix, for the record).** CONTRIBUTING says harnesses may import `CONFIG, SRC, applyProfile, scoreRole` from `role-scorer.mjs`; the file exports nothing. Also `applyProfile` (line 60) sets sponsorship weight to 0 when `authorization` contains `authorized` — so a persona saying "not authorized to work without sponsorship" would silently zero the sponsorship weight. That's why the plan passes no `--profile`. Log either in FRICTIONAL.md?

## 8. Commands (for the README)

Run, from repo root, no arguments:

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
```

Tests, from repo root (offline; uses the real CSVs and the real scorer via npm):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

Conformance (CHANGE-BRIEF §4):

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/
```

Note: `conformance.mjs` skips directories named `data`, `tools`, `output`, `ingest`, `gigo` (lines 21–25), so no subfolder may use those names or it goes unchecked. `out/` is not skipped, so generated JSON there will be parse-checked. `py_compile` will create `__pycache__/`, which `.gitignore` line 13 already ignores.
