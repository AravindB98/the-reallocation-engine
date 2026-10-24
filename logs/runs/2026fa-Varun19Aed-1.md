# 2026FA Run — Varun19Aed — Frontend / Full-Stack Sponsorship Triage

## Scope

Sample run of the `Varun19Aed-frontend-triage` contribution using local historical sponsorship evidence, existing repository scorer/ATS tools, and one real job-posting liveness check.

## Prototype

Input:

```text
company = A10 Networks
role = Frontend Engineer
```

Result:

```text
Company match: A10 NETWORKS INC
Total approvals: 106.0
Total denials: 4.0
Approval rate: 96.36363636363636
Evidence status: HISTORICAL_SPONSORSHIP_EVIDENCE_FOUND
```

Outputs:

```text
course/2026fa/submissions/Varun19Aed/runs/a10-sample/agent-report.json
course/2026fa/submissions/Varun19Aed/runs/a10-sample/human-report.md
```

## Offline tests

```text
4 tests run
4 passed
0 failed
```

## Existing scorer

```text
5 roles scored
Apply: 2
Consider: 1
Skip: 2
```

## ATS dry-run

Initial result:

```text
Error: portals.yml not found. Run onboarding first.
```

After following repository setup instructions:

```text
Companies scanned: 1
Total jobs found: 886
New offers added: 61
```

## Liveness

Tested a real Databricks Staff Software Engineer - Frontend posting.

Result:

```text
1 active
0 expired
0 uncertain
```

## Human gate

Historical sponsorship evidence does not establish current sponsorship. Posting liveness does not establish sponsorship or candidate fit. Final application and verification decisions remain with the job seeker.
