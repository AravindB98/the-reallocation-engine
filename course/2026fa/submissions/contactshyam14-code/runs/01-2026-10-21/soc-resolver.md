# Early-career PM & supply-chain SOC resolver — run 2026-10-21

## Executive summary

This report takes 9 job postings (2 real, 7 written as samples or break tests) and asks one question the postings never answer: which government occupation code would the employer file this job under? That code sets the official wage floor and decides which of an employer's past visa filings are even relevant. When the plausible codes disagree by more than a set amount, the tool refuses to give a single score and says to ask the recruiter instead.

Result: **0 resolved · 1 refused as ambiguous · 8 stopped** at a gate or for missing data. Nothing is ranked yet, because the work-permit card dates have not been entered — that is a human step, not something this tool can fill in. Every number below is labelled as a record, your input, or a model judgment; missing values are shown as missing.

## Run record

- Tool: `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs` v0.1.0 · as of 2026-10-21 · local-wage script: script
- Thresholds (your-input, from the rules file): wage spread > $10,000 or > 10% · score spread > 0.05 → refuse
- Scorer: `node scripts/score/role-scorer.mjs course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21/roles.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/01-2026-10-21` → ✓ scored 24 roles → Apply 0 · Consider 0 · Skip 24 (skip 100%)
- Visa timeline gate: EAD **STOP** — enter the EAD card's "Valid From" and "Card Expires" dates (and who entered them) — the requested start 2026-12-31 is not the card; if approval comes later the card starts on the approval date. No timeline ranking until then. · STEM **HOLD** — ask your DSO (Northeastern OGS) whether the degree's CIP code is STEM-eligible — this tool draws no conclusion about visa law

| Posting | Kind | Liveness | Scope | Experience (min required) | Degree | Candidate SOCs | Verdict |
|---|---|---|---|---|---|---|---|
| Business Operations Manager, Supply Chain — Zipline | real | uncertain | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only) | 15-1299, 11-3021, 11-3071, 13-1111, 11-1021, 13-1082 | **STOP** at liveness |
| Inventory Planner — RS Group | real | active | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only+equivalent-experience-accepted) | 13-1081, 43-5061, 13-1023 | **AMBIGUOUS-REFUSE** at spread |
| Associate Project Manager - Supply Chain — Northwind Fulfillment (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (2) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071 | **STOP** at liveness |
| Supply Chain Project Manager I — Lakeview Components (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071 | **STOP** at liveness |
| Supply Chain Program Manager, Hardware NPI — Copperline Devices (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (0) | DEGREE-REQUIRED | 13-1082, 13-1081, 11-3071, 15-1299, 11-3021 | **STOP** at liveness |
| Project Manager - Operations — Harborview Logistics (fictional sample) | sample | missing | IN-SCOPE | EXPERIENCE-FIT (2) | DEGREE-REQUIRED | 13-1082, 11-1021 | **STOP** at liveness |
| Supply Chain Manager — Ridgeback Industrial (fictional break test) | break-test | missing | IN-SCOPE | EXPERIENCE-OVER-TARGET (5) | — | — | **STOP** at experience |
| Marketing Coordinator — Bluebird Brands (fictional break test) | break-test | missing | OUT-OF-SCOPE | — | — | — | **STOP** at scope |
| Supply Chain Coordinator — Tidewater Supply (fictional break test) | break-test | missing | IN-SCOPE | EXPERIENCE-FIT (1) | DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only) | 43-5061, 13-1081 | **STOP** at liveness |

## Business Operations Manager, Supply Chain — Zipline (real)

**Verdict: STOP.** liveness gate: content present but no visible apply control found — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: South San Francisco, California, USA → San Francisco-Oakland-Fremont, CA [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "South San Francisco, California, USA" → "San Francisco-Oakland-Fremont, CA" is your-input (no OMB delineation file in the repo)
- Liveness [record]: uncertain — content present but no visible apply control found (from `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt`)
- Scope [model-judgment rule]: IN-SCOPE — title matches "supply chain", "operations manager", "business operations"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 1 year(s) ≤ 2 (matched "1-10+ years" in "You have 1-10+ years of experience in a fast-paced")
  - quoted: "You have 1-10+ years of experience in a fast-paced, high-growth environment in roles such as Managerial Consulting, Data Analytics, Business Information Systems Manager, Technical Program Manager, or supply chain, engineering, or consulting-oriented positions within finance, operations, or manufacturing."
- Degree [model-judgment]: **DEGREE-NOT-REQUIRED** — quoted: "Advanced degree in Supply Chain, Business Analytics, Data Science, Engineering, Mathematics, or related field, with experience in high-tech, aerospace, robotics, or scaling manufacturing environments."
- Pay range in the posting text [record]: $147,800–$285,200
- Third-party claim [your-input, the job board where the posting was found (2026-10-21)]: seniority = "Senior Level, Lead/Staff" — unverified — not from the employer or the repository; CONFLICT: label says "Senior Level, Lead/Staff" but the posting text's minimum required years is 1 ("1-10+ years"). The label is not evidence; the text is.
- Third-party claim [your-input, the job board where the posting was found (2026-10-21)]: pay_range = "$148K-$285K" — unverified — not from the employer or the repository; consistent with the posting text $147,800–$285,200 (within rounding) — the posting text is the record
- Third-party claim [your-input, the job board where the posting was found (2026-10-21)]: h1b_sponsor = "H1B Sponsor Likely" — unverified — not from the employer or the repository; not checkable from the posting text or repository data
- Third-party claim [your-input, the job board where the posting was found (2026-10-21)]: valuation = "Unicorn $7.6B valuation" — unverified — not from the employer or the repository; not checkable from the posting text or repository data
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Zipline", "Zipline International", "Zipline International Inc." (exact normalized-name match only)
  - rejected substring matches (different companies): ZIPLINE AI LTD (via "Zipline"), ZIPLINE MEDICAL INC (via "Zipline")
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 15-1299 | Computer Occupations, All Other (15-1299.09) | 4 | $52,650 / $76,360 / **$108,970** / $147,530 | $100,040 / $157,380 | $86,530 / $136,127 / $170,171 (RPP 115.613) | 0 → 0, Skip | TECH-PROGRAM (business operations, operations manager, text:technical program manager, text:information systems manager, text:system implementations) | none in the truncated sample |
| 11-3021 | Computer and Information Systems Managers (11-3021.00) | 4 | $104,450 / $134,350 / **$171,200** / $216,220 | $182,810 / $221,810 | $158,122 / $191,856 / missing (#) (RPP 115.613) | 0 → 0, Skip | TECH-PROGRAM (business operations, operations manager, text:technical program manager, text:information systems manager, text:system implementations) | none in the truncated sample |
| 11-3071 | Transportation, Storage, and Distribution Managers (11-3071.04) | 4 | $61,200 / $78,360 / **$102,010** / $136,050 | $95,690 / $130,940 | $82,768 / $113,257 / $157,776 (RPP 115.613) | 0 → 0, Skip | SC-MANAGER (supply chain, manager) | none in the truncated sample |
| 13-1111 | Management Analysts (13-1111.00) | 4 | $59,720 / $76,770 / **$101,190** / $133,140 | $91,950 / $128,120 | $79,533 / $110,818 / $144,802 (RPP 115.613) | 0 → 0, Skip | BIZ-OPS (business operations) | none in the truncated sample |
| 11-1021 | General and Operations Managers (11-1021.00) | 4 | $47,420 / $67,160 / **$102,950** / $164,130 | $99,070 / $152,090 | $85,691 / $131,551 / $188,949 (RPP 115.613) | 0 → 0, Skip | OPS-MGR (operations, manager) | none in the truncated sample |
| 13-1082 | Project Management Specialists (13-1082.00) | 4 | $59,830 / $76,950 / **$100,750** / $131,660 | $100,830 / $132,530 | $87,213 / $114,632 / $145,416 (RPP 115.613) | 0 → 0, Skip | BIZ-OPS-PROJECTS (business operations, text:project leadership, text:strategic business projects, text:transformation programs, text:program leadership) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $100,750–$171,200 (spread $70,450, 69.9%); metro adjusted medians $110,818–$191,856 (spread $81,038, 73.1%); scorer vote-sum 0–0
  - national median spread $70,450 (69.9%) exceeds $10,000 or 10%
  - metro median spread $81,038 (73.1%) exceeds $10,000 or 10%

**Flags**
- MANAGER-CODE-AT-EARLY-CAREER (11-3021) [model-judgment]: 11-3021 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title
- MANAGER-CODE-AT-EARLY-CAREER (11-3071) [model-judgment]: 11-3071 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title
- MANAGER-CODE-AT-EARLY-CAREER (11-1021) [model-judgment]: 11-1021 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title
- DEGREE-NOT-REQUIRED [model-judgment]: DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only): specialty-occupation risk — rule inference from the posting text, never a legal conclusion
- NAME-COLLISION-REJECTED [record]: a substring match would have attached ZIPLINE AI LTD, ZIPLINE MEDICAL INC — different companies; not attached
- THIRD-PARTY-CONFLICT [your-input]: seniority: CONFLICT: label says "Senior Level, Lead/Staff" but the posting text's minimum required years is 1 ("1-10+ years"). The label is not evidence; the text is.

## Inventory Planner — RS Group (real)

**Verdict: AMBIGUOUS-REFUSE.** national median spread $23,110 (40.0%) exceeds $10,000 or 10%; metro median spread $21,467 (40.3%) exceeds $10,000 or 10%; missing data (13-1023 (no detailed OEWS row); 13-1023 (no-occupation-row)) can only widen the disagreement, never resolve it. Ask the recruiter or employer which SOC code this role would be filed under (for an H-1B/LCA) before using any wage floor or score for it.

> No single score is given for this posting. Ask the recruiter or employer which SOC code the role would be filed under.

- Place → metro: Fort Worth, TX, 76118 → Dallas-Fort Worth-Arlington, TX [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Fort Worth, TX, 76118" → "Dallas-Fort Worth-Arlington, TX" is your-input (no OMB delineation file in the repo)
- Liveness [record]: active (from `scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/liveness/ats-liveness-2026-10-21.txt`)
- Scope [model-judgment rule]: IN-SCOPE — title matches "inventory", "planner"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 1 year(s) ≤ 2 (matched "1-3 years" in "1-3 years in an inventory management or supply chain related role."); preferred noted: "1-3 years"
  - quoted: "1-3 years in an inventory management or supply chain related role."
- Degree [model-judgment]: **DEGREE-NOT-REQUIRED** — quoted: "Bachelor's degree in Business or a related field; or equivalent combination of education and experience."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "RS Americas", "RS Group", "Allied Electronics", "RS Components" (exact normalized-name match only)
  - rejected substring matches (different companies): CRS GROUP INC (via "RS Group"), GAME CHANGERS GROUP (via "RS Group"), VILLAGE PARTNERS GROUP LLC (via "RS Group")
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $61,530 / $77,110 | $59,686 / $74,799 / $95,101 (RPP 103.09) | 0 → 0, Skip | PLANNER (planner) | none in the truncated sample |
| 43-5061 | Production, Planning, and Expediting Clerks (43-5061.00) | 2 | $38,570 / $46,600 / **$57,770** / $71,480 | $44,010 / $54,980 | $42,691 / $53,332 / $69,017 (RPP 103.09) | 0 → 0, Skip | PLANNER (planner) | none in the truncated sample |
| 13-1023 | Purchasing Agents, Except Wholesale, Retail, and Farm Products (13-1023.00) | 4 | missing: no detailed OEWS row (OEWS publishes 13-1020 Buyers and Purchasing Agents $75,650 — not substituted) | missing: no metro row | missing: no-occupation-row | 0 → 0, Skip | PO-BUYING (planner, text:purchase order, text:purchase orders, text:buying decisions, text:procurement) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $57,770–$80,880 (spread $23,110, 40.0%); metro adjusted medians $53,332–$74,799 (spread $21,467, 40.3%); scorer vote-sum 0–0
  - national median spread $23,110 (40.0%) exceeds $10,000 or 10%
  - metro median spread $21,467 (40.3%) exceeds $10,000 or 10%
  - missing data (13-1023 (no detailed OEWS row); 13-1023 (no-occupation-row)) can only widen the disagreement, never resolve it

**Flags**
- CLERICAL-OR-JZ2-CANDIDATE (43-5061) [model-judgment]: 43-5061 Production, Planning, and Expediting Clerks (job zone 2) — if the role is filed under this code the wage floor drops and the specialty-occupation case is much harder (rule inference, not a legal conclusion)
- DEGREE-NOT-REQUIRED [model-judgment]: DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only+equivalent-experience-accepted): specialty-occupation risk — rule inference from the posting text, never a legal conclusion
- NAME-COLLISION-REJECTED [record]: a substring match would have attached CRS GROUP INC, GAME CHANGERS GROUP, VILLAGE PARTNERS GROUP LLC — different companies; not attached

## Associate Project Manager - Supply Chain — Northwind Fulfillment (fictional sample) (sample)

**Verdict: STOP.** liveness gate: no URL (sample posting) — a missing URL is a hard stop for live status — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: Seattle, WA → Seattle-Tacoma-Bellevue, WA [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Seattle, WA" → "Seattle-Tacoma-Bellevue, WA" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "project manager", "supply chain"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 2 year(s) ≤ 2 (matched "2 years" in "2 years of experience in project management or supply chain operations.")
  - quoted: "2 years of experience in project management or supply chain operations."
- Degree [model-judgment]: **DEGREE-REQUIRED** in engineering or business — quoted: "Bachelor's degree in engineering or business required."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Northwind Fulfillment (fictional sample)" (exact normalized-name match only)
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1082 | Project Management Specialists (13-1082.00) | 4 | $59,830 / $76,950 / **$100,750** / $131,660 | $93,320 / $125,390 | $83,971 / $112,829 / $140,957 (RPP 111.133) | 0 → 0, Skip | PM-GENERIC (project manager) | none in the truncated sample |
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $92,690 / $102,170 | $83,405 / $91,935 / $116,284 (RPP 111.133) | 0 → 0, Skip | SC-PROJECT (project manager, supply chain) | none in the truncated sample |
| 11-3071 | Transportation, Storage, and Distribution Managers (11-3071.04) | 4 | $61,200 / $78,360 / **$102,010** / $136,050 | $106,940 / $138,900 | $96,227 / $124,985 / $154,284 (RPP 111.133) | 0 → 0, Skip | SC-PROJECT (project manager, supply chain); SC-MANAGER (supply chain, manager) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $80,880–$102,010 (spread $21,130, 26.1%); metro adjusted medians $91,935–$124,985 (spread $33,050, 35.9%); scorer vote-sum 0–0
  - national median spread $21,130 (26.1%) exceeds $10,000 or 10%
  - metro median spread $33,050 (35.9%) exceeds $10,000 or 10%

**Flags**
- MANAGER-CODE-AT-EARLY-CAREER (11-3071) [model-judgment]: 11-3071 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title

## Supply Chain Project Manager I — Lakeview Components (fictional sample) (sample)

**Verdict: STOP.** liveness gate: no URL (sample posting) — a missing URL is a hard stop for live status — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: Austin, TX → Austin-Round Rock-San Marcos, TX [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Austin, TX" → "Austin-Round Rock-San Marcos, TX" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "project manager", "supply chain"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 1 year(s) ≤ 2 (matched "1-2 years" in "1-2 years of experience in supply chain")
  - quoted: "1-2 years of experience in supply chain, logistics or project coordination."
- Degree [model-judgment]: **DEGREE-REQUIRED** in supply chain management, industrial engineering, business or a related field — quoted: "Bachelor's degree required in supply chain management, industrial engineering, business or a related field."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Lakeview Components (fictional sample)" (exact normalized-name match only)
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1082 | Project Management Specialists (13-1082.00) | 4 | $59,830 / $76,950 / **$100,750** / $131,660 | $76,620 / $99,350 | $78,131 / $101,309 / $132,645 (RPP 98.066) | 0 → 0, Skip | PM-GENERIC (project manager) | none in the truncated sample |
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $60,990 / $75,290 | $62,193 / $76,775 / $100,534 (RPP 98.066) | 0 → 0, Skip | SC-PROJECT (project manager, supply chain) | none in the truncated sample |
| 11-3071 | Transportation, Storage, and Distribution Managers (11-3071.04) | 4 | $61,200 / $78,360 / **$102,010** / $136,050 | $79,140 / $103,830 | $80,701 / $105,878 / $143,159 (RPP 98.066) | 0 → 0, Skip | SC-PROJECT (project manager, supply chain); SC-MANAGER (supply chain, manager) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $80,880–$102,010 (spread $21,130, 26.1%); metro adjusted medians $76,775–$105,878 (spread $29,103, 37.9%); scorer vote-sum 0–0
  - national median spread $21,130 (26.1%) exceeds $10,000 or 10%
  - metro median spread $29,103 (37.9%) exceeds $10,000 or 10%

**Flags**
- MANAGER-CODE-AT-EARLY-CAREER (11-3071) [model-judgment]: 11-3071 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title

## Supply Chain Program Manager, Hardware NPI — Copperline Devices (fictional sample) (sample)

**Verdict: STOP.** liveness gate: no URL (sample posting) — a missing URL is a hard stop for live status — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: San Jose, CA → San Jose-Sunnyvale-Santa Clara, CA [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "San Jose, CA" → "San Jose-Sunnyvale-Santa Clara, CA" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "program manager", "supply chain"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 0 year(s) ≤ 2 (matched "0-2 years" in "0-2 years of experience in supply chain")
  - quoted: "0-2 years of experience in supply chain, operations or program management (internships count)."
- Degree [model-judgment]: **DEGREE-REQUIRED** in engineering — quoted: "Bachelor's degree in engineering required."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Copperline Devices (fictional sample)" (exact normalized-name match only)
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1082 | Project Management Specialists (13-1082.00) | 4 | $59,830 / $76,950 / **$100,750** / $131,660 | $104,420 / $136,250 | $94,564 / $123,389 / $159,260 (RPP 110.423) | 0 → 0, Skip | PGM-GENERIC (program manager) | none in the truncated sample |
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $89,560 / $121,260 | $81,106 / $109,814 / $137,010 (RPP 110.423) | 0 → 0, Skip | SC-PROJECT (program manager, supply chain) | none in the truncated sample |
| 11-3071 | Transportation, Storage, and Distribution Managers (11-3071.04) | 4 | $61,200 / $78,360 / **$102,010** / $136,050 | $110,630 / $164,180 | $100,187 / $148,683 / $208,426 (RPP 110.423) | 0 → 0, Skip | SC-PROJECT (program manager, supply chain); SC-MANAGER (supply chain, manager) | none in the truncated sample |
| 15-1299 | Computer Occupations, All Other (15-1299.09) | 4 | $52,650 / $76,360 / **$108,970** / $147,530 | $125,250 / $168,070 | $113,427 / $152,206 / $192,406 (RPP 110.423) | 0 → 0, Skip | TECH-PROGRAM (program manager, text:hardware, text:npi, text:new product introduction) | none in the truncated sample |
| 11-3021 | Computer and Information Systems Managers (11-3021.00) | 4 | $104,450 / $134,350 / **$171,200** / $216,220 | $208,400 / missing: top-coded (#: ≥ $239,200/yr) | missing: suppressed-small-sample ⚠ the raw OEWS cell is "#" (top-coded: ≥ $239,200/yr), not a small-sample suppression — the script's reason code mislabels it (logged defect); still missing as a number, never filled | 0 → 0, Skip | TECH-PROGRAM (program manager, text:hardware, text:npi, text:new product introduction) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $80,880–$171,200 (spread $90,320, 111.7%); metro adjusted medians $109,814–$152,206 (spread $42,392, 38.6%); scorer vote-sum 0–0
  - national median spread $90,320 (111.7%) exceeds $10,000 or 10%
  - metro median spread $42,392 (38.6%) exceeds $10,000 or 10%
  - missing data (11-3021 (suppressed-small-sample)) can only widen the disagreement, never resolve it

**Flags**
- MANAGER-CODE-AT-EARLY-CAREER (11-3071) [model-judgment]: 11-3071 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title
- MANAGER-CODE-AT-EARLY-CAREER (11-3021) [model-judgment]: 11-3021 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title

## Project Manager - Operations — Harborview Logistics (fictional sample) (sample)

**Verdict: STOP.** liveness gate: no URL (sample posting) — a missing URL is a hard stop for live status — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: San Francisco, CA → San Francisco-Oakland-Fremont, CA [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "San Francisco, CA" → "San Francisco-Oakland-Fremont, CA" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "project manager"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 2 year(s) ≤ 2 (matched "2+ years" in "2+ years required"); preferred noted: "3+ preferred"
  - quoted: "2+ years required, 3+ preferred, of project management experience in operations or logistics."
- Degree [model-judgment]: **DEGREE-REQUIRED** in business, engineering or a related field — quoted: "Bachelor's degree in business, engineering or a related field required."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Harborview Logistics (fictional sample)" (exact normalized-name match only)
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 13-1082 | Project Management Specialists (13-1082.00) | 4 | $59,830 / $76,950 / **$100,750** / $131,660 | $100,830 / $132,530 | $87,213 / $114,632 / $145,416 (RPP 115.613) | 0 → 0, Skip | PM-GENERIC (project manager) | none in the truncated sample |
| 11-1021 | General and Operations Managers (11-1021.00) | 4 | $47,420 / $67,160 / **$102,950** / $164,130 | $99,070 / $152,090 | $85,691 / $131,551 / $188,949 (RPP 115.613) | 0 → 0, Skip | OPS-MGR (operations, manager) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $100,750–$102,950 (spread $2,200, 2.2%); metro adjusted medians $114,632–$131,551 (spread $16,919, 14.8%); scorer vote-sum 0–0
  - metro median spread $16,919 (14.8%) exceeds $10,000 or 10%

**Flags**
- MANAGER-CODE-AT-EARLY-CAREER (11-1021) [model-judgment]: 11-1021 is a management code on a posting that requires ≤ 2 years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title

## Supply Chain Manager — Ridgeback Industrial (fictional break test) (break-test)

**Verdict: STOP.** EXPERIENCE-OVER-TARGET — minimum required 5 years > 2; not ranked as a target

- Place → metro: Dallas, TX → Dallas-Fort Worth-Arlington, TX [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Dallas, TX" → "Dallas-Fort Worth-Arlington, TX" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "supply chain"
- Experience [model-judgment]: **EXPERIENCE-OVER-TARGET** — minimum required 5 year(s) > 2 (matched "5+ years" in "5+ years required of supply chain management experience")
  - quoted: "5+ years required of supply chain management experience, including people leadership."
- Pay range in the posting text [record]: none stated

## Marketing Coordinator — Bluebird Brands (fictional break test) (break-test)

**Verdict: STOP.** OUT-OF-SCOPE — not scored

- Place → metro: Austin, TX → Austin-Round Rock-San Marcos, TX [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Austin, TX" → "Austin-Round Rock-San Marcos, TX" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: OUT-OF-SCOPE — title matches excluded term(s) "marketing"

## Supply Chain Coordinator — Tidewater Supply (fictional break test) (break-test)

**Verdict: STOP.** liveness gate: no URL (sample posting) — a missing URL is a hard stop for live status — the spread analysis below is shown for information only (AMBIGUOUS-REFUSE)

- Place → metro: Seattle, WA → Seattle-Tacoma-Bellevue, WA [your-input]; metro gate PASS: exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "Seattle, WA" → "Seattle-Tacoma-Bellevue, WA" is your-input (no OMB delineation file in the repo)
- Liveness [your-input]: missing — no URL (sample posting) — a missing URL is a hard stop for live status
- Scope [model-judgment rule]: IN-SCOPE — title matches "supply chain"
- Experience [model-judgment]: **EXPERIENCE-FIT** — minimum required 1 year(s) ≤ 2 (matched "1-2 years" in "1-2 years of experience in a supply chain or logistics role.")
  - quoted: "1-2 years of experience in a supply chain or logistics role."
- Degree [model-judgment]: **DEGREE-NOT-REQUIRED** — quoted: "Bachelor's degree a plus."
- Pay range in the posting text [record]: none stated
- Employer H-1B record [record, `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`]: **MISSING** for "Tidewater Supply (fictional break test)" (exact normalized-name match only)
  - per-SOC H-1B history: the 80 Days file has no SOC/occupation column (columns: company_name, industry, website, city, state, zip_code, phone, year_incorporated, company_age_years, executive_officers, board_directors, total_funding, latest_funding_amount, latest_funding_stage, latest_funding_date, Total Approvals, Total Denials, Approval_Rate, median_salary_offered, top_job_titles_sponsored) — per-SOC H-1B history is MISSING, not approximated

| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |
|---|---|---|---|---|---|---|---|---|
| 43-5061 | Production, Planning, and Expediting Clerks (43-5061.00) | 2 | $38,570 / $46,600 / **$57,770** / $71,480 | $61,200 / $68,930 | $55,069 / $62,025 / $65,318 (RPP 111.133) | 0 → 0, Skip | SC-COORDINATOR (coordinator, supply chain) | none in the truncated sample |
| 13-1081 | Logisticians (13-1081.02) | 4 | $49,260 / $62,920 / **$80,880** / $104,330 | $92,690 / $102,170 | $83,405 / $91,935 / $116,284 (RPP 111.133) | 0 → 0, Skip | SC-COORDINATOR (coordinator, supply chain) | none in the truncated sample |

- Spread check [model-judgment]: **AMBIGUOUS-REFUSE** — national medians $57,770–$80,880 (spread $23,110, 40.0%); metro adjusted medians $62,025–$91,935 (spread $29,910, 48.2%); scorer vote-sum 0–0
  - national median spread $23,110 (40.0%) exceeds $10,000 or 10%
  - metro median spread $29,910 (48.2%) exceeds $10,000 or 10%

**Flags**
- CLERICAL-OR-JZ2-CANDIDATE (43-5061) [model-judgment]: 43-5061 Production, Planning, and Expediting Clerks (job zone 2) — if the role is filed under this code the wage floor drops and the specialty-occupation case is much harder (rule inference, not a legal conclusion)
- DEGREE-NOT-REQUIRED [model-judgment]: DEGREE-NOT-REQUIRED (stated-as-preferred-or-bonus-only): specialty-occupation risk — rule inference from the posting text, never a legal conclusion

## What this run cannot tell you

- Which SOC code an employer will actually file — only the employer or its LCA can say. The candidate list is a keyword inference.
- Per-SOC H-1B history for any employer: the 80 Days file has no SOC column ([TODO] DOL OFLC LCA disclosure data).
- Whether a posting's place is in the stated metro: the repo has no OMB delineation file; the mapping is your-input.
- Typical experience BLS expects for each SOC: not in the repository ([TODO] BLS Employment Projections education/training table).
- Any visa-law conclusion: degree and specialty-occupation flags are rule inferences from posting text; STEM eligibility is a DSO question.
- What a specific employer pays: OEWS is an occupation survey, not an offer.

## Label key

| Label | Meaning |
|---|---|
| record | read from a file or script output in the repository (BLS, BEA, O*NET, 80 Days, saved `ats:liveness` output, a fetched real posting) |
| your-input | entered by the person: metro mapping, thresholds, sample postings, EAD dates, third-party claims copied from a job board |
| model-judgment | a rule written for this mode (keyword tables, experience/degree parsing, flags) or a normalisation choice — readable, but a judgment |
