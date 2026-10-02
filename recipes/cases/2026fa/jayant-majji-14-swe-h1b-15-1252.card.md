# SWE sponsor triage — human card

**Audience:** an F-1 MS student on OPT deciding which Software Engineer roles deserve time today.
**Agent twin:** `recipes/cases/2026fa/jayant-majji-14-swe-h1b-15-1252.md`

## Purpose

Answer, for each role: has this company actually had H-1B approvals for software-titled work, is the
posting live, and does my OPT window leave time to get hired? If the data can't say, the tool says
`held` and why — it does not guess.

## What it can verify

- The company's row in the shipped 80 Days to Stay CSV (exact normalized name), and its approval counts.
- Whether "software" appears in the titles that company sponsored.
- That a blank approval count is "no record", not zero.
- That the repo's liveness check said `active`/`expired` on the recorded date.
- The scorer's arithmetic, term by term.

## What it cannot verify

- That the company sponsored **SOC 15-1252** specifically (no SOC column — title text is a proxy).
- That a `held` company never sponsored (brand name ≠ legal name gets missed).
- That counts are current, that the posting is still open today, or that the 60-day hiring lag is realistic.
- Anything about funding recency or role quality — neither can change a decision.

## Commands

Sample run (fictional persona, shipped CSV):
```bash
python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py
```

Offline tests (fixtures only):
```bash
python3 -m unittest discover -s scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252 -p "test_*.py" -v
```

Check a posting before adding it to the input file:
```bash
npm run ats:liveness -- "<posting-url>"
```

Past-OPT demo (expected: `ERROR`, exit 2, no outputs):
```bash
python3 scripts/contrib/2026fa/jayant-majji-14-swe-h1b-15-1252/run.py --today 2027-04-01
```

## What it produces

`report.md` with three lists — **apply** (tailor it), **network** (talk to someone there first),
**held** (look it up by hand) — and a "did NOT verify" section. `run.json` holds every value with its label.

## Before you act on an Apply

Check the title's seniority against your level, re-run liveness if the check is over a week old, and
read the scorer's audit row term by term.

## Named failure modes

1. **Brand-name miss.** A posting says "6sense"; the CSV says "6SENSE INSIGHTS INC". The company is
   held as no-record even though it has 62 approvals. Hardest to catch for a student who trusts
   "not found" as "doesn't sponsor" — the tool's report says exact-match only, but a tired reader skips that line.
2. **Title-proxy false positive.** A company sponsored one "Software Engineer in Test" and twenty
   non-software roles; it clears the Proven bar on total approvals. The student sees "Proven" and
   assumes software sponsorship is routine there. Only reading `top_job_titles_sponsored` reveals it.
3. **Seniority blind spot.** "Senior Software Engineer" at a Proven sponsor scores Apply even for a new
   MS grad, because sponsorship weight dominates. The scorer has no seniority term.