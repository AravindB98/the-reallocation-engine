# Domain Justification — swe-ai-devops-sponsor-triage

## Who, in exactly what situation

Me: an MS in Software Engineering student on F-1 OPT, about five months before
my OPT end date (shown here as the placeholder 2027-03-15; my real date stays
private), applying to 40–50 Software Engineer, DevOps and AI postings a day at
US tech companies (SOC 15-1252, 15-1244 and 15-1299). I need an employer that
will sponsor an H-1B, so before I spend time on a posting I need to know whether
that company has actually sponsored people in roles like mine, whether it has
recent funding, and whether the posting is still open.

## Information asymmetry addressed

Without this recipe, a student sees a job posting and a company name and has to
guess, from the outside, whether that company sponsors visas for engineering
roles specifically (not just "sponsors visas somewhere in the org") and whether
it's currently in a hiring-capable funding position. `top_job_titles_sponsored`
and `Approval_Rate` in the 80-Days CSV make the first fact visible; funding
stage/date make the second visible. Neither is discoverable by reading a job
posting or a careers page.

## Engine layers used

**80 Days to Stay** (`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`)
supplies both the funding and sponsorship evidence — this recipe reads one
already-joined CSV rather than performing a fresh join. **The Cognitive Pivot**
(`data/bls/compact/soc_occupation_compact.csv`) supplies role-quality context
(median wage, `cognitive_pivot_score`) — read and reported, but not scored,
since `role-scorer.mjs` currently gives role_quality zero weight. **Job-Ops**
(`scripts/ats/check-liveness.mjs`, `npm run ats:liveness`) checks whether a
chosen posting is still open; only roles with a checked posting are scored.

## Where it fits the 3-3-2 day

This recipe takes over the company-research part of the "2" research-and-apply
hours: checking "has this company sponsored roles like mine, is it funded, and
is the posting real" one tab at a time.

Estimate (my own numbers, labeled as an estimate, not a record): I spend about
5 minutes per posting on company research plus the application, at 40–50
postings a day. That is 200–250 minutes a day, or roughly 17–21 hours a week
(assuming 5 application days a week). The recipe does the company check in
under a minute for all 30,369 companies and drops the ones with no sponsorship
record before I spend any time on them. I have not yet timed how much of each
5 minutes is the company check itself; if it is about 2 of the 5 minutes, the
recipe saves about 80–100 minutes a day, roughly 7–8 hours a week. Next week I
will time it on 20 postings to replace this guess with a measured number. It feeds the credibility "3" only indirectly, by freeing time rather
than being the credibility artifact itself; the prototype and its tests are
what demonstrate judgment for that hour, per the assignment's own framing.

## Domain-specific failure modes

1. **Company-level sponsorship mistaken for role-level sponsorship.** A
   company can have a strong `Approval_Rate` driven entirely by, say, finance
   or sales roles, with zero history of sponsoring engineering titles. A
   student skimming only the Apply list — without reading the
   `skipped_no_title_match` count this recipe reports — would never notice
   this exclusion was even happening, and might independently (wrongly)
   assume "no match" means "no sponsorship," when it actually means "sponsors,
   just not this kind of role." The person hardest-placed to catch this is
   exactly the target user: someone new to reading H-1B/sponsorship data who
   doesn't yet know company-level and role-level evidence are different
   claims.
2. **A liveness check trusted after it has gone stale.** A posting checked as
   `active` today can close next week, but the Apply row still says Apply.
   (The first version of this prototype was worse: it gave every unchecked
   posting a guessed liveness of 0.5, which let 55 companies reach Apply with
   no check at all; unchecked roles are now held out.) A student under OPT time
   pressure who saved the report and comes back days later could tailor an
   application to a posting that is already gone. Hardest to catch: anyone who
   reads the Apply list without the check date in `liveness/liveness-check.txt`.
