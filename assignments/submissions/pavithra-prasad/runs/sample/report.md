# H-1B wage-level check: sample run, 2026-10-19

## Executive summary

**What this is.** For each software engineer job posting, this report shows which H-1B wage level the posted pay would reach in each listed city, and so how many times a registration would be entered in the H-1B lottery (once at Level I, up to four times at Level IV).

**Why read it.** Two offers with the same salary can carry different lottery odds depending on the city. A posting's range does not show this, and neither does the company's past sponsorship record.

**What it found.** 11 postings checked: 6 gave a wage level, 5 were refused or skipped with a reason. In 1, the city changes the number of entries at the same pay. In 1, the bottom of the posted range is below the Level I wage for at least one city. These are relative weights, not chances: the real odds depend on everyone else's registrations, which nobody can see in advance.

> **Sample run.** The postings, liveness results and gate decisions in this run are constructed test data, not real postings.

## Results by posting and city

| Company | Role | City | Posted base range | At the minimum | At the maximum | Entries (min to max) | To reach the next level | Status |
|---|---|---|---|---|---|---|---|---|
| Example Ledger | Software Engineer, New Grad | New York, NY | $140,000 to $165,000 | Level II | Level II | 2 to 2 | $165,589 for Level III | checked |
| Example Ledger | Software Engineer, New Grad | Seattle, WA | $140,000 to $165,000 | Level I | Level II | 1 to 2 | $143,104 for Level II | checked |
| Example Chipworks | Software Engineer I | San Jose, CA | $135,000 to $160,000 | below Level I | Level I | 1 to 1 | $152,797 for Level I | checked |
| Example Health | Backend Engineer, Early Career | Boston, MA | $118,560 to $141,440 | Level I | Level II | 1 to 2 | $138,237 for Level II | checked |
| Example Models | Machine Learning Engineer, New Grad | San Francisco, CA | $150,000 to $190,000 | Level I | Level II | 1 to 2 | $165,131 for Level II | provisional (gate G3 not cleared) |
| Example Peninsula | Software Engineer, New Grad | Menlo Park, CA | $150,000 to $180,000 | Level I | Level II | 1 to 2 | $165,131 for Level II | checked |
| Example Peninsula | Software Engineer, New Grad | Palo Alto, CA | $155,000 to $185,000 | Level I | Level I | 1 to 1 | $187,075 for Level II | checked |
| Example Mountain | Full-Stack Engineer | New York, NY | $120,000 to $150,000 | Level I | Level II | 1 to 2 | $137,717 for Level II | checked |

## Next step per posting

- **Example Ledger, Software Engineer, New Grad:** If you get an offer here, a base of $165,589 reaches Level III in New York, NY ($25,589 above the posted minimum). The office matters: at the same pay, the entries differ by city (see the table).
- **Example Chipworks, Software Engineer I:** At the posted minimum the pay is below the Level I wage in San Jose-Sunnyvale-Santa Clara, CA: ask whether they would raise it or use another wage survey. If you get an offer here, a base of $152,797 reaches Level I in San Jose, CA ($17,797 above the posted minimum).
- **Example Health, Backend Engineer, Early Career:** If you get an offer here, a base of $138,237 reaches Level II in Boston, MA ($19,677 above the posted minimum).
- **Example Remote, Software Engineer, New Grad:** Ask the recruiter which office the role sits in, then re-run with that city.
- **Example Bay, Software Engineer:** Ask the recruiter which office the role sits in, then re-run with that city.
- **Example Quiet, Software Engineer, New Grad:** Ask the recruiter for the base pay range before spending effort here.
- **Example Closed, Software Engineer, New Grad:** Skip: the posting is closed.
- **Example Models, Machine Learning Engineer, New Grad:** If you get an offer here, a base of $165,131 reaches Level II in San Francisco, CA ($15,131 above the posted minimum).
- **Example Peninsula, Software Engineer, New Grad:** If you get an offer here, a base of $165,131 reaches Level II in Menlo Park, CA ($15,131 above the posted minimum).
- **Example Mountain, Full-Stack Engineer:** If you get an offer here, a base of $137,717 reaches Level II in New York, NY ($17,717 above the posted minimum).
- **Example Flaky, Software Engineer, New Grad:** Open the posting yourself; if it is open, clear G1 and re-run.

## Refused or skipped

| Company | Role | Location as posted | Why |
|---|---|---|---|
| Example Remote | Software Engineer, New Grad | Remote, US | remote only |
| Example Bay | Software Engineer | San Francisco Bay Area | region spans several areas |
| Example Quiet | Software Engineer, New Grad | San Francisco, CA | no pay range in the posting text |
| Example Closed | Software Engineer, New Grad | Seattle, WA | posting is closed; a dead posting scores zero |
| Example Flaky | Software Engineer, New Grad | Cambridge, MA | liveness uncertain (page timed out (constructed)); held for a person |

## Notes

- Example Ledger, Software Engineer, New Grad: office choice changes the level at the same pay: New York, NY Level II, Seattle, WA Level I
- Example Health, Backend Engineer, Early Career: hourly pay converted at 2080 hours a year
- Example Remote, Software Engineer, New Grad: Remote is one of the options: the worksite would be the home address, unknown until hire, so it cannot be checked
- Example Bay, Software Engineer: 'San Francisco Bay Area' spans more than one OFLC area (for example San Francisco vs San Jose), so it cannot be checked
- Example Mountain, Full-Stack Engineer: Denver, CO is outside the five areas in the extract, so it cannot be checked

## What this run did not verify

- The SOC code the employer will file. This report assumes 15-1252 (Software Developers); another code moves every threshold.
- The actual offered salary. The posted range bounds it only if the employer keeps to its own range.
- Whether the employer will register at all, or files using another wage source.
- The chance of selection. The entries are relative weights; the real odds depend on the whole year's registration pool.
- Which office you would join when a posting lists several cities, or your home address for a remote role.
- Whether one posted range is for the listed city or a band for every US location: Pinterest's says 'US based applicants only' and that final salary depends on location.
- Changes to the wage levels themselves. DOL proposed new levels on 27 March 2026 (Level I would rise to about today's Level II); whether that has become final was not checked. If it takes effect, these thresholds no longer apply.
- Anything about the role's quality, the team, or the company's finances.

## Gates

- **G1, posting is live:** page checker plus the job-board answer at fetch time; uncertain results are held. Source: fixture:scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/liveness-sample.json.
- **G2, visa timeline:** passed. G2a ok (2026-10-19 + 60 days = 2026-12-18; registration 2027-03-10); G2b ok (OPT ends 2028-01-14; filing window ends 2027-06-30); G2c ok (registration 2027-03-10; wage year 2026-07-01 to 2027-06-30)
  With a hiring lag of 30 days the offer comes by 2026-11-18 (in time), 60 days the offer comes by 2026-12-18 (in time), 90 days the offer comes by 2027-01-17 (in time); the search has to start by 2027-01-09 for the persona's 60-day lag.
- **G3, SOC code:** a person confirms that 15-1252 fits each role; until then a result is provisional.
- **G4, release:** cleared by constructed sample decision on 2026-10-19.

## Run record

- Recipe: `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md` v0.1.0
- Data: OFLC wage year 2026-07-01 to 2027-06-30, source zip SHA-256 `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f`
- Machine log: `run-log.json` in this folder
