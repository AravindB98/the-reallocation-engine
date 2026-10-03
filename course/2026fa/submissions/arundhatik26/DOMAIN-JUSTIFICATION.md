# Domain justification — co-op sponsor check for software roles

## Executive summary

This page explains who the tool is for and what it shows them. The user is an international master's student choosing a co-op. The hidden fact is whether an employer has actually sponsored *software* jobs before, which decides whether the co-op can become a sponsored full-time job. Where public records are silent, the tool says "unknown" and sends the student to ask a person.

## Who, and in exactly what situation

A second-semester **MS Information Systems** student on **F-1** (January 2026 intake, STEM-designated degree). They are applying for a **software developer or full-stack co-op** and expect to graduate in **December 2027 or April 2028**, depending on co-op timing. The co-op, on CPT, needs no sponsorship. The visa question comes at conversion: OPT, then STEM OPT, then an employer has to register them for the H-1B lottery. So choosing a co-op employer is, quietly, choosing who might sponsor later.

## The information asymmetry

From the outside, the student cannot easily see:

1. **Whether an employer sponsored *the work they would do*.** BNY Mellon's top sponsored titles in the repo's data include *Full-Stack Developer*. Another employer with similar approval counts might list only analysts.
2. **Whether silence means "no" or "not recorded."** JPMorgan Chase, Goldman Sachs and Morgan Stanley are **absent** from the 80 Days CSV, which is built from private-funding filings. A chatbot answers fluently either way; the tool says `not-in-dataset` and tells the student to ask a person.
3. **Whether two names are one company.** SoFi appears twice: once with 182 approvals, once blank.
4. **Whether the co-op fits the calendar.** A January 2028 co-op works under an April 2028 graduation, but not under December 2027.

## Engine layers

- **80 Days to Stay:** approvals, approval rate, top sponsored titles, funding date (`record`).
- **The Cognitive Pivot:** the BLS row for SOC 15-1252 / 15-1254, context only, since the scorer's role-quality weight is 0.
- **Job-Ops:** `ats:liveness` as a gate.

The decision comes from the existing `scripts/score/role-scorer.mjs`, run once per graduation scenario.

## Where it fits the 3-3-2 day

It takes over the **research part of the 2 research-and-apply hours**: the per-company "is this worth tailoring for?" check. By hand, that means about 10–15 minutes per company to find H-1B history and read the sponsored titles, plus about 5 minutes to confirm the posting is live.

**Estimate (not measured):** for about 15 co-op targets a week, that is roughly 4–5 hours by hand, against about 1 hour with the tool (writing the input, reviewing company matches, re-opening uncertain postings). That saves about **3–4 hours a week**. I have not timed either method.

It also **feeds the networking 3 hours**. Every `NETWORK` result is a named company with a concrete question to ask an alum: "Has your team converted international co-ops into full-time software roles?"

## Domain-specific failure modes

1. **The big-bank blind spot.** The data is silent on exactly the employers international students most often "know" sponsor. The tool can't say "no", but a student may read `not-in-dataset` as a formality and act on rumor, or drop the company entirely. **Hardest to catch for:** the student most confident about the big banks, who has no reason to question the gap.
2. **Right numbers, wrong company.** Loose name matching attaches one company's history to another. "MELLON" also matches `TAMARA MELLON BRAND INC`, a fashion brand, and 209 normalized names repeat in the CSV. The report looks plausible either way. **Hardest to catch for:** a reviewer who reads the report but never compares the matched CSV name and line in the JSON log with the employer, which is exactly the human check at gate G2.
