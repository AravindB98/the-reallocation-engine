# Show-and-tell — 5 minutes

## Executive summary

This is my talk track for the in-class show-and-tell. It runs about five minutes. It shows the mode file and a real terminal run, makes one point about the information gap, shares what two real days of running it taught me, and names one honest limit. Times are targets. Nothing here needs slides.

## Track

**0:00–0:45 · Who it's for** (show `recipes/case-data-analyst-opt-h1b-15-2051.card.md`, top)
- Me: an international MS student on OPT with a fixed end date, looking for entry-level data roles. I need an employer that sponsors H-1B and is in E-Verify for the STEM extension.
- I have a short list of companies I actually want. Today I'd open eight job boards by hand every morning.

**0:45–1:45 · The asymmetry**
- 2,108 postings on those eight boards on 20 October, and **7** fit my level, location and experience limit. I can't see that without reading all of them. By the next morning one of the seven was gone.
- The sponsorship data files companies under legal names. "Robinhood" is ROBINHOOD MARKETS INC with 824 approvals. Search the everyday name and you get nothing, which *looks* like "doesn't sponsor".
- I have two clocks: the OPT end date and the 90-day unemployment allowance. The earlier one is my real deadline.

**1:45–3:15 · Live run** (terminal, from the repo root)
```bash
python3 scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py --candidate private/daily-check/candidate.json --targets private/daily-check/targets.json --out-dir private/daily-check/runs --dry-run
```
- Point at the summary line: 8/8 boards, ~2,100 postings, and that day's match count (7 on 20 Oct, 6 on 21 Oct; live numbers will differ). `--dry-run` leaves the saved state alone, but it still rewrites that day's report (TODO 8). That's fine for a demo, but don't run it on a day whose report you need to keep.
- Open the redacted day-2 report `assignments/submissions/atharvahambir/runs/worked-run-2026-10-21/run1-before-inputs/daily-check.md`. Show "Closed since the last check" (Waymo), "Needs you", and the "filtered out — check the filters" table.
- Then the re-run after my inputs, `…/worked-run-2026-10-21/run2-after-inputs/daily-check.md`: **Apply 4**. Point at the labels: Discord and Notion's sponsorship is *record*, Anthropic's is *your-input*.
- Then show the repo's liveness gate on one posting:
```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/discord/jobs/8840756002"
```
- Backup if the network fails: the pasted output in `WORKED-RUN.md`.

**3:15–4:15 · What I learned from running it on two real days**
- **Day 1:** the first real run stopped me twice. I'd typed a future date, and I'd never filled in my fit values, and the tool refused to guess. My title list also had no "data scientist", so the best roles at my own companies were invisible until I added it.
- **Day 2:** the same command the next morning caught a real posting closing overnight (Waymo, Product Data Scientist). I didn't take the tool's word for it: the posting was gone from Waymo's API, and the repo's liveness checker said expired. A posting I'd have spent an hour tailoring for was already dead.
- After I recorded E-Verify and Anthropic's sponsorship, 4 roles became Apply. That's only as true as my own statements, and the report says so.

**4:15–5:00 · One honest limit**
- It can't verify that a company name points at the right employer. The only "Anthropic" in the sponsorship data is an *investment fund*, and if I tell the tool that's Anthropic, it believes me.
- On day 1, five of my seven matches had no usable sponsorship record. The tool said "unknown", never "no". Two of my four Apply rows now rest on *my* word that Anthropic sponsors. The real answer needs DOL filing data the repo doesn't have yet.
- Status: RUNNABLE-LIVE, not VERIFIED. Nobody but me has run it.
