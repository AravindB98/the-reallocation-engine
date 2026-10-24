# DS new-grad H-1B sponsor triage — human card

**Audience:** an F-1 master's student graduating December 2026 who must decide which Data Scientist (SOC 15-2051) roles deserve their limited research-and-apply time before OPT starts.
**Agent twin:** `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`
**Chapters:** 11 (scorer, called not copied) and 9 (BLS role quality, report-only).

## Purpose

Answer: of the roles I'm considering, which employers have a real sponsorship record, which postings are actually open, and does the hiring timeline fit my OPT window? If the repo's records cannot answer, the tool must hold the role and say why, never fill the gap with a guess.

## What it can verify

- The company's row in the shipped 80 Days to Stay CSV: approvals, denials, approval rate, top sponsored titles, latest funding.
- That a blank approvals field means "no record," which is not "0 approvals." In the real CSV, 28,812 of 30,369 rows are blank.
- Whether "data scientist" appears in the company's top sponsored titles.
- The date and result of a posting-liveness check.
- The national OEWS 2024 wage for SOC 15-2051 (a group wage) and that its O*NET ability fields are empty.

## What it cannot verify

- How many *data scientists* a company sponsored. The CSV has no SOC column.
- Whether a role is entry-level. Matching titles are often Senior or Staff.
- Whether an aggregator page's job is still open at the employer.
- Whether "not found" means a non-sponsor or just a different legal name.
- Your exact OPT dates and rules. Confirm with your school's international student office; this is not legal advice.

## Dependencies

- Python 3.11+ (standard library only) and Node 20+ for the scorer.
- `npm install`, plus `npx playwright install chromium` once, for `ats:liveness`.
- A repo `.venv` with PyYAML so `npm run verify` passes on a fresh clone.

## Annotated commands

Offline tests (expected: 17 tests, `OK`):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051 -p "test_*.py" -v
```

Check postings first (expected: each URL marked active, expired, or uncertain):

```bash
npm run ats:liveness -- "<url1>" "<url2>"
```

Worked run on the real CSV (expected: 8 roles → 4 scored, 4 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
```

## What it produces

- `triage-report.md` for you: every value labeled record or your-input, a held table with next actions, and ⚠ flags where you must look first.
- `triage-log.json` for an agent, plus the scorer's own `role-scores.*` audit files.

## Named failure modes

1. **Aggregator ghost.** A job board keeps a page and apply button up after the employer removes the job; the liveness checker reports it active. Found in the worked run (builtin.com, job removed June 2025, scored Apply). Hardest to catch for a student who trusts a green check and never opens the page. Mitigation: G4 hand check; prefer employer ATS links.
2. **Brand vs. legal name.** "Instacart" is `MAPLEBEAR INC` in the records, and "Airbnb" is `AIRBNB INC`. A brand-name search is held as not found, so a top sponsor stays invisible. Mitigation: held, never scored as a non-sponsor; hand-search the legal name.
3. **Sponsorship-only Apply.** A Proven sponsor alone adds 0.315, above the 0.30 Apply line, so a Staff role you can't win still says Apply. Mitigation: the report flags Apply with fit below 0.5 for a human.
4. **Senior titles counted as DS evidence.** 31% of matched DS titles are Senior/Staff/Principal. Mitigation: read the matched titles in the report before tailoring.
5. **Blank read as zero.** Treating a blank approvals field as 0 would mark about 95% of companies as non-sponsors. Mitigation: held at G1 as "no record."
