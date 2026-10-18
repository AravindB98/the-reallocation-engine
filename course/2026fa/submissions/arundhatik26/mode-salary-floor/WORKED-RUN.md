# Worked run — salary floor, sample of 11 employers

## Executive summary

This is the record of the first real run of the salary-floor mode: the exact commands, their real output pasted unedited, which results came from data and which were judgments, how the output was checked, and an honest reflection. The run worked. For a software job the floor is $103,050 nationally. Seven employers have a salary record above it. Four have no usable record (State Street, JPMorgan Chase, Fidelity, and even Google), so the mode gives no company number for them. A separate check found that almost every large bank and asset manager the student targets is absent from the dataset, which was built to find funded startups. Two titles, "Front End Engineer" and "Back End Engineer", could be filed under a job code whose floor is about $40,000 lower. The repository's own Boston wage tool could not run because its data was never added.

## Inputs

- `scripts/contrib/2026fa/arundhatik26-salary-floor/inputs/sample-targets.json`. Persona **fictional** ("Ananya Rao"): F-1, MS Information Systems, SWE / full-stack co-op on CPT, Boston, graduating Dec 2027 or Apr 2028. No private data was read.
- Rule: floor = 25th percentile (`A_PCT25`). Student's reason, chosen from options offered: *a floor for an entry-level hire*.
- Targets (exact 80 Days names): State Street (`STATE STREET CORP`), Fidelity (`FMR LLC`), JPMorgan Chase (`JPMORGAN CHASE & CO`), BNY Mellon (`BANK OF NEW YORK MELLON CORP`), Toast (`TOAST INC`), Lendbuzz (`LENDBUZZ INC`), Klaviyo (`KLAVIYO INC`), Microsoft (`MICROSOFT CORP`), Google (`ALPHABET INC`), Robinhood (`ROBINHOOD MARKETS INC`), Chime (`CHIME FINANCIAL INC`). State Street, Fidelity and JPMorgan Chase were the student's own additions; the student asked for Microsoft, Google, Robinhood and Chime to be added after the coverage check below; the rest came from the earlier recipe assignment or a CSV search for Boston software sponsors.

## Commands and real output

Run 2026-10-16 on macOS (repo checks re-run 2026-10-18 after the move), branch `mode/arundhatik26-salary-floor`, from the repo root.

```
$ PATH="/usr/bin:$PATH" npm run verify
conformance: 163 files (87 md · 38 py · 30 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================
WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/
✓ manifest check passed (3 warnings)

$ node scripts/pii-scan.mjs
  [email] package-lock.json — <npm package author address, redacted here>

$ npm run doctor
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue

$ python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-salary-floor/tests
Ran 13 tests in 0.093s

OK

$ python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py
State Street   floor  $103,050  not-in-dataset  NO COMPANY NUMBER
Fidelity       floor  $103,050  blank-record    NO COMPANY NUMBER
JPMorgan Chase floor  $103,050  not-in-dataset  NO COMPANY NUMBER
BNY Mellon     floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Toast          floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Lendbuzz       floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Klaviyo        floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Microsoft      floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Google         floor  $103,050  blank-record    NO COMPANY NUMBER
Robinhood      floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
Chime          floor  $103,050  matched         COMPANY RECORD ABOVE FLOOR
✓ wrote course/2026fa/submissions/arundhatik26/mode-salary-floor/runs/sample/run-log.json and report.md
exit=0

$ npm run bls:local-wage -- --metro "Boston-Cambridge-Newton, MA-NH" --soc 15-1252
missing .venv — create it with:
  python3.13 -m venv .venv
  .venv/bin/pip install -r data/bls/local-wage/requirements.txt

$ git log --all --oneline -- data/bls/local-wage | wc -l
       0

$ npm run ats:liveness -- "https://boards.greenhouse.io/robinhood/jobs/8008723" "https://boards.greenhouse.io/chime/jobs/8594959002" "https://boards.greenhouse.io/robinhood/jobs/9999999999"
Checking 3 URL(s)...

✅ active     https://boards.greenhouse.io/robinhood/jobs/8008723
✅ active     https://boards.greenhouse.io/chime/jobs/8594959002
⚠️ uncertain  https://boards.greenhouse.io/robinhood/jobs/9999999999
           content present but no visible apply control found

Results: 2 active  0 expired  1 uncertain
```

Gate G4 (liveness), run with the repo's existing script on 2026-10-16. The two real postings were found through the companies' public Greenhouse job lists: Robinhood "Full Stack Software Engineer, Credit Cards & Banking" and Chime "Software Engineer, Financial Platform". The third URL is a **made-up job id** (break attempt): it came back `uncertain`, not `expired`. The mode treats `uncertain` as a closed gate, so a posting is never compared unless it is `active`. Robinhood's real posting title is "Full Stack", not "Back End" as in the sample input; the code-risk keyword rule would **not** flag it (see Did not test).

The 3 verify warnings and the one PII-scan finding (an npm package author's address in `package-lock.json`) are already on main; nothing in this submission was flagged. With Homebrew's `python3` (3.15, no PyYAML), plain `npm run verify` fails in the manifest check with `ModuleNotFoundError: No module named 'yaml'`; that is an environment problem, not a repo one.

The human report the run wrote (`runs/sample/report.md`), main table:

| Company | Offer title | SOC | Floor | 80 Days record | Company median | Verdict | Code risk |
|---|---|---|---|---|---|---|---|
| State Street | Software Engineer | 15-1252 | $103,050 | not-in-dataset | — | **NO COMPANY NUMBER** | — |
| Fidelity | Full Stack Engineer | 15-1252 | $103,050 | blank-record (line 10030) | — | **NO COMPANY NUMBER** | — |
| JPMorgan Chase | Software Engineer | 15-1252 | $103,050 | not-in-dataset | — | **NO COMPANY NUMBER** | — |
| BNY Mellon | Full Stack Developer | 15-1252 | $103,050 | matched (line 3036) | $145,000 | **COMPANY RECORD ABOVE FLOOR** | — |
| Toast | Software Engineer | 15-1252 | $103,050 | matched (line 27011) | $177,341 | **COMPANY RECORD ABOVE FLOOR** | — |
| Lendbuzz | Full Stack Engineer | 15-1252 | $103,050 | matched (line 15078) | $125,000 | **COMPANY RECORD ABOVE FLOOR** | — |
| Klaviyo | Front End Engineer | 15-1252 | $103,050 | matched (line 14495) | $126,000 | **COMPANY RECORD ABOVE FLOOR** | may be filed 15-1254 → floor $63,140 (−$39,910) |
| Microsoft | Software Engineer | 15-1252 | $103,050 | matched (line 16757) | $156,705 | **COMPANY RECORD ABOVE FLOOR** | — |
| Google | Software Engineer | 15-1252 | $103,050 | blank-record (line 1357) | — | **NO COMPANY NUMBER** | — |
| Robinhood | Back End Engineer | 15-1252 | $103,050 | matched (line 22735) | $186,000 | **COMPANY RECORD ABOVE FLOOR** | may be filed 15-1254 → floor $63,140 (−$39,910) |
| Chime | Full Stack Engineer | 15-1252 | $103,050 | matched (line 5469) | $240,108 | **COMPANY RECORD ABOVE FLOOR** | — |

| SOC | 10th | 25th | median | 75th | 90th |
|---|---|---|---|---|---|
| 15-1252 Software Developers | $79,850 | $103,050 | $133,080 | $169,000 | $211,450 |
| 15-1254 Web Developers (code-risk comparison) | $48,560 | $63,140 | $90,930 | $124,300 | $162,870 |

Similar names found but **not** used: State Street → `1601 STATE STREET HOTEL INVESTORS LP`; Toast → `MENTION THE TOASTER LLC, MOONTOAST INC, TOAST EMPIRE INC`; Google → `ALPHABET ENERGY INC, ALPHABETA INC`.

## Coverage check: is the dataset even able to answer for my targets?

After the first run, the student asked about more employers one by one. Each was searched in the 80 Days CSV by company-name pattern (case-insensitive, e.g. `GOLDMAN`, `BLACK\s*ROCK`, `MASTER\s*CARD`), and for some also by website. Results:

| Result | Employers |
|---|---|
| Record with approvals and salary | Microsoft (12,226 · $156,705) · BNY Mellon (704 · $145,000) · Robinhood (824 · $186,000) · Chime (580 · $240,108) · Stripe (1,250 · $158,371) · Toast (150 · $177,341) |
| Row exists, sponsorship **blank** | Google (`ALPHABET INC`) · Meta (`FACEBOOK INC`) · Fidelity (`FMR LLC`) · Visa · Square · Plaid · Coinbase · Ramp |
| **Not in the dataset** | Goldman Sachs · Morgan Stanley · JPMorgan Chase · State Street · BlackRock · MSCI · Broadridge · Mastercard · Capital One · PayPal · Wellington · Citizens · Bloomberg · Two Sigma · Brex · Apple · Amazon · Netflix · Nvidia |
| Decoys (similar name, different company) | `1601 STATE STREET HOTEL INVESTORS LP` · `AMEX HOLDING I CORP` · `CITADEL DEFENSE CO` · `AFFIRMED NETWORKS INC` · `ALPHABET ENERGY INC` |

Among companies with ≥ 20 approvals, a salary, and software titles, 23 are finance or fintech, and only one (BNY Mellon) is a large bank. In the Boston area: Toast, Lendbuzz, First Help Financial.

**Why (inferred):** the dataset's own README describes it as a way to make *funded startups* visible, built from SEC Form D filings. Large public banks and asset managers do not raise money that way. This explains the pattern but not every case: BNY Mellon, Toast and Microsoft are public and are present.

**What this means:** for most of this student's top targets, the engine's main dataset is silent. "Not found" is a coverage gap, not evidence of no sponsorship. The data that would answer it (USCIS H-1B Employer Data Hub; DOL LCA disclosure files, which also give job code and wage) is public but not in the repo: TODO 3 in the mode file.

A side finding: the CSV's `website` column often looks generated from the company name (e.g. `batmanholdings.com`), and Fidelity's is `fmr.io`. The mode does not use websites, and neither should anyone matching companies.

## Verified vs inferred

| Line in the output | Verified (data/script) or inferred (judgment) | How |
|---|---|---|
| BLS band for 15-1252 and 15-1254 | **Verified** | read from `national_M2024_dl.xlsx` (SHA-256 in run-log.json); median agrees with the compact CSV (test) |
| Floor = $103,050 | **Inferred** (rule) | 25th percentile is the student's chosen rule; the number itself is a record |
| State Street / JPMorgan Chase not in dataset | **Verified** | no exact normalized name match in 30,369 rows |
| "Absence means ask directly", not "doesn't sponsor" | **Inferred** | judgment; the CSV cannot say why a company is missing |
| Fidelity and Google blank | **Verified** | `FMR LLC` (line 10030) and `ALPHABET INC` (line 1357) exist with approvals and median blank |
| Fidelity blank (detail) | **Verified** | `FMR LLC` row exists (line 10030), approvals and median blank |
| `FMR LLC` *is* Fidelity; `ALPHABET INC` *is* Google | **Inferred** | general knowledge; not in the CSV |
| Blank means "not linked", not "zero H-1Bs" | **Inferred** | Google is one of the largest US H-1B sponsors (general knowledge); the CSV cannot say why the field is empty |
| BNY / Toast / Lendbuzz / Klaviyo / Microsoft / Robinhood / Chime medians and lines | **Verified** | CSV fields; cross-checked independently below |
| "Above floor" verdicts | **Inferred** (rule applied to records) | median ≥ floor; the median covers *all* sponsored roles, so this is not a software salary |
| Klaviyo and Robinhood code risk | **Inferred** | keyword rule (`front end`, `back end`) based on O*NET alternate titles; the employer's real filing code is unknown |
| Near-miss names are different companies | **Inferred**, then **gate G1 cleared by the student** | checked online 2026-10-16: 1601 State St, Santa Barbara is a hotel (Courtyard by Marriott); Alphabet Energy is a waste-heat company; Alphabeta a finance-education startup; Moontoast a defunct ad platform; the other two "Toast" names have no online presence |
| Boston number unavailable | **Verified** | `bls:local-wage` stopped; `git log --all -- data/bls/local-wage` is empty |

## Verification

1. **Cross-checked counts against the source**, with a separate reader rather than the mode's code:
   ```
   $ python3 -I -c "import csv ... if r['company_name'] in ('TOAST INC','FMR LLC','KLAVIYO INC') ..."
   10030 FMR LLC | approvals (blank) | median_salary_offered (blank)
   14495 KLAVIYO INC | approvals 154.0 | median_salary_offered 126000.0
   27011 TOAST INC | approvals 150.0 | median_salary_offered 177341.0

   $ python3 -I -c "... if r['company_name'] in ('MICROSOFT CORP','ALPHABET INC','CHIME INC') ..."
   1357 ALPHABET INC | approvals (blank) | median_salary_offered (blank)
   5470 CHIME INC | approvals 2.0 | median_salary_offered 133869.0
   16757 MICROSOFT CORP | approvals 12226.0 | median_salary_offered 156705.0
   ```
   The line numbers and values match the report. `sed -n 27011p` on the raw CSV also starts with `TOAST INC`.
2. **Two BLS files agree:** `soc_occupation_compact.csv` gives 15-1252 median 133080.0 and 15-1254 median 90930.0, the same as the xlsx (test `test_xlsx_median_matches_compact_csv`).
3. **Parsed the agent log:**
   ```
   $ python3 -c "...json.load(run-log.json)..."
   11 results
   Counter({'matched': 7, 'not-in-dataset': 2, 'blank-record': 2})
   ```
4. **Tried to break it** (inputs written to a scratch folder, real output):
   ```
   $ python3 salary_floor.py --input break-local.json --out-dir <scratch>/x1   # want_local_metro: true
   ✗ stopped: local metro wage requested but data/bls/local-wage/ is not in the repo — refusing to substitute the national figure
   exit=2
   ls: <scratch>/x1: No such file or directory

   $ python3 salary_floor.py --input break-soc.json --out-dir <scratch>/x2   # soc 15-2051 (data scientist)
   ✗ stopped: State Street: soc must be one of ['15-1252', '15-1254'], got '15-2051'
   exit=2
   ```

## Attestation
- Recipe: arundhatik26-salary-floor-swe-15-1252 v0.1.0
- By: Arundhati Kandelkar · 2026-10-18

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `salary_floor.py` on 11 sample targets | 7 matched, 2 blank, 2 not-in-dataset; exit 0 | missing employers get no company number |
| Separate CSV read of Toast, Klaviyo, FMR LLC, Microsoft, Alphabet | same lines and values as the report | identical |
| 13 unit tests on the real data (both Pythons on this Mac) | 13/13 OK | all pass |
| **Break:** asked for a Boston number with no local data | exit 2, nothing written | refuse, no national fallback |
| **Break:** job code 15-2051 | exit 2 | refuse out-of-scope code |
| **Break (test):** look up `STATE STREET` | not-in-dataset; hotel LP listed as near-miss, not used | no fuzzy match |
| **Break (test):** BLS 25th percentile replaced with `*` | stopped | no floor from a suppressed value |
| `npm run ats:liveness` on 2 real postings (Robinhood, Chime) | both `active` | active |
| **Break:** liveness on a made-up Robinhood job id | `uncertain` ("no visible apply control") | `expired`; uncertain is still treated as a closed gate |
| `npm run bls:local-wage` for Boston | stopped: missing `.venv`; data folder absent | a Boston number (failed) |
| **Student** ran `python3 scripts/contrib/2026fa/arundhatik26-salary-floor/salary_floor.py` in my own Terminal (Homebrew Python 3.15), 2026-10-16 | first run (7 employers): same 7 lines; re-run after 4 were added (11 employers): same 11 lines as above; ✓ wrote run-log.json and report.md both times | identical to the worked run |

### Did not test
- **Found, not fixed:** `CHIME INC` (line 5470, 2 approvals, New York) is a second Chime row, but it was **not** listed under similar names, because the near-miss check only looks for longer names that contain the query (`CHIME FINANCIAL`), not shorter ones. A human must still search by hand.
- Any real offer or a real LCA filing; gate G2 has never been cleared.
- Gate G3 (visa timeline): not scripted in this mode. G4 was run by hand with `ats:liveness`, not called by `salary_floor.py`.
- Titles beyond the 11 sample ones; "Full Stack" titles are **not** flagged by the keyword rule, and whether O*NET lists them under 15-1254 is unchecked.
- Whether `median_salary_offered` is base pay only or total compensation.
- The `--out-dir` default on Windows paths.

### Broke during testing, fixed
- 2026-10-18: files first written under `assignments/submissions/` and `recipes/` were outside the repository's pull-request namespaces (the automated scope check flags them for maintainer review). Moved to `course/2026fa/submissions/arundhatik26/mode-salary-floor/` and `recipes/cases/2026fa/`, added the human card and `logs/runs/2026fa-arundhatik26-2.md`, re-ran: identical 11 results.
- My own test for the BLS cross-check crashed on rows with a blank median in the compact CSV (`ValueError: could not convert string to float: ''`). Fixed the test to skip blank rows; the data was not changed.
- `npm run verify` failed with Homebrew Python 3.15 (no PyYAML). Worked around by running with the system Python on the PATH; nothing installed.

## Reflection

> **[Student]** My answers, chosen from options Claude offered on 2026-10-16 (I picked all four in the first two questions); Claude wrote them down.

**What went well**
- It refused to guess: State Street, JPMorgan Chase, Fidelity and Google got "no company number", not an invented one.
- The job-code flag showed that a "Front End" or "Back End" title could lower the floor by about $40,000.
- Every number is auditable: a CSV line number or a file hash I could check myself.
- It exposed the coverage gap: the large banks I target are not in the dataset at all.

**What the mode got wrong or missed**
- The verdict did not separate companies: every employer with a record came out "above floor" at the 25th percentile.
- The company salary is an all-roles median, not a software-engineering salary.
- National figures do not give a Boston floor.
- It missed the second Chime row (`CHIME INC`), so name matching still needs a human.

**Next steps**
1. Add DOL LCA disclosure wages (TODO 3): software-only offered wages, job codes and work locations per employer, including the banks missing from 80 Days. Caveat: LCA wages are not new-grad salaries and are not the legal floor.
2. Then add DOL OFLC prevailing-wage levels for Boston (TODO 2), which are the legal H-1B floor.
3. Then get the Boston local-wage data committed (TODO 1).
4. In parallel: ask alumni and my co-op advisor about real new-grad pay and job codes at State Street, Fidelity and JPMorgan Chase.

## Who did what

Claude Code (AI assistant) wrote the script, tests, mode file, and drafts of this page and the justification, and ran the commands. Claude also ran the coverage-check searches and the online check of near-miss names. The student chose the domain (from options Claude offered), added State Street and Fidelity as targets, asked about each large employer in the coverage check and asked for Microsoft, Google, Robinhood and Chime to be added, chose the 25th-percentile floor, ran the mode twice in their own Terminal, cleared gate G1, and chose the reflection answers.
