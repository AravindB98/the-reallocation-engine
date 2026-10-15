# Worked Run — swe-ai-devops-sponsor-triage

## Executive summary

This is the real run of the prototype against the full repo dataset, redone on
2026-10-14 after grading feedback. It shows the exact commands, their real
terminal output, a line-by-line split of what was verified versus inferred, how
the output was checked, and what the run still gets wrong. The main change from
the first version: a job posting's liveness is now actually checked, and a
company whose posting was not checked is held out instead of being scored with a
guessed value. Of 386 candidate companies, 5 were scored (all Apply): 4 that
the checker confirmed live, and 1 (Datadog) that the checker could not judge, so
I opened the page myself and recorded the decision. The other 381 were held out
with the reason.

## Inputs used

- Source CSV: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (shipped with the repo, 30,369 rows — real company data, not a persona).
- `--opt-end-date 2027-03-15` — a placeholder for my real date, which stays private; labeled `your-input` throughout.
- `--hiring-lag-days 45` (default) — a disclosed assumption, labeled `your-input`.
- `liveness/posting-urls.csv` — five current postings, one per company. I
  decided to check real postings; Claude Code picked these five from the
  companies' public job boards (Greenhouse, Ashby and Datadog's careers site)
  on 2026-10-14, choosing SWE, DevOps and AI roles at five of the strongest
  sponsors on the list, and I reviewed the list afterwards; `your-input`.
- `liveness/liveness-check.txt` — the raw output of the repo's liveness checker
  on those five URLs, saved unedited; read as `record`.
- `liveness/gate-decisions.csv` — my own decision on the one posting the checker
  could not judge (Datadog), with a screenshot of the page
  (`liveness/datadog-R21399-2026-10-14.png`); read as `your-input`.

## Commands run, with real output

Liveness check, 2026-10-14 15:35 EDT (the checker exits 1 when any URL is not
`active`):

```
$ npm run ats:liveness -- $(tail -n +2 scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/posting-urls.csv | cut -d, -f2) > scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/liveness/liveness-check.txt

Checking 5 URL(s)...

✅ active     https://jobs.ashbyhq.com/whoop/0623a9e9-d7bb-4ee5-8100-51c68df81133
✅ active     https://job-boards.greenhouse.io/discord/jobs/8703614002
✅ active     https://jobs.ashbyhq.com/skydio/7d7dfadc-c6fd-4958-8d59-004a91bff55e
✅ active     https://job-boards.greenhouse.io/life360/jobs/8841875002
⚠️ uncertain  https://careers.datadoghq.com/detail/8223819/?gh_jid=8223819
           content present but no visible apply control found

Results: 4 active  0 expired  1 uncertain
```

The prototype's one documented command:

```
$ bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh
rows_read=30369
skipped_wrong_industry=19100
skipped_no_approvals=10416
skipped_no_titles=0
skipped_no_title_match=467
emitted=386
liveness_checked=5
held_out_liveness_unchecked=381
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json (5 roles for the scorer)
wrote scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/held-out.json and held-out.md (381 held out)

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/roles.json --out-dir scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run

✓ scored 5 roles → Apply 5 · Consider 0 · Skip 0 (skip 0%)
  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.json  +  scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run/role-scores.md
```

Top of the real `role-scores.md` (unedited):

```
# Role Scorer report — 2026-10-14

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 5 roles → Apply 5 · Consider 0 · Skip 0. **Skip rate 0%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| LIFE360 INC — Senior Software Engineer II (AI Native) | 0.650 | **Apply** | composite 0.650 ≥ 0.3, gates healthy | sponsorship 1·0.35 [record]; fit 1·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| DATADOG INC — Senior Software Engineer - CI/CD Security | 0.635 | **Apply** | composite 0.635 ≥ 0.3, gates healthy | sponsorship 1·0.35 [record]; fit 0.95·0.3 [model-judgment] × liveness 1[your-input]×timeline 1[your-input] |
| DISCORD INC — QA/DevOps Engineer | 0.635 | **Apply** | composite 0.635 ≥ 0.3, gates healthy | sponsorship 1·0.35 [record]; fit 0.95·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| SKYDIO INC — Software Engineer - Cloud Simulation & Full-Stack | 0.545 | **Apply** | composite 0.545 ≥ 0.3, gates healthy | sponsorship 1·0.35 [record]; fit 0.65·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
| WHOOP INC — Software Engineer I (Backend) | 0.545 | **Apply** | composite 0.545 ≥ 0.3, gates healthy | sponsorship 1·0.35 [record]; fit 0.65·0.3 [model-judgment] × liveness 1[record]×timeline 1[your-input] |
```

Top of the real `held-out.md` (unedited, first rows):

```
| Company | Matched title | Why held out |
|---|---|---|
| 1UPHEALTH INC | Senior Software Engineer | liveness not checked: no posting URL chosen for this company |
| 23ANDME INC | Sr. Software Engineer III | liveness not checked: no posting URL chosen for this company |
```

### My gate decision on the one "uncertain" posting

The checker returned `uncertain` for Datadog ("content present but no visible
apply control found"). I opened the page myself on 2026-10-14: it is a live
posting (requisition R21399) with an "Apply for this job" form built into the
page instead of an apply button, which is what the checker looks for. I
recorded that as a gate decision, so Datadog is scored with its liveness
labeled `your-input` (my judgment), not `record`:

```
company_name,url,decision,decided_by,date,evidence,note
DATADOG INC,https://careers.datadoghq.com/detail/8223819/?gh_jid=8223819,active,Yash Saraf,2026-10-14,liveness/datadog-R21399-2026-10-14.png,"Opened the page myself: requisition R21399 with an embedded Apply for this job form; the checker looks for an apply button and returned uncertain"
```

## Verified vs. inferred — line-by-line split (top row, LIFE360 INC)

| Field | Value | Label | How it got there |
|---|---|---|---|
| `company` | LIFE360 INC | record | copied verbatim from the CSV's `company_name` |
| `sponsorship.approvals` / `denials` | 102.0 / 0.0 | record | the CSV's `Total Approvals` / `Total Denials` (line 15223) |
| `sponsorship.p` | 1.0 | record | `Approval_Rate / 100` from the CSV (`Approval_Rate=100.0`) |
| `sponsorship.tier` | Proven | record | bucketed from `Approval_Rate` (≥80% → Proven) by this script, not asserted by the source |
| `sponsored_title_example` | DevOps Engineer II | record | first matching title in the CSV's `top_job_titles_sponsored` |
| `fit.p` | 1.0 | model-judgment | keyword/word-boundary match: 4 of the company's sponsored titles matched (`0.5 + 0.15 × 4`, capped at 1) — not a semantic judgment |
| `title` | Senior Software Engineer II (AI Native) | your-input | the posting chosen for checking, from `liveness/posting-urls.csv` |
| `liveness.factor` | 1.0 | record | `active` in the saved checker output, 2026-10-14 15:35 EDT |
| `timeline.factor` | 1.0 | your-input | 152 days from 2026-10-14 to the placeholder OPT date 2027-03-15, over the 45-day hiring-lag assumption, capped at 1 |
| `recommendation` | Apply | derived | the scorer's own arithmetic: `(1×0.35 + 1×0.3) × 1 × 1 = 0.650 ≥ 0.3` |

## Verification

- **Cross-checked by hand:** opened the source CSV and confirmed LIFE360 INC's
  row (line 15223 of
  `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`)
  shows `Total Approvals=102.0 Total Denials=0.0 Approval_Rate=100.0` and
  `top_job_titles_sponsored` beginning `['DevOps Engineer II', 'Senior Software
  Engineer', ...]` — matches `run/roles.json`. Also confirmed CLARI INC's row
  (line 5696) shows `Total Approvals=116.0 Total Denials=0.0
  Approval_Rate=100.0` — matches `run/held-out.json`, where CLARI INC is held
  out because no posting was checked for it. To repeat either check:
  `grep -n "^LIFE360 INC," data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`.
- **Checked liveness for real:** ran the repo's own checker on five postings
  (output above). For the one it could not confirm (Datadog), I opened the page
  myself, found it live, and recorded a gate decision with a screenshot rather
  than editing the checker's output.
- **Ran the offline test suite:** 13/13 pass (see `TEST-REPORT.md`), including
  a test that a role without a checked posting never reaches the scorer and a
  test that a human gate decision is labeled `your-input`, not `record`.
- **Deliberate break attempt:** fed `--opt-end-date 2020-01-01` (already past)
  with the same checked postings. Every scored role's `timeline.factor` became
  `0.0`, and the real scorer returned `Apply 0 · Consider 0 · Skip 5` (100%
  skip) — see `TEST-REPORT.md`.

## Reflection

**What worked:** holding out unchecked roles made the output honest about how
little has been checked: 381 of 386 candidates are listed as "not checked yet"
instead of 328 "Consider" rows built on a guessed number. The checker was also
wrong once, and checking by hand caught it: it returned `uncertain` for a live
Datadog posting because the page has an embedded application form instead of
an apply button.

**What the recipe/prototype got wrong or missed:** the Skip rate of the scored
set is 0%, which the scorer flags. That is not evidence the recipe works: the
five postings were chosen at five of the strongest sponsors on the list (100%
approval rates), so a high score for all five was close to guaranteed. Four hand-picked
roles cannot show whether the recipe skips enough. The `fit` score is also still
company-level (how many of the company's past sponsored titles matched), not a
judgment about the specific posting that was checked.

**One concrete next improvement:** choose postings for a random sample of the
held-out companies — not just the strongest sponsors — check them, and report
the Skip rate on that sample, so the "healthy run skips at least half" bar can
actually be tested.

## Revision: what changed from the first worked run

The first run (2026-10-01) scored all 386 candidates — Apply 55 · Consider 328 ·
Skip 3 (1% skip) — because every role was given a placeholder liveness of `0.5`
labeled `your-input`. That value was invented: no posting had been checked, and
it decided which companies reached Apply (`(0.35 + 0.3) × 0.5 = 0.325 ≥ 0.3`).
Grading feedback (2026-10-12) pointed out that the assignment asks the
prototype to fail clearly instead of inventing a value, so the placeholder was
removed and unchecked roles are now held out of the scorer.

## Attestation

- Recipe: swe-ai-devops-sponsor-triage v0.1.0
- By: Yash Saraf · 2026-10-14

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run ats:liveness -- <5 posting URLs>` | 4 active, 0 expired, 1 uncertain (Datadog) | a result per URL, saved unedited |
| Opened the Datadog posting the checker marked `uncertain` | live posting, requisition R21399, embedded "Apply for this job" form | decide the gate myself; record it with a screenshot |
| `bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-sponsor-triage/run.sh` | 386 candidates; 5 scored, Apply 5 (Datadog's liveness labeled `your-input`); 381 held out with reasons | only checked or human-decided roles reach the scorer; the rest are listed, not scored |
| `python3 .../build_roles_test.py` | 13/13 tests pass | all pass, including the held-out, gate-decision and false-positive tests |
| `python3 .../build_roles.py --csv /nonexistent/missing.csv ...` | `ERROR: source CSV not found...`, exit code 2 | nonzero exit, no fabricated output file |
| **Deliberate break attempt:** `--opt-end-date 2020-01-01` with the checked postings, then scored | every scored role `timeline.factor=0.0`; scorer returns Skip 5/5 (100%) | the timeline gate zeroes the composite regardless of sponsorship strength |

### Did not test

- Liveness for the other 381 candidate companies — no posting was chosen for
  them, so they are held out.
- Whether the five scored postings are still open after 2026-10-14.
- An `expired` result from the real checker: none of the five came back
  expired, so that path is covered only by the offline fixture test.
- Behavior on a CSV with renamed headers, or a `top_job_titles_sponsored` field
  quoted differently from the two patterns the regex handles.

### Broke during testing, fixed

- The first version invented liveness (`0.5`) for every role, which let 55
  unchecked companies reach Apply. Fixed in `build_roles.py`: unchecked roles
  are held out; checked ones carry the checker's result as a record.
- The checker returned `uncertain` for a live Datadog posting (embedded form,
  no apply button). Added `liveness/gate-decisions.csv`: when the checker is
  uncertain, a named person can open the page and record a decision, which the
  prototype reads as `your-input`; the checker's own output is never edited.
- The scored rows first showed the company's past sponsored title (for example
  "DevOps Engineer II") instead of the posting actually checked. Fixed: a
  scored role's `title` is the checked posting, and the sponsored title is kept
  as `sponsored_title_example`.
