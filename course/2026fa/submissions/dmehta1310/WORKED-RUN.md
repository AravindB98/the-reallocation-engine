# Domain Justification, Worked Run, and Attestation
## ghost-job-radar -- Dhruvi Mehta (dmehta1310)

---

## Domain Justification

**Who uses this, in exactly what situation:** An international master's
student in Information Systems, targeting Data Analytics roles, currently
authorized to work under F-1 CPT tied to her academic program (not OPT).
Her CPT authorization is bounded by her program end date, not a fixed
90-day unemployment clock, and she has already lost real time applying to
a posting that had quietly been filled weeks earlier.

**Information asymmetry addressed:** From the outside, this student
cannot easily tell (a) whether a specific job posting is still real, or
(b) whether a company has any history of H-1B sponsorship, before
spending her own limited, enrollment-tied research hours on it. This
recipe makes both checks a hard gate that runs before any time is spent
reading about the company's sponsorship or funding history at all.

**Engine layer(s):** Job-Ops (scripts/ats/check-liveness.mjs) for the
liveness gate; 80 Days to Stay
(data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv)
for sponsorship history and funding context.

**Where it fits the 3-3-2 day:** This recipe takes over the first filter
inside the two research-and-apply hours -- the "is this even worth
researching further" question -- before any time is spent tailoring an
application. Estimate (labeled as an estimate, not a record): for a
student reviewing ~10 postings a week, a 2-minute liveness+sponsorship
check per posting versus the ~20-30 minutes it previously took to dig up
the same information by hand saves roughly 3-4 hours a week, which can be
redirected into the credibility-building 3 hours or the networking 3
hours of the 3-3-2 day.

**Domain-specific failure modes:**
1. Absence misread as denial. A company genuinely not in the sample
   CSV (which covers only a subset of companies, not the full DOL/H-1B
   dataset) could be misread by a rushed student as "confirmed will not
   sponsor," when it only means "not checked here." The person hardest
   hit by this is exactly the target user: someone under time pressure
   who doesn't stop to read the NoRecordInSample label carefully.
2. Lag-estimate overconfidence. The CPT/program-timeline gate is only
   as good as the hiring-lag estimate the student supplies. A student who
   copies a generic "6 weeks" estimate without adjusting it for a
   specific company's actual hiring speed could get a false "pass" that
   still doesn't leave enough real time. This is hard to catch because
   the gate's arithmetic is correct -- the input assumption is what's
   wrong, and nothing in the tool itself can check that assumption.

---

## Worked Run

### Inputs used

- Company: $AVY INC (a real, synthetic-sounding company name present in
  the sample CSV -- not a fictional persona invented for this run, since
  the company itself is already a de-identified sample row)
- Title: Data Analyst
- CPT/program end date: 2027-05-15 (fictional, for this run)
- Hiring-lag estimate: 6 weeks (fictional, for this run)
- Liveness result: live (supplied manually for this run; see "What
  remains blocked" in the run log)

### Commands run, with real output

Step 1 -- CPT/program-timeline gate:

    python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py --end-date 2027-05-15 --lag-weeks 6

    Output: result "pass", today 2026-09-29, cpt_program_end_date
    2027-05-15, hiring_lag_weeks 6, projected_hire_date 2026-11-10,
    days_of_margin 186.

Step 2 -- build labeled roles.json from the real sponsorship/funding CSV:

    python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company "AVY INC" --title "Data Analyst" --role-id avy-inc-data-analyst --liveness-result live --timeline-result pass --out course/2026fa/submissions/dmehta1310/runs/roles.json

    Output: sponsorship p 0.0 tier None source record; fit p 0.7 source
    model-judgment; liveness factor 1.0 source record; timeline factor
    1.0 source record; funding_context total_funding 1475000.0,
    latest_funding_stage Pre-Seed, latest_funding_date 2016-11-14, source
    record; company_found_in_sample true.

Step 3 -- run through the existing, unmodified scorer:

    npm run score -- course/2026fa/submissions/dmehta1310/runs/roles.json --out-dir course/2026fa/submissions/dmehta1310/runs

    Output: scored 1 roles, Apply 0, Consider 1, Skip 0 (skip 0%).

### Verified vs. inferred (line by line)

- Sponsorship tier "None", p=0.0 -- record. Read directly from the Total
  Approvals column (blank, treated as 0) in the real CSV for this exact
  company row -- confirmed by hand with grep "AVY INC" ...csv
- Funding: $1,475,000, Pre-Seed, 2016-11-14 -- record. Read directly from
  total_funding / latest_funding_stage / latest_funding_date columns,
  same row -- confirmed by hand with the same grep.
- Liveness factor 1.0 -- record, but supplied manually this run. Would
  normally come from npm run ats:liveness; not run live against a real
  URL in this session.
- Timeline factor 1.0 -- record, script-computed from your-input dates.
  Computed by timeline_gate.py; the two dates that feed it are
  your-input.
- Fit p=0.7 -- model-judgment. Default value in build_roles_json.py, not
  backed by any record.
- Final recommendation: Consider -- scorer output. Produced entirely by
  the existing, unmodified role-scorer.mjs.

### Verification

Cross-checked the sponsorship tier and funding numbers by hand:
grep "AVY INC" data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
returned the raw row, confirming Total Approvals is blank (correctly
treated as 0 by the script) and the funding figures match exactly:
1475000.0, Pre-Seed, 2016-11-14.

### Deliberate break attempt

Ran the same script against a company not in the CSV:

    python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company "Totally Made Up Nonexistent Corp" --title "Data Analyst" --role-id break-test-1 --liveness-result live --timeline-result pass --out /tmp/break-test-roles.json

    Output: sponsorship p 0.0 tier NoRecordInSample source record;
    funding_context total_funding null, note "No record in sample data
    for this company."; company_found_in_sample false. Printed a warning
    to stderr: "WARNING: 'Totally Made Up Nonexistent Corp' has no record
    in the sample CSV. Sponsorship is reported as NoRecordInSample, not
    as a denial."

The script did not crash and did not invent a "will not sponsor" value --
it labeled the absence explicitly and warned the human.

### Reflection

What worked: The gate-then-vote structure held up exactly as designed --
both hard gates (liveness, CPT-timeline) fed cleanly into the existing
scorer without any modification to role-scorer.mjs, and the
absence-handling behavior (NoRecordInSample, not a denial) worked
correctly on the first deliberate break attempt.

What was missed on the first pass: The fit score is currently a flat
default (0.7) regardless of company or role -- there's no real signal
behind it yet, which weakens the "Consider" recommendation's precision.
This matches the prediction made in CHANGE-BRIEF.md about the weakest
part of the first pass, though the actual weak point turned out to be fit
rather than the timeline gate specifically.

Concrete next improvement: Replace the flat fit default with a lookup
against data/bls/compact/soc_occupation_compact.csv, using the company's
listed industry to at least approximate a SOC-code-based fit score,
rather than a single hardcoded number for every role.

---

## Attestation

- Recipe: ghost-job-radar v0.1.0
- By: Dhruvi Mehta - 2026-09-30

### Tested

- timeline_gate.py --end-date 2027-05-15 --lag-weeks 6 -> saw result
  "pass", 186 days margin -> expected pass, since the date is far in the
  future.
- timeline_gate.py --end-date 2026-10-15 --lag-weeks 8 -> saw result
  "fail", -40 days margin -> expected fail, since 8 weeks from today
  lands after the end date.
- build_roles_json.py against "AVY INC" (real CSV row) -> saw real tier
  None, real funding numbers -> expected a match to the CSV row exactly
  (confirmed by hand with grep).
- npm run score on the resulting roles.json -> saw Apply 0, Consider 1,
  Skip 0 -> expected a real scorer decision, not invented.
- python3 test_timeline_gate.py -> saw "Ran 6 tests ... OK" -> expected
  all pass.
- python3 test_build_roles_json.py -> saw "Ran 10 tests ... OK" ->
  expected all pass.
- Deliberate break attempt: build_roles_json.py against a company not in
  the CSV -> saw it run cleanly, print a NoRecordInSample label and an
  explicit stderr warning, not crash, not report a denial -> expected to
  fail safely without inventing a value.

### Did not test

- Did not run npm run ats:liveness against a real, live job-posting URL
  in this session -- liveness was supplied manually as live for the
  worked run. This is a real gap: the liveness half of the pipeline has
  not been exercised end-to-end against a live network check.
- Did not test a company name with partial/fuzzy overlap to a real CSV
  row (e.g., a typo or an abbreviation) to confirm the "no fuzzy
  matching" design behaves as documented in practice.
- Did not test the interaction of a failed CPT-timeline gate combined
  with a live posting end-to-end through the full scorer (only tested
  each gate's zeroing behavior in isolation, in the unit tests).

### Broke during testing, fixed

- Nothing broke during this round of testing. The one deliberate break
  attempt (absent company) behaved exactly as designed on the first try,
  which is itself worth noting honestly rather than manufacturing a fix
  that didn't happen.
