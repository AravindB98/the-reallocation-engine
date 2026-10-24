# Domain justification — network-targets for pre-OPT F-1 software engineers

## Executive summary

An international software-engineering student who is about three months from OPT can't
easily tell which employers have actually sponsored H-1Bs for software roles, or which of
those have a suitable opening now. This recipe makes both visible from records. It also
turns strong sponsors with nothing open into a list of people to meet first.

## Who, in exactly what situation

- **Who:** MS Software Engineering, Boston, graduating December 2026.
- **Visa:** F-1. OPT from about 15 January 2027, with a 90-day unemployment allowance.
  Needs H-1B sponsorship.
- **Target:** entry-level backend software-engineer roles (SOC 15-1252) in MA or NY.
- **Timing:** about 105 days before they can legally start. Most live postings want
  someone sooner, but the 90-day clock is close.
  - A student already on OPT should mostly apply.
  - This one should apply selectively and network heavily.

## The information asymmetry

1. **Who actually sponsors software roles, and how often.** A chatbot answers "does X
   sponsor?" confidently whether or not a record exists. The recipe shows the 80 Days
   approval and denial counts and the sponsored titles, labeled as records.
2. **Who has a suitable opening today.** Checking dozens of careers pages by hand and
   filtering out senior, foreign and non-backend roles is slow and inconsistent.
3. **What to do with a strong sponsor that has nothing open.** The engine correctly scores
   it as a Skip, because its liveness gate is closed. For this student it is still the best
   company to meet now, and nothing else says so.

## Engine layers

| Layer | What it contributes |
|---|---|
| **80 Days to Stay** | Sponsorship counts, sponsored titles and funding columns. The Form D sample join is attempted and reported: 0 of 133. |
| **Job-Ops** | Board liveness through the maintained Greenhouse provider |
| **The Cognitive Pivot** | The BLS 15-1252 median ($133,080) as context only; the scorer weights role quality at 0 |

All decisions go through the existing `scripts/score/role-scorer.mjs`.

## Where it fits the 3-3-2 day

- **Takes over:** the research half of the **2 apply hours** — deciding where an
  application is worth tailoring. In the sample run, 8 companies had suitable postings.
- **Feeds:** the **3 networking hours**, with named targets. In the sample run there were
  5 Proven sponsors with nothing open: Attentive, Cambridge Mobile Telematics, Squarespace,
  Toast and Yext.

**Time saved — an estimate, not measured.**

| | Effort per week |
|---|---|
| By hand, 20 companies (≈15 minutes each for sponsorship lookup plus a careers-page check) | ≈ 5 hours |
| With the recipe (re-run, read the report, open the shortlisted postings) | ≈ 45 minutes |
| **Saved** | **roughly 4 hours a week** |

## Domain-specific failure modes

1. **Filters that quietly reshape the lists.**
   - What happens: my first run matched "MA" inside "Manitoba"/"Madrid" and let senior
     roles through, so the apply list held Canadian, French and senior postings.
   - Who struggles to catch it: the student. The company names look right; only reading
     each row's title and location shows the error. (Fixed; first run kept.)
2. **"Network first" that really means "wrong board".**
   - What happens: a hand-entered slug can point at an incomplete board. Cambridge Mobile
     Telematics' Greenhouse board lists only internships.
   - Who struggles to catch it: a student who trusts the list and skips the company's own
     careers page.
3. **Reading "Proven" as current policy.**
   - What happens: approval counts have no years and no SOC codes.
   - Who struggles to catch it: the student, or anyone the list is forwarded to. Nothing in
     the number shows its age.
