# Rules review — before you adopt the mode's screening rules

## Summary

The mode screens postings with rules I drafted: which sponsored titles count as evidence, which headings mark
required or preferred qualifications, how an experience line is read, and which jobs count as co-op time. Until
you adopt them, everything they produce is labelled model-judgment. This page runs each rule against hard
examples, including the four you asked for: Engineer II, unfamiliar headings, alternative experience paths, and
co-op treatment. It also shows the tradeoff, so you can decide in your own words. Two bugs turned up while preparing
it; they are fixed and listed at the end. Adopting a rule means accepting its tradeoff. It does not make an
employer's expectations a verified fact.

The student answered every call in chat on 2026-10-19 (06:25 EDT), in their own words, recorded in this folder's FRICTIONAL.md. The calls were built and tested, and the student adopted the built version (rules 0.2.0) at 06:34 EDT. The adoption table at the end summarises each call as built.

Evidence: `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/evidence/rules-review/level-marker-audit.json` (the real 80 Days file, 30,369 rows) and
`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/evidence/rules-review/requirement-rules-probe.txt` (example phrasings I wrote to exercise the rules, labelled synthetic).

---

## R1. Do level II / L2 titles count as sponsorship evidence for this role?

**Now:** a sponsored ML title carrying a level marker ("Machine Learning Engineer II", "(L2)") is *not* counted as
role-level evidence. That's A3's rule, written for "has this company sponsored an entry-level ML hire?".

**Your point:** an Engineer II title can describe work someone with prior production experience could do, so for
this situation it may be the right evidence, not the wrong one.

**What it changes, on the real file:** of 1,552 companies with an H-1B record the rules can tier, 27 are Proven now.
(The file has 1,557 rows with H-1B fields. Five of them show zero approvals and only denials, so the mode
holds them as `no-approvals-on-record` instead of tiering them; 1,557 − 5 = 1,552.) Counting II/L2
would move **6** from Likely (every ML title marked) to Proven:

| Row | Company | Approvals | Its level-marked ML title |
|---|---|---:|---|
| 17152 | MOLOCO INC (CA) | 200 | Machine Learning Engineer II |
| 19394 | OVERJET INC (MA) | 48 | Machine Learning Engineer II |
| 19754 | PATHAI INC (MA) | 78 | Machine Learning Engineer II |
| 19760 | PATHRAI INC (CA) | 78 | Machine Learning Engineer II, the same record value for value as PathAI, so the mode holds both as a possible lookalike |
| 27765 | TWILIO INC (CA) | 802 | Machine Learning Engineer (L2) |
| 29517 | WHOOP INC (MA) | 114 | Machine Learning Operations Engineer II |

**Tradeoff:** if II counts, more postings reach TAILOR, and a company that only sponsors experienced hires can
look like evidence for an early-career one. If it doesn't, a company sponsoring II-level ML engineers stays at "ask
first" even for someone whose experience fits that level.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R2. Seniority words that make a title "senior"

**Now:** senior, sr, staff, principal, lead, manager, director, head, vp, vice president, chief, architect, iii, iv,
distinguished, fellow, founding. A title with any of these never counts as role-level evidence.

**Tradeoff:** "lead" and "founding" catch some titles that aren't senior in practice. Removing words makes the
evidence look stronger than it is.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R3. How strong the sponsorship evidence is (the numbers fed to the scorer)

**Now:** Proven → 0.9 and Likely → 0.6, the values in the book's Chapter 11 worked example. Proven also needs at
least 10 approvals, the median among companies with an H-1B record.

**Tradeoff:** these are declared numbers, not measurements. Raising Likely pushes more soft-evidence postings from
"ask first" toward "tailor".

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R4. Headings that start and end the requirement sections

**Now:** required, preferred and "other" headings are matched by pattern. A heading the rules don't know is *not*
treated as a heading, so its lines stay in whatever section came before.

**What happens on hard examples:**
- Real, from Orenda: "Work Environment" is unknown. So "This is a full time, in-office position requiring work from
  our headquarters (Brooklyn…)" is sorted as a **preferred qualification**. It's a condition of the job, not a
  qualification.
- Synthetic examples I wrote:
  - "Pluses", "Skills & Experience", "Ideal Candidate", "Experience" and "Education" are unknown.
  - "About You", "Who You Are" and "You might be a fit if" are read as **required**.
  - "Nice to Have" and "Bonus Points" are read as **preferred**.

**Options:**
- (a) Keep adding headings one by one as postings show them.
- (b) Treat any short line with no bullet as a section break, so unknown headings end a section instead of
  joining it. A short un-bulleted requirement line would then be lost from the table.
- Either way, a separate question: should work conditions (on-site days, location) be listed in their own row?
  Today they are not checked.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R5. Experience lines with alternative or combined paths

**Now:** the mode takes the *smallest* figure in a line and ignores any degree or other condition attached to it.

**What happens on hard examples** (synthetic phrasings, except Orenda's):

| Line | The mode reads | Problem |
|---|---|---|
| "BS + 3 years or MS + 1 year of ML experience" | 1 year minimum | true only for the MS path; the degree isn't checked |
| "3+ years of experience, or a PhD in a related field" | 3 years | the PhD path is ignored |
| "Master's degree with 1+ year of experience, or Bachelor's with 3+ years" | 1 year | same as the first line |
| Orenda: "B.S. and 3+ years of relevant experience" | 3 years | the degree half isn't checked, which is fine and shown |
| "1-3 years of experience (internships count)" | 1 year, co-op not counted | the line itself says internships count |

**Options:**
- (a) Keep the smallest figure.
- (b) Mark any line with "or" plus a degree word as "depends on an unchecked condition", which makes it ASK FIRST
  with the line quoted.
- (c) Take the strictest figure.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R6. What counts as co-op or internship time

**Now:** a job whose title contains co-op, intern or internship, apprentice or trainee is counted apart. A minimum
is "met" only by full-time months. If it's reached only with co-op months, it's "unclear", and that becomes the
question. Everything else counts as full-time:

| Title (synthetic) | Counted as now |
|---|---|
| AI Engineer Co-op · Machine Learning Intern · Apprentice Software Engineer | co-op/internship |
| Graduate Research Assistant · Teaching Assistant · Part-time ML Engineer · Contract Data Scientist · Data Science Fellow | **full-time** |

**Two refinements to decide:**
- (a) A line that says **full-time** ("at least one year of full-time experience"): should co-op months then never
  count, so the result is a gap rather than unclear?
- (b) A line that says **internships count**: should co-op months then count, so the result is met rather than unclear?

And whatever you decide, your prediction stays visible: the report shows the *kind* of experience each line asks
for ("in ML infra…", "writing clean, maintainable Python code with Machine Learning frameworks") as **not checked**.
A duration never proves the months were that kind of work.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R7. When a gap is non-negotiable (MOVE ON instead of ASK FIRST)

**Your rule:** ASK FIRST when the employer's reading could change the decision, MOVE ON when the restriction is
clearly non-negotiable.

**My draft of "clearly non-negotiable":** the required line itself says "no exceptions", "strict / firm / hard /
non-negotiable minimum or requirement", "will not be considered", or "not eligible". A plain "5+ years required" stays
ASK FIRST, so Goodfire is ASK FIRST.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## R8. Liveness

**Now:** a liveness check older than 7 days counts as unchecked. Live checks only touch boards.greenhouse.io,
job-boards.greenhouse.io, jobs.lever.co and jobs.ashbyhq.com, and redirects to other hosts are not followed.

**Your call:** answered in chat on 2026-10-19; see the adoption table below and FRICTIONAL.md.

---

## Fixed while preparing this review (bugs, not judgment calls)

1. A **ceiling** was read as a minimum. "Recent graduates or up to 2 years of experience" had been read as a 2-year
   *minimum*, which would make a new-grad posting look like a gap. Figures after "up to", "less than", "no more
   than", "under", "at most" or "within" are now never read as minimums. Ceilings stay a typed proposal.
2. A **range** was read too high. "6 months to 2 years" had been read as 2 years; it's now 6 months.
3. **Number words and phrasing.** "Three years", "two years using Python" and "2 years in industry" had not been read
   at all; now they are.

All three have tests. 86 offline tests pass.

---

# Your calls, as built: rules 0.2.0-proposed, ready for adoption

Built and tested at 06:32 EDT on 2026-10-19. 104 offline tests pass and conformance is clean. Your words are saved
in this folder's FRICTIONAL.md. The before/after on Goodfire, Orenda and the hard phrasings is in
`course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/evidence/rules-review/after-rule-calls.txt`. Adopted by the student at 06:34 EDT: values these rules produce are labelled your-input.

| Call | What was built | Proof (tests) |
|---|---|---|
| R1 | II/L2 titles count as evidence. The exact title is printed in the tier reason ("counted level-marked: 'Machine Learning Engineer (L2)'"). On the real file, Proven goes from 27 to 33. Lookalike records still HOLD. | `test_a_level_ii_title_counts_and_stays_visible`, `test_twilio_l2_title_now_counts`, `test_the_pathai_lookalike_record_is_still_shared` |
| R2 | Clear senior and management words are kept out. Lead, Founding, Architect and Fellow become "needs context": not counted, and the question asks whether those roles were early-career. 4 real companies land there, for example REFUELAI INC ("Founding ML Engineer"). | `test_a_lead_title_needs_context`, `test_clear_senior_titles_stay_outside_the_signal` |
| R3 | 0.9/0.6 and the 10-approval floor are kept. The rules and the report now call them declared screening assumptions, not chances of sponsorship, and say approvals are company-wide. Missing history stays unknown. | report text; `test_no_h1b_fields_is_unknown_not_no` |
| R4 | Work Environment, Where we work, Location and on-site/hybrid headings become **work conditions awaiting review**, listed separately. An unknown short heading inside a section is flagged "section unclear" with its lines kept, never carried into the section above. | `test_work_environment_lines_are_work_conditions`, `test_an_unknown_heading_is_flagged_not_carried_into_the_section` |
| R5 | A line with "or" plus a degree word, or with two or more figures, is **conditional**: quoted whole, path unresolved, ASK FIRST. No figure is chosen. A degree named beside a duration is marked "not checked (being enrolled is not holding it)". | `test_an_alternative_path_line_is_left_unresolved`, `test_a_degree_named_beside_a_duration_is_marked_unchecked` |
| R6 | Jobs are counted by type: employment of unstated type (never assumed full-time); co-op/internship; and "needs supporting information" (RA, TA, contract, fellowship, part-time, freelance, volunteer). An explicit `employment_type` in the résumé wins. Co-op counts only if the posting accepts it. A full-time line is met only by months stated as full-time. Overlaps count once. Projects never count. | `test_a_job_without_a_type_is_never_assumed_full_time`, `test_assistantships_contract_and_fellowships_need_supporting_information`, `test_an_explicit_employment_type_wins_over_the_title`, `test_co_op_counts_when_the_posting_accepts_it`, `test_a_full_time_line_is_met_only_by_months_stated_full_time`, `test_projects_are_not_employment` |
| R7 | MOVE ON only when the line's own sentence states a firm restriction with no negation before it, and every documented month still falls short. "Not a firm minimum" and "isn't a hard requirement" are not firm. Invitations to apply are never read. | `test_a_negated_firm_phrase_is_not_firm`, `test_a_minimum_the_posting_calls_firm_moves_on` |
| R8 | 7 days and the same hosts. A browser that fails to launch gives HOLD (`liveness-check-failed`), never "closed". "active" is shown as "an apply control was detected; nothing more". TAILOR and ASK FIRST end with "Refresh the liveness check on the day you apply." | `test_a_browser_that_fails_to_launch_holds_the_posting` |
| also fixed | A bare "3 years" inside a requirement line was not read, so "BS + 3 years or MS + 1 year" showed one path instead of two. | same R5 test |

## Three readings Claude made, confirmed by the student at adoption

1. **R2:** I put "distinguished" (as in Distinguished Engineer) with the clear senior markers.
2. **R4:** lines in an unclear section are listed in the report and named in the posting's "next" text, but they don't
   change its suggestion. The alternative would be that any unclear line turns TAILOR into HOLD.
3. **R6:** "RA" and "TA" are read as abbreviations of research and teaching assistantships wherever they appear as
   whole words in a job title.

## What adopting did (adopted 2026-10-19 06:34 EDT)

The rules file becomes declared by you (dated today, version 0.2.0). The values they produce become `your-input`
instead of `model-judgment`. Adoption covers the tradeoffs you accepted; it does not verify any employer's
expectations. Any later change to the rules is a new version that you adopt again.

## Later adoptions (after this review)

- **Rules 0.3.0** (2026-10-19, ~16:40 EDT) added the discovery filters and the timeline formula. The student adopted
  them "with the proposed changes"; their words are in `rules.json` `declared_by.previous_adoption.adopted.words`.
- **Rules 0.3.1** (2026-10-19, ~18:50 EDT) added requirement headings found missing in the student's own run, raised
  the heading limit to 12 words, and made a bullet that is only a known heading count as one. Their words are in
  `rules.json` `declared_by.adopted.words`. Every pattern reviewed here, R1–R8, is unchanged.

