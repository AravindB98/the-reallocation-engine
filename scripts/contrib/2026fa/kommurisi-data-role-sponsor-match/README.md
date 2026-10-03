---
owner: kommurisi
term: 2026fa
component: data-role-sponsor-match
status: DRAFT
promoted_to: null
---

# data-role-sponsor-match — prototype

Recipe: `recipes/cases/2026fa/kommurisi-data-role-sponsor-match.md` (agent) and `.card.md` (human).

Checks whether each candidate posting's company has a **recorded sponsored data-role title** in the 80 Days CSV. It applies the visa-timeline and liveness gates, runs the survivors through the **existing** scorer `scripts/score/role-scorer.mjs`, and writes a labeled JSON log plus a Markdown report.

## One command (from the repo root)

```bash
node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs
```

With no flags it reruns the committed worked run: input `fixtures/worked-run/candidates.json`, plus the liveness evidence saved beside it. It writes to `course/2026fa/submissions/kommurisi/runs/latest/`. It is **offline** and needs only Node 20+ and a repo checkout. No Python, no `npm install`.

Flags: `--input <candidates.json>`, `--out-dir <dir>` (must be under `course/2026fa/submissions/kommurisi/`, this folder's `out/`, or the OS temp dir; anything else exits 2), and `--csv`, `--bls`, `--formd-dir` (default to the shipped repo data).

## Test (offline, fixtures only)

```bash
node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.test.mjs
```

There are 10 tests. They drive the real scorer through `match.mjs` and never re-implement the composite. Expected composites are recomputed from the fixture inputs and the weights the scorer reports in `role-scores.json`.

## Network step (separate, optional)

```bash
node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs --input <candidates.json> --out <greenhouse-api.json>
```

It contacts only `boards-api.greenhouse.io`. Page-level liveness comes from the repo's own `npm run ats:liveness -- --file urls.txt`, saved to a text file.

## Files

| File | What |
|---|---|
| `lib.mjs` | pure functions: CSV parse, exact name match, title patterns, timeline gate, liveness gate |
| `match.mjs` | CLI: joins, gates, writes `roles.json`, calls the scorer, writes log + report |
| `greenhouse-check.mjs` | the only network code |
| `match.test.mjs` | offline tests |
| `fixtures/test/` | mini CSV / BLS / Form D / liveness fixtures covering every named failure case |
| `fixtures/worked-run/` | persona input + liveness evidence captured 2026-10-03 |

## Exit codes

`0` ran · `2` usage / bad input / out-dir refused · `3` blocked at the visa-timeline gate (nothing scored) · `4` scorer failed, or read the profile as not needing sponsorship.
