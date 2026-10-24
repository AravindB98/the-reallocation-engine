# PM network targets — human card

## Executive summary

This card is for a master's student in Information Systems on STEM OPT who wants product
roles (Product Manager, Product Analyst, 1–5 years of experience) at US companies that
have sponsored visas for product roles before. It explains what the tool tells you, how
far to trust each part, and what to do with each result. The short version: the
sponsorship numbers and open postings are checked against real records; the rules for
which titles and which companies count are your own choices; and E-Verify, the years
behind the visa counts, and how an employer files a product role are **not** checked.

**Audience:** the person deciding where to spend this week's job-search hours.
**Agent twin:** `recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.md`.
**Status:** DRAFT. The sample run works; three inputs are missing (see below).

## Purpose

Answer, for each company that has sponsored product roles: **apply now, network now, or
skip?** And say plainly when the answer is "a person needs to check this first."

## What it can verify (from records)

- How many H-1B petitions the company had approved and denied, and the approval rate
  (80 Days to Stay data).
- Whether product titles appear in the company's sponsored-title list.
- Whether a matching posting was listed on the company's confirmed job board on the run
  date.
- That the score came from the repository's own scorer, with every term traced to its
  source.

## What is your input, not a fact

- **Tiers.** Proven means ≥10 approvals and ≥90% approved; Likely means 3–9 approvals (or
  ≥10 below 90%); fewer than 3 is skipped as "too thin to trust".
- **Titles.** Product Manager, Product Management, Product Analyst, including Senior, AI
  and Technical. Not Associate/APM, Director, Principal, Group, Staff, Head, VP, or
  "Manager, Product …".
- **Location.** Anywhere in the US, or "Remote".
- **Fit** is a constant 0.7 for any title that passes. It does not rank roles.
- **Hiring lag** is 60 days; the **OPT end date** is your own.
- **Board ownership** is your Gate A judgment, from a careers-page link or matching job
  IDs/titles.

## What it cannot verify

- **E-Verify.** STEM OPT requires an E-Verify employer. This is not checked for anyone.
- **When the sponsorship happened.** The visa counts have no stated years. "Sponsored a
  PM" might mean nine years ago.
- **How many approvals were product roles.** The counts are company-wide. Datadog's 340
  approvals are mostly engineers; "PRODUCT MANAGER" is one of its top five titles.
  "Proven" means a strong sponsor that has sponsored a product title, not one that has
  sponsored many PMs.
- **How the employer files the role.** There is no "Product Manager" occupation code;
  employers choose among several, at different wage levels.
- **Whether the posting is a real hire.** A listed posting can still be a ghost job.
- **Name changes.** Sendbird is now Delight.ai; Payward hires as Kraken. Only Gate A
  catches these.
- **Companies whose board wasn't found.** About two thirds of candidates in the first
  measurement. Nothing is concluded about them.

## Annotated commands

Sample run (offline; replays the board responses saved on 2026-10-03):

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --offline scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

Fresh read of the confirmed boards (network; saves trimmed responses for replay):

```bash
node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs --save-responses scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/fixtures/sample-responses
```

Tests (offline; every named failure case):

```bash
node --test scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.test.mjs
```

Spot-check one Apply posting is still live (`uncertain` counts as closed):

```bash
npm run ats:liveness -- "<posting url from the report>"
```

## What it produces

- `out/report.md` is for you: who to apply to, who to network into, who needs a check,
  who was skipped, and the reason for each.
- `out/run-log.json` is for an agent: every value with its source label.

## What to do with each result

| Result | Do this |
|---|---|
| **Apply** | Tailor and apply within 2 days, then reach out to the hiring team. One application per company. |
| **Consider** | Apply after this week's Apply roles. |
| **Network** | Find 2 product people there (alumni first) and ask for a 20-minute chat now. Re-check the board in 2 weeks. |
| **Needs a person** | Confirm the job board (Gate A), or check it by hand. Never read it as "no openings". |
| **Skip** | Nothing. Skipping is the tool working. |

## Named failure modes

1. **Wrong board, same name.** An automatic guess from the company's web domain can land
   on a stale or unrelated board: Iterable's Greenhouse board had 0 jobs while its real
   board is on Ashby. Payward's guess pointed at an empty board while it hires as Kraken.
   *Who misses it:* anyone who skips Gate A. The output looks normal and simply shows "no
   openings", which would wrongly send the company to Network.
2. **"Couldn't check" read as "nothing there".** A failed request that is counted as zero
   postings looks exactly like a real result. This happened while measuring coverage: an
   SSL error on this Mac made every board look absent (0 of 91). *Who misses it:* a
   student skimming counts, because zero is a plausible number. The tool routes fetch
   errors to `board-unknown`.
3. **Old sponsorship, current hope.** A Proven tier can rest on approvals from years ago
   for a team that no longer exists. *Who misses it:* everyone, because the data has no
   dates. Ask in the networking chat.
4. **A flat score.** In the sample, every scored posting came out 0.525, because all
   confirmed companies were Proven and fit is constant. The scorer confirms the gates
   are open but does not rank one Apply against another. *Who misses it:* a student who
   reads "Apply 0.525" as a strong signal. Choose among Apply rows by your own fit.
