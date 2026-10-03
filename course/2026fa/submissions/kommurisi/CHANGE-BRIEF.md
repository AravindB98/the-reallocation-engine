# CHANGE-BRIEF — data-role-sponsor-match

**Student:** Siddi Kommuri (`kommurisi`) · **Branch:** `contrib/2026fa-kommurisi-data-role-sponsor-match` · **Date:** 2026-10-03

> **Process note (honest record).** The assignment asks for this brief *before* building. In this session the AI assistant (Claude Code) explored the repo and data, ran the baseline commands, then wrote the prototype, and only drafted this brief after the first prototype run. The predictions in §5 are the ones the exploration step pointed to: the CSV profiling, the scorer read-through, and the baseline runs listed in `FRICTIONAL.md`. They have **not** been edited to match the results. What the run then showed is in §6, *Revisions*, added afterwards. [STUDENT: add your own prediction here, in your own words and dated, before you re-run anything.]

## 1. Career situation

An F-1 student in a STEM-designated **MS Information Systems** program in Boston, in the final semester (graduating Dec 2026). They will apply for post-completion OPT and target **early-career data engineering, analytics engineering, and BI roles**: O*NET 15-1243.01 Data Warehousing Specialists, 15-2051.01 Business Intelligence Analysts, 15-2051.00 Data Scientists. They will need an employer that sponsors an H-1B *for that kind of role*.

The committed run uses a **persona** with these facts and invented dates (OPT 2027-01-15 → 2028-01-14, 0/90 unemployment days used). No real personal data.

**Engine layers:** 80 Days to Stay (sponsorship + funding), Job-Ops (ATS scan + liveness), Cognitive Pivot (BLS/O*NET, as context only).

## 2. Reuse (exact paths)

| Reused | Path |
|---|---|
| Sponsorship + funding source | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` |
| Form D samples | `data/sec/form-d/processed/sample/*.sample.json` |
| Role-quality context | `data/bls/compact/soc_occupation_compact.csv` |
| Posting discovery | `npm run ats:scan -- --dry-run` (`scripts/ats/scan.mjs`) |
| Page liveness | `npm run ats:liveness -- --file …` (`scripts/ats/check-liveness.mjs`) |
| Combiner | `scripts/score/role-scorer.mjs` via its CLI (not copied) |
| Input shape | `data/examples/ch11-roles.json` |

**Proposed (not in the repo yet):**
- A *title-level* sponsorship check. The repo's sponsorship vote is company-level, and a data student needs to know whether *data* roles were sponsored.
- A second, API-level liveness observation for Greenhouse postings.

Both live in `scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/`.

## 3. Gates and what a human must see

| Gate | Human needs to see |
|---|---|
| Visa timeline (gate) | runway days, the assumed hiring lag, and the factor, with the dates to check against the EAD/I-20 |
| Liveness (gate) | both observations (page check + Greenhouse API) and which one decided |
| Company/sponsorship resolution | the CSV row and line, the recorded titles, which matched, and every Unresolved reason |
| Scorer consistency | that the scorer treated the profile as needing sponsorship |
| Adequacy | the report's "cannot verify" list, read before acting |

## 4. Predicted failure cases and how each is checked

1. **Company not in the CSV** (a startup, or a name spelled differently). Check: exact normalized match only. Expect `no-company-match` with no fuzzy guess. Test with a typo ("Klavyio") and a made-up company.
2. **Company in the CSV twice** (CORP vs LLC). Check: count rows per normalized key. Expect `ambiguous-company-match` with the candidates listed. Test with a fixture pair and the real ABSCI CORP / ABSCI LLC.
3. **Blank sponsorship columns.** Only 1,557 of 30,369 rows have them. Expect `no-sponsorship-record` (Unresolved), not p = 0.
4. **Posting that 404s.** Expect liveness factor 0 → Skip (gated).
5. **OPT date already past.** Expect exit 3, nothing scored.
6. **SOC row missing or a blank field.** Expect "missing", never a filled value.

## 5. Prediction about the first pass

- The **title list will be too short** to prove much. Most big sponsors will land in "Likely", because `top_job_titles_sponsored` holds about five titles.
- A keyword match will **misfire on "analytic"** (chemistry titles in the biotech/pharma rows).
- The **timeline gate will not discriminate** for a pre-graduation persona. Every role will get the same factor, because there is one hiring-lag number.

## 6. Revisions (added after the run, 2026-10-03; §1–5 left as written)

- §5 bullet 1 held: Databricks (1,640 approvals) and Toast (150) both landed in **Likely**. Klaviyo was the only Proven, via "Business Intelligence Engineer".
- §5 bullet 2 held in the CSV ("Scientist, Analytical Chemistry", Continuus Pharmaceuticals). The exclude list and a test cover it.
- §5 bullet 3 held: factor 1.0 for every role in the worked run. Only the break run with lag 120 moved it (0.617).
- **Not predicted:** the repo's page-level liveness check reported a **nonexistent** Greenhouse job id as **active**, because it redirects to a careers search page that has Apply buttons. Added the Greenhouse API cross-check.
- **Not predicted:** the maintained scorer reads `"…work authorized (EAD)"` as *no sponsorship needed* and zeroes the sponsorship weight. Added a guard (exit 4) and a neutral profile string.
- **Not predicted:** a stale `role-scores.json` could survive a blocked re-run in the same out-dir. Fixed and tested.
- **Not predicted:** Databricks *was* in a Form D sample (two Q4-2025 filings). The samples are not useless, just thin.
