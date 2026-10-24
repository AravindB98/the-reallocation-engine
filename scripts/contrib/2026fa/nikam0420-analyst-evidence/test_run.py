"""Behavior checks invoke the workflow and maintained validator, not a scorer clone."""
import ast, csv, json, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
SCRIPT=Path(__file__).with_name('run.py')
SOURCE=ROOT/'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'
def run(*args):
    return subprocess.run([sys.executable,str(SCRIPT),*map(str,args)],capture_output=True,text=True)
def main():
    with tempfile.TemporaryDirectory() as d:
        t=Path(d); out=t/'first'; second=t/'second'
        a=run('--out-dir',out); assert a.returncode==0,a.stderr
        data=json.loads((out/'agent-log.json').read_text())
        with SOURCE.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
        assert data['counts']['company_rows']==len(rows)
        # Check every reported hit against the original source record, not the safe copy.
        for hit in data['matches']:
            source=rows[hit['source_record_number']-1]
            assert source['company_name']==hit['company']
            assert all(title in ast.literal_eval(source['top_job_titles_sponsored']) for title in hit['matched_titles'])
        print(f"PASS source cross-check: {len(rows)} rows; {len(data['matches'])} matches trace to source records")
        b=run('--out-dir',second); assert b.returncode==0
        other=json.loads((second/'agent-log.json').read_text())
        for x in (data,other): x.pop('executed_at_utc')
        assert data==other
        print('PASS rerun: identical JSON after excluding execution timestamp')
        assert data['score'] is None and data['recommendation']=='HOLD_FOR_VERIFICATION'
        assert all(x.startswith('HOLD:') for x in data['gates'].values())
        print('PASS safety: no score; all three gates remain on HOLD')
        missing=run('--csv',t/'absent.csv','--out-dir',t/'missing-out')
        assert missing.returncode==2 and not (t/'missing-out').exists()
        print('PASS deliberate break: absent source exits 2; writes no output')
        bad=t/'bad.csv';bad.write_text('company_name\nExample Company\n')
        malformed=run('--csv',bad,'--out-dir',t/'bad-out')
        assert malformed.returncode==2 and not (t/'bad-out').exists()
        print('PASS deliberate break: missing columns exits 2; writes no output')
        badtitle=t/'bad-title.csv'
        fields=list(rows[0]); row={k:'' for k in fields};row['company_name']='Synthetic schema test';row['top_job_titles_sponsored']='not a list'
        with badtitle.open('w',newline='') as f:
            w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerow(row)
        bad=run('--csv',badtitle,'--out-dir',t/'bad-title-out')
        assert bad.returncode==2 and not (t/'bad-title-out').exists()
        print('PASS deliberate break: malformed title list exits 2; writes no output')
        report=(out/'source-join-audit.md').read_text()
        assert f'{len(rows):,}' in report and '1,557' in report
        print('PASS maintained validator: audit counts agree with source and JSON')
        assert set(data['matches'][0])=={'source_record_number','company','state','approvals_raw','matched_titles'}
        print('PASS publication contract: match rows expose only allowed evidence fields')
        print('8/8 checks passed')
if __name__=='__main__': main()
