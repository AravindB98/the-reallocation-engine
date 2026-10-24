#!/usr/bin/env python3
"""Phase 1b feasibility probe — THROWAWAY. Read-only over repo data.

Prints a Markdown report to stdout. Every number here is computed from the files.
Never prints phone, website, address, executive_officers, board_directors, or
related_persons fields.

Run from repo root:  python3 course/2026fa/submissions/meenuviji/recon/probe/probe.py
"""
import ast
import collections
import csv
import glob
import json
import random
import re
import statistics
import sys
from datetime import datetime, timezone

F80 = "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
FBLS = "data/bls/compact/soc_occupation_compact.csv"
FFORMD = "data/sec/form-d/processed/sample/*.sample.json"

# TEMPORARY keyword rule, exactly as specified (case-insensitive raw substring on the title).
DATA_KW = ["data", "analyst", "analytics", "business intelligence", " bi ", "bi engineer",
           "machine learning", " ml ", "ml engineer", " ai ", "ai engineer"]
SENIOR_KW = ["senior", "sr", "lead", "staff", "principal", "director", "manager", "head", "vp"]
ROMAN_END = re.compile(r"\b(ii|iii|iv)\s*$", re.IGNORECASE)

BLS_KW = ["data scientist", "data analyst", "business intelligence", "data engineer",
          "data warehous", "database architect", "machine learning", "statistician"]

SUFFIXES = {"INC", "LLC", "CORP", "CORPORATION", "LTD", "CO", "LP"}


def out(s=""):
    print(s)


def is_data(t):
    t = t.lower()
    return any(k in t for k in DATA_KW)


def is_data_padded(t):
    t = " " + t.lower() + " "
    return any(k in t for k in DATA_KW)


def senior_hits(t):
    tl = t.lower()
    hits = [k for k in SENIOR_KW if k in tl]
    if ROMAN_END.search(t):
        hits.append("roman-end")
    return hits


def fnum(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def norm80(name):
    """Upper-case, strip punctuation to spaces, drop trailing suffix TOKENS repeatedly,
    then lower-case alphanumeric-only."""
    toks = re.sub(r"[^A-Za-z0-9]+", " ", name.upper()).split()
    while toks and toks[-1] in SUFFIXES:
        toks.pop()
    return re.sub(r"[^a-z0-9]", "", "".join(toks).lower())


def md_table(headers, rows):
    out("| " + " | ".join(headers) + " |")
    out("|" + "---|" * len(headers))
    for r in rows:
        out("| " + " | ".join(str(c).replace("|", "\\|") for c in r) + " |")
    out()


def main():
    out("# PROBE-REPORT — Phase 1b feasibility probe (throwaway)")
    out()
    out(f"Generated {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} by `probe.py` in this folder. "
        "Every number below was computed by that script; nothing is estimated. "
        "Contact/person fields were never printed.")
    out()

    rows = list(csv.DictReader(open(F80, encoding="utf-8")))
    sp = [r for r in rows if (r["top_job_titles_sponsored"] or "").strip()]

    # ── A1 parse ─────────────────────────────────────────────────────────
    out("## A. `top_job_titles_sponsored` (rows with sponsorship data)")
    out()
    out(f"- 80 Days rows total: {len(rows)}; rows with non-empty `top_job_titles_sponsored`: {len(sp)}")
    parsed, fails = {}, []
    for r in sp:
        raw = r["top_job_titles_sponsored"]
        try:
            v = ast.literal_eval(raw)
            if not isinstance(v, list) or not all(isinstance(x, str) for x in v):
                raise ValueError(f"not a list of str: {type(v).__name__}")
            parsed[r["company_name"]] = (r, v)
        except Exception as e:  # noqa: BLE001 — throwaway probe, record every failure
            fails.append((r["company_name"], raw, repr(e)))
    out()
    out("### A1. Parse with `ast.literal_eval`")
    out(f"- parsed OK: {len(parsed)}; failed: {len(fails)}")
    for name, raw, err in fails[:3]:
        out(f"  - `{name}` → `{raw[:200]}` — {err}")
    out()

    # ── A2 length distribution ──────────────────────────────────────────
    lens = collections.Counter(len(v) for _, v in parsed.values())
    out("### A2. List length distribution")
    out(f"- min {min(lens)}, max {max(lens)}; longer than 5 ever? **{'YES' if max(lens) > 5 else 'NO'}**")
    md_table(["length", "companies"], sorted(lens.items()))
    all_titles = [t for _, v in parsed.values() for t in v]
    out(f"- total title strings: {len(all_titles)}; distinct (exact string): {len(set(all_titles))}")
    out()

    # ── A3 classification ───────────────────────────────────────────────
    out("### A3. TEMPORARY keyword rule — company-level counts")
    out("Rule applied exactly as specified: case-insensitive **raw substring** on the title, no padding. "
        "Consequences visible in A4: `sr` also matches inside words (e.g. `SRE`), `head` inside `ahead`, "
        "`data` inside `database`/`metadata`; ` bi `/` ml `/` ai ` (space-delimited) cannot match at the very "
        "start or end of a title.")
    out()
    any_data = all_senior = some_junior = 0
    data_titles = []
    for name, (r, v) in parsed.items():
        dt = [t for t in v if is_data(t)]
        data_titles += dt
        if dt:
            any_data += 1
            if all(senior_hits(t) for t in dt):
                all_senior += 1
            else:
                some_junior += 1
    md_table(["measure", "companies"], [
        ["companies with ≥1 data-family title", any_data],
        ["…whose data-family titles are ALL senior", all_senior],
        ["…with ≥1 NON-senior data-family title", some_junior],
    ])
    padded_titles = sum(1 for t in all_titles if is_data_padded(t))
    out(f"- data-family title strings (raw rule): {len(data_titles)} of {len(all_titles)}. "
        f"Side measurement, NOT the rule: if the title were space-padded at both ends, {padded_titles} would match "
        f"({padded_titles - len(data_titles)} more).")
    senior_kw_counts = collections.Counter(k for t in data_titles for k in senior_hits(t))
    out("- which senior keywords fired on data-family titles (a title can fire several):")
    md_table(["keyword", "hits"], senior_kw_counts.most_common())

    # ── A4 samples ──────────────────────────────────────────────────────
    out("### A4. 25 random data-family titles (seed 42) — judge the rule by hand")
    rnd = random.Random(42)
    sample = rnd.sample(data_titles, min(25, len(data_titles)))
    md_table(["#", "title", "label", "senior keywords hit"],
             [[i + 1, t, "senior" if senior_hits(t) else "non-senior", ", ".join(senior_hits(t)) or "—"]
              for i, t in enumerate(sample)])
    out("Sampling is over title occurrences (a title that appears at many companies is proportionally more likely).")
    out()
    out("### A4b. 30 most common data-family titles (exact string)")
    md_table(["title", "count", "label"],
             [[t, c, "senior" if senior_hits(t) else "non-senior"]
              for t, c in collections.Counter(data_titles).most_common(30)])

    # ── A5 approvals ────────────────────────────────────────────────────
    out("### A5. Approvals among companies with ≥1 data-family title")
    appr, rate100_le3, bad = [], 0, 0
    for name, (r, v) in parsed.items():
        if not any(is_data(t) for t in v):
            continue
        a, rt = fnum(r["Total Approvals"]), fnum(r["Approval_Rate"])
        if a is None:
            bad += 1
            continue
        appr.append(a)
        if rt is not None and rt == 100.0 and a <= 3:
            rate100_le3 += 1
    q = statistics.quantiles(appr, n=4, method="inclusive")
    md_table(["stat", "Total Approvals"], [
        ["n", len(appr)], ["min", min(appr)], ["Q1", q[0]], ["median", q[1]], ["Q3", q[2]], ["max", max(appr)],
    ])
    out(f"- unparseable Total Approvals in this group: {bad}")
    out(f"- companies with Approval_Rate = 100 **and** Total Approvals ≤ 3: **{rate100_le3}** of {len(appr)}")
    out("- quartiles: Python `statistics.quantiles(n=4, method='inclusive')`.")
    out()

    # ── B BLS ───────────────────────────────────────────────────────────
    out("## B. BLS compact rows matching data-family keywords")
    out(f"Keywords (case-insensitive substring on `title` or `alternate_titles_sample`): {', '.join(BLS_KW)}")
    out()
    b = list(csv.DictReader(open(FBLS, encoding="utf-8")))
    hits = []
    for r in b:
        hay = (r["title"] + " " + r["alternate_titles_sample"]).lower()
        kws = [k for k in BLS_KW if k in hay]
        if kws:
            where = "title" if any(k in r["title"].lower() for k in kws) else "alt-titles only"
            hits.append([r["onet_soc_code"], r["bls_soc_code"], r["title"], r["annual_median_wage"] or "(empty)",
                         ", ".join(kws), where])
    md_table(["onet_soc_code", "bls_soc_code", "title", "annual_median_wage", "keywords hit", "matched in"], hits)
    out(f"- rows matched: {len(hits)} of {len(b)}")
    out("- note: `alternate_titles_sample` holds only a sample of alternate titles (column name), so absence here is not proof of absence in O*NET.")
    out()

    # ── C Form D ────────────────────────────────────────────────────────
    out("## C. Form D samples")
    recs = []
    for f in sorted(glob.glob(FFORMD)):
        for c in json.load(open(f, encoding="utf-8"))["companies"]:
            recs.append(c)
    out(f"- records: {len(recs)}")
    out()
    out("### C1. `company.industry`")
    md_table(["industry", "records"], collections.Counter(c["company"].get("industry") for c in recs).most_common())
    out("### C2. `company.entity_type`")
    md_table(["entity_type", "records"], collections.Counter(c["company"].get("entity_type") for c in recs).most_common())

    out("### C3. Name match: Form D `company_name_normalized` vs normalized 80 Days names")
    out("80 Days normalization: upper-case → punctuation to spaces → drop trailing tokens in "
        "{INC, LLC, CORP, CORPORATION, LTD, CO, LP} repeatedly → lower-case alphanumeric-only. "
        "Suffixes are removed as whole words *before* joining, mirroring `normalize_company_name` in "
        "`scripts/sec/sec-all-quarters.py`, so a name like `COSTCO` is not cut to `cost`.")
    out()
    idx = collections.defaultdict(list)
    for r in rows:
        idx[norm80(r["company_name"])].append(r)
    collisions = sum(1 for k, v in idx.items() if len(v) > 1)
    out(f"- 80 Days distinct normalized keys: {len(idx)} from {len(rows)} names; keys shared by >1 company: {collisions}")
    seen, matches = set(), []
    for c in recs:
        key = c["company"].get("company_name_normalized") or ""
        if not key or key in seen:
            continue
        seen.add(key)
        for r in idx.get(key, []):
            has_sp = bool((r["Total Approvals"] or "").strip())
            matches.append([c["company"]["name"], key, r["company_name"], "YES" if has_sp else "no",
                            r["Total Approvals"] or "—", r["Approval_Rate"] or "—"])
    out(f"- distinct Form D normalized keys: {len(seen)} (from {len(recs)} records)")
    out(f"- **matches: {len(matches)}** (pairs); with sponsorship data: **{sum(1 for m in matches if m[3] == 'YES')}**")
    out()
    md_table(["Form D name", "company_name_normalized", "80 Days name", "sponsorship?", "Total Approvals", "Approval_Rate"],
             matches)


if __name__ == "__main__":
    sys.exit(main())
