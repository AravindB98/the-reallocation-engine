# Data Engineering / MLOps H-1B triage — human card

## Executive summary

This card is for the student who has to decide which data-engineering and MLOps postings are
worth an application this week. It explains what the tool checks, what it cannot see, and how
to read its report. The tool answers: *does this company have a record of sponsoring H-1Bs for
this kind of work, is the posting live, and does the start date fit my expected work
authorization?* When the data cannot answer, it puts the posting on hold and tells you what to
do instead. It does not guess.

**Audience:** an international MS Data Analytics Engineering student, graduating December 2026, not yet holding an OPT work card, who will need H-1B sponsorship.
**Agent twin:** `recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md`
**Status:** DRAFT. A sample run exists; no human has cleared its gates yet.

## Purpose

Spend the two research-and-apply hours of the day only on postings with evidence behind
them, and turn the rest into a networking list instead of silent rejections.

## What it can verify

- The company's H-1B approval and denial counts, and its top ~5 sponsored titles, from the engine's company file. It uses exactly one row; a duplicate name is never guessed between.
- Whether a top sponsored title is a data-engineering or MLOps title (keyword rule, shown in the report).
- That the repo's liveness checker said `active` / `expired` / `uncertain` for this URL on the day you saved its output.
- Whether the company appears in the shipped Form D samples (50 companies per quarter), and its latest funding date. This is **context only**.

## What it cannot verify

- **Whether they will sponsor this role now.** Counts are history. A company with 1,640 approvals can still show no data-engineering title in its top five (Databricks), so it lands at "Likely" → Consider.
- **Companies with no record.** About 95% of the file (28,812 of 30,369 rows) has blank approvals, and Google, Amazon, and Meta are absent entirely. These are held, not skipped: "no record" is not "no".
- **Brand vs. legal name.** Instacart is `MAPLEBEAR INC` in the file. Unless you set `legal_name`, it is held as not-in-dataset.
- **Location, seniority, E-Verify.** The sample scored a "Remote – Ireland" role as Apply. Check location yourself until the location gate is built. Nearly every US opening in the sample was Senior.
- **Funding as sponsorship.** A freshly funded startup with no H-1B record is held. Funding is never counted as a sponsorship signal.

## Annotated commands

Run the offline test (no network; expected: 14 pass):

```bash
node --test scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/
```

Check liveness, **one URL per call** (a multi-URL call interrupted itself on 2026-10-01), appending to a saved file:

```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/twilio/jobs/7996774" >> scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt
```

Run the triage on the sample (writes the report under `course/2026fa/submissions/gnanasudharsan/runs/<date>/`):

```bash
node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt
```

Trap demo (expected: exit 3, no report; the scorer misreads "not yet authorized"):

```bash
node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs --persona scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/fixtures/persona-trap.json --postings scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/postings.json --liveness scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/sample/liveness.txt --out-dir /tmp/de-mlops-trap --roles-dir /tmp/de-mlops-trap
```

## How to read the report

- **Apply:** tailor it. **Consider:** one soft spot, usually "Likely" sponsorship, so ask a contact before tailoring. **Skip:** drop it.
- **On hold:** the evidence is missing. Each row names the reason and a next action, and most go to your networking list.
- Every value is tagged **record** (from a file or saved tool output), **model-judgment** (a rule the tool applied), or **your-input** (your dates, fit ratings, start dates). If you can't explain a row term by term, don't trust it.

## Named failure modes

1. **Blank read as zero.** A naive join turns a blank approval count into 0 → "None" → Skip, silently dropping most of the market. *Who misses it:* a student skimming a long Skip list, who would never see that the company had no record at all. *Guard:* `no-sponsorship-record` hold plus a test.
2. **Title-family false positives.** "Solutions Architect – Data Engineering" and "Hardware Engineer – GPU & AI Infrastructure" match the keyword list and get scored. *Who misses it:* anyone reading only the Rec column. *Guard:* the title is printed beside every score; a crosswalk is the real fix (`[TODO: DATA SOURCE]`).
3. **Scorer reads a pre-OPT status as authorized.** "OPT EAD not yet authorized" zeroes the sponsorship weight inside the maintained scorer. *Who misses it:* the student this recipe is for, since their honest description triggers it. *Guard:* exit 3, no report.
4. **Liveness batch interference.** Multi-URL liveness calls produced `uncertain` for live postings. *Guard:* uncertain → hold, never live; one URL per call.
