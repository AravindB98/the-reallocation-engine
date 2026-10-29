# AI Use Disclosure: Setup Exercise, Your Search's Personal Layer

**Student:** Aravind Balaji (001564773)
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
- Drafted the fictional Cyrus A Vane persona, the run-log entry, this disclosure, and a check script for my laptop.
- Validated that the JSON and YAML parse and that the scorer's regex reads the corrected authorization string as "needs sponsorship".

## What I did
- Chose the October resume as the source and supplied the facts it does not hold (authorization, availability, the hackathon workstream, the course projects, the publication's journal status).
- Confirmed which of the agent's findings against my repositories are real and corrected the three counted errors; decided that the two resume bullets must change.
- Reviewed every record's `verify_status` and left `confirm` where I do not yet have the document in hand.
- Killed the "no completed advanced degree" row and wrote the reason; rewrote the evaluation row in my words.
- Decided to follow the repo's contract over the Canvas wording and to submit the real files through Canvas instead of the fork.
- Ran the check script on my own laptop and set the attestation field myself after my pass (see `my-check-<date>.txt` in the Canvas upload).

## What the AI could not do (specific instances)
1. It could not know, from the resume, that "false positive rate 0.789 to 0.111" was the number I had already corrected in the CodeSentinel README on 22 October. It found the contradiction only because I pointed it at the repositories; the extraction itself copied the claim without comment.
2. It could not know that the journal submission of my QEMA-G paper had been rejected; the resume says "Published on TechRxiv and Zenodo" and the agent recorded it as published.
3. It concluded I have no advanced degree because the Northeastern record says "in progress" while the completed M.Tech sat one record lower in the same file; the gap row it generated from that was fluent and wrong.
4. It could not decide which of the 52 skill names were real. The split into evidenced and `familiar_with_not_shipped` needed my knowledge of what each project actually used.
5. It could not fetch my GitHub profile listing (robots policy), the Zenodo record or the Amazon listing, so those are marked `confirm` or `not_verified_by_agent` rather than confirmed.
6. It cannot sign the attestation.

## What was checked and how
- Postings and O*NET data were read on 2026-10-27; URLs and access date are in `gaps.md`.
- The six linked repositories were shallow-cloned on 2026-10-29; commit hashes are in `resume.json`. The CodeSentinel figures were checked against README lines 144 to 159 at commit 49ea00d and `eval/results/`; the QueryCraft figures against its readme tables; the CEREBRO figures against `docs/Technical_Report_CEREBRO.md` section 11.
- The `.gitignore`, `doctor.mjs` and `role-scorer.mjs` claims were read from a fresh clone at 584d8bb on 2026-10-28.
- No contents of `search/private-notes.md` appear in the log, in this disclosure, or in the fork.
