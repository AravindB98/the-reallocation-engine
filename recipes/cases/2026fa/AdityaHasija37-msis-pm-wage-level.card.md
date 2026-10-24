---
status: DRAFT
todos_open: 0
last_gate: "see recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md"
attestation: null
recipe_version: 0.1.0
---

# Card — Will this salary get me 1 lottery entry or 4?

## Executive summary

**What this is.** A one-page guide for an international product-management job seeker.
Since 2026 the H-1B lottery weights each registration by wage level, from 1 entry to 4.
This tool takes a real job posting's pay range and looks it up in the Labor
Department's official wage tables for that city, under each job code the employer
might use. It shows the entries the salary would earn and the raise needed for the next
level.

**Why read it.** Product managers have no job code of their own. The employer picks one,
and the choice can change your entries from 1 to 4 for the same salary. You cannot see
that choice on a job posting.

**What it found first time out.** For one live Senior PM posting at $193,500 in San
Francisco, the entries ranged from 1 to 4 depending on the job code. For the three
postings checked, national pay figures made the salary look higher-level than the
official city table in 23 of 54 checks, and never lower.

## When to use it

- You have a live posting with a pay range in San Francisco–Oakland, San Jose or Seattle
  (the first run covered San Francisco and Seattle; San Jose is in the data but untested on a posting).
- Before a final-round conversation, or when an offer arrives.

## What you must do yourself (the tool will not run without you)

1. **Read the pay sentence.** If it says "on-target earnings", "OTE", "commission" or
   "total compensation", it is not base salary, and the tool will refuse it. Ask the
   recruiter for the base.
2. **Approve the list of job codes** to test. It is your judgment, not a fact.
3. **Check that the wage-level rule hasn't changed** (Federal Register, Labor Department
   news) within 30 days of running.
4. **Read the report**, including what it cannot tell you, before raising it with an
   employer.

## How to read the report

| You see | It means | Do this |
|---|---|---|
| Entries `1/2/2` under one code and `4/4/4` under another | The employer's job-code choice matters more than the salary | Ask the employer's immigration team which code and level they plan to file |
| `0*` | The salary is below the minimum wage level for that code | If they plan that code, the salary must go up |
| `+$7,782 → IV` | You are $7,782 short of the next level under that code | A concrete negotiation number |
| `⚠ disagrees` | National pay data would have misled you here | Trust the city table |
| `refused` / `stopped` | Missing or unsuitable data; the tool will not guess | Get the missing fact from the employer |

## What it will never tell you

- Your chance of being selected. Entries are a weight, not a probability.
- Which code the employer will actually file.
- Whether fees or entry rules (a $100,000 entry payment through September 2027; a proposed
  fee of about $103,000 on lottery petitions) will make an employer stop sponsoring.
- Anything about E-Verify or whether a role relates to your degree.

## Run it

```bash
python3 scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py run --run-date YYYY-MM-DD
```

The full specification is in the recipe file next to this card.
