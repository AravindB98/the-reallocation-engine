# Sponsorship-by-title run report

## Executive summary

**What this is.** The result of checking 15 sample job postings against each employer's history of visa-sponsored job titles, to see whether the employer has sponsored *entry-level data* jobs before — not just any job — and passing that judgment to the project's existing role scorer.

**Why read it.** It shows which postings are worth tailoring an application for, which were stopped before scoring and why, and exactly which evidence and which of your own rules produced each recommendation.

**What it found.** 12 postings were scored: **2 Apply, 8 Consider, 2 Skip** (skip rate 17% of scored; the engine treats at least 50% as healthy). 2 stopped because the company name could not be matched to exactly one employer in the data; a person has to resolve these. 1 were refused because a required date or posting-status value was missing; the scorer would otherwise have silently assumed the best case. 2 scored posting(s) are at employers with no sponsorship record at all. No record is not evidence that they don't sponsor. All of the 12 scored postings would need the employer to accept a start 61 days after the offer, because work authorization begins later; that is noted, not penalized. For 7 scored posting(s), the employer has sponsored data jobs, but not this kind of data job, so the match is at company level only. PATHAI INC and PATHRAI INC carry identical sponsorship evidence; it may belong to only one of them.

**How the sample relates to all employers in the data.** Share of all employers in each group: no sponsorship record 94.9%; sponsor, but no data titles 4.3%; entry-level data title and enough approvals 0.33%; entry-level data title but few approvals 0.14%; only mid-level data titles 0.05%; only senior data titles 0.31%.

The sample is stratified (2 per group), so its skip rate is not representative; 94.9% of CSV companies are in the no-record group.

The sponsorship scores are ordered labels from your own rules, not probabilities. Fit and posting status were not measured in this sample: fit is held constant and every posting is assumed live. The next action for each posting is advice from your own rules; it never changes the recommendation.

---

## Run record

- Run: `2026-10-03T18:13:45Z` · mode: sample (offline) · status: **completed-with-stops** · exit code 3
- Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`) — record
- Wage context: `data/bls/compact/soc_occupation_compact.csv` (1016 rows) — record
- Sample: seed 42, 2 per evidence group (your-input); evidence-group sizes in the CSV {'no-record': 28812, 'no-data-title': 1309, 'proven': 99, 'entry-under-min-approvals': 41, 'only-mid': 14, 'only-senior': 94} (record)
- Population share by evidence group (record, from the CSV group sizes): no-record 28812 (94.9%) · no-data-title 1309 (4.3%) · proven 99 (0.33%) · entry-under-min-approvals 41 (0.14%) · only-mid 14 (0.05%) · only-senior 94 (0.31%)
- Timeline note (your-input, non-scoring; applies to 12 of 12 scored postings, because hiring_lag_days is one global value): deferred start: employer must accept a start 61 days after offer (projected 2026-12-02, opt_start 2027-02-01)
- Scorer: `npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/score` → exit 0 (unmodified)
- Scorer weights used: {'sponsorship': 0.35, 'fit': 0.3, 'role_quality': 0} · apply threshold 0.3 · consider floor 0.2 — record
- Labels: **record** = read from a repo data file or returned by the scorer; **your-input** = Meena's rule or value; **model-judgment** = not used in this run.

## Scored postings

| Posting | Employer (matched) | Rec | Composite | Evidence group (your-input) | Next action (your-input) | Sponsorship tier · p (your-input) | Evidence (record) | Timeline (your-input) | BLS context (record) |
|---|---|---|---|---|---|---|---|---|---|
| Machine Learning Engineer I | ENTRUPY INC | **Apply** | 0.395 | proven | Tailor an application (research-and-apply hours). | Proven · 0.7 (proven) | 10 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Data Analyst | DISQO INC | **Apply** | 0.395 | proven | Tailor an application (research-and-apply hours). | Proven · 0.7 (proven) | 24 approvals / 2 denials | 1.0 (deferred) | no SOC row |
| Data Engineer I | CARGO CHIEF ACQUISITION INC | **Consider** | 0.325 | entry-under-min-approvals | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | possible · 0.5 (otherwise) | 2 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Associate AI Engineer | BIOME ANALYTICS INC | **Consider** | 0.325 | entry-under-min-approvals | Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring. | possible · 0.5 (otherwise) | 2 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Junior Business Intelligence Analyst | PATHAI INC | **Consider** | 0.325 | only-mid | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | possible · 0.5 (otherwise) | 78 approvals / 2 denials | 1.0 (deferred) | 15-2051 Business Intelligence Analysts $112,590 |
| Data Scientist I | PATHRAI INC | **Consider** | 0.325 | only-mid | They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team. | possible · 0.5 (otherwise) | 78 approvals / 2 denials | 1.0 (deferred) | 15-2051 Data Scientists $112,590 |
| Associate Machine Learning Engineer | ROKU INC | **Consider** | 0.325 | only-senior | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | possible · 0.5 (otherwise) | 654 approvals / 4 denials | 1.0 (deferred) | no SOC row |
| Junior Data Analyst | CAMBRIDGE MOBILE TELEMATICS INC | **Consider** | 0.325 | only-senior | They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring. | possible · 0.5 (otherwise) | 72 approvals / 0 denials | 1.0 (deferred) | no SOC row |
| Associate Data Scientist | AKOYA BIOSCIENCES INC | **Consider** | 0.255 | no-data-title | They sponsor, but not data roles. Low priority: network only through a warm contact. | possible · 0.3 (no-data-title) | 26 approvals / 0 denials | 1.0 (deferred) | 15-2051 Data Scientists $112,590 |
| Business Intelligence Analyst | IMMUNITYBIO INC | **Consider** | 0.255 | no-data-title | They sponsor, but not data roles. Low priority: network only through a warm contact. | possible · 0.3 (no-data-title) | 20 approvals / 0 denials | 1.0 (deferred) | 15-2051 Business Intelligence Analysts $112,590 |
| Data Analyst I | RELATIONSHIP SCIENCE LLC | **Skip** | 0.150 | no-record | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | unknown · — (no-record) | no sponsorship record | 1.0 (deferred) | no SOC row |
| Junior Data Engineer | BLUE OWL CAPITAL INC | **Skip** | 0.150 | no-record | No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring. | unknown · — (no-record) | no sponsorship record | 1.0 (deferred) | no SOC row |

### Why each one scored as it did

#### Data Analyst I — RELATIONSHIP SCIENCE LLC

- Company match (record): input `RELATIONSHIP SCIENCE LLC` → `RELATIONSHIP SCIENCE LLC` (NEW YORK, NY) by rule **exact-upper-case**
- Sponsored titles (record): none — **no record ≠ does not sponsor**
- Sponsorship term (your-input): rule `no-record` → tier `unknown`, p — (the scorer drops a null vote; it is not zero)
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.3) × 1 × 1 = 0.150` → **Skip** — composite 0.150 < 0.2 — time is better spent elsewhere
- Evidence group (your-input): no-record
- Next action (your-input; evidence group: no-record): No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring.

#### Junior Data Engineer — BLUE OWL CAPITAL INC

- Company match (record): input `BLUE OWL CAPITAL INC` → `BLUE OWL CAPITAL INC` (New York, NY) by rule **exact-upper-case**
- Sponsored titles (record): none — **no record ≠ does not sponsor**
- Sponsorship term (your-input): rule `no-record` → tier `unknown`, p — (the scorer drops a null vote; it is not zero)
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.3) × 1 × 1 = 0.150` → **Skip** — composite 0.150 < 0.2 — time is better spent elsewhere
- Evidence group (your-input): no-record
- Next action (your-input; evidence group: no-record): No record is not evidence of non-sponsorship. Verify sponsorship through networking before tailoring.

#### Associate Data Scientist — AKOYA BIOSCIENCES INC

- Company match (record): input `AKOYA BIOSCIENCES INC` → `AKOYA BIOSCIENCES INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Sponsored titles (record): `Senior Research Associate`, `Sr. Product Manager, PhenoCycler Instruments` — none is a data-family title under your allowlist
- Sponsorship term (your-input): rule `no-data-title` → tier `possible`, p 0.3
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` → **Consider** — composite 0.255 in the Consider band [0.2, 0.3)
- Evidence group (your-input): no-data-title
- Next action (your-input; evidence group: no-data-title): They sponsor, but not data roles. Low priority: network only through a warm contact.

#### Business Intelligence Analyst — IMMUNITYBIO INC

- Company match (record): input `IMMUNITYBIO INC` → `IMMUNITYBIO INC` (SAN DIEGO, CA) by rule **exact-upper-case**
- Sponsored titles (record): `Application Systems Analyst-Dynamics AX `, `Senior Statistical Programmer`, `Research Associate II` — none is a data-family title under your allowlist
- Sponsorship term (your-input): rule `no-data-title` → tier `possible`, p 0.3
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.3·0.35 + 0.5·0.3) × 1 × 1 = 0.255` → **Consider** — composite 0.255 in the Consider band [0.2, 0.3)
- Evidence group (your-input): no-data-title
- Next action (your-input; evidence group: no-data-title): They sponsor, but not data roles. Low priority: network only through a warm contact.

#### Machine Learning Engineer I — ENTRUPY INC

- Company match (record): input `ENTRUPY INC` → `ENTRUPY INC` (NEW YORK, NY) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Engineer` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` → **Apply** — composite 0.395 ≥ 0.3, gates healthy
- Evidence group (your-input): proven
- Next action (your-input; evidence group: proven): Tailor an application (research-and-apply hours).
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Machine Learning Engineer I' vs sponsored data titles ['Data Engineer']. This does not show the company sponsored this specific title.

#### Data Analyst — DISQO INC

- Company match (record): input `DISQO INC` → `DISQO INC` (GLENDALE, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Analyst ` → entry-or-unmarked (unmarked); `Senior Data Analyst ` → senior (senior)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` → **Apply** — composite 0.395 ≥ 0.3, gates healthy
- Evidence group (your-input): proven
- Next action (your-input; evidence group: proven): Tailor an application (research-and-apply hours).

#### Data Engineer I — CARGO CHIEF ACQUISITION INC

- Company match (record): input `CARGO CHIEF ACQUISITION INC` → `CARGO CHIEF ACQUISITION INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): entry-under-min-approvals
- Next action (your-input; evidence group: entry-under-min-approvals): Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Data Engineer I' vs sponsored data titles ['Machine Learning Engineer']. This does not show the company sponsored this specific title.

#### Associate AI Engineer — BIOME ANALYTICS INC

- Company match (record): input `BIOME ANALYTICS INC` → `BIOME ANALYTICS INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Software Data Engineer ` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): entry-under-min-approvals
- Next action (your-input; evidence group: entry-under-min-approvals): Thin evidence (fewer than the minimum approvals). Confirm sponsorship with a recruiter or employee before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Associate AI Engineer' vs sponsored data titles ['Software Data Engineer ']. This does not show the company sponsored this specific title.

#### Junior Business Intelligence Analyst — PATHAI INC

- Company match (record): input `PATHAI INC` → `PATHAI INC` (CAMBRIDGE, MA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer III` → senior (level iii); `Senior Machine Learning Engineer ` → senior (senior); `Machine Learning Engineer II` → mid (level ii)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-mid
- Next action (your-input; evidence group: only-mid): They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Junior Business Intelligence Analyst' vs sponsored data titles ['Machine Learning Engineer III', 'Senior Machine Learning Engineer ', 'Machine Learning Engineer II']. This does not show the company sponsored this specific title.
- Note, duplicate-evidence (record; does not affect the score): Identical sponsorship evidence (approvals, denials, rate, median salary, title list) for PATHAI INC and PATHRAI INC. The evidence may belong to only one of them.

#### Data Scientist I — PATHRAI INC

- Company match (record): input `PATHRAI INC` → `PATHRAI INC` (MOUNTAIN VIEW, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Machine Learning Engineer III` → senior (level iii); `Senior Machine Learning Engineer ` → senior (senior); `Machine Learning Engineer II` → mid (level ii)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-mid
- Next action (your-input; evidence group: only-mid): They sponsor data roles at mid level. Network: ask whether they hire and sponsor new grads into this team.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Data Scientist I' vs sponsored data titles ['Machine Learning Engineer III', 'Senior Machine Learning Engineer ', 'Machine Learning Engineer II']. This does not show the company sponsored this specific title.
- Note, duplicate-evidence (record; does not affect the score): Identical sponsorship evidence (approvals, denials, rate, median salary, title list) for PATHAI INC and PATHRAI INC. The evidence may belong to only one of them.

#### Associate Machine Learning Engineer — ROKU INC

- Company match (record): input `ROKU INC` → `ROKU INC` (SARATOGA, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Senior Data Scientist` → senior (senior); `Senior Data Engineer` → senior (senior)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-senior
- Next action (your-input; evidence group: only-senior): They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Associate Machine Learning Engineer' vs sponsored data titles ['Senior Data Scientist', 'Senior Data Engineer']. This does not show the company sponsored this specific title.

#### Junior Data Analyst — CAMBRIDGE MOBILE TELEMATICS INC

- Company match (record): input `CAMBRIDGE MOBILE TELEMATICS INC` → `CAMBRIDGE MOBILE TELEMATICS INC` (CAMBRIDGE, MA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Principal Data Scientist I` → senior (principal)
- Sponsorship term (your-input): rule `otherwise` → tier `possible`, p 0.5
- Fit (your-input): 0.5 — held constant to isolate the sponsorship signal
- Liveness (your-input): 1.0 — determined by: assumed, not checked
- Timeline (your-input): projected_start = as_of 2026-10-03 + hiring_lag_days 60 = 2026-12-02; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-02 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.5·0.35 + 0.5·0.3) × 1 × 1 = 0.325` → **Consider** — above threshold (0.325) but one soft spot: sponsorship tier "possible"
- Evidence group (your-input): only-senior
- Next action (your-input; evidence group: only-senior): They sponsor only senior data roles. Network, don't apply cold: ask about entry-level sponsorship before tailoring.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'Junior Data Analyst' vs sponsored data titles ['Principal Data Scientist I']. This does not show the company sponsored this specific title.

## Sample by evidence group

| Evidence group | Companies in CSV (record) | Sample postings scored |
|---|---|---|
| no-record | 28812 | RELATIONSHIP SCIENCE LLC (Skip); BLUE OWL CAPITAL INC (Skip) |
| no-data-title | 1309 | AKOYA BIOSCIENCES INC (Consider); IMMUNITYBIO INC (Consider) |
| proven | 99 | ENTRUPY INC (Apply); DISQO INC (Apply) |
| entry-under-min-approvals | 41 | CARGO CHIEF ACQUISITION INC (Consider); BIOME ANALYTICS INC (Consider) |
| only-mid | 14 | PATHAI INC (Consider); PATHRAI INC (Consider) |
| only-senior | 94 | ROKU INC (Consider); CAMBRIDGE MOBILE TELEMATICS INC (Consider) |

## Stopped at the company-match gate

A person must pick the right row or confirm the company is not in the data. Nothing was guessed.

| Posting | Input name | Reason | Candidates (name, city, state) |
|---|---|---|---|
| Data Analyst I | Quillfeather Data Labs, Inc. | no-match | — |
| Associate Data Scientist | Arcturus Therapeutics | more-than-one-row | ARCTURUS THERAPEUTICS INC (SAN DIEGO, CA); ARCTURUS THERAPEUTICS LTD (SAN DIEGO, CA) |

## Refused: missing gate value

These were never sent to the scorer, because it treats a missing value as the best case (1.0).

| Posting | Employer | Missing |
|---|---|---|
| Junior Data Engineer | CENTIFIC GLOBAL SOLUTIONS INC | liveness.factor missing or not numeric |

## Caveats

- A title with no level marker is counted as entry-or-unmarked. Unmarked is not proof of entry level.
- Sponsorship data is per company; the sponsored-title list is the only role-level signal, and it is a short list of free text.
- Approval rate measures how often filed petitions were approved, not whether this employer will file for you.
- Wage context is the national median for the matching occupation title only; it does not affect scoring.
- A company-level data-family match does not show the employer sponsored the specific posting title.

