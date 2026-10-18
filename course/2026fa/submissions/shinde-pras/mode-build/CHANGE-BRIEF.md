# Change brief: PM/APM live-posting and sponsor-record gate

## Executive summary

This note opens a new piece of work: a mode that helps an international student applying for product manager and associate product manager roles decide which postings are worth their limited time, by checking two things first — whether the posting is still live, and whether the employer has a public sponsorship record. It is the successor to my earlier recipe, which checked sponsorship evidence and the visa timeline but did not check whether a posting was still open. The predictions below were written before any check was run, so they can be compared honestly against what the checks actually return.

## Recon facts

- Upstream `main` is unchanged at `015843d` since 2026-09-23.
- `npm run verify` passes once PyYAML is installed, with 3 warnings.
- Two of those warnings, for `private/` and `data/ats/`, are false positives: `.gitignore` uses `dir/*` plus exceptions, which the checker does not recognise. The third says `archive/` is not in `.gitignore`.
- `npm run doctor` passes.
- `ats:liveness` and `score` both exist as npm scripts; `ats:liveness` needs a Chromium browser.
- The role scorer is CLI-only and exports nothing.
- The 80-Days CSV has no occupation-code column, and no document states which years it covers.

## Predictions

Written 2026-10-18, before any anchor run.

- P1. Of the 3 postings, 3 will come back "active" from ats:liveness.
- P2. The mutated control URL (see step 3) will come back active.
- P3. Of the 3 companies, 3 will have an exact company_name match in the 80-Days CSV.
- P4. npm run score on data/examples/ch11-roles.json will run cleanly (exit 0).

## Scope cuts

- `ats:scan` is not used in the worked run, because it reads and writes `data/ats/`.
- [TODO: DEV] A company-name alias table is a proposal, not built.
- [TODO: DEV] An E-Verify participation check is a proposal, not built.
- Target lifecycle status: RUNNABLE-SAMPLE.

## Anchor results (added after the runs)

Postings 1, 2 and 3 sit on hosts A, B and C. The negative control was posting 1's URL with the last three characters of its job id changed, so it points at a job that should not exist on host A.

| Prediction | Predicted | What happened | Held? |
|---|---|---|---|
| P1 | 3 of 3 postings active | 2 of 3 active (postings 2 and 3); posting 1 came back expired, "insufficient content" | no |
| P2 | control active | expired, with the same verdict and reason as the real posting 1 | no |
| P3 | 3 of 3 exact name matches | 0 of 3 exact matches | no |
| P4 | scorer exits 0 | exit 0 | yes |

1 of 4 predictions held. The two liveness runs gave identical output. The pushed CP1 brief above typed the company-alias table as DEV; the mode file refines it to DATA SOURCE, because closing it needs a data file with provenance, not a script.

The CP1 target was RUNNABLE-SAMPLE, but the mode file stays DRAFT: five typed TODOs are open, and SNICKERDOODLE.md:58 requires zero open TODOs before SPECIFIED, so no later stage is reachable either. A browser check on 2026-10-18 (your-input) found posting 1 open while the tool reported it expired.
