# AI Use Disclosure: Setup Exercise, Your Search's Personal Layer

**Student:** Aravind Balaji (GitHub: AravindB98; student ID on the Canvas submission, not in this public repository)
**Course:** INFO 7375 Computational Skepticism for AI, Fall 2026
**Tool:** Claude (Anthropic), in the Claude desktop app with file tools and web fetch, 2026-10-27 to 2026-10-29
**Where the real files are:** `search/` of my local clone and the Canvas file upload. Not in this fork (DATA_CONTRACT.md, Zero-Conditions).

## Executive summary

This is the required statement of what an AI assistant did and did not do in building the student's personal search files. Read it to see which parts were machine extraction and which were the student's judgment. The dividing line: the assistant extracted, drafted and checked repositories; the student supplied the facts the resume did not hold, decided which findings were real, corrected three resume claims, and signed the record.

## What the AI did
- Extracted my October 2026 resume PDF into typed JSON records (`resume.import-v0.json`, mechanical and unchallenged, kept in the Canvas upload). An earlier pass on 27 October used the spring 2026 resume; it was superseded.
- Shallow-cloned the six repositories the resume links to and checked the resume's figures against their READMEs, results folders and technical reports.
- Drafted `search/resume.json` with the corrections I supplied and the records added since the resume was written.
- Drafted `search/profile.yml` twice: once from the resume alone (`profile.draft-v0.yml`), once from my intake answers.
- Read the Reallocation Engine repo at commit 584d8bb (`.gitignore`, `scripts/doctor.mjs`, `scripts/score/role-scorer.mjs`, `docs/tutorials/00-personal-layer.md`, `search/examples/`) and found the conflict between the Canvas text and the repo's data contract.
- Found and read the evidence for `search/gaps.md`: three postings (Goodfire, Moda, Applied Labs) and O*NET's employer-based hot-technology table for SOC 15-1252; drafted the table, the plan column, and the row I later killed.
- Drafted the fictional Cyrus A Vane persona, the run-log entry, this disclosure, the check script and its Finder launcher; ran the post-push verification (4.3) in its sandbox.
- Validated that the JSON and YAML parse and that the scorer's regex reads the corrected authorization string as "needs sponsorship".

## What I did
- Chose the October resume as the source and supplied the facts it does not hold (authorization, availability, the hackathon workstream, the course projects, the publication's journal status).
- Confirmed which of the agent's findings against my repositories are real and corrected the three counted errors; decided that the two resume bullets must change.
- Reviewed every record's `verify_status` and left `confirm` where I do not yet have the document in hand.
- Killed the "no completed advanced degree" row and wrote the reason; rewrote the evaluation row in my words.
- Decided to follow the repo's contract over the Canvas wording and to submit the real files through Canvas instead of the fork.
- Reviewed every correction and every record, and decided to attest. The check script that sets the field ran on my laptop against a fresh clone of my fork (`4.2_my-check-2026-10-29.txt`); the field records my review, and records marked `confirm` remain my claims until checked against documents.

## What the AI could not do (specific instances)
1. It could not know, from the resume, that "false positive rate 0.789 to 0.111" was the number I had already corrected in the CodeSentinel README on 22 October. It found the contradiction only because I pointed it at the repositories; the extraction itself copied the claim without comment.
2. It could not know that the journal submission of my QEMA-G paper had been rejected; the resume says "Published on TechRxiv and Zenodo" and the agent recorded it as published.
3. It concluded I have no advanced degree because the Northeastern record says "in progress" while the completed M.Tech sat one record lower in the same file; the gap row it generated from that was fluent and wrong.
4. Its first pass marked 20 skill names unevidenced because it had cloned only the six repositories the resume links. I told it the proof is on my website and in the other repositories; after cloning 23 it put a pointer on 43 names and left 9. It also wrote "no Go" and "no TypeScript repository" in the gaps draft; QuantumTeller is Go and ServiQue v2 is TypeScript. Both corrections needed my knowledge of my own portfolio.
5. It could not fetch my GitHub profile listing (robots policy), the Zenodo record or the Amazon listing, so those are marked `confirm` or `not_verified_by_agent` rather than confirmed.
6. It cannot sign the attestation.

## AI reviews of the draft package
Between 20:30 and 21:50 on 29 October I had the package reviewed six times by three AI assistants acting as a strict TA (ChatGPT four times, Gemini once, a Claude Opus 5.5 instance on Northeastern's seat once). Most changes after the first complete version respond to those reviews: the attestation provenance (a check run recorded on my laptop instead of the agent's sandbox), the `verified` label renamed `artifact_present` with authorship declared self-attested, the HealthTech 60% treated like the Checkpoint 12%, the CodeSentinel run story corrected to one valid run after a known bug, the G2/G4/G5 plans scoped to what they evidence and G5 split, the G8 production-ownership row, the evidence classes (target-market versus transferable), the draft-provenance note, the rubric map, and this section. I checked each point against the files before accepting it. Rejected: a suggestion to force-add the real personal files to the public fork to satisfy the Canvas wording (the repository forbids it), and a suggestion to rewrite the check-run output to look like a laptop run (I ran it on the laptop instead). Several sentences in the record are close paraphrases of reviewer wording where the reviewer said it better than I had; the judgments behind them are mine. The G1 timeline correction rests on the CodeSentinel README (lines 144 to 159 at commit 49ea00d) and commit 47306a4, not on a reviewer's reading.

## What was checked and how
- Postings and O*NET data were read on 2026-10-27; URLs and access date are in `gaps.md`.
- 23 repositories were shallow-cloned on 2026-10-29; commit hashes are in `resume.json`. Every disputed skill name was grepped across all clones with vendored directories excluded. The CodeSentinel figures were checked against README lines 144 to 159 at commit 49ea00d and `eval/results/`; the QueryCraft figures against its readme tables; the CEREBRO figures against `docs/Technical_Report_CEREBRO.md` section 11.
- The `.gitignore`, `doctor.mjs` and `role-scorer.mjs` claims were read from a fresh clone at 584d8bb on 2026-10-28.
- No contents of `search/private-notes.md` appear in the log, in this disclosure, or in the fork.
