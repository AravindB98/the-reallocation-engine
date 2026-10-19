---
owner: hemanthrayuduu
term: 2026fa
component: apply-queue-refresh
status: RUNNABLE-SAMPLE  # mirrors the recipe: v0.1.1 sample-run gate cleared by the owner 2026-10-19
promoted_to: null
---

# apply-queue-refresh

## Executive summary

**What this is:** a small program that re-checks a shortlist of job postings each week, for an AI / Data Engineer on F-1 OPT who needs visa sponsorship.

**Why use it:** a shortlist goes stale without showing it. Postings close or turn into ghosts while the page still loads. Descriptions get edited ("unable to sponsor", more years required). The OPT unemployment clock keeps running. This tool re-checks all three and re-scores the list with the repository's own scorer.

**What it decides:** nothing final.
- A posting counts as live only when two independent checks agree.
- Anything uncertain is held back for a human, not scored.
- The person clears three gates before acting on any row.

## Run it (from the repo root)

```bash
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py            # offline sample run (no network)
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --dry-run  # print the plan, write nothing
python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live     # live run (page checker + board API)
```

The offline run uses the committed sample: 8 public postings (`sample/queue.sample.json`) and the raw outputs recorded on 2026-10-19 (`sample/snapshot-2026-10-19/`). It uses the fictional persona Priya Nair (`search/examples/priya-nair/`).

Output goes to `.build/runs/<date>-<mode>/` (gitignored) unless `--out-dir` is given. A folder holding files this tool did not write is refused.

Tests (offline, about 2 seconds):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh -p 'test_*.py' -v
```

Requires Python 3.9+ with PyYAML (also needed by the repo's conformance check), Node 20+, and, for `--live` only, the repo's Playwright browser.

## What it reuses (called, not copied)

| Step | Repo component | Tested? |
|---|---|---|
| Page check (gate) | `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`) | no repo tests; this tool's tests cover how it reads the output |
| Board API check (gate) + description | greenhouse-watch `fetch_board` (`.claude/skills/greenhouse-watch/`) | yes (23 tests) |
| Fit (vote) | greenhouse-watch `judge()` + `scheme.default.json`, on the persona's résumé | yes (23 tests) |
| Scoring | `scripts/score/role-scorer.mjs` (`npm run score`) | yes (`npm run score:gates`) |
| Role-quality context | `data/bls/compact/soc_occupation_compact.csv` | record |
| Sponsorship records | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |

## Files

| Path | What |
|---|---|
| `refresh.py` | the tool (Python standard library + PyYAML) |
| `rules.json` | the human value choices (time-to-start, liveness policy, timeline formula, fit scale, report fields), confirmed by Hemanth Rayudu on 2026-10-19 |
| `test_refresh.py` | 41 offline tests |
| `fixtures/` | synthetic, fictional test data, plus `BROKEN-liveness-gate.py` (a deliberately broken gate the run must refuse) |
| `sample/` | the committed sample queue and its recorded snapshot |

## Privacy

If the persona or the queue is not one of the committed fictional examples, the tool refuses any output folder outside `private/`. Your real `search/profile.yml` and résumé are read locally, and results stay untracked.
