# Worked run: is-funded-sponsor-triage v0.1.0

## Executive summary

I ran the prototype once on the shipped data with a fictional persona and nine demo postings, then tried to break it three ways. It held out every case where evidence was missing instead of guessing, and the existing scorer produced Apply ×4 / Skip ×1. Hand-checking one company against the source CSV matched exactly. The run also exposed things I had not planned for: a large consultancy labeled as "funded" gets an Apply, the demo skip rate is unhealthily low, and the repo's scorer misreads "work authorized" in a profile as "doesn't need sponsorship".

## Inputs

All inputs are fictional or public. No real personal data is used.

- **Persona** `search/examples/is-ms-2027-funded-undecided/persona.example.json` (`your-input`). MS Information Systems, CIP 14.0903, program end 2027-05-15, OPT start assumed 2027-06-01, 90 unemployment days, 0 used, hiring lag assumed 60 days, self-rated fit BA 0.8 / DA 0.7 / PA 0.6 / IT consultant 0.6.
- **Postings** `.../fixtures/postings.sample.json` (`your-input`). Nine invented postings at companies named in the CSV, plus one fictional company. Liveness values are demo inputs.
- **Data** (`record`): `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` and `data/sec/form-d/processed/sample/*.sample.json`.
- **Rules** `.../config.json` (`your-input`).

## Commands and real output

```
$ python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02
✓ triage: 9 postings → 5 scored · 4 held out (timeline gate 1.0) → course/2026fa/submissions/yudanzhou/runs/triage\roles.json
✓ scored 5 roles → Apply 4 · Consider 0 · Skip 1 (skip 20%)
  course\2026fa\submissions\yudanzhou\runs\triage\role-scores.json  +  course\2026fa\submissions\yudanzhou\runs\triage\role-scores.md
  course/2026fa/submissions/yudanzhou/runs/triage/triage-log.json  +  course/2026fa/submissions/yudanzhou/runs/triage/triage-report.md
```

From `runs/triage/role-scores.md` (the existing scorer, unedited):

```
| SITE TECHNOLOGIES INC — Business Analyst | 0.555 | **Apply** | composite 0.555 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.8·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| MOLOCO INC — Data Analyst II | 0.525 | **Apply** | composite 0.525 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.7·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| COPART INC — Product Analyst | 0.495 | **Apply** | composite 0.495 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| DELOITTE CONSULTING LLP — Technology Consultant | 0.495 | **Apply** | composite 0.495 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| TREDENCE INC — Consultant - Analytics | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [your-input]; fit 0.6·0.3 [your-input] × liveness 0[your-input]×timeline 1[your-input] |
```

Held out by the prototype (from `runs/triage/triage-report.md`):

```
| p5 Data Analyst | ALPHONSO INC | data_analyst | liveness-unchecked | approvals 130, denials 6; ... | held out | Run `npm run ats:liveness -- <url>`, record the result, re-run. |
| p6 Business Analyst | 123 SEE INC | business_analyst | no-h1b-record | approvals blank (no record) | Series B 2025-07-01 | held out | Networking list (3-hour block) ... |
| p7 Data Analyst | Example Fictional Analytics Co | data_analyst | no-company-row | — | — | held out | Networking list: company not in the CSV at all ... |
| p9 Data Engineer | PROVE IDENTITY INC | — | off-target-title | — | — | held out | Skip: title is outside my four target families. |
```

Arithmetic for the top row, so it can be checked by hand: (0.9 × 0.35) + (0.8 × 0.3) = 0.315 + 0.24 = **0.555**, then × liveness 1 × timeline 1 = 0.555 ≥ 0.3 → Apply.

## Verified vs. inferred, line by line

| Value in the run | Label | Where it came from |
|---|---|---|
| 27,874 funded / 1,532 with approvals / 131 funded ≤24 months | `record` | counted from the CSV by the script |
| Family counts DA 38 · BA 31 · IT 21 · PA 4 | `record` (counts) on `your-input` keyword rules | CSV titles × `config.json` |
| SITE TECHNOLOGIES: 148 approvals, 2 denials, Series A 2023-07-14 | `record` | CSV row 24379 |
| 123 SEE INC: approvals blank | `record` (of absence) | CSV. Reported as "no record", not 0 |
| Sponsorship p = 0.9 (Proven) | `your-input` | my mapping: ≥10 approvals + family match → 0.9 |
| Fit 0.8 / 0.7 / 0.6 | `your-input` | self-rating in the persona |
| Liveness 1 / 0 | `your-input` | demo values. **Not** a real check |
| Timeline factor 1.0 | `your-input` | persona dates + 60-day lag assumption; the script only does the date arithmetic |
| "stale" funding flags | `record` date + `your-input` threshold (24 months) | |
| Form D: 0 of 7 resolved companies found in samples | `record` | shipped samples only |
| Model judgment | none | no LLM call anywhere in the prototype |

## Verification: how I know the output is real

1. **Hand cross-check against the source CSV:**
   ```
   $ grep -n "^SITE TECHNOLOGIES INC," data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
   24379:SITE TECHNOLOGIES INC,Other Technology,...,Series A,2023-07-14,148.0,2.0,98.66666666666669,83096.0,"['Business Analyst', 'Product Owner', 'Oracle Consultant', 'Software Engineer', 'Full Stack Developer']"
   ```
   (Officer names and phone elided.) 148 / 2 / Series A 2023-07-14 / "Business Analyst" all match the report.
2. **Tests:** `Ran 11 tests … OK` from a clean checkout (see `TEST-REPORT.md`, `runs/01-clean-checkout-output.txt`).
3. **Two methods, one number:** my month-based count of funded sponsors "within 24 months" gives **131**. An earlier date-cutoff count (`latest_funding_date >= 2024-10-02`) gave **130**. The difference is a definition (calendar months vs exact days), not a bug. The report uses the script's 131.

## Attestation

- Recipe: is-funded-sponsor-triage v0.1.0
- By: yudanzhou · 2026-10-02

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `triage.py --today 2026-10-02` | 9 → 5 scored, 4 held out; Apply 4 · Skip 1 | blanks and unmatched names held out; dead posting gated to 0 |
| `python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v` | `Ran 11 tests … OK` | all pass offline |
| **Break 1:** `triage.py --csv data/does-not-exist.csv --today 2026-10-02` | `✗ STOP: G1 data gate: CSV not found at data/does-not-exist.csv`, `exit=2` | hard stop, no output |
| **Break 2:** postings with variant spellings `"Moloco, Inc."` and `"moloco"` (title "Data Scientist") | `Moloco, Inc.` → matched, Apply 0.525 (same as `MOLOCO INC`); `moloco` + Data Scientist → `off-target-title` | suffix/punctuation-insensitive match, no fuzzy guess; Data Scientist not a target family |
| **Break 3:** existing scorer with a profile `{"needs_sponsorship": true, "authorization": "F-1 STEM OPT — work authorized (EAD)"}` | `Profile does NOT require sponsorship → sponsorship weight 0.` | should require sponsorship. **Upstream scorer bug**, see below |

### Did not test
- Any live posting, or a real `npm run ats:liveness` run (needs network + Playwright browsers).
- The scorer with my persona as `--profile`. I deliberately don't pass one (Break 3).
- Whether any company hires OPT graduates or is in E-Verify (no data).
- Full Form D quarters (not shipped).
- Behaviour on macOS/Linux (only run on Windows 11).

### Broke during testing, fixed
- `UnicodeEncodeError: 'charmap' codec can't encode character '✓'` on the first run. The Windows console is cp1252. Fixed in `triage.py` `main()` by reconfiguring stdout/stderr to UTF-8.
- `npm run verify` failed until `pyyaml` was installed for `python3` (not `python`) and `core.autocrlf=false` was set. These are environment issues, not code (FRICTIONAL #4–5).

## Reflection

**What worked.** The "held out" design is the core of this recipe and it behaved as predicted. Four of nine postings had missing or unchecked evidence, and none of them was given an invented score. Reusing the existing scorer meant every Apply/Skip comes with the scorer's own audit trace.

**What the recipe or prototype got wrong or missed:**
- **Deloitte gets an Apply.** The tier rule sees 8,810 approvals and a "Series C" label and maps it to Proven. But this student prefers *funded startups*, and Deloitte is neither a startup nor plausibly "Series C". My recipe treats "has a funding date" as "funded company", and that is too loose. SITE TECHNOLOGIES (incorporated 2023, 148 approvals) may be a staffing firm for the same reason.
- **Skip rate 20%**, below the ~50% the scorer calls healthy. I picked demo postings at companies I already knew sponsored, so the sample is biased toward Apply. A real list would skip more.
- **Prediction check (§6):** the family counts did shift from my first quick count (DA 34→38, BA 21→31, IT 22→21) once keywords like "business systems analyst" and the "tax" exclusion were added. The prediction held: classification depends on keyword choices, and these numbers are only as good as `config.json`.
- **My own prediction held too:** 123 SEE INC (Series B, July 2025) has no H-1B record. It is exactly the young funded startup I'd want, and the prototype correctly sends it to networking rather than Skip.
- **Found a bug outside my scope:** `role-scorer.mjs`'s `applyProfile` decides "needs sponsorship" by regex on `authorization` and ignores `needs_sponsorship`, so "work authorized" text flips sponsorship weight to 0. I did not change the shared scorer (outside my namespace). It should be reported upstream.

**One concrete next improvement.** Add a `company_type` check before tiering: flag rows where approvals are very high relative to company age (e.g. >50 approvals within 3 years of incorporation) or where the name matches a consultancy/staffing pattern, and demote those to Consider with the reason shown. Rule in `config.json` (`your-input`), with a test pinned on DELOITTE CONSULTING LLP and SITE TECHNOLOGIES INC.
