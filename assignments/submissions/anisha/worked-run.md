# Worked run — msis-bi-analyst-sponsor-triage v0.2.0 (RUNNABLE-SAMPLE)

## Executive summary

This document shows the new checklist being run for real, on one real Boston company and one real job posting, with the actual terminal output pasted in. It matters because the assignment is graded on whether the mode *ran* and on being honest about what it could not check. The run found real sponsorship history (154 approvals) and a live posting, then three things a quick read would have missed. The posting is titled just "Analytics Engineer", but its body says it wants a *Senior* Analytics Engineer with 5+ years of experience. The company's sponsorship record shows a "Business Intelligence *Engineer*", not an analyst. And the repository's own liveness checker called a made-up job on that company's board "active". The run stopped without a score, on purpose, and several things I built broke in useful ways (listed below).

## Run record

- **Date:** 2026-10-19 · **Stage reached:** RUNNABLE-SAMPLE (one real run; no named human has cleared the live gates G5–G9) · **Attestation:** `null` in frontmatter; the sample-run sign-off below is by Anisha Gaikar (2026-10-19) and is never a VERIFIED attestation.
- **Persona:** international master's student in Information Systems (F-1), expected graduation 15 May 2027, not yet on OPT, targeting Business Intelligence Analyst roles (SOC 15-2051.01). **The OPT end date `2028-05-31` is an ASSUMPTION** (OPT assumed to start about 1 June 2027 and run 12 months; STEM extension not assumed). No real OPT dates exist yet. It is used only for day arithmetic. No data from `private/` was read or written.
- **Company:** Klaviyo (public record, CSV line 14495). **Posting:** "Analytics Engineer", Boston, MA, a live Greenhouse posting (job id 7737707003). A second posting, Cohere Health's "Data Scientist II" (job id 8005450003), is used only for the seniority gate and the keyword test.
- **Provenance:** postings were fetched with the stored ingest script (`fetch-board.py`) from Greenhouse's public board API and are *not* committed (third-party content). Hash of the flattened Klaviyo posting text: `sha256 44dae94e9bf1aedc…`; of the merged 58-posting boards file: `65c78153e278e6c4…`.
- **History:** a first version of this mode was built for junior AI / prompt-engineer roles, which was my guess from an earlier course project. It was rebuilt for the BI-analyst target once the student confirmed it; the earlier version's outputs are not included.
- **Who did what:** Claude Code wrote the scripts and the BI skills list, ran the commands, and *drafted* the field extraction (a model judgment). The scripts then checked it mechanically. The author ran two of the three confirmation commands, had the third run in their session, read the two seniority snippets and signed the sample-run attestation (see below).
- **Output paths:** `$OUT` below stands for a scratch directory outside the repo; the artifacts that matter are in `artifacts/` beside this file. The wrapper that printed each command strips the shell quotes (so `--company Klaviyo Inc` is really `--company "Klaviyo Inc"`).

## 1. Toolchain baseline (existing commands, plus the tests of the three new checkers)

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 169 files (88 md · 43 py · 30 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]

$ npm run skill-demand:test

> the-reallocation-engine@1.0.0 skill-demand:test
> node scripts/score/skill-demand-monitor.test.mjs

skill-demand-monitor verification harness

  ✓ sample-size gate halts on 3 postings and emits no ranked list
  ✓ known skill count matches a hand-count of the committed fixture (python: 22/22)
  ✓ a posting missing description_text is rejected with a named reason, not silently dropped
  ✓ postings with no recognized skills set low_coverage=true rather than a silently-thin ranking
  ✓ a --min-sample override below the default is threaded through and flagged, never reported as unconditional confidence

5 passed, 0 failed
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.test.py
ground-fields verification harness

  ✓ exact quote grounds a field
  ✓ curly-vs-straight apostrophe still grounds (normalized)
  ✓ BREAK: invented detail not in posting is rejected (the 'headquartered near Boston' error)
  ✓ BREAK: value with no quote is ungrounded
  ✓ BREAK: one-word quote is too short to ground anything
  ✓ BREAK: number in value that is not in the quote fails
  ✓ 'not stated' with no quote passes for a field the posting really omits
  ✓ BREAK: 'not stated' salary fails when a $ figure is in the text (missed value)
  ✓ BREAK: 'not stated' carrying a quote is contradictory
  ✓ KNOWN GAP: real quote attached to the WRONG claim still PASSES (needs a human)
  ✓ list field: items spread across two quotes all ground
  ✓ BREAK: list field with an item that is in no quote fails (the real 'skills' gap)
  ✓ BREAK: one fake quote inside a list of quotes fails the whole field
  ✓ BREAK: unknown kind is rejected, not ignored
  ✓ without kind=list, an item missing from the quote still PASSES (unchanged behaviour)

15 passed, 0 failed
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.test.py
seniority-gate verification harness

  ✓ '5+ years of experience' is read as 5 and flagged
  ✓ '36 months of experience' is read as 3 years and flagged (the Data Scientist II posting)
  ✓ 'three (3) years of experience' is read through the parenthesis
  ✓ a range uses its LOWER bound: '2-4 years of experience' -> 2, pass
  ✓ '0-2 years of experience' -> 0, pass (entry-friendly wording)
  ✓ '3 to 5 years of experience' -> 3, flag
  ✓ the highest minimum wins when several are stated
  ✓ BREAK: a number of years NOT near the word 'experience' is ignored ('founded 10 years ago')
  ✓ BREAK: 'experience' too far from the number does not count
  ✓ BREAK: title without 'Senior' but body says 'Senior <title>' is flagged (the Klaviyo pattern)
  ✓ a senior marker in the title itself is flagged
  ✓ 'II' alone is NOT treated as a senior marker (that is the trap: the gate must read the body)
  ✓ no experience statement and no senior wording is no_statement, never pass
  ✓ the threshold is a parameter: 3 years passes when --flag-years is 4
  ✓ BREAK: input with no title line is rejected, not guessed

15 passed, 0 failed
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.test.py
fetch-board verification harness (offline)

  ✓ escaped HTML becomes plain text with line breaks
  ✓ a job becomes a unified record with the required fields
  ✓ title regex keeps matches only, case-insensitively
  ✓ no regex keeps everything
  ✓ BREAK: invalid slug '../etc/passw' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug 'UPPER' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug '' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug 'a b' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug '-lead' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug 'xxxxxxxxxxxx' is refused with exit 2 and NO network call
  ✓ BREAK: invalid slug 'a/b' is refused with exit 2 and NO network call
  ✓ BREAK: neither --out nor --job is refused (exit 2, no network)
  ✓ BREAK: --job without --text-out is refused (exit 2, no network)
  ✓ BREAK: a non-numeric job id is refused (exit 2, no network)
  ✓ BREAK: a broken title regex is refused (exit 2, no network)
  ✓ whole-board mode writes only the filtered records and reports counts
  ✓ single-posting mode writes title, location, then the body
  ✓ BREAK: an empty board is an error (exit 1), not a silent empty file
  ✓ BREAK: a network failure is surfaced (exit 1), not swallowed

19 passed, 0 failed
[exit 0]
```

Not run, recorded as defects, not worked around: `npm run bls:local-wage` (its input directory `data/bls/local-wage/` is absent from the clone, and `python3 -m venv .venv` failed at `ensurepip` on Homebrew Python 3.14); `npm run score` (blocked by a missing sponsorship probability, TODO 1). `npm run ats:scan -- --dry-run` fails as documented with `Error: portals.yml not found` because it expects a private config; it does run on the committed example config (§G).

## 2. The mode, run on a real scenario

### A. Local gates: sponsorship record, role family, runway (no network)

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyo Inc --opt-end 2028-05-31 --json $OUT/klaviyo-triage.json --md $OUT/klaviyo-triage.md
sponsor-triage: status=complete  gates=G1:flag,G2:pass,G3:pass,G4:pass,G5:pass
[exit 0]
## Executive summary

This report checks whether **Klaviyo Inc** is worth an application using only the committed sponsorship dataset. It found a record (154.0 approvals, last funding Series C on 2022-07-26). 1 gate(s) raised a flag that a human must read before acting. It deliberately gives no score.

## Gates

| Gate | Status | Detail |
|---|---|---|
| G1 snapshot-age | flag | newest funding date in data is 2025-09-26; 388 days before 2026-10-19. 'Recent' here means recent as of the snapshot, not today. |
| G2 company-match | pass | matched CSV line 14495: KLAVIYO INC |
| G3 sponsor-record | pass | 154 approvals on record |
| G4 role-family | pass | 1 sponsored title(s) match role keywords; 1 not senior-flagged |
| G5 timeline | pass | 590 days to opt_end (arithmetic only; no rule about cap-gap/STEM OPT is checked) |

## Record (source: CSV line 14495)

| Field | Value |
|---|---|
| csv_line | 14495 |
| company_name | KLAVIYO INC |
| state | MA |
| latest_funding_stage | Series C |
| latest_funding_date | 2022-07-26 |
| latest_funding_amount | 99999983.0 |
| total_approvals | 154.0 |
| total_denials | 4.0 |
| approval_rate | 97.46835443037976 |
| median_salary_offered_all_sponsored_titles | 126000.0 |
| top_job_titles_sponsored | ['Business Intelligence Engineer', 'Software Engineer II', 'Engineering Manager Data Exchange', 'Engineering Manager II- SMS', 'Senior Software Engineer'] |
| role_family_matched_titles | ['Business Intelligence Engineer'] |
| role_family_non_senior_titles | ['Business Intelligence Engineer'] |

## Run record

- run_date: 2026-10-19
- csv: data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv (30369 rows)
```

How to read it: **G1 flag** — the newest funding date in the whole dataset is 388 days old, and Klaviyo's own last record is 2022-07-26, so "recent funding" is not recent. **G4 pass** — one sponsored title matched, but read it: *Business Intelligence **Engineer***. The keyword matched; the occupation may not. **G5** counts 590 days to an *assumed* date. The company-wide median sponsored salary ($126,000) is pulled up by engineering and manager titles and is not an entry-level BI analyst figure.

### B. Break attempts on the same script

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyoo Inc --opt-end 2028-05-31 --json $OUT/b1.json
sponsor-triage: status=stopped  gates=G1:flag,G2:stop
[exit 2]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company 3AM Innovations --opt-end 2028-05-31 --json $OUT/b2.json
sponsor-triage: status=stopped  gates=G1:flag,G2:stop
[exit 2]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyo Inc --json $OUT/b3.json
sponsor-triage: status=stopped  gates=G5:stop
[exit 2]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyo Inc --opt-end 2026-01-01 --json $OUT/b4.json
sponsor-triage: status=stopped  gates=G5:stop
[exit 2]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyo Inc --opt-end 2030-01-01 --today 2028-01-01 --json $OUT/b5.json
sponsor-triage: status=stopped  gates=G1:stop
[exit 2]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Klaviyo Inc --opt-end 2026-12-01 --json $OUT/b6.json
sponsor-triage: status=complete  gates=G1:flag,G2:pass,G3:pass,G4:pass,G5:flag
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company 10 Percent Happier --opt-end 2028-05-31 --json $OUT/b7.json
sponsor-triage: status=complete  gates=G1:flag,G2:pass,G3:flag,G4:flag,G5:pass
[exit 0]
```

What each shows: misspelled company → stop at G2 with no fuzzy rescue; two CSV rows for one normalized name (`3AM INNOVATIONS INC` and `LLC`) → stop at G2 rather than pick one; missing and past OPT dates → stop at G5 before the CSV is read; simulated stale data (`--today 2028-01-01`) → stop at G1; end date 2026-12-01 → G5 flag (a named human must clear); a company with no approval count → G3 flag, "absence of evidence, NOT evidence the company does not sponsor".

### C. Ingest and liveness: two signals, because one of them was fooled

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py klaviyo --company Klaviyo --job 7737707003 --text-out $OUT/klaviyo-ae.txt
fetch-board: klaviyo/7737707003 -> $OUT/klaviyo-ae.txt | 'Analytics Engineer' | 'Boston, MA' | published 2026-07-23T14:00:30-04:00 | https://www.klaviyo.com/careers/jobs/7737707003?gh_jid=7737707003
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py klaviyo --company Klaviyo --job 1111111111 --text-out $OUT/bogus.txt
error: could not fetch klaviyo: HTTP Error 404: Not Found
[exit 1]

$ npm run ats:liveness -- https://job-boards.greenhouse.io/klaviyo/jobs/7737707003 https://job-boards.greenhouse.io/klaviyo/jobs/1111111111 https://job-boards.greenhouse.io/coherehealth/jobs/1111111111

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/klaviyo/jobs/7737707003 https://job-boards.greenhouse.io/klaviyo/jobs/1111111111 https://job-boards.greenhouse.io/coherehealth/jobs/1111111111

Checking 3 URL(s)...

✅ active     https://job-boards.greenhouse.io/klaviyo/jobs/7737707003
✅ active     https://job-boards.greenhouse.io/klaviyo/jobs/1111111111
❌ expired    https://job-boards.greenhouse.io/coherehealth/jobs/1111111111
           redirect to https://job-boards.greenhouse.io/coherehealth?error=true

Results: 2 active  1 expired  0 uncertain
[exit 1]
```

The stored ingest script fetched the real posting (exit 0) and refused the invented id (HTTP 404, exit 1). The existing `ats:liveness` got it right for Cohere Health's board (`expired`, redirect to `?error=true`) but called the invented id on **Klaviyo's** board `active`. Cause (checked in §4, V6): Klaviyo's board sends an unknown id to the company's own job-search page, which returns HTTP 200 with no `error=true` for the checker to notice. The Greenhouse API gives the true answer (200 for the real id, 404 for the invented one). So G6 requires **both** signals to agree; the repo script itself needs a patch (recipe TODO 6).

### D. Seniority gate (new script)

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.py $OUT/klaviyo-ae.txt --json $OUT/klaviyo-seniority.json
seniority-gate: 'Analytics Engineer' -> flag
  flag         experience  highest stated minimum = 5 years (threshold 3)
               "...m tools as needed Who You Are 5+ years of experience in analytics or data engineering in a modern..."
  flag         title-body  title 'Analytics Engineer' has no senior marker but the body says a senior version of it
               "...the Role We're looking for a Senior Analytics Engineer to own end-to-end data pipelines and mo..."
  pass         title       no senior marker in the title
[exit 1]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/seniority-gate.py $OUT/cohere-ds2.txt --json $OUT/cohere-seniority.json
seniority-gate: 'Data Scientist II' -> flag
  flag         experience  highest stated minimum = 3 years (threshold 3)
               "...datasets. Must possess three (3) years of experience (may be gained concurrently with above experi..."
               "...ign education equivalent) and 36 months of experience as Analyst or related position analyzing data..."
  pass         title-body  no senior-prefixed copy of the title in the body
  pass         title       no senior marker in the title
[exit 1]
```

The title says "Analytics Engineer"; the body says *"We're looking for a Senior Analytics Engineer"* and *"5+ years of experience"*. Both checks flag, with the snippets quoted. The second run is the Cohere Health "Data Scientist II" posting: it flags on *"36 months of experience"* and *"three (3) years of experience"*. The gate does not decide anything: exit 1 means "a person reads these snippets".

### E. Grounding (new script)

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.py $OUT/klaviyo-extraction-before.json
PASS  title        grounded
PASS  location     grounded
PASS  salary       grounded
PASS  seniority    grounded
FAIL  skills       item_not_in_quote: ['Python', 'Snowflake', 'Airflow', 'Terraform', 'AWS']
PASS  visa_sponsorship not stated (absence is only cue-checked for salary/remote; otherwise unverified)
ground-fields: 5/6 grounded
[exit 1]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/ground-fields.py $OUT/klaviyo-extraction.json --json $OUT/klaviyo-ground.json --md $OUT/klaviyo-ground.md
PASS  title        grounded
PASS  location     grounded
PASS  salary       grounded
PASS  seniority    grounded
PASS  skills       grounded
PASS  visa_sponsorship not stated (absence is only cue-checked for salary/remote; otherwise unverified)
ground-fields: 6/6 grounded
[exit 0]
```

`skills` is declared as a list, so every item must sit inside a quote. With only one quote it fails (`item_not_in_quote: ['Python', 'Snowflake', 'Airflow', 'Terraform', 'AWS']`); with four quotes covering every item it passes 6/6. `seniority` is also a list (items "Senior" and "5+ years of experience", each inside its own quote). `visa_sponsorship` is "not stated"; an independent grep (§4, V5) finds no sponsorship wording, only the word "citizenship" inside the equal-opportunity paragraph.

### F. Skills across six boards (existing monitor, new BI skills list)

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py gusto --company Gusto --out $OUT/board-gusto.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: gusto: 103 postings on the board -> 13 written to $OUT/board-gusto.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py moloco --company Moloco --out $OUT/board-moloco.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: moloco: 41 postings on the board -> 5 written to $OUT/board-moloco.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py anaplan --company Anaplan --out $OUT/board-anaplan.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: anaplan: 137 postings on the board -> 13 written to $OUT/board-anaplan.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py klaviyo --company Klaviyo --out $OUT/board-klaviyo.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: klaviyo: 159 postings on the board -> 10 written to $OUT/board-klaviyo.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py eclinicalsolutions --company eClinical Solutions --out $OUT/board-eclinicalsolutions.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: eclinicalsolutions: 35 postings on the board -> 13 written to $OUT/board-eclinicalsolutions.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/fetch-board.py heartflowinc --company HeartFlow --out $OUT/board-heartflowinc.json --title-regex analyst|analytics|business intelligence|\bbi\b|insights|reporting|data
fetch-board: heartflowinc: 106 postings on the board -> 4 written to $OUT/board-heartflowinc.json (title regex 'analyst|analytics|business intelligence|\\bbi\\b|insights|reporting|data')
[exit 0]
merged postings file: 58 postings (6 boards)

$ npm run skill-demand -- $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --out-dir $OUT/sd-bi-all

> the-reallocation-engine@1.0.0 skill-demand
> node scripts/score/skill-demand-monitor.mjs $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --out-dir $OUT/sd-bi-all

✓ skill-demand-monitor: 58 ingested → 58 valid → 58 candidates → status: ranked
  19 skills ranked; low_coverage=false
  $OUT/sd-bi-all/skill-demand.json  +  $OUT/sd-bi-all/skill-demand.md
[exit 0]

$ npm run skill-demand -- $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --role-filter analyst --out-dir $OUT/sd-bi-an

> the-reallocation-engine@1.0.0 skill-demand
> node scripts/score/skill-demand-monitor.mjs $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --role-filter analyst --out-dir $OUT/sd-bi-an

✓ skill-demand-monitor: 58 ingested → 58 valid → 22 candidates → status: ranked
  13 skills ranked; low_coverage=false
  $OUT/sd-bi-an/skill-demand.json  +  $OUT/sd-bi-an/skill-demand.md
[exit 0]

$ npm run skill-demand -- $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --role-filter business intelligence --out-dir $OUT/sd-bi-bi

> the-reallocation-engine@1.0.0 skill-demand
> node scripts/score/skill-demand-monitor.mjs $OUT/bi-boards.json --taxonomy scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/taxonomy/bi-analyst-skills.json --role-filter business intelligence --out-dir $OUT/sd-bi-bi

✓ skill-demand-monitor: 58 ingested → 58 valid → 0 candidates → status: role_filter_matched_nothing
  $OUT/sd-bi-bi/skill-demand.json  +  $OUT/sd-bi-bi/skill-demand.md
[exit 0]
```

The six boards are those of the companies that have both a sponsorship record with a BI-type title and a public Greenhouse board; 58 analytics-family postings were merged. Reading the result: the unfiltered ranking is led by Python and SQL (23 of 58 each), but it mixes data-science and engineering postings. Filtered to "analyst" titles (22 postings) the ranking is led by **Excel (10), dashboards (9), SQL (7), Tableau (7)**. The filter "business intelligence" matches no title at all, so the monitor correctly refuses (`role_filter_matched_nothing`) instead of ranking nothing. Two cautions, both verified in §4: **12 of the 22** "analyst" titles carry a senior marker, and by my reading of title words **17 of the 22** look like non-BI work (accounting, support, fraud, treasury, sales- or success-operations and similar), 3 are application-modelling roles and only 2 look clearly like BI or data-analyst work, so "Excel #1" describes finance and operations analysts more than BI analysts.

### G. `ats:scan` dry-run (existing command; anchor run on the committed example)

```text
$ REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run   (summary lines only)
[exit 0]
Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)
Portal Scan — 2026-10-19
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      900
Filtered by title:     395 removed
Filtered by location:  425 removed
Duplicates:            14 skipped
New offers added:      66
(dry run — run without --dry-run to save results)

$ ls data/ats  (before vs after)
identical: no files written
```

This is the repo's real scanner, run as `docs/tutorials/01-first-scan.md` describes (committed example config selected by environment variable, and the `--` before `--dry-run` so npm passes the flag through). It scanned one company (Databricks, from the example config; not a company from this mode): 900 found − 395 removed by title − 425 removed by location − 14 duplicates = 66, matching the `New offers added` line. `data/ats` is identical before and after, so nothing was written.

### H. The role keywords are a parameter

```text
$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Cohere Health --opt-end 2028-05-31 --json $OUT/h1.json
sponsor-triage: status=complete  gates=G1:flag,G2:pass,G3:pass,G4:flag,G5:pass
[exit 0]

$ python3 scripts/contrib/2026fa/anishagaikar0420-jobpost-triage/sponsor-triage.py --company Cohere Health --opt-end 2028-05-31 --keywords machine learning,data scientist,ai engineer,applied scientist,prompt,nlp,llm --json $OUT/h2.json
sponsor-triage: status=complete  gates=G1:flag,G2:pass,G3:pass,G4:pass,G5:pass
[exit 0]
  Cohere Health, default (BI) keywords       G4=flag  no sponsored title in the record matches the role keywords (the list holds top titles only
  Cohere Health, AI keywords via --keywords  G4=pass  2 sponsored title(s) match role keywords; 1 not senior-flagged
  Klaviyo, default (BI) keywords             G4=pass  1 sponsored title(s) match role keywords; 1 not senior-flagged
```

Same company, different role family, different answer: Cohere Health flags G4 for BI keywords (no BI-type sponsored title) and passes it for AI keywords. A student with a different target switches the flag; nothing else changes. This was tested on two companies; the AI keyword list is not otherwise validated.

### I. Repo checks

```text
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 169 files (88 md · 43 py · 30 js · 4 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]

$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <npm package maintainer email, redacted by me>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
[exit 1]

$ npm run doctor   (last 12 lines)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (34)
  with lifecycle frontmatter: 34   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 5 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 325 declared (in frontmatter) · 325 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 34/34 carry lifecycle frontmatter — all tracked
  next: continue
```

The single `pii-scan` finding is an npm package maintainer's email address inside `package-lock.json` (redacted above by me, because quoting it verbatim made my own write-up trip the scanner). That file is unchanged by this work; it was committed in the repo's "Fall 2026 fresh cut", so this is a pre-existing false positive on `main`. A CI working-tree scan would fail regardless of my PR; I report it and do not allowlist it.

## 3. Verified vs inferred (line by line)

| Statement | Status | Basis |
|---|---|---|
| Klaviyo has exactly one row (line 14495) after normalization | **Verified** | `sponsor-triage.py` G2; independently read with `sed -n 14495p` (V4) |
| 154 approvals, 4 denials, Series C 2022-07-26 | **Verified** (as a record) | CSV line 14495; what the counts mean is **not** verified (window undocumented) |
| 30,369 rows, 1,557 with an approval count | **Verified** | script and independent `csv` count agree (V3) |
| The newest funding date in the dataset is 2025-09-26 (388 days old) | **Verified** | G1; matches the repo's own audit |
| The posting exists | **Verified** | Greenhouse API 200 (`fetch-board.py` exit 0) and `ats:liveness` active |
| The invented job id does not exist | **Verified** | API 404 (`fetch-board.py` exit 1); `ats:liveness` wrongly said active (V6) |
| The body says "Senior Analytics Engineer" and "5+ years of experience" | **Verified** | `seniority-gate.py` quoted snippets; `ground-fields.py` quotes found in the posting |
| Each stated field has a verbatim quote; each skill and seniority item is in a quote | **Verified** | `ground-fields.py` 6/6 (5/6 with one quote, V1) |
| The posting never mentions visa/sponsorship | **Verified** | `ground-fields.py` "not stated" and an independent grep (V5) |
| 58 postings / 22 analyst-titled; Excel 10, dashboards 9, SQL 7, Tableau 7, Python 5 | **Verified** | `skill-demand` and my independent recount (V7) |
| 12 of 22 analyst-titled postings have a senior marker in the title | **Verified** | the mode's own regex, counted in V7 |
| `ats:scan` dry-run: 900 found → 66 new, nothing written | **Verified** | 900 − 395 − 425 − 14 = 66; `ls data/ats` identical (§G) |
| "This is not an entry-level role" | **Inferred** | my reading of the two flagged snippets; a human must confirm |
| "17 of 22 analyst titles look like non-BI work; only 2 look clearly like BI" | **Inferred** | my reading of title words (V7 counts the words, I judge the meaning), not an engine script |
| "Business Intelligence Engineer is not analyst evidence" | **Inferred** | a judgment about occupations; the script only shows the title |
| "This company will sponsor me for this job" | **NOT established** | a petition history is not a promise; the mode refuses to claim it |
| "I should apply" / "I should skip" | **NOT produced** | stop condition: no tier→probability mapping (TODO 1); a human decides |
| Field *values* ("Senior", "$112,000 to $168,000 USD") | **Model-drafted**, then machine-checked | list items are checked against quotes; other values are existence-checked only |

## 4. Verification

How I confirmed the output was real, beyond re-running it:

```text
$ # V1 mutation tests: break a check on purpose, the harness must FAIL
  ground-fields: quote-in-posting check disabled -> 13 passed, 2 failed
  ground-fields: list-items check disabled -> 14 passed, 1 failed
  seniority-gate: proximity check always true -> 13 passed, 2 failed
  seniority-gate: months not converted -> 14 passed, 1 failed
  seniority-gate: range uses upper bound -> 12 passed, 3 failed
  seniority-gate: title-vs-body check disabled -> 14 passed, 1 failed
  fetch-board: slug validation removed -> 13 passed, 6 failed
  fetch-board: empty board accepted -> 18 passed, 1 failed

$ # V2 determinism: same inputs twice, diff the JSON
identical

$ # V3 independent count of CSV rows / rows with an approval count (csv module, not the script)
rows: 30369 | with approvals: 1557

$ # V4 the matched CSV line read with sed (script said line 14495)
KLAVIYO INC,Other,klaviyo.com,BOSTON,MA
script csv_line = 14495

$ # V5 the posting: independent word-bounded grep for visa/sponsorship words
52:citizenship
(the only hit is inside the equal-opportunity paragraph: "...citizenship, national origin...")
Klaviyo is committed to a policy of equal opportunity and non-discrimination. We do not discriminate on the basis of rac

$ # V6 liveness cross-check: HTTP behaviour of an invented id on each board, and the Greenhouse API answer
page: 200 ends at https://www.klaviyo.com/careers/search-jobs
page: 200 ends at https://job-boards.greenhouse.io/coherehealth?error=true
API  klaviyo/7737707003         HTTP 200
API  klaviyo/1111111111         HTTP 404
API  coherehealth/1111111111    HTTP 404

$ # V7 independent recount of skills in the 22 analyst-titled postings, and how many titles look senior
postings: 58 | analyst-titled: 22    (tool: 58 / 22)
recount in analyst-titled: {'excel': 10, 'dashboards': 9, 'sql': 7, 'tableau': 7, 'python': 5}    (tool: excel 10, dashboards 9, sql 7, tableau 7, python 5)
analyst-titled postings whose TITLE is senior-flagged by the mode's own regex: 12 of 22
analyst-titled postings by company: {'Anaplan': 7, 'Gusto': 5, 'HeartFlow': 3, 'Klaviyo': 6, 'Moloco': 1}
MY READING (a title-word list, not an engine script): non-BI-looking by title words: 17 of 22
the other 5 postings: {'Sr. Application Analyst-Anaplan Model Builder- Supply Chain': 3, 'Operations Data Analyst (Office Based)': 1, 'Senior Marketing Insights Analyst': 1}

$ # V8 does the emitted JSON parse, and the Klaviyo seniority snippets
grounding json parsed ok; 6 / 6 grounded
seniority json parsed ok; overall = flag
```

Reading the above: **V1** each of 8 deliberately broken copies of the three new scripts makes its harness fail, so the tests can fail; **V2** two runs give identical JSON; **V3–V4** the script's counts and matched line equal an independent `csv`/`sed` read; **V5** the "not stated" visa field is confirmed by grep; **V6** the liveness defect is reproduced with `curl`: an invented id on Klaviyo's board ends at the company's job-search page with HTTP 200, while the API says 404; **V7** the skill counts reconcile with an independent recount and the senior-title share is computed; **V8** the emitted JSON parses.

## Attestation

- Recipe: `case-msis-bi-analyst-sponsor-triage` v0.2.0
- By: Anisha Gaikar · 2026-10-19. I ran the seniority-gate tests and the misspelled-company check myself, and had the live-posting seniority check run in my Claude Code session at my request; I reviewed the output and read the two quoted snippets ("We're looking for a Senior Analytics Engineer" and "5+ years of experience"). My judgment: this is not an entry-level role, because it says Senior and 5+ years. The scripts, the recipe and the first run were prepared by Claude Code. Scope of this sign-off: RUNNABLE-SAMPLE only. It is not a VERIFIED attestation, so `attestation` stays `null` in the recipe frontmatter, and any later edit to the recipe or its scripts voids it.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` | all conform; 3 pre-existing warnings | pass |
| `npm run skill-demand:test` | 5 passed, 0 failed | pass |
| `ground-fields.test.py` / `seniority-gate.test.py` / `fetch-board.test.py` | 15 / 15 / 19 passed, 0 failed | pass |
| **BREAK:** 8 mutants (a check removed on purpose) across the three scripts | each harness failed (1–6 tests) | harness fails on a broken checker |
| `sponsor-triage.py` on Klaviyo | status=complete; G1 flag, G2–G5 pass | company found, role evidence, runway OK |
| **BREAK:** misspelled company | stop at G2, exit 2 | refuse, no fuzzy rescue |
| **BREAK:** company with two rows (`3AM Innovations`) | stop at G2 naming both lines, exit 2 | refuse, not pick one |
| **BREAK:** no `--opt-end` / past `--opt-end` | stop at G5, exit 2 | refuse to triage without a timeline |
| **BREAK:** simulated stale snapshot (`--today 2028-01-01`) | stop at G1 | refuse on data older than 730 days |
| company with no approval count | G3 flag (no record), complete | flag, not "does not sponsor" |
| `fetch-board.py` on a real and on an invented job id | exit 0 / exit 1 (HTTP 404) | exists / does not |
| **BREAK:** `ats:liveness` on an invented id, Klaviyo's board | `active` (wrong) while the API says 404 | `expired`; mismatch found and the mode now requires both signals |
| `seniority-gate.py` on the Klaviyo and Cohere postings | both exit 1 with quoted snippets | flag the hidden seniority |
| `ground-fields.py` with `skills` as one quote / four quotes | 5/6 with `item_not_in_quote` / 6/6 | catch an item no quote covers |
| `skill-demand` over 58 postings / `--role-filter analyst` / `--role-filter "business intelligence"` | ranked / ranked (22) / `role_filter_matched_nothing` | rank when enough data; refuse when none |
| `npm run ats:scan -- --dry-run` on the committed example | 900 found → 66 new; `data/ats` unchanged | runs, writes nothing |
| **BREAK (portability):** Cohere Health with BI vs AI keywords | G4 flag vs G4 pass | gate follows the role family |
| determinism: same inputs twice | identical JSON | identical |

### Did not test
- Any ATS other than Greenhouse (Lever, Ashby, Workday, SmartRecruiters) for ingest or liveness.
- `bls:local-wage` (inputs absent) and `npm run score` (blocked by TODO 1). `ats:scan` only on the committed example config, not a real target list.
- Company-name edge cases: non-ASCII names, `&` vs `and`, `dba` names, legal suffixes beyond those listed.
- The seniority gate on prose-only seniority ("you will own our data strategy"), on requirements written in images, or on postings in other languages.
- `fetch-board.py` is unit-tested offline with the network stubbed; its two real calls were exercised only here.
- The BI skills list was not reviewed by a human and is probably under-counting Excel; the keyword families are not validated beyond the companies shown.
- Whether the findings generalize beyond six boards of companies that already have a BI-type sponsored title.
- The GitHub CI workflows themselves (I ran their local commands), a fork, a branch, or a PR. CI may warn about the `recipes/` and `assignments/` paths (see Layout below).
- A real OPT/STEM OPT date, OPT start-date fit, and any immigration rule at all.
- A named human clearing any gate (so no RUNNABLE-LIVE), and re-running by anyone other than the scripts' author.

### Broke during testing, fixed
- **Persona.** I first built this mode for AI / prompt-engineer roles from a guess. After reading the student's earlier PR and confirming with them, I rebuilt it for BI analyst. Default keywords changed, and every number in the docs was recomputed.
- `seniority-gate.py`: my first overall verdict reported `pass` when no experience was stated; caught by re-reading before the tests, fixed to `no_statement`, and the test "no statement is never pass" plus a mutant now guard it.
- `fetch-board.test.py`: my own test helper crashed on the slug `-lead` (argparse rejects it with exit 2 before any network call, which is correct behaviour); fixed the helper to treat that as a refusal.
- **Defect found in an existing script:** `ats:liveness` calls an invented id on Klaviyo's board `active`. Worked around with a second signal (G6); recorded as recipe TODO 6, not patched in the repo.
- `ground-fields.py` let a skills list pass when its quote covered only some items (found on an earlier posting); fixed with `"kind": "list"`.
- `sponsor-triage.py`: a past `--opt-end` first ran G1–G4 before stopping, and G4 returned `pass` when every matched title was senior; both fixed earlier in the build.
- My own write-up quoted a package maintainer's email and tripped `pii-scan`; redacted.
- Layout: the assignment's paths are used (mode file under `recipes/`, justification and worked run under `assignments/submissions/anisha/`). The repo's `CONTRIBUTING.md` and CI prefer `recipes/cases/<term>/` and `course/<term>/submissions/`, so CI may print a "file(s) outside the standard namespaces — maintainer review required" warning for those two locations (a warning, not a failure). Scripts and the run log stay in `scripts/contrib/…` and `logs/runs/…`, which the assignment does not specify.
- Not fixed, logged: venv creation fails on Python 3.14; `data/bls/local-wage/` missing from the clone; the pre-existing `pii-scan` hit in `package-lock.json`; `DOMAIN.md` says 42 recipes while `npm run doctor` counted 33 before this mode was added.

## Reflection

**What went well.** Every gate is a script exit code or a number with a source line, and the mode refused in 5 of 7 sponsor-triage break attempts and said why. Running on real data beat my priors three times, and each time the *tool output was correct and the meaning was misleading*: the title "Analytics Engineer" hid a senior role; "Business Intelligence Engineer" matched a BI keyword; 17 of 22 "analyst" titles looked like non-BI work. The most useful accident was finding that the repo's own liveness check can call a fake posting live, which only a second, independent signal exposed.

**What it got wrong or missed.** (1) The seniority gate flags but cannot judge: the student still has to read the snippets and decide, and it cannot see seniority written only in prose. (2) G4 matches words, so it passed Klaviyo on an *Engineer* title; a title-to-occupation lookup (TODO 4) is the real fix. (3) "Recent funding" is not recent: the data ends 2025-09-26 and Klaviyo's last record is from 2022. (4) The H-1B counts have no stated time window, so "154 approvals" is not interpretable as a rate. (5) Postings come from public Greenhouse boards only, so the skills ranking covers six companies that already sponsor, not the market. (6) The BI skills list is unreviewed and under-counts Excel. (7) The `ats:liveness` defect is worked around, not fixed.

**Next steps (typed TODOs in the recipe).** Define a tier→probability mapping so the scorer can run (TODO 1); get `data/bls/local-wage/` and a working venv for a junior-appropriate wage floor (TODO 2); document the H-1B time window (TODO 3); crosswalk titles to SOC 15-2051.01 (TODO 4); safe entity resolution (TODO 5); patch `ats:liveness` (TODO 6); then a live run with a real OPT date and a named human clearing G5–G9 to attempt RUNNABLE-LIVE (TODO 7).
