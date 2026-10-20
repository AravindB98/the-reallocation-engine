# Domain justification — early-career ML engineering with sponsorship and start-date constraints

## Executive summary

My mode helps an early-career ML engineer decide where to spend application time by separating documented evidence from unanswered questions about sponsorship, experience and start dates.

## Who uses it, and when

It is designed for international applicants who already have production ML experience but do not fit neatly into either “new graduate” or experienced-hire categories. Their search involves more than finding an attractive title. They need to know whether their employment history fits the posting, whether sponsorship evidence is relevant, and whether a realistic start could fall within their available window.

The worked scenario uses fictional applicant Kavya Raman: 24 months of full-time production ML, a six-month co-op and a five-month research assistantship. Her planned EAD starts January 4, 2027. The scenario sets March 15 as her target and April 4 as her latest start. In the October 19 run, my 22-week hiring assumption produced March 22 and a timeline factor of 0.65. That is a planning calculation from stated inputs, not a confirmed employer timeline.

## The information asymmetry

The information gap is particularly difficult in ML hiring. Employers use overlapping titles for research, infrastructure, product engineering and customer-facing work. Their postings combine required experience, preferred tools and work conditions. Public sponsorship records may establish company-wide history without identifying the relevant team, hiring level or current policy.

## Engine layers it connects

The mode connects **80 Days to Stay** with **Job-Ops**. It reads the pinned sponsorship file, checks company identities, discovers postings on supported boards and checks their availability through the board’s API. It then separates requirement sections and compares stated experience minimums with documented duration. The person supplies fit judgments and makes the final decision. This workflow does not use SEC funding signals or the Cognitive Pivot’s role-quality scoring.

## What the live run showed

The live discovery examined 12 target companies, read seven boards and retained 21 postings from 2,512 listings. These were the newest matching postings within the company cap, not a comprehensive ranking of all suitable jobs. The queried Google, Amazon, Apple, Netflix and Meta entities had no usable H-1B evidence in this local file. Their careers sites were also unsupported by this reader. Both findings describe coverage limits; they do not establish that those companies do not sponsor.

## Failure modes specific to this domain

Two failures show why this domain needs careful boundaries. First, mixed employment histories can produce convincing but misleading totals. For Reddit’s four-year minimum, counting all 35 documented months leaves Kavya 13 months short. Counting only explicitly full-time employment leaves her 24 months short. Neither calculation establishes that research or co-op work satisfies the employer’s requirement. Applicants with mixed histories are especially likely to trust the larger total.

Second, an unread requirement can resemble a satisfied requirement. Eight postings initially showed zero months short because their headings were not recognised. This would be hardest to catch for someone relying on the shortlist instead of opening each source. Version 0.2.1 makes missing comparisons unresolved and corrects the identified heading failures.

## Result

Round 2 produced three ASK FIRST suggestions and eighteen HOLD results. My separate Pinterest decision remained HOLD. The value of this mode is a traceable explanation of what deserves attention, what needs clarification and what remains unknown.

## Provenance

Written by the student on 2026-10-20 (521 words). Claude Code added the section headings; every sentence is the
student's, unchanged.
