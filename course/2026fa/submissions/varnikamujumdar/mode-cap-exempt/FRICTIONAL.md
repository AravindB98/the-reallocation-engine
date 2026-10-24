# FRICTIONAL — honest log (cap-exempt triage)

## Executive summary

This is my honest record of what was hard, what surprised me, and what went wrong while I built and ran the cap-exempt triage mode. The two biggest surprises came from running the mode, not from designing it: the engine's own data can't see universities at all, and the repo's job checker told me a live job was closed. What slowed me down most was conflicting GitHub rules and learning the constitution's rules. Next time I'll start with fictional data, settle the rules before branching, and check tool outputs myself.

## In my own words

*Written by me (Varnika).

My idea was to help someone who lost the H-1B lottery find employers that can sponsor without it. I picked it because it's a real problem, and because the cap-exempt route (universities and nonprofits) isn't something most job tools show you. The part I checked myself was the results. I re-ran the 47 tests and reproduce.sh on my own, and the output fingerprint (96a7e662…) matched. I also read report.md, and I ran the git commands myself to make sure none of the old commits with my real graduation date came along. What surprised me most was that the engine's 30,000-company dataset had only 31 university- or hospital-sounding names, and none of them had any visa approvals on record (the field was blank). Most were startups or LLCs, and none is a real university. In fact, none of the 3,771 public and nonprofit universities in the federal college list appears in that dataset at all, so the engine's existing data would have missed the exact employers I was looking for. The hardest part for me was the rules, because Canvas and CONTRIBUTING.md disagreed and I couldn't start until the TA answered. For the G4 decisions, I chose carefully because this was a test with a fictional person. I kept on hold the two postings the tool had held, Northeastern and Fred Hutch, so I could check them myself, and dropped the other four instead of guessing. Working with an AI, I had to push back: I asked why only my attestation counted and wanted my own work recorded, I questioned why the "Did not test" list was so long (six of those items then got tested), and when I asked whether gate G4 was checked, it turned out it wasn't, and its rule couldn't be tested, so we fixed it. If I used this tool for my own job search, I would trust it for finding which employers to look at, but not for telling me if a job is still open, because the job checker said a live Fred Hutch job was closed. Next time I would start earlier instead of doing everything on the due date, and I would check for rule conflicts on day one.

## Who did what

- **Me:**
  - picked the domain and the cap-exempt idea;
  - ran the git setup, a clean branch from the professor's `main`, and checked that my old PR's commits didn't come along;
  - decided the scope (close the IPEDS, USCIS and hiring-lag TODOs and leave three honest ones open);
  - chose to keep 45 days as a labelled guess;
  - asked for SOURCES, this file and a Contributions section;
  - review and sign the attestation.
- **Claude Code** wrote the code, tests and drafts, and ran everything. Two AI helpers found the postings and checked the regulations.
- **A classmate** asked the TA the GitHub-rules question, and I used the answer.

## What surprised me

1. **The checker said a live job was closed.** I expected the repo's liveness checker to be the most reliable part. On Fred Hutch it said "expired", but the posting was open: the salary, an apply button and no "closed" text were all there when we fetched the page. The job loads inside a frame, and the checker only reads the outer page. If I hadn't checked, the mode would have dropped one of the best-fit employers without telling me.
2. **The engine's data can't see universities.** I expected 80 Days to cover at least some universities. Out of 30,369 companies, the 31 with university-, hospital- or foundation-type names include no real university: 26 raised startup money, 13 are LLCs or LPs, and their approval fields are blank (unknown). Not one of the 3,771 public and nonprofit universities in the federal college list appears in it. Once we added the government's H-1B data, Northeastern, Fred Hutch and Ai2 all showed up with real approval counts. The employers were never missing; the dataset just wasn't built to see them.

## What slowed me down

1. **Conflicting GitHub rules.** The Canvas instructions said one thing: a `mode/` branch, append to RUN_LOG, put files in `recipes/` and `assignments/`. `CONTRIBUTING.md` said another: a `contrib/` branch, never touch RUN_LOG, namespaced folders, one open PR. I couldn't start until the TA answered: content from Canvas, GitHub rules from CONTRIBUTING, and a second PR is OK.
2. **Understanding the rules.** The lifecycle, the TODO types, gates and attestation took time. The hardest idea was that my mode ran fully but is still DRAFT, because any open TODO keeps it there. My last recipe was DRAFT with 8 open TODOs and still got 96, which helped me see that honesty matters more than the label.

## Attempts → what I expected → what happened → what I did

| Attempt | Expected | Happened | Response |
|---|---|---|---|
| Liveness check on 6 real URLs | mostly "active" | 2 active, 2 expired, 2 uncertain | re-checked TRI and Fred Hutch once |
| Re-check of TRI and Fred Hutch | both resolve | TRI active (timeout was temporary); Fred Hutch still "expired" | checked the page by hand: open. The mode now **holds** that kind of "expired" |
| Independent recount of the audit | same numbers | 64 vs 31 names | the extra 33 were "HOSPITALITY"-type substring matches; 0 approvals either way. Documented |
| Break test: no job, not employed | STOP naming the unemployment clock | STOP, but the message blamed the OPT end date | fixed the message, added a test |
| First data download (IPEDS) | file ingested | the safety check halted: a column name was garbled by a hidden byte | fixed the decoding; nothing bad was written |
| Reading my own recipe again | recipe and code agree | the recipe promised a rule the code didn't have (missing claim source → name-only) | implemented it, with a test, instead of quietly deleting the sentence |

## Still unresolved

- Toyota Research Institute only gets flagged if I mark the claim as name-only. The IRS nonprofit list would catch it, but that TODO is still open.
- University wage tables (ACWIA) aren't in yet, so salaries are compared to the national median only.
- I never found out why the Fred Hutch in-frame page also failed in the headless browser.
- 45 days for hiring is still a guess.

## What I'll do differently next time

1. **Fictional data from day one.** Last time I lost 3 points because my persona used my real graduation date. This time every date is invented from the start.
2. **Check the rules before branching.** Ask the TA about GitHub vs Canvas rules first, before writing anything.
3. **Verify tool outputs myself.** "Expired" from a tool is a claim, not a fact. I'll open the posting before trusting it.
4. **Start earlier.** Leave time between running, reviewing and signing, instead of doing everything on the due date.

## What I questioned, and what changed because of it

These are the questions I asked during the build. Each one changed the work:

| I asked | What it changed |
|---|---|
| Why is only my attestation needed? | The constitution makes adequacy a human judgment, so I sign it. I also asked for my own work to be recorded (Contributions in WORKED-RUN, Who did what in SOURCES). |
| Did my previous recipe have TODOs? | It had 8 and was DRAFT, and still scored 96. So I chose the middle scope: close IPEDS, USCIS and the hiring lag, and leave three honest TODOs instead of rushing all six. |
| Why is "Did not test" so long? | Six items were testable or measurable, so they were checked instead of listed: the B4 test fails on the old code, Northeastern is open (Workday API), the Fred Hutch cause (job text inside a frame), Python 3.12, Ashby liveness, and exact-name coverage (14.4%). |
| Did we check gate G4? | No. G4 also had no testable condition, so it was fixed. Then I made the G4 decisions myself (2 keep held, 4 drop) and confirmed the HHMI record link. |
| Can you check my work against a classmate's grading comments? | It found that the card promised a legal-name check the code didn't do (now fixed), and that every stop condition should say whether the script or the agent enforces it. |

## Traceability

- Run logs: `logs/runs/2026fa-varnikamujumdar-2.md` (first run), `-3.md` (TODO closures and re-run) and `-4.md` (my G4 decisions).
- Worked run with all pasted output: `WORKED-RUN.md`.
- Sources and credits: `SOURCES.md`.
