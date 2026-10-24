"""The run: postings -> company-match gate -> evidence -> tier/p -> gate presence ->
roles.json -> existing scorer -> run.json (agent log) + report.md (human report).

Exit codes (decision Q3): 0 clean · 3 completed with per-role stops/refusals · 1 whole-run failure.
(2 = bad arguments, raised by argparse in run.py.)"""
import json
from datetime import datetime, timezone
from pathlib import Path

from . import RunFailure, bls, classify, gates, inputs, match, report, score_bridge

EXIT_CLEAN, EXIT_FAILED, EXIT_STOPS = 0, 1, 3


def _lab(value, label, **extra):
    d = {"value": value, "label": label}
    d.update(extra)
    return d


def _disp(path, repo_root):
    """Repo-relative path for logs (keeps machine-specific home paths out of outputs)."""
    p = Path(path).resolve()
    try:
        return str(p.relative_to(Path(repo_root).resolve()))
    except ValueError:
        return str(p)


def _write_json(path, obj):
    Path(path).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run(repo_root, postings_path, config_path, rules_path, out_dir):
    repo_root, out_dir = Path(repo_root), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for stale in ("roles.json", "run.json", "report.md"):  # regenerated outputs only
        p = out_dir / stale
        if p.exists():
            p.unlink()
    started = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    log = {"workflow": "data-titles-h1b-entry", "run_id": started, "mode": "sample (offline)",
           "inputs": {"postings": _disp(postings_path, repo_root), "run_config": _disp(config_path, repo_root),
                      "rules": _disp(rules_path, repo_root)}}
    try:
        return _run(repo_root, Path(postings_path), Path(config_path), Path(rules_path), out_dir, log)
    except RunFailure as e:
        log.update({"status": "failed", "exit_code": EXIT_FAILED, "error": str(e),
                    "note": "Whole-run failure: no results are claimed and no report.md is written."})
        _write_json(out_dir / "run.json", log)
        return EXIT_FAILED, log


def _run(repo_root, postings_path, config_path, rules_path, out_dir, log):
    rules, rule_labels = inputs.load_rules(rules_path)
    config, config_labels = inputs.load_labeled(config_path)
    postings_doc = inputs.load_postings(postings_path)
    prov = rules["provenance"]
    rows, sha = inputs.load_sponsorship(repo_root, prov)
    bls_rows = inputs.load_bls(repo_root, prov)
    suffixes = match.load_suffixes(repo_root)
    matcher = match.Matcher(rows, suffixes)

    log["rules"] = {k: _lab(rules[k], rule_labels[k]) for k in rules}
    log["run_config"] = {k: _lab(config[k], config_labels[k]) for k in config}
    log["data"] = _lab({"sponsorship_csv": prov["sponsorship_csv"], "sha256": sha, "rows": len(rows),
                        "bls_csv": prov["bls_csv"], "bls_rows": len(bls_rows),
                        "suffix_patterns": suffixes, "suffix_source": prov["suffix_source"]}, "record")
    meta = postings_doc.get("_meta", {})
    log["sample"] = {
        "seed": _lab(meta.get("seed"), "your-input"),
        "per_group": _lab(meta.get("per_group"), "your-input"),
        "group_order": _lab(meta.get("group_order"), "your-input"),
        "group_sizes": _lab(meta.get("group_sizes"), "record",
                            note="evidence-group sizes computed by build_sample.py from the CSV with the rules in rules.json"),
        "built_at": meta.get("built_at"), "csv_sha256_at_build": meta.get("csv_sha256"),
    }

    tl, tl_missing = gates.timeline(config, rules["timeline_factors"])
    scored, stops, refusals, notes = [], [], [], []
    roles = []

    for p in postings_doc["postings"]:
        base = {"posting_id": p["posting_id"], "company_input": p["company_input"], "title": p.get("title"),
                "target_title": p.get("target_title"), "url": p.get("url"), "purpose": p.get("purpose")}
        m = matcher.match(p["company_input"])
        if m["status"] == "stop":
            stops.append(dict(base, gate="company-match", reason=m["reason"],
                              normalized_key=_lab(m["normalized_key"], "record"),
                              candidates=_lab(m["candidates"], "record"),
                              human_action="Pick the right row, or confirm the company is not in the data."))
            continue
        row = m["row"]
        ev = classify.evidence(row, rules)
        tr = classify.tier(ev, rules)
        group = classify.evidence_group(ev, rules)
        lv, lv_err = gates.liveness(p)
        missing = []
        if lv_err:
            missing.append(lv_err)
        missing += tl_missing
        entry = dict(base,
                     company_match=_lab({"rule": m["rule"], "matched_name": row["company_name"], "city": row["city"],
                                         "state": row["state"], "normalized_key": m["normalized_key"]}, "record"),
                     sponsorship_evidence=_lab(_evidence_record(ev), "record"),
                     title_classification=_lab([t for t in ev["titles"]], "your-input",
                                               note="data-family and bucket are the output of rules.json applied to the record titles"),
                     sponsorship_term=_lab(tr, "your-input"),
                     evidence_group=_lab(group, "your-input", note="rules.json applied to the record"),
                     notes=[])
        if m["siblings"]:
            text = ("Same normalized name as: " + "; ".join(
                f"{s_['company_name']} ({s_['city']}, {s_['state']}; sponsorship data: "
                f"{'yes' if s_['has_sponsorship_data'] else 'no'})" for s_ in m["siblings"])
                + ". Exact match used; check it is the right employer.")
            _note(entry, notes, "sibling-rows", text, "record", siblings=m["siblings"])
            entry["sibling_rows"] = _lab(m["siblings"], "record")
        if missing:
            refusals.append(dict(entry, refused_because=missing,
                                 human_action="Supply the missing value; the scorer would silently treat it as 1.0."))
            continue
        fit = p.get("fit") if isinstance(p.get("fit"), dict) else None
        role = {"role_id": p["posting_id"], "company": row["company_name"], "title": p.get("title"),
                "sponsorship": {"p": tr["p"], "tier": tr["tier"], "source": "your-input"},
                "liveness": {"factor": lv["factor"], "source": lv["label"]},
                "timeline": {"factor": tl["factor"], "source": "your-input"}}
        if fit is not None and isinstance(fit.get("p"), (int, float)) and not isinstance(fit.get("p"), bool):
            role["fit"] = {"p": fit["p"], "source": fit.get("label", "your-input")}
        roles.append(role)
        if tl["deferred_note"]:
            _note(entry, notes, "deferred-start", tl["deferred_note"], "your-input",
                  deferred_start_days=tl["deferred_start_days"])
        data_titles = [t for t in ev["titles"] if t["data_family"]]
        phrases = sorted({t["matched_phrase"] for t in data_titles})
        ptitle = (p.get("title") or "").lower()
        if phrases and not any(ph.lower() in ptitle for ph in phrases):
            _note(entry, notes, "title-family",
                  f"Company-level data-family match only: posting title '{p.get('title')}' vs sponsored data titles "
                  f"{[t['title'] for t in data_titles]}. This does not show the company sponsored this specific title.",
                  "your-input", matched_phrases=phrases)
        entry.update(
            fit=_lab(fit.get("p") if fit else None, fit.get("label", "your-input") if fit else "your-input",
                     reason=fit.get("reason") if fit else "no fit supplied; the scorer drops the vote"),
            liveness=_lab(lv["factor"], lv["label"], determined_by=lv["determined_by"]),
            timeline=_lab(tl, "your-input"),
            bls_context=_lab(bls.lookup(p.get("target_title"), bls_rows) or "no SOC row", "record",
                             note="context only; not scored (role_quality weight is 0.0 in the scorer)"))
        scored.append(entry)

    _duplicate_evidence_notes(scored + refusals, notes)

    roles_path = out_dir / "roles.json"
    _write_json(roles_path, roles)
    log["roles_json"] = _disp(roles_path, repo_root)

    scorer_out = None
    if roles:
        scorer_out, scorer_log = score_bridge.run_scorer(repo_root, _disp(roles_path, repo_root),
                                                         _disp(out_dir / "score", repo_root))
        score_bridge.check_ids([r["role_id"] for r in roles], scorer_out)
        log["scorer"] = dict(scorer_log, config=_lab(scorer_out.get("config"), "record",
                                                     note="weights/thresholds the unmodified scorer used"))
        by_id = {r["role_id"]: r for r in scorer_out["roles"]}
        gate_zero = (scorer_out.get("config") or {}).get("gate_zero")
        for e in scored:
            e["scorer_result"] = _lab(by_id[e["posting_id"]], "record",
                                      note="returned by scripts/score/role-scorer.mjs; each trace term keeps the scorer's own source label")
            e["next_action"] = _next_action(e, rules["next_action"], gate_zero)
    else:
        log["scorer"] = {"called": False, "why": "no role passed the gates"}

    counts = {k: sum(1 for e in scored if e["scorer_result"]["value"]["recommendation"] == k)
              for k in ("Apply", "Consider", "Skip")}
    machine = {k: sum(1 for e in scored if e["scorer_result"]["value"]["machine_recommendation"] == k)
               for k in ("Apply", "Consider", "Skip")}
    exit_code = EXIT_CLEAN if not stops and not refusals else EXIT_STOPS
    log.update({
        "status": "completed" if exit_code == EXIT_CLEAN else "completed-with-stops",
        "exit_code": exit_code,
        "counts": _lab({"postings": len(postings_doc["postings"]), "scored": len(scored),
                        "stopped_company_match": len(stops), "refused_missing_gate": len(refusals),
                        "recommendation": counts, "machine_recommendation": machine,
                        "skip_rate_of_scored": (counts["Skip"] / len(scored)) if scored else None}, "record"),
        "evidence_group_counts_scored": _lab({g: sum(1 for e in scored if e["evidence_group"]["value"] == g)
                                              for g in classify.EVIDENCE_GROUPS}, "record"),
        "scored": scored, "stops": stops, "refusals": refusals, "notes": notes,
    })
    _write_json(out_dir / "run.json", log)
    (out_dir / "report.md").write_text(report.render(log), encoding="utf-8")
    return exit_code, log


def _note(entry, notes, kind, text, label, **extra):
    """Non-scoring note: attached to the posting and collected for the run-level list."""
    n = dict({"type": kind, "posting_id": entry["posting_id"], "text": text, "label": label,
              "scoring_effect": "none"}, **extra)
    entry["notes"].append(n)
    notes.append(n)


def _next_action(entry, cfg, gate_zero):
    """Advice only: computed from the scorer's result, never fed back into it."""
    r = entry["scorer_result"]["value"]
    if r["recommendation"] == "Skip" and gate_zero is not None:
        closed = [g["factor"] for g in r["trace"]["gates"] if g["multiplier"] <= gate_zero]
        if closed:
            return _lab(cfg["gate_closed"].format(gate=closed[0]), "your-input", basis=f"gate closed: {closed[0]}")
    group = entry["evidence_group"]["value"]
    return _lab(cfg["by_evidence_group"][group], "your-input", basis=f"evidence group: {group}")


DUP_KEYS = ("total_approvals", "total_denials", "approval_rate", "median_salary_offered", "titles")


def _duplicate_evidence_notes(entries, notes):
    """Two different matched companies whose sponsorship columns are identical."""
    firsts = {}
    for e in entries:
        firsts.setdefault(e["company_match"]["value"]["matched_name"], e)
    by_sig = {}
    for name, e in firsts.items():
        ev = e["sponsorship_evidence"]["value"]
        if not ev["has_sponsorship_record"]:
            continue
        by_sig.setdefault(json.dumps([ev[k] for k in DUP_KEYS]), []).append(name)
    for names in by_sig.values():
        if len(names) < 2:
            continue
        text = (f"Identical sponsorship evidence (approvals, denials, rate, median salary, title list) for "
                f"{' and '.join(names)}. The evidence may belong to only one of them.")
        for e in entries:
            if e["company_match"]["value"]["matched_name"] in names:
                _note(e, notes, "duplicate-evidence", text, "record", companies=names)


def _evidence_record(ev):
    d = {k: ev[k] for k in ("has_sponsorship_record", "total_approvals", "total_denials", "approval_rate",
                            "median_salary_offered")}
    d["titles"] = [t["title"] for t in ev["titles"]]
    return d
