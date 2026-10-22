# Sources: h1b-wage-level-odds mode

## Executive summary

**What this is.** The list of everything this mode used, what I decided myself, and what Claude contributed.

**Why read it.** The course asks for honest credit, and every number in the mode traces back to one of these sources.

**What it shows.** The wage levels come from the U.S. Department of Labor, the rule from the Federal Register, the postings from public job boards, and the sponsorship context and liveness check from this repository. The code and write-ups were drafted by Claude Code; the decisions, gate clearances and the check against the Labor Department's website are mine.

## What I used

| Source | Used for | Terms |
|---|---|---|
| U.S. Department of Labor, OFLC, `OFLC_Wages_2026-27.zip` (flag.dol.gov), posted 2026-07-01, downloaded 2026-10-19, SHA-256 `edc01f64…f08f` | the wage-level thresholds and the county-to-area map | U.S. government work |
| DOL OFLC Wage Search (flag.dol.gov/wage-data/wage-search), searched 2026-10-19 | checking four values by hand | U.S. government website |
| *Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions*, 90 FR 60864 (29 Dec 2025, effective 27 Feb 2026) | entries per level, below Level I, several locations | U.S. government work |
| Greenhouse public job-board API | 13 live postings; only the title, location, link, pay sentences and a SHA-256 of the full text are stored | public postings |
| `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | sponsorship context | this repository |
| `scripts/ats/check-liveness.mjs`, `npm run verify`, `npm run doctor` | the liveness gate and conformance | this repository |
| Python standard library | everything else | PSF licence |
| ChatGPT review of the submission zip, 2026-10-21 | an outside strict-TA review; its points were checked against the code before anything changed | my own use of the tool |

## What I made or decided

- Chose to build a new mode on H-1B wage levels after reviewing my earlier submission and the class's open pull requests.
- Accepted the data sources, the rounding rule, the default job code and the report columns (the closed TODOs in the recipe).
- Decided every gate in the live run: G1 for 13 postings (I opened every one myself), G2 (re-confirmed in my own words), G3 from my own review of each title (9 clear, 1 hold), and G4 after reading the report.
- Noticed, when reading the full Pinterest posting, that its range is for all US-based applicants.
- Checked the Santa Clara County wage levels on the Labor Department's website and took the screenshot in `evidence/`.

## What Claude (Claude Code, Opus 5.5) contributed

- Researched the weighted-selection rule and the OFLC data, and checked the class's pull requests for overlap.
- Wrote `build_extract.py`, `wage_level.py`, `fetch_postings.py`, the 37 tests, the fixtures and the city table.
- Checked the outside review's points against the code and fixed the confirmed ones (gate enforcement, stopped postings, the Pinterest note, the output contract).
- Wrote the recipe and card, the domain justification, this worked run and the run log, and ran every command shown.
- Reused the company-name match, liveness handling and labelled-value format from my Recipe Design prototype (PR #33).

## Personal data

The persona is fictional. No résumé, application tracker, contact or immigration detail of mine is in any file.
