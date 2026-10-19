# jobpost-triage — gates for one company and one posting

## Executive summary

Four small tools and a skills list for a student deciding whether one job posting is worth an application. One checks a company against the stored sponsorship dataset and refuses to guess; one fetches a posting from a public job board; one reads the posting body for hidden seniority; one checks that every fact pulled from a posting appears in the posting. They back the recipe `recipes/case-msis-bi-analyst-sponsor-triage.md`. Only the fetch tool touches the network, and none of them uses an LLM.

## Files

| File | What it does | Exit codes |
|---|---|---|
| `sponsor-triage.py` | Gates G0–G5 against `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (stdlib only); `--keywords` switches the role family | 0 ran · 2 a gate stopped the run |
| `fetch-board.py` | The only network step: one posting or a whole board from the public Greenhouse API, written as local files | 0 ok · 1 network/empty · 2 bad input (nothing fetched) |
| `seniority-gate.py` | Reads the posting body for experience requirements and a senior-prefixed copy of the title; quotes the snippets | 0 no flag · 1 flagged · 2 bad input |
| `ground-fields.py` | Every extracted field needs a verbatim quote from the posting, or "not stated" with no quote; list fields need every item inside a quote | 0 all grounded · 1 any fail · 2 bad input |
| `*.test.py` | 15 + 15 + 19 offline tests, with deliberate break attempts and one asserted known gap | 0 pass |
| `taxonomy/bi-analyst-skills.json` | BI skills list for `npm run skill-demand -- ... --taxonomy`; drafted by Claude Code, **not reviewed by a human** | — |

## Run

```bash
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company "Klaviyo Inc" --opt-end 2028-05-31
python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.test.py
```

## Limits

Thresholds (365 / 730 / 90 days, 3 years of experience, the 8-character minimum quote) are authorial choices. `ground-fields.py` proves a quote exists, not that it supports the claim, except for list fields. `seniority-gate.py` cannot read seniority written only in prose. Nothing checks any immigration rule, and the end date is whatever you supply. Not yet promoted to `scripts/`; no `package.json` target.
