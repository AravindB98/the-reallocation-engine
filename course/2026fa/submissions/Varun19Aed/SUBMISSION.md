# Reallocation Engine — Recipe Design Assignment

## Assignment

The Reallocation Engine — Recipe Design Assignment

## Student

Varun Tadimeti

## GitHub handle

`Varun19Aed`

## Domain / situation

Frontend / Full-Stack Sponsorship Triage for an international student evaluating U.S. software engineering opportunities.

## Recipe path

`recipes/cases/2026fa/Varun19Aed-frontend-triage.md`

Human card:

`recipes/cases/2026fa/Varun19Aed-frontend-triage.card.md`

## Prototype command

Run from the repository root:

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company "A10 Networks" \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/a10-sample
```

Offline test:

```bash
python3 -m unittest \
  scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py \
  -v
```

## GitHub repository / branch / PR URL

Repository: `https://github.com/nikbearbrown/the-reallocation-engine`

Branch: `contrib/2026fa-varun-frontend-triage`

PR: `https://github.com/nikbearbrown/the-reallocation-engine/pull/35`

## Submitted commit SHA

`FINAL_SHA_TO_BE_ADDED_TO_CANVAS_ZIP`

## Lifecycle stage claimed

`RUNNABLE-SAMPLE`

## Summary of my changes

I added a runnable Frontend / Full-Stack Sponsorship Triage recipe and prototype that uses the repository's locally available mapped employment dataset to retrieve historical sponsorship evidence for a target company.

The prototype distinguishes verified repository records from user input and does not infer that historical sponsorship guarantees sponsorship for a current role. Missing sponsorship evidence remains unknown rather than being treated as evidence of non-sponsorship.

The contribution includes:

- recipe and human-readable card;
- Python prototype;
- offline fixture and four offline tests;
- domain justification;
- change brief;
- worked run;
- test report;
- frictional log;
- sources;
- run log;
- sample prototype output;
- existing scorer output.

## Known limitations

- Historical sponsorship evidence does not guarantee sponsorship for a current role or candidate.
- Missing historical sponsorship evidence does not establish non-sponsorship.
- Company matching uses deterministic legal-suffix normalization rather than fuzzy entity resolution.
- The target role is reported as user input but is not used to infer sponsorship eligibility.
- Current job-posting liveness must be checked separately.
- The locally available evidence is insufficient to reproduce and validate the repository's complete documented sponsorship-probability model.
- The PII scanner reports `an existing email-like string in package-lock.json` in the repository's existing `package-lock.json`; this lockfile was not introduced or modified by this contribution.

## Run log

`logs/runs/2026fa-Varun19Aed-1.md`

## Supporting documentation

- `course/2026fa/submissions/Varun19Aed/CHANGE-BRIEF.md`
- `course/2026fa/submissions/Varun19Aed/DOMAIN-JUSTIFICATION.md`
- `course/2026fa/submissions/Varun19Aed/WORKED-RUN.md`
- `course/2026fa/submissions/Varun19Aed/TEST-REPORT.md`
- `course/2026fa/submissions/Varun19Aed/FRICTIONAL.md`
- `course/2026fa/submissions/Varun19Aed/SOURCES.md`

## Evidence boundary

The prototype reports historical sponsorship evidence available in the repository. It does not claim that historical sponsorship establishes sponsorship for a current role.

Missing sponsorship evidence remains unknown rather than being interpreted as evidence of non-sponsorship.

The contribution does not convert historical H-1B approval rate directly into a sponsorship probability because the locally available evidence is insufficient to reproduce and validate the repository's complete documented sponsorship model.

The final decision to apply, research further, contact the employer, or skip remains with the human user.

## Attestation

### Tested

- Historical sponsorship evidence retrieval
- Company legal-suffix normalization
- Missing sponsorship evidence behavior
- Company-not-found behavior
- Required-argument failure behavior
- Offline fixture tests
- Existing scorer sample
- ATS dry-run
- Real job-posting liveness
- Repository conformance and doctor checks

### Did not test

- General fuzzy company entity resolution
- Current sponsorship availability for the sample companies or roles
- Complete raw DOL/LCA entity-resolution accuracy
- Full reconstruction of the repository sponsorship probability
- Batch behavior across every company record
- Future liveness of the tested job posting

### Broke during testing and fixed

The first company matcher failed to resolve `A10 Networks` to the stored legal name `A10 NETWORKS INC`. Deterministic legal-suffix normalization was added and verified with an offline test.

An early implementation also produced a `NameError` due to incorrect code placement. The code was corrected and the tests were rerun successfully.

The ATS dry-run initially failed because `portals.yml` had not been configured. The repository's documented example configuration was used.

The liveness check initially could not launch Chromium. The required Playwright Chromium dependency was installed and the check was rerun successfully.
