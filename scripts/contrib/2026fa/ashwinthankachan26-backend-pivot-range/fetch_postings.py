#!/usr/bin/env python3
"""fetch_postings.py — the only network step for postings: read the public
Greenhouse job boards named in config.json → fetch, keep backend-adjacent US
postings, strip emails and phone numbers, and save each one as a snapshot so
pivot_range.py can run on them offline and reproducibly.

    python3 …/fetch_postings.py --out-dir <new folder> [--config f] [--overwrite]

Network: one GET per board to the single host in config.fetch.host, in order.
Exit: 0 = saved · 2 = bad config, refused folder, or a board request failed.
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
sys.path.insert(0, HERE)
import lib_pivot as lib  # noqa: E402


def fail(msg):
    print(f'✗ {msg}', file=sys.stderr)
    sys.exit(2)


def select(jobs, f):
    t, x, loc = re.compile(f['title_re'], re.I), re.compile(f['exclude_re'], re.I), re.compile(f['location_re'], re.I)
    return [j for j in jobs if t.search(j.get('title', '')) and not x.search(j.get('title', ''))
            and loc.search((j.get('location') or {}).get('name', ''))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    ap.add_argument('--overwrite', action='store_true')
    a = ap.parse_args()
    with open(a.config, encoding='utf-8') as fh:
        f = json.load(fh)['fetch']
    if not f.get('host') or not f.get('boards'):
        fail('config.fetch needs host and boards')
    out = os.path.abspath(a.out_dir)
    if out.startswith(os.path.join(ROOT, 'data') + os.sep):
        fail('refusing to write under data/')
    if os.path.exists(os.path.join(out, 'roles.json')) and not a.overwrite:
        fail(f'{out} already holds a fetch (roles.json). Use a new --out-dir, or --overwrite on purpose.')
    os.makedirs(os.path.join(out, 'snapshots'), exist_ok=True)
    fetched_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    roles, per_board = [], []
    for b in f['boards']:   # sequential, one request per board
        url = f'https://{f["host"]}/v1/boards/{urllib.parse.quote(b["token"])}/jobs?content=true'
        if urllib.parse.urlparse(url).hostname != f['host']:
            fail(f'refusing host for {url}')
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                jobs = json.load(r).get('jobs', [])
        except Exception as e:  # noqa: BLE001 — any failure stops the run
            fail(f'{b["company"]}: board request failed ({e})')
        keep = select(jobs, f)
        per_board.append((b['company'], len(keep), len(jobs)))
        for j in keep:
            rid = f'{b["token"]}-{j["id"]}'
            snap = {
                '_note': 'Public posting saved from the Greenhouse board API; emails and phone numbers removed before saving.',
                'board_listing': {'host': f['host'], 'board': b['token'], 'job_id': j['id'], 'fetched_at': fetched_at,
                                  'updated_at': j.get('updated_at'), 'url': j.get('absolute_url')},
                'title': j.get('title'), 'location': (j.get('location') or {}).get('name'),
                'bodyText': lib.redact(lib.html_to_text(j.get('content', ''))),
            }
            with open(os.path.join(out, 'snapshots', rid + '.json'), 'w', encoding='utf-8') as fh:
                json.dump(snap, fh, indent=1, ensure_ascii=False)
            roles.append({'role_id': rid, 'company': b['company'], 'title': j.get('title'),
                          'location': snap['location'], 'url': j.get('absolute_url'), 'snapshot': f'snapshots/{rid}.json'})
    with open(os.path.join(out, 'roles.json'), 'w', encoding='utf-8') as fh:
        json.dump({'_note': f'Backend-adjacent public postings fetched {fetched_at} from {f["host"]} (config.fetch filters, your-input).',
                   'fetched_at': fetched_at, 'roles': roles}, fh, indent=1, ensure_ascii=False)
    print(f'✓ fetched {len(f["boards"])} boards → {len(roles)} backend-adjacent postings saved ({fetched_at})')
    for name, k, n in per_board:
        print(f'  {name:30s} {k:3d} of {n} open jobs')
    print(f'  {os.path.relpath(os.path.join(out, "roles.json"), ROOT)}')


if __name__ == '__main__':
    main()
