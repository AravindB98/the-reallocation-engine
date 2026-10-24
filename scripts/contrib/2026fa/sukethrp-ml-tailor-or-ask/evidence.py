"""evidence.py — the record checks this mode reuses from Assignment 3.

Source: scripts/contrib/2026fa/sukethrp-ml-newgrad-sponsor-match/sponsor_match.py on branch
contrib/2026fa-sukethrp-ml-newgrad-sponsor-match at commit 95d4982 (SHA-256 4cf053a8...a09b15),
the author's Assignment 3 prototype (nikbearbrown/the-reallocation-engine#12). That branch is not on
main, so the functions this mode needs are copied here. Each one is unchanged unless its docstring
says "Changed from A3", with the change named.

What these functions do, all without a model:
  * pin and read the 80 Days sponsorship file (only non-personal columns ever leave it);
  * find the posting's company in it by the engine's own name normaliser;
  * check whether the company's sponsored titles include an ML/AI title with no seniority or
    level marker (A3's role-level check), and flag records shared with a differently named company;
  * classify posting liveness with the engine's classifier (saved pages, or live through
    scripts/ats/check-liveness.mjs);
  * run the engine's scorer through its command line and check it kept its contract.
"""
from __future__ import annotations

import ast
import csv
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]  # scripts/contrib/2026fa/<this folder>/ -> repo root
WORKFLOW = "sukethrp-ml-tailor-or-ask"
SCORER = REPO / "scripts" / "score" / "role-scorer.mjs"
LIVENESS_CLI = REPO / "scripts" / "ats" / "check-liveness.mjs"
NORMALIZER = REPO / "scripts" / "sec" / "entity-resolution.py"
NODE_BRIDGE = HERE / "node_bridge.mjs"  # byte-identical to A3's (SHA-256 0cf421e0...533e5c)

# Only these columns ever leave the CSV. The file also holds phone numbers and
# executive / director names; those are never read into any output.
KEEP_COLUMNS = ["company_name", "industry", "city", "state", "website",
                "Total Approvals", "Total Denials", "Approval_Rate",
                "median_salary_offered", "top_job_titles_sponsored"]
H1B_COLUMNS = ["Total Approvals", "Total Denials", "Approval_Rate",
               "median_salary_offered", "top_job_titles_sponsored"]

REC, MODEL, YOU = "record", "model-judgment", "your-input"
LABELS = (REC, MODEL, YOU)
DECLARERS = {"student": YOU, "claude-code": MODEL}


class Stop(Exception):
    """A run-level gate failed. code 2 = source or input gate; 1 = run void; 3 = guard refused."""

    def __init__(self, gate: str, message: str, code: int = 2):
        super().__init__(message)
        self.gate = gate
        self.code = code


def lab(value, source, **extra):
    """One labeled value: {value, source, ...provenance}."""
    return {"value": value, "source": source, **extra}


def label_for(declared_by: str | None) -> str:
    """New in A5 (the fix for A3's defect D9). A declared value is labelled by who declared it:
    the student -> your-input; Claude Code -> model-judgment. Anything else is refused upstream."""
    return DECLARERS[declared_by]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def number(text: str):
    try:
        value = float(text)
    except (TypeError, ValueError):
        return None
    if value != value:  # NaN
        return None
    return int(value) if value.is_integer() else value


def show(p: Path) -> str:
    """Display a path relative to the repo when it is inside it."""
    try:
        return Path(p).resolve().relative_to(REPO).as_posix()
    except ValueError:
        return str(p)


# ── reuse: the engine's own code, not copies of it ──────────────────────────

def load_normalizer():
    """normalize_company_name from scripts/sec/entity-resolution.py, the engine's join rule."""
    spec = importlib.util.spec_from_file_location("entity_resolution", NORMALIZER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.normalize_company_name


def node(args: list[str], stdin: str | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(["node", *args], input=stdin, capture_output=True, text=True, cwd=REPO)


def read_yaml(path: Path) -> dict:
    """Changed from A3: raises Stop with this mode's message; the bridge call is the same."""
    proc = node([str(NODE_BRIDGE), "yaml", str(path)])
    if proc.returncode != 0:
        raise Stop("input", f"could not read {show(path)}: {proc.stderr.strip()}")
    return json.loads(proc.stdout)


def classify_snapshots(snapshots: list[dict]) -> list[dict]:
    """scripts/ats/liveness-core.mjs classifyLiveness on saved pages (offline)."""
    proc = node([str(NODE_BRIDGE), "liveness"], stdin=json.dumps(snapshots))
    if proc.returncode != 0:
        raise Stop("liveness", f"liveness classifier failed: {proc.stderr.strip()}", code=1)
    return json.loads(proc.stdout)


def network_guard() -> None:
    """Changed from A3: the switch is TAILOR_OR_ASK_FORBID_NETWORK (tests set it)."""
    if os.environ.get("TAILOR_OR_ASK_FORBID_NETWORK"):
        raise Stop("liveness", "a network call was attempted while TAILOR_OR_ASK_FORBID_NETWORK is set", code=1)


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # report the redirect instead of following it


def first_hop(url: str) -> tuple[int | None, str | None]:
    """One request to the posting's own (allowed) host, redirects NOT followed.
    Returns (HTTP status, Location header or error). Network.
    Changed from A3: the User-Agent names this mode."""
    network_guard()
    opener = urllib.request.build_opener(_NoRedirect)
    request = urllib.request.Request(url, headers={"User-Agent": f"{WORKFLOW} (redirect pre-check)"})
    try:
        with opener.open(request, timeout=30) as response:
            return response.status, None
    except urllib.error.HTTPError as exc:
        return exc.code, exc.headers.get("Location")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return None, str(getattr(exc, "reason", exc))


def check_live(urls: list[str]) -> tuple[subprocess.CompletedProcess, dict]:
    """scripts/ats/check-liveness.mjs (Playwright) on real postings. Network."""
    network_guard()
    proc = node([str(LIVENESS_CLI), *urls])
    found, lines = {}, proc.stdout.splitlines()
    for i, line in enumerate(lines):
        m = re.match(r"^\S+\s+(active|expired|uncertain)\s+(\S+)\s*$", line)
        if not m:
            continue
        result, url = m.groups()
        reason = ""
        if result != "active" and i + 1 < len(lines) and lines[i + 1].startswith(" "):
            reason = lines[i + 1].strip()
        found[url] = {"result": result, "reason": reason}
    return proc, found


def run_scorer(roles_path: Path, out_dir: Path) -> subprocess.CompletedProcess:
    """Changed from A3: never passes --profile. With no profile the scorer assumes the person
    needs sponsorship, which is true for every persona this mode accepts, and its free-text
    authorization regex (role-scorer.mjs:60) never runs."""
    return subprocess.run(["node", str(SCORER), str(roles_path), "--out-dir", str(out_dir)],
                          capture_output=True, text=True, cwd=REPO)


# ── the declared title rules ────────────────────────────────────────────────

def load_rules(path: Path) -> dict:
    """Changed from A3: also reads `declared_by`, which sets the label of every value the rules
    produce (your-input once the student has reviewed and adopted them, model-judgment before)."""
    rules = json.loads(path.read_text(encoding="utf-8"))
    rules["_family"] = [re.compile(p, re.I) for p in rules["role_family"]["include_patterns"]]
    rules["_exclude"] = [re.compile(p, re.I) for p in rules["role_family"].get("exclude_patterns", [])]
    rules["_senior"] = [re.compile(p, re.I) for p in rules["senior_markers"]]
    rules["_level"] = [re.compile(p, re.I) for p in rules.get("level_markers", [])]
    rules["_context"] = [re.compile(p, re.I) for p in rules.get("context_markers", [])]
    rules["_level_counts"] = bool(rules.get("level_markers_count_as_evidence"))
    rules["_sha256"] = sha256_file(path)
    who = (rules.get("declared_by") or {}).get("who")
    if who not in DECLARERS:
        raise Stop("input", f"{show(path)}: declared_by.who must be 'student' or 'claude-code', got {who!r}")
    rules["_label"] = DECLARERS[who]
    return rules


# ── the sponsorship file and the source gate ────────────────────────────────

def source_gate(csv_path: Path, expected: str) -> str:
    if not csv_path.exists():
        raise Stop("source", f"sponsorship file not found: {show(csv_path)}")
    actual = sha256_file(csv_path)
    if actual != expected:
        raise Stop("source", f"{show(csv_path)} has SHA-256 {actual}, not the pinned {expected}. "
                             "The audits no longer describe this file. Read its audit, then pin the new "
                             "hash on purpose (--csv-sha256) if you accept it.")
    return actual


def h1b_signature(row: dict) -> tuple:
    return tuple(row[c] for c in H1B_COLUMNS)


def load_sponsorship(csv_path: Path, normalize) -> tuple[dict, dict, int]:
    """index: normalized name -> rows; by_row: row -> kept columns plus '_key' (normalized
    name) and '_shared_with' (other rows carrying the identical H-1B record)."""
    index, by_row, by_record = {}, {}, {}
    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        missing = [c for c in KEEP_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise Stop("source", f"{show(csv_path)} is missing columns {missing}")
        n = 0
        for n, row in enumerate(reader, start=1):
            kept = {c: (row.get(c) or "").strip() for c in KEEP_COLUMNS}
            kept["_key"] = normalize(kept["company_name"])
            by_row[n] = kept
            index.setdefault(kept["_key"], []).append(n)
            if kept["Total Approvals"]:
                by_record.setdefault(h1b_signature(kept), []).append(n)
    for rows in by_record.values():
        for r in rows:
            by_row[r]["_shared_with"] = [x for x in rows if x != r]
    return index, by_row, n


def lookalikes(row_no: int, by_row: dict) -> list[dict]:
    """Other companies, under a different name, that carry this row's H-1B record value for value.
    The file's join can copy one employer's history onto a lookalike (for example two
    similarly named biotechs), so a shared record may not belong to this company."""
    row = by_row[row_no]
    return [{"csv_row": n, "company_name": by_row[n]["company_name"], "city": by_row[n]["city"],
             "state": by_row[n]["state"]}
            for n in row.get("_shared_with", []) if by_row[n]["_key"] != row["_key"]]


# ── the role-level check ────────────────────────────────────────────────────

def classify_title(title: str, rules: dict) -> dict:
    """ML/AI family = an include pattern matches and no exclude pattern does.
    'counted' = in the family with no clear seniority marker and no context marker, and with no level
    marker unless the rules count level II / L2 titles. A counted title is historical sponsorship evidence
    for this kind of role; it is not proof of the hire's level, and never proof the person qualifies.
    Changed from A3 (the student's calls R1 and R2, 2026-10-19): level II / L2 titles can count
    (`level_markers_count_as_evidence`), and Lead / Founding / Architect / Fellow are 'needs context'
    (not counted, not treated as senior). A3 called the counted set 'unmarked'."""
    family = [p.pattern for p in rules["_family"] if p.search(title)]
    excluded = [p.pattern for p in rules["_exclude"] if p.search(title)] if family else []
    senior = [p.pattern for p in rules["_senior"] if p.search(title)]
    context = [p.pattern for p in rules.get("_context", []) if p.search(title)]
    level = [p.pattern for p in rules["_level"] if p.search(title)]
    in_family = bool(family) and not excluded
    counted = in_family and not senior and not context and (not level or rules.get("_level_counts", False))
    return {"title": title, "role_family": in_family, "senior_marked": bool(senior), "context_marked": bool(context),
            "level_marked": bool(level), "counted": counted,
            "family_patterns": family, "excluded_by": excluded, "senior_patterns": senior,
            "context_patterns": context, "level_patterns": level}


def sponsorship_evidence(row: dict, rules: dict):
    """(evidence, None) or (None, hold_reason). Never returns a guessed tier, and missing history stays
    unknown (never a value).
    Changed from A3: values derived through the declared rules carry rules['_label'] (your-input only once
    the student adopted the rules) instead of always your-input; the counted set follows classify_title
    (R1, R2); a company whose only ML/AI titles need context gets gap 'needs-context'."""
    ruled = rules["_label"]
    if not any(row[c] for c in H1B_COLUMNS):
        return None, "no-h1b-record"
    approvals = number(row["Total Approvals"])
    if approvals is None or approvals <= 0:
        return None, "no-approvals-on-record"
    try:
        titles = ast.literal_eval(row["top_job_titles_sponsored"])
        if not isinstance(titles, (list, tuple)):
            raise ValueError("not a list")
    except (ValueError, SyntaxError):
        return None, "unparseable-sponsored-titles"
    titles = [str(t).strip() for t in titles]
    classified = [classify_title(t, rules) for t in titles]
    family = [c["title"] for c in classified if c["role_family"]]
    counted = [c["title"] for c in classified if c["counted"]]
    context = [c["title"] for c in classified if c["role_family"] and c["context_marked"] and not c["senior_marked"]]
    leveled = [c["title"] for c in classified if c["counted"] and c["level_marked"]]
    floor = rules["tiers"]["proven_min_approvals"]
    with_level = f" (counted level-marked: {', '.join(repr(t) for t in leveled)})" if leveled else ""
    if counted and approvals >= floor:
        tier, why = "Proven", (f"{len(counted)} sponsored ML/AI title(s) counted as evidence{with_level}, and "
                               f"{approvals} company-wide approvals (at least {floor})")
        gap = None
    elif counted:
        tier, why = "Likely", (f"ML/AI title(s) counted as evidence{with_level}, but only {approvals} company-wide "
                               f"approvals (fewer than {floor})")
        gap = "thin-record"
    elif context:
        tier, why, gap = ("Likely", "the only sponsored ML/AI titles need context (Lead, Founding, Architect or Fellow)",
                          "needs-context")
    elif family:
        tier, why, gap = ("Likely", "every sponsored ML/AI title carries a clear seniority marker", "marked-only")
    else:
        tier, why, gap = "Likely", "no ML/AI title among the listed sponsored titles", "no-role-family-title"
    return {
        "approvals": lab(approvals, REC, column="Total Approvals"),
        "denials": lab(number(row["Total Denials"]), REC, column="Total Denials"),
        "approval_rate_pct": lab(number(row["Approval_Rate"]), REC, column="Approval_Rate"),
        "median_salary_offered_company": lab(number(row["median_salary_offered"]), REC,
                                             column="median_salary_offered",
                                             note="company-wide median across its sponsored filings, not per title"),
        "sponsored_titles": lab(titles, REC, column="top_job_titles_sponsored",
                                note="a short 'top titles' list, not every title the company sponsored"),
        "title_checks": lab(classified, ruled, derived_from="sponsored_titles + the declared title rules"),
        "ml_titles": lab(family, ruled, derived_from="title_checks"),
        "ml_titles_counted": lab(counted, ruled, derived_from="title_checks"),
        "ml_titles_needing_context": lab(context, ruled, derived_from="title_checks"),
        "tier": lab(tier, ruled, rule=why, gap=gap,
                    derived_from="approvals + ml_titles_counted + tiers.proven_min_approvals"),
        "p": lab(rules["tiers"]["p"][tier], ruled, mapping=f"tiers.p.{tier}", reason=rules["tiers"]["p_reason"]),
    }, None


# ── the scorer-contract check ───────────────────────────────────────────────

def contract_problems(sent: list[dict], scored: dict) -> list[str]:
    """Changed from A3: a role the scorer returns without its trace is reported as a problem (run VOID) instead
    of raising KeyError, which would crash the run before any log was written."""
    problems = []
    if scored.get("profile_needs_sponsorship") is not True:
        problems.append("the scorer ran as if the persona does not need sponsorship "
                        f"(profile_needs_sponsorship = {scored.get('profile_needs_sponsorship')!r}), so the "
                        "sponsorship vote was weighted 0")
    by_id = {x.get("role_id"): x for x in scored.get("roles", [])}
    if set(by_id) != {s["role_id"] for s in sent}:
        problems.append("the scorer's roles do not match the roles sent")
    for s in sent:
        got = by_id.get(s["role_id"])
        if not got:
            continue
        trace = got.get("trace")
        if not isinstance(trace, dict) or not isinstance(trace.get("votes"), list) or not isinstance(trace.get("gates"), list):
            problems.append(f"{s['role_id']}: the scorer returned no usable trace, so its labels cannot be checked")
            continue
        want = {k: s[k]["source"] for k in ("sponsorship", "fit") if k in s}
        have = {v["factor"]: v["source"] for v in trace["votes"]}
        want.update({g: s[g]["source"] for g in ("liveness", "timeline")})
        have.update({g["factor"]: g["source"] for g in trace["gates"]})
        if any(have.get(k) != v for k, v in want.items()):
            problems.append(f"{s['role_id']}: labels changed inside the scorer ({have} vs sent {want})")
    return problems
