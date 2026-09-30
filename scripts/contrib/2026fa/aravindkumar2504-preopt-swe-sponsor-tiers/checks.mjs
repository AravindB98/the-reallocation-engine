#!/usr/bin/env node
// checks.mjs: the small checks behind the pasted evidence in the worked run and the test report, written down so that
// anyone can run the same command and get the same output. None of them changes a tracked file: each writes only
// under /tmp/tiers-checks (or the folder named in TIERS_CHECKS_OUT).
//
//   node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/checks.mjs <check> [arguments]
//
//   scenarios              the timeline gate across dates: five runs of the program, then a table read from their logs
//   scorer-probe           one role scored by the repository's own scorer under four profiles (the scorer's status defect)
//   watchlist [folder]     where each name on the sample watchlist landed, read from a run log (default: the committed sample run)
//   source NAME...         the raw company-table cells for each named company beside the run log's values, arithmetic redone
//   formd-pairs [folder]   the Form D sample records that matched a company in the table, read from a run log
//   parity-names           the JavaScript name rule against the Python original, on every company name
//   parity-titles          the JavaScript title-list reader against Python's ast.literal_eval, on every title cell
//
// Run from the repository root. parity-names and parity-titles need python3. Exit code 0 means the check found nothing
// wrong; 1 means it found a difference; 2 means it was used wrongly.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCompanies, normalizeName, parseTitles } from './evidence.mjs';
import { parsePersonaText } from './persona.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const PROTO = 'scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers';
const OUT = process.env.TIERS_CHECKS_OUT || '/tmp/tiers-checks';
const COMMITTED_RUN = 'course/2026fa/submissions/aravindkumar2504/runs/2026-09-30';
const CSV = 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv';
const FORMD = 'data/sec/form-d/processed/sample';

const pad = (v, n) => String(v ?? '').padEnd(n);
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const runLogIn = (folder) => readJson(path.join(path.resolve(REPO, folder ?? COMMITTED_RUN), 'run-log.json'));
const fresh = (dir) => { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); return dir; };
const python = (code, input) => {
  const r = spawnSync('python3', ['-c', code], { cwd: REPO, input: JSON.stringify(input), encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`python3 failed: ${r.stderr.trim().split('\n').pop()}`);
  return JSON.parse(r.stdout);
};

// ── scenarios ────────────────────────────────────────────────────────────────────────────────────────────
function scenarios() {
  const watchlist = `${PROTO}/sample-inputs/watchlist.txt`;
  const list = [
    ['kiran-today', ['--as-of', '2026-09-30']],
    ['kiran-2027-06-01', ['--as-of', '2027-06-01']],
    ['kiran-2027-08-01', ['--as-of', '2027-08-01', '--days-used', '61']],
    ['kiran-2028-07-01', ['--as-of', '2028-07-01']],
    ['priya-nair-persona', ['--as-of', '2026-09-30', '--persona', 'search/examples/priya-nair/profile.yml', '--soc', '15-1252', '--family', 'backend-platform-swe', '--days-to-start', '75']],
  ];
  const table = [];
  let bad = false;
  for (const [name, extra] of list) {
    const out = path.join(OUT, 'scenarios', name);
    fresh(out);
    const args = [`${PROTO}/preopt-sponsor-tiers.mjs`, ...extra, '--accept-stale-vintage', '--watchlist', watchlist, '--out-dir', out];
    console.log(`$ node ${args.join(' ')}`);
    const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8' });
    for (const l of `${r.stdout}${r.stderr}`.trim().split('\n').slice(0, 2)) console.log(`    ${l}`);
    if (r.status !== 0) { console.log(`    exit ${r.status}`); bad = true; continue; }
    const log = readJson(path.join(out, 'run-log.json'));
    const count = (v) => log.rows.filter((x) => x.scorer?.recommendation === v).length;
    table.push([name, log.timeline.factor, log.timeline.reason, count('Apply'), count('Consider'), count('Skip'), log.summary.scorer_roles, log.timeline.dates.expected_start, `${log.timeline.days.projected_at_start}/${log.timeline.days.ceiling}`]);
  }
  console.log('');
  console.log(`${pad('scenario', 20)} ${pad('factor', 7)} ${pad('reason', 30)} ${pad('Apply', 6)} ${pad('Consider', 9)} ${pad('Skip', 5)} ${pad('scored', 7)} | ${pad('expected start', 15)} | unemployment days projected/ceiling`);
  for (const t of table) console.log(`${pad(t[0], 20)} ${pad(t[1], 7)} ${pad(t[2], 30)} ${pad(t[3], 6)} ${pad(t[4], 9)} ${pad(t[5], 5)} ${pad(t[6], 7)} | ${pad(t[7], 15)} | ${t[8]}`);
  if (bad) process.exitCode = 1;
}

// ── scorer-probe ─────────────────────────────────────────────────────────────────────────────────────────
function scorerProbe() {
  const role = readJson(path.join(REPO, 'data/examples/ch11-roles.json')).find((r) => r.role_id === 'biotech-data');
  const dir = fresh(path.join(OUT, 'scorer-probe'));
  const rolesFile = path.join(dir, 'roles.json');
  fs.writeFileSync(rolesFile, `${JSON.stringify([role], null, 2)}\n`);
  // the older persona's own wording, read from its file, is the free text the scorer misreads
  const older = parsePersonaText(fs.readFileSync(path.join(REPO, 'search/examples/aarav-patel/profile.yml'), 'utf8')).visa.current_status;
  const profiles = {
    'noprofile': null,
    'safe-text': { authorization: 'F-1 STEM OPT (EAD); requires H-1B sponsorship' },
    'aarav-freetext': { authorization: older },
    'freetext-plus-explicit': { authorization: older, needs_sponsorship: true },
  };
  console.log(`the older persona's own wording, from search/examples/aarav-patel/profile.yml: ${JSON.stringify(older)}`);
  console.log(`role: ${role.role_id} from data/examples/ch11-roles.json (sponsorship ${role.sponsorship.p}, fit ${role.fit.p}, liveness ${role.liveness.factor}, timeline ${role.timeline.factor}); scorer: scripts/score/role-scorer.mjs`);
  for (const [name, profile] of Object.entries(profiles)) {
    const out = path.join(dir, name);
    const args = ['scripts/score/role-scorer.mjs', rolesFile, '--out-dir', out];
    if (profile) { const f = path.join(dir, `${name}.profile.json`); fs.writeFileSync(f, JSON.stringify(profile)); args.push('--profile', f); }
    const r = spawnSync(process.execPath, args, { cwd: REPO, encoding: 'utf8' });
    if (r.status !== 0) { console.log(`${pad(name, 26)} the scorer exited ${r.status}: ${r.stderr.trim()}`); process.exitCode = 1; continue; }
    const j = readJson(path.join(out, 'role-scores.json'));
    const s = j.roles[0];
    console.log(`${pad(name, 26)} needs_sponsorship=${pad(j.profile_needs_sponsorship, 5)} composite=${s.composite} => ${s.recommendation} | ${s.trace.arithmetic}`);
  }
}

// ── watchlist ────────────────────────────────────────────────────────────────────────────────────────────
function watchlist(folder) {
  const log = runLogIn(folder);
  console.log(`${pad('name', 26)} ${pad('bucket', 22)} ${pad('tier', 22)} scorer`);
  for (const r of log.rows.filter((x) => x.origin === 'watchlist')) {
    console.log(`${pad(r.company, 26)} ${pad(r.bucket, 22)} ${pad(r.tier?.tier ?? '-', 22)} ${r.scorer ? `${r.scorer.composite.toFixed(3)} ${r.scorer.recommendation}` : '-'}`);
  }
}

// ── source ───────────────────────────────────────────────────────────────────────────────────────────────
function source(names) {
  if (names.length === 0) { console.error('usage: checks.mjs source "COMPANY NAME" ...  (the name exactly as the company table spells it)'); process.exit(2); }
  const csv = loadCompanies(path.join(REPO, CSV));
  const log = runLogIn();
  const median = log.bls_reference.annual_median_wage;
  let mismatches = 0;
  for (const name of names) {
    const hits = csv.rows.map((r, i) => [r, i]).filter(([r]) => r.company_name === name);
    if (hits.length === 0) { console.log(`--- ${name}: no row in the company table has exactly this company_name`); mismatches += 1; continue; }
    for (const [r, i] of hits) {
      const cut = (s) => (s.length > 150 ? `${s.slice(0, 150)}...` : s);
      console.log(`--- ${r.company_name}: company table, row ${i + 2} (the contact and officer columns are not printed)`);
      console.log(`    industry=${r.industry} | total_funding=${r.total_funding} | latest funding ${r.latest_funding_date} ${r.latest_funding_stage} ${r.latest_funding_amount}`);
      console.log(`    Total Approvals=${r['Total Approvals']} Total Denials=${r['Total Denials']} Approval_Rate=${r.Approval_Rate} | median_salary_offered=${r.median_salary_offered}`);
      console.log(`    top_job_titles_sponsored=${cut(r.top_job_titles_sponsored)}`);
      const row = log.rows.find((x) => x.csv_row_number === i + 2);
      if (!row) { console.log('    committed run log: this company is not in the run'); continue; }
      console.log(`    committed run log: bucket=${row.bucket} tier=${row.tier?.tier ?? '-'} approvals/denials=${row.sponsorship ? `${row.sponsorship.approvals}/${row.sponsorship.denials}` : '-'} rate=${row.tier?.rate_pct ?? '-'} wage ratio=${row.wage?.ratio ?? '-'} scorer=${row.scorer ? `${row.scorer.composite} ${row.scorer.recommendation} [${row.scorer.arithmetic}]` : '-'}`);
      if (row.sponsorship) {
        const a = Number(r['Total Approvals']);
        const d = Number(r['Total Denials']);
        const rate = Math.round((10000 * a) / (a + d)) / 100;
        const same = rate === row.tier.rate_pct;
        console.log(`    redone: 100 * ${a} / (${a} + ${d}) = ${rate}% -> run log says ${row.tier.rate_pct}% ${same ? '(match)' : '(MISMATCH)'}`);
        if (!same) mismatches += 1;
        const offered = Number(r.median_salary_offered);
        if (Number.isFinite(offered) && offered > 0 && row.wage?.status === 'ok') {
          const ratio = Math.round((100 * offered) / median) / 100;
          const ok = ratio === row.wage.ratio;
          console.log(`    redone: ${offered} / ${median} (the BLS national median for SOC ${log.bls_reference.soc}) = ${ratio}x -> run log says ${row.wage.ratio}x ${ok ? '(match)' : '(MISMATCH)'}`);
          if (!ok) mismatches += 1;
        }
      }
    }
  }
  if (mismatches) process.exitCode = 1;
}

// ── formd-pairs ──────────────────────────────────────────────────────────────────────────────────────────
function formdPairs(folder) {
  const fc = runLogIn(folder).form_d_crosscheck;
  console.log(`${fc.records_examined} sample records examined; ${fc.matched} matched exactly one company in the table (${new Set(fc.pairs.map((p) => p.company)).size} companies); ${fc.ambiguous} ambiguous; ${fc.unmatched} unmatched`);
  console.log(`${pad('company', 33)} ${pad('class', 30)} ${pad('table latest', 13)} ${pad('first sale', 11)} filed`);
  for (const p of fc.pairs) console.log(`${pad(p.company, 33)} ${pad(p.class, 30)} ${pad(p.csv_date ?? '-', 13)} ${pad(p.form_d_first_sale ?? '-', 11)} ${p.form_d_filed ?? '-'}`);
  console.log(`counts: ${Object.entries(fc.counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
}

// ── parity-names ─────────────────────────────────────────────────────────────────────────────────────────
function parityNames() {
  const names = loadCompanies(path.join(REPO, CSV)).rows.map((r) => r.company_name);
  const tableNames = names.length;
  for (const f of fs.readdirSync(path.join(REPO, FORMD)).filter((x) => x.endsWith('.json')).sort()) {
    for (const c of readJson(path.join(REPO, FORMD, f)).companies) names.push(c?.company?.name ?? '');
  }
  const py = python(
    "import importlib.util, json, sys\nspec = importlib.util.spec_from_file_location('er', 'scripts/sec/entity-resolution.py')\nm = importlib.util.module_from_spec(spec)\nspec.loader.exec_module(m)\njson.dump([m.normalize_company_name(n) for n in json.load(sys.stdin)], sys.stdout)\n",
    names,
  );
  const diffs = names.map((n, i) => [n, normalizeName(n), py[i]]).filter(([, js, p]) => js !== p);
  console.log(`names compared (${tableNames.toLocaleString('en-US')} company names in the table + ${names.length - tableNames} Form D sample names): ${names.length}`);
  console.log(`JavaScript normalizeName vs Python normalize_company_name in scripts/sec/entity-resolution.py, differences: ${diffs.length}`);
  for (const [n, js, p] of diffs.slice(0, 5)) console.log(`  ${JSON.stringify(n)}: JS ${JSON.stringify(js)}, Python ${JSON.stringify(p)}`);
  if (diffs.length) process.exitCode = 1;
}

// ── parity-titles ────────────────────────────────────────────────────────────────────────────────────────
function parityTitles() {
  const cells = loadCompanies(path.join(REPO, CSV)).rows.map((r) => r.top_job_titles_sponsored).filter((c) => c.trim() !== '');
  const py = python(
    "import ast, json, sys\nout = []\nfor cell in json.load(sys.stdin):\n    try:\n        out.append(ast.literal_eval(cell.strip()))\n    except Exception as e:\n        out.append('ERROR ' + type(e).__name__)\njson.dump(out, sys.stdout)\n",
    cells,
  );
  const diffs = [];
  cells.forEach((cell, i) => {
    let js;
    try { js = parseTitles(cell); } catch (e) { js = `ERROR ${e.name}`; }
    if (JSON.stringify(js) !== JSON.stringify(py[i])) diffs.push([cell, js, py[i]]);
  });
  console.log(`title cells compared (every non-blank top_job_titles_sponsored cell in the table): ${cells.length}`);
  console.log(`cells containing a backslash escape: ${cells.filter((c) => c.includes('\\')).length}`);
  console.log(`JavaScript parseTitles vs Python ast.literal_eval, differences: ${diffs.length}`);
  for (const [cell, js, p] of diffs.slice(0, 5)) console.log(`  ${JSON.stringify(cell.slice(0, 80))}: JS ${JSON.stringify(js)}, Python ${JSON.stringify(p)}`);
  if (diffs.length) process.exitCode = 1;
}

const [, , what, ...rest] = process.argv;
const checks = { scenarios, 'scorer-probe': scorerProbe, watchlist: () => watchlist(rest[0]), source: () => source(rest), 'formd-pairs': () => formdPairs(rest[0]), 'parity-names': parityNames, 'parity-titles': parityTitles };
if (!checks[what]) {
  console.error(`usage: checks.mjs <${Object.keys(checks).join('|')}> [arguments]`);
  process.exit(2);
}
checks[what]();
