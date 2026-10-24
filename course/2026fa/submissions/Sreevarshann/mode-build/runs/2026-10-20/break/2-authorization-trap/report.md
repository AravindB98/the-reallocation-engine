# Data/ML Engineer sponsor-and-SOC evidence pass

## Executive summary

This is the evidence report for one run of a job-search check built for a new graduate on a student visa targeting Data Engineer and Machine Learning Engineer roles. It looked at 6 target companies and asked, for each: does the company have a recorded history of visa sponsorship, have its sponsored job titles included data or ML work, what does the government's occupation data say about the occupations those roles are usually filed under, and is the job posting still live.

Read it before spending application time on these companies. Of 6 companies, 0 have enough evidence to be scored, 0 are on hold until a posting is checked, and 0 are blocked because the sponsorship evidence is missing or the company name matched more than one record. The persona's visa timeline leaves room to keep applying. Which occupation code a company actually files these roles under could not be checked: that needs government filing records this project does not have yet, so it is shown as proposed, never as a finding. Title matches and occupation codes are judgments, labelled as such.

**Run stopped or gated:** authorization string would make the scorer treat this sponsorship-needing persona as not needing sponsorship

## Run record

- Run date: 2026-10-20 · mode: sample · recipe version 0.1.0 · exit code 4
- Persona (fictional): Priya Nair (break test: trap) · needs sponsorship: True
- Timeline gate: 56 days remaining (90 − 34 used) vs buffer 20 → factor 1 (your-input; user's formula)
- targets: `course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv`
- persona: `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/break/inputs/persona-trap.yml`
- liveness_output: `course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt`
- posting_checks: `course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv`
- sponsor_csv: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- bls_csv: `data/bls/compact/soc_occupation_compact.csv`
- Form D: 200 companies across 4 shipped sample files (labelled sample)

Labels: **record** = read from a data file or tool output · **model-judgment** = a judgment (keyword match, title→SOC) · **your-input** = supplied or defined by the user · **proposed** = a check that has not run · **sample** = from the 200-company Form D sample.

## Per-company evidence

| # | Company | Status | Sponsor tier (record) | Approvals / denials / rate % (record) | Company-wide median salary (record) | DE/ML title on record (judgment) | Candidate SOC (judgment) | Per-employer SOC | Liveness |
|---|---|---|---|---|---|---|---|---|---|
| r1 | Reddit | **stopped** | proven | 408 / 12 / 97.1 | 220,000 | yes | 15-1252, 15-2051 | proposed (not run) | open (record) |
| r2 | Discord | **stopped** | proven | 122 / 0 / 100.0 | 218,000 | yes | 15-1252, 15-2051 | proposed (not run) | open (record) |
| r3 | Sigma Computing | **stopped** | proven | 136 / 0 / 100.0 | 150,000 | yes | 15-1243, 15-1252 | proposed (not run) | open (record) |
| r4 | Formlabs | **stopped** | likely | 70 / 10 / 87.5 | 111,000 | no | — | proposed (not run) | open (your-input) |
| r5 | Brex | **stopped** | not_found | — / — / — | — | n/a (no sponsor record) | — | proposed (not run) | held |
| r6 | Twilio | **stopped** | proven | 802 / 20 / 97.6 | 160,000 | yes | 15-1252, 15-2051 | proposed (not run) | closed (record) |

Reasons (every reason that applies; the status column shows the most severe):

- r1 Reddit:
  - stopped: authorization trap: run stopped before scoring
- r2 Discord:
  - stopped: authorization trap: run stopped before scoring
- r3 Sigma Computing:
  - stopped: authorization trap: run stopped before scoring
- r4 Formlabs:
  - stopped: authorization trap: run stopped before scoring
- r5 Brex:
  - stopped: authorization trap: run stopped before scoring
  - blocked: missing evidence: not_found (no exact normalized-name match in the sponsorship dataset)
  - held: liveness held: ats:liveness result: uncertain; awaiting a human posting check
- r6 Twilio:
  - stopped: authorization trap: run stopped before scoring
  - note: liveness gate closed (ats:liveness result: expired); the scorer will Skip it

## Matched sponsored titles (judgment)

- Reddit: "Software Engineer, Machine Learning" ← keywords machine learning → candidate SOC 15-1252, 15-2051
- Discord: "Software Engineer, Machine Learning" ← keywords machine learning → candidate SOC 15-1252, 15-2051
- Sigma Computing: "Senior Analytics Engineer" ← keywords analytics engineer → candidate SOC 15-1243, 15-1252
- Twilio: "Machine Learning Engineer (L2)" ← keywords machine learning → candidate SOC 15-1252, 15-2051

## Occupation data for candidate SOC codes (record; national, not employer pay)

| SOC | O*NET code | Title | Job zone | National median wage | Cognitive-pivot score |
|---|---|---|---|---|---|
| 15-1252 | 15-1252.00 | Software Developers | 4 | 133,080 | 3.834 |
| 15-2051 | 15-2051.00 | Data Scientists | 4 | 112,590 | missing |
| 15-2051 | 15-2051.01 | Business Intelligence Analysts | 4 | 112,590 | 3.903 |
| 15-2051 | 15-2051.02 | Clinical Data Managers | 4 | 112,590 | 3.738 |
| 15-1243 | 15-1243.00 | Database Architects | 4 | 135,980 | 3.933 |
| 15-1243 | 15-1243.01 | Data Warehousing Specialists | 4 | 135,980 | 3.626 |

## Funding (report only; the scorer has no funding term)

| # | Company | Latest funding date (record) | Latest funding stage (record) | Form D sample |
|---|---|---|---|---|
| r1 | Reddit | 2021-08-11 | Series D+ | not in sample |
| r2 | Discord | 2023-01-17 | Series B | not in sample |
| r3 | Sigma Computing | 2024-04-05 | Series D+ | not in sample |
| r4 | Formlabs | 2018-07-16 | Series A | not in sample |
| r5 | Brex | — | — | not in sample |
| r6 | Twilio | 2021-07-14 | Series D+ | not in sample |

## What this run cannot verify

- Which SOC code each employer files Data/ML roles under, and how many filings per code: [TODO: DATA SOURCE] DOL OFLC LCA disclosure data (per-filing employer, job title, SOC code, wage). Not in the repo; this check has not run.
- Whether a sponsored title in the dataset is the same role as the posting; the dataset lists titles with no counts or dates.
- Which fiscal years the approval and denial counts cover; the dataset does not say.
- What an employer pays for a role: the salary figure is company-wide, and the occupation wages are national.
- Form D funding for companies outside the 200-company sample.
- Role quality in the score: the scorer weights role quality at 0 and reads no occupation data.
- Seniority: the mode does not read a posting's seniority, and fit is a neutral constant, so a Senior posting scores the same as an entry-level one for a new-graduate persona.

