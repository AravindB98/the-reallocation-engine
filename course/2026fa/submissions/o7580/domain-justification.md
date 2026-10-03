# Domain justification — level-matched sponsorship and the OPT clock for a December graduate

## Executive summary

This recipe is for a student who graduates in December with a STEM master's degree, will work on OPT, has about two years of prior industry experience, and wants a junior software job in Boston. That student can't easily see two things: whether a "visa-sponsoring" company has sponsored *junior* software engineers, and whether a hiring process will finish inside their OPT unemployment window. The recipe reads both from shipped records and stated inputs, and it takes over the research half of the daily two-hour apply block. It also sends the near-misses to networking instead of throwing them away.

## Who, in exactly what situation

An F-1 student finishing an M.S. in December 2026. Post-completion OPT is requested to start in early January 2027, and the 90-day unemployment allowance (8 CFR 214.2(f)(10)(ii)(E)) starts counting then. The target is SOC 15-1252 (Software Developers) at the SWE I / SWE II level in Greater Boston. **Two years of prior full-time experience** is what makes this specific. It disqualifies the student from many "new grad" programs that cap prior experience, and a December graduation misses the spring campus cycle. So the realistic lane is regular SWE I/II openings, the same lane where companies are pickiest about whom they will sponsor.

## The information asymmetry

From the outside, this student sees "Company X sponsors H-1B visas". The record behind that statement says more, and two parts of it are invisible to them:

1. **Level.** The 80 Days file lists each sponsor's *top sponsored titles*. For several Boston sponsors, every software title listed is Senior, Staff, or a Lead: Toast, Bitsight, 1upHealth, Acquia (checked against the CSV row by row). "Sponsors" and "sponsors someone at my level" are different facts. The recipe tiers each employer on the second one.
2. **Time.** A posting worth applying to on 1 October can be pointless on 15 February. Nothing about the posting changed. The OPT clock did. In the worked run, the same four postings go from Apply to Skip when only the date and days-used change.

It also refuses to turn *absence* into evidence. 94.9% of rows in the file have no sponsorship number at all, because the company never matched a visa record. Big Boston employers such as HubSpot aren't in the file. A blank is reported as "check by hand", never as "doesn't sponsor".

## Engine layers

- **80 Days to Stay** (main): approvals, denials, and title lists from `mapped_student_employment_targets_v3.csv`.
- **Job-Ops**: posting liveness from the existing `ats:liveness` checker, used as a gate.
- **The Cognitive Pivot**: the BLS 15-1252 national median, as context only. The scorer's role-quality weight is 0, and this recipe does not pretend otherwise.
- Decisions come from the maintained Ch.11 scorer, unchanged.

## Where it fits the 3-3-2 day

It takes over the **research step of the 2 research-and-apply hours**: deciding *which* postings deserve tailoring. Today that means looking each employer up in an H-1B database, scanning its approved titles for anything junior, checking that the posting is still up, and doing the OPT date arithmetic.

**Estimate (not measured):** about 10–15 minutes of that research per posting by hand, against about 3 minutes to transcribe the posting fields for the recipe. At roughly 15 postings a week, that saves about **2 hours a week**, nearly one day's whole apply block. Unscored rows still cost a 10-minute hand check each, so the saving shrinks as more of the list falls outside the file.

It **feeds the networking 3**. A posting that is closed at a Proven sponsor, or a Consider caused by a senior-only record, becomes a named networking target with a specific question to ask. It doesn't become an application.

## Failure modes specific to this domain

1. **History read as policy.** The record says a company sponsored 122 H-1Bs. Its live SWE 2 posting says *"We are unable to sponsor or take over sponsorship of H-1B visas at this time."* (Ginkgo Bioworks, read 2026-10-01). A tool that trusts the record recommends a posting the student can't take. *Hardest to catch for:* a student triaging dozens of postings, who trusts the company's reputation and never reaches the posting's last paragraph. The recipe makes the posting's statement an explicit input that forces Skip, with the machine score shown beside it. It can't catch the statement unless a person records it.
2. **Under-tiering a large sponsor.** The title list is top-N, at most 14 titles. A big sponsor whose junior SWE titles fell off the list looks senior-only, or shows no software titles at all. The student then deprioritizes one of their best options. *Hardest to catch for:* everyone, including the recipe, because the missing titles aren't in any shipped file. Only the full DOL LCA rows (proposed as a data source) would show it.
