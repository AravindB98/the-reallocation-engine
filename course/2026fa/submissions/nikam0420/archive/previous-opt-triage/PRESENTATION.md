# Five-minute presentation and optional recording notes

## Executive summary
The supplied assignment requires a five-minute in-class presentation with a live prototype; no slides are required and it does not list an MP4 deliverable. This outline explains the domain, shows the working sample and names its limits. Rehearse and use your own wording so you can explain every input and gate.

## 0:00–0:45 — situation and asymmetry
“My recipe is for an international MSIS student targeting data analyst roles around graduation. A company name and job title do not tell us whether sponsorship evidence exists or whether hiring could fit an assumed deadline. I built a small offline adapter to make those signals and assumptions visible.”

## 0:45–1:30 — records versus assumptions
“The company name, aggregate approvals and sponsored-title list come from a shipped CSV. The posting statuses and deadlines are fictional sample inputs. My binary sponsorship signal is a policy, not a visa probability. I label those categories separately.”

## 1:30–2:45 — run live, not just a screenshot
```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py
```
Show the terminal and `course/2026fa/submissions/nikam0420/runs/human-report.md`. Explain: one Consider, two Skip; sufficient time gives 44 days against an assumed 21-day lag. The closed posting has liveness zero. The short scenario has only eight days. Both gates zero the composite.

## 2:45–3:30 — deliberately break it
```bash
python3 scripts/contrib/2026fa/nikam0420-analyst-opt-triage/prototype.py --fixture scripts/contrib/2026fa/nikam0420-analyst-opt-triage/fixtures/missing-company.json
```
Explain the BLOCKED result and exit 2. The adapter does not choose a similar company or fill missing values. Then show the offline test command/output if time permits.

## 3:30–4:20 — honest limits
“The approvals are aggregate company history. They cannot confirm sponsorship for this exact role. Posting liveness is simulated, not verified live. The hiring lag is assumed and the deadline is fictional, so this is not a legal OPT calculation. Human review remains pending.”

## 4:20–5:00 — 3-3-2 and next improvement
“This saves a small portion of research within the two applying hours. My estimate is five minutes per role for ten roles, or fifty minutes weekly; I did not benchmark that. A rejected posting can lead to independent networking research. Next I would add an approved current-posting check and role-specific sponsorship evidence.”

## If a separate Canvas announcement requires a recording
Use QuickTime Player → File → New Screen Recording on your Mac, enable your microphone, and record this same terminal walkthrough. Save the MP4 privately unless the professor asks for it. A recording cannot replace the recipe, code, tests, PR and source ZIP.
