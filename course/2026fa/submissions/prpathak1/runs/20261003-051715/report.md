# Network Engineer H-1B triage — run 20261003-051715

## Executive summary

This report checks 7 job openings for a fictional F-1 student aiming at Network Engineer roles. It asks one main question: has the employer sponsored H-1B visas for network-titled jobs before? 4 opening(s) are worth tailoring an application for, after confirming current sponsorship. 1 employer(s) are worth a networking conversation first, because their posting has not been checked. 1 were skipped. 1 could not be scored, and 1 had no usable sponsorship record. The reason is given for each, and none is treated as a "no". The sponsorship data shows only that an employer sponsored a network title at least once, not that it does now, so no network match is recommended above Consider by the scorer.

## Run record

- Run ID: `20261003-051715` · mode: sample · run date: 2026-10-03 [record]
- Recipe: `recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md` v0.1.0
- Persona: `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/persona.json` · openings: `scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/candidates.json`
- Sponsorship data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30369 rows, sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`)
- Form D: 4 sample files, 200 entries (samples only)
- Scorer: `npm run score -- "course/2026fa/submissions/prpathak1/runs/20261003-051715/roles.json" --profile "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/fixtures/persona.json" --out-dir "course/2026fa/submissions/prpathak1/runs/20261003-051715"`

## Gate results

- **G0 profile pre-check:** passed. Authorization sent: "F-1 student; OPT not yet started; will need H-1B sponsorship" [your-input]; persona needs sponsorship: true [your-input]; scorer read: true [record].
- **G2a timeline inputs:** valid. Program end 2027-05-15, OPT start 2027-06-01, limit 90 days, used 0, hiring lag 60 days [your-input].
- **G2 visa timeline:** OPT window ends 2027-08-30; earliest hire 2026-12-02; slack **271 days** → factor 1 [your-input].
- **G1 liveness:** per opening, below. In this sample run, liveness values come from the fixture and are not checks.

## Consider — tailor and confirm sponsorship

Next action: Tailor the application and confirm current sponsorship with the recruiter or a network contact (2 research-and-apply hours).

- **VERSA NETWORKS INC** — Network Engineer: above threshold (0.450) but one soft spot: sponsorship tier "Likely"
- **NETBRAIN TECHNOLOGIES INC** — Network Engineer, Customer Solutions: above threshold (0.420) but one soft spot: sponsorship tier "Likely"
- **COGNIZER INC** — Network Infrastructure Engineer: above threshold (0.355) but one soft spot: sponsorship tier "Possible"
- **COMPOUND LABS INC** — Network Engineer: above threshold (0.355) but one soft spot: sponsorship tier "Possible"

## Network, do not apply yet

Employers with a network-titled sponsorship record whose posting has not been checked. Next action (the 3 networking hours): find a contact on the network team, ask about hiring and current sponsorship, and check the posting before applying.

- **SKYTAP INC** — Cloud Network Engineer: [G1] no liveness result: posting not checked

## Skip

No action. Skip is a success.

- **SABSE TECHNOLOGIES INC** — Network Engineer: gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes)

## Not scored

Stopped at a gate before scoring; the gate and reason are shown.

- **SKYTAP INC** — Cloud Network Engineer: [G1] no liveness result: posting not checked

## Missing

No usable sponsorship record. This is not a "no sponsor" finding.

- **Example Fictional Netways LLC** — Network Engineer: no row in 80-days CSV for this normalized company name

## Per-opening evidence

| Opening | Status | Approvals | Network titles matched | Tier / p | Fit | Liveness | Timeline | Composite | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| VERSA NETWORKS INC — Network Engineer | scored | 164.0 [record] | Sr. Network Architect; Network Architect [your-input] | Likely / 0.6 [your-input] | 0.8 [your-input] | active [your-input] | 1 [your-input] | 0.45 | **Consider** |
| NETBRAIN TECHNOLOGIES INC — Network Engineer, Customer Solutions | scored | 36.0 [record] | Presales Network Engineer [your-input] | Likely / 0.6 [your-input] | 0.7 [your-input] | active [your-input] | 1 [your-input] | 0.42 | **Consider** |
| SKYTAP INC — Cloud Network Engineer | not_scored (G1) | 10.0 [record] | Engineering Manager, Networking [your-input] | Likely / 0.6 [your-input] | 0.7 [your-input] | — [your-input] | — | — | — |
| SABSE TECHNOLOGIES INC — Network Engineer | scored | 10.0 [record] | Network Engineer [your-input] | Likely / 0.6 [your-input] | 0.6 [your-input] | expired [your-input] | 1 [your-input] | 0 | **Skip** |
| COGNIZER INC — Network Infrastructure Engineer | scored | 328.0 [record] | (none) [your-input] | Possible / 0.5 [your-input] | 0.6 [your-input] | active [your-input] | 1 [your-input] | 0.355 | **Consider** |
| COMPOUND LABS INC — Network Engineer | scored | 2.0 [record] | (none) [your-input] | Possible / 0.5 [your-input] | 0.6 [your-input] | active [your-input] | 1 [your-input] | 0.355 | **Consider** |
| Example Fictional Netways LLC — Network Engineer | missing | — | — | — | — | — | — | — | — |

The CSV row values (approvals, denials, rate, titles) are **record**. Tier and p come from a **your-input** mapping of that row. The scorer trace labels this term `record`, because that is the label the recipe sends.

## Context outside the score

| Opening | CSV company | Denials | Approval rate | Titles sponsored (record) | Form D sample |
|---|---|---|---|---|---|
| VERSA NETWORKS INC | VERSA NETWORKS INC | 2.0 | 98.79518072289156 | Software Test Engineer; Sr. Network Architect; Software Engineer; Network Architect; Information Systems Director | no record in sample data |
| NETBRAIN TECHNOLOGIES INC | NETBRAIN TECHNOLOGIES INC | 4.0 | 90.0 | Support and Services Engineer; Software Engineer; Presales Network Engineer; Senior DevOps Engineer/Infrastructure Engineer | no record in sample data |
| SKYTAP INC | SKYTAP INC | 0.0 | 100.0 | Software Development Engineer II; Engineering Manager, Networking | no record in sample data |
| SABSE TECHNOLOGIES INC | SABSE TECHNOLOGIES INC | 0.0 | 100.0 | Software Engineer; .Net Developer; .NET/GUI WPF Developer; Network Engineer | no record in sample data |
| COGNIZER INC | COGNIZER INC | 8.0 | 97.61904761904762 | Software Developer; SOFTWARE DEVELOPER; Software Engineer; QA ANALYST; CLOUD ENGINEER | no record in sample data |
| COMPOUND LABS INC | COMPOUND LABS INC | 0.0 | 100.0 | Engineer | no record in sample data |
| Example Fictional Netways LLC | (no row) | — | — | — | no record in sample data |

- BLS 15-1241.00 Computer Network Architects: national annual median wage 130390 (OEWS 2024) [record] — context only — not a score term (role_quality weight is 0.0, role-scorer.mjs:37).
- Form D: only sample files ship with the repository; "no record in sample data" never means "not funded".

## Cannot verify

- Per-title counts: how many of a company's approvals were network roles. Only a list of titles exists.
- Dates of sponsorship: the CSV has no dates.
- Current sponsorship: whether the employer sponsors now, or for this opening.
- SOC match: that a title is SOC 15-1241. No title-to-SOC crosswalk exists.
- The H-1B cap lottery: past approvals are not a selection probability.
- Cap-gap timing: whether status and work authorization carry from OPT end to an H-1B start.
- Funding with sample data only: absence from the Form D samples is "no record in sample data", not "not funded".
- Posting liveness in sample mode: fixture values are not checks.
- Entity identity: two employers with the same normalized name, or one employer under two spellings.

## Skip rate

1 of 5 scored openings skipped (20%). A healthy run skips at least half of what it scores.

## Human gate sign-off

- G0 checked by: ____ · date: ____
- G2a / G2 checked by: ____ · date: ____
- G1 (each posting opened and confirmed) by: ____ · date: ____
