# SOURCES — rithika-sr · ds-newgrad-h1b-15-2051

## Repository and governing documents

- `nikbearbrown/the-reallocation-engine` (forked as `rithika-sr/the-reallocation-engine`):
  `SNICKERDOODLE.md`, `DOMAIN.md`, `CONTRIBUTING.md`, `DATA_CONTRACT.md`, `recipes/README.md`,
  `recipes/_shared.md` (run-log template), `recipes/local-wage-adjustment.md` and `.card.md` (style).

## Data (shipped in the repo; not modified)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` (sponsorship, funding).
- `data/bls/compact/soc_occupation_compact.csv` (BLS OEWS 2024 wages, O*NET fields).
- Persona modeled on `search/examples/priya-nair/profile.yml` (fictional).

## Code reused (called, not copied)

- `scripts/score/role-scorer.mjs` (Ch.11 scorer), via subprocess.
- `scripts/ats/check-liveness.mjs` (`npm run ats:liveness`), which uses Playwright.
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/pii-scan.mjs`.

## External pages checked (worked run, 2026-10-03)

Job postings found by web search and checked with `ats:liveness`:
careers.airbnb.com (Airbnb), boards.greenhouse.io (Airbnb), job-boards.greenhouse.io (Figma),
builtin.com (Instacart), builtinaustin.com (Nextdoor). Full URLs are in `worked-run/candidates.sasha.json`.

## Tools

- Python 3.14 (standard library only), Node 24, Git, macOS Terminal, VS Code.
- Claude (Anthropic), in claude.ai.

## AI contribution

Claude proposed the design and drafted the code, tests, fixtures, recipe, card, and reports, and
found the posting URLs by web search. I ran every command, checked every output, made the
decisions listed in `FRICTIONAL.md`, and performed the hand checks recorded in `WORKED-RUN.md`
(CSV cross-check, composite arithmetic, and opening the builtin.com page). I can explain every
gate, number, and line of the prototype.

## Collaborators

None.
