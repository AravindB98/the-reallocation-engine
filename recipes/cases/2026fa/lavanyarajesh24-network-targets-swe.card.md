# network-targets-swe — human card

**Audience:** an international MS software-engineering student, still in school, who will
need H-1B sponsorship and can't start work for months. Also anyone checking whether to
trust this student's lists.
**Agent twin:** `recipes/cases/2026fa/lavanyarajesh24-network-targets-swe.md`
**Status:** see the agent twin's frontmatter (v0.2.0). All three v0.1.0 TODOs are closed.
A live run on 2026-10-20 used real job boards, a real browser check, DOL data and
E-Verify lookups.

## Executive summary

This tool starts from employers in your target states that have H-1B approvals for
software job titles. For each one, it:
- finds the company's public job board and checks it really is that company's;
- opens every matching posting in a real browser;
- adds two public records: Department of Labor wage filings for **software developers**,
  and **E-Verify** enrollment.

It tells you:
- where to **apply now**: a live, matching posting at a confirmed software sponsor;
- where to **network first**: a confirmed software sponsor, but nothing suitable open;
- what it **couldn't confirm**: so it decided nothing about those companies;
- what to **skip**.

It sends nothing and applies nowhere. You read the report and decide.

## What it can verify

- The 80 Days row for each employer: approvals, denials, approval rate, sponsored titles,
  funding.
- That the board it checked belongs to the company. A board under another company's name
  is rejected; one was, in the 2026-10-20 run.
- That a posting was listed **and** showed an apply button in a real browser at a stated
  time. One posting disappeared between two checks on the same afternoon; the report
  says which.
- How many **software-developer** wage filings (DOL LCAs) the employer made in FY2026
  (Oct 2025 – Jun 2026): nationwide, in MA/NY, and how many at entry-level wage levels.
- What the E-Verify Employer Search showed for the employer on the lookup date.
- The national BLS median wage for software developers: **$133,080** (OEWS 2024). Context
  only.

## What it cannot verify

- That a wage filing became a **visa approval** or a **new hire**.
- That a "software developer" filing was a **new-grad backend** job.
- Filings under a **different company name** than the one in 80 Days.
- That a live posting is **real hiring**, or can **wait for your OPT start date**.
- Postings on career sites the browser check can't read. MongoDB's and Formlabs' sites
  came back "uncertain".
- Companies whose job board it couldn't find: 98 of 133 in the 2026-10-20 run.
- E-Verify for companies nobody looked up. That shows as "not looked up", never "not
  enrolled".
- That the **funding columns** are right.

## Dependencies

- Node 20+, `npm install` (for Playwright), `npx playwright install chromium`, and Python
  3 with `openpyxl`.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- The DOL file `LCA_Disclosure_Data_FY2026_Q3.xlsx`, downloaded by hand from
  dol.gov/agencies/eta/foreign-labor/performance. dol.gov blocks scripted downloads.
- `scripts/score/role-scorer.mjs`, `scripts/ats/detect-ats.py`,
  `scripts/ats/liveness-browser.mjs`: the engine's own scripts, used unchanged.
- `scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/`: everything else.

## Annotated commands

The full pipeline is in the agent twin, under "Commands". The two you will use most:

```bash
# the engine's own liveness gate on this run's matching postings (opens each in headless Chromium)
npm run ats:liveness -- --file course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live/posting-urls.txt

# the final offline run
node scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.mjs --out-dir course/2026fa/submissions/lavanyarajesh24/runs/mode-build-live
```

Tests, offline, with fictional companies:

```bash
node --test scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/network-targets.test.mjs scripts/contrib/2026fa/lavanyarajesh24-network-targets-swe/mode-build.test.mjs
```

Expected: `# pass 17`, `# fail 0`.

## What it produces

- `runs/mode-build-live/network-targets-report.md`, **for you.** Four lists, each with its
  next action, plus what wasn't checked.
- `runs/mode-build-live/network-targets-log.json`, **for the agent.** Every value is
  labeled record / your-input / model-judgment.
- `runs/mode-build-live/roles.json` → `role-scores.json` / `role-scores.md`: what was sent
  to the engine's scorer, and what it said.

## Your gates

1. **Board confirmation.** For a board the tool couldn't verify (Lever boards, or a
   different display name), open it and confirm it, or don't. Record your name and the
   date.
2. **H1, before acting on any row.** Open each "apply now" posting. Check that it's still
   open, that it's entry level, and that it can start after your OPT start date. For
   "network first", decide whom to contact yourself.

## Named failure modes

1. **"Software sponsor" from a title list, not an occupation code.**
   - 80 Days showed Ginkgo Bioworks with 122 approvals under a "software" title match.
   - Its FY2026 DOL filings are all biology and chemistry roles: zero software-developer
     filings anywhere.
   - Who struggles to catch it: the student. The company does post software jobs, so it
     looks like a perfect target.
2. **The wrong board makes a hiring company look quiet.**
   - The v0.1.0 slug `cmt` pointed at a board named "CMTelematics" that listed only
     internships.
   - The detector found the real Cambridge Mobile Telematics board, with 24 jobs.
   - Who struggles to catch it: anyone who trusts "network first" without opening the
     board.
3. **A state filter that hides remote sponsors.**
   - Counting MA/NY worksites only, Abacus Insights, Acquia, Lookout and Yieldmo looked
     like non-sponsors. They file for software developers at worksites in other states.
   - Fixed: the cap now uses nationwide filings.
