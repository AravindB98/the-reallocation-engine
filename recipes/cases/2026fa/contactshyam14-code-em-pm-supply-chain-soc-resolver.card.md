# Which occupation code is this job? (early-career PM & supply chain) — human card

**Audience:** the engineering-management graduate on 12-month OPT deciding whether to apply to an early-career project-manager or supply-chain posting, or to ask the recruiter a question first.
**Agent twin:** `recipes/cases/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver.md`
**Chapters:** 8 (is the job real — liveness is a gate), 9 (role quality; national OEWS is not local pay), 11 (the scorer; gates multiply).

## Executive summary

This card is the one-page version of a recipe that answers a question job postings never answer: which government occupation code would this job be filed under? For project-manager and supply-chain titles the plausible codes can differ by $20,000 or more in their official median wage, one of them may be a clerical code, and an employer's past visa filings only help you if they were for the same code. When the plausible codes disagree, the tool gives no score at all and tells you to ask the recruiter. On its first run it refused the one real posting that passed the liveness, scope and experience checks (an Inventory Planner near Fort Worth), for exactly that reason.

## Purpose

Before you tailor an application for a posting that requires 0–2 years, see which occupation codes it could plausibly be filed under, what each one's public wage record says nationally and in that city, and whether the answer is clear enough to act on.

## What it can verify

- Whether the repository's posting checker found an Apply button at the exact link, and when.
- The exact sentence that states required years of experience, and whether it is a requirement or only a preference.
- The exact sentence about a degree, and whether it is required, a plus, or "or equivalent experience".
- For each plausible code: the government's national wage percentiles, the city row, and the cost-of-living-adjusted band from the repository's existing wage script — or exactly why each is missing.
- Whether the employer appears in the sponsorship file under its exact name, and which look-alike names were rejected.

## What it cannot verify

- Which code the employer will actually file. Only the employer (or its labor-condition filing) knows. **That is the question to ask the recruiter.**
- Any employer's sponsorship history for a specific code — the sponsorship file has no code column.
- That a town is in the stated metro area (your mapping, not a record).
- How much experience the government expects for each code.
- Whether an "uncertain" liveness result means the job is gone or the checker can't read the page.
- Anything about visa law. A "degree not required" flag means the posting text doesn't require one; whether that weakens a visa petition is for your DSO or an immigration attorney. STEM eligibility of your degree is a DSO question.

## Dependencies

- Node 20+ and `npm install` (repo). Playwright Chromium for `npm run ats:liveness` (`npx playwright install chromium`).
- Repo `.venv` with pandas for the city wage band (`scripts/bls/local-wage-adjustment.py`); without it, run with `--local-wage skip` and every city band shows "not checked".
- Trimmed BLS/BEA files in the script's `data/` folder (provenance in `data/PROVENANCE.md`).
- Your persona file: target metros, maximum required years (2), and — when you have the card — EAD Valid From / Card Expires dates.

## Annotated commands

Is the posting live? (a gate — anything but `active` stops it):

```bash
npm run ats:liveness -- "https://careers.rsgroup.com/job/Fort-Worth-Inventory-Planner-TX-76118/1439895033"
```

Run the resolver on a sample posting (fictional; it stops at liveness by design because it has no link):

```bash
node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs --as-of 2026-10-21 --posting scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/inputs/postings/samples/sample-2-scpm1-austin.json --out-dir course/2026fa/submissions/contactshyam14-code/runs/latest
```

Tests (offline):

```bash
node --test scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.test.mjs
```

## What it produces

- `soc-resolver.md` — read this. One line per posting, then per posting: verdict, quoted evidence, a wage table per plausible code, flags.
- `soc-resolver.json` — the machine log with every value labelled record / your-input / model-judgment.
- Verdicts: **RESOLVED** (codes agree — one conservative score), **AMBIGUOUS-REFUSE** (codes disagree — no score; ask which code), **STOP** (a gate failed or a wage is missing).

## Named failure modes (who would miss them)

1. **Wrong code, lower floor.** A "Supply Chain Project Manager" filed as 13-1081 Logisticians instead of 13-1082 Project Management Specialists has a national median about $20,000 lower, and a sponsor's 13-1082 history doesn't apply. Hardest to catch for the applicant who reads the title and assumes "project manager".
2. **Clerical code behind a "Planner" title.** Inventory/Supply/Material Planner roles can be filed as 43-5061 Production, Planning and Expediting Clerks (job zone 2, $57,770 median). The EM graduate who sees "supply chain strategy" in the description is least likely to suspect it.
3. **Look-alike company names.** "Zipline" matches two unrelated companies in the sponsorship file; "RS Group" substring-matches three unrelated "…GROUP" firms. A loose match hands you someone else's history. The tool matches exact names only and lists what it rejected.
4. **"Manager" at two years.** Manager codes (11-xxxx) on a ≤2-year posting are flagged: the title may be inflated coordinator work, or the code may expect far more experience than the posting asks for.
