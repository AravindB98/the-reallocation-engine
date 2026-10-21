# SWE STEM-OPT Runway — mode code

## Executive summary

This folder holds the code behind the `case-swe-stem-opt-runway` mode. The mode is for an international student on STEM OPT choosing which software-engineering postings to apply to. It pulls real postings from public company job boards and keeps the ones inside a written scope, recording why it dropped each of the others. It then checks each kept posting two ways: whether the company has sponsored H-1B workers (from the repository's sponsorship file), and whether the posting is really still open (from the job board's own record, plus a page check). It hands the result to the repository's scorer. It refuses to score a posting when the open/closed signals disagree. It does **not** read job descriptions; the fit score is the student's own placeholder.

The mode file is `recipes/case-swe-stem-opt-runway.md`. This folder started as the prototype from an earlier, offline-only recipe-design submission and was extended for real data.

## Run (from the repo root)

```bash
npx playwright install chromium   # once
node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.mjs --date 2026-10-21
node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs \
  --jobs scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json \
  --out  scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json
node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.js \
  --fixture  scripts/contrib/2026fa/tisaac-swe-stem-opt/jobs-2026-10-21.json \
  --liveness scripts/contrib/2026fa/tisaac-swe-stem-opt/liveness-2026-10-21.json \
  --out-dir  <a folder you own>
```

Re-run the selection offline from the saved snapshot: add `--from-snapshot scripts/contrib/2026fa/tisaac-swe-stem-opt/postings-2026-10-21`.

## Offline tests (no network)

```bash
node scripts/contrib/2026fa/tisaac-swe-stem-opt/index.test.mjs            # 13 checks: labels, failure cases, liveness gate, holds
node scripts/contrib/2026fa/tisaac-swe-stem-opt/select-postings.test.mjs  # 21 checks: filter cases, counts, determinism, snapshot replay
```

## Files

| File | What it is |
|---|---|
| `select-postings.mjs` | board snapshot → selected postings + audit (network: boards-api.greenhouse.io) |
| `scope.json` | the student's scope rules, `csv_name` matches, defaults, break jobs (your-input) |
| `postings-2026-10-21/*.raw.json` | board snapshots, 2026-10-21 |
| `postings-2026-10-21-audit.md` | every posting: kept or dropped, and why |
| `jobs-2026-10-21.json` | selected postings (Runs 2–3) |
| `collect-liveness.mjs` | board + page liveness evidence (network) |
| `liveness-2026-10-21.json` | liveness evidence for `jobs-2026-10-21.json` |
| `index.js` | sponsorship lookup, liveness gate, holds, scorer call, `mode-run.json` + `mode-report.md` |
| `index.test.mjs`, `select-postings.test.mjs` | offline tests |
| `jobs-2026-10-21-handpicked.json`, `liveness-2026-10-21-handpicked.json` | Run 1 inputs (frozen; used by `index.test.mjs`) |
| `jobs-2026-10-21-run2.json` | Run 2 job list before the Toast name match |
| `fixture.json`, `my-roles.json`, `role-scores.*` | the earlier offline-only prototype's fixture and sample output |
