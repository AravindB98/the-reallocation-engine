# CHANGE-BRIEF — data-titles-h1b-entry

- Author: Meena (meenuviji)
- Date: 2026-10-03
- Repo commit at time of writing: 015843d
- Branch: contrib/2026fa-meenuviji-data-titles-h1b-entry
- Status: original predictions (do not edit; append revisions at the bottom)
- Evidence base: `course/2026fa/submissions/meenuviji/recon/REALITY-REPORT.md`, `course/2026fa/submissions/meenuviji/recon/probe/PROBE-REPORT.md`

## 1. Career situation

An international MS Data Analytics student on an F-1 visa, not yet on OPT, applying for entry-level data-family roles: data analyst, BI analyst, data engineer, data scientist, and ML/AI engineer. The student will need an employer willing to file an H-1B later. The recipe is built for someone who applies across several neighboring data titles because they can't tell which of those titles a given employer has actually sponsored, and at what level.

## 2. Information asymmetry

The 80 Days CSV records sponsorship per company, not per role or SOC code. From the outside, "this company sponsors H-1Bs" hides two things this student needs to know.

1. **Which titles and which level.** Under a temporary keyword rule, 421 of the 1,557 companies with sponsorship data list at least one data-family title among their sponsored titles. For 171 of those 421, every data-family title is senior. A new grad who sees "Data Engineer" in `['Senior Data Engineer']` reads it as a match. It isn't one.
2. **How much evidence sits behind the rate.** 68 of those 421 show a 100% approval rate on 3 or fewer approvals. Sorting by `Approval_Rate` ranks thin evidence above deep evidence. A company with 2 approvals and 0 denials outranks one with 52 and 2.

Both counts depend on the classification rule in §5. When the rule changes, they will change, and they will be recomputed and recorded in the Revisions section.

Approval rate also answers a different question from the one this student is asking. It measures how often petitions that were filed got approved. It says nothing about whether this company will file one for this student.

## 3. Engine layers used

- **80 Days to Stay (sponsorship history only).** This is the core evidence. The CSV's funding columns (`total_funding`, `latest_funding_*`) are not used, because their provenance has not been checked.
- **The Cognitive Pivot (wage context only).** BLS OEWS national median wage for the student's target titles, shown in the human report. It is not scored.
- **Job-Ops (liveness as a gate concept only).** In the offline path, liveness is supplied as a fixture value. Running `npm run ats:liveness` live is optional and outside the tested path.

## 4. What I reuse (exact paths)

| What | Path | Note |
|---|---|---|
| Sponsorship data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Several recipes (`recipes/_shared.md`, `recipes/scan.md`) and `data/README.md` reference `SEC_DOL_H1b_data_mapped.csv`, which does not exist in the clone. The `_v3` file has the identical SHA-256 recorded in `SEC_DOL_H1b_data_mapped-audit.md`, so I use it and cite the hash. |
| Wage context | `data/bls/compact/soc_occupation_compact.csv` | National wages only, `oews_year = 2024`. |
| Scorer | `scripts/score/role-scorer.mjs` via `npm run score -- <roles.json> --out-dir <my folder>` | Used unmodified. Not copied or re-implemented. |
| Conformance | `node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` | Syntax and well-formedness only. |
| Input roles | A fictional persona I invent, with `@example.com` addresses and fictional postings | No real résumé, tracker, or contacts. Nothing is read from `private/`, `search/resume.json`, or `data/ats/`. |

## 5. What I'm adding, and why it belongs

All of it lives in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/`. The repo has no step that looks inside `top_job_titles_sponsored`, and the scorer receives sponsorship as one number. This prototype is the missing step between the CSV and that number.

**5a. Company match rule.** Name normalization follows the order used in the repo's own Form D normalizer (`sec-all-quarters.py:34`): strip legal suffixes as whole words first, then remove non-alphanumerics and lower-case. Stripping after punctuation removal would truncate names like "COSTCO".

| Result | Label | Action |
|---|---|---|
| Exact upper-case match, one row | record | continue |
| Normalized match, exactly one row | record (rule named in the output) | continue |
| Normalized match, two or more rows | — | STOP: company-match gate |
| No match | — | STOP: company-match gate. Never guess a nearest name. |

**5b. Data-family rule: phrase allowlist, not keyword substrings.** A sponsored title is data-family only if it contains one of a declared list of phrases tied to my targets, such as `data analyst`, `data engineer`, `data scientist`, `business intelligence`, `bi analyst`, `bi engineer`, `bi developer`, `analytics engineer`, `machine learning engineer`, `ml engineer`, and `ai engineer`. The final list lives in the prototype README.

Reason: the probe showed the substring rule catching Financial, Actuarial, IT Service Management, Product Support, and Quality Control analysts, and Database Administrators. For this user a **false positive is the worse error**: it tells them a company sponsors their kind of role, and they spend tailoring hours on a bad bet. A false negative only drops a company they could still find another way. I choose precision and log the known misses. The rule is `your-input`.

**5c. Seniority: three buckets.**

- **senior:** senior, sr, lead, staff, principal, director, manager, head, vp, or level III/IV/3+
- **mid:** level II / 2
- **entry-or-unmarked:** junior, jr, associate, new grad, level I, or no marker at all

"Unmarked" is not proof of entry level, and the report says so. Mid is a separate bucket because "Data Engineer II" isn't senior, but it usually expects experience a new grad doesn't have. Collapsing it into either side would mislead. The rule is `your-input`.

**5d. Sponsorship p and tier.** The p values are ordinal encodings, not calibrated probabilities.

| Evidence (record) | Tier passed to scorer | p |
|---|---|---|
| ≥1 entry-or-unmarked data-family title AND Total Approvals ≥ 5 | `Proven` | 0.7 |
| Data-family titles only mid or senior, OR Total Approvals < 5 | `possible` | 0.5 |
| Sponsorship record, but no data-family title | `possible` | 0.3 |
| No sponsorship record | `unknown` | null (vote dropped by the scorer, not zero-filled) |

The minimum of 5 approvals is my judgment, prompted by the 68 thin-evidence companies. Proven is set to 0.7, not 0.9, so that sponsorship alone can't reach Apply: 0.35 × 0.9 = 0.315 would clear the 0.30 threshold with zero fit.

**Labeling a rule applied to records.** The scorer accepts one source label per term. Because p is the output of my rule, the `sponsorship` term in `roles.json` is labeled `your-input`. The record values the rule consumed (approvals, denials, matched titles and their buckets) are written separately into the JSON log and the report, each labeled `record`. That way a reader can see the evidence and the judgment applied to it, and doesn't mistake one for the other.

**5e. Fit.** My own 0–1 rating per posting, labeled `your-input`. No model call.

**5f. Proposed, not built.**

- `[TODO: DEV]` A role-quality weight for the scorer. Not proposed with a number, because 15-2051 assigns Data Scientists and BI Analysts the same wage (112,590), so the wage signal can't separate two of my target titles.
- `[TODO: DATA SOURCE]` Title- or SOC-level sponsorship records (DOL LCA disclosure data). This would replace the title-list heuristic with records.

## 6. Deliberately excluded, with evidence

- **Form D samples.** 128 of 200 sample records are pooled investment funds. Each sample file covers only the last filing day of its quarter. Only 14 names match the 80 Days CSV after normalization, and only one of those (Databricks) has sponsorship data. A funding vote built on this would be noise presented as evidence. Source: `PROBE-REPORT.md` §C, `REALITY-REPORT.md` §5b–5c.
- **Role-quality weight.** It stays at 0.0, and I do not change it. The BLS median for each target title's SOC code appears in the human report as context, labeled `record`. Target titles with no title-field match in the BLS CSV are reported as "no SOC row", never mapped by guess.
- **`npm run ats:scan`.** It makes live network calls even with `--dry-run` (observed: 886 Databricks jobs fetched). It is not part of the offline path or any test.
- **`npm run bls:local-wage`.** There is no `.venv` in the clone, and it feeds nothing in the scorer.

## 7. Gates (where the run stops for a human)

The scorer silently treats a missing gate as 1.0. The prototype therefore refuses to write a role to `roles.json` unless both gate values are present.

| Gate | Testable condition | Checks | Human sees, to clear it |
|---|---|---|---|
| Company match | Exactly one CSV row matches by the §5a rule | the 80 Days CSV | Input name, candidate rows (name, city, state only), and which rule matched. The human picks a row or confirms "not in data". |
| Liveness | `liveness.factor` is present and numeric; ≤ 0.05 means Skip | fixture value, optionally `npm run ats:liveness -- <url>` output | Posting URL and how liveness was determined (fixture or live check, with date). |
| Timeline | `opt_start`, `window_days`, `hiring_lag_days` present; projected start falls within the OPT window → factor 1.0, otherwise 0.0 | persona inputs (`your-input`) | The dates and the arithmetic. All three inputs are mine, not records. |

Gate stops are written to my own output folder. The run does not write to `logs/gate-decisions/` or `data/verified/`, because neither exists.

## 8. Predicted failure cases and how I'll check each

Each case gets a fixture and an offline test. None of them invents a value.

| Case | Expected behavior | How I'll check |
|---|---|---|
| Company not in the CSV | Stops at the company-match gate with the input name. The role is not scored. | Fixture with an invented company name; the test asserts a non-zero exit and that no role was emitted. |
| Company matches more than one row after normalization | Stops at the gate and lists the candidates. | Fixture built from two CSV names that normalize identically (to be found by script). |
| Company in the CSV, but no sponsorship data | Tier `unknown`, p null, report says "no record ≠ does not sponsor". | Real CSV company with empty sponsorship columns; the test asserts p is null, not 0. |
| Only senior data-family titles | Tier `possible`, p 0.5, report names the senior titles. | Real company from the 171; the test asserts the tier and lists the matched titles. |
| Missing liveness or timeline value | Refuses to emit the role and names the missing field. | Fixture with the field removed; the test asserts the error message and that the role is absent from `roles.json`. |
| OPT window already closed | Timeline factor 0.0, Skip, arithmetic shown. | Fixture with a past `opt_start`. |
| Target title with no BLS row | Report shows "no SOC row". Scoring is unaffected. | Fixture title not in the BLS CSV. |

## 9. What I predict the prototype will get wrong on the first pass

- The allowlist will miss reordered or unusual titles such as "Analyst, Data", "Engineer – Data Platform", and "Insights Analyst". These are false negatives I've accepted, but I expect some to be companies I'd want.
- "Unmarked" titles will be treated as entry-level even when, in practice, they need several years of experience. Big companies often post "Data Scientist" with no level marker.
- The skip rate on my sample may come out below the 50% the engine calls healthy, because I'll be tempted to pick sample companies I already know sponsor.

## 10. Lifecycle stage I'm aiming for

`RUNNABLE-SAMPLE`: one documented command, real repo data, both outputs written, offline tests passing, and conformance plus `npm run verify` passing on a fresh clone of my branch.

I stay at `SPECIFIED` if any of these fail: the fresh-clone run, the offline tests, or conformance.

---

## Revisions

### Revision 1 — 2026-10-03 (during Phase 3b build)
- §7 timeline gate corrected: a projected start before opt_start is a deferred start (noted, factor 1.0), not a failure; only a projected start after opt_start + window_days fails. Original rule treated early starts as failures, which would have gated every role for a pre-OPT student applying months ahead. Found when the build needed an artificial future as_of to produce any non-gated result.
- §5d tier rows made unambiguous with explicit precedence: (1) no record -> unknown, null; (2) record but no data-family title -> possible, 0.3; (3) entry-or-unmarked data-family title AND approvals >= 5 -> Proven, 0.7; (4) otherwise -> possible, 0.5.
- §5c level numbers clarified: standalone tokens anywhere in the title; I/1 entry, II/2 mid, III/IV/3+ senior.
- §5a normalization: suffix stripping follows the repo's list and order (sec-all-quarters.py:10-24), but punctuation removal strips all non-alphanumerics, which differs from the repo normalizer.
- §4 persona: no search/examples persona fits a pre-OPT F-1 data student (closest, Priya Nair, is already on OPT). run-config.json holds run inputs only.
- §2 headline counts will be recomputed under the final rules after the build and recorded in a later revision.

### Revision 2 — 2026-10-03 (after build, final rules)
- §2 headline counts recomputed under the final rules in scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json, across all 30,369 CSV rows: 248 companies list at least one data-family sponsored title (probe's substring rule: 421); 94 of those 248 list only senior data-family titles (probe: 171); 39 of those 248 show a 100% approval rate on 3 or fewer approvals (probe: 68). The stricter phrase allowlist removed false positives (financial, actuarial, QC analysts, DBAs), so all three counts fell; the seniority share is 38% (94/248) versus 41% under the probe rule. Source: course/2026fa/submissions/meenuviji/recon/recipe-path-check.md.

### Revision 3 — 2026-10-03 (final audit)
- §4 path correction: "data/README.md" should read "data/80-days-to-stay/data/README.md". The original §4 text is left unchanged as the record of the prediction.
