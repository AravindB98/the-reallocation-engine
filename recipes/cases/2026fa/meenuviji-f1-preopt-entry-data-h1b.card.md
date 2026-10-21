# F-1 pre-OPT, entry-level data roles — human card

## Executive summary

**What this is.** The one-page human version of a job-search mode for an international data-analytics student who is on a student visa, has not started post-study work authorization yet, and will need an employer to sponsor a work visa later.

**Why read it.** It tells you, before you spend an hour tailoring an application, whether the employer has a record of sponsoring *your* kind of data job at *your* level, or only senior roles, or nothing on file. It also tells you when the tool refuses to answer.

**What it decides.** For each posting: tailor an application, network first, or skip. It stops and asks you whenever the employer can't be identified, the posting may be closed, or a required date is missing. It is a draft: it has run on sample postings, and seven proposed improvements are still open.

**Audience:** a pre-OPT F-1 MS Data Analytics student deciding where tomorrow's application and networking hours go.
**Agent twin:** `recipes/cases/2026fa/meenuviji-f1-preopt-entry-data-h1b.md`
**Built on:** the prototype in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/` and its Oct 3 recipe, `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md`.

## Purpose

Answer one question per posting: has this employer sponsored entry-level data jobs before, only other jobs, only senior data jobs, or nothing on record? Then say what to do next. If the records can't support an answer, say so and stop.

## The checks that stop everything (gates)

1. **Repo health.** The project's own checks must pass before anything runs.
2. **Which company is this?** The employer name must match exactly one record. No match, or two possible matches, stops that posting for you to decide. The tool never picks the closest name.
3. **Nothing missing.** A posting with no "still open?" value or no start-date inputs is refused, not scored. The scoring engine would otherwise assume the best case.
4. **Is the posting still open?** For a real posting, the liveness check must say `active`. `expired` or `uncertain` means stop. For the sample postings this is assumed, and labeled as assumed.
5. **Does the start date fit your work window?** Expected start = run date + hiring lag. It must land on or before the last day of your work-authorization window. A start that's too early is only a note ("deferred start"), not a failure.
6. **You sign off.** A run is not cleared until you write down who reviewed which stops, and why.

## What it can verify

- The employer matches exactly one record, and the tool says how it matched.
- The employer's approvals, denials, approval rate, median salary and sponsored-title list, copied unchanged.
- What the scoring engine returned, term by term, for exactly the postings that passed the checks.
- Whether a real posting URL loaded as `active`, `expired` or `uncertain` when the check ran.
- Your title rules are applied the same way every time (28 tests). Being consistent is not the same as being right.

## What it cannot verify

- **How recent the sponsorship is.** The counts carry no year.
- **Whether the data matches government records.** It's checked against an audited copy, not against DOL or USCIS.
- **Whether the matched name is the real employer.** Subsidiaries, trade names and staffing agencies break the link.
- **That a title with no level marker is entry level.** "Data Scientist" often expects experience.
- **That the employer sponsored this posting's exact title.** The evidence is per company.
- **Whether the employer will file for you.** No record is not a "no".
- **Your timeline guesses**: hiring lag, the 90-day window (confirm with your DSO), and whether an employer accepts a deferred start.
- **Fit.** It's held at 0.5 in the sample.

## What to do with each result

| Result | Do this |
|---|---|
| Skip, gate closed | Don't spend time on this posting. |
| Proven entry-level data sponsorship | Tailor an application. |
| Thin evidence (few approvals) | Confirm with a recruiter or employee first, then tailor. |
| Sponsors data roles at mid level only | Network: ask whether they hire and sponsor new grads into the team. |
| Sponsors senior data roles only | Network, don't apply cold. |
| Sponsors, but not data roles | Low priority: warm contacts only. |
| No record | Unknown, not "no". Verify through networking before tailoring. |

## Commands (from the repo root)

```bash
npm run verify && npm run doctor -- --strict
npm run ats:liveness -- <posting url>
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir <new folder>
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

Read the result in `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md`. Record your decisions in `logs/runs/2026fa-meenuviji-<n>.md`.
