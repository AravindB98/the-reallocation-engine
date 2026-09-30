# Title-matcher spot check

## Executive summary

The recipe decides whether a company has sponsored backend-style jobs by matching the job titles in the company table against a rule. This page tests that rule on 80 titles drawn with a fixed seed and labelled by an AI assistant. The rule is a heuristic, and the check shows how good a heuristic it is: in this sample it made a few clear mistakes (a UX title and two perception specializations accepted; one punctuation variant of a standard title rejected) and several borderline calls (machine-learning and data specializations accepted). One assistant did the labelling, and the author has not checked the labels, so the numbers are indicative, not proof.

## Method

- **Population:** 2,063 distinct sponsored titles across the 1,557 companies that have a sponsorship record. The rule accepts 226 of them. 754 rejected titles still contain "engineer", "developer" or "technical".
- **Sample:** 40 accepted titles (to look for false positives) and 40 rejected titles that contain one of those words (to look for misses), drawn with seed 20260930. Redraw the same 80 with `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/check-titles.mjs`.
- **Label rubric:** Y = a backend or platform candidate would count it as a role in their target family (a generic software-engineer title with an opaque team name counts). N = clearly outside it (specializations such as perception, computer vision, mobile, security, hardware, data science, management, testing). U = borderline: it could go either way depending on the job.
- **Who labelled:** Claude (an AI assistant), in the working session on 2026-09-30, one labeller. These labels are model-judgment. The author has not yet checked them; a spot check by the author would raise their value.
- **The rule was not changed after the labels were made.** Both samples were drawn before any label existed. The rule is the one used in the sample run, and the "Member, Technical Staff" miss below is deliberately left in place, because tuning the rule to this sample would stop the sample being a test of it.
- **A redraw, and why.** An independent review found that the table reader dropped the backslash in escaped characters (one title read "Software Engineerxa0" instead of "Software Engineer" followed by a non-breaking space), which moved one title from rejected to accepted. The population changed by one, so the seeded draw changed, and this page reports the redraw. The first draw, made before that fix and labelled the same way, found 2 clear false positives and 4 borderline among 40 accepted titles, and 1 clear miss and 5 borderline among 40 rejected ones; 13 accepted and 4 rejected titles appear in both draws.

## Results (the redraw)

| Sample | Size | Clear error | Borderline | Correct |
|---|---|---|---|---|
| Accepted titles (false positives) | 40 | 3 (7.5%, 95% interval 2.6% to 19.9%) | 5 | 32 |
| Rejected titles containing engineer, developer or technical (misses) | 40 | 1 (2.5%, 95% interval 0.4% to 12.9%) | 3 | 36 |

## What this shows and does not show

- Counting borderline titles as errors, 20.0% of accepted titles and 10.0% of rejected keyword titles are debatable; counting only clear errors, 7.5% and 2.5%. With 40 titles each the intervals are wide.
- It does not measure recall over the whole table: rejected titles without those three words were not sampled.
- **Prediction P1 in the change brief** said the first matcher would misfile testing, sales or support titles and would miss unusual titles such as "Member of Technical Staff". Result: partly right. Some misfiles did occur, but testing, sales and support titles were already excluded by design; the clear false positives are a UX title and perception specializations. "Member of Technical Staff" in its standard form is matched, but the comma variant "Member, Technical Staff" is missed, which is the kind of unusual title the prediction named.
- A better rule would need occupation codes on the sponsorship records, which the company table does not carry (a typed proposal in the recipe).

## The 40 accepted titles

| # | Title | Label | Note |
|---|---|---|---|
| 1 | Senior Software Development Engineer (the table entry has stray spaces) | Y |  |
| 2 | Associate DevOps Development Engineer | Y |  |
| 3 | Backend Engineer | Y |  |
| 4 | DevOps Engineer (the table entry has stray spaces) | Y |  |
| 5 | DevOps Engineer II | Y |  |
| 6 | Full Stack Java Developer | Y |  |
| 7 | Member of Technical Staff (UX Engineer) | N | a UX engineer (front-end and design work), accepted only because of "Member of Technical Staff" |
| 8 | Perception Software Engineer | N | perception (computer-vision) specialization, not backend or platform |
| 9 | Python Backend Engineer | Y |  |
| 10 | SOFTWARE ENGINEER | Y |  |
| 11 | SOFTWARE ENGINEER II | Y |  |
| 12 | SOFTWARE ENGINEER, BLOCKCHAIN CORE | Y |  |
| 13 | Senior Cloud DevOps Engineer | Y |  |
| 14 | Senior DevOps Engineer/Infrastructure Engineer | Y |  |
| 15 | Senior Software Engineer (Operational Capabilities Team) (the table entry has stray spaces) | Y |  |
| 16 | Senior Software Engineer - AI/Algo | U | AI and algorithm specialization |
| 17 | Senior Software Engineer I | Y |  |
| 18 | Senior Software Engineer II | Y |  |
| 19 | Senior Software Engineer, Advanced Technology | Y |  |
| 20 | Senior Software Engineer, Generalist | Y |  |
| 21 | Senior Software Engineer, Object Runtime | Y |  |
| 22 | Senior Specialist, Back-End Developer | Y |  |
| 23 | Senior Specialist, Full-Stack Developer | Y |  |
| 24 | Software Development Engineer 2 | Y |  |
| 25 | Software Engineer | Y |  |
| 26 | Software Engineer (11525.3365) | Y |  |
| 27 | Software Engineer - Perception ML | N | perception and machine-learning specialization, not backend or platform |
| 28 | Software Engineer Staff | Y |  |
| 29 | Software Engineer, Data | U | data-focused; adjacent to backend |
| 30 | Software Engineer, Java | Y |  |
| 31 | Software Engineer, Machine Learning | U | machine-learning specialization |
| 32 | Software Engineer/CEO | U | an unusual founder title that is also a software engineer |
| 33 | Specialist, Back-End Developer | Y |  |
| 34 | Sr Software Engineer, Full Stack | Y |  |
| 35 | Sr. Software Development Engineer | Y |  |
| 36 | Sr. Software Engineer (Backend- Analytics Platform) | Y |  |
| 37 | Sr. Software Engineer III | Y |  |
| 38 | Sr. Software Engineer, DevOps | Y |  |
| 39 | Staff Software Engineer - Machine Learning | U | machine-learning specialization |
| 40 | Staff Software Engineer - Payments Extensibility, Tech Lead | Y |  |

## The 40 rejected titles that contain engineer, developer or technical

| # | Title | Label (Y = should have matched) | Note |
|---|---|---|---|
| 1 | AI Research Engineer | N |  |
| 2 | Battery Engineer | N |  |
| 3 | Business Intelligence Engineer (the table entry has stray spaces) | N |  |
| 4 | Controls Engineer | N |  |
| 5 | Engineering Program Manager | N |  |
| 6 | Founding Engineer | U | a founding engineer at a startup is usually a software role, but the title does not say |
| 7 | Member, Technical Staff | Y | MISS: "Member, Technical Staff" is the same role as "Member of Technical Staff"; the rule's pattern does not allow the comma |
| 8 | Packaging Engineer | N |  |
| 9 | Principal R&D Engineer | N |  |
| 10 | Product Security Engineer | N |  |
| 11 | Product Test Engineer | N |  |
| 12 | RTL Design Engineer | N |  |
| 13 | Reliability Engineer | U | could be hardware or manufacturing reliability, or site reliability |
| 14 | Robotics Systems and Applications Engineer | N |  |
| 15 | SYSTEMS ENGINEER | U | could be systems software or embedded work |
| 16 | Senior Analytics Engineer | N |  |
| 17 | Senior Applications Engineer | N |  |
| 18 | Senior Autonomy Engineer | N |  |
| 19 | Senior Cloud Partner Solutions Engineer - AWS Field | N |  |
| 20 | Senior Engineering Manager, Robotics | N |  |
| 21 | Senior Front-end Engineer | N |  |
| 22 | Senior Mechanical Design Engineer - Power Electronics | N |  |
| 23 | Senior Process Engineer | N |  |
| 24 | Senior Quality Engineer I | N |  |
| 25 | Senior R&D Engineer | N |  |
| 26 | Senior RF Engineer (the table entry has stray spaces) | N |  |
| 27 | Senior Security Research Engineer | N |  |
| 28 | Senior Software Security Engineer | N |  |
| 29 | Senior Sourcing Engineer | N |  |
| 30 | Senior Support Engineer | N |  |
| 31 | Software Engineer in Test III | N |  |
| 32 | Software/Systems Test Engineer | N |  |
| 33 | Sr. Hardware Design Engineer | N |  |
| 34 | Sr. Manager of Technical Accounting and Financial Reporting | N |  |
| 35 | Sr. Manager, Software Engineer in Test | N |  |
| 36 | Staff Embedded Software Engineer | N |  |
| 37 | Staff Mechanical Engineer | N |  |
| 38 | Staff Security Engineer | N |  |
| 39 | Support and Services Engineer | N |  |
| 40 | Technical Support Specialist II | N |  |
