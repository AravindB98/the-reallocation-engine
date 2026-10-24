# Level-matched sponsorship + OPT clock — human card

**Audience:** an international master's student finishing in December who has to decide which software postings get their limited application time this week.
**Agent twin:** `recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.md` (status DRAFT; the sample path runs end to end)
**Engine layers:** 80 Days to Stay (sponsorship) · Job-Ops (liveness) · Cognitive Pivot (wage context only)

## Executive summary

You see a posting from a company that "sponsors H-1Bs" and wonder whether to spend an hour tailoring for it. This card tells you what the recipe can answer from real records and what it can't. It checks three things: whether the company sponsored *junior* software titles, not just senior ones; whether the posting is still open; and whether hiring can finish inside your OPT unemployment window. It leaves a posting unscored rather than guess. Use it to cut your list down. Don't let it decide for you.

## Purpose

Answer, for one posting and one person: **is this worth my two research-and-apply hours, worth a networking conversation first, or a skip?** If the records don't support an answer, it says "Not scored" and tells you the one check to do by hand.

## What it can verify

- The employer is one specific row in the shipped 80 Days file. You see the name, city, and state, and you confirm it's the right company.
- That row's recorded H-1B approvals, denials, and approval rate.
- Whether the row's **top sponsored titles** include a software title at SWE I or II level. "Senior Software Engineer" alone gives a weaker tier than "Software Engineer I".
- What the repository's liveness checker printed for the posting URL, and when it ran.
- The timeline arithmetic: expected start date against your last usable unemployment day, shown in full.

## What it cannot verify

- **Whether the company sponsors today.** The record is history. One company in the sample has 122 approvals, and its live posting says it won't sponsor. Read the posting.
- **Junior titles that didn't make the top-titles list.** The list is short, so a big sponsor can look weaker than it is.
- **Companies not in the file, or in it with a blank sponsorship field.** That's about 95% of rows, and big Boston names can be absent entirely. Blank means "never matched", **not** "doesn't sponsor".
- **Whether an "active" posting is a real opening.** And a dead Greenhouse link often redirects to the careers page instead of showing an error.
- **The things you typed:** graduation window, experience cap, start date, your fit estimate, the hiring lag.
- **Your EAD date.** The recipe uses the start date you requested, not one USCIS has approved.
- **Pay.** The salary numbers are context. They are not an offer, and they don't affect the decision.

## Dependencies

- Node 20+ and `npm install` (repo root). Python is not needed for this recipe.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (ships with the repo)
- `data/sec/form-d/processed/sample/*.sample.json` (samples only; full quarters are not shipped)
- `data/bls/compact/soc_occupation_compact.csv`
- For a fresh liveness check only: network access to the posting sites, and `npx playwright install chromium` once.

## Annotated commands

Run the committed sample. It uses a fictional persona, 11 real Boston-area postings, and liveness checked 2026-10-01:

```bash
node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs
```

Expected: 4 Apply · 1 Consider · 2 Skip · 4 Not scored. Read `course/2026fa/submissions/o7580/runs/sample/triage-report.md`.

Same postings, but you're starting on 15 Feb 2027 with 42 unemployment days already used. Expected: every scored posting becomes Skip, because the clock closed.

```bash
node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs --as-of 2027-02-15 --days-used 42 --out-dir course/2026fa/submissions/o7580/runs/asof-2027-02-15
```

Refresh liveness for your own list of URLs (this is the only step that touches the network):

```bash
npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.urls.txt
```

Offline tests, fixtures only:

```bash
node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs
```

## What it produces

- `triage-report.md`, for you: a summary, then a decision, reason, and next action per posting. Every number is tagged `[record]` or `[your-input]`.
- `triage-log.json`, for an agent: the same, machine-readable, with reason codes for every unscored posting.
- The scorer's own `role-scores.json` / `.md`, unchanged.

## Your gates (the recipe stops; you decide)

| Gate | You look at | You decide |
|---|---|---|
| Company match | name, city, state of the matched row | is this the employer on the posting? |
| Not scored rows | the reason code and the named hand check | do the check, or drop the posting |
| Final decision | the Apply / Consider rows | which ones get tailoring time, and record it in the run log |

## Named failure modes (specific to this situation)

1. **History mistaken for policy.** A strong approval record next to a "we do not sponsor" posting. The record is accurate and the conclusion is wrong. *Hardest to catch for:* a student skimming 30 postings a day, who reads the company's reputation and skips the last paragraph of the posting. *Mitigation:* the posting's no-sponsorship quote is a recorded input that forces Skip, with the machine score still shown.
2. **Senior-only sponsorship read as "sponsors."** The company sponsors, but only Staff and Senior engineers. A December graduate with two years of experience applies, passes screens, and is told at offer stage that sponsorship is "for senior hires". *Hardest to catch for:* someone using company-level sponsor lists, which can't show title levels. *Mitigation:* the at-level vs above-level tier split. Senior-only tops out at Likely, which the scorer turns into Consider: network first.
3. **A blank read as a no.** About 95% of the file has no sponsorship number because the company never matched a visa record. Treating that as "doesn't sponsor" quietly deletes most of the list. *Mitigation:* blank is Not scored, with a USCIS lookup as the next step.
4. **The clock is the signal.** The same postings are Apply in October and Skip in February. A list scored once and acted on weeks later is wrong without any data changing. *Mitigation:* `--as-of` and `--days-used`, and a human-check flag when the persona looks stale.
