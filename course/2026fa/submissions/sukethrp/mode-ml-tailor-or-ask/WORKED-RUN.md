# Worked run — ml-tailor-or-ask

## Executive summary

This is the record of running the mode for real. The final version is 0.2.1, and every command in its section was
run by the student in their own terminal; the output is pasted as it appeared, with only the shell prompt shown as `$`.
- **Discovery:** for the fictional applicant Kavya Raman, the mode read seven companies' public job boards and kept 21
  machine-learning postings out of 2,512 listed. It reported plainly that Google, Amazon, Apple, Netflix and Meta have
  neither a board it can read nor an H-1B record in the engine's file; they stay on the list for a manual check.
- **The judge step, round 2:** with the student's own fit calls on three postings, three real postings reach "ask
  first", each with a specific question:
  - Stripe's Machine Learning Engineer, Radar;
  - Reddit's Machine Learning Engineer, Answers Relevance, with the student's own question;
  - Pinterest's Master's University Grad MLE, where the student recorded a hold.
  The other 18 wait only for a fit call. Nothing reaches "tailor": the student's 22-week hiring assumption puts the
  timeline factor at 0.65, which keeps every score below the "apply" line.
- **Break attempts:** the engine's own scorer said "apply" for a posting nobody checked, while the guard refused it.
  The student's own break, an out-of-range fit, stopped exactly as they predicted.
- **How it got here:** five versions in one day. Each was found wanting by reading its own output, and each fix is
  logged (runs 3–8).

What was verified, what was inferred, how the output was checked, the earlier versions and what the mode cannot do
are all below. The student signed the attestation for v0.2.1 on 2026-10-20 and wrote the reflection; both are below,
word for word.

## Versions and runs

| Version | Commit | Run log | What the student ran | Why the next version |
|---|---|---|---|---|
| 0.1.0 | `4a3c74b` | 3, 4 | sample; live (Goodfire, Orenda; Priya Nair); the first break pair | a review found a name match labelled `record` and a persona who is not the mode's user |
| 0.1.1 | `3a6ccf5` | 5 | the same, with Kavya Raman; the student's own break | four report problems found in its output |
| 0.1.2 | `5a0634c` | 6 | the same | the student asked for a mode that finds postings itself |
| 0.2.0 | `cd0d40a` | 7 | discovery (12 targets, 7 boards, 21 postings); judge round 1 | 8 postings had no requirements read but showed "0 months short"; a Pinterest review |
| **0.2.1** | `4f17ec2` | **8** | judge round 2, with the student's fit calls, compared with round 1 | — |

## Inputs (v0.2.1)

| Input | Path | Who produced it |
|---|---|---|
| Target list | `runs/discover-v0.2.0/targets.json` | the student chose the 12 companies; Claude Code listed their legal names (model-judgment). The student declared 22 weeks to start and confirmed seven company identities, in their own words |
| Applicant | `search/examples/kavya-raman/` | a fictional persona written by Claude Code for this mode: 24 months of full-time ML work, a 6-month co-op, a 5-month research assistantship. It is no one's real history |
| Rules | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` v0.3.1 | patterns drafted by Claude Code; every rule call and the adoption are the student's (the words are in the file) |
| Round-2 queue | `runs/discover-v0.2.0/round-2/queue.json` | the round-1 queue written by `discover.py`, plus the student's fits, question and hold, word for word |
| Sponsorship file | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | the engine's file, pinned at sha256 `eccdee2a…6270` |

Nothing from the student's own résumé, dates or applications is used.

## Commands run, and their real output (v0.2.1, the student's terminal, files written 2026-10-19 23:59 EDT)

The full session is `runs/v0.2.1-terminal-output.txt`.

### 1. The commit and the tests

```text
$ git rev-parse --short HEAD
4f17ec2
$ python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests
....................................................................................................................................................................
----------------------------------------------------------------------
Ran 164 tests in 14.854s

OK
```

### 2. The sample run (illustrative postings, Priya Nair)

```text
$ TAILOR_OR_ASK_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.2.1
✓ 10 postings → TAILOR 1, ASK FIRST 4, MOVE ON 2, HOLD 3 · scored 4
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.2.1/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample-v0.2.1/run-log.json
```

### 3. Discovery (v0.2.0, 18:25 EDT; `discover.py` and its rules are unchanged in v0.2.1)

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py --targets course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/targets.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-1
✓ 12 companies · 7 boards read · 21 postings queued
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-1/target-audit.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-1/queue.json
```

From `runs/discover-v0.2.0/round-1/target-audit.md`, verbatim. Long cells are cut with "…".

| Company | Job board | Postings listed | Checked (newest matches, up to the cap) | Identity | Sponsorship file |
|---|---|---|---|---|---|
| Google | none the engine can read | — | — | not decided | GOOGLE LLC: no row in the file; ALPHABET INC: row 1356 ALPHABET INC (MOUNTAIN VIEW, CA): no H-1B fields |
| Amazon | none the engine can read | — | — | not decided | AMAZON.COM SERVICES LLC: no row in the file; AMAZON WEB SERVICES INC: no row in the file |
| Apple | none the engine can read | — | — | not decided | APPLE INC: no row in the file |
| Netflix | none the engine can read | — | — | not decided | NETFLIX INC: no row in the file |
| Meta | none the engine can read | — | — | not decided | META PLATFORMS INC: no row in the file; FACEBOOK INC: row 9382 FACEBOOK INC (MENLO PARK, CA): no H-1B fields |
| Databricks | greenhouse/databricks | 901 | 2 | confirmed by sukethrp on 2026-10-19 (row 7248) | DATABRICKS INC: row 7248 DATABRICKS INC (SAN FRANCISCO, CA): 1640 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Stripe | greenhouse/stripe | 727 | 5 | confirmed by sukethrp on 2026-10-19 (row 25632) | STRIPE INC: row 25632 STRIPE INC (South San Francisco, CA): 1250 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Airbnb | greenhouse/airbnb | 177 | 0 | confirmed by sukethrp on 2026-10-19 (row 1013) | AIRBNB INC: row 1013 AIRBNB INC (SAN FRANCISCO, CA): 1000 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Pinterest | greenhouse/pinterest | 154 | 5 | confirmed by sukethrp on 2026-10-19 (row 20330) | PINTEREST INC: row 20330 PINTEREST INC (SAN FRANCISCO, CA): 1364 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Figma | greenhouse/figma | 140 | 4 | confirmed by sukethrp on 2026-10-19 (row 9653) | FIGMA INC: row 9653 FIGMA INC (SAN FRANCISCO, CA): 188 approvals, company-wide · tier Likely · ML/AI titles counted: none |
| Reddit | greenhouse/reddit | 151 | 2 | confirmed by sukethrp on 2026-10-19 (row 21989) | REDDIT INC: row 21989 REDDIT INC (SAN FRANCISCO, CA): 408 approvals, company-wide · tier Proven · ML/AI titles counted: Software Engineer, Machine Learning |
| Roblox | greenhouse/roblox | 262 | 3 | confirmed by sukethrp on 2026-10-19 (row 22736) | ROBLOX CORP: row 22736 ROBLOX CORP (San Mateo, CA): 856 approvals, company-wide · tier Likely · ML/AI titles counted: none |

| Company | Listed | Internship | Senior title | Not a kept family | Outside the US | Matching, not checked (over the cap) | Checked |
|---|---|---|---|---|---|---|---|
| Databricks | 901 | 1 | 25 | 867 | 6 | 0 | 2 |
| Stripe | 727 | 0 | 5 | 706 | 9 | 2 | 5 |
| Airbnb | 177 | 0 | 13 | 163 | 1 | 0 | 0 |
| Pinterest | 154 | 0 | 12 | 133 | 1 | 3 | 5 |
| Figma | 140 | 1 | 0 | 133 | 2 | 0 | 4 |
| Reddit | 151 | 0 | 20 | 128 | 1 | 0 | 2 |
| Roblox | 262 | 1 | 13 | 245 | 0 | 0 | 3 |

The raw listings are kept outside the repo; `discovery-log.json` records each one's SHA-256. The kept postings are a
sample: the newest matches up to five per company, not each company's best matches.

### 4. The judge step, round 2, compared with round 1

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/queue.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/judged --compare course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-1/judged/run-log.json
✓ 21 postings → TAILOR 0, ASK FIRST 3, MOVE ON 0, HOLD 18 · scored 3
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/judged/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/judged/run-log.json
```

From `runs/discover-v0.2.0/round-2/judged/report.md`, verbatim. **The three "ask first" postings:**

- **Stripe — Machine Learning Engineer, Radar** (`stripe-8243617`). Why: the scorer says Consider; the sponsorship evidence is soft: no ML/AI title among the listed sponsored titles.
  - Question to ask: "Stripe's public H-1B record lists these sponsored titles: 'Software Engineer', 'Backend Engineer', 'Risk Strategist', 'Product Manager', 'Engineering Manager'. None is an ML/AI role. Does Stripe sponsor ML/AI engineers at this level?"
  - Next: Row 25632: STRIPE INC (South San Francisco, CA); identity confirmed by sukethrp on 2026-10-19. Ask this before spending tailoring time. Refresh the liveness check on the day you apply.
- **Pinterest — Master's University Grad Machine Learning Engineer 2027 (USA)** (`pinterest-8140219`). Why: the scorer says Consider; the sponsorship evidence is soft: no ML/AI title among the listed sponsored titles.
  - Question to ask: "Pinterest's public H-1B record lists these sponsored titles: 'Software Engineer', 'Software Engineer II', 'Software Engineer I', 'Senior Software Engineer', 'Senior Data Analyst'. None is an ML/AI role. Does Pinterest sponsor ML/AI engineers at this level?"
  - Next: Row 20330: PINTEREST INC (SAN FRANCISCO, CA); identity confirmed by sukethrp on 2026-10-19. Ask this before spending tailoring time. Review 8 line(s) the mode could not place in a section (starting with '#LI-HYBRID'). Work conditions to review: 'We let the type of work you do guide the collaboration style. That means we’re not always working in an office, but we continue to gather for key moments of collaboration and connection'; 'This role may require you to be located near an office for in-person collaboration, and therefore may need to be located a commutable distance from one of our Pinterest offices.'. Review before tailoring: new grad: check the graduation window, any professional-experience cap and the cohort start date against the profile; a year in the title does not establish the start. Refresh the liveness check on the day you apply.
  - **Decided by sukethrp on 2026-10-19: HOLD.** Her master’s is still in progress until December 2026. The graduation window, any professional-experience cap, cohort start date and office arrangements remain separate questions. Record a manual HOLD until those eligibility and timing questions are resolved; this fit number does not clear them. [Posting](https://www.pinterestcareers.com/jobs/8140219/masters-university-grad-machine-learning-engineer-2027-usa/)
- **Reddit — Machine Learning Engineer, Answers Relevance** (`reddit-8299781`). Why: a stretch: 13 months short of a stated minimum ('4–12 years of experience building, deploying, and operating ML systems in production'; documented experience: 24 months of employment, plus 6 months of co-op or internship, plus 5 months of research, teaching, contract, fellowship or part-time work; 35 months of all documented work, which still falls short); 24 months short counting only stated full-time months; the employer's reading of the minimum could change the decision.
  - Stretch: 13 months short of a stated experience minimum.
  - Question to ask: "Is the four-year minimum firm, or would you consider someone with two years of full-time production ML experience, plus a six-month co-op and part-time research experience?"
  - Next: Row 21989: REDDIT INC (SAN FRANCISCO, CA); identity confirmed by sukethrp on 2026-10-19. Ask before spending tailoring time, and put postings closer to the documented experience first. Review 10 line(s) the mode could not place in a section (starting with '#LI-Remote'). Refresh the liveness check on the day you apply.

**The top of the ranked shortlist** (18 postings waiting only for a fit call):

| # | Posting | Category | Sponsorship | Short of a minimum | Required lines not checked | Timeline (expected start; weeks) | To review | Link |
|---|---|---|---|---|---|---|---|---|
| 1 | Reddit — Machine Learning Engineer | ML/AI engineering | Proven (408 approvals, company-wide) | 25 months counting every documented month; 36 months counting only stated full-time months | 6 | 0.65 (2027-03-22; 22 weeks, the person's assumption) | — | https://job-boards.greenhouse.io/reddit/jobs/7131932 |
| 2 | Pinterest — Machine Learning Engineer, EPD Ads | ML/AI engineering | Likely (1364 approvals, company-wide) | 0 months: every stated minimum is met | 3 | 0.65 (2027-03-22; 22 weeks, the person's assumption) | — | https://www.pinterestcareers.com/jobs/?gh_jid=6121543 |
| 3 | Pinterest — Machine Learning Engineer II, Responsible AI | ML/AI engineering | Likely (1364 approvals, company-wide) | 0 months: every stated minimum is met | 4 | 0.65 (2027-03-22; 22 weeks, the person's assumption) | review the responsibilities: the title alone does not settle whether it belongs | https://www.pinterestcareers.com/jobs/?gh_jid=8162046 |
| 4 | Pinterest — University Grad Software Engineer 2027 (USA) | New-grad software engineering | Likely (1364 approvals, company-wide) | 0 months: every stated minimum is met | 8 | 0.65 (2027-03-22; 22 weeks, the person's assumption) | new grad: check the graduation window, any professional-experience cap and the cohort start date against the profile; a year in the title does not establish the start | https://www.pinterestcareers.com/jobs/?gh_jid=7838591 |
| 5 | Figma — Software Engineer - AI Product | ML-focused software engineering | Likely (188 approvals, company-wide) | 0 months: every stated minimum is met | 4 | 0.65 (2027-03-22; 22 weeks, the person's assumption) | — | https://boards.greenhouse.io/figma/jobs/5551730004?gh_jid=5551730004 |

**What changed since round 1** (selected rows; the report has all 21):

| Posting | Before | Now | Requirement lines read: before → now | Months short: before → now | Fit: before → now |
|---|---|---|---|---|---|
| Databricks — AI Engineer – Forward Deployed Engineering (AI FDE) | HOLD | HOLD | none → required 9, unclear 8, other 2 | 0 → unset | fit-missing → fit-missing |
| Stripe — Machine Learning Engineer, Radar | HOLD | ASK FIRST | required 8, preferred 6 → required 8, preferred 6, other 14 | 0 → 0 | fit-missing → 0.8 |
| Stripe — AI Engineer | HOLD | HOLD | required 18, preferred 6 → required 11, preferred 6, unclear 7, other 14 | 13 → 13 | fit-missing → fit-missing |
| Pinterest — Machine Learning Engineer, EPD Ads | HOLD | HOLD | required 11, unclear 11 → required 4, preferred 6, unclear 11, other 12 | 0 → 0 | fit-missing → fit-missing |
| Pinterest — Master's University Grad Machine Learning Engineer 2027 (USA) | HOLD | ASK FIRST | required 10, unclear 8, conditions 2 → required 10, unclear 8, conditions 2, other 16 | 0 → unset | fit-missing → 0.6 |
| Figma — Software Engineer - AI Platforms | HOLD | HOLD | none → required 5, preferred 4, unclear 18, other 5 | 0 → 25 | fit-missing → fit-missing |
| Reddit — Machine Learning Engineer, Answers Relevance | HOLD | ASK FIRST | required 6 → required 6, unclear 10, other 13 | 13 → 13 | fit-missing → 0.65 |

In this table, "0 → unset" means round 1 printed "0 months short" without comparing anything; v0.2.1 leaves it unset.
"0 → 25" is Figma's "5+ years of industry experience …" line, which round 1 never read.

### 5. The engine's break pair

```text
$ npm run score -- scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-demo-v0.2.1; echo "exit $?"

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-demo-v0.2.1

✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-demo-v0.2.1/role-scores.json  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-demo-v0.2.1/role-scores.md
exit 0
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json; echo "exit $?"
REFUSED: 1 problem(s); nothing was sent to the scorer
  - roles[0] (b-missing-liveness).liveness is missing; the scorer would treat it as fully open (x1)
exit 3
```

From the scorer's own report, `runs/break-demo-v0.2.1/role-scores.md`:

```text
| Example Robotics — Machine Learning Engineer | 0.421 | **Apply** | composite 0.421 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[record]×timeline 0.85[your-input] |
```

The input has no liveness field, yet the scorer says "gates healthy" and lists liveness 1 labelled `record`
(`role-scorer.mjs:83` defaults the factor to 1, and `:86` defaults its source to `record`). The guard refuses the same
input before the scorer sees it. It does not fix the scorer.

### 6. The student's own break attempt

The student designed it and wrote this prediction before running it (`runs/break-own-fit/PREDICTION.md`):

> I want to test an out-of-range fit value. On a copy of the queue, I would give Goodfire a fit of 1.5, keeping its
> reason and attribution fields valid and leaving the original queue untouched.
>
> My prediction is that the mode will stop at the input gate with exit code 2, identifying that fit must be between
> zero and one. It should stop before fetching postings, creating the run folder, or calling the scorer. Silently
> reducing 1.5 to 1.0 would also fail my expectation: invalid input should be rejected explicitly.

On v0.2.1, the same attempt on Stripe Radar's fit:

```text
$ python3 -c "import json, pathlib; r=pathlib.Path('course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs'); q=json.loads((r/'discover-v0.2.0/round-2/queue.json').read_text()); [p.update(fit={**p['fit'], 'p': 1.5}) for p in q['postings'] if p['posting_id']=='stripe-8243617']; (r/'break-own-fit-v0.2.1').mkdir(exist_ok=True); (r/'break-own-fit-v0.2.1/queue.json').write_text(json.dumps(q, indent=1, ensure_ascii=False))"
$ TAILOR_OR_ASK_FORBID_NETWORK=1 python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-own-fit-v0.2.1/queue.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-own-fit-v0.2.1/out; echo "exit $?"
STOP at the input gate: the queue failed the input gate:
  - postings[2].fit.p must be a number between 0 and 1
exit 2
$ ls course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/break-own-fit-v0.2.1/
queue.json
$ python3 -c "import json; q=json.load(open('course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/discover-v0.2.0/round-2/queue.json')); print('Stripe Radar fit in the original queue:', [p['fit']['p'] for p in q['postings'] if p['posting_id']=='stripe-8243617'][0])"
Stripe Radar fit in the original queue: 0.8
```

Every part of the prediction held:
- it stopped at the input gate, with exit 2, naming the fit range;
- network calls were forbidden, so a fetch would have shown a different error;
- the folder holds only the copied queue, so no run folder was made and the scorer never ran;
- the original fit, 0.8, is untouched.
It held on v0.1.1, v0.1.2 and v0.2.0 too (`runs/break-own-fit*/`).

## Verified vs inferred, line by line (round 2: the three "ask first" postings)

`record` means read from a file or a live check. `your-input` means declared by the student, including values derived
through the rules they adopted. `model-judgment` means proposed by Claude Code. `computed` means a script's result
from labelled inputs.

| Posting | Line | What it says | Label | Produced by |
|---|---|---|---|---|
| all three | title and URL | as listed on the company's board | record | the board's public API, read by `discover.py` |
| all three | availability | listed, and returned by the posting's job endpoint at the time checked; not a check that applying works | record | the board's job API |
| all three | company row | Stripe 25632, Reddit 21989, Pinterest 20330 | your-input | the student's identity confirmations (official legal or privacy pages; Stripe's 2026 conversion to Stripe, LLC noted) |
| all three | H-1B approvals and sponsored titles | Stripe 1,250, Reddit 408, Pinterest 1,364, company-wide, with each file's title list | record | the sponsorship file |
| all three | tier and p | Stripe and Pinterest Likely (0.6: no ML title among the listed ones); Reddit Proven (0.9: "Software Engineer, Machine Learning") | your-input | the title rules the student adopted; 0.6 and 0.9 are screening assumptions, not chances |
| all three | documented experience | 24 months full-time, 6 co-op, 5 needing supporting information | record | the fictional persona's résumé file, which Claude Code wrote |
| all three | timeline | 0.65: expected start 2027-03-22, target 2027-03-15, latest start 2027-04-04 | your-input | the student's 22 weeks through the formula they adopted; it matches the student's own calculation ("a timeline factor of 0.65") |
| Stripe Radar | required experience | stated minimums met; 7 required lines left for the person to read | record (text) · your-input (the reading) · record (persona) | the posting text; the adopted rules; the persona file |
| Stripe Radar | fit | 0.80, with the student's reason | your-input | the student |
| Stripe Radar | scorer | Consider, composite 0.2925 | computed | `scripts/score/role-scorer.mjs` |
| Stripe Radar | the question | Stripe's record lists no ML title; does Stripe sponsor ML engineers at this level? | model-judgment (the wording) · record (the titles) | a question template Claude Code drafted, filled from the file |
| Reddit | required: "4–12 years of experience building, deploying, and operating ML systems in production" | 13 months short counting every documented month; 24 counting only full-time months | record · your-input · record | as above. The full-time figure was added at the student's request |
| Reddit | fit | 0.65, with the student's reason | your-input | the student |
| Reddit | scorer | Apply, composite 0.3315 | computed | the engine's scorer |
| Reddit | suggestion | ASK FIRST: a stated minimum out of reach but not stated as firm | computed | rule R7 and the student's `on_required_gap: ASK FIRST` |
| Reddit | the question | "Is the four-year minimum firm, or would you consider someone with two years of full-time production ML experience, plus a six-month co-op and part-time research experience?" | your-input | the student's own words, which replace the template |
| Pinterest Master's | experience gap | unset: no stated minimum compared | computed | v0.2.1 never prints "0 months short" without a comparison |
| Pinterest Master's | new-grad window | flagged: check the graduation window, any experience cap, the cohort start date | your-input | the discovery rules the student adopted |
| Pinterest Master's | fit and scorer | 0.60 (the student's) · Consider 0.2535 | your-input · computed | the student · the engine's scorer |
| Pinterest Master's | decision | HOLD, with the student's reason | your-input | sukethrp, 2026-10-19 |

**Not verified at all:**
- whether any of these employers will sponsor Kavya now;
- whether her months are the kind of work each line asks for;
- whether applying works.

## How the output was checked

- **The comparison:** round 2 was run with `--compare` against round 1. The differences are exactly the intended
  ones:
  - fits on three postings;
  - requirement lines read differently under rules 0.3.1 (nine postings);
  - gaps unset where nothing was compared.
- **Hashes:**
  - round-2 queue sha256 `587a1a57048b…`, round-1 `cc1a5fd66978…`;
  - each posting text's SHA-256 is in the run log;
  - the sponsorship file matched its pin in every run.
- **The timeline, by hand:** 2026-10-19 plus 22 weeks is 2027-03-22. There are 13 days to the latest start
  (2027-04-04), over a 20-day buffer, so 0.65. The student made the same calculation before the run.
- **The counts:** each company's drop counts add up to its listings (the audit's table). The sample gave 1 / 4 / 2 / 3
  on every version from 0.1.0 to 0.2.1.
- **Exit codes:** shown with `echo $?`: scorer 0, guard 3, the student's break 2.
- **The student's own checks:**
  - seven company identities against official pages (in the target list);
  - Goodfire's row 11308 read directly from the CSV (v0.1.0, below);
  - a review of two Pinterest postings, which the student asked for. It found that a bulleted "- Nice to have:"
    left the lines under it read as required: six in one posting, five in the other. A third posting's
    "- Preferred Qualifications:" did the same to two lines. That was fixed in v0.2.1.
- **Privacy:** `node scripts/pii-scan.mjs --diff upstream/main` is clean. One company contact address in a Figma
  posting line is shown as "[email removed]" in the committed copy of the round-2 report and log
  (`runs/discover-v0.2.0/round-2/judged/NOTE.md`); the unedited files are kept outside the repo.
- **Offline tests:** 164 pass, including tests on the mode file itself.

## Attestation (v0.2.1)

Signed by the student on 2026-10-20 and copied from their message word for word.

- **Recipe:** ml-tailor-or-ask v0.2.1
- **By:** Suketh Reddy Produtoor
- **Run date:** October 19, 2026
- **Tested commit:** `4f17ec2`
- **Attestation date:** October 20, 2026

### Tested

| Ran or reviewed | Saw | Expected |
|---|---|---|
| Commit check and offline tests | HEAD `4f17ec2`; 164 tests passed | Identify the tested version and confirm its checks pass |
| Offline sample | TAILOR 1, ASK FIRST 4, MOVE ON 2, HOLD 3; four postings scored | Preserve the established sample results |
| Discovery across 12 targets | Seven boards read, 2,512 listings counted and 21 postings queued | Report unsupported companies explicitly and account for the filtering |
| Round 2 with `--compare` | TAILOR 0, ASK FIRST 3, MOVE ON 0, HOLD 18; three scored | Show the effects of the revised requirements rules and my three fit calls |
| Missing-liveness fixture through the scorer | Apply; exit 0 | Reproduce the scorer’s known behavior when liveness is missing |
| The same fixture through the guard | REFUSED; exit 3 | Reject incomplete evidence before scoring |
| My break attempt: Stripe Radar fit changed to 1.5 in a copied queue | Input rejection; exit 2; no run-output folder; original fit remained 0.8 | Reject the invalid value without fetching postings, scoring or changing the original |
| Seven company identity checks | Official company information supported the selected rows; Stripe’s documented entity conversion explained its name difference | Establish the intended company matches using more than familiar brand names |

The three ASK FIRST results are the mode’s suggestions. My separate decision for Pinterest remains **HOLD** until its new-grad eligibility, cohort timing and office arrangements are resolved.

### Did not test

- Whether an employer would sponsor Kavya for a particular opening.
- Whether application submission works.
- Actual recruiter response times or confirmed start dates.
- Automatic verification of skills, degree eligibility or the relevance of every employment month.
- The private résumé workflow or unsupported careers sites.
- A complete personal rerun of the later documentation and test-only commit.

### Broke during testing, fixed

Reviewing round 1 exposed eight postings whose requirements had not been read but whose gaps appeared as zero. Version 0.2.1 recognises the additional headings and holds postings when the required section cannot be found. A missing comparison now remains unset.

The Pinterest review I requested also exposed 13 preferred lines classified as required: six, five and two across three postings. Their section handling was corrected.

After the live run, a test failed because it assumed October 19. Its date was fixed within the test. This later test-only change is documented separately from the production code I ran.

The underlying scorer still accepts missing liveness. The guard blocks that input; it does not repair the scorer itself.

**Signature:** Suketh Reddy Produtoor

*Note from Claude Code, outside the student's attestation:* the discovery row's run was made on v0.2.0 (commit
`cd0d40a`, 18:25 EDT, run log 7). `discover.py`, `timeline.py` and the discovery rules are byte-identical in
`4f17ec2`; round 2 re-judged the same 21 postings on `4f17ec2`.

## Reflection (v0.2.1, the student's own words)

Written by the student on 2026-10-20 and copied word for word.

### What went well

The most useful result was getting specific questions instead of a generic application score. Stripe needs a role-level sponsorship question. Reddit needs clarification about its four-year minimum. Pinterest needs an eligibility and cohort check before application work continues.

My out-of-range fit test behaved as predicted: the copied queue was rejected, no run-output folder appeared, and the original 0.8 remained unchanged. The comparison between rounds also made the changes visible instead of leaving me to rely on a claim that the parser had improved.

### What the mode got wrong or missed

The biggest mistake was making missing information look favourable. Eight postings showed zero months short even though no requirements had been parsed. Figma’s five-year requirement made the consequence clear: an apparently close match actually had a substantial experience gap.

The Pinterest errors showed that even familiar headings can fail when their formatting changes. Passing tests did not establish that every real posting was being read correctly.

The results also exposed a boundary between scoring and deciding. Reddit received Apply from the scorer, but its experience gap still required ASK FIRST. Pinterest received an ASK FIRST suggestion, while my decision remained HOLD.

### Next steps for the mode

I would expand the heading fixtures using these real failures, keep before-and-after section comparisons, and make unresolved conditions more prominent in the summary. I would also add explicit checks for new-grad windows, experience caps and cohort dates.

Company-wide sponsorship history and assumed hiring duration still need employer confirmation. The mode should help identify those questions without presenting them as answered.

I would keep the recipe at DRAFT while its eight proposals remain open, preserve the historical run evidence, and record future changes against a clearly identified version.

## Found while building and fixed (Claude Code, not part of the student's attestation)

- **v0.1.1, from reading its own reports:**
  - a missing H-1B record was not shown;
  - the sponsorship question was dropped when a gap was found;
  - "1 months";
  - one persona's CV was described in every report.
- **v0.2.0, from Claude Code's dry runs before the student's run:**
  - non-US places such as Seoul and Costa Rica were treated as unclear and kept;
  - customer-facing titles ("Solutions Engineer, AI Build Team") were kept;
  - drop counts were in a misleading order;
  - a crash on the YAML bridge's date format.
- **v0.2.1, from the student's round-1 output:**
  - 8 postings had no requirements read;
  - lines under non-requirement headings were silently dropped;
  - "0 months short" was printed with nothing compared.
  The Pinterest bullet-heading error was found through the review the student asked for, and the full-time-only gap
  was added at the student's request.

**After run 8, test-only:** after midnight, one test failed on 2026-10-20 because it assumed the run date was
2026-10-19 (live runs use the person's local date). The test now fixes its own date. The mode's code is unchanged
since run 8 (commit `4f17ec2`), and all 164 tests pass.

**An erratum:** the 0.3.1 note in `rules.json` says "three nice-to-have lines". The counts are six and five, plus
two under "- Preferred Qualifications:". The note is left unchanged, so the file still matches the SHA-256 recorded in
run log 8.

**Found but not fixed:**
- the engine scorer's gates fail open, and it labels a missing gate `record`. This is engine code; the guard refuses
  such input;
- v0.2.1 does not strip addresses from posting lines (the committed copy is redacted).

## Earlier versions (history: the runs as they happened)

The sections below are the record of v0.1.0 (logs 3 and 4), unchanged except for their headings. They include the
student's first attestation and reflection. Logs 5–7 cover v0.1.1, v0.1.2 and v0.2.0.

### Inputs (v0.1.0)

| Run | Postings | Applicant | Other inputs | Who chose them |
|---|---|---|---|---|
| Sample (`runs/sample/`) | `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/sample-queue.json`: 10 illustrative postings at real companies, with synthetic page snapshots and posting texts | `search/examples/priya-nair/` (fictional) | sponsorship file pinned at sha256 `eccdee2a…6270`; rules v0.2.0 adopted by the student | Claude Code wrote the queue, so its values are labelled model-judgment |
| Live (`runs/live/`) | `runs/live/queue.json`: Goodfire and Orenda, "Machine Learning Engineer", public Greenhouse postings | the same fictional persona | the same file and rules; every gate decision is the student's, in their own words | the student (Goodfire at Checkpoint 2, Orenda in the design answers) |

Naming either company does not imply confirmed sponsorship. Nothing from the student's own résumé, dates or
applications is used.

### Commands run, and their real output

#### 0. Before building: the engine's own scorer and liveness check, re-run by the student (13:43 EDT)

The Checkpoint 2 results first came from an automated session the student used, which wrote no files. The student
re-ran both checks in their own terminal:

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor/role-scores.json  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/anchor/role-scores.md
$ npm run ats:liveness -- https://job-boards.greenhouse.io/goodfire/jobs/5019847008

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://job-boards.greenhouse.io/goodfire/jobs/5019847008

Checking 1 URL(s)...

✅ active     https://job-boards.greenhouse.io/goodfire/jobs/5019847008

Results: 1 active  0 expired  0 uncertain
```

The scorer's files are in `runs/anchor/`. The book's "ghost posting" is skipped because its liveness gate is closed,
whatever its sponsorship and fit.

#### 1. Sample run: the student, in their own terminal, 2026-10-19 (log 11:56:08 UTC)

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample
✓ 10 postings → TAILOR 1, ASK FIRST 4, MOVE ON 2, HOLD 3 · scored 4
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/sample/run-log.json
```

The shell prompt is shown as `$`. The paste is saved in `runs/sample/terminal-output.txt`.

What each sample posting got, from `runs/sample/run-log.json`:

| Posting (illustrative) | Company row matched | Suggestion | Why |
|---|---|---|---|
| Discord, MLE New Grad | 7770 DISCORD INC | TAILOR | Proven (an ML title counted), active, composite 0.446 |
| Etsy, MLE I | 9093 ETSY INC | ASK FIRST | "1+ years" is 4 months short counting the co-op; the student's own gap question |
| Airbnb, MLE Early Career | 1013 AIRBNB INC | ASK FIRST | no ML/AI title among the sponsored titles |
| Hugging Face, MLE | 12614 HUGGING FACE INC | ASK FIRST | no H-1B record (unknown, not "no"), and "6+ months" is met only if co-op counts |
| Meta, AI Research Engineer | **16612 META CO (Portola Valley)** | ASK FIRST | "no H-1B record", but for a namesake: the file has no Meta Platforms row |
| Celestial AI, MLE | 5181 CELESTIAL AI INC | MOVE ON | the page is closed |
| Kensho, MLE | 14287 KENSHO TECHNOLOGIES INC | MOVE ON | "2+ years … (a firm requirement)", and every documented month falls short |
| AppLovin, MLE New Grad | 1955 APPLOVIN CORP | HOLD | the page is uncertain (no apply control) |
| Databricks, AI Engineer | 7248 DATABRICKS INC | HOLD | timeline withheld |
| Peloton, MLE | — | HOLD | several "Peloton" rows, and a stale page check |

#### 2. Live run: the student, in their own terminal, 2026-10-19 (log 11:22:06 UTC)

This run's terminal output was not saved. Its first attempt stopped because `round-1/` already held a run. To capture
the output, the student ran the same queue again at 13:44:17 EDT, into `runs/live/round-3-panel/`:

```text
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/queue.json --out-dir course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel
✓ 2 postings → TAILOR 0, ASK FIRST 0, MOVE ON 0, HOLD 2 · scored 0
  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/report.md  +  course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-3-panel/run-log.json
```

Both of the student's live runs give the same result: liveness exit 0, HOLD 2, scored 0, and identical posting-text
hashes.

From `runs/live/round-2-personal/run-log.json`:
- the liveness subprocess exited 0, with both pages active;
- the posting texts were saved with sha256 `44ac3e2a…` (Goodfire) and `f269d74b…` (Orenda). The full third-party
  texts are kept outside the repo; each run log records the API URL and the hash, and the report quotes the lines it checked;
- the result is HOLD 2, scored 0, and decided 2.

#### 3. The earlier automated attempt (not the student's run), log 11:17:25 UTC

From `runs/live/round-1/terminal-output.txt`, written by that session:

```text
Execution context: automated PTY session; not a personal run in the app Terminal panel.
✓ 2 postings → TAILOR 0, ASK FIRST 0, MOVE ON 0, HOLD 2 · scored 0
The liveness subprocess exited 1 after a browser-launch failure; both postings remain unresolved for liveness.
```

Its run log records Playwright's launch being denied. The mode held both postings on liveness and never called them
closed (rule R8, on a real failure). The home folder in two captured lines was replaced with `~` before publishing;
see `runs/live/round-1/NOTE.md`.

#### 4. Deliberate break attempt: the student, 2026-10-19 (scorer output written 13:35:37 EDT)

The same input, a posting with **no liveness gate**, was given to the engine's scorer and to the guard:

The student ran it first at 13:35, then again at 13:43:51 to capture the terminal output:

```text
$ npm run score -- scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir output/sukethrp-ml-tailor-or-ask/break-demo-panel

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json --out-dir output/sukethrp-ml-tailor-or-ask/break-demo-panel

✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  output/sukethrp-ml-tailor-or-ask/break-demo-panel/role-scores.json  +  output/sukethrp-ml-tailor-or-ask/break-demo-panel/role-scores.md
$ python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/fixtures/BROKEN-missing-liveness.json
REFUSED: 1 problem(s); nothing was sent to the scorer
  - roles[0] (b-missing-liveness).liveness is missing; the scorer would treat it as fully open (x1)
```

Both runs give the same result (composite 0.4208). The student's attestation records the exit codes: 0 from the
scorer and 3 from the guard. The scorer's own output files, copied to `runs/break-demo-personal/`,
show what "Apply" rested on (the same in `runs/break-demo-panel/`). This is from its human report `role-scores.md`:

```text
| Example Robotics — Machine Learning Engineer | 0.421 | **Apply** | composite 0.421 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.6·0.3 [your-input] × liveness 1[record]×timeline 0.85[your-input] |
```

The input had no liveness field, yet the scorer's report says "gates healthy" and lists a liveness gate of 1
**labelled `record`**. The scorer did not only treat the missing gate as open: its audit trace attributes to a record
a value no record produced (`role-scorer.mjs:83` defaults the factor to 1, and `:86` defaults its source to `record`). That is the
defect the guard exists for. The guard does not fix the scorer, as the student's attestation says; it refuses such
input before the scorer sees it.

### Verified vs inferred, line by line (live run)

`record` means read from a repo record or a live check. `your-input` means declared by the student, including values
derived through the rules they adopted. `model-judgment` means proposed by Claude Code (none in the live run).

| Posting | Line | What it says | Label | Produced by |
|---|---|---|---|---|
| Goodfire | page status | active: an apply control was detected | record | `check-liveness.mjs`, live |
| Goodfire | company row | 11308 GOODFIRE AI INC, San Francisco, CA | your-input | the student's identity decision; the file's website stays unverified |
| Goodfire | identity evidence | legal terms + SEC Form D filing | your-input | the student |
| Goodfire | H-1B record | all five fields blank, so unknown, not "does not sponsor" | record | the sponsorship file, row 11308; also checked by hand by the student |
| Goodfire | required: "5+ years of experience in ML infra, research engineering, or systems programming." | 60 months asked; 8 documented, all co-op; 52 short | record (text) · your-input (the reading) · record (persona file) | the posting via the Greenhouse API; adopted rules; the persona's résumé file |
| Goodfire | kind of experience asked | "in ML infra, research engineering, or systems programming" | not checked | shown for a person to judge |
| Goodfire | 4 other required lines, 2 preferred, 1 work condition | listed word for word | record | the posting text |
| Goodfire | fit, timeline | left unset, with the student's reasons | your-input | the student |
| Orenda | page status | active: an apply control was detected | record | `check-liveness.mjs`, live |
| Orenda | company row | 19228 ORENDA INC, a candidate the student did not clear (orenda.io vs orendapower.com) | your-input | the student's identity decision |
| Orenda | required: "B.S. and 3+ years of relevant experience" | 36 months asked; 8 documented; 28 short; the degree is not checked | record · your-input · record | as above |
| Orenda | required: "2+ years experience writing clean, maintainable Python code with Machine Learning…" | 24 months asked; 16 short; the kind is not checked | record · your-input · record | as above |
| Orenda | work condition | full time, in-office, headquarters in Brooklyn | record | the posting text, awaiting review |
| Orenda | fit, timeline | left unset, with the student's reasons | your-input | the student |
| both | suggestion | HOLD | computed | the mode's precedence rules: unresolved gates first |
| both | decision | HOLD, each with a written reason | your-input | the student (sukethrp), 2026-10-19 |

**Not estimated, but still judgment.** Fit and timeline were not estimated, and no score was produced. The
company-identity decisions still involved judgment (confirming Goodfire's row, keeping Orenda's as a candidate), and so
did the screening rules (which sponsored titles count, how requirement lines are read). Those values are labelled
`your-input`, never `record`.

### How the output was checked

- **By hand (the student):** displayed row 11308 from the CSV. It showed GOODFIRE AI INC, San Francisco, CA, with all
  five H-1B fields blank, matching the report.
- **Hashes:**
  - the live queue's sha256 (`bd58ecec…`) is the same in both live run logs;
  - both runs fetched identical posting texts (same sha256);
  - the sponsorship file matched its pin in every run.
- **Reproducibility:** the student's sample run reproduced the counts in the recipe exactly (1 / 4 / 2 / 3, 4 scored).
- **Offline tests:** 118 pass (`python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests`),
  including tests that check the recipe file itself.

### Attestation for v0.1.0 (superseded)

Signed by the student, copied from their Checkpoint 4 message. Only the table grid was restored.

- Recipe: ml-tailor-or-ask v0.1.0 · rules v0.2.0
- By: Suketh Reddy Produtoor · 2026-10-19

#### Tested
| Ran | Saw | Expected |
|---|---|---|
| Live command into round-1 | Stopped because the folder already contained a run | Preserve existing evidence |
| Live command into round-2-personal | Both postings active; HOLD 2; scored 0 | Unresolved gates prevent scoring |
| Direct CSV read of data row 11308 | GOODFIRE AI INC, San Francisco, CA; all five H-1B fields blank | Company details match the report; missing sponsorship history remains unknown |
| Engine scorer on BROKEN-missing-liveness.json | Apply 1; exit 0 | Reproduce the scorer’s behavior when liveness is missing |
| Guard on the same broken input | REFUSED; identified missing liveness; exit 3 | Reject incomplete input before scoring |

#### Did not test
- A private run using my own résumé and profile.
- A live posting that cleared every gate and reached the scorer.
- A closed live posting or a live Lever/Ashby posting.
- Submitting an application or obtaining employer confirmation of sponsorship and start dates.
- The proposed degree, skills, kind-of-experience, sponsorship-text, and new-grad-window checks.

#### Broke during testing, fixed
- My first live attempt stopped at the existing-output safeguard. I resolved this by choosing a fresh output folder and preserving the earlier run.
- The deliberate missing-liveness test reproduced an unresolved engine defect: an unchecked gate was treated as fully open. The guard rejected that input as intended. This demonstrates the safeguard; it does not establish that the underlying scorer defect is fixed.

#### After signing (superseded)

After the attestation (signed 13:40 EDT), one test file changed. In `tests/test_guard.py`, a class decorator
(`unittest.skipUnless`) became the same skip inside `setUp`. The repo's branch-diff privacy scan reads an added
decorator line with a dotted name as an email address, so CI would have failed the PR on a false positive. The
folder's README was also updated (test counts and how the queue is documented); it runs nothing. No mode code,
rules, recipe or card changed, and all 118 tests still passed then. The constitution counts any edit to a recipe's scripts after
attestation as voiding it.

- Superseded: the code changed after this was signed (v0.1.1 to v0.2.1), so the student signs again for v0.2.1, above.

### Found and fixed while building v0.1.0 (Claude Code)

Each of these was found by Claude Code while building or testing, and fixed with a test:
- "Up to 2 years" had been read as a 2-year minimum.
- "6 months to 2 years" had been read as 2 years.
- "Three years" and "2 years in …" were not read at all.
- A bare "3 years" in an alternative-path line was missed.
- A private résumé was read before checking that outputs would stay in `private/`.
- A captured browser error carried the local home folder. It is now written as `~`.
- After both logged runs, a new test found that a malformed scorer result crashed the contract check instead of
  voiding the run. Fixed in `evidence.py`; neither logged run is affected.

Found but not fixed, because it is engine code outside this namespace: the engine scorer's gates fail open, and the
scorer labels the missing gate `record`. The guard refuses such input.

### Reflection on v0.1.0 (the student's own words)

From the student's Checkpoint 3 record, verbatim:

> What stood out was that both pages were active, yet neither posting reached the scorer. Clearing liveness did not
> resolve the other gates. My next steps are to reconcile the fictional résumé sources, confirm Orenda's identity,
> and obtain enough timing information to justify a factor.

From the Checkpoint 3 note, verbatim:

> What stands out is that choosing a closer-looking role does not necessarily produce a recommendation. The
> applicant's source files, company identity, and timing evidence still matter. The structured résumé's missing job
> is especially important because the mode can calculate correctly from an incomplete input.

From the student's Checkpoint 4 reflection, verbatim:

> The deliberate break test gave me the clearest evidence for keeping the guard. I supplied the same input, with no
> liveness gate, to both programs. The scorer recommended Apply, while the guard identified the missing field and
> refused the input. The exit codes confirmed the difference: zero from the scorer and three from the guard. This
> showed that successful execution alone does not establish that the input was complete or the recommendation
> justified.
