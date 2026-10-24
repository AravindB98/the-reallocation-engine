# Worked run: h1b-wage-level-odds v0.1.0

## Executive summary

**What this is.** The record of running the H-1B wage-level mode on live data on 19 October 2026: the inputs, the exact commands, their pasted output, which results are records and which are judgments, how the results were checked, and what broke.

**Why read it.** It shows that the mode ran on live job postings rather than describing a run, and where its answers stop being reliable.

**What it found.** Of 13 live software engineer postings, 9 got a checked wage level, 1 was held by a person at the job-code gate and 3 were refused for a stated reason. The same $166,000 minimum is Level III in New York and Level II in Bellevue and Menlo Park. A real 2027 new-grad posting starts $8,071 below the San Francisco Level I wage. A Stripe Seattle backend posting starts at exactly the Seattle Level IV threshold. A person checked four wage values against the Labor Department's website, and they matched. Six deliberate break attempts were made. Nine defects or weaknesses were found and fixed, three of them by an outside review of the submission on 21 October, which showed that the code did not yet enforce three of the human gates the recipe promised.

---

## Inputs

| Input | What | Label |
|---|---|---|
| Persona | `scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/persona.json`: "Meera Joshi (fictional)", MS IS (STEM), program ends 2026-12-12, OPT 2027-01-15 to 2028-01-14, planned registration 2027-03-10, filing window ends 2027-06-30, hiring lag 60 days | your-input, **fictional**; no real person's data |
| Postings | 13 public Greenhouse postings fetched 2026-10-19T19:31:49Z: Pinterest, Stripe ×3, Chime Financial, Lyft ×3, Databricks, Robinhood Markets, Discord, Figma, Asana (`inputs/postings-live.json`; only title, location, link, pay sentences and a SHA-256 of the full text are kept) | record |
| Wage levels | OFLC 2026-27 extract, SOC 15-1252 and 15-1253 in five areas (`scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/`), from DOL's zip, SHA-256 `edc01f64…f08f` | record |
| Sponsorship context | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (repo data) | record |
| Gate decisions | `inputs/gates-live.json`: 25 decisions by Pavithra-Prasad, 2026-10-19 | record of a person's decision |

---

## Commands and their real output

On 2026-10-21 the submission folder moved from `course/2026fa/submissions/pavithra-prasad/mode-wage-level/` to `assignments/submissions/pavithra-prasad/` to match the assignment text; transcripts recorded before the move show the old path. All commands were run from the repo root on 2026-10-19 on macOS (Python 3.13; `/usr/bin/python3` for `npm run verify`).

### 1. Build the data extract

From `runs/build-extract-terminal.txt` (re-run on 2026-10-21; the rebuilt files have the same SHA-256 as the committed extract):

```text
$ shasum -a 256 <download folder>/OFLC_Wages_2026-27.zip
edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f  <download folder>/OFLC_Wages_2026-27.zip

$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/build_extract.py --zip <download folder>/OFLC_Wages_2026-27.zip
wrote 10 wage rows and 39 county rows; zip SHA-256 ok
exit 0
```

(The download folder path is shortened; it is a scratch folder outside the repo.)

### 2. Tests, audit, sample run, conformance

```text
$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/test_wage_level.py
----------------------------------------------------------------------
Ran 37 tests in 0.273s

OK

$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --audit
wrote scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/data/oflc-extract-audit.md

$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --sample --out-dir assignments/submissions/pavithra-prasad/runs/sample
postings: 11 · checked 5 · provisional 1 · refused 4 · skip 1
G2 timeline: pass
G4 release: released by constructed sample decision
wrote assignments/submissions/pavithra-prasad/runs/sample/report.md

$ PATH="/usr/bin:$PATH" npm run verify
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)

$ npm run doctor
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
```

### 3. Fetch the live postings (the only network step for data)

```text
$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fetch_postings.py --out course/2026fa/submissions/pavithra-prasad/mode-wage-level/inputs/postings-live.json --jobs "pinterest:7838591:Pinterest" "stripe:8128744:Stripe" "stripe:8249901:Stripe" "stripe:8198280:Stripe" "chime:8594959002:Chime Financial" "lyft:8806570002:Lyft" "lyft:8772594002:Lyft" "lyft:8639200002:Lyft" "databricks:8635225002:Databricks" "robinhood:8008723:Robinhood Markets" "discord:8846732002:Discord" "figma:5691911004:Figma" "asana:8194522:Asana"
pinterest-7838591 HTTP 200 University Grad Software Engineer 2027 (USA) | San Francisco, CA, US; Remote, US
stripe-8128744 HTTP 200 Software Engineer, New Grad | San Francisco, Seattle, New York
stripe-8249901 HTTP 200 Software Engineer | Seattle, WA
stripe-8198280 HTTP 200 Software Engineer, Backend | Seattle, WA
chime-8594959002 HTTP 200 Software Engineer, Financial Platform | New York, NY, USA; San Francisco, CA, USA
lyft-8806570002 HTTP 200 Backend Software Engineer, Airports | San Francisco, CA
lyft-8772594002 HTTP 200 Software Engineer | Seattle, WA
lyft-8639200002 HTTP 200 ML Software Engineer, ETA | San Francisco, CA
databricks-8635225002 HTTP 200 Software Engineer, Web Products | Mountain View, California
robinhood-8008723 HTTP 200 Full Stack Software Engineer, Credit Cards & Banking | Bellevue, WA; Menlo Park, CA; New York, NY
discord-8846732002 HTTP 200 Software Engineer, Consumer Revenue | San Francisco Bay Area
figma-5691911004 HTTP 200 Software Engineer - Full Stack | San Francisco, CA • New York, NY • United States
asana-8194522 HTTP 200 Software Engineer | San Francisco
wrote 13 postings to course/2026fa/submissions/pavithra-prasad/mode-wage-level/inputs/postings-live.json
```

### 4. The final live run, with every gate decided

The first live runs were on 19 October (`runs/live-1-before-gates`, `runs/live-2-gates-cleared`, `runs/live-3-released`). After an outside review on 21 October found that the code did not enforce three of the human gates (see "Broke during testing, fixed"), the code was fixed and the run repeated on 21 October on the same 13 fetched postings:

```text
$ python3 scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py --persona scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/fixtures/persona.json --postings assignments/submissions/pavithra-prasad/inputs/postings-live.json --gate-log assignments/submissions/pavithra-prasad/inputs/gates-live.json --out-dir assignments/submissions/pavithra-prasad/runs/live-4-final --run-date 2026-10-21
postings: 13 · checked 9 · provisional 1 · refused 3
G2 timeline: pass
G4 release: released by Pavithra-Prasad
wrote assignments/submissions/pavithra-prasad/runs/live-4-final/report.md
exit 0
```

From `runs/live-4-final/report.md` (pasted):

#### Results by posting and city

| Company | Role | City | Posted base range | At the minimum | At the maximum | Entries (min to max) | To reach the next level | Status |
|---|---|---|---|---|---|---|---|---|
| Pinterest | University Grad Software Engineer 2027 (USA) | San Francisco, CA | $129,022 to $174,283 | below Level I | Level II | 1 to 2 | $137,093 for Level I | checked |
| Stripe | Software Engineer | Seattle, WA | $156,800 to $235,200 | Level II | Level IV | 2 to 4 | $174,595 for Level III | checked |
| Stripe | Software Engineer, Backend | Seattle, WA | $206,086 to $285,600 | Level IV | Level IV | 4 to 4 | already Level IV | checked |
| Chime Financial | Software Engineer, Financial Platform | New York, NY | $133,000 to $184,000 | Level I | Level III | 1 to 3 | $137,717 for Level II | checked |
| Chime Financial | Software Engineer, Financial Platform | San Francisco, CA | $133,000 to $184,000 | below Level I | Level II | 1 to 2 | $137,093 for Level I | checked |
| Lyft | Backend Software Engineer, Airports | San Francisco, CA | $128,000 to $160,000 | below Level I | Level I | 1 to 1 | $137,093 for Level I | checked |
| Lyft | Software Engineer | Seattle, WA | $149,240 to $192,000 | Level II | Level III | 2 to 3 | $174,595 for Level III | checked |
| Lyft | ML Software Engineer, ETA | San Francisco, CA | $140,800 to $176,000 | Level I | Level II | 1 to 2 | $165,131 for Level II | provisional (gate G3 not cleared) |
| Robinhood Markets | Full Stack Software Engineer, Credit Cards & Banking | Bellevue, WA | $166,000 to $195,000 | Level II | Level III | 2 to 3 | $174,595 for Level III | checked |
| Robinhood Markets | Full Stack Software Engineer, Credit Cards & Banking | Menlo Park, CA | $166,000 to $195,000 | Level II | Level III | 2 to 3 | $193,149 for Level III | checked |
| Robinhood Markets | Full Stack Software Engineer, Credit Cards & Banking | New York, NY | $166,000 to $195,000 | Level III | Level IV | 3 to 4 | $193,461 for Level IV | checked |
| Figma | Software Engineer - Full Stack | San Francisco, CA | $153,000 to $376,000 | Level I | Level IV | 1 to 4 | $165,131 for Level II | checked |
| Figma | Software Engineer - Full Stack | New York, NY | $153,000 to $376,000 | Level II | Level IV | 2 to 4 | $165,589 for Level III | checked |
| Asana | Software Engineer | San Francisco, CA | $171,000 to $190,000 | Level II | Level II | 2 to 2 | $193,149 for Level III | checked |

#### Refused or skipped

| Company | Role | Location as posted | Why |
|---|---|---|---|
| Stripe | Software Engineer, New Grad | San Francisco, Seattle, New York | no pay range in the posting text |
| Databricks | Software Engineer, Web Products | Mountain View, California | 2 different ranges and they cannot each be tied to one worksite |
| Discord | Software Engineer, Consumer Revenue | San Francisco Bay Area | region spans several areas |

#### Gates

- **G1, posting is live:** page checker plus the job-board answer at fetch time; uncertain results are held. Source: live:scripts/ats/check-liveness.mjs.
- **G2, visa timeline:** passed. G2a ok (2026-10-21 + 60 days = 2026-12-20; registration 2027-03-10); G2b ok (OPT ends 2028-01-14; filing window ends 2027-06-30); G2c ok (registration 2027-03-10; wage year 2026-07-01 to 2027-06-30)
  With a hiring lag of 30 days the offer comes by 2026-11-20 (in time), 60 days the offer comes by 2026-12-20 (in time), 90 days the offer comes by 2027-01-19 (in time); the search has to start by 2027-01-09 for the persona's 60-day lag.
- **G3, SOC code:** a person confirms that 15-1252 fits each role; until then a result is provisional.
- **G4, release:** cleared by Pavithra-Prasad on 2026-10-21.

### 4b. The repo's own liveness command on one posting

The live run calls `scripts/ats/check-liveness.mjs` for gate G1. Run on its own, in its documented `npm` form, on the Pinterest new-grad posting:

```text
$ npm run ats:liveness -- https://www.pinterestcareers.com/jobs/?gh_jid=7838591
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://www.pinterestcareers.com/jobs/?gh_jid=7838591
Checking 1 URL(s)...
❌ expired    https://www.pinterestcareers.com/jobs/?gh_jid=7838591
           insufficient content — likely nav/footer only
Results: 0 active  1 expired  0 uncertain
exit 1

$ curl -s -o /dev/null -w '%{http_code}' https://boards-api.greenhouse.io/v1/boards/pinterest/jobs/7838591
200
```

The repo's checker calls the posting expired from its page content, while the job board's API says it is open (HTTP 200). On its own, G1 would have skipped the only new-grad posting in the set that publishes a range. The mode treats a content-only "expired" as uncertain and resolves it with the API, so the posting was checked.

### 5. Deliberate break attempts

```text
$ # B1 build the extract from a file that is not the DOL zip
$ python3 build_extract.py --zip wage_level.py
refusing: zip SHA-256 is 4a94d15a9bca5244fe5e8cbc196349decca334c90b01756ab9d1a535b00747e1, expected edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f (not the file this extract was built from)
exit 1

$ # B2 change one wage in the extract (Boston Level I 54.94 -> 44.94), then run
HALT: data: oflc-alc-2026-27-extract.csv SHA-256 is 726ce54ba122f9af54f35a5b055938a3646b371fded853b3572e5d776e0ece46, manifest says b266f8f939e2e467d46cc389c7bdaecc1db71afe6f82a1b598ef27759c5d2d8d; rebuild it with build_extract.py
exit 2

$ # B3 change Level II (66.46 -> 61.46) AND refresh the fingerprint in the manifest, then run
HALT: data: level arithmetic check failed: 14460 15-1252 Level 2 is 61.46, interpolation gives 66.46
exit 2

$ # restored: files match the saved copies again
b266f8f939e2e467
b266f8f939e2e467

$ # B4 run the live postings as if it were 1 Feb 2027 (60-day hiring lag misses the 10 Mar registration)
STOPPED: G2 visa timeline failed: no wage level is reported when the registration cannot happen as planned
exit 3

$ # B5 write the report outside the recipe namespaces
HALT: output: chapters/tmp-break is outside this recipe's namespaces (scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level, course/2026fa/submissions/pavithra-prasad)
exit 2

$ # B6 fetch a posting id that does not exist on a real board, then check it
pinterest-1 HTTP 404 None | 
wrote 1 postings to course/2026fa/submissions/pavithra-prasad/mode-wage-level/runs/break-tests/postings-missing.json
exit 0
Traceback (most recent call last):
  File "scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py", line 681, in <module>
    sys.exit(main())
             ~~~~^^
  File "scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py", line 664, in main
    log = run(a.persona, a.postings, a.out_dir, a.gate_log, a.liveness_fixture, a.run_date)
  File "scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py", line 598, in run
    log["postings"] = [evaluate(p, data, live, gates, sponsors) for p in postings]
                       ~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "scripts/contrib/2026fa/pavithra-prasad-h1b-wage-level/wage_level.py", line 365, in evaluate
    doubt = bool(SOC_DOUBT_RE.search(p["title"])) or not SWE_TITLE_RE.search(p["title"])
                 ~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
TypeError: expected string or bytes-like object, got 'NoneType'
exit 1
Traceback (most recent call last):
  File "<string>", line 1, in <module>
    import json;p=json.load(open('course/2026fa/submissions/pavithra-prasad/mode-wage-level/runs/break-tests/out-b6-missing/run-log.json'))['postings'][0];print(p['status'], p['stops'], p['G1_liveness']['checker'])
                            ~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: 'course/2026fa/submissions/pavithra-prasad/mode-wage-level/runs/break-tests/out-b6-missing/run-log.json'

$ # B6 again, after the fix (closed posting with no title)
postings: 1 · skip 1
G2 timeline: pass
wrote course/2026fa/submissions/pavithra-prasad/mode-wage-level/runs/break-tests/out-b6-missing/report.md
exit 0
skip [['G1-expired', 'posting is closed; a dead posting scores zero'], ['worksite', 'no checkable worksite'], ['no-pay-range', 'no pay range in the posting text']] {'value': 'expired', 'source': 'record', 'note': 'checker said expired from a content heuristic (insufficient content — likely nav/footer only), not an HTTP 404/410; job-board API HTTP 404 at fetch'}
```

---

## Verified vs inferred

| # | Statement | Verified or inferred | Basis |
|---|---|---|---|
| 1 | Pinterest's "University Grad Software Engineer 2027 (USA)" posts $129,022 to $174,283 for San Francisco or Remote | **Verified** (record) | job-board API at fetch; text SHA-256 kept |
| 2 | San Francisco Level I for SOC 15-1252 is $137,093 (2026-27) | **Verified** (record) | DOL file, SHA-256 match, interpolation check; the same table checked on DOL's site for San Jose |
| 3 | Pinterest's posted minimum is $8,071 below San Francisco Level I | **Verified** (computed from 1 and 2) | arithmetic |
| 3a | A San Francisco hire would be offered as little as that minimum | **Inferred, weak** | the posting gives the range to "US based applicants only" and says final salary depends on location (Pavithra-Prasad read the full posting on 2026-10-19), so it may be a national band |
| 4 | A registration at that minimum would be entered once | **Verified** (rule + computed) | 90 FR 60864: below Level I is grouped with Level I |
| 5 | Pinterest would have to raise the pay or use another wage source to sponsor at the minimum | **Inferred** | reading of the prevailing-wage rule; the employer's wage source is not visible |
| 6 | Robinhood's $166,000 minimum is Level III in New York and Level II in Bellevue and Menlo Park | **Verified** (computed from records) | the posting's own zone text: "Base Pay Range: Zone 1 (Menlo Park, CA; New York, NY; Bellevue, WA; Washington, DC) $166,000 — $195,000 USD Zone 2 (Denver, CO; Westlake, TX; Chicago, IL) $147,…" |
| 7 | A hire would work in exactly one of a posting's listed cities | **Inferred** (decision rule) | posting cities read as alternatives; if not, the rule's lowest-level requirement applies |
| 8 | Stripe's "Software Engineer, Backend" (Seattle) starts at $206,086, exactly the Seattle Level IV threshold | **Verified** (record = record) | posted minimum and OFLC $99.08 × 2,080 |
| 9 | Stripe sets that range from the wage levels | **Inferred, not checked** | could be coincidence; nothing in the posting says so |
| 10 | All 13 postings were open | **Verified** (record + a person) | the job-board API answered HTTP 200 for all 13 at fetch (19 October); the repo checker agreed for 12 and said \"expired\" from page content for Pinterest (section 4b); Pavithra-Prasad opened Pinterest and Robinhood by hand on 19 October and the other 11 on 21 October, and all were live |
| 11 | SOC 15-1252 is the right code for 9 postings | **Inferred** (Pavithra-Prasad's own G3 review of each title: "1-6 clear, 7 hold because it's ML, 8-10 clear") | the employer chooses the code; not visible before filing |
| 12 | Lyft's "ML Software Engineer, ETA" may be filed under another code | **Inferred** (title judgment, held at G3) | title words |
| 13 | Chime Financial has 580 approvals and an all-title median of $240,108, which would be Level IV in New York and San Francisco | **Verified** (record + computed) | the repository's sponsorship CSV (not in the zip); the rows used are copied in `evidence/sponsor-rows-used.csv` |
| 14 | That company median says little about new-grad pay | **Inferred** | the median covers all titles; the posting itself starts at $133,000 |
| 15 | The persona can be registered in March 2027 (G2) | **Verified** (computed) **from invented dates** | the registration date is an assumption until USCIS announces the window; the report shows the same check with 30, 60 and 90-day hiring lags (all in time from 19 October) and the latest start date for the search (9 January 2027 at 60 days) |
| 16 | The 2026-27 thresholds apply to a March 2027 registration | **Verified** (date check) | wage year 2026-07-01 to 2027-06-30 covers 2027-03-10; the rule ties the level to the date the registration is submitted |
| 17 | The chance of selection | **Not claimed** | entries are relative weights; the pool is unknown |

---

## Verification

- **By a person, against the source:** Pavithra-Prasad searched DOL's wage search (7/2026 to 6/2027, All Industries, 15-1252.00, Santa Clara County). It showed $73.46, $89.94, $106.43 and $122.91 an hour, and $152,797, $187,075, $221,374 and $255,653 a year, at Geo Level 1, the same as the extract. Screenshot: `evidence/dol-wage-search-2026-10-19-santa-clara.png`. It also confirms the whole-dollar rounding of hourly × 2,080 and that Santa Clara County is in the San Jose area.
- **Fingerprints on every run:** each run re-hashes the extract against `extract-manifest.json` and re-checks that Levels II and III are the even steps between I and IV (break tests B2 and B3 show both checks firing).
- **Counts against the source:** 10 wage rows = 5 areas × 2 codes, from 449,440 rows in `ALC_Export.csv`; 39 county rows from 3,275. The DOL zip itself is not in this submission (12.7 MB); its download link and SHA-256 are recorded, so anyone can fetch it and repeat the count.
- **By a person, every posting:** Pavithra-Prasad opened all 13 postings herself (two on 19 October, eleven on 21 October) and found every one live; she also re-confirmed G2 and the TODO closures in her own words (`inputs/gates-live.json`, append-only).
- **Re-run:** `live-2-gates-cleared`, `live-3-released` (19 October, earlier code) and `live-4-final` (21 October, gate-enforcing code) give the same status for all 13 postings (`diff` of the two run logs' statuses: no difference); liveness was re-checked live in the second run.
- **Parsed the outputs:** every `run-log.json` loads as JSON, and `npm run verify` passes.
- **Read by hand:** the Robinhood zone text (row 6) and the Databricks pay text, "Zone 1 Pay Range $136,300 — $187,450 USD Pay Range Transparency Databricks is committed to fair and equitable compensation practices. | Local Pay Range $136,300 — $204,500 USD About Databric…", which is why Databricks is refused rather than guessed.
- **Tried to break it:** six attempts above; one crash found and fixed.

---

## Attestation

- Recipe: h1b-wage-level-odds v0.1.0
- By: Pavithra-Prasad · 2026-10-19 (the runs were executed in a Claude Code session; the gate decisions and the DOL website check are Pavithra-Prasad's)

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 …/test_wage_level.py` | 37 tests OK | all pass |
| Gate enforcement tests (`GateEnforcement`): only G3 logged; all three logged; checker open but API 404; a closed posting with a valid range; a release naming another run | provisional (G1, G2 not cleared); checked; refused and held with no levels; skip with no levels; NOT RELEASED until the release names this run | a missing human decision never yields "checked", and a stopped posting carries no level |
| `wage_level.py --sample` | checked 5 · provisional 1 · refused 4 · skip 1 | each of the 11 constructed postings gets the status it was built to test |
| `wage_level.py` live, 13 postings, all gates decided | checked 9 · provisional 1 · refused 3; G2 pass; G4 released | refusals only where a range or a city cannot be pinned down |
| DOL wage search by hand, Santa Clara County, 15-1252, 2026-27 | $73.46 / $89.94 / $106.43 / $122.91 an hour; $152,797 to $255,653 a year | the same as the extract |
| `npm run ats:liveness -- <Pinterest URL>` and the job-board API | ❌ expired, "insufficient content", exit 1; API HTTP 200; the mode's result: active | an open posting is not skipped because of a content heuristic |
| **Break:** build from a file that is not the DOL zip | refused, exit 1 | refuse |
| **Break:** change one wage in the extract | HALT on SHA-256, exit 2 | halt |
| **Break:** change Level II and forge the manifest hash | HALT on the interpolation check, exit 2 | halt |
| **Break:** run as if on 2027-02-01 | STOPPED at G2, exit 3 | stop: the offer cannot come before the registration |
| G2 with 30, 60 and 90-day hiring lags (test `test_lag_sensitivity`, run date 2026-12-20) | in time, in time, too late; search must start by 2027-01-09 | a 90-day lag from 20 December misses a 10 March registration |
| Opened all 13 live postings by hand (Pinterest and Robinhood on 19 Oct, the other 11 on 21 Oct) | all open; Pinterest shows $129,022—$174,283 USD for "US based applicants only" | the same as the fetched record |
| **Break:** write output under `chapters/` | HALT, nothing written, exit 2 | halt |
| **Break:** check a job id that does not exist | crash before the fix; skip at G1 after it | skip |
| `PATH="/usr/bin:$PATH" npm run verify`; `npm run doctor` | manifest check passed (3 warnings present on upstream main); environment runnable | pass |

### Did not test

- Job boards other than Greenhouse (Lever, Ashby, Workday), and pay published only on a company's own careers site (Stripe's New Grad posting).
- Cities outside the 47 in the city table, wage areas outside the five, and job codes other than 15-1252 (15-1253 appears only as an illustration).
- Whether these employers file at the levels shown; no labor condition application data was checked.
- The FY2028 registration dates (not announced yet; the persona's date is assumed).
- Whether DOL's proposed new wage levels (proposed rule of 27 March 2026) have become final; if they have, every threshold here changes.
- The wage-year change on 1 July 2027 with the 2027-28 data (G2c was tested with a constructed date only).
- Other operating systems and Python versions; inputs larger than 13 postings.

### Broke during testing, fixed

1. Hourly ranges written "$57/hr - $68/hr" were not read. Fixed in `wage_level.py` (`PER_HOUR` in `RANGE_RE`).
2. A posting with one range per office ("Menlo Park office: …; Palo Alto office: …") was refused. Fixed in `assign_ranges`.
3. Robinhood's zone table, three cities sharing one range, was refused. Fixed: each city takes the first range after its name (`assign_ranges`).
4. "San Francisco, Seattle, New York" and "San Francisco" with no state were misread. Fixed: bare city names are accepted when the city table gives one state (`parse_locations`).
5. A closed posting with no title crashed the run (break test B6). Fixed in `evaluate`; covered by `test_closed_posting_with_no_title_is_skipped`.
6. The timeline gate rested on one assumed hiring lag. Changed: the report now shows the result for 30, 60 and 90 days and the latest date the search can start (`timeline_gate`, `test_lag_sensitivity`).
7. **Found by an outside review (21 October):** G1, G2 and G4 were described as hard stops but the code only checked G3 before calling a result "checked", and wrote a report that looked released without any G4. Fixed in `evaluate` and `run`: G1, G2 and G3 must each be logged, and a G4 release counts only for the run folder it names; covered by the `GateEnforcement` tests.
8. **Found by the same review:** a skipped or refused posting still carried computed levels in `run-log.json` (the closed sample posting s07 showed "Level I"). Fixed: no level is computed once a posting has a stop.
9. **Found by the same review:** the 19 October G1 note for Pinterest said the repo checker and the API both said open; the checker had said "expired". A correction is appended to `inputs/gates-live.json` (the original entry is kept); the decision does not change because the posting was opened by hand and was live.

---

## Reflection

**What went well.** The mode found checkable differences in live postings, as well as in the constructed examples: New York against Bellevue at the same pay, a new-grad minimum below Level I, and a minimum sitting exactly on Level IV. Every refusal named the one missing fact a student would need to ask a recruiter about. The person's check against the Labor Department's own site matched to the cent. The job-board cross-check again caught the repo's liveness checker calling an open Pinterest posting "expired", the same failure seen on 1 October.

**What the mode got wrong or missed.** The recipe promised human gates that the code did not enforce until an outside review caught it; the fix is in, but it shows the recipe and the code were checked separately when they should have been checked against each other. Four of the five early code defects came from live posting formats that the constructed sample did not anticipate: zone tables and cities without states. The most relevant posting, Stripe's "Software Engineer, New Grad", publishes no range through the API, so the mode cannot answer for it. Databricks's two unlabelled ranges are refused, although "Local Pay Range" probably names the posting's city; a person could resolve it and the mode cannot. The job-code flag works from title words, so it is crude. A single posted range may be a national band: reading the full Pinterest posting showed its range is for "US based applicants only", so the gap below San Francisco Level I is a fact about the posted minimum, not about what a San Francisco hire would be offered. The sponsorship context matches exact names, so "Chime" alone would pick the wrong company (CHIME INC, 2 approvals, instead of CHIME FINANCIAL INC, 580).

**Next steps.**
1. Add DOL's public labor condition application disclosure data, to see the level each employer actually filed for 15-1252 in each city. That closes the largest "cannot verify".
2. Read zone and "Local Pay Range" labels, so Databricks-style postings resolve instead of being refused.
3. Add Lever and Ashby fetchers and more wage areas.
4. Rebuild the extract when DOL publishes the 2027-28 wages on 1 July 2027 (until then, G2 stops any registration date after 30 June 2027), and check the status of DOL's 27 March 2026 proposed rule, which would raise every level.
