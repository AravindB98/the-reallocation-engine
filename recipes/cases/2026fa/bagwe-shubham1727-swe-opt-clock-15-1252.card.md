# swe-opt-clock — human card

**Audience:** a new-grad software engineer on F-1 OPT, currently unemployed, deciding which jobs get tomorrow's hours.
**Agent twin:** `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252.md`
**Chapters:** 7 (who sponsors), 8 (is the job real), 10 (the visa clock), 11 (the scorer that combines them).

## Executive summary

**What this is.** A one-page guide to a tool that sorts the jobs you're considering into apply now, network first, or drop. It does that with public records and your own dates instead of a chatbot's guess.

**Why read it.** On OPT, the deadline that usually bites first isn't your OPT end date. It's the **90 days of unemployment** you're allowed, and they keep counting while you research. A job whose hiring takes four months can be a perfect match and still be impossible. This tool does that arithmetic before you get attached to the posting.

**What it decides.** A recommendation per job, plus a plain list of what it couldn't check. You make the decision and sign it. In the demo, the fit ratings and hiring-time guesses were written by an AI for a made-up student, and the report labels them that way. Use your own.

## Purpose

For each job, answer three questions:

1. **Has this company sponsored software engineers before, and not only senior ones?** If you're a new grad, a company that has only sponsored staff engineers is weaker evidence than its sponsorship count suggests.
2. **Is the posting real and still open?**
3. **Can you start before your unemployment days run out?**

## What it can verify

- The company's row in the 80 Days to Stay dataset: H-1B approvals, denials, approval rate, and the job titles it sponsored.
- Whether any sponsored title looks like software engineering, and whether any of those titles is not senior. A company that sponsored only other jobs (scientists, analysts) counts as weak evidence for you.
- What the engine's posting checker says about a saved copy of the posting, and how old that copy is.
- Your deadline: OPT end, unemployment days used (projected to the run date), days left, the date you must start by, and the earlier date your buffer asks for.
- The national median wage for your occupation (SOC 15-1252), shown next to the company's sponsored salaries. It is **not** part of the score.

## What it cannot verify

- **Whether they'll sponsor *you*, now.** The records have no year attached. Ask in the first recruiter call.
- **Whether a sponsored "Software Engineer" was filed under your occupation code.** The data has titles, not codes.
- **Whether a posting is live today.** In sample mode the posting copies were written for the exercise. Open the link.
- **E-Verify enrollment.** You need an E-Verify employer to file the STEM extension, and no such data is here.
- **Recent funding.** The newest funding date in the data is September 2025.
- **Anything legal.** What counts as employment, and whether you're STEM-eligible, are questions for your DSO.
- **A company that isn't in the data, or why.** HubSpot has no row at all, and the data doesn't say why. That's a gap, not a "no".

## Dependencies

- `npm install` (Node 20+). No Python, no network, no browser.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/sec/form-d/processed/sample/*.sample.json`
- `data/bls/compact/soc_occupation_compact.csv`
- `scripts/ats/liveness-core.mjs`, `scripts/score/role-scorer.mjs` (both unmodified)
- A profile with your dates. The demo uses the fictional `search/examples/neel-kapoor/profile.yml`. Keep a real one in `private/`, never committed.

## Annotated commands

Run the tests first (expected: `pass 18`, `fail 0`):

```bash
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/test/swe-opt-clock.test.mjs
```

Sample run (expected: 12 evaluated, 8 scored, 4 held for you; deadline 2026-11-20). Tests expected: `pass 18`, `fail 0`:

```bash
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-15-1252/run.mjs --as-of 2026-10-02
```

Then read `course/2026fa/submissions/bagwe-shubham1727/runs/2026-10-02/report.md` and fill in `gate-decisions.md` next to it.

## What it produces

- **report.md**: your clock, a decision and next step per job, and where every number came from (record / your input).
- **gate-decisions.md**: blank until you write your decision, name and date.
- **run-log.json**, **roles.json**, **role-scores.json**: the machine's record.

## Named failure modes

1. **The stale count.** You type "41 days used" from a check-in three weeks ago. A tool that assumes that count is current shows a deadline three weeks too late, and you apply to jobs you can't start in time. The people hit hardest are the ones who check their count least often. *Mitigation:* the count must carry a date and is projected forward. An undated count stops the run.
2. **Sponsor, but not for you.** A company with 38 approvals, all for senior and staff engineers, looks like a safe sponsor. A new grad wouldn't notice that every title says "Senior" unless they read the list. *Mitigation:* senior-only sponsors are capped at Likely, and the titles are printed.
3. **Missing is read as "no".** A company with no sponsorship record, or one absent from the data entirely, gets treated as a non-sponsor and dropped, and a good lead is lost. *Mitigation:* those jobs are never scored. They're routed to networking or to a name check.
4. **A free-text visa status flips the scorer.** Writing "work authorized (EAD)" in a profile makes the engine's scorer think you don't need sponsorship. Every non-sponsor then looks fine, and the error is silent. *Mitigation:* the tool passes only an explicit yes/no and halts if the scorer disagrees.
