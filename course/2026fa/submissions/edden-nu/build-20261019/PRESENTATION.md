# Five-minute show-and-tell

## Executive summary

Show the running sponsorship workflow and explain why missing evidence is different from negative evidence. The strongest demonstration is a company with historical approvals whose fictional opening still gets skipped, followed by a short page that is blocked rather than declared closed.

## 0:00–0:45 — Domain

“I built this for an early-career Information Systems applicant comparing software, analytics, and design openings while needing sponsorship clarification. The demo uses the repository's fictional persona, not my private résumé.”

## 0:45–1:30 — Information gap

“A company sponsorship record does not establish the policy of a particular role. An empty history field also does not mean the employer refuses sponsorship. I made those distinctions explicit rather than assigning an invented probability.”

## 1:30–2:45 — Show the execution

Open `WORKED-RUN.md` and the sample terminal output. Show 30,369 real source rows and nine synthetic cases. Open `run/report.md`. Explain S1: historical records cannot override explicit synthetic negative policy. Explain S4: missing history is not an automatic rejection; Apply still means pending human review, not an application sent.

## 2:45–3:45 — Show a break attempt

Show the offline test `test_error_page_with_apply_button_does_not_pass` and its passing output. Explain that the maintained classifier can see a button on a 403 page; the wrapper blocks that outcome. Show the overwrite test's exit 2 and that the original JSON survived unchanged.

## 3:45–4:30 — Limitation

“The actual data and code ran, but job pages, policy statements, and dates in this sample are invented. I cannot verify current employer policy or real visa eligibility. The original H-1B joins lack the raw evidence needed for an independent identity audit.”

## 4:30–5:00 — Next step

“Next I would have a person inspect a real requisition and timeline evidence, record their gate decisions, and only then use the queue for application work. The sample results have been reviewed; the recipe is RUNNABLE-SAMPLE. Live employer and timeline gates are still uncleared.”
