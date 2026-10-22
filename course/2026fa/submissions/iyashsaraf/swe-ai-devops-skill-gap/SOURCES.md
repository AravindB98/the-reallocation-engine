# SOURCES — swe-ai-devops-skill-gap

## Executive summary

This lists what the mode was built from: the data, the repo tools it reuses, the job boards it
read, and who did what between me and the AI agent that wrote the code. The short version: the AI
wrote the code and documents and ran the commands. I chose the mode and its scope, decided what
counts as my evidence, made the predictions, and approved each step.

## Repository and governance

- The Reallocation Engine, by Nik Bear Brown: https://github.com/nikbearbrown/the-reallocation-engine
- Read before building: `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `recipes/_shared.md`,
  `recipes/skill-demand-monitor.md` and its card.

## Data

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, shipped with the
  repo (80 Days to Stay: company H-1B approvals, denials, sponsored titles).
- Job postings from the public Greenhouse (`boards-api.greenhouse.io`) and Lever (`api.lever.co`)
  board APIs, fetched 2026-10-19 for the top 40 sponsors in `run/sponsors.txt`. They are kept only
  in `private/real-postings/skill-gap/` (gitignored). Tracked files hold counts, job ids and public
  posting URLs only.
- The course's fictional persona Aarav Patel, shipped with the repo: `search/examples/aarav-patel/profile.yml`
  (visa dates) and `resume.example.json` (skills, used for `profile/aarav-patel.json`). No real
  person's profile or visa dates are in this submission (DATA_CONTRACT §Zero-Conditions).
- The unemployment limit on post-completion OPT (90 days, 150 with the STEM extension):
  8 CFR 214.2(f)(10)(ii)(E).
- Five public job pages checked for liveness on 2026-10-21 (Stripe, Twilio, Zscaler, MongoDB, Zoox);
  the exact URLs are in `scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/liveness/posting-urls.csv`.

## Tools reused, not reimplemented

- `scripts/ats/fetch-real-postings.py` and its Greenhouse and Lever scrapers: the fetch.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`): the liveness check, run as-is; its
  output is saved unedited in `liveness/liveness-check.txt`.
- `scripts/score/skill-demand-monitor.mjs` (`npm run skill-demand`): every skill count, run once
  per family. This mode never re-counts skills itself; the tests run the real monitor too.
- The repo's `ai-engineering-skills` taxonomy v0.1.0: its 36 skills are copied unchanged into
  this mode's 68-skill list.
- `scripts/conformance.mjs`, `scripts/pii-scan.mjs`, `scripts/doctor.mjs`, `npm run verify`: run
  as-is.

## Declared patch to one maintained file

`scripts/ats/scrapers/greenhouse/scraper.py`: it now requests `?content=true` and fills
`description_text`. Without it, every Greenhouse posting arrived with no description. Details and
before/after counts are in `WORKED-RUN.md`.

## AI contribution vs. what I personally decided, checked, changed, or rejected

Claude Code (Claude Opus) explored the repo, wrote all of the code (`families.py`,
`select_sponsors.py`, `split_families.py`, `compare_families.py`, `run.sh`, the tests and fixtures),
wrote the Greenhouse patch, drafted the taxonomy, the persona's evidence profile, the recipe and card,
`DOMAIN-JUSTIFICATION.md`, `WORKED-RUN.md` and the run log, and ran every command shown in them on
my machine.

What I decided:

- **The mode.** I rejected the first idea, a funded-DevOps-startup list. Its filtered list was
  only about 400 companies, which I didn't think gave useful data. I chose the skill-gap mode
  instead, then widened it from DevOps alone to my three target families: software engineer, AI
  engineer and DevOps.
- **My own evidence.** I decided which of my own skills count, and checked them against my repos.
  That profile and my own run stay in `private/`. I guessed observability postings would ask for
  Prometheus and Grafana rather than a cloud provider's monitoring, and the postings were checked.
- **The fictional persona.** When the DATA_CONTRACT check showed my real visa dates and profile
  can't be in tracked files, I agreed to switch the tracked run to Aarav Patel and to re-cut the
  branch before opening the PR.
- **The fetch and the patch.** I approved the feasibility fetch, and chose the one-file
  Greenhouse patch over two workarounds ("ok try atleast").
- **After the TA's feedback on my last assignment (2026-10-21).** I chose a visa deadline of
  whichever comes first, the unemployment limit or the OPT end, instead of a placeholder date. I
  decided to drop repeated
  postings, and to run the liveness checker on the 5 non-senior DevOps postings. I opened the one
  posting the checker couldn't decide (MongoDB), found it live with an inbuilt apply page, saw it
  needs 3+ years of experience, and recorded my decision in `liveness/gate-decisions.csv`.
- **The predictions** in `WORKED-RUN.md` are mine, word for word.
- **The reflection** in `WORKED-RUN.md` is written by me.
- **`FRICTIONAL.md`** is written by me. Claude formatted it, added the short summary at the top, and
  corrected three details I had approved: a posting count it had given me wrong (5,066), how far the
  pushed commit was exposed, and who made the test fix.

## Course materials

- INFO 7375 "The Reallocation Engine — Mode Build Assignment", Fall 2026 (Canvas), and TA guidance
  that Canvas governs the deliverables and the professor's GitHub instructions govern the repo.
