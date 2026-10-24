# Worked run — ms-is-swe-opt-shortlist

## Summary

This is one real run of the shortlist prototype for an international master's student (Information Systems, graduating December 2026, F-1 OPT) looking at entry-level software engineer jobs. Twelve entries went in: seven real postings and five companies with no posting. Three entries were scored by the existing scorer (one Apply, one Consider, one Skip). One real contract posting was checked on the OPT-bridge track (live posting and timeline only, no sponsorship score). Two were excluded by a human reading the posting text (a citizenship requirement and a security-clearance requirement), two came back unscored because the company is not in the dataset, and four became networking targets. The most useful findings are about what the tool cannot see: citizenship and clearance requirements, seniority, large employers missing from the data, and a stale snapshot. All pasted output below is real; where a value is a person's judgment it says so.

## Inputs

- **Dates (placeholders, not the student's real dates):** `--as-of 2026-10-03`, `--opt-start 2027-01-15`, 90-day unemployment window, 45-day hiring lag, flat fit 0.5. Real immigration dates are not committed.
- **Data:** `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, 30,369 rows, sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` (matches `sha256sum` of the file), newest funding date 2025-09-26, 372 days before the as-of date.
- **Postings file:** `course/2026fa/submissions/Vrajesh-works/real-run-postings.json`. Where each entry came from:
  - Verkada and Cohere Health: found by Claude Code on those companies' public Greenhouse job boards, via a web fetch that a summarizer processed. Each URL was then confirmed with the repo's checker.
  - Talent Vine, Intuit, Confido: URLs supplied by Vrajesh. Tracking parameters (`jr_id`, `cid`) were removed from the stored URLs.
  - Databricks, Whatnot, Grammarly, Foursquare Labs: companies from the CSV with no posting URL (networking targets).
  - "Google": a probe chosen by Claude Code to test the not-in-dataset path.

## Commands and real output

Liveness (run by the AI in this session; the human must reopen each page):

```text
$ npm run ats:liveness -- https://job-boards.greenhouse.io/verkada/jobs/5194598007 https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
✅ active     https://job-boards.greenhouse.io/verkada/jobs/5194598007
✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
Results: 2 active  0 expired  0 uncertain
```

The same checker printed `✅ active` for the Talent Vine (Recruiterflow), Intuit and Confido (Ashby) pages on 2026-10-02, and for the Motion Recruitment and Boeing pages on 2026-10-03.

Prototype:

```text
$ node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
    --postings course/2026fa/submissions/Vrajesh-works/real-run-postings.json \
    --as-of 2026-10-03 --opt-start 2027-01-15 --out-dir course/2026fa/submissions/Vrajesh-works/runs
✓ 3/12 scored · ✓ scored 3 roles → Apply 1 · Consider 1 · Skip 1 (skip 33%)
```

Scorer arithmetic (from `runs/shortlist-log.json`):

```text
VERKADA INC   Backend Engineer - Connectivity   (0.9·0.35 + 0.5·0.3) × 1 × 1 = 0.465  Apply
COHERE HEALTH Software Engineer II              (0.6·0.35 + 0.5·0.3) × 1 × 1 = 0.360  Consider (soft spot: tier "Likely")
CONFIDO INC   New Grad Software Engineer        (0·0.35   + 0.5·0.3) × 1 × 1 = 0.150  Skip (< 0.2)
```

Full table: `runs/shortlist-report.md`. Rows that did not get a score: Talent Vine and Boeing `excluded` (postings say "U.S. citizenship (required)" and "Active TS/SCI with Polygraph Clearance"); Motion Recruitment `opt-bridge-open` (OPT-bridge track, no score); Intuit and Google `not-in-csv`; Databricks, Whatnot, Grammarly, Foursquare Labs `no-posting` → network targets.

## Verified vs. inferred

| Value | Label | Basis |
|---|---|---|
| Verkada: 272 approvals, 4 denials, rate 98.6% | record | raw CSV row; rate recomputed by hand: 272 / (272 + 4) = 0.9855 |
| Verkada, Cohere, Confido latest funding dates and stages | record | CSV row; **stale** (see below) |
| Verkada tier "Proven" and p = 0.9 | rule over record fields; thresholds are the student's | ≥10 approvals and a non-senior software title ("Software Engineer") in the row's title list |
| Cohere tier "Likely" | rule | its software titles are "Senior Software Engineer, Platform" and "Software Engineer II"; "II" counts as senior wording |
| Confido tier "None" | record absence | blank approvals in the CSV; **absence of a record, not proof of non-sponsorship** |
| Postings are active | your-input (transcribed) | output of `npm run ats:liveness`, 2026-10-02 and 2026-10-03; the program did not check |
| Talent Vine and Boeing exclusions | your-input | read from the posting text by a person. Boeing's posting requires an active TS/SCI clearance and does not itself say "citizenship"; that it needs U.S. citizenship is a reading, not posting text |
| Motion Recruitment `opt-bridge-open` | rule over your-input | the checker said active (2026-10-03) and the timeline has room. The posting is a senior, embedded role asking 6+ years, which the bridge track cannot see. Kept as a bridge row on purpose to show that limit; whether it is allowed on the student's OPT is not checked |
| Timeline factor 1 | your-input | window ends 2027-04-15; 194 days remain; slack 149 ≥ lag 45 |
| Fit 0.5 | your-input | flat for every company; does not rank them |
| "Entry-level" for any of these roles | **not verified** | only Intuit and Confido say new grad; the data says nothing about the level of what a company sponsored |
| Confido's "$55M Series B" | company claim in the posting, unverified | the CSV shows only a $1.8M pre-seed from 2024-06-25 |
| Whether Intuit or Confido sponsor | **not verified** | neither posting says; Intuit is not in the data; Confido has no approvals on record |

## Verification

Note: after the real run and break attempts below, an `opt-bridge` track was added (2 tests; 17 total). It does not change any row in the real run, which has no bridge postings; it has only been exercised by fixtures.

- Hand check of one CSV value (above), and the CSV hash matches the logged hash.
- 17 offline tests pass (`# pass 17`), conformance passes.
- Deliberate break attempts: see the attestation. One of them found a real bug.

## What the run showed that the design did not predict

- **Eligibility text is invisible to the data.** The Talent Vine posting is "active" and the agency is absent from the CSV, but the posting requires U.S. citizenship. Only reading it catches that. This led to the `excluded_reason` field.
- **Large employers can be missing.** Intuit is not in the file. Searching for "intuit" finds only unrelated "Intuitive …" fund entities, which is why matching is exact. The "not found" message now says absence is not evidence either way.
- **The snapshot is old, and "recent" hides it.** Funding of 2025-09-08 counts as "recent" under the 24-month rule even though the data is 372 days old. Confido's posting claims a later round than the CSV shows.
- **A Skip may be wrong.** Confido's Skip comes from missing approvals at a young company, so it may be a false negative.
- **The bridge track cannot see seniority.** Motion Recruitment's contract role is live and the timeline has room, so it is `opt-bridge-open`, yet it asks for 6+ years in embedded C. A person has to judge fit.
- **Requirements can hide in required qualifications.** Boeing's "entry-level" role requires an active TS/SCI clearance. No dataset here shows that.
- **The skip rate on the scored roles is 33%**, below the 50% a healthy run should reach, from only three scored roles.

## Reflection

Before this run, I assumed it would be very hard to find out a company's H-1B sponsorship record and the other facts about a job. I thought I would need two or three other tools to do it, or else apply blindly until I was rejected. When I gave the tool new job postings, it gave me a good overall picture of where I stand for each role.

What I am least sure about is how long the sponsorship data stays true. With the new H-1B rules, many companies may be changing their policies. Sponsorship may also differ by team: even if a company sponsors, one team may sponsor while another does not, and the data has only one row per company.

My first next step is to update the list of H-1B sponsors, because some companies may have changed their policies under the new rules. The data in this run ends on 2025-09-26, so it cannot show those changes.

## Attestation

- Recipe: ms-is-swe-opt-shortlist v0.1.0
- By: Vrajesh Mathurbhai Nasit - 10/3/2026
### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run ats:liveness` on the Verkada and Cohere Health URLs | `✅ active` for both, 2 active / 0 expired / 0 uncertain | active |
| prototype on 12 postings, `--as-of 2026-10-03` | `3/12 scored · Apply 1 · Consider 1 · Skip 1` | postings with a URL, a dated live result and a CSV row score; the rest are unscored with a reason |
| **break:** `--as-of 2027-04-01` (after the OPT window ends) | all 3 scored roles Skip: `gated: timeline ≈ 0.000` | timeline gate closes, every role Skip |
| **break:** company name misspelled (`VERKDA INC`) | status `not-in-csv`, scorer not run | no fuzzy guess, no score |
| **break:** `--out-dir data/examples` (a tracked folder) | exit 2, "would overwrite tracked files"; `git status` of `data/` empty afterwards | refused, nothing overwritten |
| **break:** posting with `liveness: {status: "live"}` and no date | status `liveness-unresolved`, not scored | never defaulted to live |
| **break:** `--as-of 2026-02-30` | **accepted**, run completed with exit 0 | rejected as not a real date |
| same, after the fix | `✗ --as-of is not a real date: "2026-02-30"`, exit 2 | rejected |
| `node --test .../shortlist.test.mjs` | 17 tests, 17 pass, 0 fail | all pass |

### Did not test

- A clean checkout of the pushed branch; GitHub CI.
- Any posting that is actually expired (no real dead posting was available; the dead-posting path is covered by a fixture only).
- `--profile`, Linux/macOS, Node 20.
- Whether any posting's level, location or sponsorship stance matches the student; those need a person.
- The scorer's `Consider` floor (0.20) and `role_quality` weight; both are the engine's own `[VERIFY]` items and were not changed.

### Broke during testing, fixed

- `--as-of 2026-02-30` was accepted because `Date.parse` rolls impossible days forward (2026-02-30 → March 2). Fixed in `parseDate` by round-tripping the string; regression assertions added to the timeline tests (`2026-02-30`, `2027-04-31` rejected; leap day `2028-02-29` accepted).
- Earlier, in development: a flat fit of 0.7 put no-sponsor companies in the Consider band, so the default became 0.5; one timeline test had the wrong expected value (the code was right).
