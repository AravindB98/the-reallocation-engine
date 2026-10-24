# Worked run — ds-newgrad-h1b-15-2051

## Inputs

- **Persona:** fictional Sasha Jones (`scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/fixtures/persona.example.json`):
  F-1, program ends 2026-12-18, EAD expected 2027-01-05, 0 of 90 unemployment
  days used, 20-day buffer, 60-day hiring-lag assumption. All your-input.
- **Candidates:** `course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json`
  — 8 roles at real companies; fit values are Sasha's own low ratings because
  every posting found asks for 4+ years or is Senior/Staff.
- **Data:** the full shipped CSV (30,369 rows) and the BLS compact file. No Form D samples.

## Commands and real output

Liveness, run 2026-10-03:

```text
$ npm run ats:liveness -- "https://careers.airbnb.com/positions/6632687" "https://boards.greenhouse.io/airbnb/jobs/6768605" "https://builtin.com/job/data-scientist/3375738" "https://job-boards.greenhouse.io/figma/jobs/5552580004" "https://www.builtinaustin.com/job/data-scientist-search/9459092"
Checking 5 URL(s)...

❌ expired    https://careers.airbnb.com/positions/6632687
           HTTP 404
✅ active     https://boards.greenhouse.io/airbnb/jobs/6768605
✅ active     https://builtin.com/job/data-scientist/3375738
⚠️ uncertain  https://job-boards.greenhouse.io/figma/jobs/5552580004
           content present but no visible apply control found
✅ active     https://www.builtinaustin.com/job/data-scientist-search/9459092

Results: 3 active  1 expired  1 uncertain
```

The first `ats:liveness` attempt failed with `browserType.launch: Executable doesn't
exist`; fixed with `npx playwright install chromium`.

Triage run (output appended by command):

```text
$ python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
zsh: no such file or directory: python3 scripts/contrib/2026fa/rithika-sr-ds-newgrad-h1b-15-2051/triage.py --candidates course/2026fa/submissions/rithika-sr/worked-run/candidates.sasha.json --today 2026-10-03 --out-dir course/2026fa/submissions/rithika-sr/worked-run/out
```

Report written by the run (`course/2026fa/submissions/rithika-sr/worked-run/out/triage-report.md`), verbatim:

````markdown
# Sponsor triage — Sasha Jones (fictional) · run date 2026-10-03

Target: Data Scientist (entry level), SOC 15-2051. Recipe `recipes/cases/2026fa/rithika-sr-ds-newgrad-h1b-15-2051.md`, prototype v0.1.0.
Labels: **[record]** came from repo data; **[your-input]** came from the person. This run used **no model judgment**.

**Summary:** 8 candidate roles → 4 scored, 4 held at a gate. Scorer decisions: Skip 1 · Apply 3.

## Scored roles (decision from scripts/score/role-scorer.mjs)

| Role | Decision | Composite | Sponsorship [record] | Fit [your-input] | Liveness [record] | Timeline [your-input] | Next action |
|---|---|---|---|---|---|---|---|
| AIRBNB INC — Data Scientist, Platform | **Skip** | 0.000 | Proven (p 0.9; 1000 approvals, rate 99.0%; Data Scientist, Senior Data Scientist) | 0.4 | closed (2026-10-03) | 1.0 | Skip. Spend the time on networking or credibility hours. |
| AIRBNB INC — Staff Data Scientist, Locations | **Apply** | 0.375 | Proven (p 0.9; 1000 approvals, rate 99.0%; Data Scientist, Senior Data Scientist) | 0.2 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |
| MAPLEBEAR INC — Data Scientist | **Apply** | 0.465 | Proven (p 0.9; 498 approvals, rate 99.2%; Senior Data Scientist, Data Scientist) | 0.5 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |
| NEXTDOOR INC — Data Scientist - Search (Senior) | **Apply** | 0.405 | Proven (p 0.9; 222 approvals, rate 96.5%; Data Scientist) | 0.3 | live (2026-10-03) | 1.0 | Tailor and send an application (research-and-apply block). |

**⚠ Needs a human (G4):** Apply here comes mainly from sponsorship, not fit (fit < 0.5). A Proven sponsor alone contributes 0.9 × 0.35 = 0.315, which already clears the 0.30 Apply threshold:
- AIRBNB INC — Staff Data Scientist, Locations (fit 0.2)
- NEXTDOOR INC — Data Scientist - Search (Senior) (fit 0.3)

## Held at a gate (not scored, nothing invented)

| Role | Gate | Why held | Next action |
|---|---|---|---|
| Airbnb — Staff Data Scientist, Locations | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |
| Instacart — Data Scientist | G1 | company not found in sponsorship CSV (exact-name match; may be a naming miss) | Search the CSV by hand for the legal name before deciding. |
| Figma Inc — Data Scientist | G2 | liveness checker said 'uncertain', which is neither live nor closed | Run: npm run ats:liveness -- https://job-boards.greenhouse.io/figma/jobs/5552580004 |
| $AVY INC — Data Scientist (no posting found) | G1 | company is in the CSV but Total Approvals is blank: no sponsorship record (not zero) | Treat sponsorship as unknown; network to ask before applying. |

## Visa timeline gate [your-input]

Factor **1.0**: 94 days until EAD start + 70 unemployment days left = 164 available / 60-day hiring lag.

## Role quality (report only — weight 0 in the scorer)

- [record] Data Scientists, OEWS 2024: median $112,590, mean $124,590, employment 233,440.
- [record] OEWS wage is published at the 6-digit SOC, so all O*NET sub-occupations of this SOC share it (a group wage).
- **Missing:** O*NET ability levels and cognitive_pivot_score are empty for this row, so AI-resilience cannot be checked from repo data.

## What this run did NOT verify

- Whether a company sponsors SOC 15-2051 specifically. CSV approval counts are company-wide; the title check only looks at top_job_titles_sponsored. [TODO: DATA SOURCE] SOC-coded DOL LCA disclosure data.
- Company matching is exact (case-insensitive). A G1 miss may be a naming difference (e.g. 'Airbnb' vs 'AIRBNB INC'), not a non-sponsor.
- Liveness values are transcribed from ats:liveness checks recorded in the candidates file; this prototype does not run the check itself. [TODO: DEV]
- The timeline formula reflects a general understanding of the 90-day OPT unemployment limit. It is not legal advice; confirm dates with the school's international student office.
- BLS wage is a national OEWS estimate shared by all O*NET sub-occupations of 15-2051 (a group wage), not an offer. role_quality carries weight 0 in the scorer, so it does not change any decision.
- Funding values come from the CSV; they were not re-checked against new SEC filings.

## Human gate G4

These are recommendations. A named person reviews this report and decides Apply / Network / Skip for each role.

````

## Verified vs. inferred

| Value | Label | Where it came from |
|---|---|---|
| Approvals, rate, top titles for AIRBNB INC, MAPLEBEAR INC, NEXTDOOR INC | record | CSV (cross-checked below) |
| `$AVY INC` has no approvals value | record (an absence) | CSV row 2; reported as "no record," not 0 |
| Tier Proven, p = 0.9 | record inputs + my rule (your-input) | thresholds in `RULES`, p values from `data/examples/ch11-roles.json` |
| Fit 0.2–0.5 | your-input | Sasha's own rating |
| Liveness live / closed / uncertain | record (transcribed) | `ats:liveness` output above, 2026-10-03 |
| Timeline 1.0 | your-input | persona dates + 60-day lag assumption |
| BLS median $112,590 for 15-2051 | record | BLS compact row `15-2051.00` |
| Composite and decision | computed by `role-scorer.mjs` from the rows above | scorer output, unchanged scorer |
| "Instacart is MAPLEBEAR INC" | **inferred** (outside knowledge, not in repo data) | used only to pick test names |
| Maplebear posting actually removed | **human check** contradicting a record | builtin.com page text, opened by hand |
| Model judgment | **none used** | — |

## Verification

1. **Hand arithmetic** against the scorer (sponsorship weight 0.35, fit 0.30, gates 1.0):
   MAPLEBEAR 0.9×0.35 + 0.5×0.30 = **0.465** ✓; NEXTDOOR 0.315 + 0.3×0.30 = **0.405** ✓;
   AIRBNB Staff 0.315 + 0.2×0.30 = **0.375** ✓. The 404 posting: liveness 0 → **0.000** ✓.
2. **Reproduced on a fresh clone:** `diff` of the two reports → `REPRODUCED: report identical` (TEST-REPORT §2).
3. **Opened the Instacart builtin.com page by hand:** it states the job was removed at
   02:28 p.m. (UTC) on Wednesday, Jun 11, 2025, while still showing an apply button.
   The checker had marked it `active`, so the MAPLEBEAR INC **Apply is a false positive**.
4. **Cross-checked the CSV values by hand** (output appended by command):

```text
$AVY INC | approvals: '' | rate: '' | titles: 
AIRBNB INC | approvals: '1000.0' | rate: '99.009900990099' | titles: ['Software Engineer', 'Senior Software Engineer', 'Data Scientist', 'Senior Data Scientist', 'Engineering Manager']
MAPLEBEAR INC | approvals: '498.0' | rate: '99.20318725099602' | titles: ['Senior Software Engineer', 'Senior Machine Learning Engineer', 'Software Engineer', 'Senior Data Scientist', 'Data Scientist']
NEXTDOOR INC | approvals: '222.0' | rate: '96.52173913043478' | titles: ['CUSTOMER ANALYTICS & INSIGHTS MANAGER', 'Data Scientist', 'Software Engineer ', 'Software Engineer', 'Lead, Software Engineering', 'Machine Learning Engineer']
```

## Reflection

**What worked.** Every role the tool could not verify was held with a reason instead
of scored: two brand-name misses, one blank record, one uncertain posting. The run is
reproducible from a fixed `--today`, and every value is labeled.

**What it got wrong or missed.**
- It sent a removed job to **Apply**: the liveness gate trusted an aggregator page.
- Two of three Applies (Airbnb Staff, Nextdoor Senior) come from sponsorship, not
  fit. The ⚠ flag catches them, but the decision itself still says Apply.
- The same Airbnb posting is held or scored depending only on how the name is typed.
- No posting I found was entry-level, so the tool can't yet answer the real question
  for a new grad: which sponsors hire *junior* data scientists.

**Concrete next improvement.** At G2, treat an aggregator URL as `uncertain` unless
the employer's own ATS posting (Greenhouse/Lever/Ashby) is also checked `live`. In
this run, that one rule would have held MAPLEBEAR at G2 instead of sending it to Apply.

## Attestation

- Recipe: ds-newgrad-h1b-15-2051 v0.1.0
- By: Rithika Sankar Rajeswari (rithika-sr) · 2026-10-03

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `python3 -m unittest discover ...` (local and fresh clone) | 17 tests, OK | all pass |
| Worked run on the real CSV | 8 roles → 4 scored, 4 held; Apply 3, Skip 1 | matched my written prediction exactly |
| Fresh-clone rerun + `diff` | `REPRODUCED: report identical` | identical report |
| **Break:** `--out-dir data/examples` | `✗ stopped ... refusing to write`, exit 2 | refuse to write into tracked folders |
| **Break:** `--today 2028-02-01` | `Apply 0 · Consider 0 · Skip 4 (skip 100%)` | timeline gate closes |
| **Break:** `--candidates nope.json` / `--today 2026-13-01` | `✗ stopped`, exit 2 each | stop, invent nothing |
| Hand check of builtin.com Instacart page | "job was removed ... Jun 11, 2025" | checker said active → false positive found |
| Hand arithmetic for 4 composites | 0.465 / 0.405 / 0.375 / 0.000 | match scorer |

### Did not test

- `triage.py` running `ats:liveness` itself (results are transcribed by hand).
- A persona with `needs_sponsorship: false` (the scorer's sponsorship-weight-0 branch).
- CSV files with two rows of the same company name (code keeps the first; untested).
- Any brand/legal name pair beyond Airbnb and Instacart.
- SOC-specific sponsorship counts (not in repo data).
- Windows or Linux; only macOS with Python 3.14 and Node 24.
- Whether the 60-day hiring lag is realistic; it is an assumption.

### Broke during testing, fixed

- `npm run verify` failed (`No module named 'yaml'`) → repo `.venv` + `pip install pyyaml`; documented in README.
- `npm run ats:liveness` failed (Chromium not downloaded) → `npx playwright install chromium`; documented in README.
- `triage.py` failed to compile (`SyntaxError`, line 473) after a duplicated paste → removed lines 473+ with `sed`, verified with `py_compile`.
- A committed log contained my home-folder path (created before the `rel()` fix) → regenerated, amended the unpushed commit, verified `0` matches in branch history.
- Report showed a raw Python dict and 12-decimal rates, and called "uncertain" an "unrecognized" status → formatted and reworded.
- After seeing a Proven sponsor alone clear Apply, added the ⚠ weak-fit flag to the report.
