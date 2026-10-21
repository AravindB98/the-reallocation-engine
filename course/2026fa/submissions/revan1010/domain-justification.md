# Domain Justification — MSIS → SWE, Boston, F-1 OPT from February 2027

## Executive summary

This page explains who the new job-search recipe is for and what it lets that person see. The person is an international Information Systems master's student in Boston who wants a junior software engineering job. The key point: the evidence such a student usually reads, a company's total visa-sponsorship count, is the evidence most likely to mislead them. The page also names the two errors this situation is most prone to, and who would find each one hardest to catch.

## Who, and in what exact situation

The user is an F-1 student in Northeastern's MS in Information Systems who wants a **software developer** role (SOC 15-1252) in the Boston area without a car. The student graduates in **December 2026**, so post-completion OPT must start within 60 days (by about Feb 21, 2027); the planned start is **February 1, 2027**. The search is running now, in October 2026. The student needs an employer that will sponsor an H-1B, and gets very few lottery draws before work authorization ends. How many depends on a fact about the employer: E-Verify enrollment unlocks the 24-month STEM extension, and the MSIS is STEM-designated. From these dates the engine computes **1 draw** (March 2027, about four months away) if E-Verify is unconfirmed, and **3** (2027–2029) if it is confirmed. One fact about the employer triples this student's chances. In the first run it was the difference between "Consider" and "Apply" for every scored role, whatever the fit.

## The information asymmetry

Three things this student cannot easily see:

1. **Level, not volume.** Public sponsor lists rank employers by count. In the 80 Days data, 6 of the 22 largest Boston-area sponsors (Thermo Fisher, Toast, Ginkgo, TraceLink, Cambridge Mobile Telematics, Nuance) show **only senior** software titles among their sponsored roles. A new grad sees "150 approvals" and does not see that none were at their level.
2. **The count itself is unsafe.** All 1,557 approval counts and all 1,557 denial counts in the file are even numbers. Real counts are not all even, so the file was very likely doubled during a join. Rates survive that; magnitudes do not. Nothing in the file says what years the counts cover.
3. **The degree–occupation question.** An MSIS degree sits between Computer Systems Analyst (15-1211) and Software Developer (15-1252). Whether a petition for a software-developer role is supported by an Information Systems degree is decided long after the application, and no dataset in the repo can answer it. The recipe makes it a named human gate instead of leaving it invisible.

## Connection to the engine's layers

- **80 Days to Stay:** the H-1B aggregates and Form D funding dates for 30,369 companies. The run found that "recently funded" and "sponsors junior SWEs" rarely coincide: of 15 commutable sponsors with a Form D in the last 24 months, only **1** shows non-senior SWE sponsorship evidence.
- **Job-Ops:** board fetch plus `ats:liveness` as a hard gate. `uncertain` is refused, not passed.
- **Cognitive Pivot:** O*NET reasoning/systems score. Computer Systems Analyst, the MSIS-native occupation, scores **4.024**, *higher* than Software Developer at **3.834**, yet pays less nationally ($103,790 vs $133,080 median). That tension is the MSIS student's real choice. The recipe shows both numbers. It cannot act on them yet, because the engine gives role quality zero weight.

## Domain-specific failure modes

**1. Senior-only sponsorship read as new-grad sponsorship.** *Shape of the error:* a high-count employer is ranked as a top target, and the student spends weeks of a 12-month clock on a company that has never sponsored at their level. *Hardest to catch for:* the student. Every number they look at is real and large. The disqualifying fact is buried in a title list, and the doubled count makes the employer look *more* credible. A reviewer who skims counts would agree with the wrong ranking.

**2. A missing gate scored as an open gate.** *Shape of the error:* the engine's scorer treats an absent liveness value as 1.0, meaning live. In this run it scored such a role **Apply**. A ghost posting, or one whose check came back `uncertain` (a fake job ID also comes back `uncertain`), can therefore rank like a real one. *Hardest to catch for:* anyone reading only the final report. The trace shows `liveness 1 [record]`, which looks like evidence even though no check ran. This recipe's role builder refuses such roles before they reach the scorer, and states the refusal.
