# Worked Run — Frontend / Full-Stack Sponsorship Triage

## 1. Goal

This run tests whether the recipe can surface historical sponsorship evidence without converting that evidence into a claim about current sponsorship, while separately checking whether a real frontend job posting is active.

The sample company used for the sponsorship lookup is **A10 Networks**. A real **Databricks Staff Software Engineer - Frontend** posting is used separately for the liveness test.

These are separate evidence checks and are not presented as evidence about the same job.

## 2. Inputs

### Sponsorship lookup

- Company: `A10 Networks` — `your-input`
- Target role: `Frontend Engineer` — `your-input`

### Liveness check

- Job URL: `https://www.databricks.com/company/careers/engineering---pipeline/staff-software-engineer---frontend-nyc-8384595002` — `your-input`

## 3. Historical sponsorship evidence run

Command:

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company "A10 Networks" \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/a10-sample
```

Observed output:

```text
Company: A10 Networks
Target role: Frontend Engineer
Loaded 30369 company records.
Company match: A10 NETWORKS INC

Sponsorship evidence:
  Total approvals: 106.0
  Total denials: 4.0
  Approval rate: 96.36363636363636
  Median salary offered: 140342.75
  Sponsored job titles: ['Solutions Architect', 'Staff Software Engineer', 'Senior Software Engineer', 'Sr. Manager, Technical Support', 'Principal QA Software Engineer', 'Software Engineer ']
  Evidence source: record

Evidence status: HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND
Warning: Historical sponsorship evidence does not establish sponsorship for the current role.
```

The prototype also wrote:

```text
course/2026fa/submissions/Varun19Aed/runs/a10-sample/agent-report.json
course/2026fa/submissions/Varun19Aed/runs/a10-sample/human-report.md
```

## 4. Evidence boundary

### `your-input`

The following values came from the user rather than repository evidence:

- `A10 Networks`
- `Frontend Engineer`
- the Databricks job URL used for the separate liveness test

### `record`

The matched company name `A10 NETWORKS INC` and the historical sponsorship fields were retrieved from the repository's mapped company CSV.

The liveness result is also treated as a record of what the existing repository tool observed at run time.

### `model-judgment`

No model-generated sponsorship probability was created.

In particular, the historical approval rate of `96.36363636363636` was **not** converted into `sponsorship.p = 0.9636`. The available repository evidence does not justify treating approval rate alone as the complete sponsorship probability.

## 5. Missing-evidence test

Command:

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company '$AVY INC' \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/avy-sample
```

Observed behavior:

```text
Company: $AVY INC
Target role: Frontend Engineer
Loaded 30369 company records.
Company match: $AVY INC

Sponsorship evidence:
  Total approvals: unknown
  Total denials: unknown
  Approval rate: unknown
  Median salary offered: unknown
  Sponsored job titles: unknown
  Evidence source: record

Evidence status: SPONSORSHIP_EVIDENCE_UNKNOWN
Warning: Historical sponsorship evidence does not establish sponsorship for the current role.
```

This confirms that missing sponsorship fields are preserved as unknown rather than interpreted as evidence that the company does not sponsor.

## 6. Company-not-found test

A fabricated company name was also tested:

```text
Varun Example Software XYZ
```

Observed result:

```text
Company: Varun Example Software XYZ
Target role: Frontend Engineer
Loaded 30369 company records.
Company match: NOT FOUND
Evidence status: COMPANY_NOT_FOUND
Warning: No confident company match was found. This does not establish that the company lacks sponsorship history.
```

No sponsorship evidence was invented.

## 7. Deliberate break test

The prototype was deliberately run without the required `--role` argument.

Observed behavior:

```text
error: the following arguments are required: --role
```

The program failed clearly rather than silently inventing a role.

During development, another failure occurred after evidence extraction code was initially placed outside `main()`:

```text
NameError: name 'company' is not defined
```

The code was moved into the correct execution scope and the successful tests were rerun.

## 8. Offline fixture tests

Command:

```bash
python3 -m unittest scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py -v
```

Observed output:

```text
test_historical_sponsorship_evidence_found (...) ... ok
test_legal_suffix_normalization (...) ... ok
test_missing_sponsorship_evidence_remains_unknown (...) ... ok
test_unknown_company_is_not_matched (...) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.000s

OK
```

The tests use an offline fixture and do not require network access.

## 9. Existing scorer run

Command:

```bash
npm run score -- \
  data/examples/ch11-roles.json \
  --out-dir course/2026fa/submissions/Varun19Aed/runs
```

Observed output:

```text
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/Varun19Aed/runs

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/Varun19Aed/runs/role-scores.json  +  course/2026fa/submissions/Varun19Aed/runs/role-scores.md
```

This verifies that the existing scorer runs successfully. It does not mean that the A10 evidence was passed into the scorer.

## 10. ATS dry-run

The first
