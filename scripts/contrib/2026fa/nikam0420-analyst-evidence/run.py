#!/usr/bin/env python3
"""Local-only analyst sponsorship evidence audit; never a visa or Apply decision."""
import argparse, ast, csv, hashlib, json, shlex, subprocess, sys, tempfile
from pathlib import Path
from datetime import datetime, timezone
ROOT = Path(__file__).resolve().parents[4]
DEFAULT = ROOT / "data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv"
SAFE = ["company_name", "city", "state", "Total Approvals", "Total Denials", "Approval_Rate", "median_salary_offered", "top_job_titles_sponsored"]
NULLS = {"", "null", "none", "nan", "n/a"}
def present(v): return str(v or "").strip().lower() not in NULLS
def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", type=Path, default=DEFAULT)
    ap.add_argument("--out-dir", type=Path, required=True)
    args=ap.parse_args()
    if not args.csv.is_file():
        print("BLOCKED: source CSV does not exist; no score or report produced.", file=sys.stderr); return 2
    with args.csv.open(encoding="utf-8-sig", newline="") as f:
        reader=csv.DictReader(f)
        if not set(SAFE).issubset(reader.fieldnames or []):
            print("BLOCKED: required source columns missing; no score or report produced.", file=sys.stderr); return 2
        rows=[{k:row.get(k, "") for k in SAFE} for row in reader]
    if not rows:
        print("BLOCKED: source has no company rows; no score or report produced.", file=sys.stderr); return 2
    hfields=SAFE[3:]
    populated=[x for x in rows if any(present(x[k]) for k in hfields)]
    hits=[]; malformed=0
    for index,row in enumerate(rows, start=1):
        raw=row["top_job_titles_sponsored"]
        if not present(raw): continue
        try:
            titles=ast.literal_eval(raw)
            if not isinstance(titles,list) or not all(isinstance(t,str) for t in titles): raise ValueError()
        except (SyntaxError,ValueError): malformed+=1; continue
        matched=[t for t in titles if any(term in t.casefold() for term in ("data analyst", "business intelligence", "analytics engineer", "bi analyst"))]
        if matched:
            hits.append({"source_record_number":index,"company":row["company_name"],"state":row["state"],"approvals_raw":row["Total Approvals"],"matched_titles":matched})
    # Reject malformed evidence rather than silently treating it as a negative signal.
    if malformed:
        print(f"BLOCKED: {malformed} malformed title list(s); no score or report produced.",file=sys.stderr); return 2
    # Existing maintained script is executed against ALL rows, with only safe columns.
    with tempfile.TemporaryDirectory(prefix="analyst-audit-") as tmp:
        safe=Path(tmp)/"company-evidence.csv"
        with safe.open("w",newline="") as f:
            writer=csv.DictWriter(f,fieldnames=SAFE); writer.writeheader();writer.writerows(rows)
        cmd=[sys.executable,str(ROOT/"scripts/sec/validate-h1b-join-sample.py"),str(safe),"--sample-size","20","--review-count","0","--seed","80"]
        proc=subprocess.run(cmd,text=True,capture_output=True)
        if proc.returncode:
            print("BLOCKED: maintained H-1B validator failed.",file=sys.stderr);print(proc.stderr,file=sys.stderr);return 2
        print("MAINTAINED COMMAND: " + shlex.join(cmd))
        print("MAINTAINED SCRIPT STDOUT:")
        print(proc.stdout, end="")
        audit=safe.with_name("company-evidence-join-validation-audit.md").read_text()
    args.out_dir.mkdir(parents=True,exist_ok=True)
    summary="## Executive summary\n\nThis audit checks which company records contain sponsorship fields. It prepares a reproducible sample; it does not establish whether employer identities were joined correctly. Source employer records are still needed.\n\n"
    (args.out_dir/"source-join-audit.md").write_text(summary+audit)
    out={"recipe":"analyst-evidence","version":"0.1.0","executed_at_utc":datetime.now(timezone.utc).isoformat(),"source":"data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv","source_sha256":hashlib.sha256(args.csv.read_bytes()).hexdigest(),"source_kind":"repository mapped dataset; underlying joins NOT independently verified","counts":{"company_rows":len(rows),"h1b_fields_populated":len(populated),"analyst_title_rows":len(hits),"malformed_title_lists":malformed},"match_rule":"case-insensitive substring: data analyst | business intelligence | analytics engineer | bi analyst","matches":hits,"gates":{"entity_identity":"HOLD: raw DOL join evidence missing","posting_liveness":"HOLD: no live posting supplied","visa_timeline":"HOLD: no human-cleared timeline supplied"},"recommendation":"HOLD_FOR_VERIFICATION","score":None,"judgments":["Title strings indicate historical analyst relevance, not a current vacancy or sponsorship promise."],"existing_script":{"path":"scripts/sec/validate-h1b-join-sample.py","exit_code":proc.returncode,"input":"safe-column projection of every source row","arguments":["--sample-size","20","--review-count","0","--seed","80"]}}
    (args.out_dir/"agent-log.json").write_text(json.dumps(out,indent=2)+"\n")
    md=["## Executive summary","","This report helps analyst applicants distinguish general sponsorship records from records mentioning analyst work. It found historical title signals, but cannot recommend applications because employer identity, current vacancies, and visa timing have not been cleared.","","# Analyst evidence report","",f"Source SHA-256: `{out['source_sha256']}`","","| Check | Observed | Meaning |","|---|---:|---|",f"| Company rows | {len(rows)} | Rows, not deduplicated legal employers |",f"| H-1B fields populated | {len(populated)} | Any selected H-1B field populated, not proven sponsors |",f"| Analyst-title rows | {len(hits)} | Historical substring match, not SOC validation |","","## Historical analyst-title matches","","| Source record | Company | State | Approvals (raw) | Matched title(s) |","|---|---|---|---|---|"]
    for hit in hits:
        cells=[hit['source_record_number'],hit['company'],hit['state'],hit['approvals_raw'],'; '.join(hit['matched_titles'])]
        md.append('| '+' | '.join(str(x).replace('|','/').replace('\n',' ') for x in cells)+' |')
    md += ["","## Human gates","","| Gate | State | Evidence needed |","|---|---|---|","| Employer identity | HOLD | Raw employer record and matching legal entity |","| Posting liveness | HOLD | Exact public posting, current check, named human review |","| Visa timeline | HOLD | Private dates reviewed by applicant and appropriate advisor |","","Decision: **HOLD_FOR_VERIFICATION**. Score: **not produced**. A title mismatch means no title evidence under this rule, never proof the employer refuses sponsorship.","","## Limits","","No fresh data collected; no SOC mapping; no actual employer commitment, salary offer, live job, individual eligibility, or AI resilience verified. Missing fields remain unknown. Funding data does not establish hiring budget. All human gates remain uncleared."]
    (args.out_dir/"human-report.md").write_text('\n'.join(md)+'\n')
    print("EXISTING SCRIPT: scripts/sec/validate-h1b-join-sample.py exit=0 (all rows; safe columns)")
    print(f"COUNTS company_rows={len(rows)} h1b_fields_populated={len(populated)} analyst_title_rows={len(hits)} malformed_title_lists={malformed}")
    print("OUTPUT agent-log.json + human-report.md + source-join-audit.md")
    print("RESULT HOLD_FOR_VERIFICATION; score=null; entity/liveness/timeline gates uncleared")
    return 0
if __name__ == "__main__": sys.exit(main())
