# SUBMISSION — Mode Build

## Executive summary

This is the cover sheet for my Reallocation Engine Mode Build submission. It is the
100-point successor to my Recipe Design PR #26.

The mode helps an international software-engineering student on F-1, months before OPT,
decide which H-1B-sponsoring employers in MA/NY to apply to now, and which to network
into first.

It now **runs on live data**:
- real job boards;
- a real browser check of every posting;
- Department of Labor wage filings coded to software developers;
- E-Verify lookups.

It honestly reaches **RUNNABLE-LIVE**: all three earlier TODOs are closed, and I cleared
the human gates myself.

- **Student:** Lavanya Rajesh · GitHub `LavanyaRajesh24`
- **Domain:** MS Software Engineering (Boston), Dec 2026, F-1, OPT from 2027-01-15, needs
  H-1B; entry-level backend SWE, SOC 15-1252, MA/NY.
- **Branch:** `mode/lavanyarajesh24-network-targets-swe` (supersedes
  `contrib/2026fa-lavanyarajesh24-network-targets-swe` / PR #26).
- **Lifecycle stage claimed:** RUNNABLE-LIVE (v0.2.0). Not VERIFIED: no attestation is
  bound in the recipe frontmatter.

## Where everything is

| Deliverable | Path |
|---|---|
| Mode file (agent) | `recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.md` |
| Mode card (human) | `recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.card.md` |
| Domain justification | `course/2026fa/submissions/lavanyarajesh24/mode-build/domain-justification.md` |
| Worked run + attestation | `course/2026fa/submissions/lavanyarajesh24/mode-build/worked-run.md` |
| Run log entry | `logs/runs/2026fa-lavanyarajesh24-2.md` (contrib rule: never edit `logs/RUN_LOG.md`) |
| Live run outputs | `course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/` |
| Scripts, tests, inputs | `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/` |

The assignment names `recipes/` and `assignments/submissions/<name>/`. The upstream
contrib gate allows only `recipes/cases/`, `course/<term>/submissions/`, `logs/runs/` and
`scripts/contrib/` for student PRs, so I used those, as in PR #26.

## Run it

```bash
node --test scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.test.mjs scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/mode-build.test.mjs
node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.mjs --out-dir /tmp/nt
```

The full live pipeline is in the recipe, under "Commands".

## Known limitations (short)

- 98 of 133 employers have no Greenhouse/Lever board the detector can find.
- MongoDB and Formlabs career pages come back "uncertain" in the browser check.
- LCA ≠ H-1B approval; the DOL join is exact-name; one release (FY2026 Q1–Q3).
- E-Verify was looked up one company at a time for the 21 recommended employers (plus
  MongoDB). Everyone else is "not looked up".
- Whether a posting can wait for a January 2027 start is the person's check (gate H1).
- `npm run pii-scan` reports one hit, in `package-lock.json`. That file is untouched and
  identical to upstream; the hit is an npm package author's email.
