"""Offline checks on the mode's own recipe and card. The engine's `npm run doctor` reads only top-level
`recipes/*.md`, so nothing else checks `recipes/cases/`.

What is checked: the lifecycle claim matches the open typed TODOs (A3 lost points on exactly this); the
version matches the code; both documents open with an executive summary (SNICKERDOODLE P9); every repo
path they name exists ("the named commands actually exist"); no roadmap-only `snickerdoodle` command appears.

Run from the repo root:
    python3 -m unittest discover -s scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tests -v
"""
from __future__ import annotations

import importlib.util
import re
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
REPO = HERE.parents[3]
RECIPE = REPO / "recipes" / "cases" / "2026fa" / "sukethrp-ml-tailor-or-ask.md"
CARD = REPO / "recipes" / "cases" / "2026fa" / "sukethrp-ml-tailor-or-ask.card.md"
ROOTS = ("scripts", "data", "recipes", "search", "course", "book", "resumes", "logs", ".claude")
PATH = re.compile(r"(?<![\w/.-])((?:" + "|".join(re.escape(r) for r in ROOTS) + r")/[\w./-]*[\w/])")
# Named on purpose but private or generated, so they never exist in a clean tree.
NOT_IN_TREE = {"search/profile.yml", "search/resume.json"}


def frontmatter(text: str) -> dict:
    assert text.startswith("---\n"), "no frontmatter"
    block = text[4:text.index("\n---", 4)]
    return dict(line.split(":", 1) for line in block.splitlines() if ":" in line)


def named_paths(text: str) -> set[str]:
    found = set()
    for m in PATH.finditer(text):
        rest = re.match(r"[^\s`)\]|]*", text[m.end():]).group(0)
        if "<" in rest:  # a template such as logs/runs/2026fa-sukethrp-<n>.md
            continue
        found.add(m.group(1))
    return found


class Lifecycle(unittest.TestCase):
    text = RECIPE.read_text(encoding="utf-8")
    fm = {k.strip(): v.strip() for k, v in frontmatter(text).items()}

    def test_todos_open_matches_the_typed_markers(self):
        self.assertEqual(int(self.fm["todos_open"]), self.text.count("[TODO"))

    def test_open_proposals_keep_the_status_at_draft(self):
        if int(self.fm["todos_open"]) > 0:
            self.assertEqual(self.fm["status"], "DRAFT")

    def test_no_attestation_is_claimed(self):
        self.assertEqual(self.fm["attestation"], "null")

    def test_the_version_matches_the_code(self):
        spec = importlib.util.spec_from_file_location("tailor_or_ask", HERE / "tailor_or_ask.py")
        mode = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mode)
        self.assertEqual(self.fm["recipe_version"], mode.RECIPE_VERSION)


class Documents(unittest.TestCase):
    def first_section(self, path: Path) -> str:
        lines = [ln for ln in path.read_text(encoding="utf-8").split("\n---\n", 2)[-1].splitlines() if ln.strip()]
        title = next(i for i, ln in enumerate(lines) if ln.startswith("# "))
        return lines[title + 1]

    def test_both_open_with_an_executive_summary(self):
        for path in (RECIPE, CARD):
            self.assertEqual(self.first_section(path), "## Executive summary", path.name)

    def test_every_named_repo_path_exists(self):
        for path in (RECIPE, CARD):
            missing = sorted(p for p in named_paths(path.read_text(encoding="utf-8"))
                             if p not in NOT_IN_TREE and not (REPO / p).exists())
            self.assertEqual(missing, [], path.name)

    def test_no_roadmap_only_cli_is_named(self):
        for path in (RECIPE, CARD):
            self.assertNotIn("snickerdoodle run", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
