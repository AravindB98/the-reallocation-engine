# Run log — case-game-eng-opt-studio-triage, 2026-10-17

*Filed here, not appended to `logs/RUN_LOG.md`, because `CONTRIBUTING.md` reserves the
shared run log for maintainers and routes student entries to
`logs/runs/<term>-<handle>-<n>.md`. The assignment permits either ("append a real entry
to logs/RUN_LOG.md **or include it in your submission**"); this placement satisfies both
and keeps the PR off the contrib gate's protected-path list.*

### 2026-10-17 — case-game-eng-opt-studio-triage v0.2.0 (sample mode) {#2026-10-17-game-studio-triage}
New recipe `recipes/case-game-eng-opt-studio-triage.md` (RUNNABLE-SAMPLE) + new script
`scripts/score/game-studio-triage.mjs` + term/SOC config `data/examples/game-studio-terms.json`
(v0.1.0). Domain: international master's student in game programming on an OPT clock,
triaging game studios by H-1B record, Form D recency, role-family fit and BLS cognitive-pivot
score.

- **Ran:** `npm run verify` · `npm run doctor` · `npm run score:gates` ·
  `node scripts/score/game-studio-triage.mjs --asof 2026-10-17` (and `--require-role-family`,
  `--naive-substring`, `--emit-roles` with and without `--liveness`) ·
  `npm run score -- <roles.json> --profile <profile.json>` (×3) ·
  `npm run ats:scan -- --dry-run` · `npm run ats:liveness -- <greenhouse url>`.
  Verbatim transcript: `assignments/submissions/weiting/run-2026-10-17/terminal-transcript-2026-10-17.txt`.
- **Inputs:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
  (30,369 rows) · `data/bls/compact/soc_occupation_compact.csv` (1,016 occupations, OEWS 2024) ·
  `data/examples/game-studio-terms.json` v0.1.0 · asof 2026-10-17 · filters min-approvals 1,
  then role-family required.
- **Outputs:** `logs/game-studio-triage-2026-10-17-wordboundary.json`,
  `logs/game-studio-triage-2026-10-17.md`, and under
  `assignments/submissions/weiting/run-2026-10-17/`: the role-family run (JSON + report),
  `roles-hand-assembled.json`, `role-scores.json`, `role-scores-2026-10-17.md`,
  `liveness-2026-10-17.json`, the two profile files, the profile-bug probe, and the transcript.
- **Result:** 30,369 scanned → **24 industry labels, 0 game-related** → 266 term candidates →
  **13** with any H-1B approvals value → **4** with a sponsored title in the role family → 4 kept.
  Composite **not produced for any triage candidate**: `--emit-roles` exited 3 because the
  liveness gate was unevaluated for all four. On a hand-assembled role set (provenance
  recorded per role) `npm run score` gave Apply 0 · Consider 1 · Skip 4 (skip 80%); the one
  ungated row is Absurd Ventures, which has no row in the company table at all.
- **Gates:** 1 PASS · 2 **NOT CLEARED** (no human `makes_games` decision logged; typed
  `[TODO: APPROVE]` open) · 3 PASS · 4 PASS · 5 **NOT CLEARED** (`ats:liveness` → `uncertain`;
  sandbox egress refused `job-boards.greenhouse.io`, proxy reported 403 to CONNECT) ·
  6 illustrative student input only · 7 PASS.
- **Verified vs inferred:** verified — the absent games taxonomy, all candidate counts, each
  company's approvals/denials/median-salary/funding values, the 67-month funding age for
  Manticore, That's No Moon's $71,000 = 53.4% of the 15-1252 median, the 15-1255 wage
  collision, and the absence of Insomniac/Bungie/Blizzard/Epic Games/Naughty Dog/Respawn/
  Zynga from the table. Inferred — that a term match means a company makes games, the
  18/36-month funding-recency thresholds, all `fit` values, the timeline factor, and the
  Form D explanation for the missing large studios.
- **Defects found (3):** (a) upstream `role-scorer.mjs` `applyProfile()` regex matches the
  substring `authorized`, so `authorization: "F-1 OPT, authorized to work"` sets
  `needs_sponsorship: false` and zeroes the sponsorship weight — measured: Manticore Games
  0.4845 **Apply** → 0.2167 **Consider** on that one word; (b) `weights.role_quality = 0.0`
  makes the whole Cognitive Pivot layer inert, independently confirmed by
  `npm run score:gates` → `WARN P1-role-quality-inert` (already DOMAIN.md gap 3);
  (c) no entity resolution — Peloton Interactive appears as both `INC` and `LLC` with
  identical approvals totals, unhandled by this mode.
- **Open issues:** 6 typed TODOs in the recipe — a game-employer list (DATA SOURCE), ATS
  board discovery so gate 5 can be evaluated at all (DEV), a `--weight role_quality=` flag
  (DEV), per-SOC LCA micro-records (DATA SOURCE), a profile-authorization guard (DEV), and the
  logged human confirmation gate (APPROVE). Not promoted past RUNNABLE-SAMPLE: two gates
  never cleared.
- **Privacy:** `npm run doctor` → `✓ no private/PII paths are tracked`. `data/ats/portals.yml`
  was created for the scan step; `git check-ignore -v` → `.gitignore:40:/data/ats/*`. No
  résumé, tracker, or personal application data was read or written — this mode operates on
  the employer side only.
- **Environment note:** Playwright 1.58 expected `chromium_headless_shell-1234`; this sandbox
  ships build 1194 in a different layout. Symlinked the installed shell to the expected path
  to let `ats:liveness` launch. Repo unmodified; on a normal machine `npx playwright install`
  is the fix.
