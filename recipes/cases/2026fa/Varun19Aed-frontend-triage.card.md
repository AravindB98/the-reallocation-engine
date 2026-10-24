# Frontend / Full-Stack Sponsorship Triage — human card

**Audience:** an international master's student deciding where to spend limited job-search time.  
**Agent twin:** `recipes/cases/2026fa/Varun19Aed-frontend-triage.md`

## Purpose

Answer two preliminary questions before investing significant time in a frontend or full-stack application:

1. What historical sponsorship evidence does the repository contain for this company?
2. Is the specific job posting currently live?

These signals help prioritize research. They do not decide whether the user should apply and do not establish that the employer will sponsor the current role.

## What it can verify

- Whether the company can be matched to a record in the local mapped company dataset.
- Whether that record contains historical approvals, denials, approval rate, median salary, or sponsored job-title evidence.
- Whether sponsorship evidence is missing rather than silently treating missing data as a negative result.
- Whether the repository's liveness tool reports a specific tested job URL as active, expired, or uncertain.
- Whether tested legal-name variants such as `A10 Networks` and `A10 NETWORKS INC` resolve to the same record.

## What it cannot verify

- Whether an employer will sponsor the user.
- Whether an employer will sponsor a specific current job.
- Whether historical H-1B approval rate equals current sponsorship probability.
- Whether missing repository evidence means a company has never sponsored.
- Whether a substantially different public/legal company name refers to the same entity without additional entity resolution.
- Whether the candidate is qualified for a role merely from its title.
- Whether a posting that is active today will remain active later.

## Dependencies

Historical sponsorship data:

`data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`

Prototype:

`scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py`

Existing repository tools:

- `npm run ats:scan`
- `npm run ats:liveness`
- `npm run score`

## Annotated commands

Historical sponsorship evidence lookup:

```bash
python3 scripts/contrib/2026fa/Varun19Aed-frontend-triage/frontend_triage.py \
  --company "A10 Networks" \
  --role "Frontend Engineer" \
  --out-dir course/2026fa/submissions/Varun19Aed/runs/a10-sample
```

Offline tests:

```bash
python3 -m unittest scripts/contrib/2026fa/Varun19Aed-frontend-triage/tests/test_frontend_triage.py -v
```

ATS sample scan:

```bash
npm run ats:scan -- --dry-run
```

Specific posting liveness:

```bash
npm run ats:liveness -- "<job-url>"
```

Existing scorer verification:

```bash
npm run score -- \
  data/examples/ch11-roles.json \
  --out-dir course/2026fa/submissions/Varun19Aed/runs
```

## What it produces

The contribution prototype writes:

- `agent-report.json` — machine-readable evidence with provenance labels.
- `human-report.md` — readable evidence summary, limitations, and human check.

Possible sponsorship evidence states:

- `HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND`
- `SPONSORSHIP_EVIDENCE_UNKNOWN`
- `COMPANY_NOT_FOUND`

None of these states alone means that a current role will or will not sponsor the candidate.

## Human decision

Before applying, the user should separately review:

- current work-authorization or sponsorship language in the job description;
- current employer/recruiter information where necessary;
- relevance of historical sponsored titles to the target role;
- role requirements and candidate fit;
- current posting liveness.

The final apply/research/skip decision remains with the user.

## Named failure modes

1. **Company-name mismatch** — the public company name may differ from the stored legal name. The prototype removes common trailing legal suffixes but does not perform unrestricted fuzzy matching. If no confident match exists, return `COMPANY_NOT_FOUND`.

2. **Missing sponsorship fields** — a company can exist in the dataset while its sponsorship fields are blank. Return `SPONSORSHIP_EVIDENCE_UNKNOWN`; do not label the company a non-sponsor.

3. **Historical-to-current inference** — historical approvals can be mistakenly interpreted as proof of current sponsorship. Keep historical evidence labeled as `record` and require a current human check.

4. **Dead or uncertain posting** — historical company evidence may be available even when the specific job is no longer actionable. Use the liveness gate and stop or manually verify when the result is expired or uncertain.

5. **Unsupported sponsorship probability** — approval rate alone does not reproduce the repository's documented sponsorship model. Do not convert the historical approval rate directly into a scorer probability.
