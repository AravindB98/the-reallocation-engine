# Wage-level lottery check — product roles in SF Bay and Seattle

## Executive summary

**What this is.** A check of live product-manager postings against the U.S. Department of Labor's official wage levels. Since 2026 the H-1B lottery gives a registration 1 to 4 entries depending on which wage level the offered salary reaches, and the level depends on the job code the employer files and the city — neither of which the applicant chooses or sees.

**What it found.** 4 posting-city combinations were checked; 3 could be leveled and 1 was stopped by a check. For the same salary, the number of lottery entries changes with the job code the employer picks: Flexport (Seattle): 2–4 entries at the midpoint; Flexport (San Francisco): 1–4 entries at the midpoint; Asana (San Francisco): 2–4 entries at the midpoint. A shortcut using national pay data disagreed with the official city level in 23 of 54 comparisons; it put the level too high 23 times and too low 0 times. That holds for these postings and job codes only; the national data is also one survey year older than the official table.

**What it cannot tell you.** Your chance of being selected (not computable from this data), which code the employer will actually file, or your final salary. You have 3 lottery season(s) left before your work authorization ends (2030-01-15, assumed).

**What to do with it.** Before accepting an offer, ask the employer's immigration team which job code and wage level they intend to file, and compare it with the tables below.

## Run record

- Recipe: `recipes/cases/2026fa/AdityaHasija37-msis-pm-wage-level.md` v0.1.0 · script `scripts/contrib/2026fa/AdityaHasija37-msis-pm-wage-level/wage_level.py`
- Run date: 2026-10-21 · OFLC extract sha256 `ce8e3eda94a9518a…`
- Level rule in force: **current-2005** — checked 2026-10-21 by Aditya Hasija (AdityaHasija37) (Checked the Federal Register (DOL/ETA, 'prevailing wage', newest first) and the DOL foreign-labor news page: the 2026-03-27 wage-level rule is still a Proposed Rule, with no final rule. Claude (AI agent) had gathered the same evidence earlier through the Federal Register API; the clearance is the person's.)
- Timeline: OPT start 2027-01-15 (your-input) → OPT/STEM OPT end 2030-01-15; seasons: March 2027 (FY2028), March 2028 (FY2029), March 2029 (FY2030)
- SOC candidates (your-input, Aditya Hasija (AdityaHasija37), 2026-10-21 (Gate S)): 11-2021, 11-3021, 13-1111, 15-1211, 15-1299, 15-2051
- Result: 3 leveled · 1 stopped (stop-pay-basis 1) · 54 rows · 0 refused (no OFLC levels) · 0 below Level I

Labels: **record** = read from a dataset; **derived** = arithmetic on records; **proxy** = national approximation, not the legal level; **your-input** = a choice a person made.

## S1 · Verkada — Business Systems - Product Manager

- Posting: <https://job-boards.greenhouse.io/verkada/jobs/5173135007> · liveness **active** (2026-10-21)
- Worksite: San Mateo, CA United States → OFLC area 41860 San Francisco-Oakland-Fremont, CA
- Posted range: $160,000–$180,000 · basis **ote** (confirmed by Aditya Hasija (AdityaHasija37), 2026-10-21, read quoted_text (Gate P)) · quote: “Below is the annual on-target earnings (OTE) range for full-time employees for this position, comprised of base compensation and commissions (if applicable). Estimated Annual Pay Range $160,000 — $180,000 USD”
- 80 Days record: 272 approvals, 4 denials, 98.6% · company-wide median sponsored salary $160,000

**Stopped — stop-pay-basis.** posted range is 'ote', not base salary; the wage level is judged on base wage, so this range cannot be leveled — ask for the base component. No level is shown.

## S2a · Flexport — Senior Product Manager, Commerce

- Posting: <https://job-boards.greenhouse.io/flexport/jobs/8158023> · liveness **active** (2026-10-21)
- Worksite: Bellevue, Washington, United States → OFLC area 42660 Seattle-Tacoma-Bellevue, WA
- Posted range: $174,000–$213,000 · basis **base** (confirmed by Aditya Hasija (AdityaHasija37), 2026-10-21, read quoted_text (Gate P)) · quote: “The US base salary range for this position (this does not include bonus, equity and benefits): $174,000 — $213,000 USD”
- 80 Days record: 312 approvals, 6 denials, 98.1% · company-wide median sponsored salary $190,000

| SOC (employer's choice) | OFLC Level I / II / III / IV (annual) | Low | Mid | High | Entries L/M/H | Mid: to next level | National proxy at Mid (now · proposed) | Cognitive Pivot |
|---|---|---|---|---|---|---|---|---|
| 11-2021 Marketing Managers | $111,842 / $150,925 / $190,008 / $229,091 | II | III | III | 2/3/3 | +$35,591 → IV | III–IV · I–III | 3.974 |
| 11-3021 Computer and Information Systems Managers | $146,453 / $188,718 / $230,963 / $273,229 | I | II | II | 1/2/2 | +$37,463 → III | III–IV · I–III ⚠ disagrees | 3.834 |
| 13-1111 Management Analysts | $83,054 / $106,059 / $129,064 / $152,069 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.013 |
| 15-1211 Computer Systems Analysts | $86,715 / $110,427 / $134,160 / $157,872 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.024 |
| 15-1299 Computer Occupations, All Other | $74,568 / $104,978 / $135,408 / $165,818 | IV | IV | IV | 4/4/4 | at top level | IV · IV | — |
| 15-2051 Data Scientists | $93,912 / $127,026 / $160,118 / $193,232 | III | IV | IV | 3/4/4 | at top level | IV · III–IV | — |

National proxy vs the official level, all three offer points: disagrees 6/18 (too high 6, too low 0); the ⚠ column shows the midpoint only.
Spread across SOC codes (entries): low 1–4 · mid 2–4 · high 2–4
`0*` = below Level I: at that salary the offer does not meet the prevailing wage for that code. Cognitive Pivot `—` = the repo extract has no score for that occupation; no sub-occupation's score is substituted.

## S2b · Flexport — Senior Product Manager, Commerce

- Posting: <https://job-boards.greenhouse.io/flexport/jobs/8158023> · liveness **active** (2026-10-21)
- Worksite: San Francisco, California, United States → OFLC area 41860 San Francisco-Oakland-Fremont, CA
- Posted range: $174,000–$213,000 · basis **base** (confirmed by Aditya Hasija (AdityaHasija37), 2026-10-21, read quoted_text (Gate P)) · quote: “The US base salary range for this position (this does not include bonus, equity and benefits): $174,000 — $213,000 USD”
- 80 Days record: 312 approvals, 6 denials, 98.1% · company-wide median sponsored salary $190,000

| SOC (employer's choice) | OFLC Level I / II / III / IV (annual) | Low | Mid | High | Entries L/M/H | Mid: to next level | National proxy at Mid (now · proposed) | Cognitive Pivot |
|---|---|---|---|---|---|---|---|---|
| 11-2021 Marketing Managers | $148,387 / $191,942 / $235,477 / $279,032 | I | II | II | 1/2/2 | +$41,977 → III | III–IV · I–III ⚠ disagrees | 3.974 |
| 11-3021 Computer and Information Systems Managers | $167,565 / $208,104 / $248,643 / $289,182 | I | I | II | 1/1/2 | +$14,604 → II | III–IV · I–III ⚠ disagrees | 3.834 |
| 13-1111 Management Analysts | $73,258 / $105,165 / $137,093 / $169,000 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.013 |
| 15-1211 Computer Systems Analysts | $95,930 / $120,536 / $145,163 / $169,770 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.024 |
| 15-1299 Computer Occupations, All Other | $80,870 / $121,014 / $161,138 / $201,282 | III | III | IV | 3/3/4 | +$7,782 → IV | IV · IV ⚠ disagrees | — |
| 15-2051 Data Scientists | $110,386 / $142,438 / $174,512 / $206,565 | II | III | IV | 2/3/4 | +$13,065 → IV | IV · III–IV ⚠ disagrees | — |

National proxy vs the official level, all three offer points: disagrees 10/18 (too high 10, too low 0); the ⚠ column shows the midpoint only.
Spread across SOC codes (entries): low 1–4 · mid 1–4 · high 2–4
`0*` = below Level I: at that salary the offer does not meet the prevailing wage for that code. Cognitive Pivot `—` = the repo extract has no score for that occupation; no sub-occupation's score is substituted.

## S3 · Asana — Senior Product Manager, AI Studio

- Posting: <https://www.asana.com/jobs/apply/8180874?gh_jid=8180874> · liveness **active** (2026-10-21)
- Worksite: San Francisco → OFLC area 41860 San Francisco-Oakland-Fremont, CA
- Posted range: $202,000–$230,000 · basis **base** (confirmed by Aditya Hasija (AdityaHasija37), 2026-10-21, read quoted_text (Gate P)) · quote: “For this role, the estimated base salary range is between $202,000 - $230,000.”
- 80 Days record: 352 approvals, 14 denials, 96.2% · company-wide median sponsored salary $171,000

| SOC (employer's choice) | OFLC Level I / II / III / IV (annual) | Low | Mid | High | Entries L/M/H | Mid: to next level | National proxy at Mid (now · proposed) | Cognitive Pivot |
|---|---|---|---|---|---|---|---|---|
| 11-2021 Marketing Managers | $148,387 / $191,942 / $235,477 / $279,032 | II | II | II | 2/2/2 | +$19,477 → III | IV · III–IV ⚠ disagrees | 3.974 |
| 11-3021 Computer and Information Systems Managers | $167,565 / $208,104 / $248,643 / $289,182 | I | II | II | 1/2/2 | +$32,643 → III | III–IV · I–III ⚠ disagrees | 3.834 |
| 13-1111 Management Analysts | $73,258 / $105,165 / $137,093 / $169,000 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.013 |
| 15-1211 Computer Systems Analysts | $95,930 / $120,536 / $145,163 / $169,770 | IV | IV | IV | 4/4/4 | at top level | IV · IV | 4.024 |
| 15-1299 Computer Occupations, All Other | $80,870 / $121,014 / $161,138 / $201,282 | IV | IV | IV | 4/4/4 | at top level | IV · IV | — |
| 15-2051 Data Scientists | $110,386 / $142,438 / $174,512 / $206,565 | III | IV | IV | 3/4/4 | at top level | IV · IV | — |

National proxy vs the official level, all three offer points: disagrees 7/18 (too high 7, too low 0); the ⚠ column shows the midpoint only.
Spread across SOC codes (entries): low 1–4 · mid 2–4 · high 2–4
`0*` = below Level I: at that salary the offer does not meet the prevailing wage for that code. Cognitive Pivot `—` = the repo extract has no score for that occupation; no sub-occupation's score is substituted.

## What this cannot tell you

- Which SOC code the employer will actually file. The candidate list is the student's judgment, not a record.
- The final base salary. Offer points are the posted range's low, midpoint and high, not an offer.
- Selection probability. Entries are known; the number of competing registrations at each level is not in the repo.
- Whether the proposed 2026 DOL level rule has been finalized after the rule-check date.
- How a below-Level-I wage (e.g., a private wage survey) or an OFLC 'High Wage' row is treated in the weighted lottery.
- Whether another employer also registers the student at a lower level (USCIS then uses the lowest level).
- E-Verify enrollment of the employer (required for STEM OPT) and degree relatedness of the role.
- Whether the worksite in the posting is where the person will actually work (remote/hybrid changes the area).
- Fee and entry policy: Proclamation 11069 (FR 2026-19554; $100,000 entry payment extended to 2027-09-21) and the DHS proposed $103,265 cap-petition fee (FR 2026-17324, proposed only), as of 2026-10-21 — not modeled.

Selection probability is deliberately absent. Entries are a weight, not a chance.

## Release gate

A named person reads this report, including the section above, before using it in any conversation with an employer. Record who and when in the run log.

