## Executive summary

This is the human review of a screening run for a fictional student, Sasha Jones, looking for an entry-level data scientist job with visa sponsorship. The tool's output is only a recommendation; this page records what a person saw when opening the postings in a normal browser, and the final decision for each. It matters because the review found one posting the tool recommended that was not the job at all, and one real open job the tool could not confirm. Final decisions: apply to one posting, consider one, and skip three.

## Review record

- **Reviewer:** rithika-sr
- **Date:** 2026-10-21
- **Run reviewed:** live run of 2026-10-21, 13 postings (`worked-run/out/mode-report.md`)
- **Method:** opened each posting below in my own browser and compared it with what the tool reported.

## Observations and decisions

| Row | Posting | What I saw | Tool said | Decision |
|---|---|---|---|---|
| 1 | builtin.com, Instacart Data Scientist | The page says "Sorry, this job was removed at 02:28 p.m. (UTC) on Wednesday, Jun 11, 2025." The checker still said active. The mode held it. | HELD (aggregator only) | Correct hold. |
| 5 | Airbnb, Staff Data Scientist (Greenhouse link) | The link landed on Airbnb's "All Jobs, 194 open roles" page, not on the job. | Apply 0.375 | **Skip.** The checker said active, so this is a false positive, confirmed by the redirect check (D7). |
| 6 | Figma, Data Scientist | Open, with an Apply button, but it asks for an experienced Data Scientist. | Apply 0.435 | **Consider.** |
| 9 | Moloco, Data Scientist II | Open, with an Apply button; mid-level, the closest to Sasha. | Apply 0.465 | **Apply.** |
| 10 | Instacart Meals (Greenhouse link) | Loads on Instacart's own careers site; it is a Senior Data Scientist role, not a role for Sasha. | HELD (checker uncertain) | **Skip.** |
| 11 | Nextdoor Search (Greenhouse link) | An Apply button is visible, but it is a Senior Data Scientist role. | HELD (checker uncertain) | **Skip.** The checker said uncertain, so this is a false negative. |
| 13 | General Catalyst job board | In my browser it loads the Instacart Meals Senior Data Scientist role. The checker had a navigation error. | HELD (navigation error) | So the slip-through risk is real. |

Reviewer: rithika-sr, 2026-10-21.
