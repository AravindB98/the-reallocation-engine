#!/usr/bin/env node
// de-mlops-h1b.mjs — Data Engineering / MLOps H-1B triage for a pre-OPT student.
// Recipe: recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md
//
// Builds a ch11-roles.json-shaped file from real repo data, runs the REAL scorer
// (scripts/score/role-scorer.mjs — not a copy), and writes a JSON log (agent) and
// a Markdown report (human). Every value carries a source label:
//   record          — read from a repo data file or a saved tool output
//   model-judgment  — a rule this script applies that a human could disagree with
//   your-input      — stated by the student in the persona or postings file
//
// A posting that fails an evidence check is put ON HOLD with a reason code and is
// NOT sent to the scorer. Nothing here fills a missing value.
//
// Offline: reads local files only. Liveness comes from a SAVED `npm run ats:liveness`
// output; this script never fetches anything.
//
//   node scripts/contrib/2026fa/gnanasudharsan-de-mlops-h1b/de-mlops-h1b.mjs \
//     --persona <persona.json> --postings <postings.json> --liveness <liveness.txt> \
//     [--csv <path>] [--formd-dir <dir>] [--bls <path>] [--today YYYY-MM-DD] \
//     [--out-dir <dir>] [--roles-dir <dir>]
//
// Exit codes: 0 ok · 2 bad input / G0 profile gate failed · 3 scorer misread the
// profile (sponsorship weight zeroed) · 4 scorer failed.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const SCORER = path.join(REPO, 'scripts/score/role-scorer.mjs');

const DEFAULTS = {
  csv: 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv',
  formdDir: 'data/sec/form-d/processed/sample',
  bls: 'data/bls/compact/soc_occupation_compact.csv',
};

// ── model-judgment: which titles count as the target families. Printed in the report.
export const FAMILIES = {
  'data-engineering': /data engineer|analytics engineer|data platform|data infrastructure|data warehous|etl developer|big data/i,
  mlops: /mlops|ml ops|machine learning engineer|ml engineer|machine learning platform|ml platform|ml infrastructure|machine learning infrastructure|ai infrastructure|ai platform/i,
};

// ── model-judgment: which SOC rows to show as role-quality context per family.
// Context only — the scorer's role_quality weight is 0.0 [VERIFY], so these never move a decision.
const FAMILY_SOC = { 'data-engineering': ['15-1243.00', '15-1243.01'], mlops: ['15-1252.00', '15-2051.00'] };

// ── tier rule (model-judgment applied to record counts) and tier→p (Ch.11 example values,
// recipe [TODO: DEFINE]). The scorer treats Likely/Possible as soft (Apply → Consider).
const TIER_P = { Proven: 0.9, Likely: 0.6, Possible: 0.3, None: 0.0 };
const P_BASIS = 'tier→p uses the Ch.11 worked-example values (Proven 0.9, Likely 0.6); Possible 0.3 and None 0.0 extend them — uncalibrated, recipe [TODO: DEFINE]';

const LABELS = new Set(['record', 'model-judgment', 'your-input']);

// ── company-name normalisation: a port of normalize_company_name() in
// scripts/sec/sec-all-quarters.py (suffix list at :10, function at :34), so CSV names
// and Form D company_name_normalized are compared by the SAME rule. Exact match only.
const SUFFIXES = [/\s+inc\.?$/i, /\s+incorporated$/i, /\s+llc\.?$/i, /\s+l\.?l\.?c\.?$/i, /\s+ltd\.?$/i,
  /\s+limited$/i, /\s+corp\.?$/i, /\s+corporation$/i, /\s+co\.?$/i, /\s+company$/i, /\s+l\.?p\.?$/i,
  /\s+lp$/i, /\s+plc\.?$/i];
export function normalizeCompany(name) {
  let c = String(name ?? '').trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of SUFFIXES) { const r = c.replace(s, ''); if (r !== c) { c = r.trim(); changed = true; } }
  }
  return c.replace(/[,.\s\-&']/g, '').toLowerCase() || null;
}

// ── minimal RFC-4180 CSV parser (quoted fields, embedded commas/newlines). No deps.
export function parseCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// top_job_titles_sponsored is a Python-list string: "['A', 'B']". Read quoted items only.
export function parseTitles(s) {
  return [...String(s || '').matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => (m[1] ?? m[2]).trim()).filter(Boolean);
}

export function familyOf(title) {
  for (const [fam, re] of Object.entries(FAMILIES)) if (re.test(title)) return fam;
  return null;
}

// Saved `npm run ats:liveness` stdout → Map(url → status). Conflicting lines → 'conflict'.
export function parseLiveness(text) {
  const m = new Map();
  for (const line of String(text).split(/\r?\n/)) {
    const hit = line.match(/^\S+\s+(active|expired|uncertain)\s+(\S+)\s*$/u);
    if (!hit) continue;
    const [, status, url] = hit;
    m.set(url, m.has(url) && m.get(url) !== status ? 'conflict' : status);
  }
  return m;
}

// ── dates (UTC, date-only)
const DAY = 86400000;
export function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}
const iso = (d) => d.toISOString().slice(0, 10);
const addMonths = (d, n) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };

// March H-1B registration windows between start and authorization end (your-input assumption:
// one window per March; a window counts if it ends on/after the start and begins before the end).
export function registrationSeasons(start, authEnd) {
  const out = [];
  for (let y = start.getUTCFullYear(); y <= authEnd.getUTCFullYear(); y++) {
    const open = new Date(Date.UTC(y, 2, 1)); const close = new Date(Date.UTC(y, 2, 31));
    if (close >= start && open <= authEnd) out.push(y);
  }
  return out;
}

// ── G0: persona dates. Returns { ok, errors, derived }.
export function checkPersona(p, today) {
  const errors = [];
  const programEnd = parseDate(p?.program_end_date);
  const ead = parseDate(p?.assumed_ead_start_date);
  if (!programEnd) errors.push('program_end_date missing or not YYYY-MM-DD');
  if (!ead) errors.push('assumed_ead_start_date missing or not YYYY-MM-DD');
  if (typeof p?.authorization !== 'string' || !p.authorization.trim()) errors.push('authorization string missing');
  if (p?.needs_sponsorship !== true) errors.push('needs_sponsorship must be true for this recipe (it is built for students who will need H-1B)');
  if (errors.length) return { ok: false, errors };
  // [verify] post-completion OPT must start within 60 days after program end — your-input check, not a record.
  if (ead < programEnd) errors.push(`assumed EAD start ${iso(ead)} is before program end ${iso(programEnd)}`);
  if (ead > new Date(programEnd.getTime() + 60 * DAY)) errors.push(`assumed EAD start ${iso(ead)} is more than 60 days after program end ${iso(programEnd)}`);
  if (ead < today) errors.push(`assumed EAD start ${iso(ead)} is already past (today ${iso(today)}) — this recipe is for students not yet on OPT`);
  const optEnd = new Date(addMonths(ead, 12).getTime() - DAY);
  const authEnd = p.stem_extension_assumed === true ? addMonths(optEnd, 24) : optEnd;
  if (authEnd <= today) errors.push('assumed authorization end is already past');
  return { ok: errors.length === 0, errors, derived: { programEnd, ead, optEnd, authEnd } };
}

// ── G2: sponsorship evidence from the 80 Days CSV.
export function sponsorshipFor(company, family, csvIndex) {
  const key = normalizeCompany(company);
  const rows = (key && csvIndex.get(key)) || [];
  if (rows.length === 0) return { hold: 'not-in-dataset', detail: `no row whose normalized name is "${key}" (exact match only)` };
  if (rows.length > 1) return { hold: 'ambiguous-company', detail: `${rows.length} rows normalize to "${key}": ${rows.map((r) => `${r.company_name} (approvals ${r['Total Approvals'] || 'blank'})`).join('; ')}` };
  const r = rows[0];
  const rawA = (r['Total Approvals'] || '').trim();
  if (rawA === '') return { hold: 'no-sponsorship-record', detail: `${r.company_name}: Total Approvals is blank — no record either way, not zero`, row: r };
  const approvals = Number(rawA); const denials = (r['Total Denials'] || '').trim() === '' ? null : Number(r['Total Denials']);
  if (!Number.isFinite(approvals)) return { hold: 'unparseable-record', detail: `${r.company_name}: Total Approvals "${rawA}" is not a number`, row: r };
  const titles = parseTitles(r.top_job_titles_sponsored);
  const familyTitles = titles.filter((t) => familyOf(t) === family);
  let tier;
  if (approvals === 0) tier = 'None';
  else if (approvals >= 10) tier = familyTitles.length ? 'Proven' : 'Likely';
  else tier = familyTitles.length ? 'Likely' : 'Possible';
  return {
    row: r,
    term: {
      p: TIER_P[tier], tier, source: 'record',
      p_basis: P_BASIS,
      tier_rule: 'model-judgment: Proven = ≥10 approvals and ≥1 sponsored title in the same family; Likely = ≥10 with no family title, or 1–9 with one; Possible = 1–9 with none; None = 0',
      evidence: { csv_company_name: r.company_name, total_approvals: approvals, total_denials: denials, approval_rate: r.Approval_Rate || null, family_titles_sponsored: familyTitles, top_titles_count: titles.length },
    },
  };
}

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function rel(p) { return path.relative(REPO, path.resolve(p)) || '.'; }

function loadFormD(dir) {
  const index = new Map(); const quarters = [];
  if (!fs.existsSync(dir)) return { index, quarters, missing: true };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const cos = d.companies || [];
    quarters.push({ file: f, quarter: d.metadata?.quarter ?? null, in_sample: cos.length, total_in_quarter: d.metadata?.total_companies ?? null });
    for (const c of cos) {
      const k = c.company?.company_name_normalized; if (!k) continue;
      if (!index.has(k)) index.set(k, []);
      index.get(k).push({ quarter: c.filing?.quarter ?? d.metadata?.quarter, date_filed: c.filing?.date_filed ?? null, total_offering_amount: c.funding?.total_offering_amount ?? null, total_amount_sold: c.funding?.total_amount_sold ?? null });
    }
  }
  return { index, quarters, missing: false };
}

function loadBls(file) {
  const m = new Map();
  if (!fs.existsSync(file)) return m;
  for (const r of parseCsv(fs.readFileSync(file, 'utf8'))) m.set(r.onet_soc_code, r);
  return m;
}

function arg(args, name, def) { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : def; }
function fail(code, msg) { console.error(`✗ ${msg}`); process.exit(code); }

// ── next action per outcome (the 3-3-2 link)
const NEXT = {
  Apply: 'tailor this application (2 research-and-apply hours)',
  Consider: 'one soft spot — confirm it (ask a contact) before tailoring',
  Skip: 'skip — time goes to networking or the credibility project instead',
  'not-in-dataset': 'network in: ask an employee whether the team sponsors (no record here either way)',
  'no-sponsorship-record': 'network in: no H-1B record in this file — do not read as "does not sponsor"',
  'ambiguous-company': 'human: pick the right legal entity by hand, then re-run with that exact name',
  'unparseable-record': 'human: inspect the CSV row',
  'liveness-unconfirmed': 'human: open the posting; re-run ats:liveness and save the output',
  'off-target-title': 'outside data-engineering / MLOps — out of scope for this recipe',
  'no-fit-input': 'add your fit rating (0–1) for this posting, then re-run',
  'no-start-input': 'add a start_date (YYYY-MM-DD or "flexible"), then re-run',
};

export function buildRoles({ persona, postings, liveness, csvIndex, today, gate }) {
  const roles = []; const holds = []; const context = [];
  for (const [i, post] of postings.entries()) {
    const id = post.role_id || `role-${i + 1}`;
    const base = { role_id: id, company: post.company, title: post.title, url: post.url ?? null };
    const hold = (reason, detail, extra = {}) => holds.push({ ...base, hold: reason, detail, next_action: NEXT[reason], ...extra });

    const family = familyOf(post.title || '');
    if (!family) { hold('off-target-title', `title "${post.title}" matches neither family keyword list`); continue; }
    const familyLabel = { value: family, source: 'model-judgment' };

    // lookup name: the student's stated legal name if given (your-input), else the name on the posting
    const lookup = post.legal_name ?? post.company;
    const lookupLabel = { value: lookup, source: post.legal_name ? 'your-input' : 'record', basis: post.legal_name ? 'legal_name given by the student' : 'company name as shown on the posting' };
    const sp = sponsorshipFor(lookup, family, csvIndex);
    const csvRow = sp.row ?? null;
    const ctx = { role_id: id, company: post.company, lookup_name: lookupLabel, family, csv_row: csvRow ? csvRow.company_name : null, latest_funding_date: csvRow ? { value: csvRow.latest_funding_date || null, source: 'record' } : null };
    context.push(ctx);
    if (sp.hold) { hold(sp.hold, sp.detail, { family: familyLabel, lookup_name: lookupLabel }); continue; }

    const live = liveness.get(post.url);
    if (live !== 'active' && live !== 'expired') {
      hold('liveness-unconfirmed', `saved liveness output says "${live ?? 'URL not present'}" for ${post.url}`, { family: familyLabel }); continue;
    }

    const fit = post.fit;
    if (typeof fit !== 'number' || fit < 0 || fit > 1) { hold('no-fit-input', `fit "${fit}" is not a number in [0,1]`, { family: familyLabel }); continue; }

    let start;
    if (post.start_date === 'flexible') start = gate.ead;
    else if (parseDate(post.start_date)) start = parseDate(post.start_date);
    else { hold('no-start-input', `start_date "${post.start_date}" is neither YYYY-MM-DD nor "flexible"`, { family: familyLabel }); continue; }

    let factor; let seasons = [];
    if (start < gate.ead) factor = 0;
    else { seasons = registrationSeasons(start, gate.authEnd); factor = seasons.length === 0 ? 0 : Math.min(1, Number((seasons.length / 3).toFixed(3))); }

    roles.push({
      role_id: id, company: post.company, title: post.title,
      family: familyLabel, lookup_name: lookupLabel,
      sponsorship: sp.term,
      fit: { p: fit, source: 'your-input', note: post.fit_note ?? null },
      liveness: { factor: live === 'active' ? 1.0 : 0.0, source: 'record', status: live, from: 'saved npm run ats:liveness output' },
      timeline: {
        factor, source: 'your-input',
        start_date: iso(start), start_basis: post.start_date === 'flexible' ? 'flexible → assumed EAD start' : 'posting start_date (your-input)',
        assumed_ead_start: iso(gate.ead), assumed_auth_end: iso(gate.authEnd), registration_seasons: seasons,
        rule: start < gate.ead ? 'start before assumed EAD start → gate closed (0.0)' : 'min(1, seasons/3)',
      },
    });
  }
  return { roles, holds, context };
}

function main() {
  const args = process.argv.slice(2);
  const personaPath = arg(args, '--persona'); const postingsPath = arg(args, '--postings'); const livePath = arg(args, '--liveness');
  if (!personaPath || !postingsPath || !livePath) fail(2, 'usage: --persona <file> --postings <file> --liveness <saved ats:liveness output> [--csv] [--formd-dir] [--bls] [--today] [--out-dir] [--roles-dir]');
  const csvPath = arg(args, '--csv', path.join(REPO, DEFAULTS.csv));
  const formdDir = arg(args, '--formd-dir', path.join(REPO, DEFAULTS.formdDir));
  const blsPath = arg(args, '--bls', path.join(REPO, DEFAULTS.bls));
  const todayStr = arg(args, '--today', new Date().toISOString().slice(0, 10));
  const today = parseDate(todayStr) || fail(2, `--today "${todayStr}" is not YYYY-MM-DD`);
  const outDir = path.resolve(arg(args, '--out-dir', path.join(REPO, 'course/2026fa/submissions/gnanasudharsan/runs', todayStr)));
  const rolesDir = path.resolve(arg(args, '--roles-dir', HERE));
  for (const [n, p] of [['persona', personaPath], ['postings', postingsPath], ['liveness', livePath], ['csv', csvPath]])
    if (!fs.existsSync(p)) fail(2, `${n} file not found: ${p}`);

  const persona = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
  const g0 = checkPersona(persona, today);
  if (!g0.ok) fail(2, `G0 profile gate failed — nothing written:\n  - ${g0.errors.join('\n  - ')}`);

  const postings = JSON.parse(fs.readFileSync(postingsPath, 'utf8'));
  if (!Array.isArray(postings) || postings.length === 0) fail(2, 'postings file must be a non-empty JSON array');

  const csvRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (!csvRows.length || !('Total Approvals' in csvRows[0])) fail(2, `CSV ${csvPath} has no "Total Approvals" column — schema drift, refusing to guess`);
  const csvIndex = new Map();
  for (const r of csvRows) { const k = normalizeCompany(r.company_name); if (!k) continue; if (!csvIndex.has(k)) csvIndex.set(k, []); csvIndex.get(k).push(r); }

  const liveness = parseLiveness(fs.readFileSync(livePath, 'utf8'));
  const formd = loadFormD(formdDir);
  const bls = loadBls(blsPath);

  const { roles, holds, context } = buildRoles({ persona, postings, liveness, csvIndex, today, gate: g0.derived });

  // label check — the output contract: every term carries a known source label
  for (const r of roles) for (const k of ['family', 'lookup_name', 'sponsorship', 'fit', 'liveness', 'timeline'])
    if (!LABELS.has(r[k]?.source)) fail(2, `internal: ${r.role_id}.${k} has no valid source label`);

  for (const c of context) {
    const hits = formd.index.get(normalizeCompany(c.lookup_name.value)) || [];
    c.form_d_sample = hits.length ? { value: hits, source: 'record' } : { value: null, source: 'record', note: 'not in the shipped Form D samples (first 50 companies per quarter) — says nothing about whether a filing exists' };
  }

  fs.mkdirSync(rolesDir, { recursive: true });
  const rolesPath = path.join(rolesDir, 'roles.json');
  const profilePath = path.join(rolesDir, 'profile.json');
  fs.writeFileSync(rolesPath, JSON.stringify(roles, null, 2) + '\n');
  fs.writeFileSync(profilePath, JSON.stringify({ authorization: persona.authorization, _source: 'your-input (persona authorization, verbatim)' }, null, 2) + '\n');

  let scorer = null;
  if (roles.length) {
    const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'de-mlops-h1b-'));
    const res = spawnSync(process.execPath, [SCORER, rolesPath, '--profile', profilePath, '--out-dir', stage], { cwd: REPO, encoding: 'utf8' });
    if (res.status !== 0) fail(4, `scorer exited ${res.status}:\n${res.stderr}`);
    scorer = JSON.parse(fs.readFileSync(path.join(stage, 'role-scores.json'), 'utf8'));
    if (scorer.profile_needs_sponsorship !== true)
      fail(3, `scorer read the profile "${persona.authorization}" as NOT needing sponsorship (profile_needs_sponsorship=${scorer.profile_needs_sponsorship}), which zeroes the sponsorship weight. Known regex trap at scripts/score/role-scorer.mjs:60. No report written. Scorer output kept for inspection: ${stage}`);
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of ['role-scores.json', 'role-scores.md']) fs.copyFileSync(path.join(stage, f), path.join(outDir, f));
    scorer._stdout = res.stdout.trim().split('\n')[0]; // summary line only — line 2 is the temp staging path
  }
  fs.mkdirSync(outDir, { recursive: true });

  const scored = scorer ? scorer.roles : [];
  const count = (rec) => scored.filter((s) => s.recommendation === rec).length;
  const summary = { postings: postings.length, scored: scored.length, held: holds.length, apply: count('Apply'), consider: count('Consider'), skip: count('Skip') };
  summary.not_apply_rate = Number(((summary.postings - summary.apply - summary.consider) / summary.postings).toFixed(3));

  const blsContext = Object.fromEntries(Object.entries(FAMILY_SOC).map(([fam, codes]) => [fam, codes.map((c) => {
    const r = bls.get(c);
    return r ? { onet_soc_code: c, title: r.title, oews_year: r.oews_year || null, annual_median_wage: r.annual_median_wage || null, employment: r.employment || null, source: 'record', soc_mapping_source: 'model-judgment' } : { onet_soc_code: c, missing: 'no row in BLS compact file', source: 'record' };
  })]));

  const inputs = { persona: personaPath, postings: postingsPath, liveness: livePath, csv: csvPath, bls: blsPath };
  const log = {
    _recipe: 'recipes/cases/2026fa/gnanasudharsan-de-mlops-h1b.md', _recipe_version: '0.1.0', _script: rel(fileURLToPath(import.meta.url)),
    run_date: todayStr, scorer: rel(SCORER), scorer_stdout: scorer?._stdout ?? 'not run (no scorable roles)',
    inputs: Object.fromEntries(Object.entries(inputs).map(([k, p]) => [k, { path: rel(p), sha256: sha256(p) }])),
    form_d_sample_quarters: formd.quarters,
    gate_g0: { program_end_date: { value: iso(g0.derived.programEnd), source: 'your-input' }, assumed_ead_start_date: { value: iso(g0.derived.ead), source: 'your-input' }, assumed_opt_end: { value: iso(g0.derived.optEnd), source: 'your-input', rule: 'EAD start + 12 months − 1 day' }, assumed_auth_end: { value: iso(g0.derived.authEnd), source: 'your-input', rule: persona.stem_extension_assumed ? 'OPT end + 24-month STEM extension (assumed eligible)' : 'no STEM extension assumed' }, scorer_profile_needs_sponsorship: scorer ? { value: scorer.profile_needs_sponsorship, source: 'record' } : null },
    family_keywords: Object.fromEntries(Object.entries(FAMILIES).map(([k, v]) => [k, v.source])),
    summary, roles_sent_to_scorer: roles, scored, holds, context, role_quality_context: blsContext,
    not_scored_note: 'Funding (CSV latest_funding_date, Form D samples) and BLS wages are context only: the scorer has no funding term and role_quality weight is 0.0.',
  };
  const logPath = path.join(outDir, 'de-mlops-h1b-log.json');
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
  const mdPath = path.join(outDir, 'de-mlops-h1b-report.md');
  fs.writeFileSync(mdPath, renderReport(log));

  console.log(`✓ ${summary.postings} postings → scored ${summary.scored} (Apply ${summary.apply} · Consider ${summary.consider} · Skip ${summary.skip}) · on hold ${summary.held} · not-apply rate ${(summary.not_apply_rate * 100).toFixed(0)}%`);
  console.log(`  ${rel(rolesPath)}  →  ${rel(SCORER)}`);
  console.log(`  ${rel(logPath)}  +  ${rel(mdPath)}`);
}

function renderReport(log) {
  const s = log.summary; const o = [];
  const byId = new Map(log.roles_sent_to_scorer.map((r) => [r.role_id, r]));
  o.push('# Data Engineering / MLOps H-1B triage — run report', '');
  o.push('## Executive summary', '');
  o.push(`**What this is:** a check of ${s.postings} data-engineering and MLOps job postings against the H-1B sponsorship records, saved posting-liveness results, and visa-timeline assumptions this student entered. Each posting either got a score from the engine's scorer, or was put on hold because the evidence was missing.`, '');
  o.push('**Why read it:** it tells you which applications are worth tailoring this week, which companies to network into instead, and which postings to drop — and, for every number, whether it came from a record, a rule this tool applied, or your own input.', '');
  o.push(`**What it found:** ${s.apply} to apply, ${s.consider} to consider, ${s.skip} to skip, and ${s.held} on hold for missing evidence. ${s.held ? 'A hold is not a "no": it means the data here cannot say, and a person has to find out.' : ''} ${s.not_apply_rate >= 0.5 ? 'More than half the postings were not recommended, which is what a healthy run looks like.' : 'Fewer than half the postings were turned away, so check the inputs before trusting this run.'}`, '');
  o.push('## Run record', '');
  o.push(`- Run date: ${log.run_date} · Recipe: \`${log._recipe}\` v${log._recipe_version} · Script: \`${log._script}\``);
  o.push(`- Scorer: \`${log.scorer}\` — \`${log.scorer_stdout.split('\n')[0]}\``);
  for (const [k, v] of Object.entries(log.inputs)) o.push(`- Input ${k}: \`${v.path}\` (sha256 \`${v.sha256.slice(0, 12)}…\`)`);
  const g = log.gate_g0;
  o.push(`- G0 profile [your-input]: program end ${g.program_end_date.value}; assumed EAD start ${g.assumed_ead_start_date.value}; assumed OPT end ${g.assumed_opt_end.value}; assumed authorization end ${g.assumed_auth_end.value} (${g.assumed_auth_end.rule}). Scorer reports profile needs sponsorship: ${g.scorer_profile_needs_sponsorship ? g.scorer_profile_needs_sponsorship.value + ' [record]' : 'n/a (scorer not run)'}.`, '');

  o.push('## Scored roles', '');
  if (!log.scored.length) o.push('_No posting cleared every evidence check, so the scorer was not run._', '');
  else {
    o.push('| Role | Rec | Composite | Sponsorship [record] | Fit [your-input] | Liveness [record] | Timeline [your-input] | Next action |', '|---|---|---|---|---|---|---|---|');
    for (const r of [...log.scored].sort((a, b) => b.composite - a.composite)) {
      const in_ = byId.get(r.role_id); const e = in_.sponsorship.evidence;
      o.push(`| ${r.company} — ${r.title} | **${r.recommendation}** | ${r.composite.toFixed(3)} | ${in_.sponsorship.tier} (p ${in_.sponsorship.p}; ${e.total_approvals} approvals, ${e.total_denials ?? '—'} denials; family titles: ${e.family_titles_sponsored.length ? e.family_titles_sponsored.join(', ') : 'none'}) | ${in_.fit.p} | ${in_.liveness.status} → ${in_.liveness.factor} | ${in_.timeline.factor} (start ${in_.timeline.start_date}; ${in_.timeline.start_date < in_.timeline.assumed_ead_start ? `closed: before assumed EAD start ${in_.timeline.assumed_ead_start}` : `seasons ${in_.timeline.registration_seasons.join(', ') || 'none'}`}) | ${NEXT[r.recommendation]} |`);
    }
    o.push('', `Scorer reason per row is in \`role-scores.md\` beside this report (the scorer's own audit trace).`, '');
  }

  o.push('## On hold — not scored, nothing filled in', '');
  if (!log.holds.length) o.push('_None._', '');
  else {
    o.push('| Role | Hold reason | Detail | Next action |', '|---|---|---|---|');
    for (const h of log.holds) o.push(`| ${h.company} — ${h.title} | \`${h.hold}\` | ${h.detail} | ${h.next_action} |`);
    o.push('');
  }

  o.push('## Context — shown, not scored', '');
  o.push('The scorer has no funding term, and its role-quality weight is 0.0. The values below are records, shown so a person can judge them. They changed no decision above. Recent funding is **not** evidence of sponsorship.', '');
  o.push('| Company | CSV row | Latest funding date [record] | In Form D sample? [record] |', '|---|---|---|---|');
  const seen = new Set();
  for (const c of log.context) {
    const key = c.csv_row ?? c.company; if (seen.has(key)) continue; seen.add(key);
    const fd = c.form_d_sample.value ? c.form_d_sample.value.map((h) => `${h.quarter} filed ${h.date_filed}`).join('; ') : 'not in the 50-per-quarter sample';
    o.push(`| ${c.company} | ${c.csv_row ?? '— (no unique row)'} | ${c.latest_funding_date?.value ?? '—'} | ${fd} |`);
  }
  o.push('', '| Family | SOC row (mapping is model-judgment) | OEWS year | Annual median wage [record] |', '|---|---|---|---|');
  for (const [fam, rows] of Object.entries(log.role_quality_context)) for (const r of rows)
    o.push(`| ${fam} | ${r.onet_soc_code} ${r.title ?? ''} | ${r.oews_year ?? '—'} | ${r.missing ?? (r.annual_median_wage || '— (blank in file)')} |`);
  o.push('');

  o.push('## Verified vs. inferred', '');
  o.push('- **record:** H-1B approval/denial counts and sponsored titles (80 Days CSV); posting liveness status (saved `ats:liveness` output); funding dates and Form D sample hits; BLS wage rows; the scorer\'s `profile_needs_sponsorship` flag.');
  o.push(`- **model-judgment:** the title→family keyword lists (\`${log.family_keywords['data-engineering']}\` · \`${log.family_keywords.mlops}\`); the sponsorship tier rule; the tier→p values; the family→SOC mapping.`);
  o.push('- **your-input:** program end and EAD start dates; STEM-extension eligibility; each posting\'s fit rating and start date; the one-registration-window-per-March assumption and the `min(1, seasons/3)` timeline rule.');
  o.push('- **cannot verify here:** whether a company will sponsor *this* role now; E-Verify enrollment; any company absent from the CSV; Form D filings outside the 50-company samples; which SOC code an employer will file under.', '');
  o.push('_The human decides. This report is a list, not an application._');
  return o.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
