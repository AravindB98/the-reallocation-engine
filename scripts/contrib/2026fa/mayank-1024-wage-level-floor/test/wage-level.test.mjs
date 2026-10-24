// Offline tests for the wage-level-floor mode. The CLI runs with fetch stubbed to throw,
// so any network call from the classifier fails the test.
//   node --test scripts/contrib/2026fa/mayank-1024-wage-level-floor/test/wage-level.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseCsv, annualize, levelFor, bandFor, lowestAcross, rangesFromText, htmlToText,
  timelineGate, areasFor, indexOflc, csvObjects,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODE = path.resolve(HERE, '..');
const ROOT = path.resolve(MODE, '../../../..');
const FX = path.join(HERE, 'fixtures');
const PERSONA = JSON.parse(fs.readFileSync(path.join(MODE, 'persona.example.json'), 'utf8'));
const NO_NET = 'data:text/javascript,globalThis.fetch=()=>{throw new Error("network call in offline classifier")}';
const boston = indexOflc(csvObjects(fs.readFileSync(path.join(FX, 'oflc-mini.csv'), 'utf8'))).get('14460|15-1252');

function run(personaPatch = {}, override = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wlf-'));
  const persona = { ...PERSONA, ...personaPatch };
  const pp = path.join(dir, 'persona.json');
  fs.writeFileSync(pp, JSON.stringify(persona));
  const out = path.join(dir, 'out');
  const a = { '--persona': pp, '--snapshot': path.join(FX, 'snapshot-mini.json'),
    '--oflc': path.join(FX, 'oflc-mini.csv'), '--csv': path.join(FX, 'sponsors-mini.csv'), '--out-dir': out, ...override };
  const r = spawnSync(process.execPath, ['--import', NO_NET, path.join(MODE, 'wage-level.mjs'), ...Object.entries(a).flat()],
    { encoding: 'utf8', cwd: ROOT });
  const logPath = path.join(out, 'wage-level.log.json');
  return { ...r, out, log: fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : null };
}
const byId = (log, id) => log.postings.find(p => p.posting_id === id);

test('annualize uses 2080 hours (OFLC: $115/hr = $239,200/yr)', () => {
  assert.equal(annualize(115), 239200);
  assert.equal(annualize(54.94), 114275.2);
});

test('levelFor: meets-or-exceeds, one cent below drops a level', () => {
  const t = boston.annual;
  assert.equal(levelFor(t[1], t).level, 2);
  assert.equal(levelFor(t[1] - 0.01, t).level, 1);
  assert.equal(levelFor(t[0] - 0.01, t).level, 0);
  assert.equal(levelFor(t[3] + 1e6, t).level, 4);
  assert.equal(levelFor(t[3] + 1, t).next_threshold, null);
});

test('bandFor names all four bands', () => {
  assert.equal(bandFor(120000, 170000, boston).kind, 'CLIFF-IN-RANGE');
  assert.equal(bandFor(120000, 170000, boston).cliff, boston.annual[1]);
  assert.equal(bandFor(140000, 150000, boston).kind, 'FLAT');
  assert.equal(bandFor(100000, 140000, boston).kind, 'FLOOR-BELOW-L1');
  assert.equal(bandFor(90000, 110000, boston).kind, 'RANGE-BELOW-L1');
});

test('multiple worksites: the lowest level wins', () => {
  const a = bandFor(140000, 150000, boston);           // II→II
  const b = bandFor(100000, 140000, boston);           // below I→II
  assert.equal(lowestAcross([a, b]), b);
});

test('parseCsv handles quoted commas and doubled quotes', () => {
  assert.deepEqual(parseCsv('a,b\n"x, y","he said ""hi"""\n'), [['a', 'b'], ['x, y', 'he said "hi"']]);
});

test('rangesFromText reads $X - $Y and $Xk–$Yk, ignores single numbers', () => {
  assert.deepEqual(rangesFromText('pay is $120,000 - $170,000 base').map(r => [r.min, r.max]), [[120000, 170000]]);
  assert.deepEqual(rangesFromText('from $95k–$120k').map(r => [r.min, r.max]), [[95000, 120000]]);
  assert.deepEqual(rangesFromText('a $5,000 signing bonus'), []);
});

test('htmlToText undoes Greenhouse double escaping', () => {
  assert.equal(htmlToText('&lt;p&gt;Range: $90,000&amp;nbsp;to $110,000&lt;/p&gt;'), 'Range: $90,000 to $110,000');
});

test('areasFor maps remote to the home area, keeps unknown parts', () => {
  const r = areasFor('Boston (Onsite), New York (Onsite) Preferred, or Remote', PERSONA.location_map, '14460');
  assert.ok(r.hits.length === 2 && r.hits.every(h => h.area === '14460'));
  assert.deepEqual(r.unmapped, ['New York']);
  assert.deepEqual(areasFor('Boston, MA (Hybrid)', PERSONA.location_map, '14460').unmapped, []);
  assert.deepEqual(areasFor('Dublin, Ireland', PERSONA.location_map, '14460').hits, []);
});

test('areasFor on real location strings from the 2026-10-18 snapshot', () => {
  const u = s => areasFor(s, PERSONA.location_map, '14460');
  assert.deepEqual(u('Remote, Canada').unmapped, ['Canada']);
  assert.deepEqual(u('Remote - Japan').unmapped, ['Japan']);
  assert.deepEqual(u('Lahore, Pakistan; Remote').unmapped, ['Lahore', 'Pakistan']);
  assert.deepEqual(u('Remote-United-States').unmapped, []);
  assert.deepEqual(u('Remote USA ').unmapped, []);
  assert.equal(u('Boston or Remote').hits[0].matched, 'Boston');
});

test('timeline gate: open / conditional / closed / error', () => {
  assert.equal(timelineGate(PERSONA).state, 'open');
  const early = { ...PERSONA, visa: { ...PERSONA.visa, work_auth_end: '2027-01-31' } };
  assert.equal(timelineGate(early).state, 'conditional');
  assert.equal(timelineGate({ ...early, visa: { ...early.visa, stem_opt_eligible: false } }).state, 'closed');
  assert.equal(timelineGate({ ...PERSONA, visa: { ...PERSONA.visa, work_auth_end: '2026-01-01' } }).state, 'error');
});

test('CLI: fixture run — bands, stops, funnel arithmetic, no network, no model judgments', () => {
  const r = run();
  assert.equal(r.status, 0, r.stderr);
  const { log } = r;
  assert.equal(log.model_judgment_values, 0);
  assert.equal(byId(log, '1').band.value.kind, 'CLIFF-IN-RANGE');
  assert.equal(byId(log, '1').entries_at_min.value, 1);
  assert.equal(byId(log, '1').entries_at_max.value, 3);
  assert.equal(byId(log, '2').band.value.kind, 'RANGE-BELOW-L1');
  assert.equal(byId(log, '2').pay.source, 'record-text');
  assert.equal(byId(log, '8').band.value.kind, 'FLAT');
  assert.equal(byId(log, '8').pay_unit.source, 'record');
  assert.equal(byId(log, '1').pay_unit.source, 'inferred');
  assert.equal(byId(log, '3').stop_reason, 'non-annual-unit');
  assert.equal(byId(log, '6').stop_reason, 'no-pay-range');
  assert.equal(byId(log, '7').stop_reason, 'zone-ambiguous');
  assert.equal(byId(log, '4'), undefined, 'Dublin is outside the target areas');
  assert.equal(byId(log, '5'), undefined, 'Senior is excluded by title');
  assert.equal(log.funnel.classified + log.funnel.stopped, log.funnel.in_target_area);
  assert.ok(fs.existsSync(path.join(r.out, 'wage-level.report.md')));
});

test('break: "Remote, Canada" is not the Boston home area', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wlf-remote-'));
  const snap = JSON.parse(fs.readFileSync(path.join(FX, 'snapshot-mini.json'), 'utf8'));
  snap.boards[0].postings.push({ id: '9', title: 'Software Engineer', location: 'Remote, Canada', url: 'https://example.invalid/9',
    updated_at: null, pay_structured: [{ min: 150000, max: 170000, currency: 'USD', interval: null, label: null }], pay_text: [] });
  const sp = path.join(dir, 'snap.json');
  fs.writeFileSync(sp, JSON.stringify(snap));
  const r = run({}, { '--snapshot': sp });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(byId(r.log, '9').stop_reason, 'remote-scope-unclear');
  assert.equal(byId(r.log, '7').stop_reason, 'zone-ambiguous', '"Remote, US" still maps home');
});

test('CLI: zone_choice (a person\'s answer) unlocks a zoned posting', () => {
  const r = run({ zone_choice: { 'ZONED PAYMENTS INC': 'Zone B' } });
  assert.equal(r.status, 0, r.stderr);
  const p = byId(r.log, '7');
  assert.equal(p.status, 'classified');
  assert.equal(p.pay.value.min, 130000);
});

test('CLI: closed timeline shows levels but no lottery entries', () => {
  const r = run({ visa: { ...PERSONA.visa, work_auth_end: '2027-01-31', stem_opt_eligible: false } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.log.timeline.state, 'closed');
  assert.equal(byId(r.log, '1').entries_at_max.value, null);
});

test('CLI: cap-exempt employer gets no lottery entries', () => {
  const r = run({ cap_exempt_companies: ['Example Robotics, Inc.'] });
  assert.equal(byId(r.log, '1').entries_at_min.value, 'cap-exempt');
});

test('CLI: an offer is placed on its own level', () => {
  const r = run({ offers: [{ posting_id: '1', base_salary: 138000 }] });
  const o = byId(r.log, '1').offer.value;
  assert.equal(o.level, 1);
  assert.equal(o.gap_to_next, 236.8);
});

test('break: past authorization date → exit 3, nothing written', () => {
  const r = run({ visa: { ...PERSONA.visa, work_auth_end: '2026-09-01' } });
  assert.equal(r.status, 3);
  assert.equal(r.log, null);
  assert.equal(fs.existsSync(r.out), false);
});

test('break: OFLC extract with a missing column → exit 2 (schema drift)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wlf-drift-'));
  const bad = path.join(dir, 'oflc.csv');
  fs.writeFileSync(bad, fs.readFileSync(path.join(FX, 'oflc-mini.csv'), 'utf8').replace('level2_hourly', 'lvl2'));
  const r = run({}, { '--oflc': bad });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /schema drift/);
});

test('break: refuses to write into the tracked tree', () => {
  const r = spawnSync(process.execPath, [path.join(MODE, 'wage-level.mjs'),
    '--snapshot', path.join(FX, 'snapshot-mini.json'), '--out-dir', path.join(ROOT, 'recipes')], { encoding: 'utf8', cwd: ROOT });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /refusing --out-dir/);
});
