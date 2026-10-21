---
owner: shreyashyadav1
term: 2026fa
component: healthins-ai-opt
status: DRAFT
promoted_to: null
---

# healthins-ai-opt — v0.2.0

## Executive summary

This is a small program for an international master's student who wants an applied-AI engineering job at an insurance or health company and will be on OPT. It reads the real job boards of the companies the student names, drops what cannot work (a company the visa-petition records cannot identify, a senior title, a job abroad, a posting that asks for a citizen, a clearance or too many years, a posting that is already closed), checks the rest against public visa-petition and funding records, and checks that hiring can finish before the student's allowed unemployment days run out. What survives goes to the repository's existing scorer, which says apply, talk to someone first, or skip. Anything it cannot check is held for the person, never guessed. One step needs the network and a browser; the decision step is offline and reproducible. It calls no model.

## Run it (from the repo root)

Step 1, the only step of the mode that touches the network (public board APIs and a headless browser):

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs
```

It writes the reduced snapshot to `assignments/submissions/shreyashyadav1/runs/<date>/candidates.snapshot.json` and the raw snapshot (with posting text) to `private/real-postings/`, which is gitignored and never committed.

Step 2, offline, from a saved snapshot:

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 \
  --candidates assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json \
  --out-dir assignments/submissions/shreyashyadav1/runs/2026-10-20
```

The v0.1.0 sample scenarios still run (hypothetical postings, hand-typed liveness; no ingest). Scenario 1 gives the same nine decisions as the committed v0.1.0 run; scenario 2 now returns BLOCKED for all seven roles, because its hand-typed liveness dates (2026-10-02) are 141 days older than its `--today 2027-02-20`: v0.2.0 refuses stale liveness evidence (`tools/regression-v01.mjs` shows both):

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
```

## Test it (offline, 45 tests)

```bash
node --test "scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/*.test.mjs"
node scripts/conformance.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/
```

The pipeline tests run the real `runIngest` (fake boards, fake posting text, fake browser) into the real `run.mjs` and the real `scripts/score/role-scorer.mjs` CLI. There is no copy of the scorer here. `test/liveness-properties.test.mjs` also runs the property suite against `test/fixtures/BROKEN-liveness-gate.mjs`, which must fail it.

## Files

| File | What it is |
|---|---|
| `ingest.mjs` | The only networked script. Fetches boards through the repo's provider layer, applies the cheap offline gates, reads and screens posting text, then runs the repo's liveness checker on the survivors, one page at a time |
| `jd-screen.mjs` | Pure phrase screen on posting text: citizenship, clearance, U.S.-person (excluded); years asked, "unable to sponsor", E-Verify mention, new-grad invitation (shown) |
| `run.mjs` | Offline: sibling and corroboration checks, liveness freshness, timeline gate, hand-off to the unmodified scorer, fit floor, `run-log.json` and `report.md` |
| `lib.mjs` | Pure functions and the author's rules (title, level, location, fit, tier, timeline, break-even) |
| `inputs/persona.example.json` | Fictional persona (every value your-input), `persona.after-ead.example.json` for the v0.1.0 second scenario |
| `inputs/portals.healthins.yml` | The 32 boards, each with the person's claim of which legal entity runs it, a size bucket and sometimes a note (the author's own: outside knowledge is hedged). The header says how the boards were found and what that does not show. Same shape as `data/ats/portals.example.yml`, so `npm run ats:scan -- --dry-run` reads it |
| `inputs/candidates.example.json` | v0.1.0's hypothetical postings (kept so the sample scenarios still run) |
| `tools/` | Verification and discovery tools: `recount.py`, `diff-runs.mjs`, `screen-all.mjs` (networked), `sweep.mjs`, `break-dead-url.mjs`, `inspect.mjs`, `export-sponsors.mjs`, `sector-gap.mjs`, `regression-v01.mjs`, `clean-checkout.sh`, `discover-boards.mjs` (the board probe; networked, run by hand), `board-coverage.mjs` (which boards the probe found), `sync-notes.mjs` (snapshot-versus-portals check), and the inputs of the deliberate breaks |
| `test/` | 45 offline tests and fixtures; `BROKEN-*` mutants live in `test/fixtures/` |

## Inputs and labels

| Input | Path | Label |
|---|---|---|
| H-1B record, industry, website, funding stage and date | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Form D filings (50 companies per quarter) | `data/sec/form-d/processed/sample/*.sample.json` | record |
| National OEWS median for the target SOC (context only) | `data/bls/compact/soc_occupation_compact.csv` | record |
| Open offers (title, URL, location) and posting text | public Greenhouse, Lever and Ashby board APIs | record |
| Posting still open | `scripts/ats/liveness-browser.mjs` | record, only when `method` names this checker |
| Which entity runs each board; size bucket | `inputs/portals.healthins.yml` | your-input |
| OPT dates, unemployment days, buffer, exclusions, fit floor, process days per bucket | `inputs/persona.example.json` | your-input |
| Title rule, tier thresholds, fit rule, timeline formula | `lib.mjs` | your-input (author's rule) |

Nothing is labeled `model-judgment` because no model is called.

## Outputs

- `candidates.snapshot.json`: reduced ingest result (no posting text)
- `roles.json`: what `run.mjs` hands to the scorer
- `role-scores.json`, `role-scores.md`: written by `role-scorer.mjs`, unchanged (a second pass carries the fit-floor `override` when one applies)
- `run-log.json`: agent log, every value with its label and source
- `report.md`: person report

`run.mjs` and `ingest.mjs` refuse an output path inside the repo that is outside this contribution's namespaces (`output/`, the repo's gitignored scratch folder, is allowed); `ingest.mjs` refuses a raw-postings path that is not under `private/`.

## Named failure cases and what happens

| Case | Behaviour |
|---|---|
| Board fails to load | Recorded as failed with the error; never counted as "0 jobs" (the repo scanner prints the same error) |
| Company not in the CSV, or two rows share the name | Board stopped: `entity-not-found` or `entity-ambiguous`; never fuzzy-matched |
| Another CSV row with the same website holds approvals | Board stopped: `entity-sibling-has-approvals` |
| Title is senior, staff, principal, lead, manager…; location outside the U.S. | `Excluded`, with the stage |
| Posting states a citizenship, clearance or U.S.-person requirement; asks for more years than the persona has | `Excluded`, with the quote |
| Posting text cannot be read | `BLOCKED: posting-text-missing` |
| Liveness unchecked, undated, older than the limit, dated after `--today`, or `uncertain` | `BLOCKED`, never a factor |
| Page closed | liveness 0, scorer Skip (gated) |
| Hiring finishes past the unemployment ceiling or authorization end | timeline 0, scorer Skip (gated) |
| Scorer says Apply on sponsorship alone but fit is below the persona's floor | held at Consider through the scorer's `override`; both answers shown |
| Authorization end already past, or EAD date missing, or the CSV or the Form D sample directory missing | exit 2, `run-log.json` with `status: failed`, no scores |
| BLS file missing | the run continues (the median feeds no score); the log and report say `missing` |
| Funding data older than the recency window | every funding label becomes `unknown-beyond-horizon` |

## Privacy

Persona only (fictional, `@example.com`). Raw scraped postings and their text stay in `private/real-postings/` (gitignored). The committed snapshot and reports carry the titles, URLs and locations of the 114 software-type listings at identifiable companies, and short quoted phrases from about ten postings. They are the same kind of file as the maintainer's committed Figma board report and carry no personal data.
