# Domain justification: what the posting itself says about sponsorship

## Executive summary

This page explains who this workflow is for, what they cannot see without it, and how it goes wrong.
The user is an international network-engineering master's student who will need visa sponsorship.
The thing they cannot see is the gap between a company's sponsorship history and what one specific
posting says. The two most dangerous failures are both forms of false silence: a fetcher that drops
the text, and a reader who treats "the posting doesn't say" as "yes" or "no".

## The user and the situation

A fictional international master's student in network engineering, on an F-1 visa, **before OPT
starts**. After OPT, they will need H-1B sponsorship. They target SOC 15-1241 (Computer Network
Architects; national median $130,390 in the repository's BLS extract). Their scarce resource is
tailored applications, and their decision is which live postings deserve one.

## The information asymmetry

The employer knows whether a role needs U.S. citizenship, a clearance, or no future sponsorship. The
student sees two weak signals:

1. **Company history** (80 Days to Stay, from public H-1B records). On 2026-10-20, Zoox had 1,364
   approvals and Palantir 462. That says the company *has* sponsored, not that *this posting* will.
2. **The posting text.** The answer, when there is one, is usually in a bullet list ("Required
   qualifications: Ability to obtain a SECRET clearance"), not in the summary paragraph. When there
   is none, the posting is simply silent. On this run, all 3 Zoox network postings were silent,
   despite Zoox's strong history.

A clearance requirement never says "citizens only". The citizenship limit comes from federal rules
(32 CFR § 117.10(k)), so even an explicit sentence needs an inference that most students don't know
to make.

## Engine layers

- **Job-Ops** (posting liveness and the fetched text): the evidence about the posting.
- **80 Days to Stay** (H-1B history): shown separately, as background only.
- **Cognitive Pivot** (BLS/O*NET SOC): decides which titles are the student's occupation.

The mode never merges the company signal into the posting label.

## Domain-specific failure modes, and who would find each hardest to catch

1. **Pipeline-induced silence.** The repository's own fetcher silently rejected 631 of Shield AI's
   653 postings (an employment-type allowlist), including every network posting with clearance
   wording. It also drops the bullet-list field where that wording sits. The output looks clean:
   fewer postings, "nothing about sponsorship".
   **Hardest to catch for the student**, who sees a tidy list and no error. It is equally hard for
   a reviewer who only checks that the run exited 0. Only comparing counts with the raw board
   exposed it.
2. **Reading silence or keywords as an answer.** "ITAR" appears as subject knowledge in a Preferred
   line. "Visa" can be a payments company. "Clearance desired" under a Required heading is
   ambiguous. A keyword matcher, or a hopeful reader, turns these into a confident yes or no.
   **Hardest to catch for a model-based or keyword classifier**, and for a student under time
   pressure. A human who reads the whole sentence, and its section, catches it. That is why the
   labels stay a human gate here.
