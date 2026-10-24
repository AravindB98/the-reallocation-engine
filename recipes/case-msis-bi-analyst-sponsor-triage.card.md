# msis-bi-analyst-sponsor-triage — Human Card

*Read this before trusting a triage report. It is the human half of the recipe
`case-msis-bi-analyst-sponsor-triage.md`.*

## Executive summary

This card explains, in plain language, what the triage checklist can and cannot tell you about one company and one job posting. It is for an international Information Systems master's student who wants a Business Intelligence Analyst job and has a limited number of applications to spend. It found that stored data and live checks can confirm a company's petition history, whether a posting exists, and what the posting body says about seniority. They cannot tell you the company will sponsor *you*, and a job title is a poor guide to what the job really is.

## Purpose

Before you apply, check one company and one posting against stored evidence: sponsorship history, whether it matches your kind of role, whether the posting is really live, how senior the body says the job is, whether each fact you believe about the posting is written in it, and days left on an assumed timeline.

## What it can verify

- The company's row in the sponsorship dataset, quoted with its line number.
- How old the newest funding record in the dataset is (the data stops in 2025).
- Whether the posting exists, using two independent signals.
- The experience and seniority words written in the posting body, quoted.
- That each fact you extracted has a verbatim quote in the posting.

## What it cannot verify

- That the company will sponsor you for this job. A history of petitions is not a promise.
- That the sponsored work was analyst work. The record lists top titles only, and it can match on a neighbour title (an *Engineer* where you want an *Analyst*).
- Immigration rules (cap-gap, STEM OPT, OPT start-date fit, lottery, cap-exempt status). Ask your school's international office.
- That a quote *supports* the claim attached to it, except for list fields where every item must appear in a quote. You read the other values yourself.
- That anyone is actually hiring for a live posting.

## Failure modes (named, with who is hurt)

1. **The title hides the seniority.** An "Analytics Engineer" posting says in its body: *"We're looking for a Senior Analytics Engineer"* and *"5+ years of experience"*. A student filtering on titles applies to a role they cannot meet and does not learn why. Hardest to catch for someone new to US job-title conventions, who has no prior for what a missing "Senior" implies.
2. **A word match is not the job.** The company's sponsorship record matched your keywords through "Business Intelligence *Engineer*", and of 22 "analyst"-titled postings across six boards, 17 looked like non-BI work by title (accounting, support, fraud, treasury, operations and similar) and only 2 looked clearly like BI or data-analyst work. A newcomer reads "analyst" and assumes the work, and the sponsorship, transfer.
3. **"No record" read as "no".** A blank approval count is absence of evidence. Startups that have never filed look identical to ones that refuse to.
4. **"Active" read as "real".** The repository's liveness checker called an invented job on one company's board active. The mode requires a second signal.

## Annotated commands

```bash
# 1. Local gates (no network). An end date is required; the run refuses without one.
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py \
  --company "Klaviyo Inc" --opt-end 2028-05-31 --json out.json --md out.md
# 2. Fetch the one posting (the only network step), then check it is live twice
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py klaviyo --job 7737707003 --text-out posting.txt
npm run ats:liveness -- https://job-boards.greenhouse.io/klaviyo/jobs/7737707003
# 3. How senior is it really? (exit code 1 = flagged: read the quoted snippets)
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.py posting.txt
# 4. Ground the facts you extracted (exit code 1 on any ungrounded field)
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.py extraction.json
```

Exit codes: `sponsor-triage.py` 0 = ran (gates may be flagged), 2 = a gate stopped the run; `seniority-gate.py` 0 = no flag, 1 = flagged, 2 = bad input; `ground-fields.py` 0 = all grounded, 1 = any failure, 2 = bad input; `fetch-board.py` 0 = ok, 1 = network error or empty, 2 = bad input (nothing fetched). The role family is a flag: add `--keywords "machine learning,data scientist"` to switch the search to AI roles.
