# Worked run — wage-level-floor, 2026-10-18

## Executive summary

**What this is.** The record of running the wage-level-floor mode end to end on live data: the government wage table downloaded and hash-pinned, 21 real company job boards read, every published pay range placed on the four H-1B wage levels, and the result checked against its sources and deliberately broken.

**Why read it.** It shows what the mode found and what it got wrong while being built. One bug placed a New York posting on Boston thresholds, and the output looked fine. It also shows exactly which checks a person still owes before anyone should act on the output.

**What it found.** For a fictional new-grad backend engineer in Boston: 13 matching postings in the area, 11 placed. 6 have a range that crosses a level line; the most common line is $138,237, which separates one lottery entry from two. 5 start below Level I ($114,275), and 2 publish no range. Every placed posting changes level if the employer files a different occupation code. A second scenario (same person, Senior titles allowed) placed 27 of 36 and refused 9: Toast's Zone A/B/C ranges, remote roles tied to other places, and postings with no range.

**Status claimed: DRAFT.** The run is complete and verified as far as a machine can take it. Seven proposed additions are open, and the human gates are not yet cleared (see "Gates still owed").

## Run record

| | |
|---|---|
| Recipe | `recipes/cases/2026fa/mayank-1024-wage-level-floor.md` v0.1.0 |
| Date | 2026-10-18 (boards captured 2026-10-18T10:59Z) |
| Who ran it | Claude Code (agent) in Mayank Bhadrasen's session; the person-owned gates are listed as pending, not cleared |
| Persona | `scripts/contrib/2026fa/mayank-1024-wage-level-floor/persona.example.json` (**fictional**: OPT ends 2027-08-31, STEM-eligible, SOC 15-1252, home area Boston). No private data was read or written |
| Real data | DOL OFLC wage year 2026-27 (zip sha256 `edc01f64…`); 21 live Greenhouse/Ashby boards; 80 Days CSV (sha256 in the log) |
| Re-run everything offline | `bash course/2026fa/submissions/mayank-1024/mode-build/runs/rerun.sh` |

## 1. Inputs

- **Candidate companies.** The 80 Days CSV has 62 Massachusetts rows whose sponsored titles match software/backend/platform/full stack with ≥2 approvals. Probing Greenhouse and Ashby with each website's name found 21 boards (`board-map.json`, all `identity_confirmed: false`).
- **Wage table.** The OFLC All-Industries export cut to MA/NH areas × SOC 15-/17- (684 rows).
- **Persona (fictional).** Title pattern software/backend/platform/full stack/developer, excluding senior, staff, lead, manager, embedded, data, ML, QA, security and similar. Target areas Boston (14460) and Worcester (49340). "Remote" maps to Boston.
- **Scenario 2** (`runs/2026-10-18-broad/persona.broad.json`) is identical except Senior titles are allowed.

## 2. Commands and real output

### 2.1 Ingest the DOL wage table

```text
# copied verbatim from the agent session terminal, 2026-10-18 ~10:58 UTC (the command was not tee'd at the time)
$ bash scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-oflc.sh
fetched https://flag.dol.gov/sites/default/files/wages/OFLC_Wages_2026-27.zip
  zip sha256 edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f
  wrote data/dol/oflc/raw/2026-27/{ALC_Export.csv,Geography.csv,fetch.json}
[exit 0]
```

```text
$ node scripts/contrib/2026fa/mayank-1024-wage-level-floor/extract-oflc.mjs
ALC_Export.csv rows in: 449440 (sha256 54115f7bf1230b41…)
areas with a county in MA/NH: 12
rows out: 684 across 12 areas, SOC prefixes 15- 17-
wrote data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv (+ .provenance.json)
[exit 0]
```

### 2.2 Ingest today's pay ranges (network)

```text
$ node scripts/contrib/2026fa/mayank-1024-wage-level-floor/fetch-pay-ranges.mjs --out course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/pay-snapshot.json
1UPHEALTH INC                        ashby      jobs    0  eng   0  pay:structured   0  pay:text   0
ABACUS INSIGHTS INC                  greenhouse jobs   18  eng   9  pay:structured   0  pay:text   0
ACQUIA INC                           greenhouse jobs    7  eng   3  pay:structured   1  pay:text   1
ACUITYMD INC                         greenhouse jobs   10  eng   3  pay:structured   0  pay:text   2
CAMBRIDGE MOBILE TELEMATICS INC      greenhouse jobs   23  eng  18  pay:structured   0  pay:text  12
CLOAKED INC                          ashby      jobs   14  eng   7  pay:structured   7  pay:text   0
COHERE HEALTH INC                    greenhouse jobs   75  eng  22  pay:structured   0  pay:text   8
FAIRMARKIT INC                       greenhouse jobs    5  eng   0  pay:structured   0  pay:text   0
FORMLABS INC                         greenhouse jobs  243  eng  79  pay:structured  55  pay:text  46
GINKGO BIOWORKS INC                  greenhouse jobs   20  eng  10  pay:structured   0  pay:text   7
GREENLIGHT BIOSCIENCES INC           ashby      jobs    0  eng   0  pay:structured   0  pay:text   0
KLAVIYO INC                          greenhouse jobs  154  eng  63  pay:structured  63  pay:text  57
LOOKOUT INC                          greenhouse jobs    2  eng   0  pay:structured   0  pay:text   0
NETBRAIN TECHNOLOGIES INC            greenhouse jobs   42  eng  16  pay:structured   0  pay:text   4
OVERJET INC                          ashby      jobs   30  eng   5  pay:structured   0  pay:text   0
PATHAI INC                           greenhouse jobs   14  eng  10  pay:structured   0  pay:text  10
REGENT CRAFT INC                     greenhouse jobs   10  eng   0  pay:structured   0  pay:text   0
SILVERRAIL TECHNOLOGIES INC          greenhouse jobs    2  eng   1  pay:structured   0  pay:text   0
TOAST INC                            greenhouse jobs  317  eng  56  pay:structured  28  pay:text  28
TULIP INTERFACES INC                 greenhouse jobs   62  eng  28  pay:structured   0  pay:text  14
VESTMARK INC                         greenhouse jobs    7  eng   3  pay:structured   2  pay:text   2
wrote course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/pay-snapshot.json — 21/21 boards ok, 333 engineering postings
```

### 2.3 Place the ranges (offline) — scenario 1

```text
$ node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs --snapshot course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/pay-snapshot.json --out-dir course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18
timeline: open (317 days left; window 2027-03-01)
thresholds 15-1252 @ Boston-Cambridge-Newton, MA-NH: I $114,275 · II $138,237 · III $162,198 · IV $186,160
funnel: engineering 333 → title 25 → area 13 → placed 11 · refused 2
bands: {"FLOOR-BELOW-L1":5,"CLIFF-IN-RANGE":6}  stops: {"no-pay-range":2}
placed on posting text: 6 · SOC-sensitive: 11/11
wrote course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.{log.json,report.md}
[exit 0]
```

The placed-postings table from the generated report (`runs/2026-10-18/wage-level.report.md`), unedited:

#### The four lines (15-1252, Boston-Cambridge-Newton, MA-NH, wage year 2026-27)

| Level | Hourly (DOL) | Annual (×2080) | Lottery entries | DHS projected selection chance |
|---|---|---|---|---|
| I | $54.94 | $114,275 | 1 | 15.29% (projection) |
| II | $66.46 | $138,237 | 2 | 30.58% (projection) |
| III | $77.98 | $162,198 | 3 | 45.87% (projection) |
| IV | $89.50 | $186,160 | 4 | 61.16% (projection) |

Below Level I there is no OEWS registration; an employer using a private wage survey registers in the Level I group. DHS projected 29.59% for everyone under the old random lottery.

#### Postings placed on a level

| Band | Company | Title | Range | Source | Level min→max | Entries min→max | Line to cross | SOC changes it? |
|---|---|---|---|---|---|---|---|---|
| CLIFF-IN-RANGE | FORMLABS INC | [Software Engineer - Print Pipeline](https://careers.formlabs.com/job/7536038/apply/?gh_jid=7536038) | $120,000–$170,000 | ATS field | I→III | 1→3 | $138,237 | 15-1253: III→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: below I→II |
| CLIFF-IN-RANGE | KLAVIYO INC | [Software Engineer II - Recommendations](https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003) | $116,000–$174,000 | ATS field | I→III | 1→3 | $138,237 | 15-1253: II→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: below I→II |
| CLIFF-IN-RANGE | KLAVIYO INC | [Full Stack Software Engineer - People Systems](https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003) | $140,000–$210,000 | ATS field | II→IV | 2→4 | $162,198 | 15-1253: IV→IV; 15-1211: III→IV; 15-2051: III→IV; 17-2061: I→IV |
| CLIFF-IN-RANGE | TULIP INTERFACES INC | [Developer Experience Engineer ](https://tulip.co/careers/job-posting/?gh_jid=7916769003) | $125,000–$175,000 | posting text | I→III | 1→3 | $138,237 | 15-1253: III→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: I→II |
| CLIFF-IN-RANGE | TULIP INTERFACES INC | [Software Engineer, Agentic AI](https://tulip.co/careers/job-posting/?gh_jid=7710246003) | $130,000–$180,000 | posting text | I→III | 1→3 | $138,237 | 15-1253: III→IV; 15-1211: II→IV; 15-2051: II→IV |
| CLIFF-IN-RANGE | TULIP INTERFACES INC | [Software Engineer, Frameworks](https://tulip.co/careers/job-posting/?gh_jid=7832884003) | $130,000–$175,000 | posting text | I→III | 1→3 | $138,237 | 15-1253: III→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: I→II |
| FLOOR-BELOW-L1 | COHERE HEALTH INC | [Software Engineer II](https://job-boards.greenhouse.io/coherehealth/jobs/7930480003) | $107,000–$130,000 | posting text | below I→I | I-group*→1 | $114,275 | 15-1253: II→III; 15-1211: I→II; 15-2051: I→II |
| FLOOR-BELOW-L1 | FORMLABS INC | [Software Engineer, E-commerce ](https://careers.formlabs.com/job/7506561/apply/?gh_jid=7506561) | $100,000–$140,000 | ATS field | below I→II | I-group*→2 | $114,275 | 15-1253: II→IV; 15-1211: I→III; 15-2051: I→III; 17-2061: below I→I |
| FLOOR-BELOW-L1 | GINKGO BIOWORKS INC | [Software Engineer III - Driver Developer (Autonomous Lab)](https://job-boards.greenhouse.io/ginkgobioworks/jobs/5241119007) | $112,200–$159,600 | posting text | below I→II | I-group*→2 | $114,275 | 15-1253: II→IV; 15-1211: II→IV; 15-2051: I→III |
| FLOOR-BELOW-L1 | PATHAI INC | [Software Engineer I, Fullstack](https://www.pathai.com/careers/8696764002?gh_jid=8696764002) | $96,750–$148,350 | posting text | below I→II | I-group*→2 | $114,275 | 15-1253: II→IV; 15-1211: I→III; 15-2051: I→III; 17-2061: below I→I |
| FLOOR-BELOW-L1 | VESTMARK INC | [Software Engineer](https://job-boards.greenhouse.io/vestmark/jobs/8009953) | $90,000–$115,000 | ATS field | below I→I | I-group*→1 | $114,275 | 15-1253: I→II; 15-1211: below I→II; 15-2051: I→II; 17-2061: below I→below I |

*I-group: below Level I on OEWS data; registrable only in the Level I group if the employer uses an alternate wage source.

What each band means:

- **CLIFF-IN-RANGE** — the range crosses a level line — the line is the number to negotiate to.
- **FLAT** — the whole range sits in one level — negotiating inside it does not change the lottery weight.
- **FLOOR-BELOW-L1** — the bottom of the range is under Level I for this occupation and area.
- **RANGE-BELOW-L1** — the whole range is under Level I — either the employer files a different occupation code or uses a private wage survey.

### 2.4 Scenario 2 — Senior titles allowed

```text
$ node scripts/contrib/2026fa/mayank-1024-wage-level-floor/wage-level.mjs --persona course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18-broad/persona.broad.json --snapshot course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/pay-snapshot.json --out-dir course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18-broad
timeline: open (317 days left; window 2027-03-01)
thresholds 15-1252 @ Boston-Cambridge-Newton, MA-NH: I $114,275 · II $138,237 · III $162,198 · IV $186,160
funnel: engineering 333 → title 66 → area 36 → placed 27 · refused 9
bands: {"CLIFF-IN-RANGE":21,"FLOOR-BELOW-L1":6}  stops: {"no-pay-range":4,"remote-scope-unclear":2,"zone-ambiguous":3}
placed on posting text: 13 · SOC-sensitive: 27/27
wrote course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18-broad/wage-level.{log.json,report.md}
[exit 0]
```

#### Postings the tool refused to place

| Reason | Count | What a person would have to supply |
|---|---|---|
| no-pay-range | 4 | nothing to place; ask the recruiter for the range (Massachusetts requires one on request) |
| remote-scope-unclear | 2 | whether "remote" includes working from your home area (the posting names another place) |
| zone-ambiguous | 3 | which pay zone the Boston worksite falls in (set zone_choice for that company) |

### 2.5 Gate G6 — the repo's liveness checker on five postings the mode points at, plus one fake

```text
$ npm run ats:liveness -- "https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003"
Checking 1 URL(s)...

✅ active     https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003

Results: 1 active  0 expired  0 uncertain
[exit 0]
$ npm run ats:liveness -- "https://careers.formlabs.com/job/7536038/apply/?gh_jid=7536038"
Checking 1 URL(s)...

⚠️ uncertain  https://careers.formlabs.com/job/7536038/apply/?gh_jid=7536038
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
[exit 1]
$ npm run ats:liveness -- "https://tulip.co/careers/job-posting/?gh_jid=7832884003"
Checking 1 URL(s)...

⚠️ uncertain  https://tulip.co/careers/job-posting/?gh_jid=7832884003
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
[exit 1]
$ npm run ats:liveness -- "https://www.pathai.com/careers/8696764002?gh_jid=8696764002"
Checking 1 URL(s)...

✅ active     https://www.pathai.com/careers/8696764002?gh_jid=8696764002

Results: 1 active  0 expired  0 uncertain
[exit 0]
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/vestmark/jobs/8009953"
Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/vestmark/jobs/8009953

Results: 1 active  0 expired  0 uncertain
[exit 0]
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/formlabs/jobs/7536038"
Checking 1 URL(s)...

⚠️ uncertain  https://job-boards.greenhouse.io/formlabs/jobs/7536038
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
[exit 1]
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/tulip/jobs/7832884003"
Checking 1 URL(s)...

⚠️ uncertain  https://job-boards.greenhouse.io/tulip/jobs/7832884003
           content present but no visible apply control found

Results: 0 active  0 expired  1 uncertain
[exit 1]
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/vestmark/jobs/1"
Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/vestmark/jobs/1
           redirect to https://job-boards.greenhouse.io/vestmark?error=true

Results: 0 active  1 expired  0 uncertain
[exit 1]
```

## 3. Verified vs inferred (scenario 1, line by line)

| Statement in the output | Established by | Kind |
|---|---|---|
| Boston 15-1252 Level I–IV = $54.94 / $66.46 / $77.98 / $89.50 an hour | DOL OFLC `ALC_Export.csv`, row `"14460","15-1252"`, matched byte-for-byte to the extract (§4) | **record** |
| … = $114,275 / $138,237 / $162,198 / $186,160 a year | × 2080, the OFLC convention stated in its release notes | **rule** |
| Level IV = 4 entries … Level I = 1 | DHS final rule 90 FR 60864 | **rule** |
| 15.29 / 30.58 / 45.87 / 61.16 % selection chance | DHS's projection at 90 FR 60948, made before any weighted lottery ran | **projection** — not a record |
| Klaviyo SWE II posts $116,000–$174,000 (5 of the 11 placed ranges come from the ATS field) | the ATS's own pay field at capture; Klaviyo's re-fetched live and identical (§4) | **record** |
| Cohere Health, Ginkgo, PathAI, Tulip ranges | regex over the description text (6 of 11 placed) | **record-text** — weaker, gate G4 open |
| Those ranges are annual | no unit field in Greenhouse; inferred from the label wording and a ≥$10,000 minimum | **inferred** |
| Each posting's worksite is Boston | the persona's location map (a person's choice); remote → home only when no other place is named | **your-input** |
| The role is 15-1252 | the persona; the employer picks the real code | **your-input**, gate G5 open |
| "11 of 11 change level under another code" | the same range placed on the other four codes' rows | **rule** on records |
| Each board belongs to the named company | slug guessed from the website | **not verified**, gate G3 open |
| The next registration window opens 2027-03-01 | persona assumption; USCIS has not announced FY2028 dates | **your-input assumption** |
| Klaviyo: 154 approvals, 4 denials, 97.5 %, median $126,000 | 80 Days CSV row, matched to the report (§4) | **record** (counts possibly doubled upstream) |
| "That median is Level I" | the company-wide median placed on 15-1252 lines | **rule** on a record that mixes all titles. Context only, used for nothing |
| Klaviyo, PathAI, Vestmark postings `active`; Formlabs, Tulip `uncertain` | `npm run ats:liveness` | **record** at check time |
| Any model judgment | — | **none**: `model_judgment_values: 0`. No LLM produced a number, label, or band |

## 4. Verification

The full transcript is `runs/2026-10-18/verification.txt`, regenerated by `rerun.sh`:

```text
# verification transcript — commands verbatim, output as printed

# 1. DOL row: raw export vs committed extract (raw is gitignored; needs fetch-oflc.sh first)
$ grep -E \^\"14460\"\,\"15-1252\" data/dol/oflc/raw/2026-27/ALC_Export.csv
"14460","15-1252",1,"54.94","66.46","77.98","89.50","78.10",""
[exit 0]
$ grep -E \^14460\,.\*\,15-1252\, data/dol/oflc/compact/alc-2026-27-ma-nh-soc15-17.csv
14460,"Boston-Cambridge-Newton, MA-NH",15-1252,1,54.94,66.46,77.98,89.50,78.10,
[exit 0]
$ shasum -a 256 data/dol/oflc/raw/2026-27/OFLC_Wages_2026-27.zip
edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f  data/dol/oflc/raw/2026-27/OFLC_Wages_2026-27.zip
[exit 0]
$ node -e console.log\(54.94\*2080\,\ 66.46\*2080\,\ 77.98\*2080\,\ 89.50\*2080\)
114275.2 138236.8 162198.4 186160
[exit 0]

# 2. one posting: live API now vs snapshot vs report
$ curl -s 'https://boards-api.greenhouse.io/v1/boards/klaviyo/jobs/7855798003?pay_transparency=true' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.title,"|",j.location?.name,"|",JSON.stringify((j.pay_input_ranges||[]).map(p=>[p.min_cents/100,p.max_cents/100,p.currency_type])))})'
Software Engineer II - Recommendations | Boston, MA | [[116000,174000,"USD"]]
$ node -e const\ s=require\(\"./course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/pay-snapshot.json\"\)\;const\ p=s.boards.find\(b=\>b.slug===\"klaviyo\"\).postings.find\(p=\>p.id===\"7855798003\"\)\;console.log\(p.title\,\"\|\"\,p.location\,\"\|\"\,JSON.stringify\(p.pay_structured.map\(r=\>\[r.min\,r.max\,r.currency\]\)\)\)
Software Engineer II - Recommendations | Boston, MA | [[116000,174000,"USD"]]
[exit 0]
$ grep -F Software\ Engineer\ II\ -\ Recommendations course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.report.md
| CLIFF-IN-RANGE | KLAVIYO INC | [Software Engineer II - Recommendations](https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003) | $116,000–$174,000 | ATS field | I→III | 1→3 | $138,237 | 15-1253: II→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: below I→II |
[exit 0]

# 3. one company: 80 Days CSV row vs report
$ node --input-type=module -e import\ fs\ from\ \"node:fs\"\;import\ \{csvObjects\}\ from\ \"./scripts/contrib/2026fa/mayank-1024-wage-level-floor/lib.mjs\"\;for\(const\ x\ of\ csvObjects\(fs.readFileSync\(\"data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv\"\,\"utf8\"\)\).filter\(r=\>r.company_name===\"KLAVIYO\ INC\"\)\)console.log\(x.company_name\,\"\|\"\,x.city\,\"\|\"\,x\[\"Total\ Approvals\"\]\,\"\|\"\,x\[\"Total\ Denials\"\]\,\"\|\"\,x.Approval_Rate\,\"\|\"\,x.median_salary_offered\)
KLAVIYO INC | BOSTON | 154.0 | 4.0 | 97.46835443037976 | 126000.0
[exit 0]
$ grep -F \|\ KLAVIYO\ INC\ \| course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.report.md
| CLIFF-IN-RANGE | KLAVIYO INC | [Software Engineer II - Recommendations](https://www.klaviyo.com/careers/jobs/7855798003?gh_jid=7855798003) | $116,000–$174,000 | ATS field | I→III | 1→3 | $138,237 | 15-1253: II→IV; 15-1211: II→IV; 15-2051: II→IV; 17-2061: below I→II |
| CLIFF-IN-RANGE | KLAVIYO INC | [Full Stack Software Engineer - People Systems](https://www.klaviyo.com/careers/jobs/7727703003?gh_jid=7727703003) | $140,000–$210,000 | ATS field | II→IV | 2→4 | $162,198 | 15-1253: IV→IV; 15-1211: III→IV; 15-2051: III→IV; 17-2061: I→IV |
| KLAVIYO INC | 154 | 4 | 97.5% | $126,000 | I |
[exit 0]

# 4. determinism: second run into a temp dir, diff everything except the timestamp
$ diff <(grep -v '"run_at"' course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.log.json) <(grep -v '"run_at"' $T/wage-level.log.json) && echo identical
identical
$ diff <(grep -v 'run at' course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.report.md) <(grep -v 'run at' $T/wage-level.report.md) && echo identical
identical

# 5. funnel arithmetic from the log
$ node -e const\ l=require\(\"./course/2026fa/submissions/mayank-1024/mode-build/runs/2026-10-18/wage-level.log.json\"\)\;const\ f=l.funnel\;console.log\(\"classified+stopped\"\,f.classified+f.stopped\,\"in_target_area\"\,f.in_target_area\,\"model_judgment_values\"\,l.model_judgment_values\,\"postings\"\,l.postings.length\)
classified+stopped 13 in_target_area 13 model_judgment_values 0 postings 13
[exit 0]
```

Tests (offline; `fetch` is stubbed to throw, so any network call from the classifier fails the suite):

```text
$ node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs
✔ annualize uses 2080 hours (OFLC: $115/hr = $239,200/yr)
✔ levelFor: meets-or-exceeds, one cent below drops a level
✔ bandFor names all four bands
✔ multiple worksites: the lowest level wins
✔ parseCsv handles quoted commas and doubled quotes
✔ rangesFromText reads $X - $Y and $Xk–$Yk, ignores single numbers
✔ htmlToText undoes Greenhouse double escaping
✔ areasFor maps remote to the home area, keeps unknown parts
✔ areasFor on real location strings from the 2026-10-18 snapshot
✔ timeline gate: open / conditional / closed / error
✔ CLI: fixture run — bands, stops, funnel arithmetic, no network, no model judgments
✔ break: "Remote, Canada" is not the Boston home area
✔ CLI: zone_choice (a person's answer) unlocks a zoned posting
✔ CLI: closed timeline shows levels but no lottery entries
✔ CLI: cap-exempt employer gets no lottery entries
✔ CLI: an offer is placed on its own level
✔ break: past authorization date → exit 3, nothing written
✔ break: OFLC extract with a missing column → exit 2 (schema drift)
✔ break: refuses to write into the tracked tree
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
[exit 0]
```

Repository checks on the committed branch:

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/mayank-1024-wage-level-floor/ recipes/cases/2026fa/ course/2026fa/submissions/mayank-1024/mode-build/ data/dol/oflc/
conformance: 23 files (7 md · 9 json · 5 js · 2 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
[exit 0]
$ npm run --silent verify
conformance: 170 files (88 md · 36 py · 35 js · 6 json · 5 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
[exit 0]
$ npm run doctor   (privacy + recipe sections)
PRIVACY (no personal data committed)
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
[exit 0]
$ node scripts/pii-scan.mjs --diff upstream/main
pii-scan: clean ✓
[exit 0]
```

The three `verify` warnings already exist on `upstream/main`; this branch does not cause them. `private/` and `data/ats/` are in fact gitignored (`/private/*`, `/data/ats/*`), and doctor's privacy check passes.

## Attestation
- Recipe: wage-level-floor v0.1.0
- By: Claude Code (agent), in Mayank Bhadrasen's session · 2026-10-18. Rows marked *(pending — Mayank)* are the person's own checks, not yet done.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `fetch-oflc.sh` twice (scratch download + in-repo) | same zip sha256 `edc01f64…` both times | identical bytes |
| `grep` Boston 15-1252 in raw export vs extract | `54.94, 66.46, 77.98, 89.50` in both | verbatim copy |
| `fetch-pay-ranges.mjs` on 21 boards | 21/21 ok, 333 engineering postings | every mapped board answers |
| `wage-level.mjs`, scenario 1 | 13 in area → 11 placed, 2 refused (no range); 6 cliff, 5 floor below I | refusals named, funnel adds up |
| re-fetch Klaviyo 7855798003 live | `[[116000,174000,"USD"]]` = snapshot = report | unchanged since capture |
| CSV row for Klaviyo vs report | 154 / 4 / 97.47 / 126000 → 154 / 4 / 97.5% / $126,000 | same values, rate rounded for display |
| second run, diff log + report | identical apart from the timestamp | deterministic |
| `ats:liveness` on 5 postings | 3 active, 2 uncertain (employer-hosted pages; also uncertain at the Greenhouse URL) | gate result per posting, no assumptions |
| **break:** `ats:liveness` on a job ID that doesn't exist (`vestmark/jobs/1`) | `expired` (redirect to `?error=true`) | expired |
| **break:** authorization end date in the past | exit 3, output folder never created | exit 3, nothing written |
| **break:** OFLC extract with a renamed column | exit 2 "schema drift" | exit 2 |
| **break:** `--out-dir recipes/` | exit 2 "refusing --out-dir" | refuse to write into the tracked tree |
| **break:** a "Remote, Canada" posting with a USD range | refused `remote-scope-unclear`; "Remote, US" still maps to Boston | not placed on Boston thresholds |
| **break:** Zone A/B ranges with no zone answer → with `zone_choice` | refused `zone-ambiguous` → placed on Zone B's $130,000 | refuse until a person answers |
| a closed timeline (auth ends before window, no STEM) | levels shown, entries `null` | no lottery column when the window is unreachable |
| *(pending — Mayank)* open 3 boards (Klaviyo, PathAI, Tulip) and confirm each is the company's (G3) | | `identity_confirmed: true` in `board-map.json` |
| *(pending — Mayank)* open the 6 text-sourced postings and confirm each range is Boston base pay (G4) | | confirmed / not |
| *(pending — Mayank)* open the Formlabs and Tulip postings that came back `uncertain` (G6) | | apply button present / absent |

### Did not test
- Any real person's dates or offer: the persona is fictional, and `offers[]` was exercised only in a test.
- Ashby compensation **tiers** (only summary components appeared in live data); Lever boards (not supported by the ingest).
- Whether any employer actually files 15-1252 for these titles (no LCA data; G5).
- Multi-worksite placement on real postings (`lowestAcross` is unit-tested only).
- Any area outside Boston/Worcester, any SOC outside the five configured, and wage years other than 2026-27.
- The text regex against non-dollar formats ("120K-170K" without `$`, "USD 120,000"). It silently finds nothing there, so the posting is refused as `no-pay-range`.
- `npm run bls:local-wage`: it can't run on this clone (inputs never committed, see below).

### Broke during testing, fixed
- **"Remote" mapped to Boston no matter what else the location said.** On live data, "New York, NY; Remote" (Cloaked) was placed on Boston lines as `FLAT`, and "Remote, Canada" (Toast) reached the classifier as Boston, stopped only by its CAD currency. Fix: `lib.mjs` reports leftover place text; `wage-level.mjs` refuses with `remote-scope-unclear` when "Remote" is the only mapped part and another place is named. Two regression tests use the exact strings from the snapshot. Scenario 2 went from 28 placed / 8 refused to 27 / 9.
- **A city hidden inside another city's part.** "Boston (Onsite), New York (Onsite) Preferred, or Remote" was split only on `;|/or`, so New York disappeared into the Boston part. Fix: match every map key in the whole string and report the residue. Caught by a unit test, before any run.
- **The schema-drift test was passing for the wrong reason.** The harness passed `--oflc` twice and the script read the first (good) file. The test was fixed to override arguments; it now fails on a broken column, as intended.
- **Reconnaissance probe bug** (not shipped): the first scratch probe called `decodeURIComponent` on HTML and reported "URI malformed" for Klaviyo, Cohere Health and AcuityMD, which looked like dead boards. The shipped ingest decodes entities instead, and all three boards answer.
- **Output folder guard** rejected `/private/tmp` (macOS `os.tmpdir()` is `/var/folders/…`). Added `/tmp` and `/private/tmp`.
- **Report wording:** "at 7 companies" when 21 were scanned (7 had a matching posting); band names printed as "floor below l1"; approval rates printed with 14 decimals. All fixed in the report writer; the log keeps raw values.

## Gates still owed (by Mayank, before acting on any row)

| Gate | What to do | Rows it covers |
|---|---|---|
| G3 board identity | open the board, confirm it's the company, set `identity_confirmed: true` | all 21 (at minimum Klaviyo, PathAI, Tulip) |
| G4 pay evidence | open the posting, confirm the text range is Boston base pay | Cohere Health SWE II; Ginkgo SWE III; PathAI SWE I; Tulip ×3 |
| G5 occupation code | ask the recruiter which SOC the role is filed under | any posting you pursue |
| G6 liveness | `npm run ats:liveness -- <url>`; open `uncertain` ones by hand | Formlabs Print Pipeline, Tulip Frameworks (uncertain) |
| G7 offer | put the base salary in `offers[]` in a private persona and re-run | when an offer exists |

## 5. Reflection

**What went well.**
- The question has an exact, public, hash-pinnable answer, and the mode answers it with zero model judgments. Every number traces to a DOL row, an ATS field, or a CSV row.
- Massachusetts' pay-range law made the input exist: 156 of 333 engineering postings carried a structured range in the ATS's own field. The repo's providers already fetched these boards and threw that field away.
- The refusals carry real information. "Zone A/B/C with no Boston zone" and "remote but tied to New York" are things a student would otherwise read past.
- The most useful single output is the line to cross. $138,237 appeared as the line in 5 of the 6 cliff postings.

**What the mode got wrong or missed.**
- It shipped a wrong answer once (the "Remote" bug) that looked exactly like a right one. The only reason it was caught is that scenario 2 surfaced a CAD range on a "Boston" posting. A posting in USD with "Remote, Canada" would have been placed silently. The general lesson: a location map is a judgment, and the tool must say when it is guessing.
- The occupation code dominates the answer, and the mode can't see it. 11 of 11 placements move under a plausible alternative code. Until LCA data is joined (proposed addition 1), the band is conditional on a guess.
- 6 of 11 placements rest on regex-read text, and the narrow persona left only 13 postings in scope. That's an honest but thin sample.
- The sponsor median from 80 Days turned out to be unusable for this question: company-wide, all titles, no year. Formlabs' median ($111,000) is below Level I for a software developer.
- G6 can't conclude on employer-hosted pages: 2 of 5 checks were `uncertain` even at the canonical Greenhouse URL.

**Next steps (concrete).**
1. Mayank clears G3/G4/G6 on the rows above and logs the decisions. That's the person's half, and the step that makes RUNNABLE-LIVE claimable once the TODOs close.
2. Join DOL LCA disclosure data for the 21 companies (TODO 1) to turn "which code?" into a record of what each employer actually filed.
3. Implement the `listed-in-ats` liveness state (TODO 5).
4. Feed the band into the engine's composite only after the maintainers decide how role quality should be weighted (DOMAIN.md known gap 3). This mode deliberately produces no score.
