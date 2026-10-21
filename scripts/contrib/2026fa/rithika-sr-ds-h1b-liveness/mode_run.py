#!/usr/bin/env python3
"""Liveness-hardened sponsor triage for an F-1 new-grad Data Scientist (SOC 15-2051).

Mode for the 2026fa contribution rithika-sr-ds-h1b-liveness. It closes the false
positive found in the 2026-10-03 worked run: an aggregator page (builtin.com) was
reported `active` for a job the employer had removed in June 2025.

Gates (each role stops at its first failed gate; a held role is never scored):
  G0  inputs parse; --out-dir inside course/2026fa/submissions/rithika-sr/  (exit 2)
  G1  sponsorship record in the 80 Days to Stay CSV        (imported from triage.py)
  G2a liveness: runs `npm run --silent ats:liveness -- <url>` once per URL, keeps
      stdout / stderr / exit code verbatim, parses active / expired / uncertain.
      Output that is not exactly what check-liveness.mjs prints -> uncertain.
  G2b aggregator rule: an aggregator page never clears liveness on its own; the
      employer's own page must be given and be active.
  G3  visa timeline factor                                   (imported from triage.py)
Then the existing scripts/score/role-scorer.mjs decides      (imported run_scorer).

Standard library only. Network only through ats:liveness; none with --offline.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
OLD = HERE.parent / "rithika-sr-ds-newgrad-h1b-15-2051"
sys.path.insert(0, str(OLD))
import triage  # noqa: E402  (G0/G1/G3 helpers and the scorer call are reused, not copied)
from triage import INPUT, RECORD, REPO, InputError, rel  # noqa: E402

VERSION = "0.1.0"
MODE = "rithika-sr-ds-h1b-liveness"
BUILDS_ON = triage.RECIPE
OUT_ROOT = REPO / "course/2026fa/submissions/rithika-sr"
DEFAULT_AGGREGATORS = HERE / "aggregators.json"
LIVENESS_CMD = ["npm", "run", "--silent", "ats:liveness", "--"]
LIVENESS_TIMEOUT_S = 120

# Exactly what scripts/ats/check-liveness.mjs prints for one URL.
STATUS_LINE = re.compile(r"^(?:✅|❌|⚠️?)\s+(active|expired|uncertain)\s+(\S+)\s*$")
RESULTS_LINE = re.compile(r"^Results:\s+(\d+) active\s+(\d+) expired\s+(\d+) uncertain\s*$")
EXPECTED_EXIT = {"active": 0, "expired": 1, "uncertain": 1}
NO_CHECK = "no check output"

RULES = {
    **{k: v for k, v in triage.RULES.items() if k != "liveness_factor"},
    "liveness": "only `active` clears G2 (factor 1.0); a deciding page `expired` -> CLOSED (no score); "
                "uncertain, unparseable, missing and aggregator-only -> HELD (no score)",
    "aggregator": "a posting on an aggregator host (or subdomain) clears G2 only if employer_url is given, "
                  "is not itself an aggregator, and its own check is active",
    "employer_pages": "every non-aggregator URL given for a role must be active",
    "gate_order": "INPUT (fit) -> G1 -> G2a/G2b -> G3; a role stops at its first failed gate",
}

NOT_VERIFIED = [x for x in triage.NOT_VERIFIED if "transcribed" not in x] + [
    "An `active` result means the page loaded and showed a visible apply control. "
    "It does not prove the employer is still reviewing applications.",
    "The aggregator list is a hand-made rule. A job board missing from it is treated "
    "as an employer page.",
    "Whether employer_url is really the same job as posting_url is your-input; this "
    "run does not compare the two pages' text.",
]


# ---------- small helpers ----------

def sha256(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def scrub(arg):
    """Command-line args go into a committed log: no home folder (privacy)."""
    s = str(arg).replace(str(REPO) + "/", "")
    return s.replace(str(Path.home()), "~")


def cell(x):
    return str(x).replace("|", "\\|").replace("\n", " ")


# ---------- G2: aggregators and liveness ----------

def load_aggregators(path):
    data = triage.load_json(path)
    entries = data.get("aggregators") if isinstance(data, dict) else None
    if not isinstance(entries, list) or not entries:
        raise InputError(f"{rel(path)}: needs a non-empty 'aggregators' list")
    out = {}
    for e in entries:
        domain = str(e.get("domain", "")).strip().lower()
        reason = str(e.get("reason", "")).strip()
        if not domain or not reason:
            raise InputError(f"{rel(path)}: every aggregator needs a domain and a one-line reason")
        out[domain] = reason
    return out


def aggregator_of(url, aggregators):
    host = (urlparse(url).hostname or "").lower()
    for domain in aggregators:
        if host == domain or host.endswith("." + domain):
            return domain
    return None


def parse_liveness(url, stdout, exit_code):
    """Parse one check-liveness.mjs run. Anything unexpected -> uncertain, with the reason."""
    def unparseable(why):
        return {"status": "uncertain", "checker_said": None, "checker_reason": None, "parse_error": why}

    lines = (stdout or "").splitlines()
    hits = [(i, m) for i, line in enumerate(lines) if (m := STATUS_LINE.match(line))]
    if len(hits) != 1:
        return unparseable(f"expected 1 result line, found {len(hits)}")
    i, m = hits[0]
    said, printed_url = m.group(1), m.group(2)
    if printed_url != url:
        return unparseable(f"result line is for {printed_url}, not the requested URL")
    totals = [m for line in lines if (m := RESULTS_LINE.match(line))]
    if len(totals) != 1:
        return unparseable("no 'Results:' summary line (the check did not finish)")
    counts = dict(zip(("active", "expired", "uncertain"), map(int, totals[0].groups())))
    if counts != {k: int(k == said) for k in counts}:
        return unparseable(f"summary counts {counts} disagree with the result line '{said}'")
    if exit_code != EXPECTED_EXIT[said]:
        return unparseable(f"exit code {exit_code} disagrees with '{said}' (expected {EXPECTED_EXIT[said]})")
    reason = None
    if i + 1 < len(lines) and lines[i + 1].startswith("  ") and lines[i + 1].strip():
        reason = lines[i + 1].strip()
    return {"status": said, "checker_said": said, "checker_reason": reason, "parse_error": None}


def network_runner(url):
    cmd = LIVENESS_CMD + [url]
    try:
        p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=LIVENESS_TIMEOUT_S)
        return {"stdout": p.stdout, "stderr": p.stderr, "exit_code": p.returncode}
    except subprocess.TimeoutExpired as e:
        dec = lambda b: b.decode("utf-8", "replace") if isinstance(b, bytes) else (b or "")  # noqa: E731
        return {"stdout": dec(e.stdout), "stderr": dec(e.stderr) + f"\n[mode_run] timed out after {LIVENESS_TIMEOUT_S}s",
                "exit_code": None}
    except FileNotFoundError as e:
        return {"stdout": "", "stderr": f"[mode_run] could not start npm: {e}", "exit_code": None}


def offline_runner(fixture):
    results = fixture.get("results") if isinstance(fixture, dict) else None
    if not isinstance(results, dict):
        raise InputError("offline fixture needs a 'results' object keyed by URL")

    def run(url):
        raw = results.get(url)
        if raw is None:
            return {"stdout": None, "stderr": None, "exit_code": None, "missing_from_fixture": True}
        return {"stdout": raw.get("stdout"), "stderr": raw.get("stderr"), "exit_code": raw.get("exit_code")}
    return run


class LivenessChecker:
    """One check per URL per run; every raw output is kept for the log."""

    def __init__(self, runner, mode):
        self.runner, self.mode, self.checks = runner, mode, {}

    def check(self, url):
        if url not in self.checks:
            raw = self.runner(url)
            if raw.get("missing_from_fixture"):
                parsed = {"status": "uncertain", "checker_said": None, "checker_reason": None,
                          "parse_error": NO_CHECK + " (URL not in the offline fixture)"}
            else:
                parsed = parse_liveness(url, raw["stdout"], raw["exit_code"])
            self.checks[url] = {"command": LIVENESS_CMD + [url], "mode": self.mode, "raw": raw, **parsed}
        return self.checks[url]


def g2_decide(pages):
    """pages: list of {kind, url, aggregator, status, ...}.
    Returns (gate_name, None | {"outcome": "held" | "closed", reason, next_action}).
    Only non-aggregator pages decide. One of them `expired` -> closed (a verified fact,
    so it outranks an uncertain sibling); otherwise anything not active -> held."""
    posting = next((p for p in pages if p["kind"] == "posting"), None)
    gate = "G2b" if posting and posting["aggregator"] else "G2a"
    own = [p for p in pages if not p["aggregator"]]
    if not own:
        return gate, {"outcome": "held", "reason": "aggregator-only liveness",
                      "next_action": "Find this job on the employer's own careers page or ATS; add it as employer_url."}
    expired = [p for p in own if p["status"] == "expired"]
    if expired:
        p = expired[0]
        why = f"checker said expired" + (f": {p['checker_reason']}" if p["checker_reason"] else "")
        return gate, {"outcome": "closed", "reason": f"posting verified closed ({p['kind']} page {why})",
                      "next_action": f"None needed. To double-check, open {p['url']}."}
    bad = [p for p in own if p["status"] != "active"]
    if bad:
        p = bad[0]
        if p["parse_error"] and p["parse_error"].startswith(NO_CHECK):
            why = f"no liveness check recorded: {p['parse_error']}"
        elif p["parse_error"]:
            why = f"liveness output unparseable: {p['parse_error']}"
        else:
            why = f"checker said {p['checker_said']}" + (f": {p['checker_reason']}" if p["checker_reason"] else "")
        return gate, {"outcome": "held", "reason": f"employer page not active ({why})",
                      "next_action": f"Open {p['url']} by hand, or re-run: npm run ats:liveness -- {p['url']}"}
    return gate, None


# ---------- the run ----------

def validate_candidates(candidates):
    roles = candidates.get("roles") if isinstance(candidates, dict) else None
    if not isinstance(roles, list) or not roles:
        raise InputError("candidates file needs a non-empty 'roles' list")
    seen = set()
    for c in roles:
        rid = c.get("role_id")
        if not rid or rid in seen:
            raise InputError(f"every role needs a unique role_id (problem at {rid!r})")
        seen.add(rid)
    return roles


def triage_roles(roles, persona, targets, aggregators, checker, timeline):
    try:
        keywords = persona["target"]["title_keywords"]
    except KeyError as e:
        raise InputError(f"persona field missing: {e}")

    out, to_score = [], []
    for c in roles:
        posting_url = c.get("posting_url") or c.get("url")
        r = {"role_id": c["role_id"], "company_as_entered": c.get("company"), "title": c.get("title"),
             "posting_url": posting_url, "employer_url": c.get("employer_url"), "fit": c.get("fit"),
             "fit_source": c.get("fit_source") or INPUT, "notes": c.get("notes"),
             "G1": None, "G2a": None, "G2b": None,
             "G3": {"factor": timeline["factor"], "source": INPUT}, "held": None, "closed": None}
        out.append(r)

        def hold(gate, reason, next_action):
            r["held"] = {"gate": gate, "reason": reason, "next_action": next_action}

        if not isinstance(r["fit"], (int, float)) or not 0 <= r["fit"] <= 1:
            hold("INPUT", "fit missing or not between 0 and 1", "Rate fit 0-1 in the candidates file.")
            continue

        row = targets.get(triage.normalize_name(c.get("company", "")))
        if row is None:
            r["G1"] = {"result": "held", "why": "not found"}
            hold("G1", "company not found in sponsorship CSV (exact-name match; may be a naming miss)",
                 "Search the CSV by hand for the legal name before deciding.")
            continue
        spons = triage.sponsorship_evidence(row, keywords)
        if spons is None:
            r["G1"] = {"result": "held", "why": "no sponsorship record"}
            hold("G1", "company is in the CSV but Total Approvals is blank: no sponsorship record (not zero)",
                 "Treat sponsorship as unknown; network to ask before applying.")
            continue
        r["company"] = row["company_name"]
        r["G1"] = {"result": "pass", "tier": spons["tier"], "evidence": spons}

        pages = []
        for kind, url in (("posting", posting_url), ("employer", r["employer_url"])):
            if url and not any(p["url"] == url for p in pages):
                chk = checker.check(url)
                pages.append({"kind": kind, "url": url, "aggregator": aggregator_of(url, aggregators),
                              "status": chk["status"], "checker_said": chk["checker_said"],
                              "checker_reason": chk["checker_reason"], "parse_error": chk["parse_error"]})
        if not pages:
            r["G2a"] = {"result": "held", "pages": []}
            hold("G2a", "no posting URL to check", "Add posting_url (or employer_url) to the candidates file.")
            continue
        gate, stop = g2_decide(pages)
        outcome = stop["outcome"] if stop else "pass"
        r["G2a"] = {"result": outcome if gate == "G2a" else "checked", "pages": pages}
        r["G2b"] = ({"result": "n/a", "why": "posting is not on an aggregator"} if gate == "G2a"
                    else {"result": outcome,
                          "aggregator": pages[0]["aggregator"],
                          "aggregator_reason": aggregators[pages[0]["aggregator"]]})
        if outcome == "held":
            hold(gate, stop["reason"], stop["next_action"])
            continue
        if outcome == "closed":   # a verified fact, not a gap: no score, and not HELD either
            r["closed"] = {"gate": gate, "reason": stop["reason"], "next_action": stop["next_action"]}
            continue

        to_score.append({
            "role_id": r["role_id"], "company": r["company"], "title": r["title"],
            "sponsorship": {"p": spons["p"], "tier": spons["tier"], "source": RECORD},
            "fit": {"p": r["fit"], "source": INPUT},
            "liveness": {"factor": 1.0, "source": RECORD},
            "timeline": {"factor": timeline["factor"], "source": INPUT},
        })
    return out, to_score


def flags_for(r):
    f = []
    if r["fit_source"] != INPUT:
        f.append(f"⚠ fit is inferred, not verified ({r['fit_source']})")
    if r["notes"]:
        f.append(f"⚠ note: {r['notes']}")
    if r["held"] and r["held"]["gate"] == "G1" and r["G1"]["why"] == "not found":
        f.append("⚠ may be a naming miss")
    if r["G2b"] and r["G2b"]["result"] == "pass":
        f.append("⚠ posting is on an aggregator; the employer page decided liveness")
    if r.get("decision") and not r["held"] and not r["closed"]:
        tier = r["G1"]["tier"]
        if tier == "None" and r["decision"] != "Skip":
            f.append("⚠ 0 approvals on record, yet not Skip")
        if r["decision"] == "Apply" and r["fit"] < 0.5:
            f.append("⚠ Apply comes mainly from sponsorship (fit < 0.5)")
        if r["G3"]["factor"] < 1:
            f.append(f"⚠ visa timeline tight (factor {r['G3']['factor']})")
    return f


def run(argv):
    args = parse_args(argv)
    out_dir = triage.check_out_dir(args.out_dir, [OUT_ROOT])       # G0: refuse before reading anything
    today = triage.parse_date(args.today, "--today") if args.today else date.today()
    persona = triage.load_json(args.persona)
    roles = validate_candidates(triage.load_json(args.candidates))
    targets = triage.load_targets(args.targets)
    aggregators = load_aggregators(args.aggregators)
    try:
        factor, why = triage.timeline_factor(persona["visa"], persona["assumptions"]["hiring_lag_days"], today)
    except KeyError as e:
        raise InputError(f"persona field missing: {e}")
    timeline = {"factor": factor, "why": why, "source": INPUT}

    inputs = {"persona": args.persona, "candidates": args.candidates,
              "targets": args.targets, "aggregators": args.aggregators}
    if args.offline:
        inputs["offline_fixture"] = args.offline
        checker = LivenessChecker(offline_runner(triage.load_json(args.offline)), "offline")
    else:
        checker = LivenessChecker(network_runner, "network")

    results, to_score = triage_roles(roles, persona, targets, aggregators, checker, timeline)

    out_dir.mkdir(parents=True, exist_ok=True)
    roles_path = out_dir / "roles.json"
    roles_path.write_text(json.dumps(to_score, indent=2) + "\n", encoding="utf-8")
    scores, scorer_stdout = {}, "scorer not run: no role cleared the gates"
    if to_score:
        scores, scorer_stdout = triage.run_scorer(roles_path, out_dir)

    decisions = {}
    for r in results:
        if r["held"]:
            r["decision"], r["composite"] = "HELD", None
        elif r["closed"]:
            r["decision"], r["composite"] = "CLOSED", None
        else:
            sc = scores.get(r["role_id"], {})
            r["decision"] = sc.get("decision") or "not found in scorer output"
            r["composite"], r["scorer_reason"] = sc.get("composite"), sc.get("reason")
        r["flags"] = flags_for(r)
        decisions[r["decision"]] = decisions.get(r["decision"], 0) + 1

    held = [r for r in results if r["held"]]
    closed = [r for r in results if r["closed"]]
    log = {
        "mode": MODE, "version": VERSION, "builds_on_recipe": BUILDS_ON,
        "imports_from": rel(OLD / "triage.py"),
        "run_date": str(today), "today_source": "--today" if args.today else "system clock",
        "command_line": ["python3", rel(Path(__file__))] + [scrub(a) for a in argv],
        "liveness_source": (f"offline fixture {rel(args.offline)}" if args.offline
                            else "network: " + " ".join(LIVENESS_CMD) + " <url>"),
        "inputs": {k: {"path": rel(v), "sha256": sha256(v)} for k, v in inputs.items()},
        "persona": {"name": persona.get("candidate", {}).get("name"),
                    "target_title": persona.get("target", {}).get("title"),
                    "soc": persona.get("target", {}).get("soc"), "source": INPUT},
        "rules": RULES,
        "aggregators": aggregators,
        "timeline": timeline,
        "summary": {"candidates": len(results), "scored": len(results) - len(held) - len(closed),
                    "held": len(held), "closed": len(closed),
                    "held_by_gate": {g: sum(1 for r in held if r["held"]["gate"] == g)
                                     for g in sorted({r["held"]["gate"] for r in held})},
                    "decisions": decisions},
        "roles": results,
        "liveness_checks": checker.checks,
        "scorer": {"called": bool(to_score), "roles_sent": [r["role_id"] for r in to_score],
                   "stdout": scorer_stdout},
        "not_verified": NOT_VERIFIED,
    }
    (out_dir / "mode-log.json").write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "mode-report.md").write_text(build_report(log), encoding="utf-8")
    return log, out_dir


# ---------- the human report ----------

def build_report(log):
    s, p, roles = log["summary"], log["persona"], log["roles"]
    agg_held = sum(1 for r in roles if r["held"] and r["held"]["reason"] == "aggregator-only liveness")
    emp_held = sum(1 for r in roles if r["held"] and r["held"]["reason"].startswith("employer page not active"))
    dec = ", ".join(f"{v} {k}" for k, v in s["decisions"].items() if k not in ("HELD", "CLOSED")) or "none"
    L = ["## Executive summary", "",
         f"This is a screening report for {p['name']}, a fictional international student looking for an "
         f"entry-level data scientist job that will sponsor a work visa. It checks {s['candidates']} job "
         "postings and recommends which ones are worth an application.", "",
         "Read it before applying to anything on the list: a posting is only scored if the company has a "
         "record of sponsoring visas and the job is confirmed open on the employer's own website. "
         "Job-listing sites are not trusted on their own, because one of them showed a removed job as open "
         "in an earlier run.", "",
         f"**What it found:** {s['scored']} of {s['candidates']} postings passed every check and were scored "
         f"({dec}). {s['closed']} were confirmed closed on the employer's own page and need no action. "
         f"{s['held']} were held back without a score: {agg_held} because the only sign the job "
         f"was open came from a job-listing site, {emp_held} because the employer's own page could not be "
         "confirmed, and the rest for missing sponsorship records or input. Nothing is decided "
         "until a person reviews the table below.", "",
         "## Run record", "",
         f"- Mode `{log['mode']}` v{log['version']}, building on `{log['builds_on_recipe']}`.",
         f"- Run date {log['run_date']} ({log['today_source']}). Liveness source: {log['liveness_source']}.",
         f"- Visa timeline factor **{log['timeline']['factor']}**: {log['timeline']['why']}. [your-input]",
         "- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. "
         "No model judgment was used.",
         "- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).", "",
         "## Roles", "",
         "| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | G3 timeline | Decision | Score | Flags |",
         "|---|---|---|---|---|---|---|---|---|"]
    for r in roles:
        g1 = "—" if not r["G1"] else (f"pass ({r['G1']['tier']})" if r["G1"]["result"] == "pass"
                                      else f"HELD: {r['G1']['why']}")
        if not r["G2a"]:
            g2a = "—"
        else:
            g2a = "; ".join(f"{pg['kind']}: {pg['status']}" + (" (unparseable)" if pg["parse_error"] else "")
                            for pg in r["G2a"]["pages"]) or "no URL"
        g2b = "—" if not r["G2b"] else (r["G2b"]["result"] if r["G2b"]["result"] == "n/a"
                                        else f"{r['G2b']['result']} ({r['G2b']['aggregator']})")
        g3 = "—" if (r["held"] or r["closed"]) else str(r["G3"]["factor"])
        if r["held"]:
            score = f"HELD — {r['held']['gate']}: {r['held']['reason']}"
        elif r["closed"]:
            score = f"CLOSED — {r['closed']['reason']}"
        else:
            score = f"{r['composite']:.3f}" if isinstance(r["composite"], (int, float)) else "—"
        L.append("| " + " | ".join(cell(x) for x in (
            r.get("company") or r["company_as_entered"], r["title"], g1, g2a, g2b, g3,
            f"**{r['decision']}**", score, "<br>".join(r["flags"]) or "")) + " |")

    held = [r for r in roles if r["held"]]
    if held:
        L += ["", "## Next action for held roles", ""]
        L += [f"- **{cell(r.get('company') or r['company_as_entered'])} — {cell(r['title'])}:** "
              f"{r['held']['next_action']}" for r in held]

    L += ["", "## Liveness checks (one per URL)", "",
          "| URL | Aggregator | Checker said | Exit | Parse |", "|---|---|---|---|---|"]
    aggs = log["aggregators"]
    for url, c in log["liveness_checks"].items():
        a = aggregator_of(url, aggs) or "no"
        said = (c["checker_said"] or "—") + (f": {c['checker_reason']}" if c["checker_reason"] else "")
        L.append("| " + " | ".join(cell(x) for x in (
            url, a, said, c["raw"].get("exit_code"), c["parse_error"] or "ok")) + " |")

    L += ["", "## What this run did NOT verify", ""] + [f"- {x}" for x in log["not_verified"]]
    L += ["", "## Human decision", "",
          "These are recommendations. A named person reviews this report and decides "
          "Apply / Network / Skip for each role, starting with the ⚠ rows.", ""]
    return "\n".join(L)


# ---------- CLI ----------

def parse_args(argv):
    ap = argparse.ArgumentParser(description="DS new-grad H-1B triage with aggregator-aware liveness (SOC 15-2051).")
    ap.add_argument("--candidates", required=True, help="JSON: roles with posting_url, optional employer_url, fit")
    ap.add_argument("--persona", default=str(triage.DEFAULT_PERSONA))
    ap.add_argument("--targets", default=str(triage.DEFAULT_TARGETS), help="80 Days to Stay CSV")
    ap.add_argument("--aggregators", default=str(DEFAULT_AGGREGATORS))
    ap.add_argument("--offline", help="JSON fixture of raw ats:liveness outputs keyed by URL (no network)")
    ap.add_argument("--today", help="run date YYYY-MM-DD (pass it for reproducible runs)")
    ap.add_argument("--out-dir", required=True)
    return ap.parse_args(argv)


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    try:
        log, out_dir = run(argv)
    except InputError as e:
        print(f"✗ stopped: {e}", file=sys.stderr)
        return 2
    s = log["summary"]
    print(log["scorer"]["stdout"])
    print(f"✓ mode: {s['candidates']} roles → {s['scored']} scored, {s['closed']} closed, "
          f"{s['held']} held {s['held_by_gate']} "
          f"→ {rel(out_dir)}/mode-log.json + mode-report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
