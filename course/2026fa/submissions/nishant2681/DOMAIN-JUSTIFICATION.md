Drafted by Claude Code from my brief, recipe, run results and my inputs; reviewed by Nishant.

# Domain justification — data-analytics OPT/H-1B role triage

## Executive summary

International data graduates on a visa clock spend application time on jobs
that cannot hire them. This recipe checks three things a posting never says:
whether the employer sponsors, whether the job is real, and whether hiring can
finish in time. It saves an estimated 1.5–2 hours a week (not measured).

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
**260** sponsor a target title.

## Engine layers

80 Days to Stay (sponsorship; funding as context), Job-Ops (liveness) and a
timeline gate, combined by the existing Ch.11 scorer, unchanged
(`recipes/cases/2026fa/nishant2681-data-analytics-opt-h1b.md`).

## 3-3-2 fit

It does the sponsorship, liveness and timeline checks inside the **2** apply
hours. It sends Consider roles, and Unknown roles with strong fit, to the
**3** networking hours.

| Input | Value | Label |
|---|---|---|
| Time per application | 25–30 min | Nishant's experience (your-input) |
| Extra visa-filtering time | ~40% | secondhand: scoutify.com citing a 2024 Interstride survey (primary not checked) |
| Time still needed with tool | ~5 min | assumption |
| Postings checked per week | 15–20 | assumption |
| **Saving** | (10–12 − 5 min) × 15–20 = 1.25–2.3 h, **~1.5–2 h/week** | **ESTIMATE, not measured** |
| Possible extra | skip tailoring for Skip roles, 1–2 h/week, only if the user would otherwise apply | not counted |

Background only: ~44 min per application (2026 survey of 1,000 US job seekers,
unitedwaynca.org); 64% research before applying (CareerBuilder, 2016).

## Failure modes

1. **The dataset misses big public sponsors.** The CSV starts from SEC Form D
   filers, so public companies such as Wayfair (a heavy data-title sponsor,
   per an outside check) can only be Unknown. *Hardest to catch for* students
   unaware of the data's origin. They may deprioritize their likeliest
   sponsors.
2. **Wrong-company matches.** One name can mean several entities (Deloitte →
   7, with very different records), or a different company with the same name
   (Affinity vs AFFINITY SOLUTIONS INC). *Hardest to catch for* students who
   trust a match without checking the entity.

Smaller:
- generic titles under-rate consulting firms (Deloitte Consulting → Possible);
- "uncertain" liveness means the page was unreadable.

Most sample jobs are Form D-funded startups; Deloitte and Wayfair are
deliberate stress tests. Evidence: `runs/2026-10-02-sample-2/`,
`logs/runs/2026fa-nishant2681-1.md`, CHANGE-BRIEF §8.
