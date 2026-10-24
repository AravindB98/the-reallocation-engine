# Show-and-tell — 5 minutes

No slides: show the mode file, the terminal and the report. Times are targets.

## 0:00–0:45 · The situation

- "I'm designing for an F-1 master's student in their last semester, before OPT starts, looking for new-grad Data Engineer jobs anywhere in the US, who needs H-1B sponsorship."
- Show the persona file: fictional, OPT 2027-03-01, deadline 2027-05-20. "Every application I send in October has to land a start date in that window."

## 0:45–1:45 · The asymmetry

- "The company knows whether it sponsors. I don't. The record exists, but under legal names and specific titles."
- Show the CSV rows: `GEMINI SPACE STATION LLC` and three other GEMINI companies; five `UPSTART …` rows, only one with H-1B data.
- "And the job board doesn't tell you a posting has been up for four years."

## 1:45–3:15 · The real run (terminal)

- Run, live or from `assignments/submissions/ethangomes14/runs/terminal-2026-10-20.txt`: the screen on 19 postings found today → **Apply 5 · Consider 8 · Skip 1 · unscored 5**.
- Open `screen-report.md` → priority list. Point at:
  - Sigma / Klaviyo Apply rows: approvals from the CSV, liveness from `ats:liveness`, API 200.
  - Gemini: **pending alias review → would be Proven**. "The tool shows what my review would unlock, but won't use it until I confirm."
  - Robinhood: **first posted 2022-12-08, ⚠️ possibly evergreen**. Active, API 200: every machine check says open.
- One break attempt: the 17-day-old liveness file → everything Skip. "Liveness is a gate, not a vote."

## 3:15–4:15 · What I learned from running it

- Discovery matched a **sales job** ("Account Executive … (Data Pipeline)") as Data Engineer. Fixed the rule, and it's logged.
- **Fit didn't matter for a Proven sponsor.** Sponsorship alone, 0.9 × 0.35 = 0.315, clears the 0.3 Apply line, so two lead roles rated 0.3 came out Apply. I logged it as a `[TODO: DEFINE]` instead of quietly changing the scorer, then decided a floor of 0.4: those two are now Consider (show the "capped" row), and the scorer's own answer is still in the log.

- (If time) The live run caught a **date bug**. Two scripts used UTC, so at 8:40 pm my Greenhouse check was dated *tomorrow* and the screen ignored it. It was safe, but I lost a check without noticing until I read "0 checked". Fixed, and both broken outputs are kept.

## 4:15–5:00 · One honest limitation

- "It cannot tell you whether a company sponsors **now**. Approvals have no year and are company-wide. Airbnb has 1,000 approvals and still rates only 'Possible'. The fix is dated DOL LCA data, the open `[TODO: DATA SOURCE]`."
- Close: "Status is RUNNABLE-LIVE. I cleared every gate myself on 2026-10-21: I checked the four legal names, opened all 18 links and confirmed my timeline. Then I re-ran it live: Apply 8, Consider 10, Skip 1. Not VERIFIED, and three long-open postings are still a question only a recruiter can answer."
