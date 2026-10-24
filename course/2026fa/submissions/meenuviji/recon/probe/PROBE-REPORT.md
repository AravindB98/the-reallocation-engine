# PROBE-REPORT — Phase 1b feasibility probe (throwaway)

Generated 2026-10-03T16:49:35Z by `probe.py` in this folder. Every number below was computed by that script; nothing is estimated. Contact/person fields were never printed.

## A. `top_job_titles_sponsored` (rows with sponsorship data)

- 80 Days rows total: 30369; rows with non-empty `top_job_titles_sponsored`: 1557

### A1. Parse with `ast.literal_eval`
- parsed OK: 1557; failed: 0

### A2. List length distribution
- min 1, max 14; longer than 5 ever? **YES**
| length | companies |
|---|---|
| 1 | 867 |
| 2 | 281 |
| 3 | 113 |
| 4 | 68 |
| 5 | 186 |
| 6 | 14 |
| 7 | 5 |
| 8 | 4 |
| 9 | 3 |
| 10 | 11 |
| 11 | 2 |
| 12 | 1 |
| 13 | 1 |
| 14 | 1 |

- total title strings: 3319; distinct (exact string): 2063

### A3. TEMPORARY keyword rule — company-level counts
Rule applied exactly as specified: case-insensitive **raw substring** on the title, no padding. Consequences visible in A4: `sr` also matches inside words (e.g. `SRE`), `head` inside `ahead`, `data` inside `database`/`metadata`; ` bi `/` ml `/` ai ` (space-delimited) cannot match at the very start or end of a title.

| measure | companies |
|---|---|
| companies with ≥1 data-family title | 421 |
| …whose data-family titles are ALL senior | 171 |
| …with ≥1 NON-senior data-family title | 250 |

- data-family title strings (raw rule): 558 of 3319. Side measurement, NOT the rule: if the title were space-padded at both ends, 569 would match (11 more).
- which senior keywords fired on data-family titles (a title can fire several):
| keyword | hits |
|---|---|
| senior | 124 |
| manager | 57 |
| sr | 28 |
| roman-end | 27 |
| staff | 19 |
| lead | 15 |
| principal | 13 |
| director | 9 |
| vp | 2 |

### A4. 25 random data-family titles (seed 42) — judge the rule by hand
| # | title | label | senior keywords hit |
|---|---|---|---|
| 1 | Machine Learning Engineer | non-senior | — |
| 2 | Senior Business and Data Analyst | senior | senior |
| 3 | Sr. Manager, Global Market Research, Insights and Analytics | senior | sr, manager |
| 4 | Data Scientist | non-senior | — |
| 5 | Senior Engineering Manager, Data Engineering | senior | senior, manager |
| 6 | Data Engineer | non-senior | — |
| 7 | Sr. Business Systems Analyst - GTM | senior | sr |
| 8 | Data Analyst | non-senior | — |
| 9 | PRINCIPAL DATA SCIENTIST | senior | principal |
| 10 | Product Support Analyst | non-senior | — |
| 11 | Software Engineer, Sr. Analyst | senior | sr |
| 12 | Reserving Actuarial Analyst | non-senior | — |
| 13 | Sr. Manager, Analytics | senior | sr, manager |
| 14 | Data Scientist | non-senior | — |
| 15 | Analytics Engineer | non-senior | — |
| 16 | Software Engineer, Data | non-senior | — |
| 17 | Professional 3, Business Analytics | non-senior | — |
| 18 | Data Analyst, Catastrophe Modeling | non-senior | — |
| 19 | Financial Analyst  | non-senior | — |
| 20 | Machine Learning Engineer | non-senior | — |
| 21 | IT Service Management Analyst | non-senior | — |
| 22 | Senior Quality Control Analyst | senior | senior |
| 23 | Senior Data Scientist - Marketplace Optimization | senior | senior |
| 24 | Data Scientist | non-senior | — |
| 25 | Data Scientist, Advanced Analytics | non-senior | — |

Sampling is over title occurrences (a title that appears at many companies is proportionally more likely).

### A4b. 30 most common data-family titles (exact string)
| title | count | label |
|---|---|---|
| Data Scientist | 44 | non-senior |
| Machine Learning Engineer | 20 | non-senior |
| Data Engineer | 20 | non-senior |
| Senior Data Scientist | 14 | senior |
| Senior Machine Learning Engineer | 13 | senior |
| Senior Data Engineer | 11 | senior |
| Business Analyst | 8 | non-senior |
| Data Analyst | 7 | non-senior |
| Database Administrator | 5 | non-senior |
| Senior Data Analyst | 5 | senior |
| Business Intelligence Engineer | 4 | non-senior |
| Financial Analyst | 4 | non-senior |
| Staff Data Scientist | 4 | senior |
| Data Engineer II | 4 | senior |
| Manager, Data Engineering | 4 | senior |
| Senior Business Analyst | 4 | senior |
| Staff Data Engineer | 4 | senior |
| Analytics Engineer | 4 | non-senior |
| Machine Learning Engineer II | 4 | senior |
| Business Intelligence Analyst | 3 | non-senior |
| Machine Learning Engineer III | 3 | senior |
| Marketing Analytics Manager | 3 | senior |
| DATA SCIENTIST | 3 | non-senior |
| Business Systems Analyst | 3 | non-senior |
| Senior Financial Analyst | 3 | senior |
| Data Scientist  | 3 | non-senior |
| Data Science Engineer | 3 | non-senior |
| Sr. Data Engineer | 3 | senior |
| Lead Data Scientist | 3 | senior |
| Data Analyst II | 3 | senior |

### A5. Approvals among companies with ≥1 data-family title
| stat | Total Approvals |
|---|---|
| n | 421 |
| min | 2.0 |
| Q1 | 6.0 |
| median | 22.0 |
| Q3 | 72.0 |
| max | 12226.0 |

- unparseable Total Approvals in this group: 0
- companies with Approval_Rate = 100 **and** Total Approvals ≤ 3: **68** of 421
- quartiles: Python `statistics.quantiles(n=4, method='inclusive')`.

## B. BLS compact rows matching data-family keywords
Keywords (case-insensitive substring on `title` or `alternate_titles_sample`): data scientist, data analyst, business intelligence, data engineer, data warehous, database architect, machine learning, statistician

| onet_soc_code | bls_soc_code | title | annual_median_wage | keywords hit | matched in |
|---|---|---|---|---|---|
| 11-9041.00 | 11-9041 | Architectural and Engineering Managers | 167740.0 | data engineer | alt-titles only |
| 13-1071.00 | 13-1071 | Human Resources Specialists | 72910.0 | business intelligence | alt-titles only |
| 13-2099.01 | 13-2099 | Financial Quantitative Analysts | 80190.0 | data analyst | alt-titles only |
| 15-1242.00 | 15-1242 | Database Administrators | 104620.0 | data engineer | alt-titles only |
| 15-1243.00 | 15-1243 | Database Architects | 135980.0 | data analyst, data engineer, database architect | title |
| 15-1243.01 | 15-1243 | Data Warehousing Specialists | 135980.0 | data engineer, data warehous | title |
| 15-2041.00 | 15-2041 | Statisticians | 103300.0 | data analyst, statistician | title |
| 15-2041.01 | 15-2041 | Biostatisticians | 103300.0 | statistician | title |
| 15-2051.00 | 15-2051 | Data Scientists | 112590.0 | data scientist, data analyst | title |
| 15-2051.01 | 15-2051 | Business Intelligence Analysts | 112590.0 | data analyst, business intelligence | title |
| 15-2051.02 | 15-2051 | Clinical Data Managers | 112590.0 | data analyst | alt-titles only |
| 15-2099.01 | 15-2099 | Bioinformatics Technicians | 71490.0 | data analyst | alt-titles only |
| 19-1029.01 | 19-1029 | Bioinformatics Scientists | 93330.0 | data analyst | alt-titles only |
| 19-3022.00 | 19-3022 | Survey Researchers | 63380.0 | data analyst | alt-titles only |
| 19-4061.00 | 19-4061 | Social Science Research Assistants | 58040.0 | data analyst | alt-titles only |
| 51-8099.01 | 51-8099 | Biofuels Processing Technicians | 61710.0 | data scientist | alt-titles only |

- rows matched: 16 of 1016
- note: `alternate_titles_sample` holds only a sample of alternate titles (column name), so absence here is not proof of absence in O*NET.

## C. Form D samples
- records: 200

### C1. `company.industry`
| industry | records |
|---|---|
| Pooled Investment Fund | 128 |
| Other | 18 |
| Other Technology | 16 |
| Commercial | 11 |
| Other Real Estate | 7 |
| REITS and Finance | 3 |
| Other Banking and Financial Services | 2 |
| Biotechnology | 2 |
| Telecommunications | 2 |
| Investing | 2 |
| Manufacturing | 1 |
| Insurance | 1 |
| Other Health Care | 1 |
| Business Services | 1 |
| Oil and Gas | 1 |
| Other Travel | 1 |
| Residential | 1 |
| Retailing | 1 |
| Pharmaceuticals | 1 |

### C2. `company.entity_type`
| entity_type | records |
|---|---|
| Limited Partnership | 85 |
| Limited Liability Company | 61 |
| Corporation | 37 |
| Other | 16 |
| Business Trust | 1 |

### C3. Name match: Form D `company_name_normalized` vs normalized 80 Days names
80 Days normalization: upper-case → punctuation to spaces → drop trailing tokens in {INC, LLC, CORP, CORPORATION, LTD, CO, LP} repeatedly → lower-case alphanumeric-only. Suffixes are removed as whole words *before* joining, mirroring `normalize_company_name` in `scripts/sec/sec-all-quarters.py`, so a name like `COSTCO` is not cut to `cost`.

- 80 Days distinct normalized keys: 30158 from 30369 names; keys shared by >1 company: 210
- distinct Form D normalized keys: 196 (from 200 records)
- **matches: 14** (pairs); with sponsorship data: **1**

| Form D name | company_name_normalized | 80 Days name | sponsorship? | Total Approvals | Approval_Rate |
|---|---|---|---|---|---|
| DICKERSON PIKE LLC | dickersonpike | DICKERSON PIKE LLC | no | — | — |
| COMPOSABL, INC. | composabl | COMPOSABL INC | no | — | — |
| MAP THE SKY LLC | mapthesky | MAP THE SKY LLC | no | — | — |
| Foundation LLM Technologies, Inc. | foundationllmtechnologies | FOUNDATION LLM TECHNOLOGIES INC | no | — | — |
| 13G30 London Ltd Liability Co | 13g30londonltdliability | 13G30 LONDON LTD LIABILITY CO | no | — | — |
| STOP COLLABORATE LISTEN, LLC | stopcollaboratelisten | STOP COLLABORATE LISTEN LLC | no | — | — |
| Laminr Technologies, Inc. | laminrtechnologies | LAMINR TECHNOLOGIES INC | no | — | — |
| RunBuggy OMI, Inc. | runbuggyomi | RUNBUGGY OMI INC | no | — | — |
| Navi AI, Inc. | naviai | NAVI AI INC | no | — | — |
| Blossom BH OpCo Inc. | blossombhopco | BLOSSOM BH OPCO INC | no | — | — |
| Databricks, Inc. | databricks | DATABRICKS INC | YES | 1640.0 | 99.51456310679612 |
| Crypto Co | crypto | CRYPTO CO | no | — | — |
| BG Holding Co LLC | bgholding | BG HOLDING CO LLC | no | — | — |
| Gearflow Inc. | gearflow | GEARFLOW INC | no | — | — |

