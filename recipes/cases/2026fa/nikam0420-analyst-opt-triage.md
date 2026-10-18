---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-machine-run, 2026-10-02, logs/runs/2026fa-nikam0420-1.md"
attestation: null
recipe_version: 0.1.0
---

# Analyst OPT triage

## Executive summary
This recipe is for an international MSIS student planning a US data analyst search around graduation. It makes stored sponsorship evidence and assumed timing visible before spending time tailoring applications. Its sample returns conditional Consider or Skip results; a person must review the evidence before any real application.

## Purpose and scope
The fictional scenario has 44 calendar days before an invented last feasible start date and assumes a 21-day hiring lag. This is a research triage demonstration, not a legal OPT deadline calculator. It connects the sponsorship layer to the engine's liveness and timeline gates. The sample deliberately holds company evidence constant while varying one gate so a reader can explain the difference.

## Source inventory
| Source | Exact path / command | Boundary |
|---|---|---|
| Stored upstream company fields | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | Confirms stored aggregate approvals and listed titles, not current employer policy |
| Fictional scenarios | `scripts/contrib/2026fa/nikam0420-analyst-opt-triage/fixtures/scenarios.json` | your-input; no actual posting or immigration information |
| Existing scorer | `scripts/score/role-scorer.mjs` | Reused unchanged via CLI; threshold and weights inherited |
| Prototype | `python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py` | Offline exact company lookup, explicit gate validation and dual reports |
| Offline tests | `python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/test_prototype.py` | Exercises failure behavior and actual scorer |
| Machine conformance | `node scripts/conformance.mjs scripts/contrib/2026fa/nikam0420-analyst-opt-triage` | Checks syntax and structured-file shapes, not human adequacy |

## Additions and rationale
The implemented Python adapter bridges the shipped CSV to the existing scorer, rejects absent evidence instead of inventing values, and writes a labeled log plus a human report. The fixture and nine tests make the gate behavior reproducible offline. No new external data source is proposed as part of version 0.1.0. All additions exist in the student namespace; live ingestion and SOC-specific sponsorship are future ideas, not implemented capabilities.

## Rules and provenance
1. Match `company_name` exactly; no fuzzy company inference.
2. Parse `Total Approvals` as a finite nonnegative number; blank is unknown and blocks execution, never zero.
3. A binary sponsor signal is 1 if approvals > 0, otherwise 0. This is a declared **your-input policy**, not a probability estimated from DOL records. Use tier Likely for presence to keep the recommendation conditional.
4. Require an explicit sample liveness factor, 0 or 1, labeled your-input. Never present it as an ATS record.
5. Compute days remaining from fictional dates. Timeline factor is 1 only if days remaining >= the positive assumed hiring lag; both the assumptions and derived value are your-input.
6. Use a declared fictional fit input. No model judgment is generated in this version.
7. Pass all evidence into the unmodified existing scorer. Liveness and timeline multiply the score; a zero gate forces Skip. Missing values are rejected before the scorer can apply its defaults.
8. `role_quality` has zero weight in the scorer and is not used here. Wage, funding, full SEC quarters, the unbuilt CLI, and planned generic directories are not dependencies. No source CSV or tracked example output is overwritten.

## Phase gates and hard stops
| Gate | Testable condition against existing paths | Human handoff |
|---|---|---|
| Scope | `scripts/contrib/2026fa/nikam0420-analyst-opt-triage/fixtures/scenarios.json` exists and describes sample-only inputs | Person confirms the fictional case is appropriate; sample execution never authorizes live use |
| Data | Exact unique company row and finite approvals in the shipped CSV; failures exit 2 | Human inspects the extracted fields against the CSV |
| Liveness | Explicit 0/1 input; missing input exits 2; zero forces Skip | Input is simulation only; real use stops until a person checks a current employer posting |
| Timeline | ISO fictional dates and positive integer lag; elapsed or insufficient time forces Skip | Person judges whether the assumed lag is reasonable; real authorization requires advisor confirmation outside this prototype |
| Release | `course/2026fa/submissions/nikam0420/runs/agent-log.json` and `course/2026fa/submissions/nikam0420/runs/human-report.md` exist, with human gate pending | A named person records who/what/when in `logs/runs/2026fa-nikam0420-1.md`; until then no application, outreach, or live run occurs |

Sample arithmetic may run with supplied fictional gates, but the final human gate does not clear itself. Conformance is not a signature. The attestation field remains null.

## Output contract
- Agent JSON: `course/2026fa/submissions/nikam0420/runs/agent-log.json`. Contains mode, source path and SHA-256, evidence per scenario as value/source/provenance objects, conditional decision, composite, pending human gate, next action and existing scorer trace.
- Human Markdown: `course/2026fa/submissions/nikam0420/runs/human-report.md`. Opens with executive summary, then results, verified-versus-assumed boundary, human hard stop, limitations and provenance.
- Supporting engine outputs: roles.json, role-scores.json, role-scores.md in the same output folder. The wrapper report is the primary human output; the engine's Markdown is an unchanged supporting trace.
- Label vocabulary: record, model-judgment, your-input. No model-judgment values are used. Derived decisions inherit the explicitly labeled policy assumptions; arithmetic alone does not make them empirical records.

## Stop conditions and next actions
Missing/ambiguous company, absent approvals, invalid dates, missing liveness, invalid lag or fit: exit nonzero, report BLOCKED, and request correction; do not substitute data. No new outputs are written before all scenarios validate. A blocked rerun leaves prior artifacts intact; never treat those as output from the failed attempt.

Apply: only a conditional engine result; hold for human review, then tailor an application if cleared. Consider: verify specific role sponsorship and posting status before spending tailoring time. Skip with closed posting: skip that application; company evidence may motivate independent networking research. Skip with insufficient assumed time: discuss timing before spending application effort. No automated contact or application occurs.

## Connection to the 3-3-2 day
The recipe takes over checking stored sponsorship fields and scenario timing within the two research-and-apply hours. **Estimate, not measured:** saving 5 minutes for each of 10 researched roles would free 50 minutes per week. A closed-posting rejection can feed the three networking hours only after separate human research. The tested adapter and evidence audit form a small credibility project for the three building hours.

## Run-log template
Use `logs/runs/2026fa-nikam0420-1.md`, following `recipes/_shared.md`'s date/recipe/inputs/outputs/result/open-issues fields. Never edit the shared run log. Include actual command output and a named human gate entry only after that person reviews the run.
