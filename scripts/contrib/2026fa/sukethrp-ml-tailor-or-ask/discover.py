#!/usr/bin/env python3
"""discover.py — find live ML/AI postings on a target list's job boards, and audit each target's sponsorship record.

Recipe: recipes/cases/2026fa/sukethrp-ml-tailor-or-ask.md (new in v0.2.0)

For each company in a target list it:
  1. reads the company's public job board, when the engine can read it (Greenhouse in this version), through the
     engine's own allow-listed, no-redirect fetcher (.claude/skills/greenhouse-watch/scripts/greenhouse_watch.py);
  2. keeps the postings the declared discovery rules keep (rules.json `discovery`: families, entry markers, senior
     and internship markers, US locations, the newest N per company) and counts every drop by its reason;
  3. looks up every legal name listed for the company in the 80 Days sponsorship file and reports what the row holds,
     including "no H-1B fields" and "no row";
  4. writes a queue for tailor_or_ask.py --live, which then runs every gate on each kept posting.

It never decides fit: that is the person's call. A company whose board the engine cannot read is reported as such,
never skipped silently.

Run from the repo root:
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/discover.py --targets <targets.json> --out-dir <dir>
    python3 scripts/contrib/2026fa/sukethrp-ml-tailor-or-ask/tailor_or_ask.py --live --queue <dir>/queue.json --out-dir <dir>/judged

Outputs (in --out-dir): queue.json (for the mode), target-audit.md (for the person), discovery-log.json (for agents),
and boards/<slug>.json (the raw listings, whose SHA-256 the log records).

Exit codes: 0 done · 2 stopped at the input or source gate (or the network is forbidden).
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import evidence as ev  # noqa: E402
import tailor_or_ask as mode  # noqa: E402

from evidence import MODEL, REC, Stop, lab, show  # noqa: E402

SCHEMA = "sukethrp-ml-tailor-or-ask/targets@1"
QUEUE_SCHEMA = "sukethrp-ml-tailor-or-ask/queue@1"
READABLE = {"greenhouse"}  # Ashby, SmartRecruiters and Workday boards are a typed proposal


# ── inputs ───────────────────────────────────────────────────────────────────

def load_targets(path: Path) -> dict:
    try:
        t = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise Stop("input", f"cannot read the target list {show(path)}: {exc}")
    problems = []
    if t.get("schema") != SCHEMA:
        problems.append(f"`schema` must be {SCHEMA!r}")
    if t.get("targets_by") not in ev.DECLARERS:
        problems.append("`targets_by` must say who chose these companies: 'student' or 'claude-code'")
    if t.get("legal_names_by") not in ev.DECLARERS:
        problems.append("`legal_names_by` must say who listed the legal names: 'student' or 'claude-code'")
    if not mode.text(t.get("persona")):
        problems.append("`persona` must be a persona profile.yml path")
    targets = t.get("targets")
    if not isinstance(targets, list) or not targets:
        problems.append("`targets` must be a non-empty list")
        targets = []
    seen = set()
    for i, c in enumerate(targets):
        where = f"targets[{i}]"
        if not isinstance(c, dict) or not mode.text(c.get("company")):
            problems.append(f"{where}.company is required")
            continue
        if c["company"] in seen:
            problems.append(f"{where}.company {c['company']!r} is duplicated")
        seen.add(c["company"])
        if not isinstance(c.get("legal_names"), list):
            problems.append(f"{where}.legal_names must be a list (it may be empty)")
        b = c.get("board")
        if b is not None:
            if not isinstance(b, dict) or not mode.text(b.get("ats")) or not mode.text(b.get("slug")):
                problems.append(f"{where}.board must be null or {{ats, slug}}")
            elif not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", b["slug"]):
                problems.append(f"{where}.board.slug looks wrong: {b['slug']!r}")
        ci = c.get("company_identity")
        if ci is not None:  # the person's identity decision for this company, copied into each of its postings
            if not isinstance(ci, dict) or ci.get("status") not in ("confirmed", "candidate"):
                problems.append(f"{where}.company_identity.status must be 'confirmed' or 'candidate'")
            elif ci.get("by") in (None, "claude-code") or not mode.text(ci.get("checked")):
                problems.append(f"{where}.company_identity: an identity is decided by a named person who says what "
                                "they checked, never by Claude Code")
            elif ci["status"] == "confirmed" and not (isinstance(ci.get("csv_row"), int) and ci["csv_row"] >= 1):
                problems.append(f"{where}.company_identity: a confirmed identity names its csv_row")
        tts = c.get("time_to_start")
        if tts is not None:
            mode.check_declared(f"{where}.time_to_start", tts, None, problems)
            w = tts.get("weeks") if isinstance(tts, dict) else None
            if isinstance(w, bool) or not isinstance(w, (int, float)) or not 0 < w <= 104:
                problems.append(f"{where}.time_to_start.weeks must be a number of weeks between 0 and 104")
    if problems:
        raise Stop("input", "the target list failed the input gate:\n  - " + "\n  - ".join(problems))
    return t


def compile_discovery(rules: dict) -> dict:
    d = rules.get("discovery")
    if not d:
        raise Stop("input", "the rules file has no `discovery` section (rules 0.3.0 or later)")
    comp = lambda pats: [re.compile(p, re.I) for p in pats]  # noqa: E731
    return {"families": {k: comp(v) for k, v in d["families"].items()},
            "needs_entry": set(d.get("families_needing_entry_marker", [])),
            "exclude": comp(d.get("exclude_titles", [])),
            "entry": comp(d["entry_markers"]), "new_grad": comp(d["new_grad_markers"]),
            "senior": comp(d["senior_markers"]), "drop": comp(d["drop_markers"]),
            "us": comp(d["us_location"]), "non_us": comp(d["non_us_location"]),
            "cap": int(d["cap_per_company"]),
            "review": [(comp(v["patterns"]), v["flag"]) for v in (d.get("review_markers") or {}).values()],
            "new_grad_flag": d.get("new_grad_flag", "new grad"), "categories": d.get("categories", {})}


# ── the filters ──────────────────────────────────────────────────────────────

def location_kind(name: str, c: dict) -> str:
    """us | non-us | unclear. Any US place wins (a posting listed in New York and London is reachable in the US)."""
    name = name or ""
    if any(p.search(name) for p in c["us"]):
        return "us"
    if any(p.search(name) for p in c["non_us"]):
        return "non-us"
    return "unclear"


def classify(job: dict, c: dict) -> dict:
    """{keep, reason, family, flags} for one board listing, dropped by the first rule that applies: not a kept
    family, internship, senior title, outside the US (rules.json `discovery._order`)."""
    title, where = str(job.get("title", "")), str((job.get("location") or {}).get("name", ""))
    entry = any(p.search(title) for p in c["entry"])
    family = None
    if not any(p.search(title) for p in c["exclude"]):
        for name, pats in c["families"].items():
            if any(p.search(title) for p in pats) and (name not in c["needs_entry"] or entry):
                family = name
                break
    if family is None:
        return {"keep": False, "reason": "not a kept family"}
    if any(p.search(title) for p in c["drop"]):
        return {"keep": False, "reason": "internship or fellowship"}
    if any(p.search(title) for p in c["senior"]):
        return {"keep": False, "reason": "senior title"}
    kind = location_kind(where, c)
    if kind == "non-us":
        return {"keep": False, "reason": "outside the US"}
    flags = (["location unclear: check it"] if kind == "unclear" else []) + (
        [c["new_grad_flag"]] if any(p.search(title) for p in c["new_grad"]) else []) + [
        flag for pats, flag in c["review"] if any(p.search(title) for p in pats)]
    return {"keep": True, "reason": "kept", "family": family, "category": c["categories"].get(family, family),
            "flags": flags}


def triage(jobs: list[dict], c: dict) -> tuple[list[dict], dict]:
    """Kept postings (newest first, at most the cap) and the counts by reason."""
    counts = {"listed": len(jobs)}
    kept = []
    for j in jobs:
        v = classify(j, c)
        counts[v["reason"]] = counts.get(v["reason"], 0) + 1
        if v["keep"]:
            kept.append({**j, "_family": v["family"], "_category": v["category"], "_flags": v["flags"]})
    kept.sort(key=lambda j: str(j.get("updated_at") or ""), reverse=True)
    if len(kept) > c["cap"]:
        counts["over the cap"] = len(kept) - c["cap"]
        counts["kept"] -= len(kept) - c["cap"]
    return kept[:c["cap"]], counts


# ── the board and the file ───────────────────────────────────────────────────

def greenhouse_watch():
    spec = importlib.util.spec_from_file_location("greenhouse_watch", mode.GREENHOUSE_WATCH)
    gw = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gw)
    return gw


def fetch_listing(slug: str) -> tuple[str, dict]:
    """(listing URL, JSON) through the engine's allow-listed fetcher. Network."""
    if __import__("os").environ.get("TAILOR_OR_ASK_FORBID_NETWORK"):
        raise Stop("discovery", "a board read was attempted while TAILOR_OR_ASK_FORBID_NETWORK is set", code=2)
    ev.network_guard()
    gw = greenhouse_watch()
    url = gw.board_url(slug, content=False)
    return url, gw.fetch_board(url)


def file_rows(names: list[str], index: dict, by_row: dict, normalize, rules: dict) -> list[dict]:
    out = []
    for name in names:
        key = normalize(name)
        rows = index.get(key, [])
        if not rows:
            out.append({"legal_name": name, "normalized": key, "row": None, "holds": "no row in the file"})
        for n in rows:
            evid, reason = ev.sponsorship_evidence(by_row[n], rules)
            row = by_row[n]
            if reason == "no-h1b-record":
                holds = "no H-1B fields"
            elif reason:
                holds = f"not usable ({reason})"
            else:
                holds = (f"{evid['approvals']['value']} approvals, company-wide · tier {evid['tier']['value']} · ML/AI titles "
                         f"counted: {', '.join(evid['ml_titles_counted']['value']) or 'none'}")
            out.append({"legal_name": name, "normalized": key, "row": n, "company_name": row["company_name"],
                        "city": row["city"], "state": row["state"], "holds": holds})
    return out


# ── the run ──────────────────────────────────────────────────────────────────

def run(args) -> int:
    targets_path = Path(args.targets).resolve()
    targets = load_targets(targets_path)
    rules = ev.load_rules(Path(args.rules))
    c = compile_discovery(rules)
    private = mode.inside_repo(targets_path) is None or (mode.inside_repo(targets_path) or "").startswith("private/")
    out_dir = mode.prepare_out_dir(Path(args.out_dir), private, args.overwrite)
    mode.load_persona(mode.repo_path(targets["persona"]), private)  # the persona gate, before any network call

    csv_path = mode.repo_path(rules["source"]["csv"])
    sha = ev.source_gate(csv_path, rules["source"]["sha256"])
    normalize = ev.load_normalizer()
    index, by_row, _ = ev.load_sponsorship(csv_path, normalize)
    as_of = dt.date.today()  # the person's local date, as in the mode's live runs

    audit, postings, boards = [], [], []
    for t in targets["targets"]:
        entry = {"company": t["company"], "board": t.get("board"), "company_identity": t.get("company_identity"),
                 "file_rows": file_rows(t.get("legal_names") or [], index, by_row, normalize, rules),
                 "name_match": file_rows([t["company"]], index, by_row, normalize, rules)}
        b = t.get("board")
        if not b:
            entry["listing"] = "no board the engine can read (the company runs its own careers site)"
        elif b["ats"] not in READABLE:
            entry["listing"] = f"a {b['ats']} board: not read in this version (typed proposal)"
        else:
            try:
                url, data = fetch_listing(b["slug"])
            except Stop:
                raise
            except Exception as exc:  # reported, never retried or guessed around
                entry["listing"] = f"the board could not be read: {exc}"
                boards.append({"company": t["company"], "slug": b["slug"], "error": str(exc)})
                audit.append(entry)
                continue
            saved = out_dir / "boards" / f"{b['slug']}.json"
            saved.parent.mkdir(parents=True, exist_ok=True)
            saved.write_text(json.dumps(data, indent=1) + "\n", encoding="utf-8")
            boards.append({"company": t["company"], "slug": b["slug"], "url": url, "saved": show(saved),
                           "sha256": ev.sha256_file(saved), "jobs": len(data.get("jobs") or [])})
            kept, counts = triage(data.get("jobs") or [], c)
            entry["listing"], entry["counts"] = "read", counts
            for j in kept:
                p = {"posting_id": f"{b['slug']}-{j['id']}", "company": t["company"], "title": j["title"],
                     "url": j["absolute_url"],
                     "discovered": {"listing_url": url, "board": f"greenhouse/{b['slug']}", "job_id": j["id"],
                                    "updated_at": j.get("updated_at"), "location": (j.get("location") or {}).get("name"),
                                    "family": j["_family"], "category": j["_category"], "flags": j["_flags"]}}
                if t.get("company_identity"):
                    p["company_identity"] = t["company_identity"]
                if t.get("time_to_start"):
                    tts = t["time_to_start"]
                    p["timeline"] = {"compute": {"weeks": tts["weeks"]}, "reason": tts["reason"], "by": tts["by"]}
                postings.append(p)
        audit.append(entry)

    queue = {"schema": QUEUE_SCHEMA, "as_of": str(as_of), "queue_by": targets["targets_by"],
             "persona": targets["persona"],
             "note": (f"Written by discover.py on {as_of} from {show(targets_path)}. The companies were chosen by "
                      f"{targets['targets_by']}; the postings, titles and URLs come from each board's public API; the "
                      "discovery rules decided which were kept. Fit is left out: it is the person's call."),
             "postings": postings}
    if not postings:
        queue["postings"] = []
    (out_dir / "queue.json").write_text(json.dumps(queue, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    log = {"workflow": ev.WORKFLOW, "tool": "discover.py", "recipe_version": mode.RECIPE_VERSION, "as_of": str(as_of),
           "targets": {"path": show(targets_path), "sha256": ev.sha256_file(targets_path),
                       "chosen_by": targets["targets_by"], "legal_names_by": targets["legal_names_by"]},
           "rules": {"path": show(Path(args.rules)), "version": rules["rules_version"], "declared_by": rules["declared_by"]["who"],
                     "label": rules["_label"]},
           "source": {"csv": show(csv_path), "sha256": sha},
           "labels": {"titles, URLs, locations": lab("from each board's public API", REC),
                      "which postings were kept": lab("the discovery rules", rules["_label"]),
                      "legal names": lab("listed in the target file", ev.label_for(targets["legal_names_by"])),
                      "file rows": lab("the sponsorship file, matched by exact normalized name", mode.COMP)},
           "boards": boards, "audit": audit, "queued": len(postings),
           "outputs": {"queue": show(out_dir / "queue.json"), "audit": show(out_dir / "target-audit.md")}}
    (out_dir / "discovery-log.json").write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "target-audit.md").write_text(render_audit(log, rules), encoding="utf-8")
    readable = sum(1 for a in audit if a.get("listing") == "read")
    print(f"✓ {len(audit)} companies · {readable} board{'s' if readable != 1 else ''} read · "
          f"{len(postings)} posting{'s' if len(postings) != 1 else ''} queued")
    print(f"  {show(out_dir / 'target-audit.md')}  +  {show(out_dir / 'queue.json')}")
    return 0


def render_audit(log: dict, rules: dict) -> str:
    audit = log["audit"]
    unread = [a["company"] for a in audit if a.get("listing") != "read"]
    blind = [a["company"] for a in audit
             if not any(r.get("row") and "approvals" in r["holds"] for r in a["file_rows"] + a["name_match"])]
    o = [f"# Target audit — {log['as_of']}", "", "## Executive summary", "",
         f"This is the check of {len(audit)} target companies before any application time is spent: whether the mode "
         "can read each company's job board, which machine-learning postings it found there, and what the public H-1B "
         "file this engine reads holds for each company. Read it to see where the evidence runs out, not only where "
         "it exists.", "",
         f"**What it found.** {log['queued']} postings were kept for the full check. "
         + (f"The mode cannot read the job boards of {', '.join(unread)}. " if unread else "")
         + (f"The sponsorship file has no H-1B history for {', '.join(blind)}: unknown, not 'no'. " if blind else "")
         + "Kept postings still pass every gate in the mode, and fit stays the person's call.", "",
         *([f"**Check by hand.** The careers sites of {', '.join(unread)} need a separate manual check: they stay on the "
            "list, and this audit cannot see their postings.", ""] if unread else []),
         "## Each company", "",
         "The postings kept per company are a sample: the newest matches, up to the cap. They are not that "
         "company's best matches, and the matches over the cap were not checked.", "",
         "| Company | Job board | Postings listed | Checked (newest matches, up to the cap) | Identity | Sponsorship file |",
         "|---|---|---|---|---|---|"]
    for a in audit:
        b = a.get("board")
        board = f"{b['ats']}/{b['slug']}" if b else "none the engine can read"
        counts = a.get("counts", {})
        rows = a["file_rows"] or a["name_match"]
        held = "; ".join(f"{r['legal_name']}: " + (f"row {r['row']} {r['company_name']} ({r['city']}, {r['state']}): {r['holds']}"
                                                  if r.get("row") else r["holds"]) for r in rows) or "no legal name listed"
        ci = a.get("company_identity")
        ident = f"{ci['status']} by {ci['by']} on {ci['at']} (row {ci.get('csv_row')})" if ci else "not decided"
        o.append(f"| {mode.md(a['company'])} | {mode.md(board)} | {counts.get('listed', '—')} | "
                 f"{counts.get('kept', 0) if counts else '—'} | {mode.md(ident)} | {mode.md(held)} |")
    o += ["", "## Why postings were dropped", "",
          "Every listed posting is counted once, by the first rule that dropped it. Nothing is dropped silently.", "",
          "| Company | Listed | Internship | Senior title | Not a kept family | Outside the US | Matching, not checked (over the cap) | Checked |",
          "|---|---|---|---|---|---|---|---|"]
    for a in audit:
        k = a.get("counts")
        if k:
            o.append(f"| {mode.md(a['company'])} | {k['listed']} | {k.get('internship or fellowship', 0)} | "
                     f"{k.get('senior title', 0)} | {k.get('not a kept family', 0)} | {k.get('outside the US', 0)} | "
                     f"{k.get('over the cap', 0)} | {k.get('kept', 0)} |")
    o += ["", "## What this audit cannot verify", "",
          "- Postings on careers sites the engine cannot read. This version reads Greenhouse boards only.",
          "- Whether a legal name listed for a company is its H-1B petitioner. The names were listed by "
          f"{log['targets']['legal_names_by']}, and a name match is not an identity.",
          "- Sponsorship now. The file's approvals are company-wide, have no filing years, and cover six states.",
          "- Whether a kept title is the work its posting describes. The title rules read titles only; the mode then "
          "reads each posting's own requirements.",
          "- A company's best matches. The cap keeps the newest matching postings, a sample.", "",
          "## Run record", "",
          f"- Targets: `{log['targets']['path']}` (chosen by {log['targets']['chosen_by']}; legal names by "
          f"{log['targets']['legal_names_by']})",
          f"- Rules: `{log['rules']['path']}` v{log['rules']['version']}, declared by {log['rules']['declared_by']} "
          f"(the filters are labelled {log['rules']['label']})",
          f"- Sponsorship file sha256 `{log['source']['sha256']}`",
          f"- Boards read: " + ", ".join(f"{x['slug']} ({x.get('jobs', 'error')} listed, sha256 `{x.get('sha256', '')[:12]}…`)"
                                         for x in log["boards"]) if log["boards"] else "- Boards read: none", ""]
    return "\n".join(o)


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description="Find ML/AI postings on a target list's job boards and audit each target.")
    ap.add_argument("--targets", required=True, help="target list JSON")
    ap.add_argument("--out-dir", required=True, help="where to write the queue, the audit and the log")
    ap.add_argument("--rules", default=str(mode.DEFAULT_RULES), help="declared rules (needs a `discovery` section)")
    ap.add_argument("--overwrite", action="store_true", help="allow replacing an earlier discovery in --out-dir")
    return ap.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    try:
        return run(args)
    except Stop as stop:
        print(f"STOP at the {stop.gate} gate: {stop}", file=sys.stderr)
        return stop.code


if __name__ == "__main__":
    sys.exit(main())
