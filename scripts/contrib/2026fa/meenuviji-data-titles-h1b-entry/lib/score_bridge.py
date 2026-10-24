"""Calls the EXISTING scorer unchanged: `npm run score -- <roles.json> --out-dir <dir>`.
Stdout is captured for the log but never parsed; results are read from role-scores.json."""
import json
import subprocess
from pathlib import Path

from . import RunFailure


def run_scorer(repo_root, roles_path, score_dir):
    score_dir_arg = str(score_dir)  # repo-relative when inside the repo; resolved against cwd=repo_root
    score_dir = Path(score_dir) if Path(score_dir).is_absolute() else Path(repo_root) / score_dir
    score_dir.mkdir(parents=True, exist_ok=True)
    result_file = score_dir / "role-scores.json"
    # regenerated output: remove so a stale file can never be read as this run's result
    for stale in (result_file, score_dir / "role-scores.md"):
        if stale.exists():
            stale.unlink()
    cmd = ["npm", "run", "score", "--", str(roles_path), "--out-dir", score_dir_arg]
    try:
        proc = subprocess.run(cmd, cwd=str(repo_root), capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        raise RunFailure("npm not found on PATH")
    except subprocess.TimeoutExpired:
        raise RunFailure("scorer timed out after 120 s")
    log = {"command": cmd, "cwd": "<repo root>", "exit_code": proc.returncode,
           "stdout": proc.stdout, "stderr": proc.stderr}
    if proc.returncode != 0:
        raise RunFailure(f"scorer exited {proc.returncode}: {proc.stderr.strip()[-500:]}")
    if not result_file.exists():
        raise RunFailure("scorer exited 0 but wrote no role-scores.json")
    try:
        data = json.loads(result_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise RunFailure(f"role-scores.json does not parse: {e}")
    if data.get("_scorer") != "bayesian-role-scorer" or not isinstance(data.get("roles"), list):
        raise RunFailure("role-scores.json is not bayesian-role-scorer output")
    return data, log


def check_ids(sent_ids, data):
    got = [r.get("role_id") for r in data["roles"]]
    if sorted(got) != sorted(sent_ids):
        raise RunFailure(f"scorer role ids {sorted(got)} != roles sent {sorted(sent_ids)}")
