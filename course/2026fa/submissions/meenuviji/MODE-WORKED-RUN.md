# Worked Run: Mode Build (2026-10-21)

## Executive summary

**What this is.** A record of one extra run made on 2026-10-21: the 12 sample job postings that passed the tool's checks were sent straight through the project's own scoring command, with nothing in between.

**Why read it.** It shows the project's standard scoring command running on this tool's output, with the terminal output pasted exactly as it appeared, so a reviewer can rerun the same command and compare.

**What it found.** The scorer gave the same results as the original 3 October run: 2 Apply, 8 Consider, 2 Skip, identical role by role. Only the date stamp differs. The sponsorship figures come from real employer records; the postings themselves are invented, and two inputs (whether the posting is still open, and how well it fits) are the student's assumptions, not measurements.

The Oct 3 worked run (prototype run, tests, verification, reflection and attestation) is in WORKED-RUN.md.

## Commands and output

The same 12 gated roles were run through the repo's own scorer command. This is the command the prototype calls internally (`lib/score_bridge.py`, recorded in `out/run.json` → `scorer.command`), but with a separate output folder so the tracked `out/score/` files are not rewritten. Run from the repo root on the working branch:

```bash
npm run score -- scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run ; echo "exit: $?"
```

~~~text
> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/roles.json --out-dir course/2026fa/submissions/meenuviji/recon/score-worked-run

✓ scored 12 roles → Apply 2 · Consider 8 · Skip 2 (skip 17%)
  course/2026fa/submissions/meenuviji/recon/score-worked-run/role-scores.json  +  course/2026fa/submissions/meenuviji/recon/score-worked-run/role-scores.md
exit: 0
~~~

What is real and what is not in this run:
- **Real (record).** The sponsorship values in `out/roles.json` come from the 80 Days CSV.
- **Not real.** The postings are fictional; liveness (1.0, "assumed, not checked") and fit (0.5) are my inputs.
- **Reproducible.** Compared with the committed `out/score/role-scores.json` (generated 2026-10-03), the scored roles and the scorer config are identical. Only the `generated` date differs (2026-10-21).
