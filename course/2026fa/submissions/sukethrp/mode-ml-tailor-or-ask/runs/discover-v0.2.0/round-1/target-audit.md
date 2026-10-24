# Target audit — 2026-10-19

## Executive summary

This is the check of 12 target companies before any application time is spent: whether the mode can read each company's job board, which machine-learning postings it found there, and what the public H-1B file this engine reads holds for each company. Read it to see where the evidence runs out, not only where it exists.

**What it found.** 21 postings were kept for the full check. The mode cannot read the job boards of Google, Amazon, Apple, Netflix, Meta. The sponsorship file has no H-1B history for Google, Amazon, Apple, Netflix, Meta: unknown, not 'no'. Kept postings still pass every gate in the mode, and fit stays the person's call.

**Check by hand.** The careers sites of Google, Amazon, Apple, Netflix, Meta need a separate manual check: they stay on the list, and this audit cannot see their postings.

## Each company

The postings kept per company are a sample: the newest matches, up to the cap. They are not that company's best matches, and the matches over the cap were not checked.

| Company | Job board | Postings listed | Checked (newest matches, up to the cap) | Identity | Sponsorship file |
|---|---|---|---|---|---|
| Google | none the engine can read | — | — | not decided | GOOGLE LLC: no row in the file; ALPHABET INC: row 1356 ALPHABET INC (MOUNTAIN VIEW, CA): no H-1B fields |
| Amazon | none the engine can read | — | — | not decided | AMAZON.COM SERVICES LLC: no row in the file; AMAZON WEB SERVICES INC: no row in the file |
| Apple | none the engine can read | — | — | not decided | APPLE INC: no row in the file |
| Netflix | none the engine can read | — | — | not decided | NETFLIX INC: no row in the file |
| Meta | none the engine can read | — | — | not decided | META PLATFORMS INC: no row in the file; FACEBOOK INC: row 9382 FACEBOOK INC (MENLO PARK, CA): no H-1B fields |
| Databricks | greenhouse/databricks | 901 | 2 | confirmed by sukethrp on 2026-10-19 (row 7248) | DATABRICKS INC: row 7248 DATABRICKS INC (SAN FRANCISCO, CA): 1640 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Stripe | greenhouse/stripe | 727 | 5 | confirmed by sukethrp on 2026-10-19 (row 25632) | STRIPE INC: row 25632 STRIPE INC (South San Francisco, CA): 1250 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Airbnb | greenhouse/airbnb | 177 | 0 | confirmed by sukethrp on 2026-10-19 (row 1013) | AIRBNB INC: row 1013 AIRBNB INC (SAN FRANCISCO, CA): 1000 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Pinterest | greenhouse/pinterest | 154 | 5 | confirmed by sukethrp on 2026-10-19 (row 20330) | PINTEREST INC: row 20330 PINTEREST INC (SAN FRANCISCO, CA): 1364 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Figma | greenhouse/figma | 140 | 4 | confirmed by sukethrp on 2026-10-19 (row 9653) | FIGMA INC: row 9653 FIGMA INC (SAN FRANCISCO, CA): 188 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Reddit | greenhouse/reddit | 151 | 2 | confirmed by sukethrp on 2026-10-19 (row 21989) | REDDIT INC: row 21989 REDDIT INC (SAN FRANCISCO, CA): 408 approvals, company-wide · tier Proven · ML/AI titles counted: Software Engineer, Machine Learning |
| Roblox | greenhouse/roblox | 262 | 3 | confirmed by sukethrp on 2026-10-19 (row 22736) | ROBLOX CORP: row 22736 ROBLOX CORP (San Mateo, CA): 856 approvals, company-wide · tier Likely · ML/AI titles counted: none |

## Why postings were dropped

Every listed posting is counted once, by the first rule that dropped it. Nothing is dropped silently.

| Company | Listed | Internship | Senior title | Not a kept family | Outside the US | Matching, not checked (over the cap) | Checked |
|---|---|---|---|---|---|---|---|
| Databricks | 901 | 1 | 25 | 867 | 6 | 0 | 2 |
| Stripe | 727 | 0 | 5 | 706 | 9 | 2 | 5 |
| Airbnb | 177 | 0 | 13 | 163 | 1 | 0 | 0 |
| Pinterest | 154 | 0 | 12 | 133 | 1 | 3 | 5 |
| Figma | 140 | 1 | 0 | 133 | 2 | 0 | 4 |
| Reddit | 151 | 0 | 20 | 128 | 1 | 0 | 2 |
| Roblox | 262 | 1 | 13 | 245 | 0 | 0 | 3 |

## What this audit cannot verify

- Postings on careers sites the engine cannot read. This version reads Greenhouse boards only.
- Whether a legal name listed for a company is its H-1B petitioner. The names were listed by claude-code, and a name match is not an identity.
- Sponsorship now. The file's approvals are company-wide, have no filing years, and cover six states.
- Whether a kept title is the work its posting describes. The title rules read titles only; the mode then reads each posting's own requirements.
- A company's best matches. The cap keeps the newest matching postings, a sample.

## Run record

- Targets: `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json` (chosen by student; legal names by claude-code)
- Rules: `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` v0.3.0, declared by student (the filters are labelled your-input)
- Sponsorship file sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`
- Boards read: databricks (901 listed, sha256 `502844cab9ee…`), stripe (727 listed, sha256 `a066cdcb05f7…`), airbnb (177 listed, sha256 `d435003646cd…`), pinterest (154 listed, sha256 `e73dc5b7ac17…`), figma (140 listed, sha256 `bbed717dd96f…`), reddit (151 listed, sha256 `102a542ae169…`), roblox (262 listed, sha256 `9aa2a626627b…`)
