#!/usr/bin/env python3
"""
find_da_boards.py: step 0 of the DA mode. Which funded H-1B sponsors have a public job board?

1. From the shipped 80-Days CSV (record), keep companies with a funding date, >= 1 H-1B approval,
   and a title in `top_job_titles_sponsored` that config.da.json classifies as `data_analyst`.
2. Guess board tokens from each company's name and website (your-input heuristic) and probe the
   public Greenhouse and Lever job-board APIs. The two hosts are named here and in the recipe;
   no other host is called.
3. Write an ats:scan config (portals YAML) for the companies whose board answered, plus a JSON report.

A token that answers is NOT proof the board belongs to that company. A human confirms (gate G1b).

Run from the repo root:
  python3 scripts/contrib/2026fa/yudanzhou-is-funded-sponsor-triage/find_da_boards.py --out-yml data/ats/portals.yml --out-json <dir>/da-boards.json
"""
import argparse
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import triage  # noqa: E402

HOSTS = {
    "greenhouse": ("https://boards-api.greenhouse.io/v1/boards/{t}/jobs", "https://job-boards.greenhouse.io/{t}"),
    "lever": ("https://api.lever.co/v0/postings/{t}?mode=json", "https://jobs.lever.co/{t}"),
}
STRIP = re.compile(r"\b(inc|llc|ltd|technologies|technology|labs|health|group|integrated|media)\b")


def da_sponsors(csv_path, config):
    rows, _, _ = triage.load_companies(csv_path)
    fams = config["role_families"]
    out = []
    for r in rows:
        a = triage.to_count(r["Total Approvals"])
        if not a or not r["latest_funding_date"].strip():
            continue
        hit = set()
        for t in triage.parse_titles(r["top_job_titles_sponsored"]):
            hit.update(triage.classify(t, fams))
        if "data_analyst" in hit:
            out.append({"company": r["company_name"], "approvals": a, "website": r["website"],
                        "stage": r["latest_funding_stage"], "funding_date": r["latest_funding_date"], "source": "record"})
    return sorted(out, key=lambda x: -x["approvals"])


def tokens(name, website):
    t = [re.sub(r"[^a-z0-9]", "", STRIP.sub("", name.lower())),
         re.sub(r"[^a-z0-9]", "", name.lower().replace(" inc", "").replace(" llc", ""))]
    if website:
        t.append(re.sub(r"[^a-z0-9]", "", website.split(".")[0].lower()))
    seen, out = set(), []
    for x in t:
        if x and x not in seen:
            seen.add(x); out.append(x)
    return out


def probe(token):
    for prov, (api, _) in HOSTS.items():
        try:
            req = urllib.request.Request(api.format(t=token), headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=10) as r:
                body = json.loads(r.read())
            jobs = body.get("jobs", []) if isinstance(body, dict) else body
            if isinstance(jobs, list):
                return prov, len(jobs)
        except Exception:
            continue
    return None, 0


def main(argv=None):
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", default=triage.DEFAULT_CSV)
    ap.add_argument("--config", default=os.path.join(HERE, "config.da.json"))
    ap.add_argument("--out-yml", required=True)
    ap.add_argument("--out-json", required=True)
    a = ap.parse_args(argv)
    try:
        sponsors = da_sponsors(a.csv, triage.load_json(a.config))
    except triage.GateError as e:
        print(f"✗ STOP: {e}", file=sys.stderr)
        return 2
    found = []
    for s in sponsors:
        for t in tokens(s["company"], s["website"]):
            prov, n = probe(t)
            if prov:
                found.append(dict(s, provider=prov, token=t, jobs_listed=n, careers_url=HOSTS[prov][1].format(t=t),
                                  ownership="unconfirmed — guessed from name"))
                break
    y = ["# DA mode — written by find_da_boards.py. Board tokens are guessed from names: confirm ownership (gate G1b).",
         "title_filter:", "  positive:"]
    y += [f'    - "{k}"' for k in ["Data Analyst", "Analytics", "Business Intelligence", "BI Analyst", "Business Analyst",
                                   "Product Analyst", "Insights Analyst", "Reporting Analyst"]]
    y += ["  negative:"] + [f'    - "{k}"' for k in ["Intern", "Senior", "Sr.", "Staff", "Principal", "Director", "Manager", "Lead", "Head of"]]
    y += ["location_filter:", "  always_allow:", '    - "United States"', '    - "USA"', "  allow:", '    - "United States"',
          '    - "USA"', '    - "Remote"', "tracked_companies:"]
    for f in found:
        y += [f"  - name: {f['company']}", "    enabled: true", f"    provider: {f['provider']}", f"    careers_url: {f['careers_url']}"]
    os.makedirs(os.path.dirname(os.path.abspath(a.out_yml)), exist_ok=True)
    with open(a.out_yml, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(y) + "\n")
    os.makedirs(os.path.dirname(os.path.abspath(a.out_json)), exist_ok=True)
    with open(a.out_json, "w", encoding="utf-8", newline="\n") as fh:
        json.dump({"da_sponsors": len(sponsors), "with_board": len(found), "boards": found,
                   "no_board_found": [s["company"] for s in sponsors if s["company"] not in {f["company"] for f in found}]}, fh, indent=2)
    print(f"✓ {len(sponsors)} funded DA sponsors (record) · {len(found)} answered a Greenhouse/Lever board probe → {a.out_yml}")
    for f in found:
        print(f"  {f['company']:<28} {f['provider']:<10} {f['token']:<14} {f['jobs_listed']:>4} jobs  [ownership unconfirmed]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
