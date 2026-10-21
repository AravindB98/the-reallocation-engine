# FRICTIONAL — wage-level-floor build

## Executive summary

A dated list of what got in the way while building and running this mode, and what was done about each item. Read it to judge how much of the result depends on workarounds. Nothing here changed a number in the final run. Two items (the wage tool's missing inputs and the liveness checker's `uncertain` results) are open defects that belong to the repository, not to this mode.

| When (2026-10-18) | What happened | What was done |
|---|---|---|
| setup | `npm run bls:local-wage` crashed: `ModuleNotFoundError: No module named 'pandas'`. After that, its inputs under `data/bls/local-wage/` turned out to be absent from git on every branch, though its recipe says "already ingested" | not fixed; logged as a repository defect and proposed addition 7. This mode uses the DOL table instead, which is the right source for the H-1B question anyway |
| setup | zsh doesn't set `PIPESTATUS`, so the first captured checks printed `[exit ]` | all transcripts regenerated under `bash` (`runs/rerun.sh`) with real exit codes |
| research | the Federal Register text file was undecodable for `grep` (`file` said `data`: 4 NUL bytes in an HTML wrapper) | decoded with Python; rule text and the DHS projection read from the primary source (90 FR 60864 / 60948), not from law-firm summaries |
| reconnaissance | a scratch probe reported "URI malformed" for Klaviyo, Cohere Health and AcuityMD | the probe's bug (`decodeURIComponent` on HTML); the shipped ingest decodes entities and all three boards answer |
| run | `ats:liveness` returned `uncertain` for Formlabs and Tulip, at both the employer's page and the Greenhouse URL | left to a person: on 2026-10-21 Mayank opened all 5 `uncertain` postings and found an apply button on each (G6 cleared); proposed addition 5 (`listed-in-ats` state) |
| run | "Remote" mapped to Boston whatever else the location named | fixed in `lib.mjs` / `wage-level.mjs` with regression tests (see the worked run, "Broke during testing, fixed") |
| submission | the brief says to append to `logs/RUN_LOG.md` and put work under `recipes/` + `assignments/submissions/`; the repo's header and CI forbid editing `RUN_LOG.md`, and `recipes/cases/README.md` reserves top-level `recipes/` for maintainer promotion | followed the repo: `logs/runs/2026fa-mayank-1024-2.md`, `recipes/cases/2026fa/`, `course/2026fa/submissions/mayank-1024/mode-build/` (the same namespaces as the previous assignment) |
