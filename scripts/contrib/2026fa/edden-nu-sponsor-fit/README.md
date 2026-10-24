# Sponsorship evidence triage prototype

## Executive summary

One offline command reads actual repository company data and a fictional persona, classifies synthetic page snapshots using the maintained engine code, and produces a labeled JSON log plus a readable report. It does not verify current vacancies or immigration eligibility. Stop at human review before any real application.

## Run from repository root

Requires Python 3.9+ and Node 20+. No third-party Python or npm package is needed by this prototype. The full repository checks separately need `npm install` and PyYAML (as installed in upstream CI).

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/my-first-run
```

Use a new run-directory name each time. Existing directories are rejected rather than overwritten. The output must stay under the submission namespace. Read `report.md`; inspect `run.json` for field-level evidence.

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
node scripts/conformance.mjs scripts/contrib/2026fa/edden-nu-sponsor-fit/
```

## Design

`run.py` validates fixture/schema/dates, reads CSV with Python's CSV parser, reads only the sanctioned fictional persona, invokes `liveness.mjs`, and applies ordered triage rules. The Node adapter imports the actual `classifyLiveness`; it does not copy that logic. Tests use the same production runner and actual repository data. They also mutate fixture inputs to check decisions change.

Fixture field meanings: `synthetic=true` is mandatory; dates and role policies are classroom assumptions; company names are exact CSV lookup keys. `deadline=null` is allowed as explicit unknown and blocks a decision; an absent key or malformed date is an input error. `required_skill` is a fixture requirement checked against the persona's skill lists, not a semantic CV assessment.

Output facts are objects with `value`, `source` and `evidence`. Record means observed file content or tool output, never independent validation of the original H-1B join. Model-judgment means a designed interpretation/rule, even though runtime is deterministic and makes no model calls. Your-input means synthetic scenario input.

## Scorer choice

This is an evidence triage workflow, not a reimplementation of the weighted composite scorer. It deliberately does not map aggregate historical approvals into a probability. Known closed gates produce Skip, unknown gates produce Blocked, and available evidence produces a human-review recommendation. An Apply recommendation is not gate clearance. The maintained scorer was separately run on its shipped example with explicit `--out-dir` (see the test report). Its role-quality weight is zero; no wage or cognitive claim is made here.

## Boundaries

No live network, applications, messages, fuzzy company matching, real student records, visa advice, funding joins, or generated portfolio claims. Public outputs use an existing fictional persona. Real employer identity and policies must be independently checked before practical use.
