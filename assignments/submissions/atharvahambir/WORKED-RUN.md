# Worked run — daily data-role check on eight real job boards, 2026-10-20

## Executive summary

This is the record of running the mode for real: what went in, the exact commands, the output they printed, how I checked it, and what it got wrong. On 20 October 2026 the check read the live job boards of eight companies I actually target: 2,108 open postings. It returned the 7 that match my requirements (entry-level data titles, not senior, US or US-remote, at most three years asked). The repository's own liveness checker confirmed all 7 are still open. An independent re-fetch matched every count. None of the 7 is a ready "apply": five need a sponsorship record the public data doesn't have, and none has had its E-Verify status looked up yet. The tool held them for me instead of guessing. I reviewed the kept and dropped lists and cleared them. Two real problems surfaced: a dry run overwrote the day's report, and the tool can't tell when a company's legal name points at the wrong entity.

The old worked run (one board, 2026-10-03) is kept in `archive/WORKED-RUN-2026-10-03.md`.

## Run record

- **Mode:** `recipes/case-data-analyst-opt-h1b-15-2051.md` v0.2.0 (runs as prototype `scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py`; the two live runs printed v0.1.0, and the only change before the v0.2.0 dry-run repeat was the version string and a path comment)
- **By:** Atharva Hambir · 2026-10-20, machine clock (EDT)
- **Evidence folder:** `runs/worked-run-2026-10-20/`. It holds redacted copies of the real outputs, the terminal output, liveness, cross-check and break attempts. The raw board responses and the unredacted reports stay in the gitignored `private/daily-check/`.

## Inputs (anonymized)

| Input | Value | Label |
|---|---|---|
| Candidate file | my real one, `private/daily-check/candidate.json` (gitignored) | your-input |
| OPT end date, unemployment days used, buffer days | **redacted** (real immigration details are personal data) | your-input |
| Unemployment days counted as of | 2026-10-20 | your-input |
| Target titles + fit (0–1) | data analyst 1 · data engineer 1 · data scientist 0.8 · analytics engineer 0.8 · BI analyst 0.7 · business analyst 0.6 | your-input |
| Filters | exclude senior/sr/staff/lead/principal/manager/director/head/vp/intern/co-op/III/IV; ≤ 3 years; US or US-remote | your-input |
| Targets (my real list) | Greenhouse: Robinhood, Anthropic, Datadog, Discord, Waymo · Ashby: Ramp, Perplexity, Notion | your-input |
| Legal names in the sponsorship data | ROBINHOOD MARKETS INC, DATADOG INC, DISCORD INC, NOTION LABS INC, PERPLEXITY AI INC, RAMP BUSINESS CORP; Anthropic and Waymo **left blank** (no correct row exists) | your-input (proposed by the agent, confirmed by me) |
| E-Verify | Robinhood "enrolled" (my statement, unverified); all others **not checked** | your-input |
| Hiring time | 8-week default for every company | your-input |

## Commands and real output

### 0. The intake gate stopped me twice first

Both stops were real, and both are in `runs/worked-run-2026-10-20/breaks/intake-stops.txt`:

```
✗ stopped at the intake gate: visa.unemployment_days_as_of 2027-03-01 is after today 2026-10-20
EXIT=2
✗ stopped at the intake gate: search.titles[0].fit (data analyst) is missing or not a number — fill it in; there is no default
EXIT=2
```

I fixed both by hand. The tool never filled a value.

### 1. Live run, seven companies

```
$ python3 scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py --candidate private/daily-check/candidate.json --targets private/daily-check/targets.json --out-dir private/daily-check/runs
Tue Oct 20 13:37:50 EDT 2026
✓ 2026-10-20 — 7/7 boards read · 1737 postings listed · 1 match (1 new)
  Apply 0 · Consider 0 · Skip 0 · Held for you 1 · closed 0 · network 4 · not checked 0
  private/daily-check/runs/2026-10-20/daily-check.md  +  private/daily-check/runs/2026-10-20/daily-check.json
real 4.03
user 0.48
sys 0.06
EXIT=0
```

```
$ npm run ats:liveness -- https://job-boards.greenhouse.io/anthropic/jobs/5424111008
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/anthropic/jobs/5424111008

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/anthropic/jobs/5424111008

Results: 1 active  0 expired  0 uncertain
EXIT=0
```

### 2. Live run, eight companies

I then added Waymo and "data scientist" as a target title (fit 0.8).

```
$ python3 scripts/contrib/2026fa/atharvahambir-reallocation-engine/daily_check.py --candidate private/daily-check/candidate.json --targets private/daily-check/targets.json --out-dir private/daily-check/runs
Tue Oct 20 13:48:08 EDT 2026
✓ 2026-10-20 — 8/8 boards read · 2108 postings listed · 7 match (6 new)
  Apply 0 · Consider 0 · Skip 0 · Held for you 7 · closed 0 · network 2 · not checked 0
  private/daily-check/runs/2026-10-20/daily-check.md  +  private/daily-check/runs/2026-10-20/daily-check.json
real 3.53
user 0.57
sys 0.10
EXIT=0
```

```
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/discord/jobs/8840756002" "https://jobs.ashbyhq.com/notion/9fc52821-c394-4a80-85ba-5f1d7c36fb2b" "https://job-boards.greenhouse.io/anthropic/jobs/5209196008" "https://job-boards.greenhouse.io/anthropic/jobs/5424111008" "https://jobs.ashbyhq.com/ramp/aa5512b1-d973-4d74-9d10-d56446ecf803" "https://careers.withwaymo.com/jobs?gh_jid=7455592" "https://careers.withwaymo.com/jobs?gh_jid=8286842"
Checking 7 URL(s)...

✅ active     https://job-boards.greenhouse.io/discord/jobs/8840756002
✅ active     https://jobs.ashbyhq.com/notion/9fc52821-c394-4a80-85ba-5f1d7c36fb2b
✅ active     https://job-boards.greenhouse.io/anthropic/jobs/5209196008
✅ active     https://job-boards.greenhouse.io/anthropic/jobs/5424111008
✅ active     https://jobs.ashbyhq.com/ramp/aa5512b1-d973-4d74-9d10-d56446ecf803
✅ active     https://careers.withwaymo.com/jobs?gh_jid=7455592
✅ active     https://careers.withwaymo.com/jobs?gh_jid=8286842

Results: 7 active  0 expired  0 uncertain
EXIT=0
```

(The first attempt at this command failed before running anything: zsh read the `?` in the Waymo URLs as a filename pattern. Quoting the URLs fixed it.)

### What it returned: the 7 matching postings

These come from `daily-check.md`. All are held for me ("Needs you"):

| Company | Role | Where | Experience asked | Sponsorship evidence | What's missing |
|---|---|---|---|---|---|
| Discord | Data Scientist – Client Platform | US | within limit | Proven, 122 approvals, 100% | E-Verify; once recorded, the scorer says **Apply 0.555** |
| Notion | Data Scientist, Growth | US-remote | not stated | Proven, 98 approvals, 98% | E-Verify; once recorded, the scorer says **Apply 0.555** |
| Anthropic | Data Scientist, Safeguards | US-remote | **mixed** (some statements over 3 yrs) | no row in the data | sponsorship record + E-Verify; open 140 days |
| Anthropic | Recruiting Analytics Data Engineer | US | not stated | no row in the data | sponsorship record + E-Verify |
| Ramp | Data Scientist, Finance | US-remote | within limit | row exists, no H-1B fields | sponsorship record + E-Verify; open 70 days |
| Waymo | Data Scientist | US | within limit | no row in the data | sponsorship record + E-Verify; open 307 days |
| Waymo | Product Data Scientist – Marketplace Logistics | US | within limit | no row in the data | sponsorship record + E-Verify |

The report also lists **Network, don't apply** for Robinhood and Datadog: proven sponsors with nothing open for me today. It lists **24 target-title postings dropped**, each with its reason (16 for senior/staff/lead/manager in the title; 8 for asking 4–7+ years, 7 at Anthropic and 1 at Ramp).

The existing scorer `scripts/score/role-scorer.mjs` ran on the two postings with sponsorship evidence:

```
✓ scored 2 roles → Apply 2 · Consider 0 · Skip 0 (skip 0%)
| Discord — Data Scientist - Client Platform | 0.555 | Apply | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| Notion — Data Scientist, Growth            | 0.555 | Apply | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
```

### Human gate (G7)

Atharva Hambir · 2026-10-20 · **cleared.** The kept list and the dropped-with-reason list are right. The "staff" drops, including Perplexity's "Member of Data Staff", are accepted as intended. Note on record: Anthropic Data Scientist, Safeguards is a borderline keep (mixed experience statements), so I should read it myself.

## Verified vs. inferred

| Line in the output | Established by | Kind |
|---|---|---|
| 8/8 boards read, 2,108 postings, per-board counts | board APIs; independently re-fetched (see Verification) | **verified** (record) |
| The 7 postings exist and are open | in today's API response **and** `npm run ats:liveness` = active ×7 | **verified** (record, two independent checks) |
| Discord/Datadog/Notion/Robinhood are Proven sponsors (counts, rates) | exact row in the 80 Days CSV (sha256 `eccdee2addf472b1…`) | **verified** (record), but past filings with undocumented years |
| Anthropic / Waymo have "no row"; Ramp / Perplexity have "no H-1B fields" | exact-name lookup in the CSV | **verified** that the data is silent. *Not* verified that they don't sponsor |
| Title family, location class, experience class | fixed text rules over the posting text; matched text kept | rule output on record text: can misread (Safeguards = "mixed") |
| The "staff"/"senior" drops are correct | **me** at G7 | **human judgment** |
| Legal names (`csv_name`) for 6 companies | proposed by the AI agent, confirmed by me | **judgment**, not verified by the tool (see break b2) |
| Timeline factor 1.0, expected start 2026-12-15 | my redacted dates + the 8-week default | **inferred** from my estimates |
| E-Verify | Robinhood: my statement; others: unknown | **not verified** |
| Apply 0.555 for Discord and Notion | existing scorer on the labeled inputs | **computed**; the inputs fit and timeline are mine |
| "Network into Robinhood/Datadog" | the recipe's rule: sponsor on record and 0 matches | rule output, not advice |

No language model was called at run time. Nothing in the output carries the `model-judgment` label.

## Verification

1. **Independent re-fetch** (`breaks/cross-check.txt`). Plain `urllib` re-read all eight board APIs four minutes after run 2, without the tool's fetcher. All eight counts matched (153/670/432/46/370/168/134/135 = 2,108), and all 7 matched posting IDs were present.
2. **Second, independent liveness check.** The repo's own `npm run ats:liveness`, a different code path (Playwright, the public job page), returned active ×7.
3. **Arithmetic by hand.** 0.9 × 0.35 + 0.8 × 0.3 = 0.315 + 0.24 = 0.555, the scorer's composite for both scored roles.
4. **Dry-run repeat** (`breaks/b3-*.txt`). Same counts (8/8 · 2,108 · 7 match, 0 new now that they're known), and the `state.json` sha256 was identical before and after (`cf408987…`).
5. **Tests after the file moves.** 18/18 offline tests pass, and all 4 break mutants are still caught.
6. **Privacy.** The tracked copies were redacted by a script kept in `private/`, so the values it hides aren't in the repo. It also hides slack days, because slack plus the start date would give away the OPT end date. A search of the tracked tree for my real dates returns 0 hits.

## Attestation

- Recipe: case-data-analyst-opt-h1b-15-2051 v0.2.0
- By: Atharva Hambir · 2026-10-20

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Live run, 7 real boards | exit 0 · 7/7 read · 1,737 listed · 1 match | every board read; few matches at entry level |
| Live run, 8 real boards (added Waymo + data scientist) | exit 0 · 8/8 · 2,108 · 7 match · 7 held | Waymo's "Data Scientist" kept, which it was |
| `npm run ats:liveness` on all 7 kept | 7 active | active (they were in today's API) |
| Independent re-fetch of the 8 APIs | all counts and 7 IDs match | identical |
| **Break:** unemployment as-of date in the future (real mistake) | exit 2, nothing fetched | stop, no guess |
| **Break:** fit values left empty (real) | exit 2, "there is no default" | stop, no default |
| **Break:** wrong Ashby board name `perplexity-ai` | exit 0 · 7/8 read · Perplexity "board could not be read: HTTP 404 … check the careers page by hand" · nothing closed | one company not checked, nothing else changes |
| **Break:** Anthropic `csv_name` set to the investment fund | accepted; Anthropic shown as "no H-1B fields" from the fund's row | ideally a warning; **it gave none** (a real limit) |
| **Break:** `--dry-run` repeat | counts identical, state sha256 identical, **but the day's report was overwritten** | report untouched; **it was not** (TODO 8) |
| 18 offline tests + 4 mutants after moving files | OK · all 4 caught | same as before the move |

### Did not test

- **E-Verify** for any company except Robinhood (and that one is only my statement). That's why every match is "Needs you".
- Whether any of the 7 is **actually being filled**. Listed ≠ hiring; Waymo's Data Scientist has been open 307 days.
- Whether Anthropic, Waymo, Ramp or Perplexity **sponsor H-1B**. The shipped data can't say. A DOL LCA lookup is a proposed addition.
- **Real hiring times.** Every company uses the 8-week default.
- A **second day's run**, so the new/closed diff hasn't been tested against real postings closing.
- Boards on **Workday, iCIMS, Lever or SmartRecruiters**.
- A run by **anyone other than me**. That's why the mode claims RUNNABLE-LIVE, not VERIFIED.

### Broke during testing, fixed

- **Liveness command failed in zsh** (`no matches found`) because of the `?` in Waymo URLs. Fixed by quoting the URLs; the recipe's workflow now says to quote them.
- **Ashby blocked my cross-check script** (HTTP 403 with Python's default user agent). Fixed by sending a user-agent header. The tool's own fetcher wasn't affected.
- **The dry run overwrote the run-2 report.** Not fixed in code. Logged as TODO 8 in the mode. The run-2 terminal output is preserved, and the tracked run-2 report is the dry-run copy, with the same postings and "0 new".
- **First redaction leaked a derivable date.** `slack_days` plus the start date gave away the OPT end date. Fixed by redacting slack too, before anything was committed.

## Reflection

**What went well.**
- The gates did their job on a real person's real mistakes. A future date and five empty values each stopped the run with the exact field to fix.
- "Unknown" never turned into "no". Five of the seven matches would have vanished if a missing sponsorship record had been scored as zero.
- Two independent checks (a re-fetch and the repo's liveness checker) agree with every count and every posting.

**What the mode got wrong or missed.**
- My original title list had no "data scientist". The best-matching roles at my own target companies were invisible until I added it. The filter is only as good as my phrase list.
- The legal-name join is the weakest link. Anthropic and Waymo aren't in the data at all, and the only "Anthropic" is a fund the tool would accept without complaint.
- The dry run isn't fully side-effect-free.
- 2,101 of 2,108 postings were dropped by text rules before any score. The scorer's "skip rate 0%" line only describes the 2 it saw, which could mislead a reader into thinking the run skipped nothing.

**Next steps.**
1. Look up E-Verify for the 7 companies and record the results.
2. Find Anthropic's and Waymo's real H-1B filings (DOL LCA disclosure data) and record them as sponsorship overrides with a source.
3. Fix TODO 8: the dry run writes to its own folder, with a test.
4. Run again tomorrow to exercise the new/closed diff on real postings.
5. Read the Anthropic Safeguards posting myself, as noted at the gate.
