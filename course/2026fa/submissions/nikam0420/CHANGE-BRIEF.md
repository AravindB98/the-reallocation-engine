# Change brief — analyst OPT triage

## Executive summary
This project helps an international master's student researching data analyst roles avoid spending application time on a closed posting or an assumed hiring timeline that cannot fit a fictional deadline. It checks stored company evidence and exposes assumptions before a person decides what to do.

## Original predictions, written before implementation
- Situation: a fictional MSIS student approaching graduation and planning a US data analyst search; the demonstration dates are invented and are not the author's immigration details.
- Reuse the sponsorship layer: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; use `scripts/score/role-scorer.mjs` through its CLI. No scorer copy, new external feed, funding join, or wage change.
- Add a standard-library Python adapter, fixture, and offline tests in `scripts/contrib/2026fa/nikam0420-analyst-opt-triage/` because the existing scorer does not perform exact company joins or require complete gate inputs.
- Gates: missing company/approval record blocks scoring; absent liveness blocks scoring; a supplied closed-posting scenario or insufficient assumed hiring time forces Skip. The final report stops at human review; no application is sent.
- Human review must see the exact source company row, the scenario-only liveness label, the fictional deadline and assumed hiring lag, and the scorer's term-by-term trace. Live use requires current posting and employer confirmation, outside this sample workflow.
- Predicted failures: an absent company should exit nonzero without a substitute row; omitted liveness should exit nonzero rather than inherit the scorer's default of 1; an elapsed deadline should produce a closed timeline gate.
- First-pass prediction: aggregate company approvals and listed titles cannot establish sponsorship of this specific role. The adapter will have to retain a conditional recommendation, not promise sponsorship.

## Later revisions
Implementation/run observations are appended to TEST-REPORT.md and FRICTIONAL.md; the predictions above are preserved.
