## Executive summary

This page compares the screening tool's decisions with a person's own decisions on the same five job postings, across three versions of the tool run on 21 October 2026. It shows whether each round of fixes moved the tool closer to what a careful human decided. Agreement went from 3 of 5 in the first version, down to 2 of 5 in the second, and up to 4 of 5 in the third. The rules were adjusted after the person had already reviewed these same five postings, so this measures fit to known cases, not how well the tool would do on new postings.

## What was compared

- **Human decisions:** the G4 review by rithika-sr on 2026-10-21 (`G4-HUMAN-REVIEW.md`), rows 5, 6, 9, 10, 11. These are the only rows with a recorded Apply / Consider / Skip decision.
- **Tool decisions:** `decision` for the same role ids in `out/mode-log.json` (Run 1), `out-run2/mode-log.json` (Run 2) and `out-run3/mode-log.json` (Run 3). All three ran on the same `candidates.real.json` with `--today 2026-10-21`.
- **Agreement rule:**
  - Human Apply agrees only with tool Apply.
  - Human Skip agrees with any "not Apply" (CLOSED, OVER-LEVEL or HELD).
  - Human Consider disagrees with tool Apply. No other Consider case occurred.

## Results

| Row | Company | Title (as entered) | Human (G4) | Run 1 (v0.1) | Run 2 (v0.2) | Run 3 (v0.3) |
|---|---|---|---|---|---|---|
| 5 | Airbnb Inc | Staff Data Scientist, Locations | **Skip** | Apply (scorer 0.375) ✗ | CLOSED (G2a: posting verified closed) ✓ | CLOSED (G2a: posting verified closed) ✓ |
| 6 | Figma Inc | Data Scientist | **Consider** | Apply (scorer 0.435) ✗ | Apply (scorer 0.435) ✗ | Apply (scorer 0.435) ✗ |
| 9 | Moloco Inc | Data Scientist II, Product - Moloco Commerce Media | **Apply** | Apply (scorer 0.465) ✓ | Apply (scorer 0.465) ✓ | Apply (scorer 0.465) ✓ |
| 10 | Maplebear Inc | Senior Data Scientist I - Meals (US remote) | **Skip** | HELD (G2a: employer page not active) ✓ | Apply (scorer 0.405) ✗ | OVER-LEVEL (LEVEL: title says 'senior') ✓ |
| 11 | Nextdoor Inc | Senior Data Scientist - Search | **Skip** | HELD (G2b: employer page not active) ✓ | Apply (scorer 0.405) ✗ | OVER-LEVEL (LEVEL: title says 'senior') ✓ |
| | | | **Agreement** | **3 / 5** | **2 / 5** | **4 / 5** |

## Reading the numbers

- **Run 1 agreed on rows 10 and 11 by accident.** It held them because the page checker could not see an Apply button, not because they were too senior.
- **Run 2 fixed that false negative.** Greenhouse's own record showed both jobs open, so both became Apply, and agreement dropped. The liveness fix was right; the drop came from the scorer, which lets a strong sponsorship record alone produce Apply.
- **Run 3 adds a rule-based level gate.** It blocks titles with senior, staff, lead and similar words, which turns rows 10 and 11 into OVER-LEVEL.
- **Row 5 (Airbnb) is correct from Run 2 on.** Greenhouse's record returns 404 for the job, so it is CLOSED instead of Apply.
- **Row 6 (Figma) disagrees in every run.** The human chose Consider because the posting asks for an experienced data scientist, but its title is plain "Data Scientist". A title rule cannot see requirements written in the job description.

## Not a held-out evaluation

The level gate and the other Run 2 and Run 3 rules were written after the person reviewed these same five postings, and checked against them. The agreement scores show the rules reproduce decisions that were already known. They do not show how the tool would do on postings nobody has reviewed. Five rows are also far too few to estimate an error rate. A fair test needs a new set of postings, decided by a person before the tool runs on them.
