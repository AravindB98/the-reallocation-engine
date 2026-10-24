---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "final live run 2026-10-21 (assignments/submissions/pavithra-prasad/runs/live-4-final): G1, G2, G3 decided by Pavithra-Prasad (G3: 9 clear, 1 hold), every posting opened by her, G4 released by her for this run; earlier runs 2026-10-19; logs/runs/2026fa-pavithra-prasad-2.md"
attestation: null  # the attestation in WORKED-RUN.md is by the recipe's author; VERIFIED is not claimed
recipe_version: 0.1.0
---

# h1b-wage-level-odds: what a new-grad SWE offer's pay and city do to H-1B lottery odds

## Executive summary

**What this is.** A procedure, and the program that runs it, for one kind of job seeker: an international master's student who graduates in December 2026, works on OPT from January 2027, and will be registered in the March 2027 H-1B lottery by an employer hiring them as an entry-level software engineer in Boston, New York, the San Francisco Bay Area or Seattle.

**Why read it.** Since 27 February 2026 the H-1B lottery has been weighted by wage level: a registration is entered once at Level I and up to four times at Level IV. The level depends on whether the offered pay reaches the Labor Department's threshold for the job and the **city**, and the thresholds differ a lot between cities. A student reading "$140,000 to $165,000" cannot see that the same pay is Level II in New York and Boston, Level I in Seattle and San Francisco, and below Level I in San Jose. Nor can they see that Menlo Park and Palo Alto, next door to each other, sit in different wage areas.

**What it decides.** For each posting and each listed city: the wage level at the bottom and the top of the posted range, the number of lottery entries that implies, and the base pay needed for the next level. It refuses, with a reason, when the posting has no range, when the worksite is remote or only a region, when several ranges cannot each be tied to a city, or when the data has changed. A person clears four gates: the posting is live, the visa timeline works, the job code fits, and the report is read before anyone acts on it.

**What the live run found.** On 13 real postings (19 October 2026), 9 gave a checked level, 1 is held at the job-code gate by a person's decision, and 3 were refused. Robinhood's $166,000 minimum is Level III in New York but Level II in Bellevue and Menlo Park. A real 2027 new-grad posting (Pinterest) starts $8,071 below the San Francisco Level I wage. A Stripe Seattle backend posting starts at exactly $206,086, the Seattle Level IV threshold.

**How far it has been proven.** It has run end to end on constructed sample data and on live postings, with a named person clearing every gate. It has not been independently attested, so it stops one stage short of VERIFIED.

## Lifecycle note

RUNNABLE-LIVE. The evidence for each step: **SPECIFIED**, zero open TODOs, every closure in the table below; **RUNNABLE-SAMPLE**, the sample run completes (`runs/sample/`), `npm run verify` passes, and the audit `data/oflc-extract-audit.md` was generated and read by Pavithra-Prasad on 2026-10-19 (run log `logs/runs/2026fa-pavithra-prasad-2.md`); **RUNNABLE-LIVE**, the final live run of 2026-10-21 (`runs/live-4-final`), with G1, G2 and G3 decided by Pavithra-Prasad (G3: 9 clear, 1 hold) and G4 released by her for that run, all logged in `inputs/gates-live.json` and enforced by the script. VERIFIED is not claimed: the attestation in the worked run is by the recipe's author, not an independent reviewer, and any later edit to the recipe or its scripts would void it.

## Required reads

1. `SNICKERDOODLE.md`: gates, provenance, TODO closure, attestation.
2. `DOMAIN.md`: what is runnable today.
3. `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/oflc-extract-audit.md`: the wage table this recipe depends on.
4. This recipe and its card, `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.card.md`.

## Purpose

Use this when a student in the situation above is choosing which postings to spend effort on, which office to ask for, or what base pay to negotiate, and wants to know what each choice does to their H-1B lottery weight. Do not use it to estimate the chance of selection (see "What it cannot verify"), for roles that are not software developer roles, or for cities outside the five wage areas below.

## Source inventory

| Source | Exact path or command | Layer | Role |
|---|---|---|---|
| OFLC 2026-27 wage levels, SOC 15-1252 and 15-1253, five areas | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/oflc-alc-2026-27-extract.csv` | Cognitive Pivot (BLS OEWS-based wages) | the thresholds |
| OFLC area-to-county map, five areas | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/oflc-geography-extract.csv` | Cognitive Pivot | city to wage area |
| Extract fingerprints | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/extract-manifest.json` | n/a | refuses a changed file |
| City to county table | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/worksites.csv` | n/a | city to county |
| H-1B sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (repo data) | 80 Days to Stay | context: approvals and the company's all-title median salary |
| Posting liveness | `node scripts/ats/check-liveness.mjs <url>` (`npm run ats:liveness -- <url>`, repo script) | Job-Ops | gate G1 |
| Public postings | Greenhouse job-board API, via `fetch_postings.py` | Job-Ops | the pay range, title and location as published |
| The rule | 90 FR 60864, 29 Dec 2025, effective 27 Feb 2026 | n/a | entries per level; below Level I counts once; several work locations use the lowest level |
| Conformance | `npm run verify`, `npm run doctor` (repo scripts) | n/a | machine checks before release |

## Proposed additions (typed, with closure evidence)

Each addition is marked with its typed `[TODO: …]` and the closure evidence the repository's constitution requires for that type. All nine are closed, so `todos_open` (which counts open items) is 0.

| # | Typed TODO | Addition | Why it belongs | Status and evidence |
|---|---|---|---|---|
| 1 | `[TODO: DATA SOURCE]` closed | OFLC 2026-27 wage-level extract | The repo has national and metro BLS wages but not the Labor Department's H-1B wage levels, which are what the lottery uses | **Closed** by Pavithra-Prasad, 2026-10-19, and re-confirmed in her words on 2026-10-21: "I accept the DOL extract, the 2,080-hour rounding, software developer as the default code, and the report columns." File: `data/oflc-alc-2026-27-extract.csv`. Provenance: DOL OFLC, `https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip`, posted 2026-07-01, downloaded 2026-10-19, SHA-256 `edc01f64…f08f` |
| 2 | `[TODO: DATA SOURCE]` closed | City to county table, 47 cities | Postings name cities; OFLC areas are built from counties | **Closed** by Pavithra-Prasad, 2026-10-19. File: `data/worksites.csv`. Provenance: built 2026-10-19 from county membership; every county is checked against OFLC's Geography.csv at load, and one mapping (Santa Clara County to the San Jose area) was confirmed by hand on DOL's wage search |
| 3 | `[TODO: DEFINE]` closed | Annual threshold | OFLC publishes hourly wages | **Closed** by Pavithra-Prasad, 2026-10-19 (re-confirmed in her words on 2026-10-21, see addition 1). Value: hourly × 2,080, rounded to whole dollars; pay **equal** to a threshold reaches that level. Reason: OFLC annualizes at 2,080 hours and the rule says "equal or exceed" |
| 4 | `[TODO: DEFINE]` closed | Default SOC code | The employer chooses the code; the recipe must assume one | **Closed** by Pavithra-Prasad, 2026-10-19 (re-confirmed in her words on 2026-10-21, see addition 1). Value: 15-1252 Software Developers, unless a person holds the posting at G3. Reason: the target roles are plain software engineer roles; titles that may map elsewhere are flagged |
| 5 | `[TODO: REPORT FIELD]` closed | The results table | The student needs one table to compare postings and offices | **Closed** by Pavithra-Prasad, 2026-10-19 (re-confirmed in her words on 2026-10-21, see addition 1). Columns: Company, Role, City, Posted base range, At the minimum, At the maximum, Entries (min to max), To reach the next level, Status. Reader: the student. Decision enabled: which postings and offices to prioritize and what base pay to negotiate for |
| 6 | `[TODO: DEV]` closed | `build_extract.py` | Rebuilds the extract from the DOL zip, so the data can be re-derived | **Closed.** Script exists; refuses a zip with another SHA-256 (tested); rebuilds files matching the manifest |
| 7 | `[TODO: DEV]` closed | `fetch_postings.py` | The only network step, so runs are repeatable from saved input | **Closed.** Script exists; fetched 13 postings, all HTTP 200, on 2026-10-19 |
| 8 | `[TODO: DEV]` closed | `wage_level.py` | Gates, worksite to area, pay to level, refusals, log and report | **Closed.** Script exists; `npm run verify` passes; handoff condition met: the sample run gives the expected status for all 11 constructed postings and 37 offline tests pass |
| 9 | `[TODO: APPROVE]` closed | Live-run gates G1 to G4 | Gates are hard stops cleared by a person | **Closed** by Pavithra-Prasad, 2026-10-19: G1 for 13 postings, G2 once, G3 for 10 postings (9 clear, 1 hold), G4 release; on 2026-10-21 she opened every posting herself (all live) and re-confirmed G2 in her own words, all in `assignments/submissions/pavithra-prasad/inputs/gates-live.json` |

## Commands

From the repo root:

```bash
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --audit
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --discover pinterest stripe chime lyft
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --out assignments/submissions/pavithra-prasad/inputs/postings-live.json --jobs "pinterest:7838591:Pinterest"
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --persona scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/persona.json --postings assignments/submissions/pavithra-prasad/inputs/postings-live.json --gate-log assignments/submissions/pavithra-prasad/inputs/gates-live.json --out-dir assignments/submissions/pavithra-prasad/runs/live-4-final --run-date 2026-10-21
PATH="/usr/bin:$PATH" npm run verify
npm run doctor
```

`npm run verify` needs a Python with PyYAML first on the PATH (macOS `/usr/bin/python3` has it).

## Inputs

| Input | Source label | Where |
|---|---|---|
| Persona: graduation, OPT start and end, planned registration date, end of the petition filing window, hiring lag | your-input (fictional persona) | `fixtures/persona.json` |
| Postings: company, title, location, link, pay sentences, API status, fetch time | record | `inputs/postings-live.json` from `fetch_postings.py` |
| Company legal name as in the sponsorship CSV | your-input | the third part of each `--jobs` entry |
| Gate decisions | record of a person's decision | `inputs/gates-live.json` |

## Phase gates

| Gate | Testable condition | Cleared by | If it fails |
|---|---|---|---|
| G1 Liveness | the posting is open by `check-liveness.mjs` and the job-board API status at fetch. Only HTTP 404/410 counts as closed. A checker "expired" based only on page content is resolved by the API answer; a definite disagreement between the two (open vs closed) is held | a person, per posting, logged as G1 in the gate log; without it the result stays **provisional** | closed: **Skip** (a dead posting scores zero, and no level is computed); held: **refused** until a person opens the link and clears G1 |
| G2 Visa timeline | (a) run date + hiring lag ≤ planned registration date; (b) OPT end ≥ end of the petition filing window; (c) registration date inside the wage year of the data (2026-07-01 to 2027-06-30). The report also shows the result for 30, 60 and 90-day hiring lags and the date the search has to start by, because the lag and the registration date are assumptions | a person, once per run, logged as G2; without it every result stays **provisional** | the checks fail: the whole run stops and no level is reported |
| G3 Job code | the person accepts SOC 15-1252 for this posting; titles with ML, AI, research, data, security, test or similar words are flagged | a person, per posting, logged as G3 | held or missing: the result stays **provisional** |
| G4 Release | a person has read this run's report, including "What this run did not verify", before acting on it | a person, once per run, logged as G4 with the run's folder name; a release for another run does not count | the report opens with a **NOT RELEASED** notice and the log says `released: false` |

## Workflow

1. **Check the data.** Load the extract; halt if any file's SHA-256 differs from the manifest, if any Level II or III wage is not the even interpolation between Levels I and IV, or if a city in the city table maps to a county OFLC does not list.
2. **G2 timeline.** Halt the run if it fails.
3. **For each posting: G1 liveness.** Run the repo's checker, combine it with the API status from the fetch, and skip or hold as above.
4. **Worksites.** Split the location string into cities. Remote, a region ("Bay Area") and cities outside the five areas are noted and not checked. With no checkable city, refuse.
5. **Pay.** Find every distinct pay range in the posting's pay sentences (annual or hourly). One range applies to every city. Several ranges are tied to cities when each city's name is followed by a range within 300 characters; otherwise refuse.
6. **Levels.** For each city: the wage area, the Level I to IV thresholds, the level at the bottom and the top of the range, entries (I=1, II=2, III=3, IV=4; below I counts once), and the base pay for the next level.
7. **Context.** The company's row in the sponsorship CSV, matched by exact normalized name: approvals and its all-title median salary, placed against the same thresholds. Context only; it never changes a level.
8. **G3**, then write `run-log.json` and `report.md`. **G4** before anyone acts.

## Decision rules (model judgment, stated so they can be argued with)

- **Posting cities are alternatives, not a multi-site job.** A posting that lists New York and Seattle usually means one office or the other, so the report gives each city's level. If the hire would really work across several sites, the rule requires the lowest level among them, which is the lowest row for that posting.
- **The posted range bounds the offer.** The report gives the level at both ends because the actual offer is unknown.
- **A range is tied to the city named just before it** (zone tables such as "Zone 1 (Menlo Park, CA; New York, NY) $X–$Y").
- **Hourly pay is annualized at 2,080 hours**, the same convention OFLC uses.
- **A title flag is a prompt, not a verdict.** Flagged titles still get a number; G3 decides whether it stands.

## What it can verify

- The posted pay range, title and location, exactly as published at fetch time (record; the posting text is fingerprinted).
- That the posting was open by the repo's checker and the job-board API on the run date (record).
- The OFLC 2026-27 thresholds for SOC 15-1252 in each area, matching the DOL file by SHA-256 and passing the interpolation check (record).
- Which OFLC area a listed city belongs to (computed from the city table and OFLC's county list).
- Which level and how many entries each end of the range reaches in each area, and the gap to the next level (computed).
- Whether the persona's dates allow a March 2027 registration (computed from your-input dates).

## What it cannot verify

- **The SOC code the employer will file.** Everything assumes 15-1252; another code moves every threshold (for 15-1253, Level I in San Francisco is $80,579 instead of $137,093).
- **The actual offer.** The range bounds it only if the employer keeps to its own range.
- **Which office the hire will join**, or the home address for a remote role.
- **Whether one posted range is for the listed city or a band for every US location.** Pinterest's new-grad range is given to "US based applicants only" and says final salary depends on location, so a San Francisco offer may start above the posted minimum.
- **Whether the employer registers at all**, or uses a non-OEWS wage source.
- **The chance of selection.** Entries are relative weights; the real odds depend on the year's whole registration pool, which nobody can see in advance.
- **Whether the sponsorship row is the right legal entity.** Exact-name matching can pick the wrong company: "Chime" matches CHIME INC (2 approvals), not CHIME FINANCIAL INC (580).
- **Changes to the wage levels themselves.** The Department of Labor proposed new prevailing-wage levels on 27 March 2026 (about the 34th, 52nd, 70th and 88th percentiles instead of the 17th, 34th, 50th and 67th, so Level I would rise to roughly today's Level II). Whether it has become final was not checked; if it takes effect, the thresholds in this extract no longer apply, and the mode must be rebuilt.
- Anything about the role's quality, the team or the company's finances.

## Output contract

**`run-log.json`, for the agent.** Top level: `recipe`, `recipe_version`, `mode`, `run_date`, `persona` (fictional, labeled your-input), `soc`, `data` (source URL, zip SHA-256, wage year), `rule`, `timeline_gate` (G2 checks and the person's G2 decision), `release_gate` (G4), `released`, `run_label`, `gate_log`, `cannot_verify`, `postings`. Each posting: `posting_id`, `company`, `title`, `location_as_posted`, `url`, `fetched_at`, `G1_liveness`, `G3_soc`, `pay_ranges_found`, `sites` (per city: `worksite`, `county`, `oflc_area`, `geo_level`, `thresholds_annual`, `range_annual`, `level_at_min`, `level_at_max`, `entries_at_min`, `entries_at_max`, `below_level_1_at_min`, `next_step_from_min`), `sponsorship_80_days`, `stops`, `notes`, `status`, `next_action`. Every evidence value is `{value, source}` with source one of `record`, `computed`, `your-input`, `model-judgment`. Identifiers and control fields are plain: `posting_id`, `url`, `source`, `stops`, `notes`, `status`, `released`, `run_label`, and the logged human decisions, which carry their own `by` and `date`. A skipped or refused posting has an empty `sites` list, so no level is left in the log.

**`report.md`, for the person.** Executive summary; results by posting and city (the table in addition 5); next step per posting; refused or skipped, with reasons; notes; what this run did not verify; gates; run record.

## Stop conditions

The mode refuses to give a level, and says why, when:

- the data files differ from the manifest, the level arithmetic fails, or the city table names an unknown county (**halts the run**);
- the visa timeline gate fails (**halts the run**);
- the posting is closed (skip) or its liveness is held and not cleared;
- the posting has no pay range;
- the only locations are remote, a region spanning several wage areas, or cities outside the five areas;
- several ranges cannot each be tied to one city;
- the output folder is outside this recipe's namespaces (**halts the run**).

A skipped or refused posting gets no wage level at all, so nothing actionable remains for it in either output. A result whose G1, G2 or G3 decision is missing is reported as provisional, never as checked.

## Next action per result

| Result | Next action |
|---|---|
| Below Level I at the posted minimum | Ask whether they would raise the base or use another wage survey before investing more |
| Level depends on the office | Ask which office the role sits in; prefer the office with more entries if the work is the same |
| Gap to the next level | Use the threshold as the negotiation target for base pay |
| No range, two ranges, region, remote | Ask the recruiter the one missing fact, then re-run |

## Not in scope (future work, not open TODOs)

- **The level the employer actually files.** DOL's public LCA disclosure data would show whether a company usually files new grads at Level I or II.
- More wage areas and job codes, and Lever and Ashby job boards.
- Learning labels like "Local Pay Range" so two-range postings such as Databricks's can be resolved.

## Run-log template (for `logs/RUN_LOG.md`)

This repository takes student entries as separate files under `logs/runs/` (its contribution check blocks direct edits to `logs/RUN_LOG.md`), so an entry is saved as `logs/runs/2026fa-pavithra-prasad-<n>.md`.

```markdown
## YYYY-MM-DD — h1b-wage-level-odds <sample | live> run

- Recipe: recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md v<version>
- Inputs: <persona file (fictional)>, <postings file + fetch time>, <gate log>
- Data: OFLC 2026-27 extract, zip SHA-256 <hash>; manifest check <pass/fail>
- Commands: <verbatim>
- Outputs: <run-log.json path>, <report.md path>
- Result: <n postings: checked / provisional / refused / skip>; G2 <pass/fail>
- Gate decisions: <gate, by, date, decision> (G4 release: <by, date>)
- Open issues: <list>
```
