# Domain justification

## Executive summary

This page explains who the mode is for, what hidden information it surfaces, and which parts of the engine it uses. It names two ways the mode could mislead someone and what it does about each. It never says whether anyone is eligible for, or will receive, sponsorship.

## Who uses this and when

An international master's graduate on the OPT unemployment clock, weighing product manager and associate product manager postings, who will need H-1B sponsorship later. Every application costs time the clock does not return, so they need to know which postings are worth the effort first.

## The information asymmetry

A posting page does not say whether the job is still open, and it does not say whether the employer has filed for sponsorship before. The mode checks the first against the live page, with a made-up job id on the same site as a control, and the second against a public sponsorship record; every unsettled case goes to a person [observed CP3b, CP3c].

## Engine layers

- Job-Ops first: the liveness gate (npm run ats:liveness) decides whether a posting is worth scoring at all.
- 80 Days: the sponsor record, matched by company name in the 80 Days CSV.
- Cognitive Pivot: not claimed. The scorer's role_quality weight is 0 and marked verify, so the role-quality vote stays a typed open item in the mode file [read role-scorer.mjs:37].

## Two failure modes

**FM1, the profile wording trap [observed CP4].** Shape: the scorer reads the person's own description of their work status, and if that text contains a word such as "authorized" it sets the sponsorship weight to zero [read role-scorer.mjs:60-61]. The same invented role went from Consider to Skip, with no warning on screen and one changed line in the report header [observed CP4: 13-c4b-score-trap.md]. Hardest to catch for someone describing their own status in plain words, because they have no baseline score to compare against (reasoning). What the mode does: the gate stops before scoring when the wording matches the scorer's pattern [observed CP4: 13-c4a-terminal.txt].

**FM2, a missing record read as "does not sponsor".** Shape: 28,812 of 30,369 rows in the CSV have no approval figures [observed CP3a], and posting 1's confirmed row had none [observed CP3c]. A tool that reads an empty or absent record as "no sponsorship" quietly steers someone away from an employer it knows nothing about. Hardest to catch for a student whose target employers lie outside the well-known set and who has no outside knowledge to cross-check (reasoning, not tested). What the mode does: it puts the posting on HOLD with a reason and reports "not recorded", never "does not sponsor" [observed CP3c: 07-pass2-report.md].
