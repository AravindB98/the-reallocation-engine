# Sponsorship evidence triage — human card

## Executive summary

Turn uncertain sponsorship evidence into a next-action queue. This offline demonstration reads real company records and fictional role inputs. It never confirms present sponsorship or work eligibility and stops before a human decides to act.

**Audience:** early-career Information Systems applicants comparing technical role families. **Stage:** RUNNABLE-SAMPLE; sample review complete; live gates not cleared. **Recipe:** `recipes/cases/2026fa/edden-nu-sponsor-fit.md`.

## Run and inspect

From repository root, with Python 3.9+ and Node 20+:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/card-demo
```

Use a new directory each time. Read its `report.md` and inspect `run.json`. To test:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
```

## Read the result

| Result | Meaning / next action |
|---|---|
| Apply | Candidate for human review, then tailor; no authorization or sponsorship promise |
| Consider | Resolve policy through networking or build missing skill evidence |
| Skip | Named closed gate or policy restriction; skip this opening |
| Blocked | Evidence missing; resolve it before deciding |

**Sources:** shipped company CSV, existing liveness classifier, fictional Aarav Patel skill lists, and synthetic snapshots/timing. `record` means observed file/tool content; `your-input` means invented sample inputs; `model-judgment` means interpretations and rules, not live model calls.

## Check before trusting

Company history does not establish an opening's policy. A blank is not zero. Short page content can be incomplete loading. Missing timing blocks rather than passes. Skill-list presence does not prove proficiency. A human must inspect evidence and actual authorization/timing before any real use. No live requests, external messages, applications, or automatic human clearance occur.

## Latest build

Recipe v1.1.0 is RUNNABLE-SAMPLE. New execution and verification: `course/2026fa/submissions/edden-nu/build-20261019/WORKED-RUN.md`. Sample review recorded in `course/2026fa/submissions/edden-nu/build-20261019/HUMAN-REVIEW.md`; live use remains unapproved.
