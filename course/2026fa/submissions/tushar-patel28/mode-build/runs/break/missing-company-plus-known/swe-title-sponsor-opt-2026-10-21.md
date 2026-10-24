# Sponsored-title and OPT-timeline check — sample run 2026-10-21

## Executive summary

**What this is.** A check of 2 job openings for one fictional international student (MS in software engineering, work permit starting in January). For each opening it asks two things: does the company's public visa-sponsorship history list a job title in the student's field, and does the start date fall inside the student's work-permit window? It then runs the project's existing scoring tool and suggests a next step for each opening.

**Why read it.** It shows, opening by opening, which numbers come from public data and which come from the student's own definitions, so the student can see exactly why each opening was ranked the way it was and what they still have to check by hand.

**What it found.** 2 openings were scored and 0 could not be scored because the start date was missing or invalid. The scoring tool said: Consider 2. Suggested next steps: network into the company 1, tailor an application 1. For 1 openings the company's sponsorship history is simply unknown (no match, no trace, or more than one possible match). That is not evidence the company refuses to sponsor, so the next step there is a conversation, not a skip. An opening reaches "Apply" only when a person has checked public labor-filing records and the live posting, and written that evidence down; none was supplied in this run, so no opening is marked Apply. Openings whose start date is up to 30 days before the work permit begins, or 61 to 90 days after it, are kept but flagged as risky. Whether a posting is still open was not checked except where a person recorded it. The date arithmetic is for planning only and is not immigration advice.

## How to read the labels

- `[record]` came from a data file or from the scorer's own output, unchanged.
- `[your-input]` is the student's definition or input: the role list, the dates, the title keywords, and every mapping from evidence to a number.
- `[model-judgment]` would mark an AI judgment. None is used in this run.
- A value derived from a record by one of the student's definitions carries `[your-input]`, because the definition is the part a human must check.

## Decisions

| Role | Family | Company evidence (G1) | Family in top titles | Start vs EAD | Timeline factor (G2) | Liveness (G3) | G4 human evidence | Votes sent | Composite | Scorer (machine → final) | Shown decision | Next action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Zyxwv Quantum Widgets, Inc. — Software Engineer, New Grad | SWE [your-input] | not-found [record] | not-applicable [your-input] | 17 days (0-60-days-after) [your-input] | 1 [your-input] | 1 assumed, not checked [your-input] | none | sponsorship Unknown p=none (no vote) [your-input]; fit p=0.8 [your-input] | 0.240 [record] | Consider [record] | Consider [your-input] | network into the company [your-input] |
| Databricks, Inc. — Software Engineer, New Grad | SWE [your-input] | matched-h1b [record] | in-top-titles [your-input] | 17 days (0-60-days-after) [your-input] | 1 [your-input] | 1 assumed, not checked [your-input] | none | sponsorship Likely p=0.6 [your-input]; fit p=0.8 [your-input] | 0.450 [record] | Consider [record] | Consider — blocked at G3 until npm run ats:liveness is run by a human [your-input] | tailor an application [your-input] |

## Audit trace per scored role

Arithmetic exactly as the scorer printed it `[record]`. Votes are added; liveness and timeline multiply.

- **missing-co-swe** — `(0.8·0.3) × 1 × 1 = 0.240` → Consider: composite 0.240 in the Consider band [0.2, 0.3)
- **databricks-swe** — `(0.6·0.35 + 0.8·0.3) × 1 × 1 = 0.450` → Consider: above threshold (0.450) but one soft spot: sponsorship tier "Likely"

## Human evidence for Apply (G4)

An LCA is evidence of an intent to file, not an approved visa. [your-input] Entries in the overrides file: 0 [your-input].

No entries. No real labor-filing check has been done for this list, so no opening can be Apply. Writing evidence here without doing the check would be an invented record.

## Name matches a person must confirm (G1)

Exact name matching can attach a namesake. Confirm each matched row is the company you mean.

| Role | Your company name | Normalized key | Status | Matched row(s) `[record]` |
|---|---|---|---|---|
| missing-co-swe | Zyxwv Quantum Widgets, Inc. [your-input] | zyxwvquantumwidgets [your-input] | not-found [record] | none |
| databricks-swe | Databricks, Inc. [your-input] | databricks [your-input] | matched-h1b [record] | DATABRICKS INC (SAN FRANCISCO, CA; row 7249) |

## Top sponsored titles behind each family check

- **databricks-swe** (SWE): a title in the SWE family appears in the company's top sponsored titles (a title match only; it verifies nothing about the visa's job category) [your-input]. Top titles [record]: ['Software Engineer', 'Senior Software Engineer', 'Solutions Architect', 'Specialist Solutions Architect', 'Senior Solutions Engineer']; matched [your-input]: ['Software Engineer', 'Senior Software Engineer']

## Wage context (BLS) — not part of the score

context only: role_quality weight is 0 in the scorer, so wages do not enter the score [record]. The family-to-occupation mapping is `[your-input]`; the wage figures are `[record]`.

| Family | SOC | Occupation | Median annual wage | OEWS year |
|---|---|---|---|---|
| SWE | 15-1252.00 (BLS 15-1252) | Software Developers [record] | $133,080 [record] | 2024 [record] |
| AI | 15-1221.00 (BLS 15-1221) | Computer and Information Research Scientists [record] | $140,910 [record] | 2024 [record] |
| AI | 15-2051.00 (BLS 15-2051) | Data Scientists [record] | $112,590 [record] | 2024 [record] |
| Cloud | 15-1241.00 (BLS 15-1241) | Computer Network Architects [record] | $130,390 [record] | 2024 [record] |
| Cloud | 15-1244.00 (BLS 15-1244) | Network and Computer Systems Administrators [record] | $96,800 [record] | 2024 [record] |
| Cloud | 15-1299.08 (BLS 15-1299) | Computer Systems Engineers/Architects [record] | $108,970 [record] | 2024 [record] |

Wages are published per BLS code. Where it is broader than the O*NET code (e.g. 15-1299 for 15-1299.08), the figure is for the whole broader occupation ("Computer Occupations, All Other"), not the detailed title.

## Does the title check separate companies?

Across all 1557 companies with sponsorship data `[record]`, a title in each family appears in the top titles of: SWE 511, AI 86, Cloud 68 companies; 967 show none of the three `[your-input]` (crosswalk applied to records). Unreadable title lists: 0 `[record]`.

## What this run cannot tell you

- Whether a company sponsors **this** occupation. The data has no SOC code, only a few top titles per company.
- How much a company sponsors, or how recently. There are no filing years, and the approval counts may be double-counted, so they are not used.
- Whether a posting is real or still open. Liveness was assumed, not checked (G3).
- Anything about a company that is not in the data, has no sponsorship trace, or matches more than one row. These are unknown, not "does not sponsor".
- Immigration eligibility. Timeline factors are planning arithmetic, not immigration advice. Confirm OPT dates and the unemployment allowance with your DSO.

## Run record

- Recipe: tushar-patel28-swe-title-sponsor-opt v0.1.0 [record] · run date 2026-10-21 [record] · mode sample (offline; no network calls) [your-input]
- Command: `python3 scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/title_sponsor_opt.py --roles course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/roles-missing-company-plus-known.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/` [record]
- Input `csv`: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` [record] sha256 `eccdee2addf472b1…`
- Input `bls`: `data/bls/compact/soc_occupation_compact.csv` [record] sha256 `bac5acf77ca2d252…`
- Input `persona`: `scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/sample/persona.json` [your-input] sha256 `810ced8c1fef7115…`
- Input `roles`: `course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/roles-missing-company-plus-known.json` [your-input] sha256 `aecc1688fbb864f7…`
- Input `overrides`: `scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/sample/overrides.json` [your-input] sha256 `6c8f8f8f69073a37…`
- Input `crosswalk`: `scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/crosswalk.json` [your-input] sha256 `0ec0579f29dc4545…`
- Input `mappings`: `scripts/contrib/2026fa/tushar-patel28-swe-title-sponsor-opt/mappings.json` [your-input] sha256 `a474aa5b9f8edc41…`
- Reused maintained code (normalizer): `scripts/sec/sec-all-quarters.py::normalize_company_name` [record]
- Reused maintained code (h1b_presence): `scripts/sec/validate-h1b-join-sample.py::h1b_present` [record]
- Scorer: `npm run score -- course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/roles.json --out-dir course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known` exit 0 [record]; stdout: `✓ scored 2 roles → Apply 0 · Consider 2 · Skip 0 (skip 0%)`
- Guards: passed: 1 sponsorship term(s), all weight > 0; passed: scorer multiplied exactly the gates sent; every timeline=0 role is a gated Skip [record]
- Scorer outputs: `course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/role-scores.json`, `course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/role-scores.md` [record]
- Agent log: `course/2026fa/submissions/tushar-patel28/mode-build/runs/break/missing-company-plus-known/swe-title-sponsor-opt-2026-10-21.json` [record]
