# FRICTIONAL — swe-ai-devops-skill-gap

## Executive summary

This is my log of six places where building this mode got hard: what happened, what I thought,
and what I decided. The biggest one was finding out that my real dates were already in a pushed
commit.

My predictions and my reflection are in `WORKED-RUN.md`. Written by me, 2026-10-21; Claude only
formatted it.

## Friction points

### 1. The list of about 386 companies

**What happened:** My first idea was a list of funded DevOps startups. After the filters, only
about 386 companies were left.

**What I thought:** This is too small and it does not tell me anything useful. I did not want to
build on weak data.

**What I decided:** I said no to this idea. We switched to the skill-gap mode, and I also widened
it from DevOps only to SWE, AI and DevOps.

### 2. Only 4% of the postings had a description

**What happened:** In the first fetch (40 sponsors, 19 boards, 5,066 postings), only 4% of the
postings had any description text. The Greenhouse scraper in the repo never asked for
descriptions.

**What I thought:** Skill counts from this data would be almost empty, so the results could not be
trusted.

**What I decided:** I chose to patch the scraper instead of working around it. I told Claude to
"try at least" the fix. After that, 99% of the postings had text.

### 3. My real dates were already pushed

**What happened:** After I had committed and pushed, the PR checklist led us to the data contract.
My real personal dates were in the pushed commit, and the course treats that as a serious offense.

**What I thought:** I felt bad about it, because I had already pushed. I also did not want to just
say "yes" to a force-push without understanding it.

**What I decided:** I asked why first. Then we switched the tracked run to the course persona,
Aarav Patel, and I kept my real version in `private/`. I ran the git reset and the push myself and
read the output of each step. No PR existed yet, so it never reached a PR or a review, but the old
commit was on my public fork for a while. Next time I will check what is in a commit before I push.

### 4. The MongoDB "SRE 3" posting

**What happened:** The liveness checker said 4 postings were active and 1 was uncertain, and the
uncertain one was MongoDB SRE 3.

**What I thought:** I did not want to trust the tool here, so I opened the page myself.

**What I decided:** The page was live, but it asked for 3+ years of experience. This led us to
check years of experience for all of them. Stripe asks for 8+ years. Only 2 or 3 DevOps postings
fit a new grad, so I will focus on SWE and AI roles first.

### 5. The zip file was not the right format

**What happened:** Claude's first zip had only 35 files.

**What I thought:** This looked different from last time. Last time the zip was the full repo plus
a SUBMISSION.md.

**What I decided:** I told Claude about it, and the zip was rebuilt in the same format as last
time.

### 6. Small CI problems that were not my fault

**What happened:** The CI's PII scan read a Python decorator line in the tests as an email address.
Also, the CI's harness job calls scripts that do not exist on main.

**What I thought:** The first one was a real problem in my code, but the second one was not mine.

**What I decided:** We fixed the decorator line. For the harness job, I wrote a note in the PR. I
also asked Aravind about PRs, and he said to open a new one and keep #20 open, so I opened PR #80.
