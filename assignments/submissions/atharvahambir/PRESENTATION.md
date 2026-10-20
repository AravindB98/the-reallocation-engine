# Show-and-tell — 5 minutes

## Executive summary

This is my talk track for the in-class show-and-tell. It runs about five minutes. It shows the mode file and a real terminal run, makes one point about the information gap, shares one lesson from running it, and names one honest limit. Times are targets. Nothing here needs slides.

## Track

**0:00–0:45 · Who it's for** (show `recipes/case-data-analyst-opt-h1b-15-2051.card.md`, top)
- Me: an international MS student on OPT with a fixed end date, looking for entry-level data roles. I need an employer that sponsors H-1B and is in E-Verify for the STEM extension.
- I have a short list of companies I actually want. Today I'd open eight job boards by hand every morning.

**0:45–1:45 · The asymmetry**
- 2,108 postings on those eight boards today, and **7** fit my level, location and experience limit. I can't see that without reading all of them.
- The sponsorship data files companies under legal names. "Robinhood" is ROBINHOOD MARKETS INC with 824 approvals. Search the everyday name and you get nothing, which *looks* like "doesn't sponsor".
- I have two clocks: the OPT end date and the 90-day unemployment allowance. The earlier one is my real deadline.

**1:45–3:15 · Live run** (terminal, from the repo root)
```bash
python3 scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py --candidate private/daily-check/candidate.json --targets private/daily-check/targets.json --out-dir private/daily-check/runs --dry-run
```
- Point at the summary line: 8/8 boards, ~2,100 postings, 7 match. (`--dry-run` so the demo doesn't change saved state.)
- Open the redacted report `assignments/submissions/atharvahambir/runs/worked-run-2026-10-20/run2-8-companies/daily-check.md`. Show "Needs you" and the "filtered out — check the filters" table.
- Then show the repo's liveness gate on one posting:
```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/discord/jobs/8840756002"
```
- Backup if the network fails: the pasted output in `WORKED-RUN.md`.

**3:15–4:15 · What I learned from running it**
- The first real run stopped me twice: I'd typed a future date, and I'd never filled in my fit values. The tool refused to guess. That's the point.
- My title list had no "data scientist", so the best roles at my own companies were invisible until I added it. The filter is only as good as my inputs.

**4:15–5:00 · One honest limit**
- It can't verify that a company name points at the right employer. The only "Anthropic" in the sponsorship data is an *investment fund*, and if I tell the tool that's Anthropic, it believes me.
- Five of my seven matches have no usable sponsorship record. The tool says "unknown", never "no". The real answer needs DOL filing data the repo doesn't have yet.
- Status: RUNNABLE-LIVE, not VERIFIED. Nobody but me has run it.
