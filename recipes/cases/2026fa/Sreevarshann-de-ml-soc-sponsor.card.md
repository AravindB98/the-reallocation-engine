# Sreevarshann-de-ml-soc-sponsor — human card

**Audience:** an F-1 OPT master's graduate (or their advisor) deciding which Data/ML Engineer applications to spend the next hours on.  
**Agent twin:** `recipes/cases/2026fa/Sreevarshann-de-ml-soc-sponsor.md`  
**Chapters:** 7 (sponsorship), 8 (liveness), 9 (role quality, report only), 10 (timeline), 11 (composite).

## Executive summary

This card explains, for a person, what the Data/ML Engineer sponsorship check does and how far to trust it. Read it before acting on the check's report. The check sorts a short list of target companies into "worth scoring", "check the posting first", and "blocked for missing evidence", then hands the first group to the project's existing scorer. Its first live run produced three Apply, one Consider, one Skip and one blocked company — but it could not answer the question that matters most for data and ML roles (which occupation code each employer actually files them under), and it says so instead of guessing.

## Purpose

Answer: of these companies, which have recorded sponsorship history, have sponsored data or ML titles before, and have a live posting — and which must wait or be dropped? If the data cannot support an answer, the check must say blocked or held, and why.

## What it can verify

- A company's sponsorship record under an **exactly** matching name: approvals, denials, approval rate.
- The sponsorship tier your rule gives those counts (proven / likely / possible).
- Whether the company's listed sponsored titles contain a data or ML keyword. The match is a **judgment**, and so is the occupation code it suggests.
- National wage, job zone and cognitive-pivot score for the candidate occupation codes — and that Data Scientists (15-2051.00) has no score.
- What the liveness tool saw on each posting, and what you recorded when you checked an uncertain one yourself.
- Whether your timeline leaves more unemployment days than your buffer.

## What it cannot verify

- **Which occupation code the employer files data/ML roles under.** The data has no occupation code per filing. Shown as *proposed*.
- **Whether this particular role sponsors.** Sponsorship counts are company-wide.
- **E-Verify enrollment**, required for the STEM OPT extension.
- **Seniority.** A Senior posting scores the same as an entry-level one.
- **How fresh the funding data is.** A 2021 funding date is shown as recorded.
- **Companies listed under a different legal name** (e.g. "Instacart" vs "MAPLEBEAR INC", "One Medical" vs "1LIFE HEALTHCARE INC" — pairings inferred from outside knowledge) — they show as not found.
- **Role quality in the decision.** The scorer reads no occupation data and gives role quality zero weight.

## Dependencies

- Python 3.12+ (standard library only) and Node (for the existing liveness tool and scorer).
- Playwright's Chromium, for `npm run ats:liveness` only.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/bls/compact/soc_occupation_compact.csv`
- `data/sec/form-d/processed/sample/` (200-company sample)
- Fictional persona `search/examples/priya-nair/profile.yml`
- Provenance: `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`

## Annotated commands

Offline tests (expected: all pass; any network call fails a test):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/tests -v
```

Liveness (expected: exit 1 whenever any posting is not active — that is a result, not an error). Pass each URL as its own word:

```bash
npm run ats:liveness -- https://job-boards.greenhouse.io/reddit/jobs/7131932 https://job-boards.greenhouse.io/twilio/jobs/1000000
```

The evidence pass (expected: a count line, the timeline arithmetic, and the next scorer command):

```bash
python3 scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor/run.py --targets course/2026fa/submissions/Sreevarshann/mode-build/inputs/targets.csv --liveness course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/ats-liveness.txt --checks course/2026fa/submissions/Sreevarshann/mode-build/inputs/posting-checks.csv --run-date 2026-10-20 --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20 --overwrite
```

The scorer, by its own command line only:

```bash
npm run score -- course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/roles.json --profile course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20/profile.json --out-dir course/2026fa/submissions/Sreevarshann/mode-build/runs/2026-10-20
```

## What it produces

- `report.md` — for you: a summary, one row per company with every reason that applies, the matched titles, occupation data, funding, and an explicit "cannot verify" list.
- `evidence.json` — for agents: every value labelled record / judgment / your input / proposed / sample.
- `roles.json` + `profile.json` — only when something is scoreable; input for the scorer, which writes `role-scores.md`.

## Named failure modes

1. **Name mismatch looks like "no sponsor"** — type "Instacart" and the check says not found, although `MAPLEBEAR INC` (which outside knowledge says is Instacart's legal name) is proven with 498 approvals. Hardest to catch for a student who assumes the data is complete. The reverse also happens: "Samsara" is not found, and its legal-name row exists but has no sponsorship figures, so the block is correct. Mitigation: blocked, never scored as a non-sponsor; alias table proposed.
2. **Company-wide sponsorship read as role-specific** — 400 approvals at a company says nothing about whether its data team sponsors, or under which occupation code. Hardest to catch for exactly this candidate, because the headline number is reassuring. Mitigation: per-employer occupation code shown only as proposed.
3. **Bad joins in the source table** — `PATHAI INC` and `PATHRAI INC` share identical figures; `HUMAN INC` shows 1,382 approvals across 13 titles; 212 names match more than one row. A wrong join gives a confident tier to the wrong company. Mitigation: ambiguous names are blocked; the rest is reported for a maintainer.
4. **Seniority mismatch** — a Senior posting is Apply for a new graduate because fit is neutral. Mitigation: documented; seniority detection proposed.
5. **"Work authorized" trap** — the scorer treats that phrase as not needing sponsorship. Mitigation: the run stops (exit 4) before scoring.
