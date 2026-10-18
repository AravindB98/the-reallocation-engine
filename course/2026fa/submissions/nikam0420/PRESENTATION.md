## Executive summary

This five-minute talk demonstrates a real analyst evidence workflow, its count checks, and its refusal to recommend applications without current evidence. Rehearse once and explain the limits in your own words.

# Five-minute show and tell

**0:00–0:45 — Situation.** “I designed this for an international graduate looking for data analyst or business intelligence work. Company sponsorship history alone does not tell us whether the historical sponsored work involved analysts.”

**0:45–1:30 — Asymmetry.** “A large approval count can look convincing, but it is company-level. It may refer to software engineers, a different legal entity, or senior work. I wanted the original title evidence visible.” Open DOMAIN-JUSTIFICATION.md.

**1:30–2:45 — Real execution.** Open WORKED-RUN.md and the terminal transcript. “The workflow read 30,369 source records, found 1,557 with any H-1B fields populated, and found 61 with one of my analyst title strings. It invoked the repository's maintained join validator on all rows after removing contact columns.” Open the human table; show ACE-UP's Business Intelligence Analyst string as a stored example, without calling it a live vacancy.

**2:45–3:30 — Verification.** Show the test output: “I checked all 61 matches against their original source records, repeated the run, and deliberately supplied missing files, missing columns, and malformed title data. Each bad input exited 2 and created no output.”

**3:30–4:15 — What I learned.** “A successful program run does not prove the underlying employer join. The maintained audit explicitly says raw employer identity data is missing. So I kept the output as a research report, not an Apply list.”

**4:15–5:00 — Limitation and next step.** “This cannot verify a current posting, employer willingness to sponsor this role, or my visa timeline. Liveness and timeline are hard gates; a high historical count cannot overrule either. The recipe remains DRAFT until I record my own adequacy review. Next I would validate one employer identity and one exact live posting.”

## Likely questions

- **Why no score?** Missing gate evidence must stop the decision; making up a probability would hide uncertainty.
- **Why DRAFT if it ran?** Execution is evidenced, but lifecycle promotion also requires human adequacy review. I will only claim the review I actually performed.
- **Does 61 mean 61 job openings?** No, 61 source rows with title strings, including potentially senior roles and uncertain employer matches.
- **Is the approval count for the analyst title?** No. The dataset stores company-level approvals beside a title list; it does not allocate approvals to each title.
- **Did you use AI?** “AI assisted the implementation and documentation and executed the commands. I reviewed [state only what you personally reviewed] and I am responsible for my interpretation.”
