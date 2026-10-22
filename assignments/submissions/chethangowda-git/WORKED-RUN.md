# Worked Run — H-1B Wage-Floor Triage for SDE I / SDE II

## Executive summary

**What this is.** The record of actually running the mode: first on 20 made-up postings built to
exercise every rule, then on five real, live job postings from four companies, fetched on
21 October 2026.

**Why read it.** It shows the real commands and their real output, separates what the data proved
from what a person or model judged, and lists — honestly — what was not tested and what broke
along the way.

**What it found.** The checks did what they claim: all 36 test checks pass, and two deliberately
broken copies of the gate are caught. On the real postings, all five were live; three were ruled
out by their own wording (two need a security clearance, one refuses sponsorship); the other two
never state a start date, so the mode stopped. Assuming a June 2027 start, those two land in
"a person decides" because their pay ranges straddle the minimum for the experience they ask for.
No posting passed. The biggest thing the mode missed is experience fit: both survivors ask for
5+ and 7+ years.

---

## Run record

| | |
|---|---|
| Mode | `recipes/cases/2026fa/chethangowda-git-h1b-wage-floor-sde.md` v0.1.0 (RUNNABLE-SAMPLE) |
| Branch / code | `mode/chethangowda-git-h1b-wage-floor` at `33fb146` |
| Date | 2026-10-21 |
| Machine | macOS, Node v25.8.1, Python 3.13.9 |
| Wage data | DOL OFLC wage year 2026–27, hand-downloaded 2026-10-21 (`data/oflc/README.md`) |
| Real-run evidence | `private/real-postings/2026-10-21/` — local only, never committed |

## Inputs

**Sample run** — `scripts/oflc/fixtures/postings.sample.json`: 20 fictional postings (companies
marked "(fictional)", URLs on `example.com`), each carrying its expected outcome and the arithmetic
behind it; plus `scripts/oflc/fixtures/greenhouse-job.sample.json`, one fictional Greenhouse record.

**Real run** — five live postings on Greenhouse boards, fetched from the public job-board API.
**Anonymized:** company names, posting IDs and URLs are replaced below; the originals stay in
`private/`. Pay, experience and visa wording are as posted.

| ID | Company | Role level | Location as posted | Pay as posted | Years asked |
|---|---|---|---|---|---|
| A1 | Company A | Software Engineer | a Maryland town, not a target city | $170,000–$200,000 | 12 |
| A2 | Company A | Cloud Software Engineer | same | $170,000–$200,000 | 8 |
| B | Company B | Software Engineer II | "United States" (no office) | $114,000–$148,000 | 3+ |
| C | Company C | Senior Software Engineer | Boston, MA | $148,000–$222,000 | 7+ |
| D | Company D | Senior Software Engineer | San Mateo, CA | $180,000–$280,000 | 5+ |

**Settings:** earliest start `2027-06` (your-input); SOC 15-1252 and private employer assumed;
experience band rule <2 yrs → L1/L2, 2–<5 → L2/L3, ≥5 → L3/L4 (your-input).

## Commands and real output

Output is pasted as printed. In the real-run blocks, posting URLs and company IDs are replaced by
`‹A1›`…`‹D›` and the Maryland town by `‹MD town›`; nothing else is edited.

### 1. Toolchain baseline (clean branch, before any change)

```
$ npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 158 files (85 md · 36 py · 30 js · 4 sh · 3 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

`npm run doctor` — **excerpt** (its full output lists all 24 npm scripts and 8 domain
directories, every one ✓):

```
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

The two W2 warnings are a manifest-checker false alarm: `.gitignore` ignores `/private/*` and
`/data/ats/*` with exceptions for their README files, which the checker does not recognise; the
doctor's privacy check confirms nothing private is tracked.

### 2. Wage-data extract (sample of the new data layer)

```
$ python3 -I scripts/oflc/extract-prevailing-wages.py --src ~/Downloads/OFLC_Wages_2026-27
Wrote 20 areas to data/oflc/alc-15-1252-wy2026-27.csv
Wrote 41 cities to data/oflc/city-area-map-wy2026-27.csv (3 split-needs-worksite)
Wrote 44 counties to data/oflc/county-area-map-wy2026-27.csv
Wrote audit to data/oflc/oflc-extract-audit.md
exit=0
```

### 3. Test suite and deliberate breaks

```
$ python3 -I scripts/oflc/wage-timeline-gate.test.py
ok   fixture run exits 0
ok   log and report written
ok   nothing else written to out-dir
ok   pass-sf-newgrad: PASS salary-min-clears-L2
ok   fail-austin-sdeii: FAIL salary-max-below-L2
ok   uncertain-sunnyvale-sdeii: UNCERTAIN between-L2-and-L3-human-decides
ok   skip-jan-2027: SKIP timeline-closed
ok   stop-no-start: STOP missing-gate-value:timeline
ok   stop-acwia: STOP acwia-table-not-extracted
ok   stop-soc: STOP soc-not-extracted
ok   stop-unknown-city: STOP unknown-location
ok   stop-raleigh-no-county: STOP split-needs-worksite
ok   pass-raleigh-wake: PASS salary-min-clears-L2
ok   stop-missing-salary: STOP missing-salary
ok   stop-missing-experience: STOP missing-experience
ok   pass-seattle-hourly: PASS salary-min-clears-L2
ok   pass-atlanta-boundary: PASS salary-min-clears-L2
ok   uncertain-phoenix-max-only: UNCERTAIN between-L2-and-L3-human-decides
ok   pass-la-senior-band: PASS salary-min-clears-L4
ok   skip-no-sponsorship: SKIP posting-refuses-sponsorship
ok   skip-clearance: SKIP requires-clearance-or-citizenship
ok   pass-we-sponsor: PASS salary-min-clears-L2
ok   pass-company-sponsored-events: PASS salary-min-clears-L2
ok   log counts match fixtures
ok   report opens with an executive summary
ok   converter exits 0
ok   converter parses city/state
ok   converter parses pay range
ok   converter takes experience years, not '2 year anniversary'
ok   assumed start is labeled your-input
ok   converter -> gate: UNCERTAIN, 'we do sponsor' logged as info
ok   'United States' only -> no city, no start
ok   malformed JSON exits 2
ok   malformed JSON writes nothing
ok   text salary exits 2
ok   text salary writes nothing

36/36 passed
exit=0

$ python3 -I scripts/oflc/wage-timeline-gate.test.py --gate <scratch>/mutant-a-gate.py   # rule 1 removed
TypeError: '<' not supported between instances of 'NoneType' and 'str'
11/36 passed
exit=1

$ python3 -I scripts/oflc/wage-timeline-gate.test.py --gate <scratch>/mutant-b-gate.py   # missing start treated as open
FAIL stop-no-start: STOP missing-gate-value:timeline -- got PASS salary-min-clears-L2
FAIL log counts match fixtures -- got {'PASS': 8, 'UNCERTAIN': 2, 'FAIL': 1, 'SKIP': 3, 'STOP': 6}
34/36 passed
exit=1

$ python3 -I scripts/oflc/extract-prevailing-wages.py --src <empty folder>
extract-prevailing-wages: missing source file: ALC_Export.csv
exit=2

$ python3 -I scripts/oflc/extract-prevailing-wages.py --src ~/Downloads/OFLC_Wages_2026-27 --cities <copy with Boulder -> "Nowhere County">
extract-prevailing-wages: counties not found in Geography.csv: Nowhere County, CO (for Boulder)
exit=2
```

### 4. Real postings — liveness (the required existing repo script, real data)

```
$ npm run ats:liveness -- ‹A1› ‹B› ‹A2› ‹C› ‹D›

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs ‹A1› ‹B› ‹A2› ‹C› ‹D›

Checking 5 URL(s)...

✅ active     ‹A1›
✅ active     ‹B›
✅ active     ‹A2›
✅ active     ‹C›
✅ active     ‹D›

Results: 5 active  0 expired  0 uncertain
exit=0
```

### 5. Real postings — sponsorship history (80 Days CSV, sponsorship columns only)

A read-only Python one-off (the script for this step is proposed, not built) matched the four
company names against `company_name` and printed only the sponsorship columns. Output, with
company names replaced and the `titles=` column (a list of sponsored job titles) cut after
`|`:

```
line 14495: ‹C› | approvals='154.0' denials='4.0' rate='97.46835443037976' | titles=…
line 28583: ‹D› | approvals='272.0' denials='4.0' rate='98.55072463768116' | titles=…
```

It printed no row for Company A or Company B.

### 6. Real postings — convert and gate, two scenarios

```
$ python3 -I scripts/oflc/greenhouse-to-gate-input.py <5 files> -o gate-input.json
‹A1›: ‹MD town›, MD | $170,000-$200,000 | years=12 | start=None
‹A2›: ‹MD town›, MD | $170,000-$200,000 | years=8 | start=None
‹B›: None, None | $114,000-$148,000 | years=3 | start=None
‹C›: Boston, MA | $148,000-$222,000 | years=7 | start=None
‹D›: San Mateo, CA | $180,000-$280,000 | years=5 | start=None
Wrote 5 postings to private/real-postings/2026-10-21/gate-input.json
exit=0

$ python3 -I scripts/oflc/wage-timeline-gate.py gate-input.json --out-dir run-as-is
5 postings: PASS 0, UNCERTAIN 0, FAIL 0, SKIP 3, STOP 2
Wrote log to private/real-postings/2026-10-21/run-as-is/wage-gate-log.json
Wrote report to private/real-postings/2026-10-21/run-as-is/wage-gate-report.md
exit=0

$ python3 -I scripts/oflc/greenhouse-to-gate-input.py <5 files> -o gate-input-assume-2027-06.json --assume-start-month 2027-06
‹A1›: ‹MD town›, MD | $170,000-$200,000 | years=12 | start=2027-06
‹A2›: ‹MD town›, MD | $170,000-$200,000 | years=8 | start=2027-06
‹B›: None, None | $114,000-$148,000 | years=3 | start=2027-06
‹C›: Boston, MA | $148,000-$222,000 | years=7 | start=2027-06
‹D›: San Mateo, CA | $180,000-$280,000 | years=5 | start=2027-06
Wrote 5 postings to private/real-postings/2026-10-21/gate-input-assume-2027-06.json
exit=0

$ python3 -I scripts/oflc/wage-timeline-gate.py gate-input-assume-2027-06.json --out-dir run-assume-2027-06
5 postings: PASS 0, UNCERTAIN 2, FAIL 0, SKIP 3, STOP 0
Wrote log to private/real-postings/2026-10-21/run-assume-2027-06/wage-gate-log.json
Wrote report to private/real-postings/2026-10-21/run-assume-2027-06/wage-gate-report.md
exit=0
```

Report table from `run-assume-2027-06/wage-gate-report.md` (anonymized):

| ID | Location (area) | Start | Salary | Levels | Floors (annual) | Outcome | Reason |
|---|---|---|---|---|---|---|---|
| A1 | ‹MD town› | 2027-06 | — | — | — | **SKIP** | requires-clearance-or-citizenship |
| A2 | ‹MD town› | 2027-06 | — | — | — | **SKIP** | requires-clearance-or-citizenship |
| B | None, None | 2027-06 | — | — | — | **SKIP** | posting-refuses-sponsorship |
| C | Boston, MA (14460) | 2027-06 | $148,000–$222,000 | L3/L4 | $162,198 / $186,160 | **UNCERTAIN** | between-L3-and-L4-human-decides |
| D | San Mateo, CA (41860) | 2027-06 | $180,000–$280,000 | L3/L4 | $193,149 / $221,187 | **UNCERTAIN** | between-L3-and-L4-human-decides |

Text flags (matched words; surrounding text trimmed to avoid identifying the employer):

| ID | Flag | Matched |
|---|---|---|
| A1, A2 | clearance-or-citizenship | "…with a TS/SCI + Poly clearance…" |
| B | no-sponsorship | "…where this position is located without sponsorship." |
| D | sponsors (info only) | "We do sponsor and take over sponsorship of employment visas for this role" |

## Verified vs. inferred

| Claim | Established by | Label |
|---|---|---|
| All five postings were live on 2026-10-21 | `ats:liveness` output | **verified** |
| Pay ranges | Greenhouse `pay_input_ranges` (structured) | **verified**; that they are annual is assumed |
| Years asked (12, 8, 3, 7, 5) | converter's "N years … experience" match, checked by eye against each posting | **verified (text match)** |
| Locations; B has no office | Greenhouse `location.name` | **verified** |
| C → area 14460, D → area 41860 | DOL geography via the committed county/city maps | **verified** |
| Floors $162,198 / $186,160 and $193,149 / $221,187 | DOL hourly wages × 2,080 | **verified hourly**; annualization is a convention |
| C and D have 154 and 272 H-1B approvals | 80 Days CSV, lines 14495 and 28583 | **verified** (company-wide, no year) |
| A and B have no H-1B record | absence of a row in 80 Days | **verified absence** — not evidence they never sponsor |
| A and B are closed to a visa holder | regex matches + reading the snippet | **verified text**; that TS/SCI requires US citizenship is a **judgment** from general knowledge |
| Start month 2027-06 | assumption for scenario 2 | **your-input** |
| L3/L4 band for 5+ and 7+ years | the job seeker's band rule | **your-input** |
| Which level C or D would file | — | **cannot verify** |
| C and D ask for more experience than this persona has | comparison of 5+/7+ against 3 years, by the author | **inferred** (no script does this yet) |

## Verification

- **Fingerprints.** SHA-256 of `ALC_Export.csv` (`54115f7b…4396`) and `Geography.csv`
  (`70072d0f…3493`), recomputed with `shasum -a 256`, match `data/oflc/oflc-extract-audit.md`.
- **Hand-checked numbers.** San Jose 41940 L1–L4 (73.46 / 89.94 / 106.43 / 122.91) and Huntsville
  26620 (39.95 / 50.52 / 61.09 / 71.66) were read from the raw DOL file *before* the extractor
  existed and match its output. The real-run floors for C and D match hand calculations made before
  the gate ran.
- **Counts against source.** 80 Days: 30,369 rows, 1,557 with sponsorship (5.1%), matching the
  upstream audit. ALC rows: 449,440 + header = the file's 449,441 lines.
- **Mutation.** Two broken gates (above) are caught; mutant B — the quiet, fail-open one — is
  caught on exactly the posting it breaks.
- **No leakage.** `git status` never lists `private/`; `npm run pii-scan` reports nothing new in
  tracked files (its only tracked finding is a pre-existing npm author email in `package-lock.json`).

## Attestation

- Recipe: chethangowda-git-h1b-wage-floor-sde v0.1.0
- By: Chethan Gowda GT · 2026-10-21

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `wage-timeline-gate.test.py` | 36/36, exit 0 | every fixture's outcome and reason match |
| Mutant A: start-date stop removed | crash, 11/36, exit 1 | test fails |
| Mutant B: missing start treated as open | quiet PASS on `stop-no-start`, 34/36, exit 1 | test fails on that posting only |
| Extractor with an empty `--src` | exit 2, "missing source file: ALC_Export.csv" | halt, nothing written |
| Extractor with "Nowhere County" | exit 2, names Boulder | halt, nothing written; real outputs' SHA-256 unchanged |
| Gate with broken JSON / `"120k"` salary | exit 2, nothing written | halt |
| Converter on a sample with "2 year anniversary" bait | years = 3 | experience phrase only |
| `npm run ats:liveness` on 5 real URLs | 5 active, exit 0 | each URL classified |
| Gate on 5 real postings, as posted | SKIP 3, STOP 2 | missing start dates stop, never pass |
| Gate on 5 real postings, start assumed 2027-06 | SKIP 3, UNCERTAIN 2 | floors match hand calculation |

### Did not test

- A real posting that is **expired** or **uncertain** — all five were active, so the liveness
  gate was only seen open.
- A real posting with a **stated start date**, or a real **PASS** or **FAIL**.
- Lever, Ashby or Workday postings (no converter).
- A Greenhouse posting with **several pay ranges**, or a range that is hourly or not annual.
- A **reworded** refusal ("we are unable to support visas at this time") or a mutant that weakens
  the text patterns.
- Duplicate rows or lowercase state codes in the city table.
- Wage areas with `GeoLvl` other than 1; the university (EDC) wage table.
- A Linux / case-sensitive checkout, or a Python version other than 3.13.
- The 80 Days lookup as a script — it was a one-off read (proposed, not built).
- That `npm run doctor` checks this recipe — it scans only top-level `recipes/`.

### Broke during testing, fixed

- **Shell, not code:** the first real-run conversion failed (exit 2, "missing file") because zsh
  does not split `$RAW` into words; both scripts refused the bad input correctly. Re-run with a
  zsh array.
- **Shell:** `grep --include=*.md` was glob-expanded by zsh (quoted); `PIPESTATUS` is
  `pipestatus` in zsh (exit code re-captured).
- **Estimate:** predicted 26 target counties; the extractor wrote 44 — the prediction was wrong,
  the script's count stands.
- **Docs:** `data/oflc/README.md` did not list the county map; added in `40b2042`.
- **Anonymization:** a draft of the recipe card named the real posting's town next to "TS/SCI";
  removed before commit.
- **Overclaim:** a draft of the justification said that posting "cleared every number"; it was
  never wage-checked (not a target city). Replaced with a checked claim (above L2 in 19 of 20 areas).

## Reflection

**What went well.**
- **Stopping instead of guessing.** Every gap in the real data — no start date, no office,
  unknown town — produced a named stop rather than a quiet default.
- **Tests that can fail.** The fail-open mutant mirrors a real defect in the repo's own scorer,
  which treats a missing liveness or timeline value as open; this mode's test catches that shape.
- **Real data changed the design.** The text check exists because reading five real postings
  showed that the most decisive facts (clearance, "without sponsorship") are in prose, not in the
  pay or location fields.

**What the mode got wrong or missed.**
- **Experience fit.** Its two survivors ask for 5+ and 7+ years against three; the mode evaluated
  them anyway. That is the most important miss.
- **Start dates.** All five postings are silent, so the timeline gate stops everything unless a
  person supplies a value — and an experienced-hire posting published in October most likely wants
  someone well before June 2027.
- **Remote postings.** Company B gave no office; had its text not refused sponsorship, it would
  have stopped on location with no way forward.
- **Sponsorship evidence is coarse.** Company-wide counts with no year or job code; the step is
  still a one-off read, not a script.

**Repository gaps found along the way** (not fixed here): `npm run doctor` misreads a status line
that has an inline comment and does not scan `recipes/cases/`; conformance does not check Markdown
under `data/`; `skill_programming_lv` is blank for 15-1252 in the BLS compact table; the BLS audit
records an absolute path from another machine; `bls:local-wage` cannot run in a fresh clone (no
`.venv`, no input data) and is a cost-of-living adjustment, not a prevailing wage.

**Next steps.**
1. Build the experience-vs-candidate check and the 80 Days lookup script.
2. Confirm ×2,080 and `GeoLvl` from OFLC documentation; replace the 2027-06 scenario with a real
   earliest-start date.
3. Add LCA disclosure data so "UNCERTAIN" can cite the level an employer has actually filed.
4. Run on a larger, mixed batch (new-grad postings, other ATS providers) and record a live gate
   decision toward RUNNABLE-LIVE.
