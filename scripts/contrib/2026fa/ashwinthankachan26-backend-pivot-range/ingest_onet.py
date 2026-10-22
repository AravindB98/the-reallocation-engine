#!/usr/bin/env python3
"""ingest_onet.py — the only network step for O*NET: fetch the O*NET 30.2 text
database, verify it against the repo's own audit, and write the two small
extracts this mode reads.

    # download (one GET to www.onetcenter.org) into a cache folder outside the repo, then extract
    python3 …/ingest_onet.py --download --cache-dir <folder outside the repo>
    # or extract from a zip you already downloaded
    python3 …/ingest_onet.py --zip <path to db_30_2_text.zip>

Writes (into this folder's data/):
  onet_elements_15.csv  the nine pivot ratings (Level scale) for every occupation in
                        config scope, with N, standard error, date, suppress flag
  onet_titles.csv       every O*NET alternate, short and reported title → occupation
  PROVENANCE.md         source URL, fetch time, SHA-256s, licence attribution

Refuses (exit 2) if any source file's SHA-256 differs from data/bls/BLS-audit.md,
which pins the exact files the repo's compact table was built from.
"""
import argparse
import csv
import hashlib
import io
import json
import os
import sys
import urllib.request
import zipfile
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import lib_pivot as lib  # noqa: E402

URL = 'https://www.onetcenter.org/dl_files/database/db_30_2_text.zip'
AUDITED = ['Occupation Data.txt', 'Abilities.txt', 'Skills.txt', 'Alternate Titles.txt', 'Job Zones.txt']
ATTRIBUTION = ('This extract includes information from the O*NET 30.2 Database by the U.S. Department of Labor, '
               'Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. '
               'O*NET® is a trademark of USDOL/ETA. The extract was modified (filtered to the columns and '
               'occupations this mode reads); USDOL/ETA has not approved, endorsed, or tested these modifications.')


def fail(msg):
    print(f'✗ {msg}', file=sys.stderr)
    sys.exit(2)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def member(z, name):
    hits = [n for n in z.namelist() if n.endswith('/' + name) or n == name]
    if len(hits) != 1:
        fail(f'{name}: expected exactly one file in the zip, found {len(hits)}')
    return z.read(hits[0])


def tsv(raw):
    return csv.DictReader(io.StringIO(raw.decode('utf-8-sig')), delimiter='\t')


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--zip')
    g.add_argument('--download', action='store_true')
    ap.add_argument('--cache-dir')
    ap.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    ap.add_argument('--out-dir', default=os.path.join(HERE, 'data'))
    a = ap.parse_args()

    fetched_at = None
    if a.download:
        if not a.cache_dir:
            fail('--download needs --cache-dir (a folder outside the repository)')
        cache = os.path.abspath(a.cache_dir)
        if cache.startswith(ROOT + os.sep):
            fail('--cache-dir must be outside the repository (the full database is not committed)')
        os.makedirs(cache, exist_ok=True)
        zpath = os.path.join(cache, 'db_30_2_text.zip')
        fetched_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        with urllib.request.urlopen(URL, timeout=120) as r, open(zpath, 'wb') as f:
            f.write(r.read())
    else:
        zpath = a.zip
        if not os.path.exists(zpath):
            fail(f'zip not found: {zpath}')
    with open(zpath, 'rb') as f:
        zbytes = f.read()
    z = zipfile.ZipFile(io.BytesIO(zbytes))

    with open(os.path.join(ROOT, 'data', 'bls', 'BLS-audit.md'), encoding='utf-8') as f:
        pinned = lib.parse_audit_hashes(f.read())
    files = {name: member(z, name) for name in AUDITED + ['Sample of Reported Titles.txt']}
    checks = []
    for name in AUDITED:
        got, want = sha(files[name]), pinned.get(name)
        if want is None:
            fail(f'{name}: no SHA-256 pinned in data/bls/BLS-audit.md')
        if got != want:
            fail(f'{name}: SHA-256 {got} ≠ the repo audit\'s {want}; this is not the release the repo was built from')
        checks.append((name, got))

    with open(a.config, encoding='utf-8') as f:
        prefixes = tuple(json.load(f)['scope']['soc_prefixes'])
    kinds = {'Abilities.txt': 'ability', 'Skills.txt': 'skill'}
    rows = []
    for fname, kind in kinds.items():
        for r in tsv(files[fname]):
            if r['Scale ID'] == 'LV' and r['Element Name'] in lib.PIVOT_NAMES and r['O*NET-SOC Code'].startswith(prefixes):
                rows.append([r['O*NET-SOC Code'], kind, r['Element Name'], r['Data Value'], r['N'],
                             r['Standard Error'], r['Date'], r['Recommend Suppress'], r['Domain Source']])
    rows.sort()
    titles = set()
    for r in tsv(files['Alternate Titles.txt']):
        titles.add((r['O*NET-SOC Code'], r['Alternate Title'].strip(), 'alternate'))
        if r['Short Title'] and r['Short Title'] != 'n/a':
            titles.add((r['O*NET-SOC Code'], r['Short Title'].strip(), 'short'))
    for r in tsv(files['Sample of Reported Titles.txt']):
        titles.add((r['O*NET-SOC Code'], r['Reported Job Title'].strip(), 'reported'))
    for r in tsv(files['Occupation Data.txt']):
        titles.add((r['O*NET-SOC Code'], r['Title'].strip(), 'occupation'))
    # keep every title string that names at least one in-scope occupation, with ALL its
    # occupations (so out-of-scope collisions are still reported); drop titles that never
    # touch the scope — they can only ever produce "no in-scope match"
    in_scope_titles = {t.lower() for c, t, _ in titles if c.startswith(prefixes)}
    all_titles = len(titles)
    titles = {row for row in titles if row[1].lower() in in_scope_titles}

    os.makedirs(a.out_dir, exist_ok=True)
    epath, tpath = os.path.join(a.out_dir, 'onet_elements_15.csv'), os.path.join(a.out_dir, 'onet_titles.csv')
    with open(epath, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['onet_soc_code', 'kind', 'element', 'value', 'n', 'se', 'date', 'suppress', 'domain_source'])
        w.writerows(rows)
    with open(tpath, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['onet_soc_code', 'title', 'source'])
        w.writerows(sorted(titles))
    with open(epath, 'rb') as f:
        esha = sha(f.read())
    with open(tpath, 'rb') as f:
        tsha = sha(f.read())
    codes = len({r[0] for r in rows})
    prov = [
        '# O*NET extract — provenance', '',
        '## Executive summary', '',
        'These two small files are the parts of the U.S. Department of Labor\'s O*NET occupation database that this mode reads: '
        'the nine thinking-skill ratings behind each computer occupation\'s cognitive pivot score, and the list of job titles O*NET files under each occupation. '
        'They were cut from the official O*NET 30.2 release, which was first checked byte for byte against the fingerprints the repository already records for the files its own BLS/O*NET table was built from.', '',
        '## Source', '',
        f'- URL: {URL}',
        f'- Fetched: {fetched_at or "not recorded by this command (extracted from a zip given with --zip; see the run log for when it was downloaded)"}',
        f'- Zip SHA-256: `{sha(zbytes)}`',
        '- Files checked against `data/bls/BLS-audit.md` (all match):',
    ] + [f'  - `{n}` `{h}`' for n, h in checks] + [
        f'- `Sample of Reported Titles.txt` (not pinned in the audit) SHA-256: `{sha(files["Sample of Reported Titles.txt"])}`', '',
        '## Outputs', '',
        f'- `onet_elements_15.csv`: {len(rows)} rows, {codes} occupations with prefix {", ".join(prefixes)}, Level (LV) scale only, SHA-256 `{esha}`',
        f'- `onet_titles.csv`: {len(titles)} of {all_titles} (occupation, title, source) rows from Alternate Titles (alternate + short), Sample of Reported Titles, and Occupation Data — every title string that names at least one in-scope occupation, kept with all of its occupations so out-of-scope collisions are still visible. SHA-256 `{tsha}`',
        '- Regenerate: `python3 scripts/contrib/2026fa/ashwinthankachan26-backend-pivot-range/ingest_onet.py --download --cache-dir <folder outside the repo>`', '',
        '## Licence', '', ATTRIBUTION, '',
    ]
    with open(os.path.join(a.out_dir, 'PROVENANCE.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(prov))
    print(f'✓ verified {len(checks)} O*NET files against data/bls/BLS-audit.md')
    print(f'  onet_elements_15.csv: {len(rows)} ratings, {codes} occupations · onet_titles.csv: {len(titles)} titles')


if __name__ == '__main__':
    main()
