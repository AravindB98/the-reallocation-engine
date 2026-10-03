# Co-op sponsor check (software roles) — human card

**Audience:** an international master's student on F-1 choosing a software or full-stack co-op, and the advisor or reviewer who checks their list.
**Agent twin:** `recipes/cases/2026fa/arundhatik26-coop-sponsor-swe-15-1252.md`
**Status:** DRAFT (a sample run has been completed; 5 typed TODOs are still open).

## Purpose

Answer one question per co-op role: *Does the record show this employer has sponsored software work before, so that a co-op here can turn into a sponsored full-time job?* If there is no record, the card's answer is **unknown, so go and ask a person**, never "no."

## What it can verify

- An exact (suffix-stripped) company name exists in the 80 Days CSV, at a stated line, in a file with a stated SHA-256.
- That row's H-1B approvals, approval rate, top sponsored job titles, and latest funding date.
- Whether any of those top titles is software work (software, full-stack, back-end, front-end, developer, programmer, application development).
- What the repo's liveness checker printed for a posting URL on a given date.
- Whether the co-op fits before graduation, under each graduation date you give it.

## What it cannot verify

- **Companies missing from the data.** JPMorgan Chase, Goldman Sachs and Morgan Stanley are not in the CSV at all. The CSV is built from private-funding filings, and large public banks rarely file those. Missing means *unknown*.
- **Software roles outside the top titles.** The CSV keeps only a company's top few sponsored titles.
- **Which legal name is the employer.** SoFi appears as `SOFI TECHNOLOGIES INC` (no sponsorship data) and `SOCIAL FINANCE INC` (182 approvals). The tool flags this; **you** decide.
- **Workday career sites.** BNY Mellon's board is not one of the four supported job-board systems, so its posting was not machine-checked.
- **Immigration rules.** The 12-month OPT, 24-month STEM extension and March lottery are assumptions, not records. Check them with your international student office.
- **Pay at this employer.** The national median for Software Developers ($133,080, 2024) is context only and changes no decision.

## Annotated commands

The full sample run, two graduation scenarios, real repo data:

```bash
python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py
```

Your own list. Copy the sample input, edit it, keep `@example.com` and never use your real name:

```bash
python3 scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/coop_sponsor_check.py --input my-roles.json --out-dir course/2026fa/submissions/arundhatik26/runs/mine
```

Check postings first and save the output, so the run reads it as a record:

```bash
npm run ats:liveness -- "<posting-url-1>" "<posting-url-2>"
```

The offline tests (fixtures only, no network):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/arundhatik26-coop-sponsor-swe-15-1252/tests -v
```

## What it produces

- `report.md`: read this one. It has a decisions table, a verified-vs-inferred split, and the gates waiting on you.
- `run-log.json`: for agents. Every value comes with its label and CSV line.
- One scorer audit per graduation scenario (`<scenario>/role-scores.md`).

## Your gates

1. **G2:** for each matched company, look at the CSV name and line in the log. Is it really your employer?
2. **G3:** for anything `uncertain` or `unchecked`, open the posting yourself.
3. **G4:** which graduation scenario is real? Re-run with that one when you know.
4. **G5:** apply, network, or skip. The tool never decides this.

## Named failure modes

1. **Absence read as refusal.** A student sees "no record" for a big bank and drops it, or worse, a chatbot fills the gap with a confident "yes, they sponsor." The tool returns `not-in-dataset` → NETWORK and never sends a 0 to the scorer. **Who would struggle to catch it:** a student who already "knows" the big banks sponsor, and who therefore never wonders why the data is silent.
2. **The right numbers on the wrong company.** Loose name matching attaches one company's sponsorship history to a different company. A search for "MELLON" also hits `TAMARA MELLON BRAND INC`, a shoe brand. The tool uses exact matching only, flags repeated names as `ambiguous`, and leaves the final match to a human. **Who would struggle to catch it:** anyone reading only the report's numbers, which look entirely plausible.
3. **A "sponsor" that never sponsors developers.** High approvals, all for analysts. The tool tiers this as `Possible` and lists the matched titles. **Who would struggle to catch it:** a student who filters on approval counts alone.
4. **A timeline that only works under one plan.** A January 2028 co-op is fine if you graduate in April 2028, but impossible if you graduate in December 2027. The tool reports `DEPENDS ON GRADUATION DATE` instead of picking one.
