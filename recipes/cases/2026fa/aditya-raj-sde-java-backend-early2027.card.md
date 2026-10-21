# Experienced Java Backend Opening Triage (Early-2027 Start) — human card

**Audience:** an international master's student with several years of full-time Java/Spring
backend experience, who will need sponsorship later and can start on a stated early-2027 date.
**Agent twin:** `recipes/cases/2026fa/aditya-raj-sde-java-backend-early2027.md`
**Status:** DRAFT. Built, tested offline (45 tests), and run on 12 real public postings. Your
review of the reports and three decisions are still open.

## Executive summary

Use this before you tailor an application. For each opening, it checks the posting's own words
for five things:

1. Is it still listed?
2. Does this posting refuse sponsorship or require citizenship?
3. Do the stated years and degree fit?
4. Does a stated start date fit your date?
5. Is the work actually Java backend work?

Every opening ends at a plain next step. Five of them send it to you. It will say "unknown"
rather than guess, and it never gives a score.

## What it can verify

- What the posting says about years, degrees, graduation windows, co-ops, start dates,
  sponsorship, citizenship, and stack, with the exact quoted line and its section heading.
- Whether your full-time months meet each stated **required** minimum. Your co-op is shown
  separately and is not counted unless the posting says co-ops count.
- Whether a stated start window ends before your availability date (date arithmetic only).
- Whether the employer's own job feed listed the posting when it was captured, and what the
  page checker saw.

## What it cannot verify

- **That an opening will sponsor you.** Silence is not a yes. Company history is context only.
- **Your work authorization, EAD approval, or eligibility to start.**
- That a posting is open right now, or why a page was blocked.
- Whether an employer would make an exception, or would count your co-op.
- Wording its rules don't know. The rules were tuned on 12 postings; expect misses on new ones.

## Next steps you will see

| Next step | Meaning |
|---|---|
| `skip-application` | a stated requirement or restriction you don't meet, a refusal or citizenship rule, a start window that ends before your date, or the posting is gone. The reason is quoted. |
| `human-liveness-review` | the employer feed and the page disagree. Open it yourself. |
| `human-eligibility-review` | clearance / export-control wording. Read the quoted line. |
| `human-requirement-review` | ambiguous or either/or years, a range you exceed, a co-op question, or weak Java evidence |
| `human-start-window-review` | ASAP, offer-relative, or conflicting timing |
| `seek-vacancy-sponsorship-evidence` | nothing stops it, but this posting says nothing usable about sponsorship. Ask before tailoring. |
| `review-offer-excerpt` | offer-like wording. Read it; it is not a guarantee. |

## Commands

```bash
# offline tests (no network)
node --test scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.test.mjs
# replay the real sample from the committed excerpts (no network)
node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/triage.mjs run \
  --input course/2026fa/submissions/aditya-raj-sde/assignment-2/real-sample/observations.json \
  --candidate scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/config/candidate.tariq-lindqvist.json \
  --out-dir "$TMPDIR/triage-replay"
# deliberate break attempts (temporary worktrees under private/)
node scripts/contrib/2026fa/aditya-raj-sde-java-backend-early2027/break-test.mjs
```

## Named failure modes

1. **Keyword match read as eligibility.** A posting full of Java, Kafka, and AWS feels like a fit,
   but it states "5+ years required" and you have 4.5. *Guard:* a stated required minimum stops
   the opening with the quoted line, and no stack match can undo it. Breaking this guard released
   5 of 12 real postings.
2. **Blocked page read as closed.** A careers page answers a headless browser with a bot
   challenge. The checker says "expired", but the employer's own feed still lists the job.
   *Guard:* a feed-vs-page disagreement goes to you. Without it, 4 real postings would have been
   skipped.
3. **History read as a promise.** A company with 1,640 recorded approvals posts a role that is
   silent on sponsorship, or refuses it. *Guard:* company counts never decide anything.
