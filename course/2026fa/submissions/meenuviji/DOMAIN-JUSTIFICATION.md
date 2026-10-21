# Domain justification — data-titles-h1b-entry

**Author:** Meena (meenuviji) · 2026-10-03 · Drafted with Claude from my own answers; the judgments, estimates and failure-mode ranking are mine.

## Who uses this, in exactly what situation

An international MS Data Analytics student on an F-1 visa, not yet on OPT (expected OPT start Feb–Mar 2027), applying for entry-level data-family roles: data analyst, BI analyst, data engineer, data scientist, ML/AI engineer. The student will need an employer willing to file an H-1B later, and applies across neighboring data titles because they cannot tell which ones a given employer has actually sponsored, or at what level.

## The information asymmetry

From outside, "this company sponsors H-1Bs" hides whether it sponsors *my kind of title at my level*. The 80 Days CSV records sponsorship per company; its only role-level signal is a short free-text list of sponsored titles. Under my final rules, 248 companies list at least one data-family title, and 94 of them (38%) list only senior ones. 39 of the 248 show a 100% approval rate on three or fewer approvals, so ranking by approval rate puts thin evidence above deep evidence (CHANGE-BRIEF Revision 2).

## Engine layers

80 Days to Stay (sponsorship history, core evidence), The Cognitive Pivot (BLS national median wage as report context only; role_quality carries zero weight), and Job-Ops (liveness as a gate; assumed in the sample, not checked). Form D samples were excluded: most are pooled investment funds.

## Where it fits the 3-3-2 day

It takes over sponsorship research in the two research-and-apply hours. **My estimate, not a measurement:** by hand, researching one company's sponsorship history for a data role takes me 10–15 minutes. I check about 15–20 companies a week: 2.5–5 hours, or roughly 25–50% of the ~10 weekly research-and-apply hours. The prototype does the lookup and title-level check in seconds; I still handle gate stops and verify what it cannot (recency, employer identity).

It also feeds the **networking** hours: only-senior, only-mid, thin-evidence and no-record results route to "network, don't apply cold" next actions.

## Failure modes specific to this domain

1. **The seniority trap (the one that worries me most).** A company can have a long sponsorship history for data roles, all senior. ROKU INC shows 654 approvals, but its sponsored data titles are Senior Data Scientist and Senior Data Engineer. Labeling it "a sponsor" gives a new grad false confidence and costs tailoring time on a weak bet. Hardest to catch for: a new grad or career switcher scanning under OPT time pressure, who sees their own title inside "Senior Data Engineer" and stops reading.

2. **Duplicate evidence across different names.** PATHAI INC (Cambridge, MA) and PATHRAI INC (Mountain View, CA) carry identical sponsorship columns. The evidence may belong to only one of them. The day-8 build notes (data/80-days-to-stay/80-days-day-08/README.md, line 21) say the original join used fuzzy name matching, a plausible cause (my inference, not verified). Hardest to catch for: anyone, because each row looks clean on its own; only comparing rows reveals it.
