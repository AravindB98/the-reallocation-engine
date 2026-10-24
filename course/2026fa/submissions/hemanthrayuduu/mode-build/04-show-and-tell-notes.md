# Five-minute show and tell: notes

## Executive summary

An outline for the in-class five minutes, with no slides: just the mode file, a report, and the terminal. It follows the four things the assignment asks for, with one thing to show for each. These are notes, not a script to read aloud.

## The five minutes

1. **The situation (45 seconds).** An international student on F-1 OPT, targeting AI and data engineering roles, who needs H-1B sponsorship and already has a shortlist. The problem isn't finding postings; it's that the list goes stale without showing it. Show the recipe's executive summary.
2. **The asymmetry (60 seconds).** The employer knows three things the student can't see:
   - whether the role is still open;
   - whether its sponsorship record covers *this kind* of role (here, all 8 AI / data postings are capped at "Possible", because the sponsored titles are other families);
   - whether the OPT clock still allows the hiring timeline.

   Show the line from 2026-10-19: 8 of 8 live at 01:57, **one closed by 15:35**, caught by both checks (`evidence/09`, `10`).
3. **A real run (90 seconds).** In class, run the tool offline. It takes a few seconds and replays the raw outputs of my 15:28 live run on 2026-10-21:
   `python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --snapshot course/2026fa/submissions/hemanthrayuduu/mode-build/runs/2026-10-21-live-owner-v012/raw --out-dir /tmp/demo`

   Open `/tmp/demo/refresh-report.md` and point at:
   - the queue table;
   - "Closed since the shortlist";
   - the clock line: factor 0.7, and 1.0 at 35 days.

   If the room's network allows, also run `npm run ats:liveness -- https://job-boards.greenhouse.io/verkada/jobs/5195995007` to show the closure live.
4. **One thing I learned (60 seconds).** A single liveness check can't be trusted: the engine's page checker called the professor's made-up Figma job id `uncertain`, and a made-up Verkada id `expired`. The job board's own record (a 404 for both) is what made the gate trustworthy. Also, an independent review found that my privacy guard trusted a folder's location instead of git. That became a test and v0.1.2. Show `evidence/20` (a) and (e).
5. **One honest limitation (45 seconds).**
   - It can't see a ghost posting, where the role was filled but the page and the board entry both stay up.
   - The clock is only as current as the unemployment-day count the person gives it: the mode doesn't add days between runs.

   Both are in "cannot verify", and both are typed in the v0.2.0 backlog.

## If asked

- **Why RUNNABLE-LIVE and not VERIFIED?** The owner ran it live and cleared every gate, but one live run of 8 postings is too thin for a verdict, so `attestation` stays null.
- **Why a fictional persona?** The repository's data contract allows only fictional personas in committed files. A real profile can run only with its output under `private/`, which the tool enforces by checking git.
- **Why two liveness checks?** For postings that didn't exist, the page checker alone gave `uncertain` or `expired` depending on the board. The board API is a second, independent record, and disagreement goes to a human, not to the scorer. On the real postings the two always agreed.
- **Why is everything Skip?** For the scorer, the clock factor of 0.7 pulls the best match (0.279) under the 0.20 floor. That floor is itself an unpinned placeholder in the engine, and the roles also ask more experience than the persona has (a judgment). Skip is a successful outcome here.
