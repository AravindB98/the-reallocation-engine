# Data Engineer H-1B sponsor screen — human card

**Audience:** an international student deciding which Data Engineer postings deserve the next job-search hours.
**Agent twin:** `recipes/cases/2026fa/ethangomes14-data-engineer-h1b.md`
**Engine layers:** 80 Days to Stay (sponsorship vote) · Job-Ops (discovery, liveness gate) · visa timeline (gate)
**Version:** 0.5.1 · RUNNABLE-LIVE (live run on 19 postings, 2026-10-21, every gate cleared by Ethan Gomes; first real run 2026-10-20)

## Purpose

Find Data Engineer-type postings on public Greenhouse boards, then for each one answer three questions, then say Apply, Consider or Skip with every number traceable:
1. Has this company sponsored visas for Data Engineer-type work?
2. Is the posting really open?
3. Can hiring finish before the OPT clock runs out?

If the record can't answer, the tool says `missing` and why.

## What it can verify

- The company's row in the sponsor file: approvals, denials and top titles, exactly as recorded.
- That a brand-name alias you reviewed points to exactly one row in that file.
- What a Greenhouse board listed on a given day, including when each posting was first published.
- Whether a listed title is Data Engineer-type, by an explicit rule (managers, analysts and architects excluded).
- What the liveness checker said, and for Greenhouse links whether the API says the job exists (200) or is gone (404).
- The OPT arithmetic: no start before OPT; employed by OPT start + 90 days − buffer.
- That the existing scorer respected the gates. A broken scorer is caught.

## What it cannot verify

- Whether a company **sponsors now**: approvals have no year.
- **How many** sponsorships were for Data Engineers: approvals are company-wide.
- Companies headquartered **outside CA, NY, MA, WA, TX, IL**: "not found" is not "doesn't sponsor".
- **Brand vs. legal names**, unless you review an alias ("Gemini" → "GEMINI SPACE STATION LLC"). The tool can't tell you the alias is right.
- Whether a long-open posting is still being filled (Robinhood's has been open since 2022).
- Whether the fit rating is right. It's Claude's, from titles only, and since v0.5.0 it decides Apply vs Consider for strong sponsors (fit below 0.4 → Consider).
- Whether a non-Greenhouse "active" link is really the job.
- **Fit**: Claude's rating from title and level only.
- E-Verify, funding and wages: out of scope.

## Commands

| Command | Expected |
|---|---|
| `node …/find-greenhouse-postings.mjs --boards …/samples/boards-2026-10-20.txt` | 37 boards asked, 23 answered, Data Engineer-family postings saved with `fit: null` |
| `node …/sponsor-screen.mjs --today 2026-10-20 --candidates …/samples/candidates-2026-10-20.json --liveness …/samples/liveness-2026-10-20.txt --greenhouse-status …/samples/greenhouse-status-2026-10-20.json --aliases …/samples/aliases-2026-10-20.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-20` (the sample run; the frozen alias file is the one before review) | Apply 5 · Consider 8 · Skip 1 · unscored 5 (all pending alias review); 2 low-fit Applies capped at Consider |
| `node …/sponsor-screen.mjs --mode live --today 2026-10-21 --candidates …/samples/candidates-2026-10-20.json --liveness …/samples/liveness-2026-10-21.txt --greenhouse-status …/samples/greenhouse-status-2026-10-21.json --out-dir assignments/submissions/ethangomes14/runs/screen-2026-10-21-live` (the live run, after your G1/G2 review) | Apply 8 · Consider 10 · Skip 1 · unscored 0; 2 capped |
| `node scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.mjs --today 2026-10-03 --aliases scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/samples/aliases-2026-10-20.json` | Apply 3 · Consider 1 · Skip 1 · unscored 2 (pending alias review); slack 80 days |
| `node --test scripts/contrib/2026fa/ethangomes14-data-engineer-h1b/sponsor-screen.test.mjs` | 23 pass |
| …the same screen with `--today 2027-06-01 --out-dir /tmp/de-h1b-late` | Every scored posting Skip (deadline passed) |
| …with `--out-dir data/examples` | Refused, exit 2, nothing written |

Your own list:
0. Run discovery on your boards, then add a fit rating and reason to each row you keep (the screen refuses rows without one).
1. Save liveness with `{ echo "# checked: $(date +%F)"; npm run ats:liveness -- <urls> || true; } > my-liveness.txt`.
2. Optionally run `fetch-greenhouse-status.mjs --candidates <file>`.
3. Pass both files to the screen.

## What it produces

- **`screen-report.md`, for you:** a priority list (highest first), full results with labels, the timeline, a "you must confirm" checklist, companies to network into, and what it can't tell you.
- **`screen-log.json`, for software:** every value with its source label, every gate result, and input hashes.

## Your gates

| Gate | You check | You decide |
|---|---|---|
| G1 | Matched company name and titles; each pending alias | Same employer? Really Data Engineer work? Set `reviewed_by_person` only if yes |
| G2 | Each "active" link, opened; each ⚠️ evergreen flag | Is it this job? Is it still being filled? |
| G3 | OPT start, lag, buffer | Still true for me? |
| G4 | The whole report | Act on the Apply rows? |

## Named failure modes

1. **Brand-name miss (seen in both runs).** "Gemini", "Robinhood", "Upstart" and "Unite Us" don't match their legal names. v0.5.0 turns each into a pending alias that shows what it would unlock. *Hardest to catch for:* students new to the US. **Check** every alias against the company's legal page, and watch the look-alikes (four different GEMINI companies are in the file).
2. **Stale sponsor looks current.** Undated approvals make a lapsed sponsor rate "Proven". *Hardest to catch for:* everyone. **Check** with a current employee.
3. **Ghost posting passes liveness.** A dead job ID redirects to a careers page and reads "active". The Greenhouse API check catches it for Greenhouse only, so G2 stays.
4. **Six-state blind spot.** Sponsors headquartered elsewhere are invisible to a nationwide search.
5. **Evergreen posting.** A job open for years passes every liveness check. Shown as ⚠️, never scored.
