---
owner: AdityaHasija37
term: 2026fa
component: msis-pm-network-targets
status: DRAFT
promoted_to: null
---

# msis-pm-network-targets — prototype

## Executive summary

This small program helps an international master's student on STEM OPT decide where to
spend job-search hours when targeting product roles (Product Manager, Product Analyst)
that ask for 1–5 years of experience. It starts from companies whose own visa records
show they have sponsored product titles, reads the job boards a person has confirmed
belong to those companies, and sorts each company into **apply**, **network now**,
**needs a person**, or **skip**. Open postings are scored by the repository's existing
scorer. It guesses nothing: a board that cannot be read is reported as unreadable, never
as "no openings".

Recipe: `recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.md` (agent) and
`.card.md` (person).

## Run it (one command, from the repo root)

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

This is the sample run: the real 80 Days CSV, the human-confirmed boards in
`fixtures/boards.sample.json`, the fictional persona in `fixtures/persona.fixture.json`,
and board responses saved on the sample date (no network). Outputs go to `out/` in this
folder.

Live board read (network, Greenhouse / Lever / Ashby API hosts only), saving trimmed
responses for replay:

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --save-responses scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

## Test it (offline, no network)

```bash
node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.test.mjs
```

On Node 22, `node --test <folder>` does not work; name the test file.

## Options

| Flag | Default | Meaning |
|---|---|---|
| `--persona` | `fixtures/persona.fixture.json` | fictional persona; needs `opt_end_date` (YYYY-MM-DD) |
| `--boards` | `fixtures/boards.sample.json` | Gate A file: only `confirmed: true` boards are read |
| `--csv` | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | sponsorship + funding records |
| `--offline <dir>` | — | replay saved board responses; no network |
| `--save-responses <dir>` | — | live read, save trimmed responses (title, url, location only) |
| `--out` | `out/` in this folder | where outputs are written |
| `--run-date` | today | fixed date for reproducible runs |

Exit codes: `0` complete · `2` stopped at a gate or bad input (nothing written) · `1` crash.

## Outputs (in `--out`)

| File | For | What |
|---|---|---|
| `run-log.json` | agent | every company's route, reason, and labeled evidence; settings; cannot-verify list |
| `report.md` | person | executive summary, apply / network / needs-a-person / skipped tables, next actions |
| `roles.json` | scorer | live matching postings, every term labeled (shape of `data/examples/ch11-roles.json`) |
| `role-scores.json`, `role-scores.md` | both | written by `scripts/score/role-scorer.mjs`, unchanged |
| `candidates.json` | agent | the CSV candidates before board routing |

## Files

| File | Role |
|---|---|
| `rules.mjs` | the decision rules (title, location, tier, timeline gate, missing-gate refusal), no I/O |
| `network-targets.mjs` | CLI: reads data, calls `scripts/ats/providers/*.mjs`, runs the scorer, writes outputs |
| `network-targets.test.mjs` | offline tests |
| `fixtures/companies.fixture.csv` | 7 real CSV rows, contact and people columns removed (tests) |
| `fixtures/test-responses/` | hand-made board responses (tests) |
| `fixtures/boards.test.json`, `persona*.test.json` | test inputs (fictional) |
| `fixtures/boards.proposed.json` | Gate A worksheet: automatic proposals, unconfirmed |
| `fixtures/boards.sample.json` | Gate A result: boards a person confirmed |
| `fixtures/sample-responses/` | board responses saved on the sample date (trimmed) |
