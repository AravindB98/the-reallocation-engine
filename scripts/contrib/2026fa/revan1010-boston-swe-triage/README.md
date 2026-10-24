---
owner: revan1010
term: 2026fa
component: boston-swe-triage
status: DRAFT
promoted_to: null
---

# revan1010-boston-swe-triage

## Executive summary

These are the tools behind the "MSIS → Software Engineer, Boston, F-1 OPT" recipe. They short-list Boston-area employers with record evidence of sponsoring non-senior software engineers. They compute the student's visa-lottery chances as a hard gate, and they refuse any role whose posting liveness or fit input is missing, before handing the rest to the engine's own scorer. All steps are deterministic; none call a model; only the repo's own fetch and liveness scripts touch the network.

## Files

| File | What it does |
|---|---|
| `lib.mjs` | CSV parser, title classifier, sponsorship tiers, OPT/STEM timeline (all declared rules in `RULES`) |
| `sponsor-triage.mjs` | 80 Days CSV → `triage.json` (agent log) + `triage.md` (human report); exit 2 on any conformance halt |
| `build-roles.mjs` | triage + candidates + `ats:liveness` stdout + fit → scorer `roles.json`, with refusals |
| `run-mode.sh` | steps 1–5 in one pass |
| `profile.example.json` | the student's planning timeline (no personal contact data) |
| `scorer-profile.json` | `{authorization}` for the engine scorer |
| `triage.test.mjs` | `node --test` — 10 tests, 5 of them deliberate break attempts |
| `fixtures/` | synthetic `FIXTURE * INC` rows + `BROKEN-*` inputs |

## Test

```bash
node --test scripts/contrib/2026fa/revan1010-boston-swe-triage/triage.test.mjs
```

The engine scorer is exercised only through its CLI (`scripts/score/role-scorer.mjs`), never re-implemented.
