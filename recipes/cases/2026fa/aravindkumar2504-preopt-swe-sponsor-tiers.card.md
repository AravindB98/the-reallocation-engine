# Pre-OPT backend sponsor tiers: human card

## Executive summary

This card is for the student, or the person helping them, who reads the shortlist and decides what to do with it. The recipe looks at a public table of funded companies and says, for each one, what the records show about sponsoring a work visa for backend software jobs, how much evidence sits behind that, and where the records are silent.

Read it before you trust the list. It tells you the three things the list cannot: whether a job is actually open, whether the posting is closed to you for a reason the records cannot see, and whether "silent" means "no". A company marked Apply has earned a person's next hour, nothing more.

**Audience:** the person who has to decide whether to spend a tailoring hour on a company.
**Agent twin:** `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`
**Situation:** an international master's student who graduates in the spring, has not started work authorization, and wants a backend software job with a company that will sponsor a work visa.

## What it can verify

- A company is in the table under an exact normalized name, is missing, or shares its name with another row. It never guesses between two rows.
- The company's approvals, denials, approval rate, sponsored job titles, offered median wage and latest funding, exactly as the file records them. The approval rate matches approvals over approvals plus denials in every row that has one.
- The national median wage for the job's occupation code, from the BLS file, shown next to the offered wage as a plain ratio.
- For the few companies that also appear in the shipped SEC funding samples, whether the table's funding date and amount agree with the filing.
- Whether the candidate's own calendar leaves room for a hiring process, using only the candidate's own dates, and showing the dates behind the number.

## What it cannot verify

- That a job exists, or is open to you. The table holds history, not postings.
- That a company that sponsored before will sponsor you, for this role, now.
- That a blank means "no": the table's own README says a blank means "no trace in our data".
- That "recently funded" means "hiring". The table's funding date can be older than the newest raise, and a very large old company can show up as recently funded.
- That a title marked as backend-style is one. It is a rule, checked on a small hand-labelled sample: 2 clear false positives in 40, and 1 clear miss in 40.
- What the counts mean. Every approval and denial count is an even number and none has a year.
- Anything legal: work authorization, the unemployment-day ceiling, and STEM eligibility belong to the school's international office.

## Dependencies

- Node 20 or later, and `npm install` (the prototype uses the repository's `js-yaml`). Python's YAML package is needed only for `npm run verify`.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/bls/compact/soc_occupation_compact.csv`, and `data/sec/form-d/processed/sample/*.sample.json`.
- `scripts/score/role-scorer.mjs` (run as a command) and the fictional persona `search/examples/kiran-rao/profile.yml`.
- Provenance and the table's own audit: `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`.

## Annotated commands

Sample run (the table's newest funding date is a year old, so the acceptance flag is required, and the report says so):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir course/2026fa/submissions/aravindkumar2504/runs/2026-09-30
```

Without the acceptance flag the same command refuses (exit 3) and writes nothing.

See the calendar gate move by changing only the date and the days already used (expected: factor 0.75 in June 2027, then 0 by August 2027 with 61 days used):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-06-01 --accept-stale-vintage --out-dir /tmp/tiers-june
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2027-08-01 --days-used 61 --accept-stale-vintage --out-dir /tmp/tiers-august
```

Run the tests (offline, no network):

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/
```

To use your own persona, keep it in the untracked `search/` layer and send the output outside the tracked folders (the program refuses otherwise):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --persona search/profile.yml --out-dir private/tiers-run
```

## What it produces

- A plain-language report (`report.md`): summary, a funnel from the whole table to the shortlist, the gate table, and the companies in four groups: worth a closer look, set aside, held (never skipped), and not resolved.
- An agent log (`run-log.json`): every input hash, parameter, gate, row and label.
- The scorer's input and output files. Every value carries one of three labels: record, your-input, model-judgment (none here).

## Named failure modes

1. **A stale snapshot read as fresh.** The list looks current; the data is a year old and the funding date can lag the real raise. Hardest to catch for a student who cannot see the file's age. The recipe stops and says the age.
2. **Silence read as "no".** Most companies have no sponsorship record; dropping them throws away the ones a student can most usefully approach directly. The recipe holds them as unknown, never as skip.
3. **A company record read as an open door.** The record is company-wide; the exclusion is in the posting (U.S.-person or export-control wording, "no sponsorship", a start date before authorization begins). Hardest to catch for a student who reads "authorized to work in the U.S." as harmless boilerplate. Gate H2 exists for this, and it is a person's job.
4. **The scorer mis-reads the candidate.** The repository's scorer treats the word "authorized" as "no sponsorship needed" and ignores an explicit field, which flips a proven sponsor from Apply to Skip. The recipe writes the scorer's profile itself and refuses to continue if the scorer's answer disagrees.
5. **A backend-style title that is not one.** The title rule is a rule, not a fact. Read the matching titles in the report before believing a tier.
6. **Counts taken at face value.** Even counts with no years mean a small number may be a double count and an old one. The tiers need many approvals, and a small sample never earns the top tier.
7. **A placeholder read as a check.** The liveness value sent to the scorer is a placeholder, labelled your-input. It says "assumed open", not "checked".
