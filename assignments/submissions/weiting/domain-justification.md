# Domain Justification — Game-Engineering Studio Triage on an OPT Clock

**Mode:** `recipes/case-game-eng-opt-studio-triage.md` v0.2.0 · **By:** Weiting Wang · **Date:** 2026-10-17

## Executive summary

This page says who the mode is for, what they cannot see without it, and the two ways it
can be wrong. The short version is that the dataset the mode stands on cannot see the
game industry as an industry, and is structurally blind to most of the studios students
apply to — and saying so is more useful than a shortlist that pretends otherwise.

## Who uses it

An international master's student in game development — Unity and Unreal gameplay
programming, engine tooling, technical art — on F-1 with an OPT clock running and
perhaps forty applications of real effort left. They run it at the start of an
application cycle, on a pile of studio names collected from job boards and GDC. They do
not need a list of studios; they need a reason to cross most of them off. We did not
design for "an international student in tech," because a general software applicant can
filter a company list by industry, read a published wage for their occupation, and find
a company's ATS board in one search. None of those three work in this domain.

## The information asymmetry

The engine's company table maps 30,369 companies under 24 industry labels, and not one
is about games, so studios cannot be filtered for — only guessed at from names and
sponsored job titles. We measured what the guess costs: 266 candidates, of which 13
carry any sponsorship record and 4 have ever sponsored someone in this role family.
Second, a company-level approval count erases the role: Roboto Games' four approvals
went to a Director of Product Management, while Manticore Games' ten went to a Technical
Artist, and to this student those mean opposite things. Third, the wage the student
would check is not their wage — O*NET 15-1255.01 Video Game Designers has no estimate of
its own, so the $98,090 they would read is the whole 15-1255 group averaged with web and
UI designers. Against it, the one real game-engineering sponsorship in the data, That's
No Moon's Associate Gameplay Engineer at $71,000, is 53.4% of the Software Developers
median.

## Connection to the engine layers

It is grounded in 80 Days to Stay, since sponsorship history and Form D recency do the
filtering; funding age matters unusually much here because studios are project-financed,
and Manticore is a proven sponsor whose last filing is 67 months old. It touches Job-Ops
at the liveness gate and the Cognitive Pivot through `cognitive_pivot_score`, which we
use to compare occupation codes rather than companies — filing technical art under
27-1014 scores 3.389 where 15-1252 scores 3.834. That signal is currently inert: the
composite weights role quality at zero, and we say so rather than imply otherwise.

## Failure modes

The dangerous one is a blank being read as a zero. Insomniac, Naughty Dog, Bungie,
Blizzard, Epic Games, Respawn and Zynga have no row at all — the apparent matches are
Epic Battery, Riot Auto and a beef-jerky company called Sucker Punch Gourmet — because
the table is built from Form D filers and studios owned by public parents never file
one. Our reader is the person worst placed to catch it: a student has no way to tell
"never sponsored" from "not in the file," where an attorney would ask which source the
list came from. Hence the explicit Unknown tier.

The second is a historical signal read as current. Every value is a past filing, and
game studios close quickly, often just after shipping or failing to. "Proven sponsor,
Technical Artist, 100% approval rate" reads as an invitation. The only defense is the
liveness gate, and that failure is silent — the scorer treats a missing liveness value
as 1.0 — so the student is precisely the person least likely to notice the gate was
never evaluated.
