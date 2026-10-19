# Tailor or ask — 2026-10-19 (live mode)

## Executive summary

This report looks at 2 job posting(s) for someone who will need H-1B sponsorship and asks, for each one, whether it deserves the time a tailored application takes. It checks whether the posting is still open, whether the company's public H-1B history includes this kind of role below senior level, whether the posting's stated experience minimum is within reach, and whether the timing works, then suggests one next step. Read it before spending application time on any of these postings.

**What it found.** Tailor 0 · ask first 0 · move on 0 · hold 2. A hold means a check could not be resolved, so there is no suggestion until a person resolves it. Of each posting's own requirements, only the duration of experience minimums is checked; the kind of experience and every other line are listed for you to read. Every suggestion is a suggestion: the person decides each posting.

## What to do next

### Hold (2)

- **Goodfire — Machine Learning Engineer** (`live-goodfire-mle`). Why: unresolved: timeline (timeline-unset), fit (fit-unset).
  - Stretch: 52 months short of a stated experience minimum.
  - Next: Row 11308: GOODFIRE AI INC (San Francisco, CA); identity confirmed by sukethrp on 2026-10-19. Still unverified: website (goodfireai.com in the file). The person left the timeline unset, with the reason recorded. Nothing that depends on timing is recommended until they state one. The person left fit unset, with the reason recorded. Nothing that depends on fit is recommended until they state one. timeline: the person's reason: "Neither posting supplies an expected hiring duration or start date. The unemployment snapshot also has no reference date. Those missing facts prevent a defensible timeline factor. I would not substitute 0.5 for unknown." fit: the person's reason: "Her structured résumé—the file the mode actually reads—contains eight months of co-op experience. Her separate CV includes another job, so those sources need reconciliation before I treat the profile as complete." Work conditions to review: 'We are hiring for this position in both our San Francisco HQ and our New York office. We are in person 5 days a week, with one company-wide remote week per month.'.
  - **Decided by sukethrp on 2026-10-19: HOLD.** The identity match has supporting evidence, but fit and timing remain unresolved, and current sponsorship is unconfirmed.
- **Orenda — Machine Learning Engineer** (`live-orenda-mle`). Why: unresolved: company (identity-unconfirmed), timeline (timeline-unset), fit (fit-unset).
  - Stretch: 28 months short of a stated experience minimum.
  - Next: A person marked this company row as a candidate, not a confirmed identity. Confirm the employer behind the row (legal name, location, website) and record it as confirmed before any sponsorship evidence is used. The person left the timeline unset, with the reason recorded. Nothing that depends on timing is recommended until they state one. The person left fit unset, with the reason recorded. Nothing that depends on fit is recommended until they state one. company: the person's reason: "The current employer operates an energy-storage business through orendapower.com, while the dataset lists orenda.io, which currently leads to a domain-for-sale page. The matching name, industry, and general location are useful evidence, but I still need a reliable connection between those records." timeline: the person's reason: "Neither posting supplies an expected hiring duration or start date. The unemployment snapshot also has no reference date. Those missing facts prevent a defensible timeline factor. I would not substitute 0.5 for unknown." fit: the person's reason: "Her structured résumé—the file the mode actually reads—contains eight months of co-op experience. Her separate CV includes another job, so those sources need reconciliation before I treat the profile as complete." Work conditions to review: 'This is a full time, in-office position requiring work from our headquarters (Brooklyn, NY) five days a week.'.
  - **Decided by sukethrp on 2026-10-19: HOLD.** The dataset identity match still needs confirmation, alongside fit and timing. Its smaller experience gap does not clear those gates.

## Verified vs inferred, posting by posting

`record` = read from a repo record or a live check · `your-input` = declared by the student · `model-judgment` = proposed by Claude Code · `computed` = the scorer's arithmetic on the labelled inputs.

### Goodfire — Machine Learning Engineer

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Goodfire — Machine Learning Engineer | your-input | the queue |
| company record | row 11308: GOODFIRE AI INC (San Francisco, CA) | your-input | identity confirmed by sukethrp on 2026-10-19 |
| identity evidence | Goodfire’s official legal terms identify that name, and its SEC filing corroborates the name, San Francisco location, and offering details in the dataset. This clears the proposed identity match, not sponsorship. Sources: https://www.goodfire.com/legal/tos; https://www.sec.gov/Archives/edgar/data/2070813/000207081325000001/xslFormDX01/primary_doc.xml. Still unverified: website (goodfireai.com in the file). | your-input | the person's identity decision |
| posting liveness | active (an apply control was detected; nothing more) | record | scripts/ats/check-liveness.mjs (npm run ats:liveness) |

Requirements, from the posting's own text (record; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | 5+ years of experience in ML infra, research engineering, or systems programming. | duration: 5+ years | in ML infra, research engineering, or systems programming | duration short by 52 months, counting every documented month |
| required | Comfort working across research and engineering boundaries. | no | — | not checked: read it yourself |
| required | Expertise in Python, PyTorch or Jax, and distributed systems. | no | — | not checked: read it yourself |
| required | Experience deploying and maintaining ML systems at scale. | no | — | not checked: read it yourself |
| required | You care about understanding how models work internally and using that to make them more reliable and useful in the real world. | no | — | not checked: read it yourself |
| preferred | Open-source ML infra contributions. | no | — | not checked: read it yourself |
| preferred | Startup or frontier lab experience in fast-moving teams. | no | — | not checked: read it yourself |
| conditions | We are hiring for this position in both our San Francisco HQ and our New York office. We are in person 5 days a week, with one company-wide remote week per month. | no | — | work condition: awaiting review |

### Orenda — Machine Learning Engineer

| Value | What it says | Label | From |
|---|---|---|---|
| posting | Orenda — Machine Learning Engineer | your-input | the queue |
| candidate company row (not cleared) | row 19228: ORENDA INC (NEW YORK, NY; file website orenda.io) | record | the sponsorship file |
| identity decision | candidate, not cleared: The current employer operates an energy-storage business through orendapower.com, while the dataset lists orenda.io, which currently leads to a domain-for-sale page. The matching name, industry, and general location are useful evidence, but I still need a reliable connection between those records. | your-input | decided by sukethrp on 2026-10-19 |
| posting liveness | active (an apply control was detected; nothing more) | record | scripts/ats/check-liveness.mjs (npm run ats:liveness) |

Requirements, from the posting's own text (record; lines sorted and checked by rules labelled your-input). Documented experience (record): 0 months of employment (type not stated unless the résumé says; 0 stated full-time), 8 of co-op or internship, 0 needing supporting information; projects are not counted. Only the duration of an experience minimum is checked; the kind of experience a line asks for is shown, not checked, and every other line is for you to read.

| Section | Line | Checked | Kind asked (not checked) | Result |
|---|---|---|---|---|
| required | Excellent problem solver with an affinity for interesting and difficult problems and the follow-through to solve them | no | — | not checked: read it yourself |
| required | B.S. and 3+ years of relevant experience | duration: 3+ years | relevant experience | duration short by 28 months, counting every documented month; the degree it names is not checked (being enrolled is not holding it) |
| required | Deep understanding of timeseries forecasting, machine learning algorithms, data processing, and model optimization techniques | no | — | not checked: read it yourself |
| required | 2+ years experience writing clean, maintainable Python code with Machine Learning frameworks (e.g. PyTorch, Tensorflow) | duration: 2+ years | experience writing clean, maintainable Python code with Machine Learning frameworks (e.g. PyTorch, Tensorflow) | duration short by 16 months, counting every documented month |
| required | Proficiency with AI-driven development workflows and coding agents (Claude Code, ChatGPT Codex, etc.) | no | — | not checked: read it yourself |
| required | Demonstrated experience crafting, performing, and analyzing experiments | no | — | not checked: read it yourself |
| required | Proficiency working in a cloud computing environment | no | — | not checked: read it yourself |
| required | You take a first principles, mathematically-minded approach to new problems | no | — | not checked: read it yourself |
| required | Keen attention to detail. You do not need someone to inspect your work | no | — | not checked: read it yourself |
| required | Relentlessly positive attitude, strong work ethic, and sense of humor | no | — | not checked: read it yourself |
| preferred | Experience in energy markets | no | — | not checked: read it yourself |
| preferred | SWE background (cloud infrastructure, CI/CD, testing, production-level code) | no | — | not checked: read it yourself |
| conditions | This is a full time, in-office position requiring work from our headquarters (Brooklyn, NY) five days a week. | no | — | work condition: awaiting review |

## What this run cannot verify

- Whether this employer will sponsor this person for this role now. A history of sponsorship is not a policy, and policies, budgets and teams change.
- When a title was sponsored. The sponsorship file has no filing years, so a matching title may be old.
- Whether a sponsored title without a seniority word was an early-career hire. No marker is not proof.
- Titles beyond the file's short 'top titles' list, and companies the file does not cover (it carries H-1B fields for about 5% of its rows and covers six states).
- Whether the company in the file is the employer on the posting. The join behind the file has no published error rate.
- Most of a posting's requirements. This version checks only minimum-experience lines; skills, tools, degree and every other line are listed for the person to read, not checked.
- Whether the counted months are the kind of experience a line asks for ('in ML infra', 'using Python with ML frameworks'). The mode adds up the duration of every documented job; the kind is shown for a person to judge, never checked.
- What the sponsorship numbers mean. 0.9 and 0.6 are declared screening assumptions, not chances of sponsorship, and approvals are company-wide, not ML-engineering approvals.
- Employment type and hours. A job whose title doesn't say co-op, internship or similar is counted as employment of unstated type, never assumed full-time; assistantships, contract and fellowship work need supporting information before they count.
- Whether co-op or internship time counts toward a stated minimum, or whether a 'required' line is enforced. Postings rarely say, so that becomes the question to ask; a posting can also soften its own requirements elsewhere in its text.
- Whether the résumé file is complete. The mode counts only the experience the file lists (the fictional persona's file omits a job its CV lists).
- Anything about timeline or fit. Those numbers are declared by a person (or proposed by Claude Code), not measured.
- Legal eligibility (OPT, STEM OPT, cap-gap). That is a question for the school's DSO or an attorney.

## Run record

- Recipe: `recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md` v0.1.0 · run `2026-10-19-live-bd58ecec` · status complete
- Queue: `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/queue.json` (sha256 `bd58ececd483…`), chosen by student
- Rules: `scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/rules.json` v0.2.0, declared by student (values they produce are labelled your-input)
- Sponsorship file: `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` · sha256 `eccdee2addf472b1639269f42eec693b083b7ce251347d5fd0b2856cfdae6270` · 30369 rows
- Scorer: `not run: no posting cleared every gate`
- Agent log: `course/2026fa/submissions/sukethrp/mode-ml-tailor-or-ask/runs/live/round-2-personal/run-log.json`
