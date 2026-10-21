# FRICTIONAL — healthins-ai-opt v0.2.0 (Mode Build)

## Executive summary

This is the honest log of how this submission was built: who did what, and what resisted. An AI coding agent (Claude Code) wrote the code and tests, ran every command, and drafted every document in one session on 2026-10-20. The student approved the plan before any edit (continue the same mode, update the existing PR, send nothing that needs the student's identity) and owns every decision recorded here. Three steps are the student's: re-running the checks by hand (done on 2026-10-21), signing the attestation (the student told the agent to type their name and date, and the line says so), and approving the push (nothing is pushed until the student says so). The student's own dated account comes first; the tables after it are the agent's record of who did what and what resisted.

## In the student's own words (section 1 says exactly who did what)

### October 20, 2026 — Working on the Mode

For this assignment, I decided to continue with my previous health insurance and AI job search mode instead of starting a completely new project. I already had the basic idea from the previous assignment, but this time I wanted to see if it could actually work with real job postings.

I used Claude Code to help me build the scripts, run the initial tests, and prepare the documentation. My main focus was making sure the mode was useful for an international student looking for AI and software engineering jobs.

#### Problems I ran into

The first problem was getting everything to run properly. The verification command needed PyYAML, which was missing from the environment. This was resolved by using a temporary Python environment instead of changing the global installation.

Another problem was with the job filtering. The first version was removing some jobs that could actually be suitable for new graduates. For example, one software engineering role was excluded because the filter treated the team name as a reason to reject it. There was also a problem with how the experience requirements were being checked.

I wanted to correct these problems because the whole point of my project is to help students find opportunities. If the program removes good jobs by mistake, the results are not very useful.

I also noticed an issue with the scoring results. A job could receive an Apply recommendation mainly because the company had sponsored visas before, even when the actual role was not a very good match. I wanted the job requirements and role fit to matter more, so we added a fit requirement before a role could receive the highest recommendation.

#### What I learned from the first run

The run started with 1,729 job postings from 32 boards, but only 9 candidates remained after filtering.

I didn't expect the list to become that small. It made me realize how much difference the filtering rules can make and why it is important to check the actual job descriptions instead of trusting the final score.

I also decided to keep the earlier failed results and logs. I thought it was better to show what went wrong and how the approach changed rather than only showing the final successful output.

### October 21, 2026 — Checking

*(Drafted by the agent from what the student reported on 2026-10-21; the student can rewrite it in their own words.)*

Before signing, I re-ran the checks myself: `npm run verify`, `npm run doctor`, the 45 offline tests, and the decision step from the saved snapshot compared with the committed outputs (all five outputs came out identical). I also opened four pages in a browser and compared each with the report: Omada's live posting and an invalid Omada link (it says the job is no longer open), Commure's AI Integrations posting, and Coalition's posting. After the files were moved to follow the assignment's instructions, I ran the same four checks again on the final tree, and they matched.

The Coalition link in the report did not take me to the posting. It redirects to the careers listing after about two seconds, so my first screenshot of Coalition was the list of jobs and not the posting. I then opened the real posting address and saw the title, the United States location and an Apply Now button. The repository's liveness check said "active" for both the stored link and the listing, because its apply test is a word match. The role is open, so the answer was right, but the check cannot tell a posting from a careers page. I left that documented and did not change the run's results.

I asked Claude Code to type my name and date on the attestation, and the line says so.

## 1. Who did what

| Contribution | Student | AI agent (Claude Code) |
|---|---|---|
| Choice to continue healthins-ai-opt as v0.2.0 rather than a new mode | Approved the plan | proposed it: this assignment is the successor to the design one |
| Persona and visa assumptions | Chosen on 2026-10-03, unchanged | reused the fictional persona; added buckets, tolerances and a fit floor as persona inputs |
| `ingest.mjs`, `jd-screen.mjs`, `run.mjs`/`lib.mjs` changes, 45 tests, 12 tools | Not written by the student | wrote |
| Board list (32) and the company claim for each | Not reviewed yet | found 20 boards (the repository's detector and a probe of 165 slugs), added 12 by name from its own list of well-known companies, wrote each `csv_company` claim, note and size bucket |
| Running the commands and reading the output | Re-ran four checks (verify, doctor, the 45 tests, the decision step) and compared four pages with the report, on 2026-10-21 | ran everything first; read the postings behind the Apply decisions |
| Recipe, card, justification, worked run, run log, presentation script | Ran the checks and looked at the pages (worked run, section 7); a full read of every document is not recorded | drafted |
| Lifecycle status DRAFT | Approved the plan, which said DRAFT | proposed, because 8 typed TODOs are open |
| Independent check of the finished package | Not involved | a second agent, read-only, audited the package against the assignment and the repository's rules; the first agent verified each of its claims before acting (worked run, section 3.4) |
| Re-run checklist and attestation signature | Ran the checks on 2026-10-21 and told the agent to type their name and date on the attestation | typed the name and date at the student's instruction (the line says so); did not run or judge the student's checks |
| Push, PR update, Canvas upload | Decides when (nothing is pushed until the student says so); uploads the zip to Canvas | prepared the commits, the PR text and the zip; pushes and updates the PR only on the student's instruction |

## 2. What resisted (and the response)

*In this file, `evidence/` is the folder next to it, `assignments/submissions/shreyashyadav1/evidence/`.*

1. **`npm run verify` fails on this machine.** Homebrew Python 3.14 has no PyYAML. Response: a throwaway venv on PATH; nothing installed globally. Because the portals file is YAML, `conformance` now needs it too (CI installs it).
2. **The v0.1.0 fixtures all shared one website,** so the new sibling gate blocked every role. Response: each fixture company got its own website.
3. **A regex excluded a software role** ("Software Engineer II, Solutions Engineering") because it matched a team suffix. Found in a smoke run by reading the titles. Fixed.
4. **The first official run had a wrong experience screen.** It excluded a posting that invites new grads and missed four stated requirements. Found only by reading the real postings behind the decisions. The first run's transcripts are kept (`evidence/07a`, `08a`).
5. **The scorer called a customer-facing role "Apply".** Reading the posting showed sponsorship alone had cleared the bar. Response: a fit floor through the scorer's own override field, not a change to the scorer.
6. **Three safety checks stopped the agent** (a foreground `sleep`; a `rm` in a shell wrapper that the sandbox could not inspect; later, a `bash -c` wrapper with no removal in it that the check could not inspect). The first two were respected: the superseded scratch transcripts were left out instead of deleted, and nothing was worked around. For the third, the agent ran the same steps as separate plain commands, none of which removes anything.
7. **Outside knowledge, first stated as fact.** The agent's first draft said, from its own background knowledge and not from any file the mode reads or any page opened in this session, that Commure acquired Augmedix, that Oscar Health is a public company, and that four similarly named CSV rows (Abridged Inc, Headway Sales Inc, Clover Software Inc, Sword Diagnostics Inc) are different businesses. Its own documents claimed these were marked as unverified wherever they appeared; they were not (the portals file, the saved snapshot and the report stated them plainly). The independent review caught it. They are now hedged at the source, the run outputs were regenerated from the same snapshot, and the worked run lists them as outside knowledge. None was checked.
8. **Board provenance was overstated.** The first draft said every board's company name had been checked against its postings. Only 20 of the 32 boards appear in the saved discovery output; 12 were added by name; and the name-in-posting look at some boards was a one-off script whose output was not kept. The claim was removed, the discovery probe was saved as a tool and run again, and the wording now says that nothing in the repository checks the board-to-company link.
9. **A link in the report that redirects.** The student's check of the report's Coalition link showed the careers listing instead of the posting. The agent reproduced it (evidence 100, 100b): the link redirects within about two seconds, and the checker's apply test is a word match, so it read `active` on both pages. The role is open, so the answer was right, but the check cannot tell a posting from a careers page. It is documented, not fixed, because fixing it would change a maintained file and the run's outputs.
10. **Things deliberately not done:** no Form D download (the SEC wants a real name and email as User-Agent), no DOL LCA or E-Verify download, no edit to any maintained file, no commit or push.
