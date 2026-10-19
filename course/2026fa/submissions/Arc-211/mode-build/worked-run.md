# Worked run — finance data-engineering triage v0.2.0, 2026-10-19

> Drafted with an AI assistant from this session's real runs. Every block of terminal output is
> pasted from a saved file in `runs/`, not retyped. The person in every run is the **fictional
> persona Ananya Rao** (`search/examples/ananya-rao/profile.yml`). No real student's dates, codes
> or applications appear here. The posting and E-Verify checks were done and confirmed by the
> reviewer, Arc-211, on 2026-10-19. The reflection is Arc-211's wording (grammar edits only),
> pointed at the persona.

## Executive summary

This document records one day of running the updated mode on the repository's real data. The
person is a fictional international Information Systems master's student who wants data or BI
work at banks and fintech companies. The mode checked 30,369 companies.

**Before any person checked postings,** it recommended nothing. It held 12 companies back for a
posting check and 7 for research. Those 7 are large sponsors, including BNY Mellon with 704 visa
approvals, whose records list only software titles.

**After a reviewer checked every posting and every E-Verify record,** it recommends tailoring four
applications, and BNY Mellon is one of them. Two of the older postings had closed.

**A sweep over hiring speed** shows on screen how a slower process costs a lottery try and then
every recommendation. It also exposed a bug: at a 150-day lag the mode still says "tailor" when
the scorer says only "consider".

Five deliberate break attempts behaved as expected, except for one wrong error reason.

## Run record

| | |
|---|---|
| Recipe | `recipes/cases/2026fa/Arc-211-fin-dataeng-stemopt.md` v0.2.0, status **DRAFT** (6 TODOs open) |
| Branch | `mode/Arc-211-fintech-de-bi`, cut fresh from `main` |
| As-of date | 2026-10-19, for every run |
| Data mode | real repo data; Form D is the shipped 50-per-quarter sample only |

> An earlier run on 2026-10-16 used a configuration built from a real student's dates. Its outputs
> are not included, and every run below was recomputed with the fictional persona.

## Inputs

| Input | Value | Label |
|---|---|---|
| Persona | fictional: F-1, M.S. Management Information Systems, CIP 52.1201 (STEM), program ends 2026-12-11, OPT not filed, expected OPT start 2027-01-25 | your-input (fictional) |
| Targets | data engineer, BI analyst; SOC 15-1243.01, 15-1243.00, 15-2051.01, 15-1242.00, plus 15-1252.00 and 15-1211.00 as context | your-input |
| Location / industry / floor | anywhere in the US, remote preferred; banks and fintech; $85,000 | your-input (fictional) |
| Timeline assumptions | hiring lag 60 days (swept 30–180); 90 unemployment days on OPT (150 with STEM); registration windows close about 20 March (assumed) | your-input |
| Data | 80 Days CSV (30,369 rows), BLS compact CSV, Form D samples | record |
| Gate files | `inputs/liveness.json` (5 entries) and `inputs/everify.json` (5 entries), checked 2026-10-19 | record (public pages and lookups) |

## Commands and real output

### A. Before the human gates (`runs/01-before-gates-2026-10-19.txt`)

```
$ node scripts/contrib/2026fa/Arc-211-fin-dataeng-stemopt/triage.mjs --config <copy with empty liveness and E-Verify files> --as-of 2026-10-19 --out-dir course/2026fa/submissions/Arc-211/mode-build/runs/triage-2026-10-19-before-gates
✓ triage 2026-10-19: 20 evaluated → tailor-application 0 · verify-everify-then-tailor 0 · review-role-fit 0 · network-into-company 0 · check-posting-by-hand 12 · research-soc-mismatch 7 · research-sponsorship 0 · not-in-data 1 · skip 0
  timeline factor 1 (offer lands before OPT starts — no unemployment days used)
  lottery: 3 of 3 remaining registration window(s) reachable with an earliest offer on 2026-12-18; STEM OPT ends 2030-01-24
exit 0
```

With no posting checked, nothing reaches the scorer. That is the liveness gate working as a
gate. From the report:

```
| …with H-1B data | 34 | record |
| …sponsored a data/BI-type title | 12 | model-judgment (title rule) |
| …sponsored only software-type titles (kept for research) | 7 | model-judgment (title rule) |
- **BANK OF NEW YORK MELLON CORP** — sponsored titles are software-type only (Senior Specialist, Full-Stack Developer | Specialist, Back-End Developer | Principal, Full-Stack Developer | Senior Specialist, Back-End Developer | Lead Manager, Application Development) — data roles may be filed as 15-1252; find a data-engineering posting before judging, not scored.
```

### B. The human gates (G2 liveness, G4 E-Verify)

The reviewer worked on each company's own careers board in the built-in browser:
- **BNY Mellon:** a BNY careers search.
- **Gemini, SoFi:** the Greenhouse API.
- **Remitly:** its careers site.
- **Green Dot:** its Workday board.
- **Lendbuzz:** its Lever board.

Liveness checker output (`runs/05-liveness-2026-10-19.txt`, npm banner lines trimmed):

```
$ npm run ats:liveness -- "<6 URLs, quoted>"
Checking 6 URL(s)...

✅ active     https://eofe.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/BNY-Careers/job/80189
✅ active     https://boards.greenhouse.io/embed/job_app?for=gemini&token=8076827&gh_jid=8076827
✅ active     https://careers.remitly.com/job/24006259/senior-data-engineer/
✅ active     https://greendotcorp.wd1.myworkdayjobs.com/en-US/gdc/job/Los-Angeles-California/Senior-Data-Analyst_R4136
⚠️ uncertain  https://www.sofi.com/careers/job/?gh_jid=7826869003&gh_src=6f00r5g63us
           content present but no visible apply control found
❌ expired    https://careers.remitly.com/job/23093591/data-analyst/
           HTTP 404

Results: 4 active  1 expired  1 uncertain
exit 1
```

(Exit 1 is the checker's normal signal that at least one URL is not active.)

After the checker ran, the reviewer opened the four active links and saw a working Apply button
on each. SoFi's job id is absent from SoFi's own public Greenhouse board, and SoFi lists no data
or BI role at all, so it was recorded as expired. The checker had only said "uncertain".
Lendbuzz has 58 openings on Lever and none of them is a data role.

| Company | Posting | Notes |
|---|---|---|
| BNY Mellon | Data Management Engineer – Full Stack, Pittsburgh | ETL/ELT, Spark, Airflow, Snowflake, Power BI; **VP title, 2–6 years required**; no visa statement |
| Gemini | Senior Data Engineer | NY / Miami / **Remote (USA)** |
| Remitly | Senior Data Engineer | the older "Data Analyst" posting now returns 404 |
| Green Dot | Senior Data Analyst | same requisition as earlier in October |
| SoFi | — | earlier "Fraud Model Analyst" posting closed; no data role open |

**E-Verify** (official Employer Search, *Date Enrolled* = last 30 years, reviewed on screen):

| Company | Result |
|---|---|
| Gemini | Gemini Space Station LLC: Open, enrolled 2021-05-27 |
| Green Dot | two Green Dot Corporation accounts, both Open (2013, 2024) |
| Remitly | "Remitly" and "Remitly, Inc": Open; one older account terminated 2025-01-21 |
| BNY Mellon, legal-name search "Bank of New York Mellon" | the main 10,000+ account was **terminated on 2026-05-19**; two older ones were terminated in 2020; only a 5–9 employee entity is open |
| BNY Mellon, newer-name search "BNY" | **two "BNY Mellon" accounts are open, both 10,000+** (enrolled 2016-07-29 and 2025-03-03); "BNY Power Operations LLC" is open too |

BNY was recorded as **confirmed, with caveat**. The hiring-site states of the two open accounts
were not readable, so coverage of a Pittsburgh hire is unverified. A legal-name search alone
would have made BNY look not enrolled, which would mean no STEM extension there.

### C. After the gates (`runs/06-after-gates-2026-10-19.txt`)

```
$ node scripts/contrib/2026fa/Arc-211-fin-dataeng-stemopt/triage.mjs --as-of 2026-10-19 --out-dir course/2026fa/submissions/Arc-211/mode-build/runs/triage-2026-10-19-live
✓ triage 2026-10-19: 20 evaluated → tailor-application 4 · verify-everify-then-tailor 0 · review-role-fit 0 · network-into-company 1 · check-posting-by-hand 8 · research-soc-mismatch 6 · research-sponsorship 0 · not-in-data 1 · skip 0
  timeline factor 1 (offer lands before OPT starts — no unemployment days used)
  lottery: 3 of 3 remaining registration window(s) reachable with an earliest offer on 2026-12-18; STEM OPT ends 2030-01-24
exit 0
```

From the report's decisions table and lottery section:

```
| GEMINI SPACE STATION LLC | **tailor-application** | 0.555 Apply | 24 appr, 100.0% → Proven | 0.8 | active [record] | confirmed [record] | $150,000 (meets-floor) | 2021-11-19 |
| GREEN DOT CORP | **tailor-application** | 0.555 Apply | 92 appr, 100.0% → Proven | 0.8 | active [record] | confirmed [record] | $122,033 (meets-floor) | 2024-09-06 |
| REMITLY INC | **tailor-application** | 0.555 Apply | 344 appr, 98.9% → Proven | 0.8 | active [record] | confirmed [record] | $145,274 (meets-floor) | 2017-11-10 |
| SOCIAL FINANCE INC | **network-into-company** | 0.000 Skip | 182 appr, 100.0% → Proven | — | expired [record] | confirmed [record] | $169,488 (meets-floor) | 2020-12-30 |
| BANK OF NEW YORK MELLON CORP | **tailor-application** | 0.555 Apply | 704 appr, 99.2% → Proven | 0.8 | active [record] | confirmed [record] | $145,000 (meets-floor) | — |
| JPMORGAN CHASE & CO | **not-in-data** | — (not-found) | — | — | — | — | — | — |

- STEM OPT ends 2030-01-24 (OPT start + 36 months); earliest offer 2026-12-18
- **3 of 3 remaining registration window(s) reachable with an earliest offer on 2026-12-18**
- To keep every attempt, an employer must be ready to register you by **2027-03-20**
```

**The SOC-mismatch route worked end to end.** BNY Mellon went from `research-soc-mismatch` (run A)
to `tailor-application` (run C) once a live data posting was recorded there. It is now scored on
that posting's title, not on its software-only sponsorship record.

### D. Showing the variation: hiring-lag sweep (`runs/07-hiring-lag-sweep.txt`)

This sweep reruns run C six times, changing only the hiring lag, so the variation can be seen
rather than described. Each row is a separate real run of the script:

```
| Hiring lag (days) | Earliest offer | Timeline factor | Lottery attempts reachable | tailor-application | Distinct composites of the 5 scored roles (SoFi is 0.000: posting closed) |
|---|---|---|---|---|---|
| 30 | 2026-11-18 | 1 | 3 of 3 | 4 | 0.555 Apply, 0.000 Skip |
| 60 | 2026-12-18 | 1 | 3 of 3 | 4 | 0.555 Apply, 0.000 Skip |
| 90 | 2027-01-17 | 1 | 3 of 3 | 4 | 0.555 Apply, 0.000 Skip |
| 120 | 2027-02-16 | 0.756 | 3 of 3 | 4 | 0.420 Apply, 0.000 Skip |
| 150 | 2027-03-18 | 0.422 | 3 of 3 | 4 | 0.234 Consider, 0.000 Skip |
| 180 | 2027-04-17 | 0.089 | 2 of 3 | 0 | 0.049 Skip, 0.000 Skip |
```

How to read it:
- **Up to 90 days, nothing changes.** The offer lands before OPT starts, so no unemployment days
  are used.
- **From 120 days, the score drops.** Each day past the OPT start eats into the 90 allowed days.
- **At 180 days, two things happen.** The first lottery window (2027-03-20) is lost, and every
  role falls below the scorer's Apply line.
- **The 150-day row shows a bug.** The scorer says *Consider* (0.234, below 0.3), but the mode
  still routes those four companies to `tailor-application`. That is a defect in the mode's
  routing, which treats anything other than *Skip* as apply-worthy. A single run would never
  have shown it. It is logged, not fixed.

### E. Tests (`runs/02-tests.txt`, last lines)

```
✔ lottery: an early offer reaches every registration window before STEM OPT ends
✔ lottery: an offer that lands after the first window closes loses that attempt
✔ lottery: after the last window there are zero attempts, and the score is untouched
✔ break: a malformed registration date exits 2
✔ SOC mismatch: a software-only sponsor is kept for research, not dropped and not scored
✔ SOC mismatch: once a live data-engineering posting is recorded, the company is scored on it
ℹ tests 24
ℹ pass 24
ℹ fail 0
```

(Timing suffixes trimmed from the six lines above; the full file has them.)

### F. Cross-checks against the source (`runs/03-cross-checks.txt`)

```
## Cross-check 2: BNY Mellon row and finance census read with Python csv (independent of triage.mjs)
csv rows 30369 | finance rows 2425 | finance with H-1B 34
{'company_name': 'BANK OF NEW YORK MELLON CORP', 'Total Approvals': '704.0', 'Total Denials': '6.0', 'Approval_Rate': '99.15492957746478', 'median_salary_offered': '145000.0', 'top_job_titles_sponsored': "['Senior Specialist, Full-Stack Developer', 'Specialist, Back-End Developer', 'Principal, Full-Stack Developer', 'Senior Specialist, Back-End Developer', 'Lead Manager, Application Development']"}
$ node -e "…BNY Mellon result in the before-gates and after-gates logs"
before-gates | soc-adjacent | research-soc-mismatch | approvals 704 [record]
live | scored | tailor-application | approvals 704 [record]

## Cross-check 3: JPMorgan absent from the CSV under any variant
0
```

### G. Deliberate break attempts (`runs/04-break-attempts.txt`)

```
## Break 1: sponsorship CSV missing
✗ G1 input missing: data/80-days-to-stay/80-days-csv/does-not-exist.csv
exit 2
ls: <scratch>/b1: No such file or directory

## Break 2: malformed lottery date (2027-13-40)
✗ bad date: 2027-13-40
exit 2

## Break 3: OPT still not filed after the filing window closes (as-of 2027-03-01; window closed 2027-02-09)
  timeline factor 0 (OPT not filed and the filing window closed on 2027-02-09)
  lottery: timeline gate closed (…) — no attempt reachable; STEM OPT ends 2030-01-24
exit 0

## Break 4: a slow hiring process (hiring lag 180 days), as-of 2026-10-19
  timeline factor 0.089 (earliest offer uses 82 of 90 unemployment days)
  lottery: 2 of 3 remaining registration window(s) reachable with an earliest offer on 2027-04-17; STEM OPT ends 2030-01-24
exit 0

## Break 5: as-of after STEM OPT ends (2030-06-01)
  timeline factor 0 (OPT not filed and the filing window closed on 2027-02-09)
exit 0
```

(Count lines shortened here; the saved file has every line.)

## Verified vs. inferred

| Claim | Established by | Label |
|---|---|---|
| 30,369 companies; 2,425 finance; 34 with H-1B data | CSV, counted twice (triage.mjs and an independent Python read) | record |
| BNY Mellon: 704 approvals, 6 denials, developer-only titles | CSV row read directly | record |
| JPMorgan Chase is absent from the CSV | grep count 0 over four name variants | record |
| 12 data-title sponsors; 7 software-only | keyword rule on titles | model-judgment |
| Banks often file data engineers as software developers | domain knowledge; not in any repo file | model-judgment (unverified) |
| Four postings live on 2026-10-19 | checker plus the reviewer's own look at each page | record (checker) + reviewer confirmation |
| SoFi posting closed | absent from SoFi's public board API; checker said only "uncertain" | record (board API) |
| E-Verify status for five employers | official Employer Search, transcribed | record (transcribed) |
| BNY's enrolled entity covers a Pittsburgh hire | not checked; hiring-site column unreadable | **unknown** |
| Tiers, p values, floor, hiring lag | settings chosen for the persona | your-input |
| Composite 0.555 and every sweep value | the repo's own `role-scorer.mjs`, unmodified | computed from labeled inputs |
| Registration windows about 20 March; 3 of 3 attempts | placeholder dates, then arithmetic | your-input (**assumption**) → computed |

## Verification

1. **The census was re-counted independently.** The Python `csv` module gives 30,369, 2,425 and 34,
   the same as the log.
2. **One record was traced end to end.** BNY Mellon's CSV row matches the log in both runs, labeled
   `record`.
3. **The scorer's formula was checked against its output.** In the sweep, composite =
   0.555 × timeline factor. For example, 0.555 × 0.756 = 0.420 and 0.555 × 0.422 = 0.234. That is
   the scorer's `× timeline`, observed.
4. **The machine checks pass.** Conformance passes on every changed file, and so do
   `npm run verify` and `npm run doctor`.
5. **Five breaks and one sweep.** All five breaks behaved as expected except for one wrong reason.
   The sweep found one routing defect.

## Attestation

- Recipe: Arc-211-fin-dataeng-stemopt v0.2.0
- By: Arc-211 (reviewer; drafted with an AI assistant) · 2026-10-19

### Tested

| Ran | Saw | Expected |
|---|---|---|
| Run A, before gates | exit 0; 0 scored; 12 check, 7 research, 1 not-in-data | nothing scored without a posting check |
| `ats:liveness` on 6 URLs, then the reviewer opened the 4 active ones | 4 active (Apply button seen); 1 expired (404); 1 uncertain that was actually closed | active postings confirmed by eye |
| E-Verify for 5 employers | 4 open as before; BNY's legal-name account terminated, 2 open under "BNY Mellon" | open status for each |
| Run C, after gates | 4 tailor-application including BNY (0.555); SoFi network (0.000) | BNY leaves research once a posting is recorded |
| Hiring-lag sweep, 30–180 days | factor 1 → 0.089; attempts 3 → 2; tailor 4 → 0 | monotone decline |
| `node --test …/triage.test.mjs` | 24 / 24 pass | all pass |
| Independent Python census + BNY row | 34 sponsors; 704 approvals | equal to the log |
| **Break:** missing CSV | exit 2, no output folder | stop, write nothing |
| **Break:** registration date `2027-13-40` | exit 2, "bad date" | stop |
| **Break:** as-of after the OPT filing window, OPT unfiled | factor 0; lottery 0 | everything gated |
| **Break:** as-of 2030-06-01 | factor 0, but the reason says "OPT not filed" | a reason naming STEM end; **mismatch** |

### Did not test

- Postings at 6 of the 7 software-only sponsors. Only BNY (data posting found) and Lendbuzz (no
  data posting) were looked at.
- E-Verify for those 6, and the hiring-site states of BNY's open accounts.
- The 8 `check-posting-by-hand` companies.
- The real FY2028 registration dates (announced around January 2027) and this year's selection
  rules and fees.
- Whether the title rule wrongly drops a finance sponsor whose titles are neither data nor
  software (e.g. "Quantitative Analyst").
- Seniority and remote / on-site. The mode does not read them at all.
- A fresh-clone run of v0.2.0.

### Broke during testing, fixed

- **The report table broke.** The `|` characters in the industry filter split the row. They are
  now escaped.
- **The report repeated itself.** The lottery line printed twice. It now prints once.

### Broke during testing, not fixed (logged)

- **"Consider" routed as "tailor".** At composite 0.234 the scorer says Consider, but the mode
  says `tailor-application`. Found by the sweep.
- **The visa gate never checks the STEM OPT end.** At as-of 2030-06-01 the factor is right but
  the reason is wrong.
- **The E-Verify caveat is invisible in the decisions table.** BNY shows "confirmed [record]",
  the same as Gemini. The caveat is only in the JSON log.
- **The fit rule ignores seniority.** All four tailor-application postings are Senior or VP.
- **The checker missed SoFi's closure.** It said "uncertain"; the board API settled it.

## G5 release: reviewer's decisions for the persona

| Company | Engine says | Decision (Arc-211, 2026-10-19) | Reason |
|---|---|---|---|
| BNY Mellon | tailor-application | **apply** | "It has everything this persona is looking for: a fintech, data-oriented company where data is valued." |
| Gemini | tailor-application | **network** | Senior posting asking for 2+ years, which a new graduate does not have. Ask the data team whether they hire new graduates first. |
| Green Dot | tailor-application | **network** | same seniority reason |
| Remitly | tailor-application | **network** | same seniority reason |
| SoFi | network-into-company | **skip** | no data posting open |

Three of the engine's four "apply" recommendations were overridden for seniority. The fourth,
BNY, is also VP-level with 2–6 years. Applying there anyway is the reviewer's judgment about fit,
not evidence the engine checked.

## Reflection (Arc-211)

> Arc-211's own words, given 2026-10-19 and edited for grammar only. Where the original referred
> to the writer, it now refers to the persona. Notes marked *AI* are the assistant's.

1. **What went well?** "I did not know that BNY was such a big corporation, that it had such a
   diverse profile, or that it was so deep into data analytics."
2. **What did the mode get wrong or miss?** "Most of the jobs were senior, and most asked for two
   or more years of experience, which a new graduate like this persona does not have."
   - *AI note:* this matches the run. All four tailor-application postings are Senior or VP, and
     the fit rule scores them 0.8 on title keywords alone. It drove three of the four G5
     overrides; the fourth, SoFi, was skipped because nothing is open.
3. **Should software-only sponsors be researched rather than skipped?** "Apply to BNY, because
   it has everything the persona is looking for: a fintech, data-oriented company where data is
   valued."
   - *AI note:* the reason draws on BNY's own product marketing, which is evidence of what BNY
     sells, not of whom it hires or sponsors. The 704 approvals are a record. The fit is a
     judgment. The live posting (G2) and E-Verify (G4) were checked before the decision.
4. **Next steps.**
   - "Add a seniority check that flags Senior or VP postings for a new graduate."
   - "The persona should file the OPT application now; the window is open."
   - "Add a remote / on-site field to the posting check."
   - *AI note:* the first and third are now `[TODO: DEV]` items 5 and 6 in the recipe. The posting title and its
     years-of-experience line are already visible to the person doing the liveness check.
