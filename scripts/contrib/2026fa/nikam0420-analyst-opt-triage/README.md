# Analyst OPT triage prototype

## Executive summary
This offline demonstration reads stored company evidence and compares fictional posting/timing scenarios for a data analyst search. It makes assumptions visible and produces separate reports for a person and an agent. It is runnable on the repository samples; real application decisions remain behind human review.

## Prerequisites
Run from the repository root. Node 20+ and Python 3 are required. The Python adapter uses only the standard library. Install the repository's npm dependencies for its verification commands. Global conformance additionally requires PyYAML (`python3 -c "import yaml"`). If unavailable, install it in a local virtual environment before verification; do not change maintained dependency files.

## One-command run
```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
```

## Offline test
```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py
```

## Deliberate CLI break
```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py --fixture scripts/contrib/2026fa/nikam0420-analyst-opt-triage/fixtures/missing-company.json
```
Expected: exit 2 and `BLOCKED: company-missing: exact name not found`; this is a successful safety check, not a passing command exit.

## Outputs and limits
Both primary outputs go to `course/2026fa/submissions/nikam0420/runs/`: agent-log.json and human-report.md. roles.json and role-scores files are supporting traces produced through the existing scorer. No network requests, real resumes, contacts or personal visa dates are read. Current role sponsorship and posting liveness remain unverified. Invalid runs do not refresh previous successful output; check terminal exit status and use the recorded successful run.

## How to explain the code
`evaluate` joins exactly one company, validates approvals and explicit fictional inputs, and creates labeled scorer terms. `run` validates the full batch before writing, invokes the existing scorer as a subprocess, wraps evidence in a JSON audit, and renders a Markdown report. It does not calculate a second copy of the composite.
