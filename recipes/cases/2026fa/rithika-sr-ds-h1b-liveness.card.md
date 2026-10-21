## Executive summary

This card is the short, human version of a screening step for an international student looking for an entry-level data scientist job that needs visa sponsorship. It tells you which postings are worth your time, and it will not recommend a posting unless the employer's own page shows the job is open. Read it before trusting any "this job is live" signal from a job-listing site. In its first real run it caught a job that a listing site had shown as open for sixteen months after removal, but a person still had to catch one bad recommendation and one missed open job by opening the pages.

# DS new-grad H-1B triage with aggregator-aware liveness — human card

**Audience:** an F-1 master's student graduating December 2026 (OPT EAD expected January 2027) deciding which Data Scientist (SOC 15-2051) postings deserve limited research-and-apply time.
**Agent twin:** `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md`
**Builds on:** `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md` (imports its sponsorship, timeline and scorer helpers).
**Chapters:** 8 (ATS liveness), 11 (scorer, called not copied).

## Purpose

Answer: of the postings I'm considering, which employers have a real sponsorship record, which postings are open **on the employer's own site**, and does the timeline fit my OPT window? If a posting cannot be confirmed, hold it and say why. If the employer's page shows it is gone, mark it closed. Never score either.

## What it can verify

- The company's row in the shipped sponsorship CSV, and that a blank approvals field means "no record", not zero.
- Exactly what the liveness checker printed for each link, kept word for word.
- Whether a link is on a known job-listing site, in which case an employer link is required.
- That held and closed postings never get a score.
- That the same inputs produce the same report.

## What it cannot verify

- Whether *this posting* sponsors visas. The record is company-wide.
- Whether a link that redirected still shows the same job. A link to a closed job can land on an all-jobs page and look open.
- Whether a job board that is not on the list is a listing site. It will be trusted like an employer page.
- Whether the listing-site link and the employer link are the same job.
- Whether a role is entry level.
- Your exact OPT dates and rules. Confirm with your school's international student office; this is not legal advice.

## Dependencies

- Python 3.11+ (standard library only), Node 20+, `npm install`.
- `npx playwright install chromium` once, for live liveness checks.
- A repo `.venv` with PyYAML so `npm run verify` passes.

## Annotated commands

Offline tests (expected: 41 tests, `OK`):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

Offline reproducible run on invented fixtures (expected: 11 roles → 3 scored, 2 closed, 6 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/candidates.mode.test.json --targets scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/mini_targets.csv --offline scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/fixtures/liveness.offline.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-offline
```

Live run on real postings (opens each link in a headless browser; on 2026-10-21: 13 roles → 3 scored, 2 closed, 8 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out
```

## What it produces

- `mode-report.md` for you: a summary, one row per posting with each check and the decision (score, HELD — reason, or CLOSED — reason), ⚠ flags, and next actions.
- `mode-log.json` for an agent: every check result, the checker's raw output, input fingerprints, and the exact command.

## Named failure modes

1. **Aggregator ghost.** A listing site keeps a removed job up with an Apply button. Seen on builtin.com (job removed June 2025, still "active" in October 2026). Mitigation: a listing-site link alone is always held; an employer link is required.
2. **Redirect to the job list.** A closed job's link redirects to the company's all-jobs page, which is full of Apply buttons, so the checker calls it open. Seen on an Airbnb posting that scored Apply. Mitigation today: only a person opening the link catches it. Proposed fix: require the job id in the final address.
3. **Unlisted listing site.** A job board missing from the list is treated as the employer. Seen with a venture-fund job board carrying an Instacart role. Proposed fix: trust only known employer hiring systems instead of distrusting known listing sites.
4. **Company yes, role no.** A company with hundreds of approvals can post a role that says it will not sponsor. Mitigation: a ⚠ note and a human check.
5. **Open job, checker unsure.** Some employer pages show an Apply button that the checker does not detect. Seen on a Nextdoor posting. Effect: a real job is held, never wrongly recommended.
6. **Sponsorship-only Apply.** A strong sponsor alone clears the Apply line, so Senior and Staff roles still say Apply. Mitigation: ⚠ flag when fit is below 0.5; a person decides.
