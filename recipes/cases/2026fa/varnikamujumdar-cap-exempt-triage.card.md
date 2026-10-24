# Cap-exempt employer triage — human card

**Audience:** an international graduate on OPT who was not picked in the H-1B lottery, and the adviser or friend helping them.
**Agent twin:** `recipes/cases/2026fa/varnikamujumdar-cap-exempt-triage.md`
**Status:** DRAFT. It ran fully on real data. Three of six proposed additions are closed; three are still open: the IRS nonprofit list, university wage tables, and the code to read the IRS list.

## Executive summary

If you lost the H-1B lottery, some employers can still sponsor you **without** it: universities, nonprofits tied to universities, and nonprofit or government research institutes. The catch is that no job posting says whether an employer qualifies.

This tool takes your list of real postings and does four things:
1. It checks each posting is still open.
2. It checks that your visa clock leaves time for hiring plus visa processing.
3. It looks the employer up in the federal college list and in the government's H-1B approval counts.
4. It shows the evidence for and against each employer's claim.

It never tells you an employer *is* cap-exempt. Only the employer can tell you that, and the government decides on each petition. It tells you whom to ask, and why some names that sound like a university or research institute are traps.

## What it found on its first real run (2026-10-21)

- **The engine's startup-funding dataset cannot see these employers.**
  - Not one of the 3,771 public and nonprofit universities in the federal college list appears in it by exact name.
  - 31 of its 30,369 companies have names that sound like a university, hospital or foundation, but none is a real institution: 26 raised startup money and 13 are LLCs or LPs. Their visa-approval fields are blank, which means unknown, not zero.
  - The government's own H-1B data, now added, can see them: Northeastern had 24 new and 13 continuing approvals in FY2023, Fred Hutch 20 and 24, HHMI 49 and 18, Ai2 6 and 0.
- **Seven rows (six real postings and one made-up dead link):**
  - Shortlisted: Ai2.
  - Flagged: Toyota Research Institute (a company Toyota set up) and HHMI (its pages say "private", never "nonprofit"). Both were flagged because the category was not stated by the employer. If someone types Toyota's claim as an employer statement, the tool shortlists it: the known blind spot, break B1.
  - Held: three, including Northeastern, the only one backed by the federal college list.
  - Skipped: one.
- **The posting checker was least reliable for exactly these employers.** It called a live Fred Hutch posting "expired", because the job loads inside a frame. The tool now holds such results for you to check.
- **You make the final call (gate G4).** You record one decision for every posting the gates didn't skip (contact HR, open it myself, keep held, or drop) with your name and date, and the tool reports G4 as cleared only when every one of those has a decision. In the sample run the decisions were 2 keep held and 4 drop.
- **A "University" in the name is not enough.** University of Phoenix-Arizona is in the federal college list as **for-profit**, so it does not meet the higher-education definition cap exemption relies on. The tool flags it from the record.

## What it can verify

- Whether the posting was open when checked. Unclear results are held, never assumed open.
- Whether the employer is in the federal college list (IPEDS), and whether it is public, nonprofit, for-profit or closed.
- How many H-1B petitions the government approved for that employer name in FY2023.
- Whether the employer appears in the private-fundraising dataset. That counts as evidence **against** a nonprofit claim.
- Whether its legal name is an LLC, LP or similar for-profit form.
- The national median wage for the job's occupation (BLS, May 2024).
- Whether your OPT end date leaves the days you assumed for hiring and processing. The default hiring time is **45 days, a guess**; change it to your own number.

## What it cannot verify

- **Whether any employer is cap-exempt,** or whether a specific role will be filed that way.
- Whether a nonprofit is really *affiliated* with a university.
- Whether H-1B approvals were cap-exempt. The government counts petitions, not their type, and its latest file is FY2023.
- **A company with a research-sounding name and no other warning sign.** The IRS nonprofit list (still open) would catch it; today the tool catches it only when you mark your claim as resting on the name alone.
- What the employer will pay. Cap-exempt employers may use a lower wage table that isn't in the repository yet.
- Whether a contractor placed at a university qualifies (the rule needs at least half the work time there).

## Before you rely on it

- **Ask HR, in writing:** "Do you file H-1B petitions as cap-exempt for this role, and under which category?"
- Cap-gap protection does **not** cover cap-exempt petitions. The petition must be approved and start before your OPT ends.
- Moving later to a regular company needs the lottery, unless you keep the cap-exempt job at the same time.
- This is not legal advice. Talk to your school's international student office (DSO) or an immigration attorney.

## Annotated commands

Run from the repository root.

```bash
# 0. (once) build the federal-record extracts (network)
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/ingest.py all

# 1. How much can the startup dataset see? (no network)
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py audit --json

# 2. Is each posting still open? (network: headless browser)
npm run ats:liveness -- --file <run-dir>/urls.txt | tee <run-dir>/liveness.txt

# 3. Gates, records and evidence
python3 scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/cap_exempt_triage.py triage \
  --persona search/examples/priya-nair/profile.yml \
  --ext scripts/contrib/2026fa/varnikamujumdar-cap-exempt-triage/fixtures/priya-lottery-ext.json \
  --targets <run-dir>/targets.json \
  --liveness <run-dir>/liveness.txt --liveness <run-dir>/liveness-recheck.txt \
  --g4 <run-dir>/g4-decisions.json \
  --run-date YYYY-MM-DD --out-dir <run-dir>
```

**Exit codes:**
- 0: completed.
- 2: inputs unusable; nothing written.
- 3: timeline gate stopped the run.

Read `<run-dir>/report.md`.
