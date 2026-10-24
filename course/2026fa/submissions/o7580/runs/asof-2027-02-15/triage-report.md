# Triage report — entry-level software roles for a December-2026 graduate (2027-02-15)

## Executive summary

This report checks 11 software-engineering postings for a fictional international student who finishes a master's degree in 2026-12 and will work on OPT. For each posting it asks two questions. Has this company sponsored work visas for software jobs at a junior level, not only senior ones? And can hiring finish before the student's allowed unemployment time on OPT runs out? It also uses a saved check of whether each posting is still open.

Result: **0 to apply for, 0 to look into first, 7 to skip, and 4 that could not be scored** because a record was missing. Those need a person to check by hand. No numbers were guessed, and no AI judgment was used. The person reading this decides what to do; nothing has been sent anywhere.

## Decisions and next actions

| Role | Decision | Why | Next action |
|---|---|---|---|
| PATHAI INC — Software Engineer I, Fullstack | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| KLAVIYO INC — Software Engineer II - Recommendations | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| COHERE HEALTH INC — Software Engineer II | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| VESTMARK INC — Software Engineer | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| FORMLABS INC — Software Engineer, E-commerce | **Not scored** | liveness-uncertain | HUMAN CHECK: open the posting in a browser and confirm it is live; record the result in the liveness log. |
| GINKGO BIOWORKS INC — Software Engineer 2, Autonomous Lab | **Skip** (0) | override: Posting text states no H-1B sponsorship ("We are unable to sponsor or take over sponsorship of H-1B visas at this time.", read 2026-10-01) [your-input]. A historical approval record does not override a current statement. (machine said Skip: gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes)) | SKIP THIS POSTING: it says it will not sponsor. The company's sponsorship history is real, so if you still want this employer, ask a contact whether the policy is team-specific — during networking hours, not research hours. |
| DATABENTO INC — Software Engineer (TypeScript/JavaScript) | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| LEXINGTON MEDICAL INC — Embedded Software Engineer | **Skip** (0) | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | SKIP: the timeline does not fit the OPT window; do not spend tailoring time. |
| PATHAI INC — DELIBERATELY CONSTRUCTED dead posting URL (gate test, not a real role) | **Not scored** | liveness-uncertain | HUMAN CHECK: open the posting in a browser and confirm it is live; record the result in the liveness log. |
| HubSpot Inc — Software Engineer (company-resolution test) | **Not scored** | no-company-match | HUMAN CHECK: not in the 80 Days CSV — look the employer up on the USCIS H-1B Employer Data Hub by hand before spending time; absence here is not evidence of no sponsorship. |
| DRAFTKINGS INC — Software Engineer (sponsorship-record test) | **Not scored** | no-sponsorship-record, no-liveness-record | HUMAN CHECK: the company is in the CSV but never joined to a DOL/USCIS record — check the USCIS H-1B Employer Data Hub by hand; do NOT treat this as "does not sponsor". / RUN: npm run ats:liveness -- <posting_url>, save the output, re-run this triage. |

## Evidence per role (every value labeled)

### pathai-swe1-fullstack — PATHAI INC
- Company match: PATHAI INC, CAMBRIDGE, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 78 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 78, denials 2, approval rate 97.5 [record]; 5 titles listed; at-level SWE: Software Engineer I; above-level SWE: none [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.7 [your-input — posting asks for a CS degree and full-stack work; no years-of-experience floor stated]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2019-04-09 Series C [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 145600 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.9·0.35 + 0.7·0.3) × 1 × 0 = 0.000`

### klaviyo-swe2-recommendations — KLAVIYO INC
- Company match: KLAVIYO INC, BOSTON, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 154 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 154, denials 4, approval rate 97.46835443037976 [record]; 5 titles listed; at-level SWE: Software Engineer II; above-level SWE: Senior Software Engineer [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.5 [your-input — SWE II level matches ~2 years experience; recommendations/ML domain is a partial match]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2022-07-26 Series C [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 126000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.9·0.35 + 0.5·0.3) × 1 × 0 = 0.000`

### coherehealth-swe2 — COHERE HEALTH INC
- Company match: COHERE HEALTH INC, BOSTON, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 104 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 104, denials 2, approval rate 98.1132075471698 [record]; 5 titles listed; at-level SWE: Software Engineer II; above-level SWE: Senior Software Engineer, Platform [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.6 [your-input — SWE II, independent feature delivery; healthcare domain new to candidate]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2025-05-07 Series C [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 160000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.9·0.35 + 0.6·0.3) × 1 × 0 = 0.000`

### vestmark-swe — VESTMARK INC
- Company match: VESTMARK INC, WAKEFIELD, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 52 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 52, denials 0, approval rate 100 [record]; 2 titles listed; at-level SWE: Software Engineer; above-level SWE: none [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.7 [your-input — posting: internship or project work considered; 'AI tool fluency matters more here than years of experience']
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2017-09-27 Series A [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 117101 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.9·0.35 + 0.7·0.3) × 1 × 0 = 0.000`

### formlabs-swe-ecommerce — FORMLABS INC
- Company match: FORMLABS INC, Somerville, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 70 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 70, denials 10, approval rate 87.5 [record]; 5 titles listed; at-level SWE: Software Engineer; above-level SWE: none [record]
- Fit: 0.2 [your-input — posting requires 4+ years professional experience; candidate has ~2]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- **Missing: liveness-uncertain** — content present but no visible apply control found
- Context only (not in the score): latest funding 2018-07-16 Series A [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 111000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]

### ginkgo-swe2-autonomous-lab — GINKGO BIOWORKS INC
- Company match: GINKGO BIOWORKS INC, BOSTON, MA [record]
- Sponsorship tier: **Possible** [record — sponsors H-1Bs, but no SOC 15-1252 title in the top-titles list] → p 0.3 [your-input: tier map]
  - approvals 122, denials 12, approval rate 91.04477611940298 [record]; 5 titles listed; at-level SWE: none; above-level SWE: none [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Human override: **Skip** — Posting text states no H-1B sponsorship ("We are unable to sponsor or take over sponsorship of H-1B visas at this time.", read 2026-10-01) [your-input]. A historical approval record does not override a current statement.
- Fit: 0.6 [your-input — SWE 2 level; lab-automation domain is new]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2015-07-08 Series C [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 100000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.3·0.35 + 0.6·0.3) × 1 × 0 = 0.000`

### databento-swe-typescript — DATABENTO INC
- Company match: DATABENTO INC, BOSTON, MA [record]
- Sponsorship tier: **Possible** [record — sponsors H-1Bs, but no SOC 15-1252 title in the top-titles list] → p 0.3 [your-input: tier map]
  - approvals 6, denials 0, approval rate 100 [record]; 1 titles listed; at-level SWE: none; above-level SWE: none [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.6 [your-input — TypeScript/JavaScript stack matches; market-data domain is new]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2021-10-28 Series B [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 170000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.3·0.35 + 0.6·0.3) × 1 × 0 = 0.000`

### lexington-embedded-swe — LEXINGTON MEDICAL INC
- Company match: LEXINGTON MEDICAL INC, Bedford, MA [record]
- Sponsorship tier: **Possible** [record — sponsors H-1Bs, but no SOC 15-1252 title in the top-titles list] → p 0.3 [your-input: tier map]
  - approvals 4, denials 0, approval rate 100 [record]; 1 titles listed; at-level SWE: none; above-level SWE: none [record]
- Liveness: active → 1 [record — saved ats:liveness log, run 2026-10-01 (local, America/New_York)]
- Fit: 0.3 [your-input — embedded/firmware focus; candidate is web/full-stack]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- Context only (not in the score): latest funding 2025-04-11 Series B [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 70000 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]
- Scorer arithmetic: `(0.3·0.35 + 0.3·0.3) × 1 × 0 = 0.000`

### pathai-deliberately-dead-url — PATHAI INC
- Company match: PATHAI INC, CAMBRIDGE, MA [record]
- Sponsorship tier: **Proven** [record — at-level SWE title sponsored and approvals 78 ≥ 3] → p 0.9 [your-input: tier map]
  - approvals 78, denials 2, approval rate 97.5 [record]; 5 titles listed; at-level SWE: Software Engineer I; above-level SWE: none [record]
- Fit: 0.8 [your-input — set high on purpose: a closed liveness gate must zero it anyway]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- **Missing: liveness-uncertain** — navigation error: page.goto: Timeout 15000ms exceeded.
- Context only (not in the score): latest funding 2019-04-09 Series C [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) 145600 vs BLS national 15-1252 median 133080 (OEWS 2024) [record]

### hubspot-not-in-csv — HubSpot Inc
- **Missing: no-company-match** — no row normalizes to "HUBSPOT"

### draftkings-no-sponsorship-record — DRAFTKINGS INC
- Company match: DRAFTKINGS INC, Boston, MA [record]
- Fit: 0.6 [your-input — not used — no sponsorship record]
- Timeline: factor 0 [your-input] — expected start 2027-04-01, usable-unemployment deadline 2027-03-21, slack -11 days; hiring lag 45d (scenario default (assumption))
  - gate closed: unemployment-clock-exceeded: expected start 2027-04-01 is after 2027-03-21 (2027-02-15 + 34 usable days)
- **Missing: no-sponsorship-record** — "DRAFTKINGS INC" is in the CSV but has no H-1B approvals field (no DOL/USCIS join)
- **Missing: no-liveness-record** — role has no posting_url
- Context only (not in the score): latest funding 2024-12-03 Series D+ [record, 80 Days snapshot]; Form D sample hits: 0 [record, samples only]; company LCA median salary (all titles) — vs BLS national 15-1252 median 133080 (OEWS 2024) [record]

## What this run could not verify

- Whether the company sponsored junior software roles that are **not** in its top-titles list. The list is truncated, so a "Possible" tier may be too low.
- Anything about companies missing from the 80 Days file, or present but never joined to a visa record. Those are left unscored for a human to check.
- Whether the posting's graduation window, experience cap, and start date were read correctly. A person typed them from the posting text.
- Hiring lag, fit, and the OPT start date. These are the person's own estimates, and EAD processing delays are not modeled.
- What this employer will pay. The salary figures are survey and filing context, not an offer, and they do not affect the decision.

## Run record

- Mode: sample · as-of 2027-02-15 · generated 2026-10-02T00:40:11.558Z
- Scenario: `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.sample.json` · liveness log: `scripts/contrib/2026fa/o7580-decgrad-swe1-sponsor-level/scenarios/boston-decgrad.liveness.log` · CSV rows read: 30369
- Scorer: `scripts/score/role-scorer.mjs` on `course/2026fa/submissions/o7580/runs/asof-2027-02-15/roles.json` — ✓ scored 7 roles → Apply 0 · Consider 0 · Skip 7 (skip 100%)
- Skip rate of scored roles: 1 · model judgments used: 0
- Pending gate: G5 decision handoff: a named human reads triage-report.md and decides; no application is sent by this run
