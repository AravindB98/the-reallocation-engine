Drafted by Claude Code from my brief, recipe, run results and my inputs; reviewed by Nishant, 2026-10-20. The 2026-10-02 version is preserved at the git tag `mode-design-submission`.

# Domain justification — data-analytics OPT/H-1B role triage

## Executive summary

International data graduates on a visa clock spend application time on jobs
that cannot hire them. This recipe checks three things a posting never says:
whether the employer has sponsored visas, whether the job is still real, and
whether hiring can finish before the candidate's unemployment days run out.
Its two named risks are specific to this domain: a big sponsor that the data
simply leaves out, and one company name that hides several legal employers.

## Who

**The target user** is an international MS data/analytics graduate starting
F-1 OPT, with a limited number of unemployment days. Their target titles are
Data Scientist, Data Analyst, ML Engineer, Analytics Engineer, Data Engineer,
Business Analyst, Business Intelligence and Automation Analyst. Example: the
fictional Priya Nair has 56 of 90 days left.

## The information asymmetry

Postings never say whether the employer has sponsored this kind of role,
whether the posting is still live, or whether hiring beats the clock. In the
80 Days CSV, only **1,557 of 30,369** companies (~5%) have any H-1B record, and
**260** sponsor a target title. A candidate cannot see these numbers from a
job board.

## Engine layers

- **80 Days to Stay:** sponsorship tiers from H-1B records, with funding shown
  as context only. When an employer is missing, the fallback is the USCIS
  FY2022 employer file, capped at "Possible".
- **Job-Ops:** posting liveness (`npm run ats:liveness`), used as a gate.
- **Cognitive Pivot:** reached only through the existing Ch.11 scorer, which
  combines everything. Its role-quality term has weight 0 and this recipe
  supplies no occupation code, so this layer contributes nothing yet.

Unlike `recipes/cases/2026su/case-data-ml-h1b-triage.md`, an unfilled
scaffold built on BLS role quality and ATS discovery, this recipe has run. It
triages a given list of roles using records, not discovery.

## Failure modes

1. **The absent sponsor.** The 80 Days CSV is built from SEC Form D filers,
   so a large public employer can be missing entirely. Wayfair has 0 rows,
   yet the USCIS FY2022 file shows 78 initial approvals for WAYFAIR LLC.
   - *Shape of the error:* a heavy sponsor looks like a stranger.
   - *Hardest to catch for* a candidate who reads "Unknown" as "doesn't
     sponsor" and drops their likeliest sponsor.
   - *Mitigation:* USCIS fallback, capped at Possible because it has no job
     titles. Unknown always routes to networking.
2. **Entity ambiguity.** "Deloitte" matches **7** legal entities with very
   different records: Deloitte Consulting has 8,810 approvals, while Deloitte
   Financial Advisory has none recorded.
   - *Shape of the error:* the answer depends on which name is typed.
   - *Hardest to catch for* a candidate who trusts a match without checking
     which entity employs the team.
   - *Mitigation:* the run stops and lists every candidate; a person picks,
     and the pick is logged.

Deloitte and Wayfair were deliberate stress tests; most sample companies are
Form D-funded startups, the dataset's core. Evidence:
`runs/2026-10-20-sample-3/`, `MODE-BUILD-WORKED-RUN.md`,
`logs/runs/2026fa-nishant2681-2.md`.
