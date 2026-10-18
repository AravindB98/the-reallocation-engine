# Domain justification — wage-level-floor

## Executive summary

**What this is.** The one-page case for a mode that tells an international student how many H-1B lottery entries a job posting's salary range can buy. **Why read it.** Since February 2026 the lottery is weighted by wage level, and the student is the one person in the process who cannot see the level. **What it argues.** The level is computable from public data before anyone applies, and the errors that matter most here are ones the student is the last to notice.

## Who, and when

An MS Computer Science graduate on F-1 post-completion OPT, STEM-extension eligible, applying for backend / platform / full-stack software roles in the Boston metro between October and February. Their employer will register them in the FY2028 H-1B lottery in March 2027. They are reading postings, booking recruiter calls, and (with luck) comparing offers. The question they cannot answer today: *"Is this range worth one lottery entry or two, and what number moves it?"*

## The information asymmetry

Under the final rule (90 FR 60864), an employer's registration is entered 1–4 times according to the highest Department of Labor wage level the offered wage meets **for the occupation code and area the employer chooses**. The employer's immigration counsel sees all three inputs. The student sees one: a salary range on a posting, required in Massachusetts since October 2025.

The missing two are public but buried. The level lines sit in a 449,440-row DOL file. For Boston software developers in 2026-27 they are $114,275, $138,237, $162,198 and $186,160. The occupation code is printed nowhere on a posting. On 2026-10-18, 6 of 11 placeable new-grad postings at Boston H-1B sponsors had a range that crossed a level line. Klaviyo's SWE II range of $116,000–$174,000 holds both a 1-entry and a 3-entry offer. And 5 of 11 started *below* Level I. Without the table, "$120K–$170K" reads as a good range. With it, the student knows $138,237 is the number to negotiate to, because by DHS's own projection it roughly doubles their selection chance (15.3% → 30.6%).

## Connection to the engine

- **80 Days to Stay** supplies the candidate set (MA companies with H-1B approvals for software titles) and the sponsor context. The mode also shows a limit of that data: `median_salary_offered` is a company-wide median across all titles, with no year, so it can't place anyone on a level.
- **Job-Ops** supplies the boards. The mode reads the pay fields the repo's ATS providers currently discard, and uses `npm run ats:liveness` as a gate.
- **The wage side of the Cognitive Pivot layer.** The engine had BLS wages for role quality but not the one wage table with legal force in the H-1B process (OFLC levels, computed from BLS OEWS). This mode adds it as a new, hash-pinned data source.

## Failure modes specific to this domain

1. **Occupation-code drift.** The student evaluates against 15-1252 (Software Developers). The employer files the same job as 15-1211, 15-1253 or 17-2061, which have different lines. In the live run, every placed posting changed level under at least one alternative code, by up to two levels in either direction. The student negotiates to $138,237 believing they doubled their entries, and the registration lands elsewhere. **Hardest for the student to catch.** The code appears only on the registration and the LCA, which counsel files in March and the student often never sees until after selection. A title string doesn't encode it, so no agent reading postings can catch it either. The mode can't verify the code. It shows the sensitivity and makes "which code?" a named gate.
2. **"Remote" silently becomes Boston.** A remote or multi-city posting gets placed on the student's home-area lines when its pay was set for another zone or city. The first build had this bug. "New York, NY; Remote" was placed on Boston thresholds as a clean, plausible row with nothing visibly wrong. "Remote, Canada" was also mapped to Boston, and only its CAD currency stopped it. Toast's postings carry Zone A/B/C ranges with no zone named for Boston. **Hardest for the reader of a tidy table to catch**, and for a student weighing a remote offer, whose "area of intended employment" is their home while the employer's zone map is private. The fix is a refusal (`remote-scope-unclear`, `zone-ambiguous`), not a better guess.
