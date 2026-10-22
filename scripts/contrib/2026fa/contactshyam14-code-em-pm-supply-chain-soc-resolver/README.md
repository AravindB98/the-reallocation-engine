---
owner: contactshyam14-code
term: 2026fa
component: em-pm-supply-chain-soc-resolver
status: prototype — RUNNABLE-SAMPLE (sample-run gate signed by the owner 2026-10-21); one real posting passed the liveness gate; the owner cleared Zipline's uncertain liveness by hand; the visa-timeline gate is not cleared
promoted_to: null
---

# em-pm-supply-chain-soc-resolver — which occupation code is this job?

## Executive summary

This is an offline tool for an engineering-management graduate on a twelve-month work permit who is applying only to project-manager and supply-chain jobs that ask for two years of experience or less. Those postings never say which government occupation code the employer would use for a visa filing, and the code changes the official wage floor, the role-quality score, and which of the employer's past filings matter. The tool lists the plausible codes, pulls the public wage records for each, and refuses to give a single answer when the codes disagree too much — it says to ask the recruiter instead.

On the first run (2026-10-21) it refused one real posting as ambiguous (an Inventory Planner in Dallas–Fort Worth, where one plausible code is a clerical one paying about $23,000 less) and stopped the other real posting because the repository's own posting check could not confirm it was live. Nothing is ranked yet: the work-permit card dates have not been entered, and that is a human step.

## Run it (from the repository root)

```bash
node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --liveness-log scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-1-assoc-pm-sc-seattle.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/latest
```

Add `--posting` once per posting. Real postings are built first from a fetched raw file with `tools/posting-from-raw.mjs` (see the recipe); the raw files live in `inputs/raw/`, which is excluded from git. The metro band step runs the unmodified `scripts/bls/local-wage-adjustment.py`; it needs the repo `.venv` with pandas (`--python` picks the interpreter; `--local-wage skip` runs without it and marks every metro band "not checked").

## Test it (offline, fictional fixtures only)

```bash
node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
```

43 tests. One of them runs the real local-wage script on a fictional suppressed cell and skips itself when the script or `.venv` is absent (for example in the unzipped submission).

## Files

| Path | What | Label |
|---|---|---|
| `soc-resolver.mjs` | the mode's script (gates, candidate SOCs, evidence, spread check, JSON log + Markdown report) | — |
| `soc-resolver.test.mjs` | offline `node --test` suite | — |
| `rules/resolver-rules.json` | keyword tables for scope / experience / degree / SOC candidates; spread thresholds | model-judgment (rules), your-input (thresholds) |
| `inputs/persona.em-pm-supply-chain.json` | target metros, max required years (2), OPT/EAD/STEM inputs (EAD dates deliberately null) | your-input |
| `inputs/postings/samples/*.json` | 4 sample postings + 3 break tests, fictional employers | your-input |
| `inputs/postings/real/*.meta.json` | place → metro mapping, employer aliases, job-board claims for the two real postings | your-input |
| `inputs/liveness/*.txt` | saved stdout of `npm run ats:liveness` (2026-10-21) | record |
| `inputs/portals.em-pm-supply-chain.yml` | config for `npm run ats:scan -- --dry-run` on Zipline's Greenhouse board | your-input |
| `data/*.csv` + `data/PROVENANCE.md` | BLS OEWS metro/national and BEA RPP rows trimmed for this mode, with URLs, sizes and SHA-256 | record |
| `tools/trim_local_wage.py` | stdlib-only trimmer that produced `data/` (run with `python -I`) | — |
| `tools/posting-from-raw.mjs` | turns a fetched Greenhouse JSON / SuccessFactors page + meta into a posting file | — |
| `fixtures/` | fictional CSV/JSON/log fixtures for the tests | fictional |

Recipe: `recipes/cases/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver.md` (agent) and `.card.md` (human). Submission: `course/2026fa/submissions/contactshyam14-code/`.
