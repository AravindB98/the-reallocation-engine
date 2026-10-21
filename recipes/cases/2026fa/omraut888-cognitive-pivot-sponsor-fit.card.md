# Cognitive-pivot sponsor fit — human card

## Executive summary

This card is the one-page version of a check that asks: *among companies that
have really sponsored work visas for AI-research-style job titles, is the work
itself durable as AI improves?* Read it if you are an international student
deciding which sponsors to research next. On its first real run it found 18
such sponsors, and the durability signal changed none of their
recommendations. A second run added 12 software-developer sponsors. The
signal then ranked every research company above every software company, but
it still changed no recommendation. None is marked "apply", because nobody
has checked whether their postings are open.

**Audience:** an F-1/OPT student targeting research-scientist / applied-scientist roles.
**Agent twin:** `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md`
**Layers:** 80 Days to Stay (sponsorship) × Cognitive Pivot (O*NET role quality). Ch.11 scorer.

## Purpose

Shortlist known H-1B sponsors whose sponsored titles look like one target occupation
(run for 15-1221.00 Computer and Information Research Scientists, cognitive-pivot score 4.516),
and test whether giving role quality a weight (0.15) changes Apply/Consider/Skip.

## What it can verify

- Approvals and denials per sponsor, and their ratio (record).
- That every word of an O*NET alternate-title phrase appears in a sponsored title (record, proxy).
- The occupation's real cognitive-pivot score and the 1.611–4.877 range across 894 scored occupations (record).
- Whether the 0.15 weight changes any decision. It changed none in either the single-SOC run (18 roles) or the pooled run (30 roles with 15-1252.00); it only reorders.

## What it cannot verify

- That a company's posting is that occupation. The sponsorship data has no SOC code; titles are a proxy.
- That any posting is live. Every "Apply" is shown as **Consider — liveness unchecked**.
- That 0.15 is the right weight (your-input).
- Anything for occupations with no score. Data Scientists (15-2051.00) is refused.

## Annotated commands

```bash
C=scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit
R=course/2026fa/submissions/omraut888/run
# 1. title → SOC proxy (expect: 18 matched, 1539 not)
python3 $C/title-to-soc.py --soc 15-1221.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out $R/soc-match-15-1221.00
# 2. role records; liveness/timeline written explicitly as NOT verified / not applicable
python3 $C/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches $R/soc-match-15-1221.00/soc-match-output.json --out $R/roles.json
# 3. score twice
node scripts/score/role-scorer.mjs $R/roles.json --out-dir $R/weight-0.0
node scripts/score/role-scorer.mjs $R/roles.json --role-quality-weight 0.15 --out-dir $R/weight-0.15
# 4. stop demo (expect: STOP: missing: no-cognitive-pivot-score, exit 3)
python3 $C/cognitive-pivot-roles-builder.py --soc 15-2051.00 --matches $R/break-15-2051.00/soc-match/soc-match-output.json --out /tmp/x.json
```

## How to read the result

Treat it as a research shortlist. Then, for each company you care about:
(1) run `npm run ats:liveness -- <posting-url>` on a real posting,
(2) read titles flagged ¹ or "computational <science>" yourself, and
(3) discount ratios built on ≤ 4 petitions.
