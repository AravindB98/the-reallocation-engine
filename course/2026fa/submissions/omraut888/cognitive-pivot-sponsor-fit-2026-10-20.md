# Which H-1B sponsors hire for AI-resilient research work? — 2026-10-20

## Executive summary

**What this is.** A check of 18 companies that have sponsored work visas for job titles that look like computer and AI *research* work, scored for how well that kind of work holds up as AI gets better at routine tasks. It is written for an international student deciding where to spend limited application time.

**Why read it.** Visa-sponsorship data tells you who sponsors. It says nothing about whether the sponsored work will still be valuable in five years. This report adds that second signal and tests whether it changes any recommendation.

**What it found.** Adding the work-durability signal raised every company's score but changed **0 of 18** recommendations. All 18 companies were already above the "apply" bar without it, and because every company here maps to the same occupation, the signal adds the same amount to each of them, so it cannot tell them apart. Nobody here has checked that these companies' job postings are still open, so **no company is marked "apply". All 18 are marked "consider", with the reason that no one has checked the posting.** The job-title matching is a rough proxy. At least two matches (computational *biology* scientists) are probably not computer-science research jobs.

**What to do with it.** Treat this as a research shortlist, not an application list. Before you apply anywhere on it, (1) check the posting is live, (2) read the science-titled matches yourself, and (3) remember that a 2-for-2 approval record is far weaker evidence than 100-for-100.

## Run record

- Recipe: `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` · report written by `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py`
- Target occupation: **15-1221.00 Computer and Information Research Scientists**. Cognitive-pivot score **4.516** (record, `data/bls/compact/soc_occupation_compact.csv`)
- Normalization: (raw − 1.611) / (4.877 − 1.611) over 894 scored SOC rows (min 41-9012.00, max 11-1011.00) → role_quality.p **0.8895**
- Title matching: 1557 sponsors had sponsored titles. **18 matched** and 1539 did not (`missing: no-title-match`, not guessed)
- Runs compared: role_quality weight **0** (scorer default, `[VERIFY]`) vs **0.15** (your-input). 0.15 is the weight proposed but never implemented in PR #3 (ML/H-1B timeline mode); this mode carries it forward and tests it.
- **The SOC link is a proxy.** The 80 Days sponsorship CSV has no SOC code field. Each company here is linked to the occupation only by phrase-matching its sponsored job titles to O*NET alternate titles. This is not a DOL/BLS classification.

## Before / after

| Company | Matched title | Phrase | Sponsorship p (n) | Composite @0 | Composite @0.15 | Scorer | Reported to you |
|---|---|---|---|---|---|---|---|
| AIERA INC | AI/DS Engineer | ai engineer ¹ | 1.0 (102) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| AURIS HEALTH INC | Senior Computer Vision Scientist | computer scientist ¹ | 1.0 (276) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| BLADE THERAPEUTICS INC | Senior Scientist, Computational Biology | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| BUTLR TECHNOLOGIES INC | Applied Scientist II | applied scientist | 1.0 (14) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| CHARMED AI INC | Applied Scientist | applied scientist | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| CLADE THERAPEUTICS INC | Senior Scientist, Computational Biology | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| DATAVISOR INC | Senior Software Engineer - AI/Algo | ai engineer ¹ | 1.0 (20) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| DEXCARE INC | Staff AI/ML Data Engineer | ai engineer ¹ | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| GENIES INC | Machine Learning Engineer / AI Scientist | ai engineer ¹ | 1.0 (22) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| GENOMATICA INC | Computational Research Scientist II | computational scientist ¹ | 1.0 (24) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| GRETEL LABS INC | Staff Applied Scientist | applied scientist | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| MARLINSPIKE THERAPEUTICS INC | Senior Scientist, Computational Biophysicist | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| MENDEL HEALTH INC | AI Research Engineer | ai engineer ¹ | 1.0 (22) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| MODULAR INC | AI TOOLS ENGINEER; AI PERFORMANCE ENGINEER | ai engineer ¹ | 1.0 (34) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| OUTREACH CORP | Senior Applied Scientist | applied scientist | 1.0 (48) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| RELAY THERAPEUTICS INC | Scientist II, Computational Chemist | computational scientist ¹ | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| UNIQUIFY INC | AI Design Engineer | ai engineer ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| WYZE LABS INC | Senior Software Engineer (AI Platform) | ai engineer ¹ | 0.9688 (64) | 0.6391 | 0.7725 | Apply → Apply | **Consider — liveness unchecked** |

¹ the phrase's words appear in the title but not side by side. This is a mechanical flag to prompt reading, not a verdict. Several of these are genuine (e.g. "Staff AI/ML Data Engineer").

Sources per term: sponsorship = record (approvals ÷ (approvals + denials)); fit = model-judgment (1.0 for a phrase match); role_quality = record (normalized score); liveness = your-input, **NOT verified**; timeline = your-input, **not applicable** (no visa clock modeled in this mode).

## What changed and why

**Nothing changed: 0 of 18 scorer recommendations moved.** The real numbers:

- Lowest composite at weight 0: **0.6391**, already ≥ the Apply threshold 0.3. Lowest at 0.15: **0.7725**.
- Role quality added 0.8895 × 0.15 = **0.1334** to *every* company, because all 18 map to one SOC code and so share one cognitive-pivot score. Inside a single-SOC run the signal can shift the whole list but never reorder it.
- The scorer adds weights without renormalizing, so a positive role-quality weight can only *raise* a composite. It can promote (Skip → Consider → Apply) but never demote. With all 18 already at Apply, no positive weight could change a decision here.
- Fit is 1.0 for every phrase match, so fit alone contributes 1.0 × 0.3 = **0.3**, which already meets the 0.3 threshold. In this mode a matched role reaches Apply even with zero sponsorship evidence. This is the mode's biggest design flaw (see limitations).
- Skip rate is 0% in both runs, against the ≥50% a healthy run shows. The scorer's own report flags this.

**Liveness downgrade (gate G4).** The scorer said Apply for 18 companies. This report shows each of those as **Consider — liveness unchecked**: nobody has checked that a matching posting is open, and an unchecked posting must not look the same as a checked one.

## Contrast: why the occupation matters more than the company here

- 15-1252.00 Software Developers scores **3.834** vs **4.516** here (record). Normalized that is 0.6806 vs 0.8895, a 0.0313 composite gap at weight 0.15. This is arithmetic on record values. It is not a scorer run, because no software-developer sponsor set was built.
- 15-2051.00 Data Scientists: score **blank** in the compact table. A run for it stops with `missing: no-cognitive-pivot-score` and is never scored as 0.

## Limitations (named, not engineered around)

1. **Computational-biology matches.** BLADE THERAPEUTICS and CLADE THERAPEUTICS each matched on "Senior Scientist, Computational Biology" via the phrase "computational scientist". The matcher is bag-of-words, so "computational" and "scientist" are both present but do not mean computer-science research. *Model judgment, flagged for human review:* MARLINSPIKE ("Computational Biophysicist") and RELAY ("Computational Chemist") have the same shape. They are left in the list and not filtered.
2. **Data Scientists (15-2051.00) cannot be scored.** Its cognitive-pivot score is blank in the compact table, so the mode refuses. It does not estimate. A data-science student gets no answer from this mode.
3. **Fit saturates.** Fit = 1.0 for any match, and 1.0 × 0.3 alone clears the threshold, so sponsorship and role quality cannot push a matched role below Apply. The scorer's output here is a ranking by sponsorship ratio, not a triage.
4. **Thin sponsorship records.** 8 companies have ≤ 4 total petitions (BLADE THERAPEUTICS INC, CHARMED AI INC, CLADE THERAPEUTICS INC, DEXCARE INC, GRETEL LABS INC, MARLINSPIKE THERAPEUTICS INC, RELAY THERAPEUTICS INC, UNIQUIFY INC; the ≤ 4 cutoff is a your-input display choice, not a statistical test). A ratio of 1.0 on 2 petitions counts the same as 1.0 on 276.
5. **No liveness, no timeline.** No posting was checked, and no OPT/visa clock is modeled. Both gates are written as factor 1 with explicit *not verified / not applicable* labels.

## Decision this enables

Use the 18 companies as a **research shortlist for computer/AI research roles at known sponsors**. Do not use it as an application queue. The next human step for any company you care about: run a liveness check on a specific live posting, and read titles marked ¹ or in limitation 1 yourself. On the open authorial question (should role quality carry weight 0.15?), this run gives no evidence either way, because one occupation cannot test a weight that only acts across occupations.
