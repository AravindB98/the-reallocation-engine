"""Load and validate rules.json, run-config.json, postings, and the repo CSVs."""
import csv
import hashlib
import json
from pathlib import Path

from . import RunFailure

LABELS = {"record", "your-input", "model-judgment"}


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise RunFailure(f"file not found: {path}")
    except json.JSONDecodeError as e:
        raise RunFailure(f"not valid JSON: {path}: {e}")


def load_labeled(path, required=()):
    """Every non-underscore key must be {value, label}; label must be a known source label.
    Returns {key: value} plus {key: label}. Missing required keys are NOT an error here —
    the caller decides (a missing timeline input is a per-role refusal, not a crash)."""
    raw = load_json(path)
    if not isinstance(raw, dict):
        raise RunFailure(f"{path}: top level must be an object")
    values, labels = {}, {}
    for k, v in raw.items():
        if k.startswith("_"):
            continue
        if not isinstance(v, dict) or "value" not in v or "label" not in v:
            raise RunFailure(f"{path}: entry '{k}' must be an object with 'value' and 'label'")
        if v["label"] not in LABELS:
            raise RunFailure(f"{path}: entry '{k}' has unknown label '{v['label']}' (allowed: {sorted(LABELS)})")
        values[k] = v["value"]
        labels[k] = v["label"]
    for k in required:
        if k not in values:
            raise RunFailure(f"{path}: required rule '{k}' is missing")
    return values, labels


RULE_KEYS = ("data_family_phrases", "seniority", "min_approvals_for_proven", "tier_precedence",
             "next_action", "timeline_factors", "sample", "provenance")


def load_rules(path):
    return load_labeled(path, required=RULE_KEYS)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def read_csv(path, required_cols):
    try:
        with open(path, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            cols = reader.fieldnames or []
            missing = [c for c in required_cols if c not in cols]
            if missing:
                raise RunFailure(f"{path}: missing columns {missing}")
            return list(reader)
    except FileNotFoundError:
        raise RunFailure(f"file not found: {path}")


def load_sponsorship(repo_root, prov):
    path = Path(repo_root) / prov["sponsorship_csv"]
    if not path.exists():
        raise RunFailure(f"file not found: {path}")
    got = sha256(path)
    if got != prov["sponsorship_csv_sha256"]:
        raise RunFailure(f"SHA-256 mismatch for {prov['sponsorship_csv']}: expected "
                         f"{prov['sponsorship_csv_sha256']}, got {got}")
    return read_csv(path, prov["required_sponsorship_columns"]), got


def load_bls(repo_root, prov):
    return read_csv(Path(repo_root) / prov["bls_csv"], prov["required_bls_columns"])


def load_postings(path):
    raw = load_json(path)
    if not isinstance(raw, dict) or not isinstance(raw.get("postings"), list):
        raise RunFailure(f"{path}: expected an object with a 'postings' list")
    ids = [p.get("posting_id") for p in raw["postings"]]
    if any(not isinstance(i, str) or not i for i in ids):
        raise RunFailure(f"{path}: every posting needs a non-empty string 'posting_id'")
    if len(set(ids)) != len(ids):
        raise RunFailure(f"{path}: duplicate posting_id values")
    for p in raw["postings"]:
        if not isinstance(p.get("company_input"), str) or not p["company_input"].strip():
            raise RunFailure(f"{path}: posting '{p['posting_id']}' needs a non-empty 'company_input'")
    return raw
