#!/usr/bin/env node
// network-targets.mjs — msis-pm-network-targets prototype (2026fa, AdityaHasija37).
//
// For an MSIS student on STEM OPT targeting 1–5-year product roles: find companies whose
// own H-1B record shows sponsored product titles, read each human-confirmed job board,
// and route every company to apply / network / skip / human-check / board-unknown.
// Live postings are scored by the EXISTING scorer (scripts/score/role-scorer.mjs, run
// as a CLI — it has no exports). Board fetching reuses scripts/ats/providers/*.mjs.
//
//   node scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs \
//     [--persona <persona.json>] [--boards <boards.json>] [--csv <companies.csv>] \
//     [--offline <responses-dir> | --save-responses <dir>] [--out <dir>] [--run-date YYYY-MM-DD]
//
// Exit codes: 0 run complete · 2 stopped at a gate or bad input (nothing written) · 1 crash.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import lever from '../../../ats/providers/lever.mjs';
import ashby from '../../../ats/providers/ashby.mjs';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';
import {
  SRC, SETTINGS, NEXT_ACTION, StopError, titleRule, locationRule, sponsorshipTier,
  sponsoredProductTitles, timelineGate, buildRole,
} from './rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const DEFAULTS = {
  persona: path.join(HERE, 'fixtures/persona.fixture.json'),
  boards: path.join(HERE, 'fixtures/boards.sample.json'),
  csv: path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
  soc: path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  out: path.join(HERE, 'out'),
};
const PROVIDERS = { greenhouse, lever, ashby };
// Occupation codes product roles are commonly filed under. Context only: role_quality
// carries weight 0.0 in the scorer, so these medians change no decision.
const CONTEXT_SOC = ['15-1299', '11-3021', '15-2051', '15-1211', '13-1111'];

// ── CSV (RFC 4180: quoted fields, embedded commas/newlines) ─────────────────
export function parseCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// ── offline context: replays saved board responses, never touches the network ─
export function responseFile(dir, url) {
  const u = new URL(url);
  return path.join(dir, `${(u.hostname + u.pathname).replace(/[^A-Za-z0-9]+/g, '_')}.json`);
}

export function offlineCtx(dir) {
  return {
    transport: 'offline-fixture',
    async fetchJson(url) {
      const f = responseFile(dir, url);
      if (!fs.existsSync(f)) {
        const e = new Error(`offline: no saved response for ${url}`); e.code = 'no-fixture'; throw e;
      }
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (j && j.__status && j.__status !== 200) { const e = new Error(`HTTP ${j.__status}`); e.status = j.__status; throw e; }
      return j;
    },
  };
}

// Live ctx that also saves a TRIMMED copy (title/url/location only — no job
// descriptions, so no emails or phone numbers end up in fixtures).
function savingCtx(dir) {
  const http = makeHttpCtx();
  fs.mkdirSync(dir, { recursive: true });
  const trim = (url, j) => {
    if (Array.isArray(j)) return j.map((x) => ({ text: x.text, hostedUrl: x.hostedUrl, categories: { location: x.categories?.location } }));
    if (Array.isArray(j?.jobs)) {
      return { jobs: j.jobs.map((x) => (url.includes('ashbyhq')
        ? { title: x.title, jobUrl: x.jobUrl, location: x.location }
        : { title: x.title, absolute_url: x.absolute_url, location: { name: x.location?.name } })) };
    }
    return j;
  };
  return {
    transport: 'http+save',
    async fetchJson(url, opts) {
      try {
        const j = await http.fetchJson(url, opts);
        fs.writeFileSync(responseFile(dir, url), JSON.stringify(trim(url, j), null, 1));
        return j;
      } catch (e) {
        if (e.status) fs.writeFileSync(responseFile(dir, url), JSON.stringify({ __status: e.status }));
        throw e;
      }
    },
  };
}

// ── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) throw new StopError('bad-args', `unexpected argument "${k}"`);
    const v = argv[i + 1];
    if (v == null || v.startsWith('--')) throw new StopError('bad-args', `${k} needs a value`);
    a[k.slice(2)] = v; i++;
  }
  return a;
}

const readJson = (p, what) => {
  if (!fs.existsSync(p)) throw new StopError('missing-input', `${what} not found: ${p}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { throw new StopError('bad-input', `${what} is not valid JSON: ${p} (${e.message})`); }
};

// ── one company ──────────────────────────────────────────────────────────────
async function routeCompany(name, row, board, ctx, timeline) {
  const base = { company: name };
  if (!row) return { ...base, route: 'skip', reason: 'not-in-dataset', evidence: {} };

  const sp = sponsorshipTier(row);
  const titles = sponsoredProductTitles(row);
  const evidence = {
    sponsorship: sp.evidence,
    tier_rule: sp.rule,
    tier: sp.tier,
    sponsored_product_titles: { value: titles, source: SRC.record, filter: SRC.input },
    funding: {
      latest_funding_date: row.latest_funding_date || null,
      latest_funding_stage: row.latest_funding_stage || null,
      source: SRC.record,
      used_for: 'ordering the network list only — no scorer term reads funding',
    },
    median_salary_offered: { value: row.median_salary_offered || null, source: SRC.record },
    e_verify: { value: null, source: null, note: 'not checked — no E-Verify data in the repo [TODO: DATA SOURCE]' },
  };
  if (!sp.tier) return { ...base, route: 'skip', reason: sp.reason, evidence };
  if (!titles.length) return { ...base, route: 'skip', reason: 'no-sponsored-product-title', evidence };

  if (!board || board.confirmed !== true) {
    return { ...base, route: 'human-check', reason: board ? 'board-not-confirmed' : 'no-board-entry', evidence };
  }
  const provider = PROVIDERS[board.provider];
  if (!provider) return { ...base, route: 'board-unknown', reason: `unsupported-provider:${board.provider}`, evidence };
  evidence.board = { provider: board.provider, careers_url: board.careers_url, confirmed_by: board.confirmed_by ?? null, confirmed_on: board.confirmed_on ?? null, how: board.how ?? null, source: SRC.input };

  let postings;
  try {
    postings = await provider.fetch({ name, careers_url: board.careers_url }, ctx);
  } catch (e) {
    return { ...base, route: 'board-unknown', reason: `fetch-failed: ${e.status ? `HTTP ${e.status}` : e.code || e.message}`, evidence };
  }
  evidence.board.open_postings = { value: postings.length, source: SRC.record };

  const matching = [];
  const rejected = {};
  for (const p of postings) {
    const t = titleRule(p.title); const l = locationRule(p.location);
    if (t.pass && l.pass) matching.push({ ...p, title_rule: t.reason, location_rule: l.reason });
    else { const r = !t.pass ? t.reason : l.reason; rejected[r] = (rejected[r] || 0) + 1; }
  }
  evidence.board.postings_rejected_by_rule = rejected;
  if (!matching.length) return { ...base, route: 'network', reason: 'sponsors-product-roles-but-no-matching-live-posting', evidence };

  const liveness = { factor: 1.0, source: SRC.record, basis: 'posting present in the board API listing at run time' };
  const roles = matching.map((posting) => ({
    ...buildRole({ company: name, posting, sponsorship: sp, timeline, liveness }),
    _rules: { title: posting.title_rule, location: posting.location_rule },
  }));
  return { ...base, route: 'score', reason: `${matching.length} matching live posting(s)`, evidence, roles };
}

// ── report (for the person) ──────────────────────────────────────────────────
const fmtTitles = (e) => (e?.sponsored_product_titles?.value || []).join('; ') || '—';
const sponsorCell = (e) => {
  const s = e?.sponsorship; if (!s) return '—';
  return `${e.tier ?? 'no tier'} · ${s.approvals ?? '—'} approvals, ${s.denials ?? '—'} denials, ${s.approval_rate == null ? '—' : Number(s.approval_rate.toFixed(1))}%`; // rounded for display only; run-log keeps the record value
};

function renderReport(log) {
  const o = [];
  const c = log.summary.routes;
  o.push(`# PM network-targets report — ${log.run_date}`);
  o.push('\n## Executive summary\n');
  o.push(`This report sorts companies for a master's student on STEM OPT who is looking for product roles that ask for 1–5 years of experience. It started from the companies whose own visa records show they have sponsored product titles, then read the job boards a person had confirmed. Of ${log.summary.companies_evaluated} companies evaluated: **${log.summary.apply} to apply to**, **${c.network || 0} to network into now** (they sponsor product roles but have no matching opening today), **${c['human-check'] || 0} waiting for a person to confirm their job board**, **${c['board-unknown'] || 0} whose board could not be read**, and **${log.summary.skipped} skipped**. Nothing here was guessed by an AI: sponsorship numbers come from the visa data, open postings from the companies' own job boards, and the rules (which titles count, which thresholds) are choices written down by the student. Read the "What this cannot tell you" section before acting on any row.`);
  o.push(`\n## Run record\n`);
  o.push(`- Mode: \`${log.mode}\` · persona: ${log.persona.label} (fictional) · run date ${log.run_date}`);
  o.push(`- Visa timeline gate: OPT/STEM end ${log.timeline.opt_end}, ${log.timeline.remaining_days} days left, hiring lag ${log.timeline.lag_days} days → factor ${log.timeline.factor} [your-input]`);
  o.push(`- Candidate selection: ${log.summary.csv_rows} CSV rows → ${log.summary.candidates_from_csv} with ≥${SETTINGS.min_approvals} approvals and a sponsored product title passing the title rule`);
  o.push(`- Companies evaluated this run: ${log.summary.companies_evaluated} (candidates with a board entry, plus persona extras)`);
  o.push(`- Scorer: \`scripts/score/role-scorer.mjs\` (unchanged) on ${log.summary.roles_scored} role(s)${log.scorer ? ` → Apply ${log.scorer.Apply} · Consider ${log.scorer.Consider} · Skip ${log.scorer.Skip}` : ' (not run: no live matching postings)'}`);
  o.push(`- Company-level skip rate: ${log.summary.skip_rate_pct}% (skip + scorer Skip, over companies evaluated)`);

  const section = (title, rows, cols) => {
    o.push(`\n## ${title}\n`);
    if (!rows.length) { o.push('_None this run._'); return; }
    o.push(`| ${cols.map((x) => x[0]).join(' | ')} |`);
    o.push(`|${cols.map(() => '---').join('|')}|`);
    for (const r of rows) o.push(`| ${cols.map((x) => String(x[1](r)).replace(/\|/g, '/')).join(' | ')} |`);
  };
  const scored = log.companies.flatMap((co) => (co.scored || []).map((s) => ({ ...s, evidence: co.evidence })));
  section('Apply / Consider (live matching postings, scored)', scored.filter((s) => s.recommendation !== 'Skip'), [
    ['Company', (s) => s.company], ['Posting', (s) => `[${s.title}](${s.url})`], ['Location', (s) => s.location],
    ['Scorer', (s) => `**${s.recommendation}** ${s.composite}`], ['Sponsorship [record]', (s) => sponsorCell(s.evidence)],
    ['Next action', (s) => NEXT_ACTION[s.recommendation]],
  ]);
  section('Network now (sponsors product roles, no matching opening)', log.companies.filter((x) => x.route === 'network'), [
    ['Company', (x) => x.company], ['Sponsorship [record]', (x) => sponsorCell(x.evidence)],
    ['Sponsored product titles [record]', (x) => fmtTitles(x.evidence)],
    ['Open postings / rejected by rule', (x) => `${x.evidence.board.open_postings.value} / ${JSON.stringify(x.evidence.board.postings_rejected_by_rule)}`],
    ['Latest funding [record, ordering only]', (x) => `${x.evidence.funding.latest_funding_stage || '—'} ${x.evidence.funding.latest_funding_date || ''}`],
    ['Next action', () => NEXT_ACTION.network],
  ]);
  section('Needs a person (board not confirmed or not readable)', log.companies.filter((x) => x.route === 'human-check' || x.route === 'board-unknown'), [
    ['Company', (x) => x.company], ['Route', (x) => x.route], ['Why', (x) => x.reason], ['Next action', (x) => NEXT_ACTION[x.route]],
  ]);
  section('Skipped', log.companies.filter((x) => x.route === 'skip' || (x.scored && x.scored.every((s) => s.recommendation === 'Skip'))), [
    ['Company', (x) => x.company], ['Why', (x) => x.route === 'skip' ? x.reason : 'every matching posting scored Skip'], ['Sponsorship [record]', (x) => sponsorCell(x.evidence)],
  ]);

  o.push('\n## Occupation wage context (feeds no decision)\n');
  o.push('There is no "Product Manager" occupation code. Product roles get filed under codes like these; which one a company uses is not in this data. Medians are national BLS OEWS values [record]. The scorer gives role quality a weight of 0, so these numbers change nothing above.\n');
  o.push('| SOC | Title | National median | O*NET cognitive score |');
  o.push('|---|---|---|---|');
  for (const s of log.soc_context) o.push(`| ${s.soc} | ${s.title} | ${s.median ? `$${Number(s.median).toLocaleString('en-US')}` : '—'} | ${s.cognitive || '—'} |`);

  o.push('\n## What this cannot tell you\n');
  for (const x of log.cannot_verify) o.push(`- ${x}`);
  o.push('\n## Gate D — before acting\n');
  o.push('A person reads this report before any outreach or application. The tool contacts no one. For each network row, check the sponsored titles yourself; for each apply row, open the posting.');
  return o.join('\n') + '\n';
}

// ── main ─────────────────────────────────────────────────────────────────────
export async function run(argv) {
  const a = parseArgs(argv);
  const outDir = path.resolve(a.out || DEFAULTS.out);
  const persona = readJson(path.resolve(a.persona || DEFAULTS.persona), 'persona');
  const boardsDoc = readJson(path.resolve(a.boards || DEFAULTS.boards), 'boards file');
  const runDate = a['run-date'] || new Date().toISOString().slice(0, 10);
  if (a.offline && a['save-responses']) throw new StopError('bad-args', 'use --offline or --save-responses, not both');

  // Gate C first: an impossible timeline stops the run before any work or output.
  const timeline = timelineGate(persona.opt_end_date, runDate, SETTINGS.hiring_lag_days);

  const csvPath = path.resolve(a.csv || DEFAULTS.csv);
  if (!fs.existsSync(csvPath)) throw new StopError('missing-input', `companies CSV not found: ${csvPath}`);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const byName = new Map(rows.map((r) => [r.company_name.trim().toUpperCase(), r]));

  const candidates = rows.filter((r) => sponsorshipTier(r).tier && sponsoredProductTitles(r).length);
  const boards = new Map((boardsDoc.boards || []).map((b) => [b.company.trim().toUpperCase(), b]));

  // Evaluate: every candidate that has a board entry (confirmed or not), plus persona extras.
  const names = new Set([
    ...candidates.filter((r) => boards.has(r.company_name.trim().toUpperCase())).map((r) => r.company_name.trim()),
    ...(persona.extra_companies || []).map((n) => n.trim()),
  ]);

  const mode = a.offline ? 'offline-fixture' : a['save-responses'] ? 'live+save' : 'live';
  const ctx = a.offline ? offlineCtx(path.resolve(a.offline)) : a['save-responses'] ? savingCtx(path.resolve(a['save-responses'])) : makeHttpCtx();

  const companies = [];
  for (const n of names) {
    const key = n.toUpperCase();
    companies.push(await routeCompany(n, byName.get(key), boards.get(key), ctx, timeline));
  }

  fs.mkdirSync(outDir, { recursive: true });
  const roles = companies.flatMap((c) => c.roles || []);
  const rolesPath = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles.map(({ _rules, url, location, ...r }) => r), null, 2));

  let scorer = null;
  if (roles.length) {
    execFileSync(process.execPath, [path.join(REPO, 'scripts/score/role-scorer.mjs'), rolesPath, '--out-dir', outDir], { stdio: 'pipe' });
    const scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8')).roles;
    const byId = new Map(scored.map((s) => [s.role_id, s]));
    for (const c of companies) {
      if (!c.roles) continue;
      c.scored = c.roles.map((r) => ({ ...byId.get(r.role_id), url: r.url, location: r.location, rules: r._rules }));
      c.route = c.scored.some((s) => s.recommendation === 'Apply') ? 'apply' : c.scored.some((s) => s.recommendation === 'Consider') ? 'consider' : 'scored-skip';
      delete c.roles;
    }
    scorer = { Apply: 0, Consider: 0, Skip: 0 };
    for (const s of scored) scorer[s.recommendation]++;
  }

  const tierRank = (c) => (c.evidence?.tier === 'Proven' ? 0 : 1);
  companies.sort((x, y) => tierRank(x) - tierRank(y)
    || (y.evidence?.sponsorship?.approvals ?? 0) - (x.evidence?.sponsorship?.approvals ?? 0)
    || String(y.evidence?.funding?.latest_funding_date || '').localeCompare(String(x.evidence?.funding?.latest_funding_date || '')));

  const routes = {};
  for (const c of companies) routes[c.route] = (routes[c.route] || 0) + 1;
  const skipped = (routes.skip || 0) + (routes['scored-skip'] || 0);
  const socRows = parseCsv(fs.readFileSync(DEFAULTS.soc, 'utf8'));
  const soc_context = CONTEXT_SOC.map((code) => {
    const r = socRows.find((x) => x.bls_soc_code === code && x.onet_soc_code === `${code}.00`) || socRows.find((x) => x.bls_soc_code === code);
    return r ? { soc: code, title: r.title, median: r.annual_median_wage || null, cognitive: r.cognitive_pivot_score || null, source: SRC.record } : { soc: code, title: 'no row in soc_occupation_compact.csv', median: null, cognitive: null, source: null };
  });

  const log = {
    _recipe: 'recipes/cases/2026fa/AdityaHasija37-msis-pm-network-targets.md',
    _prototype: 'scripts/contrib/2026fa/AdityaHasija37-msis-pm-network-targets/network-targets.mjs',
    run_date: runDate,
    mode,
    out_dir: path.relative(REPO, outDir),
    inputs: {
      csv: path.relative(REPO, csvPath),
      boards: path.relative(REPO, path.resolve(a.boards || DEFAULTS.boards)),
      persona: path.relative(REPO, path.resolve(a.persona || DEFAULTS.persona)),
      offline_responses: a.offline ? path.relative(REPO, path.resolve(a.offline)) : null,
    },
    persona: { label: persona.label, opt_end_date: { value: persona.opt_end_date, source: SRC.input } },
    settings: { ...SETTINGS, source: SRC.input },
    timeline,
    summary: {
      csv_rows: rows.length,
      candidates_from_csv: candidates.length,
      companies_evaluated: companies.length,
      routes,
      roles_scored: roles.length,
      apply: routes.apply || 0,
      skipped,
      skip_rate_pct: companies.length ? Math.round((100 * skipped) / companies.length) : 0,
    },
    scorer,
    companies,
    soc_context,
    cannot_verify: [
      'Whether this employer is enrolled in E-Verify (required for STEM OPT) — no E-Verify data in the repo.',
      'Which fiscal years the H-1B approval counts cover — not stated in the data documentation.',
      'How many of the approvals were for product roles: the counts are company-wide, and a product title only has to appear among the top sponsored titles (Datadog: 340 approvals, mostly engineering titles, one "PRODUCT MANAGER").',
      'Which occupation code (SOC) the company files product roles under, or at what wage level.',
      'Whether a sponsored "Product Manager" title was the same seniority or team as today\'s posting.',
      'Whether a live posting is actually being hired for (a listed posting can still be a ghost job).',
      'That a confirmed board belongs to the company — that is the human confirmation at Gate A, recorded in the boards file.',
      'Companies with no confirmed board: no conclusion is drawn about their openings.',
    ],
  };

  fs.writeFileSync(path.join(outDir, 'candidates.json'), JSON.stringify(candidates.map((r) => ({
    company: r.company_name, website: r.website, tier: sponsorshipTier(r).tier,
    approvals: sponsorshipTier(r).evidence.approvals, sponsored_product_titles: sponsoredProductTitles(r),
    board_entry: boards.has(r.company_name.trim().toUpperCase()),
  })), null, 2));
  fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify(log, null, 2));
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(log));
  return log;
}

if (import.meta.url === `file://${process.argv[1]}` || fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  run(process.argv.slice(2)).then((log) => {
    const r = log.summary.routes;
    console.log(`✓ ${log.summary.companies_evaluated} companies evaluated (${log.mode}) → apply ${r.apply || 0} · consider ${r.consider || 0} · network ${r.network || 0} · human-check ${r['human-check'] || 0} · board-unknown ${r['board-unknown'] || 0} · skip ${log.summary.skipped} (skip ${log.summary.skip_rate_pct}%)`);
    console.log(`  candidates from CSV: ${log.summary.candidates_from_csv} · roles scored: ${log.summary.roles_scored}`);
    console.log(`  wrote run-log.json + report.md + roles.json${log.scorer ? ' + role-scores.{json,md}' : ''} → ${path.relative(process.cwd(), path.resolve(REPO, log.out_dir))}`);
  }).catch((e) => {
    if (e instanceof StopError) { console.error(`✗ STOP [${e.code}] ${e.message}`); process.exit(2); }
    console.error(e.stack || e.message); process.exit(1);
  });
}
