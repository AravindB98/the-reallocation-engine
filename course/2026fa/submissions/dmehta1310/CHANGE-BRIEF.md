# CHANGE-BRIEF.md

## Career situation
I am designing this recipe for a student like myself: a master's student in
Information Systems, targeting Data Analytics roles, currently authorized to
work under **F-1 CPT** tied to my academic program (not OPT). Unlike OPT,
CPT authorization is tied to enrollment in a specific course and to a
specific job's start/end dates, and is ultimately bounded by my program end
date rather than a fixed "90 days unemployed" clock.

The problem this solves: I have already spent real time and hope applying
to a job posting that had quietly been filled weeks before I found it — a
"ghost" posting. Because my available work window is limited and tied to my
enrollment, I cannot afford to keep spending research hours on postings
that are no longer real.

**Engine layer(s) this draws on:**
- Job-Ops (ATS liveness detection) — primary, and now a hard gate rather
  than a vote
- 80 Days to Stay (Form D funding + H-1B sponsorship history) — secondary,
  only computed after liveness and timeline gates pass
- A new timeline gate based on CPT/program-end-date logic (not the
  OPT-style 90-day clock the repo currently assumes)

## Existing data/scripts I'll reuse (exact paths)
- `scripts/ats/` — ATS liveness detection scripts (Greenhouse, Lever, Ashby,
  SmartRecruiters)
- `data/80-days-to-stay/` and `data/sec/form-d/processed/sample/` —
  sponsorship history and funding sample data
- `scripts/score/role-scorer.mjs` — the existing scorer; I will feed it a
  `roles.json` shaped like `data/examples/ch11-roles.json` rather than
  re-implementing scoring logic myself

## What I'm proposing that the repo doesn't have yet
- **A CPT/program-timeline gate** — the repo's current visa-timeline gate
  assumes an OPT-style unemployment clock. I'm proposing a
  `[TODO: DEV]` addition: a small function that takes a program end date (or
  CPT authorization end date) and a hiring-lag estimate, and returns
  pass/fail, labeled `your-input` for the dates since they come from the
  student, not a government record. Justification: CPT students are a real
  population the current OPT-only framing excludes, and the fix is a small,
  bounded addition, not a redesign of the scorer.

## Gate(s) this recipe stops at, and what a human needs to see to clear each
1. **Liveness gate** — a human sees the ATS liveness script's raw result
   (live/dead) for a specific posting URL before anything else runs. If
   dead, the recipe stops and reports "Skip — ghost posting," with no
   funding/sponsorship computation performed at all.
2. **CPT/program-timeline gate** — a human sees the stated program/CPT end
   date and the assumed hiring-lag estimate side by side, and confirms
   whether a realistic hire could complete before that date. This is a
   judgment call the human makes, not something the script can verify
   alone, since hiring-lag is an estimate.

## Predicted failure cases (at least two)
1. **A posting URL that isn't from a supported ATS** (Greenhouse, Lever,
   Ashby, SmartRecruiters) — the liveness script won't recognize it. I'll
   check this by testing against a fixture URL from an unsupported platform
   and confirming the prototype fails clearly (e.g., "liveness: unknown,
   cannot verify") rather than silently assuming it's live.
2. **A company present in the sponsorship/funding sample data but with no
   Form D record in the shipped sample** (since only a sample of quarters
   ships, not the full dataset) — I'll check this by picking a company name
   deliberately absent from `data/sec/form-d/processed/sample/*.sample.json`
   and confirming the prototype labels the funding vote as "no record found"
   rather than treating absence as a negative signal.

## One prediction about what the prototype will get wrong on the first pass
I predict the CPT/program-timeline gate will be the weakest part on the
first pass — hiring-lag is an estimate I'm inventing (labeled `your-input`),
not something backed by a record, and my first version will likely set an
unrealistic or overly simple lag assumption (e.g., a flat number of weeks)
that doesn't account for how hiring speed varies by company size or role
seniority. I expect to revise this after the first worked run once I see
how the gate behaves against real dates.
