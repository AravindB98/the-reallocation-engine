# RUN_LOG entry — salary floor sample run

## Executive summary

This is the run-log entry for the first real run of the salary-floor mode. It is included in the submission rather than appended to the shared run log, because the course's automated check blocks student edits to that file (the assignment allows "or include it in your submission"). The same entry is also filed in the repository's per-student run-log folder. The run worked on eleven employers; four had no usable salary record and two job titles were flagged for a lower job code.

## Entry

### 2026-10-16 — arundhatik26-salary-floor-swe-15-1252 v0.1.0 — sample run
- **By:** Arundhati Kandelkar (student), with Claude Code (AI assistant)
- **Inputs:** `scripts/contrib/2026fa/arundhatik26-salary-floor/inputs/sample-targets.json` (11 employers; persona fictional); floor = `A_PCT25` (student choice)
- **Sources:** OEWS national xlsx sha256 `a9bad309…761f11`; 80 Days CSV sha256 `eccdee2a…6270`
- **Commands:** verify ✓ (with `PATH="/usr/bin:$PATH"`; Homebrew Python 3.15 lacks PyYAML) · doctor ✓ · tests 13/13 · `salary_floor.py` exit 0 · `ats:liveness` 2 active / 1 uncertain · `bls:local-wage` Boston → stopped: missing `.venv`; `data/bls/local-wage/` never committed
- **Outputs:** `course/2026fa/submissions/arundhatik26/mode-salary-floor/runs/sample/run-log.json`, `report.md`
- **Result:** matched 7 · blank 2 (FMR LLC, ALPHABET INC) · not-in-dataset 2 (State Street, JPMorgan Chase) · ambiguous 0 · code-risk flags 2 (Klaviyo "Front End Engineer", Robinhood "Back End Engineer": floor $103,050 → $63,140 if filed 15-1254)
- **Gates:** G1 near-misses listed (State Street → hotel LP, not used; Toast → 3 unrelated names; Google → Alphabet Energy, Alphabeta; none used) — **cleared by student 2026-10-16**: all decoys, checked online with Claude's search · G2 pending (no real offer) · G3 not applicable to a sample run · G4 `ats:liveness`: Robinhood 8008723 active, Chime 8594959002 active, fake id uncertain (treated as closed)
- **Break attempts:** `want_local_metro: true` → exit 2, nothing written · SOC 15-2051 → exit 2
- **Coverage check:** 19 large finance/tech targets not in the dataset (incl. Goldman, Morgan Stanley, BlackRock, Apple, Amazon); Google, Meta, Fidelity rows blank
- **Open issues:** near-miss check misses shorter names (`CHIME INC` not listed for `CHIME FINANCIAL INC`); 5 TODOs (Boston wages, OFLC prevailing wage, LCA per-SOC wages, O*NET title lookup, G2 sign-off); `scripts/bls/README.md` says local-wage inputs are committed but `git log --all -- data/bls/local-wage` is empty (conflict to log upstream)
