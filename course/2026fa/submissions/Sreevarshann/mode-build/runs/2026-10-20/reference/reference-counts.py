"""Reference counts for the domain justification (offline, tracked public data only)."""
import collections
import csv
import re
import sys

sys.path.insert(0, "scripts/contrib/2026fa/Sreevarshann-de-ml-soc-sponsor")
import lookup as L

rows = list(csv.DictReader(open(L.SPONSOR_CSV, newline="", encoding="utf-8")))
spons = [r for r in rows if (r["Total Approvals"] or "").strip()]
soc_re = re.compile(r"\b\d{2}-\d{4}\b")
print("sponsor table rows:", len(rows))
print("rows with sponsorship fields:", len(spons))
print("rows with an NN-NNNN SOC-like token in any column (phone, zip_code excluded):",
      sum(1 for r in rows if any(soc_re.search(v or "") for k, v in r.items() if k not in ("phone", "zip_code"))))
lens = collections.Counter()
for r in spons:
    titles, err = L.parse_titles(r["top_job_titles_sponsored"])
    lens["unparseable" if err else len(titles)] += 1
print("sponsored-title list length (companies):", dict(sorted(lens.items(), key=lambda kv: str(kv[0]))))

idx = L.load_sponsor_index()
tiers = collections.Counter()
matched = collections.Counter()
for key, rs in idx.items():
    if len(rs) != 1:
        continue
    s = L.sponsor_lookup(rs[0]["company_name"], idx)
    if s["status"] != "found":
        continue
    tiers[s["tier"]["value"]] += 1
    if L.title_match(rs[0]["top_job_titles_sponsored"])["status"] == "matched":
        matched[s["tier"]["value"]] += 1
print("tiers (single-match companies):", dict(tiers))
print("companies with a DE/ML title match (model-judgment), by tier:", dict(matched), "total", sum(matched.values()))
print("names normalizing to more than one row:", sum(1 for rs in idx.values() if len(rs) > 1))

for name in ["PATHAI INC", "PATHRAI INC", "HUMAN INC", "REDDIT INC"]:
    r = next(x for x in rows if x["company_name"] == name)
    print(f"{name}: approvals {r['Total Approvals']} denials {r['Total Denials']} rate {r['Approval_Rate']} "
          f"median_salary {r['median_salary_offered']} titles {r['top_job_titles_sponsored']} "
          f"latest_funding {r['latest_funding_date']} {r['latest_funding_stage']}")
