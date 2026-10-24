# Analyst OPT triage — sample report

## Executive summary

This demonstration compares three fictional posting scenarios using a stored company record and explicit timeline assumptions. It helps a student see why an application should wait or be skipped. All results stop at human review; no current posting or sponsorship commitment was verified.

## Results

| Scenario | Conditional result | Composite | Next action |
|---|---|---|---|
| enough-time | Consider | 0.56 | Hold for human evidence review; only then research/tailor. |
| closed-posting | Skip | 0 | Skip this simulated application; optionally research networking. |
| too-little-time | Skip | 0 | Skip this simulated application; optionally research networking. |

## Evidence boundary

Record: exact company name, aggregate approvals, listed titles, source path and source-byte hash. These are verified against the shipped CSV, not independently against current DOL filings.

Your-input: fictional dates, hiring lag, simulated posting liveness, self-rated fit, sponsorship presence policy, conditional recommendations and computed timeline. These are not empirical probabilities or immigration advice. No model-judgment values are used.

## Human hard stop

Approval remains pending. Before any real application, a person must inspect current posting liveness, confirm role-specific sponsorship with the employer, validate their actual timing with the appropriate advisor, and record name/date/evidence. This offline sample does not clear that gate.

## Known gaps

Company aggregates cannot prove this particular Data Analyst role is sponsored. Funding is unused. Role-quality weight remains zero in the existing scorer. No live ATS check or legal deadline calculation was implemented. Scorer weights and Consider floor are inherited, including its documented unsettled defaults.

## Provenance

Source: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; see agent-log.json for hash and each value label. Raw scorer trace: role-scores.json. All files remain in the student namespace.
