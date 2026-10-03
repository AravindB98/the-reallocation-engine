# PR description (DRAFT — not yet opened)

*Audience: the course maintainer and TAs reviewing the PR. Bracketed `<…>` items are filled at final
verification, from real output only. Paste this text into the PR, without this note.*

---

**Title:** `2026fa aditya-raj-sde: Sponsor & Posting Reality Check (sponsorship + liveness) — <RUNNABLE-SAMPLE | SPECIFIED>`

## Executive summary

This PR adds a student case recipe and a small offline prototype for one question an international
engineering candidate faces before tailoring an application: is the posting still open, and is
there sponsorship evidence for **this opening**, as opposed to the company's history?

- It reuses the repo's liveness classifier and role scorer without copying them.
- It never converts company sponsorship counts into a score.
- It stops every refused opening at a gate that no score can override.
- It reports timing as unverified.

**Two CI jobs are expected to fail for reasons that pre-date this branch. Details and evidence are
below.**

## What this PR adds

The component is `sponsor-live-jan2027`, covering the **sponsorship** layer (80 Days to Stay CSV,
reported as context only) and the **Job-Ops liveness** layer (`classifyLiveness`, used as a gate),
with the **maintained scorer** used only on labeled hypothetical scenarios.

- **Recipe + card:** `recipes/cases/2026fa/aditya-raj-sde-sponsor-live-jan2027{.md,.card.md}`, status `<status>`, `todos_open: 0`, `attestation: null`.
- **Prototype, probe, offline tests, fixtures, README:** `scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/`.
- **Run log:** `logs/runs/2026fa-aditya-raj-sde-1.md`. `logs/RUN_LOG.md` is not touched.
- **Justification, worked run, test report, Frictional, sources, evidence:** `course/2026fa/submissions/aditya-raj-sde/`.

Branch: `contrib/2026fa-aditya-raj-sde-sponsor-live-jan2027` · This is my ONLY open PR: [<x>] yes
Maintained file I deliberately patch: `none`

## Checklist

- [<x>] `npm run doctor` clean locally (last 3 lines below)
- [<x>] No real PII anywhere in this branch's history; fictional persona Aarav Patel only (`pii-scan --diff` output below)
- [<x>] Run log added as `logs/runs/2026fa-aditya-raj-sde-1.md`; `logs/RUN_LOG.md` not edited
- [<x>] Recipe + card under `recipes/cases/2026fa/` with honest lifecycle frontmatter
- [<x>] Tests green, with real output pasted below
- [<x>] Diff touches only my namespaced paths (no maintained-file patch)
- [<x>] `npm run verify` passes locally (with PyYAML from a local `.venv`, as CI installs it)

## Doctor output (last 3 lines, pasted)

```
<paste>
```

## `npm run verify`

```
<paste>
```

## `node scripts/pii-scan.mjs --diff upstream/main` (contribution-scoped)

```
<paste>
```

## Tests (pasted, not described)

```
$ node --test scripts/contrib/2026fa/aditya-raj-sde-sponsor-live-jan2027/reality-check.test.mjs
<paste>
```

## Pre-existing CI failures (not introduced by this branch)

1. **`doctor-and-pii` → "PII scan (working tree)".** `package-lock.json` line 606 contains npm
   registry deprecation text for `glob@10.5.0`, which includes a maintainer email address.
   - Upstream's own CI failed this step on `015843d` (2026-09-23).
   - Reproduced locally on an unchanged upstream worktree.
   - The contribution-scoped `--diff` scan of this branch is clean.
   - Evidence: `course/2026fa/submissions/aditya-raj-sde/evidence/20-…`, `21-…`.
   - Possible maintainer fixes: update `glob` and regenerate the lockfile, or make a scanner policy
     decision for lockfile registry metadata.
2. **`harness-regression`.** 4 of the 6 harness scripts named in `.github/workflows/contrib-gate.yml`
   do not exist at `015843d`:
   - `scripts/test/gate-behavior-harness.mjs`
   - `scripts/test/fuzz-invariants.mjs`
   - `scripts/gates/gate-behavior-harness.mjs`
   - `scripts/score/scorer-harness.mjs`

   Upstream CI failed this job on `015843d`. Evidence: `evidence/21-…`, `22-…`.

This PR changes none of those files.

## Honest limits

- Cannot establish that any opening will be sponsored.
- The CSV counts have unspecified time coverage.
- Liveness values are point-in-time.
- Wording rules miss paraphrases.
- Timing and fit are labeled sample inputs.
- 8 of the 9 sample postings are synthetic.

See the recipe's "What it cannot verify".

🤖 Generated with [Claude Code](https://claude.com/claude-code)
