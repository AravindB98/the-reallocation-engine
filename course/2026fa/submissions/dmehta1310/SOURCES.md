# SOURCES.md
## ghost-job-radar -- dmehta1310

## Repository and governing documents

- The Reallocation Engine, by Nik Bear Brown
  (nikbearbrown/the-reallocation-engine), forked for this assignment.
- Governed by SNICKERDOODLE.md (constitution) and indexed by
  DOMAIN.md; recipe structure follows recipes/scan.md and
  recipes/local-wage-adjustment.md; card structure follows
  recipes/local-wage-adjustment.card.md.
- The 3-3-2 Split essay (referenced in the assignment) informed the
  domain-justification framing of where this recipe fits a student's
  research-and-apply time; no figures from the essay were cited directly
  in this submission, so no primary-source tracing was needed.

## Sample data used

- data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv
  -- real sponsorship history (H-1B approval counts, approval rate) and
  funding data (total funding, latest funding stage/date) per company,
  already joined in this repo-provided sample file.
- data/examples/ch11-roles.json -- used as the reference shape for
  roles.json, to confirm the exact field names and structure the
  existing scorer (scripts/score/role-scorer.mjs) expects.

## Existing repo scripts reused, unmodified

- scripts/score/role-scorer.mjs -- the scoring/gating logic itself;
  no changes made to this file.
- scripts/ats/check-liveness.mjs -- referenced in the recipe as the
  liveness-checking tool; not modified.

## Tools

- Claude (Anthropic), used as a coding and documentation assistant
  throughout this assignment -- see FRICTIONAL.md for a detailed
  account of what Claude drafted versus what I personally decided,
  checked, ran, and verified.
- Git / GitHub for version control and the pull request.
- Python 3 standard library only (argparse, csv, json, datetime,
  unittest) -- no third-party packages were added for this
  contribution's scripts.

## What AI contributed vs. what I decided, checked, changed, or rejected

Claude drafted the text and code for CHANGE-BRIEF.md, the recipe file,
the card, timeline_gate.py, build_roles_json.py, both test files, the
README, the run-log entry, and the worked-run/domain-justification
document, based on the specific persona and domain (F-1 CPT, Data
Analytics, ghost-job liveness gating) that I specified.

I personally: chose this domain over four other candidates offered to
me; corrected the visa-status framing from a generic OPT assumption to
my actual CPT situation, which changed the core design of the timeline
gate; ran every command in my own terminal and supplied the real output
pasted throughout this submission; verified the script's sponsorship and
funding output against the raw CSV by hand with grep, rather than
trusting the script's own printed claims; and chose and ran the
deliberate break-attempt test against a company absent from the sample
data.

I did not hand-write the Python logic myself, and I have not yet
independently re-derived the scorer's Bayesian weighting -- that remains
entirely the existing, unmodified tool.
