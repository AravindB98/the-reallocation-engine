# Worked run — backend-pivot-range on 95 real Boston postings, 2026-10-20

## Executive summary

The tool was run on 95 backend-type job postings that were open on October 20, 2026 at 11 Boston-area employers. On October 21 I made every gate decision myself. I approved its settings, chose the occupation for three site-reliability postings, and marked two developer-advocate postings as outside my target. I opened the 18 postings the checker couldn't confirm and found all of them open. The final run (run 7) put 75 postings in the standard pile and prioritized none, because the duties reading separated nothing and I decided the tool must not rank on it. From those, I picked 6 to tailor for: the ones asking 0–2.5 years of experience that match my backend skills.

- A backend job's official occupation depends on how its title is spelled.
- The data-engineering occupations are statistically indistinguishable from backend software development.
- If O*NET's rating errors move together, nothing in this family is distinguishable at all.

The tool's reading of each posting's duties did not work: it called every readable posting "judgment-heavy." The first two runs also exposed four bugs, including a crash that left a half-written output behind. All four were fixed test-first and re-run.

## Inputs

| Input | What | Label |
|---|---|---|
| Postings | `runs/fetch-2026-10-20/roles.json` + 95 snapshots: every backend-adjacent US posting on 11 public Greenhouse boards at 2026-10-20T14:41:26Z, emails/phones removed | record |
| O*NET | `scripts/contrib/…/data/onet_elements_15.csv`, `onet_titles.csv`, cut from O*NET 30.2 after 5 SHA-256 matches with `data/bls/BLS-audit.md` | record |
| Repo table | `data/bls/compact/soc_occupation_compact.csv` | record |
| Liveness | `runs/liveness-2026-10-20.txt`, saved output of `npm run ats:liveness` on the 90 PRIORITIZE/STANDARD URLs | record |
| Decisions | `scripts/contrib/…/config.json`: anchor 15-1252.00, scope `15-`, z 1.96, phrase lists, family rules. Drafted by Claude; **approved as drafted by me on 2026-10-21** (TODO #1 closed). Pins added by me at G2 on 2026-10-21: both SRE title forms → 15-1252.00 | your-input |
| Persona | none needed: the mode uses only my target occupation (anchor). No personal data is read | — |

## Commands and real output

All commands were run from the repo root of my fork's worktree (`mode/ashwinthankachan26-backend-pivot-range`, cut from `upstream/main` at `015843d`). `M=scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range`, `R=course/2026fa/submissions/ashwinthankachan26/mode-build/runs`.

**0. Canvas "Before you start" (2026-10-20 10:30 EDT)**

```text
$ npm run verify
✓ manifest check passed (3 warnings)
$ node scripts/doctor.mjs
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
$ node scripts/pii-scan.mjs --diff upstream/main
pii-scan: clean ✓
$ npm run --silent score -- data/examples/ch11-roles.json --out-dir <scratch>
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
$ npm run ats:scan -- --dry-run
Error: portals.yml not found. Run onboarding first.
```

`npm run score` with no file prints only its usage line; it needs a roles file. `ats:scan --dry-run` fails on a fresh clone because `data/ats/portals.yml` is gitignored (only `portals.example.yml` ships). Neither is used for this mode's decision.

**1. Ingest O*NET 30.2 (the only O*NET network step)**

```text
$ python3 -I $M/ingest_onet.py --download --cache-dir <scratch>/onet-cache2 --out-dir <scratch>/ingest-dl
✓ verified 5 O*NET files against data/bls/BLS-audit.md
  onet_elements_15.csv: 279 ratings, 31 occupations · onet_titles.csv: 2801 titles
$ cmp <scratch>/ingest-dl/onet_elements_15.csv $M/data/onet_elements_15.csv && cmp <scratch>/ingest-dl/onet_titles.csv $M/data/onet_titles.csv
both extracts identical to the committed ones
```

(The committed extracts were first cut at 10:31 EDT from the same zip, downloaded with `curl`: HTTP 200, 13,444,123 bytes, SHA-256 `b5479271…7453741`. The `--download` path above reproduced them byte for byte at 14:52:55Z.)

**2. Fetch today's postings (the only posting network step)**

```text
$ python3 $M/fetch_postings.py --out-dir $R/fetch-2026-10-20
✓ fetched 11 boards → 95 backend-adjacent postings saved (2026-10-20T14:41:26Z)
  PathAI                           8 of 14 open jobs
  Vestmark                         2 of 7 open jobs
  Klaviyo                         16 of 162 open jobs
  Cohere Health                    4 of 76 open jobs
  Toast                           18 of 308 open jobs
  Formlabs                        11 of 248 open jobs
  NetBrain Technologies            3 of 43 open jobs
  Cambridge Mobile Telematics     10 of 24 open jobs
  SimpliSafe                      10 of 35 open jobs
  CarGurus                         5 of 39 open jobs
  Datadog                          8 of 432 open jobs
```

**3. Run 1 (v0.1.0): kept as evidence of what was wrong**

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-20 --out-dir $R/pivot-2026-10-20
✓ assessed 95 postings → PRIORITIZE 67 · STANDARD 15 · PIN-SOC 13
```

Kept unchanged as `$R/pivot-2026-10-20-run1-v0.1.0/`. Reading the 13 PIN-SOC rows showed three defects (see *Broke during testing*): "Sr." left a stray "." in the title, qualifier words ("Java", "L5", "Distinguished") blocked exact O*NET matches, and 31 postings with no recognised duties header were read whole, including requirements and benefits.

**4. Run 2 (v0.1.1, after the fixes): first attempt crashed**

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-20 --out-dir $R/pivot-2026-10-20-run2
Traceback (most recent call last):
  …
  File ".../pivot_range.py", line 213, in report
    how = {'onet-exact': f'O*NET title "{m.get("matched_title")}" [record]', 'family-fallback': f'family {m.get("family")} [your-input]',
KeyError: 'onet-contained'
exit=1
```

The crash came **after** `pivot-log.json` had been written, which broke the tool's own "refuse → write nothing" rule. Fixed (both outputs are now built in memory first), a fixture was added for the new path, the partial folder was deleted, and the run was repeated:

```text
✓ assessed 95 postings → PRIORITIZE 54 · STANDARD 36 · PIN-SOC 5
```

**5. Liveness gate: the repo's checker on all 90 PRIORITIZE + STANDARD URLs (10:44–10:48 EDT)**

```text
$ npm run --silent ats:liveness -- $(cat $R/shortlist-urls-2026-10-20.txt) > $R/liveness-2026-10-20.txt
$ head -3 $R/liveness-2026-10-20.txt ; tail -1 $R/liveness-2026-10-20.txt
Checking 90 URL(s)...

✅ active     https://www.pathai.com/careers/8696752002?gh_jid=8696752002
Results: 72 active  0 expired  18 uncertain
$ grep -A1 "^⚠" $R/liveness-2026-10-20.txt | head -2
⚠️ uncertain  https://careers.formlabs.com/job/8262437/apply/?gh_jid=8262437
           content present but no visible apply control found
```

The checker exits 1 whenever any URL isn't confirmed active. That's by design (it fails closed), so its saved output is read, not its exit code.

**6. Run 3 (final): the mode with the liveness results**

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-20 --liveness $R/liveness-2026-10-20.txt --out-dir $R/pivot-2026-10-20-run3-live
✓ assessed 95 postings → PRIORITIZE 50 · STANDARD 22 · PIN-SOC 5 · CHECK-LIVENESS 18
```

**7. Tests**

```text
$ python3 -W error::ResourceWarning -m unittest $M/test_pivot_range.py
Ran 30 tests in 0.176s

OK
```

### Excerpt from `runs/pivot-2026-10-20-run3-live/pivot-report.md` (copied unchanged)

```text
| Vestmark — Software Engineer | **PRIORITIZE** | occupation at or above my anchor, and the posting's own duties read judgment-heavy | 15-1252.00 Software Developers · O*NET title "software engineer" [record] | 3.834 · indistinguishable | judgment-heavy (8 judgment / 1 routine) [model-judgment] | active [record] |
| Cambridge Mobile Telematics — Senior Site Reliability Engineer, SecOps | **PIN-SOC** | the title's candidate occupations disagree about the anchor; pin one (with a reason) at G2 | 15-1221.00 Computer and Information Research Scientists; 15-1252.00 Software Developers · O*NET title "site reliability engineer" [record] | 3.834–4.516 · mixed | judgment-heavy (7 judgment / 1 routine) [model-judgment] | listed [record] |
```

The occupations table from the same report:

| O*NET occupation | Pivot (record) | ± SE (model-judgment) | Rated | z vs anchor | Band | Ratings ≥ 5 yrs apart? | National median wage (record) |
|---|---|---|---|---|---|---|---|
| 15-1221.00 Computer and Information Research Scientists | 4.516 | 0.076 | 08/2019 | +5.65 | above | yes | $140,910 |
| 15-1299.08 Computer Systems Engineers/Architects | 4.027 | 0.028 | 08/2024 | +1.97 | above | no | $108,970 (shared BLS code) |
| 15-1242.00 Database Administrators | 3.958 | 0.037 | 08/2023 | +1.22 | indistinguishable | no | $104,620 |
| 15-2041.00 Statisticians | 3.958 | 0.050 | 08/2024 | +1.16 | indistinguishable | no | $103,300 (shared BLS code) |
| 15-1243.00 Database Architects | 3.933 | 0.043 | 08/2023 | +0.96 | indistinguishable | no | $135,980 (shared BLS code) |
| 15-1252.00 Software Developers | 3.834 | 0.094 | 08/2025 | +0.00 | anchor | no | $133,080 |
| 15-1243.01 Data Warehousing Specialists | 3.626 | 0.065 | 08/2018 | -1.83 | indistinguishable | yes | $135,980 (shared BLS code) |
| 15-1254.00 Web Developers | 3.584 | 0.054 | 07/2017 | -2.31 | below | yes | $90,930 |
| 15-1253.00 Software Quality Assurance Analysts and Testers | 3.582 | 0.038 | 08/2022 | -2.50 | below | no | $102,610 |
| 15-2051.00 Data Scientists | missing | — | — | — | no score | — | $112,590 (shared BLS code) |

## Verified vs inferred, line by line

### Vestmark — Software Engineer (PRIORITIZE)

| Value | From `pivot-log.json` | Label | Why that label |
|---|---|---|---|
| Title | "Software Engineer" | record | board API |
| Normalized title tried | "software engineer" | model-judgment | my normalization rule (level words, split marks) |
| Occupation | 15-1252.00 Software Developers, by exact O*NET title | record | the title is in O*NET's own lists for that code |
| Pivot 3.834 | mean of 9 ratings, each N = 8, rated 08/2025 | record | O*NET 30.2 (= the repo's stored 3.834) |
| ± 0.094 | √(ΣSE²)/9 | model-judgment | assumes independent rating errors |
| Band "indistinguishable" | it is the anchor itself | model-judgment | rule |
| Duties: 8 judgment / 1 routine | e.g. "Participate in the full delivery lifecycle: design discussions, development, testing, deployment, and iteration" | quote = record; count = model-judgment | phrase lists are my rule; the sentence is Vestmark's |
| Liveness "active" | `✅ active https://job-boards.greenhouse.io/vestmark/jobs/8009953` | record | the repo checker on the live page, 10:44–10:48 EDT |
| Next action PRIORITIZE | at/above anchor + judgment-heavy | model-judgment | rule. **Not** a decision |

### Cambridge Mobile Telematics — Senior Site Reliability Engineer, SecOps (PIN-SOC)

| Value | From `pivot-log.json` | Label | Why that label |
|---|---|---|---|
| Normalized title | "site reliability engineer" | model-judgment | rule |
| Candidates | 15-1221.00 Computer and Information Research Scientists (4.516, rated 08/2019), 15-1252.00 Software Developers (3.834, 08/2025) | record | O*NET lists "Site Reliability Engineer" under both |
| Ignored | 17-2112.02 Validation Engineers | record + your-input | listed by O*NET, outside my scope (`15-`) |
| z +5.65 vs anchor | for 15-1221.00 | model-judgment | independence assumption |
| Band "mixed" | one candidate above, one the anchor | model-judgment | rule |
| Duties 7 / 1 | first judgment quote: "Use independent judgment and discretion to implement security tooling and controls in AWS as defined by the Security Engineering team…" | quote = record; count = model-judgment | counted as judgment because of "security", though the sentence says the work is *defined by another team*: the rule's crudeness in one line |
| Liveness "listed" | on the board API at 14:41:26Z, 0 days old | record | not shortlisted, so not opened by the checker |
| PIN-SOC | — | model-judgment | I must choose the occupation, with a reason (G2) |
| *Run 4, after my pin* | occupation 15-1252.00 via `pinned`; liveness `active` (checker, 2026-10-21) → **PRIORITIZE** | your-input (my pin) + record | my G2 decision, not the tool's |

The same split holds for every row. Only title-list membership, the ratings, errors, dates, wages, quoted sentences, listing times and checker results are `record`. Every normalization, error estimate, band, reading and action is a rule (`model-judgment`), and every threshold, scope, phrase list and family choice is `your-input`. No language model scores or reads anything.

## Verification

| Check | How | Result |
|---|---|---|
| Source is the audited release | SHA-256 of 5 O*NET files vs `data/bls/BLS-audit.md` | 5 of 5 match |
| Extract reproduces the repo table | test: every stored group-15 score vs recomputed | 31 of 31 equal (3 decimals) |
| Independent recompute | `awk` on raw `Abilities.txt` + `Skills.txt` for 15-1254.00 | mean 3.5844, SE 0.0541, rated 07/2017 = the report |
| Title fact, raw | `grep -P "\tback end developer\t" "Alternate Titles.txt"` | `15-1254.00	Back End Developer`; also "Back End Engineer", "Back End Software Engineer", "Back-End Web Developer" under 15-1254.00 |
| Quotes are the posting's own | re-fetched Vestmark 8009953 from the board API, HTML → text | 6 of 6 quoted sentences found verbatim |
| Determinism | the same inputs into a new folder | `pivot-log.json` and `pivot-report.md` byte-identical |
| Counts agree | JSON `counts` vs recount vs report rows vs `roles.json` | 95 = 95 = 95 = 95 |
| Spelling flip | `lookup_occupations` on 4 spellings | "Software Engineer, Backend" and "Backend Software Engineer" → 15-1252.00; "Back End Software Engineer" → 15-1254.00 (below, z −2.31); "Back-End Engineer" → family fallback, mixed |
| Source check by me | O*NET OnLine (onetonline.org) keyword search, "Back End Software Engineer", 2026-10-21 | closest match 15-1254.00 Web Developers, then 15-1252.00 Software Developers |
| Error assumption | z recomputed with fully correlated errors (SE = mean SEᵢ) | Web Developers −2.31 → −0.81; QA −2.50 → −0.90; CIS Research Scientists +5.65 → +1.94: **none** distinguishable |

## Prediction vs result

The prediction was written into run log 6 before the fetch (Claude's; mine was not given before the run).

| Predicted | Result | |
|---|---|---|
| 60–100 postings | 95 | ✓ |
| most "Software Engineer" titles → exact match to the anchor | 77 exact matches; 78 postings have 15-1252.00 among their candidates | ✓ |
| data-engineer titles route on text, not PIN-SOC | Formlabs "Data Engineer": indistinguishable (then CHECK-LIVENESS) | ✓ |
| SRE and full-stack titles → PIN-SOC | SRE ✓ (3); full stack ✗: "Full Stack Software Engineer" is itself an O*NET title for 15-1252.00 | half |
| QA/SDET below the anchor | Formlabs R&D Test → below ✓; PathAI SDET → anchor ✗ (contains "software development engineer") | half |
| PRIORITIZE 30–50%, STANDARD 30–50%, PIN-SOC 5–15% | 53%, 23%, 5% | ✗ ✗ ✓ |
| > 60% of readable postings judgment-heavy | **100%** (62/62) | ✓, but the size of it is the problem |

## 2026-10-21 — v0.1.2: three fixes for what run 3 showed

**1. The tool now says when the duties reading separates nothing.** A new batch check (`signal_health`) counts how many readable postings fall in each class. It's the simplest possible rule, with no threshold to tune: the reading discriminates only if at least one posting falls in each class. It is reported in the log and in a new report section, and it changes no route. On the run-3 inputs (refactor check, same 95 postings):

```text
signal_health: all 62 classified postings fell in one class (62 judgment-heavy, 0 routine-leaning); in this batch the duties reading separates nothing, so PRIORITIZE rests on the occupation and liveness alone
postings identical after refactor: True
```

**2. The 18 postings the checker couldn't confirm were re-checked against each employer's own board** (evidence for G3, not a clearance):

```text
$ (one GET per posting to https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<id>; full list in runs/board-recheck-2026-10-21.txt)
# checked_at 2026-10-21T13:04:44Z · … · 200 = still listed by the employer's board, 404 = removed
200  formlabs-8262437                       Formlabs                     Data Engineer
200  datadog-8247566                        Datadog                      Senior Software Engineer - Incident Insights & Readiness
…
Results: 200: 18
```

All 18 are still listed by the employers' boards. The checker's `uncertain` was its blind spot for embedded application forms, not closed postings.

**3. A blind check for the duties reading (TODO #4).** `blind_check.py make` picked 20 of the 71 postings with a duties section (seed 2026) and wrote a sheet showing **only** the duties text, never the tool's reading:

```text
$ python3 $M/blind_check.py make --log $R/pivot-2026-10-20-run3-live/pivot-log.json --fetch $R/fetch-2026-10-20 --n 20 --seed 2026 --out-dir $R/blind-check-2026-10-21
✓ blind sheet: 20 of 71 postings (seed 2026) → …/blind-check-2026-10-21/blind-sheet.md + …/blind-check-2026-10-21/blind-labels.csv
```

The person labels each posting J (judgment) or R (routine) from the text alone; `blind_check.py score` then counts agreement. An unlabelled sheet is refused (exit 2, tested).

## 2026-10-21 — run 4 (after my first G2 decisions; superseded by run 5)

**My G2 decisions (2026-10-21, given in chat, recorded in `config.json` and run log 6):**
- I approved every config value as drafted.
- I pinned the 3 SRE postings (title forms `site reliability engineer` and `site reliability engineer - data center`) to 15-1252.00 Software Developers. My reason: "SRE work at these companies is production software/infrastructure engineering, not research; the 2019 Research Scientists rating is 6 years older than Software Developers' 2025 rating."
- I gave no preference for the 2 Datadog Developer Advocate postings, so they stay PIN-SOC.

The pins moved 3 postings onto the shortlist after the first liveness check, so the checker was run on them too (the tool now takes several `--liveness` files, later ones winning, tested):

```text
$ tr '\n' '\0' < $R/shortlist-urls-2026-10-21-pinned.txt | xargs -0 npm run --silent ats:liveness -- > $R/liveness-2026-10-21-pinned.txt
Checking 3 URL(s)...

✅ active     https://www.pathai.com/careers/8696773002?gh_jid=8696773002
✅ active     https://www.cmtelematics.com/who-we-are/join-our-team/job-posting/?gh_jid=8083410
✅ active     https://www.cmtelematics.com/who-we-are/join-our-team/job-posting/?gh_jid=8231597

Results: 3 active  0 expired  0 uncertain

$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run4-final
✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · PIN-SOC 2 · CHECK-LIVENESS 18
```

Versus run 3, exactly 3 postings changed, all through my pins: PathAI SRE Data Center PIN-SOC → STANDARD (its duties section wasn't found); CMT SRE Machine Learning and CMT SRE SecOps PIN-SOC → PRIORITIZE.

**The recipe's gate commands on run 4 (`OUT=$R/pivot-2026-10-21-run4-final`):**

```text
G1 exit=0
    PIN-SOC family-fallback Developer Advocate - Service Management
    PIN-SOC family-fallback Senior Developer Advocate - Modern App Development
G2 exit=1 (1 = PIN-SOC rows remain)
G3 machine half exit=0        # all 75 PRIORITIZE/STANDARD rows: checked by npm run ats:liveness, active
G4 exit=0
## Executive summary          # G5: the report opens with its summary
```

## 2026-10-21 — my gate decisions and run 5 (superseded by run 6)

All decisions below are mine, given in chat on 2026-10-21 and recorded in `config.json` and run log 6.

| Gate | My decision |
|---|---|
| G2 | Config approved as drafted. 3 SRE postings → 15-1252.00 Software Developers (reason recorded). 2 Datadog Developer Advocate postings: "Outside my backend target" |
| G3 | I opened all 18 postings the checker couldn't confirm: **all 18 were open** (the board-API re-check also listed all 18) |
| G4 | I agree with the logged example of the rule's crudeness (the "Security Engineering team" sentence counted as judgment) |
| G5 | My rule: postings that ask for 0–2.5 years and match my backend skills. Applied to the posting text, it gave 7; **I dropped the SDET**. My tailor list is the 6 below |

To record the Developer Advocate decision, v0.1.3 adds an out-of-target pin (it needs a reason; tested), which routes to `OUT-OF-TARGET`:

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run5-final
✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18
```

Gate commands on run 5: **G1 exit 0 · G2 exit 0** (no PIN-SOC left) · **G3 machine half exit 0** (75/75 shortlisted active via `ats:liveness`) · **G4 exit 0** · the report opens with `## Executive summary`.

**My G5 tailor list** (experience lines quoted from each posting):

| # | Posting | Posting asks | Tool said |
|---|---|---|---|
| 1 | Cohere Health — Software Engineer II | "2+ years of professional software engineering experience…" | PRIORITIZE |
| 2 | Klaviyo — Software Engineer II, Test Frameworks & Tooling | "You have 2+ years of software engineering experience…" | PRIORITIZE |
| 3 | Vestmark — Software Engineer | "2-4 years of professional software engineering experience; strong internship experience or personal project…" | PRIORITIZE |
| 4 | Klaviyo — Software Engineer II, Recommendations | "2+ years … with a focus on backend and distributed systems…" | STANDARD |
| 5 | PathAI — Software Engineer I, Fullstack | no minimum stated; entry-level title | STANDARD |
| 6 | Formlabs — Software Engineer, Print Pipeline | no minimum stated; no level word in the title | CHECK-LIVENESS (I opened it: open) |

Dropped by me: PathAI SDET (test automation isn't my backend focus). The years numbers come from a regex over the posting text (`model-judgment`); the quotes are the postings' own words (`record`); the choice is mine (`your-input`).

## 2026-10-21 — v0.1.4 and run 6 (superseded by run 7)

**My own check of the source.** I searched O*NET's own website (onetonline.org, Occupation Keyword Search) for "Back End Software Engineer". The closest match listed first was **15-1254.00 Web Developers**, then **15-1252.00 Software Developers**. That's the same split the mode found in O*NET's title files.

**My TODO #3 decision:** "Keep separate". "backend", "back-end" and "back end" are not merged before lookup, because O*NET's own lists are the record and the mismatch is the finding. Checked first: it changes no posting in this run (all 3 backend postings are titled "Software Engineer, Backend"). It would change future titles like "Backend Software Engineer", which would go to Web Developers if merged.

**TODO #5 built (v0.1.4):** every occupation is now compared under **both** error assumptions, independent and fully correlated, and the report says whether a difference is real under both. Routing still uses the independent-error band.

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run6-final
✓ assessed 95 postings → PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18
actions identical to run 5: True | version 0.1.4
gates G1..G4: True True True True
```

From `runs/pivot-2026-10-21-run6-final/pivot-report.md` (5 of 10 rows):

| O*NET occupation | Pivot | z (indep.) | Band | z (corr.) | Real under both? |
|---|---|---|---|---|---|
| 15-1221.00 Computer and Information Research Scientists | 4.516 | +5.65 | above | +1.94 | no |
| 15-1299.08 Computer Systems Engineers/Architects | 4.027 | +1.97 | above | +0.70 | no |
| 15-1242.00 Database Administrators | 3.958 | +1.22 | indistinguishable | +0.43 | no |
| 15-1254.00 Web Developers | 3.584 | -2.31 | below | -0.81 | no |
| 15-1253.00 Software Quality Assurance Analysts and Testers | 3.582 | -2.50 | below | -0.90 | no |

**No occupation in this family is different from Software Developers under both assumptions.** The tool now prints that in its own output.

## 2026-10-21 (late) — an outside review, fixes, and run 7 (final)

A strict outside review of PR #86 (a classmate's AI assistant, shared with me) found real problems. Each was checked against the files before anything changed:

| Finding | Checked | What I did |
|---|---|---|
| PRIORITIZE vs STANDARD depended on whether a duties heading was found, not on AI-resilience | **true**: of 74 live postings at or above the anchor, all 52 with read duties were PRIORITIZE and all 22 without were STANDARD. The tool's own sentence ("PRIORITIZE rests on the occupation and liveness alone") was wrong | **My decision:** the tool now refuses to PRIORITIZE or NOTE-ROUTINE when the batch's duties reading separates nothing (v0.1.5, tested) |
| Matches made by my normalization were labelled as O*NET records | true | an exact match is `record` only for an untouched title; otherwise `model-judgment` (v0.1.5, tested): 3 record, 72 model-judgment in run 7 |
| "Software Engineer, Backend" and "Backend Software Engineer" were described as if they were O*NET titles | true: they aren't (only "Back End Software Engineer" is) | wording corrected in the justification, recipe, card, my reflection (my approval), presentation |
| "On the clock" cost named but not modelled; no visa-timeline gate | true | the claim is removed; no timeline gate here (it needs personal dates); stated as out of scope |
| G3 had no per-posting record; G4 was a one-word "Agree" | true | the per-posting G3 table and the per-posting G4 checks of my 6 tailor picks (below) |
| Privacy: my real situation tied to my name | true (DATA_CONTRACT: real immigration details; fictional personas only) | replaced with the persona Aarav Patel; branch re-cut (below) |
| Blind duties check never done | true | an 8-posting blind sheet made; **not labelled before submission** (below) |
| Next steps out of date | true | corrected with my approval |

```text
$ python3 $M/pivot_range.py --roles $R/fetch-2026-10-20/roles.json --today 2026-10-21 --liveness $R/liveness-2026-10-20.txt --liveness $R/liveness-2026-10-21-pinned.txt --out-dir $R/pivot-2026-10-21-run7-final
✓ assessed 95 postings → STANDARD 75 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18
changes vs run 6: {('PRIORITIZE', 'STANDARD'): 52}
gates G1..G4: True True True True
```

**G3, per posting:** the checker's result, the employer board API (HTTP 200 = still listed, 2026-10-21T13:04:44Z), and my own check ("All 18 were open", given in chat 2026-10-21):

| # | Posting | `ats:liveness` | Board API | I opened it |
|---|---|---|---|---|
| 1 | Formlabs — Data Engineer | `uncertain` | 200 | open |
| 2 | Formlabs — Embedded Software Engineer | `uncertain` | 200 | open |
| 3 | Formlabs — Lead Embedded Software Engineer | `uncertain` | 200 | open |
| 4 | Formlabs — R&D Reliability/Test Engineer | `uncertain` | 200 | open |
| 5 | Formlabs — R&D Reliability/Test Engineer | `uncertain` | 200 | open |
| 6 | Formlabs — R&D Reliability/Test Engineer - June 2027 Grads | `uncertain` | 200 | open |
| 7 | Formlabs — R&D Reliability/Test Engineer - June 2027 Grads | `uncertain` | 200 | open |
| 8 | Formlabs — Senior Data Engineer | `uncertain` | 200 | open |
| 9 | Formlabs — Senior Embedded Software Engineer | `uncertain` | 200 | open |
| 10 | Formlabs — Software Engineer, E-commerce | `uncertain` | 200 | open |
| 11 | Formlabs — Software Engineer - Print Pipeline | `uncertain` | 200 | open |
| 12 | CarGurus — Principal Software Engineer, Algorithmic Traffic Acquisition | `uncertain` | 200 | open |
| 13 | Datadog — People Systems Developer | `uncertain` | 200 | open |
| 14 | Datadog — Senior Software Engineer | `uncertain` | 200 | open |
| 15 | Datadog — Senior Software Engineer - Bazel Tools | `uncertain` | 200 | open |
| 16 | Datadog — Senior Software Engineer - Distributed Systems | `uncertain` | 200 | open |
| 17 | Datadog — Senior Software Engineer - Husky Storage | `uncertain` | 200 | open |
| 18 | Datadog — Senior Software Engineer - Incident Insights & Readiness | `uncertain` | 200 | open |


**G4, per posting (my checks, given in chat 2026-10-21):**

| My tailor pick | Duties the tool quoted | Do they match the job as I read it? |
|---|---|---|
| Vestmark — Software Engineer | "Contribute to the design and delivery of agentic systems…" · "Participate in the full delivery lifecycle: design discussions, development, testing…" | yes |
| Klaviyo — Software Engineer II, Test Frameworks & Tooling | "you will own the execution of critical projects…" · "ensure they are fast, reliable, and easy for other teams to adopt" | yes |
| Cohere Health — Software Engineer II | "Design and ship features with strong quality discipline…" · "Write short design notes … articulating tradeoffs" | yes |
| PathAI — Software Engineer I, Fullstack | none (no duties section found) | I read the posting myself: yes |
| Klaviyo — Software Engineer II, Recommendations | none (no duties section found) | I read the posting myself: yes |
| Formlabs — Software Engineer, Print Pipeline | none (no duties section found) | I read the posting myself: yes |

**Blind check (TODO #4):** `blind_check.py make --n 8 --seed 2110` made an 8-posting sheet (`runs/blind-check-8-2026-10-21/`), showing no tool answers. **I didn't label it before submitting**, so there's no agreement score and TODO #4 stays open.

**Privacy (found in the same review):** my submission described my own real situation (visa status, graduation month, experience) next to my name. The repo's DATA_CONTRACT treats real immigration details as personal data and requires fictional personas. I replaced it with the repo's fictional persona **Aarav Patel** (`search/examples/aarav-patel/`), and re-cut the branch into a single clean commit.

## Reflection

*Approved and added by Ashwin S Thankachan · 2026-10-21 (wording corrected and approved by him the same evening)*

**What worked.** The tool showed me something I would never have seen myself. "Back End Software Engineer" is filed under Web Developers (score 3.584, rated 2017), while "Software Engineer, Backend" matches Software Developers (3.834, rated 2025) only through the plain title "Software Engineer"; it isn't an O*NET title itself, even though it's the same job. I also expected data engineering to be safer from AI than backend, but the data couldn't tell them apart. So I'm keeping backend as my target.

**What it got wrong.** The part that reads each posting's duties didn't work. It called all 62 readable postings "judgment-heavy," because almost every posting uses words like "design" and "scale," so it measured vocabulary, not the real work. It also filed some jobs under the wrong occupation, like a hardware test role at Formlabs, and the liveness checker couldn't confirm 18 postings, so I opened them myself (all were open).

**Next steps.** I'll label postings blind myself and see if the tool agrees with me before changing the duties rule, and I'll compare O*NET's "needs judgment" with real AI-usage data. For my own job search, I'll tailor applications for the 6 postings I picked first, the ones asking for 0–2.5 years that match my backend skills.

### Technical detail behind it (from the run records)

- **The duties reading doesn't discriminate.** 62 of 62 readable postings were "judgment-heavy" and 0 routine. Modern postings all use words like "design", "scale", "security" and "performance", so the phrase rule mostly measures vocabulary. A sentence that defers to another team ("as defined by the Security Engineering team") still counted as judgment.
- **24 postings had no recognised duties header**, so for a quarter of the set the mode says nothing about the posting itself.
- **The contained-title fix created new mis-files.** "People Systems Developer" (HR systems) → Systems Engineers/Architects; PathAI's SDET → the anchor rather than QA. The fix rescued "Senior Java Software Engineer" but moved the error elsewhere.
- **My own tests missed a crash,** because no fixture went through the new code path into the report.
- **The biggest limit isn't in the code.** Whether *any* of these gaps is real depends on how O*NET's rating errors are correlated, which the public data doesn't say.

## Attestation

> Most rows below were run by Claude in my working copy (2026-10-20 → 2026-10-21) and pasted from the terminal. I re-ran the test suite myself on 2026-10-21 (`Ran 33 tests … OK`, at v0.1.2). After that the out-of-target pin was added (v0.1.3), and the suite was re-run before signing (`Ran 34 tests … OK`, 14:13 EDT). I attested v0.1.3 on 2026-10-21. The v0.1.4 edits (TODO #3 and #5) void that under the constitution, so I re-attest v0.1.4 below.

- Recipe: backend-pivot-range v0.1.5
- By: Ashwin S Thankachan · 2026-10-21 (re-attested v0.1.5 after running the suite myself: `Ran 37 tests … OK`)

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 -m unittest …/test_pivot_range.py` (warnings as errors) | 33 pass, 0 fail (v0.1.2), **run by me**; 34 pass after v0.1.3 (re-run before signing) | all pass, offline |
| run 5 (final) with my G2 decisions | PRIORITIZE 52 · STANDARD 23 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18; gate commands G1–G4 all exit 0 | every gate testable and passing |
| I opened the 18 CHECK-LIVENESS postings | all 18 open | human half of G3 |
| out-of-target pin without a reason (break attempt, unit test) | `Refusal` → the run stops | no silent exclusion |
| v0.1.4 suite (both error assumptions) | 35 pass, 0 fail | all pass, offline |
| run 6 (final) | same 95 actions as run 5; gates G1–G4 pass; correlated z = −0.81 (Web Developers), +1.94 (Research Scientists) | matches the manual two-assumption calculation in *Verification* |
| **my own O*NET OnLine search** for "Back End Software Engineer" | closest match 15-1254.00 Web Developers, then 15-1252.00 Software Developers | the title split the mode reports |
| v0.1.5 suite (refuse-to-rank, honest match labels) | 37 pass, 0 fail | all pass, offline |
| run 7 (final) | STANDARD 75 · OUT-OF-TARGET 2 · CHECK-LIVENESS 18; exactly the 52 former PRIORITIZE → STANDARD; gates G1–G4 pass | no ranking on a signal that separates nothing |
| run 4 (final) with my pins + 2 liveness files | PRIORITIZE 52 · STANDARD 23 · PIN-SOC 2 · CHECK-LIVENESS 18; exactly the 3 pinned postings changed | only my G2 decisions move results |
| the recipe's gate commands on run 4 | G1 0 · G2 1 (2 unpinned) · G3 machine half 0 · G4 0 · report opens with its summary | gates are testable |
| `npm run ats:liveness` on the 3 newly shortlisted | 3 active | no posting is prioritized unchecked |
| duties-signal check on the run-3 inputs (v0.1.2) | `all 62 classified postings fell in one class`; every posting's result identical to run 3 | reported, routing unchanged |
| board-API re-check of the 18 `uncertain` postings | 18 × HTTP 200 (still listed), 2026-10-21T13:04:44Z | evidence for G3 |
| `blind_check.py score` on an unlabelled sheet (break attempt) | exit 2, `rows have no J/R label` | refuse to score a blank sheet |
| tests **before** the code existed | `FAILED (errors=1)` (module missing) | fail first |
| `ingest_onet.py --download` | 5 of 5 SHA-256 match; extracts byte-identical to the committed ones | reproducible from the source |
| `fetch_postings.py` on 11 boards | 95 postings, contacts removed | 60–100 (predicted) |
| run 3 with `npm run ats:liveness` on 90 URLs | PRIORITIZE 50 · STANDARD 22 · PIN-SOC 5 · CHECK-LIVENESS 18; checker 72 active / 0 expired / 18 uncertain | unconfirmed postings never prioritized |
| `awk` recompute of 15-1254.00 from raw O*NET | 3.5844 ± 0.0541 | = 3.584 |
| re-fetch Vestmark 8009953, find quotes | 6 / 6 verbatim | quotes are records |
| same inputs, new folder | byte-identical outputs | deterministic |
| **Break B1:** repo table copy with 15-1254.00 stored score → 3.900 | `✗ stored cognitive_pivot_score for 15-1254.00 (3.900) ≠ recomputed from its nine ratings (3.584)…` exit 2, no folder | refuse, write nothing |
| **Break B2:** a pin with no reason | `✗ pin for "site reliability engineer" needs both onet_soc_code and a reason` exit 2, no folder | refuse |
| **Break B3:** mutant `lib_pivot.py` averaging partial ratings, real tests run against it in a scratch copy | `FAILED (failures=2, errors=1)`: the partial-average unit test plus both end-to-end tests | the mutant is caught |
| **Break B4:** O*NET zip with one Software Developers rating changed (Deductive Reasoning 4.00 → 5.00) | `✗ Abilities.txt: SHA-256 459dd0b8… ≠ the repo audit's 822f866b…` exit 2, nothing written | refuse a modified source |
| `ingest_onet.py --download --cache-dir ./tmp-cache` (inside the repo) | `✗ --cache-dir must be outside the repository…` exit 2 | bulk data stays out of git |

### Did not test

- Whether any occupation gap is real under the true (unknown) correlation of O*NET's rating errors. Only the two extremes were computed.
- Whether the duties rule agrees with a person: two blind sheets exist (20 and 8 postings), but I didn't label either before submitting.
- Boards other than these 11 Greenhouse boards (Lever, Ashby, Workday); postings outside Greenhouse's HTML conventions.
- Any posting in a language other than English, or titles with non-ASCII punctuation beyond "’" and "–".
- How an employer actually files these roles (no LCA data loaded; TODO #7).
- Whether the years regex used for my G5 list catches every way a posting states experience (I checked the 7 quoted lines myself).

### Broke during testing, fixed
- **My first re-check of the 3 newly shortlisted URLs was invalid (2026-10-21):** in zsh, `$U` is not split into words, so the 3 URLs went to the checker as **one** argument, and it reported `Checking 1 URL(s)… 1 active` for the joined string. The output was discarded and the check re-run with one argument per URL (`xargs -0`): `Checking 3 URL(s)… 3 active`. The 90-URL run of 2026-10-20 was not affected: it used `$(cat …)`, which zsh does split, and says `Checking 90 URL(s)`.
- **After my pins, 3 postings were on the shortlist without a liveness check** (G3 would have failed) → `--liveness` now accepts several files; tested.

- **My hand-worked expectation was wrong** for the fixture "Software Developer": I expected STANDARD, but the family fallback's two canonical titles disagree, so the rule correctly says PIN-SOC. Test corrected, with the reason written in it.
- **Run 1: "Sr." became ". software engineer"** → periods are now removed before level words (`title_variants`). Test added.
- **Run 1: qualifier words blocked exact matches** ("Senior Java Software Engineer") → new step: the longest contained O*NET title of ≥ 2 words, labeled `model-judgment`. Test added.
- **Run 1: no duties header → the whole posting was read** (requirements, benefits, company blurb) → now `section-not-found` (unknown), and headers that *contain* "responsibilit…" count (Toast's "About this roll* (Responsibilities)"). Two tests added.
- **Run 2 crashed in the report after writing the log** (`KeyError: 'onet-contained'`) → both outputs are built in memory before either is written; a fixture posting now takes the contained-title path end to end.
- **The titles extract was 3.1 MB** → kept only title strings that touch group 15, still with all their occupations: 2,801 rows, 131 KB; results identical.
- **A real-data test guessed "≥ 80 occupations"** (there are 31) → replaced by a stricter test: every stored group-15 score must be reproduced.
- **Break B1's first attempt didn't break anything:** `sed` matched 0 lines, so the tool correctly ran normally. Redone with Python `csv` (1 row changed) → refused as expected.
- **Tests leaked open file handles** (`ResourceWarning`) → helpers that close files; the suite now passes with warnings as errors.
