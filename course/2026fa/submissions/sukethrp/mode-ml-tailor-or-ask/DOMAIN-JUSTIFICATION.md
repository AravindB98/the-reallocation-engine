# Domain justification — tailor or ask, for early-career ML/AI engineers on F-1

## Executive summary

Who the mode is for, what it lets them see that they otherwise can't, and two errors specific to their situation.

## Who uses it, and when

The mode is for the point where an international ML/AI engineer on F-1 finds an ML/AI engineering opening and needs
to decide whether it deserves the time to tailor an application. They are looking at early-career roles, but with
prior production ML and other technical experience, so a "new grad" label does not fully describe their
background. The mode brings together the posting's current status, the sponsorship evidence and the posting's
requirements. That way they can see what matches and what still needs clarification, and then tailor, ask a
specific question first, or move on.

## The information asymmetry

From outside, this person cannot easily see:
- **Whether sponsorship history is relevant to this role.** The engine's sponsorship file carries H-1B fields for only
  1,557 of its 30,369 companies. Its approvals are company-wide, and its sponsored titles are a short list with no
  years. Historical sponsorship alone cannot tell them whether the employer will sponsor them.
- **Whether their experience meets the actual requirements.** Postings mix required and preferred lines. They state
  minimums ("5+ years", "B.S. and 3+ years") without saying whether co-op, internship, assistantship or part-time
  work counts. A promising company and job title still do not establish that the applicant meets them.
- **Whether a page is still open.** An apply control can be detected, but that answers only one question.

## Engine layers it connects

- **80 Days to Stay:** The mode reads company-wide approval counts and a short list of sponsored titles. Relevant
  ML/AI titles, including II/L2 titles, count under the declared rules, with the exact wording shown. These records do
  not establish the hire’s level, current sponsorship policy, or whether the applicant qualifies.
- **Job-Ops:** posting liveness, as a gate. "Active" means an apply control was detected, nothing more.
- **A first slice of a requirements check**, not yet an engine layer: The mode compares stated experience minimums
  with documented duration by employment type. It does not verify that those months involved the required kind of
  work. Degree conditions, skills, and other unchecked requirements remain visible for review.

The Cognitive Pivot layer is not used: the scorer gives role quality no weight.

## Failure modes specific to this domain

1. **The company in the file is not the employer on the posting.**
   - **Shape:** a posting's "Meta" matched META CO of Portola Valley, a small company with no H-1B record. So one of
     the largest sponsors looked "unknown". Even an exact name can be wrong: "Orenda" matches ORENDA INC exactly,
     but the file's website leads to a domain-for-sale page while the employer uses another domain.
   - **Hardest to catch for:** someone who reads the company name and not the printed legal name, city and website.
     A wrong-company match can hide relevant sponsorship evidence and cause an applicant to deprioritise a role for
     the wrong reason. Missing history remains unknown: the mode asks first after other gates clear, or holds while
     identity and other required checks remain unresolved.
2. **Experience counted more confidently than it should be.**
   - **Shape:** adding different employment entries gives a duration, but it does not prove that every
     month satisfies a requirement for ML engineering, forecasting or research experience. The mode can also calculate
     correctly from an incomplete input: the fictional applicant's structured résumé omits a job her CV lists.
   - **Hardest to catch for:** applicants with real prior experience, because the number looks earned, and anyone
     who trusts the file the mode reads without checking it against their other records.

## Provenance

Assembled by Claude Code from the student's checkpoint sentences (third person; no employers or dates), with figures
from the runs. **Approved by the student on 2026-10-19** with their final edits applied word for word.
