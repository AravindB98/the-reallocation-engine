---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "final live run 2026-10-21, G1-G3 decided and G4 released by Pavithra-Prasad (G3: 9 clear, 1 hold); logs/runs/2026fa-pavithra-prasad-2.md"
attestation: null
recipe_version: 0.1.0
---

# Card: H-1B wage-level odds for a new-grad software engineer

## Executive summary

**What this is.** A one-page guide to a check you can run on software engineer job postings before you apply or negotiate.

**Why read it.** The H-1B lottery now gives a registration more entries when the pay reaches a higher Labor Department wage level, and the levels depend on the city. The same pay can be worth twice the entries in one city as in another.

**What it tells you.** For each posting and city: the wage level at the bottom and top of the posted range, the lottery entries, and the base pay that would reach the next level. If it cannot tell, it says why instead of guessing.

## Same pay, different cities (software developers, 2026-27 levels)

| Base pay | Boston | New York | San Francisco | San Jose | Seattle |
|---|---|---|---|---|---|
| $130,000 | Level I (1 entry) | Level I (1) | below Level I (1) | below Level I (1) | Level I (1) |
| $140,000 | Level II (2) | Level II (2) | Level I (1) | below Level I (1) | Level I (1) |
| $150,000 | Level II (2) | Level II (2) | Level I (1) | below Level I (1) | Level II (2) |
| $175,000 | Level III (3) | Level III (3) | Level II (2) | Level I (1) | Level III (3) |

"Below Level I" still counts as one entry, but an H-1B at that pay would need the employer to raise it or use another wage survey.

## How to read your report

1. **Status "checked"**: all four gates passed; the numbers stand.
2. **Status "provisional"**: you have not yet confirmed the job code (gate G3).
3. **Refused**: the report names the one missing fact (the office, the pay range); ask the recruiter and re-run.
4. **"To reach the next level"** is your negotiation number for base pay.

## What it cannot tell you

- Your chance of being selected. Entries are relative weights; the odds depend on everyone else's registrations.
- The job code the employer will file, which office you will join, or the final offer.
- Whether the sponsorship record matches the right legal company.

## Run it

```bash
python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample
```

Full procedure: `recipes/cases/2026fa/pavithra-prasad-h1b-wage-level-odds.md`.
