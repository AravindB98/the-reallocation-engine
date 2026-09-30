# FRICTIONAL.md
## ghost-job-radar -- dmehta1310

## What I tried, what happened

I started this assignment with no prior context on the repo at all --
first time forking it, first time reading SNICKERDOODLE.md/DOMAIN.md
style constraints, first time seeing how the existing scorer's
record/model-judgment/your-input labeling worked. My first real
checkpoint was running the example scorer command on
data/examples/ch11-roles.json to see what a "normal" output looked
like before designing my own recipe, which is what let me match the
existing "ghost-posting" row's gate-zeroing pattern instead of inventing
my own scoring behavior.

When picking a domain, I initially considered the assignment's own
example recipes (biotech, opt-countdown, salary-floor, etc.) but wanted
something more specific to my actual F-1 CPT status, which none of the
listed examples addressed directly -- they're all written assuming OPT's
90-day clock. Working out that CPT ties to program enrollment rather
than a fixed unemployment window took a real back-and-forth before
landing on the "CPT/program-timeline gate" framing instead of reusing the
repo's OPT-style visa-timeline logic unchanged.

While building build_roles_json.py, I discovered the existing scorer
only reads four evidence terms (sponsorship, fit, liveness, timeline) --
there's no dedicated funding field, even though the assignment's evidence
table lists funding as its own vote. I checked this by inspecting
data/examples/ch11-roles.json directly rather than assuming the
scorer's behavior. I decided not to invent a 5th field the tool doesn't
support; instead, funding is surfaced as funding_context, labeled and
readable in the report, but explicitly not fed into the composite score.
This is documented as a stated limitation, not hidden.

## What I checked, changed, or learned; unresolved questions

- Checked the real CSV's column headers
  (data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv)
  before writing any lookup logic, rather than guessing field names.
- Checked, by hand with grep, that the script's reported sponsorship
  tier and funding numbers for a real company ("$AVY INC") actually match
  the raw CSV row, rather than trusting the script's own printed output
  as sufficient verification.
- Unresolved: the fit score is currently a flat 0.7 default for every
  role, with no real signal behind it. I know this weakens the precision
  of the final Apply/Consider/Skip decision, and I've named a concrete
  next step (a SOC-code lookup against the BLS/O*NET data) but have not
  built it in this pass.
- Unresolved: I have not yet exercised the liveness half of the pipeline
  against a real, live npm run ats:liveness network call -- only
  supplied the result manually for the worked run.

## Human vs. AI contributions

Claude (this assistant) drafted the initial text for CHANGE-BRIEF.md,
the recipe, the card, and the Python scripts based on the persona and
domain I specified (F-1 CPT, Data Analytics, Ghost-Job Trust Radar), and
walked me through each terminal command one at a time. I made the actual
decisions on: which of the five candidate recipe domains to build (I
chose Ghost-Job Trust Radar over Network-Targets, OPT-Countdown,
Salary-Floor, and Career-Switcher framings offered to me); confirming my
real CPT (not OPT) status and correcting the framing when it mattered;
running every terminal command myself and pasting back real output at
each step; and directing the deliberate "break attempt" test against an
absent company, which Claude then helped interpret.

I accepted the gate-then-vote structure and the funding-as-context (not
a 5th scorer field) design decision as proposed. I did not modify any of
the Python logic by hand -- I ran it as given and verified its output
against the real CSV myself rather than trusting it at face value.

## Traceability

- Commits on branch contrib/2026fa-dmehta1310-ghost-job-radar: each
  deliverable (CHANGE-BRIEF, recipe, card, timeline_gate.py + test,
  build_roles_json.py + test, README, run-log, worked-run doc) was
  committed separately, in the order built.
- Terminal transcripts for every command run and its real output are
  preserved in this conversation's history and summarized in
  WORKED-RUN.md and TEST-REPORT.md.
- The one deliberate break-attempt test (absent company) and its output
  are recorded verbatim in both WORKED-RUN.md and TEST-REPORT.md.
