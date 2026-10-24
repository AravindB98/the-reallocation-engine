# Test Report — Frontend / Full-Stack Sponsorship Triage

## Test environment

- Repository: The Reallocation Engine
- Contribution: `Varun19Aed-frontend-triage`
- Branch: `contrib/2026fa-varun-frontend-triage`
- Prototype language: Python
- Test framework: Python built-in `unittest`

## Baseline repository checks

Before implementing the contribution, the following repository checks were run.

### `npm run doctor`

The environment check completed successfully. Node, Python, repository scripts, and domain directories were detected.

LibreOffice was reported as unavailable, but it was an optional PDF fallback and was not required by this contribution.

### `npm run verify`

The baseline verification completed successfully.

Observed summary:

- 158 files checked by conformance
- 85 Markdown
- 36 Python
- 30 JavaScript
- 4 shell
- 3 JSON

Three manifest warnings were reported for existing repository ignore/private-path configuration. Verification still passed.

## Prototype tests

Command:

```bash
python3 -m unittest scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py -v
```

Observed result:

```text
test_historical_sponsorship_evidence_found (...) ... ok
test_legal_suffix_normalization (...) ... ok
test_missing_sponsorship_evidence_remains_unknown (...) ... ok
test_unknown_company_is_not_matched (...) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.000s

OK
```

### Behaviors tested

| Test | Expected behavior | Result |
|---|---|---|
| Legal suffix normalization | `A10 Networks` can resolve to `A10 NETWORKS INC` | PASS |
| Historical evidence | Existing sponsorship fields are returned as record evidence | PASS |
| Missing evidence | Blank sponsorship fields remain unknown | PASS |
| Unknown company | Fabricated company is not falsely matched | PASS |

The tests use a local offline fixture and do not require network access.

## Sample prototype run

Input:

```text
Company: A10 Networks
Target role: Frontend Engineer
```

Observed evidence:

```text
Company match: A10 NETWORKS INC
Total approvals: 106.0
Total denials: 4.0
Approval rate: 96.36363636363636
Median salary offered: 140342.75
Evidence status: HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND
```

The run produced:

```text
course/2026fa/submissions/Varun19Aed/runs/a10-sample/agent-report.json
course/2026fa/submissions/Varun19Aed/runs/a10-sample/human-report.md
```

## Deliberate break test

The prototype was run without its required `--role` argument.

Expected behavior: fail clearly rather than inventing a role.

Observed behavior:

```text
error: the following arguments are required: --role
```

Result: **PASS**.

## Additional failure cases

### Company-name mismatch

The first implementation used simple case/whitespace normalization.

Observed:

```text
A10 Networks
→ Company match: NOT FOUND

A10 NETWORKS INC
→ Company match: A10 NETWORKS INC
```

Response:

The normalization logic was revised to remove common trailing legal suffixes deterministically.

After the fix:

```text
A10 Networks
→ Company match: A10 NETWORKS INC
```

### Missing sponsorship evidence

`$AVY INC` exists in the mapped dataset but has blank sponsorship fields.

Observed:

```text
Evidence status: SPONSORSHIP_EVIDENCE_UNKNOWN
```

The prototype did not classify the company as a non-sponsor.

### Unknown company

A fabricated company name was tested.

Observed:

```text
Company match: NOT FOUND
Evidence status: COMPANY_NOT_FOUND
```

No sponsorship evidence was invented.

## Existing scorer verification

Command:

```bash
npm run score -- \
  data/examples/ch11-roles.json \
  --out-dir course/2026fa/submissions/Varun19Aed/runs
```

Observed:

```text
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
```

Result: **PASS**.

This verifies the existing scorer separately. The prototype does not claim that its A10 historical approval rate was converted into a scorer sponsorship probability.

## ATS scanner verification

First attempt:

```bash
npm run ats:scan -- --dry-run
```

Observed:

```text
Error: portals.yml not found. Run onboarding first.
```

Repository documentation was inspected. Following its instructions, `data/ats/portals.example.yml` was copied to `data/ats/portals.yml`.

Second attempt:

```text
Companies scanned:     1
Total jobs found:      886
Filtered by title:     391 removed
Filtered by location:  424 removed
Duplicates:            10 skipped
New offers added:      61
```

Result: **PASS after documented configuration fix**.

## Liveness verification

The first attempt failed because the Playwright Chromium executable was unavailable.

The reported remediation was executed:

```bash
npx playwright install chromium
```

Chromium, FFmpeg, and Chrome Headless Shell installed successfully.

A real Databricks frontend posting was then checked.

Observed:

```text
✅ active     https://www.databricks.com/company/careers/engineering---pipeline/staff-software-engineer---frontend-nyc-8384595002

Results: 1 active  0 expired  0 uncertain
```

Result: **PASS**.

This verifies point-in-time URL liveness only. It does not establish sponsorship.

## Friction encountered and response

1. `portals.yml` was initially missing. Repository documentation was inspected instead of inventing configuration, and the provided example configuration was copied as instructed.

2. Playwright was installed but its Chromium executable was missing. The browser dependency was installed using the remediation reported by Playwright.

3. `pytest` was not installed. Instead of adding an unnecessary dependency, the offline tests were implemented with Python's built-in `unittest`.

4. Evidence extraction code was initially placed outside `main()`, producing:

```text
NameError: name 'company' is not defined
```

The code was moved into the correct scope and tests were rerun.

5. The first company normalization strategy failed on a legal suffix. The failure was preserved as evidence and the normalization strategy was revised.

## Human gate

The prototype does not make the final application decision.

A human must still determine:

- whether the current role offers sponsorship;
- whether historical sponsored titles are relevant;
- whether the role matches the candidate's experience;
- whether additional employer/recruiter verification is necessary.

Historical sponsorship evidence and liveness are decision-support signals, not guarantees.

## Did not test

The following were not verified:

- unrestricted fuzzy company-name matching;
- correctness of company matches where legal and public names differ substantially;
- current sponsorship availability for A10 Networks;
- current sponsorship availability for the tested Databricks role;
- complete reconstruction of the repository's sponsorship probability;
- full raw DOL/LCA entity-resolution accuracy;
- batch performance across the complete company dataset;
- live behavior after the recorded test date.

These remain limitations rather than being reported as successful tests.

## Final validation

### Repository verification

`npm run verify` completed successfully after the contribution was added.

Observed:

```text
conformance: 163 files (88 md · 38 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)
```

The three manifest warnings were the same repository-level ignore/private-path warnings observed during the baseline run.

### Doctor

`npm run doctor` reported the environment as runnable. Required Node and Python dependencies were available, Playwright was installed, and all listed runnable command targets were present.

LibreOffice was unavailable as an optional PDF fallback and was not required by this contribution.

### PII scan

Command:

```bash
node scripts/pii-scan.mjs
```

Observed:

```text
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

[email] package-lock.json — an existing email-like string in package-lock.json
```

The reported finding is in the repository's existing `package-lock.json`, not in a contribution file. `package-lock.json` was restored to the repository version and is not modified by this contribution.

The scan result is recorded rather than changing the repository dependency lockfile or weakening the PII scanner.

### Final offline tests

Command:

```bash
python3 -m unittest scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py -v
```

Observed:

```text
Ran 4 tests in 0.001s

OK
```

All four contribution tests passed immediately before staging.
