"""run_sample.py — piece 3 of the nishant2681-data-analytics-opt-h1b prototype.

Ties piece 1 (sponsorship.py) and piece 2 (gates.py) to the EXISTING Ch.11
scorer, scripts/score/role-scorer.mjs, which runs as a separate program and is
never imported or copied (CONTRIBUTING.md:46-50).

    python3 scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/run_sample.py \
      --profile search/examples/priya-nair/profile.yml \
      --jobs scripts/contrib/2026fa/nishant2681-data-analytics-opt-h1b/fixtures/jobs.sample.json \
      --csv data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv \
      --today 2026-10-02 --run-id 2026-10-02-sample-1 \
      --out-dir course/2026fa/submissions/nishant2681/runs/2026-10-02-sample-1

Every job is validated before any file is written. Any stop prints the job and
the problem, writes nothing, and exits 2. Standard library + PyYAML only.
"""

import argparse
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys

import yaml

PIECE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(PIECE_DIR, "..", "..", "..", ".."))
sys.path.insert(0, PIECE_DIR)

import gates  # noqa: E402
import report  # noqa: E402
import sponsorship  # noqa: E402

SCORER = os.path.join(REPO_ROOT, "scripts", "score", "role-scorer.mjs")

# "Strong fit" cutoff for sending an Unknown-tier role to networking.
# your-input: set by Nishant on 2026-10-02 [VERIFY].
STRONG_FIT = 0.7

# Next action per scorer decision, from the 3-3-2 day (Ch.2, 02-…md:39).
NEXT_ACTIONS = {
    "Apply": "Tailor an application (2-hour block)",
    "Consider": "Network into the company first (3-hour block)",
}
UNKNOWN_STRONG_FIT_ACTION = "Network, don't apply yet"

REQUIRED_JOB_FIELDS = ["role_id", "company", "title", "url", "fit", "liveness"]

# Every error type that means "this input cannot be scored honestly".
STOP_ERRORS = (
    ValueError, KeyError,
    sponsorship.AmbiguousCompanyError, sponsorship.CompanyNotFoundError, sponsorship.NoTierRuleError,
)


# Raised for a problem in the jobs file itself (shape, missing field, bad value).
class StopError(ValueError):
    pass


# Read the command-line options; all of them are required.
def parse_args(argv):
    parser = argparse.ArgumentParser(description="Score sample data roles through the sponsorship tier and both gates.")
    for name in ["--profile", "--jobs", "--csv", "--today", "--run-id", "--out-dir"]:
        parser.add_argument(name, required=True)
    return parser.parse_args(argv)


# Turn the --today text into a date. The system clock is never read.
def parse_today(text):
    try:
        return datetime.date.fromisoformat(text)
    except ValueError:
        raise StopError(f"--today must be YYYY-MM-DD, got {text!r}")


# Read the jobs file. Malformed JSON or a missing top-level field stops the run.
def load_jobs(path):
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except json.JSONDecodeError as err:
        raise StopError(f"{path}: malformed JSON ({err})")
    titles = data.get("target_titles") if isinstance(data, dict) else None
    jobs = data.get("jobs") if isinstance(data, dict) else None
    if not titles or not all(isinstance(t, str) and t.strip() for t in titles):
        raise StopError(f"{path}: target_titles must be a non-empty list of titles")
    if not jobs or not isinstance(jobs, list):
        raise StopError(f"{path}: jobs must be a non-empty list")
    return titles, jobs


# Read the persona's work-authorization text, used as the scorer's profile.
def load_authorization(path):
    with open(path, encoding="utf-8") as fh:
        visa = (yaml.safe_load(fh) or {}).get("visa") or {}
    status = visa.get("current_status")
    if not isinstance(status, str) or not status.strip():
        raise StopError(f"{path}: missing required field visa.current_status")
    return status


# Check one job has every required field, and that fit is a number from 0 to 1.
def check_job_fields(job):
    missing = [field for field in REQUIRED_JOB_FIELDS if field not in job]
    if missing:
        raise StopError(f"missing field(s): {', '.join(missing)}")
    fit = job["fit"]
    if isinstance(fit, bool) or not isinstance(fit, (int, float)) or not 0 <= fit <= 1:
        raise StopError(f"fit must be a number from 0 to 1, got {fit!r}")
    if not isinstance(job["liveness"], dict):
        raise StopError("liveness must be an object with a label")


# Copy the CSV's funding fields for display. They are context only, never scored.
def funding_context(row):
    if row is None:
        return None
    fields = {"amount": "latest_funding_amount", "stage": "latest_funding_stage", "date": "latest_funding_date"}
    values = {key: (row[col].strip() or None) for key, col in fields.items()}
    return {**values, "source": "record", "note": "context only, not scored"}


# Run one job through piece 1 (company + tier) and piece 2 (both gates).
# Any problem raises, so the caller can collect it as a stop.
def evaluate_job(job, rows, target_titles, visa, today):
    check_job_fields(job)
    row = sponsorship.find_company(job["company"], rows, job.get("csv_company_name"))
    return {
        "job": job,
        "csv_company_name": row["company_name"] if row else None,
        "sponsorship": sponsorship.assign_tier(row, target_titles),
        "funding": funding_context(row),
        "liveness": gates.liveness_factor(job["liveness"].get("label"), job["liveness"].get("evidence_path")),
        "timeline": gates.timeline_factor(visa, today, job.get("hiring_lag_weeks")),
    }


# Evaluate every job, collecting all stops instead of stopping at the first,
# so the human sees every problem at once. Nothing is written here.
def evaluate_all(jobs, rows, target_titles, visa, today):
    results, stops, seen = [], [], set()
    for number, job in enumerate(jobs, start=1):
        name = job.get("role_id", f"job #{number}") if isinstance(job, dict) else f"job #{number}"
        try:
            if not isinstance(job, dict):
                raise StopError("job entry is not an object")
            if job.get("role_id") in seen:
                raise StopError("duplicate role_id")
            seen.add(job.get("role_id"))
            results.append(evaluate_job(job, rows, target_titles, visa, today))
        except STOP_ERRORS as err:
            stops.append({"role_id": name, "problem": str(err)})
    return results, stops


# Build one scorer role in the shape of data/examples/ch11-roles.json.
# p is left out when the tier is Unknown, because there is no evidence.
def to_scorer_role(result):
    job, tier = result["job"], result["sponsorship"]
    sponsorship_term = {"tier": tier["tier"], "source": tier["source"]}
    if tier["p"] is not None:
        sponsorship_term["p"] = tier["p"]
    return {
        "role_id": job["role_id"], "company": job["company"], "title": job["title"],
        "sponsorship": sponsorship_term,
        "fit": {"p": job["fit"], "source": "your-input"},
        "liveness": {"factor": result["liveness"]["factor"], "source": result["liveness"]["source"]},
        "timeline": {"factor": result["timeline"]["factor"], "source": result["timeline"]["source"]},
    }


# Let json write dates as YYYY-MM-DD text.
def _json_default(value):
    if isinstance(value, datetime.date):
        return value.isoformat()
    raise TypeError(f"cannot write {type(value).__name__} as JSON")


# Write data to a file as indented JSON.
def write_json(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, indent=2, default=_json_default)
        fh.write("\n")


# Fingerprint a file, so the run log proves exactly which version was used.
def sha256_of(path):
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


# Show a path relative to the repo root, for readable logs.
def rel(path):
    return os.path.relpath(os.path.abspath(path), REPO_ROOT).replace(os.sep, "/")


# Run the existing scorer as a separate program; return the command and result.
def run_scorer(roles_path, profile_path, scorer_dir):
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("node is not on PATH; the scorer cannot run")
    command = [node, SCORER, roles_path, "--profile", profile_path, "--out-dir", scorer_dir]
    done = subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    shown = ["node", rel(SCORER), rel(roles_path), "--profile", rel(profile_path), "--out-dir", rel(scorer_dir)]
    return {"command": " ".join(shown), "exit_code": done.returncode, "stdout": done.stdout, "stderr": done.stderr}


# Read the scorer's results and check they match what was sent:
# same role ids, same count, and the profile was read as needing sponsorship.
def read_scores(scorer_dir, role_ids):
    with open(os.path.join(scorer_dir, "role-scores.json"), encoding="utf-8") as fh:
        scores = json.load(fh)
    by_id = {role["role_id"]: role for role in scores["roles"]}
    if len(scores["roles"]) != len(role_ids) or set(by_id) != set(role_ids):
        raise ValueError(f"scorer returned {len(scores['roles'])} roles for {len(role_ids)} sent")
    if scores.get("profile_needs_sponsorship") is not True:
        raise ValueError("scorer read the profile as NOT needing sponsorship (applyProfile trap)")
    return scores, by_id


# Choose the next action from the scorer's decision. The decision itself is
# never changed; only an Unknown tier with strong fit swaps the action text.
def next_action(decision, tier, fit, reason):
    if decision == "Skip":
        return f"Drop — {reason}"
    if tier == "Unknown" and fit >= STRONG_FIT:
        return UNKNOWN_STRONG_FIT_ACTION
    return NEXT_ACTIONS[decision]


# Join one job's evaluation with the scorer's verdict for the run log.
def combine(result, scored):
    job = result["job"]
    decision = scored["recommendation"]
    return {
        "role_id": job["role_id"], "company_typed": job["company"],
        "csv_company_name": result["csv_company_name"], "title": job["title"], "url": job["url"],
        "sponsorship": result["sponsorship"], "funding": result["funding"],
        "fit": {"p": job["fit"], "source": "your-input"},
        "liveness": result["liveness"], "timeline": result["timeline"],
        "scorer": {key: scored[key] for key in ["composite", "recommendation", "machine_recommendation", "reason"]}
        | {"arithmetic": scored["trace"]["arithmetic"], "source": "scorer output"},
        "next_action": {
            "text": next_action(decision, result["sponsorship"]["tier"], job["fit"], scored["reason"]),
            "source": "derived from scorer decision",
        },
    }


# Gather the provenance of every input: path and sha256 fingerprint.
def describe_inputs(args):
    paths = {"profile": args.profile, "jobs": args.jobs, "csv": args.csv, "scorer": SCORER}
    return {name: {"path": rel(path), "sha256": sha256_of(path)} for name, path in paths.items()}


# Print every stop and exit without writing anything.
def stop_run(stops):
    print(f"STOP: {len(stops)} problem(s); nothing was written.", file=sys.stderr)
    for stop in stops:
        print(f"  [{stop['role_id']}] {stop['problem']}", file=sys.stderr)
    sys.exit(2)


# Load and validate every input. Returns everything needed to score, or exits.
def load_and_validate(args):
    try:
        today = parse_today(args.today)
        visa = gates.load_profile(args.profile)
        authorization = load_authorization(args.profile)
        rows = sponsorship.load_rows(args.csv)
        target_titles, jobs = load_jobs(args.jobs)
    except (OSError,) + STOP_ERRORS as err:
        stop_run([{"role_id": "inputs", "problem": str(err)}])
    results, stops = evaluate_all(jobs, rows, target_titles, visa, today)
    if stops:
        stop_run(stops)
    return today, authorization, target_titles, results


# Record a scorer failure in the staging folder, keep it, and exit.
def fail_after_staging(staging, base_log, problem, call=None):
    write_json(os.path.join(staging, "run-log.json"), {**base_log, "status": "failed", "problem": problem, "scorer": call})
    print(f"FAILED: {problem}\n  partial output kept at {rel(staging)}", file=sys.stderr)
    sys.exit(1)


# The whole run: refuse to overwrite, validate everything, score, write outputs.
def main(argv=None):
    args = parse_args(argv)
    out_dir = os.path.abspath(args.out_dir)
    staging = out_dir + ".partial"
    for path in (out_dir, staging):
        if os.path.exists(path):
            print(f"STOP: {rel(path)} already exists; refusing to overwrite.", file=sys.stderr)
            sys.exit(2)

    today, authorization, target_titles, results = load_and_validate(args)
    base_log = {"run_id": args.run_id, "today": today, "mode": "sample", "inputs": describe_inputs(args),
                "target_titles": target_titles, "strong_fit": {"value": STRONG_FIT, "source": "your-input"}}

    input_dir, scorer_dir = os.path.join(staging, "scorer-input"), os.path.join(staging, "scorer")
    os.makedirs(input_dir)
    roles_path, profile_path = os.path.join(input_dir, "roles.json"), os.path.join(input_dir, "profile.json")
    write_json(roles_path, [to_scorer_role(r) for r in results])
    write_json(profile_path, {"authorization": authorization, "_source": f"visa.current_status in {rel(args.profile)}"})

    call = run_scorer(roles_path, profile_path, scorer_dir)
    if call["exit_code"] != 0:
        fail_after_staging(staging, base_log, f"scorer exited {call['exit_code']}", call)
    try:
        scores, by_id = read_scores(scorer_dir, [r["job"]["role_id"] for r in results])
    except (OSError, ValueError, KeyError) as err:
        fail_after_staging(staging, base_log, str(err), call)

    audit_name = f"{args.run_id}-audit.md"
    run_log = {**base_log, "status": "ok", "stops": [],
               "roles": [combine(r, by_id[r["job"]["role_id"]]) for r in results],
               "scorer": {"command": call["command"], "exit_code": call["exit_code"],
                          "ran_in": rel(staging), "renamed_to": rel(out_dir),
                          "gate_zero": scores["config"]["gate_zero"], "generated": scores["generated"],
                          "note": "the scorer's 'generated' stamp uses the real clock; --today fixes only the gate maths"},
               "outputs": [rel(os.path.join(out_dir, name)) for name in ["run-log.json", "report.md", audit_name,
                           "scorer-input/roles.json", "scorer-input/profile.json", "scorer/role-scores.json", "scorer/role-scores.md"]]}
    write_json(os.path.join(staging, "run-log.json"), run_log)
    report.write_report(os.path.join(staging, "report.md"), run_log)
    report.write_audit(os.path.join(staging, audit_name), run_log)
    os.rename(staging, out_dir)

    counts = report.decision_counts(run_log)
    print(f"OK: {len(results)} roles -> Apply {counts['Apply']} / Consider {counts['Consider']} / Skip {counts['Skip']}")
    print(f"  outputs in {rel(out_dir)}")


if __name__ == "__main__":
    main()
