---
status: DRAFT
todos_open: 0
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# New-grad SWE at big H-1B sponsors — human card

**Audience:** an international student graduating in December who has to decide which new-grad software jobs are worth an application.
**Agent twin:** `recipes/case-newgrad-swe-bigsponsor.md` (it holds the open TODOs; this card has none of its own).

## Purpose

Answer two questions for each posting before you spend two hours tailoring an application:

1. **Does this company's H-1B record show entry-level software engineers, or mostly senior and non-software roles?**
   A company can have thousands of approvals and still list only "Senior" and "Staff" software titles.
2. **Does the job start before your OPT unemployment limit runs out?** New-grad programs usually start in summer.
   If you graduate in December, your 90 days can run out in the spring.

## What it can verify

- That the company has exactly one row in the 80 Days CSV, with its approval and denial counts.
- Which job titles that row lists as the company's top sponsored titles, word for word.
- The national median pay for Software Developers (SOC 15-1252), from BLS.
- The scorer's arithmetic, shown term by term.

## What it cannot verify

- Whether the company sponsors new grads **this year**. The record is historical.
- **How many** new-grad software engineers were sponsored. The data lists top titles only, with no counts.
- **Anything about a company that isn't in the dataset.** The dataset was built from companies that filed SEC Form D,
  so Google, Amazon, NVIDIA and several other large sponsors have no row. "Not found" means *unknown*, not "doesn't sponsor".
- Whether a posting is live, unless someone ran `npm run ats:liveness` on it and recorded the date.
  Even then, the checker can be wrong: on a real run it called a live Pinterest posting "expired" because the
  careers site blocks automated browsers. Open any "expired" posting yourself before you skip it.
- Your OPT rules. Confirm your dates and the unemployment limit with your school's international office.
- What a new grad will be paid. The company salary figure covers all the roles it sponsored.

## Where it stops for you

| Stop | What you look at | What you decide |
|---|---|---|
| Company not found, or found twice | the name you typed and any candidate rows | the exact legal name, or treat it as unknown |
| Liveness unchecked | the posting URL | run the check, then re-run |
| Start date estimated | the estimated date and the assumption behind it | ask the recruiter |
| Every scored company | the raw title list next to the rule's classification | whether the rule misread a title |

## Annotated commands

Sample run (fictional persona, fictional postings, real CSV):

```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --today 2026-09-30
```

Offline tests. Expect `# fail 0`:

```bash
node --test scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.test.mjs
```

Break it on purpose (window closed, expect exit 3 and nothing scored):

```bash
node scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/triage.mjs --persona scripts/contrib/2026fa/SmitPatel-31-newgrad-swe-bigsponsor/fixtures/persona-window-closed.json --out-dir /tmp/g0-check
```

## What it produces

- `triage-report.md`, for you: decisions, the next step for each, what needs you, what wasn't checked.
- `triage-log.json`, for the agent: every value with a label (`record`, `your-input`, `model-judgment`).
- The scorer's own `role-scores.json` / `role-scores.md`.

## What to do with each result

- **Apply**: tailor and apply (your 2 hours of research and applying).
- **Consider**: network first. Find an engineer or alum there and ask whether they sponsor new grads (your 3 networking hours).
- **Skip because of the start date, at a strong sponsor**: network, don't apply. Ask about an earlier or off-cycle start.
- **Skip**: let it go. A healthy run skips at least half.

## Named failure modes

1. **"Big sponsor" read as "sponsors me."** A student sees 4,962 approvals at LinkedIn and applies, but its top
   sponsored software titles are mostly Senior and Staff. *Who misses it:* anyone reading only the approval count.
   *Mitigation:* the tier comes from the title list, and the raw list is printed beside it.
2. **"Not in the data" read as "doesn't sponsor."** The dataset leaves out most big-tech sponsors, so someone
   filtering to "companies in the CSV" silently drops Google or Amazon. *Who misses it:* anyone who doesn't know
   how the CSV was built. *Mitigation:* a missing company is excluded as *Unknown* and the reason is written out.
3. **Title-rule misread.** Staffing firms use titles like `JAVA ENGINEER 2`, which v0.1 calls non-software.
   *Mitigation:* the raw titles are always shown, and v0.2 of the rule is a typed TODO in the recipe.
