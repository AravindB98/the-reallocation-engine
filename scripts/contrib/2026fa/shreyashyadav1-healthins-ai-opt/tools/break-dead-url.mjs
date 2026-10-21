#!/usr/bin/env node
// BREAK 1: carry a REAL dead posting through the real pipeline. The liveness record comes from the repo's
// checker (scripts/ats/liveness-browser.mjs), not from a hand-typed status. Needs the network and Chromium.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/tools/break-dead-url.mjs <out-dir> [snapshot.json]
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-20 --candidates <out-dir>/candidates.snapshot.json --out-dir <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { checkUrlLiveness } from '../../../../ats/liveness-browser.mjs';
import { LIVENESS_METHOD } from '../ingest.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../../..');
const out = path.resolve(process.argv[2] || '');
const snapPath = path.resolve(process.argv[3] || path.join(ROOT, 'assignments/submissions/shreyashyadav1/runs/2026-10-20/candidates.snapshot.json'));
if (!process.argv[2]) { console.error('usage: break-dead-url.mjs <out-dir> [snapshot.json]'); process.exit(2); }

const dead = 'https://job-boards.greenhouse.io/omadahealth/jobs/1234567'; // a job id that does not exist
const browser = await chromium.launch({ headless: true });
const res = await checkUrlLiveness(await browser.newPage(), dead);
await browser.close();
console.log('real checker on the dead URL ->', JSON.stringify(res));

const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
const role = snap.roles.find((r) => r.company === 'Omada Health' && !r.pre_excluded);
console.log(`role before: ${role.title} | liveness ${role.liveness.status}`);
role.posting_url = dead;
role.liveness = { status: res.result, code: res.code || null, reason: res.reason || null, checked_on: snap._meta.fetched_on, method: LIVENESS_METHOD, source: 'record' };
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'candidates.snapshot.json'), JSON.stringify(snap, null, 2));
