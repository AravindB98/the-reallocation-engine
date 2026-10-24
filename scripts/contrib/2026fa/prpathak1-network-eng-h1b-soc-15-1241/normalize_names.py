"""Normalize company names with the repo's own normalizer.

Imports normalize_company_name() from scripts/sec/entity-resolution.py so the
prototype never carries a copy of it. Called by run.mjs through a shell.

stdin:  JSON list of company names (UTF-8)
stdout: JSON list of normalized names, same length and order (UTF-8)
"""

import importlib.util
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SOURCE = REPO / "scripts" / "sec" / "entity-resolution.py"


def load_normalizer():
    spec = importlib.util.spec_from_file_location("entity_resolution", SOURCE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.normalize_company_name


def main() -> None:
    names = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    if not isinstance(names, list):
        raise SystemExit("normalize_names.py: expected a JSON list on stdin")
    normalize = load_normalizer()
    out = [normalize(name) if isinstance(name, str) else "" for name in names]
    sys.stdout.buffer.write(json.dumps(out).encode("utf-8"))


if __name__ == "__main__":
    main()
