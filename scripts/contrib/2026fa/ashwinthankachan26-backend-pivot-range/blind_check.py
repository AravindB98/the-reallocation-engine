#!/usr/bin/env python3
"""blind_check.py — does the duties reading agree with a person judging blind? (TODO #4)

  make:   pick N postings at random (fixed seed) whose duties section was found, and write
          a sheet with ONLY their duties text (no tool reading on it) plus an empty labels file
  score:  compare the person's labels with the tool's readings in the same pivot-log.json

    python3 …/blind_check.py make  --log <run>/pivot-log.json --fetch <fetch folder> --n 20 --seed 2026 --out-dir <new folder>
    #   → blind-sheet.md (read this) + blind-labels.csv (fill your_label with J or R, nothing else)
    python3 …/blind_check.py score --log <run>/pivot-log.json --labels <folder>/blind-labels.csv

Labels: J = mostly system-judgment / verification work · R = mostly routine implementation.
Label from the duties text alone, before looking at the tool's reading. Offline.
Exit: 0 = done · 2 = refused (bad input, unlabelled rows, existing sheet).
"""
import argparse
import csv
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib_pivot as lib  # noqa: E402

TOOL = {'judgment-heavy': 'J', 'routine-leaning': 'R'}


def fail(msg):
    print(f'✗ {msg}', file=sys.stderr)
    sys.exit(2)


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def make(a):
    log = load(a.log)
    cfg = load(a.config)['posting_signal']
    pool = sorted(p['role_id'] for p in log['postings'] if p['posting_signal'].get('section_found'))
    if len(pool) < a.n:
        fail(f'only {len(pool)} postings have a duties section; asked for {a.n}')
    pick = random.Random(a.seed).sample(pool, a.n)
    sheet, labels = os.path.join(a.out_dir, 'blind-sheet.md'), os.path.join(a.out_dir, 'blind-labels.csv')
    if os.path.exists(labels):
        fail(f'{labels} already exists; a blind sheet is made once, before labelling')
    by_id = {p['role_id']: p for p in log['postings']}
    os.makedirs(a.out_dir, exist_ok=True)
    L = ['# Blind duties check — label sheet', '', '## Executive summary', '',
         f'{a.n} postings picked at random (seed {a.seed}) from the {len(pool)} whose duties section the tool found. '
         'Only each posting\'s own duties text is shown; the tool\'s reading is deliberately left out. '
         'For each one, write **J** (mostly system-judgment or verification work) or **R** (mostly routine implementation) '
         'in `blind-labels.csv`, from this text alone. Then run the score command.', '']
    for i, rid in enumerate(pick, 1):
        p = by_id[rid]
        snap = load(os.path.join(a.fetch, 'snapshots', rid + '.json'))
        duties = lib.duties_section(snap.get('bodyText', ''), cfg) or []
        L += [f'## {i}. {p["company"]} — {p["title"]["value"]}', '', f'`{rid}`', '']
        L += [f'- {d}' for d in duties if d.strip()] + ['']
    with open(sheet, 'w', encoding='utf-8') as f:
        f.write('\n'.join(L))
    with open(labels, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['n', 'role_id', 'your_label'])
        for i, rid in enumerate(pick, 1):
            w.writerow([i, rid, ''])
    print(f'✓ blind sheet: {a.n} of {len(pool)} postings (seed {a.seed}) → {sheet} + {labels}')


def score(a):
    log = load(a.log)
    by_id = {p['role_id']: p for p in log['postings']}
    with open(a.labels, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    bad = [r['role_id'] for r in rows if r['your_label'].strip().upper() not in ('J', 'R')]
    if bad:
        fail(f'{len(bad)} rows have no J/R label (e.g. {bad[0]}); label every row first')
    out, agree, compared, abstain = [], 0, 0, 0
    for r in rows:
        mine = r['your_label'].strip().upper()
        reading = by_id[r['role_id']]['posting_signal']['reading']
        tool = TOOL.get(reading)
        if tool is None:
            abstain += 1
            mark = 'tool abstained'
        else:
            compared += 1
            agree += tool == mine
            mark = '✓' if tool == mine else '✗'
        out.append((r['n'], r['role_id'], mine, reading, mark))
    mine_r = sum(1 for o in out if o[2] == 'R')
    print(f'✓ agreement {agree} of {compared} (tool abstained on {abstain}) · my labels: {len(out) - mine_r} J, {mine_r} R')
    for o in out:
        print(f'  {o[0]:>2}  {o[1]:38s} me {o[2]}  tool {o[3]:16s} {o[4]}')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    m = sub.add_parser('make')
    m.add_argument('--log', required=True)
    m.add_argument('--fetch', required=True)
    m.add_argument('--n', type=int, default=20)
    m.add_argument('--seed', type=int, default=2026)
    m.add_argument('--out-dir', required=True)
    m.add_argument('--config', default=os.path.join(HERE, 'config.json'))
    s = sub.add_parser('score')
    s.add_argument('--log', required=True)
    s.add_argument('--labels', required=True)
    a = ap.parse_args()
    make(a) if a.cmd == 'make' else score(a)


if __name__ == '__main__':
    main()
