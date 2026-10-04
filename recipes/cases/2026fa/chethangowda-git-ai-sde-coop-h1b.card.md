---
status: DRAFT
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# AI Engineer co-op to H-1B triage: human card

## Executive summary

**What this is.** A one-page guide for the person who must decide whether to trust this triage. It covers what the tool checks, what it cannot check, and how it fails.

**Why read it.** The tool's suggestions look precise. This card shows which parts come from real records and which are the author's assumptions.

**What it decides.** Nothing final. It suggests Apply / Consider / Skip per role under two start-date plans. Only past visa-sponsorship counts are real records.

**Audience:** a student targeting AI Engineer roles via a Spring co-op that might convert to full-time with H-1B sponsorship, or their advisor.
**Agent twin:** `recipes/cases/2026fa/chethangowda-git-ai-sde-coop-h1b.md` (it holds the open typed TODOs; this card has none of its own).

## Purpose

Answer: of these candidate roles, which deserve application time under each start-date plan, given only what the records actually support? If a fact is missing, the role is stopped and the gap is named.

## What it can verify

- The company's exact name is in the 80 Days to Stay CSV, along with its company-wide H-1B approval count, denial count and approval rate. The row number is cited.
- A blank approval count is reported as `no-sponsorship-record`, not zero.
- Roles with a missing liveness or timeline value never reach the scorer.

## What it cannot verify

- **Co-op-to-full-time conversion.** There is no data for it. This is the core premise of the co-op path, and it is unchecked.
- Whether the posting is live. In this run, liveness was typed in, not checked.
- Whether the company sponsors *this kind* of role. Counts are company-wide.
- The tier → probability mapping. It is the author's choice.
- The title → occupation code. It is a model judgment.

## Annotated commands

Run (expected: `7 candidates → 3 stopped before scorer · 4 scored × 2 scenarios`):

```bash
node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs
```

Offline test (expected: `16/16 checks passed`):

```bash
node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/test.mjs
```

## What it produces

- `out/triage-report.md`, for you: stopped roles with reasons, evidence per role with labels, and one decision table per scenario.
- `out/triage-log.json`, for the agent: the same content, with every value as `{value, label}`.

## Named failure modes

1. **Name mismatch.** "Databricks" vs `DATABRICKS INC`: exact matching stops the role instead of guessing. Hardest to catch for: a student who assumes "not found" means "doesn't sponsor". It doesn't. It means "check the legal name".
2. **Fail-open gate.** The shared scorer treats a missing liveness or timeline as open. A role with an unknown posting would score Apply. This tool stops such roles first. The offline test includes a `BROKEN-*` fixture showing the scorer's behavior, and a mutated copy of this tool fails the test (13/16).
3. **Company-wide counts read as role-specific.** 1,640 approvals at a large company says little about one co-op team's willingness to convert and sponsor. Hardest to catch for: anyone reading "Proven" as a promise.
4. **Thin margin.** With no fit vote, a Proven sponsor scores 0.315 against a 0.30 threshold. Any change to the mapping flips Apply to Consider.
