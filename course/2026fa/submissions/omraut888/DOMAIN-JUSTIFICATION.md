# Domain Justification — cognitive-pivot-sponsor-fit

## Executive summary

This page explains who the new check is for, what it lets them see that they
otherwise could not, and the two ways it can mislead them. It is for
international students chasing AI-research jobs. Sponsorship lists show who
sponsors visas; they do not show whether the sponsored work will hold its
value as AI improves. Both failure modes below come from the real run, not
from guesses.

## Who, and in what situation

An international master's student on F-1 OPT or STEM OPT who is targeting
**research-style AI roles** (applied scientist, AI/ML research engineer, SOC
15-1221.00). The worked persona is the same fictional student as PR #3, Priya
Nair, an ML/RAG candidate. This mode reads no persona data and models no
OPT clock; PR #3 covered the clock. The student already has a sponsor list and
needs to decide **which sponsors' work is worth betting a visa on**.

## The information asymmetry

The 80 Days data tells a student that a company sponsored, for example, an
"AI/DS Engineer" 102 times with 0 denials. It does not tell them what
occupation that is, because the sponsorship CSV has **no SOC code field**. It
also does not tell them whether that occupation is cognitively durable or AI-exposed.
O*NET does know that: Computer and Information Research Scientists score
4.516 on the cognitive-pivot scale, against 3.834 for Software Developers.
But the student cannot join the two sources without a title-to-occupation
bridge. A recruiter or an immigration attorney can read a title and roughly
place it. A student can't.

## Engine layers it connects

**80 Days to Stay** (approvals and denials per sponsor) × **Cognitive Pivot**
(O*NET `cognitive_pivot_score`), combined through the Ch.11 role scorer. The
link is the scorer's `role_quality` weight, which is hardcoded to 0 and marked
`[VERIFY]`. The mode tests 0.15, the weight PR #3 proposed and never
implemented. Liveness (Job-Ops) is deliberately **not** run. It is
disclosed as unchecked on every row and never defaulted to "verified".

## Failure modes (both hit in the real run)

**1. Bag-of-words title matches that cross disciplines. This is a systematic
weakness, not an edge case.** The matcher accepts a title when every word of
an O*NET phrase appears in it, in any order. The phrase "computational
scientist" therefore matches any "Scientist, Computational <field>" title.
Three companies were caught this way, and they come from two kinds of source.
BLADE THERAPEUTICS and CLADE THERAPEUTICS ("Senior Scientist, Computational
Biology") were flagged by an agent reading of the matches (model judgment, not
a human finding). RELAY THERAPEUTICS ("Scientist II, Computational Chemist")
was flagged by the agent too, and it is the one case a human has confirmed: Om
Raut's own 5-title spot-check happened to include it, rated it weaker (4 of the
5 titles were sound), and so independently agreed with the agent's flag. In all three cases "computational" and
"scientist" are present, but the work is biology or chemistry, not
computer-science or AI research. A fourth company, MARLINSPIKE ("Computational
Biophysicist"), has the same shape but has not been checked by a human. The
agent flagged the pattern in several companies, and the one human check that
touched it reached the same verdict. Together that points at the method
itself, not an unlucky title, although only one of the three has been
confirmed by a human. *Shape:* a
plausible-looking match whose words line up but whose discipline does not,
scored with full confidence. *Hardest to catch for:* a CS student who does not
know biotech's title conventions. "Computational" reads to them as their own
field. The report flags these matches but does not remove them; the human has
to read them.

**2. A blank score that tempts a default.** Data Scientists (15-2051.00) has
**no** cognitive-pivot score in the compact table, while 55 sponsors' titles
match it. A pipeline that treats a blank as 0 would rank every data-science
sponsor as maximally AI-exposed. One that treats it as an average would invent
a mid-range answer. *Shape:* a silent, uniform shift across a whole
occupation, with no error. *Hardest to catch for:* the data-science student,
the very user most likely to run this mode. They would see a tidy ranked table
and have no reason to suspect that the durability column was fabricated. The
mode refuses instead: `missing: no-cognitive-pivot-score`.
