# Domain justification — wage-level-floor

## Executive summary

The case for a mode that tells an international student how many H-1B lottery entries a posting's salary range can buy. Since February 2026 the lottery is weighted by wage level, and the student is the one person in the process who can't see the level. It can be computed from public data before anyone applies.

## Who, and when

An MS CS graduate on F-1 OPT (STEM-eligible), applying for backend / platform software roles in the Boston metro between October and February. Their employer will register them in the FY2028 lottery in March 2027. Their question: *"Is this range worth one lottery entry or two, and what number moves it?"*

## The information asymmetry

Under the final rule (90 FR 60864), a registration is entered 1–4 times by the highest DOL wage level the offer meets **for the occupation code and area the employer chooses**. Employer counsel sees all three inputs; the student sees one: the posted range, required in Massachusetts since October 2025. The level lines sit in a 449,440-row DOL file. For Boston software developers in 2026-27 they are $114,275 / $138,237 / $162,198 / $186,160. The occupation code is on no posting.

On 2026-10-18, 6 of 11 placeable new-grad postings at Boston H-1B sponsors crossed a level line inside their range. Klaviyo's SWE II range ($116,000–$174,000) holds both a 1-entry and a 3-entry offer. 5 of 11 started below Level I. With the table, $138,237 becomes the number to negotiate to: by DHS's own projection it roughly doubles the selection chance (15.3% → 30.6%).

## Connection to the engine

- **80 Days to Stay:** the candidate set (MA companies with software H-1B approvals). The mode also shows a limit of that data: `median_salary_offered` is company-wide and undated, so it can't place anyone on a level.
- **Job-Ops:** the boards, the pay fields the repo's ATS providers discard, and `npm run ats:liveness` as a gate.
- **Wage data under the Cognitive Pivot layer:** the engine had BLS wages but not the one table with legal force in the H-1B process (OFLC levels, built on BLS OEWS). Added as a new, hash-pinned source.

## Failure modes specific to this domain

1. **Occupation-code drift.** The student reads against 15-1252, but the employer files 15-1211, 15-1253 or 17-2061. In the live run every placed posting changed level under at least one alternative, by up to two levels either way. The student negotiates to $138,237 believing they doubled their entries, and the registration lands elsewhere. **Hardest for the student to catch:** the code is on the registration and LCA that counsel files in March, which students often never see. No title string encodes it, so no agent reading postings can catch it either. The mode makes "which code?" a named gate rather than guessing.
2. **"Remote" silently becomes Boston.** A remote or multi-city posting gets placed on home-area lines when its pay was set for another zone or city. The first build did exactly this: "New York, NY; Remote" came out as a clean Boston row, and "Remote, Canada" was stopped only by its CAD currency. Toast lists Zone A/B/C ranges with no Boston zone named. **Hardest for the reader of a tidy table to catch**, and for a student weighing a remote offer, whose legal worksite is their home while the employer's zone map is private. The fix is a refusal (`remote-scope-unclear`, `zone-ambiguous`), not a better guess.
