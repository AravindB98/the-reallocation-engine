#!/usr/bin/env python3
"""PM/APM live-posting and sponsor-record gate (recipes/cases/2026fa/shinde-pras-pm-apm-live-sponsor.md).

Runs gates G0-G5 of the mode file: inputs, liveness with a negative control per
host, sponsor-record lookup, HOLD routing, the repo scorer, and the two outputs.
Outputs use "posting N" / "host X" references only; raw inputs stay private.
"""
# Section map
#   1. Constants and the Stop exception
#   2. Sponsorship rule v0.1 helpers (reused from PR #16): parse_number, parse_titles,
#      pm_title_level, classify_row
#   3. G0 inputs: load_normalizer, check_timeline, check_inputs, check_out_dir, load_index
#   4. G1 liveness: build_control, parse_liveness, liveness_state, run_liveness
#   5. G2 sponsor record: match_company (exact normalized, then whole-word first-word candidates)
#   6. G3-G5: evaluate (HOLD routing + scorer input), render_report, leak_scan, main
from __future__ import annotations

import argparse
import ast
import csv
import datetime as dt
import importlib
import json
import math
import re
import subprocess
import sys
import types
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
DEFAULT_CSV = REPO / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
REQUIRED_COLUMNS = ("company_name", "Total Approvals", "Total Denials", "top_job_titles_sponsored")
SOURCES = ("record", "model-judgment", "your-input")
HOLD_CODES = ("liveness_unresolved", "host_void", "sponsor_candidate_unconfirmed", "sponsor_not_found",
              "sponsor_ambiguous", "rule_hold_no_h1b_data", "rule_hold_undefined_case")
ID_PARAMS = ("gh_jid", "jobId", "job_id", "id")
# Copied from scripts/score/role-scorer.mjs:60; a match makes the scorer set the sponsorship weight to 0.
SCORER_NO_SPONSOR_RE = re.compile(r"citizen|permanent|green|gc|pr\b|no.?sponsor|authorized")
VERDICT_RE = re.compile(r"^(?:✅|❌|⚠️?)\s+(active|expired|uncertain)\s+(\S+)\s*$")
RESULTS_RE = re.compile(r"^Results: \d+ active\s+\d+ expired\s+\d+ uncertain", re.M)

# --- Sponsorship rule v0.1 helpers, reused from PR #16 ---------------------------------------
# Source: scripts/contrib/2026fa/shinde-pras-pm-apm-opt-clock/pm_opt_clock.py at 4d4af4b
# (parse_number, parse_titles, is_pm_family, pm_title_level, classify_company's rule body).
APPROVALS_THRESHOLD = 50
PM_FAMILY_RE = re.compile(r"product manager|product management|\bapm\b", re.IGNORECASE)
ENTRY_LEVEL_RE = re.compile(r"associate product manager|\bapm\b|\bproduct manager\s+i\b|\bjunior\b|\bnew[\s-]?grad",
                            re.IGNORECASE)
SENIOR_RE = re.compile(r"\b(?:senior|sr|staff|principal|group|lead|director|head|vp|ii|iii|iv|v|vi|vii|viii|ix|x)\b",
                       re.IGNORECASE)


class Stop(Exception):
    """A run-level stop (mode file, Stop conditions (a))."""

    def __init__(self, code: str, detail: str = ""):
        super().__init__(code)
        self.code, self.detail = code, detail


def parse_number(raw):
    text = (raw or "").strip()
    if text == "":
        return None
    value = float(text)
    if not math.isfinite(value):
        raise ValueError(raw)
    return int(value) if value.is_integer() else value


def parse_titles(raw):
    text = (raw or "").strip()
    if text == "":
        return []
    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, (list, tuple)) and all(isinstance(t, str) for t in parsed):
            return [t.strip() for t in parsed]
    except (ValueError, SyntaxError):
        pass
    found = re.findall(r"'([^']*)'|\"([^\"]*)\"", text)
    titles = [(a or b).strip() for a, b in found if (a or b).strip()]
    return titles if titles else None


def pm_title_level(title: str) -> str:
    if SENIOR_RE.search(title):
        return "senior"
    return "entry" if ENTRY_LEVEL_RE.search(title) else "no_level"


def classify_row(row: dict) -> dict:
    """Rule v0.1 on one CSV row: tier/p, or a rule HOLD code."""
    out = {"tier": None, "p": None, "hold": None, "approvals": None, "denials": None}
    try:
        out["denials"] = parse_number(row.get("Total Denials"))
    except ValueError:
        out["denials"] = None
    try:
        approvals = parse_number(row.get("Total Approvals"))
    except ValueError:
        return dict(out, hold="rule_hold_undefined_case")
    out["approvals"] = approvals
    if approvals is None:
        return dict(out, hold="rule_hold_no_h1b_data")
    titles = parse_titles(row.get("top_job_titles_sponsored"))
    if titles is None or approvals <= 0:
        return dict(out, hold="rule_hold_undefined_case")
    levels = {pm_title_level(t) for t in titles if PM_FAMILY_RE.search(t)}
    if not levels:
        tier, p = "Unknown", 0.15
    elif approvals < APPROVALS_THRESHOLD:
        tier, p = "Likely", 0.20
    elif "entry" in levels:
        tier, p = "Likely", 0.70
    elif "no_level" in levels:
        tier, p = "Likely", 0.50
    else:
        tier, p = "Likely", 0.30
    return dict(out, tier=tier, p=p)


# --- G0 inputs --------------------------------------------------------------------------------
def load_normalizer():
    """Import scripts/ats/scrapers/common/normalize.py:22 by path, skipping the package __init__
    (which needs the third-party requests module)."""
    name = "_rae_common"
    if name not in sys.modules:
        pkg = types.ModuleType(name)
        pkg.__path__ = [str(REPO / "scripts/ats/scrapers/common")]
        sys.modules[name] = pkg
    return importlib.import_module(name + ".normalize").normalize_company_name


def _is_unit_number(value) -> bool:
    return (not isinstance(value, bool) and isinstance(value, (int, float))
            and math.isfinite(value) and 0 <= value <= 1)


def check_timeline(inputs: dict) -> float:
    timeline = inputs.get("timeline")
    if not isinstance(timeline, dict) or "factor" not in timeline:
        raise Stop("timeline_missing")
    if not _is_unit_number(timeline["factor"]):
        raise Stop("timeline_invalid", "factor must be a number from 0 to 1")
    return timeline["factor"]


def check_inputs(inputs: dict) -> None:
    auth = (inputs.get("profile") or {}).get("authorization")
    if not isinstance(auth, str) or not auth.strip():
        raise Stop("profile_invalid", "profile.authorization must be a non-empty string")
    if SCORER_NO_SPONSOR_RE.search(auth.lower()):
        raise Stop("profile_zeroes_sponsorship", "authorization text would set the scorer's sponsorship weight to 0")
    postings = inputs.get("postings")
    if not isinstance(postings, list) or not postings:
        raise Stop("inputs_invalid", "postings must be a non-empty list")
    for n, post in enumerate(postings, 1):
        ok = (isinstance(post, dict) and isinstance(post.get("url"), str) and urlsplit(post["url"]).hostname
              and isinstance(post.get("company"), str) and post["company"].strip()
              and isinstance(post.get("title"), str) and _is_unit_number(post.get("fit")))
        if not ok:
            raise Stop("inputs_invalid", "posting %d needs url, company, title and fit (0 to 1)" % n)


def check_out_dir(out_dir: Path) -> None:
    """Outside the repository (REPO comes from this file's location, not from git) no git is needed.
    Inside it, git check-ignore must say the folder is ignored; if git cannot answer, the run stops."""
    out = out_dir.resolve()
    try:
        out.relative_to(REPO)
    except ValueError:
        return  # outside the repository: cannot be tracked
    try:
        probe = subprocess.run(["git", "-C", str(REPO), "check-ignore", "-q", str(out / "probe")],
                               capture_output=True, text=True)
    except OSError:
        raise Stop("out_dir_unverifiable", "git is not available to check the out-dir")
    if probe.returncode == 1:
        raise Stop("out_dir_not_ignored")
    if probe.returncode != 0:
        raise Stop("out_dir_unverifiable", "git check-ignore exit code %d" % probe.returncode)


class CsvIndex:
    """CSV rows keyed by the normalized full name (exact) and by the normalized first word (candidates)."""

    def __init__(self):
        self.exact, self.first = {}, {}


def first_word_key(name: str, normalize) -> str:
    words = name.split()
    return normalize(words[0]) if words else ""


def load_index(csv_path: Path, normalize) -> CsvIndex:
    if not csv_path.is_file():
        raise Stop("csv_missing")
    index = CsvIndex()
    try:
        with csv_path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
            if missing:
                raise Stop("csv_missing_column", ", ".join(missing))
            for row in reader:
                name = row.get("company_name") or ""
                key = normalize(name)
                if key:
                    index.exact.setdefault(key, []).append(row)
                    index.first.setdefault(first_word_key(name, normalize), []).append(row)
    except (csv.Error, UnicodeDecodeError) as err:
        raise Stop("csv_unparseable", type(err).__name__)
    return index


# --- G1 liveness --------------------------------------------------------------------------------
def _mutate(ch: str) -> str:
    if ch.isdigit():
        return str((int(ch) + 5) % 10)
    if ch.isalpha():
        base = ord("a") if ch.islower() else ord("A")
        return chr(base + (ord(ch) - base + 13) % 26)
    return "1" if ch == "0" else "0"


def build_control(url: str):
    """Same URL with the last 3 characters of the job id changed; None if no id is found."""
    parts = urlsplit(url)
    job_id = next((v for k, v in parse_qsl(parts.query) if k in ID_PARAMS and len(v) >= 3), None)
    if job_id is None:
        match = re.search(r"(\d{5,})$", parts.path.rstrip("/").rsplit("/", 1)[-1])
        job_id = match.group(1) if match else None
    if not job_id:
        return None
    return url.replace(job_id, job_id[:-3] + "".join(_mutate(c) for c in job_id[-3:]))


def parse_liveness(text: str, urls: list) -> list:
    """Per-URL verdict lines from ats:liveness output; the exit code is not used."""
    fatal = [l for l in text.splitlines() if l.startswith("Fatal:")]
    if fatal:
        code = "chromium_unavailable" if re.search(r"executable|browser|chromium", fatal[0], re.I) else "liveness_fatal"
        raise Stop(code)
    if not RESULTS_RE.search(text):
        raise Stop("liveness_unparsable", "no Results line")
    lines, found = text.splitlines(), []
    for i, line in enumerate(lines):
        m = VERDICT_RE.match(line)
        if m:
            nxt = lines[i + 1] if i + 1 < len(lines) else ""
            reason = nxt.strip() if nxt.startswith(" ") and not VERDICT_RE.match(nxt) else ""
            found.append((m.group(2), m.group(1), reason))
    if [u for u, _, _ in found] != list(urls):
        raise Stop("liveness_url_mismatch", "verdict lines do not match the URLs sent")
    return [{"verdict": v, "reason": r} for _, v, r in found]


def liveness_state(verdict: str, reason: str):
    """(state, factor, reason_code) per the mode file's G1."""
    if verdict == "active":
        return "PASS", 1.0, None
    if verdict == "expired" and "insufficient content" in reason:
        return "UNRESOLVED", None, "insufficient_content"
    if verdict == "expired":
        return "FAIL", 0.0, "other"
    return "UNRESOLVED", None, "uncertain"


def run_liveness(urls: list, raw_path: Path, replay):
    """(verdicts, captured_at). Live: one ats:liveness call, captured now. Replay or canned: the saved
    file, captured at its modification time (UTC)."""
    if replay:
        text = Path(replay).read_text(encoding="utf-8")
        mtime = dt.datetime.fromtimestamp(Path(replay).stat().st_mtime, dt.timezone.utc)
        captured_at = mtime.replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        captured_at = utc_now()
        proc = subprocess.run(["npm", "run", "ats:liveness", "--"] + urls, cwd=str(REPO),
                              capture_output=True, text=True)
        text = proc.stdout + proc.stderr
        raw_path.write_text(text, encoding="utf-8")
        if proc.returncode not in (0, 1):
            raise Stop("liveness_exit", "exit code %d" % proc.returncode)
    return parse_liveness(text, urls), captured_at


# --- G2 sponsor record --------------------------------------------------------------------------
def match_company(company: str, index: CsvIndex, normalize):
    """(state, exact_rows, candidate_rows). Candidates share the posting company's first word as a
    whole word (normalized), so "Quill" never matches "Quillfern ..."."""
    rows = index.exact.get(normalize(company), [])
    if len(rows) == 1:
        return "MATCH", rows, []
    if len(rows) > 1:
        return "AMBIGUOUS", rows, []
    first = first_word_key(company, normalize)
    cands = list(index.first.get(first, [])) if first else []
    return ("CANDIDATE" if cands else "NOT_FOUND"), [], cands


# --- G3-G5 --------------------------------------------------------------------------------------
def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def evaluate(inputs: dict, human: dict, index: CsvIndex, normalize, verdicts: dict, controls: dict, now: str):
    """Per-posting records, scorer input, human_inputs[], and private candidate lists.
    verdicts maps URL -> {verdict, reason}. CSV company names go only into the private list."""
    timeline = inputs["timeline"]["factor"]
    hosts, records, roles, human_inputs, private = {}, [], [], [], []
    by_post = lambda key: {h.get("posting"): h for h in (human or {}).get(key, []) if isinstance(h, dict)}
    h_live, h_sponsor = by_post("liveness"), by_post("sponsor")
    for n, post in enumerate(inputs["postings"], 1):
        hosts.setdefault(urlsplit(post["url"]).hostname, "host %s" % chr(ord("A") + len(hosts)))
    void = {h for h in hosts if any(urlsplit(p["url"]).hostname == h and (controls[p["url"]] is None or
            verdicts[controls[p["url"]]]["verdict"] == "active") for p in inputs["postings"])}
    for n, post in enumerate(inputs["postings"], 1):
        ref, host = "posting %d" % n, urlsplit(post["url"]).hostname
        v = verdicts[post["url"]]
        state, factor, reason_code = liveness_state(v["verdict"], v["reason"])
        ctl = controls[post["url"]]
        live = {"verdict": v["verdict"], "reason_code": reason_code, "state": state, "factor": factor,
                "control_verdict": verdicts[ctl]["verdict"] if ctl else None, "source": "record"}
        holds = []
        if host in void:
            live.update(state="VOID", factor=None)
            holds.append("host_void")
        elif state == "UNRESOLVED":
            resolved = h_live.get(n, {}).get("state")
            if resolved in ("open", "closed"):
                live.update(factor=1.0 if resolved == "open" else 0.0, source="your-input")
                human_inputs.append({"gate": "G1", "posting_ref": ref, "value": resolved, "source": "your-input",
                                     "note": h_live[n].get("note", ""), "recorded_at": now})
            else:
                holds.append("liveness_unresolved")
        m_state, rows, cands = match_company(post["company"], index, normalize)
        sponsor = {"state": m_state, "rows_matched": len(rows), "candidates_total": len(cands), "approvals": None,
                   "denials": None, "tier": None, "p": None, "source": "record", "rule": "v0.1"}
        row = rows[0] if m_state == "MATCH" else None
        private.append({"posting_ref": ref, "state": m_state, "total": len(cands),
                        "names": [r.get("company_name", "") for r in (cands or rows)]})
        if m_state == "CANDIDATE":
            pick = [r for r in cands if r.get("company_name") == h_sponsor.get(n, {}).get("confirm_row")]
            if len(pick) == 1:
                row = pick[0]
                human_inputs.append({"gate": "G2", "posting_ref": ref, "value": "confirmed", "source": "your-input",
                                     "note": h_sponsor[n].get("note", ""), "recorded_at": now})
            else:
                holds.append("sponsor_candidate_unconfirmed")
        elif m_state == "AMBIGUOUS":
            holds.append("sponsor_ambiguous")
        elif m_state == "NOT_FOUND":
            holds.append("sponsor_not_found")
        if row is not None:
            rule = classify_row(row)
            sponsor.update(approvals=rule["approvals"], denials=rule["denials"], tier=rule["tier"], p=rule["p"])
            if rule["hold"]:
                holds.append(rule["hold"])
            else:
                sponsor["source"] = "model-judgment"
        records.append({"posting_ref": ref, "host_ref": hosts[host], "liveness": live, "sponsor": sponsor,
                        "fit": {"p": post["fit"], "source": "your-input"}, "decision": "HOLD" if holds else None,
                        "hold_reasons": holds})
        if not holds:
            roles.append({"role_id": ref, "company": ref, "title": ref,
                          "sponsorship": {"p": sponsor["p"], "tier": sponsor["tier"], "source": "model-judgment"},
                          "fit": {"p": post["fit"], "source": "your-input"},
                          "liveness": {"factor": live["factor"], "source": live["source"]},
                          "timeline": {"factor": timeline, "source": "your-input"}})
    for role in roles:  # G3 test: nothing reaches the scorer with a missing gate factor
        assert _is_unit_number(role["liveness"]["factor"]) and _is_unit_number(role["timeline"]["factor"])
    return records, roles, human_inputs, private


def write_candidates(private: list, path: Path) -> None:
    """Pass-1 helper for the person: candidate legal names (up to 5, plus the total) per CANDIDATE
    posting, on the terminal and in a private file. Never copied into run-log.json or report.md."""
    lines = []
    for item in private:
        if item["state"] == "CANDIDATE":
            lines.append("%s: CANDIDATE, %d row(s) share the first word; confirm one by exact name:"
                         % (item["posting_ref"], item["total"]))
            lines += ["  - %s" % name for name in item["names"][:5]]
    text = "\n".join(lines) + ("\n" if lines else "")
    path.write_text(text, encoding="utf-8")
    if text:
        print(text, end="")


def shown(value) -> str:
    """Report text for an optional value: JSON keeps null, the report says "not recorded"."""
    return "not recorded" if value is None else str(value)


def render_report(log: dict) -> str:
    posts = log["postings"]
    count = lambda d: sum(1 for p in posts if p["decision"] == d)
    confirmed_refs = {h["posting_ref"] for h in log.get("human_inputs", []) if h.get("value") == "confirmed"}
    lines = ["## Executive summary", "",
             "This report covers %d product manager postings checked for two things before any scoring: whether "
             "each still looks open, and whether the employer has a public sponsorship record. %d came out Consider, "
             "%d Skip and %d on hold for a person to check. On hold means a check could not give a clear answer; it "
             "is not a rejection. Nothing here says whether anyone is eligible for, or will receive, sponsorship."
             % (len(posts), count("Consider"), count("Skip"), count("HOLD")), "",
             "## Run record", "", "- Run: %s (%s mode), generated %s" % (log["run_id"], log["mode"], log["generated_at"]),
             "- Liveness: %s, captured %s" % (log["liveness_source"], shown(log["captured_at"])),
             "- Timeline factor: %s (your-input)" % shown(log["timeline"]["factor"]), "", "## Postings", "",
             "| Posting | Host | Liveness | Sponsor record | Timeline | Decision | Why | Sources |",
             "|---|---|---|---|---|---|---|---|"]
    for p in posts:
        s, live = p["sponsor"], p["liveness"]
        confirmed = ", confirmed by a person" if s["state"] == "CANDIDATE" and p["posting_ref"] in confirmed_refs else ""
        rec = "%s%s (approvals %s, denials %s)" % (s["state"], confirmed, shown(s["approvals"]), shown(s["denials"]))
        state = live["state"] + (" (person saw it %s)" % ("open" if live["factor"] == 1.0 else "closed")
                                 if live["source"] == "your-input" else "")
        why = ", ".join(p["hold_reasons"]) or p.get("why") or ""
        src = "liveness %s; sponsor %s; fit your-input; timeline your-input" % (live["source"], s["source"])
        lines.append("| %s | %s | %s | %s | %s | %s | %s | %s |" % (p["posting_ref"], p["host_ref"], state, rec,
                     shown(log["timeline"]["factor"]), p["decision"] or "not scored", why, src))
    return "\n".join(lines) + "\n"


def leak_scan(paths: list, tokens: list) -> list:
    """Files under paths that contain any raw input token (case-insensitive)."""
    tokens = [t.lower() for t in tokens if t]
    return [str(p) for p in paths if p.is_file() and any(t in p.read_text(encoding="utf-8").lower() for t in tokens)]


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--inputs", required=True, help="private inputs.json")
    ap.add_argument("--human", help="optional human.json (second pass)")
    ap.add_argument("--out-dir", required=True, help="git-ignored output directory")
    ap.add_argument("--liveness-from", help="replay a saved ats:liveness output instead of calling the browser")
    ap.add_argument("--canned", action="store_true",
                    help="the --liveness-from file is a canned fixture, not a saved real run (sets mode=sample)")
    ap.add_argument("--no-score", action="store_true", help="skip the scorer (G4)")
    ap.add_argument("--csv", default=str(DEFAULT_CSV), help="sponsorship CSV (default: the 80-Days CSV)")
    args = ap.parse_args(argv)
    if args.canned and not args.liveness_from:
        ap.error("--canned needs --liveness-from")
    out, now = Path(args.out_dir), utc_now()
    source = "canned" if args.canned else ("replay" if args.liveness_from else "live")
    log = {"run_id": "lsg-" + now.replace(":", "").replace("-", ""), "recipe": "shinde-pras-pm-apm-live-sponsor",
           "recipe_version": "0.1.0", "generated_at": now, "mode": "sample" if args.canned else "live",
           "liveness_source": source, "captured_at": None,
           "timeline": None, "postings": [], "human_inputs": [], "scorer": None, "stops": []}
    try:
        check_out_dir(out)
        out.mkdir(parents=True, exist_ok=True)
        inputs = json.loads(Path(args.inputs).read_text(encoding="utf-8"))
        human = json.loads(Path(args.human).read_text(encoding="utf-8")) if args.human else {}
        log["timeline"] = {"factor": check_timeline(inputs), "source": "your-input"}
        check_inputs(inputs)
        normalize = load_normalizer()
        index = load_index(Path(args.csv), normalize)
        controls = {p["url"]: build_control(p["url"]) for p in inputs["postings"]}
        urls = [u for p in inputs["postings"] for u in (p["url"], controls[p["url"]]) if u]
        found, log["captured_at"] = run_liveness(urls, out / "liveness-raw.txt", args.liveness_from)
        verdicts = dict(zip(urls, found))
        records, roles, log["human_inputs"], private = evaluate(inputs, human, index, normalize, verdicts,
                                                                controls, now)
        log["postings"] = records
        write_candidates(private, out / "candidates-private.txt")
        log["scorer"] = {"skipped": True, "exit_code": None, "output_path": None}
        if roles and not args.no_score:
            (out / "roles.json").write_text(json.dumps(roles, indent=2), encoding="utf-8")
            (out / "profile.json").write_text(json.dumps({"authorization": inputs["profile"]["authorization"]}),
                                              encoding="utf-8")
            proc = subprocess.run(["npm", "run", "score", "--", str(out / "roles.json"), "--profile",
                                   str(out / "profile.json"), "--out-dir", str(out / "score")],
                                  cwd=str(REPO), capture_output=True, text=True)
            log["scorer"] = {"skipped": False, "exit_code": proc.returncode, "output_path": "score/role-scores.json"}
            if proc.returncode != 0:
                raise Stop("scorer_failed", "exit code %d" % proc.returncode)
            scored = {r["role_id"]: r for r in json.loads((out / "score/role-scores.json").read_text())["roles"]}
            for rec in records:
                if rec["posting_ref"] in scored:
                    rec["decision"] = scored[rec["posting_ref"]]["recommendation"]
                    rec["why"] = scored[rec["posting_ref"]]["reason"]
        outputs = [out / "run-log.json", out / "report.md", out / "score/role-scores.json", out / "score/role-scores.md"]
        outputs[0].write_text(json.dumps(log, indent=2), encoding="utf-8")
        outputs[1].write_text(render_report(log), encoding="utf-8")
        tokens = [p[k] for p in inputs["postings"] for k in ("url", "company")] + \
                 [c for c in controls.values() if c] + [urlsplit(p["url"]).hostname for p in inputs["postings"]] + \
                 [h.get("confirm_row") for h in (human or {}).get("sponsor", []) if isinstance(h, dict)] + \
                 [name for item in private for name in item["names"]]  # every CSV company name touched
        leaks = leak_scan(outputs, tokens)
        if leaks:
            for path in outputs:
                if path.is_file():
                    path.unlink()
            raise Stop("leak_detected", "%d output file(s) contained a raw input" % len(leaks))
    except Stop as stop:
        # A stop log keeps only fields that cannot carry raw inputs (human notes are free text).
        log.update(postings=[], human_inputs=[])
        log["stops"].append({"code": stop.code, "detail": stop.detail})
        if stop.code not in ("out_dir_not_ignored", "out_dir_unverifiable") and out.is_dir():
            (out / "run-log.json").write_text(json.dumps(log, indent=2), encoding="utf-8")
        print("STOP %s %s" % (stop.code, stop.detail), file=sys.stderr)
        return 2
    print("ok: %d postings -> %s" % (len(log["postings"]), out / "report.md"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
