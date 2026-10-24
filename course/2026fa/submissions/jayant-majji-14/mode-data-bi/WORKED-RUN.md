# Worked run — case-pavan-majji-14-data-bi-15-2051 v0.1.0

## Executive summary
**What this is:** a record of running this check on six real job postings on 20 October 2026.
**Why read it:** it shows the real output, separates what the data proved from what I decided, and lists what broke.
**What it found:** one posting came out "apply," one "consider," and one "skip" (wrongly, because a script misread a live posting as closed). Three were held because the data had no usable record for the employer or the occupation. Two deliberate tests showed the scoring step can recommend a role with zero fit, and can label a guess as data.

## Inputs
- **Persona (fictional):** F-1 OPT, target SOC 15-2051, OPT end 2027-05-31, hiring lag 60 days. Run date 2026-10-20, so 223 days left.
- **Six real postings,** found on company career pages. Tracking parameters were removed from the URLs.

| # | Company | Title | Board |
|---|---|---|---|
| 1 | Snowflake | Business Intelligence Analyst | Ashby |
| 2 | Fetch | Business Intelligence Analyst | Greenhouse |
| 3 | Gusto | Data Scientist, Risk | Greenhouse |
| 4 | Pinterest | Sr. Data Scientist, Core | Pinterest careers |
| 5 | Amazon | Business Analyst I, Global Logistics | amazon.jobs |
| 6 | McKinsey & Company | Business Analyst – Operations | mckinsey.com |

## Commands run (verbatim; real output in Appendix)
*The input files were in my local notes folder when I ran these commands; copies are in this folder under `inputs/`, and the scorer outputs under `runs/`.*
1. Sub-occupation rows: read-only Python over `data/bls/compact/soc_occupation_compact.csv`, filtered to `bls_soc_code == 15-2051`, printed by `onet_soc_code`.
2. Company lookup: read-only Python over the 80 Days CSV, with exact normalized match plus near matches shown as diagnostics only.
3. `npm run ats:liveness -- <6 URLs>`
4. `npm run score -- ~/Desktop/rea2-notes/roles-1.json --out-dir ~/Desktop/rea2-notes/run1`
5. `npm run score -- ~/Desktop/rea2-notes/roles-break.json --out-dir ~/Desktop/rea2-notes/run-break` (break attempts)

## Results by route

| # | Posting | G1 occupation | G2/G3 sponsorship | G4 liveness | Route / decision |
|---|---|---|---|---|---|
| 1 | Snowflake BI Analyst | 15-2051.01 (pivot 3.903) | SNOWFLAKE INC, 1,816 approvals → **Likely** | active | **Consider** (0.510) |
| 2 | Fetch BI Analyst | 15-2051.01 | **no exact match** | active | **held** (brand vs legal name) |
| 3 | Gusto Data Scientist | 15-2051.00 (**pivot missing**) | GUSTO INC, 218 → **Proven** | active | **Apply** (0.615) |
| 4 | Pinterest Sr. Data Scientist | 15-2051.00 (**pivot missing**) | PINTEREST INC, 1,364 → **Proven** | **expired** (script) / **live** (human) | **Skip** (gated, 0.000) |
| 5 | Amazon Business Analyst I | **no mapping** (out of scope) | not in CSV | active | **held** |
| 6 | McKinsey Business Analyst | **no mapping** (out of scope) | not in CSV | **uncertain** | **held** |

## Verified vs inferred, line by line (Snowflake row)

| Value | Label | Basis |
|---|---|---|
| Title "Business Intelligence Analyst" | record | the posting |
| Maps to 15-2051.01 | your-input | sub-occupation map v0.1 |
| 15-2051.01 pivot score 3.903 | record | occupation table |
| BLS median wage $112,590 | record | same for all three sub-occupations |
| CSV row SNOWFLAKE INC, 1,816 approvals, 98.5% rate | record | 80 Days CSV |
| Sponsored titles contain no data/analytics/BI title (only "Financial Analyst") | record (titles) + your-input (keyword rule) | tier rule v0.1 |
| Tier Likely → p 0.6 | your-input | tier rule + example-file convention |
| Fit 1.0 | your-input | my judgment |
| Liveness active → 1.0 | record | `ats:liveness` |
| Timeline 1.0 (223 ≥ 2 × 60) | your-input | timeline rule |
| Composite 0.510, Consider | scorer output | soft spot: Likely tier |

The other rows follow the same split. **No model-judgment values were used.**

## Verification
1. **Arithmetic by hand:**
   - Gusto: 0.35 × 0.9 + 0.30 × 1 = 0.615.
   - Snowflake: 0.35 × 0.6 + 0.30 × 1 = 0.510.
   - Pinterest: liveness 0, so 0.
   All three match the scorer.
2. **Cross-check against the source:** the sub-occupation rows printed by O\*NET code show identical BLS wage and employment, but different or blank O\*NET fields.
3. **Human gate check:** I opened the Pinterest posting in a browser on 2026-10-20. The full description and an Apply button were present, so the script's "expired" was false. Logged as a disagreement; the script value was kept in the scored run.
4. **Deliberate breaks:** see the attestation.

## Reflection
**What went well.** Every role the data couldn't support was held instead of scored. The run exposed a real problem in a repo script (a false "expired") and a real gap in the data (no large employers).

**What the mode got wrong or missed.**
- Pinterest got the right answer (Skip, since I rated fit 0 for a Senior role) for the wrong reason: a false liveness result.
- My first sub-occupation lookup keyed rows by the 6-digit BLS code and silently reported Clinical Data Managers as "15-2051." That's my own failure mode 1, made by me during the build; I fixed it by keying on the O\*NET code.
- I first planned QA / Test Engineer roles, then dropped them. Of the 20 strongest QA sponsors in the CSV, I found no open QA postings, and the three QA postings I found elsewhere had no sponsorship evidence.
- Two of six postings were "Business Analyst" roles, outside 15-2051; the map holds them, but they took search time.
- The agent log and human report were assembled by hand, not by a stored script.

**Next steps (concrete).**
1. Build the title → sub-occupation mapper as a tested script (proposed addition 1).
2. Propose to the maintainers that `ats:liveness` return uncertain on "insufficient content" (proposed addition 6).

## Attestation
- Recipe: case-pavan-majji-14-data-bi-15-2051 v0.1.0
- By: Pavan Jayant Majji · 2026-10-20

### Tested
| Ran | Saw | Expected |
|---|---|---|
| Sub-occupation rows by O\*NET code | 3 rows; identical BLS wage/employment; .00 blank O\*NET fields; .01 pivot 3.903; .02 3.738 | rows differ only in O\*NET fields |
| Company lookup, 6 companies | 3 exact matches; Fetch/Amazon/McKinsey none; Snowflake also has a blank-approvals second legal name | exact match only |
| `ats:liveness` on 6 URLs | 4 active, 1 expired, 1 uncertain | a status per URL |
| Human hand-check of Pinterest | live (description + Apply button) | — script said expired |
| `npm run score` on 3 roles | Apply 0.615 · Consider 0.510 · Skip 0.000 | same, by hand |
| **Break A:** Pinterest live, fit 0 | **0.315 → Apply** | Apply; sponsorship alone clears 0.3 |
| **Break B:** sponsorship `source` omitted | audit shows **[record]** | scorer fills in `record` |

### Did not test
- Full SEC Form D quarters (gitignored), and any company outside the CSV.
- Re-checking the approval counts against the USCIS Employer Data Hub.
- `ats:liveness` on more JavaScript-heavy career sites; how often it gives a false "expired."
- The title map on titles other than the six above.
- A stored script for the lookups (none exists).
- Whether the tier thresholds or the 60-day lag are realistic.

### Broke during testing, fixed
- **Sub-occupation lookup keyed by BLS code** overwrote rows (showed "Clinical Data Managers" for 15-2051) → re-keyed by O\*NET code.
- **`grep --include=*.md` failed in zsh** (glob expansion) → quoted the pattern.
- **LinkedIn and job-site URLs carried tracking IDs** → stripped before use; career-site URLs used instead.
- **`grep "break"` matched nothing** (the report shows company and title, not role id) → read the full report.
- **QA / Test Engineer scope dropped** after no open QA postings were found among the 20 strongest QA sponsors in the CSV.