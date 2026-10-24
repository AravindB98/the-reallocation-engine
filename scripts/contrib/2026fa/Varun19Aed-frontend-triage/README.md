# Frontend / Full-Stack Sponsorship Triage Prototype

This prototype looks up historical sponsorship evidence for a target company using the Reallocation Engine's locally available mapped employment dataset.

It is designed for an international student evaluating U.S. frontend and full-stack software engineering opportunities.

## What It Does

The prototype:

1. Accepts a company name and target role from the user.
2. Normalizes common company legal suffixes such as `INC`, `LLC`, and `CORP`.
3. Searches the repository's mapped employment dataset.
4. Retrieves available historical sponsorship fields.
5. Distinguishes between:
   - `HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND`
   - `SPONSORSHIP_EVIDENCE_UNKNOWN`
   - `COMPANY_NOT_FOUND`
6. Writes a JSON agent report and a Markdown human-readable report.

The prototype does not claim that historical sponsorship evidence proves that an employer will sponsor a specific current role.

## Data Source

The prototype reads:

`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`

Fields currently used:

- `company_name`
- `Total Approvals`
- `Total Denials`
- `Approval_Rate`
- `median_salary_offered`
- `top_job_titles_sponsored`

Missing sponsorship fields are treated as unknown rather than as evidence that a company does not sponsor.

## Run From Repository Root

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company "A10 Networks" \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/a10-sample
```

The command writes:

- `agent-report.json`
- `human-report.md`

to the specified output directory.

## Offline Test

The test uses a small local fixture and requires no network access.

Run from the repository root:

```bash
python3 -m unittest \
  scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py \
  -v
```

The tests cover:

- matching a common company name to a legal-name variant;
- detecting populated historical sponsorship evidence;
- preserving missing sponsorship evidence as unknown;
- refusing to match an unknown company.

## Evidence Boundary

Values copied from the mapped repository dataset are labeled `record`.

The company name and target role supplied on the command line are labeled `your-input`.

The current prototype does not create a `model-judgment` sponsorship probability. The repository does not locally expose all of the raw evidence needed to reproduce and validate the documented sponsorship probability calculation, so the prototype reports the available historical evidence instead of inventing a probability.

## Limitations

- Historical sponsorship evidence does not guarantee sponsorship for a current role or candidate.
- Missing historical sponsorship evidence does not establish non-sponsorship.
- Company matching currently uses deterministic normalization of common legal suffixes and does not perform fuzzy entity resolution.
- The target role is reported as user input but is not used to infer sponsorship eligibility.
- Current job-posting liveness must be checked separately before making an application decision.

## Human Decision

The output is evidence for prioritization, not an automated application decision. The job seeker remains responsible for verifying the current job description, employer sponsorship policy, posting liveness, and other role-specific requirements before deciding whether to apply.
