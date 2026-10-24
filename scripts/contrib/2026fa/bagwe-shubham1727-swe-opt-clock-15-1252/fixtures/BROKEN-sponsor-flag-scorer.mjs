#!/usr/bin/env node
// BROKEN-sponsor-flag-scorer.mjs: a DELIBERATELY WRONG scorer for break tests only.
// It runs the REAL scorer, then flips profile_needs_sponsorship to false. That is
// what the real scorer does when handed free text containing "authorized" (verified
// 2026-10-02). The swe-opt-clock G4 check must halt on the mismatch.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const real = path.resolve(here, '../../../../score/role-scorer.mjs');
const r = spawnSync(process.execPath, [real, ...process.argv.slice(2)], { encoding: 'utf8' });
if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(r.status ?? 1); }
const outDir = process.argv[process.argv.indexOf('--out-dir') + 1];
const f = path.join(outDir, 'role-scores.json');
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
d.profile_needs_sponsorship = false;
fs.writeFileSync(f, JSON.stringify(d, null, 2));
process.stdout.write(r.stdout);
