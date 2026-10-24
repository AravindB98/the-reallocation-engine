## 2026-10-19 — h1b-wage-level-odds: data build, sample run, live runs, break tests

### Executive summary

On 19 October 2026 the new H-1B wage-level mode was built and run. The Labor Department's 2026-27 wage-level file was downloaded, cut down to software developer wages in five metro areas, fingerprinted and audited, and a person checked four of its values against the Department's own website; they matched. The mode ran on eleven constructed sample postings and on thirteen live postings. On the live postings, nine got a checked wage level, one was held by a person at the job-code gate, and three were refused because the pay range, the office or the city could not be pinned down. Six deliberate break attempts were made; the last one found a crash on a closed posting, which was fixed. A named person decided every gate.

### Run record

- **Date:** 2026-10-19
- **Recipe:** h1b-wage-level-odds v0.1.0 (`recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md`)
- **Persona:** `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/persona.json` (fictional)
- **Data:** OFLC `OFLC_Wages_2026-27.zip` (12,652,309 bytes, SHA-256 `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f`, posted 2026-07-01, downloaded 2026-10-19; not committed); extract in `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/`; `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- **Repo scripts used:** `scripts/ats/check-liveness.mjs`, `npm run verify`, `npm run doctor`
- **Evidence folder:** `assignments/submissions/pavithra-prasad/`

#### Data build and audit

- **Command:** `python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/build_extract.py --zip <zip>`
- **Result:** 10 wage rows (SOC 15-1252 and 15-1253 × 5 areas) of 449,440; 39 county rows of 3,275; manifest written
- **Audit:** `data/oflc-extract-audit.md` (`wage_level.py --audit`), read by Pavithra-Prasad 2026-10-19
- **Human check:** Pavithra-Prasad searched DOL's wage search (7/2026-6/2027, All Industries, 15-1252.00, Santa Clara County): Levels I-IV $73.46 / $89.94 / $106.43 / $122.91 an hour, $152,797 / $187,075 / $221,374 / $255,653 a year, Geo Level 1. Matches the extract. Screenshot: `evidence/dol-wage-search-2026-10-19-santa-clara.png`

#### Sample run (offline)

- **Command:** `python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample --out-dir assignments/submissions/pavithra-prasad/runs/sample`
- **Inputs:** `fixtures/postings-sample.json` (11 constructed postings), `fixtures/liveness-sample.json`, `fixtures/gates-sample.json` (constructed)
- **Result:** checked 5 · provisional 1 · refused 4 · skip 1; G2 pass

#### Live runs (13 postings fetched 2026-10-19, `inputs/postings-live.json`)

| Run | Gate log | Result |
|---|---|---|
| `runs/live-1-before-gates` | none | provisional 10 · refused 3 |
| `runs/live-2-gates-cleared` | G1, G2, G3 | checked 9 · provisional 1 (held at G3) · refused 3 |
| `runs/live-3-released` | G1, G2, G3, G4 | same as live-2; G4 released |

Refused: Stripe "Software Engineer, New Grad" (no pay range published through the API), Databricks "Software Engineer, Web Products" (two ranges, no city on either), Discord "Software Engineer, Consumer Revenue" ("San Francisco Bay Area").

#### Gate decisions (`assignments/submissions/pavithra-prasad/inputs/gates-live.json`)

| Gate | Decision | By | Date |
|---|---|---|---|
| G1 liveness | clear, 13 postings (Pinterest and Robinhood opened by hand) | Pavithra-Prasad | 2026-10-19 |
| G1 liveness, by hand | the other 11 postings opened: "G1 all are live" | Pavithra-Prasad | 2026-10-21 |
| G2 visa timeline | clear | Pavithra-Prasad | 2026-10-19 |
| G2 visa timeline, re-confirmed | "registration on 2027-03-10 is inside OPT and the wage year" | Pavithra-Prasad | 2026-10-21 |
| G3 job code | own review of each title: clear 9, hold 1 (Lyft "ML Software Engineer, ETA", "because it's ML") | Pavithra-Prasad | 2026-10-19 |
| G4 release | clear (for `runs/live-3-released`) | Pavithra-Prasad | 2026-10-19 |
| G4 release | clear for `runs/live-4-final`: "I read the report. Release live-4-final." | Pavithra-Prasad | 2026-10-21 |

#### TODO closures (one batch)

DATA SOURCE ×2, DEFINE ×2, REPORT FIELD ×1 and APPROVE ×1 closed by Pavithra-Prasad (re-confirmed in her words on 2026-10-21: "I accept the DOL extract, the 2,080-hour rounding, software developer as the default code, and the report columns."); DEV ×3 closed by script + `npm run verify` + handoff condition. `todos_open: 0`. Status set to RUNNABLE-LIVE.

#### Break tests (`runs/break-tests/terminal.txt`)

| # | Attempt | Result |
|---|---|---|
| B1 | build the extract from a file that is not the DOL zip | refused, exit 1 |
| B2 | change one wage in the extract | halted on the SHA-256 check, exit 2 |
| B3 | change Level II and refresh the manifest hash | halted on the interpolation check, exit 2 |
| B4 | run as if on 2027-02-01 | G2 failed, run stopped, exit 3 |
| B5 | write output under `chapters/` | halted, nothing written, exit 2 |
| B6 | fetch and check a job id that does not exist | **crashed** (title was None); fixed; skip at G1 after the fix |

#### Defects found and fixed

1. Hourly ranges written "$57/hr - $68/hr" were not read (sample run).
2. Two ranges each labelled with a city were refused (sample run).
3. Zone ranges listing several cities were refused (Robinhood, live data).
4. Location strings without states ("San Francisco, Seattle, New York", "San Francisco") were misread (Stripe, Asana, live data).
5. A closed posting with no title crashed the run (B6).
6. The timeline gate rested on one assumed hiring lag; it now also reports 30, 60 and 90 days and the latest start date.

#### 2026-10-21 — outside review, fixes and final live run

- **Review:** ChatGPT graded the submission zip as a strict TA. Confirmed against the code: G1, G2 and G4 were not enforced (only G3 was checked before "checked"), stopped postings kept computed levels in `run-log.json`, the recipe's G1 text did not match the code, the 2026-10-19 Pinterest G1 note misstated the checker result, and some fields were unlabelled against the output contract.
- **Fixes:** G1, G2 and G3 must each be logged before a result is "checked"; a G4 release counts only for the run folder it names, otherwise the report opens with NOT RELEASED; no level is computed for a stopped posting; the recipe's gates, output contract and stop conditions were aligned with the code; a correction was appended to the gate log (original kept); the typed TODOs now use the `[TODO: TYPE]` form; `evidence/sponsor-rows-used.csv` holds the eight sponsorship rows used.
- **Tests:** 37 OK (5 new `GateEnforcement` tests).
- **Final live run:** `runs/live-4-final`, run date 2026-10-21, same 13 postings fetched 2026-10-19: checked 9 · provisional 1 · refused 3, the same statuses as `runs/live-3-released`; liveness re-checked live with `check-liveness.mjs`.

#### Conformance

`python3 test_wage_level.py`: 37 tests OK. `PATH="/usr/bin:$PATH" npm run verify`: manifest check passed (3 warnings that exist on upstream main). `npm run doctor`: environment runnable.

#### Open issues

- Two-range postings with no city labels (Databricks "Zone 1" and "Local Pay Range") are refused, not resolved.
- Only five wage areas and two job codes are in the extract.
- A single posted range may be a band for every US location (Pinterest); the mode cannot tell a city range from a national one.
- The level the employer actually files is not checked (LCA disclosure data would be the next source).
