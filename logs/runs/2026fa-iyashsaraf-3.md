## 2026-10-19 — SWE/AI/DevOps skill gap at H-1B sponsors, first real run

- **Recipe:** `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-skill-gap.md` v0.1.0 (DRAFT, 4 TODOs open)
- **Inputs:** `PYTHON=/opt/anaconda3/bin/python3 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh`
  (reads `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`; taxonomy
  `swe-ai-devops-skills` v0.1.1, 68 skills; an evidence profile of my own skills, 24 skills;
  `--min-sample 20`; `--opt-end-date 2027-03-15` placeholder, `--learn-days 90`). Postings fetched
  2026-10-19 15:39 EDT from Greenhouse and Lever for the top 40 sponsors by approvals, kept in
  `private/real-postings/skill-gap/postings-2026-10-19.json`.
- **Outputs:** `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/`: `sponsors.json`,
  `sponsors.txt`, `families-summary.json`, `{swe,ai,devops}/skill-demand.{json,md}`,
  `skill-gap.json`, `skill-gap.md`.
- **Result:** 30,369 CSV rows → 600 sponsors with a target title → top 40 fetched → 18 boards
  found (DocuSign with 0 jobs) → 4,745 postings → 601 kept (32 no description, 2,407 not US,
  1,705 no family). SWE 438, AI 132, DevOps 31: all `ranked`. `status=compared`, exit 0.
  Timeline gate `open` (147 days to the placeholder). Core skills: distributed systems,
  observability, Python. Evidence coverage was computed against my own profile (now in `private/`,
  see below).
- **Gate decisions:** G3 (sample size) passed by the monitor for all three families. G5 (timeline)
  `open` on the placeholder date. G4 (liveness) not exercised: no posting was applied to from this
  report.
- **Checks:** Kubernetes in DevOps recounted by hand, 20 of 31 (matches). Exclusions + kept =
  4,745 (matches). Break tests: `--min-sample 40` → DevOps `insufficient_sample`, comparison on 2
  families; `--opt-end-date 2026-01-01` → `stopped`, exit 3; monitor without `--taxonomy` →
  `ENOENT` (spaces in path), exit 1.
- **Changes during the run:** Greenhouse scraper patched to fetch descriptions (before: 4,851 of
  5,066 postings had none). Taxonomy v0.1.0 → v0.1.1 (added OpenTelemetry). My own profile was
  corrected after checking my repos.
- **Open issues:** monitor default-taxonomy path bug (`%20`); 22 of 40 sponsors have no
  Greenhouse/Lever board; no liveness re-check step; seniority isn't shown in the report
  (26 of 31 DevOps postings are senior). DevOps has only 5 non-senior postings, below the
  20-posting gate.
- **Edited 2026-10-21, before any PR:** this run used a profile of my own skills, which counts as a
  real person's profile under DATA_CONTRACT §Zero-Conditions. The profile, its coverage numbers and
  my own version of the run moved to `private/`; entry 4 reruns the mode for the fictional persona
  Aarav Patel.
