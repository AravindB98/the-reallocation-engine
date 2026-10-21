## Executive summary

This card is the short, human version of a screening step for an international student looking for an entry-level data scientist job that needs visa sponsorship. It tells you which postings are worth your time. It recommends a posting only if the employer's own hiring system shows the job is open and the title is not above entry level. Read it before trusting any "this job is live" signal from a job-listing site. Over three runs on the same real postings, the tool went from recommending a job whose link landed on a list of all jobs, to recommending two senior roles, to agreeing with a person's own decisions on four of five postings. Those five postings were also used to design the fixes, so a fresh test is still needed.

# DS new-grad H-1B triage with ATS-verified liveness and a level gate — human card (v0.3.0)

**Audience:** an F-1 master's student graduating December 2026 (OPT EAD expected January 2027) deciding which Data Scientist (SOC 15-2051) postings deserve limited research-and-apply time.
**Agent twin:** `recipes/cases/2026fa/rithika-sr-ds-h1b-liveness.md`
**Builds on:** `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md` (imports its sponsorship, timeline and scorer helpers).
**Chapters:** 8 (ATS liveness), 11 (scorer, called not copied).

## Purpose

Answer four questions about each posting I'm considering:

- Does the employer have a real sponsorship record?
- Is the job open according to the employer's own hiring system?
- Is the title at my level?
- Does the timeline fit my OPT window?

If a posting cannot be confirmed, hold it and say why. If the employer's system shows it is gone, mark it closed. If the title is senior, staff or similar, set it aside as over-level. None of these three is ever scored.

## What it can verify

- The company's row in the shipped sponsorship CSV, and that a blank approvals field means "no record", not zero.
- For jobs posted through Greenhouse, whether the employer's own job record still exists. This beats both a job-listing site and a page that merely shows an Apply button.
- Where a link really lands after every redirect.
- Exactly what the liveness checker printed for each link, kept word for word.
- Whether a link is on a job-listing site, on a known employer or hiring-system site, or on neither.
- Whether the job title contains a word such as senior, staff, lead or manager.
- That the same recorded run replays to the same decisions without the internet.

## What it cannot verify

- Whether *this posting* sponsors visas. The record is company-wide.
- Experience requirements written only in the job description. A plain "Data Scientist" title can still ask for years of experience.
- Job records on Lever, Ashby or Workday. Only Greenhouse records are checked.
- Whether the listing-site link and the employer link are the same job.
- Whether the tool would agree with you on postings you have not already reviewed.
- Your exact OPT dates and rules. Confirm with your school's international student office; this is not legal advice.

## Dependencies

- Python 3.11+ (standard library only), Node 20+, `npm install`.
- `npx playwright install chromium` once, for live page checks.
- A repo `.venv` with PyYAML so `npm run verify` passes.
- On python.org builds of Python for macOS, no extra step for HTTPS: the tool falls back to the macOS certificate bundle, with verification still on.

## Annotated commands

Offline tests (expected: 69 tests, `OK`):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness -p "test_*.py" -v
```

Replay Run 3 without the network into a fresh folder (expected: 13 roles → 2 scored, 3 closed, 2 over-level, 6 held):

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --offline course/2026fa/submissions/rithika-sr/mode/worked-run/out-run3/replay-fixture.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/replay-check
```

A new live run on real postings opens each link in a headless browser and calls public job records. Use a new output folder so recorded runs are never overwritten:

```bash
python3 scripts/contrib/2026fa/rithika-sr-ds-h1b-liveness/mode_run.py --candidates course/2026fa/submissions/rithika-sr/mode/worked-run/candidates.real.json --today 2026-10-21 --out-dir course/2026fa/submissions/rithika-sr/mode/worked-run/out-run4
```

## What it produces

- `mode-report.md` for you. It has a summary, then one row per posting with each check, the level result and the decision (score, HELD, CLOSED or OVER-LEVEL with a reason), ⚠ flags, and next actions.
- `mode-log.json` for an agent. It holds every check result, every network call with its time, the checker's raw output, the job records, and input fingerprints.
- `replay-fixture.json`, which lets anyone replay a live run offline.

## Named failure modes

1. **Aggregator ghost.** A listing site keeps a removed job up with an Apply button; seen on builtin.com, where a job removed in June 2025 still showed "active" in October 2026. Status: listing-site links alone are always held.
2. **Redirect to the job list.** A closed job's link lands on the company's all-jobs page, which is full of Apply buttons; seen on Airbnb, scored Apply in Run 1. Status: fixed for Greenhouse in Run 2, where the job record returns 404 and the role is CLOSED.
3. **Unlisted listing site.** A job board missing from every list is treated as the employer; seen on a venture-fund job board. Status: fixed in Run 2, since unknown sites are held and never fetched.
4. **Open job, checker unsure.** An employer page shows an Apply button the checker cannot see; seen on Nextdoor. Status: fixed for Greenhouse in Run 2, since the job record decides.
5. **Senior roles recommended to a new graduate.** Once live jobs were detected correctly, two senior roles became Apply. Status: fixed for titles in Run 3 by the level gate. Not fixed for descriptions (Figma).
6. **Company yes, role no.** A company with hundreds of approvals can post a role that says it will not sponsor. Status: open, flagged for a human.
7. **Sponsorship-only Apply.** A strong sponsor alone clears the Apply line. Status: open, flagged when fit is below 0.5.
8. **Grading on the practice set.** The fixes were checked on the same five postings a person had already decided. Status: open; a held-out test is the next step.
