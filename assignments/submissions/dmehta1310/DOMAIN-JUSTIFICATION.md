# Domain Justification -- ghost-job-radar

## Executive summary

This page explains who the ghost-job-radar mode is for and what it lets them see. It is for an international master's student on an F-1 visa who is looking for data analyst jobs on a short clock. From a job board, three things are invisible: whether the posting is still open, whether the hiring timeline fits the student's work-authorization window, and whether the company has a sponsorship history. The mode makes all three visible before research time is spent, and this page names two ways it could still mislead.

## Who and when

An F-1 international MS student in the final year of the program (in the worked run, a fictional program end date of 2027-05-15), targeting data analyst roles (closest occupation code in the repository's labor data: SOC 15-2051). The offer has to start inside the CPT/OPT window. They have a handful of research hours a week and are about to spend one on a specific posting.

## The information asymmetry

The employer knows whether the role is still open, how long its hiring takes, and its own sponsorship history; the student finds out only after tailoring an application.

## Engine layers used

- **Job-Ops:** posting discovery and the liveness check, a gate.
- **80 Days to Stay:** company-level H-1B approvals and funding, votes after the gates.
- **Cognitive Pivot:** an occupation reference exists, but the scorer does not use it yet, so this layer adds nothing to a score today.

## Failure modes

**1. "Uncertain" read as "maybe open."**
*Shape:* on a real Greenhouse board, a made-up job number returned `uncertain` ("content present but no visible apply control found"), while the board's public API returned HTTP 404 for it. The tool cannot tell a removed job from a page it could not fully read. A hopeful reader hears "maybe" and applies anyway.
*Hardest to catch for:* a time-pressed student with no reason to doubt a tool that mostly says `active`, and anyone who does not know the API check exists. In the mode, `uncertain` stops the run.

**2. Company-level history misread as role-level sponsorship for this year.**
*Shape:* the CSV shows a company's historical approvals (1,250 approvals and a 98.3% approval rate in the 2026-10-19 run). In the dataset that is 1,250 approvals out of 1,272 decided petitions for the whole company, so it describes the company's past petitions, not the chance that a given applicant gets sponsored, and it says nothing about whether this team sponsors at all. A student can read "98%" as "this job will sponsor me", and the scorer's sponsorship input of 0.9 comes from a company-level tier, so it can look like a role-level probability.
*Hardest to catch for:* a student new to H-1B who has not seen how sponsorship varies by role and team, because the number looks authoritative and nothing on the page says what it counts.

## What this does not claim

It does not predict whether anyone will respond. One company on one day was tested.
