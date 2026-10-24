## 2026-10-21 — SWE/AI/DevOps skill gap for the fictional persona Aarav Patel: duplicates dropped, visa deadline, liveness checked

- **Recipe:** `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-skill-gap.md` v0.2.0 (DRAFT, 4 TODOs open)
- **Inputs:** `SKILL_GAP_DATE=2026-10-19 PYTHON=/opt/anaconda3/bin/python3 bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh`
  (the 2026-10-19 fetch, no new network call; taxonomy v0.1.1; `--min-sample 20`; the run.sh
  defaults for the fictional persona Aarav Patel, `search/examples/aarav-patel/`: profile
  `profile/aarav-patel.json`, 14 skills from his résumé; EAD start 2026-07-01, OPT end 2029-06-30,
  0 of 150 unemployment days; `--learn-days 90`). Then `npm run ats:liveness -- <5 URLs>`
  (2026-10-21 15:24 EDT, the 5 non-senior DevOps postings).
- **Outputs:** `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run/` (all files
  regenerated), `.../liveness/liveness-check.txt`, `.../liveness/posting-urls.csv`,
  `.../liveness/greenhouse-api-check.txt`, `.../liveness/gate-decisions.csv`.
- **Result:** 4,745 postings → 573 kept (32 no description, 2,407 not US, 1,705 no family, 28
  duplicates). SWE 414 (83 non-senior), AI 129 (24), DevOps 30 (5): all `ranked`.
  `status=compared`, exit 0. Timeline gate `open`: deadline 2027-03-20, set by the 150-day STEM
  unemployment limit, 150 days left. Core skills: distributed systems, observability, Python.
  Evidence coverage of the top 15: SWE 42%, DevOps 34% (51% with one-company skills set aside), AI 24%.
  Liveness: 4 active, 0 expired, 1 uncertain (MongoDB, Site Reliability Engineer 3; Greenhouse API
  still lists it, HTTP 200).
- **Gate decisions:** G3 passed by the monitor for all three families. G5 `open` on the persona's
  dates. G4: 4 postings cleared by the checker; the MongoDB `uncertain` result cleared as live by
  Yash Saraf on 2026-10-21 after opening the page (inbuilt apply page; asks for 3+ years),
  `liveness/gate-decisions.csv`.
- **Checks:** Kubernetes in DevOps recounted by hand, 19 of 30 (matches). Exclusions + kept =
  4,745. No duplicate descriptions remain (414 / 129 / 30). Break tests: `--min-sample 40` → DevOps
  `insufficient_sample`; OPT end 2026-01-01 → `stopped`, exit 3; 100 of 150 days used → 50 days,
  `apply_with_what_you_have`; no date → exit 2; monitor without `--taxonomy` → `ENOENT`, exit 1.
  Offline tests: 20 OK. Reproduced in a fresh clone with only the submitted files and that day's
  fetch: 4,757 → 580 kept, same core skills, coverage 42% / 24% / 34%, exit 0 (not committed).
- **Changes since entry 3:** word-for-word duplicate postings dropped; the timeline gate counts down
  to the earlier of the OPT end and the unemployment limit (90, or 150 on STEM OPT) instead of a
  placeholder date; the report shows non-senior counts and marks one-company gaps ⚠; the G4 text says
  it is a human step, not enforced by code; the tracked profile and dates are the fictional
  persona's, because DATA_CONTRACT forbids real immigration details and profiles (my own stay in
  `private/`).
- **Open issues:** monitor default-taxonomy path bug (`%20`); 22 of 40 sponsors have no
  Greenhouse/Lever board; liveness isn't a pipeline step; the title-based seniority rule misses
  levels (of 5 "non-senior" DevOps postings, Stripe asks 8+ years, MongoDB 3+), and whether to rank
  on entry-level postings only is undecided; the coverage number doesn't adjust for one-company skills.
