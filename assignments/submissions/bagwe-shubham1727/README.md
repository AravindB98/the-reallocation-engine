# Mode Build submission — Shubham Bagwe (bagwe-shubham1727)

## Executive summary

**What this is.** The submission for *The Reallocation Engine — Mode Build Assignment*: a working mode for an unemployed new-grad software engineer on F-1 OPT, run for real against today's job boards.

**Why read it.** This page tells you where each required part lives and in what order to read them.

**What it found.** The mode ran live on 2026-10-21 against 20 company job boards (1,300 postings). It caught a posting the engine had filed under the wrong company. It showed that, with 30 unemployment days left, every new-grad posting starts too late. And it found that the engine's scorer says "Apply" on sponsorship history alone. It is honestly marked DRAFT.

## Reading order

| # | Part the assignment asks for | File |
|---|---|---|
| 1 | Mode file (primary deliverable) | `recipes/cases/2026fa/bagwe-shubham1727-swe-opt-clock-live-15-1252.md` (+ human card `.card.md`) |
| 2 | Domain justification (≤ 1 page) | `DOMAIN-JUSTIFICATION.md` |
| 3 | Worked run: inputs, commands, pasted output, verified vs. inferred, verification, reflection, attestation | `WORKED-RUN.md` (generated from `WORKED-RUN.src.md` by `build-worked-run.mjs`, which pastes the recorded transcripts verbatim) |
| 4 | RUN_LOG entry | `RUN_LOG-ENTRY.md` (= `logs/runs/2026fa-bagwe-shubham1727-2.md`; CI forbids student edits to `logs/RUN_LOG.md`) |
| 5 | Scripts and sample data | `scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/` (`capture.mjs`, `evaluate.mjs`, `live-lib.mjs`, `cli.mjs`, tests, fixtures) |
| — | In-class show & tell | `PRESENTATION-NOTES.md` |
| — | Raw evidence | `runs/2026-10-21/`: `terminal/` (every command, verbatim), `capture/`, three `evaluate-*` runs, `break/`, `discovery/`, `verify-run.sh` |

## Run record

- **Lifecycle claimed:** DRAFT. The live run completed with every machine gate passing, and a named human cleared the board-ownership gate. It stays DRAFT because 8 typed TODOs are open and the per-job sign-off (G5) is unsigned.
- **Personal data:** none. The student is the fictional persona in `search/examples/neel-kapoor/` plus a fictional what-if copy, and every board is public. The only real name in the tree is Shubham Bagwe, as the person who cleared gate G1a.
- **Builds on:** the 25-point sample-mode recipe `swe-opt-clock` (same branch history), whose library is imported unchanged.
- **How it was built:** with Claude Code (an AI agent) working for Shubham Bagwe. Shubham made the scope and gate decisions. The fit ratings in the what-if run are the AI's, and they are labeled `model-judgment`. The attestation in `WORKED-RUN.md` is prepared but **not yet signed** by Shubham.

```bash
# reproduce (from the repo root)
npm install && npx playwright install chromium
node --test scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/test/live.test.mjs
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/evaluate.mjs --capture assignments/submissions/bagwe-shubham1727/runs/2026-10-21/capture/capture.json --as-of 2026-10-21
node scripts/contrib/2026fa/bagwe-shubham1727-swe-opt-clock-live/capture.mjs   # live: today's boards, will differ
```

The committed capture is dated 2026-10-21. `evaluate.mjs` refuses it after 2026-10-24, the 3-day freshness gate, unless you pass `--as-of` within that window. That is the mode working: re-capture to evaluate today.
