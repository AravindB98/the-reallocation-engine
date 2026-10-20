# Data-analytics OPT/H-1B role triage — human card

**Audience:** the candidate deciding where to spend today's application and networking hours.  
**Agent twin:** `recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md`  
**Chapters:** 2 (the 3-3-2 day), 7 (sponsorship tiers), 10 (the visa clock), 11 (the scorer).  
**Status:** RUNNABLE-SAMPLE, version 0.2.0 (promoted by Nishant, 2026-10-20; see `logs/runs/2026fa-nishant2681-2.md`). Version 0.2.0 closes the last two open items: funding stays context-only (your decision), and employers missing from the data are looked up in the USCIS FY2022 H-1B employer file. Its sample run on fictional jobs (2026-10-20) gave Apply 1 · Consider 4 · Skip 3, with Wayfair now Possible. You read the audit and signed the three gates that need a person. It has not been run on real postings (RUNNABLE-LIVE).

## Purpose

Answer, for each data or analytics opening on your list: does the public
record show this employer sponsors H-1B for roles like this? Is the posting
real? Can the hire start before your unemployment days run out? The result is
Apply, Consider or Skip, with every number traced to where it came from. When
the record cannot answer, the card says Unknown and tells you to network, not
to guess.

Most sample jobs are at Form D-funded companies, the dataset's core. Deloitte and Wayfair are deliberate stress tests: Deloitte for multi-entity ambiguity, Wayfair for a heavy sponsor the Form D-based data misses entirely.

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
- Whether an employer missing from **both** sources sponsors. It stays
  Unknown, which is not the same as "doesn't sponsor".
- Whether an employer found only in the USCIS file sponsors **your kind of
  role**. The main data starts from companies that filed SEC Form D, so a big
  public sponsor like Wayfair can be absent. The USCIS FY2022 file shows
  Wayfair with 78 initial approvals, but it has no job titles. So Wayfair is
  rated **Possible** at most, never Likely or Proven.
- Whether a USCIS-only employer sponsors **now**. The USCIS file is FY2022,
  not current. It counts workers, USCIS's first decision only, under the
  employer's mailing address.
- Whether a posting belongs to the company the data matched. **Same-name
  companies** collide: searching "Affinity Solutions" jobs returns postings
  from Affinity (affinity.co), a different company from AFFINITY SOLUTIONS
  INC.
- Whether an `uncertain` posting is open. **"Uncertain" means the page
  couldn't be read**, not "maybe open". A posting known to be closed came
  back uncertain.
- Whether the employer will sponsor **you, now**. The record looks backwards.
- Salary, or the occupation code (the data has no occupation-code column, so
  role quality is not scored).
- Whether you are currently employed, whether you are STEM-eligible, or any
  immigration-law question. Take those to your DSO or an attorney.
- Your fit. You rate it yourself, and it is labeled as your input.

## Dependencies

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`:
  the sponsorship and funding records (1,557 companies with H-1B data).
- `scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv`:
  the USCIS FY2022 rows for sample employers missing from the main data (4
  rows, Wayfair only). Where they came from:
  `fixtures/uscis-fy2022.extract.provenance.md`.
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

The prototype run. Version 0.1.0 ran it without `--uscis` for the evidence
folder `course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-2/`
(`OK: 8 roles -> Apply 1 / Consider 4 / Skip 3`). Version 0.2.0 requires
`--uscis`; fill in today's date and a new run id:

```bash
python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
  --profile search/examples/priya-nair/profile.yml \
  --jobs    scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
  --csv     data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
  --uscis   scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/uscis-fy2022.extract.csv \
  --today   YYYY-MM-DD --run-id <run-id> \
  --out-dir course/2026fa/submissions/nishant2681/runs/<run-id>
```

- **Reproducible:** `--today` is fixed, so the same inputs always give the
  same gate results.
- **Never overwrites:** the run refuses an existing folder, so pick a new
  `--run-id` each time.
- **Validates first:** problems (an ambiguous company, a bad liveness label, a
  missing profile field) are all listed at once, and nothing is written.

Run the tests (offline, 58 tests, including a deliberate break attempt: a
`BROKEN-*` copy of the USCIS rule with the cap removed, which the tests must
catch):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/tests -v
```

## What it produces

- `report.md`, for you. It opens with a plain summary and has one row per
  role: tier, approvals, rate, funding (context only), fit, liveness, timeline
  dates, score, decision and next action. Every input value is labeled
  **record**, **your-input** or **model-judgment** (the sample has 0
  model-judgment values). The score and decision are labeled **scorer
  output**, because the engine's existing scorer computes them from those
  inputs.
- `run-log.json`, for the agent: every input, gate result, stop and command.
- An audit file: how many roles matched, failed to match, were ambiguous,
  were Unknown, or were gated out.
- Next actions follow the 3-3-2 day:
  - **Apply** → tailor an application (the 2 hours)
  - **Consider** → network into the company first (the 3 hours)
  - **Skip** → drop it, with the reason shown
  - **Unknown with strong fit** (your fit rating 0.7 or higher, your own
    cutoff) → network, don't apply yet. A Skip is never turned into anything
    else.

## Named failure modes

1. **Entity ambiguity.** "Deloitte" matches 7 legal entities. Deloitte
   Consulting has 8,810 approvals and Deloitte Financial Advisory has none
   recorded. The answer depends on which name is chosen. Mitigation: the tool
   stops and lists the candidates; you pick, and the pick is recorded.
2. **Absent sponsor.** Wayfair is not in the main data, which starts from
   Form D filers, so in version 0.1.0 it could only come out Unknown. The
   error looks like a stranger, not a sponsor. It is hardest to catch if you
   read Unknown as "doesn't sponsor". TouchCare is another example. Mitigation
   (0.2.0): employers missing from the main data are looked up in the USCIS
   FY2022 file. Wayfair shows 78 initial approvals there, so it is rated
   Possible. The rating is capped because USCIS has no job titles. Matching is
   exact only, because a loose match could attach another company's record.
   Unknown still routes to networking, never to Skip-as-Avoid.
3. **Substring title false positive.** "business analyst" matches "Business
   Analyst Manager - Data Distribution Team". Mitigation: the report shows the
   matched title so you can reject a bad match.
4. **Generic titles under-rate big sponsors.** Deloitte Consulting's
   most-sponsored titles in the data are, exactly: `['Manager', 'Senior
   Consultant', 'Senior Solution Specialist', 'Consultant', 'Solution
   Specialist', 'Senior Consultant', 'Manager', 'Consultant', 'Senior
   Solution Specialist', 'Solution Specialist']`. None contains a target
   title, so a heavy sponsor rates only Possible. Nishant's belief, not
   checked against data: consulting firms often hire data analysts under
   generic titles like 'Consultant', which title matching would miss.
   Mitigation: none yet; this is a known limit of title matching.
5. **The clock zeroes everything.** For the sample persona (34 of 90 days
   used), the deadline is 2026-11-27. With a 12-week hiring lag, every role
   fails the timeline gate. This is a true result about slow processes, not a
   bug. Only roles with lags of 8 weeks or less survive.
6. **A missing gate passes silently.** The scorer treats a missing liveness or
   timeline value as 1 (fully open). Mitigation: the tool stops before scoring
   if either is missing.
7. **The profile trap.** If the profile's authorization text contains the word
   "authorized", the scorer decides you need no sponsorship and drops that
   term. Mitigation: the tool writes the scorer's profile itself, from the
   persona's visa status, then checks the scorer's own answer
   (`profile_needs_sponsorship`). If the scorer read it as "no sponsorship
   needed", the run stops.
8. **Same-name collision.** A name can match the right row in the data but the
   wrong company in real life. "Affinity Solutions" searches surface postings
   from Affinity (affinity.co), a different company. Mitigation: none
   automatic. Check that the posting's company is the one in the data before
   trusting its tier.
9. **"Uncertain" is not "maybe open".** The liveness checker says
   `uncertain` when it can't read the page. A posting known to be closed came
   back uncertain with a navigation error, and still scored 0.5. Mitigation:
   every uncertain result needs a person to open the page. A later version
   should count uncertain as 0 until someone confirms the job is open.
