# 5-minute show and tell — healthins-ai-opt v0.2.0

## Executive summary

A speaking script and a demo plan for the in-class show and tell. It covers the student the tool is built for, the blind spot it addresses, one real run on 32 live job boards, one thing running it taught, and one thing it cannot verify. The live part is two short commands that need no setup beyond the repo; everything else is already on screen.

## Read this first: say only what you did

An AI coding agent (Claude Code) wrote the code and ran the commands under the student's direction, and `FRICTIONAL.md` in this folder says who did what. The script is written for the student to speak, so it names the agent where the agent did the work. The student did the re-run checklist in `README.md` on 2026-10-21, so the answer to "What did you check yourself?" below applies. Say the first minute's disclosure line, and say only what you did.

## Before class (2 minutes)

- Open Terminal in the repo, make the font big (Cmd +), and run `cd` to the repo folder.
- Open `assignments/submissions/shreyashyadav1/runs/2026-10-20/report.md` in a tab, scrolled to "How many roles survived each gate".
- Open two browser tabs: `https://job-boards.greenhouse.io/omadahealth/jobs/8047423` (live) and `https://job-boards.greenhouse.io/omadahealth/jobs/1234567` (closed).
- Backup if anything fails: `WORKED-RUN.md` has the same output pasted.
- Don't run `ingest.mjs` live. It re-reads the boards, so the numbers move by a posting or two. The saved snapshot is the run.
- Running the decision step into a scratch folder changes nothing tracked:

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 \
  --candidates assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json \
  --out-dir output/demo
```

## [0:00–0:45] The student and the blind spot

"This tool is for one student: an international master's student in information systems. They graduate in December, start OPT in January, and want applied-AI or LLM engineering jobs at insurance and health companies.

From the outside they can't see three things. Which companies the public visa records can even speak to. Which of the open jobs a new graduate could actually hold. And which hiring processes finish before their ninety unemployment days run out. A chatbot will answer all three fluently. The records mostly can't."

## [0:45–1:30] What changed since the design

"Last time I designed this and it ran on made-up postings. When I counted, none of the numbers the scorer multiplied were real records. This time it reads 32 real job boards. An AI agent, Claude Code, wrote the code and ran it under my direction; I'll say which parts are the agent's.

It checks the cheap things first, with no network: can it identify the company, is the title something a new grad can hold, is the job in the U.S. Only the survivors get their posting text read, and only after that does it open each posting in a browser, using the repository's own liveness checker, to see if it's still open. Then the repository's scorer, unchanged."

## [1:30–3:00] Live demo

Run the command above. Then open the report.

"Offline, one second. Here is what it found. 1,729 open jobs. 162 are software titles. 48 of those are at ten companies the data can't identify, Oscar among them. Another 96 are senior, staff or manager. Eight are abroad. Nine survived, and all nine were really open. Result: none is an 'apply now'. Eight are 'talk to someone first'. One is a skip."

Run `npm run ats:liveness -- 'https://job-boards.greenhouse.io/omadahealth/jobs/8047423' 'https://job-boards.greenhouse.io/omadahealth/jobs/1234567'`.

"That's the repository's checker. One live, one closed. Same as the two tabs: this one has an Apply button; this one says the job is no longer open."

"Here's the one worth a closer look. Omada's 'Software Engineer II' is at a proven sponsor, and the scorer called it Apply. But when the posting is opened, it's a Rails role on a customer-facing solutions team. The scorer's bar is 0.30, and a proven sponsor contributes 0.315 on its own, even if the fit is zero. So after that first run a fit floor was added, through the scorer's own override field, and the report now shows both answers."

## [3:00–4:15] What running it taught

"Three things. First, 96 of the 114 software listings at companies the data can identify are senior or above. For a new grad the real market is a handful of jobs.

Second, reading real postings caught a bug in the agent's experience screen. A posting said '1 to 4 years' and 'new grads encouraged to apply'. The code read the 4 and threw it out. It was fixed to read the minimum, and the first run's output is kept so you can see the mistake.

Third, one number decides how much of the list survives. Move a mid-size company's hiring time from 84 to 173 days." Run `node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/sweep.mjs process-days`. "Nothing changes up to 144 days. At 150, half the 'talk to someone' list turns into skips, and by 171 all of it has."

## [4:15–5:00] The honest limitation

"Here's what it can't verify. Of the 29 numbers the scorer multiplied, only 9 are records, and all nine are the liveness checks. The sponsorship probability, the fit and the timeline are rules and guesses written for this persona; they are labeled as inputs, not records. The company link is a claim too: the agent tried claiming 'Abridged Inc' for the Abridge board and the gate accepted it. It only checks that a name resolves, not that it's true. And ten of the 32 boards, Oscar among them, it simply can't see. The recipe stays at DRAFT because eight proposed additions are still open."

## Likely questions

- **Why no 'apply now' at all?** Nine survivors, and the two with real sponsorship history are weak fits for applied-AI. The fit floor was added after the first run showed that; with it removed, the scorer's two Apply calls stand (a test pins that). It is a setting in the persona file, so a reviewer can change it.
- **How is the break-even computed?** By walking the same timeline function day by day, so it can't drift from the gate: the factor is 1 until 143 days, falls from 144, and is at or below the scorer's closed-gate threshold from 172.
- **Why not fuzzy-match the company names?** Because 'Abridge' would quietly become 'Abridged Inc', a row with a different website. A name that doesn't resolve comes back as a board to look at, not a guess.
- **Why DRAFT?** The constitution says open TODOs block SPECIFIED. There are eight, and closing them by deleting them would be the wrong fix.
- **Who wrote the code?** An AI agent, Claude Code, under my direction. I chose the persona and approved the plan; the agent wrote the code and tests, ran the commands and drafted the documents. `FRICTIONAL.md` has the table.
- **What did you check yourself?** Say only what you did. The student's checks, dated 2026-10-21: "I re-ran the repository's checks, the 45 tests and the decision step from the saved snapshot (all five outputs came out identical), and I opened four pages in a browser (Omada's live posting and a dead link, Commure's posting, Coalition's real posting) and compared each with the report. The worked run says what the agent checked and what I did." Anything you did not do, leave out.
- **Was anything in the first draft wrong?** Yes. A second agent reviewed the package and found that the first draft stated three things from the agent's memory as facts: that Commure acquired Augmedix, that Oscar Health is public, and that four similarly named dataset rows are different businesses. They are now marked as unchecked in the data and the report.
- **Did your own check turn anything up?** Yes. My screenshot of Coalition showed the careers listing instead of the posting: the report's link redirects there after about two seconds. The checker said "active" on both pages, because its apply test is a word match and the listing has a FAQ link with "apply" in it. The role is open, so the answer was right, but the check can't tell a posting from a careers page. That is the first thing I'd fix.
- **What's the one thing you'd do next?** The DOL LCA file. It has occupation codes, so 'sponsors software engineers' would stop being a title guess.
