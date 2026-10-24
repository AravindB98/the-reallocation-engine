#!/usr/bin/env node
// triage.mjs — AI Engineer co-op → H-1B triage (2026fa, chethangowda-git).
//
// Reads candidate roles (your-input), looks each company up in the 80 Days to
// Stay sponsorship CSV (record), stops any role that fails a pre-scorer gate,
// then runs the maintained Ch.11 scorer CLI once per timeline scenario.
// Writes triage-log.json (agent) + triage-report.md (human) into --out.
//
// Does NOT re-implement the scorer and does NOT invent a value: a missing
// company, a blank sponsorship record, or a missing gate value stops the role.
//
//   node scripts/contrib/2026fa/chethangowda-git-ai-sde-coop-h1b/triage.mjs \
//     [--candidates file.json] [--csv file.csv] [--out dir]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const SCORER = path.join(ROOT, 'scripts/score/role-scorer.mjs');
const DEFAULT_CSV = path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv');

const L = { record: 'record', model: 'model-judgment', input: 'your-input' };
const v = (value, label, extra = {}) => ({ value, label, ...extra });

// Only these CSV columns are ever read into memory. phone / executive_officers /
// board_directors are deliberately never copied.
const KEEP = ['company_name', 'Total Approvals', 'Total Denials', 'Approval_Rate', 'top_job_titles_sponsored'];

// Sponsorship tier mapping — your-input (the author's documented choice, not a
// record). The p values match the tiers used in data/examples/ch11-roles.json.
const TIER_RULES = [
  { tier: 'Proven', p: 0.9, test: (a, r) => a >= 100 && r >= 95, rule: 'approvals >= 100 and approval rate >= 95%' },
  { tier: 'Likely', p: 0.6, test: (a) => a >= 10, rule: 'approvals 10-99, or >= 100 with rate < 95%' },
  { tier: 'Possible', p: 0.3, test: (a) => a >= 1, rule: 'approvals 1-9' },
  { tier: 'None', p: 0.0, test: () => true, rule: 'approvals = 0' },
];

function parseCsv(text) {
  // Minimal RFC 4180 parser (quoted fields may contain commas, quotes, newlines).
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}

function loadSponsorship(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const head = rows[0];
  const idx = Object.fromEntries(KEEP.map((k) => [k, head.indexOf(k)]));
  for (const k of KEEP) if (idx[k] < 0) throw new Error(`CSV is missing required column "${k}" — stop (schema drift)`);
  const byName = new Map();
  rows.slice(1).forEach((r, i) => {
    if (r.length < head.length) return;
    const rec = Object.fromEntries(KEEP.map((k) => [k, r[idx[k]]]));
    rec._line = i + 2; // 1-based line number incl. header
    const key = rec.company_name.trim().toUpperCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(rec);
  });
  return byName;
}

const ym = (s) => (typeof s === 'string' && /^\d{4}-\d{2}$/.test(s) ? s : null);

// Pre-scorer gates. Returns { stop: {gate, reason} } or { ok: {...} }.
function checkRole(role, sponsorship, csvRel) {
  const matches = sponsorship.get(String(role.company || '').trim().toUpperCase()) || [];
  if (matches.length === 0) return { stop: { gate: 'G1 company-in-record', reason: 'no-company-match', detail: `exact name "${role.company}" not found in ${csvRel}; sponsorship not guessed` } };
  if (matches.length > 1) return { stop: { gate: 'G1 company-in-record', reason: 'ambiguous-match', detail: `${matches.length} rows share this exact name (lines ${matches.map((m) => m._line).join(', ')})` } };
  const rec = matches[0];
  const a = rec['Total Approvals'].trim(); const rate = rec['Approval_Rate'].trim();
  if (a === '' || !isFinite(Number(a))) return { stop: { gate: 'G1 company-in-record', reason: 'no-sponsorship-record', detail: `row found (line ${rec._line}) but "Total Approvals" is blank; not treated as zero` } };
  if (role.liveness == null || typeof role.liveness.factor !== 'number') return { stop: { gate: 'G2 gate-values-present', reason: 'missing-gate-value: liveness', detail: 'no liveness value; the scorer would treat it as open (factor 1), so the role is not sent' } };
  if (!ym(role.start_window?.from) || !ym(role.start_window?.to)) return { stop: { gate: 'G2 gate-values-present', reason: 'missing-gate-value: timeline', detail: 'no start window (YYYY-MM from/to); the scorer would treat timeline as open, so the role is not sent' } };
  const approvals = Number(a); const approvalRate = rate === '' ? null : Number(rate);
  const t = TIER_RULES.find((x) => x.test(approvals, approvalRate ?? 0));
  return { ok: { rec, approvals, approvalRate, tier: t } };
}

function timelineFactor(role, scenario) {
  const avail = scenario.available[role.role_type];
  if (!avail) return { factor: 0.0, why: `scenario "${scenario.id}" has no ${role.role_type} start` };
  const inWin = avail >= role.start_window.from && avail <= role.start_window.to;
  return { factor: inWin ? 1.0 : 0.0, why: `${role.role_type} available ${avail}; role window ${role.start_window.from}..${role.start_window.to} → ${inWin ? 'fits' : 'does not fit'}` };
}

const NEXT = { Apply: 'tailor an application', Consider: 'network into the company before applying', Skip: 'skip' };

function main() {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const candPath = path.resolve(opt('--candidates', path.join(HERE, 'fixtures/candidates.sample.json')));
  const csvPath = path.resolve(opt('--csv', DEFAULT_CSV));
  const outDir = path.resolve(opt('--out', path.join(HERE, 'out')));
  for (const [what, p] of [['candidates', candPath], ['sponsorship CSV', csvPath], ['scorer', SCORER]]) {
    if (!fs.existsSync(p)) { console.error(`✗ ${what} not found: ${p} — stop, nothing invented`); process.exit(2); }
  }
  const rel = (p) => path.relative(ROOT, p);
  const cand = JSON.parse(fs.readFileSync(candPath, 'utf8'));
  const sponsorship = loadSponsorship(csvPath);
  fs.mkdirSync(outDir, { recursive: true });

  const stopped = []; const passed = [];
  for (const role of cand.roles) {
    const r = checkRole(role, sponsorship, rel(csvPath));
    if (r.stop) stopped.push({ role_id: role.role_id, company: v(role.company, L.input), title: v(role.title, L.input), ...r.stop });
    else passed.push({ role, ...r.ok });
  }

  const scenarios = [];
  for (const sc of cand.scenarios) {
    const scDir = path.join(outDir, sc.id);
    fs.mkdirSync(scDir, { recursive: true });
    const roles = passed.map(({ role, tier }) => {
      const t = timelineFactor(role, sc);
      return {
        role_id: role.role_id, company: role.company, title: role.title,
        sponsorship: { p: tier.p, tier: tier.tier, source: L.input },
        liveness: { factor: role.liveness.factor, source: role.liveness.source },
        timeline: { factor: t.factor, source: L.input },
      };
    });
    const rolesPath = path.join(scDir, 'roles.json');
    fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2));
    const run = spawnSync(process.execPath, [SCORER, rolesPath, '--out-dir', scDir], { cwd: ROOT, encoding: 'utf8' });
    if (run.status !== 0) { console.error(`✗ scorer failed for scenario ${sc.id}:\n${run.stderr}`); process.exit(3); }
    const scored = JSON.parse(fs.readFileSync(path.join(scDir, 'role-scores.json'), 'utf8')).roles;
    scenarios.push({ id: sc.id, label: sc.label, available: v(sc.available, L.input), scorer_stdout: run.stdout.trim(), roles_json: rel(rolesPath),
      results: scored.map((s) => {
        const p = passed.find((x) => x.role.role_id === s.role_id);
        const t = timelineFactor(p.role, sc);
        return { role_id: s.role_id, company: s.company, title: s.title, recommendation: s.recommendation, composite: s.composite,
          next_action: NEXT[s.recommendation], reason: s.reason, timeline_why: t.why, arithmetic: s.trace.arithmetic };
      }) });
  }

  const evidence = passed.map(({ role, rec, approvals, approvalRate, tier }) => ({
    role_id: role.role_id,
    company: v(role.company, L.input),
    title: v(role.title, L.input, { note: role.posting_note || null }),
    role_type: v(role.role_type, L.input),
    start_window: v(role.start_window, L.input),
    soc: v(role.soc, L.model, { note: 'title → SOC mapping is a model judgment' }),
    sponsorship_record: v({ company_name: rec.company_name, total_approvals: approvals, total_denials: Number(rec['Total Denials']), approval_rate: approvalRate, top_job_titles_sponsored: rec.top_job_titles_sponsored }, L.record, { source: `${rel(csvPath)}:${rec._line}` }),
    sponsorship_tier: v(tier.tier, L.input, { p: tier.p, rule: tier.rule }),
    liveness: v(role.liveness.factor, role.liveness.source, { note: role.liveness.note || null }),
    coop_conversion: v(null, 'not-verified', { note: '[TODO: DATA SOURCE] no co-op-to-full-time conversion data in the repo' }),
  }));

  const log = { recipe: 'chethangowda-git-ai-sde-coop-h1b', recipe_version: '0.1.0', generated: new Date().toISOString(),
    inputs: { candidates: rel(candPath), sponsorship_csv: rel(csvPath), scorer: rel(SCORER) },
    persona: v(cand.persona, L.input), tier_rules: v(TIER_RULES.map(({ tier, p, rule }) => ({ tier, p, rule })), L.input),
    counts: { candidates: cand.roles.length, stopped_before_scorer: stopped.length, sent_to_scorer: passed.length },
    stopped, evidence, scenarios };
  fs.writeFileSync(path.join(outDir, 'triage-log.json'), JSON.stringify(log, null, 2));
  fs.writeFileSync(path.join(outDir, 'triage-report.md'), report(log));

  console.log(`✓ ${cand.roles.length} candidates → ${stopped.length} stopped before scorer · ${passed.length} scored × ${scenarios.length} scenarios`);
  for (const s of stopped) console.log(`  STOP ${s.role_id}: ${s.gate} — ${s.reason}`);
  for (const sc of scenarios) console.log(`  [${sc.id}] ${sc.scorer_stdout.split('\n')[0]}`);
  console.log(`  ${rel(path.join(outDir, 'triage-log.json'))}  +  ${rel(path.join(outDir, 'triage-report.md'))}`);
}

function report(log) {
  const o = [];
  o.push('# AI Engineer co-op to H-1B triage: run report\n');
  o.push('## Executive summary\n');
  const sc = log.scenarios.map((s) => {
    const c = (r) => s.results.filter((x) => x.recommendation === r).length;
    return `**${s.label}:** ${c('Apply')} apply, ${c('Consider')} consider, ${c('Skip')} skip`;
  }).join('; ');
  o.push(`This report checks ${log.counts.candidates} candidate AI Engineer roles for a student who wants a Spring co-op that could become a full-time job needing visa sponsorship. ${log.counts.stopped_before_scorer} roles were stopped before scoring because a needed fact was missing; nothing was guessed in their place. The rest were scored under two start-date plans. ${sc}. Only past visa-sponsorship counts come from real records. Whether a co-op turns into a full-time offer is **not checked**, because no data for it exists here. A person makes the final call on every role.\n`);
  o.push('## Run record\n');
  o.push(`- Generated: ${log.generated}\n- Candidates: \`${log.inputs.candidates}\` (your-input)\n- Sponsorship record: \`${log.inputs.sponsorship_csv}\`\n- Scorer: \`${log.inputs.scorer}\` (run as CLI, unmodified; role_quality weight 0.0 in the scorer, fit not supplied)\n`);
  o.push('## Stopped before the scorer\n');
  o.push('| Role | Company (your-input) | Gate | Reason | Detail |\n|---|---|---|---|---|');
  for (const s of log.stopped) o.push(`| ${s.role_id} | ${s.company.value} | ${s.gate} | \`${s.reason}\` | ${s.detail} |`);
  o.push('\n## Evidence per scored role\n');
  o.push('| Role | Sponsorship record (record) | Tier → p (your-input) | Liveness | SOC (model-judgment) | Co-op conversion |\n|---|---|---|---|---|---|');
  for (const e of log.evidence) {
    const r = e.sponsorship_record.value;
    o.push(`| ${e.role_id} | ${r.total_approvals} approvals / ${r.total_denials} denials (${r.approval_rate == null ? '—' : r.approval_rate.toFixed(1) + '%'}), \`${e.sponsorship_record.source}\` | ${e.sponsorship_tier.value} → ${e.sponsorship_tier.p} | ${e.liveness.value} [${e.liveness.label}] | ${e.soc.value} | not verified |`);
  }
  for (const s of log.scenarios) {
    o.push(`\n## Scenario: ${s.label}\n`);
    o.push('| Role | Decision | Composite | Next action | Timeline (your-input) | Arithmetic |\n|---|---|---|---|---|---|');
    for (const r of s.results) o.push(`| ${r.company}: ${r.title} | **${r.recommendation}** | ${r.composite} | ${r.next_action} | ${r.timeline_why} | \`${r.arithmetic}\` |`);
  }
  o.push('\n## What a human must judge\n');
  o.push('- Liveness values here are not machine-checked (the liveness tool could not run). Confirm each posting is open before acting.');
  o.push('- Tier → p is the author\'s mapping, not a record. Approval counts are company-wide, not specific to AI Engineer roles.');
  o.push('- Co-op-to-full-time conversion is unknown for every company.');
  return o.join('\n') + '\n';
}

main();
