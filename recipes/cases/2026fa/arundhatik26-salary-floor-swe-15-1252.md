---
status: DRAFT          # one real sample run done (2026-10-16), but 5 typed TODOs are open, so not SPECIFIED
todos_open: 5
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# Co-op → Full-Time Salary Floor for Software Roles (F-1, SOC 15-1252)

## Executive summary

This is a step-by-step recipe for an international master's student whose software co-op may turn into a full-time offer. Before the salary conversation, it answers: what is a realistic lowest acceptable salary, and does this employer's own record of sponsored salaries sit above it? It uses government wage data and a 30,000-company sponsorship dataset already in the repository. On a sample of eleven employers it found that four (State Street, JPMorgan Chase, Fidelity, and even Google) have no usable salary record, so for them it gives only the government number and says so; a wider check found most large banks and asset managers are absent from the dataset entirely. It also found that a "Front End" or "Back End" job title can be filed under a lower-paid government job code, about $40,000 lower at the floor. It gives a national number only: local Boston wage data is not in the repository.

## Purpose

**Who:** an F-1 master's student (e.g. MS Information Systems, STEM) on a software or full-stack co-op under CPT, graduating in Dec 2027 or Apr 2028, who expects or hopes the co-op converts to a full-time offer that will need OPT, then H-1B.

**When to use:** before you state a salary expectation (co-op return-offer talk, recruiter screen for a new-grad role), and again when an offer letter arrives.

**What it does:** for each target employer it prints

1. the national BLS wage band for the job code you expect the offer to be filed under, and your **floor** (the 25th percentile of that band);
2. the employer's 80 Days record: its median sponsored salary, or why there isn't one;
3. a flag when the job title could be filed under the lower Web Developers code (15-1254) instead of Software Developers (15-1252).

**What it does not do:** tell you what to ask for, predict an offer, or produce a Boston number.

## Source Inventory

| Source | Exact path / command | What it gives | Label |
|---|---|---|---|
| BLS OEWS national, May 2024 | `data/bls/oesm24nat/national_M2024_dl.xlsx` (sheet `national_M2024_dl`, columns `OCC_CODE`, `O_GROUP`, `A_PCT10`…`A_PCT90`) | wage percentiles for 15-1252 and 15-1254 | `record` |
| BLS / O*NET compact table | `data/bls/compact/soc_occupation_compact.csv` (`bls_soc_code`, `annual_median_wage`, `alternate_titles_sample`) | cross-check of the median; O*NET alternate titles showing "Back End Developer", "Front End Engineer" under 15-1254 | `record` |
| 80 Days to Stay | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (`company_name`, `Total Approvals`, `median_salary_offered`, `top_job_titles_sponsored`) | employer's median sponsored salary across **all** its sponsored roles | `record` |
| Mode script | `python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py --input <targets.json> --out-dir <dir>` | the run (stdlib only, no network) | — |
| Mode tests | `python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-salary-floor/tests -v` | 13 tests on the real data, including break attempts | — |
| Existing local-wage script | `npm run bls:local-wage -- --metro "Boston-Cambridge-Newton, MA-NH" --soc 15-1252` | would give a Boston number; **today it stops** (see TODO 1) | — |
| Existing liveness script | `npm run ats:liveness -- <job-url>` | gate G4 only | `record` |
| Repo checks | `npm run verify`, `npm run doctor` | conformance, private-data check | — |

**Floor rule (closed DEFINE):** floor = **`A_PCT25`** of the claimed SOC, national. Reason (student, chosen from options offered): *a floor for an entry-level hire*. The BLS band covers all experience levels, so its 25th percentile is a floor, not a target.

## Proposed additions

1. `[TODO: DATA SOURCE]` **Boston metro wages.** Commit `data/bls/local-wage/metro_oews.csv`, `bea_rpp.csv`, `bls_bea_msa_crosswalk.csv`. `scripts/bls/README.md` says these are committed; `git log --all -- data/bls/local-wage` shows they never were, so `npm run bls:local-wage` cannot run on any clone. *Why it belongs:* the national 25th percentile understates Boston pay; the recipe for it already exists (`recipes/local-wage-adjustment.md`).
2. `[TODO: DATA SOURCE]` **DOL OFLC prevailing-wage levels** (FLC Data Center, Level I–IV) for 15-1252 / 15-1254 in the Boston-Cambridge-Newton area. *Why:* an H-1B employer must pay at least the prevailing wage for the filed code and level. That is a legal floor, which is stronger than any percentile; this repo has no OFLC data.
3. `[TODO: DATA SOURCE]` **DOL LCA disclosure wages per employer per SOC.** *Why:* 80 Days' `median_salary_offered` mixes all of an employer's sponsored roles (Thermo Fisher's includes directors). LCA rows give software-only offered wages per employer, which would fix the biggest weakness of this mode.
4. `[TODO: DEV]` **Title → SOC lookup from the full O*NET Alternate Titles file**, replacing the keyword rule (`web | front end | back end`) in `salary_floor.py`. Handoff: every title in the sample input resolves to a list of candidate SOCs from the O*NET file, with the file's SHA-256 in the log.
5. `[TODO: APPROVE]` **Gate G2 sign-off format.** A named human (the student) records which SOC the offer or LCA actually uses, logged in RUN_LOG. Until the first logged decision, G2 is cleared by hand only.

Output from any of these is **proposed**; nothing in the worked run comes from them.

## Inputs

`targets.json` (sample: `scripts/contrib/2026fa/arundhatik26-salary-floor/inputs/sample-targets.json`, fictional persona):

```json
{
  "persona": "<fictional or anonymized>",
  "rules": {"floor_percentile": "A_PCT25", "want_local_metro": false},
  "targets": [{"company": "Toast", "dataset_name": "TOAST INC",
               "offer_title": "Software Engineer", "soc": "15-1252"}]
}
```

`dataset_name` is the **exact** 80 Days name you looked up. The script never guesses names.

## Phase Gates

Gates are hard stops. A failed gate is never averaged into anything.

| Gate | Testable condition | Pass | Fail | Cleared by |
|---|---|---|---|---|
| G1 Name match | `eighty_days.status` is `matched`, `blank-record` or `not-in-dataset`, **and** a human has read every name under "Similar names found but NOT used" and confirmed none is the same employer | use the record (or report its absence) | `ambiguous` → stop for that employer; a near-miss that *is* the employer → fix `dataset_name`, re-run | student |
| G2 Job code | the SOC on the offer letter or LCA is known; if `code_risk` is set, the human confirms which code applies | use that code's floor | code unknown → report **both** floors, use neither as "the" floor | student (TODO 5) |
| G3 Visa timeline | the full-time start date falls inside the work-authorization window for the student's graduation scenario (OPT starts after the program end date; H-1B lottery is in March) | the floor matters for this offer | outside the window → stop: salary is not the question yet | student, checked with OGS (not scripted here) |
| G4 Liveness (only when comparing against a posting) | `npm run ats:liveness -- <url>` returns `active` | compare | `expired` or `uncertain` → do not use the posting | script + student |

## Steps

1. `npm run verify && npm run doctor`. Stop on failure.
2. Look up each employer's exact name in the 80 Days CSV and write `targets.json`.
3. Run the mode script. Read the stdout line per employer.
4. Clear G1: read the near-miss list in `report.md`.
5. Clear G2 for every employer with a code-risk flag.
6. Clear G3 by hand for each graduation scenario.
7. Append the RUN_LOG entry (template below).

## What it can and cannot verify

| Can verify (from a record) | Cannot verify |
|---|---|
| National BLS 10th–90th percentiles for 15-1252 and 15-1254, May 2024, with file SHA-256 | Boston pay (local-wage data not in repo, TODO 1) |
| That two repo files agree on the national median (test) | The H-1B prevailing-wage level for this job (TODO 2) |
| Whether an employer has an 80 Days row, whether it is blank, its median sponsored salary and CSV line | What the employer pays **software** hires, or **new grads** (median covers all roles, TODO 3) |
| That a title matches a keyword O*NET lists under 15-1254 | Which SOC the employer will actually file (G2 is human) |
| That similarly named *longer* rows exist and were **not** used (shorter ones, e.g. `CHIME INC` for `CHIME FINANCIAL INC`, are missed) | Whether a missing employer (State Street, JPMC) sponsors: absence is not a no |
| | Co-op hourly pay (BLS does not survey students) |
| | Bonus, equity, relocation, cost of living |

**Labels:** BLS and 80 Days values are `record`; the floor rule and its percentile are `your-input`; the floor number, verdict and code-risk flag are `model-judgment` (a rule applied to records).

## Output Contract

### Agent output: `<out>/run-log.json`

```json
{
  "recipe": "arundhatik26-salary-floor-swe-15-1252", "recipe_version": "0.1.0",
  "run_date": "YYYY-MM-DD", "persona": "...",
  "rules": {"value": {"floor_percentile": "A_PCT25"}, "source": "your-input"},
  "sources": {"<path>": "<sha256>"},
  "local_metro": {"value": "missing", "source": "record", "why": "..."},
  "results": [{
    "company": {"value": "...", "source": "your-input"},
    "eighty_days": {"value": {"status": "matched|blank-record|not-in-dataset|ambiguous",
                              "csv_line": 0, "median_salary_offered": 0,
                              "near_misses_not_used": []}, "source": "record"},
    "soc": {"value": "15-1252", "source": "your-input"},
    "band": {"value": {"A_PCT10": 0, "A_PCT25": 0, "A_MEDIAN": 0, "A_PCT75": 0, "A_PCT90": 0}, "source": "record"},
    "floor": {"value": 0, "source": "model-judgment", "rule": "..."},
    "code_risk": null,
    "verdict": {"value": "COMPANY RECORD ABOVE FLOOR | COMPANY RECORD BELOW FLOOR | NO COMPANY NUMBER | STOP: AMBIGUOUS NAME",
                "source": "model-judgment"}
  }]
}
```

### Human report: `<out>/report.md`

Executive summary, then one table: **Company · Offer title · SOC · Floor · 80 Days record (with CSV line) · Company median · Verdict · Code risk**; then the BLS bands used, the similar names found but not used, and "What this cannot tell you". Reader: the student. Decision it enables: what number to treat as the lowest acceptable salary, and which employers need a direct question because the data is silent.

## Stop Conditions

The mode refuses to give a number, rather than guess, when:

1. `want_local_metro` is true and `data/bls/local-wage/` is absent. It **never** substitutes the national figure for Boston. (`✗ stopped`, exit 2)
2. The BLS percentile for the SOC is suppressed (`*`, `**`, `#`). (exit 2)
3. The SOC is not 15-1252 or 15-1254. (exit 2)
4. The input has no targets, a target has no `dataset_name`, or the percentile is not one of `A_PCT10…A_PCT90`. (exit 2)
5. Two or more 80 Days rows normalize to the same name: verdict `STOP: AMBIGUOUS NAME` for that employer.
6. The employer is missing or blank: no company number is produced. The verdict says so; it never borrows another company's figure.

On exit 2 nothing is written.

## Snickerdoodle

```bash
npm run verify && npm run doctor
python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-salary-floor/tests -v
python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py \
  --input scripts/contrib/2026fa/arundhatik26-salary-floor/inputs/sample-targets.json \
  --out-dir course/2026fa/submissions/arundhatik26/mode-salary-floor/runs/sample
npm run bls:local-wage -- --metro "Boston-Cambridge-Newton, MA-NH" --soc 15-1252   # expected to stop until TODO 1
```

If `python3` lacks PyYAML (seen with Homebrew Python 3.15), `npm run verify` fails in `manifest-check`; run it with a Python that has it (e.g. `PATH="/usr/bin:$PATH" npm run verify`).

## RUN_LOG template

```markdown
### YYYY-MM-DD — arundhatik26-salary-floor-swe-15-1252 v0.1.0 — <sample|live> run
- **By:** <name>
- **Inputs:** <targets file> (<n> employers; persona fictional/anonymized); floor = <percentile>
- **Sources:** OEWS national xlsx sha256 <…>; 80 Days CSV sha256 <…>
- **Commands:** verify ✓/✗ · doctor ✓/✗ · tests <n>/<n> · salary_floor.py exit <code> · bls:local-wage <result>
- **Outputs:** <out-dir>/run-log.json, report.md
- **Result:** matched <n> · blank <n> · not-in-dataset <n> · ambiguous <n> · code-risk flags <n>
- **Gates:** G1 <cleared by / pending> · G2 <…> · G3 <…> · G4 <n/a or result>
- **Open issues:** <TODOs still open; anything surprising>
```

## Provenance

- OEWS national xlsx SHA-256 `a9bad3093703e28d7490cedb765b6730f4eaa4b37a7c8f68e866814167761f11`
- 80 Days CSV SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
- Worked run: `course/2026fa/submissions/arundhatik26/mode-salary-floor/WORKED-RUN.md`
