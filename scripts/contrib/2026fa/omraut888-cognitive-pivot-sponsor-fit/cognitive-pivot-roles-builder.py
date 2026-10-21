#!/usr/bin/env python3
"""cognitive-pivot-roles-builder.py — turn title-to-soc.py matches into the
role-evidence records scripts/score/role-scorer.mjs consumes.

Recipe: recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md (gates G1, G2, G4).

Each output role carries the three votes the scorer reads — sponsorship, fit,
role_quality — as {p, source}, plus BOTH gates written out explicitly:

  sponsorship.p   approvals / (approvals + denials) from the 80 Days CSV row    record
  fit.p           1.0 when title-to-soc.py phrase-matched a sponsored title     model-judgment
                  (which O*NET phrases count as SOC-identifying was a judgment)
  role_quality.p  the target SOC's cognitive_pivot_score, min-max normalized    record
                  over every SOC row in the compact table that HAS a score
  liveness        factor 1, source "your-input: NOT verified — …"  (no ats:liveness run)
  timeline        factor 1, source "your-input: not applicable …"  (no persona clock)

Why the gates are written out: role-scorer.mjs does `num(role.liveness?.factor) ?? 1`
and the same for timeline, so an ABSENT gate silently behaves like a passed one and
liveness is labeled "record". Writing factor 1 with an explicit NOT-verified source
keeps the arithmetic identical but makes the gap visible in every audit trace; the
downgrade of Apply happens later, in cognitive-pivot-report.py — not here, and not
in the scorer's gate math.

Stops (exit 3, no roles file written):
  missing: no-cognitive-pivot-score   target SOC has a blank score (G2) — never 0
  missing: no-title-match             the match file has zero matched companies (G1)
A company whose approvals+denials is 0 or unparseable is excluded and listed as
`missing: no-sponsorship-record` — its sponsorship.p is never defaulted.

Usage (one SOC, or several pooled on the SAME min/max scale — repeat --soc/--matches in pairs):
  python3 scripts/contrib/2026fa/omraut888-cognitive-pivot-sponsor-fit/cognitive-pivot-roles-builder.py --soc 15-1221.00 \\
    --matches course/2026fa/submissions/omraut888/run/soc-match-15-1221.00/soc-match-output.json --out course/2026fa/submissions/omraut888/run/roles.json
"""
import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

COMPACT_CSV = "data/bls/compact/soc_occupation_compact.csv"

LIVENESS_SOURCE = "your-input: NOT verified — no ats:liveness check run for this mode"
TIMELINE_SOURCE = "your-input: not applicable to this mode, no persona timeline modeled"


class Stop(Exception):
    """A recipe stop condition. str(e) is the `missing: <reason>` line."""


def parse_float(x):
    try:
        v = float(str(x).strip())
    except (TypeError, ValueError):
        return None
    return v if v == v else None  # reject NaN


def load_pivot_scale(compact_csv: str, soc_code: str) -> dict:
    """Return the target SOC's raw score plus the observed min/max over all
    scored rows. Raises Stop if the SOC is absent or its score is blank."""
    scores, target = [], None
    with open(compact_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            v = parse_float(row.get("cognitive_pivot_score"))
            if v is not None:
                scores.append((v, row["onet_soc_code"]))
            if row["onet_soc_code"] == soc_code:
                target = (row, v)
    if target is None:
        raise Stop(f"missing: no-soc-row — {soc_code} is not in {compact_csv}")
    row, raw = target
    if raw is None:
        raise Stop(f"missing: no-cognitive-pivot-score — {soc_code} ({row['title']}) has a blank "
                   f"cognitive_pivot_score in {compact_csv}; refusing to substitute 0 or an average")
    lo, hi = min(scores), max(scores)
    return {"soc_code": soc_code, "title": row["title"], "raw": raw,
            "min": lo[0], "min_soc": lo[1], "max": hi[0], "max_soc": hi[1],
            "scored_rows": len(scores)}


def normalize(raw: float, lo: float, hi: float) -> float:
    if hi <= lo:
        raise Stop(f"missing: degenerate-scale — min {lo} >= max {hi}")
    return round((raw - lo) / (hi - lo), 4)


def sponsorship_vote(approvals, denials):
    """approvals / (approvals + denials), or None when there is no record."""
    a, d = parse_float(approvals), parse_float(denials)
    if a is None or d is None or a < 0 or d < 0 or a + d == 0:
        return None
    return {"p": round(a / (a + d), 4), "source": "record",
            "approvals": a, "denials": d, "n": a + d}


def build_roles(matches: dict, scale: dict) -> tuple[list, list]:
    if matches.get("soc_code") != scale["soc_code"]:
        raise Stop(f"missing: soc-mismatch — match file is for {matches.get('soc_code')}, "
                   f"target is {scale['soc_code']}")
    if not matches.get("matches"):
        raise Stop(f"missing: no-title-match — no sponsor title matched {scale['soc_code']}")
    rq = normalize(scale["raw"], scale["min"], scale["max"])
    roles, excluded = [], []
    for i, m in enumerate(matches["matches"], 1):
        spons = sponsorship_vote(m.get("total_approvals"), m.get("total_denials"))
        if spons is None:
            excluded.append({"company": m.get("company_name"), "reason": "missing: no-sponsorship-record"})
            continue
        titles = [t["title"].strip() for t in m["matched_titles"]]
        phrases = sorted({p for t in m["matched_titles"] for p in t["matched_phrases"]})
        roles.append({
            "role_id": f"{scale['soc_code']}-{i:02d}",
            "company": m.get("company_name"),
            "title": "; ".join(titles),
            "soc_code": scale["soc_code"],
            "soc_match_is_proxy": "phrase match of a sponsored H-1B title to O*NET alternate titles — "
                                  "not a DOL/BLS SOC classification",
            "sponsorship": spons,
            "fit": {"p": 1.0, "source": "model-judgment",
                    "evidence": f"title-to-soc.py phrase match: {', '.join(phrases)}"},
            "role_quality": {"p": rq, "source": "record",
                             "raw_cognitive_pivot_score": scale["raw"],
                             "normalization": f"(raw - {scale['min']}) / ({scale['max']} - {scale['min']}); "
                                              f"min/max over {scale['scored_rows']} scored SOC rows"},
            "liveness": {"factor": 1, "source": LIVENESS_SOURCE, "checked": False},
            "timeline": {"factor": 1, "source": TIMELINE_SOURCE, "modeled": False},
        })
    return roles, excluded


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--soc", required=True, action="append",
                    help="repeatable; pair each --soc with a --matches, in order")
    ap.add_argument("--matches", required=True, action="append")
    ap.add_argument("--out", required=True)
    ap.add_argument("--compact", default=COMPACT_CSV)
    args = ap.parse_args(argv)
    if len(args.soc) != len(args.matches) or len(set(args.soc)) != len(args.soc):
        print("STOP: give one --matches per --soc, and each SOC once", file=sys.stderr)
        return 2
    try:
        # G2 for EVERY target before anything else — a blank score stops the whole
        # run; one group is never silently dropped from a pooled comparison.
        scales = [load_pivot_scale(args.compact, soc) for soc in args.soc]
        if len({(s["min"], s["max"], s["scored_rows"]) for s in scales}) != 1:
            raise Stop("missing: scale-mismatch — targets were normalized on different ranges")
        groups = []
        for scale, mpath in zip(scales, args.matches):
            matches = json.loads(Path(mpath).read_text())
            roles, excluded = build_roles(matches, scale)
            groups.append((scale, matches, roles, excluded))
    except Stop as e:
        print(f"STOP: {e}", file=sys.stderr)
        return 3
    scale = scales[0]  # shared range (asserted above)
    roles = [r for g in groups for r in g[2]]
    excluded = [x for g in groups for x in g[3]]
    out = {
        "_builder": "cognitive-pivot-roles-builder",
        "recipe": "recipes/cases/2026fa/omraut888-cognitive-pivot-sponsor-fit.md",
        "generated": date.today().isoformat(),
    }
    if len(groups) == 1:  # single-SOC shape, unchanged from the first run
        out["soc_target"] = {k: scale[k] for k in ("soc_code", "title", "raw")}
    else:
        out["soc_targets"] = [{"soc_code": s["soc_code"], "title": s["title"], "raw": s["raw"],
                               "role_quality_p": normalize(s["raw"], s["min"], s["max"]),
                               "companies_in_match_file": len(m["matches"]), "roles": len(r),
                               "excluded": len(x), "matches_file": mp}
                              for (s, m, r, x), mp in zip(groups, args.matches)]
    out["pivot_scale"] = {k: scale[k] for k in ("min", "min_soc", "max", "max_soc", "scored_rows")}
    out["inputs"] = ({"matches": args.matches[0], "compact": args.compact} if len(groups) == 1
                     else {"matches": args.matches, "compact": args.compact})
    out["companies_in_match_file"] = (len(groups[0][1]["matches"]) if len(groups) == 1
                                      else {g[0]["soc_code"]: len(g[1]["matches"]) for g in groups})
    out["excluded"] = excluded
    out["roles"] = roles
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, indent=2))
    for s, _, r, _ in groups:
        print(f"SOC {s['soc_code']} cognitive_pivot_score {s['raw']} → role_quality.p "
              f"{r[0]['role_quality']['p'] if r else '—'} (scale {s['min']}–{s['max']}, "
              f"{s['scored_rows']} scored rows)")
    print(f"  {len(roles)} roles written, {len(excluded)} excluded; liveness + timeline written as "
          f"explicit your-input factor 1 (NOT verified)")
    print(f"  {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
