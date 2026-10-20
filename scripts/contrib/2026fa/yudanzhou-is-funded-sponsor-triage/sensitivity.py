#!/usr/bin/env python3
"""
sensitivity.py: how much of the triage outcome rests on numbers I chose?

For each `your-input` assumption (self-rated fit per family, the hiring-lag assumption,
and the approval-count -> p mapping), move it to each listed value, re-run the same
triage plus the EXISTING scorer (scripts/score/role-scorer.mjs), and count which
recommendations change against the baseline. A decision that flips on a number with
no measured basis is reported as fragile; one that never flips is reported as robust
*to that assumption only*.

Run from the repo root (same inputs as triage.py):
  python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/sensitivity.py \
      --config ... --persona ... --postings ... [--liveness-log ... --liveness-date ...] --today YYYY-MM-DD --out-dir DIR

Writes DIR/sensitivity.json (agent) and DIR/sensitivity.md (human). No network.
Exit codes: 0 ok · 2 a hard gate failed · 3 scorer failed
"""
import argparse
import copy
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import triage  # noqa: E402

LAG_VALUES = [30, 60, 90, 120, 200]
FIT_DELTAS = [-0.2, -0.1, +0.1, +0.2]
P_DELTAS = [-0.2, -0.1, +0.1]


def clamp01(x):
    return max(0.0, min(1.0, round(x, 3)))


def variants(config, persona):
    """Yield (assumption, setting, config, persona) — one assumption moved at a time."""
    for lag in LAG_VALUES:
        if lag == persona["hiring_lag_days_assumed"]:
            continue
        p = copy.deepcopy(persona); p["hiring_lag_days_assumed"] = lag
        yield "hiring_lag_days_assumed", f"{lag} days", config, p
    for fam in persona["target_families"]:
        base = persona["self_rated_fit"][fam]
        for d in FIT_DELTAS:
            v = clamp01(base + d)
            if v == base:
                continue
            p = copy.deepcopy(persona); p["self_rated_fit"][fam] = v
            yield f"self_rated_fit.{fam}", f"{base} -> {v}", config, p
    for tier in ("proven", "likely", "possible"):
        base = config["sponsorship_tiers"][tier]["p"]
        for d in P_DELTAS:
            v = clamp01(base + d)
            if v == base:
                continue
            c = copy.deepcopy(config); c["sponsorship_tiers"][tier]["p"] = v
            yield f"sponsorship_tiers.{tier}.p", f"{base} -> {v}", c, persona


def break_even(scores, tested_min):
    """For each scored role, the value each vote would need to cross the nearest band boundary,
    holding everything else fixed. Uses the scorer's own weights and thresholds from its JSON output.
    `tested_min` = {(role_id, factor): lowest value the variants tried}."""
    if not scores:
        return []
    cfg = scores["config"]
    T, F, gz = cfg["apply_threshold"], cfg["consider_floor"], cfg.get("gate_zero", 0.05)
    out = []
    for r in scores["roles"]:
        tr = r["trace"]
        g = tr["gate_product"]
        row = {"role_id": r["role_id"], "recommendation": r["machine_recommendation"],
               "composite": r["composite"], "factors": []}
        if g < gz:
            row["note"] = f"gated (multiplier {g}): no vote can change it"
            out.append(row)
            continue
        c = r["composite"]
        bound = T if c >= T else F
        direction = "below" if c >= bound else "above"
        for v in tr["votes"]:
            if not v["weight"]:
                continue
            rest = tr["vote_sum"] - v["value"] * v["weight"]
            need = (bound / g - rest) / v["weight"]
            lo = tested_min.get((r["role_id"], v["factor"]))
            feasible = 0.0 <= need <= 1.0
            row["factors"].append({
                "factor": v["factor"], "value": v["value"], "boundary": bound,
                "flips_if": f"{direction} {need:.3f}", "possible": feasible, "tested_down_to": lo,
                "tested_range_reached_it": bool(lo is not None and feasible and direction == "below" and lo < need)})
        out.append(row)
    return out


def decide(csv, form_d, config, persona, postings, today, live_log, workdir, gates=None):
    """One triage + existing-scorer pass. Returns ({role_id: recommendation}, {posting_id: status})."""
    roles, _, per, _, _ = triage.triage(csv, form_d, config, persona, postings, today, live_log, gates)
    status = {r["posting_id"]: r["status"] for r in per}
    if not roles:
        return {}, status, None
    os.makedirs(workdir, exist_ok=True)
    rp = os.path.join(workdir, "roles.json")
    with open(rp, "w", encoding="utf-8") as f:
        json.dump(roles, f)
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        scores = triage.run_scorer(rp, workdir)
    return {r["role_id"]: r["recommendation"] for r in scores["roles"]}, status, scores


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", default=triage.DEFAULT_CSV)
    ap.add_argument("--form-d", default=triage.DEFAULT_FORM_D)
    ap.add_argument("--config", default=os.path.join(HERE, "config.json"))
    ap.add_argument("--persona", default=triage.DEFAULT_PERSONA)
    ap.add_argument("--postings", default=os.path.join(HERE, "fixtures", "postings.sample.json"))
    ap.add_argument("--liveness-log", default=None)
    ap.add_argument("--liveness-date", default=None)
    ap.add_argument("--gate-decisions", default=None)
    ap.add_argument("--data-note", default="", help="one sentence saying what data this ran on (demo/constructed vs real)")
    ap.add_argument("--today", required=True)
    ap.add_argument("--out-dir", required=True)
    a = ap.parse_args(argv)
    try:
        today = triage.parse_date(a.today)
        config, persona = triage.load_json(a.config), triage.load_json(a.persona)
        postings = triage.load_json(a.postings)["postings"]
        live = triage.load_liveness_log(a.liveness_log, a.liveness_date or a.today) if a.liveness_log else None
        gates = triage.load_gate_decisions(a.gate_decisions) if a.gate_decisions else None
        tmp = tempfile.mkdtemp(prefix="sens-")
        base, base_status, base_scores = decide(a.csv, a.form_d, config, persona, postings, today, live, os.path.join(tmp, "base"), gates)
        rows = []
        for i, (name, setting, c, p) in enumerate(variants(config, persona)):
            rec, status, _ = decide(a.csv, a.form_d, c, p, postings, today, live, os.path.join(tmp, f"v{i}"), gates)
            flips = [{"role_id": rid, "from": base[rid], "to": rec.get(rid)} for rid in base if rec.get(rid) != base[rid]]
            gate_moves = [pid for pid in base_status if status.get(pid) != base_status[pid]]
            rows.append({"assumption": name, "setting": setting, "decisions_changed": len(flips),
                         "flips": flips, "status_changes": gate_moves})
        # lowest value each factor was moved to, per scored role (for the break-even comparison)
        tested_min = {}
        if base_scores:
            for role in triage.triage(a.csv, a.form_d, config, persona, postings, today, live, gates)[0]:
                rid = role["role_id"]
                tier = (role["sponsorship"].get("rule") or "").split(".")[-1]
                fam = role["fit"]["basis"].split()[-1]
                if tier in config["sponsorship_tiers"]:
                    tested_min[(rid, "sponsorship")] = clamp01(config["sponsorship_tiers"][tier]["p"] + min(P_DELTAS))
                if fam in persona["self_rated_fit"]:
                    tested_min[(rid, "fit")] = clamp01(persona["self_rated_fit"][fam] + min(FIT_DELTAS))
        be = break_even(base_scores, tested_min)
    except triage.GateError as e:
        print(f"✗ STOP: {e}", file=sys.stderr)
        return 2
    except RuntimeError as e:
        print(f"✗ STOP: {e}", file=sys.stderr)
        return 3

    os.makedirs(a.out_dir, exist_ok=True)
    fragile = sorted({r["assumption"] for r in rows if r["decisions_changed"]})
    tested = sorted({r["assumption"] for r in rows})
    out = {"_tool": "sensitivity.py", "run_date": a.today, "inputs": vars(a), "data_note": a.data_note,
           "baseline": base, "break_even": be,
           "baseline_scored": len(base), "variants": rows, "fragile_assumptions": fragile,
           "robust_assumptions": [t for t in tested if t not in fragile],
           "note": "Only scored roles can flip; held-out postings are counted under status_changes. Robust means robust to the listed settings only."}
    with open(os.path.join(a.out_dir, "sensitivity.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, indent=2)

    L = ["# Sensitivity check: how much rests on my own numbers?\n", "## Executive summary\n"]
    if a.data_note:
        L.append(a.data_note + "\n")
    reached = [f for r in be for f in r.get("factors", []) if f["tested_range_reached_it"]]
    if not base:
        L.append("No posting reached the scorer in this run, so no recommendation could flip. The check still ran every variant; "
                 "the result says nothing about how fragile a scored decision would be.\n")
    elif fragile:
        L.append(f"The baseline scored {len(base)} posting(s). Moving my {len(tested)} hand-chosen assumptions one at a time, "
                 f"{len(fragile)} changed at least one recommendation: " + ", ".join(f"`{x}`" for x in fragile) +
                 ". Those decisions rest on a number I chose, not on a record.\n")
    else:
        L.append(f"The baseline scored {len(base)} posting(s). None of the {len(rows)} variants changed any recommendation. "
                 "**That is a property of the ranges I tested, not evidence of robustness:** the break-even table below shows how far "
                 "each decision is from flipping, and "
                 + ("no tested range reached a break-even point." if not reached
                    else f"{len(reached)} break-even point(s) fall inside a tested range.") + "\n")
    L.append(f"## Run record\n\n- Date: {a.today} · baseline: " + (", ".join(f"{k}={v}" for k, v in base.items()) or "nothing scored") + "\n")
    if be:
        L.append("## Break-even: how far each scored decision is from flipping\n")
        L.append("Computed from the scorer's own weights and thresholds (its JSON output), holding every other term fixed.\n")
        L.append("| Posting | Decision (composite) | Term | Value now | Flips if | Possible in [0,1]? | Lowest value tested |")
        L.append("|---|---|---|---|---|---|---|")
        for r in be:
            if not r.get("factors"):
                L.append(f"| {r['role_id']} | {r['recommendation']} ({r['composite']:.3f}) | — | — | {r.get('note', '—')} | — | — |")
            for f in r.get("factors", []):
                lo = f["tested_down_to"] if f["tested_down_to"] is not None else "—"
                L.append(f"| {r['role_id']} | {r['recommendation']} ({r['composite']:.3f}) | {f['factor']} | {f['value']} | "
                         f"{f['flips_if']} | {'yes' if f['possible'] else 'no'} | {lo} |")
        L.append("")
    L.append("## Variants\n\n| Assumption (your-input) | Setting | Decisions changed | Which |\n|---|---|---|---|")
    for r in rows:
        which = "; ".join(f"{x['role_id']}: {x['from']}→{x['to']}" for x in r["flips"]) or "—"
        L.append(f"| {r['assumption']} | {r['setting']} | {r['decisions_changed']} | {which} |")
    L.append("\n*Robust means robust to these settings only. Held-out postings never reach the scorer, so they cannot flip here.*")
    with open(os.path.join(a.out_dir, "sensitivity.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(L) + "\n")
    print(f"✓ sensitivity: {len(rows)} variants over {len(tested)} assumptions · baseline scored {len(base)} · "
          f"fragile: {', '.join(fragile) or 'none'} → {a.out_dir}/sensitivity.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
