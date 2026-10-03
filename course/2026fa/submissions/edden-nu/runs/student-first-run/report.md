# Sponsorship evidence triage

## Executive summary

This offline sample combines real repository company records with fictional openings. Recommendations require human review. No current employer policy, visa eligibility, or live vacancy is verified.

All scenario facts are `your-input`; file contents and observed tool outputs are `record`; routing and recommendations are `model-judgment`.

| Case [your-input] | Action [model-judgment] | Reason [model-judgment] |
|---|---|---|
| S1 | Skip | explicit-policy-restriction |
| S2 | Consider | role-policy-unknown |
| S3 | Consider | skill-evidence-gap |
| S4 | Apply | candidate-for-human-review |
| S5 | Blocked | missing-or-uncertain-evidence |
| S6 | Skip | closed-liveness-gate |
| S7 | Blocked | missing-or-uncertain-evidence |
| S8 | Skip | closed-timeline-gate |
| S9 | Blocked | missing-or-uncertain-evidence |

## Per-field evidence (matches JSON)

- sample_only: true [your-input] — fixtures/cases.json
- as_of: "2026-09-30" [your-input] — fictional scenario date
- dataset_sha256: "eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270" [record] — SHA-256 of actual input bytes
- dataset_rows: 30369 [record] — CSV parser row count
- human_clearance: "pending" [record] — no human approval collected; no applications executed

### S1 — synthetic scenario

- id: "S1" [your-input] — synthetic case S1; not an employer statement
- company: "DATADOG INC" [your-input] — synthetic case S1; not an employer statement
- title: "Fictional backend role" [your-input] — synthetic case S1; not an employer statement
- policy: "no" [your-input] — synthetic case S1; not an employer statement
- policy_quote: "This synthetic opening does not offer sponsorship." [your-input] — synthetic case S1; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "340.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258; blank remains unknown
- historical_titles: "['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- required_skill: "Java" [your-input] — synthetic case S1; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S1; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S1; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Skip" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "explicit-policy-restriction" [model-judgment] — ordered rules in run.py
- next_step: "Do not tailor for this fictional opening; do not infer a company-wide restriction." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S2 — synthetic scenario

- id: "S2" [your-input] — synthetic case S2; not an employer statement
- company: "ACE-UP INC" [your-input] — synthetic case S2; not an employer statement
- title: "Fictional analytics role" [your-input] — synthetic case S2; not an employer statement
- policy: "unknown" [your-input] — synthetic case S2; not an employer statement
- policy_quote: "No policy statement supplied in this fixture." [your-input] — synthetic case S2; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "2.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502; blank remains unknown
- historical_titles: "['Business Intelligence Analyst']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502
- required_skill: "SQL" [your-input] — synthetic case S2; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S2; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S2; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Consider" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "role-policy-unknown" [model-judgment] — ordered rules in run.py
- next_step: "Prepare a role-specific sponsorship question for networking; do not send automatically." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S3 — synthetic scenario

- id: "S3" [your-input] — synthetic case S3; not an employer statement
- company: "FIGMA INC" [your-input] — synthetic case S3; not an employer statement
- title: "Fictional design role" [your-input] — synthetic case S3; not an employer statement
- policy: "yes" [your-input] — synthetic case S3; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S3; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "188.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 9654
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 9654; blank remains unknown
- historical_titles: "['Software Engineer', 'Account Manager, Enterprise', 'Software Engineer - Infrastructure', 'Motion Designer, Brand Studio', 'Data Scientist, Product Analytics']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 9654
- required_skill: "Figma" [your-input] — synthetic case S3; not an employer statement
- skill_list_match: false [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S3; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S3; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Consider" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "skill-evidence-gap" [model-judgment] — ordered rules in run.py
- next_step: "Build or locate a relevant portfolio artifact during credibility time." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S4 — synthetic scenario

- id: "S4" [your-input] — synthetic case S4; not an employer statement
- company: "10 PERCENT HAPPIER INC" [your-input] — synthetic case S4; not an employer statement
- title: "Fictional analytics role" [your-input] — synthetic case S4; not an employer statement
- policy: "yes" [your-input] — synthetic case S4; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S4; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: null [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 10
- historical_state: "unknown" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 10; blank remains unknown
- historical_titles: null [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 10
- required_skill: "SQL" [your-input] — synthetic case S4; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S4; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S4; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Apply" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "candidate-for-human-review" [model-judgment] — ordered rules in run.py
- next_step: "Human reviews evidence first; only then tailor an application. No automatic submission." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S5 — synthetic scenario

- id: "S5" [your-input] — synthetic case S5; not an employer statement
- company: "DATADOG INC" [your-input] — synthetic case S5; not an employer statement
- title: "Fictional backend role" [your-input] — synthetic case S5; not an employer statement
- policy: "yes" [your-input] — synthetic case S5; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S5; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "340.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258; blank remains unknown
- historical_titles: "['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- required_skill: "Java" [your-input] — synthetic case S5; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "expired" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "insufficient_content" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: null [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S5; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S5; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Blocked" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "missing-or-uncertain-evidence" [model-judgment] — ordered rules in run.py
- next_step: "Resolve employer identity, page status, or timing before an application decision." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S6 — synthetic scenario

- id: "S6" [your-input] — synthetic case S6; not an employer statement
- company: "ACE-UP INC" [your-input] — synthetic case S6; not an employer statement
- title: "Fictional closed role" [your-input] — synthetic case S6; not an employer statement
- policy: "yes" [your-input] — synthetic case S6; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S6; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "2.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502; blank remains unknown
- historical_titles: "['Business Intelligence Analyst']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 502
- required_skill: "SQL" [your-input] — synthetic case S6; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "expired" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "http_gone" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: false [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S6; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S6; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Skip" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "closed-liveness-gate" [model-judgment] — ordered rules in run.py
- next_step: "Skip this opening; inspect other openings before networking." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S7 — synthetic scenario

- id: "S7" [your-input] — synthetic case S7; not an employer statement
- company: "FICTIONAL ABSENT EMPLOYER" [your-input] — synthetic case S7; not an employer statement
- title: "Fictional unmatched role" [your-input] — synthetic case S7; not an employer statement
- policy: "yes" [your-input] — synthetic case S7; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S7; not an employer statement
- exact_company_match: false [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: null [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record None
- historical_state: "unknown" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record None; blank remains unknown
- historical_titles: null [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record None
- required_skill: "Java" [your-input] — synthetic case S7; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S7; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S7; not an employer statement; not a legal eligibility date
- timeline_gate: true [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Blocked" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "missing-or-uncertain-evidence" [model-judgment] — ordered rules in run.py
- next_step: "Resolve employer identity, page status, or timing before an application decision." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S8 — synthetic scenario

- id: "S8" [your-input] — synthetic case S8; not an employer statement
- company: "DATADOG INC" [your-input] — synthetic case S8; not an employer statement
- title: "Fictional late-start role" [your-input] — synthetic case S8; not an employer statement
- policy: "yes" [your-input] — synthetic case S8; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S8; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "340.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258; blank remains unknown
- historical_titles: "['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- required_skill: "Java" [your-input] — synthetic case S8; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2027-01-01" [your-input] — synthetic case S8; not an employer statement
- deadline: "2026-12-01" [your-input] — synthetic case S8; not an employer statement; not a legal eligibility date
- timeline_gate: false [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Skip" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "closed-timeline-gate" [model-judgment] — ordered rules in run.py
- next_step: "Skip under the explicit fictional timing assumptions." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit

### S9 — synthetic scenario

- id: "S9" [your-input] — synthetic case S9; not an employer statement
- company: "DATADOG INC" [your-input] — synthetic case S9; not an employer statement
- title: "Fictional unknown-timing role" [your-input] — synthetic case S9; not an employer statement
- policy: "yes" [your-input] — synthetic case S9; not an employer statement
- policy_quote: "Sponsorship may be considered in this synthetic scenario." [your-input] — synthetic case S9; not an employer statement
- exact_company_match: true [record] — exact-key lookup in CSV; original H-1B identity join not validated
- historical_approvals_raw: "340.0" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- historical_state: "populated-positive" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258; blank remains unknown
- historical_titles: "['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']" [record] — data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv record 7258
- required_skill: "Java" [your-input] — synthetic case S9; not an employer statement
- skill_list_match: true [record] — search/examples/aarav-patel/resume.example.json skills lists; not proficiency verification
- liveness_result: "active" [record] — actual upstream classifier output on synthetic input
- liveness_reason: "apply_control_visible" [record] — scripts/ats/liveness-core.mjs on synthetic input
- liveness_gate: true [model-judgment] — reason-aware routing; insufficient_content stays unknown
- earliest_start: "2026-11-01" [your-input] — synthetic case S9; not an employer statement
- deadline: null [your-input] — synthetic case S9; not an employer statement; not a legal eligibility date
- timeline_gate: null [model-judgment] — date comparison over fictional assumptions; unknown stays null
- action: "Blocked" [model-judgment] — ordered rules in run.py; Apply remains pending human review
- reason: "missing-or-uncertain-evidence" [model-judgment] — ordered rules in run.py
- next_step: "Resolve employer identity, page status, or timing before an application decision." [model-judgment] — 3-3-2 allocation suggestion, not measured benefit
