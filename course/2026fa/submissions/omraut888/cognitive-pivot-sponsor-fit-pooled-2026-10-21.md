# Which H-1B sponsors hire for AI-resilient work? Two occupations compared — 2026-10-21

## Executive summary

**What this is.** A check of 30 companies that have sponsored work visas, split between two kinds of job: computer and AI *research* roles (18 companies) and software-developer roles (12 companies). Each is scored with and without a signal for how well the work holds up as AI improves. Research work scores higher on that signal than software development. It is written for an international student deciding where to spend limited application time.

**Why read it.** A first run with only one kind of job could not show any effect, because every company got the same bonus. With two kinds of job pooled together, this run tests whether the durability signal changes any recommendation.

**What it found.** It changed **0 of 30** recommendations. It did change the *order*: every research-role company now ranks above every software-developer company. No company crossed a decision line, because every matched company starts above the "apply" bar before durability is even counted. That is a known flaw in how this check scores job fit. Nobody has checked whether these postings are open, so **no company is marked "apply". All 30 are "consider", because no one has checked the posting.** The software-developer list is also a poor sample. The title matcher could only use a handful of alphabetically-first job titles for that occupation, so it caught 12 companies, mostly with "application …" titles, and several of those look like security, sales or support engineering.

**What to do with it.** Use the ordering as a weak hint and not as a decision. Before applying anywhere, check the posting is live and read the matched title yourself. Do not treat the software-developer group as representative of software-developer sponsors.

## Run record

- Recipe: `recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md` · report written by `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-report.py`
- One shared normalization for both groups: (raw − 1.611) / (4.877 − 1.611) over 894 scored SOC rows. The range was not recomputed per group, so the two values are comparable.

| SOC | Occupation | Cognitive-pivot score (record) | role_quality.p | Sponsors with titles | Matched | Not matched | Alternate titles available to the matcher |
|---|---|---|---|---|---|---|---|
| 15-1221.00 | Computer and Information Research Scientists | 4.516 | 0.8895 | 1557 | 18 | 1539 | 8 of 31 |
| 15-1252.00 | Software Developers | 3.834 | 0.6806 | 1557 | 12 | 1545 | 8 of 93 |

- Runs compared: role_quality weight **0** (scorer default, `[VERIFY]`) vs **0.15** (your-input). 0.15 is the weight PR #3 proposed but did not implement, carried forward on purpose.
- **The SOC link is a proxy.** The sponsorship CSV has no SOC code field. Companies are linked to an occupation only by phrase-matching their sponsored titles. This is not a DOL/BLS classification.

## Before / after (pooled)

| Rank @0 → @0.15 | Company | SOC | Matched title | Phrase | Sponsorship p (n) | Composite @0 | Composite @0.15 | Scorer | Reported to you |
|---|---|---|---|---|---|---|---|---|---|
| 1 → 1 | AIERA INC | 15-1221.00 | AI/DS Engineer | ai engineer ¹ | 1.0 (102) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 2 → 2 | AURIS HEALTH INC | 15-1221.00 | Senior Computer Vision Scientist | computer scientist ¹ | 1.0 (276) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 5 → 3 | BLADE THERAPEUTICS INC | 15-1221.00 | Senior Scientist, Computational Biology | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 6 → 4 | BUTLR TECHNOLOGIES INC | 15-1221.00 | Applied Scientist II | applied scientist | 1.0 (14) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 7 → 5 | CHARMED AI INC | 15-1221.00 | Applied Scientist | applied scientist | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 8 → 6 | CLADE THERAPEUTICS INC | 15-1221.00 | Senior Scientist, Computational Biology | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 9 → 7 | DATAVISOR INC | 15-1221.00 | Senior Software Engineer - AI/Algo | ai engineer ¹ | 1.0 (20) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 10 → 8 | DEXCARE INC | 15-1221.00 | Staff AI/ML Data Engineer | ai engineer ¹ | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 11 → 9 | GENIES INC | 15-1221.00 | Machine Learning Engineer / AI Scientist | ai engineer ¹ | 1.0 (22) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 12 → 10 | GENOMATICA INC | 15-1221.00 | Computational Research Scientist II | computational scientist ¹ | 1.0 (24) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 13 → 11 | GRETEL LABS INC | 15-1221.00 | Staff Applied Scientist | applied scientist | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 15 → 12 | MARLINSPIKE THERAPEUTICS INC | 15-1221.00 | Senior Scientist, Computational Biophysicist | computational scientist ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 17 → 13 | MENDEL HEALTH INC | 15-1221.00 | AI Research Engineer | ai engineer ¹ | 1.0 (22) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 18 → 14 | MODULAR INC | 15-1221.00 | AI TOOLS ENGINEER; AI PERFORMANCE ENGINEER | ai engineer ¹ | 1.0 (34) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 19 → 15 | OUTREACH CORP | 15-1221.00 | Senior Applied Scientist | applied scientist | 1.0 (48) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 20 → 16 | RELAY THERAPEUTICS INC | 15-1221.00 | Scientist II, Computational Chemist | computational scientist ¹ | 1.0 (4) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 23 → 17 | UNIQUIFY INC | 15-1221.00 | AI Design Engineer | ai engineer ¹ | 1.0 (2) | 0.65 | 0.7834 | Apply → Apply | **Consider — liveness unchecked** |
| 26 → 18 | WYZE LABS INC | 15-1221.00 | Senior Software Engineer (AI Platform) | ai engineer ¹ | 0.9688 (64) | 0.6391 | 0.7725 | Apply → Apply | **Consider — liveness unchecked** |
| 3 → 19 | AVA LABS INC | 15-1252.00 | NodeJS Application Security Engineer | application engineer ¹ | 1.0 (14) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 4 → 20 | AXIA TECHNOLOGIES LLC | 15-1252.00 | Application software developer | application developer ¹ | 1.0 (2) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 14 → 21 | IMMUNITYBIO INC | 15-1252.00 | Application Systems Analyst-Dynamics AX | application analyst ¹ | 1.0 (20) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 16 → 22 | MAVEN TECHNOLOGIES INC | 15-1252.00 | Software Application Developer | application developer | 1.0 (68) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 21 → 23 | SNAPDOCS INC | 15-1252.00 | Application Security Engineer | application engineer ¹ | 1.0 (16) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 22 → 24 | TAS ENERGY INC | 15-1252.00 | Application Engineer | application engineer | 1.0 (18) | 0.65 | 0.7521 | Apply → Apply | **Consider — liveness unchecked** |
| 24 → 25 | HUMAN INC | 15-1252.00 | Senior Application Architect; Lead Application Architect | application architect | 0.9914 (1394) | 0.647 | 0.7491 | Apply → Apply | **Consider — liveness unchecked** |
| 25 → 26 | ZUORA INC | 15-1252.00 | Principal Application Support Engineer | application engineer ¹ | 0.9802 (202) | 0.6431 | 0.7452 | Apply → Apply | **Consider — liveness unchecked** |
| 27 → 27 | ELECTRIC HYDROGEN CO | 15-1252.00 | Sales Application Engineer | application engineer | 0.9545 (44) | 0.6341 | 0.7362 | Apply → Apply | **Consider — liveness unchecked** |
| 28 → 28 | TYLER TECHNOLOGIES INC | 15-1252.00 | Application Developer; .Net Application Developer | application developer | 0.9496 (238) | 0.6324 | 0.7345 | Apply → Apply | **Consider — liveness unchecked** |
| 29 → 29 | FLYWIRE CORP | 15-1252.00 | Application Security Engineer | application engineer ¹ | 0.9474 (38) | 0.6316 | 0.7337 | Apply → Apply | **Consider — liveness unchecked** |
| 30 → 30 | TRUNK TECHNOLOGIES INC | 15-1252.00 | Business Application Developer | application developer | 0.9091 (22) | 0.6182 | 0.7203 | Apply → Apply | **Consider — liveness unchecked** |

Ranks break ties alphabetically. At weight 0, 23 of 30 companies are tied at exactly the same composite, so most rank moves are tie-breaks being replaced by a real difference, not true reversals.
¹ the phrase's words are all present but not side by side. This is a mechanical prompt to read the title, not a verdict.

## What changed and why

**Decisions: 0 of 30 changed.** Every company is Apply at both weights (before the liveness downgrade).

**Order: the weight now separates the occupations.** Role quality adds 0.8895 × 0.15 = **0.1334** to each 15-1221.00 company and 0.6806 × 0.15 = **0.1021** to each 15-1252.00 company, a **0.0313** gap. Every 15-1221.00 company now ranks above every 15-1252.00 company. There are 8 strict reversals, where a company that scored lower at 0 now scores higher than another: WYZE LABS INC overtakes 8. A reversal needs a sponsorship difference small enough for the gap to overcome (sponsorship p differing by less than 0.0313 / 0.35 ≈ 0.0894).

**Does the fit flaw still suppress every decision change? Yes, completely.** Fit is 1.0 for every match, so fit alone contributes 1.0 × 0.3 = 0.3, which equals the 0.3 Apply threshold. Sponsorship and role quality can only add to that, so every matched company is Apply at every weight ≥ 0. Changing the weight can still reorder companies, but no spread between occupations, however wide, can move one across the line. The flaw is left in place on purpose (see limitations) so that this before/after comparison stays clean.

**Liveness downgrade (gate G4).** The scorer said Apply for 30 companies. This report shows each as **Consider — liveness unchecked**.

## Limitations (named, not engineered around)

1. **Fit saturates.** With fit at 1.0 for every phrase match, scoring happens on top of a guaranteed pass (0.3 ≥ 0.3). Skip rate is 0%; a healthy run skips at least half.
2. **"Computational <natural science>" false positives (15-1221.00).** BLADE and CLADE THERAPEUTICS ("Senior Scientist, Computational Biology") and RELAY THERAPEUTICS ("Scientist II, Computational Chemist") match "computational scientist" without being computer-science or AI work. Sources: BLADE/CLADE come from an agent reading (model judgment, not a human finding). RELAY was flagged by the agent and then confirmed by the one human check, Om Raut's 5-of-18 spot-check (4 of 5 rated sound). The same shape recurring points to a systematic weakness of bag-of-words matching, not a one-off. MARLINSPIKE ("Computational Biophysicist") has the same shape (model judgment, not human-checked).
3. **The software-developer group is a thin, skewed sample.** The compact table carries only 8 of 15-1252.00's 93 alternate titles, all alphabetically early ("AI Specialist", "Application …"). The occupation's own title is plural ("Software Developers"), so a title like "Software Developer" or "Software Engineer" never matches. *Model judgment:* of the 12 matches, "Application Security Engineer" (AVA LABS, FLYWIRE, SNAPDOCS), "Sales Application Engineer" (ELECTRIC HYDROGEN), "Application Engineer" at an energy company (TAS ENERGY), "Principal Application Support Engineer" (ZUORA), and "Application Systems Analyst" (IMMUNITYBIO) are doubtful as software-developer roles. That leaves about 5 that read as plausible. No human has checked this group.
4. **Data Scientists (15-2051.00) cannot be scored.** Its score is blank, so the mode refuses and does not estimate.
5. **Thin sponsorship records.** 9 of 30 companies have ≤ 4 total petitions (the cutoff is a your-input display choice). A 2-for-2 record counts the same as 276-for-276.
6. **No liveness, no timeline.** Both gates are written as factor 1 with explicit *not verified / not applicable* labels.

## Decision this enables

For a student choosing between research-style and software-developer-style roles at sponsors, the ordering is a weak hint toward the research group. It cannot settle anything: no decision moved, liveness is unchecked, and the software-developer group is not a fair sample. On the authorial question (should role quality carry weight 0.15?), the honest result is that the weight reorders but cannot decide anything while fit is 1.0. Fixing fit comes first, and then this comparison should be re-run.
