#!/usr/bin/env python3
"""guard.py — refuse scorer input that the engine's scorer would quietly accept.

The engine's scorer (scripts/score/role-scorer.mjs at 015843d) is permissive in four ways:

  * a missing liveness or timeline gate counts as fully open: `num(role.liveness?.factor) ?? 1`
    (lines 83-84), so a posting nobody checked can come out "Apply";
  * a gate or probability written as text ("0", "0.9") is not a number, so it is dropped
    (line 65) and the gate again counts as open;
  * a probability outside 0-1 is used as given (fit.p = 5 gives a composite of 1.5);
  * any string is accepted as a source label, so "vibes" passes as provenance.

This guard runs before the scorer and fails closed. If any role breaks a rule below, no
role is scored. It reports every problem it finds and never repairs input.

Rules for each role:
  role_id, company, title   non-empty strings; role_id unique in the batch
  sponsorship               {p, tier, source}: p a number in [0, 1], tier a non-empty string
  fit (optional)            {p, source}: p a number in [0, 1]
  liveness, timeline        REQUIRED {factor, source}: factor a number in [0, 1]
  source (every term)       record | model-judgment | your-input
  override (optional)       {decision: Apply | Consider | Skip, reason: non-empty}
  role_quality              refused: this mode does not use it, and the scorer weights it 0
  any other key             refused, so a misspelt gate ("livenes") cannot slip through

Run from the repo root:
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/guard.py <roles.json>

Exit codes: 0 every role passes · 3 refused (each problem listed) · 2 the file cannot be read.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

LABELS = ("record", "model-judgment", "your-input")
DECISIONS = ("Apply", "Consider", "Skip")
ROLE_KEYS = {"role_id", "company", "title", "sponsorship", "fit", "liveness", "timeline", "override"}
TERMS = (
    # key, number field, required, other required text fields
    ("sponsorship", "p", True, ("tier",)),
    ("fit", "p", False, ()),
    ("liveness", "factor", True, ()),
    ("timeline", "factor", True, ()),
)


def unit_number(x) -> bool:
    """A real number in [0, 1]. Booleans and text are not numbers here."""
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and 0 <= x <= 1


def text(x) -> bool:
    return isinstance(x, str) and x.strip() != ""


def check_role(i: int, role, problems: list[str]) -> None:
    where = f"roles[{i}]"
    if not isinstance(role, dict):
        problems.append(f"{where} must be an object, got {type(role).__name__}")
        return
    rid = role.get("role_id")
    if text(rid):
        where = f"{where} ({rid})"
    for key in ("role_id", "company", "title"):
        if not text(role.get(key)):
            problems.append(f"{where}.{key} must be a non-empty string")
    if "role_quality" in role:
        problems.append(f"{where}.role_quality is not used by this mode (the scorer weights it 0); remove it")
    for key in sorted(set(role) - ROLE_KEYS - {"role_quality"}):
        problems.append(f"{where}.{key} is not a scorer field; a misspelt field is ignored by the scorer, so it is refused")
    for key, number_field, required, needs in TERMS:
        term = role.get(key)
        if term is None:
            if required:
                problems.append(f"{where}.{key} is missing; the scorer would treat it as "
                                + ("fully open (x1)" if key in ("liveness", "timeline") else "absent and drop the vote"))
            continue
        if not isinstance(term, dict):
            problems.append(f"{where}.{key} must be an object, got {type(term).__name__}")
            continue
        value = term.get(number_field)
        if not unit_number(value):
            problems.append(f"{where}.{key}.{number_field} must be a number between 0 and 1, got {value!r}")
        if term.get("source") not in LABELS:
            problems.append(f"{where}.{key}.source must be one of {', '.join(LABELS)}, got {term.get('source')!r}")
        for field in needs:
            if not text(term.get(field)):
                problems.append(f"{where}.{key}.{field} must be a non-empty string")
    if "override" in role:
        o = role["override"]
        if not isinstance(o, dict) or o.get("decision") not in DECISIONS:
            problems.append(f"{where}.override.decision must be one of {', '.join(DECISIONS)}")
        elif not text(o.get("reason")):
            problems.append(f"{where}.override.reason is required (the scorer ignores an override without one)")


def validate(batch) -> list[str]:
    """Every problem in a scorer input batch: a list of roles, or {"roles": [...]}."""
    roles = batch.get("roles") if isinstance(batch, dict) else batch
    if not isinstance(roles, list) or not roles:
        return ["the input must be a non-empty list of roles (or an object with a non-empty `roles` list)"]
    problems: list[str] = []
    seen: set[str] = set()
    for i, role in enumerate(roles):
        check_role(i, role, problems)
        rid = role.get("role_id") if isinstance(role, dict) else None
        if text(rid):
            if rid in seen:
                problems.append(f"roles[{i}] ({rid}).role_id is duplicated")
            seen.add(rid)
    return problems


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1:
        print("usage: guard.py <roles.json>", file=sys.stderr)
        return 2
    path = Path(argv[0])
    try:
        batch = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"cannot read {path}: {exc}", file=sys.stderr)
        return 2
    problems = validate(batch)
    if problems:
        print(f"REFUSED: {len(problems)} problem(s); nothing was sent to the scorer")
        for p in problems:
            print(f"  - {p}")
        return 3
    roles = batch.get("roles") if isinstance(batch, dict) else batch
    print(f"✓ guard: {len(roles)} role(s) pass; safe to send to the scorer")
    return 0


if __name__ == "__main__":
    sys.exit(main())
