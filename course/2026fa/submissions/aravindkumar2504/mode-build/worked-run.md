# Worked run: pre-OPT backend sponsor tiers, sample and live (2026-10-20)

## Executive summary

This is the record of one full run of the mode, from a public company table to real job postings that a person read and decided on. It is for a reader who wants to see what actually ran, what it printed, and which claims rest on data versus on someone's judgment.

The run started from the records: 59 companies were worth a closer look for a candidate who will need a visa sponsor. The live step then went to their job boards. It found a job board for only 26 of the 59, under the names it tried, read 3,193 jobs there, and kept 39 postings that fit the mode's rules, at 9 companies. It chose 8 postings and checked each page: 7 were open. The eighth, at Xage Security, returned "not found" although the company's job board still listed it. The author read all 8 postings: 7 cleared both human checks, and Xage was set aside. Nothing checked whether an employer will wait for this candidate, who cannot start until 2027-06-01; the report now warns about it.

Two things went wrong along the way, and both are recorded here.
- A bookkeeping bug hid one company from the report. It was found and fixed.
- The cap of 8 postings chose among companies with equal scores by alphabetical order. That left out Zscaler (802 approvals) and kept Xage (24 approvals). This is reported as an open proposal; it is not fixed.

The liveness verdicts were checked twice, eight hours apart. The author's own checks, all listed in the attestation, include a deliberate attempt to break the mode.

## 1. Inputs

- **Candidate:** the fictional persona `search/examples/kiran-rao/profile.yml`:
  - an F-1 student who needs H-1B sponsorship;
  - target occupation SOC 15-1252, the backend and platform role family;
  - invented dates;
  - the unemployment clock not started, so the timeline factor is 1.
  No real person's data was used.
- **The candidate's own company list:** `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt`, 11 names, with one typo and one invented company on purpose.
- **Run date:** 2026-10-20 (`--as-of`). Times below are UTC; Pacific time is 7 hours earlier.
- **Repository data:**
  - the company table `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (30,369 rows; newest funding date 2025-09-26);
  - the BLS extract `data/bls/compact/soc_occupation_compact.csv`;
  - the four Form D samples in `data/sec/form-d/processed/sample/`.
  Hashes are in the run-log entry `logs/runs/2026fa-aravindkumar2504-2.md`.
- **Parameters:** `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/params.json` and `scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/live-params.json`, each value labelled with who decided it. The author's decisions are in `course/2026fa/submissions/aravindkumar2504/mode-build/author-decisions.md`.
- **Live sources, read on 2026-10-20:**
  - the public job boards of the shortlisted companies, through the repository's Greenhouse, Lever and Ashby providers;
  - the public posting APIs of Greenhouse and Lever;
  - the posting pages themselves.
- **Not used:** nothing was read from or written to `private/` or `data/ats/`. The scanner wrote its `data/ats/` files inside an empty temporary folder, and only its scan history was copied into the run folder.

## 2. Commands and their real output

Every command below is pasted as it was run, with two edits:
- the leading `cd` into the repository is left out (all commands run from the repository root);
- this machine's temporary folder is written as `<scratch>`.

The output is pasted unedited, except where a note says lines were left out. Every command block is followed by the output it printed.

### 2.1 The base run (00:47)

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers && RUN=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20 && node $D/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist $D/sample-inputs/watchlist.txt --out-dir $RUN 2>&1 | tail -8; echo "exit=${PIPESTATUS[0]}"; ls $RUN
```

```text
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.8 months old (accepted)
  wrote course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit=
report.md
role-scores.json
role-scores.md
roles.json
run-log.json
scorer-profile.json
```

(`exit=` is empty because `PIPESTATUS` does not exist in zsh, the shell the command ran in. The re-run in section 2.7 prints the exit code: 0.)

### 2.2 L0 to L2: job boards, the scan, the posting choice (00:48)

L0 asks the repository's providers for a board under up to four name guesses per shortlisted company. L1 runs the repository's scanner, unmodified, from an empty folder. L2 applies the posting rules and the author's cap.

```bash
REPO=$PWD && D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers && RUN=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20 && L=$RUN/live && SCR=<scratch>/scan-2026-10-20 && echo "== L0 boards"; node $D/find-boards.mjs --scores $RUN/role-scores.json --out-dir $L 2>&1 | tail -1; echo "== L1 scan (repo scanner, unmodified, isolated cwd)"; rm -rf $SCR && mkdir -p $SCR && (cd $SCR && REALLOCATION_ENGINE_PORTALS=$REPO/$L/live-portals.yml node $REPO/scripts/ats/scan.mjs > scan.stdout.txt 2>&1; echo "scan exit=$?"); cp $SCR/data/ats/scan-history.tsv $L/scan-history.tsv && sed -n '1,30p' $SCR/scan.stdout.txt | grep -v "^  +" > $L/scan.stdout.txt; grep -c "^  +" $SCR/scan.stdout.txt | xargs echo "offer lines:"; cat $L/scan.stdout.txt | sed -n '3,12p'; echo "== L2 pick"; node $D/select-postings.mjs --history $L/scan-history.tsv --boards $L/boards.json --out-dir $L 2>&1 | tail -1; python3.12 -c "
import json; d=json.load(open('$L/selected-postings.json'))
print('scanned', d['postings_scanned'], '| eligible', d['postings_eligible'])
for p in d['chosen']: print(f\"  {p['company'][:26]:26} | {p['title'][:50]:50} | {p['location'][:36]}\")"
```

```text
== L0 boards
26 of 59 shortlisted companies have a board on Greenhouse, Lever or Ashby (proposals; a person confirms each at gate H1).
== L1 scan (repo scanner, unmodified, isolated cwd)
scan exit=0
offer lines: 893
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-20
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     26
Total jobs found:      3193
Filtered by title:     2100 removed
Filtered by location:  0 removed
Duplicates:            200 skipped
New offers added:      893

== L2 pick
chosen for gate H1: 8 postings
scanned 893 | eligible 39
  COHERE HEALTH INC          | Software Engineer II                               | United States
  DATABRICKS INC             | Software Engineer, Web Products                    | Mountain View, California
  FIGMA INC                  | Data Platform Engineer                             | San Francisco, CA • New York, NY • U
  MERCURY TECHNOLOGIES INC   | Software Engineer - Infrastructure                 | San Francisco, CA, New York, NY, Por
  SIGMA COMPUTING INC        | Software Engineer - Compiler                       | New York City, NY
  STRIPE INC                 | Backend Engineer, Core Technology                  | US-Remote, Chicago, Seattle, San Fra
  VERKADA INC                | Backend Engineer - Connectivity                    | San Mateo, CA United States
  XAGE SECURITY INC          | Software Engineer - Full Stack                     | Palo Alto, CA
```

The scanner's summary block is in `course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live/scan.stdout.txt`. The 893 posting lines it also printed were left out; they are in `scan-history.tsv`. The scanner prints a date, but no time zone, beside "Portal Scan".

### 2.3 L3 and L4: the liveness check (gate H1, machine half) and the posting screen (00:48 to 00:49)

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers && L=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live && echo "== L3 liveness (repo checker)"; node $D/h1-liveness.mjs --urls $L/h1-urls.txt --out-dir $L 2>&1 | tail -10; echo "== L4 machine assist: H2 sentence screen"; node $D/h2-screen.mjs --selected $L/selected-postings.json --boards $L/boards.json --out-dir $L 2>&1 | tail -11
```

```text
== L3 liveness (repo checker)
active    https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
active    https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002
active    https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004
active    https://job-boards.greenhouse.io/mercury/jobs/6150432004
active    https://job-boards.greenhouse.io/sigmacomputing/jobs/7767918003
active    https://stripe.com/jobs/search?gh_jid=6042172
active    https://job-boards.greenhouse.io/verkada/jobs/5194598007
expired   https://jobs.lever.co/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3  (HTTP 404)

H1 machine half: 7 active, 1 expired, 0 uncertain (checker exit 1). A person confirms each before H1 clears.
== L4 machine assist: H2 sentence screen
 1 quoted  COHERE HEALTH INC | Software Engineer II
 1 quoted  DATABRICKS INC | Software Engineer, Web Products
 0 quoted  FIGMA INC | Data Platform Engineer
 0 quoted  MERCURY TECHNOLOGIES INC | Software Engineer - Infrastructure
 0 quoted  SIGMA COMPUTING INC | Software Engineer - Compiler 
 0 quoted  STRIPE INC | Backend Engineer, Core Technology
 1 quoted  VERKADA INC | Backend Engineer - Connectivity
 0 quoted  XAGE SECURITY INC | Software Engineer - Full Stack

The screen decides nothing: a person reads each posting and decides gate H2.
```

The liveness checker's own output, word for word, as `h1-liveness.mjs` saved it (`live/h1-liveness.first-check.stdout.txt`):

```text
Checking 8 URL(s)...

✅ active     https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002
✅ active     https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004
✅ active     https://job-boards.greenhouse.io/mercury/jobs/6150432004
✅ active     https://job-boards.greenhouse.io/sigmacomputing/jobs/7767918003
✅ active     https://stripe.com/jobs/search?gh_jid=6042172
✅ active     https://job-boards.greenhouse.io/verkada/jobs/5194598007
❌ expired    https://jobs.lever.co/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3
           HTTP 404

Results: 7 active  1 expired  0 uncertain
```

The three sentences the screen quoted (from `live/h2-screen.json`; the posting text itself is not stored, only its SHA-256):

- **Cohere Health Inc** (degree level): "Bachelor's degree in computer science, software engineering, or equivalent practical experience"
- **Databricks Inc** (clearance or export control): "If access to export-controlled technology or source code is required for performance of job duties, ... and Employer may decline to proceed with an applicant on this basis alone."
- **Verkada Inc** (sponsorship): "We do sponsor and take over sponsorship of employment visas for this role."

### 2.4 The liveness re-check, right before the author read the postings (08:53)

The first check was eight hours old by the time the author was ready to read the postings, so the check was run again first. The first record was kept under a new name.

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers && L=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live && mv $L/h1-liveness.json $L/h1-liveness.first-check.json && mv $L/h1-liveness.stdout.txt $L/h1-liveness.first-check.stdout.txt && node $D/h1-liveness.mjs --urls $L/h1-urls.txt --out-dir $L 2>&1 | tail -10
```

```text
active    https://job-boards.greenhouse.io/coherehealth/jobs/7930480003
active    https://databricks.com/company/careers/open-positions/job?gh_jid=8560779002
active    https://boards.greenhouse.io/figma/jobs/6201407004?gh_jid=6201407004
active    https://job-boards.greenhouse.io/mercury/jobs/6150432004
active    https://job-boards.greenhouse.io/sigmacomputing/jobs/7767918003
active    https://stripe.com/jobs/search?gh_jid=6042172
active    https://job-boards.greenhouse.io/verkada/jobs/5194598007
expired   https://jobs.lever.co/xage-security/d3ab3653-c6e4-4b7e-8fee-8df09d755eb3  (HTTP 404)

H1 machine half: 7 active, 1 expired, 0 uncertain (checker exit 1). A person confirms each before H1 clears.
```

### 2.5 The author's review: gate H1 (person half) and gate H2 (08:58 to 09:03)

The assistant opened the 8 chosen postings in tabs of the browser built into Claude Code, at about 08:54, a minute after the re-check. A first question that asked about four postings at once was not answered. The author then answered one question per posting, between 08:58:41 and 09:03:22. That was about nine minutes from the tabs opening, against the "about 20 to 30 minutes of reading" in the option the author picked when choosing 8 postings.

The assistant wrote the questions and the options; the picks are the author's.
- **What the questions covered:** whether the page was a real, open job at the company, and whether anything said no sponsorship or needed a U.S. citizen, a green card or a clearance.
- **What they did not cover:** start dates.
- **H2's scope:** it was decided on the 7 postings that were live.

The answers are stored word for word in `live/gate-decisions.json` (decided_at 2026-10-20T09:03:39Z). Every question, with its options, is in `course/2026fa/submissions/aravindkumar2504/mode-build/author-picks.json`:

| Asked (UTC) | The question, as the assistant wrote it | The answer picked, and that option's wording | Recorded as |
|---|---|---|---|
| 08:57:04 | First tab: Cohere Health, Software Engineer II. After looking at the page, which fits? | **Looks fine**: It's a real, open job at Cohere Health, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 08:58:50 | Second tab: Databricks, Software Engineer, Web Products. After looking at the page and that export sentence, which fits? | **Looks fine**: A real, open job at Databricks, and nothing says no sponsorship or citizens only. The export sentence is only a condition. | H1 confirmed-live, H2 no-blocker |
| 08:59:20 | Third tab: Figma, Data Platform Engineer. The screen found no visa sentences, but that isn't a pass. After looking at the page, which fits? | **Looks fine**: A real, open job at Figma, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 09:00:38 | Fourth tab: Mercury, Software Engineer, Infrastructure. The screen found no visa sentences. After looking at the page, which fits? | **Looks fine**: A real, open job at Mercury, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 09:01:02 | Fifth tab: Sigma Computing, Software Engineer, Compiler. The screen found no visa sentences. After looking at the page, which fits? | **Looks fine**: A real, open job at Sigma Computing, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 09:01:33 | Sixth tab: Stripe, Backend Engineer, Core Technology. The link went to a search page, and it should have redirected to the job itself. After looking at the page, which fits? | **Looks fine**: The job itself shows at Stripe, it's open, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 09:01:48 | Seventh tab: Verkada, Backend Engineer, Connectivity. The screen quoted: "We do sponsor and take over sponsorship of employment visas for this role." After looking at the page, which fits? | **Looks fine**: A real, open job at Verkada, and nothing says no sponsorship or citizens only. | H1 confirmed-live, H2 no-blocker |
| 09:03:13 | Last tab: Xage Security, Software Engineer, Full Stack. The checker said this page returns 404 (gone), though Xage's job feed still lists it. What do you see? | **Page broken or gone**: It shows a "Not found" or 404 page, so the job isn't open. | H1 not-live |

### 2.6 A bookkeeping fix, then the posting choice and the live report re-run (09:10)

While checking the first live report, the assistant found that the posting choice had recorded Zscaler as "chosen" although the cap of 8 had cut it. So the report placed Zscaler in no group at all. After the fix (section 6, "Broke during testing, fixed"), the posting choice was run again on the same scan history. The old files were kept in `<scratch>` first.

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers; R=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20; L=$R/live; A=<scratch>/archive-2026-10-20; mkdir -p $A && cp -p $L/selected-postings.json $A/selected-postings.before-cap-fix.json && cp -p $L/h1-urls.txt $A/h1-urls.before-cap-fix.txt && node $D/select-postings.mjs --history $L/scan-history.tsv --boards $L/boards.json --out-dir $L | tail -3 && cmp $L/h1-urls.txt $A/h1-urls.before-cap-fix.txt && echo "h1-urls unchanged" && node $D/live-report.mjs --run $R --live $L && sed -n '7p;11,16p;22,36p' $L/report-live.md && grep -n "A fitting posting" $L/report-live.md | cut -c1-400
```

```text
  0 eligible of    1  WISETACK INC

chosen for gate H1: 8 postings
h1-urls unchanged
live report: 8 postings; checker active 7; cleared 7, held 0, set aside 1
```

(Only the first 5 lines of the output are shown: the end of the per-company list, the chosen count, the byte comparison and the report's own line. The report text that followed is in `live/report-live.md`.)

The list of 8 chosen postings did not change, and `h1-urls.txt` was byte-identical, so the liveness checks and the author's decisions still apply to exactly these postings.

### 2.7 The version stamp, then the base run re-run (20:26)

The program still stamped its runs "0.1.0", so the version was moved to 0.2.0 and the base run made again with the same command. The old outputs were kept in `<scratch>` first.

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers; R=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20; A=<scratch>/archive-2026-10-20/base-v0.1.0; mkdir -p $A && for f in report.md run-log.json roles.json scorer-profile.json role-scores.json role-scores.md; do cp -p $R/$f $A/$f; done && grep -n "RECIPE_VERSION = " $D/preopt-sponsor-tiers.mjs && sed -i '' "s/^const RECIPE_VERSION = '0.1.0';/const RECIPE_VERSION = '0.2.0';/" $D/preopt-sponsor-tiers.mjs && grep -n "RECIPE_VERSION = " $D/preopt-sponsor-tiers.mjs && date -u && node $D/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --accept-stale-vintage --watchlist $D/sample-inputs/watchlist.txt --out-dir $R; echo "exit $?"; for f in roles.json scorer-profile.json role-scores.json role-scores.md; do cmp -s $A/$f $R/$f && echo "$f identical" || echo "$f CHANGED"; done; diff $A/run-log.json $R/run-log.json; diff $A/report.md $R/report.md
```

```text
43:const RECIPE_VERSION = '0.1.0';
43:const RECIPE_VERSION = '0.2.0';
Tue Oct 20 20:26:48 UTC 2026
preopt-sponsor-tiers: 76 evaluated (11 watchlist, 65 pool) -> 59 worth a closer look, 12 set aside, 2 held, 3 unresolved
  timeline factor 1 (open); data vintage 2025-09-26, 12.8 months old (accepted)
  wrote course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/ : report.md, run-log.json, roles.json, scorer-profile.json, role-scores.json, role-scores.md
exit 0
roles.json identical
scorer-profile.json identical
role-scores.json identical
role-scores.md identical
3c3
<   "recipe_version": "0.1.0",
---
>   "recipe_version": "0.2.0",
64c64
<           "sha256": "51f468ba8bf2a9b99a058cb1236a5cbcc4ed9459c2bdcb63b7944aab9a65b83e"
---
>           "sha256": "8f7db6f8c7454b09c463587151c7d81f665995ef8a3d9159c9fd5fdad5b68f53"
95c95
<       "combined_sha256": "02c9b49cd368cf4435f57574692f2d241daa4f12a7a94e7382def565db43ee97"
---
>       "combined_sha256": "bcbe0a2197c0ae6066b16fcb978a3fd458a5711967b424d2516cea586dc0fce0"
126c126
< - **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.1.0. **Run date (your-input):** 2026-10-20. **Values a model produced about a company while this program ran:** 0.
---
> - **Recipe:** aravindkumar2504-preopt-swe-sponsor-tiers v0.2.0. **Run date (your-input):** 2026-10-20. **Values a model produced about a company while this program ran:** 0.
128c128
< - **Code that produced this run:** prototype files combined sha256 `02c9b49cd368` (per-file hashes in the run log); scorer `scripts/score/role-scorer.mjs` sha256 `8655e182c3c2`.
---
> - **Code that produced this run:** prototype files combined sha256 `bcbe0a2197c0` (per-file hashes in the run log); scorer `scripts/score/role-scorer.mjs` sha256 `8655e182c3c2`.
```

Only the version and the code hash changed. The scorer's four files came out byte-identical, so the shortlist the live step started from is the same.

### 2.8 The live report (20:27)

```bash
D=scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers; R=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20; node $D/live-report.mjs --run $R --live $R/live && grep -n "Base run:\|Inputs (SHA" $R/live/report-live.md && python3.12 -c "
import json;d=json.load(open('$R/run-log.json'));print([f['path'].split('/')[-1] for f in d['code']['files']] if 'code' in d else list(d.keys()))" ; node --test $D/*.test.mjs 2>&1 | grep -E "^not ok|^ℹ (tests|pass|fail|skipped)"
```

```text
live report: 8 postings; checker active 7; cleared 7, held 0, set aside 1
```

(Only the report's own line is shown. The same command also ran the tests; section 4.5 shows a later run of them.)

The report was made again at 05:30 UTC on 2026-10-21, after wording fixes from a review (section 6):
- the board count is now worded "found under the names tried";
- the G0 line names the flag, not a person;
- "read this first" gained a start-date warning.

No count changed. The executive summary, "read this first" list and funnel below are from that version of `live/report-live.md`:

```markdown
## Executive summary

This report takes the companies the sponsor-tier shortlist marked as worth a closer look and asks two questions a list of companies cannot answer: is there a real, open backend job at the company today, and does the posting itself shut the candidate out (no sponsorship, U.S. citizens only, a clearance)? A program checks whether each posting is still open and quotes the sentences that matter; a person reads every posting and makes both calls.

Read it before applying: a company with a strong sponsorship record can still have no open role, or a posting that excludes the candidate. Of 59 shortlisted companies, a job board was found for only 26, on the three job-board systems this check reads, under the names it tried. 8 postings were chosen from those, one per company; the program found 7 still open, and the person cleared 7, held 0 and set aside 1. So 7 of the 59 shortlisted companies end the run with a posting that cleared both gates. Of the other 52: 33 with no board found under the names tried, 17 with a board but no posting that fits the rules, 1 with a fitting posting that the cap of 8 left out and 1 whose chosen posting was set aside.

## Read this first

- **The company data is old.** Its newest funding date is 2025-09-26, 12.8 months before the run (the mode's limit is 6). The run went ahead with this warning (gate G0) because the acceptance flag was given; the base run's log records the flag, not who gave it. The postings themselves were read live from today's job boards.
- **Start dates were not checked.** The candidate's earliest start is 2027-06-01, about 7 months after the run (from the base run's timeline gate), and no gate checks whether an employer will wait that long. Ask before applying.
- **Most of the shortlist is out of reach.** 33 of 59 shortlisted companies have no board on Greenhouse, Lever or Ashby under a name the board finder tried, so this check says nothing about them.
- **The cap chose among equal scores by name.** ZSCALER INC (802 approvals) had a fitting posting and the same score as a chosen company, and was left out by alphabetical order, not by evidence, so check it by hand.
- **The quoted sentences decide nothing.** A posting with no quoted sentence is not a pass; the person read each one.

## From the shortlist to a decision

| Step | Count |
|---|---|
| Companies the base run marked worth a closer look | 59 |
| ...with a job board the scanner can read (a proposal; the person confirms the company) | 26 |
| Postings the scanner kept from those boards (broad title filter) | 893 |
| ...that pass the mode's rules (backend family, U.S. location, no senior marker in the title, not contract or PhD-only) | 39 |
| ...from this many companies | 9 |
| Chosen for the gates (one per company, at most 8) | 8 |
| Still open, per the liveness checker | 7 |
| Confirmed live by the person | 7 |
| Cleared (both gates) / held / set aside | 7 / 0 / 1 |
| **Shortlisted companies that end the run with a cleared posting** | **7 of 59** |
```

### 2.9 The author's own checks (20:34 on 2026-10-20 to 06:13 UTC on 2026-10-21)

The author ran these commands at the prompt in Claude Code (with `!`), and the output below is the author's terminal output.

A real posting:

```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/5194598007"
```

```text
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/verkada/jobs/5194598007

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/verkada/jobs/5194598007

Results: 1 active  0 expired  0 uncertain
```

A deliberate break attempt, a made-up job number on the same board:

```bash
npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/1"
```

```text
> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/verkada/jobs/1

Checking 1 URL(s)...

❌ expired    https://job-boards.greenhouse.io/verkada/jobs/1
           redirect to https://job-boards.greenhouse.io/verkada?error=true

Results: 0 active  1 expired  0 uncertain
```

A deliberate break attempt on the mode's own code (06:12 UTC on 2026-10-21): the sample run without the flag that accepts year-old data. Gate G0 should refuse, with exit code 3, and nothing should be written:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs --as-of 2026-10-20 --watchlist scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/sample-inputs/watchlist.txt --out-dir /tmp/tiers-break; echo "exit code: $?"; ls /tmp/tiers-break
```

```text
StaleVintageError: refusing to run: the newest funding date in the data is 2025-09-26, 12.8 months before the run date 2026-10-20 (limit 6). Recent raises and filings may be missing. Re-run with --accept-stale-vintage to proceed knowingly; the report will state the age.
exit code: 3
ls: /tmp/tiers-break: No such file or directory
```

A count cross-checked against the company table (06:12 UTC on 2026-10-21):

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs source "STRIPE INC"
```

```text
--- STRIPE INC: company table, row 25633 (the contact and officer columns are not printed)
    industry=Other | total_funding=9596970797.0 | latest funding 2024-04-08 Series D+ 694159778.0
    Total Approvals=1250.0 Total Denials=22.0 Approval_Rate=98.27044025157232 | median_salary_offered=158371.0
    top_job_titles_sponsored=['Software Engineer', 'Backend Engineer', 'Risk Strategist', 'Product Manager', 'Engineering Manager']
    committed run log: bucket=advance tier=Proven approvals/denials=1250/22 rate=98.27 wage ratio=1.19 scorer=0.315 Apply [(0.9·0.35) × 1 × 1 = 0.315]
    redone: 100 * 1250 / (1250 + 22) = 98.27% -> run log says 98.27% (match)
    redone: 158371 / 133080 (the BLS national median for SOC 15-1252) = 1.19x -> run log says 1.19x (match)
```

The offline tests, run three times. The run shown is the third, at 06:13 UTC on 2026-10-21, after the review fixes (section 6). The first two, at 21:04 and 21:09 on 2026-10-20, gave the same counts:

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

```text
ℹ tests 123
ℹ suites 0
ℹ pass 123
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4594.52375
```

(The 123 lines that name each passing test are left out; shown: the summary the suite prints at the end.)

## 3. Verified and inferred

Each line says what established the statement and what kind of claim it is:
- **Record:** a data file, a job board's answer, or arithmetic on those.
- **Rule:** a rule with the stated author or proposer.
- **Decision:** a person's decision.
- **Model framing:** words written by the AI assistant.
- **Not established.**

| Statement | Established by | Kind |
|---|---|---|
| 1,557 of the 30,369 companies (5.1 percent) have any sponsorship record | a count of the company table | record |
| Stripe: 1,250 approvals, 22 denials, 98.27 percent approved | the table's cells, the rate recomputed (section 4.3) | record |
| 59 companies are worth a closer look (Apply 51, Consider 8) | the tier rule on the record, then the repository's scorer | your-input (derived), as the run log labels it: the scorer's verdict on record-derived tiers and parameter values (tier thresholds: the author's picks; scorer values 0.9, 0.6, 0.3: proposals) |
| Every Apply role scored exactly 0.315 | the scorer's output | your-input (derived), as the run log labels it. It follows from the scorer's weights and the fixed tier value, not from any difference between companies |
| 26 of the 59 have a board on Greenhouse, Lever or Ashby | the providers' answers | record (that a board answered with jobs) |
| Each of those boards belongs to that company | the board finder's name rule | rule (a model-judgment label). The author confirmed the company only for the 7 chosen postings whose pages were live |
| 3,193 jobs on those boards, 893 kept by the scanner | the scanner's own counts | record |
| 39 postings fit, at 9 companies | the backend title rule, the U.S.-location rule, the senior-title rule (all proposals) and the author's exclusions | rule applied to record. "No senior marker" is not "entry level": "Software Engineer II" passes |
| These 8 postings were chosen | one per company and 8 in all (the author's), best score first with ties by name (a proposal) | rule. With all 9 companies tied at 0.315, the name decided which one was left out |
| Zscaler (802 approvals) was left out by name, not by evidence | the tie at 0.315 and the tie-break | record + rule |
| 7 pages were active and Xage's returned HTTP 404, at 00:49 and again at 08:53 | the repository's liveness checker | record |
| Verkada says it sponsors employment visas for the role; Databricks has an export-control clause; Cohere Health asks for a bachelor's degree | the posting APIs' text, quoted word for word | record (the categories are patterns proposed by the assistant) |
| 7 postings are open at the right company, with nothing that says no sponsorship or needs a U.S. citizen, a green card or a clearance; Xage's page is gone | the author, reading each posting against the questions as asked | decision (start dates were not asked) |
| A conditional export-control clause is not a stop | the author, 2026-10-20 | decision |
| The answer options' wording, including "the export sentence is only a condition" under "Looks fine" for Databricks | the assistant wrote the options | model framing. The pick was the author's |
| 7 cleared, 1 set aside | the live report's rules on the checker's verdicts and the author's decisions | rule on record + decision |
| Every shortlisted company is accounted for: 8 + 33 + 17 + 1 = 59 | the live report's own check, which refuses to write otherwise; recounted from the JSON in section 4.2 | record |
| Xage's offered wage is 0.75 of the national median | the table's wage cell over the BLS median | record (arithmetic) |
| The 33 unreached companies have no job board anywhere | only the names tried, on three systems | not established |
| A cleared company will sponsor this candidate | the record is company-wide history | not established |
| The 7 cleared postings are still open | each page was seen at one moment; only Verkada was checked again later (by the author, 20:34) | not established after the check |
| The candidate can start when these employers need someone | the candidate's earliest start is 2027-06-01; no posting stated a start date (the screen found no start-date sentence), and the questions did not ask | not established |

## 4. Verification

The commands in this section are shown without the redirection that saved their output to a file in `<scratch>`. The output pasted is that file, unedited except where a note says lines were left out.

### 4.1 The liveness check, run twice

The checker ran at 00:49 and again at 08:53, eight hours apart, on the same 8 URLs. Both times it gave the same 8 verdicts (sections 2.3 and 2.4). The author's own check at 20:34 found Verkada still active.

### 4.2 The JSON, parsed and recounted

The outcomes, the checker's verdicts and the groups were recounted straight from the agent logs, not from the report:

```bash
S=<scratch>; L=course/2026fa/submissions/aravindkumar2504/runs/2026-10-20/live; node -e "
const fs = require('fs');
const L = '$L';
const log = JSON.parse(fs.readFileSync(L + '/run-log-live.json', 'utf8'));
const dec = JSON.parse(fs.readFileSync(L + '/gate-decisions.json', 'utf8'));
const h1 = JSON.parse(fs.readFileSync(L + '/h1-liveness.json', 'utf8'));
const by = (k) => log.postings.reduce((m, p) => (m[p[k]] = (m[p[k]] || 0) + 1, m), {});
console.log('outcomes recounted from the postings:', JSON.stringify(by('status')));
console.log('checker verdicts recounted:', JSON.stringify(h1.verdicts.reduce((m, v) => (m[v.recorded_as] = (m[v.recorded_as] || 0) + 1, m), {})));
console.log('decisions on file:', dec.decisions.length, 'by', dec.decided_by, 'at', dec.decided_at);
const u = log.unreachable;
const groups = { cleared_or_decided: log.postings.length, no_board: u.no_board.length, no_fitting_posting: u.no_eligible_posting.length, past_cap: u.past_total_cap.length };
console.log('groups:', JSON.stringify(groups), 'sum', Object.values(groups).reduce((a, b) => a + b, 0), 'shortlisted', log.funnel.shortlisted);
" 2>&1 | tee $S/json-recount.txt
```

```text
outcomes recounted from the postings: {"cleared":7,"set aside":1}
checker verdicts recounted: {"active":7,"expired":1}
decisions on file: 8 by Aravind Sundaravadivelu at 2026-10-20T09:03:39Z
groups: {"cleared_or_decided":8,"no_board":33,"no_fitting_posting":17,"past_cap":1} sum 59 shortlisted 59
```

### 4.3 Counts cross-checked against the company table

For the two companies at the edge of the cap (Zscaler, cut; Xage, kept) and for Stripe, the check below prints the raw table cells beside the committed run log's values, and redoes the arithmetic:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs source "STRIPE INC" "ZSCALER INC" "XAGE SECURITY INC"
```

```text
--- STRIPE INC: company table, row 25633 (the contact and officer columns are not printed)
    industry=Other | total_funding=9596970797.0 | latest funding 2024-04-08 Series D+ 694159778.0
    Total Approvals=1250.0 Total Denials=22.0 Approval_Rate=98.27044025157232 | median_salary_offered=158371.0
    top_job_titles_sponsored=['Software Engineer', 'Backend Engineer', 'Risk Strategist', 'Product Manager', 'Engineering Manager']
    committed run log: bucket=advance tier=Proven approvals/denials=1250/22 rate=98.27 wage ratio=1.19 scorer=0.315 Apply [(0.9·0.35) × 1 × 1 = 0.315]
    redone: 100 * 1250 / (1250 + 22) = 98.27% -> run log says 98.27% (match)
    redone: 158371 / 133080 (the BLS national median for SOC 15-1252) = 1.19x -> run log says 1.19x (match)
--- ZSCALER INC: company table, row 30328 (the contact and officer columns are not printed)
    industry=Other Technology | total_funding=22695169.0 | latest funding 2024-04-12 Series B 22695169.0
    Total Approvals=802.0 Total Denials=12.0 Approval_Rate=98.52579852579852 | median_salary_offered=141378.0
    top_job_titles_sponsored=['Software Engineer', 'Senior Product Manager', 'Senior Software Engineer', 'Senior Software Engineer ', 'Staff Software Engineer, QA']
    committed run log: bucket=advance tier=Proven approvals/denials=802/12 rate=98.53 wage ratio=1.06 scorer=0.315 Apply [(0.9·0.35) × 1 × 1 = 0.315]
    redone: 100 * 802 / (802 + 12) = 98.53% -> run log says 98.53% (match)
    redone: 141378 / 133080 (the BLS national median for SOC 15-1252) = 1.06x -> run log says 1.06x (match)
--- XAGE SECURITY INC: company table, row 29857 (the contact and officer columns are not printed)
    industry=Other | total_funding=95825460.0 | latest funding 2023-11-01 Series B 25000000.0
    Total Approvals=24.0 Total Denials=2.0 Approval_Rate=92.3076923076923 | median_salary_offered=100000.0
    top_job_titles_sponsored=['Software Engineer']
    committed run log: bucket=advance tier=Proven approvals/denials=24/2 rate=92.31 wage ratio=0.75 scorer=0.315 Apply [(0.9·0.35) × 1 × 1 = 0.315]
    redone: 100 * 24 / (24 + 2) = 92.31% -> run log says 92.31% (match)
    redone: 100000 / 133080 (the BLS national median for SOC 15-1252) = 0.75x -> run log says 0.75x (match)
```

### 4.4 Deliberate attempts to break it

- **The author's attempt** (section 2.9): a made-up job number on Verkada's board came back expired, not active.
- **The assistant's rehearsal** (00:41, before the run), with made-up job numbers on three boards:

```bash
npm run --silent ats:liveness -- "https://stripe.com/jobs/search?gh_jid=1" "https://job-boards.greenhouse.io/verkada/jobs/1" "https://databricks.com/company/careers/open-positions/job?gh_jid=1" 2>&1 | grep -v "npm notice"; echo "exit=${PIPESTATUS[0]}"
```

```text
Checking 3 URL(s)...

⚠️ uncertain  https://stripe.com/jobs/search?gh_jid=1
           content present but no visible apply control found
❌ expired    https://job-boards.greenhouse.io/verkada/jobs/1
           redirect to https://job-boards.greenhouse.io/verkada?error=true
⚠️ uncertain  https://databricks.com/company/careers/open-positions/job?gh_jid=1
           content present but no visible apply control found

Results: 0 active  1 expired  2 uncertain
exit=
```

None of the three came back active. Two came back "uncertain", not "expired": those sites show a page with content but no apply button. The mode records such a URL as uncertain and never clears it. The `exit=` line is empty because `PIPESTATUS` does not exist in zsh, the shell the command ran in.

- **The break harness.** It breaks the code one way at a time, in a private copy, and checks that a test fails. It covers 66 breaks from version 0.1.0 and 15 new ones for the live step:

```bash
node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs
```

```text
the suite passes on the unbroken copy; trying 81 breaks

B01 Proven needs only 2 approvals                                                        caught by 4 test(s): a full fixture run puts every company in the right bucket an
B02 the timeline gate ignores an authorization that has already ended                    caught by 2 test(s): the timeline gate multiplies through the real scorer: a part
B03 the unemployment clock starts today even before authorization starts                 caught by 3 test(s): a full fixture run puts every company in the right bucket an
B04 the timeline forgets the unemployment days already used                              caught by 3 test(s): an older persona runs when the missing values are supplied o
B05 unknown companies are sent to the scorer                                             caught by 9 test(s): a full fixture run puts every company in the right bucket an
B06 the scorer profile uses the wording the scorer misreads                              caught by 24 test(s): a full fixture run puts every company in the right bucket an
B07 the scorer-integrity check is not called                                             caught by 1 test(s): named failure case F6 end to end: a scorer that mis-reads th
B08 the legal suffix "inc" is no longer stripped from names                              caught by 7 test(s): a full fixture run puts every company in the right bucket an
B09 the data vintage uses the OLDEST funding date                                        caught by 27 test(s): a full fixture run puts every company in the right bucket an
B10 Likely accepts EITHER the count or the rate                                          caught by 3 test(s): a full fixture run puts every company in the right bucket an
B11 the discovery pool ignores the funding window                                        caught by 3 test(s): a full fixture run puts every company in the right bucket an
B12 the report loses its executive summary heading                                       caught by 1 test(s): the report opens with the executive summary and the outputs 
B13 the liveness placeholder is labelled a record                                        caught by 25 test(s): a full fixture run puts every company in the right bucket an
B14 the needs_sponsorship type check is removed                                          caught by 3 test(s): an older persona with no explicit needs_sponsorship is refus
B15 a small sample can be Proven on its rate alone                                       caught by 4 test(s): a full fixture run puts every company in the right bucket an
B16 an ambiguous watchlist name resolves to the first match                              caught by 1 test(s): a full fixture run puts every company in the right bucket an
B17 the privacy guard for real data is switched off                                      caught by 9 test(s): a persona outside search/examples/ may not write into a trac
B18 the title sampler counts unreadable lists as readable                                caught by 1 test(s): draw splits the fixture titles by the rule and is repeatable
B19 the run log records this machine's absolute wage-file path again                     caught by 2 test(s): a run on the repository's own data records only repository-r
B20 a hex escape in a title list is no longer decoded                                    caught by 1 test(s): parseTitles decodes the escapes Python writes, and refuses a
B21 a sample run may write anywhere inside the repository                                caught by 3 test(s): sample inputs may write inside this recipe's own runs folder
B22 any watchlist is treated as a committed sample                                       caught by 2 test(s): a watchlist that is not one of the committed samples is trea
B23 a missing Form D folder that was asked for is ignored                                caught by 2 test(s): an explicitly given Form D folder that is missing or empty i
B24 malformed persona YAML is no longer an input error                                   caught by 2 test(s): malformed persona YAML exits 2 with a message, not a stack t
B25 the two Form D "newer" classes are swapped                                           caught by 3 test(s): a full fixture run puts every company in the right bucket an
B26 a row with no usable name is dropped from the funnel without being counted           caught by 1 test(s): a row listing 0 approvals and 0 denials is held as unknown, 
B27 a skipped Proven or Likely company is explained as a Thin one                        caught by 1 test(s): the timeline gate multiplies through the real scorer: a part
B28 the stale-data refusal is switched off                                               caught by 1 test(s): named failure case F5: old data is refused without the ackno
B29 a rate exactly on the Proven bar is not Proven                                       caught by 1 test(s): tierFor: a count or rate exactly on a bar is on the higher s
B30 a rate exactly on the Likely bar is not Likely                                       caught by 1 test(s): tierFor: a count or rate exactly on a bar is on the higher s
B31 a count exactly on the Proven bar is not Proven                                      caught by 4 test(s): a full fixture run puts every company in the right bucket an
B32 the integrity check looks at the liveness gate only, not the timeline gate           caught by 1 test(s): the guard notices a timeline gate labelled as a record, not 
B33 the integrity check no longer notices the same role returned twice                   caught by 1 test(s): the guard notices the same role returned twice
B34 real data may no longer be written to private/                                       caught by 6 test(s): without --out-dir the output goes to private/tiers-run/<run 
B35 a closed timeline gate is explained as a small multiplier                            caught by 2 test(s): the timeline gate multiplies through the real scorer: a part
B36 name suffixes are stripped once, not repeatedly                                      caught by 1 test(s): normalizeName strips suffixes repeatedly, exactly as the Pyt
B37 paths are compared by their spelling, not by where they really are                   caught by 3 test(s): a real persona cannot write into a folder inside the reposit
B38 a folder whose name starts with two dots is taken to be outside the repository       caught by 3 test(s): a real persona cannot write into a folder inside the reposit
B39 a persona that does not need sponsorship is accepted                                 caught by 1 test(s): a persona that does not need sponsorship is refused: the rec
B40 a company table that is not the repository's is treated as a committed sample        caught by 2 test(s): a company table that is not the repository's own is treated 
B41 a negative record is described as a low rate                                         caught by 1 test(s): tierFor: a negative record is described as one, not as a low
B42 0 approvals and 0 denials becomes a Thin tier                                        caught by 2 test(s): a row listing 0 approvals and 0 denials is held as unknown, 
B43 a run that scored nothing leaves an earlier run's scorer files in place              caught by 1 test(s): a run that scored nothing removes the scorer files an earlie
B44 a stand-in scorer is reported as the repository's own                                caught by 1 test(s): a run made with a stand-in scorer says so in the run log, ga
B45 a timeline factor the scorer treats as closed does not close gate G3                 caught by 1 test(s): a timeline factor at or below the scorer's own closed-gate l
B46 a Form D record filed after the table's newest date is judged by its first-sale date caught by 3 test(s): a full fixture run puts every company in the right bucket an
B47 the title-list reader accepts separators Python never writes                         caught by 1 test(s): parseTitles accepts only the shape Python writes: items sepa
B48 "Member of Technical Staff" is counted as a senior title again                       caught by 1 test(s): levelNote tells a new graduate whether any matched title lac
B49 a company with several Form D records keeps only the last one's class                caught by 1 test(s): a full fixture run puts every company in the right bucket an
B50 the sponsorship term sent to the scorer is labelled a record again                   caught by 2 test(s): every field of every row has a declared label, every label s
B51 a watchlist with no names is accepted                                                caught by 1 test(s): a watchlist with no names is refused, and a name that is emp
B52 a role family name can be any property every object has                              caught by 1 test(s): usage errors: --help exits 0; an unknown flag, a bad number,
B53 an output folder that is a file is not noticed                                       caught by 1 test(s): an output folder that is a file, or cannot be written, is an
B54 the recorded command carries this machine's absolute paths                           caught by 1 test(s): outputs never carry this machine's folders, even when the in
B55 paths outside the repository are written in full into outputs                        caught by 2 test(s): outputs never carry this machine's folders, even when the in
B56 a label stops starting with one of the four kinds                                    caught by 1 test(s): every field of every row has a declared label, every label s
B57 a run without --out-dir writes into the tracked sample-run folder                    caught by 1 test(s): without --out-dir the output goes to private/tiers-run/<run 
B58 a Form D "folder" that is a file is not noticed                                      caught by 2 test(s): a Form D folder that is really a file is an input error nami
B59 a recent company already on the candidate's own list is dropped from the funnel without being counted caught by 9 test(s): a full fixture run puts every company in the right bucket an
B60 a skip rate of 50% or more is described as low                                       caught by 2 test(s): the timeline gate multiplies through the real scorer: a part
B61 a run that scored nothing still states a skip rate                                   caught by 1 test(s): a run that scored nothing removes the scorer files an earlie
B62 the report says nothing about rows left out because a cell could not be read         caught by 1 test(s): rows left out because a cell cannot be read are named in the
B63 the report names rows with an unreadable title list but never rows with an unreadable funding date caught by 1 test(s): rows left out because a cell cannot be read are named in the
B64 the report calls every funnel count a plain record count                             caught by 1 test(s): a full fixture run puts every company in the right bucket an
B65 the title-sample command accepts a seed that is not a number                         caught by 1 test(s): a seed or count that is not a whole number, or a missing tab
B66 the title-sample command does nothing when it is reached through a symbolic link     caught by 1 test(s): the command still runs when it is reached through a symbolic
B67 a URL the checker printed no verdict for is recorded as active                       caught by 2 test(s): gate H1 parsing: verdicts and reasons kept; a missing or dup
B68 a URL with two verdicts keeps the first one                                          caught by 1 test(s): gate H1 parsing: verdicts and reasons kept; a missing or dup
B69 an expired verdict loses its reason line                                             caught by 1 test(s): gate H1 parsing: verdicts and reasons kept; a missing or dup
B70 a person saying "live" clears a posting the checker did not find active              caught by 1 test(s): a person saying "live" where the checker did not is a held d
B71 an "unclear" reading of a posting clears it                                          caught by 1 test(s): no decision keeps a posting held; only checker-active plus a
B72 a posting no person has decided counts as cleared                                    caught by 2 test(s): no decision keeps a posting held; only checker-active plus a
B73 a decisions file may name a posting that was not chosen                              caught by 2 test(s): the decisions file must name the person, the time, chosen po
B74 the check that every shortlisted company is accounted for is removed                 caught by 1 test(s): a funnel that does not account for every shortlisted company
B75 the live report loses its executive summary heading                                  caught by 1 test(s): end to end: the report opens with the executive summary and 
B76 a company the total cap cut is recorded as chosen again                              caught by 1 test(s): choice: the author's live exclusions, entry level, U.S. only
B77 the author's rule dropping contract and PhD-only titles is ignored                   caught by 1 test(s): choice: the author's live exclusions, entry level, U.S. only
B78 a posting outside the U.S. is kept                                                   caught by 1 test(s): choice: the author's live exclusions, entry level, U.S. only
B79 the H2 screen builds a Lever API address from a page on another host                 caught by 1 test(s): H2 screen finds the posting text API from each board URL sha
B80 the H2 screen stops quoting sponsorship sentences                                    caught by 1 test(s): H2 screen: escaped posting HTML becomes sentences, and each 
B81 the board finder tries its weakest name guess first                                  caught by 1 test(s): board names: legal words dropped, strongest guess first, fir

81 of 81 deliberate breaks were caught by the tests
```

### 4.5 The tests and the repository's own checks

Two notes first.
- **The history scan is in the pull request.** The personal-data scan of the branch history against upstream `main` (handoff condition 10) can only run once the work is committed, so its output is pasted in the pull request.
- **The doctor does not count this recipe.** The doctor counts only top-level recipes, so its recipe and TODO counts below do not include this one. This recipe's TODO count is checked by its own test, "the recipe declares as many open TODOs as its body contains", which passes.

```bash
node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs
```

```text
ℹ tests 123
ℹ suites 0
ℹ pass 123
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4637.742166
```

(As above, only the suite's closing summary is shown.)

```bash
PATH="$PWD/.venv/bin:$PATH" npm run verify
```

```text

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 196 files (88 md · 36 py · 60 js · 8 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
```

```bash
npm run doctor
```

```text
  ✓ scripts/resumes

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
```

(Only the doctor's last 14 lines are shown.)

```bash
node scripts/pii-scan.mjs
```

```text
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted email>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
```

(The address the scan prints is shown here as `<redacted email>`, as in version 0.1.0's test report, so that this page does not trip the same scan. It is an npm package author's address inside `package-lock.json`.)

The repository's `npm run verify` covers `recipes/` and `scripts/` but not `course/` or `logs/`, so the conformance check was also run on this work's own folders:

```bash
PATH="$PWD/.venv/bin:$PATH" node scripts/conformance.mjs scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/ recipes/cases/2026fa/ course/2026fa/submissions/aravindkumar2504/ logs/runs/2026fa-aravindkumar2504-2.md
```

```text
conformance: 73 files (21 md · 30 js · 21 json · 1 yaml)
✓ all conform (machine half of P4). Adequacy is still the human gate.
```

Do the three verify warnings and the one personal-data finding pre-date this work? To find out, the same checks were run on a fresh clone of upstream `main`, the commit this work started from:

```text
$ git log -1 --format='%H %cd'
015843d5047dbadff05068495e4c5db5cd9945f4 Wed Sep 23 16:03:09 2026 -0400
$ npm run verify

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <redacted email>
```

(Again with the address shown as `<redacted email>`.) They are the same: the warnings and the finding (an npm package author's address inside `package-lock.json`) are in the base repository.

## 5. Reflection

Each point below is one of my picks; the options and my picks are in `author-picks.json`.

**What went well.**
- The liveness check caught the Xage posting as gone (404), even though its job board still listed it.
- The screen pulled out sentences I could skim past, like the Databricks export-control line and Verkada's "we do sponsor".
- My own break attempt (a made-up job number) came back expired, not active.

**What surprised me.**
- Xage's job board still listed the posting, but the page itself was gone (404).
- Nothing checked whether an employer would wait until the candidate can start, about seven months after the postings.
- Every Proven company got exactly the same score (0.315), so the cap of 8 picked by alphabet.

**What the mode got wrong or missed.**
- 33 of the 59 shortlisted companies could not be checked live, because no job board was found for them.
- The cap of 8 chose among equal scores by alphabet: Zscaler (802 approvals) was left out while Xage (24) was kept.
- The company data is about 13 months old, so the sponsorship counts may be out of date.
- It does not check whether the candidate fits each job; every Proven company ends up with the same score.

**Next steps.**
- Break ties by number of approvals, then approval rate, before the cap of 8 is applied.
- Reach more companies: support more job-board systems, or keep a checked list of each company's board.
- Add a labelled fit score, so companies stop tying at the same score.
- Find a fresher, documented source for the sponsorship counts.

## 6. Attestation

- Recipe: aravindkumar2504-preopt-swe-sponsor-tiers v0.2.0
- By: Aravind Sundaravadivelu · 2026-10-20. This covers the rows under "Tested by the author". The assistant's checks are listed after them, separately, and are not the author's attestation.

### Tested by the author

| Ran | Saw | Expected |
|---|---|---|
| Read each of the 8 chosen postings in browser tabs the assistant opened (gate H1; gate H2 on the 7 that were live), answering between 08:58 and 09:03 | 7 were real, open jobs at the company, with nothing saying no sponsorship or needing a U.S. citizen, a green card or a clearance ("Looks fine"); Xage Security showed a not-found page ("Page broken or gone") | the checker's verdicts: 7 active, Xage expired (HTTP 404) |
| `npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/5194598007"` (20:34) | active; "Results: 1 active  0 expired  0 uncertain" | active, as at both of the run's checks |
| A deliberate break attempt: `npm run ats:liveness -- "https://job-boards.greenhouse.io/verkada/jobs/1"`, a made-up job number on the same board (20:35) | expired, "redirect to https://job-boards.greenhouse.io/verkada?error=true" | anything but active |
| A deliberate break attempt on the mode's own code: the sample run without `--accept-stale-vintage` (06:12 UTC on 2026-10-21) | "StaleVintageError: refusing to run", "exit code: 3", and `/tmp/tiers-break` not created | refusal with exit 3 and nothing written (gate G0) |
| `node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs source "STRIPE INC"` (06:12 UTC on 2026-10-21) | the raw row: 1,250 approvals, 22 denials; the rate redone as 98.27 percent and the wage ratio as 1.19, both "match" | the committed run log's values |
| `node --test scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/*.test.mjs` (06:13 UTC on 2026-10-21, after the review fixes; earlier runs at 21:04 and 21:09 on 2026-10-20 gave the same result) | tests 123, pass 123, fail 0 | every test passes |

### Checked by the assistant (not part of the author's attestation)

| Ran | Saw | Expected |
|---|---|---|
| the liveness checker on the 8 chosen URLs, at 00:49 and 08:53 | the same 8 verdicts both times: 7 active, 1 expired | the same verdicts, or a reason to look |
| made-up job numbers on Stripe, Verkada and Databricks (00:41) | uncertain, expired, uncertain; none active | none active |
| the outcomes and groups recounted from the JSON logs | 7 cleared and 1 set aside; 7 active and 1 expired; 8 + 33 + 17 + 1 = 59 | equal to the report |
| `checks.mjs source` on Stripe, Zscaler and Xage | the raw cells match the run log; rates and wage ratios recomputed: match | match |
| the base run again after the version stamp (20:26) | the scorer's four files byte-identical; the report and the log differ only in the version and the code hash | only the version lines change |
| the posting choice again after the fix (09:10) | the same 8 postings; `h1-urls.txt` byte-identical | no change to what the author reviewed |
| the test suite | tests 123, pass 123, fail 0 | all pass |
| `break-it.mjs` | 81 of 81 deliberate breaks were caught by the tests | every break caught |
| `npm run verify`, `npm run doctor`, `node scripts/pii-scan.mjs` | pass with 3 warnings; clean; 1 finding (the `package-lock.json` address) | the same as upstream `main`, which shows the same 3 warnings and the same finding |
| an independent read-only review of the documents against the run files, by a separate assistant task | 22 findings: overclaims (H2 counted on 8 postings instead of 7, "the ideas are the author's"), labels that disagreed between files, counts off by one, and the missing start-date check | none; each was fixed or recorded (section 6) |

### Did not test

- Whether any cleared company will sponsor this candidate: no application was sent and no recruiter was asked.
- That the 7 cleared postings stay open: only Verkada was checked again after the review.
- The posting screen on Ashby postings: the screen has no text source for Ashby, and none of the chosen postings was on Ashby.
- The board-to-company match for 19 boards: the 17 with no fitting posting, Zscaler, and Xage, whose page was gone. Only the 7 live postings were confirmed by a person.
- Start dates: whether any employer will wait until 2027-06-01. The questions did not ask, and no posting stated a date.
- Whether a title without a senior marker, such as "Software Engineer II", is open to a new graduate.
- The 33 companies with no board found: none was looked up by hand.
- The proposed tie-break (proposed addition 10): it is not built, so it was not run.
- A second scan on another day: job boards change, so the scan cannot be repeated byte for byte. Only the liveness check was repeated.
- The U.S.-location rule on real postings: it was tested on fixed examples, not checked by hand on the 893 postings it judged.
- The title rule beyond the 80-title sample of version 0.1.0.
- A real candidate's persona: only the fictional one was used.
- Any operating system other than macOS, or any Node version other than 26, for this version.

### Broke during testing, fixed

- **A company the cap cut was recorded as chosen.** In `select-postings.mjs`, Zscaler's own record said "chosen" although the cap of 8 had cut it. The first live report therefore placed Zscaler in no group, and its summary said the rest were "set aside or out of reach", which was not true: 17 companies had a board but no fitting posting.
  - **The fix:** the cap bookkeeping in `select-postings.mjs`. In `live-report.mjs`: a third group for postings the cap left out; a summary sentence built from the counts; and a check that stops the report unless every shortlisted company lands in exactly one group.
  - **Coverage:** a test for each, and breaks B74 and B76 in the harness.
  - **Effect:** the re-run chose the same 8 postings (section 2.6).
- **The tie behind the cut.** All 9 companies with a fitting posting scored 0.315, so the cap chose by name. This is not fixed, because re-picking would void the author's review. The report now says so in its "read this first" list, and proposed addition 10 records the fix.
- **A hard-coded count.** The live report's summary said "Eight" in words; it now uses the count.
- **The scanner's dry run prints no posting URLs, so it could not feed the posting choice.** The unmodified scanner now runs from an empty folder, and its scan history is copied into the run folder.
- **The path-leak test crashed** on the new `live/` subfolder (EISDIR). It now walks the folder tree and reads files only.
- **A syntax error in `report.mjs`.** An apostrophe inside a single-quoted string came in while relabelling who decided each parameter. The string was rephrased.
- **The provenance test failed after the parameter labels changed.** This was by design: it checks that the committed run was made by the current code. A new committed run (2026-10-20) replaced the pointer to the 2026-09-30 run, which is kept as history.
- **The first posting review asked four questions at once, and the author replied that it was confusing.** It was redone one tab and one question at a time.
- **The written H2 rule disagreed with the author's Databricks decision.** Version 0.1.0 stopped a posting on any export-control wording. This is logged in the recipe and the run-log entry. The author then decided the rule: a conditional clause is not a stop.
- **The first rehearsal picked a contractor DevOps role and a PhD-only role.** The author decided to drop both kinds automatically (2026-10-19).
- **The program's version stamp still said 0.1.0.** It was moved to 0.2.0, and the base run was made again (section 2.7).
- **The documents claimed more than the record showed.** An independent review (section 6, the assistant's checks) found these problems:
  - H2 was described as decided on all 8 postings; it was decided on the 7 live ones.
  - The AI-use line said the ideas were the author's; the assistant proposed them, and the author chose.
  - The board-to-company confirmation was counted as 8; it was 7.
  - Labels disagreed between the report and the logs.
  - The live report credited G0 to "the author" for any run with the flag.
  - Nothing said that start dates were never checked.

  The documents and the live report's wording were corrected (section 2.8), and proposal 13 records the start-date gap.
- **The break harness refused to start.** Its private copy of the repository leaves out the data/ats folder on purpose, because real data may sit there. Two new lines in the recipe and the contrib README named that folder as a path, so the path test failed in the copy (the author's first test run, in the real checkout, passed). The two mentions are now plain words. The author's second test run, the assistant's last run and the harness all pass on the result.
