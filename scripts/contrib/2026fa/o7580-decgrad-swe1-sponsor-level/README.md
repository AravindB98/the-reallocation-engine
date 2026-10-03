---
owner: O7580
term: 2026fa
component: decgrad-swe1-sponsor-level
status: RUNNABLE-SAMPLE
promoted_to: null
recipe: recipes/cases/2026fa/o7580-decgrad-swe1-sponsor-level.md
---

# decgrad-swe1-sponsor-level — prototype

## Executive summary

This small program checks job postings for one kind of student: an international master's student who graduates in December, will work on OPT, and wants a junior software-engineering job in the Boston area. For each posting it answers three questions. Has this company sponsored work visas for *junior* software jobs, or only senior ones? Is the posting still open? Can hiring finish before the student's allowed OPT unemployment days run out? It reads the data files that ship with the repository, uses the repository's existing scorer to make the Apply / Consider / Skip call, and writes two files: a log for software and a report for a person. When a record is missing, it says so and leaves that posting unscored. It never fills in a guess, and it never applies to anything.

## Run it (one command, from the repo root)

```bash
node scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/triage.mjs
```

With no flags it runs the committed sample scenario (fictional persona, 11 real Boston-area postings collected 2026-10-01). It reads the saved liveness log and writes to `course/2026fa/submissions/o7580/runs/sample/`:

| File | For | What |
|---|---|---|
| `triage-log.json` | agent | every value with its label (`record` / `your-input`; `model-judgment` count is 0), missing-reason codes, scorer config and stdout |
| `triage-report.md` | person | executive summary, decision + next action per posting, labeled evidence, what was not verified |
| `roles.json`, `scorer-profile.json` | scorer input | written by this prototype in the shape of `data/examples/ch11-roles.json` |
| `role-scores.json`, `role-scores.md` | scorer output | written by the **maintained** `scripts/score/role-scorer.mjs`, unchanged |

Options: `--scenario <json>`, `--liveness-log <file>`, `--out-dir <dir>`, `--as-of YYYY-MM-DD`, `--days-used N`, `--csv <80-days csv>`, `--form-d-dir <dir>`.
Output is refused anywhere outside `course/2026fa/submissions/o7580/`, this folder, or the OS temp dir.

## Test it (offline, fixtures only)

```bash
node --test scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/test/triage.test.mjs
```

13 tests. They cover the CSV parser, exact name resolution (miss / ambiguous / state tie-break), the title-level classifier, the sponsorship tiers (blank ≠ zero), liveness parsing, every timeline closure, the Form D sample lookup, and a source check that the code has no network calls. One end-to-end test runs the real scorer on fictional fixtures. The others check that bad input exits 2 without writing anything, and that writes over tracked repo paths are refused. Conformance:

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/
```

## Refreshing liveness (network: the posting hosts only)

The prototype itself never touches the network. Liveness comes from the existing checker, run by a person and saved:

```bash
npm run ats:liveness -- --file scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.urls.txt
```

Save stdout to `scenarios/boston-decgrad.liveness.log` and add `# ran: <date>` at the top. First run on a new machine needs `npx playwright install chromium`.

## Files

| Path | What |
|---|---|
| `triage.mjs` | CLI: gates G0–G5, builds `roles.json`, calls the scorer, writes log and report |
| `lib.mjs` | pure functions; each returns a labeled value or `{ missing: <code> }` |
| `scenarios/boston-decgrad.sample.json` | sample scenario: fictional persona and real public postings (your-input) |
| `scenarios/boston-decgrad.urls.txt` | the URLs handed to `ats:liveness` |
| `scenarios/boston-decgrad.liveness.log` | verbatim `ats:liveness` output from 2026-10-01 |
| `fixtures/` | fictional CSV, liveness log, Form D sample, and scenario for the test |
| `test/triage.test.mjs` | offline `node --test` suite |

## Missing-reason codes (a posting with any of these is not scored)

`no-company-match` · `ambiguous-company-match` · `no-sponsorship-record` · `no-liveness-record` · `liveness-uncertain` · `no-fit-input` · `no-tier-mapping`

## Not done here (see the recipe for the typed TODOs)

- It reads no `private/`, `search/resume.json`, or `data/ats/` file.
- It uses no AI model. Fit is the person's own number.
- It does not change the scorer. Two scorer behaviors this prototype works around are documented in the recipe: a missing gate defaults to open, and a Proven sponsor clears Apply on its own.
