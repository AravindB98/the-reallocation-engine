# Data-analytics OPT/H-1B role triage — human card

**Audience:** the candidate deciding where to spend today's application and networking hours.  
**Agent twin:** `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md`  
**Chapters:** 2 (the 3-3-2 day), 7 (sponsorship tiers), 10 (the visa clock), 11 (the scorer).  
**Status:** DRAFT. The design is complete; the prototype is **not built yet**.

## Purpose

Answer, for each data or analytics opening on your list: does the public
record show this employer sponsors H-1B for roles like this? Is the posting
real? Can the hire start before your unemployment days run out? The result is
Apply, Consider or Skip, with every number traced to where it came from. When
the record cannot answer, the card says Unknown and tells you to network, not
to guess.

## What it can verify

- Whether the employer's list of most-sponsored job titles includes one of
  your target titles.
- The employer's recorded H-1B approvals, denials and approval rate (the rate
  is stored 0–100).
- That a name you typed matches **several** legal entities (for example,
  "Deloitte" matches 7). The tool stops and asks you to pick one.
- Whether the posting looked active, uncertain or expired on the day it was
  checked.
- The timeline arithmetic: your deadline, the role's expected start, and the
  factor, with every date shown.

## What it cannot verify

- How many approvals were for **your** title. The records count approvals per
  company, not per title.
- Whether an employer missing from the data sponsors. Wayfair is missing; it
  can only be Unknown, which is not the same as "doesn't sponsor".
- Whether the employer will sponsor **you, now**. The record looks backwards.
- Salary, or the occupation code (the data has no occupation-code column, so
  role quality is not scored).
- Whether you are currently employed, whether you are STEM-eligible, or any
  immigration-law question. Take those to your DSO or an attorney.
- Your fit. You rate it yourself, and it is labeled as your input.

## Dependencies

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`:
  the sponsorship and funding records (1,557 companies with H-1B data).
- `search/examples/priya-nair/profile.yml`: the fictional sample persona.
- `scripts/score/role-scorer.mjs`: the existing scorer, used as-is.
- `scripts/ats/check-liveness.mjs`: the existing liveness checker. It needs
  Playwright and a network connection.
- Python 3 with PyYAML (already used by the repo's conformance check). Nothing
  new to install.

## Annotated commands

Scorer smoke test on the book's example (expected: Apply 2 · Consider 1 ·
Skip 2):

```bash
npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/nishant2681/runs/smoke
```

Check one posting (expected: one line, active / expired / uncertain, plus a
reason). Save the output, because a liveness value counts as a record only
when this output is kept:

```bash
npm run ats:liveness -- https://example.com/job/123
```

The prototype run. **This script does not exist yet.** The command is the
planned interface:

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --today   2026-10-02 --run-id 2026-10-02-sample-1 \
  --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-1
```

`--today` is fixed so the same inputs always give the same gate results. The
run refuses to overwrite an existing folder.

## What it produces

- `report.md`, for you. It opens with a plain summary and has one row per
  role: tier, approvals, rate, funding (context only), fit, liveness, timeline
  dates, score, decision and next action. Every value is labeled **record**,
  **your-input** or **model-judgment**.
- `run-log.json`, for the agent: every input, gate result, stop and command.
- An audit file: how many roles matched, failed to match, were ambiguous,
  were Unknown, or were gated out.
- Next actions follow the 3-3-2 day:
  - **Apply** → tailor an application (the 2 hours)
  - **Consider** → network into the company first (the 3 hours)
  - **Skip** → drop it, with the reason shown
  - **Unknown with strong fit** → network, don't apply

## Named failure modes

1. **Entity ambiguity.** "Deloitte" matches 7 legal entities. Deloitte
   Consulting has 8,810 approvals and Deloitte Financial Advisory has none
   recorded. The answer depends on which name is chosen. Mitigation: the tool
   stops and lists the candidates; you pick, and the pick is recorded.
2. **Absent sponsor.** Wayfair is not in the data, so it can only come out
   Unknown. Mitigation: Unknown routes to networking, never to Skip-as-Avoid.
3. **Substring title false positive.** "business analyst" matches "Business
   Analyst Manager - Data Distribution Team". Mitigation: the report shows the
   matched title so you can reject a bad match.
4. **Generic titles under-rate big sponsors.** Deloitte Consulting's
   most-sponsored titles are "Manager" and "Senior Consultant", so a heavy
   sponsor rates only Possible. Consulting data analysts are often titled
   "Consultant". Mitigation: none yet; this is a known limit of title
   matching.
5. **The clock zeroes everything.** For the sample persona (34 of 90 days
   used), the deadline is 2026-11-27. With a 12-week hiring lag, every role
   fails the timeline gate. This is a true result about slow processes, not a
   bug. Only roles with lags of 8 weeks or less survive.
6. **A missing gate passes silently.** The scorer treats a missing liveness or
   timeline value as 1 (fully open). Mitigation: the tool stops before scoring
   if either is missing.
7. **The profile trap.** If the profile's authorization text contains the word
   "authorized", the scorer decides you need no sponsorship and drops that
   term. Mitigation: the tool writes the scorer's profile itself, using a
   string that is checked not to trigger this.
