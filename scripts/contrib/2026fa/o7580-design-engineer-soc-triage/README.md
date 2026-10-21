# o7580-design-engineer-soc-triage — prototype

## Executive summary

This folder holds the runnable part of the design-engineer SOC triage mode. Two small Node scripts read the shipped sponsorship file and occupation table, plus a saved liveness check and a scenario of postings. They sort each posting into a job family, drop the ones that only say "design", tier sponsorship on matching titles, apply the liveness and eligibility gates, and hand the rest to the engine's existing scorer. Nothing here touches the network. Network access belongs to the repository's own scan, detect and liveness scripts.

## Run record (how to run it)

```bash
# whole-file audit (counts, no scoring)
node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/title-audit.mjs --state MA

# triage the live scenario (defaults: scenarios/design-engineer.live.json + .liveness.log)
node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs

# re-run later in time
node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs --as-of 2027-03-01 --days-used 56 --out-dir <dir>

# offline tests and break attempts
node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs
bash scripts/contrib/2026fa/o7580-design-engineer-soc-triage/break-tests.sh
```

Upstream inputs (regenerate before a new live run):

```bash
REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/portals.design-engineer.all-us.yml npm run ats:scan -- --dry-run
npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-design-engineer-soc-triage/scenarios/design-engineer.urls.txt
```

| File | Role |
|---|---|
| `lib.mjs` | pure functions: CSV, exact company match, **title → family rules**, family-matched tier, SOC readout with refusals, liveness parse, eligibility + OPT clock |
| `triage.mjs` | CLI: gates G0–G5, writes `roles.json`, calls `scripts/score/role-scorer.mjs` unchanged, writes `triage-log.json` + `triage-report.md` |
| `title-audit.mjs` | whole-file audit → `design-title-audit.{json,md}` |
| `break-tests.sh` | deliberate break attempts against the real data (bash) |
| `test/triage.test.mjs` | 17 offline tests on `fixtures/` |
| `fixtures/` | fictional companies, `example.test` URLs, a 6-row BLS extract, and `BROKEN-bls-no-15-1255.csv` |
| `scenarios/` | portals files, posting URL list, saved liveness log, the live scenario (fictional persona) and its confirmed copy |

Reused from this contributor's earlier recipe (PR #37), adapted: the CSV parser, exact name normalization, the title-list parser, the liveness-log parser and the OPT-clock arithmetic. Everything about families, SOC candidates and the Cognitive Pivot readout is new.

No maintained file is changed. Recipe: `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md`.
