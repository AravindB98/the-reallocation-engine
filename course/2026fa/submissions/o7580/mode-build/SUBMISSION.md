# SUBMISSION

## Executive summary

This is the cover sheet for my Mode Build submission. It names the mode, how to run it, where the code lives on GitHub, and the exact commit the ZIP was made from. The mode triages design-engineer postings (front-end, UX engineer, product designer) for an F-1 student graduating in December 2026. It drops jobs that only say "design", shows which occupation codes a job could be filed under and what that does to the wage floor, tiers sponsorship on matching titles at the right level, and gates on liveness and the OPT clock. It ran live on 19 October 2026 and is honestly marked DRAFT.

- **Assignment:** The Reallocation Engine — Mode Build Assignment (100 points)
- **Student:** Omkar Salian · **GitHub handle:** O7580
- **Situation the mode targets (fictional persona, Ananya Iyer):** F-1, STEM M.S. ending December 2026, post-completion OPT from January 2027, ~24 months' software experience, two-case-study design portfolio; applies to front-end / UI engineering (15-1254, 15-1252) and product / UX design (15-1255) in Greater Boston, remote US and relocation. The persona is fictional, as `DATA_CONTRACT.md` requires.
- **Mode file:** `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md` (+ `.card.md`)
- **Run it:** `npm ci`, then `node scripts/contrib/2026fa/o7580-design-engineer-soc-triage/triage.mjs` (audit: `title-audit.mjs --state MA`; tests: `node --test scripts/contrib/2026fa/o7580-design-engineer-soc-triage/test/triage.test.mjs`; break attempts: `bash scripts/contrib/2026fa/o7580-design-engineer-soc-triage/break-tests.sh`)
- **Real repository scripts run against real data:** `npm run ats:scan -- --dry-run` (design-lane portals), `scripts/ats/detect-ats.py`, `npm run ats:liveness`, `scripts/score/role-scorer.mjs` (unchanged), `npm run verify`, `npm run doctor`, `scripts/pii-scan.mjs`
- **GitHub fork / branch / PR:** `<fork URL>` / `mode/o7580-design-engineer-soc` / `<PR URL>`. *Fill in after the PR is opened.*
- **Submitted commit SHA:** `<sha>`. *Must equal the PR head and the ZIP's source.*
- **Lifecycle stage claimed:** DRAFT. A live run completed (13 boards, 9 postings, full CSV/BLS). There are 6 typed TODO proposals, and the constitution requires zero for SPECIFIED. All human gates (G1/G2/G4/G5/G6) were cleared by the author on 2026-10-20 in `logs/runs/2026fa-o7580-2.md`; the attestation was re-signed (final) on 2026-10-21 after a clean-clone fix.
- **Paths vs the assignment text:** the assignment says `recipes/`, `assignments/submissions/<name>/` and "append to `logs/RUN_LOG.md`". This repository's `CONTRIBUTING.md` and CI require `recipes/cases/<term>/`, `course/<term>/submissions/<handle>/` and `logs/runs/`, and fail a student PR that edits `logs/RUN_LOG.md`. I followed the CI contract; the RUN_LOG entry is included in the ZIP as `logs/runs/2026fa-o7580-2.md`.
- **Changes:** all new files, all in my namespaces; no maintained file touched.

## How the ZIP is made (after the commit)

```bash
git archive --format=zip --prefix=reallocation-omkarsalian-mode/ -o reallocation-omkarsalian-mode.zip <sha> \
  recipes/cases/2026fa/o7580-design-engineer-soc-triage.md \
  recipes/cases/2026fa/o7580-design-engineer-soc-triage.card.md \
  course/2026fa/submissions/o7580/mode-build \
  scripts/contrib/2026fa/o7580-design-engineer-soc-triage \
  logs/runs/2026fa-o7580-2.md
```

`git archive` packages only committed files from that SHA: no `node_modules`, no `private/`, no `data/ats/`, no raw postings. A filled-in copy of this sheet (SHA, URLs) is then added at the ZIP root.
