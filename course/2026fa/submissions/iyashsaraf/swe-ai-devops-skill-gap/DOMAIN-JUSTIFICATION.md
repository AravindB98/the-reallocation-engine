# Domain Justification — swe-ai-devops-skill-gap

## Executive summary

Who this mode is for, what it shows that single postings don't, and how it can mislead. On real
postings from H-1B sponsors, the student's skills cover software engineering best (42%). But that
answer depends on two companies, and most of the demand comes from senior roles.

## Who, in exactly what situation

I built this for students in my own situation. The repo forbids real immigration details, so the
tracked run uses the course's fictional persona **Aarav Patel** (`search/examples/aarav-patel/`).
He finished an MS in Information Systems in May 2026 and has been on F-1 **STEM OPT since 1 July
2026** (OPT ends 30 June 2029), with **0 of 150** unemployment days used. If he is between jobs from
today, his job must start by **20 March 2027**, and every employer must be E-Verify enrolled. He has
about 2.5 years of experience (Java services, TypeScript, Kubernetes, Helm). He targets
backend/platform Software Engineer (SOC 15-1252) and DevOps/SRE (15-1244); AI Engineer (15-1299) is
the third family. The mode keeps all three because the real question is which one to lean toward.
He will need an H-1B sponsor. His credibility "3" hours (about 15 a week) go into side projects,
chosen today by guessing what employers want.

## Information asymmetry addressed

Employers know which skills they screen for; a student applying to dozens of postings a day sees
one at a time and never tallies them. They also can't tell whether a skill is wanted across the
market or by one company. The mode tallies a day's postings from companies that actually sponsored
H-1B for these titles, shows how many companies each skill comes from, and marks which skills the
student can prove. Before the first run I predicted Terraform, CI/CD and Docker would top DevOps.
Kubernetes and Python did (63%); Docker was 10%.

## Engine layers used

- **80 Days to Stay:** which of 30,369 companies sponsored H-1B for these titles (600).
- **Job-Ops:** the Greenhouse/Lever fetcher for live postings, the skill-demand monitor, and the
  liveness checker for postings he'd apply to.
- **Cognitive Pivot:** not used. O*NET skill levels are occupation averages, not named tools.

## Domain-specific failure modes

1. **Senior demand read as entry-level demand.** 16 of the 19 DevOps postings that name Kubernetes
   don't soften it, but 25 of the 30 are senior roles, and every share mixes all levels. Even the 5
   "non-senior" titles hide levels: when I opened MongoDB's "Site Reliability Engineer 3" it asked
   for 3+ years, and Stripe's asks for 8+. With 2.5 years, only Twilio (1–2+) and Zscaler (1–3)
   clearly fit. **Hardest to catch for:** a student with little experience on an unemployment
   clock, who could spend weeks learning what staff engineers are asked for.
2. **One company's stack read as the market.** Zscaler and MongoDB supply 17 of the 30 DevOps
   postings. Ansible (33%) and Prometheus (20%) look like gaps to learn, but Zscaler alone supplies
   80% and 83% of those mentions. It even decides the headline: Aarav's DevOps coverage is 34%, or
   51% with one-company skills set aside, which flips his closest family from software engineering
   to DevOps. **Hardest to catch for:** a student who picks the next skill straight from the gap
   list, and never reads the company column.
