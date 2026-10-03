# Network Engineer H-1B sponsorship triage — human card

**Audience:** an F-1 master's student, OPT not yet started, deciding which Network Engineer openings deserve application hours and which companies deserve networking hours first.  
**Agent twin:** `recipes/cases/2026fa/prpathak1-network-eng-h1b-soc-15-1241.md` (DRAFT, v0.1.1)  
**Decisions behind it:** `course/2026fa/submissions/prpathak1/CHANGE-BRIEF.md` (revisions r1–r3)

## Purpose

Answer one question with local records: **has this employer sponsored H-1B visas for network-titled roles before?** Then hand each opening to the repository's existing scorer.

Openings that cannot be checked are not scored. They are named, with the reason. A network match can reach **Consider**, never Apply on its own, because the data shows only that the employer sponsored a network title at least once, not that it does now.

## What it can verify (record)

- For a company's row in the 80 Days to Stay CSV: total H-1B approvals, denials, approval rate, and the exact sponsored job-title strings. The run logs the file's SHA-256.
- Whether the company's normalized name appears in the four **sample** SEC Form D files that ship with the repo.
- The BLS national median wage for SOC 15-1241 (130,390, OEWS 2024), shown as context, never scored.
- What the scorer returned. Its own output file is kept unedited.

## What you supply (your-input)

- **Network-title rule:** a title counts only if it contains "network" **and** engineer, architect, administrator, or admin. A bare "Engineer" never counts.
- **Persona dates:** program end 2027-05-15, OPT start 2027-06-01, 90-day unemployment limit, 60-day hiring lag.
- **Fit (0–1) per opening,** and the list of openings.
- **In sample mode, the posting liveness results.**
- **Fit values** for the v0.1 openings: proposed by the AI, reviewed and accepted by you.
- **The mapping rules:**
  - network title + ≥ 1 approval → Likely 0.6;
  - ≥ 1 approval, no network title → Possible 0.5;
  - 0 approvals → None 0;
  - timeline slack ≥ 30 days → 1.0, 0–29 → 0.5, negative → closed.
- **No model judgment is used in this version.**

## What it cannot verify

- How many of a company's approvals were network roles. There are no per-title counts.
- When the sponsorship happened. The data has no dates.
- Whether the employer sponsors **now**, or for this opening.
- That a title is SOC 15-1241. There is no title-to-SOC crosswalk yet.
- The H-1B cap lottery, and cap-gap timing.
- Funding. Only samples exist, so absence is "no record in sample data", never "not funded".
- Whether a posting is live, in sample mode.
- That a CSV row is the same legal employer as the posting. Names are matched exactly after normalization, which is not proof of identity.

## Gates you clear

| Gate | You must see | It stops when |
|---|---|---|
| Profile pre-check | the exact authorization text sent to the scorer, your "needs sponsorship" answer, the scorer's reading of it | the scorer misreads a sponsorship-needing profile. The text is never reworded to get around this. |
| Timeline inputs | your four dates/limits, and that OPT start is within 60 days after program end | an input is missing, or OPT start is out of range |
| Liveness (per opening) | URL, result, reason, check date | the result is uncertain or absent → not scored |
| Visa timeline | days of slack and the factor sent | slack is negative → not scored |

## Dependencies

- Node (v20+); the prototype will be JavaScript.
- Python 3 reachable as `python3`, for the repo's company-name normalizer in `scripts/sec/entity-resolution.py`. On native Windows this needed a `python3.cmd` shim; see the recipe's facts table.
- Data: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`, `data/sec/form-d/processed/sample/*.sample.json`, `data/bls/compact/soc_occupation_compact.csv`.
- Scorer: `scripts/score/role-scorer.mjs` (CLI only; it has no exports).

## Annotated commands

Run the triage on the fictional persona (sample mode). Expected: two output files in `course/2026fa/submissions/prpathak1/runs/<run_id>/`, with every opening listed once. Exit 0 = all scored, 1 = some openings missing or not scored (each with its reason), 2 = run stopped:

```bash
node scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/run.mjs
```

Offline tests: missing company, bare "Engineer", closed OPT window, the "authorized" profile trap, a 404 posting. Expected: all 19 pass with no network. Keep the quotes: on Node 24, a bare folder argument fails with `Cannot find module`.

```bash
node --test "scripts/contrib/2026fa/prpathak1-network-eng-h1b-soc-15-1241/test/*.test.mjs"
```

What the scorer does with a role list (exists today; always pass `--out-dir`):

```bash
npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/prpathak1/runs/ch11-baseline
```

## What it produces

- **A Markdown report for you,** with these lists:
  - Consider: tailor and confirm sponsorship;
  - Network, do not apply yet;
  - Skip;
  - Not scored (gate + reason);
  - Missing (reason).

  It also has a per-opening evidence table with every value labeled, context outside the score, and a "cannot verify" list.
- **A JSON log for the agent:** the same content, plus input file hashes and gate values.
- **The scorer's own output files,** unedited.

How the lists map onto the 3-3-2 day:

| List | Where it goes |
|---|---|
| Consider | the **2** application hours |
| Network, do not apply yet | the **3** networking hours |
| Skip | time returned to the day |

## Named failure modes

1. **Staffing-firm inflation:** an IT staffing or outsourcing firm with hundreds of approvals and one "Network Engineer" title looks like a strong network sponsor. Most of its approvals may be other roles. The prototype cannot tell the difference, because there are no per-title counts. This is hardest to catch for a student who sees a big approval number and a matching title. Mitigation: denials and the approval rate are shown as context, and "confirm current sponsorship" is the required next action.
2. **Title blind spot:** network engineers sponsored under generic titles ("Infrastructure Engineer", "Systems Engineer") fail the keyword rule. Those companies show as Possible, not Likely. A recruiter reading only the report would not see what was missed. Mitigation: every match shows the exact title string; generic titles are never upgraded by guesswork.
3. **Stale sponsorship:** a title sponsored years ago reads the same as one sponsored last quarter, because the data has no dates. Mitigation: no Proven tier; network matches cap at Consider.
4. **Name split:** one employer under two spellings becomes two companies. One copy may land in "missing" while the other is matched. Mitigation: missing rows show the exact name that failed to match, so a person can search by hand.
5. **Substring over-match:** the keyword rule matches inside words. "Engineering Manager, Networking" counts as a network-engineering title, which made SKYTAP INC "Likely" in the v0.1 sample run. My prediction P1 expected only missed matches, not this one. A reader sees only "Likely" unless they open the evidence table, which shows the exact title. Mitigation: the matched title is always printed; the rule is unchanged.
6. **Weak network signal:** a network match (p 0.6) and no network match (p 0.5) differ by only 0.035 on the composite. In the sample run, a company whose only sponsored title is "Engineer" reached Consider (0.355) beside two network matches (0.42, 0.45), and only 1 of 5 scored openings was skipped (20%). Mitigation: the evidence table shows tier and titles per opening; a network-match weight is proposed (A5 in the recipe).
7. **Fail-open gate (engine):** if a liveness or timeline value were left blank, the scorer would treat it as fully open. A blank opening could then outscore a fully checked one. Mitigation: the prototype stops such openings before scoring. An upstream fix is proposed (U1 in the recipe).
