# H-1B wage-level check: live run, 2026-10-19

## Executive summary

**What this is.** For each software engineer job posting, this report shows which H-1B wage level the posted pay would reach in each listed city, and so how many times a registration would be entered in the H-1B lottery (once at Level I, up to four times at Level IV).

**Why read it.** Two offers with the same salary can carry different lottery odds depending on the city. A posting's range does not show this, and neither does the company's past sponsorship record.

**What it found.** 1 posting checked: 0 gave a wage level, 1 was refused or skipped with a reason. These are relative weights, not chances: the real odds depend on everyone else's registrations, which nobody can see in advance.

## Results by posting and city

| Company | Role | City | Posted base range | At the minimum | At the maximum | Entries (min to max) | To reach the next level | Status |
|---|---|---|---|---|---|---|---|---|

## Next step per posting

- **Pinterest, (no title: job-board API HTTP 404 at fetch):** Skip: the posting is closed.

## Refused or skipped

| Company | Role | Location as posted | Why |
|---|---|---|---|
| Pinterest | (no title: job-board API HTTP 404 at fetch) |  | posting is closed; a dead posting scores zero; no checkable worksite; no pay range in the posting text |

## What this run did not verify

- The SOC code the employer will file. This report assumes 15-1252 (Software Developers); another code moves every threshold.
- The actual offered salary. The posted range bounds it only if the employer keeps to its own range.
- Whether the employer will register at all, or files using another wage source.
- The chance of selection. The entries are relative weights; the real odds depend on the whole year's registration pool.
- Which office you would join when a posting lists several cities, or your home address for a remote role.
- Anything about the role's quality, the team, or the company's finances.

## Gates

- **G1, posting is live:** page checker plus the job-board answer at fetch time; uncertain results are held. Source: live:scripts/ats/check-liveness.mjs.
- **G2, visa timeline:** passed. G2a ok (2026-10-19 + 60 days = 2026-12-18; registration 2027-03-10); G2b ok (OPT ends 2028-01-14; filing window ends 2027-06-30); G2c ok (registration 2027-03-10; wage year 2026-07-01 to 2027-06-30)
- **G3, SOC code:** a person confirms that 15-1252 fits each role; until then a result is provisional.
- **G4, release:** not cleared yet: a person reads this report before acting on it.

## Run record

- Recipe: `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md` v0.1.0
- Data: OFLC wage year 2026-07-01 to 2027-06-30, source zip SHA-256 `edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f`
- Machine log: `run-log.json` in this folder
