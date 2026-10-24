# wage-level-floor — human card

## Executive summary

**What this is.** A one-page guide to a tool that reads the pay range on a job posting and tells you how many times an H-1B registration for that job would be entered in the lottery. Since 2026 the lottery is weighted by the government's four wage levels: Level I is entered once, Level IV four times.

**Why read it.** For a software developer in the Boston area the lines are $114,275 (Level I), $138,237 (II), $162,198 (III) and $186,160 (IV). Most new-graduate ranges cross one of them. A range of $116,000–$174,000 means the same offer could carry one entry or three, and $138,237 is the number that separates one from two. You can know that before the recruiter call.

**What it found on 2026-10-18.** Across 21 Boston-area companies that have sponsored software engineers, 13 new-grad-shaped postings were in the area. 11 could be placed: 6 cross a level line inside their range, and 5 start below Level I (Vestmark $90,000–$115,000, PathAI $96,750–$148,350, Cohere Health $107,000–$130,000). 2 had no range.

**Audience:** an MS CS graduate on F-1 OPT applying for backend / platform / full-stack roles in the Boston area.
**Agent twin:** `recipes/cases/2026fa/mayank-1024-wage-level-floor.md` (DRAFT v0.1.0)
**Engine layers:** 80 Days to Stay (which companies sponsor) + Job-Ops (live boards, liveness). It also touches the wage data under the Cognitive Pivot layer — the DOL levels are computed from BLS OEWS wages — but it does not use that layer's cognitive-demand scoring.

## How to read your report

| You see | It means | Do this |
|---|---|---|
| **CLIFF-IN-RANGE**, line $138,237 | an offer at or above the line gets 2 entries, below it 1 | apply; if an offer comes, that number is your negotiation target |
| **FLAT** | the whole range is one level | negotiating within the range won't change your lottery weight |
| **FLOOR-BELOW-L1** | the bottom of the range is under Level I for your occupation here | know that any offer must clear $114,275 to register on government data |
| **RANGE-BELOW-L1** | the whole range is under Level I | ask which occupation code they file and whether they use a private wage survey |
| **I-group\*** in the entries column | below Level I; it can only register with the Level I group via a private survey | same question to the recruiter |
| last column "15-1253: II→IV" | under a different occupation code, the same range lands on different levels | ask which code; never ask them to file a code that doesn't match the job |
| refused: zone-ambiguous | the posting lists Zone A/B/C pay and doesn't say which is Boston | tell the tool which zone (`zone_choice`) after asking |

## What it can verify

- The four wage lines, exactly as the Department of Labor published them (wage year July 2026 – June 2027).
- The range a company's job board published at capture time, and whether it came from the board's pay field or from the description text.
- Which level each end of the range reaches and what that means in lottery entries under the rule.

## What it cannot verify

- **Which occupation code your employer will file.** That's their decision, and it can move you up to two levels either way. Ask.
- **Your offer.** A posted range isn't an offer. Re-run with the real number when you have it.
- **Your odds.** The percentages shown are the government's projection from before the first weighted lottery, not results.
- **That the company will sponsor you, or is not cap-exempt** (universities skip the lottery entirely).
- **That a posting is still open.** Run `npm run ats:liveness -- <url>` first. "Uncertain" means open it yourself.
- **That a board is really the company's** (links were guessed), and **that a range read from the description text is base pay for Boston.**

## Two rules people miss

- If two employers register you in the same season, the government uses the **lower** of the two levels.
- If you'd work in several places, the **lowest** level among them counts.

## Annotated commands

```bash
# once per wage year: download the DOL table (12.6 MB) and cut the MA/NH slice
bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs

# capture today's boards (network), then place the ranges (offline)
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-pay-ranges.mjs --out private/wlf/pay-snapshot.json
node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs \
  --persona private/my-wage-persona.json --snapshot private/wlf/pay-snapshot.json --out-dir private/wlf

# before tailoring anything
npm run ats:liveness -- "<posting url>"
```

Copy `persona.example.json` to `private/` and put your real dates and any offer there. Nothing in `private/` is committed.

## Dependencies

Node 20+ and `npm install`. Network only for the two fetch scripts and the liveness check (`npx playwright install chromium` once).
