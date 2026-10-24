"""Shared helpers for the network-sponsorship-text mode (stdlib only).

Every writer in this folder calls `private_path()` first: output is allowed ONLY under the repo's
gitignored `private/` directory, so raw posting text can never land in a tracked file.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
PRIVATE = (REPO / "private").resolve()


def stop(msg: str) -> None:
    """A conformance stop: message to stderr, exit code 2. (sys.exit("text") would exit 1; the unit test caught that.)"""
    print(f"STOP (exit 2): {msg}", file=sys.stderr)
    sys.exit(2)


def private_path(p: str | Path) -> Path:
    """Resolve `p` and refuse anything outside private/ (exit 2: a conformance stop, not a warning)."""
    out = Path(p).resolve()
    if out != PRIVATE and PRIVATE not in out.parents:
        stop(f"refusing to write outside private/: {out}")
    return out


def load_postings(path: str | Path) -> list[dict]:
    """Load either format into one shape: each posting gets a `fields` dict of text by source field.

    * full format (fetch_lever_full.py): postings already carry `fields`.
    * existing format (scripts/ats/fetch-real-postings.py): only `description_text` exists, so that is
      the single field. This is deliberate: it makes the maintained scraper's field loss visible.
    """
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    postings = data.get("postings")
    if not isinstance(postings, list):
        stop(f"{path} has no 'postings' list")
    out = []
    for i, p in enumerate(postings):
        if not isinstance(p, dict) or not str(p.get("title", "")).strip():
            stop(f"postings[{i}] in {path} is missing a title")
        fields = p.get("fields")
        if not isinstance(fields, dict):
            fields = {"description_text": str(p.get("description_text") or "")}
        out.append({**p, "fields": {k: str(v or "") for k, v in fields.items()}})
    return out


def text_sha256(fields: dict[str, str]) -> str:
    """SHA-256 over the posting's text fields, in a fixed order, so a quote can be tied to one version."""
    h = hashlib.sha256()
    for k in sorted(fields):
        h.update(k.encode("utf-8") + b"\x00" + fields[k].encode("utf-8") + b"\x00")
    return h.hexdigest()
