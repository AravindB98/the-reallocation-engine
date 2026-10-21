# is-funded-sponsor-triage: human card

**Audience:** an Information Systems master's student on F-1 who prefers funded companies, needs H-1B sponsorship, and hasn't picked between Business, Data, Product Analyst, or IT Consultant.
**Agent twin:** `recipes/cases/2026fa/yudanzhou-is-funded-sponsor-triage.md`
**Status:** DRAFT (corrected 2026-10-20: 4 open TODOs means DRAFT). Superseded by `yudanzhou-da-sponsor-triage.md` v0.2.0.

## Executive summary

This card is for a person deciding whether to trust what the triage tool says about a job posting. The tool checks whether a funded company has actually sponsored H-1B visas, and for which kind of analyst job. Then it says apply, put the company on a networking list, or skip. Read it before acting on a result, because the tool's most important behavior is what it refuses to do: when there is no record, it says "no record" and sends the company to networking, rather than calling it a no. On the shipped data, it found that only a small share of funded companies has any sponsorship history. It also found that one large consulting firm passes as "funded" when it shouldn't, so a human still has to read every Apply.

## Purpose

Answer two questions before spending application time:
1. Of the funded companies I'm drawn to, which have actually sponsored H-1B, and for which of my four role families?
2. For each posting, should I apply, put the company on my networking list, or skip it?

On the shipped data: of 27,874 funded companies, **1,532** have any H-1B approval on record, and only **131** of those raised money in the 24 months before 2026-10-02.

## What it can verify

- A company's row in the 80-Days CSV, by exact or suffix-stripped name (never fuzzy), and whether the match is unique.
- That row's H-1B approvals, denials, top sponsored titles, funding stage, and funding date.
- Whether a company is in the shipped Form D samples.
- How many funded sponsors list each of my role families in their top sponsored titles.

## What it cannot verify

- Whether a company hires **OPT** graduates. The data only has H-1B approvals.
- Whether a company is in **E-Verify** (required for STEM OPT).
- A real sponsorship **probability**. `p` is my mapping from approval counts.
- Families outside a company's **top** sponsored titles.
- Whether "funded" means a startup: a Form D can be a fund vehicle.
- Funding after 2025-09-26.
- Liveness of demo postings.

## Dependencies

- Python 3.9+, standard library only. Node 20+ for the existing scorer.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/sec/form-d/processed/sample/*.sample.json`
- `scripts/score/role-scorer.mjs`

## Annotated commands

Full sample run (expected: `9 postings → 5 scored · 4 held out`, then the scorer's `Apply 4 · Consider 0 · Skip 1`):

```bash
python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/triage.py --today 2026-10-02
```

Offline tests (expected: `Ran 11 tests … OK`):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage -p "test_*.py" -v
```

Liveness check a human runs before G2 (network; not called by the prototype):

```bash
npm run ats:liveness -- <job-url>
```

## What it produces

- `roles.json`: input for the existing scorer. Every term is labeled.
- `role-scores.md` / `.json`: the scorer's Apply / Consider / Skip with a term-by-term audit.
- `triage-report.md`: for you. Family table, per-posting decision, next action, and what wasn't verified.
- `triage-log.json`: for the agent. Every record value with its label.

## Named failure modes

1. **Blank read as zero.** In the CSV, 28,812 rows have blank approvals and only 5 have an explicit 0. Treating blank as "doesn't sponsor" would silently drop young funded startups, the exact companies this student prefers. *Hardest to catch for:* the student, because a Skip looks like a confident answer. Mitigation: blank → `no-h1b-record` → networking list, never Skip.
2. **"Funded" isn't "startup".** Form D is filed by funds and large partnerships too. The CSV labels DELOITTE CONSULTING LLP "Series C". In the IT Consultant family, large consultancies with thousands of approvals dominate, and the scorer happily recommends Apply. *Hardest to catch for:* someone who reads the funding column as a startup filter. Mitigation: the report shows stage and date beside each row. A human judges.
3. **A keyword is not a job.** "Senior Business and Data Analyst" counts as Data Analyst; "Data Engineer" must not. Family counts move whenever the keyword list changes. Mitigation: rules live in `config.json`, labeled `your-input`, and a test pins the Data Engineer case.
