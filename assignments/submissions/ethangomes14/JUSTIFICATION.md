# Domain Justification — Data Engineer H-1B sponsor screen (v0.5.1)

## Who uses it, and when

An **F-1 master's student in the final semester before post-completion OPT**, looking for **new-grad Data Engineer work anywhere in the US**, who will need **H-1B sponsorship** to stay. It is October; the OPT clock (90 days of allowed unemployment) has not started; every application sent now has to land a start date after OPT begins and before that clock runs out. The worked example is the fictional persona "Electrifier" (OPT start 2027-03-01, practical deadline 2027-05-20).

Three things make the situation specific:
1. **Sponsorship has to be for this kind of work.** A company that sponsored hundreds of software engineers is weaker evidence for a Data Engineer hire than one that sponsored Data Engineers.
2. **The work hides behind many titles:** Analytics Engineer, BI Engineer, ETL Developer, "Software Engineer, Data Platform".
3. **The clock is fixed by a rule the employer doesn't track.** A recruiter won't tell you that a 45-day hiring process started in late April misses the deadline.

## The information asymmetry

The student can't easily see **which employers have actually sponsored H-1Bs for Data Engineer-type roles**, or **whether a posting they're about to tailor for is still a real opening**. Postings rarely say, recruiters often don't know, and a chatbot answers anyway. The record exists, but it is filed under **legal names** ("GEMINI SPACE STATION LLC", "UPSTART NETWORK INC") and **specific titles**, and the job boards hide how long a posting has been open. The employer sees all of this; the student sees a careers page.

## Engine layers

- **80 Days to Stay:** the sponsor CSV gives the sponsorship vote (approvals, top sponsored titles), matched exactly or through a reviewed alias.
- **Job-Ops:** discovery from public Greenhouse boards; `npm run ats:liveness` plus a Greenhouse API cross-check for the liveness gate; first-published dates for the evergreen flag.
- **Visa timeline:** the persona's OPT dates drive the timeline gate.
- **The existing scorer:** `scripts/score/role-scorer.mjs`, called unchanged, turns the evidence into Apply / Consider / Skip.

The Cognitive Pivot (BLS role quality) is not used: the scorer weights it 0.0.

## Domain-specific failure modes

1. **The brand-name disappearance.** A strong sponsor comes back "not found" because the student types the brand and the filing uses the legal entity. On 2026-10-20 this happened to **4 of 10 companies**. Gemini is a Proven sponsor under its legal name, and the alias step shows what each name would unlock. The dangerous part is the *wrong* fix: the file holds four different "GEMINI …" companies and five "UPSTART …" rows, and only one of the Upstart rows has H-1B data. The Unite Us row lists a website, `unite-usa.com`, that isn't the company's. *Shape:* a silent false negative, or a confident false positive if someone fuzzy-matches. *Hardest to catch for:* a student new to the US who doesn't know how US companies name their legal entities. They will read "not found" as "doesn't sponsor", or accept whichever look-alike a search returns.
2. **The evergreen posting that passes every check.** Robinhood's "Senior Software Engineer, Data Engineering" was first published **2022-12-08**. On 2026-10-20 the liveness checker said `active` and the Greenhouse API said `200`, so by every machine test it is open. *Shape:* hours of tailoring spent on a posting that may be a standing pipeline rather than a seat being filled. That is costly when the OPT clock is running. *Hardest to catch for:* a first-time US job-seeker, who has no way to know that some companies leave postings up for years. The tool flags the age; only a recruiter can answer the question.

A third, structural one stays on the "cannot verify" list: approvals are **undated and company-wide**, so a company that stopped sponsoring still rates Proven, and nothing in the report looks wrong.
