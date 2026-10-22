# Data / BI Analyst triage — human card

**Audience:** an F-1 OPT master's student deciding which data and BI analyst postings deserve time today.
**Agent twin:** `recipes/cases/2026fa/jayant-majji-14-data-bi-15-2051.md`

## Purpose
For each posting, answer: which O\*NET sub-occupation is this title, does that sub-occupation have role-quality scores, has the employer recorded H-1B approvals for data-type titles, is the posting live, and does my OPT window leave time? If the data can't say, the posting is **held** with a reason, never scored on a guess.

## What it can verify
- The three 15-2051 sub-occupation rows: identical BLS wage, different (or blank) O\*NET scores.
- A company's approvals and sponsored titles, when exactly one CSV row matches.
- What `ats:liveness` returned for a URL on a given date.
- The scorer's arithmetic, term by term.

## What it cannot verify
- Which code the employer files the role under.
- Sponsorship for data work specifically (no SOC column; top titles only).
- Any company outside the startup filing list.
- Whether an "expired" posting is really closed: one false expired was observed.
- What the pivot score says about AI exposure; the repo defines it only as an average.

## Commands
```bash
npm run ats:liveness -- "<posting-url>"
npm run score -- <roles.json> --out-dir <your-folder>
```
Lookups are read-only Python over the shipped CSVs; there's no stored script yet.

## Before you act on an Apply
Check the seniority; open the posting yourself if liveness said expired or uncertain; and read the audit row. A role with fit 0 can still score Apply on sponsorship alone.

## Named failure modes
1. **Sub-occupation collapse.** Looking up O\*NET by the 6-digit BLS code keeps one arbitrary sub-occupation and hides that Data Scientists have no scores.
2. **False expired.** A live posting at a strong sponsor gets zeroed by the liveness gate, and the student never opens the page.