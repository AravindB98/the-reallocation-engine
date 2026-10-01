#!/usr/bin/env node
// break-it.mjs: break the prototype on purpose, one way at a time, and check that the tests notice.
//
//   node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/break-it.mjs [--list] [--only B03,B07]
//
// It copies the repository's working tree to a temporary folder (so nothing in your checkout is touched), runs the test
// suite once on the unbroken copy (it must pass), then for each break below it changes one place in one file of the
// copy, runs the suite again, and puts the file back. A break is "caught" when at least one test fails, not counting the
// one test that checks the committed sample run is current (it fails for ANY edit to the code or the inputs, so it says
// nothing about whether a behaviour is tested). A break whose search text is not found exactly once is an error, not a
// pass, so this list cannot quietly go stale.
//
// It takes a few minutes. Exit code 0: every break was caught. 1: a break survived or could not be applied. 2: misuse.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const PROTO = path.relative(REPO, HERE);

// [what the break does, file in this folder, text to find (exactly once), text to put there instead]
const BREAKS = [
  ['Proven needs only 2 approvals', 'params.json', '"min_approvals": 10,', '"min_approvals": 2,'],
  ['the timeline gate ignores an authorization that has already ended', 'timeline.mjs', 'if (asOfD > endD) {', 'if (false) {'],
  ['the unemployment clock starts today even before authorization starts', 'timeline.mjs', 'const clockStartD = Math.max(asOfD, eadD);', 'const clockStartD = asOfD;'],
  ['the timeline forgets the unemployment days already used', 'timeline.mjs', 'const projected = daysUsed + accrued;', 'const projected = accrued;'],
  ['unknown companies are sent to the scorer', 'preopt-sponsor-tiers.mjs', 'const scoredRows = rows.filter((r) => r.scored);', "const scoredRows = rows.filter((r) => r.scored || r.bucket === 'hold_unknown');"],
  ['the scorer profile uses the wording the scorer misreads', 'scorer-bridge.mjs', "'F-1 student; requires H-1B sponsorship'", "'F-1 STEM OPT (work authorized, EAD)'"],
  ['the scorer-integrity check is not called', 'preopt-sponsor-tiers.mjs', 'const returned = assertScorerIntegrity({ persona, scorerJson, sentRoles: roles });', 'const returned = new Map(scorerJson.roles.map((r) => [r.role_id, r]));'],
  ['the legal suffix "inc" is no longer stripped from names', 'evidence.mjs', '/\\s+inc\\.?$/i, ', ''],
  ['the data vintage uses the OLDEST funding date', 'evidence.mjs', 'if (best === null || day > best.day)', 'if (best === null || day < best.day)'],
  ['Likely accepts EITHER the count or the rate', 'evidence.mjs', 'if (approvals >= likely.min_approvals && rate >= likely.min_rate_pct)', 'if (approvals >= likely.min_approvals || rate >= likely.min_rate_pct)'],
  ['the discovery pool ignores the funding window', 'preopt-sponsor-tiers.mjs', 'if (!ev.funding.within_window) return;', ''],
  ['the report loses its executive summary heading', 'report.mjs', "o.push('## Executive summary', '');", "o.push('## Summary', '');"],
  ['the liveness placeholder is labelled a record', 'scorer-bridge.mjs', "liveness: { factor: 1, source: 'your-input'", "liveness: { factor: 1, source: 'record'"],
  ['the needs_sponsorship type check is removed', 'persona.mjs', "if (typeof needsSponsorship !== 'boolean') {", 'if (false) {'],
  ['a small sample can be Proven on its rate alone', 'evidence.mjs', 'if (approvals >= proven.min_approvals && rate >= proven.min_rate_pct)', 'if (rate >= proven.min_rate_pct)'],
  ['an ambiguous watchlist name resolves to the first match', 'preopt-sponsor-tiers.mjs', 'else if (hits.length > 1) rows.push', 'else if (hits.length > 999) rows.push'],
  ['the privacy guard for real data is switched off', 'guard.mjs', 'if (treatedAsReal && !outIsPrivate) {', 'if (false) {'],
  ['the title sampler counts unreadable lists as readable', 'check-titles.mjs', 'unreadable += 1; continue;', 'continue;'],
  ['the run log records this machine\'s absolute wage-file path again', 'preopt-sponsor-tiers.mjs', 'bls_reference: { ...bls, source: { ...bls.source, file: rel(paths.bls) } },', 'bls_reference: bls,'],
  ['a hex escape in a title list is no longer decoded', 'evidence.mjs', "if (n === 'x' && hex(2) !== null)", 'if (false)'],
  ['a sample run may write anywhere inside the repository', 'guard.mjs', 'if (!treatedAsReal && !outIsPrivate && !outIsOwnRuns) {', 'if (false) {'],
  ['any watchlist is treated as a committed sample', 'guard.mjs', 'if (inputs.watchlist && !(', 'if (false && inputs.watchlist && !('],
  ['a missing Form D folder that was asked for is ignored', 'preopt-sponsor-tiers.mjs', "if (opts.formdDir && formd.status !== 'ok')", 'if (false)'],
  ['malformed persona YAML is no longer an input error', 'persona.mjs', 'throw new InputError(`persona file is not valid YAML:', 'throw new Error(`persona file is not valid YAML:'],
  ['the two Form D "newer" classes are swapped', 'evidence.mjs', "'form-d-filed-after-table-end' : 'form-d-missed-by-table';", "'form-d-missed-by-table' : 'form-d-filed-after-table-end';"],
  ['a row with no usable name is dropped from the funnel without being counted', 'preopt-sponsor-tiers.mjs', 'if (!norm) { noUsableName += 1; return; }', 'if (!norm) { return; }'],
  ['a skipped Proven or Likely company is explained as a Thin one', 'report.mjs', "if (r.tier?.tier === 'Thin') return r.tier.reason;", 'if (true) return r.tier.reason;'],
  ['the stale-data refusal is switched off', 'preopt-sponsor-tiers.mjs', 'if (stale && !opts.acceptStaleVintage) {', 'if (false) {'],
  ['a rate exactly on the Proven bar is not Proven', 'evidence.mjs', 'if (approvals >= proven.min_approvals && rate >= proven.min_rate_pct) {', 'if (approvals >= proven.min_approvals && rate > proven.min_rate_pct) {'],
  ['a rate exactly on the Likely bar is not Likely', 'evidence.mjs', 'if (approvals >= likely.min_approvals && rate >= likely.min_rate_pct) {', 'if (approvals >= likely.min_approvals && rate > likely.min_rate_pct) {'],
  ['a count exactly on the Proven bar is not Proven', 'evidence.mjs', 'approvals >= proven.min_approvals &&', 'approvals > proven.min_approvals &&'],
  ['the integrity check looks at the liveness gate only, not the timeline gate', 'scorer-bridge.mjs', "for (const name of ['liveness', 'timeline']) {", "for (const name of ['liveness']) {"],
  ['the integrity check no longer notices the same role returned twice', 'scorer-bridge.mjs', 'if (returned.has(r.role_id)) problems.push(`the scorer returned role_id ${r.role_id} twice`);', ''],
  ['real data may no longer be written to private/', 'guard.mjs', "const outIsPrivate = out === null || startsWithDir(out, 'private');", 'const outIsPrivate = out === null;'],
  ['a closed timeline gate is explained as a small multiplier', 'report.mjs', 'if (closed) return timeline.factor === 0 ? ', 'if (false) return timeline.factor === 0 ? '],
  ['name suffixes are stripped once, not repeatedly', 'evidence.mjs', 'if (next !== cleaned) { cleaned = next.trim(); changed = true; }', 'if (next !== cleaned) { cleaned = next.trim(); }'],
  ['paths are compared by their spelling, not by where they really are', 'paths.mjs', 'const r = path.relative(canonicalPath(parent), canonicalPath(child));', 'const r = path.relative(path.resolve(parent), path.resolve(child));'],
  ['a folder whose name starts with two dots is taken to be outside the repository', 'paths.mjs', "if (r === '..' || r.startsWith(`..${path.sep}`) || path.isAbsolute(r)) return null;", "if (r.startsWith('..') || path.isAbsolute(r)) return null;"],
  ['a persona that does not need sponsorship is accepted', 'preopt-sponsor-tiers.mjs', 'if (persona.needs_sponsorship === false) {', 'if (false) {'],
  ['a company table that is not the repository\'s is treated as a committed sample', 'guard.mjs', 'if (!(isDefault(inputs.csv, defaults.csv) || isFixture(inputs.csv))) reasons.push(', 'if (false) reasons.push('],
  ['a negative record is described as a low rate', 'evidence.mjs', 'approvals === 0 && denials > 0', 'false'],
  ['0 approvals and 0 denials becomes a Thin tier', 'evidence.mjs', "if (approvals + denials === 0) return { status: 'empty-record' };", ''],
  ['a run that scored nothing leaves an earlier run\'s scorer files in place', 'preopt-sponsor-tiers.mjs', "if (!scorer.command) for (const f of ['role-scores.json', 'role-scores.md']) fs.rmSync(path.join(outDir, f), { force: true });", ''],
  ['a stand-in scorer is reported as the repository\'s own', 'preopt-sponsor-tiers.mjs', "const isRepoScorer = !opts.scorerPath || relativeInside(scorerFile, REPO_ROOT) === 'scripts/score/role-scorer.mjs';", 'const isRepoScorer = true;'],
  ['a timeline factor the scorer treats as closed does not close gate G3', 'preopt-sponsor-tiers.mjs', 'const timelineClosed = timeline.factor === 0 || (gateZero !== null && timeline.factor <= gateZero);', 'const timelineClosed = timeline.factor === 0;'],
  ['a Form D record filed after the table\'s newest date is judged by its first-sale date', 'evidence.mjs', '(rec.filed ?? rec.first_sale) > vintageIso', 'rec.first_sale > vintageIso'],
  ['the title-list reader accepts separators Python never writes', 'evidence.mjs', "if (s[i] === ',' && s[i + 1] === ' ') { i += 2; continue; }", "if (s[i] === ',') { i += 1; while (s[i] === ' ') i += 1; continue; }"],
  ['"Member of Technical Staff" is counted as a senior title again', 'role-families.json', '(?<!technical\\\\s)staff', 'staff'],
  ['a company with several Form D records keeps only the last one\'s class', 'preopt-sponsor-tiers.mjs', "ctx.formdByNorm.get(norm)?.join(' + ') ?? null", 'ctx.formdByNorm.get(norm)?.at(-1) ?? null'],
  ['the sponsorship term sent to the scorer is labelled a record again', 'scorer-bridge.mjs', "source: 'your-input', note: 'the tier is classified", "source: 'record', note: 'the tier is classified"],
  ['a watchlist with no names is accepted', 'preopt-sponsor-tiers.mjs', 'if (watch.names.length === 0) throw new InputError(', 'if (false) throw new InputError('],
  ['a role family name can be any property every object has', 'preopt-sponsor-tiers.mjs', 'Object.hasOwn(families, persona.target_role.family) ? families[persona.target_role.family] : undefined', 'families[persona.target_role.family]'],
  ['an output folder that is a file is not noticed', 'preopt-sponsor-tiers.mjs', 'if (fs.existsSync(outDir) && !fs.statSync(outDir).isDirectory()) throw new InputError(', 'if (false) throw new InputError('],
  ['the recorded command carries this machine\'s absolute paths', 'preopt-sponsor-tiers.mjs', 'rel(path.resolve(values[k]))', 'path.resolve(values[k])'],
  ['paths outside the repository are written in full into outputs', 'paths.mjs', 'return `<outside the repository>/${path.basename(path.resolve(p))}`;', 'return path.resolve(p);'],
  ['a label stops starting with one of the four kinds', 'report.mjs', "'tier.p': 'your-input: a fixed number per tier", "'tier.p': 'a fixed number per tier"],
  ['a run without --out-dir writes into the tracked sample-run folder', 'preopt-sponsor-tiers.mjs', "outBase: 'private/tiers-run',", "outBase: 'course/2026fa/submissions/aravindkumar2504/runs',"],
  ['a Form D "folder" that is a file is not noticed', 'evidence.mjs', 'if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory())', 'if (!dir || !fs.existsSync(dir))'],
  ['a recent company already on the candidate\'s own list is dropped from the funnel without being counted', 'preopt-sponsor-tiers.mjs', 'if (watchIdx.has(i)) { onCandidateList += 1; return; }', 'if (watchIdx.has(i)) { return; }'],

  ['a skip rate of 50% or more is described as low', 'report.mjs', 'else if (skipRate < 50)', 'else if (true)'],
  ['a run that scored nothing still states a skip rate', 'report.mjs', 'if (!sm.scorer_roles) o.push(', 'if (false) o.push('],
  ['the report says nothing about rows left out because a cell could not be read', 'report.mjs', 'if (unreadable.length) o.push(', 'if (false) o.push('],
  ['the report names rows with an unreadable title list but never rows with an unreadable funding date', 'report.mjs', 'if (nDates) unreadable.push(', 'if (false) unreadable.push('],
  ['the report calls every funnel count a plain record count', 'report.mjs', 'The first two rows are plain counts of the table (record).', 'All rows are plain counts of the table (record).'],
  ['the title-sample command accepts a seed that is not a number', 'check-titles.mjs', 'if (!/^\\d+$/.test(text) || Number(text) < min) fail(', 'if (false) fail('],
  ['the title-sample command does nothing when it is reached through a symbolic link', 'check-titles.mjs', "const entry = process.argv[1] ? fs.realpathSync(process.argv[1]) : null;", "const entry = process.argv[1] ? path.resolve(process.argv[1]) : null;"],
];

let values;
try { ({ values } = parseArgs({ options: { list: { type: 'boolean' }, only: { type: 'string' } }, strict: true })); } catch (e) { console.error(`error: ${e.message}\nusage: break-it.mjs [--list] [--only B03,B07]`); process.exit(2); }
const only = values.only ? new Set(values.only.split(',')) : null;
const id = (n) => `B${String(n + 1).padStart(2, '0')}`;
if (values.list) { BREAKS.forEach(([what], n) => console.log(`${id(n)} ${what}`)); process.exit(0); }
if (only && [...only].some((x) => !BREAKS.some((_, n) => id(n) === x))) { console.error(`error: unknown break in --only (see --list)`); process.exit(2); }

// 1. a private copy of the working tree: without the dependencies (which are linked), without git, and without the
//    folders where real data may sit (private/, data/ats/, and everything in search/ except the fictional examples), so
//    an interrupted run, which cannot clean up after itself, leaves no personal data behind in the temporary folder
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'break-it-'));
const copy = path.join(work, 'repo');
const SKIP = new Set(['node_modules', '.git', '.venv', '__pycache__']);
const keep = (src) => {
  if (SKIP.has(path.basename(src))) return false;
  const rel = path.relative(REPO, src).split(path.sep).join('/');
  if (rel === 'private' || rel === 'data/ats') return false;
  if (rel.startsWith('search/') && rel !== 'search/examples' && !rel.startsWith('search/examples/')) return false;
  return true;
};
fs.cpSync(REPO, copy, { recursive: true, filter: keep });
fs.mkdirSync(path.join(copy, 'private'));
if (fs.existsSync(path.join(REPO, 'node_modules'))) fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
const proto = path.join(copy, PROTO);
const tests = fs.readdirSync(proto).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join(proto, f));

const NOT_A_CATCH = /^the committed sample run was made by the current code/;
const suite = () => {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...tests], { cwd: copy, encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 26 });
  const failing = [...new Set([...r.stdout.matchAll(/^✖ (.+?) \(\d[\d.]*ms\)$/gm)].map((m) => m[1]))].filter((n) => !NOT_A_CATCH.test(n));
  return { passed: r.status === 0, timedOut: r.error?.code === 'ETIMEDOUT', failing };
};

let exitCode = 0;
try {
  const base = suite();
  if (!base.passed) { console.error(`the suite fails on the UNBROKEN copy (${base.failing.join('; ') || 'see its output'}); fix that first`); process.exit(1); }
  console.log(`the suite passes on the unbroken copy; trying ${only ? only.size : BREAKS.length} breaks\n`);
  let caught = 0;
  let tried = 0;
  BREAKS.forEach(([what, file, find, replace], n) => {
    if (only && !only.has(id(n))) return;
    tried += 1;
    const target = path.join(proto, file);
    const original = fs.readFileSync(target, 'utf8');
    const found = original.split(find).length - 1;
    if (found !== 1) { console.log(`${id(n)} ${what.padEnd(84)} COULD NOT APPLY: the search text is in ${file} ${found} times, not once`); exitCode = 1; return; }
    fs.writeFileSync(target, original.replace(find, () => replace));
    const r = suite();
    fs.writeFileSync(target, original);
    if (r.timedOut) { console.log(`${id(n)} ${what.padEnd(84)} TIMED OUT (not a catch: run it again, and look for a hang if it repeats)`); exitCode = 1; return; }
    if (r.passed || r.failing.length === 0) { console.log(`${id(n)} ${what.padEnd(84)} SURVIVED (no test failed${r.passed ? '' : ' except the one that checks the committed run is current'})`); exitCode = 1; return; }
    caught += 1;
    console.log(`${id(n)} ${what.padEnd(84)} caught by ${r.failing.length} test(s)${r.failing[0] ? `: ${r.failing[0].slice(0, 60)}` : ''}`);
  });
  console.log(`\n${caught} of ${tried} deliberate breaks were caught by the tests`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
process.exit(exitCode);
