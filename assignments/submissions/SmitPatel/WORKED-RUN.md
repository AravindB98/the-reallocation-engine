# Worked run — newgrad-swe-bigsponsor mode v0.1.0

## Executive summary

This write-up covers two runs. The **second run (2026-10-17) used real job postings.** The engine's job-board
scanner found new-grad roles at Pinterest, Databricks and Stripe, the engine's posting checker checked them, and
the mode triaged them. Its main finding: the best-evidenced posting (Pinterest, whose sponsorship record lists an
entry-level software title) was **skipped**. The posting checker called it "expired" even though Pinterest's own
job listing still shows it, because Pinterest's careers site blocks automated browsers. At the human gate it was
moved to "needs a person" instead of being skipped. A made-up job link was
correctly handed to a person instead of being scored. Two Stripe new-grad roles came out "network first". Every
one of those decisions rests on an estimated start date, because no posting states one.

The **first run** is below it, unchanged:

This is one real run of the prototype on the repo's shipped H-1B sponsorship data, for a fictional December
graduate looking for new-grad software jobs. Of 12 postings, the run said **apply to one** (Pinterest), network
into four first, skip three, and hand four to a person because the data couldn't answer them. Two of the skips
are at strong sponsors (Databricks, Uber) whose summer start dates fall after the student's OPT unemployment
limit. That is the main thing this recipe is built to catch. Google and Meta aren't in the dataset at all, and the
run says "unknown", not "doesn't sponsor". The outputs below are pasted, not described, and the values I checked
by hand match the source files. The biggest weaknesses: the title rule misreads some titles, and a self-rated fit
score can nearly carry a company with no software evidence into "Consider".

## Inputs

| Input | Path | What it is |
|---|---|---|
| Persona | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-dec-grad.json` | **fictional** "kiran-rao-example": program end 2026-12-18, OPT start 2027-01-11, 90-day limit, 0 used, 14-day buffer, 45-day hiring lag, ≥ 100 approvals (all your-input) |
| Postings | `…/fixtures/postings-sample.json` | 12 **fictional** postings (example.com URLs) at company names chosen to exercise each path: 10 are real CSV rows or near-misses; Google and Meta are deliberately absent |
| Sponsorship | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | shipped, unmodified |
| Wage | `data/bls/compact/soc_occupation_compact.csv` | shipped, unmodified |
| Scorer | `scripts/score/role-scorer.mjs` | shipped, unmodified, run as a CLI |

**Data I ran on:** only what a fresh clone ships. No full Form D quarters, no `.venv`, no network.
The persona mirrors the real situation (December graduation, January OPT start) with **invented dates**. The
owner's real dates live only in a gitignored file and aren't in this submission.

## Commands and real output

Run in a **fresh clone** of `SmitPatel-31/the-reallocation-engine` at `015843d` with only my files copied in
(TEST-REPORT §2). Pasted verbatim:

```
$ node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30
✓ triage 2026-09-30: 12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4
  deadline to start work: 2027-04-11 [your-input]
  scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/triage-log.json  +  triage-report.md  (+ scorer's roles.json, role-scores.json, role-scores.md)
[exit 0]
```

Scorer line, from `triage-log.json → scorer_stdout`:

```
✓ scored 8 roles → Apply 1 · Consider 4 · Skip 3 (skip 38%)
```

The scorer's skip rate (38%) counts only the 8 scored roles. Counting the 4 excluded ones too, 7 of 12 (58.3%,
`summary.skip_or_excluded_share = 0.583`) were not worth an application yet. That meets the "skip at least
half" rule.

### `out/triage-report.md` (Decisions and Needs-a-person sections, verbatim)

| Company | Role | Decision | Why | Next action |
|---|---|---|---|---|
| MICROSOFT CORP | Software Engineer (new grad) | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| PINTEREST INC | Software Engineer I | **Apply** (0.525) | sponsorship Proven (entry-explicit); timeline 1 — start 2027-02-16 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Tailor the résumé and apply (2h research/apply block) |
| DATABRICKS INC | Software Engineer - New Grad (2027) | **Skip** (0) | sponsorship Likely (unlevelled-swe); timeline 0 — start 2027-07-12 is after the unemployment deadline 2027-04-11; liveness 1 [your-input] | Network, don't apply yet: ask about an earlier or off-cycle start date |
| LINKEDIN CORP | Software Engineer, Associate | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-03-01 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| UBER TECHNOLOGIES INC | Software Engineer I | **Skip** (0) | sponsorship Likely (unlevelled-swe); timeline 0 — start 2027-06-21 is after the unemployment deadline 2027-04-11; liveness 1 [your-input] | Network, don't apply yet: ask about an earlier or off-cycle start date |
| STRIPE INC | Software Engineer, New Grad | **Consider** (0.21) | sponsorship Likely (unlevelled-swe); timeline 0.5 — start 2027-04-05 is within the 14-day buffer before 2027-04-11; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| DELOITTE CONSULTING LLP | Software Engineer Analyst | **Consider** (0.2325) | sponsorship Unknown (no-swe-title); timeline 1 — start 2027-02-01 is inside [2027-01-11, 2027-03-28]; liveness 1 [your-input] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| VIRTUSA CORP | Java Engineer | **Skip** (0) | sponsorship Unknown (no-swe-title); timeline 1 — start 2027-02-01 is inside [2027-01-11, 2027-03-28]; liveness 0 [your-input] | Skip |

| Company (as typed) | Role | Gate | Reason | What to do |
|---|---|---|---|---|
| Google | Software Engineer, Early Career | G1 company-match | no-company-match | Not in this dataset (built from SEC Form D filers). Find the exact legal name, or treat sponsorship as Unknown and check another source |
| Salesforce.com, Inc. | Associate Software Engineer | G1 company-match | ambiguous-company-match (SALESFORCE COM INC, SALESFORCECOM INC) | Several rows match; pick the right entity by hand |
| SNOWFLAKE INC | Software Engineer - University Grad | G2 liveness | liveness-unchecked | `npm run ats:liveness -- https://example.com/fixture/p11` |
| Meta Platforms | Software Engineer, University Grad | G1 company-match | no-company-match | Not in this dataset (built from SEC Form D filers). Find the exact legal name, or treat sponsorship as Unknown and check another source |

Full files: `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out/`.

### Scorer arithmetic (from `out/role-scores.json → trace.arithmetic`, verbatim)

```
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 1 = 0.420"      p01 Microsoft
"arithmetic": "(0.9·0.35 + 0.7·0.3) × 1 × 1 = 0.525"      p02 Pinterest
"arithmetic": "(0.6·0.35 + 0.8·0.3) × 1 × 0 = 0.000"      p03 Databricks
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 1 = 0.420"      p04 LinkedIn
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 0 = 0.000"      p05 Uber
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 0.5 = 0.210"    p06 Stripe
"arithmetic": "(0.15·0.35 + 0.6·0.3) × 1 × 1 = 0.232"     p07 Deloitte
"arithmetic": "(0.15·0.35 + 0.6·0.3) × 0 × 1 = 0.000"     p10 Virtusa
```
(Posting labels added on the right by me; the lines are the scorer's.)

## Verified vs. inferred — line by line (Pinterest, p02, the one Apply)

| Value | Where from | Label |
|---|---|---|
| `PINTEREST INC` is exactly one CSV row | `matchCompany` on the shipped CSV | record |
| 1364 approvals, 16 denials, rate 98.84 | CSV `Total Approvals`, `Total Denials`, `Approval_Rate` | record |
| Top titles `Software Engineer`, `Software Engineer II`, `Software Engineer I`, `Senior Software Engineer`, `Senior Data Analyst` | CSV `top_job_titles_sponsored` | record |
| `Software Engineer I` → entry, so bucket entry-explicit | keyword rule v0.1 | your-input (rule) |
| tier Proven → p 0.9 | TIER_MAP, set by Smit (recipe §Values a human set) | your-input (mapping); scorer term labeled `record` by convention, and `p_source: your-input` beside it in the log |
| fit 0.7 | posting fixture, self-rated | your-input |
| liveness 1 (`method: fixture`) | posting fixture, **not** an ats:liveness run | your-input |
| start 2027-02-16 | posting fixture ("stated") | your-input |
| deadline 2027-04-11 = 2027-01-11 + 90 − 0 | persona dates | your-input |
| composite 0.525 → Apply | `role-scorer.mjs` | computed by the engine from the above |
| $156,853 company median, $133,080 BLS 15-1252 median | CSV / BLS compact | record, **not in the score** |
| model-judgment | — | **none in this run.** No AI produced any value |

**Summary.** The sponsorship *evidence* is record. Everything about the *posting* (date, liveness, fit) is
your-input, because the postings are fictional. So this run shows the recipe's logic on real sponsorship data.
It is **not** a real job recommendation.

## Verification — how I know the output is real

1. **Hand cross-check against the source CSV** (Python stdlib `csv` read of the raw file, run separately from the prototype):
   ```
   PINTEREST INC 1364.0 16.0 ['Software Engineer', 'Software Engineer II', 'Software Engineer I', 'Senior Sof
   DELOITTE CONSULTING LLP 8810.0 222.0 ['Manager', 'Senior Consultant', 'Senior Solution Specialist', 'Consultant', 'So
   15-1252 Software Developers median col: 133080.0
   ```
   These match the report and log.
2. **Arithmetic recomputed by hand:** `0.9·0.35 + 0.7·0.30 = 0.525` (Pinterest); `0.15·0.35 + 0.6·0.30 = 0.2325`
   (Deloitte); `(0.6·0.35 + 0.7·0.30) × 0.5 = 0.21` (Stripe). All match the scorer.
3. **Tests:** `node --test …/triage.test.mjs` → `# tests 13 · # pass 13 · # fail 0` on the fresh clone.
4. **Deliberate breaks:** see Attestation.
5. **No tracked file changed.** `git status` in the fresh clone showed only my new files, plus `package-lock.json`,
   which `npm install` rewrites on any fresh clone (TEST-REPORT §5). `data/examples/role-scores.json` was untouched
   because the scorer always got `--out-dir`.

## Real-postings run (2026-10-17)

The mode's network path, run on a local branch against public job boards. The persona is still the fictional
December graduate. Only the postings are real.

### Inputs

| Input | Path | What it is |
|---|---|---|
| Portal list | `scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/portals-newgrad.yml` | Pinterest, Databricks, Stripe Greenhouse boards. Each has exactly one 80 Days row. (Snowflake and DoorDash have no public Greenhouse board; Lyft, Robinhood, Airbnb, Dropbox and Coinbase had no new-grad titles that day.) |
| Postings | `…/fixtures/postings-live-2026-10-17.json` | 3 real postings (title + URL from the Greenhouse API) + 1 deliberately non-existent job id |
| Persona | `…/fixtures/persona-dec-grad.json` | fictional, unchanged |

### 1. Scan (engine script, dry run), verbatim

```
$ REALLOCATION_ENGINE_PORTALS=scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/portals-newgrad.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 3 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-17
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     3
Total jobs found:      1786
Filtered by title:     1766 removed
Filtered by location:  18 removed
Duplicates:            0 skipped
New offers added:      2

New offers:
  + Pinterest | University Grad Software Engineer 2027 (USA) | San Francisco, CA, US; Remote, US
  + Stripe | University Recruiter (Fixed Term) | San Francisco, New York, Seattle, US-Remote

(dry run — run without --dry-run to save results)

Review new offers in data/ats/pipeline.md.
exit=0
```

`git status` before and after showed only my new portal file, so the dry run wrote nothing. Two things the scan
got wrong: it **dropped** Stripe's US posting `Software Engineer, New Grad` (location `San Francisco, Seattle, New
York`, which has no "US"/"USA" in it) and it **kept** a recruiter job because "University" is in the title. I took
the Stripe postings from the board's API listing instead.

### 2. Liveness (engine script), verbatim

```
$ npm run ats:liveness -- "https://www.pinterestcareers.com/jobs/?gh_jid=7838591" "https://stripe.com/jobs/search?gh_jid=8128744" "https://stripe.com/jobs/search?gh_jid=8212508" "https://job-boards.greenhouse.io/stripe/jobs/1000000001"

Checking 4 URL(s)...

❌ expired    https://www.pinterestcareers.com/jobs/?gh_jid=7838591
           insufficient content — likely nav/footer only
✅ active     https://stripe.com/jobs/search?gh_jid=8128744
✅ active     https://stripe.com/jobs/search?gh_jid=8212508
⚠️ uncertain  https://job-boards.greenhouse.io/stripe/jobs/1000000001
           content present but no visible apply control found

Results: 2 active  1 expired  1 uncertain
exit=1
```

The first attempt failed with `Executable doesn't exist at …/chromium_headless_shell-1234/…`. Playwright's
browser had to be installed once (`npx playwright install chromium`, 94.7 MiB).

Cross-check on the canonical Greenhouse URLs, plus the API's own answer:

```
$ npm run ats:liveness -- "https://job-boards.greenhouse.io/pinterest/jobs/7838591" "https://job-boards.greenhouse.io/stripe/jobs/8128744"
❌ expired    https://job-boards.greenhouse.io/pinterest/jobs/7838591
           insufficient content — likely nav/footer only
✅ active     https://job-boards.greenhouse.io/stripe/jobs/8128744
Results: 1 active  1 expired  0 uncertain

$ curl -s -o /dev/null -w '%{http_code} %{url_effective}' -L <url>
200 https://boards-api.greenhouse.io/v1/boards/pinterest/jobs/7838591
404 https://boards-api.greenhouse.io/v1/boards/stripe/jobs/1000000001
200 https://stripe.com/careers/search                                   # board URL of the fake id
403 https://www.pinterestcareers.com/jobs/?gh_jid=7838591               # board URL of Pinterest
```

So the checker and the board disagree on both edge cases. Pinterest is **listed** (API 200) but its careers site
refuses scripted clients (403), so the checker sees under 300 characters and calls it expired
(`scripts/ats/liveness-core.mjs`, `MIN_CONTENT_CHARS = 300`). The fake id is **gone** (API 404), but it redirects
to Stripe's search page, so the checker says uncertain.

### 3. Triage (mode prototype → engine scorer), verbatim

```
$ node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --postings scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-live-2026-10-17.json --today 2026-10-17 --out-dir scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out-live
✓ triage 2026-10-17: 4 postings → Apply 0 · Consider 2 · Skip 1 · Needs-human 1
  deadline to start work: 2027-04-11 [your-input]
  scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out-live/triage-log.json  +  triage-report.md  (+ scorer's roles.json, role-scores.json, role-scores.md)
exit=0
```

From `out-live/triage-report.md` (verbatim):

| Company | Role | Decision | Why | Next action |
|---|---|---|---|---|
| PINTEREST INC | University Grad Software Engineer 2027 (USA) | **Skip** (0) | sponsorship Proven (entry-explicit); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 0 [record] | Skip |
| STRIPE INC | Software Engineer, New Grad | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [record] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |
| STRIPE INC | Software Engineer, Early Career — Immediate Start | **Consider** (0.42) | sponsorship Likely (unlevelled-swe); timeline 1 — start 2027-01-11 is inside [2027-01-11, 2027-03-28] (**start date ESTIMATED** — estimated: max(today + 45d hiring lag, OPT start); confirm with recruiter); liveness 1 [record] | Network first (3h block): find an engineer or alum there and ask whether they sponsor new-grad SWEs, then decide |

| Company (as typed) | Role | Gate | Reason | What to do |
|---|---|---|---|---|
| STRIPE INC | (break test: non-existent job id) | G2 liveness | liveness-unknown-status | `npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1000000001` |

Scorer arithmetic (`out-live/role-scores.json`):

```
"arithmetic": "(0.9·0.35 + 0.7·0.3) × 0 × 1 = 0.000"      r01 Pinterest
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 1 = 0.420"      r02 Stripe
"arithmetic": "(0.6·0.35 + 0.7·0.3) × 1 × 1 = 0.420"      r03 Stripe
```

2 of 4 (50%) were skipped or sent to a person, which meets the "skip at least half" rule exactly.

### G2 decision for Pinterest, and the re-run

The checker and the board disagree on Pinterest, so I accepted **neither** verdict. I sent it to a person
(Smit gave no preference and delegated the call to Claude, 2026-10-17). I did not edit the original postings
file. A copy, `fixtures/postings-live-2026-10-17-g2.json`, marks r01 `status: "disputed"` and keeps the checker's
verdict as `checker_status: "expired"`. The mode treats any status other than active/expired as unscorable:

```
$ node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --postings scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/postings-live-2026-10-17-g2.json --today 2026-10-17 --out-dir scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/out-live-g2
✓ triage 2026-10-17: 4 postings → Apply 0 · Consider 2 · Skip 0 · Needs-human 2
exit=0
```

| Company (as typed) | Role | Gate | Reason | What to do |
|---|---|---|---|---|
| PINTEREST INC | University Grad Software Engineer 2027 (USA) | G2 liveness | liveness-unknown-status | `npm run ats:liveness -- https://www.pinterestcareers.com/jobs/?gh_jid=7838591` |
| STRIPE INC | (break test: non-existent job id) | G2 liveness | liveness-unknown-status | `npm run ats:liveness -- https://job-boards.greenhouse.io/stripe/jobs/1000000001` |

The suggested fix is wrong for this case: re-running the checker on a bot-blocked site fails the same way. The
real next step is to open the posting in a normal browser.

### Verified vs. inferred — real run

| Value | Where from | Label |
|---|---|---|
| Posting titles, locations, URLs | Greenhouse public API, via the board | record |
| Pinterest r01 "expired", Stripe r02/r03 "active", r04 "uncertain" | `npm run ats:liveness`, 2026-10-17 | record **of what the checker saw**; r01 contradicts the API listing |
| PINTEREST INC 1364 approvals / 16 denials; STRIPE INC 1250 / 22 | 80 Days CSV, re-read by hand with Python `csv` | record |
| Stripe top titles `Software Engineer, Backend Engineer, Risk Strategist, Product Manager, Engineering Manager` → Likely | CSV + keyword rule v0.1 | record + your-input (rule) |
| Start date 2027-01-11 for all three | estimated (no posting states one): max(today + 45 d, OPT start) | your-input (assumption) |
| Deadline 2027-04-11 | fictional persona dates | your-input |
| Fit 0.7 | self-rated | your-input |
| model-judgment | — | **none.** No AI produced a value. Choosing which boards to scan was mine (your-input). |

### Verification

1. CSV rows re-read independently: `PINTEREST INC 1364.0 16.0 [...'Software Engineer I'...]` and
   `STRIPE INC 1250.0 22.0 ['Software Engineer', 'Backend Engineer', ...]`, which match the report.
2. Arithmetic: `0.6·0.35 + 0.7·0.30 = 0.42` ✓; Pinterest `(0.315 + 0.21) × 0 = 0` ✓.
3. Liveness checked two ways (checker vs. API status). They disagree on r01, as recorded above.
4. **Break on real data:** a non-existent Stripe job id was not scored. It went to Needs-a-person.
5. Tests re-run after the changes: see the Attestation.

## Reflection

**What worked**
- The timeline gate caught what the recipe exists for: Databricks and Uber are strong sponsors with plain "Software
  Engineer" titles, and both went to **Skip, network-don't-apply**, because a July or June start is after an April
  deadline. Someone looking only at sponsorship would have spent two tailored applications there.
- Missing and ambiguous companies were stopped, not guessed. Salesforce's duplicate rows and Google/Meta's
  absence show up as a person's job, with the reason spelled out.
- Using the real scorer exposed a real property of it: a missing gate object defaults to open. The prototype
  excludes unchecked postings before scoring, and a test proves it.

- *(real run)* The gate structure held on real data. A posting the checker couldn't classify (`uncertain`) was not
  scored, and every liveness value carried `record` with a date instead of `fixture`.

**What the recipe or prototype got wrong or missed**
- *(real run)* **A gate can be confidently wrong.** The liveness gate zeroed Pinterest, the only Proven-tier posting
  in the run, on a false "expired". A gate is a multiplier, so one bad input wipes out every vote. The mode
  labelled it `record`, which is true (the checker said so) but misleading (the posting is listed). This is the
  error a student is least likely to catch: a Skip looks like the engine saving you time.
- *(real run)* The scan missed a real US new-grad SWE posting on its location filter, and surfaced a recruiter
  job on its title filter. A student who reads only "New offers" would never see Stripe's main new-grad role.
- *(real run)* For a disputed posting, the Needs-a-person row says to re-run the checker, which is useless when the
  site blocks automated browsers. The fix text should depend on why liveness failed.
- *(real run)* No real posting states a start date, so G3 never had real input. Every start collapsed to the
  OPT start, the best case.
- **The title rule misreads titles.** Virtusa's `JAVA ENGINEER 2` and `.NET ENGINEER 2` are software jobs; v0.1
  calls them non-swe. CHANGE-BRIEF §5 predicted this. It didn't change a decision here (Virtusa's posting was
  expired anyway), but it would at another staffing firm.
- **Fit can carry a company with no software evidence.** Deloitte has 8,810 approvals and zero SWE titles in its top
  list, and still came out **Consider (0.2325)**, because fit 0.6 × 0.30 = 0.18 alone nearly reaches the 0.20
  Consider floor (a `[VERIFY]` placeholder in the scorer). The recipe sends the student to network there, which
  is probably wasted time. I didn't change the weights to hide this.
- **"Proven" hangs on one string.** Pinterest is Proven only because the literal `Software Engineer I` appears
  in its top-five list. There's no count behind it. One title is thin evidence for the only Apply in the run.
- **The estimated start date collapsed to the OPT start.** Microsoft's estimate (today + 45 days = 2026-11-14) is
  before OPT start, so it became 2027-01-11 and scored 1.0. That's the *best* case, which is optimistic for a
  posting that says nothing about timing.
- **No real liveness check was run.** Every liveness value in this run is a fixture.

**One concrete next improvement**
*(real run, new top priority)* Before a liveness `expired` can zero a posting, cross-check it against the board's
own API (`/v1/boards/<board>/jobs/<id>`): 200 means listed, 404 means gone. Disagreement goes to Needs-a-person.
This is now a typed `[TODO: DEV]` in the mode.

Require the sponsorship vote to meet a floor before fit counts. If the tier is Unknown with bucket
`no-swe-title`, cap the result at Skip with the next action "network only if you already know someone there".
This belongs in the recipe (a gate before the scorer), not in a changed scorer weight. It would have moved
Deloitte from Consider to Skip on the evidence. Second: add per-title counts from DOL LCA data so "Proven" means
"N entry-level SWE approvals", not "the string appears".

## Attestation
- Recipe: newgrad-swe-bigsponsor v0.1.0
- By: Smit Patel · 2026-10-01 


### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs` — **Smit** | `ℹ tests 13 · ℹ pass 13 · ℹ fail 0`, duration 373 ms | all pass, no network |
| `node …/triage.mjs --today 2026-09-30` — **Smit** | `✓ triage 2026-09-30: 12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4`, deadline 2027-04-11 | same counts as the fresh-clone run |
| **Break:** `node …/triage.mjs --persona …/fixtures/persona-window-closed.json --out-dir /tmp/g0-check` — **Smit** | `✗ G0 window-closed: 0 unemployment days remain; deadline 2026-10-01 …`, `exit=3` (no `--today`, so the deadline is the real date) | halt, exit 3 |
| **Break:** `node …/triage.mjs --csv data/80-days-to-stay/missing.csv` — **Smit** | `✗ sponsorship CSV not found: …/missing.csv`, `exit=2` | exit 2, no default |
| **Break:** `node …/triage.mjs --today 2026-13-40` — **Smit** | `✗ --today must be yyyy-mm-dd (got 2026-13-40)`, `exit=2` | exit 2 |
| Hand check: `grep "^PINTEREST INC," …/mapped_student_employment_targets_v3.csv` — **Smit** | raw row shows `…,1364.0,16.0,98.84057971014492,156853.0,…` | matches report (1364 approvals, 16 denials, $156,853) |
| `node --test …/triage.test.mjs` (fresh clone) | `# tests 13 # pass 13 # fail 0` | all pass, no network |
| `node …/triage.mjs --today 2026-09-30` (fresh clone) | `12 postings → Apply 1 · Consider 4 · Skip 3 · Needs-human 4`, exit 0, 5 files in `out/` | both outputs written, counts sum to 12 |
| Hand check: Pinterest row in raw CSV | 1364 / 16, titles include `Software Engineer I` | matches log |
| Hand check: scorer arithmetic ×3 | 0.525, 0.2325, 0.21 | matches `role-scores.json` |
| **Break:** closed-window persona (`fixtures/persona-window-closed.json`) | `✗ G0 window-closed: 0 unemployment days remain…`, exit 3, `/tmp/g0-check` not created | halt, nothing written |
| **Break:** `--csv data/80-days-to-stay/missing.csv` | `✗ sponsorship CSV not found: …`, exit 2 | clear failure, no default |
| **Break:** `--today 2026-13-40` | `✗ --today must be yyyy-mm-dd (got 2026-13-40)`, exit 2 | reject invalid date |
| **Break (mutation) M1:** expired posting treated as live | first run: only unit test 8 failed; after strengthening, tests 8 and 11 fail | at least one test fails |
| **Break (mutation) M2:** timeline ignores deadline | test 7 fails | fails |
| **Break (mutation) M3:** unchecked liveness sent to scorer | test 11 fails | fails |
| **Break (mutation) M4:** ambiguous name picks first row | test 3 fails | fails |
| `node scripts/pii-scan.mjs --diff main` (scratch commit in fresh clone) | `pii-scan: clean ✓` | clean |
| *(2026-10-17, run by Claude for Smit)* `REALLOCATION_ENGINE_PORTALS=…/portals-newgrad.yml npm run ats:scan -- --dry-run` | 3 boards, 1786 jobs, 2 new offers, exit 0, no files written | real postings found, nothing written |
| *(2026-10-17)* `npm run ats:liveness -- <4 urls>` | 2 active · 1 expired · 1 uncertain, exit 1 | a verdict per URL |
| *(2026-10-17)* cross-check: liveness on canonical URLs + `curl` the Greenhouse API | Pinterest: checker expired, API 200 (listed); fake id: API 404, checker uncertain | checker and API agree. **They don't**: logged as a finding |
| *(2026-10-17)* `node …/triage.mjs --postings …/postings-live-2026-10-17.json --today 2026-10-17 --out-dir …/out-live` | `4 postings → Apply 0 · Consider 2 · Skip 1 · Needs-human 1`, exit 0 | counts sum to 4, every liveness `record` |
| *(2026-10-17)* G2 re-run with r01 `disputed` (`…/postings-live-2026-10-17-g2.json`) | `4 postings → Apply 0 · Consider 2 · Skip 0 · Needs-human 2`, Pinterest not scored | disputed posting goes to a person |
| **Break (real data):** non-existent job id r04 | routed to Needs-a-person, `liveness-unknown-status`, not scored | not scored as live |

### Did not test
- ~~Any real job posting, or a real `npm run ats:liveness` run.~~ Done 2026-10-17 (above). Still not tested: liveness on Lever, Ashby or Workday boards; more than 4 real URLs; a re-check on a later date.
- Whether Pinterest 7838591 really is open. The API lists it, but nobody has opened it in a normal browser yet. That is the human G2 call.
- A real posting with a **stated** start date. None of the real postings had one.
- The owner's real dates (kept private; not run for this submission).
- Whether any named company actually sponsors new-grad SWEs today.
- OPT rules against an authority (Northeastern OGS / USCIS). The 60-day start window and 90-day limit are as understood, not confirmed.
- Behavior on Node 20 (CI's version). Tested only on Node 22.16.0.
- CI on GitHub. Nothing has been pushed.
- Titles with non-ASCII characters, and CSV rows with malformed quoting.

### Broke during testing, fixed
- *(2026-10-17)* `npm run ats:liveness` → `Executable doesn't exist at …/chromium_headless_shell-1234/…`. Fixed by `npx playwright install chromium`. Added to the mode's Source inventory.
- `node --test <directory>` → `Cannot find module` on Node 22. Changed the documented test command to the file path (README, recipe).
- Report showed Microsoft's **estimated** start date like a stated one. `triage.mjs renderReport` now prints "start date ESTIMATED …", and test 11 asserts it.
- Mutant M1 slipped past the end-to-end test. Test 11 now checks that every `expired` input reaches the scorer with liveness multiplier 0.
- G0 first compared `today > deadline`, which can never be true when the clock runs from today. It now checks `remaining ≤ 0`. Claude noticed this while writing the closed-window fixture, before the first test run. No test caught it; the fixture test now guards it.
