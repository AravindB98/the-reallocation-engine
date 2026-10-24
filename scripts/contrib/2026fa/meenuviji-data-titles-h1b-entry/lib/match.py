"""Company-match gate (CHANGE-BRIEF §5a, decisions Q4 and Q6).

Normalization: the repo's own COMPANY_SUFFIXES list from scripts/sec/sec-all-quarters.py,
applied in the same order and repeated until nothing changes (as that normalizer does),
THEN non-alphanumerics removed and lower-cased (§5a). The suffix list is read from the
source file with `ast` — the module itself is never imported or executed (it imports pandas).
"""
import ast
import re
from collections import defaultdict
from pathlib import Path

from . import RunFailure

SUFFIX_FILE = "scripts/sec/sec-all-quarters.py"


def load_suffixes(repo_root):
    path = Path(repo_root) / SUFFIX_FILE
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise RunFailure(f"file not found: {path}")
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "COMPANY_SUFFIXES" for t in node.targets):
            value = ast.literal_eval(node.value)
            if isinstance(value, list) and value and all(isinstance(s, str) for s in value):
                return value
    raise RunFailure(f"{SUFFIX_FILE}: COMPANY_SUFFIXES list not found")


def normalize(name, suffixes):
    cleaned = str(name).strip()
    changed = True
    while changed:
        changed = False
        for suffix in suffixes:
            result = re.sub(suffix, "", cleaned, flags=re.IGNORECASE)
            if result != cleaned:
                cleaned = result.strip()
                changed = True
    return re.sub(r"[^a-z0-9]", "", cleaned.lower())


def _brief(row):
    return {
        "company_name": row["company_name"],
        "city": row["city"],
        "state": row["state"],
        "has_sponsorship_data": bool((row["Total Approvals"] or "").strip()),
    }


class Matcher:
    def __init__(self, rows, suffixes):
        self.suffixes = suffixes
        self.exact = {}
        self.by_key = defaultdict(list)
        for r in rows:
            self.exact.setdefault(r["company_name"].strip().upper(), []).append(r)
            self.by_key[normalize(r["company_name"], suffixes)].append(r)

    def match(self, company_input):
        """Returns a dict with status 'ok' or 'stop'. Never guesses a nearest name."""
        up = company_input.strip().upper()
        exact = self.exact.get(up, [])
        if len(exact) == 1:
            row = exact[0]
            key = normalize(row["company_name"], self.suffixes)
            siblings = [_brief(r) for r in self.by_key[key] if r is not row]
            return {"status": "ok", "rule": "exact-upper-case", "row": row, "normalized_key": key,
                    "siblings": siblings}
        key = normalize(company_input, self.suffixes)
        if len(exact) > 1:
            cands = exact
        else:
            cands = self.by_key.get(key, []) if key else []
        if len(cands) == 1:
            return {"status": "ok", "rule": "normalized", "row": cands[0], "normalized_key": key, "siblings": []}
        if len(cands) > 1:
            return {"status": "stop", "gate": "company-match", "reason": "more-than-one-row",
                    "normalized_key": key, "candidates": [_brief(r) for r in cands]}
        return {"status": "stop", "gate": "company-match", "reason": "no-match",
                "normalized_key": key, "candidates": []}
