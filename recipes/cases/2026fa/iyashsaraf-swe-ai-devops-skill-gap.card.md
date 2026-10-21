# Skill gap across software, AI and DevOps roles at H-1B sponsors — human card

**Audience:** an international master's student on F-1 OPT applying to software engineer, AI
engineer and DevOps/SRE roles, who will need H-1B sponsorship. The tracked run uses the course's
fictional persona **Aarav Patel**: MS Information Systems (May 2026), STEM OPT since 1 July 2026,
OPT end 30 June 2029, 0 of 150 unemployment days used. If he is between jobs from today, his job
must start by 20 March 2027. A real student swaps in their own dates and profile, kept in `private/`.
**Agent twin:** `recipes/cases/2026fa/iyashsaraf-swe-ai-devops-skill-gap.md`
**Lifecycle stage:** DRAFT (it has run end to end; four proposed additions are open).
**Engine layers:** 80 Days to Stay (which companies sponsor) and Job-Ops (their live postings and
the liveness checker).

## Purpose

Answer: at companies that have sponsored H-1B visas for these kinds of roles, which skills do the
current postings mention in each family, which skills are wanted in all three, and which of them can
the student already prove?

## What it can verify

- Which companies have H-1B approvals for software, AI or DevOps titles (from the 80 Days CSV).
- Which postings were on their public boards on the fetch date, and what they say.
- How many postings mention each skill, which postings, and how many companies they come from.
- Which of those skills are in the student's evidence profile.
- How many days are left before the visa deadline, and which rule sets it.

## What it cannot verify

- Whether a mentioned skill is actually required, or required at the student's level (most
  postings are senior).
- Skills not in the skill list, or companies without a Greenhouse or Lever board.
- Whether a company's own product is a real market skill (MongoDB at MongoDB).
- Whether a posting is still open, unless the liveness check is run on it, and whether the employer
  is E-Verify enrolled (required for STEM OPT).
- Which gap to learn first: that is the student's decision.

## Annotated commands

One documented command, from the repo root:

```bash
bash scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap/run.sh
```

Expected: sponsors kept, postings fetched and excluded by reason (duplicates included), each
family's status, size and non-senior count, then `status=compared`, the visa deadline and which
rule set it, the core skills and evidence coverage per family. `SKILL_GAP_DATE=2026-10-19` reuses
that day's fetch. A real student runs it with their own values, for example
`PROFILE=private/my-profile.json EAD_START=… UNEMPLOYMENT_DAYS_USED=… UNEMPLOYMENT_LIMIT=90 bash …/run.sh`.

Before applying to a posting from the report (expected: `active`, `expired` or `uncertain`; an
`uncertain` one is opened by a person and recorded in `liveness/gate-decisions.csv`):

```bash
npm run ats:liveness -- <posting url>
```

Deliberate break test, on a copy so the real `run/` outputs stay as they are (expected:
`status=stopped`, no comparison, exit 3):

```bash
D=scripts/contrib/2026fa/iyashsaraf-swe-ai-devops-skill-gap
rm -rf /tmp/sg-break && cp -R $D/run /tmp/sg-break
python3 $D/compare_families.py --run-dir /tmp/sg-break --private-dir private/real-postings/skill-gap \
  --profile $D/profile/aarav-patel.json --ead-start 2026-07-01 --unemployment-limit 150 \
  --opt-end-date 2026-01-01; echo "exit=$?"
```

## What it produces

- `run/skill-gap.md` — for the student: top skills by family, their evidence, gaps (⚠ when one
  company drives a gap), company concentration, the visa deadline, and non-senior counts.
- `run/skill-gap.json`, `run/<family>/skill-demand.json` — for the agent.
- `liveness/liveness-check.txt` — the liveness checker's output on the postings checked.
- Raw postings only in `private/real-postings/skill-gap/` (gitignored).

## Named failure modes

1. **Senior demand read as entry-level demand.** "Kubernetes: 63% of DevOps postings" is real (16 of
   the 19 postings name it without "or similar" or "preferred"), but 25 of the 30 DevOps postings
   are senior, staff or manager roles, and every share mixes all levels. Even the 5 "non-senior"
   titles hide levels: Stripe's asks for 8+ years and MongoDB's "Site Reliability Engineer 3" for
   3+. For someone with Aarav's 2.5 years, only Twilio (1–2+) and Zscaler (1–3) clearly fit. Hardest
   to catch for a student with little experience, who may spend weeks on what staff engineers are
   asked for.
2. **One company's stack read as the market.** Two companies supply 17 of the 30 DevOps postings
   (Zscaler 10, MongoDB 7). Ansible (33%) and Prometheus (20%) look like DevOps gaps worth learning,
   but 80% and 83% of those mentions come from Zscaler alone. It even decides the headline: Aarav's
   DevOps coverage is 34%, or 51% if skills that mostly come from one company are set aside. That
   flips his closest family from software engineering to DevOps. The gap list now marks these ⚠,
   but the coverage number doesn't adjust. Hardest to catch for a student who picks the next thing
   to learn straight from the gap list.
3. **A clean report that is only blind.** A skill missing from the list never appears as a gap.
   Hardest to catch for exactly the reader who trusts a short gap list.
