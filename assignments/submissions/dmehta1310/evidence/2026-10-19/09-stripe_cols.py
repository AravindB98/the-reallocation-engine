import csv, sys
want = ['company_name','total_funding','latest_funding_stage','latest_funding_date','Total Approvals','Total Denials','Approval_Rate']
for r in csv.DictReader(open(sys.argv[1], encoding='utf-8')):
    if r['company_name'] == 'STRIPE INC':
        for k in want: print(f'{k} = {r[k]}')
