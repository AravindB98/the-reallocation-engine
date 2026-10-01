# Pre-OPT backend sponsor tiers: human card

## Executive summary

This card is for the student, or the person helping them, who reads the shortlist. The recipe looks at a public table of companies and says, for each one, what the records show about sponsoring a work visa for backend software jobs, how much evidence sits behind that, and where the records are silent. The list cannot tell you whether a job is open, whether a posting is closed to you, or that "silent" means "no". A company marked Apply has earned a person's next hour, nothing more.

**Audience:** the person deciding whether to spend a tailoring hour on a company.
**Agent twin:** `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`
**Situation:** an international master's student who graduates in the spring, has not started work authorization, and wants a backend software job with a company that will sponsor a work visa.

## What it can verify

- A company is in the table under an exact normalized name, is missing, or shares its name with another row (it never guesses between rows).
- Its approvals, denials, approval rate, sponsored titles, offered median wage and latest funding, exactly as the file records them, and the national median wage for the occupation code from the BLS file, as a plain ratio.
- For the few companies also in the shipped SEC samples, whether the table's funding agrees with the filing (a filing made after the table's newest date is not counted as a miss).
- Whether the candidate's own calendar leaves room for a hiring process, from the candidate's own dates, shown.

## What it cannot verify

- That a job exists or is open to you, or that a company that sponsored before will sponsor you, for this role, now.
- That a blank means "no": `data/80-days-to-stay/data/README.md` says it means the data holds no "trace of sponsorship activity".
- That "recently funded" means "hiring": the table missed one round among 14 spot-checked companies, and 5 of them have no funding in it.
- That a title marked backend-style is one. The rule was written by the assistant and checked on 80 titles by one labeller (3 clear false positives in 40, 1 clear miss in 40).
- What the counts mean (all are even, none has a year), or anything legal: the school's international office owns authorization, the unemployment ceiling and STEM eligibility.

## Dependencies

Node 20 or later and `npm install`; Python's YAML package only for `npm run verify` and the conformance check. The repository's own `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/bls/compact/soc_occupation_compact.csv` and `data/sec/form-d/processed/sample/*.sample.json`; `scripts/score/role-scorer.mjs` (run as a command); and the fictional persona `search/examples/kiran-rao/profile.yml`.

## Annotated commands

The sample run writes to `/tmp`, so no tracked file changes. The table's newest funding date is a year old, so the acceptance flag is required and the report says so; without it the command refuses (exit 3):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-09-30 --accept-stale-vintage --out-dir /tmp/tiers-run
```

The calendar gate moves when only the date and the days already used change (five runs and a table: factor 0.75 in June 2027, then 0 in August 2027 with 61 days used), and the offline tests:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scenarios
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

To use your own persona, keep it in the untracked `search/` layer and send the output to `private/` (`--persona search/profile.yml --out-dir private/tiers-run`); for a persona kept there, the program refuses to write the output anywhere tracked.

## What it produces

`report.md` for the person (summary, funnel, gates, and four groups: worth a closer look, set aside, held and never skipped, not resolved); `run-log.json` for the agent; and the scorer's own files. Every value is labelled record, your-input or model-judgment (none is made about a company here); values that only describe the run are marked run-metadata.

## Named failure modes

1. **A stale snapshot read as fresh.** The list looks current; the data is a year old, which a student cannot see. The recipe stops and says the age.
2. **Silence read as "no".** Most companies have no record; they are held as unknown, never skipped.
3. **A company record read as an open door.** The exclusion is in the posting (U.S.-person wording, "no sponsorship", an early start date). Hardest to catch for a student who reads "authorized to work in the U.S." as boilerplate. Gate H2 is a person's job.
4. **The scorer mis-reads the candidate.** It treats "authorized" as "no sponsorship needed", flipping a proven sponsor from Apply to Skip. The recipe writes the profile itself and stops if the scorer's answer disagrees.
5. **A placeholder read as a check.** The liveness value means "assumed open", not "checked".
