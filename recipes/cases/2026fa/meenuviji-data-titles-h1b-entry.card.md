# Sponsored-title evidence for entry-level data roles — human card

**Audience:** a pre-OPT F-1 MS Data Analytics student deciding where to spend tomorrow's application and networking hours.
**Agent twin:** `recipes/cases/2026fa/meenuviji-data-titles-h1b-entry.md`
**Chapters:** feeds the sponsorship vote (Ch 7) into the role scorer (Ch 11), which is used unchanged. Chapter numbers are from the header comment of `scripts/score/role-scorer.mjs`.

## Purpose

Answer: has this employer sponsored *entry-level data* jobs before, or only other jobs, or only senior ones? Then say what to do next: tailor, network first, or skip. If the data cannot support an answer, the tool says so and stops.

## What it can verify

**Records quoted as-is**
- The employer name resolves to exactly one row of the 80 Days to Stay CSV, and the card says which rule matched (exact or normalized).
- The employer's recorded approvals, denials, approval rate, median salary and sponsored-title list, copied from the CSV.
- What the existing scorer returned, term by term, for exactly the postings that passed the gates.
- When two employers matched in the same run carry identical sponsorship records. It does not scan the whole data file for duplicates.

**Your rules, applied the same way every time (checked by tests)**
- Which sponsored titles contain one of your data-family phrases, and whether each is senior, mid, or entry/unmarked under your token rules.
- A rule applied consistently is not a rule shown to be correct.

## What it cannot verify

- **How recent the sponsorship is.** The approval and denial counts carry no year or date range. Neither the file nor its documentation gives one, so an employer with many approvals may have stopped sponsoring.
- **Whether the data matches the government's records.** The file is checked against an earlier audited copy, not against DOL or USCIS records.
- **Whether the matched name is the real employer.** Subsidiaries, trade names, and staffing or consulting firms (where the agency is the sponsor) can break the link.
- **Your timeline assumptions.** Hiring lag is your guess, the 90-day window is a regulatory figure not in the data, nobody knows whether an employer will accept a deferred start, and EAD timing isn't modeled.
- **Whether the next actions work.** They are your advice, not tested outcomes.
- **Live posting checks.** The live liveness command is optional and not tested here.
- **Whether this employer sponsored this role.** Sponsorship is recorded per company; the title list is the only role-level clue.
- **Whether the title list is complete.** It's short free text (1 to 14 titles per company), and reworded titles like "Analyst, Data" are missed.
- **That an unmarked title is entry level.** "Data Scientist" with no level may still expect years of experience.
- **Whether the employer will file for you.** Approval rate counts approved petitions among those filed; it isn't a filing likelihood. No record is not evidence of non-sponsorship.
- **Whether a posting is live.** It's assumed in the sample.
- **How well you fit.** It's held constant in the sample.
- **Local or employer-specific pay.** Wage context is the national median. Of your 6 target titles, only Data Scientist and Business Intelligence Analyst have a matching occupation row, and both show the same median.
- **Which of two look-alike employers the evidence belongs to.** PATHAI INC and PATHRAI INC share identical records.

## Dependencies

- Python 3.9+ standard library; Node 20+ for the existing scorer. No pip packages, no network calls.
- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`. Its SHA-256 must match the hash recorded in `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md`.
- `data/bls/compact/soc_occupation_compact.csv` (national wage context only).
- `scripts/score/role-scorer.mjs` via `npm run score` (unmodified).
- Your rules: `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/rules.json`; your run inputs: `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run-config.json`.

## Annotated commands

Default sample run. Expected: exit 3, because the frozen sample deliberately includes one unknown company, one ambiguous company and one posting with no liveness value:

```bash
python3 scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/run.py
```

Offline tests (expected: all pass; they write only to temp folders and fail if the default output folder changes):

```bash
python3 -m unittest discover -s scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/tests -v
```

Syntax and well-formedness of the tool's files (machine check only, not adequacy):

```bash
node scripts/conformance.mjs scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/
```

## What it produces

- `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/report.md` — for you. It opens with a plain summary, then:
  - a table with one row per scored posting: recommendation, evidence group and next action;
  - the reasons for each posting;
  - who stopped at the name check, and who was refused for a missing value.
- `scripts/contrib/2026fa/meenuviji-data-titles-h1b-entry/out/run.json` — for the agent. Every value is labeled `record` (from data or the scorer) or `your-input` (your rule or value).

What each result means for your day (the 3-3-2 day: two hours applying, three networking, three portfolio):
- **Proven** → research-and-apply hours.
- **Few approvals, mid-only, senior-only, no record** → networking hours first.
- **Sponsors but not data roles** → networking through a warm contact only.
- **Gate closed** → skip, and the time goes elsewhere.

## Named failure modes

1. **Company-level match read as role-level.** The employer sponsored "Data Engineer", you're applying for "Machine Learning Engineer I". Mitigation: a title-family note on every such posting, saying the match is at company level only.
2. **Missing value read as best case.** The scorer treats a missing liveness or timeline value as 1.0. Mitigation: the posting is refused before scoring, and the missing field is named.
3. **Thin evidence ranked as strong.** 2 approvals at a 100% rate looks better than 52 at 96%. Mitigation: fewer than the minimum approvals can't reach the top tier, and the next action says to confirm with a person first.
4. **Early start read as a failure.** A pre-OPT student applying months ahead projects a start before work authorization begins. Mitigation (Revision 1): that is a deferred start. It's noted, not penalized, and only a start after the window end fails.
5. **Duplicate entity.** Two differently named employers carry the same record. Mitigation: a duplicate-evidence note naming both, saying the evidence may belong to only one.
6. **Rule drift.** Someone edits a threshold in code instead of in the rules file. Mitigation: every rule lives in the rules file with a label; an unlabeled or missing rule stops the whole run.
