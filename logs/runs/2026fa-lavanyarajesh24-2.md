## 2026-10-21 — network-targets-swe live run 2 (Mode Build)

- **Recipe:** recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.md v0.2.0
- **Inputs:**
  - persona `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/inputs/persona.json`
    (fictional);
  - CSV `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`;
  - boards `…/inputs/boards-snapshot.json` (captured 2026-10-21T19:22:32Z);
  - liveness `…/inputs/liveness.json` (started 2026-10-21T19:23:43Z);
  - LCA `…/data/lca-15-1252.csv` (LCA_Disclosure_Data_FY2026_Q3.xlsx, sha256 f8ca8448a528,
    received 2025-09-24 … 2026-06-23);
  - E-Verify `…/inputs/everify.csv` (22 rows);
  - `--today` = system date 2026-10-21.
- **Commands:**
  1. `discover-boards.mjs`
  2. `capture-boards.mjs`
  3. `network-targets.mjs --out-dir …/runs/mode-build-live`: deliberate stale run,
     `liveness: stale`, apply 0
  4. `npm run ats:liveness -- --file …/runs/mode-build-live/posting-urls.txt`
  5. `live-check.mjs --urls …/posting-urls.txt`
  6. `extract-lca.py ~/Downloads/LCA_Disclosure_Data_FY2026_Q3.xlsx`
  7. `network-targets.mjs --out-dir …/runs/mode-build-live`
  8. `node --test network-targets.test.mjs mode-build.test.mjs`
- **Outputs:** `course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/`:
  `network-targets-log.json`, `network-targets-report.md`, `posting-urls.txt`,
  `roles.json`, `role-scores.{json,md}`.
- **Result:**
  - candidates 133 → apply 4 · network 17 · check-board 108 · skip 4;
  - postings: 9 active / 1 expired / 5 uncertain;
  - LCA matched 64/133, 50 tiers capped;
  - E-Verify: 22 looked up, 22 open;
  - scorer "scored 29 roles → Apply 7 · Consider 0 · Skip 22 (skip 76%)";
  - tests 17/17.
- **Gate decisions:**
  - G0 pass · G1 pass · G2 factor 1;
  - G4: 24 name-match, 3 confirmed by Lavanya Rajesh on 2026-10-21 (Lendbuzz, Sofar
    Sounds, Attentive), 1 not confirmed (iSee), 3 rejected (TALENT, `cmt`, and Attentive's
    automatic name check, later confirmed by hand), 7 board-not-found;
  - G3b browser, fresh;
  - H1: report read by Lavanya Rajesh on 2026-10-21; she judged that it makes sense. No outreach or application was made by the recipe.
- **Open issues:**
  - 98/133 employers have no detectable Greenhouse/Lever board.
  - MongoDB and Formlabs career pages return "uncertain" in the browser check.
  - E-Verify has no export or working scripted query, so lookups are one at a time.
  - The LCA join is exact-name only.
  - The first LCA cap (target states only) was wrong and has been fixed; see the worked
    run.
