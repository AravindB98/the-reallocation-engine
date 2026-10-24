# Salary floor for a software co-op that may convert — human card

**Audience:** an international master's student on F-1 whose software or full-stack co-op may turn into a full-time offer, and the advisor who helps them prepare for the salary conversation.
**Agent twin:** `recipes/cases/2026fa/arundhatik26-salary-floor-swe-15-1252.md`
**Status:** DRAFT (one real sample run done on 2026-10-16; 5 typed TODOs are still open).

## Executive summary

Before you say a salary number, this card tells you the lowest number the government's wage data supports for a software job, and whether each employer's own record of sponsored salaries sits above it. It gives national figures only. For many large banks it can tell you nothing, because they are not in the dataset. When that happens it says so; it never fills in a guess.

## Purpose

Answer two questions per employer, before the "what are your salary expectations?" conversation:

1. **What is my floor?** The 25th percentile of the national BLS wage band for the job code the offer will likely be filed under: **$103,050** for Software Developers (15-1252), May 2024.
2. **Does this employer's record sit above it?** The employer's median sponsored salary from the 80 Days to Stay dataset, or a plain statement that there is no record.

## What it can verify

- The national BLS 10th to 90th percentile wages for Software Developers (15-1252) and Web Developers (15-1254), from a committed file with a recorded fingerprint (SHA-256).
- Whether an employer has a row in the 80 Days CSV, whether that row is blank, and its median sponsored salary and line number.
- That a job title contains a keyword ("web", "front end", "back end") that O*NET lists under the lower-paid Web Developers code.
- Which similarly named companies were found and **not** used.

## What it cannot verify

- **Boston pay.** The repo's Boston wage data is missing, so every number is national. Boston pays more, so treat the floor as conservative.
- **Big banks.** Goldman Sachs, Morgan Stanley, JPMorgan Chase, Citi, State Street, BlackRock and MSCI are not in the dataset at all; Google's and Fidelity's rows are blank. Missing means *this source can't tell you*, not *they don't sponsor*.
- **Software pay at a specific employer.** The employer median mixes every sponsored role (directors, analysts, engineers). It is context, not your floor.
- **The job code the employer will actually file**, or the legal H-1B prevailing wage for it.
- **Co-op hourly pay, bonus, equity.**

## How to read the result

| Verdict | Means | What to do |
|---|---|---|
| COMPANY RECORD ABOVE FLOOR | the employer's all-roles median is above your floor | use the floor as your lowest number; don't anchor on the median |
| COMPANY RECORD BELOW FLOOR | the all-roles median is below your floor | ask what the software band is before naming a number |
| NO COMPANY NUMBER | missing or blank in the dataset | use the BLS floor only; ask alumni or your co-op advisor |
| STOP: AMBIGUOUS NAME | two rows match the name | pick the right legal entity yourself, then re-run |
| Code risk flag | the title could be filed as Web Developers (floor $63,140) | ask which job code the offer or LCA uses |

## Annotated commands

The sample run (11 employers, fictional persona):

```bash
python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py
```

Your own list. Copy `inputs/sample-targets.json`, put each employer's **exact** 80 Days name in `dataset_name`, never put your real name in it:

```bash
python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py --input my-targets.json --out-dir private/salary-floor
```

Check a posting is still live before comparing against it:

```bash
npm run ats:liveness -- "<posting-url>"
```

Tests (real repo data, 13 tests including break attempts):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-salary-floor/tests -v
```

## Human gates

- **G1:** read the "similar names not used" list and confirm none is your employer.
- **G2:** if a title is flagged, find out the job code before trusting the floor.
- **G3:** check the start date fits your OPT window with your international student office.
- **G4:** only compare against a posting that the liveness check calls `active`.
