# Analyst OPT triage — one-page card

## Executive summary
This card explains a small application triage demonstration for an international MSIS student targeting data analyst roles. It exposes recorded company evidence and assumed posting/timing inputs so a person can spend research time carefully. The result is conditional: one Consider and two Skip scenarios, with human review still pending.

**Recipe:** `recipes/cases/2026fa/nikam0420-analyst-opt-triage.md` · Version 0.1.0 · Sample only.

**Use when:** planning a search around graduation and comparing whether a fictional posting and assumed hiring timeline deserve more research.

**Run:** `python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py`

**Record:** exact company row, aggregate Total Approvals and stored sponsored-title list from the shipped CSV. Not independently revalidated current DOL records.

**Your input:** frozen fictional dates, hiring lag, simulated posting liveness, self-rated fit and the binary sponsorship-presence policy. They are assumptions, not measured probabilities.

**Hard stops:** missing/duplicate company, blank approvals, missing liveness, invalid dates or lag. Closed liveness or insufficient time means Skip. No real application until a person reviews the report and records a named gate decision.

**Outputs:** `course/2026fa/submissions/nikam0420/runs/agent-log.json` for agents; `course/2026fa/submissions/nikam0420/runs/human-report.md` for people; supporting unchanged engine trace beside them.

**Cannot establish:** current sponsorship willingness, sponsorship for this exact role/SOC, an actual live vacancy, legal visa deadlines, wage quality, funding adequacy or a hiring guarantee.

**Next:** Consider → verify posting and specific sponsorship, then decide whether to tailor. Closed posting → skip application, possibly research networking. Short timeline → inspect assumptions and seek timing clarification. Human owns every real action.

**3-3-2 estimate:** 5 minutes × 10 roles = 50 minutes/week potentially freed from research; not benchmarked. The audit itself is a credibility project.
