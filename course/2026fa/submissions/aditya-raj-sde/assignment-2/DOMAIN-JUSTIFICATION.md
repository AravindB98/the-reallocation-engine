# Domain justification — Experienced Java Backend Opening Triage (Early-2027 Start)

## Executive summary

This one-page note explains who the screening procedure is for, what that person cannot easily
see, and which mistakes it is built to catch. The user is an international master's student who
already has years of full-time Java backend experience and will start in early 2027. That person
is easy to mis-sort into new-graduate roles, or into senior roles they do not yet meet. On 12 real
postings, the procedure skipped 5 for stated experience minimums the candidate does not meet. It
also caught 4 postings that a page checker would have wrongly called closed.

## Who uses it, and when

- **Who:** an international master's student (on F-1 status) graduating around the turn of 2027.
  They have **several years of full-time Java/Spring backend experience**: distributed systems,
  messaging, cloud infrastructure, with applied-AI infrastructure as an optional second strength.
  They also have a separately recorded co-op.
- **Status:** their post-completion work authorization is applied for but not approved, they can
  start on a stated early-2027 date, and they will need H-1B sponsorship later.
- **Search:** US-wide.
- **When:** at the moment of choosing which openings deserve a tailored application.
- **Public demonstrations** use the fictional persona Tariq Lindqvist: 54 months full-time, a
  6-month co-op, availability 2027-02-01.

## The information asymmetry

The candidate can read a posting, but three facts are hard to see quickly and reliably:

1. **Where they sit against the posting's real bar.** Titles mislead in both directions. A
   "Software Engineer" posting can require 6 years. A "Staff" posting can state nothing. The bar
   is often split across headings ("Must have three (3) years of experience in each of the
   following:"). A master's student with 4.5 years is neither a new grad nor a senior hire, and
   the boundary is often a few months: 4.5 vs. "5+". Whether a co-op counts is rarely stated.
2. **Whether this opening, not the company, could work for them.** All 12 real postings came from
   employers with over a thousand recorded sponsorship approvals. **None** of the 12 posting texts
   said anything about sponsorship, and none stated a start date. A strong company record makes a
   silent opening look safer than the evidence supports.
3. **Whether the posting is really listed.** For 4 postings, the employer's own job feed listed the
   job while its careers page answered an automated browser with a bot challenge. A naïve check
   reads that as "closed".

## Engine layers

- **Job-Ops:** the board capture (greenhouse-watch fetcher) and page liveness (`ats:liveness`),
  combined as a gate.
- **80 Days to Stay:** the sponsorship CSV orders the sample and is shown as company context, never
  as a decision.
- **Visa timeline:** a start-window gate fed by the candidate's supplied date, explicitly not an
  authorization check.

## Domain-specific failure modes

1. **Keyword fit read as eligibility.** A posting dense with Java, Kafka, and AWS looks like a
   match. The stated "5+ years required" sits one line away, and the candidate has 4.5.
   - *Hardest to catch for:* exactly this candidate, whose stack match is real and whose shortfall
     is small, under deadline pressure.
   - *Guard:* a stated required minimum stops the opening with the quoted line, and no stack match
     can undo it. With that guard broken, **5 of the 12 real postings** went from skip to
     "seek sponsorship evidence".
2. **Co-op months silently counted, or silently ignored.** Counting the co-op turns 4.5 into 5.0.
   That flips three real postings.
   - *Hardest to catch for:* a reviewer who sees "5 years" on a résumé that mixes co-op and
     full-time entries.
   - *Guard:* both amounts stay visible. The co-op counts only with explicit posting wording.
     Unclear wording goes to a person.
