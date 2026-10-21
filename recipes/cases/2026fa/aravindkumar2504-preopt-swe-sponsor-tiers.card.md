# Pre-OPT backend sponsor tiers: human card

## Executive summary

This card is for the student, or the person helping them, who reads the shortlist. The mode does two things. First it looks at a public table of companies and says, for each one, what the records show about sponsoring a work visa for backend software jobs, how much evidence sits behind that, and where the records are silent. Then, for the companies worth a closer look, it finds a live backend posting, checks that the page is still up, and quotes the posting's sentences about sponsorship, citizenship and clearance, so a person can read each posting and decide. In its first live run, 7 of 59 shortlisted companies ended with a posting that a person cleared; most of the rest could not be checked at all. A cleared posting has earned a closer look and a question about when the job starts, nothing more.

**Audience:** the person deciding whether to spend a tailoring hour on a company or a posting.
**Agent twin:** `recipes/cases/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers.md`
**Situation:** an F-1 student in a STEM master's program, close to graduating, whose OPT has not started, who will need an H-1B sponsor and wants a backend software job (SOC 15-1252).
**Stage:** a draft: eleven proposals for the engine and its data are still open. The sample run and the live run do not change that.

## What it can verify

- A company is in the table under an exact normalized name, is missing, or shares its name with another row (it never guesses between rows).
- Its approvals, denials, approval rate, sponsored titles, offered median wage and latest funding, exactly as the file records them, and the national median wage for the occupation code from the BLS file, as a plain ratio.
- For the few companies also in the shipped SEC samples, whether the table's funding agrees with the filing (a filing made after the table's newest date is not counted as a miss).
- Whether the candidate's own calendar leaves room for a hiring process, from the candidate's own dates, shown.
- That a company's job board answered, how many jobs it listed, and which of them fit the rules.
- What a posting page did when the liveness checker opened it, with the time and the checker's own words.
- Which sentences in a posting mention sponsorship, citizenship, clearance, work authorization, degree level, dates or contract terms, quoted word for word.
- What the named person decided about each posting, and when.

## What it cannot verify

- Anything about companies whose job board it could not find (33 of 59 in the first live run): they are on another system, on their own site, or under a name it did not try. The report names them all.
- That a posting is still open after the check, or that the screen caught every trap. A posting with no quoted sentence is not a pass; the person reads it.
- Whether an employer will wait until you can legally start. For the fictional candidate that is about seven months after the run, and nothing in the mode checks it yet; the report warns about it.
- That a title without a senior marker is entry level: "Software Engineer II" passes the rule.
- That a company that sponsored before will sponsor you, for this role, now. The record is company-wide history.
- That a blank means "no": `data/80-days-to-stay/data/README.md` says it means the data holds no "trace of sponsorship activity".
- That "recently funded" means "hiring": the table missed one round among 14 spot-checked companies, and 5 of them have no funding in it.
- That a title marked backend-style is one. The rule was written by the assistant and checked on 80 titles by one labeller (3 clear false positives in 40, 1 clear miss in 40).
- Whether you fit the job (fit is not scored), what the counts mean (all are even, none has a year), or anything legal: the school's international office owns authorization, the unemployment ceiling and STEM eligibility.

## Dependencies

Node 20 or later and `npm install`; the Chromium browser the liveness checker drives (`npx playwright install chromium`); Python's YAML package only for `npm run verify` and the conformance check. The repository's own `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/bls/compact/soc_occupation_compact.csv` and `data/sec/form-d/processed/sample/*.sample.json`; `scripts/score/role-scorer.mjs` (run as a command); the job-board scanner and checker in `scripts/ats/`; and the fictional persona `search/examples/kiran-rao/profile.yml`. The live step needs the network.

## Annotated commands

The sample run writes to `/tmp`, so no tracked file changes. The table's newest funding date is a year old, so the acceptance flag is required and the report says so; without it the command refuses (exit 3):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-run
```

Check one posting yourself, the way gate H1 does. An open posting prints "active"; a made-up job number on the same board prints "expired":

```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/5194598007"
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/1"
```

The calendar gate moving when only the date and the days already used change, and the offline tests:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs scenarios
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

The full live step (find boards, scan, choose postings, check them, quote them, then a person decides) is step 6 and 7 of the recipe's workflow. To use your own persona, keep it in the untracked `search/` layer and send the output to `private/` (`--persona search/profile.yml --out-dir private/tiers-run`); for a persona kept there, the program refuses to write the output inside the repository anywhere but `private/`.

## What it produces

- `report.md` for the person (summary, funnel, gates, and four groups: worth a closer look, set aside, held and never skipped, not resolved); `run-log.json` for the agent; and the scorer's own files.
- From the live step, `report-live.md` for the person (summary, the funnel from the shortlist to a decision, one row per posting with both checks and the quotes, who decided, and every company the check could not reach); `run-log-live.json` for the agent; and the evidence files as written, including the checker's own output and the person's decisions.

Every value is labelled record, your-input or model-judgment, or as the named person's decision; values that only describe the run are marked run-metadata.

## Named failure modes

1. **A stale snapshot read as fresh.** The list looks current; the data is a year old, which a student cannot see. The recipe stops and says the age.
2. **Silence read as "no".** Most companies have no record; they are held as unknown, never skipped.
3. **A company record read as an open door.** The exclusion is in the posting (U.S.-person wording, "no sponsorship", an early start date). Hardest to catch for a student who reads such sentences as boilerplate. The screen quotes them; gate H2 is a person's job. A conditional clause (for example, "may decline" if the job needs export-controlled technology) is shown, not treated as a no.
4. **A listed job that is already gone.** A job board can keep listing a posting whose page returns "not found" (Xage Security in the first live run). The liveness check catches it before anyone tailors an application.
5. **A short list that looks complete.** The live check reaches only three job-board systems, so most companies drop out without a word on any job board. The report names every company it could not reach.
6. **A cap that chose by alphabet.** When many companies have the same score, the cap of 8 postings keeps the first by name: in the first live run it left out Zscaler (802 approvals) and kept Xage Security (24). The report says so; a better tie-break is an open proposal.
7. **The scorer mis-reads the candidate.** It treats "authorized" as "no sponsorship needed", flipping a proven sponsor from Apply to Skip. The recipe writes the profile itself and stops if the scorer's answer disagrees.
8. **A placeholder read as a check.** In the base run, the liveness value sent to the scorer means "assumed open", not "checked". Only the live step checks, and only the postings it chose.
9. **A job you cannot start in time.** A posting open in October usually wants someone soon; a candidate before OPT may not be able to start for months. The timeline gate reads "open" because the unemployment clock has not started, which is not the same as an employer willing to wait. Nothing checks this yet (an open proposal); the report warns about it.
