#!/usr/bin/env node
// run.mjs: AI/ML cognitive-floor mode (contrib 2026fa, deepakkts).
//
// For each target AI/ML or data posting:
//   1. liveness gate   Greenhouse board API (record). Reuses the repo's
//                      hard-expired body patterns from scripts/ats/liveness-core.mjs.
//   2. timeline gate   month inputs from the scenario (your-input / model-judgment).
//   3. cognitive floor exact O*NET-SOC lookup in data/bls/compact/soc_occupation_compact.csv
//                      (record). No fallback to a sibling code, no blank read as zero.
//   4. sponsorship     exact or suffix-normalized name lookup in the 80 Days CSV
//                      (record, reported, never merged, never a vote).
//
//   node scripts/contrib/2026fa/deepakkts-aiml-cognitive-floor/run.mjs --out-dir <dir>
//        [--scenario <scenario.json>] [--offline <recorded-responses.json>] [--as-of YYYY-MM-DD]
//
// Writes <out-dir>/run-log.json (agent log) and <out-dir>/report.md (human report).
// Exit 0: run complete. Exit 1: run complete but a stop condition fired (listed on
// stderr). Exit 2: usage, scenario or data-schema error; nothing written.
//
// Node standard library plus two standard-library-only repo modules. No npm install needed.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classifyLiveness } from '../../../ats/liveness-core.mjs';
import { fetchJson } from '../../../ats/providers/_http.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '../../../..');
export const SOC_CSV = 'data/bls/compact/soc_occupation_compact.csv';
export const SPONSOR_CSV = 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv';
const DEFAULT_SCENARIO = path.join(HERE, 'scenario.json');
const ALLOWED_OUT_PREFIX = 'assignments/submissions/deepakkts';

export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input' };
const SOURCES = new Set(Object.values(SRC));

// The nine fields scripts/bls/extract-soc-occupation-table.py averages into
// cognitive_pivot_score (function cognitive_pivot_score, rounded with round(x, 3)).
export const PIVOT_FIELDS = [
  'ability_originality_lv', 'ability_problem_sensitivity_lv',
  'ability_deductive_reasoning_lv', 'ability_inductive_reasoning_lv',
  'skill_critical_thinking_lv', 'skill_judgment_decision_making_lv',
  'skill_complex_problem_solving_lv', 'skill_systems_analysis_lv', 'skill_systems_evaluation_lv',
];
const EXTRACTOR_ROUND_DECIMALS = 3; // mirrors round(..., 3) in the extractor; a method constant, not data
const SOC_COLUMNS = ['onet_soc_code', 'bls_soc_code', 'title', 'alternate_titles_sample', 'cognitive_pivot_score', ...PIVOT_FIELDS];
const SPONSOR_COLUMNS = ['company_name', 'Total Approvals', 'Total Denials', 'Approval_Rate'];
const LEGAL_SUFFIXES = new Set(['INC', 'INCORPORATED', 'LLC', 'CORP', 'CORPORATION', 'CO', 'LTD', 'LP', 'PBC']);
const ONET_CODE = /^\d{2}-\d{4}\.\d{2}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export class ModeError extends Error {}
const die = (msg) => { throw new ModeError(msg); };

// ── CSV (RFC 4180: quoted fields, embedded commas, quotes and newlines) ──────
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() || [];
  return { header, rows: rows.filter((r) => !(r.length === 1 && r[0] === '')).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? '']))) };
}

function loadCsv(rel, required) {
  const abs = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) die(`data file missing: ${rel}`);
  const buf = fs.readFileSync(abs);
  const { header, rows } = parseCsv(buf.toString('utf8'));
  const absent = required.filter((c) => !header.includes(c));
  if (absent.length) die(`${rel}: required column(s) absent: ${absent.join(', ')}`);
  if (!rows.length) die(`${rel}: no data rows`);
  return { rel, rows, sha256: crypto.createHash('sha256').update(buf).digest('hex'), row_count: rows.length };
}

// A blank cell is missing evidence. It is never zero. Number('') === 0 in JS,
// which is exactly the silent failure this function exists to block.
export function parseRating(s) {
  const t = String(s ?? '').trim();
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) die(`non-numeric rating value "${t}"`);
  return n;
}

// ── SOC table ───────────────────────────────────────────────────────────────
export function loadSocTable() {
  const t = loadCsv(SOC_CSV, SOC_COLUMNS);
  const byCode = new Map();
  for (const r of t.rows) {
    if (byCode.has(r.onet_soc_code)) die(`${SOC_CSV}: duplicate onet_soc_code ${r.onet_soc_code}`);
    byCode.set(r.onet_soc_code, r);
  }
  const rated = t.rows.map((r) => parseRating(r.cognitive_pivot_score)).filter((v) => v != null).sort((a, b) => a - b);
  return { ...t, byCode, rated };
}

// Nearest-rank percentile over occupations that carry a score.
export function floorCutoff(rated, percentile) {
  if (!(percentile > 0 && percentile <= 100)) die(`cognitive_floor.percentile must be in (0, 100], got ${percentile}`);
  const rank = Math.ceil((percentile / 100) * rated.length);
  return { cutoff: rated[rank - 1], rank, of: rated.length };
}

function altTitleHits(row, postingTitle) {
  const t = postingTitle.toLowerCase();
  return row.alternate_titles_sample.split(';').map((a) => a.replace(/\(.*?\)/g, '').trim()).filter((a) => a && t.includes(a.toLowerCase()));
}

export function evaluateSoc(code, soc, cutoff, postingTitle = '', parse = parseRating) {
  const out = { code, source: SRC.record, file: SOC_CSV };
  if (!ONET_CODE.test(code)) {
    return { ...out, status: 'unknown_code', stop: true,
      reason: `"${code}" is not an O*NET-SOC detailed code (NN-NNNN.NN). A bare BLS SOC would force a choice among sibling O*NET rows; the mode refuses to make it.`,
      siblings: [...soc.byCode.values()].filter((r) => r.bls_soc_code === code).map((r) => r.onet_soc_code) };
  }
  const row = soc.byCode.get(code);
  if (!row) return { ...out, status: 'unknown_code', stop: true, reason: `${code} is absent from ${SOC_CSV}`, siblings: [] };
  const components = Object.fromEntries(PIVOT_FIELDS.map((f) => [f, parse(row[f])]));
  const present = Object.values(components).filter((v) => v != null);
  const score = parse(row.cognitive_pivot_score);
  const base = { ...out, title: row.title, bls_soc_code: row.bls_soc_code, components, rated_components: `${present.length}/${PIVOT_FIELDS.length}`,
    alt_title_sample_hits: altTitleHits(row, postingTitle) };
  if (score == null || present.length === 0) {
    return { ...base, status: 'missing_ratings', score: null,
      reason: `${code} ${row.title}: cognitive_pivot_score is blank and ${base.rated_components} rating fields are filled. Missing evidence, not a zero.`,
      siblings_not_used: [...soc.byCode.values()].filter((r) => r.bls_soc_code === row.bls_soc_code && r.onet_soc_code !== code)
        .map((r) => ({ code: r.onet_soc_code, title: r.title, score: parse(r.cognitive_pivot_score) })) };
  }
  if (present.length < PIVOT_FIELDS.length) {
    return { ...base, status: 'partial_ratings', score,
      reason: `${code}: only ${base.rated_components} rating fields are filled; the stored score averages fewer inputs than a full row and is not comparable.` };
  }
  const mean = present.reduce((s, v) => s + v, 0) / present.length;
  const tol = 0.5 * 10 ** -EXTRACTOR_ROUND_DECIMALS + Number.EPSILON;
  if (Math.abs(mean - score) > tol) {
    return { ...base, status: 'score_inconsistent', stop: true, score, recomputed_mean: mean,
      reason: `${code}: stored score ${score} does not equal the mean of its ${PIVOT_FIELDS.length} fields (${mean}).` };
  }
  return { ...base, status: score >= cutoff ? 'clears_floor' : 'below_floor', score, recomputed_mean: Number(mean.toFixed(6)), cutoff };
}

// ── Sponsorship (80 Days) ───────────────────────────────────────────────────
export function normName(s) {
  const toks = String(s).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  while (toks.length > 1 && LEGAL_SUFFIXES.has(toks[toks.length - 1])) toks.pop();
  return toks.join(' ');
}

export function loadSponsorTable() {
  const t = loadCsv(SPONSOR_CSV, SPONSOR_COLUMNS);
  const byNorm = new Map();
  for (const r of t.rows) {
    const k = normName(r.company_name);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(r);
  }
  return { ...t, byNorm };
}

export function lookupSponsor(name, sp) {
  const base = { query: name, source: SRC.record, file: SPONSOR_CSV };
  const rows = sp.byNorm.get(normName(name)) || [];
  if (!rows.length) return { ...base, status: 'not_in_dataset', approvals: null,
    reason: 'no row under this name or its suffix-normalized form. Absence is not evidence of non-sponsorship.' };
  const view = rows.map((r) => ({ company_name: r.company_name, total_approvals: parseRating(r['Total Approvals']),
    total_denials: parseRating(r['Total Denials']), approval_rate: parseRating(r.Approval_Rate) }));
  const exact = rows.some((r) => r.company_name.trim().toUpperCase() === String(name).trim().toUpperCase());
  const key = (v) => JSON.stringify([v.total_approvals, v.total_denials, v.approval_rate]);
  const distinct = new Set(view.map(key));
  if (distinct.size > 1) return { ...base, status: 'ambiguous', approvals: null, rows: view,
    reason: `${rows.length} rows normalize to "${normName(name)}" with different sponsorship values; the mode will not pick one.` };
  const v = view[0];
  const match = exact ? 'exact' : 'suffix-normalized';
  if (v.total_approvals == null) return { ...base, status: 'row_present_no_trace', match, approvals: null, rows: view,
    reason: 'company row exists but the sponsorship fields are blank. That is missing evidence, not a recorded zero.' };
  return { ...base, status: v.total_approvals === 0 ? 'recorded_zero' : 'recorded', match, approvals: v.total_approvals,
    denials: v.total_denials, approval_rate: v.approval_rate, rows: view,
    reason: rows.length > 1 ? `${rows.length} rows share identical values (duplicate company rows); reported once, not summed.` : null };
}

// ── Liveness (Greenhouse board API) ─────────────────────────────────────────
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function htmlToText(s) {
  const decode = (x) => x.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e.toLowerCase()] ?? m));
  return decode(decode(String(s || '')).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function makeFetcher(offlinePath) {
  if (!offlinePath) return (url) => fetchJson(url, { redirect: 'error' });
  if (!fs.existsSync(offlinePath)) die(`--offline file missing: ${offlinePath}`);
  const rec = JSON.parse(fs.readFileSync(offlinePath, 'utf8')).responses || die(`${offlinePath}: no "responses" object`);
  return async (url) => {
    const r = rec[url];
    if (!r) die(`--offline: no recorded response for ${url} (offline mode never touches the network)`);
    if (r.network_error) throw new Error(r.network_error);
    if (r.status !== 200) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
    return r.body;
  };
}

export async function checkLiveness(role, fetcher, boardCache, asOf) {
  const jobUrl = `https://boards-api.greenhouse.io/v1/boards/${role.board}/jobs/${role.job_id}`;
  const boardUrl = `https://boards-api.greenhouse.io/v1/boards/${role.board}/jobs`;
  const base = { source: SRC.record, checked_url: jobUrl, checked_at: new Date().toISOString() };
  let job;
  try { job = await fetcher(jobUrl); }
  catch (e) {
    if (e instanceof ModeError) throw e;
    if (e.status === 404 || e.status === 410) {
      const c = classifyLiveness({ status: e.status });
      return { ...base, gate: 'closed', http_status: e.status, code: c.code, reason: `${c.reason} from the board API: the posting is gone` };
    }
    return { ...base, gate: 'check_failed', stop: true, http_status: e.status ?? null, code: 'check_failed',
      reason: `liveness check failed: ${String(e.message).split('\n')[0]}. Recorded as a failed check, no liveness value assigned.` };
  }
  if (String(job.id) !== String(role.job_id)) return { ...base, gate: 'check_failed', stop: true, http_status: 200, code: 'id_mismatch',
    reason: `API returned job id ${job.id}, expected ${role.job_id}` };
  const posting = { title: job.title?.trim() ?? null, absolute_url: job.absolute_url ?? null, location: job.location?.name ?? null,
    first_published: job.first_published ?? null, updated_at: job.updated_at ?? null, application_deadline: job.application_deadline ?? null };
  const body = classifyLiveness({ status: 200, finalUrl: posting.absolute_url || '', bodyText: htmlToText(job.content), applyControls: [] });
  if (body.code === 'expired_body' || body.code === 'expired_url')
    return { ...base, gate: 'closed', http_status: 200, code: body.code, posting, reason: `HTTP 200 but ${body.reason}` };
  if (posting.application_deadline && posting.application_deadline.slice(0, 10) < asOf)
    return { ...base, gate: 'closed', http_status: 200, code: 'deadline_passed', posting, reason: `application_deadline ${posting.application_deadline} is before ${asOf}` };
  if (!boardCache.has(role.board)) {
    try { boardCache.set(role.board, { ids: new Set((await fetcher(boardUrl)).jobs.map((j) => String(j.id))) }); }
    catch (e) { if (e instanceof ModeError) throw e; boardCache.set(role.board, { error: String(e.message).split('\n')[0] }); }
  }
  const board = boardCache.get(role.board);
  if (board.error) return { ...base, gate: 'check_failed', stop: true, http_status: 200, code: 'board_list_failed', posting,
    reason: `job endpoint answered but the board listing failed: ${board.error}` };
  if (!board.ids.has(String(role.job_id))) return { ...base, gate: 'uncertain', http_status: 200, code: 'not_in_board_listing', posting,
    reason: 'job endpoint answers 200 but the board listing does not include it' };
  return { ...base, gate: 'open', http_status: 200, code: 'api_listed', posting,
    reason: 'job endpoint 200, listed on the board, no expired-body pattern, no passed deadline' };
}

// ── Timeline gate ───────────────────────────────────────────────────────────
export function timelineGate(tl) {
  const v = (k) => tl?.[k]?.value ?? null;
  const keys = ['program_completion_month', 'target_start_month', 'ead_expected_month', 'latest_opt_start_month'];
  const missing = keys.filter((k) => v(k) == null);
  if (missing.length) return { gate: 'needs_input', missing, reason: `timeline input(s) not supplied: ${missing.join(', ')}. The gate cannot clear itself.` };
  for (const k of keys) if (!MONTH.test(v(k))) die(`timeline.${k} must be YYYY-MM, got "${v(k)}"`);
  const [done, start, ead, latest] = keys.map(v);
  const checks = [
    { test: 'target start is after program completion', ok: start > done },
    { test: 'EAD expected on or before target start', ok: ead <= start },
    { test: 'target start on or before latest OPT start', ok: start <= latest },
  ];
  const failed = checks.filter((c) => !c.ok);
  return { gate: failed.length ? 'closed' : 'open', checks, inputs: Object.fromEntries(keys.map((k) => [k, tl[k]])),
    reason: failed.length ? `failed: ${failed.map((c) => c.test).join('; ')}` : 'all three month checks hold' };
}

// ── Disposition ─────────────────────────────────────────────────────────────
export function dispose(live, tl, socs) {
  if (live.gate === 'check_failed') return ['STOP_LIVENESS_CHECK_FAILED', live.reason];
  if (live.gate === 'closed') return ['SKIP_GATED_LIVENESS', live.reason];
  if (live.gate === 'uncertain') return ['HOLD_LIVENESS_UNCERTAIN', live.reason];
  if (tl.gate === 'needs_input') return ['HOLD_TIMELINE_INPUT', tl.reason];
  if (tl.gate === 'closed') return ['SKIP_GATED_TIMELINE', tl.reason];
  const bad = socs.find((s) => s.stop);
  if (bad) return ['STOP_SOC_INPUT', bad.reason];
  const holes = socs.filter((s) => s.status === 'missing_ratings' || s.status === 'partial_ratings');
  if (holes.length) return ['HOLD_MISSING_EVIDENCE', holes.map((s) => s.reason).join(' ')];
  const st = new Set(socs.map((s) => s.status));
  if (st.size === 1 && st.has('clears_floor')) return ['CLEARS_FLOOR', `every candidate SOC scores at or above the cutoff`];
  if (st.size === 1 && st.has('below_floor')) return ['BELOW_FLOOR', `every candidate SOC scores below the cutoff`];
  return ['SOC_SENSITIVE', `the floor result depends on which SOC the employer files under: ${socs.map((s) => `${s.code} ${s.score} ${s.status}`).join(', ')}`];
}

// ── Scenario validation ─────────────────────────────────────────────────────
function labelled(obj, where, { allowNull = false } = {}) {
  if (!obj || typeof obj !== 'object' || !('value' in obj)) die(`${where}: expected {"value": ..., "source": ...}`);
  if (!SOURCES.has(obj.source)) die(`${where}.source must be one of ${[...SOURCES].join(' | ')}, got "${obj.source}"`);
  if (obj.value == null && !allowNull) die(`${where}.value is empty`);
  return obj;
}

export function validateScenario(sc) {
  if (!sc || !Array.isArray(sc.roles) || !sc.roles.length) die('scenario: "roles" must be a non-empty array');
  labelled(sc.cognitive_floor?.percentile, 'cognitive_floor.percentile');
  labelled(sc.profile?.needs_sponsorship, 'profile.needs_sponsorship');
  for (const k of ['program_completion_month', 'target_start_month', 'ead_expected_month', 'latest_opt_start_month'])
    labelled(sc.timeline?.[k], `timeline.${k}`, { allowNull: true });
  const ids = new Set();
  sc.roles.forEach((r, i) => {
    for (const k of ['role_id', 'company', 'board', 'job_id']) if (!r[k]) die(`roles[${i}].${k} missing`);
    if (ids.has(r.role_id)) die(`duplicate role_id ${r.role_id}`); ids.add(r.role_id);
    const sel = labelled(r.soc_candidates, `roles[${i}].soc_candidates`);
    if (!Array.isArray(sel.value) || !sel.value.length) die(`roles[${i}].soc_candidates.value must be a non-empty array`);
    if (r.sponsor_record_name) labelled(r.sponsor_record_name, `roles[${i}].sponsor_record_name`);
  });
}

// ── Report ──────────────────────────────────────────────────────────────────
const cell = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
function sponsorCell(s) {
  if (s.status === 'recorded' || s.status === 'recorded_zero')
    return `${s.rows[0].company_name}${s.rows.length > 1 ? ` (+${s.rows.length - 1} identical row)` : ''}: ${s.approvals} approvals, ${s.denials} denials [${s.match}]`;
  if (s.status === 'ambiguous') return `ambiguous: ${s.rows.map((r) => r.company_name).join(', ')}`;
  return s.status.replace(/_/g, ' ');
}

export function renderReport(log) {
  const L = [];
  const n = log.roles.length;
  const count = (p) => log.roles.filter((r) => r.disposition.startsWith(p)).length;
  L.push(`# AI/ML cognitive-floor run: ${log.scenario.scenario_id}`, '');
  L.push('## Executive summary', '');
  L.push(`This report checks ${n} AI/ML and data job postings against two hard gates (is the posting still open, and does the work-start timeline hold) and then asks whether the occupation behind each role clears a reasoning-and-judgment floor drawn from federal occupational data. ` +
    `Read it to see which postings are worth effort and which conclusions the data cannot support. ` +
    `Result by count: clears the floor ${count('CLEARS_FLOOR')}; below the floor ${count('BELOW_FLOOR')}; depends on how the employer classifies the job ${count('SOC_SENSITIVE')}; ` +
    `on hold for missing evidence ${count('HOLD')}; skipped at a gate ${count('SKIP')}; stopped ${count('STOP')}.`, '');
  L.push('## Run record', '');
  L.push(`- Run at: ${log.run.started_at} (as-of date ${log.run.as_of}) · mode: ${log.run.mode}`);
  L.push(`- Command: \`${log.run.command}\``);
  for (const f of log.sources) L.push(`- Source: \`${f.file}\` · ${f.row_count} rows · sha256 \`${f.sha256}\``);
  L.push(`- Floor: percentile ${log.floor.percentile.value} [${log.floor.percentile.source}] → cutoff ${log.floor.cutoff} (rank ${log.floor.rank} of ${log.floor.of} scored occupations) [record-derived]`);
  L.push(`- Timeline gate: **${log.timeline.gate}** · ${log.timeline.reason}`);
  if (log.timeline.inputs) for (const [k, v] of Object.entries(log.timeline.inputs)) L.push(`  - ${k}: ${v.value} [${v.source}]`);
  L.push(`- Needs sponsorship: ${log.scenario.profile.needs_sponsorship.value} [${log.scenario.profile.needs_sponsorship.source}]. Sponsorship history is reported as a record and is not a vote or a gate here.`, '');
  L.push('## Per-role results', '');
  L.push('| Role | Liveness gate [record] | SOC candidates [model-judgment] → score [record] | Sponsorship history [record] | Disposition |');
  L.push('|---|---|---|---|---|');
  for (const r of log.roles) {
    const live = `${r.liveness.gate} (${r.liveness.code}${r.liveness.http_status ? `, HTTP ${r.liveness.http_status}` : ''})`;
    const socs = r.soc.map((s) => `${s.code} ${s.title ?? ''}: ${s.score ?? 'no score'} → ${s.status}${s.alt_title_sample_hits?.length ? ` (O*NET sample title hit: ${s.alt_title_sample_hits.join(', ')})` : ''}`).join('<br>');
    L.push(`| ${cell(r.company)}: ${cell(r.liveness.posting?.title ?? r.title_hint ?? r.role_id)} (job ${r.job_id}) | ${cell(live)} | ${cell(socs)} | ${cell(sponsorCell(r.sponsorship))} | **${r.disposition}** |`);
  }
  L.push('', '## Why each disposition', '');
  for (const r of log.roles) L.push(`- **${r.role_id}** · ${r.disposition}: ${r.disposition_reason}`);
  L.push('', '## Stop conditions that fired', '');
  if (log.stops.length) for (const s of log.stops) L.push(`- ${s}`); else L.push('- none');
  L.push('', '## Labels', '', '- record: read from a file in this checkout or from the employer\'s board API during this run.',
    '- model-judgment: chosen by the assistant that configured the scenario; not a record; needs a human decision.',
    '- your-input: supplied by the person running the mode.', '');
  return L.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────────
function arg(argv, flag) { const i = argv.indexOf(flag); if (i < 0) return null; const v = argv[i + 1]; if (!v || v.startsWith('--')) die(`${flag} needs a value`); return v; }

function resolveOutDir(raw) {
  if (!raw) die('--out-dir is required (the mode never writes to a default location)');
  const abs = path.resolve(process.cwd(), raw);
  const rel = path.relative(REPO_ROOT, abs);
  const inside = rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  if (inside && !(rel === ALLOWED_OUT_PREFIX || rel.startsWith(ALLOWED_OUT_PREFIX + path.sep)))
    die(`--out-dir inside the repo must be under ${ALLOWED_OUT_PREFIX}/ (got ${rel || '.'}); outside the repo any path is allowed`);
  return abs;
}

export async function run(argv) {
  const outDir = resolveOutDir(arg(argv, '--out-dir'));
  const scenarioPath = path.resolve(process.cwd(), arg(argv, '--scenario') ?? DEFAULT_SCENARIO);
  const offline = arg(argv, '--offline');
  const asOf = arg(argv, '--as-of') ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) die(`--as-of must be YYYY-MM-DD, got ${asOf}`);
  if (!fs.existsSync(scenarioPath)) die(`scenario file missing: ${scenarioPath}`);
  let scenario;
  try { scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8')); } catch (e) { die(`scenario is not valid JSON: ${e.message}`); }
  validateScenario(scenario);

  const soc = loadSocTable();
  const sp = loadSponsorTable();
  const floor = { percentile: scenario.cognitive_floor.percentile, ...floorCutoff(soc.rated, scenario.cognitive_floor.percentile.value) };
  const tl = timelineGate(scenario.timeline);
  const fetcher = makeFetcher(offline ? path.resolve(process.cwd(), offline) : null);
  const boardCache = new Map();
  const roles = []; const stops = [];
  for (const r of scenario.roles) {
    const liveness = await checkLiveness(r, fetcher, boardCache, asOf);
    const title = liveness.posting?.title ?? r.title_hint ?? '';
    const socs = r.soc_candidates.value.map((c) => evaluateSoc(c, soc, floor.cutoff, title));
    const sponsorship = { ...lookupSponsor(r.sponsor_record_name?.value ?? r.company, sp),
      ...(r.sponsor_record_name ? { lookup_name_source: r.sponsor_record_name.source } : {}) };
    const [disposition, why] = dispose(liveness, tl, socs);
    if (liveness.stop) stops.push(`${r.role_id}: ${liveness.reason}`);
    for (const s of socs) if (s.stop) stops.push(`${r.role_id}: ${s.reason}`);
    roles.push({ role_id: r.role_id, company: r.company, board: r.board, job_id: String(r.job_id), title_hint: r.title_hint ?? null,
      soc_candidates: r.soc_candidates, liveness, soc: socs, sponsorship, disposition, disposition_reason: why });
  }
  const log = {
    _mode: 'case-aiml-cognitive-floor', _version: '0.1.0',
    run: { started_at: new Date().toISOString(), as_of: asOf, mode: offline ? `offline (${path.relative(REPO_ROOT, path.resolve(offline))})` : 'live',
      command: `node ${path.relative(REPO_ROOT, fileURLToPath(import.meta.url))} ${argv.join(' ')}`, scenario_file: path.relative(REPO_ROOT, scenarioPath) },
    sources: [soc, sp].map(({ rel, sha256, row_count }) => ({ file: rel, sha256, row_count })),
    scenario: { scenario_id: scenario.scenario_id, profile: scenario.profile, note: scenario.note ?? null },
    floor: { ...floor, scored_occupations: soc.rated.length, unscored_occupations: soc.row_count - soc.rated.length },
    timeline: tl, roles, stops,
    counts: Object.fromEntries([...new Set(roles.map((r) => r.disposition))].map((d) => [d, roles.filter((r) => r.disposition === d).length])),
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(log));
  return { log, outDir };
}

async function main() {
  try {
    const { log, outDir } = await run(process.argv.slice(2));
    console.log(`cognitive-floor: ${log.roles.length} roles · floor P${log.floor.percentile.value} cutoff ${log.floor.cutoff} · timeline gate ${log.timeline.gate}`);
    for (const r of log.roles) console.log(`  ${r.disposition.padEnd(28)} ${r.role_id}`);
    console.log(`  counts: ${Object.entries(log.counts).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    console.log(`  wrote ${path.relative(process.cwd(), path.join(outDir, 'run-log.json')) || outDir} + report.md`);
    if (log.stops.length) {
      console.error(`\n✗ ${log.stops.length} stop condition(s) fired:`);
      for (const s of log.stops) console.error(`  • ${s}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`✗ cognitive-floor: ${e instanceof ModeError ? e.message : e.stack}`);
    console.error('  nothing written.');
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
