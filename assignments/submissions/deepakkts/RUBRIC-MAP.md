# Rubric map: case-aiml-cognitive-floor

## Executive summary

This page tells a grader where each part of the assignment rubric is answered,
by file and heading. It adds no new claims. Every file named below is in this
submission.

## Rubric map

| Rubric criterion | File | Heading(s) where it is satisfied |
|---|---|---|
| Mode Design Quality (24) | `recipes/case-aiml-cognitive-floor.md` | "Mode Design Quality" and its subsections: "Specific to a real domain or career situation: Purpose"; "Data sources, commands, gates, and output formats are named precisely: Source Inventory"; "Proposed additions"; "Phase gates"; "The boundary between verified and inferred is clearly drawn: What it can and cannot verify"; "Output Contract"; "Stop conditions"; "The mode ran"; "RUN_LOG template"; "Out of scope for this version". Lifecycle frontmatter is at the top of the file |
| Domain Justification (20) | `assignments/submissions/deepakkts/JUSTIFICATION.md` | "Who uses this mode and in what exact situation"; "Identifies a specific information asymmetry"; "Connects clearly to at least one engine layer"; "Names 1–2 failure modes specific to the domain" |
| Worked Run (16) | `assignments/submissions/deepakkts/WORKED-RUN.md` | "Inputs"; "Real command output from a real or realistic scenario, pasted not described"; "Verified-vs-inferred split is explicit"; "Verification", including "Hand cross-check against the source files" and "Attestation includes a deliberate break attempt"; "Reflection names what went well, what the mode missed, and concrete next steps"; "Attestation" ("Tested", "Did not test", "Broke during testing, fixed"). Run record: `assignments/submissions/deepakkts/RUN_LOG-entry.md`. Raw outputs: `assignments/submissions/deepakkts/run/run-log.json` and `run/report.md` |
| In-Class Presentation (20) | `assignments/submissions/deepakkts/PRESENTATION.md` | "The domain or situation you designed for"; "The information asymmetry the mode addresses"; "Shows a real run"; "One concrete thing you learned from running (or failing to run) it"; "One honest limitation: something it cannot verify" |
