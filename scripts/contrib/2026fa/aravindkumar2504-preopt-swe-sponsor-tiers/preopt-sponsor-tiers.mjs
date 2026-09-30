#!/usr/bin/env node
// preopt-sponsor-tiers.mjs: the prototype for the pre-OPT backend sponsor-tiers recipe.
//
//   node scripts/contrib/2026fa/aravindkumar2504-preopt-swe-sponsor-tiers/preopt-sponsor-tiers.mjs \
//        --as-of 2026-09-30 --accept-stale-vintage [--watchlist file.txt] [--discover 15]
//
// What it does, in order (each step can stop the run with a clear message):
//   G1  read and check the persona (no silent defaults)
//   G0  read the 80 Days CSV, find its newest funding date, refuse to run on old data
//       unless told to accept it
//   G3  compute the visa-timeline factor from the persona's dates
//       resolve the candidate's own company list (exact normalized-name match only)
//       and search the CSV for companies with a backend-style sponsored title
//       turn each company's H-1B record into a tier; silence stays "unknown"
//   G2  run the repo's scorer as a command, then check what it says back
//   write run-log.json (for the agent) and report.md (for the person)
//
// Human gates H1 (is the posting live?) and H2 (does the posting hide an eligibility trap?)
// are never automated: every "Apply" from this program means "worth clearing H1 and H2".
//
// Exit codes: 0 done · 2 bad input · 3 data too old · 4 scorer integrity check failed · 5 scorer failed.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { InputError, isoToDay, monthsBetween, timelineFactor } from './timeline.mjs';
import { loadPersona } from './persona.mjs';
import {
  buildNameIndex, compileFamily, crossCheckFormD, fundingFacts, levelNote, loadBlsRow, loadCompanies,
  loadFormD, normalizeName, parseTitles, sha256Buffer, sha256File, slugify, splitTitles, sponsorshipRecord, tierFor,
  vintageOf, wageComparison,
} from './evidence.mjs';
import { IntegrityError, ScorerError, assertScorerIntegrity, buildRole, buildScorerProfile, runScorer } from './scorer-bridge.mjs';
import { LABELS, orderRows, renderReport, renderRunLog } from './report.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '..', '..', '..', '..');
export const RECIPE = 'aravindkumar2504-preopt-swe-sponsor-tiers';
export const RECIPE_VERSION = '0.1.0';

export class StaleVintageError extends Error {
  constructor(message) { super(message); this.name = 'StaleVintageError'; }
}

const DEFAULTS = {
  persona: 'search/examples/kiran-rao/profile.yml',
  csv: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
  formdDir: 'data/sec/form-d/processed/sample',
  outBase: 'course/2026fa/submissions/aravindkumar2504/runs',
};

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const rel = (p) => { const r = path.relative(REPO_ROOT, p); return r.startsWith('..') || path.isAbsolute(r) ? p : r.split(path.sep).join('/'); };
const round1 = (x) => Math.round(x * 10) / 10;
const fileRecord = (p, extra = {}) => ({ path: rel(p), sha256: sha256File(p), ...extra });

/** The prototype's own source files, hashed, so a run log says exactly which code produced it. */
const CODE_FILES = ['preopt-sponsor-tiers.mjs', 'evidence.mjs', 'persona.mjs', 'report.mjs', 'scorer-bridge.mjs', 'timeline.mjs'];
function codeRecord() {
  const files = CODE_FILES.map((f) => ({ path: rel(path.join(HERE, f)), sha256: sha256File(path.join(HERE, f)) }));
  return { files, combined_sha256: sha256Buffer(Buffer.from(files.map((f) => f.sha256).join('\n'))) };
}

export function parseWatchlist(text) {
  const names = [];
  const seen = new Set();
  const duplicates = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const key = normalizeName(line) || line;
    if (seen.has(key)) { duplicates.push(line); continue; }
    seen.add(key);
    names.push(line);
  }
  return { names, duplicates };
}

/** Turn one dataset row into an evidence record with a bucket. Pure: reads only its arguments. */
export function evaluateRow(rowIndex, origin, ctx) {
  const row = ctx.rows[rowIndex];
  const norm = normalizeName(row.company_name);
  const base = {
    origin,
    company: row.company_name,
    industry: row.industry || null,
    csv_row_number: rowIndex + 2,
    funding: fundingFacts(row, ctx.vintage.day, ctx.params.funding_window_months.value, ctx.params.days_per_month.value),
    form_d_check: ctx.formdByNorm.get(norm) ?? null,
  };
  const rec = sponsorshipRecord(row);
  if (rec.status === 'no-record') {
    return { ...base, bucket: 'hold_unknown', note: 'no H-1B record under this exact name; the record may be genuinely absent or filed under another name (silent, not negative)' };
  }
  if (rec.status === 'incomplete-record') {
    return { ...base, bucket: 'hold_data_problem', note: `approvals or denials unreadable (approvals ${JSON.stringify(rec.raw.approvals)}, denials ${JSON.stringify(rec.raw.denials)})` };
  }
  let titles;
  try { titles = parseTitles(row.top_job_titles_sponsored); } catch (e) {
    return { ...base, bucket: 'hold_data_problem', note: `sponsored-title list unreadable: ${e.message}` };
  }
  if (!titles || titles.length === 0) {
    return { ...base, bucket: 'hold_role_unverified', note: 'the record has approvals but lists no sponsored titles' };
  }
  const { matched, unmatched } = splitTitles(titles, ctx.fam);
  const tier = tierFor({ approvals: rec.approvals, denials: rec.denials, matchedTitles: matched }, ctx.params.tiers);
  const common = {
    ...base,
    sponsorship: { approvals: rec.approvals, denials: rec.denials, given_rate_pct: rec.given_rate_pct, rate_consistent: rec.rate_consistent, median_salary_offered: rec.median_salary_offered },
    tier,
    titles: { matched, unmatched_count: unmatched.length, all: titles },
    level_note: levelNote(matched, ctx.fam),
    wage: wageComparison(rec.median_salary_offered, ctx.bls),
  };
  if (!tier.scored) return { ...common, bucket: 'hold_role_unverified', note: `${tier.reason}; listed titles: ${titles.slice(0, 5).join('; ')}` };
  return { ...common, scored: true, role_id: `sponsor-${slugify(row.company_name)}`, matched_titles: matched };
}

/** The whole run. Throws InputError, StaleVintageError, IntegrityError or ScorerError; otherwise writes outputs. */
export function run(opts) {
  const abs = (p, dflt) => path.resolve(p ?? path.join(REPO_ROOT, dflt));
  const asOf = opts.asOf ?? new Date().toISOString().slice(0, 10);
  const asOfDay = isoToDay(asOf);
  const paths = {
    persona: abs(opts.persona, DEFAULTS.persona),
    csv: abs(opts.csv, DEFAULTS.csv),
    bls: abs(opts.bls, DEFAULTS.bls),
    formd: abs(opts.formdDir, DEFAULTS.formdDir),
    params: path.join(HERE, 'params.json'),
    families: path.join(HERE, 'role-families.json'),
  };
  const outDir = abs(opts.outDir, path.join(DEFAULTS.outBase, asOf));
  const discoverLimit = opts.discover ?? 15;
  const params = readJson(paths.params);

  // Privacy guard. The repository is public, so a run may write into a tracked folder only when every input is a
  // committed sample: a persona under search/examples/ and, if one is given, a watchlist under this folder's
  // sample-inputs/ or fixtures/. Any other persona or watchlist is treated as real data (the outputs carry the
  // candidate's dates and the companies they are watching) and its output must go to private/ (gitignored) or
  // outside the repository. Even a sample run may write only inside this recipe's own runs folder, never over
  // some other tracked file.
  const isUnder = (child, parent) => { const r = path.relative(parent, child); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };
  const fictionalPersona = isUnder(paths.persona, path.join(REPO_ROOT, 'search', 'examples'));
  const sampleWatchlist = !opts.watchlist || ['sample-inputs', 'fixtures'].some((d) => isUnder(path.resolve(opts.watchlist), path.join(HERE, d)));
  const treatedAsReal = !fictionalPersona || !sampleWatchlist;
  const outIsPrivate = !isUnder(outDir, REPO_ROOT) || isUnder(outDir, path.join(REPO_ROOT, 'private'));
  const outIsOwnRuns = isUnder(outDir, path.join(REPO_ROOT, DEFAULTS.outBase));
  if (treatedAsReal && !outIsPrivate) {
    throw new InputError(`${!fictionalPersona ? 'this persona is outside search/examples/' : 'this watchlist is not one of the committed samples'}, so it is treated as real data, and the output folder is inside the repository but not under private/`, [
      `persona: ${rel(paths.persona)}`,
      ...(opts.watchlist ? [`watchlist: ${rel(path.resolve(opts.watchlist))}`] : []),
      `output folder: ${rel(outDir)}`,
      'pass --out-dir private/<name> (gitignored) or a folder outside the repository; committing a real persona\'s dates or a real watchlist is a zero-condition offense (DATA_CONTRACT.md)',
    ]);
  }
  if (!treatedAsReal && !outIsPrivate && !outIsOwnRuns) {
    throw new InputError('the output folder is inside the repository but outside this recipe\'s own runs folder, so the run could overwrite another tracked file', [
      `output folder: ${rel(outDir)}`,
      `use ${DEFAULTS.outBase}/<name>, private/<name>, or a folder outside the repository`,
    ]);
  }

  // G1: persona
  const persona = loadPersona(paths.persona, { soc: opts.soc, family: opts.family, daysUsed: opts.daysUsed, daysToStart: opts.daysToStart });
  const famDef = readJson(paths.families).families[persona.target_role.family];
  if (!famDef) throw new InputError(`unknown role family ${JSON.stringify(persona.target_role.family)}; see role-families.json`);
  const socNote = famDef.soc !== persona.target_role.soc
    ? `role family ${persona.target_role.family} is defined for SOC ${famDef.soc}; this run uses SOC ${persona.target_role.soc} only for the wage reference`
    : null;
  const fam = compileFamily(famDef);

  // G0: data and its vintage
  const csv = loadCompanies(paths.csv);
  const index = buildNameIndex(csv.rows);
  const vintage = vintageOf(csv.rows);
  if (asOfDay < vintage.day) throw new InputError(`run date ${asOf} is before the newest funding date in the data (${vintage.iso})`);
  const ageMonths = monthsBetween(vintage.day, asOfDay, params.days_per_month.value);
  const limit = params.max_vintage_age_months.value;
  const stale = ageMonths > limit;
  if (stale && !opts.acceptStaleVintage) {
    throw new StaleVintageError(`refusing to run: the newest funding date in the data is ${vintage.iso}, ${round1(ageMonths)} months before the run date ${asOf} (limit ${limit}). Recent raises and filings may be missing. Re-run with --accept-stale-vintage to proceed knowingly; the report will state the age.`);
  }

  // G3: timeline
  const timeline = timelineFactor({
    asOf, eadStart: persona.visa.ead_start_date, authEnd: persona.visa.opt_end_date,
    daysUsed: persona.visa.unemployment_days_used, ceiling: persona.visa.unemployment_ceiling,
    buffer: persona.visa.buffer_target, daysToStart: persona.expected_days_to_start,
  });

  // reference data
  const bls = loadBlsRow(paths.bls, persona.target_role.soc);
  const formd = loadFormD(paths.formd);
  if (opts.formdDir && formd.status !== 'ok') throw new InputError(`--formd-dir ${opts.formdDir} is missing or holds no .json sample files`);
  const crossCheck = crossCheckFormD(csv.rows, index, formd, vintage.iso);
  const formdByNorm = new Map(crossCheck.pairs.map((p) => [p.norm, p.class]));
  const ctx = { rows: csv.rows, params, fam, vintage, bls, formdByNorm };

  // the candidate's own list
  const rows = [];
  let watch = null;
  const watchIdx = new Set();
  if (opts.watchlist) {
    let text;
    try { text = fs.readFileSync(path.resolve(opts.watchlist), 'utf8'); } catch (e) { throw new InputError(`cannot read watchlist ${opts.watchlist}: ${e.code || e.message}`); }
    watch = { ...parseWatchlist(text), path: path.resolve(opts.watchlist) };
    for (const name of watch.names) {
      const norm = normalizeName(name);
      const hits = norm ? index.get(norm) || [] : [];
      if (hits.length === 0) rows.push({ origin: 'watchlist', company: name, bucket: 'not_found', note: 'no dataset row has this name after normalization (exact match only, no fuzzy matching)' });
      else if (hits.length > 1) rows.push({ origin: 'watchlist', company: name, bucket: 'ambiguous', note: `${hits.length} dataset rows share this normalized name: ${hits.map((i) => csv.rows[i].company_name).join('; ')}` });
      else { watchIdx.add(hits[0]); rows.push(evaluateRow(hits[0], 'watchlist', ctx)); }
    }
  }

  // discovery: companies with an H-1B record and a backend-style sponsored title, funded within the window
  let withRecord = 0;
  let titlesUnreadable = 0;
  let familyMatched = 0;
  let poolExcludedAmbiguous = 0;
  let recentMatched = 0;
  const pool = [];
  csv.rows.forEach((row, i) => {
    if (sponsorshipRecord(row).status !== 'record') return;
    withRecord += 1;
    const ev = evaluateRow(i, 'pool', ctx);
    if (ev.bucket === 'hold_data_problem') { titlesUnreadable += 1; return; }
    if (!ev.scored) return;
    familyMatched += 1; // counts every record with a matching title, watchlist or not
    if (ev.funding.within_window && (index.get(normalizeName(row.company_name)) || []).length === 1) recentMatched += 1;
    if (watchIdx.has(i)) return; // watchlist rows were already evaluated above
    if (!ev.funding.within_window) return;
    if ((index.get(normalizeName(row.company_name)) || []).length > 1) { poolExcludedAmbiguous += 1; return; }
    pool.push(ev);
  });
  rows.push(...pool);

  // score with the repo's scorer (never a copy of it)
  const scoredRows = rows.filter((r) => r.scored);
  const roles = scoredRows.map((r) => buildRole(r, timeline));
  const profile = buildScorerProfile(persona);
  const staging = path.join(outDir, '.staging');
  const createdOutDir = !fs.existsSync(outDir);
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  let scorer = { command: null, outputs: [], stdout: null };
  let scorerConfig = null;
  let g2 = { status: 'not-applicable: no scored roles', scorer_needs_sponsorship: null, persona_needs_sponsorship: persona.needs_sponsorship, roles_checked: 0 };
  try {
    fs.writeFileSync(path.join(staging, 'roles.json'), `${JSON.stringify(roles, null, 2)}\n`);
    fs.writeFileSync(path.join(staging, 'scorer-profile.json'), `${JSON.stringify(profile, null, 2)}\n`);
    if (roles.length) {
      const result = runScorer({ repoRoot: REPO_ROOT, rolesPath: path.join(staging, 'roles.json'), profilePath: path.join(staging, 'scorer-profile.json'), outDir: staging, scorerPath: opts.scorerPath });
      const scorerJson = readJson(path.join(staging, 'role-scores.json'));
      const returned = assertScorerIntegrity({ persona, scorerJson, sentRoles: roles });
      for (const r of scoredRows) {
        const s = returned.get(r.role_id);
        r.scorer = { composite: s.composite, recommendation: s.recommendation, reason: s.reason, arithmetic: s.trace.arithmetic };
        r.bucket = s.recommendation === 'Skip' ? 'skip' : 'advance';
        r.pending_gates = r.bucket === 'advance' ? ['H1 liveness', 'H2 posting eligibility'] : [];
      }
      g2 = { status: 'pass', scorer_needs_sponsorship: scorerJson.profile_needs_sponsorship, persona_needs_sponsorship: persona.needs_sponsorship, roles_checked: roles.length };
      scorerConfig = { weights: scorerJson.config?.weights ?? null, apply_threshold: scorerJson.config?.apply_threshold ?? null, consider_floor: scorerJson.config?.consider_floor ?? null, gate_zero: scorerJson.config?.gate_zero ?? null };
      const outRel = rel(outDir);
      scorer = {
        command: `node scripts/score/role-scorer.mjs ${outRel}/roles.json --profile ${outRel}/scorer-profile.json --out-dir ${outRel}`,
        outputs: ['roles.json', 'scorer-profile.json', 'role-scores.json', 'role-scores.md'].map((f) => `${outRel}/${f}`),
        stdout: result.stdout.trim().split('\n').map((l) => l.trim()).filter((l) => l.startsWith('✓')),
        config: scorerConfig,
      };
    } else {
      scorer = { command: null, outputs: [`${rel(outDir)}/roles.json`, `${rel(outDir)}/scorer-profile.json`], stdout: null };
    }
  } catch (e) {
    fs.rmSync(staging, { recursive: true, force: true });
    if (createdOutDir) { try { fs.rmdirSync(outDir); } catch { /* not empty: leave it */ } }
    throw e;
  }

  const pooled = orderRows(rows.filter((r) => r.origin === 'pool'));
  pooled.forEach((r, i) => { r.display_rank = i + 1; });
  const count = (b) => rows.filter((r) => r.bucket === b).length;
  const summary = {
    watchlist_names: watch ? watch.names.length : 0,
    pool_size: pool.length,
    evaluated: rows.length,
    advance: count('advance'),
    skip: count('skip'),
    held: rows.filter((r) => String(r.bucket).startsWith('hold_')).length,
    unresolved: count('not_found') + count('ambiguous'),
    scorer_roles: roles.length,
  };
  const run = {
    recipe: RECIPE,
    recipe_version: RECIPE_VERSION,
    as_of: asOf,
    as_of_source: opts.asOf ? 'command-line' : 'system-clock',
    command: opts.argvEcho ?? null,
    discover_limit: discoverLimit,
    inputs: {
      csv: fileRecord(paths.csv, { rows: csv.rows.length }),
      bls: { path: rel(paths.bls), sha256: bls.source.sha256, rows: bls.source.rows },
      form_d_samples: { path: rel(paths.formd), files: formd.files.map((f) => ({ ...f, file: rel(f.file) })) },
      persona: fileRecord(paths.persona),
      params: fileRecord(paths.params),
      role_families: fileRecord(paths.families),
      scorer: fileRecord(opts.scorerPath ?? path.join(REPO_ROOT, 'scripts', 'score', 'role-scorer.mjs')),
      code: codeRecord(),
      watchlist: watch ? { ...fileRecord(watch.path, { names: watch.names.length }), duplicates_ignored: watch.duplicates } : null,
    },
    persona_used: { needs_sponsorship: persona.needs_sponsorship, target_role: persona.target_role, expected_days_to_start: persona.expected_days_to_start, visa: persona.visa, sources: persona.sources },
    params_used: { max_vintage_age_months: limit, funding_window_months: params.funding_window_months.value, tiers: params.tiers },
    labels: LABELS,
    gates: {
      G0_vintage: { status: stale ? 'stale-accepted' : 'pass', vintage_date: vintage.iso, age_months: round1(ageMonths), limit_months: limit, acknowledged: Boolean(stale && opts.acceptStaleVintage), unreadable_dates: vintage.unreadable_dates },
      G1_persona: { status: 'pass', treated_as: treatedAsReal ? 'real data (outputs kept out of tracked folders)' : 'committed fictional persona and sample inputs', soc_note: socNote, fields_read: ['needs_sponsorship', 'target_role.soc', 'target_role.family', 'visa.ead_start_date', 'visa.opt_end_date', 'visa.unemployment_days_used', 'visa.unemployment_ceiling', 'visa.buffer_target', 'timeline_assumptions.expected_days_to_start'], sources: persona.sources },
      G2_scorer_integrity: g2,
      G3_timeline: { status: timeline.factor === 0 ? 'CLOSED' : timeline.reason === 'open' ? 'open' : 'partly-open', factor: timeline.factor, reason: timeline.reason },
      H1_liveness: { status: 'open', how: 'npm run ats:liveness -- <posting url>', note: 'not automated; a person must find the posting' },
      H2_posting_eligibility: { status: 'open', what_to_read: ['U.S.-person or ITAR wording', 'a no-sponsorship statement', 'a graduation window', 'a start date against the earliest legal start'] },
    },
    timeline,
    bls_reference: { ...bls, source: { ...bls.source, file: rel(paths.bls) } }, // repository-relative, never this machine's absolute path
    coverage: {
      csv_rows: csv.rows.length,
      with_h1b_record: withRecord,
      pct_with_h1b_record: round1((100 * withRecord) / csv.rows.length),
      records_with_matching_title: familyMatched,
      records_matching_and_recently_funded: recentMatched,
      pool_size: pool.length,
      pool_excluded_ambiguous_name: poolExcludedAmbiguous,
      records_with_unreadable_titles: titlesUnreadable,
    },
    form_d_crosscheck: { ...crossCheck, pairs: crossCheck.pairs.map(({ norm, ...rest }) => rest) },
    summary,
    scorer,
    rows: orderRows(rows),
    stop_reason: null,
  };

  // commit outputs only after every check has passed
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(staging)) fs.renameSync(path.join(staging, f), path.join(outDir, f));
  fs.rmSync(staging, { recursive: true, force: true });
  fs.writeFileSync(path.join(outDir, 'run-log.json'), renderRunLog(run));
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(run));
  return { run, outDir };
}

function usage() {
  return `usage: preopt-sponsor-tiers.mjs [--as-of YYYY-MM-DD] [--accept-stale-vintage] [--watchlist file] [--discover N]
       [--persona file] [--csv file] [--bls file] [--formd-dir dir] [--out-dir dir]
       [--soc 15-1252] [--family name] [--days-used N] [--days-to-start N] [--help]
Runs from anywhere; relative default paths resolve against the repository root.`;
}

function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        persona: { type: 'string' }, csv: { type: 'string' }, bls: { type: 'string' }, 'formd-dir': { type: 'string' },
        'out-dir': { type: 'string' }, watchlist: { type: 'string' }, discover: { type: 'string' }, 'as-of': { type: 'string' },
        soc: { type: 'string' }, family: { type: 'string' }, 'days-used': { type: 'string' }, 'days-to-start': { type: 'string' },
        'accept-stale-vintage': { type: 'boolean' }, help: { type: 'boolean' },
      },
      strict: true,
    }));
  } catch (e) { console.error(`error: ${e.message}\n${usage()}`); process.exit(2); }
  if (values.help) { console.log(usage()); return; }
  const int = (name, v) => {
    if (v === undefined) return undefined;
    if (!/^\d+$/.test(v)) { console.error(`error: --${name} must be a whole number (got ${JSON.stringify(v)})`); process.exit(2); }
    return Number(v);
  };
  const opts = {
    persona: values.persona, csv: values.csv, bls: values.bls, formdDir: values['formd-dir'], outDir: values['out-dir'],
    watchlist: values.watchlist, discover: int('discover', values.discover), asOf: values['as-of'], soc: values.soc, family: values.family,
    daysUsed: int('days-used', values['days-used']), daysToStart: int('days-to-start', values['days-to-start']),
    acceptStaleVintage: Boolean(values['accept-stale-vintage']), argvEcho: process.argv.slice(2).join(' '),
    scorerPath: process.env.SPONSOR_TIERS_SCORER || undefined, // break tests only; see scorer-bridge.mjs
  };
  try {
    const { run: r, outDir } = run(opts);
    const s = r.summary;
    console.log(`preopt-sponsor-tiers: ${s.evaluated} evaluated (${s.watchlist_names} watchlist, ${s.pool_size} pool) -> ${s.advance} worth a closer look, ${s.skip} set aside, ${s.held} held, ${s.unresolved} unresolved`);
    console.log(`  timeline factor ${r.timeline.factor} (${r.timeline.reason}); data vintage ${r.gates.G0_vintage.vintage_date}, ${r.gates.G0_vintage.age_months} months old${r.gates.G0_vintage.acknowledged ? ' (accepted)' : ''}`);
    console.log(`  wrote ${rel(outDir)}/ : report.md, run-log.json, roles.json, scorer-profile.json${r.scorer.command ? ', role-scores.json, role-scores.md' : ''}`);
  } catch (e) {
    const code = e instanceof InputError ? 2 : e instanceof StaleVintageError ? 3 : e instanceof IntegrityError ? 4 : e instanceof ScorerError ? 5 : 1;
    console.error(`${e.name || 'Error'}: ${e.message}`);
    for (const p of e.problems || []) console.error(`  - ${p}`);
    if (code === 1) console.error(e.stack);
    process.exit(code);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
