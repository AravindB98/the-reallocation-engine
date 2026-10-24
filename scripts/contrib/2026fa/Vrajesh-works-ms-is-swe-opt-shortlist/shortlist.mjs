#!/usr/bin/env node
// shortlist.mjs — OPT-countdown sponsor shortlist for an entry-level SWE search.
//
// Reads the 80 Days to Stay CSV (record), a human-supplied postings file with
// transcribed `npm run ats:liveness` results (your-input), and OPT dates
// (your-input). Builds a roles.json in the shape of data/examples/ch11-roles.json,
// runs it through the EXISTING scorer (scripts/score/role-scorer.mjs — never a
// copy), then writes shortlist-log.json (agent) and shortlist-report.md (person).
//
//   node scripts/contrib/2026fa/Vrajesh-works-ms-is-swe-opt-shortlist/shortlist.mjs \
//     --postings <postings.json> --as-of YYYY-MM-DD --opt-start YYYY-MM-DD [options]
//
// It never invents a value: unknown company, ambiguous name, unresolved liveness,
// missing SOC row, bad dates all stop or leave the role unscored, with a reason.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const DEFAULT_CSV = 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv';
const DEFAULT_SOC_CSV = 'data/bls/compact/soc_occupation_compact.csv';
const DEFAULT_OUT = 'course/2026fa/submissions/Vrajesh-works/runs';
const PROTECTED = ['data', 'recipes', 'logs', 'chapters', 'book', 'reports', 'scripts'];

// Constants are your-input (DEFINE): chosen by the student, not found in any record.
export const PROVEN_MIN_APPROVALS = 10;
export const TIER_P = { Proven: 0.9, Likely: 0.6, Possible: 0.3, None: 0.0 };
export const FUNDING_RECENT_MONTHS = 24;
const REQUIRED_COLS = ['company_name', 'Total Approvals', 'Approval_Rate', 'top_job_titles_sponsored', 'latest_funding_date', 'latest_funding_stage'];

export class UsageError extends Error {}

// ── CSV ────────────────────────────────────────────────────────────────────
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift() || [];
  return { header, records: rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']))) };
}

export const normName = (s) => String(s).toUpperCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();

export function parseTitles(s) {
  const out = []; const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g; let m;
  while ((m = re.exec(s || '')) !== null) out.push((m[1] ?? m[2]).trim());
  return out;
}

// ── sponsorship tier: derived from record fields by printed rules ──────────
const SW = /software|developer|programmer/i;
const SENIOR = /\b(senior|sr|staff|principal|lead|manager|director|head|architect|vp|ii|iii|iv)\b/i;

export function deriveTier({ approvals, titles }) {
  const sw = titles.filter((t) => SW.test(t));
  const swNonSenior = sw.filter((t) => !SENIOR.test(t));
  let tier;
  if (!approvals || approvals < 1) tier = 'None';
  else if (swNonSenior.length && approvals >= PROVEN_MIN_APPROVALS) tier = 'Proven';
  else if (sw.length) tier = 'Likely';
  else tier = 'Possible';
  return { tier, p: TIER_P[tier], software_titles: sw, non_senior_software_titles: swNonSenior };
}

// ── timeline gate: pure date arithmetic on your-input values ───────────────
const DAY = 86400000;
export function parseDate(s, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new UsageError(`${name} must be YYYY-MM-DD, got "${s}"`);
  const t = Date.parse(`${s}T00:00:00Z`);
  // Date.parse rolls impossible days over (2026-02-30 -> March 2), so round-trip the string.
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== s) throw new UsageError(`${name} is not a real date: "${s}"`);
  return t;
}

export function timelineFactor({ asOf, optStart, unemploymentDays, lagDays }) {
  if (!Number.isInteger(lagDays) || lagDays <= 0) throw new UsageError('--hiring-lag-days must be a positive integer');
  if (!Number.isInteger(unemploymentDays) || unemploymentDays <= 0) throw new UsageError('--unemployment-days must be a positive integer');
  const windowEnd = parseDate(optStart, '--opt-start') + unemploymentDays * DAY;
  const remaining = Math.round((windowEnd - parseDate(asOf, '--as-of')) / DAY);
  const slack = remaining - lagDays;
  const factor = slack <= 0 ? 0 : slack >= lagDays ? 1 : Number((slack / lagDays).toFixed(3));
  return { factor, days_remaining: remaining, slack_days: slack, window_end: new Date(windowEnd).toISOString().slice(0, 10) };
}

// ── funding recency (displayed only; the scorer has no funding term) ───────
export function fundingStatus(dateStr, asOf) {
  if (!dateStr) return { status: 'no-funding-record', months: null };
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return { status: 'no-funding-record', months: null };
  const months = Math.round(((parseDate(asOf, '--as-of') - t) / DAY / 30.44) * 10) / 10;
  return { status: months <= FUNDING_RECENT_MONTHS ? 'recent' : 'stale', months };
}

// ── liveness: transcribed by the human; anything else is unresolved ────────
export function livenessFactor(l) {
  if (!l || !l.checked_on || !/^\d{4}-\d{2}-\d{2}$/.test(l.checked_on)) return null;
  if (l.status === 'live') return 1;
  if (l.status === 'dead') return 0;
  return null;
}

export function loadSocRow(file, soc) {
  const { records } = parseCsv(fs.readFileSync(file, 'utf8'));
  const row = records.find((r) => r.bls_soc_code === soc);
  if (!row) throw new UsageError(`no row for SOC ${soc} in ${file} — refusing to continue without a role-quality record`);
  return { soc, title: row.title, oews_year: row.oews_year, annual_median_wage: Number(row.annual_median_wage) || null, cognitive_pivot_score: Number(row.cognitive_pivot_score) || null };
}

export function guardOutDir(outDir) {
  const rel = path.relative(REPO, path.resolve(outDir));
  const first = rel.split(path.sep)[0];
  if (!rel.startsWith('..') && PROTECTED.includes(first) && !rel.startsWith(path.join('scripts', 'contrib')))
    throw new UsageError(`--out-dir ${outDir} is inside tracked repo path "${first}/" — would overwrite tracked files`);
}

// ── core ───────────────────────────────────────────────────────────────────
export function evaluate({ csv, postings, asOf, optStart, unemploymentDays, lagDays, fit }) {
  for (const c of REQUIRED_COLS) if (!csv.header.includes(c)) throw new UsageError(`CSV is missing required column "${c}" (schema drift) — stopping`);
  if (!Array.isArray(postings)) throw new UsageError('postings file must be a JSON array');
  const index = new Map();
  for (const r of csv.records) { const k = normName(r.company_name); (index.get(k) || index.set(k, []).get(k)).push(r); }
  const snapshotEnd = csv.records.map((r) => r.latest_funding_date).filter(Boolean).sort().pop() || null;
  const tl = timelineFactor({ asOf, optStart, unemploymentDays, lagDays });
  const results = []; const roles = [];

  postings.forEach((p, i) => {
    const base = { role_id: `p${i + 1}`, company: p.company, title: p.title ?? null, url: p.url ?? null };
    if (!p.company) { results.push({ ...base, status: 'invalid-posting', next_action: 'Posting entry has no company name.' }); return; }
    // A human who read the posting text can rule it out (e.g. "U.S. citizenship required").
    // Nothing in the engine's data can see this, so it is your-input and never scored.
    if (typeof p.excluded_reason === 'string' && p.excluded_reason.trim()) {
      results.push({ ...base, status: 'excluded', excluded_reason: p.excluded_reason.trim(), source: 'your-input', next_action: `Skip: ${p.excluded_reason.trim()} [your-input, read from the posting by a human]` });
      return;
    }
    // Two tracks. "sponsorship" (default) is scored on H-1B sponsorship history. "opt-bridge" is for a role
    // the student would take on OPT without sponsorship (e.g. a contract role): only the liveness and
    // timeline gates apply, no sponsorship vote, and the scorer is NOT called for it.
    if (p.track !== undefined && p.track !== 'sponsorship' && p.track !== 'opt-bridge') {
      results.push({ ...base, status: 'invalid-posting', next_action: `Unknown track "${p.track}"; use "sponsorship" or "opt-bridge". Not scored.` });
      return;
    }
    if (p.track === 'opt-bridge') {
      const found = index.get(normName(p.company)) || [];
      const info = { ...base, track: 'opt-bridge', employment_type: p.employment_type ?? null, timeline_factor: tl.factor,
        csv_match: found.length === 0 ? 'not-in-csv' : found.length > 1 ? 'ambiguous' : 'matched (informational only; no sponsorship vote on this track)' };
      if (!p.url) { results.push({ ...info, status: 'opt-bridge-no-posting', next_action: 'No posting URL supplied; nothing to check.' }); return; }
      const bf = livenessFactor(p.liveness);
      if (bf === null) { results.push({ ...info, status: 'liveness-unresolved', next_action: `Run: npm run ats:liveness -- ${p.url}  then transcribe status + checked_on into the postings file.` }); return; }
      if (bf === 0) { results.push({ ...info, status: 'opt-bridge-closed', liveness: p.liveness, next_action: 'Skip: posting is not live.' }); return; }
      if (tl.factor === 0) { results.push({ ...info, status: 'opt-bridge-closed', liveness: p.liveness, next_action: 'Skip: your OPT window closes before a hire of this length can finish.' }); return; }
      results.push({ ...info, status: 'opt-bridge-open', liveness: p.liveness,
        next_action: 'OPT-bridge candidate. Apply only if the role is in your field and a person has confirmed it is allowed on your OPT (contract terms, employer requirements). No sponsorship record is needed or used.' });
      return;
    }
    const hits = index.get(normName(p.company)) || [];
    if (hits.length === 0) { results.push({ ...base, status: 'not-in-csv', next_action: 'No record in this dataset (built from startup funding filings, so large or public employers are often absent). Absence is not evidence either way: check the legal entity name, then look for the employer\'s own sponsorship record.' }); return; }
    if (hits.length > 1) { results.push({ ...base, status: 'ambiguous', candidates: hits.map((h) => h.company_name), next_action: 'Two or more CSV rows match; pick the entity by hand.' }); return; }
    const r = hits[0];
    const approvals = r['Total Approvals'] === '' ? null : Number(r['Total Approvals']);
    const titles = parseTitles(r.top_job_titles_sponsored);
    const sp = deriveTier({ approvals, titles });
    const fund = fundingStatus(r.latest_funding_date, asOf);
    const evidence = {
      csv_company_name: r.company_name, total_approvals: approvals, approval_rate: r.Approval_Rate === '' ? null : Number(Number(r.Approval_Rate).toFixed(1)),
      matched_software_titles: sp.software_titles, matched_non_senior_software_titles: sp.non_senior_software_titles,
      latest_funding_date: r.latest_funding_date || null, latest_funding_stage: r.latest_funding_stage || null, funding_status: fund.status, months_since_funding: fund.months,
    };
    const common = { ...base, tier: sp.tier, sponsorship_p: sp.p, evidence };
    if (!p.url) {
      results.push({ ...common, status: 'no-posting', next_action: ['Proven', 'Likely'].includes(sp.tier) ? 'Network target: sponsor history in the record; no posting URL was supplied (not checked whether one exists).' : 'No posting URL supplied and weak sponsor record: no action.' });
      return;
    }
    const lf = livenessFactor(p.liveness);
    if (lf === null) { results.push({ ...common, status: 'liveness-unresolved', next_action: `Run: npm run ats:liveness -- ${p.url}  then transcribe status + checked_on into the postings file.` }); return; }
    roles.push({
      role_id: base.role_id, company: r.company_name, title: p.title ?? 'Software Engineer',
      sponsorship: { p: sp.p, tier: sp.tier, source: 'record' },
      fit: { p: fit, source: 'your-input' },
      liveness: { factor: lf, source: 'your-input' },
      timeline: { factor: tl.factor, source: 'your-input' },
    });
    results.push({ ...common, status: 'scored', liveness: { ...p.liveness, factor: lf } });
  });
  return { results, roles, timeline: tl, snapshotEnd };
}

export function nextAction(res, score) {
  if (res.status !== 'scored') return res.next_action ?? '';
  if (score.recommendation === 'Apply') return 'Tailor an application (2-hour block).';
  if (score.recommendation === 'Consider') return 'Tailor only if the Apply list is exhausted; note the soft spot.';
  if (res.liveness.factor === 0 && ['Proven', 'Likely'].includes(res.tier)) return 'Network, don\'t apply: posting is dead but sponsor history is real.';
  return 'Skip.';
}

function runScorer(rolesPath, outDir) {
  const r = spawnSync(process.execPath, [path.join(REPO, 'scripts/score/role-scorer.mjs'), rolesPath, '--out-dir', outDir], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`scorer failed: ${r.stderr || r.stdout}`);
  return { stdout: r.stdout.trim(), scores: JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8')) };
}

function renderReport({ run, soc, rows, scorerLine }) {
  const o = [];
  const counts = run.counts;
  o.push('# Sponsor shortlist — entry-level software engineer, F-1 OPT');
  o.push('');
  o.push(`This report checks ${counts.postings} companies you are considering against sponsorship history in the 80 Days to Stay data and against your own OPT countdown, then says Apply, Consider or Skip for each one with every input labeled. ${counts.scored} could be scored on sponsorship history; ${counts.opt_bridge_checked} on the OPT-bridge track (live posting and timeline only, no sponsorship score); and ${counts.unscored} could not be handled, with the reason in the table. Nothing here is a final decision: a person has to clear the liveness gate for each posting. Treat funding information as old: the data ends ${run.inputs.data_snapshot_end ?? 'at an unknown date'}, ${run.inputs.snapshot_gap_days ?? '?'} days before the as-of date.`);
  o.push('');
  o.push('## Results');
  o.push('');
  o.push('| Company | Posting | Status | Tier [record→rule] | Approvals / rate [record] | Funding [record] | Rec | Next action |');
  o.push('|---|---|---|---|---|---|---|---|');
  for (const x of rows) {
    const e = x.evidence;
    o.push(`| ${x.company} | ${x.title ?? '—'} | ${x.status} | ${x.tier ?? '—'} | ${e ? `${e.total_approvals ?? '—'} / ${e.approval_rate ?? '—'}%` : '—'} | ${e ? `${e.latest_funding_date ?? '—'} (${e.funding_status})` : '—'} | ${x.recommendation ?? '—'} | ${x.next_action} |`);
  }
  o.push('');
  o.push(`Scorer: ${scorerLine || 'not run (no scorable roles)'}. Healthy runs skip at least half.`);
  o.push('');
  o.push('## Verified vs. inferred');
  o.push('');
  o.push('| Item | Label | How |');
  o.push('|---|---|---|');
  o.push('| Total approvals, approval rate, sponsored title list, funding date and stage | record | copied from the 80 Days CSV row (sha256 in the log) |');
  o.push(`| Sponsorship tier and its probability | rule over record fields; thresholds are your-input | Proven needs ≥${PROVEN_MIN_APPROVALS} approvals and a non-senior software title; p = ${JSON.stringify(TIER_P)} |`);
  o.push('| "Non-senior software title" | inference from title wording | the CSV lists top titles only; it does not say a company hires entry-level |');
  o.push('| Liveness factor | your-input | transcribed from a human-run `npm run ats:liveness`; not checked by this program |');
  o.push(`| Timeline factor | your-input | OPT start ${run.inputs.opt_start}, ${run.inputs.unemployment_days}-day window (ends ${run.timeline.window_end}), hiring lag ${run.inputs.hiring_lag_days} days, as-of ${run.inputs.as_of}: ${run.timeline.days_remaining} days remain, factor ${run.timeline.factor} |`);
  o.push('| OPT-bridge rows (`opt-bridge-open` / `opt-bridge-closed`) | rule over your-input | only the liveness result you typed and the timeline arithmetic; contract status, field relevance and whether the role is allowed on your OPT are NOT checked here. Confirm with your school\'s international office and the employer |');
  o.push(`| Fit | your-input | one flat value (${run.inputs.fit}) for every company; it does not rank companies |`);
  o.push(`| Role quality, SOC ${soc.soc} ${soc.title} | record, informational only | national median wage ${soc.annual_median_wage} (OEWS ${soc.oews_year}), cognitive pivot score ${soc.cognitive_pivot_score}. The scorer's role_quality weight is 0, so this changes no decision. National, not entry-level, not local. |`);
  o.push('');
  o.push('## Human gate');
  o.push('');
  o.push('Gate status: **NOT CLEARED**. No named human has reviewed these rows. To clear: open each Apply/Consider posting by hand, confirm it is live, and log your decision with name and date in `logs/runs/`.');
  return o.join('\n') + '\n';
}

function arg(args, name, def) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; }

export function main(argv) {
  const args = argv.slice(2);
  const need = (n) => { const v = arg(args, n); if (!v) throw new UsageError(`missing ${n}`); return v; };
  const postingsPath = need('--postings'); const asOf = need('--as-of'); const optStart = need('--opt-start');
  const lagDays = Number(arg(args, '--hiring-lag-days', '45')); const unemploymentDays = Number(arg(args, '--unemployment-days', '90'));
  // 0.5 is deliberate: with the scorer's fit weight 0.30, a flat 0.7 would give a
  // no-sponsor company 0.21, inside the Consider band (floor 0.20).
  const fit = Number(arg(args, '--fit', '0.5'));
  const socCode = arg(args, '--soc', '15-1252');
  const csvPath = path.resolve(REPO, arg(args, '--csv', DEFAULT_CSV)); const socCsv = path.resolve(REPO, arg(args, '--soc-csv', DEFAULT_SOC_CSV));
  const outDir = path.resolve(REPO, arg(args, '--out-dir', DEFAULT_OUT));
  if (!(fit >= 0 && fit <= 1)) throw new UsageError('--fit must be between 0 and 1');
  guardOutDir(outDir);
  for (const f of [csvPath, socCsv, path.resolve(postingsPath)]) if (!fs.existsSync(f)) throw new UsageError(`file not found: ${f}`);

  const soc = loadSocRow(socCsv, socCode);
  const csvText = fs.readFileSync(csvPath);
  const csv = parseCsv(csvText.toString('utf8'));
  let postings;
  try { postings = JSON.parse(fs.readFileSync(path.resolve(postingsPath), 'utf8')); } catch (e) { throw new UsageError(`postings file is not valid JSON: ${e.message}`); }
  const ev = evaluate({ csv, postings, asOf, optStart, unemploymentDays, lagDays, fit });

  fs.mkdirSync(outDir, { recursive: true });
  let scorerLine = null; let scoreById = new Map();
  const rolesPath = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(ev.roles, null, 2) + '\n');
  if (ev.roles.length) {
    const s = runScorer(rolesPath, outDir); scorerLine = s.stdout.split('\n')[0];
    scoreById = new Map(s.scores.roles.map((x) => [x.role_id, x]));
  }
  const rows = ev.results.map((r) => {
    const sc = scoreById.get(r.role_id);
    return sc ? { ...r, composite: sc.composite, recommendation: sc.recommendation, reason: sc.reason, trace: sc.trace, next_action: nextAction(r, sc) } : r;
  });
  const snapshotGap = ev.snapshotEnd ? Math.round((parseDate(asOf, '--as-of') - Date.parse(`${ev.snapshotEnd}T00:00:00Z`)) / DAY) : null;
  const run = {
    generated_at: new Date().toISOString(), tool: 'shortlist.mjs',
    inputs: { as_of: asOf, opt_start: optStart, unemployment_days: unemploymentDays, hiring_lag_days: lagDays, fit, soc: socCode, csv: path.relative(REPO, csvPath), csv_sha256: crypto.createHash('sha256').update(csvText).digest('hex'), csv_rows: csv.records.length, data_snapshot_end: ev.snapshotEnd, snapshot_gap_days: snapshotGap, postings_file: path.relative(REPO, path.resolve(postingsPath)) },
    labels: { liveness: 'your-input (transcribed)', timeline: 'your-input', fit: 'your-input', sponsorship: 'record fields -> rule', role_quality: 'record, informational' },
    timeline: ev.timeline, role_quality: soc,
    counts: (() => {
      const bridge = rows.filter((r) => r.status === 'opt-bridge-open' || r.status === 'opt-bridge-closed').length;
      return { postings: postings.length, scored: ev.roles.length, opt_bridge_checked: bridge, unscored: postings.length - ev.roles.length - bridge };
    })(),
    scorer_summary: scorerLine, human_gate: { cleared: false, by: null, date: null }, results: rows,
  };
  fs.writeFileSync(path.join(outDir, 'shortlist-log.json'), JSON.stringify(run, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'shortlist-report.md'), renderReport({ run, soc, rows, scorerLine }));
  console.log(`✓ ${run.counts.scored}/${run.counts.postings} scored · ${scorerLine ?? 'scorer not run'}`);
  console.log(`  wrote ${path.relative(process.cwd(), path.join(outDir, 'shortlist-log.json'))} + shortlist-report.md`);
  return run;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(process.argv); } catch (e) {
    if (e instanceof UsageError) { console.error(`✗ ${e.message}`); process.exit(2); }
    console.error(e); process.exit(1);
  }
}
