# Show-and-tell notes — swe-opt-clock-live (5 minutes)

## Executive summary

**What this is.** Speaker notes for the five-minute in-class demo. There are no slides: the demo is the mode file and the terminal.

**Why read it.** It keeps the talk to time and makes sure the four things the rubric asks for each get a beat: the domain, the information asymmetry, something learned from running it, and an honest limitation.

**What it says.** For an unemployed OPT new grad, the decisive facts aren't on the posting:
- whose board it is;
- whether the page is really open;
- whether hiring can finish before their days run out.

The live run showed all three, and it showed the scorer saying Apply on sponsorship alone.

## Before class (2 minutes, at the desk)

```bash
cd the-reallocation-engine
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs | tail -8
```

Open in tabs:
- the mode file `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md`
- `assignments/submissions/bagwe-shubham1727/runs/2026-10-21/evaluate-neel-kapoor/report.md`
- `…/evaluate-persona-neel-whatif-day10-fit/report.md`

Don't run the live capture in class: it needs the network and about 90 seconds. Show the committed capture instead.

## The talk

| Time | Say | Show |
|---|---|---|
| 0:00–0:45 | **Domain.** "An international MS CS grad on OPT, *unemployed*, applying to new-grad SWE jobs in Boston. The fictional student has used 60 of 90 unemployment days. They must start a job by November 20, seven months before their EAD ends." | the mode file's executive summary |
| 0:45–1:45 | **Asymmetry.** "Three facts decide whether a posting is worth an hour, and none is on the posting: whose board this really is, whether the page is really open, and whether this company can hire you before your days run out." Then the hook: "I guessed board slugs for each sponsor. One guess, `cohere`, is Cohere the AI company in Toronto, not Cohere Health in Boston. The engine's scan printed `COHERE HEALTH INC — Software Engineer, Security Agents` anyway, because it labels jobs with whatever name you give it. The mode's board gate drops it." | `runs/2026-10-21/terminal/04-ats-scan-dry-run.txt`, the Cohere line |
| 1:45–3:00 | **A real run.** "20 boards, 1,300 postings, 15 new-grad SWE postings, every one opened in a browser. For this student all 15 start too late: with a 45-day hire, the earliest start is December 5." Then the what-if clock: "With more runway, the scorer said Apply to six." | `terminal/05-capture.txt`; the Neel report's clock table; the what-if decisions table |
| 3:00–4:00 | **What I learned from running it.** "Five of those six Applies came from sponsorship alone. A Proven sponsor's vote is 0.9 × 0.35 = 0.315, and that already clears the 0.30 threshold. One of them asks for five years of experience, and its fit, written by the AI as a labeled judgment, was 0.1. So the mode now sends those to networking. And my first conformance check let a deliberately broken scorer through, because no gate happened to be closed that day. A check that only fires on some data is a weak check." | `terminal/09a-…BEFORE…md` beside the final table; `terminal/14a` then `14b` |
| 4:00–4:45 | **Honest limitation.** "It can't check the human. When the wrong Cohere board was 'confirmed' on purpose, as a break test, it attached Cohere Health's 104 approvals to the AI company's job. And today's whole verdict rests on one guessed number, the 45-day hiring time." | `terminal/12-break-decoy-confirmed.txt`; the mode's "cannot verify" table |
| 4:45–5:00 | **Close.** "It's marked DRAFT, honestly: eight open TODOs, and the decisions aren't signed yet. It ran, and it told me things I didn't know." | frontmatter |

## If asked

- *Why not just trust the scan?* It labels every job with the name it was given. That is how a wrong slug guess put Cohere AI's job under Cohere Health's name.
- *Why is fit last?* Under the real clock the timeline gate decided everything, so zero fit judgments were needed. Judgment goes where it can change the result.
- *What would you build next?* Two things. Liveness inside embedded application frames, which would settle 5 of today's 15 postings. And keeping the feeds' posting dates: one candidate had been up since May.
