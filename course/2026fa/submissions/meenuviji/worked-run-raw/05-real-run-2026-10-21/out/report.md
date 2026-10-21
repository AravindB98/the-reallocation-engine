# Sponsorship-by-title run report

## Executive summary

**What this is.** The result of checking 5 sample job postings against each employer's history of visa-sponsored job titles, to see whether the employer has sponsored *entry-level data* jobs before — not just any job — and passing that judgment to the project's existing role scorer.

**Why read it.** It shows which postings are worth tailoring an application for, which were stopped before scoring and why, and exactly which evidence and which of your own rules produced each recommendation.

**What it found.** 4 postings were scored: **1 Apply, 0 Consider, 3 Skip** (skip rate 75% of scored; the engine treats at least 50% as healthy). 1 stopped because the company name could not be matched to exactly one employer in the data; a person has to resolve these. All of the 4 scored postings would need the employer to accept a start 43 days after the offer, because work authorization begins later; that is noted, not penalized. For 3 scored posting(s), the employer has sponsored data jobs, but not this kind of data job, so the match is at company level only.

The sponsorship scores are ordered labels from your own rules, not probabilities. Fit and posting status were not measured in this sample: fit is held constant and every posting is assumed live. The next action for each posting is advice from your own rules; it never changes the recommendation.

---

## Run record

- Run: `2026-10-21T17:45:39Z` · mode: sample (offline) · status: **completed-with-stops** · exit code 3
- Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, SHA-256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`) — record
- Wage context: `data/bls/compact/soc_occupation_compact.csv` (1016 rows) — record
- Sample: seed None, None per evidence group (your-input); evidence-group sizes in the CSV None (record)
- Timeline note (your-input, non-scoring; applies to 4 of 4 scored postings, because hiring_lag_days is one global value): deferred start: employer must accept a start 43 days after offer (projected 2026-12-20, opt_start 2027-02-01)
- Scorer: `npm run score -- course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/out/roles.json --out-dir course/2026fa/submissions/meenuviji/worked-run-raw/05-real-run-2026-10-21/out/score` → exit 0 (unmodified)
- Scorer weights used: {'sponsorship': 0.35, 'fit': 0.3, 'role_quality': 0} · apply threshold 0.3 · consider floor 0.2 — record
- Labels: **record** = read from a repo data file or returned by the scorer; **your-input** = Meena's rule or value; **model-judgment** = not used in this run.

## Scored postings

| Posting | Employer (matched) | Rec | Composite | Evidence group (your-input) | Next action (your-input) | Sponsorship tier · p (your-input) | Evidence (record) | Timeline (your-input) | BLS context (record) |
|---|---|---|---|---|---|---|---|---|---|
| Senior Data Scientist, People Analytics & Research | AIRBNB INC | **Apply** | 0.395 | proven | Tailor an application (research-and-apply hours). | Proven · 0.7 (proven) | 1000 approvals / 10 denials | 1.0 (deferred) | 15-2051 Data Scientists $112,590 |
| None | AIRBNB INC | **Skip** | 0.000 | proven | Skip: liveness closed. | Proven · 0.7 (proven) | 1000 approvals / 10 denials | 1.0 (deferred) | no SOC row |
| None | AIRBNB INC | **Skip** | 0.000 | proven | Skip: liveness closed. | Proven · 0.7 (proven) | 1000 approvals / 10 denials | 1.0 (deferred) | no SOC row |
| None | ZOOX INC | **Skip** | 0.000 | proven | Skip: liveness closed. | Proven · 0.7 (proven) | 1364 approvals / 10 denials | 1.0 (deferred) | no SOC row |

### Why each one scored as it did

#### Senior Data Scientist, People Analytics & Research — AIRBNB INC

- Company match (record): input `AIRBNB INC` → `AIRBNB INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Scientist` → entry-or-unmarked (unmarked); `Senior Data Scientist` → senior (senior)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant; no rating rubric yet (proposed addition 5)
- Liveness (record): 1.0 — determined by: npm run ats:liveness, 2026-10-21, course/2026fa/submissions/meenuviji/worked-run-raw/04-liveness-real-airbnb.txt
- Timeline (your-input): projected_start = as_of 2026-10-21 + hiring_lag_days 60 = 2026-12-20; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-20 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 1 × 1 = 0.395` → **Apply** — composite 0.395 ≥ 0.3, gates healthy
- Evidence group (your-input): proven
- Next action (your-input; evidence group: proven): Tailor an application (research-and-apply hours).

#### None — AIRBNB INC

- Company match (record): input `AIRBNB INC` → `AIRBNB INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Scientist` → entry-or-unmarked (unmarked); `Senior Data Scientist` → senior (senior)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant; no rating rubric yet (proposed addition 5)
- Liveness (record): 0.0 — determined by: npm run ats:liveness, 2026-10-21, course/2026fa/submissions/meenuviji/worked-run-raw/04-liveness-real-airbnb.txt
- Timeline (your-input): projected_start = as_of 2026-10-21 + hiring_lag_days 60 = 2026-12-20; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-20 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 0 × 1 = 0.000` → **Skip** — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
- Evidence group (your-input): proven
- Next action (your-input; gate closed: liveness): Skip: liveness closed.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'None' vs sponsored data titles ['Data Scientist', 'Senior Data Scientist']. This does not show the company sponsored this specific title.

#### None — AIRBNB INC

- Company match (record): input `AIRBNB INC` → `AIRBNB INC` (SAN FRANCISCO, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Scientist` → entry-or-unmarked (unmarked); `Senior Data Scientist` → senior (senior)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant; no rating rubric yet (proposed addition 5)
- Liveness (record): 0.0 — determined by: npm run ats:liveness, 2026-10-21, course/2026fa/submissions/meenuviji/worked-run-raw/04-liveness-real-airbnb.txt
- Timeline (your-input): projected_start = as_of 2026-10-21 + hiring_lag_days 60 = 2026-12-20; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-20 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 0 × 1 = 0.000` → **Skip** — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
- Evidence group (your-input): proven
- Next action (your-input; gate closed: liveness): Skip: liveness closed.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'None' vs sponsored data titles ['Data Scientist', 'Senior Data Scientist']. This does not show the company sponsored this specific title.

#### None — ZOOX INC

- Company match (record): input `ZOOX INC` → `ZOOX INC` (MENLO PARK, CA) by rule **exact-upper-case**
- Data-family sponsored titles (record title → your-input bucket): `Data Engineer` → entry-or-unmarked (unmarked)
- Sponsorship term (your-input): rule `proven` → tier `Proven`, p 0.7
- Fit (your-input): 0.5 — held constant; no rating rubric yet (proposed addition 5)
- Liveness (record): 0.0 — determined by: npm run ats:liveness, 2026-10-21, course/2026fa/submissions/meenuviji/worked-run-raw/03-liveness-real.txt
- Timeline (your-input): projected_start = as_of 2026-10-21 + hiring_lag_days 60 = 2026-12-20; window_end = opt_start 2027-02-01 + window_days 90 = 2027-05-02 (inclusive); 2026-12-20 <= 2027-05-02 -> factor 1.0
- Scorer arithmetic (record): `(0.7·0.35 + 0.5·0.3) × 0 × 1 = 0.000` → **Skip** — gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)
- Evidence group (your-input): proven
- Next action (your-input; gate closed: liveness): Skip: liveness closed.
- Note, title-family (your-input; does not affect the score): Company-level data-family match only: posting title 'None' vs sponsored data titles ['Data Engineer']. This does not show the company sponsored this specific title.

## Sample by evidence group

| Evidence group | Companies in CSV (record) | Sample postings scored |
|---|---|---|

## Stopped at the company-match gate

A person must pick the right row or confirm the company is not in the data. Nothing was guessed.

| Posting | Input name | Reason | Candidates (name, city, state) |
|---|---|---|---|
| None | openings (Greenhouse board slug; employer not recorded) | no-match | — |

## Refused: missing gate value

None.

## Caveats

- A title with no level marker is counted as entry-or-unmarked. Unmarked is not proof of entry level.
- Sponsorship data is per company; the sponsored-title list is the only role-level signal, and it is a short list of free text.
- Approval rate measures how often filed petitions were approved, not whether this employer will file for you.
- Wage context is the national median for the matching occupation title only; it does not affect scoring.
- A company-level data-family match does not show the employer sponsored the specific posting title.

