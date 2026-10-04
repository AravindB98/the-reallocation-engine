# Worked run: AI Engineer co-op to H-1B triage

## Executive summary

**What this is.** One complete run of the triage on sample data, from inputs to decisions, with the real terminal output.

**Why read it.** It separates, line by line, what came from real records from what was typed in or judged by a model.

**What it found.** Of 7 candidate roles, 3 were stopped because a fact was missing: one unknown company, one company with no sponsorship count, and one posting with unknown status. On the co-op path, 2 of the remaining 4 roles came out Apply. On the no-co-op path, 1 did. The only real-record input is company-wide visa-sponsorship counts. Whether any co-op converts to a full-time offer is not checked.

## Run record

- Recipe: `recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md` v0.1.0 (DRAFT)
- Command: `node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs`
- Outputs: `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/` (`triage-log.json`, `triage-report.md`, `coop-path/`, `no-coop-path/`)

## Inputs (anonymized)

- **Persona:** Priya Nair, the fictional persona in `search/examples/priya-nair/`. In her file she is a post-completion OPT graduate; here she is treated as a current MS Information Systems student seeking a Spring 2027 co-op. That mismatch is stated.
- **Scenarios (your-input):**
  - co-op path: co-op available 2027-01, full-time 2027-09;
  - no-co-op path: full-time 2027-05.
- **Roles:** 7 hypothetical postings in `fixtures/candidates.sample.json`:
  - 6 at companies whose exact names appear in the 80 Days CSV;
  - 1 fictional company (`Lumenvale Applied AI (fictional)`).

## Commands and real output

```
$ node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs
✓ 7 candidates → 3 stopped before scorer · 4 scored × 2 scenarios
  STOP cohere-health-aie-ft: G2 gate-values-present — missing-gate-value: liveness
  STOP huggingface-mle: G1 company-in-record — no-sponsorship-record
  STOP lumenvale-aie-coop: G1 company-in-record — no-company-match
  [coop-path] ✓ scored 4 roles → Apply 2 · Consider 0 · Skip 2 (skip 50%)
  [no-coop-path] ✓ scored 4 roles → Apply 1 · Consider 0 · Skip 3 (skip 75%)
  scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/triage-log.json  +  scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/out/triage-report.md
exit=0
```

Decisions (from `out/triage-report.md`):

| Role | Co-op path | No-co-op path |
|---|---|---|
| DATABRICKS INC: AI Engineer Co-op | **Apply** 0.315 `(0.9·0.35) × 1 × 1` | Skip (no co-op start in this plan) |
| SNOWFLAKE INC: AI Engineer, New Grad | **Apply** 0.315 | Skip (2027-05 outside 2027-06..09) |
| MONGODB INC: AI Engineer, New Grad | Skip (2027-09 outside 2027-05..07) | **Apply** 0.315 |
| KLAVIYO INC: ML Engineer Co-op (marked closed) | Skip (liveness 0) | Skip |

## Verified vs. inferred, line by line

| Value | Label | Where from |
|---|---|---|
| DATABRICKS INC: 1640 approvals / 8 denials / 99.5% | **record** | CSV line 7249 |
| SNOWFLAKE INC: 1816 / 28 / 98.5% | **record** | CSV line 24658 |
| MONGODB INC: 462 / 4 / 99.1% | **record** | CSV line 17197 |
| KLAVIYO INC: 154 / 4 / 97.5% | **record** | CSV line 14495 |
| HUGGING FACE INC row exists, approvals blank | **record** (blank) | CSV line 12615 |
| Lumenvale not in CSV | **record** (absence, exact-match search) | whole CSV |
| Tier "Proven" and p = 0.9 for all four | **your-input** | author's mapping, ≥100 approvals and ≥95% |
| Liveness 1.0 / 0.0 / null | **your-input** | hypothetical postings; not checked |
| Start windows and available months | **your-input** | hypothetical |
| Timeline factor 1.0 / 0.0 | **your-input** (computed from the two your-input dates) | `triage.mjs` `timelineFactor` |
| SOC 15-1252 / 15-2051 / 15-1221 per title | **model-judgment** | title → SOC |
| Composite and Apply/Skip | scorer output over the above | `scripts/score/role-scorer.mjs`, unmodified |
| Co-op conversion | **not verified** | no data |

So every Apply rests on one record (company-wide approval counts) and three typed-in assumptions: tier mapping, liveness and start window.

## Verification

- **Hand cross-check.** The Databricks numbers were checked against the CSV with a separate Python `csv` read: `'DATABRICKS INC' | CA |A 1640.0 D 8.0 R 99.51456310679612`. This matches the log's 1640 / 8 / 99.5%. The arithmetic 0.9 × 0.35 = 0.315 ≥ 0.30 gives Apply.
- **Test.** `test.mjs` gives 16/16 (see the test report).
- **Deliberate break.** Mutant B, with the missing-liveness check removed and optional chaining added, gives 13/16 and exit 1. The `BROKEN-*` fixture shows the unmodified scorer scoring a role with no gates as Apply.

## Reflection

*(Student to complete. Draft prompts:)*
- **What worked:** the stops; two scenarios side by side.
- **What was missed:** liveness not machine-checked; all four scored companies landed in the same tier, so Consider was only exercised in the fixture.
- **One concrete next improvement:** ______

## Attestation

The rows below were run by the AI agent in the student's session, and the output is pasted as produced. The student must review or re-run them before filling in the name. Until then this is unsigned.

- Recipe: chethangowda-git-ai-sde-coop-h1b v0.1.0
- By: ______ (student) · ______

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `node …/triage.mjs` | `7 candidates → 3 stopped before scorer · 4 scored × 2 scenarios`, exit 0 | 3 stops (missing company, blank record, missing liveness) and 4 scored |
| `node …/test.mjs` | `16/16 checks passed`, exit 0 | all pass |
| Scorer on `fixtures/BROKEN-missing-gate-sent-to-scorer.json` | `Apply ((0.9·0.35) × 1 × 1 = 0.315)` | demonstrates fail-open gates in the scorer |
| Mutant B: liveness check removed, `?.` added | `13/16 checks passed`, exit 1 | test fails |
| `npm run score -- data/examples/ch11-roles.json --out-dir …/runs` | `Apply 2 · Consider 1 · Skip 2 (skip 40%)` | reproduces the shipped example |

### Did not test
- Live postings and `npm run ats:liveness` (Playwright browser missing)
- Node 20; GitHub CI
- `ambiguous-match` and missing-CSV-column branches
- Any co-op-to-full-time conversion (no data exists)

### Broke during testing, fixed
- `test.mjs` crashed with ENOENT when triage itself failed (mutant A). It now exits 1 with `triage failed; remaining checks not run`. Fixed in `scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs`.
