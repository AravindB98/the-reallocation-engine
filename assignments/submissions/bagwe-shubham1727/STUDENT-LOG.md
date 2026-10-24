# Student log — in my own words (Shubham Bagwe)

## Executive summary

**What this is.** My dated log of what I tried while building and running this mode, and what I decided and why.

**Why read it.** The rest of the submission was written with help of an AI assistant. The entries below are in my own words.

**What it shows.** One gate decision (confirming strong board ties by batch, not individually) and one assumed number (the 45-day hiring time) drive today's whole verdict, and both are named here as the weakest links in my own review.

## 2026-10-21 — Choosing the domain

In my words: I chose the swe-opt-clock domain since I had worked already in a past assignment and felt this will be an extension of it where I need to build it completely and make it resonate with real data. It also resembles the international student post-grad job hunt, and being an international student myself, I felt this is the domain I should work on.


## 2026-10-21 — Gate G1a: which job boards really belong to the sponsor

In my words: It showed me multiple entries, out of which 11 were flagged as strong ties and 6 as weak ties, and there were also 2 decoys. I went ahead with strong ties only since it was already summarised and reviewed by AI, and rather than wasting more time on weak ones or reviewing them again, I chose to focus more on the strong ones. Also, I might miss out on real ones probably since I would be judging on a summary written by AI and not the real raw board pages.


## 2026-10-21 — The Cohere decoy

In my words: When the scan was done, it showed me a Cohere Health software engineer posting on Cohere's Toronto board. In a separate break-test, confirming that board attached Cohere Health's 104 sponsorship approvals to the wrong company's job, which was undetected by the mode. This made me feel like we need to do some tweak to the workflow to review the work, because something like this can waste time and effort.


## 2026-10-21 — The result: nothing fits Neel's clock

In my words: All 15 live postings were closed by the 45-day hiring-time assumption, as the earliest possible start date was Dec 5, which is after the persona's unemployment deadline. That 45 days is a guess and not measured data — it's the single number the whole "no" verdict rests on. If I was in the same condition, I might get anxious and would apply anyway, while keeping the timeline information in mind and being careful.


## 2026-10-21 — Re-running the checks and signing

In my words: I personally re-ran the test suite (21/21) and verify-run.sh myself before signing. There was no error, but the output showed that 3 of 4 live board totals had changed since the capture — only PathAI matched exactly. This was expected since job boards keep updating during the day. Some other runs I asked the AI assistant to run for me so that I can see the output and verify it.


## 2026-10-21 — What I'd change next

In my words: I would tweak it to read inside Greenhouse and Lever board iframes, which can help check all the postings, and would replace the 45-day guess with real data, catching the seniority which is sometimes hidden in descriptions.
