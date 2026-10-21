# Mode Build submission — o7580 (design-engineer SOC triage)

## Executive summary

This folder is the course submission for the 100-point Mode Build assignment. The mode checks design-and-engineering job postings for an international student: is the job really interface work, which occupation code could it be filed under, has the employer sponsored that kind of job at that level, is it open, and does it fit the OPT clock. It ran against real job boards and the repository's full data on 19 October 2026. Start with the domain justification, then the worked run.

## Assignment checklist — every "must" in the brief

| The brief requires | Status | Where |
|---|---|---|
| Run at least one real, tested repo script against real data, output shown | ✅ ats:scan, detect-ats.py, ats:liveness, role-scorer | worked run §2 |
| Unbuilt scripts marked with typed TODOs, output labeled proposed | ✅ 6 typed proposals; none is shown as having run | recipe §Proposed additions |
| Mode file: status frontmatter, purpose, source inventory, proposed additions, phase gates, can/cannot verify, output contract (JSON log + Markdown report), stop conditions, log template for `logs/RUN_LOG.md` | ✅ all nine sections | recipe |
| Domain justification ≤ 1 page: who, asymmetry, engine layers, 1–2 domain failure modes | ✅ 471 words | `domain-justification.md` |
| Worked run: inputs, verbatim commands + output, verified vs inferred, verification, reflection, attestation incl. a break attempt | ✅ attestation re-signed (final) 2026-10-21 | `worked-run.md` |
| RUN_LOG entry: date, mode, inputs, outputs, result, open issues; no secrets or personal data | ✅ `recipes/_shared.md` format | `logs/runs/2026fa-o7580-2.md` |
| New scripts / sample data, no personal data | ✅ fixtures fictional; persona fictional (Ananya Iyer); raw postings kept outside the repo | `scripts/contrib/…` |
| Honest lifecycle status | ✅ DRAFT, with reasons | recipe §Lifecycle claim |
| `npm run verify` and `npm run doctor` pass | ✅ | `baseline/verify-after.txt`, `doctor-after.txt` |
| ZIP `reallocation-<yourname>-mode.zip` | ⏳ built from the commit once it exists | `SUBMISSION.md` |
| PR on branch `mode/<yourname>-<domain>`, title naming domain + stage | ⏳ branch `mode/o7580-design-engineer-soc` exists; PR not opened (no commit yet) | — |
| Five-minute in-class presentation | ⏳ outline ready | `presentation-notes.md` |

## Grader's guide — rubric line → evidence

| Rubric asks for | Where to look (one place each) |
|---|---|
| Mode is specific; named commands exist and ran | Recipe §Source inventory; every command's real output in worked run §2 |
| Verified vs inferred boundary | Recipe §What it can verify / §What it cannot verify; worked run §3 (17-line table) |
| Typed TODO proposals with rationale | Recipe §Proposed additions (6) |
| Gates are hard stops with testable conditions | Recipe §Phase gates (G0–G6); cleared by the author in `logs/runs/2026fa-o7580-2.md` |
| Output contract: agent log vs human report | Recipe §Output contract; `runs/2026-10-20-confirmed/triage-log.json` vs `triage-report.md` |
| Stop conditions (refuse rather than guess) | Recipe §Stop conditions; proven by break tests B2, B3, B5, B6 |
| Specific information asymmetry | `domain-justification.md` §The information asymmetry (all counts from shipped data) |
| Domain-specific failure modes, and who misses them | `domain-justification.md` §Failure modes |
| Real output, pasted not described | worked run §2.1–2.9 (generated from the saved files, not retyped) |
| Verification, incl. a deliberate break attempt | worked run §4; `break-tests.txt` (B1–B8); `break-tests-first-attempt.txt` (the run that found two bugs) |
| Reflection: went well / missed / next steps | worked run §5 |
| Attestation with "Did not test" | worked run, end (signed 2026-10-20) |
| Honest lifecycle claim | Recipe §Lifecycle claim (DRAFT, and why) |
| Who did what (AI vs author) | `FRICTIONAL.md` §1 |

**Three findings worth the first five minutes:**
1. No Massachusetts sponsor lists an at-level UX/product-design title with ≥3 approvals.
2. Palantir's "New Grad" design roles exclude a December-2026 graduate.
3. The 15-1255.00 AI-resilience score is blank, and the mode refuses to fill it.

## Run record (where everything is)

| Deliverable | Path |
|---|---|
| 1. Mode file (recipe) + human card | `recipes/cases/2026fa/o7580-design-engineer-soc-triage.md`, `.card.md` |
| 2. Domain justification | `course/2026fa/submissions/o7580/mode-build/domain-justification.md` |
| 3. Worked run (pasted output, verified vs inferred, verification, reflection, attestation) | `course/2026fa/submissions/o7580/mode-build/worked-run.md` |
| 4. RUN_LOG entry | `logs/runs/2026fa-o7580-2.md` (contributors may not edit `logs/RUN_LOG.md`; CI blocks it) |
| Scripts, tests, fixtures, scenario | `scripts/contrib/2026fa/o7580-design-engineer-soc-triage/` |
| Run outputs | `runs/2026-10-19-live/` (live), `runs/2026-10-20-confirmed/` (re-run with author-confirmed inputs), `runs/2027-03-01-timeshift/` (break B1), `runs/break-bls-no-15-1255/` (break B2) |
| Break attempts | `break-tests.txt` (final), `break-tests-first-attempt.txt` (the run that found two bugs) |
| Baseline / after checks | `baseline/` (verify, doctor, scorer, conformance, pii-scan) |
| Honest build log + author's review | `FRICTIONAL.md` |
| Presentation outline | `presentation-notes.md` |
| Cover sheet | `SUBMISSION.md` |

Lifecycle claimed: **DRAFT**: a live run completed and was re-run with author-confirmed inputs on 2026-10-20; 6 typed proposals open; all human gates cleared; the attestation was re-signed (final) on 2026-10-21 after a clean-clone fix.
