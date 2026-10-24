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
  v0.2 (Run 2) employer pages also get, via ats_record.py:
      - an allowlist check (ats_hosts.json): unknown host -> HELD, not checked;
      - a manual redirect chain: a hop through `error=true` -> expired signal;
        a final URL without the job id -> flag only;
      - for Greenhouse jobs, the public job-board API record DECIDES
        (404 -> CLOSED, 200 -> active, anything else -> uncertain -> HELD);
        disagreement with the page checker and title mismatches are flags.
  LEVEL (v0.3) rule-based level gate (level_rules.json, --max-level, default entry):
      a blocked token as a whole word in the candidate title or the ATS title ->
      OVER-LEVEL, no score, never sent to the scorer. No model judgment.
  G3  visa timeline factor                                   (imported from triage.py)
Then the existing scripts/score/role-scorer.mjs decides      (imported run_scorer).

Standard library only. Network: ats:liveness plus read-only public GETs (ATS API,
redirect hops), every call recorded in mode-log.json; none with --offline.
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
OLD = HERE.parent / "rithika-sr-ds-newgrad-h1b-15-2051"
sys.path.insert(0, str(OLD))
import triage  # noqa: E402  (G0/G1/G3 helpers and the scorer call are reused, not copied)
from triage import INPUT, RECORD, REPO, InputError, rel  # noqa: E402
sys.path.insert(0, str(HERE))
import ats_record  # noqa: E402

VERSION = "0.3.0"
MODE = "rithika-sr-ds-h1b-liveness"
BUILDS_ON = triage.RECIPE
OUT_ROOT = REPO / "course/2026fa/submissions/rithika-sr"
DEFAULT_AGGREGATORS = HERE / "aggregators.json"
DEFAULT_ATS_HOSTS = HERE / "ats_hosts.json"
DEFAULT_LEVEL_RULES = HERE / "level_rules.json"
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
    "allowlist": "a non-aggregator URL whose host is not in ats_hosts.json -> HELD 'source not recognized "
                 "as employer or ATS' (not checked)",
    "ats_record": "Greenhouse job URLs: the public job-board API decides (200 + same id -> active, "
                  "404 -> expired -> CLOSED, else uncertain -> HELD); page-checker disagreement is a flag",
    "redirect_chain": "non-Greenhouse employer pages: a hop through error=true -> expired -> CLOSED; "
                      "any employer page: final URL without the job id -> flag only",
    "title_check": "ATS title vs candidate title (lowercase word sets); mismatch -> flag only",
    "gate_order": "INPUT (fit) -> G1 -> G2a/G2b -> LEVEL -> G3; a role stops at its first failed gate",
    "level": "LEVEL: a blocked token (level_rules.json, chosen --max-level) as a whole word, case-insensitive, "
             "in the candidate title or the ATS record title -> OVER-LEVEL, no score",
}

NOT_VERIFIED = [x for x in triage.NOT_VERIFIED if "transcribed" not in x] + [
    "An `active` result means the page loaded and showed a visible apply control. "
    "It does not prove the employer is still reviewing applications.",
    "The aggregator list and the employer allowlist are hand-made rules. A job board "
    "missing from both is held as unrecognized; a careers domain missing from the "
    "allowlist is held too, even if it is the real employer.",
    "Only Greenhouse has an ATS record check. Lever, Ashby, Workday and SmartRecruiters "
    "pages are allowlisted but still decided by the page checker.",
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


def load_level_rules(path, max_level):
    data = triage.load_json(path)
    levels = data.get("levels") if isinstance(data, dict) else None
    if not isinstance(levels, dict) or max_level not in levels:
        raise InputError(f"--max-level {max_level!r} is not defined in {rel(path)} "
                         f"(defined: {', '.join(sorted(levels or {})) or 'none'})")
    out = {}
    for e in levels[max_level].get("blocked", []):
        token = str(e.get("token", "")).strip().lower()
        reason = str(e.get("reason", "")).strip()
        if not token or not reason:
            raise InputError(f"{rel(path)}: every blocked token needs a token and a one-line reason")
        out[token] = reason
    return out


def blocked_token(title, blocked):
    """First blocked token found as a whole word in the title (case-insensitive), else None."""
    for token in blocked:
        if re.search(rf"\b{re.escape(token)}\b", str(title or ""), re.IGNORECASE):
            return token
    return None


def load_hosts(path):
    data = triage.load_json(path)
    entries = data.get("hosts") if isinstance(data, dict) else None
    if not isinstance(entries, list) or not entries:
        raise InputError(f"{rel(path)}: needs a non-empty 'hosts' list")
    out = {}
    for e in entries:
        domain = str(e.get("domain", "")).strip().lower()
        reason = str(e.get("reason", "")).strip()
        if not domain or not reason:
            raise InputError(f"{rel(path)}: every allowlisted host needs a domain and a one-line reason")
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

    def __init__(self, runner, mode, calls=None):
        self.runner, self.mode, self.checks = runner, mode, {}
        self.calls = calls if calls is not None else []

    def check(self, url):
        if url not in self.checks:
            raw = self.runner(url)
            if raw.get("missing_from_fixture"):
                parsed = {"status": "uncertain", "checker_said": None, "checker_reason": None,
                          "parse_error": NO_CHECK + " (URL not in the offline fixture)"}
            else:
                parsed = parse_liveness(url, raw["stdout"], raw["exit_code"])
            self.checks[url] = {"command": LIVENESS_CMD + [url], "mode": self.mode, "raw": raw, **parsed}
            self.calls.append({"url": url, "method": "headless Chromium via ats:liveness (subresources not listed)",
                               "purpose": "page-checker", "status": f"exit {raw.get('exit_code')}",
                               "location": None, "error": parsed["parse_error"],
                               "time": None if self.mode == "offline" else
                               datetime.now(timezone.utc).isoformat(timespec="seconds"), "mode": self.mode})
        return self.checks[url]


def checker_why(chk):
    if chk["parse_error"] and chk["parse_error"].startswith(NO_CHECK):
        return f"no liveness check recorded: {chk['parse_error']}"
    if chk["parse_error"]:
        return f"liveness output unparseable: {chk['parse_error']}"
    return f"checker said {chk['checker_said']}" + (f": {chk['checker_reason']}" if chk["checker_reason"] else "")


def evaluate_page(kind, url, aggregators, hosts, checker, fetcher):
    """Everything known about one URL, and which source decided its status."""
    p = {"kind": kind, "url": url, "aggregator": aggregator_of(url, aggregators), "allowlisted": None,
         "checker": None, "ats_record": None, "redirect": None,
         "status": None, "decided_by": None, "reason": None, "flags": []}
    if p["aggregator"]:
        chk = checker.check(url)
        p["checker"] = {k: chk[k] for k in ("status", "checker_said", "checker_reason", "parse_error")}
        p.update(status=chk["status"], decided_by="page-checker (aggregator: never decides a role)",
                 reason=checker_why(chk))
        return p
    p["allowlisted"] = ats_record.host_match(url, hosts)
    if not p["allowlisted"]:
        p.update(status="unrecognized", decided_by="allowlist",
                 reason="source not recognized as employer or ATS")
        return p

    chk = checker.check(url)
    p["checker"] = {k: chk[k] for k in ("status", "checker_said", "checker_reason", "parse_error")}
    said = chk["checker_said"] or "unparseable"
    chain = p["redirect"] = ats_record.redirect_chain(fetcher, url)
    gh = ats_record.greenhouse_job(url)
    if gh:
        rec = p["ats_record"] = ats_record.api_record(fetcher, *gh)
        p.update(status=rec["status"], decided_by="ats-record",
                 reason=f"ATS record: HTTP {rec['http_status'] if rec['http_status'] is not None else rec['error']}"
                        + (f" ({rec['error']})" if rec["error"] and rec["http_status"] is not None else ""))
        if rec["status"] != chk["status"] and rec["status"] in ("active", "expired"):
            p["flags"].append(f"⚠ page checker said {said}; ATS record {rec['status']}")
        if chain["error_hop"] and rec["status"] == "active":
            p["flags"].append("⚠ redirected through ATS error page, but ATS record active")
    elif chain["error_hop"]:
        p.update(status="expired", decided_by="redirect-chain", reason="redirected through ATS error page")
        if chk["status"] != "expired":
            p["flags"].append(f"⚠ page checker said {said}; redirect chain went through an ATS error page")
    else:
        p.update(status=chk["status"], decided_by="page-checker", reason=checker_why(chk))
    if chain["final_has_job_id"] is False:
        p["flags"].append(f"⚠ final URL after redirects does not contain the job id: {chain['final_url']}")
    return p


def g2_decide(pages):
    """pages: evaluated pages. Returns (gate_name, None | {"outcome": "held" | "closed", reason, next_action}).
    Only non-aggregator pages decide. One of them `expired` -> closed (a verified fact, so it
    outranks an uncertain sibling); then an unrecognized source -> held; then anything not active -> held."""
    posting = next((p for p in pages if p["kind"] == "posting"), None)
    gate = "G2b" if posting and posting["aggregator"] else "G2a"
    own = [p for p in pages if not p["aggregator"]]
    if not own:
        return gate, {"outcome": "held", "reason": "aggregator-only liveness",
                      "next_action": "Find this job on the employer's own careers page or ATS; add it as employer_url."}
    expired = [p for p in own if p["status"] == "expired"]
    if expired:
        p = expired[0]
        return gate, {"outcome": "closed", "reason": f"posting verified closed ({p['kind']} page {p['reason']})",
                      "next_action": f"None needed. To double-check, open {p['url']}."}
    unrecognized = [p for p in own if p["status"] == "unrecognized"]
    if unrecognized:
        p = unrecognized[0]
        return gate, {"outcome": "held", "reason": "source not recognized as employer or ATS",
                      "next_action": f"Find this job on the employer's own careers page or ATS instead of {p['url']}."}
    bad = [p for p in own if p["status"] != "active"]
    if bad:
        p = bad[0]
        return gate, {"outcome": "held", "reason": f"employer page not active ({p['reason']})",
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


def triage_roles(roles, persona, targets, aggregators, hosts, checker, fetcher, timeline, blocked, max_level):
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
             "G3": {"factor": timeline["factor"], "source": INPUT}, "held": None, "closed": None,
             "LEVEL": None, "over_level": None, "page_flags": []}
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
                pages.append(evaluate_page(kind, url, aggregators, hosts, checker, fetcher))
        r["page_flags"] = [f for p in pages for f in p["flags"]]
        for p in pages:
            rec = p["ats_record"]
            if rec and rec["title"] and not ats_record.titles_match(rec["title"], r["title"]):
                r["page_flags"].append(f"⚠ title differs from ATS record: '{rec['title']}'")
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

        ats_titles = [p["ats_record"]["title"] for p in pages if p["ats_record"] and p["ats_record"]["title"]]
        level = {"result": "pass", "max_level": max_level, "titles_checked": [r["title"]] + ats_titles,
                 "token": None, "reason": None, "matched_in": None}
        for source, title in [("candidate title", r["title"])] + [("ATS record title", t) for t in ats_titles]:
            token = blocked_token(title, blocked)
            if token:
                level.update(result="blocked", token=token, reason=blocked[token], matched_in=source)
                break
        r["LEVEL"] = level
        if level["result"] == "blocked":
            r["over_level"] = {"gate": "LEVEL", "reason": f"title says '{level['token']}'",
                               "detail": f"{level['matched_in']}; {level['reason']}"}
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
    f = list(r.get("page_flags", []))
    if r["fit_source"] != INPUT:
        f.append(f"⚠ fit is inferred, not verified ({r['fit_source']})")
    if r["notes"]:
        f.append(f"⚠ note: {r['notes']}")
    if r["held"] and r["held"]["gate"] == "G1" and r["G1"]["why"] == "not found":
        f.append("⚠ may be a naming miss")
    if r["G2b"] and r["G2b"]["result"] == "pass":
        f.append("⚠ posting is on an aggregator; the employer page decided liveness")
    if r.get("decision") and not r["held"] and not r["closed"] and not r["over_level"]:
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
    hosts = load_hosts(args.ats_hosts)
    blocked = load_level_rules(args.level_rules, args.max_level)
    try:
        factor, why = triage.timeline_factor(persona["visa"], persona["assumptions"]["hiring_lag_days"], today)
    except KeyError as e:
        raise InputError(f"persona field missing: {e}")
    timeline = {"factor": factor, "why": why, "source": INPUT}

    inputs = {"persona": args.persona, "candidates": args.candidates,
              "targets": args.targets, "aggregators": args.aggregators, "ats_hosts": args.ats_hosts,
              "level_rules": args.level_rules}
    if args.offline:
        inputs["offline_fixture"] = args.offline
        fixture = triage.load_json(args.offline)
        fetcher = ats_record.Fetcher("offline", fixture.get("http") if isinstance(fixture, dict) else None)
        checker = LivenessChecker(offline_runner(fixture), "offline", fetcher.calls)
    else:
        fetcher = ats_record.Fetcher("network")
        checker = LivenessChecker(network_runner, "network", fetcher.calls)

    results, to_score = triage_roles(roles, persona, targets, aggregators, hosts, checker, fetcher, timeline,
                                     blocked, args.max_level)

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
        elif r["over_level"]:
            r["decision"], r["composite"] = "OVER-LEVEL", None
        else:
            sc = scores.get(r["role_id"], {})
            r["decision"] = sc.get("decision") or "not found in scorer output"
            r["composite"], r["scorer_reason"] = sc.get("composite"), sc.get("reason")
        r["flags"] = flags_for(r)
        decisions[r["decision"]] = decisions.get(r["decision"], 0) + 1

    held = [r for r in results if r["held"]]
    closed = [r for r in results if r["closed"]]
    over = [r for r in results if r["over_level"]]
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
        "ats_hosts": hosts,
        "max_level": args.max_level,
        "level_rules": blocked,
        "network_calls": fetcher.calls,
        "tls_ca_source": fetcher.ca_source,
        "timeline": timeline,
        "summary": {"candidates": len(results), "scored": len(results) - len(held) - len(closed) - len(over),
                    "over_level": len(over),
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
    if not args.offline:   # everything needed to replay this run offline, byte for byte
        replay = {"_note": f"Recorded by mode_run.py v{VERSION} during the network run of {today}. "
                           "Use with --offline to replay this run without the network.",
                  "results": {u: c["raw"] for u, c in checker.checks.items()},
                  "http": fetcher.replay}
        (out_dir / "replay-fixture.json").write_text(json.dumps(replay, indent=2, ensure_ascii=False) + "\n",
                                                     encoding="utf-8")
    return log, out_dir


# ---------- the human report ----------

def build_report(log):
    s, p, roles = log["summary"], log["persona"], log["roles"]
    def n(pred):
        return sum(1 for r in roles if pred(r))
    held_reasons = [
        (n(lambda r: r["held"] and r["held"]["reason"] == "aggregator-only liveness"),
         "because the only sign the job was open came from a job-listing site"),
        (n(lambda r: r["held"] and r["held"]["reason"] == "source not recognized as employer or ATS"),
         "because the link was not on a recognized employer or hiring-system site"),
        (n(lambda r: r["held"] and r["held"]["reason"].startswith("employer page not active")),
         "because the employer's own page could not be confirmed"),
        (n(lambda r: r["held"] and r["held"]["gate"] in ("G1", "INPUT")),
         "for a missing sponsorship record or missing input"),
    ]
    dec = ", ".join(f"{v} {k}" for k, v in s["decisions"].items() if k not in ("HELD", "CLOSED", "OVER-LEVEL"))
    found = [f"{s['scored']} of {s['candidates']} postings passed every check and were scored"
             + (f" ({dec})." if dec else ".")]
    if s["closed"]:
        found.append(f"{s['closed']} {'was' if s['closed'] == 1 else 'were'} confirmed closed on the employer's "
                     "own page and need no action.")
    if s["over_level"]:
        found.append(f"{s['over_level']} {'is' if s['over_level'] == 1 else 'are'} above entry level by "
                     "job title (for example senior or staff) and were not scored.")
    if s["held"]:
        parts = [f"{c} {why}" for c, why in held_reasons if c]
        found.append(f"{s['held']} {'was' if s['held'] == 1 else 'were'} held back without a score: "
                     + (", ".join(parts[:-1]) + " and " + parts[-1] if len(parts) > 1 else parts[0]) + ".")
    L = ["## Executive summary", "",
         f"This is a screening report for {p['name']}, a fictional international student looking for an "
         f"entry-level data scientist job that will sponsor a work visa. It checks {s['candidates']} job "
         "postings and recommends which ones are worth an application.", "",
         "Read it before applying to anything on the list: a posting is only scored if the company has a "
         "record of sponsoring visas, the job is confirmed open on the employer's own website, and the job "
         "title is not above entry level. Job-listing sites are not trusted on their own, because one of them "
         "showed a removed job as open in an earlier run.", "",
         "**What it found:** " + " ".join(found) + " Where an employer's hiring system publishes a record of "
         "the job, that record decided whether the job is open. Nothing is decided until a person reviews "
         "the table below.", "",
         "## Run record", "",
         f"- Mode `{log['mode']}` v{log['version']}, building on `{log['builds_on_recipe']}`.",
         f"- Run date {log['run_date']} ({log['today_source']}). Liveness source: {log['liveness_source']}.",
         f"- Visa timeline factor **{log['timeline']['factor']}**: {log['timeline']['why']}. [your-input]",
         "- Labels: sponsorship and liveness are **[record]**; fit and timeline are **[your-input]**. "
         "No model judgment was used.",
         "- Machine log: `mode-log.json` (raw liveness output, input hashes, full command line).", "",
         "## Roles", "",
         "| Company | Title | G1 sponsorship | G2a liveness | G2b aggregator | Level | G3 timeline | Decision | Score | Flags |",
         "|---|---|---|---|---|---|---|---|---|---|"]
    for r in roles:
        g1 = "—" if not r["G1"] else (f"pass ({r['G1']['tier']})" if r["G1"]["result"] == "pass"
                                      else f"HELD: {r['G1']['why']}")
        if not r["G2a"]:
            g2a = "—"
        else:
            g2a = "; ".join(f"{pg['kind']}: {pg['status']} [{pg['decided_by'].split(' ')[0]}]"
                            for pg in r["G2a"]["pages"]) or "no URL"
        g2b = "—" if not r["G2b"] else (r["G2b"]["result"] if r["G2b"]["result"] == "n/a"
                                        else f"{r['G2b']['result']} ({r['G2b']['aggregator']})")
        lv = r["LEVEL"]
        level = "—" if not lv else ("pass" if lv["result"] == "pass"
                                    else f"OVER-LEVEL: '{lv['token']}' ({lv['matched_in']})")
        g3 = "—" if (r["held"] or r["closed"] or r["over_level"]) else str(r["G3"]["factor"])
        if r["held"]:
            score = f"HELD — {r['held']['gate']}: {r['held']['reason']}"
        elif r["closed"]:
            score = f"CLOSED — {r['closed']['reason']}"
        elif r["over_level"]:
            score = f"OVER-LEVEL — {r['over_level']['reason']}"
        else:
            score = f"{r['composite']:.3f}" if isinstance(r["composite"], (int, float)) else "—"
        L.append("| " + " | ".join(cell(x) for x in (
            r.get("company") or r["company_as_entered"], r["title"], g1, g2a, g2b, level, g3,
            f"**{r['decision']}**", score, "<br>".join(r["flags"]) or "")) + " |")

    held = [r for r in roles if r["held"]]
    if held:
        L += ["", "## Next action for held roles", ""]
        L += [f"- **{cell(r.get('company') or r['company_as_entered'])} — {cell(r['title'])}:** "
              f"{r['held']['next_action']}" for r in held]

    L += ["", "## ATS records and redirect chains (employer pages)", "",
          "| URL | Allowlisted as | ATS record | Redirect hops | Final URL has job id | Decided by |",
          "|---|---|---|---|---|---|"]
    seen = set()
    for r in roles:
        for pg in (r["G2a"] or {}).get("pages", []):
            if pg["aggregator"] or pg["url"] in seen:
                continue
            seen.add(pg["url"])
            rec, ch = pg["ats_record"], pg["redirect"]
            rec_txt = "—" if not rec else (f"{rec['status']} (HTTP {rec['http_status']}"
                                           + (f", '{rec['title']}'" if rec["title"] else "")
                                           + (f", {rec['error']}" if rec["error"] else "") + ")")
            hops_txt = "—" if not ch else " → ".join(f"{h['status'] if h['status'] is not None else h['error']}"
                                                    for h in ch["hops"])
            has_id = "—" if not ch or ch["final_has_job_id"] is None else ("yes" if ch["final_has_job_id"]
                                                                          else f"NO ({ch['final_url']})")
            L.append("| " + " | ".join(cell(x) for x in (
                pg["url"], pg["allowlisted"] or "not on allowlist", rec_txt, hops_txt, has_id,
                pg["decided_by"])) + " |")

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
    ap.add_argument("--ats-hosts", default=str(DEFAULT_ATS_HOSTS), help="employer/ATS allowlist")
    ap.add_argument("--level-rules", default=str(DEFAULT_LEVEL_RULES))
    ap.add_argument("--max-level", default="entry", help="level in level_rules.json (default: entry)")
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
          f"{s['over_level']} over-level, "
          f"{s['held']} held {s['held_by_gate']} "
          f"→ {rel(out_dir)}/mode-log.json + mode-report.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
