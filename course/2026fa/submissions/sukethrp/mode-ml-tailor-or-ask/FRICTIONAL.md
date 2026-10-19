# FRICTIONAL — ml-tailor-or-ask

## Executive summary

This is the honest log of building and running the mode. Its first part is the student's own entries, written at each checkpoint while the work happened and copied here word for word. Its second part is Claude Code's factual timeline, kept separate. The entries show what the student expected, tried, checked and decided, including what they rejected. Most of the mode's rules and every gate decision in the live run came from these entries, not from a menu of options.

## The student's own entries

Each entry was received in chat at the time shown and is quoted, not paraphrased. Two entries are privacy-redacted at the student's request, and are marked; every other entry is unchanged.

### Checkpoint 1: the situation, before any design

*2026-10-19, received and saved 02:25 EDT.* **Privacy-redacted** at the student's request: the two employer names are replaced with [employer], and the two statements of the student's own visa status with [visa status]. The unredacted original is kept privately; nothing else is changed.

> 1. What exact situation is this mode for, and what’s hard to see in your own job search right now?
>
> This mode is for the point where I find an ML/AI engineering opening and need to decide whether it deserves the time to tailor an application. [visa status], and I’m looking at early-career roles with production ML experience at [employer] and regulated data experience at [employer]. A “new grad” label doesn’t fully describe my background. What’s hard to see is whether a company’s sponsorship history is relevant to this particular role and whether my experience actually meets its requirements. I want the mode to bring together the posting’s current status, sponsorship evidence, and requirements so I can see what matches and what still needs clarification. Historical sponsorship alone cannot tell me whether the employer will sponsor me.
>
> 2. Does it build on Assignment 3’s sponsor match and Fine Print, or is it something new? Why?
>
> I want it to build on both because they address different parts of the same decision. Assignment 3 focused on sponsorship history at the role and seniority level. Fine Print grew from the gap that remained: a promising company and job title still don’t establish whether I meet the actual requirements. For Assignment 5, I want a new workflow that connects those checks and helps me decide whether to tailor an application, ask a specific question first, or move on. It should compare the posting with my documented experience, including the distinction between required and preferred qualifications. Fine Print is still proposed work, so I would be clear about which parts actually ran and which remain to be built.
>
> 3. How much of your own situation should the mode file reveal?
>
> I would keep the boundary I chose in Assignment 4: say that [visa status] and explain the kind of roles I’m targeting, while leaving out my graduation date. That gives enough context to explain why sponsorship and timing matter. The public mode can describe someone with prior ML experience entering the U.S. job market without including my full résumé, contact details, application history, or exact authorization dates. Those details should stay in private local inputs, with fictional examples used for the public demonstration. Keeping dates private also means accepting a limit: if the mode doesn’t have the information needed to check timing, it should leave that question unresolved and stop any recommendation that depends on it.
>
> 4. Due date 21st, Wednesday 11:59 PM, But I want to submit early, presentation slot is unknown, might be next week, but it is better to get prepared that too, So i need that as well

### Checkpoint 2: the first engine run

*2026-10-19, received 05:44 EDT.*

> I expected the sample scorer to show how sponsorship, fit, and timing affect the recommendations. It returned two Apply, one Consider, and two Skip. The ghost-posting example scored zero despite strong sponsorship and fit inputs because its liveness gate was closed. That helped explain why a good-looking role should not move forward when a required gate fails.
>
> For the live check, I expected a straightforward status result. The terminal command failed before inspecting the posting because its browser could not launch. A separate browser inspection and fallback run of the repository’s classifier returned active after detecting a visible Apply control on Goodfire’s posting. That fallback does not count as a successful run of the original command.
>
> The main takeaway is that an accessible application page answers only one question. Sponsorship, timing, and qualifications still need separate checks before I spend time tailoring an application.
>
> Posting checked:[ Goodfire — Machine Learning Engineer](https://job-boards.greenhouse.io/goodfire/jobs/5019847008)

### Design answers: the requirements boundary, gaps, fit, privacy, prediction

*2026-10-19, received 06:01 EDT.* **Privacy-redacted** at the student's request: the one statement of the student's own visa status is replaced with [visa status]. The unredacted original is kept privately; nothing else is changed.

> 1. Fine Print boundary
>
> Yes, that’s the boundary I want for Assignment 5. The working part should separate required from preferred qualifications, show the exact wording, and compare stated experience minimums with documented work history. Degree, skills, sponsorship statements, and graduation windows can remain typed proposals. Those unchecked requirements should still appear clearly in the report. Passing the experience check should never become a claim that I meet the whole job description.
>
> 2. Experience gaps and the fit number
>
> For Goodfire, I would choose ASK FIRST. Its five-year requirement and its encouragement to apply despite gaps leave something worth clarifying. My question would be: “Is five years a firm minimum, or would you consider someone with fewer years who has relevant production ML experience?” The invitation does not establish that the requirement is flexible. Goodfire’s posting
>
> More generally, I want ASK FIRST when the employer’s interpretation could change the decision, and MOVE ON when a restriction is clearly non-negotiable. I would still prioritize roles closer to my experience before spending time tailoring a stretch application.
>
> Fit should remain a number I provide after reading the requirements table, with a short explanation. It represents my assessment, not my probability of getting hired. If I cannot justify it, leave it unset. A high fit number should never clear an unresolved gate.
>
> 3. Reviewing the rules
>
> Yes, I want to review them before adopting them. One distinction matters especially for me: a title such as Engineer II might fail a strict new-grad sponsorship rule while still describe work I could reasonably do with my prior experience. I want to check the rules against examples like that, along with unfamiliar headings, alternative experience requirements, and co-op treatment. Until that review happens, keep the current labels. Approving a screening rule would mean I accept its tradeoffs; it would not make the employer’s expectations a verified fact.
>
> 4. Privacy
>
> Yes. Describe the user in the third person in the repository, and keep “[visa status]” for my presentation. Replace both employer names with “[employer]” in the public Checkpoint 1 copy. My graduation date, authorization dates, full résumé, and application notes should stay private. The public worked run can name Goodfire because it is a public posting used as a test case. The applicant profile used alongside it should be fictional.
>
> 5. My prediction—and a closer role to test
>
> I expect the mode to count experience more confidently than it should. Adding a production ML job and a data-focused co-op gives a duration, but it does not prove that every month satisfies a requirement for ML engineering, forecasting, or research experience. I want that distinction to remain visible.
>
> A closer test is Orenda’s Machine Learning Engineer role in New York. It asks for three years of relevant experience and two years using Python with ML frameworks. My production ML, experimentation, cloud, and pipeline work give me concrete experience to compare with it. The open questions are whether the co-op counts toward the three-year minimum and whether my forecasting background is deep enough. Energy-market experience is preferred, while sponsorship remains unconfirmed. It also requires five days a week in Brooklyn. I would start with ASK FIRST, rather than call it a confirmed match.

### Rule calls R1–R8, naming Orenda, and where Checkpoint 2 ran

*2026-10-19, received 06:25 EDT.*

> 1. My calls on R1–R8
>
> R1 — Engineer II / L2
>
> Count II/L2 titles as relevant historical sponsorship evidence for this mode. I have prior production experience, so restricting the search to titles that look like first jobs would miss reasonable opportunities. Keep the exact title visible, though. An improved sponsorship tier must not establish that I qualify for the current opening. The PathAI/lookalike records should remain on HOLD until the company identity is resolved.
>
> R2 — Seniority markers
>
> Keep clear senior markers such as Senior, Staff, Principal, management titles, and III/IV outside the early-career sponsorship signal. Treat Lead, Founding, Architect, and Fellow as titles needing context. Excluding a historical title from that signal should not automatically reject a current posting; its actual responsibilities and requirements still need review.
>
> R3 — Sponsorship numbers
>
> Keep the ten-approval threshold and the 0.9/0.6 mapping for consistency with the existing scorer. Label them as declared screening assumptions. A value of 0.9 does not mean a 90% chance that the employer will sponsor me, and ten company-wide approvals do not mean ten ML-engineering approvals. Missing history should stay unknown.
>
> R4 — Headings
>
> Keep explicit heading rules and add “Work Environment” as a section break. Show location and office requirements separately as work conditions awaiting review.
>
> I would not treat every short, unbulleted line as a heading because that could hide real requirements. Where the section boundary is unclear, preserve the text and flag the classification for review instead of silently carrying it into the previous section.
>
> R5 — Alternative experience paths
>
> Choose option B. A line such as “BS + 3 years or MS + 1 year” depends on a condition the mode does not currently check. Quote the complete line and leave the applicable path unresolved. Do not automatically choose either the smallest or largest number. Being enrolled in a master’s program also should not be treated as already holding the degree.
>
> R6 — Co-op, academic, and part-time experience
>
> Stop assuming that everything without “intern” or “co-op” in its title is full-time. Keep employment type, hours, duration, and relevance separate. A research assistantship, teaching assistantship, contract, or fellowship needs supporting information before it becomes full-time industry experience.
>
> A co-op can itself be full-time, so “full-time experience” should not automatically exclude it. If the posting explicitly accepts internships or co-ops, count the eligible documented months. Otherwise, keep employer acceptance unresolved. Count overlapping months once, and keep personal projects separate from employment duration. The kind of experience should remain visibly unchecked.
>
> R7 — Firm minimums
>
> Keep ASK FIRST when the employer’s interpretation could change the decision. Use MOVE ON only when a clearly applicable, firm restriction is documented and the applicant is shown not to meet it.
>
> Read the complete sentence and its context. “Not a firm minimum” must not trigger the same result as “a firm minimum.” A general invitation to apply should not cancel an explicit restriction.
>
> R8 — Liveness
>
> Keep seven days as the maximum age for a stored check, and refresh it on the day I intend to apply. Keep the current host restrictions. A browser failure, unsupported host, or unresolved redirect should produce HOLD, not a claim that the posting is closed. An active result establishes the detected application control; sponsorship and eligibility remain separate questions.
>
> Any changes needed to implement these calls should remain proposed until they are built and tested.
>
> 2. Naming Orenda publicly
>
> Yes, the public worked run can name Orenda alongside Goodfire. Both are public postings being used as test cases. Use a fictional applicant profile and keep my résumé, dates, fit notes, and application history private. Naming either company should not imply confirmed sponsorship.
>
> 3. Checkpoint 2: where the checks ran
>
> The earlier results came from an automated session working in the Assignment 5 engine folder, rather than a personal Terminal-panel run. The scorer’s reports were captured in memory to respect my instruction not to change files, which explains why there is no 02-anchor output folder.
>
> The liveness command ran in that session but failed to launch its browser. The fallback browser inspection was also automated, and its observations were passed to the repository’s classifier. That returned active, but it was a separate check—not a successful execution of the original command. A personal Terminal-panel rerun is still outstanding and should not be claimed as completed.

### Adopting rules 0.2.0

*2026-10-19, 06:34 EDT.*

> Yes, adopt rules 0.2.0 as built. I accept the three readings: distinguished is a clear senior marker, unclear-section lines are flagged but don't change the suggestion, and RA/TA in a title mean research and teaching assistant.

### Checkpoint 3: gate decisions before the live run

*2026-10-19, received 07:10 EDT.*

> 1. Company rows
>
> For Goodfire, I would select row 11308, GOODFIRE AI INC. Goodfire’s official legal terms identify that name, and its SEC filing corroborates the name, San Francisco location, and offering details in the dataset. The row’s website should remain marked unverified. This clears the proposed identity match, not sponsorship. Official terms - https://www.goodfire.com/legal/tos, SEC filing - https://www.sec.gov/Archives/edgar/data/2070813/000207081325000001/xslFormDX01/primary_doc.xml
>
> For Orenda, I would keep row 19228 as a candidate match, without clearing identity yet. The current employer operates an energy-storage business through orendapower.com, while the dataset lists orenda.io, which currently leads to a domain-for-sale page. The matching name, industry, and general location are useful evidence, but I still need a reliable connection between those records. Current company website - https://orendapower.com/
>
> Both rows have blank H-1B fields. That means sponsorship history is missing from this file; it does not establish that either employer refuses sponsorship.
>
> 2. Fit
>
> I would leave both fit numbers unset for now. This run uses Priya’s fictional profile, not my résumé. Her structured résumé—the file the mode actually reads—contains eight months of co-op experience. Her separate CV includes another job, so those sources need reconciliation before I treat the profile as complete.
>
> The read-only requirements check produced these comparisons:
>
> Posting requirement
>
> Required duration
>
> Duration available in the structured résumé
>
> Goodfire: relevant infrastructure, research-engineering, or systems experience
>
> 60 months
>
> 8 months including co-op
>
> Orenda: relevant experience
>
> 36 months
>
> 8 months including co-op
>
> Orenda: Python with ML frameworks
>
> 24 months
>
> At most 8 months; the specific kind remains unchecked
>
> These are duration comparisons, not findings that the co-op satisfies each requirement. I would not invent a fit number just to move the workflow forward. Goodfire requirements - https://job-boards.greenhouse.io/goodfire/jobs/5019847008, Orenda requirements - https://job-boards.greenhouse.io/orenda/jobs/8031471003
>
> 3. Timeline
>
> I would leave the timeline factor unset for both postings.
>
> Priya’s fictional profile gives an OPT end date of January 31, 2027, 34 unemployment days used, a ceiling of 90, and a chosen buffer of 20. Those supplied figures give a nominal buffered budget of 90 − 34 − 20 = 36 days, assuming the snapshot is current.
>
> Neither posting supplies an expected hiring duration or start date. The unemployment snapshot also has no reference date. Those missing facts prevent a defensible timeline factor. I would not substitute 0.5 for unknown.
>
> 4. Decisions
>
> Goodfire: HOLD. The identity match has supporting evidence, but fit and timing remain unresolved, and current sponsorship is unconfirmed.
>
> Orenda: HOLD. The dataset identity match still needs confirmation, alongside fit and timing. Its smaller experience gap does not clear those gates.
>
> 5. Current Checkpoint 3 note
>
> What stands out is that choosing a closer-looking role does not necessarily produce a recommendation. The applicant’s source files, company identity, and timing evidence still matter. The structured résumé’s missing job is especially important because the mode can calculate correctly from an incomplete input.
>
> These are my proposed gate decisions. The personal Terminal-panel run, its pasted output, and the record of checks I personally perform are still outstanding. I should complete that record before presenting Checkpoint 3 as finished.

### Checkpoint 3: the live run and its verification

*2026-10-19, received 07:40 EDT, after the run logged at 07:22.*

> Checkpoint 3 — Live run and verification
>
> I ran the live workflow from my terminal against Goodfire and Orenda. My first attempt stopped because the output folder already contained a run. I used a new folder, preserving the earlier evidence. The completed run returned two HOLDs and zero postings scored.
>
> Both postings passed the liveness check. That established that an application control was detected on each page; it did not establish sponsorship or applicant eligibility.
>
> I kept Goodfire’s recorded identity match, while leaving its fit and timeline unresolved. Orenda also remained on HOLD because its company-row identity was still unconfirmed. I left fit unset because the fictional applicant’s structured résumé omits a job listed in her separate CV. I left timing unset because neither posting supplied an expected hiring duration or start date, and the unemployment-day snapshot lacked a reference date.
>
> For the source check, I read the report and displayed data row 11308 directly from the CSV. It showed GOODFIRE AI INC in San Francisco, CA, matching the report. All five H-1B fields were blank: approvals, denials, approval rate, median salary, and sponsored titles. Those blanks support “unknown,” not “does not sponsor.”
>
> What stood out was that both pages were active, yet neither posting reached the scorer. Clearing liveness did not resolve the other gates. My next steps are to reconcile the fictional résumé sources, confirm Orenda’s identity, and obtain enough timing information to justify a factor.

### Checkpoint 4: attestation and reflection, before submitting

*2026-10-19, received 13:40 EDT, after the student's own break run (scorer output 13:35:37 EDT).*

> Attestation
>
> Recipe: ml-tailor-or-ask v0.1.0 · rules v0.2.0
>
> By: Suketh Reddy Produtoor · 2026-10-19
>
> Tested
>
> Ran
>
> Saw
>
> Expected
>
> Live command into round-1
>
> Stopped because the folder already contained a run
>
> Preserve existing evidence
>
> Live command into round-2-personal
>
> Both postings active; HOLD 2; scored 0
>
> Unresolved gates prevent scoring
>
> Direct CSV read of data row 11308
>
> GOODFIRE AI INC, San Francisco, CA; all five H-1B fields blank
>
> Company details match the report; missing sponsorship history remains unknown
>
> Engine scorer on BROKEN-missing-liveness.json
>
> Apply 1; exit 0
>
> Reproduce the scorer’s behavior when liveness is missing
>
> Guard on the same broken input
>
> REFUSED; identified missing liveness; exit 3
>
> Reject incomplete input before scoring
>
> Did not test
>
> A private run using my own résumé and profile.
>
> A live posting that cleared every gate and reached the scorer.
>
> A closed live posting or a live Lever/Ashby posting.
>
> Submitting an application or obtaining employer confirmation of sponsorship and start dates.
>
> The proposed degree, skills, kind-of-experience, sponsorship-text, and new-grad-window checks.
>
> Broke during testing, fixed
>
> My first live attempt stopped at the existing-output safeguard. I resolved this by choosing a fresh output folder and preserving the earlier run.
>
> The deliberate missing-liveness test reproduced an unresolved engine defect: an unchecked gate was treated as fully open. The guard rejected that input as intended. This demonstrates the safeguard; it does not establish that the underlying scorer defect is fixed.
>
>
> Relection:
> The deliberate break test gave me the clearest evidence for keeping the guard. I supplied the same input, with no liveness gate, to both programs. The scorer recommended Apply, while the guard identified the missing field and refused the input. The exit codes confirmed the difference: zero from the scorer and three from the guard. This showed that successful execution alone does not establish that the input was complete or the recommendation justified.

## Claude Code's timeline (factual; times are file times, command stamps or run-log timestamps, EDT)

- 01:16–01:25: created the Assignment 5 workspace; cloned the student's fork at `015843d`; ran doctor and verify (both passed).
- 01:50–02:01: surveyed the engine's commands and data with a subagent; confirmed the scorer fails open on a missing or text-valued gate (`role-scorer.mjs:83–84`) and that CI's harness job calls four missing files.
- 02:31–02:42: after Checkpoint 1, wrote the input guard, the reused Assignment 3 checks, the mode and its tests.
- 05:44: after Checkpoint 2, ran the liveness check on Goodfire (active); found the Goodfire and Orenda rows.
- 05:50–06:07: built the requirements check from the student's Checkpoint 1 and design answers; found and fixed the ceiling misread ("up to 2 years") while preparing the rules review.
- 06:25–06:34: built R1–R8 as the student decided; the student adopted rules 0.2.0.
- 06:4x–07:0x: wrote the recipe and card after an approved plan.
- 07:10–07:20: added identity decisions and unset fields to the queue, from the student's Checkpoint 3 calls; wrote those calls into the live queue in the student's words.
- 07:17: an automated session (not Claude Code in this session, and not the student) ran the live queue into `runs/live/round-1/`; its browser launch was denied, and both postings held.
- 07:22: the student's own live run (`runs/live/round-2-personal/`); 07:56: the student's own sample run (`runs/sample/`).
- 07:40–08:2x: added home-folder scrubbing; wrote run-log entries 3 and 4; updated the recipe after an approved plan; found and fixed a crash in the scorer-contract check with a new test; drafted this folder's documents.
- 13:35: the student's own break run (`runs/break-demo-personal/`); 13:40: the student's attestation and reflection.
- 13:43–13:44: the student's own re-runs with captured output (anchor, break pair, live round 3).
- 13:56–13:58: a fresh-clone check found the privacy scan's false positive on a test decorator; the skip moved into `setUp` (test-only), and the unpushed local commits were rebuilt without that line.

## Traceability

- Runs: `logs/runs/2026fa-sukethrp-3.md` (sample) and `logs/runs/2026fa-sukethrp-4.md` (live), with their folders under `runs/`.
- Rules and the review behind them: `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` (v0.2.0, declared by the student), `RULES-REVIEW.md`, and `evidence/rules-review/`.
- Tests: `python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests` (118, offline).
- Who did what, and what the student accepted, changed or rejected: `SOURCES.md`.
