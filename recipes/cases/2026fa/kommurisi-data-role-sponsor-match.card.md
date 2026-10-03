# Data-role sponsor match — human card

**Audience:** an F-1 MS Information Systems / analytics student deciding which data-engineering, analytics-engineering, and BI postings deserve this week's hours.  
**Agent twin:** `recipes/cases/2026fa/kommurisi-data-role-sponsor-match.md` (DRAFT, v0.1.0)  
**Chapters:** 7 (sponsorship), 8 (liveness), 10 (visa timeline), 11 (scorer). Ch.9 role quality is shown beside the decision and is not part of it.

## Purpose

Answer one question per posting: *has this company ever sponsored a data role, is the posting real, and is there time?* A company's H-1B approval count is not the answer. Databricks has 1,640 approvals on record, and none of its five recorded top sponsored titles is a data role.

## What it can verify

- The company's 80 Days CSV row (file:line), company-wide approvals and approval rate, and its **recorded top sponsored titles**.
- Which of those titles match the data-role patterns. Chemistry "analytical" titles and "clinical data" titles are excluded on purpose.
- Whether the Greenhouse job API had the job id on the capture date, and whether that agrees with the repo's page-level liveness check.
- OPT runway in days under the dates you entered, and the resulting timeline factor.
- That Apply / Consider / Skip came from the maintained Ch.11 scorer, with its arithmetic shown.

## What it cannot verify

- That **this** opening, at **this** level, will be sponsored **this** year. The title list is short, historical, and company-level.
- How the employer will classify the job's SOC code on the LCA.
- Hiring lag at this company. One assumed number is used for all.
- Funding recency for most companies. Form D samples hold 50 companies per quarter.
- Fit. It is your own rating.

## Annotated commands

Find postings (reads your gitignored `data/ats/portals.yml`):

```bash
npm run ats:scan -- --dry-run
```

Capture liveness twice, as a page check and an API check. These are the only network steps:

```bash
npm run ats:liveness -- --file urls.txt > liveness.txt
node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/greenhouse-check.mjs --input candidates.json --out greenhouse-api.json
```

Run the match offline. With no flags it reruns the committed worked run:

```bash
node scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.mjs
```

Prove it fails safely: offline tests, including OPT-already-past (exit 3) and the out-dir guard:

```bash
node --test scripts/contrib/2026fa/kommurisi-data-role-sponsor-match/match.test.mjs
```

## What it produces

- `data-role-sponsor-match.report.md`, for you: decisions, next actions, labeled evidence, and the gates you must judge.
- `data-role-sponsor-match.log.json`, for an agent: every value as `{value, source}` with file:line provenance.
- `roles.json` → `role-scores.{json,md}`, the scorer's own input and output.

## Reading a result

| You see | It means | Do |
|---|---|---|
| **Apply** | A data title is on the sponsor record, the posting is live, there is time, and your fit is high enough. | Tailor an application (2-hour block). |
| **Consider** | Sponsors, but no data title on record ("Likely"), or the score is in the 0.20–0.30 band. | Network first: ask a data-team person whether this level is sponsored. |
| **Skip** | Low score, or a closed gate (dead posting). | Nothing this week. |
| **Unresolved** | A named gap: company not in the CSV, two CSV rows, blank sponsorship columns, or liveness not confirmed. | Ten-minute human check. Never treat it as a Skip. |

## Named failure modes

1. **Redirect ghost.** A dead job id redirects to the careers search page, which shows Apply buttons, so the page check says "active". A student checking by hand sees a live-looking page too. Mitigation: the Greenhouse API 404 wins. This only works for Greenhouse boards, so Lever, Ashby and Workday postings get the page check alone.
2. **The big-sponsor illusion.** A company with hundreds of approvals feels safe, but every sponsored title is a software role. The student who most wants a famous name is the one least likely to look at the title list. Mitigation: the tier comes from titles, not counts, and "Likely" demotes Apply to Consider.
3. **Blank read as "no".** Blank sponsorship columns (DraftKings in this CSV) mean "not in this dataset", not "refuses to sponsor". Scoring blank as p = 0 would quietly skip real sponsors. Mitigation: blank is Unresolved.
4. **Keyword drift.** A broad `analytic` pattern sweeps in "Scientist, Analytical Chemistry". Mitigation: data-specific include patterns plus an exclude list, with a test that fails if either loosens.
