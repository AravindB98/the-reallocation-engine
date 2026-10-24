# Worked run — msis-pm-network-targets, 2026-10-03

## Executive summary

This is the record of one real run of the recipe, for a fictional student in my exact
situation: an Information Systems master's graduate on STEM OPT targeting product roles
that ask for 1–5 years of experience.

From 30,369 companies in the visa data, the run kept 90 that have sponsored product
titles. It read the job boards of the 10 a person had confirmed. It found **4 companies
to apply to now** (18 matching postings), **6 to network into** (they sponsor product
roles but have no matching opening), and skipped a made-up company that isn't in the data.

I checked one number by hand against the raw data, and it matched. I also tried to break
the tool twice. The first break was caught, but by an accidental crash. The second exposed
a defect in the repository's own scorer, which the tool guards against.

The main lessons: every scored posting got the same score, so the score does not rank;
and "proven sponsor" means the company sponsors a lot, not that it sponsors many product
managers.

## Inputs

| Input | Value | Label |
|---|---|---|
| Persona | Meera Iyer (fictional, `meera.iyer@example.com`): MS Information Systems (STEM), graduating 2026-12, OPT/STEM end **2030-01-31**, 3.5 years of experience, PM / AI PM / Product Analyst, anywhere in the US: `scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/persona.fixture.json` | your-input |
| Sponsorship + funding data | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows, shipped with the repo) | record |
| Gate A boards | `…/fixtures/boards.sample.json`: 10 boards confirmed by AdityaHasija37 on 2026-10-03 (4 direct links, 4 indirect matches, 2 corrected) | your-input |
| Board responses | `…/fixtures/sample-responses/`: read live from the Greenhouse, Lever and Ashby APIs on 2026-10-03, trimmed to title/url/location; 0 fetch failures | record |
| Rules | tiers (≥3 approvals; Proven ≥10 and ≥90%), title / location rules, fit 0.7, hiring lag 60 days: `…/rules.mjs` | your-input |
| SEC Form D samples | **Not used**: 0 of their 196 companies appear in the CSV | n/a |

## Commands and real output

**1. Live board read (once), saving responses for replay:**

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --save-responses scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses --run-date 2026-10-03
```

```
✓ 11 companies evaluated (live+save) → apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1 (skip 9%)
  candidates from CSV: 90 · roles scored: 18
  wrote run-log.json + report.md + roles.json + role-scores.{json,md} → scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out
```

**2. The sample run (the documented command, offline replay):**

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses --run-date 2026-10-03
```

```
✓ 11 companies evaluated (offline-fixture) → apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1 (skip 9%)
  candidates from CSV: 90 · roles scored: 18
  wrote run-log.json + report.md + roles.json + role-scores.{json,md} → scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/out
```

The offline `run-log.json` is identical to the live one apart from `mode` and `inputs`.
The same output was reproduced from a clean clone (see `TEST-REPORT.md` §2).

**3. Tests:**

```bash
node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.test.mjs
```

```
ok 1 - title rule: real CSV product titles pass, look-alikes and out-of-range seniority fail
ok 2 - title list parser handles the CSV's Python-list literal, including apostrophes
ok 3 - location rule: any US place passes; non-US and lookalike state codes fail
ok 4 - sponsorship tiers: two tiers, minimum 3 approvals, Proven needs >=10 and >=90%
ok 5 - timeline gate (F5): missing, invalid, past, or too-short OPT end date stops the run
ok 6 - a role with a missing gate value is refused (the scorer would read it as an open gate)
ok 7 - offline context replays the real provider code; a missing fixture is an error, not "no openings"
ok 8 - end-to-end offline run routes every company and labels every value
ok 9 - F5 end to end: a past OPT date stops with exit 2 and writes nothing
ok 10 - missing inputs stop cleanly instead of guessing
# pass 10
# fail 0
```

**4. Results by company** (from `out/report.md`):

| Company | Route | Sponsorship [record] | What the board showed [record] |
|---|---|---|---|
| Datadog | **apply** (11 postings) | Proven · 340 approvals, 0 denials, 100% | 444 open; 11 pass the title and location rules |
| Payward (Kraken) | **apply** (4) | Proven | 79 open; 4 non-US excluded |
| PayJoy | **apply** (2) | Proven | 84 open |
| Sendbird (Delight.ai) | **apply** (1) | Proven | 8 open |
| Discord | **network** | Proven · 122 approvals | 51 open, none product |
| Iterable | **network** | Proven · 40 approvals, 2 denials, 95.2% | 13 open; a PM role in Lisbon excluded |
| BetterUp | **network** | Proven · 30 approvals | 6 open; a Principal PM excluded |
| Neo4j | **network** | Proven · 20 approvals | 66 open, none product |
| Airbyte | **network** | Proven · 20 approvals | 12 open, none product |
| Anomali | **network** | Proven · 18 approvals | 9 open, none product |
| Quillfeather Product Labs Inc | **skip** (`not-in-dataset`) | — | — (fictional, failure case F1) |

**5. One scored role, term by term** (from `out/run-log.json`):

```
DATADOG INC — Product Manager II, AI & Data Security — Apply 0.525
arithmetic: (0.9·0.35 + 0.7·0.3) × 1 × 1 = 0.525
votes: sponsorship 0.9 × 0.35 = 0.315 [record] · fit 0.7 × 0.30 = 0.21 [your-input]
gates: liveness 1 [record] · timeline 1 [your-input]
evidence: approvals 340, denials 0, approval_rate 100 [record]
```

## Verified vs inferred, line by line (the Datadog row)

| Value | Label | Why |
|---|---|---|
| 340 approvals, 0 denials, 100% rate | **record** | read from the CSV row; cross-checked by hand below |
| "PRODUCT MANAGER" among sponsored titles | **record** | `top_job_titles_sponsored` |
| that title counts as a 1–5-year product title | **your-input** | the title rule |
| Tier "Proven", p = 0.9 | **your-input** applied to a record | The thresholds (≥10, ≥90%) are my choice. The scorer's trace labels this term `record` because it has one label per term; the counts are the record, the 0.9 is my rule. |
| Datadog's board is `job-boards.greenhouse.io/datadog` | **your-input** (Gate A, indirect evidence) | The board's postings link back to careers.datadoghq.com. My first hand check said "no". |
| The posting was listed on that board on 2026-10-03 | **record** | board API response, saved |
| Liveness factor 1 | **record**, but only "listed" | Listed is not the same as "really hiring"; not checked with `ats:liveness` |
| Location "Boston / New York" passes as US | **your-input** | the location rule |
| fit 0.7 | **your-input** | a constant; it does not compare me with the role |
| Timeline factor 1 (1,216 days left ≥ 60) | **your-input** | the OPT date and the lag are mine |
| 0.525 → Apply | arithmetic by the repo's scorer | not re-implemented |
| E-Verify, STEM-OPT relatedness, the years behind the approvals, how many approvals were PMs | **not verified** | not in any repo data |
| Model judgment | **none** | no AI output entered any value |

## Verification

- **Hand cross-check (AdityaHasija37).** My first attempt used
  `grep … | cut -d, -f1,3,13-18` and **printed the wrong columns**, because quoted fields
  in the CSV contain commas. I re-ran it with a CSV reader:

```
{'company_name': 'DATADOG INC', 'Total Approvals': '340.0', 'Total Denials': '0.0', 'Approval_Rate': '100.0', 'top_job_titles_sponsored': "['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER']"}
```

  The report says `Proven · 340 approvals, 0 denials, 100%`. **Match.**
- **Tests:** 10/10 offline, also from a clean clone.
- **Deliberate breaks:** two, in the attestation below.

## Reflection

*My words; grammar and wording tidied with AI help, meaning unchanged.*

**What worked.** The recipe gave me a target list I would not have had otherwise. Gate A
caught two wrong boards (Iterable, Payward/Kraken) and a rebrand (Sendbird → Delight.ai)
that the data did not know about. The tool never turned "couldn't check" into "nothing
there", and it refused to pass the scorer a role with a missing gate.

**The skip rate.** A 9% skip rate is fine for me: the more companies left in, the better,
as long as I am not wasting time on companies with zero chance. The data filter had
already done that work. For the record, this differs from the engine's guideline that a
healthy run skips at least half. Here the skipping happens before evaluation
(30,369 → 90 candidates → 11 evaluated), so the company-level rate is measured on a list
that has already been filtered hard.

**The flat 0.525 score.** *(This paragraph was drafted by the AI at my request; I
reviewed it and agree with it.)* All 18 scored postings got exactly 0.525, because every
company that reached the scorer was a Proven sponsor (p 0.9) and fit is a fixed 0.7, so
the arithmetic was the same every time: 0.9 × 0.35 + 0.7 × 0.30. The score therefore says
only that the gates are open and the sponsor is strong. It does not help choose between
Datadog's 11 Apply postings; that choice is mine at Gate D, made on team, product and
level. This comes more from my setup than from the scorer: a real fit value, or a sample
that included Likely sponsors, would spread the scores out.

**What the recipe missed.** "Proven" turned out to mean "sponsors a lot, including at
least one product title", not "sponsors many PMs". My own cross-check showed that.
STEM-OPT degree relatedness and E-Verify are also outside what any repo data can answer.

**Next improvement.** Add filters for company size and domain, and for recent layoffs or
funding, which would really help the job search. Funding dates already exist in the data
but are about six years old on average. Layoffs would need a new data source, such as
WARN Act notices.

## Attestation

- Recipe: msis-pm-network-targets v0.1.0 (DRAFT)
- By: AdityaHasija37 · 2026-10-03

### Tested

| Ran | Saw | Expected (per the recipe) |
|---|---|---|
| The sample run, offline (command 2 above) | `apply 4 · consider 0 · network 6 · human-check 0 · board-unknown 0 · skip 1`; 18 roles scored | Every company gets exactly one route with a reason; outputs written; nothing invented |
| The same command from a clean clone of commit `dedb123` | identical output; tests 10/10; `pii-scan --diff`: clean | Runs from a fresh checkout with one command |
| Hand cross-check of Datadog against the CSV | 340.0 / 0.0 / 100.0 = report's 340 / 0 / 100% | Report values trace to the record |
| **Break 1:** planted a bug routing a failed board fetch to `network`; ran the tests | `not ok 8`, `expected: 0 / actual: 1`, 9 pass / 1 fail. The cause was a crash in the report writer (`TypeError … at renderReport`), not the route assertion. | The suite fails; a failed fetch must be `board-unknown`, never `network` (failure case F3) |
| Break 1 undo: `git restore`, tests | `# pass 10 / # fail 0` | All tests pass on committed code |
| **Break 2:** deleted `liveness` from a real Apply role; scored it with `role-scorer.mjs` directly | `Apply 0.525`, liveness `multiplier 1`, `"source":"record"` | A missing gate must not count as open, and no value without a record may be labeled `record`. **Not met, by the repo's scorer.** |
| Break 2: the prototype's `buildRole` on the same role | `REFUSED: … liveness gate value missing (the scorer would read it as open)` | The prototype refuses a role with a missing gate |

### Did not test

- The optional `ats:liveness` spot check on the Apply postings (listed ≠ really hiring).
- Any Likely-tier company in the live sample: all 10 Gate A companies were Proven (the
  AI chose which 10 went to Gate A). The Consider path is tested only with fixtures.
- A board whose fetch fails in a live run (tested only with a saved 404).
- Lever's provider returning a non-list error body with HTTP 200, which it would read as
  zero postings.
- The other 80 candidates without a Gate A entry, and whether boards confirmed today are
  still right next month.
- E-Verify, STEM-OPT relatedness, and the years behind the approval counts: no data.
- Personal predictions for the break attempts were not written down beforehand.

### Broke during testing, fixed

- The first coverage probe reported 0 of 91 boards: Python SSL errors were counted as "no
  board". Re-run with `curl`, counting errors separately (`CHANGE-BRIEF.md` Revisions).
- The location rule accepted "London, UK" as US: case-insensitive state-code match.
  Fixed in `rules.mjs` before the first run.
- `node --test <folder>` fails on Node 22; the documented command names the test file.
- `FRICTIONAL.md` tripped the PII scan by quoting an address from a scan finding;
  reworded.
- The report printed `95.23809523809524%`; rounded for display only, record kept in
  `run-log.json`.
- My hand cross-check command (`cut`) read the wrong CSV columns; replaced with a CSV
  reader.
