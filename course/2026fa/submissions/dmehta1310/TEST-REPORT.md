# TEST-REPORT.md
## ghost-job-radar -- dmehta1310

## Toolchain baseline

Ran before and after building the prototype:

- npm run doctor -- environment runnable: node v26.9.0, python3 3.12.7,
  all runnable commands present, 33/33 recipes carry lifecycle frontmatter
- npm run verify -- conformance: all conform; manifest check passed
  (3 pre-existing warnings unrelated to this contribution: archive/ not
  gitignored, private/ and data/ats/ flagged as PII-risk paths -- all
  three exist in the repo before this branch and are not introduced by
  this work)

Both commands were run again after all files in this contribution were
added, with identical results (all conform, same 3 pre-existing
warnings).

## Sample run and output

    python3 scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py --company "AVY INC" --title "Data Analyst" --role-id avy-inc-data-analyst --liveness-result live --timeline-result pass --out course/2026fa/submissions/dmehta1310/runs/roles.json

    Output: sponsorship p 0.0 tier None source record; fit p 0.7 source
    model-judgment; liveness factor 1.0 source record; timeline factor
    1.0 source record; company_found_in_sample true.

    npm run score -- course/2026fa/submissions/dmehta1310/runs/roles.json --out-dir course/2026fa/submissions/dmehta1310/runs

    Output: scored 1 roles, Apply 0, Consider 1, Skip 0 (skip 0%).

(Full output, including funding context, is in WORKED-RUN.md.)

## Failure cases exercised

1. Company absent from the sample CSV (predicted in CHANGE-BRIEF.md):

       python3 build_roles_json.py --company "Totally Made Up Nonexistent Corp" ...

       Output: sponsorship tier "NoRecordInSample", company_found_in_sample
       false, and a stderr warning: "WARNING: 'Totally Made Up Nonexistent
       Corp' has no record in the sample CSV. Sponsorship is reported as
       NoRecordInSample, not as a denial."

   Result: ran cleanly, did not crash, did not report a denial.

2. CPT/program end date already effectively passed (a failed timeline
   gate, predicted in CHANGE-BRIEF.md):

       python3 timeline_gate.py --end-date 2026-10-15 --lag-weeks 8

       Output: result "fail", days_of_margin -40.

   Result: returned a clear "result": "fail" with the negative margin
   shown, not a crash and not a silently-passed gate.

## git diff --stat (only this contribution's namespaced paths)

Touched only:
recipes/cases/2026fa/dmehta1310-case-f1-data-analyst-soc-15-2051-ghost-job-radar.md
recipes/cases/2026fa/dmehta1310-case-f1-data-analyst-soc-15-2051-ghost-job-radar.card.md
scripts/contrib/2026fa/dmehta1310-ghost-job-radar/README.md
scripts/contrib/2026fa/dmehta1310-ghost-job-radar/build_roles_json.py
scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_build_roles_json.py
scripts/contrib/2026fa/dmehta1310-ghost-job-radar/timeline_gate.py
scripts/contrib/2026fa/dmehta1310-ghost-job-radar/test_timeline_gate.py
logs/runs/2026fa-dmehta1310-1.md
course/2026fa/submissions/dmehta1310/CHANGE-BRIEF.md
course/2026fa/submissions/dmehta1310/WORKED-RUN.md

No files outside dmehta1310-namespaced paths were touched.

## What the gate requires a human to judge

- Liveness gate: a human must confirm the posting URL is actually from a
  supported ATS before trusting a "dead" result as meaningful -- an
  unsupported platform returns "unknown," which this script treats as
  not-live by default, but a human should still check why.
- CPT/program-timeline gate: a human must judge whether the hiring-lag
  estimate is realistic for the specific company and role level. The
  script only checks arithmetic compatibility between the estimate and
  the stated end date -- it cannot verify the estimate itself is
  reasonable.
