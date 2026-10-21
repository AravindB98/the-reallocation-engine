# RUN_LOG entry

## Executive summary

This is the log entry for the weekly apply-queue refresh mode's runs, in the format the engine's run log uses (it would be appended to `logs/RUN_LOG.md`). It says what was run, on what, what came out, and what is still open.

Students can't edit `logs/RUN_LOG.md`, because CI protects it. So the full, dated log lives in `logs/runs/2026fa-hemanthrayuduu-2.md`, and this file is the condensed entry the assignment asks for.

**Result:** the mode is **RUNNABLE-LIVE** at v0.1.2. The owner ran it live and cleared all three gates; VERIFIED isn't claimed.

## Entry

```markdown
## 2026-10-21, hemanthrayuduu-ai-data-opt-apply-queue-refresh v0.1.2 (live run, gates G1–G3 cleared)
- Inputs: 8 public postings (the 2026-10-03 Consider list of a sponsorship-pipeline run); fictional persona Priya Nair (search/examples/priya-nair: F-1 post-completion OPT, 34/90 unemployment days, buffer 20); rules.json confirmed by Hemanth Rayudu (time-to-start 42 days; live only if the page check and the board API agree); week-0 baseline = the 2026-10-03 page-check output. No private data.
- Engine commands, on a fresh clone at v0.1.2 (5e999d1), untrimmed in evidence/18:
  - npm run verify (exit 0); conformance on this submission's paths (exit 0);
  - npm run doctor (exit 0; with this recipe copied top-level: 34 recipes, 318 = 318, so 0 declared = 0 markers here);
  - npm run ats:liveness (live posting active; the real closure expired; a made-up Figma id uncertain; a made-up Verkada id expired);
  - npm run bls:local-wage (could not run: missing .venv; data/bls/local-wage/ never committed);
  - npm run score:gates (RESULT: PASS).
- New script: scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py — 47 offline tests pass on the fresh clone; the documented offline command exits 0 with the network forbidden.
- Live runs on the 8-posting queue:
  - 2026-10-19 01:57 (recorded the sample; 8/8 live by both checks);
  - 2026-10-19 15:35 (Verkada "Software Engineer – Computer Vision" closed: page → ?error=true, API 404; gated to 0; cross-checked with curl, 404 vs a 200 control);
  - 2026-10-21 01:12 and 15:28, both run by the owner (7 live · 1 closed · 0 investigate; timeline 0.7, start 2026-12-02; Skip 8; nothing changed between them).
- Outputs: course/2026fa/submissions/hemanthrayuduu/mode-build/runs/<run>/refresh-log.json (agent), refresh-report.md (human), refresh-audit.md (audit), raw/ (sha256; 0 redactions needed).
- Deliberate break attempts (v0.1.2):
  - a BROKEN liveness gate (caught before scoring; negative control shows × 1 × without the invariant);
  - the professor's made-up Figma id (uncertain + 404 → investigate, not scored);
  - a made-up Verkada id (closed, gated 0);
  - a board-API outage (8 investigate, 0 scored);
  - a persona not needing sponsorship (refused);
  - a non-example profile with a tracked output folder (refused);
  - an untracked profile inside search/examples/ (refused);
  - a --record folder outside private/ (refused).
- What-if: 35 vs 42 days flips 3 Databricks rows Skip → Consider (0.195 → 0.2786; 0.1627 → 0.2324 ×2).
- Broke and fixed:
  - v0.1.0: audit printed None;
  - v0.1.1 (first live run): "gone since baseline" mislabeled; raw dict in the run record; SOC choice hidden; wording;
  - v0.1.2 (independent review): privacy guard trusted location not git-tracking; --record unguarded; temp paths in the log; metadata-only changes unreported; offline reports didn't name the recording; closed TODO markers miscounted.
  - Each version got its own gates.
- Gates, by Hemanth Rayudu:
  - sample-run gates for v0.1.0 and v0.1.1 (2026-10-19) and v0.1.2 (2026-10-21, counts quoted from the audit);
  - live gate for v0.1.1 (2026-10-21, 01:12 run) and for v0.1.2 (2026-10-21, 15:28 run): G1 "7 live, #8 gone"; G2 "Confirmed"; G3 "None; recheck Databricks".
- Open issues:
  - VERIFIED not claimed (one live run of 8 postings);
  - the unemployment-day count doesn't accrue between runs;
  - ghost postings undetectable (no posting age);
  - one time-to-start for every company;
  - the Consider floor is an engine placeholder;
  - local wage not runnable on main.
  - These are the typed v0.2.0 backlog in 02-worked-run.md.
```

The full log, with every entry and the gate lines: `logs/runs/2026fa-hemanthrayuduu-2.md`.
