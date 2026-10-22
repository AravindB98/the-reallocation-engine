# PM sponsor title-match — human card (v0.2.0)

**Audience:** an international student on STEM OPT deciding which product-manager postings deserve tailoring time today.
**Agent twin:** `recipes/cases/2026fa/aravindravi7-pm-sponsor-title-match.md`
**Engine layers:** 80 Days to Stay (approvals), Job-Ops (scan, liveness), Cognitive Pivot (wages, context only), plus DOL labor condition applications (per-filing). Feeds the Ch.11 scorer unchanged.

## Executive summary

A company that sponsors hundreds of engineers may never have sponsored a product manager. This card explains how to read the recipe's report: what each decision and label means, which gates need you, and the ways the output can mislead. Two rules matter most. A filed visa application is not an approval. And a role can score Apply while its job description screens you out, because the scorer cannot read eligibility rules.

## What it can verify

- The sponsorship-dataset row it used, and how it was matched.
- The company's PM-family visa filings from October 2025 to June 2026, with status, job family, SOC code, wage and case numbers. Also whether the company filed any H-1B application at all, which separates "no PM filing" from "not in the data".
- Whether two legal names of one company share a federal tax ID.
- What the liveness checker saw at that exact link.

## What it cannot verify

- Whether a filing became a visa or a hire.
- Eligibility screens in the job description (experience caps, degree rules).
- E-Verify enrollment: you check it on e-verify.gov.
- Filings under a different trade name of the same company.
- Funding beyond a 200-filing sample.
- What the employer would pay you.

## Annotated commands

Sample run on fixtures. Every row comes back as **DEMO** with a "would be if live" result, and nothing clears a gate:

```bash
node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/pm-sponsor-triage.mjs --sample
```

Offline tests (49 Node + 17 Python):

```bash
node --test scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test/
```

```bash
.venv/bin/python -m unittest discover -s scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/test -p "test_*.py"
```

Machine-readable liveness (writes one JSON line per posting):

```bash
node scripts/contrib/2026fa/aravindravi7-pm-sponsor-title-match/liveness-json.mjs --file urls.txt --out liveness.jsonl
```

## How to read a row

| You see | It means | You do |
|---|---|---|
| **Apply**, Proven | Approvals include a PM title in this posting's family | Check E-Verify, then tailor |
| **Apply**, LCA-filed | No approval-backed PM title, but a filed PM application in this family this year | Check E-Verify, then tailor. It's a filing, not an approval. |
| **Consider**, Possible / Likely | Sponsors, but the PM evidence is missing or in the other family | Ask a PM there before applying |
| **HOLD**, unemployment-margin | Your allowance minus the hiring lag is under your threshold | Accept or decline, with your reason |
| **HOLD**, liveness-uncertain | The checker couldn't see an apply button | Open the page; record active or expired |
| **HOLD**, ambiguous-lca-employer | Two legal names with different tax IDs | Record which names count, and why |
| **DEMO** | Test data | Nothing. It's a demonstration. |
| Employer tier 1–4 | Your ranking of how bleeding-edge the employer is | Choose within a group; it never changes a decision |

## Named failure modes (domain-specific)

1. **A certified application read as an approval.** An LCA is the step before the visa petition, and many are never used. *Hardest to catch for:* a student skimming "filed" as "sponsors me".
2. **SOC-keyed wages misread for PM roles.** PM has no SOC of its own: Stripe's 19 PM filings use six different codes. *Hardest to catch for:* a PM candidate reading one BLS median as their market rate.
3. **The wrong clock.** The scorer grades time to OPT end, while the unemployment allowance is what binds. *Hardest to catch for:* the student closest to running out. The recipe holds roles below the margin threshold you set.
4. **Eligibility screens are invisible to the score.** Four roles at fit 0.3 scored Apply in the 2026-10-21 run. *Hardest to catch for:* anyone who trusts the decision column without reading the job description. A gate for this is the open TODO.
5. **Name traps.** Brand ≠ legal name. An investment fund carries a company's name. One company files under two legal suffixes, or the same tax ID files under another trade name. Exact matching plus FEIN resolution handles the first three; the fourth stays a stated gap.

## Where it fits the day

It does the per-posting sponsorship research inside the two research-and-apply hours. It turns Consider rows into specific networking asks, and dead postings at proven sponsors into informational-interview targets.
