#!/usr/bin/env python3
"""verify-run.py — independent check of one opt-countdown run (stdlib only).

Does not import the mode's code. Re-derives, from the raw inputs:
  1. every sponsorship record (Python csv module, not the mode's CSV parser),
  2. every runway / slack / timeline number,
  3. every composite, from roles.json and the weights the scorer wrote,
  4. the summary counts, from the per-role entries.
Usage: python3 verify-run.py <out-dir> <persona.json> <sponsors.csv>
Exit 0 when every check agrees, 1 otherwise.
"""
import csv, json, sys
from datetime import date

out, persona_p, csv_p = sys.argv[1:4]
log = json.load(open(f"{out}/opt-countdown-log.json"))
scores = json.load(open(f"{out}/role-scores.json"))
roles_in = {r["role_id"]: r for r in json.load(open(f"{out}/roles.json"))}
persona = json.load(open(persona_p))
rows = {r["company_name"].strip().upper(): r for r in csv.DictReader(open(csv_p, newline="", encoding="utf-8"))}
fails = 0

def check(ok, what):
    global fails
    print(("PASS " if ok else "FAIL ") + what)
    fails += 0 if ok else 1

# 1. sponsorship records
for e in log["roles"]:
    row = rows.get(e["csv_lookup"]["name_used"])
    if e["sponsorship"]["status"] != "ok":
        blank = row is None or row["Total Approvals"] == ""
        check(blank, f'{e["role_id"]}: mode says {e["sponsorship"]["reason"]}; CSV row {"absent" if row is None else "blank" if blank else "PRESENT"}')
        continue
    a, rate = float(row["Total Approvals"]), float(row["Approval_Rate"])
    p = round(rate / 100 * min(1, a / 20), 3)
    check(e["sponsorship"]["record"]["total_approvals"] == a and e["sponsorship"]["p"] == p,
          f'{e["role_id"]}: approvals {a:.0f}, rate {rate:.2f}% → p {p} (mode: {e["sponsorship"]["p"]})')

# 2. runway and timeline
v = persona["visa"]
as_of, opt_end = date.fromisoformat(persona["as_of"]), date.fromisoformat(v["opt_end_date"])
runway = min((opt_end - as_of).days, v["unemployment_ceiling"] - v["unemployment_days_used"] - v["buffer_target"])
check(log["runway"]["days"] == runway, f"runway {runway} days (mode: {log['runway']['days']})")
for e in log["roles"]:
    if e["timeline"]["status"] != "ok": continue
    slack = runway - e["hiring_lag"]["days"]
    f = 0 if slack < 0 else min(1, 0.5 + slack / 60)
    check(abs(e["timeline"]["factor"] - round(f, 3)) < 1e-9, f'{e["role_id"]}: slack {slack} → timeline {round(f, 3)}')

# 3. composites, recomputed from roles.json with the scorer's own weights
w = scores["config"]["weights"]
for s in scores["roles"]:
    r = roles_in[s["role_id"]]
    comp = (r["sponsorship"]["p"] * w["sponsorship"] + r["fit"]["p"] * w["fit"]) * r["liveness"]["factor"] * r["timeline"]["factor"]
    check(abs(comp - s["composite"]) < 5e-4, f'{s["role_id"]}: composite {comp:.4f} (scorer: {s["composite"]}) → {s["recommendation"]}')

# 4. summary counts
rec = [e.get("decision", {}).get("recommendation") for e in log["roles"]]
pre = sum(1 for e in log["roles"] if e.get("gated_before_scoring"))
blocked = sum(1 for e in log["roles"] if e.get("blocked"))
sm = log["summary"]
check(sm["blocked"] == blocked and sm["gated_before_scoring"] == pre and sm["apply"] == rec.count("Apply")
      and sm["consider"] == rec.count("Consider") and sm["skip"] == rec.count("Skip") - pre
      and sm["evaluated"] == len(log["roles"]) == sm["scored"] + pre + blocked,
      f"summary {json.dumps(sm)} matches the per-role entries")
print(f"\n{'ALL CHECKS AGREE' if not fails else f'{fails} CHECK(S) DISAGREE'}")
sys.exit(1 if fails else 0)
