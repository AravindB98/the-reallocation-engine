# Title-matcher spot check

## Executive summary

The recipe decides whether a company has sponsored backend-style jobs by matching the job titles in the company table against a rule written for this work. This page tests that rule on 80 titles drawn with a fixed seed and labelled by hand. The rule is a heuristic, and the check shows how good a heuristic it is: in this sample it made few clear mistakes, and the mistakes were machine-learning and perception specializations, not the testing or sales titles I had predicted. One assistant did the labelling, so the numbers are indicative, not proof.

## Method

- **Population:** 2,063 distinct sponsored titles across the 1,557 companies that have a sponsorship record. The rule accepts 225 of them. 755 rejected titles still contain "engineer", "developer" or "technical".
- **Sample:** 40 accepted titles (to look for false positives) and 40 rejected titles that contain one of those words (to look for misses), drawn with seed 20260930. Redraw the same 80 with `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/check-titles.mjs`.
- **Label rubric:** Y = a backend or platform candidate would count it as a role in their target family (a generic software-engineer title with an opaque team name counts). N = clearly outside it (specializations such as perception, computer vision, mobile, security, hardware, data science, management, testing). U = borderline: it could go either way depending on the job.
- **Who labelled:** Claude (an AI assistant), in the working session on 2026-09-30, one labeller. These labels are model-judgment. The author has not yet checked them; a spot check by the author would raise their value.
- **The rule was not changed after the labels were made.** Both samples were drawn before any label existed, and the rule is the one used in the sample run.

## Results

| Sample | Size | Clear error | Borderline | Correct |
|---|---|---|---|---|
| Accepted titles (false positives) | 40 | 2 (5.0%, 95% interval 1.4% to 16.5%) | 4 | 34 |
| Rejected titles containing engineer, developer or technical (misses) | 40 | 1 (2.5%, 95% interval 0.4% to 12.9%) | 5 | 34 |

## What this shows and does not show

- Counting borderline titles as errors, about 15 percent of accepted titles and 15 percent of rejected keyword titles are debatable; counting only clear errors, 5 percent and 2.5 percent. With 40 titles each the intervals are wide.
- It does not measure recall over the whole table: rejected titles without those three words were not sampled.
- **Prediction P1 in the change brief** said the first matcher would misfile testing, sales or support titles and would miss "Member of Technical Staff". Result: some misfiles did occur, so the direction was right, but the specifics were wrong. Testing, sales and support titles were already excluded by design, "Member of Technical Staff" titles were matched (samples 16 and 25), and the clear errors are machine-learning and perception specializations plus one title excluded by the manager rule.
- A better rule would need occupation codes on the sponsorship records, which the company table does not carry (a typed proposal in the recipe).

## The 40 accepted titles

| # | Title | Label | Note |
|---|---|---|---|
| 1 | Senior Software Development Engineer | Y |  |
| 2 | Software Engineer IV | Y |  |
| 3 | Associate DevOps Development Engineer | Y |  |
| 4 | Associate Software Engineer | Y |  |
| 5 | Backend Engineer | Y |  |
| 6 | DevOps Engineer | Y |  |
| 7 | FULL STACK SOFTWARE DEVELOPER | Y |  |
| 8 | Full Stack Java Developer | Y |  |
| 9 | High Performance Computing - Software Engineer | Y |  |
| 10 | Lead Robotics Software Engineer | U | robotics software; may be embedded or real-time work |
| 11 | Principal, Full-Stack Developer | Y |  |
| 12 | SENIOR SOFTWARE DEVELOPMENT ENGINEER | Y |  |
| 13 | Senior Backend Engineer | Y |  |
| 14 | Senior Cloud DevOps Engineer | Y |  |
| 15 | Senior DevOps Engineer | Y |  |
| 16 | Senior Member of Technical Staff | Y |  |
| 17 | Senior Software Engineer (AI Platform) | Y |  |
| 18 | Senior Software Engineer 1 | Y |  |
| 19 | Senior Software Engineer I, Machine Learning | U | machine-learning specialization |
| 20 | Senior Software Engineer II | Y |  |
| 21 | Senior Software Engineer – Perception CV | N | perception / computer-vision specialization, not backend or platform |
| 22 | Senior Software Engineer, Data | U | data-focused; adjacent to backend |
| 23 | Senior Software Engineer, Generalist | Y |  |
| 24 | Senior Software Engineer, TPLAN | Y |  |
| 25 | Software Developer (Member of Technical Staff) | Y |  |
| 26 | Software Development Engineer Lead | Y |  |
| 27 | Software Engineer (11525.3338.7) | Y |  |
| 28 | Software Engineer (L3) | Y |  |
| 29 | Software Engineer - Backend (Compliance) | Y |  |
| 30 | Software Engineer - Perception ML | N | perception / machine-learning specialization, not backend or platform |
| 31 | Software Engineer Senior Staff | Y |  |
| 32 | Software Engineer, Backend, Cloud Platform | Y |  |
| 33 | Software Engineer, Database Sources | Y |  |
| 34 | Software Engineer, Knowledge Base Platform | Y |  |
| 35 | Software Engineer, Machine Learning | U | machine-learning specialization |
| 36 | Sr. Principal Software Engineer [00052910] | Y |  |
| 37 | Sr. Software Development Engineer | Y |  |
| 38 | Sr. Software Engineer (Backend- Analytics Platform) | Y |  |
| 39 | Sr. Software Engineer III | Y |  |
| 40 | Staff Site Reliability Engineer | Y |  |

## The 40 rejected titles that contain engineer, developer or technical

| # | Title | Label (Y = should have matched) | Note |
|---|---|---|---|
| 1 | AI Research Engineer | N |  |
| 2 | AI TOOLS ENGINEER | U | could be software work; the title does not say |
| 3 | Advanced Technology Engineer | N |  |
| 4 | Applications Security Engineer | N |  |
| 5 | Biomedical Engineer | N |  |
| 6 | Cloud QA and Test Automation Software Engineer | N |  |
| 7 | Data Engineer 20516.3745 | N |  |
| 8 | Engineer, R&D | N |  |
| 9 | Engineering Manager (Platform) | N |  |
| 10 | Engineering Team Lead | N |  |
| 11 | FIELD SYSTEMS ENGINEER | N |  |
| 12 | Growth Engineer | U | product growth engineering is often full-stack |
| 13 | Mixed Signal Integration Engineer | N |  |
| 14 | NPI Manufacturing Engineer | N |  |
| 15 | Packaging Engineer - DMU | N |  |
| 16 | Robotics and Machine Learning Engineer | N |  |
| 17 | Senior Battery Engineer | N |  |
| 18 | Senior Director, Engineering (Cloud Operations) | N |  |
| 19 | Senior Director, Technical Operations | N |  |
| 20 | Senior NLP Engineer | N |  |
| 21 | Senior Security Engineer, Enterprise Security | N |  |
| 22 | Senior Software Engineer - Mobile | N |  |
| 23 | Senior Staff Design Engineer | N |  |
| 24 | Software Developer (Product Manager) | N |  |
| 25 | Software Systems Engineer | U | could be systems software or embedded |
| 26 | Sr. Interoperability Engineer | U | integration engineering; unclear |
| 27 | Sr. Manager of Technical Accounting and Financial Reporting | N |  |
| 28 | Sr. Quality Engineer - Failure Analysis | N |  |
| 29 | Sr. Software Test Development Engineer | N |  |
| 30 | Sr. Technical Product Manager | N |  |
| 31 | Staff Mechanical Engineer | N |  |
| 32 | Staff Product Security Engineer | N |  |
| 33 | Staff Security Engineer | N |  |
| 34 | Staff Software Engineer/Team Lead Manager | Y | MISS: a staff-level software engineer role excluded only by the "manager" rule |
| 35 | Sustaining Process Engineer | N |  |
| 36 | Technical Account Manager II | N |  |
| 37 | Technical Business Analyst | N |  |
| 38 | Technical Lead | U | usually software, but the title does not say |
| 39 | Test Development Engineer | N |  |
| 40 | UX Developer – Band 1 & 2 | N |  |
