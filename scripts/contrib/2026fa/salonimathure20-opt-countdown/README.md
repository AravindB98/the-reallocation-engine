---
owner: salonimathure20
term: 2026fa
component: opt-countdown
status: DRAFT
promoted_to: null
---

# opt-countdown — prototype

## Summary

This small program checks job postings for an international student on F-1 OPT. For each posting it asks whether the employer has a record of H-1B approvals, whether the posting is still real, and whether the employer can hire before the student's OPT unemployment clock runs out. It turns that evidence into labeled inputs for the engine's existing scorer and writes two outputs: a machine log and a plain report. A posting with missing evidence is *blocked* for a person to check, never scored on a guess.

Recipe: `recipes/cases/2026fa/salonimathure20-opt-countdown.md` (and `.card.md`).

## Run it (one command, from the repo root)

```bash
node scripts/contrib/2026fa/salonimathure20-opt-countdown/opt-countdown.mjs
```

Needs Node 20+. No npm dependencies beyond the repo's own; no network. It reads:

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sponsorship, funding)
- `data/bls/compact/soc_occupation_compact.csv` (wage and pivot context)
- `fixtures/worked-run/` (fictional persona, 8 real postings, saved liveness + Greenhouse API output from 2026-10-03)

It writes to `course/2026fa/submissions/salonimathure20/runs/opt-countdown/`:
`opt-countdown-log.json` (agent), `opt-countdown-report.md` (human), plus the scorer's own `roles.json`, `scorer-profile.json`, `role-scores.json`, `role-scores.md`.

Override any input: `--persona --candidates --liveness --greenhouse-api --sponsors-csv --soc-csv --out-dir`.

Exit codes: `0` complete · `2` bad input (unlabeled value, missing field, unparseable file) · `3` halted at the runway gate (OPT end date past or unemployment clock exhausted).

## Test it (offline)

```bash
node --test scripts/contrib/2026fa/salonimathure20-opt-countdown/
```

12 tests: CSV parsing, sponsorship mapping, blank-record and missing-company handling, runway/timeline arithmetic, the Greenhouse-404-beats-browser-checker rule, and three end-to-end runs. The end-to-end runs check that the real scorer produced the output, that blocked roles never reach it, that a past OPT date halts with exit 3 and writes no `roles.json`, and that an unlabeled value is rejected. Fixtures in `fixtures/test/` are trimmed copies of real CSV rows, with no phone or officer columns.

## Refresh liveness for your own list (network; done by hand)

```bash
npm run ats:liveness -- --file my-urls.txt > my-liveness.txt 2>&1
curl -s -o /dev/null -w "%{http_code} <board>/<job_id>\n" https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<job_id> >> my-greenhouse-api.txt
```

## Files

| File | What |
|---|---|
| `opt-countdown.mjs` | CLI: gates G0–G3, builds `roles.json`, calls `scripts/score/role-scorer.mjs`, writes log + report |
| `lib.mjs` | pure functions: CSV parse, sponsorship mapping, runway, timeline factor, liveness parsing and gate |
| `opt-countdown.test.mjs` | offline tests (`node --test`) |
| `fixtures/worked-run/` | persona, candidates, `urls.txt`, saved `liveness.txt`, `greenhouse-api.txt` |
| `fixtures/test/` | test persona, candidates, liveness, API, trimmed CSVs |

The scorer is **not** re-implemented here. The prototype shells out to `scripts/score/role-scorer.mjs` and reads its `role-scores.json`.
