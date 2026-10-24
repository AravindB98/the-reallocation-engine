# Worked Run — cognitive-pivot-sponsor-fit (SOC 15-1221.00, then pooled with 15-1252.00)

## Executive summary

This is the record of two real runs of a new check. The check takes companies
that have sponsored work visas and scores them with a "how durable is this
work as AI improves" signal switched off, then switched on. Read it to see
exactly what ran, what the output was, and which parts are hard data versus
judgment.

**First attempt (one kind of job, 18 companies):** the signal changed **0 of
18** recommendations. Every company shared one occupation, so every company
got the same bonus. That null result is kept below as part of the record.

**Second attempt (two kinds of job pooled, 30 companies):** research-scientist
roles (12 more companies were added, from software-developer roles) score
higher on durability than software-developer roles. The signal still changed
**0 of 30** recommendations, but it did change the order. Every
research-role company now ranks above every software-developer company. The
reason no decision moved is a known flaw in how this check scores job fit:
fit alone already puts every matched company at the "apply" line. The
software-developer group also turned out to be a poor sample, because the
title matcher could only use a few alphabetically-first job titles for it.

Because no posting was checked for liveness, every company is reported as
"consider — liveness unchecked". Every deliberate break attempt stopped
cleanly. One of them found a real crash, which is now fixed.

## Run record

- **Dates:** attempt 1 2026-10-20 · attempt 2 2026-10-21 · **Recipe:** `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` v0.3.0
- **Executed by:** Claude Code (agent) in Om Raut's working tree; attestation signed by Om Raut, 2026-10-21 (see Attestation, which records who ran each row)
- **Code:** `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/` + one maintained-file patch, `scripts/score/role-scorer.mjs` (`--role-quality-weight`)
- **Attempt 1 artifacts:** `run/` (top level). Human report: `cognitive-pivot-sponsor-fit-2026-10-20.md`. Agent log: `logs/runs/2026fa-omraut888-2.json`
- **Attempt 2 artifacts:** `run/attempt-2-pooled/` + `run/soc-match-15-1252.00/`. Human report: `cognitive-pivot-sponsor-fit-pooled-2026-10-21.md`. Agent log: `logs/runs/2026fa-omraut888-3.json`

## Inputs

| Input | Value | Label |
|---|---|---|
| Sponsorship CSV | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270`. 30,369 rows; 1,557 with sponsored titles; **no SOC column** | record |
| O*NET/BLS compact table | `data/bls/compact/soc_occupation_compact.csv`, sha256 `bac5acf77ca2d25268c75b3706084f7f67bcc0c6e3cc68cd03e0ebd2598343d1`. 1,016 rows; 894 with a cognitive-pivot score | record |
| Target SOC(s) | attempt 1: 15-1221.00 Computer and Information Research Scientists (4.516). Attempt 2 adds 15-1252.00 Software Developers (3.834) | your-input (choice of targets); scores are record |
| role_quality weights | 0 (scorer default, `[VERIFY]`) vs **0.15**, the weight PR #3 proposed but did not implement, carried forward on purpose | your-input |
| Persona | none read. The mode is persona-agnostic in computation, and no timeline is modeled | — |

# Attempt 1 — single SOC (15-1221.00), 2026-10-20: the null result, kept as record

This first attempt could not show an effect, for the reason given below. It is kept
unedited rather than replaced, in the same way PR #3 kept its rejected-fix attempts.

## Attempt 1 — commands and real output

```text
# Verbatim terminal output. Only substitution: absolute machine paths → $SCRATCH (a session scratch dir outside the repo), <repo>, $TMPDIR.

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/title-to-soc.py --soc 15-1221.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out course/2026fa/submissions/omraut888/run/soc-match-15-1221.00
SOC 15-1221.00: 11 phrases (excluding ['engineer', 'scientist', 'scientists', 'specialist']); 1557 companies had sponsored titles; 18 matched, 1539 did not
  course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json
[exit 0]

$ cmp course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json /tmp/soc-match-output-v2/soc-match-output.json && echo IDENTICAL-to-earlier-v2-output
IDENTICAL-to-earlier-v2-output
[exit 0]

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --out course/2026fa/submissions/omraut888/run/roles.json
SOC 15-1221.00 cognitive_pivot_score 4.516 → role_quality.p 0.8895 (scale 1.611–4.877, 894 scored rows)
  18 roles written, 0 excluded; liveness + timeline written as explicit your-input factor 1 (NOT verified)
  course/2026fa/submissions/omraut888/run/roles.json
[exit 0]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/roles.json --out-dir course/2026fa/submissions/omraut888/run/weight-0.0
✓ scored 18 roles → Apply 18 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/omraut888/run/weight-0.0/role-scores.json  +  course/2026fa/submissions/omraut888/run/weight-0.0/role-scores.md
[exit 0]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/roles.json --role-quality-weight 0.15 --out-dir course/2026fa/submissions/omraut888/run/weight-0.15
✓ scored 18 roles → Apply 18 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/omraut888/run/weight-0.15/role-scores.json  +  course/2026fa/submissions/omraut888/run/weight-0.15/role-scores.md
[exit 0]

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py --roles course/2026fa/submissions/omraut888/run/roles.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --before course/2026fa/submissions/omraut888/run/weight-0.0/role-scores.json --after course/2026fa/submissions/omraut888/run/weight-0.15/role-scores.json --date 2026-10-20 --md-out course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-2026-10-20.md --log-out logs/runs/2026fa-omraut888-2.json
18 roles · role_quality weight 0 → 0.15 · decisions changed: 0 · Apply → 'Consider — liveness unchecked': 18
  course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-2026-10-20.md
  logs/runs/2026fa-omraut888-2.json
[exit 0]

$ python3 -m unittest scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/test_cognitive_pivot_roles_builder.py
.....STOP: $TMPDIR/tmpXXXX/roles.json was not written by cognitive-pivot-roles-builder.py — refusing to report on roles whose provenance is unknown
........STOP: missing: no-cognitive-pivot-score — 44-0000.00 (Blank) has a blank cognitive_pivot_score in $TMPDIR/tmpXXXX/compact.csv; refusing to substitute 0 or an average
......
----------------------------------------------------------------------
Ran 19 tests in 0.013s

OK
[exit 0]
```

### The diff: which recommendations changed

Extracted from `run/weight-0.0/role-scores.json` and `run/weight-0.15/role-scores.json`:

| Company | Composite @0 | Composite @0.15 | Scorer @0 → @0.15 | Changed? | Reported to the human |
|---|---|---|---|---|---|
| AIERA INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| AURIS HEALTH INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| BLADE THERAPEUTICS INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| BUTLR TECHNOLOGIES INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| CHARMED AI INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| CLADE THERAPEUTICS INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| DATAVISOR INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| DEXCARE INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| GENIES INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| GENOMATICA INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| GRETEL LABS INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| MARLINSPIKE THERAPEUTICS INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| MENDEL HEALTH INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| MODULAR INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| OUTREACH CORP | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| RELAY THERAPEUTICS INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| UNIQUIFY INC | 0.65 | 0.7834 | Apply → Apply | no | Consider — liveness unchecked |
| WYZE LABS INC | 0.6391 | 0.7725 | Apply → Apply | no | Consider — liveness unchecked |

**Result: 0 of 18 recommendations changed.** Here is why, with the real numbers:
- Role quality added 0.8895 × 0.15 = **0.1334** to every row. All 18 share one SOC, so they share one score. The one row that differs is WYZE LABS, whose sponsorship ratio is 62/64 = 0.9688 (it moves 0.6391 → 0.7725). Every other row moves 0.65 → 0.7834.
- The lowest composite *before* was 0.6391, already ≥ the 0.30 Apply threshold. The scorer sums weights without renormalizing, so a positive weight can only raise a score. No positive weight could have changed a decision on this set.
- Fit = 1.0 × 0.30 = 0.30 on its own already reaches the threshold. This is a design flaw that the run exposed (see Reflection).

## Attempt 1 — deliberate break attempts

```text
# Verbatim terminal output. Only substitution: absolute machine paths → $SCRATCH (a session scratch dir outside the repo), <repo>, $TMPDIR.

# Break 1 — the required one: full pipeline against 15-2051.00 (Data Scientists, blank cognitive_pivot_score)
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/title-to-soc.py --soc 15-2051.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out course/2026fa/submissions/omraut888/run/break-15-2051.00/soc-match
SOC 15-2051.00: 9 phrases (excluding ['engineer', 'scientist', 'scientists', 'specialist']); 1557 companies had sponsored titles; 55 matched, 1502 did not
  course/2026fa/submissions/omraut888/run/break-15-2051.00/soc-match/soc-match-output.json
[exit 0]

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-2051.00 --matches course/2026fa/submissions/omraut888/run/break-15-2051.00/soc-match/soc-match-output.json --out course/2026fa/submissions/omraut888/run/break-15-2051.00/roles.json
STOP: missing: no-cognitive-pivot-score — 15-2051.00 (Data Scientists) has a blank cognitive_pivot_score in data/bls/compact/soc_occupation_compact.csv; refusing to substitute 0 or an average
[exit 3]

$ ls course/2026fa/submissions/omraut888/run/break-15-2051.00
soc-match
[exit 0]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/break-15-2051.00/roles.json --out-dir course/2026fa/submissions/omraut888/run/break-15-2051.00/scored
Usage: role-scorer.mjs <roles.json> [--profile p.json] [--out-dir dir] [--md report.md]
[exit 2]

# Break 2 — out-of-range weight (gate G3)
$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/roles.json --role-quality-weight 1.5 --out-dir $SCRATCH/break-weight
role-scorer: --role-quality-weight must be a number in [0, 1]; got "1.5" — refusing (not clamping).
[exit 2]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/roles.json --role-quality-weight abc --out-dir $SCRATCH/break-weight
role-scorer: --role-quality-weight must be a number in [0, 1]; got "abc" — refusing (not clamping).
[exit 2]

$ ls $SCRATCH/break-weight
ls: $SCRATCH/break-weight: No such file or directory
[exit 1]

# Break 3 — report fed a roles file with no liveness disclosure (a plain Ch.11 fixture)
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py --roles data/examples/ch11-roles.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --before course/2026fa/submissions/omraut888/run/weight-0.0/role-scores.json --after course/2026fa/submissions/omraut888/run/weight-0.15/role-scores.json --md-out $SCRATCH/break-report.md --log-out $SCRATCH/break-report.json
STOP: data/examples/ch11-roles.json was not written by cognitive-pivot-roles-builder.py — refusing to report on roles whose provenance is unknown
[exit 3]

$ ls $SCRATCH/break-report.md
ls: $SCRATCH/break-report.md: No such file or directory
[exit 1]
```

Break 3 **before** the fix. It was found by the break attempt, not foreseen. The paths shown are from before the files moved into the student namespace:

```text
# Verbatim terminal output. Only substitution: absolute machine paths → $SCRATCH (a session scratch dir outside the repo), <repo>, $TMPDIR.

# BEFORE FIX (2026-10-20, pre-namespace-move paths: runs/ = later course/2026fa/submissions/omraut888/run/) — report crashed on a foreign roles file

$ python3 scripts/score/cognitive-pivot-report.py --roles data/examples/ch11-roles.json --matches runs/soc-match-15-1221.00/soc-match-output.json --before runs/weight-0.0/role-scores.json --after runs/weight-0.15/role-scores.json --md-out runs/break-report.md --log-out runs/break-report.json
Traceback (most recent call last):
  File "<repo>/scripts/score/cognitive-pivot-report.py", line 303, in <module>
    sys.exit(main())
             ^^^^^^
  File "<repo>/scripts/score/cognitive-pivot-report.py", line 287, in main
    d = build(args)
        ^^^^^^^^^^^
  File "<repo>/scripts/score/cognitive-pivot-report.py", line 81, in build
    soc = roles_doc["soc_target"]
          ~~~~~~~~~^^^^^^^^^^^^^^
TypeError: list indices must be integers or slices, not str
[exit 1]
```

## Scorer-flag regression check (default behaviour unchanged)

Run in a scratch directory against `git show HEAD:scripts/score/role-scorer.mjs`. The output was captured in the session, not in a transcript file:

```
ch11-roles roles identical: True | md identical: True
gate-behavior-roles roles identical: True | md identical: True
```

Refusals: `--role-quality-weight 1.5`, `-0.1`, `abc`, `""`, and no value all printed
`role-scorer: --role-quality-weight must be a number in [0, 1]; got … — refusing (not clamping).` and exited 2.
`--role-quality-weight 1` was accepted (exit 0), since the bound is inclusive.


# Attempt 2 — pooled, 15-1221.00 + 15-1252.00, 2026-10-21

Why: attempt 1's reflection named pooling as the next step, because a role-quality
weight can only act *between* occupations. Both groups are normalized on the **same**
observed range (1.611–4.877 over 894 scored rows). The builder computes that range
once from the whole table and refuses to run if the targets' ranges disagree, so
15-1221.00 → 0.8895 and 15-1252.00 → 0.6806 are directly comparable.

## Attempt 2 — commands and real output

The transcript has no path substitutions; every path in it is repo-relative.

```text
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/title-to-soc.py --soc 15-1252.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out course/2026fa/submissions/omraut888/run/soc-match-15-1252.00
SOC 15-1252.00: 10 phrases (excluding ['engineer', 'scientist', 'scientists', 'specialist']); 1557 companies had sponsored titles; 12 matched, 1545 did not
  course/2026fa/submissions/omraut888/run/soc-match-15-1252.00/soc-match-output.json
[exit 0]

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --soc 15-1252.00 --matches course/2026fa/submissions/omraut888/run/soc-match-15-1252.00/soc-match-output.json --out course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json
SOC 15-1221.00 cognitive_pivot_score 4.516 → role_quality.p 0.8895 (scale 1.611–4.877, 894 scored rows)
SOC 15-1252.00 cognitive_pivot_score 3.834 → role_quality.p 0.6806 (scale 1.611–4.877, 894 scored rows)
  30 roles written, 0 excluded; liveness + timeline written as explicit your-input factor 1 (NOT verified)
  course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json
[exit 0]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json --out-dir course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.0
✓ scored 30 roles → Apply 30 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.0/role-scores.json  +  course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.0/role-scores.md
[exit 0]

$ node scripts/score/role-scorer.mjs course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json --role-quality-weight 0.15 --out-dir course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.15
✓ scored 30 roles → Apply 30 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.15/role-scores.json  +  course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.15/role-scores.md
[exit 0]

$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py --roles course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1252.00/soc-match-output.json --before course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.0/role-scores.json --after course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.15/role-scores.json --date 2026-10-21 --md-out course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-pooled-2026-10-21.md --log-out logs/runs/2026fa-omraut888-3.json
30 roles · role_quality weight 0 → 0.15 · decisions changed: 0 · Apply → 'Consider — liveness unchecked': 30
  course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-pooled-2026-10-21.md
  logs/runs/2026fa-omraut888-3.json
[exit 0]
```

## Inspecting the 15-1252.00 matches (same rigor as attempt 1)

**12 of the 1,557 sponsors with titles matched; 1,545 did not.** Every matched phrase begins with "application":
application engineer ×6 titles, application developer ×5, application architect ×2, application analyst ×1.
There is no overlap with the 18 companies from 15-1221.00. Per-title reading
(**model-judgment by the agent; no human has checked this group**):

| Company | Sponsored title | Phrase | Agent reading |
|---|---|---|---|
| AVA LABS INC | NodeJS Application Security Engineer | application engineer | doubtful — security engineering (closer to 15-1212 Information Security Analysts) |
| AXIA TECHNOLOGIES LLC | Application software developer | application developer | plausible |
| ELECTRIC HYDROGEN CO | Sales Application Engineer | application engineer | doubtful — sales engineering (closer to 41-9031) |
| FLYWIRE CORP | Application Security Engineer | application engineer | doubtful — security engineering |
| HUMAN INC | Senior Application Architect | application architect | plausible (architect; could be 15-1299) |
| HUMAN INC | Lead Application Architect | application architect | plausible (architect; could be 15-1299) |
| IMMUNITYBIO INC | Application Systems Analyst-Dynamics AX | application analyst | doubtful — ERP systems analyst (closer to 15-1211) |
| MAVEN TECHNOLOGIES INC | Software Application Developer | application developer | plausible |
| SNAPDOCS INC | Application Security Engineer | application engineer | doubtful — security engineering |
| TAS ENERGY INC | Application Engineer | application engineer | doubtful — "Application Engineer" at an energy/HVAC company is usually not software |
| TRUNK TECHNOLOGIES INC | Business Application Developer | application developer | plausible |
| TYLER TECHNOLOGIES INC | Application Developer | application developer | plausible |
| TYLER TECHNOLOGIES INC | .Net Application Developer | application developer | plausible |
| ZUORA INC | Principal Application Support Engineer | application engineer | doubtful — application *support* (closer to 15-1232/15-1299) |

That gives roughly **5 plausible and 7 doubtful** (model judgment). This group is much noisier than the
15-1221.00 group.

**Why the group is skewed (a coverage defect in the input, found here).** The compact table's
`alternate_titles_sample` keeps only the first 8 alternate titles in alphabetical order. For 15-1252.00 that is
8 of 93: "AI Specialist", "Application Analyst", "Application Architect" … "Application Programmer". The
occupation's own title is plural ("Software Developers"), so the phrase "software developers" needs the word
"developers", and a title of "Software Developer" never matches. To size what is missed, I ran an ad-hoc check.
It is *not* a stored script, and its result is not used anywhere in scoring:

```text
$ python3 -c "
import csv,ast,re
n=0;ex=[]
for r in csv.DictReader(open('data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',encoding='utf-8',errors='replace')):
  raw=r.get('top_job_titles_sponsored') or ''
  if not raw.strip(): continue
  try: ts=ast.literal_eval(raw)
  except Exception: ts=[raw]
  if any(re.search(r'\bsoftware (developer|engineer)\b',str(t).lower()) for t in ts): n+=1
print('companies with a title containing \"software developer\"/\"software engineer\" (whole phrase):',n)
"
companies with a title containing "software developer"/"software engineer" (whole phrase): 465
```

So the matcher's 12 companies stand in for an occupation where at least 465 sponsors list an obviously
relevant title. 15-1221.00 has the same truncation (8 of 31 alternate titles), which means attempt 1's 18
matches were also drawn from a partial phrase list.

## Attempt 2 — the diff: which recommendations changed

Ranks come from `logs/runs/2026fa-omraut888-3.json`, with ties broken alphabetically:

| Rank @0 → @0.15 | Company | SOC | Composite @0 | Composite @0.15 | Scorer @0 → @0.15 | Changed? |
|---|---|---|---|---|---|---|
| 1 → 1 | AIERA INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 2 → 2 | AURIS HEALTH INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 5 → 3 | BLADE THERAPEUTICS INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 6 → 4 | BUTLR TECHNOLOGIES INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 7 → 5 | CHARMED AI INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 8 → 6 | CLADE THERAPEUTICS INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 9 → 7 | DATAVISOR INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 10 → 8 | DEXCARE INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 11 → 9 | GENIES INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 12 → 10 | GENOMATICA INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 13 → 11 | GRETEL LABS INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 15 → 12 | MARLINSPIKE THERAPEUTICS INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 17 → 13 | MENDEL HEALTH INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 18 → 14 | MODULAR INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 19 → 15 | OUTREACH CORP | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 20 → 16 | RELAY THERAPEUTICS INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 23 → 17 | UNIQUIFY INC | 15-1221.00 | 0.65 | 0.7834 | Apply → Apply | no |
| 26 → 18 | WYZE LABS INC | 15-1221.00 | 0.6391 | 0.7725 | Apply → Apply | no |
| 3 → 19 | AVA LABS INC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 4 → 20 | AXIA TECHNOLOGIES LLC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 14 → 21 | IMMUNITYBIO INC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 16 → 22 | MAVEN TECHNOLOGIES INC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 21 → 23 | SNAPDOCS INC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 22 → 24 | TAS ENERGY INC | 15-1252.00 | 0.65 | 0.7521 | Apply → Apply | no |
| 24 → 25 | HUMAN INC | 15-1252.00 | 0.647 | 0.7491 | Apply → Apply | no |
| 25 → 26 | ZUORA INC | 15-1252.00 | 0.6431 | 0.7452 | Apply → Apply | no |
| 27 → 27 | ELECTRIC HYDROGEN CO | 15-1252.00 | 0.6341 | 0.7362 | Apply → Apply | no |
| 28 → 28 | TYLER TECHNOLOGIES INC | 15-1252.00 | 0.6324 | 0.7345 | Apply → Apply | no |
| 29 → 29 | FLYWIRE CORP | 15-1252.00 | 0.6316 | 0.7337 | Apply → Apply | no |
| 30 → 30 | TRUNK TECHNOLOGIES INC | 15-1252.00 | 0.6182 | 0.7203 | Apply → Apply | no |

**Result: 0 of 30 recommendations flipped.** All 30 are Apply at both weights, and all 30 are reported as
"Consider — liveness unchecked". What the weight *did* do, in real numbers:
- It adds 0.8895 × 0.15 = **0.1334** to each 15-1221.00 role and 0.6806 × 0.15 = **0.1021** to each 15-1252.00 role, a **0.0313** gap.
- At weight 0, **23 of 30 roles are tied at exactly 0.65** (17 research, 6 software). At 0.15 that tie splits
  cleanly by occupation: the lowest 15-1221.00 composite (0.7725) is above the highest 15-1252.00 composite (0.7521).
  Most of the rank moves in the table are tie-breaks being replaced by a real difference.
- **8 strict reversals**, where a company that scored lower now scores higher, and all eight involve one
  company. WYZE LABS (15-1221.00, sponsorship 62/64 = 0.9688) went from 0.6391, below eight 15-1252.00 companies,
  to 0.7725, above all twelve of them. A reversal can only happen when two companies' sponsorship ratios differ by
  less than 0.0313 / 0.35 ≈ 0.0894.

**Does the fit = 1.0 flaw still fully suppress the weight's effect on decisions? Yes, completely.**
With fit at 1.0, fit alone contributes 1.0 × 0.30 = 0.30, which equals the Apply threshold. Sponsorship and role
quality only ever add to that, so every matched role is Apply at every weight. That holds with one SOC, with
two, or with any spread between them. The 0.0313 spread between 4.516 and 3.834 is wide enough to **reorder**
the list. It cannot be wide enough to move a decision while fit is 1.0. As instructed, the flaw was not patched
here, so that both attempts share the same scoring rule and the comparison stays trustworthy.

## Attempt 2 — deliberate break attempts

```text
# Break 4 — pooled run where one target (15-2051.00) has a blank score
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --soc 15-2051.00 --matches course/2026fa/submissions/omraut888/run/break-15-2051.00/soc-match/soc-match-output.json --out course/2026fa/submissions/omraut888/run/attempt-2-pooled/break-roles.json
STOP: missing: no-cognitive-pivot-score — 15-2051.00 (Data Scientists) has a blank cognitive_pivot_score in data/bls/compact/soc_occupation_compact.csv; refusing to substitute 0 or an average
[exit 3]

$ ls course/2026fa/submissions/omraut888/run/attempt-2-pooled
roles.json
transcript-pooled-break.txt
transcript-pooled-run.txt
weight-0.0
weight-0.15
[exit 0]

# Break 5 — unpaired --soc/--matches
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-1221.00 --soc 15-1252.00 --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --out course/2026fa/submissions/omraut888/run/attempt-2-pooled/break-roles.json
STOP: give one --matches per --soc, and each SOC once
[exit 2]

# Break 6 — pooled roles file, but a --matches file missing for one SOC
$ python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py --roles course/2026fa/submissions/omraut888/run/attempt-2-pooled/roles.json --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --before course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.0/role-scores.json --after course/2026fa/submissions/omraut888/run/attempt-2-pooled/weight-0.15/role-scores.json --md-out course/2026fa/submissions/omraut888/run/attempt-2-pooled/break.md --log-out course/2026fa/submissions/omraut888/run/attempt-2-pooled/break.json
STOP: no --matches file given for ['15-1252.00']
[exit 3]

$ ls course/2026fa/submissions/omraut888/run/attempt-2-pooled/break.md
ls: course/2026fa/submissions/omraut888/run/attempt-2-pooled/break.md: No such file or directory
[exit 1]
```

## Human spot-check of the 15-1221.00 matches — Om Raut (first person, unedited)

> **Om Raut, 2026-10-21:**
>
> "I personally reviewed 5 of the 18 company/title matches and found that 4
> were reasonably consistent with AI-related technical work, while 1 was a
> weaker match. AI/DS Engineer, Senior Computer Vision Scientist, Senior
> Applied Scientist, and Senior Software Engineer (AI Platform) all appear
> relevant to AI development or research. However, Scientist II, Computational
> Chemist was less clear because computational chemistry does not necessarily
> involve AI or computer science research. This manual review showed me that
> keyword matching can identify plausible candidates, but it can also produce
> false positives when a title is only indirectly related to the target
> occupation."

*Agent note: this note is bookkeeping only and does not rephrase the finding above.* The five titles map to these
rows of attempt 1: AIERA INC (AI/DS Engineer), AURIS HEALTH INC (Senior Computer Vision Scientist), OUTREACH CORP
(Senior Applied Scientist), WYZE LABS INC (Senior Software Engineer (AI Platform)), and RELAY THERAPEUTICS INC
(Scientist II, Computational Chemist). This is separate from the BLADE/CLADE finding. That finding was an agent reading of the v2 matches, relayed into
this session through a chat instruction from the assistant coordinating the work. It is model judgment, not a human
finding. Om's review is the only first-person human check in the record. It also independently agrees with the agent's own earlier flag on RELAY,
which the attempt-1 report labelled as model judgment ("same shape"). With this check, RELAY moves from
model-judgment to a human finding. MARLINSPIKE ("Computational Biophysicist") remains agent judgment only.
How the five were chosen is not recorded here, so they should not be treated as a random sample.

**The convergence:** three companies now carry the same false-positive shape: BLADE THERAPEUTICS and CLADE
THERAPEUTICS ("Senior Scientist, Computational Biology") and RELAY THERAPEUTICS ("Scientist II, Computational
Chemist"). They come from two sources: **agent / model judgment** (BLADE and CLADE, plus the agent's earlier flag
on RELAY) and **one genuine human check** (Om Raut's 5-title spot-check, which happened to include RELAY and
independently agreed with the agent's flag). Only RELAY is human-confirmed; BLADE and CLADE are not. Each matches the phrase "computational scientist" because
"computational" and "scientist" both appear in the title, while the work is a natural science, not computer-science
or AI research. That makes this a systematic weakness of bag-of-words phrase matching, not a one-off edge case.

## Verified vs. inferred, line by line

| Claim in the output | Label | How it was established |
|---|---|---|
| 1,557 sponsors have sponsored titles; 18 match, 1,539 do not | record (script-output) | `title-to-soc.py` count over the CSV; two runs byte-identical (`cmp`) |
| Each of the 18 titles contains every word of an O*NET phrase | record | phrase matcher; visible per row in the report |
| Those 18 titles *are* SOC 15-1221.00 jobs | **model-judgment / proxy** | not established. The CSV has no SOC field; the phrase rule is a judgment about which words identify the occupation |
| BLADE/CLADE "Computational Biology" are not CS research | model-judgment | agent reading, relayed via chat instruction — not a human finding |
| RELAY "Computational Chemist" is a weaker, likely false-positive match | your-input (human finding) | Om Raut's 5-title spot-check, 2026-10-21; agrees with the agent's earlier model-judgment flag |
| MARLINSPIKE "Computational Biophysicist" shares the same shape | model-judgment | agent reading only; not human-checked |
| 4 of 5 spot-checked 15-1221.00 titles are sound | your-input (human finding) | Om Raut's spot-check of 5 of 18; not a full audit |
| sponsorship.p (e.g. WYZE 0.9688 = 62/64) | record | CSV `Total Approvals`/`Total Denials`; cross-checked against the CSV's own `Approval_Rate` 96.875 |
| fit.p = 1.0 | model-judgment | value specified by the human; the phrase rule is a judgment |
| cognitive_pivot_score 4.516 (15-1221.00), 3.834 (15-1252.00), blank (15-2051.00) | record | compact CSV, read directly |
| role_quality.p = 0.8895 | record → arithmetic | (4.516 − 1.611) / (4.877 − 1.611); bounds computed from the file. *Choice* of min-max is your-input |
| weight 0.15 | your-input | carried forward from PR #3; not pinned by Ch.11 |
| composites 0.65 / 0.7834 / 0.6391 / 0.7725 | script-output | `role-scorer.mjs`, unmodified math |
| liveness factor 1 | **your-input: NOT verified** | no `ats:liveness` run. Factor 1 only so the multiplication runs |
| timeline factor 1 | **your-input: not applicable** | no persona or visa clock in this mode |
| "Consider — liveness unchecked" ×18 | script-output of a rule | G4 post-processing in `cognitive-pivot-report.py` |
| "0 decisions changed" | script-output | diff of the two scorer JSONs (table above) |
| 15-1221.00 vs 15-1252.00 gap 0.0313 at w = 0.15 | arithmetic on record values → **script-output in attempt 2** | attempt 1: arithmetic only. Attempt 2: confirmed by real scorer runs (0.7834 − 0.7521) |
| attempt 2: 12 matched / 1,545 not for 15-1252.00 | record (script-output) | `title-to-soc.py --soc 15-1252.00` |
| attempt 2: role_quality.p 0.6806 for 15-1252.00, on the same range as 0.8895 | record → arithmetic | (3.834 − 1.611) / 3.266; the builder asserts both targets share one range |
| attempt 2: 0 of 30 decisions changed; 23-way tie at 0.65 split by SOC; 8 strict reversals (all WYZE LABS) | script-output | diff of `attempt-2-pooled/weight-0.0` vs `weight-0.15`; ranks and inversions in the agent log |
| attempt 2: ~5 of 12 software-developer matches plausible, ~7 doubtful | **model-judgment** | agent reading of titles; no human check |
| alternate titles available to the matcher: 8 of 31 (15-1221.00), 8 of 93 (15-1252.00) | record | compact CSV `alternate_titles_sample` vs `alternate_title_count` |
| ≥ 465 sponsors list a "software developer/engineer" title | script-output of an **ad-hoc** check | one-off command, not a stored script; used only to size the coverage gap |

## Attestation
- Recipe: omraut888-cognitive-pivot-sponsor-fit v0.3.0
- By: Om Raut · 2026-10-21

### Tested
The **Who ran it** column records who executed each row: *personally re-run* means Om Raut executed it, and *re-run by agent, reviewed by Om Raut* means the agent executed it and Om Raut reviewed the output without re-executing it.

| Ran | Saw | Expected | Who ran it |
|---|---|---|---|
| npm run verify | 165 files conform, 3 pre-existing manifest warnings, exit 0 | clean conformance | personally re-run |
| Full test suite (24 tests) | 24/24 pass, including the two deliberate STOP cases (unknown provenance; missing cognitive_pivot_score) | all tests green | personally re-run |
| node role-scorer.mjs (pooled, weight 0.0) | 30 roles, Apply 30/Consider 0/Skip 0 | matches saved run/attempt-2-pooled/weight-0.0 byte-for-byte | personally re-run |
| node role-scorer.mjs (pooled, --role-quality-weight 0.15) | 30 roles, Apply 30/Consider 0/Skip 0 | matches saved run/attempt-2-pooled/weight-0.15 byte-for-byte | personally re-run |
| Deliberate break: pool with 15-2051.00 (blank cognitive_pivot_score) | STOP: missing: no-cognitive-pivot-score, exit 3, no roles written | refuses rather than substituting 0 or an average | re-run by agent, reviewed by Om Raut |
| Deliberate break: --role-quality-weight 1.5 / -0.1 / "abc" / "" / missing | exit 2, refused, never clamped | explicit refusal on out-of-range or invalid weight | re-run by agent, reviewed by Om Raut |

### Did not test
- Whether the 18 matched 15-1221.00 titles or the 12 matched 15-1252.00 titles are actually correctly SOC-classified by the employer — only a 5-title personal spot-check was done (4/5 judged sound), not a full audit of either group.
- Whether posting liveness holds for any of these 30 companies — no live ATS check was run; every role is explicitly labeled liveness unchecked and downgraded from Apply to Consider in the human report.
- The --profile (non-sponsorship) path in combination with --role-quality-weight.
- A sponsor record with denials > 0 near the decision threshold — none exists in this 30-role sample.
- Whether the full, untruncated O*NET alternate-title list would change the match set — the compact table currently exposes only 8 alphabetically-first alternate titles per SOC code.

### Broke during testing, fixed
- The report script crashed with a TypeError when given a roles file it hadn't written itself; fixed by making it refuse explicitly (STOP: ... not written by cognitive-pivot-roles-builder.py, exit 3) instead of crashing. Added a regression test.
- Two test-time errors during the pooled extension (missing-column handling; an incomplete fixture) — both fixed, logged in logs/runs/2026fa-omraut888-3.md.

## Reflection

### Attempt 1 (as written 2026-10-20, unedited)

**What went well.** The stop conditions held under deliberate attack. A
blank score stopped the run with a named reason, an out-of-range weight was
refused, and a file of unknown provenance was refused. The PR #3 deduction
(an unverified gate that looked verified) cannot recur silently. Every role
carries a liveness label that says NOT verified, and the report refuses
input that lacks it.

**What the mode got wrong or missed.**
1. *It tested the weight on a set that cannot respond to it.* Role quality is
   a property of the occupation. In a one-occupation run it is a constant, so
   the before/after comparison was guaranteed to show no reordering. I
   should have predicted this before running.
2. *Fit = 1.0 makes the decision independent of the evidence.* 1.0 × 0.30
   already equals the Apply threshold, so a matched role is Apply even with
   zero sponsorship. Skip rate is 0%; a healthy run skips at least half. The
   scorer is ranking here, not triaging.
3. *Small-sample sponsorship.* 8 of 18 companies have ≤ 4 petitions, and a
   2-for-2 record counts the same as 276-for-276.
4. *The title proxy has a known false-positive shape* ("Scientist, Computational
   <natural science>"). It hits at least two companies and possibly four.

**Next steps (concrete).**
1. Run the same pipeline for 15-1252.00 Software Developers and pool the two role sets. That is the first test in which a role_quality weight can actually change a decision.
2. Replace fit = 1.0 with a value that cannot clear the threshold on its own. This is a `DEFINE` for the human, e.g. fit tied to the number of matched titles; any number chosen must be labelled your-input.
3. Shrink sponsorship ratios toward a prior for small n, reusing PR #3's volume-weighted shrinkage rather than inventing a new one.
4. Run `npm run ats:liveness` on one real posting per shortlisted company. That is the RUNNABLE-LIVE gate.
5. Close the gap behind 15-2051.00 upstream (`scripts/bls/extract-soc-occupation-table.py`): find out *why* the score is blank, rather than estimating it.

### Attempt 2 (2026-10-21)

**My attempt-1 prediction was wrong.** Next step 1 said pooling would be "the first test in which a
role_quality weight can actually change a decision". It could not. The fit = 1.0 flaw (attempt-1 item 2) caps the
effect at reordering, and I should have connected those two items before predicting. Pooling did produce a real,
non-null effect: the weight now separates the two occupations, and one company (WYZE LABS) truly overtakes eight.
But a reordering inside "Apply" is not a triage decision.

**What attempt 2 found that attempt 1 missed.** The title matcher's input is truncated to 8 alphabetically-first
alternate titles per occupation. For software developers that meant 12 mostly "application …" matches standing in
for an occupation where at least 465 sponsors list a plainly relevant title. Attempt 1's 18 matches came from the
same truncated list (8 of 31). The comparison group is therefore not a fair sample, and any ordering between the
groups is a weak hint at best.

**Next steps, revised.** (1) Fix fit first. Without that, no weight test can show a decision change, so it moves
ahead of every other item. (2) Get the full O*NET alternate-title list (a `DATA SOURCE` for the human) and use
singular forms of occupation titles. Then re-run both groups. (3) Have a human read the 12 software-developer matches.

**Human spot-check (Om Raut).** A human (Om Raut) independently spot-checked 5 of the 18 matches from the
15-1221.00 run. 4 of the 5 were sound. The fifth (RELAY, "Computational Chemist") was the same known false-positive
pattern as BLADE/CLADE. That is 4 of 5 (80%) manual spot-check precision **on a 5-title sample only**. It is not
an audit of all 18, it is not a random sample, and it says nothing about the 12 new 15-1252.00 matches, which no
human has checked. It does establish that the "computational <natural science>" shape is a recurring pattern,
which attempt-1 reflection item 4 had only suspected.

