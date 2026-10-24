---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "offline fixture tests passed; repository scorer, ATS dry-run, and one live job-posting liveness check were executed by the student"
attestation: null
recipe_version: 0.1.0
---

# Frontend / Full-Stack Sponsorship Triage

## Executive summary

Help an international master's student preparing to graduate prioritize U.S. frontend and full-stack software engineering opportunities before spending significant time tailoring applications or networking.

The recipe separates three questions:

1. Does the repository contain historical sponsorship evidence for the company?
2. Is the specific job posting currently live?
3. What still requires human verification before deciding whether to apply?

Historical sponsorship evidence is not a promise that an employer will sponsor the current role. Missing evidence is not evidence of non-sponsorship.

This recipe produces record-backed evidence and preserves unknowns rather than inventing a sponsorship probability.

**Lifecycle:** `RUNNABLE-SAMPLE`. The local prototype and offline tests run successfully, and existing repository scorer/ATS/liveness tools were exercised. This recipe does not claim live sponsorship verification.

**Human twin:** `recipes/cases/2026fa/Varun19Aed-frontend-triage.card.md`

## Purpose

The target user is an international master's student approaching graduation and searching for full-time frontend and full-stack software engineering roles in the United States.

The information asymmetry is that a public job posting can describe technical requirements without establishing whether the employer has sponsored workers historically or whether it will sponsor the current role.

This recipe reduces wasted research/application effort by surfacing available historical sponsorship evidence and checking job-posting liveness while keeping the final application decision with the job seeker.

## Source inventory

### Existing repository data

Historical sponsorship evidence:

`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`

Fields used:

- `company_name`
- `Total Approvals`
- `Total Denials`
- `Approval_Rate`
- `median_salary_offered`
- `top_job_titles_sponsored`

These fields are treated as historical `record` evidence.

### Contribution prototype

`scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py`

It accepts a company name and target role, searches the repository CSV, and emits JSON and Markdown reports.

### Existing repository tools

Role scorer:

```bash
npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/Varun19Aed/runs
```

ATS scanner:

```bash
npm run ats:scan -- --dry-run
```

Job-posting liveness:

```bash
npm run ats:liveness -- "<job-url>"
```

## Phase gates

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G1 company resolution | User-entered company resolves deterministically to a repository company record. | inspect sponsorship fields | `COMPANY_NOT_FOUND`; preserve as unknown and require manual research |
| G2 sponsorship evidence | At least one historical sponsorship field is present. | `HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND` | `SPONSORSHIP_EVIDENCE_UNKNOWN`; do not label company a non-sponsor |
| G3 posting liveness | Existing liveness tool reports the specific URL active. | continue evaluation | expired/uncertain → stop or manually verify before investing application effort |
| G4 evidence boundary | Every emitted value is labeled `record`, `model-judgment`, or `your-input`. | human review | stop if provenance cannot be explained |
| G5 human decision | Human reviews historical evidence, current posting, role fit, and current sponsorship language. | apply/research/skip decision remains human | no automated claim that employer will sponsor |

## Workflow

### 1. Run sponsorship evidence lookup

From repository root:

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company "A10 Networks" \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/a10-sample
```

The prototype distinguishes:

- `HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND`
- `SPONSORSHIP_EVIDENCE_UNKNOWN`
- `COMPANY_NOT_FOUND`

It does not convert a missing value into a negative sponsorship claim.

### 2. Check a specific posting's liveness

Example tested command:

```bash
npm run ats:liveness -- "https://www.databricks.com/company/careers/engineering---pipeline/staff-software-engineer---frontend-nyc-8384595002"
```

The sample run returned `active`.

Liveness verifies the posting URL at test time. It does not verify sponsorship.

### 3. Use the existing scorer only with justified upstream evidence

The repository scorer was verified separately using:

```bash
npm run score -- \
  data/examples/ch11-roles.json \
  --out-dir course/2026fa/submissions/Varun19Aed/runs
```

The sample produced 2 Apply, 1 Consider, and 2 Skip decisions.

This contribution does not map historical H-1B approval rate directly to the scorer's sponsorship probability. The repository's documented sponsorship model requires additional evidence that is not fully available locally.

### 4. Human verification

Before acting on a role, the job seeker should inspect:

- current job-description sponsorship/work-authorization language;
- employer/recruiter clarification where needed;
- whether historical sponsored titles are relevant to the target role;
- whether the posting remains active;
- whether the role is appropriate for the candidate's experience.

## What this recipe can verify

- Whether a company record is present in the local mapped dataset.
- Whether historical sponsorship-related fields are present in that record.
- The stored approvals, denials, approval rate, median salary, and sponsored-title fields when available.
- Whether the existing repository liveness tool reports a tested job URL active, expired, or uncertain.
- Whether the prototype preserves missing sponsorship evidence as unknown.
- Whether deterministic legal-suffix normalization resolves tested variants such as `A10 Networks` and `A10 NETWORKS INC`.

## What this recipe cannot verify

- That an employer will sponsor the candidate.
- That an employer will sponsor a particular current role.
- That historical approval rate is equivalent to sponsorship probability.
- Whether missing local evidence means the employer has never sponsored.
- Whether a company-name match is correct when the legal and public names differ substantially.
- Candidate-role fit from the target-role string alone.
- Future posting availability.

## Output contract

The prototype writes:

`agent-report.json`

and:

`human-report.md`

to the user-provided `--out-dir`.

The machine report labels values using:

- `record` — value retrieved from repository data or deterministic evidence derived from the record;
- `your-input` — company/role supplied by the user;
- `model-judgment` — reserved for model-derived judgments. The current sponsorship lookup does not invent a model judgment.

The human report contains the inputs, company match, historical evidence, evidence status, limitations, and required human check.

## Verification checks

Offline fixture tests:

```bash
python3 -m unittest scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py -v
```

Expected tested behaviors:

- legal suffix normalization;
- historical sponsorship evidence found;
- missing sponsorship evidence remains unknown;
- unknown company is not falsely matched.

Repository checks used during the sample:

```bash
npm run doctor
npm run verify
npm run ats:scan -- --dry-run
npm run ats:liveness -- "<job-url>"
npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/Varun19Aed/runs
```

## Stop conditions

Stop automated interpretation and require human review when:

- the mapped sponsorship dataset is missing or unreadable;
- no confident company match is found;
- sponsorship fields are blank;
- the job URL is expired or liveness is uncertain;
- current sponsorship eligibility cannot be verified;
- a requested conclusion would require converting historical approval rate into an unsupported sponsorship probability;
- company-name resolution would require an unverified fuzzy/entity-resolution guess.

Do not convert unknown evidence into a negative sponsorship claim.

## Sample observations

The first prototype failed to resolve `A10 Networks` because the stored company name was `A10 NETWORKS INC`.

The matching function was revised to remove common trailing legal suffixes deterministically. After the change, both forms resolved to the same record.

The local record reported historical sponsorship evidence for A10 Networks, including 106 approvals and 4 denials. These values are retained as historical record evidence only.

A record with blank sponsorship fields (`$AVY INC`) returned `SPONSORSHIP_EVIDENCE_UNKNOWN` rather than being classified as a non-sponsor.

A fabricated company name returned `COMPANY_NOT_FOUND` without inventing sponsorship evidence.

## Logging

The assignment run is recorded at:

`logs/runs/2026fa-Varun19Aed-1.md`

Worked-run and test documentation are stored under:

`course/2026fa/submissions/Varun19Aed/`

Do not log resumes, credentials, private application information, or other personal data.

## Next action

A future version could add source-backed company entity resolution and integrate additional sponsorship-model components only when the required underlying evidence is available.

Until then, historical sponsorship evidence, liveness, and human verification remain deliberately separ
