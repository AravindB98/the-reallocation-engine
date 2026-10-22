# Backend pivot-range — human card

## Executive summary

**What this is:** a one-page guide to a small tool for an international new-grad backend engineer deciding which backend-type postings (backend, data engineer, platform/SRE, QA, full stack) deserve tailoring time on AI-resilience grounds.

**Why read it:** the government occupation data behind "AI-resilient work" files the same job under different occupations depending on spelling, and most of its score gaps are inside its own measurement error. The tool shows both before you rely on a number.

**What it decides:** nothing. For each posting it suggests prioritize, standard, note-routine, pin the occupation, research the occupation, check the posting, or skip. It shows where every value came from and leaves the call to you.

**Audience:** an F-1 student targeting new-grad backend roles in Boston (O*NET 15-1252.00 Software Developers), modelled on the fictional repo persona **Aarav Patel** (`search/examples/aarav-patel/`: F-1 on STEM OPT, Boston, targeting backend and platform roles).
**Agent twin:** `recipes/cases/2026fa/ashwinthankachan26-backend-pivot-range.md`
**Chapter:** 9 (Is the role any good: BLS / O*NET role quality); liveness from Job-Ops.

## Purpose

Answer, per posting: *which O*NET occupation(s) could this title be, is that occupation's judgment score really different from Software Developers', how old are the ratings being compared, and do this posting's own duties read as judgment work?* If the title doesn't settle the occupation, say **pin it** and why. Never rank scores the data can't tell apart.

## What it can verify

- The O*NET release is byte-identical to the one the repo's table came from (5 SHA-256 matches).
- Each occupation's nine ratings, rater count, date, and published error; the score recomputed exactly (31 of 31).
- Which O*NET title lists contain the posting's title (and what was ignored as out of scope).
- Whether a gap is bigger than the error, under a stated assumption.
- The posting's duties, quoted exactly.
- Whether the repo's checker saw an Apply button on the live page.

## What it cannot verify

- **Whether AI will replace the work.** The score is how much reasoning analysts rated the job as needing.
- **Any gap, once errors are correlated.** If the ratings' errors move together, nothing in this family differs from Software Developers.
- **The occupation an employer will file.** O*NET's title lists aren't the employer's.
- **Hybrid titles.** Hardware test roles land in Software QA; an HR-systems developer landed in Systems Architects.
- **That the duties are judgment work.** The word rule read every readable posting as judgment-heavy.
- Era: Web Developers rated 2017, Software Developers 2025. Pay: national medians only.

## Annotated commands

```bash
# once: download + verify O*NET, write the small extract
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/ingest_onet.py --download --cache-dir ~/onet-cache
# today's postings (new folder)
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/fetch_postings.py --out-dir <new folder>
# the mode, offline
python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/pivot_range.py --roles <folder>/roles.json --today $(date +%F) --out-dir <new folder>
# liveness gate on the shortlist, then re-run with its output
npm run --silent ats:liveness -- <urls> > liveness.txt
```

## What it produces

- `pivot-report.md` (for you): summary, one row per posting with its next action and evidence, the occupations table with error bars and rating dates, gates to tick, and what the run can't tell you.
- `pivot-log.json` (for an agent): every value with its `record` / `model-judgment` / `your-input` label.

## Named failure modes

| You see | It means | Do this |
|---|---|---|
| `PIN-SOC` | the title's candidate occupations disagree about Software Developers (e.g. SRE: Research Scientists 4.516 vs Software Developers 3.834) | pick one occupation in `config.json → pins` with a reason, then re-run |
| `RESEARCH-SOC` | no scored O*NET occupation matches the title | look the role up yourself; don't assume |
| `OUT-OF-TARGET` | you marked this title as not a role you're aiming for (pin with a reason) | nothing; it's your decision on record |
| matched `[model-judgment]` "contains O*NET title" | the exact title wasn't listed; a shorter O*NET title inside it was used | check it's the right job family |
| matched `[your-input]` family | no O*NET title fit; your own family rule chose | treat as a guess until pinned |
| band `indistinguishable` | the gap is inside O*NET's measurement error | don't prefer either role on this score |
| `section-not-found` / `too-few-signals` | the duties weren't read, or barely | read the posting yourself |
| `CHECK-LIVENESS` | the checker couldn't confirm it's open (embedded application forms) | open it by hand before spending time |
| "Ratings ≥ 5 yrs apart: yes" | the two occupations were rated in different eras | discount the comparison |

**The hardest error to catch:** a "Back End Software Engineer" posting scored as Web Development while the identical "Software Engineer, Backend" posting is scored as Software Development. The tool shows the match, but only you can decide it's the same job.
