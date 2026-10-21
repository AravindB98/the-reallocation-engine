#!/usr/bin/env python3
"""refresh.py — weekly apply-queue refresh for an AI / Data Engineer on F-1 OPT (Mode Build, 2026fa).

    python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py               # offline sample, no network
    python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --dry-run     # print the plan, write nothing
    python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py --live        # live: page check + board API

Re-checks a shortlist of postings:
  1. liveness, two independent ways — the repo's page checker (scripts/ats/check-liveness.mjs, `npm run
     ats:liveness`) and the Greenhouse board API (greenhouse-watch fetch_board, allow-listed). A GATE: a posting
     is live only when both agree; disagreement or 'uncertain' is refused (investigate), never scored;
  2. the OPT clock from the persona's profile.yml visa block (Chapter 10 inputs) — a GATE;
  3. fit, recomputed with greenhouse-watch's record-based judge() on the persona's résumé;
  4. BLS role-quality context (cognitive_pivot_score, median wage) — shown, not scored;
  5. the engine scorer (scripts/score/role-scorer.mjs, `npm run score`) on the gated roles.
Writes refresh-log.json (agent), refresh-report.md (human), refresh-audit.md (audit) and raw/ (kept, redacted, hashed).
Exit 0 = ran; 1 = refused (bad input or a stop condition) — a refused run writes nothing.
"""
import argparse
import ast
import csv
import datetime as dt
import hashlib
import html
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
from pathlib import Path

TOOL, VERSION = "apply-queue-refresh", "0.1.2"
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
GW_PATH = REPO / ".claude" / "skills" / "greenhouse-watch" / "scripts" / "greenhouse_watch.py"
SCORER = REPO / "scripts" / "score" / "role-scorer.mjs"
LIVENESS = REPO / "scripts" / "ats" / "check-liveness.mjs"
EXAMPLES = REPO / "search" / "examples"
PRIVATE = REPO / "private"
DEFAULTS = {
    "queue": HERE / "sample" / "queue.sample.json",
    "snapshot": HERE / "sample" / "snapshot-2026-10-19",
    "persona": EXAMPLES / "priya-nair",
    "csv": REPO / "data" / "80-days-to-stay" / "80-days-csv" / "mapped_student_employment_targets_v3.csv",
    "bls": REPO / "data" / "bls" / "compact" / "soc_occupation_compact.csv",
    "scheme": REPO / ".claude" / "skills" / "greenhouse-watch" / "scheme.default.json",
    "rules": HERE / "rules.json",
}
REC, INP = "record", "your-input"
STEM_CEILING = 150

_spec = importlib.util.spec_from_file_location("greenhouse_watch", GW_PATH)
GW = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(GW)


class InputError(Exception):
    """Bad input: the run is refused and nothing is written."""


class StopRun(Exception):
    """A stop condition: the mode refuses to produce a score rather than guess. Nothing is written."""


# ----------------------------------------------------------------- small helpers
def rel(p):
    p = Path(p).resolve()
    try:
        return str(p.relative_to(REPO))
    except ValueError:
        return str(p)


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def to_date(v, field):
    if isinstance(v, dt.date):
        return v
    try:
        return dt.date.fromisoformat(str(v))
    except ValueError:
        raise InputError(f"{field} is not a date (YYYY-MM-DD): {v!r}")


def under(path, root):
    try:
        Path(path).resolve().relative_to(Path(root).resolve())
        return True
    except ValueError:
        return False


def tracked(path):
    """True / False: whether git tracks this file in the repository; None when git can't tell (no git, or no checkout)."""
    try:
        p = subprocess.run(["git", "ls-files", "--error-unmatch", "--", str(Path(path).resolve())], cwd=str(REPO),
                           capture_output=True, text=True)
    except OSError:
        return None
    if p.returncode == 0:
        return True
    return None if "not a git repository" in (p.stderr or "") else False


def committed_example(paths, root):
    """(ok, how): ok only if every path is inside `root` AND git-tracked. Without git, the location alone decides."""
    if not all(under(p, root) for p in paths):
        return False, "outside the committed examples"
    states = [tracked(p) for p in paths]
    if any(s is None for s in states):
        return True, "location only (git unavailable)"
    return all(states), "git-tracked" if all(states) else "inside the examples folder but not tracked by git"


_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE = re.compile(r"\(\d{3}\)\s*\d{3}[\s.-]\d{4}|\b\d{3}[.-]\d{3}[.-]\d{4}\b")


def redact(text):
    """Remove email addresses and phone numbers (separators required, so job ids survive). Returns (text, count)."""
    text, n1 = _EMAIL.subn("[email redacted]", text)
    text, n2 = _PHONE.subn("[phone redacted]", text)
    return text, n1 + n2


# ----------------------------------------------------------------- inputs
def load_json(path, what):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise InputError(f"{what} not found: {path}")
    except json.JSONDecodeError as e:
        raise InputError(f"{what} is not valid JSON ({path}): {e}")


def load_queue(path):
    q = load_json(path, "queue")
    posts = q.get("postings") if isinstance(q, dict) else None
    if not isinstance(posts, list) or not posts:
        raise InputError(f"queue {path} needs a non-empty 'postings' list")
    seen = set()
    for i, p in enumerate(posts):
        for k in ("company", "title", "url", "job_id", "soc"):
            if not str(p.get(k) or "").strip():
                raise InputError(f"queue posting [{i}] is missing {k!r}")
        b = p.get("board") or {}
        if b.get("ats") != "greenhouse" or not b.get("slug"):
            raise InputError(f"queue posting [{i}] needs board.ats 'greenhouse' and board.slug (other boards are not supported yet)")
        s = p.get("sponsorship") or {}
        if not isinstance(s.get("p"), (int, float)) or not s.get("tier"):
            raise InputError(f"queue posting [{i}] needs sponsorship.p (a number) and sponsorship.tier")
        if not str(p["url"]).startswith("https://"):
            raise InputError(f"queue posting [{i}] url must be https: {p['url']}")
        p["key"] = f"{b['slug']}-{p['job_id']}"
        if p["key"] in seen:
            raise InputError(f"queue has the posting {p['key']} twice")
        seen.add(p["key"])
    return q


def load_persona(folder):
    folder = Path(folder)
    prof_path = folder / "profile.yml"
    if not prof_path.exists():
        raise InputError(f"persona folder {folder} has no profile.yml")
    try:
        import yaml
    except ImportError:
        raise InputError("PyYAML is needed to read profile.yml (pip install pyyaml; the repo's conformance check needs it too)")
    profile = yaml.safe_load(prof_path.read_text(encoding="utf-8")) or {}
    if "needs_sponsorship" not in profile:
        raise StopRun(f"needs_sponsorship is not stated explicitly in {rel(prof_path)} — this mode will not infer it from "
                      "free-text authorization (the trap the repo fixed in PR #37)")
    if profile["needs_sponsorship"] is not True:
        raise StopRun("this persona does not need sponsorship — the mode is for F-1 OPT holders who do")
    visa = profile.get("visa") or {}
    if str(visa.get("type") or "").upper() != "F-1":
        raise StopRun(f"the mode is for F-1 OPT; profile.yml visa.type is {visa.get('type')!r}")
    resume_path = next((folder / n for n in ("resume.example.json", "resume.json") if (folder / n).exists()), None)
    if resume_path is None:
        raise InputError(f"persona folder {folder} has no resume.example.json or resume.json")
    try:
        resume = GW.load_resume(str(resume_path))
    except GW.InputError as e:
        raise InputError(str(e))
    fictional, how = committed_example([prof_path, resume_path], EXAMPLES)
    return {"profile": profile, "visa": visa, "resume": resume, "profile_path": prof_path, "resume_path": resume_path,
            "fictional": fictional, "fictional_check": how}


def load_csv_rows(path, key):
    try:
        with open(path, newline="", encoding="utf-8") as f:
            rd = csv.DictReader(f)
            if key not in (rd.fieldnames or []):
                raise InputError(f"{path} has no {key!r} column")
            return list(rd)
    except FileNotFoundError:
        raise InputError(f"CSV not found: {path}")


# ----------------------------------------------------------------- the gates
_LIVE_LINE = re.compile(r"^\S+\s+(active|expired|uncertain)\s+(\S+)\s*$")


def parse_liveness(text):
    """check-liveness.mjs stdout -> {url: {result, reason}}. Exit 1 only means 'something is not active'."""
    out, last = {}, None
    for line in text.splitlines():
        m = _LIVE_LINE.match(line.strip()) if not line.startswith("           ") else None
        if m:
            last = m.group(2)
            out[last] = {"result": m.group(1), "reason": None}
        elif last and line.startswith("           ") and line.strip():
            out[last]["reason"] = line.strip()
        elif not line.strip():
            last = None
    return out


def liveness_gate(page, api, rules):
    """(factor | None, verdict, reason). Live only when the page check and the board API agree."""
    lv = rules["liveness"]
    if page == "active" and api == "present":
        return float(lv["both_active"]), "live", "page check: active; board API: posting present"
    if page == "expired" and api == "gone":
        return float(lv["both_closed"]), "closed", "page check: expired; board API: posting gone (404)"
    if page in (None, "uncertain") or api in (None, "error"):
        return None, "investigate", f"liveness not established (page check: {page or 'missing'}; board API: {api or 'missing'}) — uncertain, so not scored"
    return None, "investigate", f"the two checks disagree (page check: {page}; board API: {api}) — not scored"


def check_invariants(roles, postings):
    """Independent of liveness_gate: every role sent to the scorer must have both gates as numbers, and its two
    raw liveness checks must agree (active+present or expired+gone). Returns a list of violations."""
    by = {p["key"]: p for p in postings}
    bad = []
    for r in roles:
        p = by.get(r["role_id"])
        pair = (p["liveness"]["page"]["result"], p["liveness"]["api"]["state"]) if p else (None, None)
        if pair not in (("active", "present"), ("expired", "gone")):
            bad.append(f"invariant: {r['role_id']} reached the scorer with page={pair[0]}, api={pair[1]}")
        for g in ("liveness", "timeline"):
            if not isinstance((r.get(g) or {}).get("factor"), (int, float)):
                bad.append(f"invariant: {r['role_id']} has no numeric {g} factor (the scorer would default it to 1.0)")
    return bad


def timeline_gate(visa, today, time_to_start_days, as_of=None):
    """Chapter 10 inputs -> factor in [0, 1] with the dates that produced it (formula: rules.json 'buffer-linear')."""
    need = ("opt_end_date", "unemployment_days_used", "unemployment_ceiling", "buffer_target")
    missing = [k for k in need if visa.get(k) in (None, "")]
    if missing:
        raise StopRun(f"timeline inputs missing in profile.yml visa: {missing} — the clock gate cannot be computed, so nothing is scored")
    opt_end = to_date(visa["opt_end_date"], "visa.opt_end_date")
    opt_start = to_date(visa["ead_start_date"], "visa.ead_start_date") if visa.get("ead_start_date") else None
    as_of = as_of or today
    used, ceiling, buffer = int(visa["unemployment_days_used"]), int(visa["unemployment_ceiling"]), int(visa["buffer_target"])
    start = today + dt.timedelta(days=int(time_to_start_days))
    notes = [f"unemployment_days_used ({used}) is read as of {as_of} (profile.yml gives no date for it) — your-input assumption"]
    if opt_start and start < opt_start:
        notes.append(f"expected start {start} is before the OPT start {opt_start}: a full-time start then needs other "
                     "authorization (e.g. pre-completion OPT) — confirm with your DSO")

    def factor_for(ceil):
        accrual_from = max(as_of, opt_start) if opt_start else as_of
        used_at_start = used + max(0, (start - accrual_from).days)
        if start > opt_end:
            return 0.0, used_at_start, f"expected start {start} is after the authorization end {opt_end}"
        if used_at_start >= ceil:
            return 0.0, used_at_start, (f"by the expected start {start} the unemployment days used reach {used_at_start}, "
                                        f"at or above the {ceil}-day ceiling")
        left = ceil - used_at_start
        f = 1.0 if buffer <= 0 else round(min(1.0, left / buffer), 3)
        return f, used_at_start, f"{left} unemployment days left at the expected start {start}; buffer target {buffer} -> factor {f}"

    factor, used_at_start, basis = factor_for(ceiling)
    what_if = None
    if visa.get("stem_eligible") is True and ceiling == 90:
        f2, _, b2 = factor_for(STEM_CEILING)
        what_if = {"ceiling": STEM_CEILING, "factor": f2, "basis": b2,
                   "note": "only if a STEM OPT extension is approved — the extension also moves the end date; confirm both "
                           "with your DSO. Shown, never used as the gate."}
    return {"factor": factor, "basis": basis, "source": INP, "formula": "buffer-linear (rules.json)",
            "dates": {"today": str(today), "expected_start": str(start), "authorization_end": str(opt_end),
                      "opt_start": str(opt_start) if opt_start else None, "unemployment_as_of": str(as_of)},
            "inputs": {"time_to_start_days": int(time_to_start_days), "unemployment_days_used": used,
                       "unemployment_days_at_start": used_at_start, "ceiling": ceiling, "buffer_target": buffer,
                       "stem_eligible": visa.get("stem_eligible")},
            "notes": notes, "stem_what_if": what_if}


# ----------------------------------------------------------------- votes and context
def scheme_max(scheme):
    w = scheme["weights"]
    return float(w.get("title", 0) + scheme.get("max_skill_hits", 8) * w.get("skill", 0) + w.get("skill_any", 0)
                 + w.get("degree", 0) + max(w.get("location", 0), 0))


def fit_for(job, resume, scheme):
    relevant, score, why, skipped = GW.judge(job, GW.resume_features(resume), scheme)
    smax = scheme_max(scheme)
    return {"p": round(max(0.0, min(1.0, score / smax)), 3), "score": score, "scheme_max": smax,
            "relevant_by_scheme": relevant, "skipped_reason": skipped, "lines": why, "source": REC,
            "note": f"greenhouse-watch judge(), scheme {scheme.get('scheme_version')}, on the posting text and the résumé "
                    "(both record); the ÷ scheme-max scale is your-input (rules.json)"}


def records_check(company, records, csv_rows):
    row = next((r for r in csv_rows if (r.get("company_name") or "").strip().upper() == company.strip().upper()), None)
    if row is None:
        return {"result": "company not in the CSV", "csv": None}
    try:
        csv_titles = [t.strip() for t in ast.literal_eval(row.get("top_job_titles_sponsored") or "[]")]
    except (ValueError, SyntaxError):
        csv_titles = []
    csv_appr = int(float(row.get("Total Approvals") or 0))
    diffs = []
    if records.get("h1b_approvals") is not None and int(records["h1b_approvals"]) != csv_appr:
        diffs.append(f"approvals: queue {records['h1b_approvals']} vs CSV {csv_appr}")
    q_titles = {t.strip() for t in records.get("top_job_titles_sponsored") or []}
    if q_titles and q_titles != set(csv_titles):
        diffs.append("top sponsored titles differ")
    return {"result": "mismatch" if diffs else "match", "differences": diffs,
            "csv": {"h1b_approvals": csv_appr, "top_job_titles_sponsored": csv_titles,
                    "latest_funding_date": row.get("latest_funding_date")}}


def bls_context(soc, rows, scored_values):
    row = next((r for r in rows if r.get("onet_soc_code") == soc), None)
    if row is None:
        return {"soc": soc, "status": "SOC not in the BLS file — unknown, not guessed", "cognitive_pivot_score": None, "source": REC}
    raw = (row.get("cognitive_pivot_score") or "").strip()
    score = float(raw) if raw else None
    pct = round(100.0 * sum(1 for v in scored_values if v <= score) / len(scored_values)) if score is not None and scored_values else None
    return {"soc": soc, "title": row.get("title"), "job_zone": row.get("job_zone"),
            "annual_median_wage": float(row["annual_median_wage"]) if row.get("annual_median_wage") else None,
            "oews_year": row.get("oews_year"), "cognitive_pivot_score": score, "pivot_percentile": pct,
            "status": "ok" if score is not None else "no cognitive_pivot_score in the BLS file for this SOC — unknown, not guessed",
            "source": REC, "note": "context only — the engine scorer weights role quality 0 ([VERIFY] in role-scorer.mjs)"}


_BLOCK = re.compile(r"</?(?:p|li|br|div|h[1-6]|tr|ul|ol|table|section)\b[^>]*>", re.I)


def description_lines(content):
    raw = html.unescape(content or "")
    raw = _BLOCK.sub("\n", raw)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return [re.sub(r"\s+", " ", x).strip() for x in raw.split("\n") if x.strip()]


def evidence_lines(lines, rules):
    pats = [re.compile(p, re.I) for p in rules["evidence_line_patterns"]]
    out = []
    for line in lines:
        m = next((pm for pm in (p.search(line) for p in pats) if pm), None)
        if m and line not in out:
            s = max(0, m.start() - 100)
            out.append(("…" if s else "") + line[s:s + 240])
        if len(out) >= rules.get("evidence_lines_max", 8):
            break
    return out


# ----------------------------------------------------------------- liveness sources
def _net_guard():
    if os.environ.get("REFRESH_FORBID_NETWORK") == "1":
        raise StopRun("network use is forbidden in this run (REFRESH_FORBID_NETWORK=1)")


def api_url(p):
    return f"https://boards-api.greenhouse.io/v1/boards/{p['board']['slug']}/jobs/{p['job_id']}"


def gather_offline(snapshot, postings):
    snapshot = Path(snapshot)
    if not (snapshot / "liveness.txt").exists():
        raise InputError(f"offline snapshot not found: {snapshot} (record one with --live --record <dir>)")
    status = load_json(snapshot / "api-status.json", "snapshot api-status.json")
    raw = {"raw/liveness.txt": (snapshot / "liveness.txt").read_text(encoding="utf-8"),
           "raw/api-status.json": (snapshot / "api-status.json").read_text(encoding="utf-8")}
    for p in postings:
        f = snapshot / "api" / f"{p['key']}.json"
        if f.exists():
            raw[f"raw/api/{p['key']}.json"] = f.read_text(encoding="utf-8")
    manifest = snapshot / "MANIFEST.json"
    meta = load_json(manifest, "snapshot MANIFEST.json") if manifest.exists() else {}
    return raw, status, {"path": rel(snapshot), "recorded_at": meta.get("recorded_at"), "liveness_exit": meta.get("liveness_exit")}


def gather_live(postings, pause=0.3):
    _net_guard()
    urls = "\n".join(p["url"] for p in postings) + "\n"
    with tempfile.TemporaryDirectory() as tmp:
        uf = Path(tmp) / "urls.txt"
        uf.write_text(urls, encoding="utf-8")
        proc = subprocess.run(["node", str(LIVENESS), "--file", str(uf)], cwd=str(REPO), capture_output=True, text=True, timeout=1200)
    if not proc.stdout.strip() or "Fatal:" in proc.stderr:
        raise StopRun(f"the page checker failed: {(proc.stderr or proc.stdout).strip()[:400]}")
    raw = {"raw/urls.txt": urls, "raw/liveness.txt": proc.stdout}
    status = {}
    for p in postings:
        try:
            body = GW.fetch_board(api_url(p))
            status[p["key"]] = {"status": 200}
            raw[f"raw/api/{p['key']}.json"] = json.dumps(body, indent=1, ensure_ascii=False) + "\n"
        except urllib.error.HTTPError as e:
            status[p["key"]] = {"status": e.code if e.code == 404 else "error", "note": f"HTTP {e.code}"}
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            status[p["key"]] = {"status": "error", "note": str(e)[:200]}
        time.sleep(pause)
    raw["raw/api-status.json"] = json.dumps(status, indent=1) + "\n"
    return raw, status, {"path": None, "recorded_at": dt.datetime.now().isoformat(timespec="seconds"), "liveness_exit": proc.returncode}


# ----------------------------------------------------------------- baselines
def load_baseline(args):
    base = {"kind": None, "by_key": {}, "by_url": {}}
    if args.baseline:
        log = load_json(args.baseline, "baseline log")
        if log.get("_tool") != TOOL:
            raise InputError(f"--baseline {args.baseline} is not a refresh-log.json from this tool")
        base["kind"] = f"refresh-log {rel(args.baseline)} ({log.get('today')})"
        for p in log.get("postings", []):
            base["by_key"][p["key"]] = {"page": p["liveness"]["page"]["result"],
                                        "sha256": (p.get("description") or {}).get("sha256"),
                                        "updated_at": (p.get("description") or {}).get("updated_at")}
    if args.baseline_liveness:
        text = Path(args.baseline_liveness).read_text(encoding="utf-8")
        base["kind"] = (base["kind"] + " + " if base["kind"] else "") + f"verbatim liveness output {rel(args.baseline_liveness)}"
        base["by_url"] = {u: v["result"] for u, v in parse_liveness(text).items()}
    return base


def since_baseline(p, base):
    if not base["kind"]:
        return {"liveness": "no baseline", "description_changed": None, "description_note": "unknown (no baseline)", "updated_at": None}
    was = base["by_key"].get(p["key"], {}).get("page") or base["by_url"].get(p["url"])
    now = p["liveness"]["page"]["result"]
    live = "not in the baseline" if was is None else (f"unchanged ({now})" if was == now else f"{was} → {now}")
    b = base["by_key"].get(p["key"])
    d = p.get("description") or {}
    if not b or not b.get("sha256"):
        desc, note = None, "unknown (no baseline)"
    elif not d.get("sha256"):
        desc, note = None, "n/a (no description now — the posting is gone)"
    else:
        desc = b["sha256"] != d["sha256"]
        note = "yes" if desc else "no"
    upd = None if not b or not b.get("updated_at") or not d.get("updated_at") else (
        "same" if b["updated_at"] == d["updated_at"] else f"changed ({b['updated_at']} → {d['updated_at']})")
    return {"liveness": live, "description_changed": desc, "description_note": note, "updated_at": upd}


# ----------------------------------------------------------------- guards
def refuse_out_dir(out):
    out = Path(out)
    if out.exists() and any(out.iterdir()):
        own = out / "refresh-log.json"
        try:
            ours = own.exists() and json.loads(own.read_text(encoding="utf-8")).get("_tool") == TOOL
        except (json.JSONDecodeError, OSError):
            ours = False
        if not ours:
            raise StopRun(f"refusing to write into {out}: it holds files this tool did not write")
        try:
            tracked = subprocess.run(["git", "ls-files", "--", str(out)], cwd=str(REPO), capture_output=True, text=True).stdout.split()
        except OSError:
            tracked = []
        if tracked:
            raise StopRun(f"refusing to write into {out}: it holds {len(tracked)} git-tracked file(s); pick a new folder")


def privacy_guard(args, persona):
    """Real profiles and queues never reach a tracked folder: unless the persona and the queue are both committed
    (git-tracked) examples, every folder this run writes to — the output folder and any --record folder — must be
    under private/."""
    public_queue, _ = committed_example([args.queue], HERE)
    if persona["fictional"] and public_queue:
        return
    if not under(args.out_dir, PRIVATE):
        raise StopRun(f"the persona or queue is not one of the committed fictional examples, so the output must go "
                      f"under private/ (got {args.out_dir}) — real profiles and queues never reach a tracked folder")
    if args.record and not under(args.record, PRIVATE):
        raise StopRun(f"the persona or queue is not one of the committed fictional examples, so the --record folder must "
                      f"be under private/ too (got {args.record})")


# ----------------------------------------------------------------- the run
def parse_args(argv):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--queue", default=str(DEFAULTS["queue"]))
    ap.add_argument("--persona", default=str(DEFAULTS["persona"]), help="folder with profile.yml + resume(.example).json")
    ap.add_argument("--snapshot", default=str(DEFAULTS["snapshot"]), help="recorded outputs for the offline run")
    ap.add_argument("--live", action="store_true", help="run the page checker and the board API now (network)")
    ap.add_argument("--record", help="with --live: also save this run's raw outputs as an offline snapshot folder")
    ap.add_argument("--dry-run", action="store_true", help="print the plan; no network, nothing written")
    ap.add_argument("--today", help="YYYY-MM-DD (default: today)")
    ap.add_argument("--time-to-start-days", type=int)
    ap.add_argument("--baseline", help="last week's refresh-log.json")
    ap.add_argument("--baseline-liveness", help="a verbatim check-liveness output to compare against")
    ap.add_argument("--csv", default=str(DEFAULTS["csv"]))
    ap.add_argument("--bls", default=str(DEFAULTS["bls"]))
    ap.add_argument("--scheme", default=str(DEFAULTS["scheme"]))
    ap.add_argument("--rules", default=str(DEFAULTS["rules"]))
    ap.add_argument("--out-dir")
    ns = ap.parse_args(argv)
    ns._argv = list(argv)
    return ns


def run(args):
    rules = load_json(args.rules, "rules")
    today = to_date(args.today, "--today") if args.today else dt.date.today()
    mode = "live" if args.live else "offline"
    args.out_dir = str(Path(args.out_dir) if args.out_dir else HERE / ".build" / "runs" / f"{today}-{mode}")
    if args.record and not args.live:
        raise InputError("--record needs --live (a snapshot records a live run)")

    queue = load_queue(args.queue)
    postings_in = queue["postings"]
    persona = load_persona(args.persona)
    scheme = GW.load_scheme(args.scheme)
    csv_rows = load_csv_rows(args.csv, "company_name")
    bls_rows = load_csv_rows(args.bls, "onet_soc_code")
    privacy_guard(args, persona)
    refuse_out_dir(args.out_dir)
    t2s = args.time_to_start_days if args.time_to_start_days is not None else int(rules["time_to_start_days"]["value"])
    timeline = timeline_gate(persona["visa"], today, t2s)
    timeline["sensitivity"] = {str(d): timeline_gate(persona["visa"], today, int(d))["factor"]
                               for d in rules.get("time_to_start_sensitivity_days", [])}
    base = load_baseline(args)

    if args.dry_run:
        print(f"DRY RUN — no network, nothing written. Mode would be {mode}.")
        print(f"  queue   {rel(args.queue)} ({len(postings_in)} postings)\n  persona {rel(args.persona)}")
        src = "node scripts/ats/check-liveness.mjs --file <urls> + Greenhouse board API" if args.live else f"snapshot {rel(args.snapshot)}"
        print(f"  liveness from: {src}")
        print(f"  timeline factor {timeline['factor']} ({timeline['basis']})")
        print(f"  would run: node scripts/score/role-scorer.mjs {rel(args.out_dir)}/roles.json --out-dir {rel(args.out_dir)}")
        print(f"  would write: {rel(args.out_dir)}/refresh-log.json, refresh-report.md, refresh-audit.md, raw/")
        return {"dry_run": True}

    raw, api_status, source = gather_live(postings_in) if args.live else gather_offline(args.snapshot, postings_in)
    redactions = {}
    for k in list(raw):
        raw[k], redactions[k] = redact(raw[k])
    page = parse_liveness(raw["raw/liveness.txt"])
    scored_values = [float(r["cognitive_pivot_score"]) for r in bls_rows if (r.get("cognitive_pivot_score") or "").strip()]

    postings = []
    for q in postings_in:
        pg = page.get(q["url"]) or {"result": None, "reason": "URL missing from the page-checker output"}
        st = (api_status.get(q["key"]) or {}).get("status")
        api_state = "present" if st == 200 else ("gone" if st == 404 else ("error" if st is not None else None))
        job = None
        if f"raw/api/{q['key']}.json" in raw and api_state == "present":
            job = json.loads(raw[f"raw/api/{q['key']}.json"])
        p = {"key": q["key"], "company": q["company"], "title": q["title"].strip(), "url": q["url"], "board": q["board"],
             "job_id": str(q["job_id"]), "soc": q["soc"], "soc_source": q.get("soc_source"),
             "liveness": {"page": {**pg, "source": f"{REC} (scripts/ats/check-liveness.mjs)"},
                          "api": {"state": api_state, "status": st, "source": f"{REC} (Greenhouse board API, greenhouse-watch fetch_board)"}}}
        p["liveness"]["factor"], p["liveness"]["verdict"], p["liveness"]["reason"] = liveness_gate(pg["result"], api_state, rules)
        p["liveness"]["rule"] = "rules.json liveness (your-input)"
        if job:
            lines = description_lines(job.get("content"))
            p["description"] = {"sha256": sha256_bytes("\n".join(lines).encode("utf-8")), "updated_at": job.get("updated_at"),
                                "location": (job.get("location") or {}).get("name"), "chars": sum(len(x) for x in lines),
                                "evidence_lines": evidence_lines(lines, rules), "source": REC}
            p["fit"] = fit_for(job, persona["resume"], scheme)
        else:
            p["description"] = None
            p["fit"] = {"p": None, "status": "no description: the board API did not return the posting", "source": REC}
        s = q["sponsorship"]
        p["sponsorship"] = {"p": float(s["p"]), "tier": s["tier"], "source": s.get("source", INP), "note": s.get("note"),
                            "records": s.get("records") or {},
                            "records_check": records_check(q["company"], s.get("records") or {}, csv_rows)}
        p["role_quality"] = bls_context(q["soc"], bls_rows, scored_values)
        p["since_baseline"] = since_baseline(p, base)
        postings.append(p)

    roles = []
    for p in postings:
        if p["liveness"]["verdict"] in ("live", "closed"):
            r = {"role_id": p["key"], "company": p["company"], "title": p["title"],
                 "sponsorship": {"p": p["sponsorship"]["p"], "tier": p["sponsorship"]["tier"], "source": p["sponsorship"]["source"]},
                 "liveness": {"factor": float(p["liveness"]["factor"]), "source": REC},
                 "timeline": {"factor": float(timeline["factor"]), "source": INP}}
            if p["fit"].get("p") is not None:
                r["fit"] = {"p": p["fit"]["p"], "source": REC}
            roles.append(r)
    violations = check_invariants(roles, postings)
    if violations:
        raise StopRun("invariant violated before scoring — nothing written: " + "; ".join(violations))

    stage = Path(tempfile.mkdtemp(prefix="refresh-stage-"))
    try:
        (stage / "roles.json").write_text(json.dumps(roles, indent=2) + "\n", encoding="utf-8")
        cmd = ["node", str(SCORER), str(stage / "roles.json"), "--out-dir", str(stage)]
        proc = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True, timeout=120)
        if proc.returncode != 0:
            raise StopRun(f"the engine scorer failed: {proc.stderr.strip()[:400]}")
        scores = json.loads((stage / "role-scores.json").read_text(encoding="utf-8"))
        if scores.get("profile_needs_sponsorship") is not True:
            raise StopRun("the engine scorer did not score with sponsorship required — refusing its output")
        by_role = {s["role_id"]: s for s in scores["roles"]}
        for p in postings:
            s = by_role.get(p["key"])
            p["scored"] = s is not None
            p["score"] = {"composite": s["composite"], "recommendation": s["recommendation"], "reason": s["reason"],
                          "arithmetic": s["trace"]["arithmetic"]} if s else None

        raw_files = {}
        for k, text in raw.items():
            f = stage / k
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text, encoding="utf-8")
            raw_files[k] = {"sha256": sha256_bytes(f.read_bytes()), "bytes": f.stat().st_size, "redactions": redactions[k]}

        recs = [p["score"]["recommendation"] for p in postings if p.get("score")]
        counts = {"queued": len(postings), "live": sum(p["liveness"]["verdict"] == "live" for p in postings),
                  "closed": sum(p["liveness"]["verdict"] == "closed" for p in postings),
                  "investigate": sum(p["liveness"]["verdict"] == "investigate" for p in postings),
                  "scored": len(roles), "apply": recs.count("Apply"), "consider": recs.count("Consider"), "skip": recs.count("Skip")}
        counts["actionable"] = counts["apply"] + counts["consider"]
        counts["pipeline_skip_share"] = {"value": round(1 - counts["actionable"] / counts["queued"], 3), "source": REC,
                                         "note": f"1 − (apply + consider) / queued = 1 − {counts['actionable']}/{counts['queued']}"}
        log = {
            "_tool": TOOL, "version": VERSION, "rules_version": rules.get("rules_version"), "rules_status": rules.get("status"),
            "generated": dt.datetime.now().isoformat(timespec="seconds"), "today": str(today), "mode": mode,
            "command": "python3 scripts/contrib/2026fa/hemanthrayuduu-apply-queue-refresh/refresh.py " + " ".join(args._argv),
            "inputs": {"queue": {"path": rel(args.queue), "sha256": sha256_bytes(Path(args.queue).read_bytes()), "built_by": queue.get("built_by")},
                       "persona": {"profile": rel(persona["profile_path"]), "resume": rel(persona["resume_path"]), "fictional": persona["fictional"],
                                   "fictional_check": persona["fictional_check"]},
                       "csv": rel(args.csv), "bls": rel(args.bls), "scheme": {"path": rel(args.scheme), "version": scheme.get("scheme_version")},
                       "rules": rel(args.rules), "snapshot": source, "baseline": base["kind"]},
            "persona": {"name": (persona["profile"].get("candidate") or {}).get("name"), "target_role": persona["profile"].get("target_role"),
                        "visa_status": persona["visa"].get("current_status"), "needs_sponsorship": True},
            "timeline": timeline, "postings": postings, "counts": counts, "invariant_violations": violations,
            "scorer": {"command": f"node scripts/score/role-scorer.mjs <staging>/roles.json --out-dir <staging>   "
                                  f"(run in a temporary staging folder, then copied to {rel(args.out_dir)}/)",
                       "stdout": re.sub(r"\S*refresh-stage-[^/\s]+", rel(args.out_dir), proc.stdout.strip()),
                       "profile_needs_sponsorship": True},
            "raw_files": raw_files, "cannot_verify": CANNOT_VERIFY,
        }
        (stage / "refresh-log.json").write_text(json.dumps(log, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        (stage / "refresh-report.md").write_text(render_report(log), encoding="utf-8")
        (stage / "refresh-audit.md").write_text(render_audit(log), encoding="utf-8")

        out = Path(args.out_dir)
        out.mkdir(parents=True, exist_ok=True)
        for f in stage.rglob("*"):
            if f.is_file():
                dest = out / f.relative_to(stage)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest)
        if args.record:
            write_snapshot(Path(args.record), raw, raw_files, source, args)
        return log
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def write_snapshot(folder, raw, raw_files, source, args):
    if folder.exists() and any(folder.iterdir()):
        raise StopRun(f"refusing to record into {folder}: it is not empty")
    files = {}
    for k, text in raw.items():
        if k == "raw/urls.txt":
            continue
        dest = folder / k[len("raw/"):]
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text, encoding="utf-8")
        files[k[len("raw/"):]] = {"sha256": sha256_bytes(dest.read_bytes()), "redactions": raw_files[k]["redactions"]}
    (folder / "MANIFEST.json").write_text(json.dumps({
        "recorded_at": source["recorded_at"], "recorded_by": "refresh.py --live --record " + rel(folder),
        "liveness_exit": source["liveness_exit"], "note": "outputs of a live run, emails and phone numbers redacted; "
        "API bodies are the board API's JSON re-serialized", "files": files}, indent=1) + "\n", encoding="utf-8")


CANNOT_VERIFY = [
    "That a live page means the role is still being filled: a frozen or filled requisition can stay up (a ghost posting).",
    "That the company will sponsor this role: the sponsorship tier is company history, not a promise.",
    "Local pay: the BLS local-wage data is not on main, so only national BLS figures are shown.",
    "Eligibility questions (a STEM OPT extension, a start before the OPT start date): the mode shows the arithmetic and sends the question to a DSO.",
    "Each company's real time-to-start: one value is used for every posting (your-input).",
    "The date of the persona's unemployment-day count: it is read as of the run date.",
    "Edits made before the first refresh: the first run has no description baseline.",
    "Role quality is shown, not scored: the engine weights it 0 ([VERIFY] in role-scorer.mjs).",
]


# ----------------------------------------------------------------- human outputs
def _fmt(x, nd=3):
    return "—" if x is None else (f"{x:.{nd}f}" if isinstance(x, float) else str(x))


def _sens(t):
    return " · ".join(f"{d} days → {f}" for d, f in (t.get("sensitivity") or {}).items()) or "not computed"


def _source_words(src):
    if src.get("path"):
        return f"offline snapshot `{src['path']}` (recorded {src.get('recorded_at') or 'at an unknown time'})"
    return (f"live run at {src.get('recorded_at')} (page-checker exit {src.get('liveness_exit')}; "
            "exit 1 means at least one posting was not active)")


def render_report(log):
    c, t, posts = log["counts"], log["timeline"], log["postings"]
    changed = [p for p in posts if (p["since_baseline"].get("description_changed") or "→" in (p["since_baseline"].get("liveness") or "")
                                    or (p["since_baseline"].get("updated_at") or "").startswith("changed"))]
    who = log["persona"]
    L = [f"# Apply-queue refresh — {log['today']} ({log['mode']})", "", "## Executive summary", "",
         f"This is the weekly re-check of a shortlist of **{c['queued']} job postings** for {who['name']}, "
         f"on {who['visa_status']}, targeting {(who.get('target_role') or {}).get('primary')} roles. It answers one question: which "
         "postings on the list are still worth applying to this week, given that postings close quietly, descriptions get "
         "edited, and the OPT clock keeps running.", "",
         f"- **Still live and scored:** {c['live']}. The engine scorer says Apply {c['apply']} · Consider {c['consider']} · Skip {c['skip']} "
         f"(Skip includes closed postings).",
         f"- **Closed since the shortlist was made:** {c['closed']}. The engine's own liveness gate scores them 0.",
         f"- **Investigate by hand:** {c['investigate']}. The two liveness checks disagree or could not tell, so these are not scored, on purpose.",
         f"- **The OPT clock:** timeline factor **{t['factor']}** — {t['basis']}. With other start times: {_sens(t)}.",
         f"- **Changed since the last refresh:** {len(changed)}." if log["inputs"]["baseline"] else
         "- **Changed since the last refresh:** no baseline was given, so this run sets one.",
         ("- **Liveness source:** today's boards (a live run)." if log["mode"] == "live" else
          f"- **Liveness source:** a recorded snapshot (recorded {log['inputs']['snapshot'].get('recorded_at') or 'at an unknown time'}), "
          "not today's boards: run with `--live` to check them now."),
         "", "Nothing here is a decision. You clear the three gates at the end before acting on any row.", ""]
    L += ["## This week's queue", "", "| # | Company | Posting | Liveness | Timeline | Fit | Sponsorship | Score | Recommendation |",
          "|---:|---|---|---|---:|---:|---|---:|---|"]
    order = sorted(posts, key=lambda p: (not p.get("scored"), -(p["score"]["composite"] if p.get("score") else -1)))
    for i, p in enumerate(order, 1):
        s = p.get("score") or {}
        L.append(f"| {i} | {p['company']} | [{p['title']}]({p['url']}) | {p['liveness']['verdict']} `record` | "
                 f"{t['factor'] if p.get('scored') else '—'} `your-input` | {_fmt(p['fit'].get('p'))} `record` | "
                 f"{p['sponsorship']['tier']} (p {p['sponsorship']['p']}) `your-input` | {_fmt(s.get('composite'))} | "
                 f"{('**' + s['recommendation'] + '**') if s else 'not scored — investigate'} |")
    inv = [p for p in posts if p["liveness"]["verdict"] == "investigate"]
    L += ["", "## Investigate by hand (not scored)", ""]
    L += [f"- **{p['company']} — {p['title']}**: {p['liveness']['reason']}. Open {p['url']} and check the board." for p in inv] or ["- none"]
    closed = [p for p in posts if p["liveness"]["verdict"] == "closed"]
    L += ["", "## Closed since the shortlist", ""]
    L += [f"- **{p['company']} — {p['title']}**: {p['liveness']['reason']}." for p in closed] or ["- none"]
    L += ["", "## Changed since the last refresh", ""]
    if not log["inputs"]["baseline"]:
        L.append("- no baseline given (pass `--baseline <last refresh-log.json>` or `--baseline-liveness <output>`).")
    else:
        L.append(f"Compared with: {log['inputs']['baseline']}.")
        L += [f"- **{p['company']} — {p['title']}**: liveness {p['since_baseline']['liveness']}"
              + (", **description edited — re-read it**" if p["since_baseline"].get("description_changed") else "")
              + (f", updated_at {p['since_baseline']['updated_at']}" if p["since_baseline"].get("updated_at") not in (None, "same") else "")
              + ("; description text unchanged" if p["since_baseline"].get("description_changed") is False
                 and (p["since_baseline"].get("updated_at") or "").startswith("changed") else "")
              for p in changed] or ["- nothing changed."]
    L += ["", "## What the descriptions say (deciding sentences — record; the decision is yours)", ""]
    for p in posts:
        ev = (p.get("description") or {}).get("evidence_lines")
        if ev:
            L.append(f"**{p['company']} — {p['title']}**")
            L += [f"- «{x}»" for x in ev] + [""]
    L += ["## The OPT clock (Chapter 10)", "",
          f"- Today {t['dates']['today']}; expected start {t['dates']['expected_start']} ({t['inputs']['time_to_start_days']} days, your-input); "
          f"authorization end {t['dates']['authorization_end']}.",
          f"- Unemployment days used {t['inputs']['unemployment_days_used']} → {t['inputs']['unemployment_days_at_start']} at the expected start; "
          f"ceiling {t['inputs']['ceiling']}; buffer target {t['inputs']['buffer_target']}.",
          f"- Factor **{t['factor']}** — formula {t['formula']}: {t['basis']}.",
          f"- Sensitivity to the time-to-start (your-input): {_sens(t)}."]
    L += [f"- Note: {n}" for n in t["notes"]]
    if t.get("stem_what_if"):
        w = t["stem_what_if"]
        L.append(f"- What-if, 150-day ceiling: factor {w['factor']} — {w['note']}")
    L += ["", "## Role-quality context (BLS, record; not scored)", "",
          "The BLS figures are records; the SOC code each posting is matched to was chosen by the queue's builder, and the "
          "\"SOC chosen by\" column says how — a family hint is a your-input guess, not a record.", "",
          "| Posting | SOC | SOC chosen by | Occupation | Job zone | Median wage | Cognitive-pivot score |",
          "|---|---|---|---|---:|---:|---|"]
    for p in posts:
        q = p["role_quality"]
        score = (f"{q['cognitive_pivot_score']} (percentile {q['pivot_percentile']})" if q.get("cognitive_pivot_score") is not None else q["status"])
        wage = f"${q['annual_median_wage']:,.0f} ({q.get('oews_year')})" if q.get("annual_median_wage") else "—"
        ss = p.get("soc_source") or {}
        chosen = f"{ss.get('source')} — {ss.get('via')}" if ss.get("source") else "not stated in the queue"
        L.append(f"| {p['title']} | {q['soc']} | {chosen} | {q.get('title') or '—'} | {q.get('job_zone') or '—'} | {wage} | {score} |")
    L += ["", "## Gates (you clear these; record your decision in the run log)", "",
          "- **G1 liveness:** open every Apply / Consider link and every Investigate link. Live means the description and an Apply button are there.",
          "- **G2 timeline:** confirm the OPT dates, the unemployment-day count and the time-to-start. Eligibility questions go to your DSO.",
          "- **G3 release:** read the deciding sentences above for each row you would act on, then say which rows you release for action this week.",
          "", "## Labels", "", "`record` = read from a data file, the board, or the page; `your-input` = a value someone chose (rules.json, the queue, the persona); "
          "`model-judgment` = never used in this tool.", "", "## Cannot verify", ""]
    L += [f"- {x}" for x in log["cannot_verify"]]
    L += ["", "## Run record", "", f"- Command: `{log['command']}`", f"- Generated {log['generated']} · rules {log['rules_version']} ({log['rules_status']}) · "
          f"scheme {log['inputs']['scheme']['version']}", f"- Engine scorer: `{log['scorer']['command']}` → {log['scorer']['stdout'].splitlines()[0] if log['scorer']['stdout'] else ''}",
          f"- Liveness source: {_source_words(log['inputs']['snapshot'])}",
          f"- Raw outputs kept in `raw/` ({len(log['raw_files'])} files, sha256 in refresh-log.json)."]
    return "\n".join(L) + "\n"


def render_audit(log):
    c, posts = log["counts"], log["postings"]
    pages = [p["liveness"]["page"]["result"] for p in posts]
    apis = [p["liveness"]["api"]["state"] for p in posts]
    L = [f"# Apply-queue refresh — audit, {log['today']} ({log['mode']})", "", "## Executive summary", "",
         "This file counts what went into the refresh and what came out, lists every posting the tool refused to score and "
         "why, and checks the queue's inputs against their sources. It reports what it found; it does not say pass. "
         f"Of {c['queued']} queued postings, {c['scored']} reached the engine scorer and {c['investigate']} were held back "
         f"for a human. The overall skip share is {c['pipeline_skip_share']['value']} ({c['pipeline_skip_share']['note']}).", "",
         "## Records in and out", "", "| Stage | Count |", "|---|---:|",
         f"| queued | {c['queued']} |",
         f"| page check: active / expired / uncertain / missing | {pages.count('active')} / {pages.count('expired')} / {pages.count('uncertain')} / {pages.count(None)} |",
         f"| board API: present / gone / error / missing | {apis.count('present')} / {apis.count('gone')} / {apis.count('error')} / {apis.count(None)} |",
         f"| live (both agree) | {c['live']} |", f"| closed (both agree) | {c['closed']} |", f"| investigate (not scored) | {c['investigate']} |",
         f"| sent to the scorer | {c['scored']} |", f"| Apply / Consider / Skip | {c['apply']} / {c['consider']} / {c['skip']} |", "",
         "## Refusals and why", ""]
    L += [f"- {p['key']}: {p['liveness']['reason']}" for p in posts if p["liveness"]["verdict"] == "investigate"] or ["- none"]
    L += ["", "## Input cross-checks (queue vs the 80 Days CSV)", "", "| Company | Queue approvals | CSV approvals | Result |", "|---|---:|---:|---|"]
    seen = set()
    for p in posts:
        if p["company"] in seen:
            continue
        seen.add(p["company"])
        rc = p["sponsorship"]["records_check"]
        L.append(f"| {p['company']} | {p['sponsorship']['records'].get('h1b_approvals', '—')} | "
                 f"{(rc.get('csv') or {}).get('h1b_approvals', '—')} | {rc['result']}{(': ' + '; '.join(rc['differences'])) if rc.get('differences') else ''} |")
    L += ["", "## Since the baseline", "", f"Baseline: {log['inputs']['baseline'] or 'none'}.", ""]
    L += [f"- {p['key']}: liveness {p['since_baseline']['liveness']}; description changed: "
          f"{p['since_baseline'].get('description_note', 'unknown (no baseline)')}" for p in posts]
    L += ["", "## Invariants checked before scoring", "",
          "- every scored posting had both liveness checks agree (active + present, or expired + gone);",
          "- every role sent to the scorer carried numeric liveness and timeline factors (the scorer would default a missing gate to 1.0);",
          "- the scorer reported `profile_needs_sponsorship: true`.",
          f"- violations: {log['invariant_violations'] or 'none'}", "", "## Raw files", "", "| File | sha256 | Redactions |", "|---|---|---:|"]
    L += [f"| {k} | `{v['sha256'][:16]}…` | {v['redactions']} |" for k, v in sorted(log["raw_files"].items())]
    return "\n".join(L) + "\n"


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    try:
        args = parse_args(argv)
        log = run(args)
    except (InputError, StopRun, GW.InputError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    if log.get("dry_run"):
        return 0
    c = log["counts"]
    print(f"✓ apply-queue refresh ({log['mode']}): {c['queued']} queued → {c['live']} live · {c['closed']} closed · "
          f"{c['investigate']} investigate · {c['scored']} scored")
    print(f"  scorer: {log['scorer']['stdout'].splitlines()[0] if log['scorer']['stdout'] else '(no output)'}")
    print(f"  timeline factor {log['timeline']['factor']} (expected start {log['timeline']['dates']['expected_start']})")
    print(f"  {rel(args.out_dir)}/refresh-report.md  +  refresh-log.json  +  refresh-audit.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
