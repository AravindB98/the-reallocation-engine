---
status: RUNNABLE-SAMPLE
todos_open: 0
last_gate: "sample-run adequacy signed by Om Raut, 2026-10-21. Personally re-run and confirmed: npm run verify, the 24-test suite, and both pooled scorer runs (weight 0.0 and 0.15), diffed byte-for-byte against the saved output. The two deliberate break attempts (pooling with 15-2051.00; invalid --role-quality-weight values) were re-run by the agent and reviewed, not personally re-executed by Om Raut. See course/2026fa/submissions/omraut888/WORKED-RUN.md attestation and logs/runs/2026fa-omraut888-3.md."
attestation: null  # set only at VERIFIED. No RUNNABLE-LIVE gated run exists (no liveness check was run).
recipe_version: 0.3.0
---

# omraut888-cognitive-pivot-sponsor-fit — AI-resilience scoring for H-1B sponsors

## Executive summary

This is the operating recipe for a check that answers one question for an
international student targeting research-style AI roles: *of the companies
that have actually sponsored work visas for this kind of job, is the work
itself the kind that stays valuable as AI improves?* Sponsorship records say
who sponsors; they say nothing about how durable the sponsored work is. This
recipe joins the two and tests whether adding the durability signal changes
any apply/consider/skip recommendation.

It has run twice on real data. The first run (18 sponsors for computer and
information research scientists) changed **no** recommendation, because every
company in a one-occupation run gets the same durability bonus. The second
run pooled those with 12 software-developer sponsors. Research work scores
higher on durability, so the signal now **reorders** the list: every research
company moves above every software company. It still changed **no**
recommendation, because the way this recipe scores job fit puts every matched
role at the apply line before durability counts. That flaw is named below and
deliberately left in place. The software-developer group is also a poor
sample: the title matcher only sees a few alphabetically-first job titles for
it. No role is ever reported as "apply" here,
because no posting's liveness is checked. Occupations with no durability
score (Data Scientists) are refused, not estimated.

## Purpose — when to use this

Use it when you are an F-1 / OPT / STEM-OPT student aiming at a **specific
research-flavoured SOC code** (built and run for 15-1221.00 Computer and
Information Research Scientists, and compared against 15-1252.00 Software Developers) and you want a shortlist of known H-1B
sponsors whose sponsored titles look like that occupation, ranked with the
Cognitive Pivot durability score switched on. The worked persona is the same
fictional student as PR #3 (Priya Nair, ML/RAG, `search/examples/`), but the
mode reads **no persona data**: it is persona-agnostic in computation, and it
models no visa clock (that was PR #3's job).

Do **not** use it to decide where to apply. It produces a research shortlist;
liveness is unchecked by design.

## Required reads

1. `SNICKERDOODLE.md` — gates, provenance, TODO closure.
2. `DOMAIN.md` — layout; BLS lives under `data/bls/`, 80 Days under `data/80-days-to-stay/`.
3. `scripts/score/role-scorer.mjs` — the `role_quality: 0.0 // [VERIFY]` comment block, and `num(role.liveness?.factor) ?? 1` (an absent gate behaves like a passed one).
4. `data/bls/BLS-audit.md` — provenance of `cognitive_pivot_score` ("average of selected reasoning, judgment, and systems scores").
5. This recipe.

## Source Inventory

| Source | Path / command | Status |
|---|---|---|
| Cognitive-pivot scores | `data/bls/compact/soc_occupation_compact.csv` (sha256 `bac5acf7…43d1`) | existing, verified (BLS-audit.md). 1016 SOC rows, 894 scored, 122 blank |
| Sponsorship + job titles | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sha256 `eccdee2a…6270`) | existing, unmodified. **Has no SOC code field.** Columns used: `company_name`, `Total Approvals`, `Total Denials`, `top_job_titles_sponsored` |
| Role scorer | `node scripts/score/role-scorer.mjs` | existing. The ONE declared maintained-file patch: an additive `--role-quality-weight` flag |
| Mode code | `scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/` | new (this contribution) |

## Proposed additions — closures

All three were typed `DEV` items. They are closed by AI, with SNICKERDOODLE's required
evidence: the script exists, conformance passes, and the handoff condition is met.

| Item | Closed by / evidence | Handoff condition met |
|---|---|---|
| **DEV, CLOSED 2026-10-20**: `--role-quality-weight <n>` on `scripts/score/role-scorer.mjs` | Additive. Absent flag gives byte-identical `role-scores.json`/`.md` vs `HEAD` on `data/examples/ch11-roles.json` and `gate-behavior-roles.json`. `1.5`, `-0.1`, `abc`, `""`, and a missing value each exit 2 with a refusal, never clamped. `role-scores.json` now records `weights_effective` and `role_quality_weight_source` | before/after run done; 0 decisions changed (see Worked Run) |
| **DEV, CLOSED 2026-10-20**: `title-to-soc.py` | v2 phrase matcher. Result 18 matched / 1539 unmatched of 1557 sponsors with titles. Output byte-identical across two runs | 18 matches inspected by an earlier agent reading, relayed via chat instruction (model judgment, not a human check; not re-inspected in this session); named edge case recorded below. Later human check: Om Raut spot-checked 5 of 18 on 2026-10-21 |
| **DEV, CLOSED 2026-10-20**: `cognitive-pivot-report.py` (+ `cognitive-pivot-roles-builder.py`) | 19/19 unit tests (`test_cognitive_pivot_roles_builder.py`). Report and agent log were produced from real runs | human report exists; it is separate from the scorer's `role-scores.md` |

**Values supplied by the human (Om Raut, 2026-10-20). These are `your-input`, not derived:**
- role_quality weight under test = **0.15**. This is the weight proposed but never implemented in PR #3 (`omraut888-ml-h1b-timeline`). Carrying it forward is the intended throughline. Neither Ch.11 nor the design doc pins it.
- fit.p = **1.0** for any phrase match (labeled `model-judgment`). The run showed this saturates (see Limitations). It is kept as specified and flagged as the first next step.
- Normalization for role_quality.p = min-max over the scored rows of the compact table: (raw − 1.611) / (4.877 − 1.611). The bounds are computed from the file at run time and not assumed.

## How the title→SOC match actually works (and what it is not)

For each sponsored title, a phrase from the target SOC's O*NET title and
alternate titles counts as a match when **every word of the phrase appears
as a whole word in the title, in any order**. The single words `engineer`,
`scientist`, `scientists`, and `specialist` can never match alone. v1 did
allow that, and it produced 1110/1557 mostly-false matches. This is a
**bag-of-words proxy**, not a substring and not a classification. The
sponsorship CSV has no SOC field, so this bridge is necessary. Its output
must be presented to a human as a proxy every time.

## Phase gates

| Gate | Test | Pass | Fail |
|---|---|---|---|
| G1 title→SOC match | ≥ 1 sponsor title phrase-matches the target SOC's alternate titles | proceed to G2 | `missing: no-title-match` (per company: listed as unmatched; zero overall: stop) |
| G2 score exists | target SOC has a non-blank `cognitive_pivot_score` | proceed to scoring | `missing: no-cognitive-pivot-score`. 15-2051.00 Data Scientists is blank; the builder exits 3 and writes no roles file |
| G3 weight sanity | `--role-quality-weight` is a number in [0, 1] | run scorer | scorer exits 2 and refuses; never clamps |
| G4 liveness disclosure | every role carries `liveness: {factor: 1, source: "your-input: NOT verified — no ats:liveness check run for this mode"}` | report applies the downgrade: any scorer **Apply** is shown as **Consider — liveness unchecked** | the report refuses (exit 3) any roles file without that label; never ships an unqualified Apply |

Factor 1 is used only because the scorer needs a number to multiply. Any
fractional value would be an invented confidence (P3). Timeline is handled the
same explicit way: `factor 1`, with the source "your-input: not applicable to
this mode, no persona timeline modeled". The scorer would otherwise default an
absent timeline to 1 as well.

## What this mode can verify (record)

- A sponsor's approvals and denials, and the ratio approvals ÷ (approvals + denials).
- That a sponsored title contains all the words of an O*NET alternate-title phrase for the target SOC. This shows the words are present. It does not show they mean that occupation.
- The SOC's real `cognitive_pivot_score` (15-1221.00 = 4.516; 15-1252.00 = 3.834), and the scale bounds over the 894 scored rows. When several SOCs are pooled, all are normalized on that ONE range. The builder refuses if their ranges disagree, so their role_quality values are comparable (0.8895 vs 0.6806).
- Whether a nonzero role_quality weight changes any decision, by running the real scorer twice and diffing.

## What this mode cannot verify

- That a company's open posting is that SOC code. The bridge is a title proxy, not a DOL/BLS classification.
- That any posting is live. No `ats:liveness` check is run, so no role may be reported as Apply.
- That 0.15 is the right weight. It is `your-input`. With fit = 1.0 no weight can change a decision (shown on the pooled run); it can only reorder.
- That a title match represents the occupation fairly. The compact table carries only 8 alternate titles per SOC (8 of 31 for 15-1221.00, 8 of 93 for 15-1252.00), and occupation titles are plural.
- Anything for SOC codes with a blank score: 122 of 1016 rows, including 15-2051.00 Data Scientists.
- Whether a 1.0 approval ratio on 2 petitions means the same thing as one on 276. It does not, but the scorer treats them identically.

## Run (verbatim commands, from repo root)

```bash
C=scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit
R=course/2026fa/submissions/omraut888/run
python3 $C/title-to-soc.py --soc 15-1221.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out $R/soc-match-15-1221.00
python3 $C/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches $R/soc-match-15-1221.00/soc-match-output.json --out $R/roles.json
node scripts/score/role-scorer.mjs $R/roles.json --out-dir $R/weight-0.0
node scripts/score/role-scorer.mjs $R/roles.json --role-quality-weight 0.15 --out-dir $R/weight-0.15
# (single-SOC report, attempt 1:)
python3 $C/cognitive-pivot-report.py --roles $R/roles.json --matches $R/soc-match-15-1221.00/soc-match-output.json \
  --before $R/weight-0.0/role-scores.json --after $R/weight-0.15/role-scores.json --date <YYYY-MM-DD> \
  --md-out course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-<YYYY-MM-DD>.md \
  --log-out logs/runs/2026fa-omraut888-<n>.json

# Pooled comparison (attempt 2): repeat --soc/--matches in pairs; one shared normalization range
P=$R/attempt-2-pooled
python3 $C/title-to-soc.py --soc 15-1252.00 --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv --out $R/soc-match-15-1252.00
python3 $C/cognitive-pivot-roles-builder.py --soc 15-1221.00 --matches $R/soc-match-15-1221.00/soc-match-output.json \
  --soc 15-1252.00 --matches $R/soc-match-15-1252.00/soc-match-output.json --out $P/roles.json
node scripts/score/role-scorer.mjs $P/roles.json --out-dir $P/weight-0.0
node scripts/score/role-scorer.mjs $P/roles.json --role-quality-weight 0.15 --out-dir $P/weight-0.15
python3 $C/cognitive-pivot-report.py --roles $P/roles.json --matches $R/soc-match-15-1221.00/soc-match-output.json \
  --matches $R/soc-match-15-1252.00/soc-match-output.json --before $P/weight-0.0/role-scores.json \
  --after $P/weight-0.15/role-scores.json --date <YYYY-MM-DD> \
  --md-out course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-pooled-<YYYY-MM-DD>.md \
  --log-out logs/runs/2026fa-omraut888-<n>.json

python3 -m unittest $C/test_cognitive_pivot_roles_builder.py
```

## Output Contract

### Agent log (JSON)
`logs/runs/2026fa-omraut888-<n>.json` contains the fields `run_id`, `soc_code_target`, `companies_checked`,
`title_matches`, `title_match_failures`, `cognitive_pivot_score`, `role_quality_weight_tested`,
`decisions_before`, `decisions_after`, `decisions_changed`, `gate_results`, `generated_at`. It also
contains `source_labels`, `pivot_scale`, `inputs`, and `human_gate`.

### Human report (Markdown)
`course/2026fa/submissions/omraut888/cognitive-pivot-sponsor-fit-<date>.md` is written by
`cognitive-pivot-report.py`, not by the scorer's own `role-scores.md`. It has these sections: executive summary
(plain language), run record, before/after table (company · matched title · phrase · sponsorship p (n) ·
composite at each weight · scorer decision · **decision reported to you**), what changed and why,
contrast across SOC codes, limitations, decision this enables. Reader: the student deciding where to
spend application time. Decision enabled: which sponsors to research and liveness-check next.

## Stop conditions

- Target SOC has no `cognitive_pivot_score` → `missing: no-cognitive-pivot-score`, exit 3, no roles file. Never 0, never an average. In a pooled run, one blank target stops the WHOLE run; the group is never dropped quietly.
- Pooled targets on different normalization ranges → `missing: scale-mismatch`, exit 3. Unpaired `--soc`/`--matches` → exit 2.
- No sponsor title matches → `missing: no-title-match`. Never guess the nearest code.
- A matched company with approvals + denials = 0 → excluded as `missing: no-sponsorship-record`. sponsorship.p is never defaulted.
- `--role-quality-weight` outside [0, 1] or non-numeric → refuse, exit 2.
- Report input not written by the builder, or lacking the NOT-verified liveness label → refuse, exit 3.
- Never claim a posting *is* that SOC code, or that any role is Apply.

## Limitations found by running it

1. **Computational-science false positives: a systematic pattern.** Three 15-1221.00 matches are "Scientist, Computational <natural science>" titles that match "computational scientist": BLADE and CLADE THERAPEUTICS (Computational Biology; agent reading relayed via chat, model judgment) and RELAY THERAPEUTICS (Computational Chemist; flagged by the agent, then confirmed by Om Raut's 5-of-18 spot-check, which rated 4/5 sound and is the only human check). MARLINSPIKE (Computational Biophysicist) has the same shape (agent judgment only). They are flagged, not filtered.
2. **Data Scientists unscorable.** 15-2051.00 has a blank score. 55 sponsors title-matched it, and none can be scored.
3. **Fit saturates. This is kept on purpose so the comparison stays clean.** 1.0 × fit weight 0.30 = 0.30 = the Apply threshold, so every matched role is Apply at every role-quality weight. This was confirmed on the pooled run: the 0.0313 gap between the occupations reorders the list (23 roles tied at 0.65 split by SOC; WYZE LABS overtakes 8) but flips 0 of 30 decisions. Skip rate is 0%.
4. **Truncated title list.** Only 8 alternate titles per SOC reach the matcher, all alphabetically early (15-1252.00: "AI Specialist", "Application …"), and plural occupation titles never match singular job titles. Result: 12 software-developer matches, about 7 of which look doubtful (agent judgment; no human check), against at least 465 sponsors with a "software developer/engineer" title (ad-hoc count).

## Logging

Each sample run gets its own entry in `logs/runs/2026fa-omraut888-<n>.md` (CONTRIBUTING.md: students never edit
`logs/RUN_LOG.md`). Template:

```markdown
## YYYY-MM-DD — cognitive-pivot-sponsor-fit sample run (SOC <code>)

- **Recipe:** recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md v<version>
- **Inputs:** <CSV paths + sha256>, SOC <code>, role_quality weights <w0> vs <w1>
- **Outputs:** <roles.json, both role-scores.json, human report, agent log>
- **Result:** <matched/unmatched counts; Apply/Consider/Skip at each weight; decisions changed (exact list)>
- **Gates:** G1 <…> · G2 <…> · G3 <…> · G4 <n Apply → Consider — liveness unchecked>
- **Open issues:** <what did not work or is still missing; human gate status>
```
