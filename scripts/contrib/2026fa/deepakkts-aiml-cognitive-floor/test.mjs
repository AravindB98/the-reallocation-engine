#!/usr/bin/env node
// test.mjs: offline harness for the AI/ML cognitive-floor mode. No network.
//
//   node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/test.mjs
//
// 0. Replaces globalThis.fetch with a function that throws (fixtures/no-network.mjs),
//    here and in every child via `node --import`, and proves the trap reaches a child.
// 1. Runs run.mjs as a child process against fixtures/offline-scenario.json with
//    --offline fixtures/offline-responses.json and checks every disposition.
// 2. Checks the sponsorship lookup, timeline gate and out-dir guard directly.
// 3. Break attempt: re-runs the SOC expectations with each fixtures/BROKEN-*
//    mutant swapped in and requires the harness to catch it. A mutant that
//    passes would mean the harness cannot see that failure.
// Exit 0 when every check passes, 1 otherwise.

import { TRAP_MESSAGE } from './fixtures/no-network.mjs'; // first import: fetch is trapped before anything else loads
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateSoc, loadSocTable, loadSponsorTable, lookupSponsor, floorCutoff, timelineGate } from './run.mjs';
import { parseRating as brokenParse } from './fixtures/BROKEN-number-coercion.mjs';
import { evaluateSocViaBls } from './fixtures/BROKEN-sibling-join.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUN = path.join(HERE, 'run.mjs');
const FX = path.join(HERE, 'fixtures');
let pass = 0; const fails = [];
const check = (name, ok, detail = '') => { if (ok) { pass++; console.log(`  ✓ ${name}`); } else { fails.push(name); console.log(`  ✗ ${name}${detail ? ` (${detail})` : ''}`); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cogfloor-'));
const TRAP = ['--import', pathToFileURL(path.join(FX, 'no-network.mjs')).href];

console.log('0. network trap');
let trapped = false;
try { await fetch('https://boards-api.greenhouse.io/v1/boards/example-ai-co/jobs'); } catch (e) { trapped = e.message === TRAP_MESSAGE; }
check('fetch throws in the harness process', trapped);
const trapTmp = path.join(tmp, 'trap-live');
const live = spawnSync(process.execPath, [...TRAP, RUN, '--out-dir', trapTmp], { encoding: 'utf8' });
const liveLog = live.status === 1 ? JSON.parse(fs.readFileSync(path.join(trapTmp, 'run-log.json'), 'utf8')) : null;
check('trap reaches a child: a live run fails every liveness check with the trap message',
  liveLog != null && liveLog.roles.every((r) => r.disposition === 'STOP_LIVENESS_CHECK_FAILED' && r.liveness.reason.includes(TRAP_MESSAGE)),
  `exit ${live.status}`);

console.log('1. offline end-to-end run (fetch trapped)');
const res = spawnSync(process.execPath, [...TRAP, RUN, '--scenario', path.join(FX, 'offline-scenario.json'), '--offline', path.join(FX, 'offline-responses.json'),
  '--as-of', '2026-10-21', '--out-dir', tmp], { encoding: 'utf8' });
check('exit code 1 because two stop conditions fire', res.status === 1, `got ${res.status}: ${res.stderr}`);
const log = JSON.parse(fs.readFileSync(path.join(tmp, 'run-log.json'), 'utf8'));
check('report.md written beside run-log.json', fs.existsSync(path.join(tmp, 'report.md')));
check('report.md opens with an executive summary', /^# .*\n\n## Executive summary\n/.test(fs.readFileSync(path.join(tmp, 'report.md'), 'utf8')));
const expected = {
  'f01-clears': 'CLEARS_FLOOR', 'f02-below': 'BELOW_FLOOR', 'f03-soc-sensitive': 'SOC_SENSITIVE',
  'f04-data-scientist-unrated': 'HOLD_MISSING_EVIDENCE', 'f05-bare-bls-code': 'STOP_SOC_INPUT',
  'f06-gone-404': 'SKIP_GATED_LIVENESS', 'f07-200-but-filled': 'SKIP_GATED_LIVENESS',
  'f08-not-in-board-listing': 'HOLD_LIVENESS_UNCERTAIN', 'f09-network-error': 'STOP_LIVENESS_CHECK_FAILED',
  'f10-deadline-passed': 'SKIP_GATED_LIVENESS', 'f11-legal-name-pinned': 'CLEARS_FLOOR', 'f12-partial-ratings': 'HOLD_MISSING_EVIDENCE',
};
const byId = Object.fromEntries(log.roles.map((r) => [r.role_id, r]));
for (const [id, want] of Object.entries(expected)) check(`${id} → ${want}`, byId[id]?.disposition === want, `got ${byId[id]?.disposition}`);
check('f07 closed by the body pattern, not by status', byId['f07-200-but-filled'].liveness.code === 'expired_body' && byId['f07-200-but-filled'].liveness.http_status === 200);
check('f09 failed check carries no liveness value', byId['f09-network-error'].liveness.gate === 'check_failed' && !('factor' in byId['f09-network-error'].liveness));
check('f05 lists sibling O*NET codes without using them', JSON.stringify(byId['f05-bare-bls-code'].soc[0].siblings) === JSON.stringify(['15-2051.00', '15-2051.01', '15-2051.02']) && byId['f05-bare-bls-code'].soc[0].score === undefined);
check('exactly two stops recorded', log.stops.length === 2, `got ${log.stops.length}`);

console.log('2. lookups and gates');
const sp = loadSponsorTable();
const figma = lookupSponsor('Figma, Inc.', sp);
check('"Figma, Inc." matches FIGMA INC by suffix normalization and says so', figma.status === 'recorded' && figma.match === 'suffix-normalized' && figma.rows[0].company_name === 'FIGMA INC');
const pel = lookupSponsor('Peloton Interactive', sp);
check('duplicate company rows are reported once, never summed', pel.rows.length === 2 && pel.approvals === pel.rows[0].total_approvals);
check('absent company is not_in_dataset with no number', lookupSponsor('Example AI Co', sp).status === 'not_in_dataset' && lookupSponsor('Example AI Co', sp).approvals === null);
check('display name with a different legal name does not match by itself', lookupSponsor('Instacart', sp).status === 'not_in_dataset');
check('timeline gate with a missing input needs a human', timelineGate({ program_completion_month: { value: '2026-12' }, target_start_month: { value: '2027-01' }, ead_expected_month: { value: null }, latest_opt_start_month: { value: '2027-02' } }).gate === 'needs_input');
check('timeline gate closes when the EAD lands after the start', timelineGate({ program_completion_month: { value: '2026-12' }, target_start_month: { value: '2027-01' }, ead_expected_month: { value: '2027-03' }, latest_opt_start_month: { value: '2027-02' } }).gate === 'closed');
const guard = spawnSync(process.execPath, [...TRAP, RUN, '--out-dir', 'data/bls/compact', '--offline', path.join(FX, 'offline-responses.json')], { encoding: 'utf8', cwd: path.resolve(HERE, '../../../..') });
check('out-dir inside the repo but outside the namespace is refused, exit 2', guard.status === 2 && /must be under assignments\/submissions\/deepakkts/.test(guard.stderr));
const noOut = spawnSync(process.execPath, [...TRAP, RUN], { encoding: 'utf8' });
check('missing --out-dir is refused, exit 2', noOut.status === 2 && /--out-dir is required/.test(noOut.stderr));

console.log('3. break attempt: the silent wrong answers for 15-2051.00 Data Scientists');
const soc = loadSocTable();
const { cutoff } = floorCutoff(soc.rated, 75);
const socExpectations = (evalFn) => {
  const ds = evalFn('15-2051.00');
  const swe = evalFn('15-1252.00');
  return ds.status === 'missing_ratings' && ds.score === null && swe.status === 'clears_floor' && swe.score === 3.834;
};
const real = (c) => evaluateSoc(c, soc, cutoff, '');
const mutCoerce = (c) => evaluateSoc(c, soc, cutoff, '', brokenParse);
const mutSibling = (c) => evaluateSocViaBls(c, soc, cutoff, '');
check('real mode: Data Scientists has no score (missing evidence)', socExpectations(real));
const c = mutCoerce('15-2051.00'); const s = mutSibling('15-2051.00');
console.log(`    BROKEN-number-coercion on 15-2051.00 → status ${c.status}, score ${c.score}`);
console.log(`    BROKEN-sibling-join   on 15-2051.00 → status ${s.status}, score ${s.score}, profile actually from "${s.title}"`);
check('harness catches BROKEN-number-coercion', !socExpectations(mutCoerce));
check('harness catches BROKEN-sibling-join', !socExpectations(mutSibling));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass}/${pass + fails.length} checks passed`);
process.exit(fails.length ? 1 : 0);
