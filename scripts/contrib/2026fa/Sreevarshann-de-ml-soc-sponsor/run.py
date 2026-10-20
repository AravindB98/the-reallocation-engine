#!/usr/bin/env python3
"""de-ml-soc-sponsor: offline evidence pass for Data/ML Engineer targets.

Runs the offline steps of the mode (input check, sponsor lookup, title-keyword
match, BLS lookup, Form D sample lookup, timeline gate) and folds in an
already-captured `npm run ats:liveness` output plus any human posting checks.
Writes, under --out-dir:

  evidence.json  agent log (every value labelled)
  report.md      human report
  roles.json     scorer input, scoreable roles only (when any)
  profile.json   scorer profile (authorization string only)

It never calls the network and never calls or re-implements the scorer.
Run the scorer afterwards with the command printed at the end.

Exit codes: 0 ok · 2 input halt · 3 timeline gate closed · 4 authorization trap
· 5 vote guard tripped.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lookup as L  # noqa: E402

DEFAULT_PERSONA = L.REPO / "search/examples/priya-nair/profile.yml"
OUTPUTS = ("evidence.json", "report.md", "roles.json", "profile.json")


def build(args) -> tuple[int, dict, list[dict]]:
    targets = L.read_targets(args.targets)
    persona = L.read_persona(args.persona)
    authorization = ((persona.get("visa") or {}).get("current_status") or "").strip()
    needs_sponsorship = persona.get("needs_sponsorship") is True
    timeline = L.timeline_gate(persona)

    tool_results = None
    if args.liveness:
        if L.is_private_path(args.liveness):
            raise L.InputError(f"refusing to read a private path: {L.repo_relative(args.liveness)}")
        tool_results = L.parse_liveness_output(Path(args.liveness).read_text(encoding="utf-8"))
    checks = L.read_posting_checks(args.checks) if args.checks else {}

    sponsor_index = L.load_sponsor_index(args.sponsor_csv)
    bls_rows = L.load_bls_rows(args.bls_csv)
    formd_index, formd_meta = L.load_formd_sample_index(args.formd_dir)

    stops = []
    exit_code = 0
    if needs_sponsorship and L.scorer_would_drop_sponsorship(authorization):
        stops.append({"condition": 7, "detail": "authorization string would make the scorer treat this sponsorship-needing persona as not needing sponsorship"})
        exit_code = 4
    if not timeline["open"]:
        stops.append({"condition": 5, "detail": "timeline gate closed: all roles Skipped as gated"})
        exit_code = exit_code or 3

    roles_out, scorer_roles = [], []
    for i, t in enumerate(targets, start=1):
        role_id = f"r{i}"
        sponsor = L.sponsor_lookup(t["company_name"], sponsor_index)
        titles = L.title_match(sponsor.get("top_job_titles_raw")) if "top_job_titles_raw" in sponsor else None
        socs = sorted({s for m in (titles or {}).get("matches", []) for s in m["candidate_socs"]["value"]})
        live = L.liveness_state(t["posting_url"], tool_results, checks)
        role = {
            "role_id": role_id,
            "company": L.labelled(t["company_name"], L.INPUT),
            "posting_title": L.labelled(t["posting_title"], L.INPUT),
            "posting_url": L.labelled(t["posting_url"], L.INPUT),
            "sponsor": {k: v for k, v in sponsor.items() if k != "top_job_titles_raw"},
            "title_match": titles,
            "bls": L.bls_lookup(socs, bls_rows) if socs else {},
            "formd_sample": L.formd_sample_lookup(t["company_name"], formd_index, formd_meta),
            "liveness": live,
        }
        if not timeline["open"]:
            role["status"], role["reason"] = "skip_gated", "timeline gate closed"
        elif exit_code == 4:
            role["status"], role["reason"] = "stopped", "authorization trap: run stopped before scoring"
        elif sponsor["status"] != "found":
            role["status"], role["reason"] = "blocked", f"missing evidence: {sponsor['status']} ({sponsor['reason']})"
        elif live["state"] == "held":
            role["status"], role["reason"] = "held", live["reason"]
        else:
            role["status"] = "scoreable"
            role["reason"] = "sponsor record found; liveness resolved"
            scorer_roles.append({
                "role_id": role_id,
                "company": t["company_name"],
                "title": t["posting_title"],
                "sponsorship": {"p": sponsor["sponsorship_p"]["value"], "tier": sponsor["tier"]["value"],
                                "source": "record (tier rule and tier->p map: user definition)"},
                "fit": {"p": L.FIT_NEUTRAL, "source": "your-input (neutral constant)"},
                "liveness": {"factor": live["factor"]["value"], "source": live["factor"]["source"]},
                "timeline": {"factor": timeline["factor"]["value"], "source": "your-input (persona dates, user's formula)"},
            })
        roles_out.append(role)

    try:
        L.assert_votes_clean(scorer_roles)
    except ValueError as exc:
        stops.append({"condition": 6, "detail": str(exc)})
        exit_code, scorer_roles = 5, []

    counts = {s: sum(1 for r in roles_out if r["status"] == s)
              for s in ("scoreable", "held", "blocked", "skip_gated", "stopped")}
    evidence = {
        "workflow": "Sreevarshann-de-ml-soc-sponsor",
        "recipe_version": "0.1.0",
        "run_date": args.run_date,
        "mode": "sample",
        "inputs": {
            "targets": L.repo_relative(args.targets),
            "persona": L.repo_relative(args.persona),
            "liveness_output": L.repo_relative(args.liveness) if args.liveness else None,
            "posting_checks": L.repo_relative(args.checks) if args.checks else None,
            "sponsor_csv": L.repo_relative(args.sponsor_csv),
            "bls_csv": L.repo_relative(args.bls_csv),
            "formd_sample": formd_meta,
        },
        "persona": {
            "name": persona.get("candidate", {}).get("name") if isinstance(persona.get("candidate"), dict) else None,
            "fictional": True,
            "needs_sponsorship": L.labelled(needs_sponsorship, L.INPUT),
            "authorization": L.labelled(authorization, L.INPUT),
        },
        "timeline_gate": timeline,
        "definitions": {
            "sponsorship_tiers": f"proven: approvals >= {L.PROVEN_MIN_APPROVALS} and rate >= {L.PROVEN_MIN_RATE:g}; likely: approvals >= 1; possible: only denials; otherwise blocked",
            "tier_p": L.TIER_P,
            "fit": f"constant {L.FIT_NEUTRAL} (neutral)",
            "keyword_socs": L.KEYWORD_SOCS,
            "scorer_role_quality_weight": 0.0,
        },
        "counts": counts,
        "stop_conditions": stops,
        "todo_items": [L.PER_EMPLOYER_SOC_TODO],
        "roles": roles_out,
        "exit_code": exit_code,
    }
    return exit_code, evidence, scorer_roles


# ── human report ─────────────────────────────────────────────────────────

def _v(cell):
    if not isinstance(cell, dict) or "value" not in cell:
        return "—"
    v = cell["value"]
    if v is None:
        return "missing"
    if isinstance(v, float):
        return f"{v:,.0f}" if v >= 1000 else f"{v:g}"
    return str(v)


def render_report(ev: dict) -> str:
    c = ev["counts"]
    total = len(ev["roles"])
    tl = ev["timeline_gate"]
    o = []
    o.append("# Data/ML Engineer sponsor-and-SOC evidence pass\n")
    o.append("## Executive summary\n")
    o.append(
        f"This is the evidence report for one run of a job-search check built for a new graduate on a student visa "
        f"targeting Data Engineer and Machine Learning Engineer roles. It looked at {total} target companies and asked, for each: "
        f"does the company have a recorded history of visa sponsorship, have its sponsored job titles included data or ML work, "
        f"what does the government's occupation data say about the occupations those roles are usually filed under, and is the job posting still live.\n"
    )
    def n(k, one, many):
        return f"{c[k]} {one if c[k] == 1 else many}"
    o.append(
        f"Read it before spending application time on these companies. Of {total} companies, {n('scoreable', 'has', 'have')} enough evidence to be scored, "
        f"{n('held', 'is', 'are')} on hold until a posting is checked, and {n('blocked', 'is', 'are')} blocked because the sponsorship evidence is missing or the company name matched more than one record. "
        + ("The persona's visa timeline leaves room to keep applying. " if tl["open"] else "The persona's visa timeline gate is closed, so every role is skipped. ")
        + "Which occupation code a company actually files these roles under could not be checked: that needs government filing records this project does not have yet, so it is shown as proposed, never as a finding. "
        "Title matches and occupation codes are judgments, labelled as such.\n"
    )
    if ev["stop_conditions"]:
        o.append("**Run stopped or gated:** " + "; ".join(s["detail"] for s in ev["stop_conditions"]) + "\n")

    o.append("## Run record\n")
    o.append(f"- Run date: {ev['run_date']} · mode: {ev['mode']} · recipe version {ev['recipe_version']} · exit code {ev['exit_code']}")
    o.append(f"- Persona (fictional): {ev['persona']['name']} · needs sponsorship: {_v(ev['persona']['needs_sponsorship'])}")
    o.append(f"- Timeline gate: {tl['remaining_days']['value']} days remaining (90 − {tl['unemployment_days_used']['value']} used) vs buffer {tl['buffer_days']['value']} → factor {tl['factor']['value']} (your-input; user's formula)")
    for k, v in ev["inputs"].items():
        if k != "formd_sample":
            o.append(f"- {k}: `{v}`")
    o.append(f"- Form D: {ev['inputs']['formd_sample']['companies']} companies across {len(ev['inputs']['formd_sample']['files'])} shipped sample files (labelled sample)\n")

    o.append("Labels: **record** = read from a data file or tool output · **model-judgment** = a judgment (keyword match, title→SOC) · **your-input** = supplied or defined by the user · **proposed** = a check that has not run · **sample** = from the 200-company Form D sample.\n")

    o.append("## Per-company evidence\n")
    o.append("| # | Company | Status | Sponsor tier (record) | Approvals / denials / rate % (record) | Company-wide median salary (record) | DE/ML title on record (judgment) | Candidate SOC (judgment) | Per-employer SOC | Liveness |")
    o.append("|---|---|---|---|---|---|---|---|---|---|")
    for r in ev["roles"]:
        s = r["sponsor"]
        tm = r["title_match"] or {}
        socs = sorted({x for m in tm.get("matches", []) for x in m["candidate_socs"]["value"]})
        live = r["liveness"]
        live_txt = live["state"] if live["state"] == "held" else f"{live['state']} ({live['factor']['source']})"
        o.append(
            f"| {r['role_id']} | {r['company']['value']} | **{r['status']}** | "
            f"{_v(s.get('tier')) if s['status'] == 'found' else s['status']} | "
            f"{_v(s.get('approvals'))} / {_v(s.get('denials'))} / {_v(s.get('approval_rate_pct'))} | "
            f"{_v(s.get('median_salary_company_wide'))} | "
            f"{'yes' if tm.get('status') == 'matched' else ('—' if not tm else tm.get('status'))} | "
            f"{', '.join(socs) if socs else '—'} | proposed (not run) | {live_txt} |"
        )
    o.append("")
    o.append("Reasons:\n")
    for r in ev["roles"]:
        o.append(f"- {r['role_id']} {r['company']['value']}: {r['reason']}")
    o.append("")

    o.append("## Matched sponsored titles (judgment)\n")
    any_match = False
    for r in ev["roles"]:
        for m in (r["title_match"] or {}).get("matches", []):
            any_match = True
            o.append(f"- {r['company']['value']}: \"{m['title']['value']}\" ← keywords {', '.join(m['keywords']['value'])} → candidate SOC {', '.join(m['candidate_socs']['value'])}")
    if not any_match:
        o.append("- none")
    o.append("")

    o.append("## Occupation data for candidate SOC codes (record; national, not employer pay)\n")
    o.append("| SOC | O*NET code | Title | Job zone | National median wage | Cognitive-pivot score |")
    o.append("|---|---|---|---|---|---|")
    seen = set()
    for r in ev["roles"]:
        for soc, info in sorted(r["bls"].items()):
            for occ in info["occupations"]:
                key = occ["onet_soc_code"]["value"]
                if key in seen:
                    continue
                seen.add(key)
                o.append(f"| {soc} | {key} | {occ['title']['value']} | {_v(occ['job_zone'])} | {_v(occ['national_median_wage'])} | {_v(occ['cognitive_pivot_score'])} |")
    if not seen:
        o.append("| — | — | — | — | — | — |")
    o.append("")

    o.append("## Funding (report only; the scorer has no funding term)\n")
    o.append("| # | Company | Latest funding date (record) | Latest funding stage (record) | Form D sample |")
    o.append("|---|---|---|---|---|")
    for r in ev["roles"]:
        f = r["sponsor"].get("funding_csv") or {}
        fd = r["formd_sample"]
        fd_txt = "not in sample" if fd["status"] == "not_in_sample" else "; ".join(f"{x['value']['quarter']} filed {x['value']['date_filed']}" for x in fd["filings"])
        o.append(f"| {r['role_id']} | {r['company']['value']} | {_v(f.get('latest_funding_date'))} | {_v(f.get('latest_funding_stage'))} | {fd_txt} |")
    o.append("")

    o.append("## What this run cannot verify\n")
    o.append("- Which SOC code each employer files Data/ML roles under, and how many filings per code: " + L.PER_EMPLOYER_SOC_TODO)
    o.append("- Whether a sponsored title in the dataset is the same role as the posting; the dataset lists titles with no counts or dates.")
    o.append("- Which fiscal years the approval and denial counts cover; the dataset does not say.")
    o.append("- What an employer pays for a role: the salary figure is company-wide, and the occupation wages are national.")
    o.append("- Form D funding for companies outside the 200-company sample.")
    o.append("- Role quality in the score: the scorer weights role quality at 0 and reads no occupation data.")
    o.append("")
    return "\n".join(o) + "\n"


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--targets", required=True, type=Path)
    p.add_argument("--out-dir", required=True, type=Path)
    p.add_argument("--persona", type=Path, default=DEFAULT_PERSONA)
    p.add_argument("--liveness", type=Path, help="saved stdout of npm run ats:liveness")
    p.add_argument("--checks", type=Path, help="posting-checks.csv (date,url,status,checked_by)")
    p.add_argument("--run-date", default=date.today().isoformat())
    p.add_argument("--sponsor-csv", type=Path, default=L.SPONSOR_CSV)
    p.add_argument("--bls-csv", type=Path, default=L.BLS_CSV)
    p.add_argument("--formd-dir", type=Path, default=L.FORMD_SAMPLE_DIR)
    p.add_argument("--overwrite", action="store_true")
    args = p.parse_args(argv)

    if L.is_private_path(args.out_dir):
        print(f"halt: refusing to write under a private path: {L.repo_relative(args.out_dir)}", file=sys.stderr)
        return 2
    existing = [n for n in OUTPUTS if (args.out_dir / n).exists()]
    if existing and not args.overwrite:
        print(f"halt: {L.repo_relative(args.out_dir)} already has {', '.join(existing)} (pass --overwrite)", file=sys.stderr)
        return 2
    for path in (args.targets, args.persona):
        if not Path(path).is_file():
            print(f"halt: input file not found: {L.repo_relative(path)}", file=sys.stderr)
            return 2

    try:
        code, evidence, scorer_roles = build(args)
    except L.InputError as exc:
        print(f"halt: {exc}", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    for name in ("roles.json", "profile.json"):
        if (args.out_dir / name).exists():
            (args.out_dir / name).unlink()  # regenerated below, or intentionally absent
    (args.out_dir / "evidence.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.out_dir / "report.md").write_text(render_report(evidence), encoding="utf-8")
    if code == 0 and scorer_roles:
        (args.out_dir / "roles.json").write_text(json.dumps(scorer_roles, indent=2) + "\n", encoding="utf-8")
        (args.out_dir / "profile.json").write_text(json.dumps({"authorization": evidence["persona"]["authorization"]["value"]}, indent=2) + "\n", encoding="utf-8")

    c = evidence["counts"]
    print(f"de-ml-soc-sponsor: {len(evidence['roles'])} targets → scoreable {c['scoreable']} · held {c['held']} · blocked {c['blocked']} · skip_gated {c['skip_gated']} · stopped {c['stopped']}")
    tl = evidence["timeline_gate"]
    print(f"timeline gate: remaining {tl['remaining_days']['value']} vs buffer {tl['buffer_days']['value']} → factor {tl['factor']['value']}")
    for s in evidence["stop_conditions"]:
        print(f"STOP ({s['condition']}): {s['detail']}")
    out = L.repo_relative(args.out_dir)
    print(f"wrote {out}/evidence.json, {out}/report.md" + (f", {out}/roles.json, {out}/profile.json" if code == 0 and scorer_roles else ""))
    if code == 0 and scorer_roles:
        print(f"next: npm run score -- {out}/roles.json --profile {out}/profile.json --out-dir {out}")
    return code


if __name__ == "__main__":
    sys.exit(main())
