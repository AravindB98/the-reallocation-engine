#!/usr/bin/env node
// soc-resolver.mjs — early-career project-management & supply-chain SOC resolver,
// for an MS Engineering Management graduate on 12-month F-1 OPT targeting
// PM / supply-chain roles that require 0–2 years of experience.
//
// A posting titled "Supply Chain Project Manager" or "Inventory Planner" does not
// say which SOC code it would be filed under, and the code moves the BLS wage
// floor, the role-quality score and which H-1B history is relevant. This script
// lists the candidate SOCs a transparent keyword table assigns, pulls the record
// for each (national OEWS percentiles, the metro band from the EXISTING
// scripts/bls/local-wage-adjustment.py, the EXISTING scorer's verdict, employer
// H-1B rows from the 80 Days file), and REFUSES to emit one score when the
// candidates disagree by more than the declared thresholds.
//
// Gates, in order: liveness (from saved `npm run ats:liveness` output) · role
// scope · target metro · experience (≤ N required years, parsed by rule) ·
// candidate SOCs · per-SOC evidence · degree check · spread check · visa
// timeline (EAD dates + DSO STEM answer, both human-entered).
//
// No model calls. The only network-free child processes are the repo's own
// scorer and local-wage script. Every value carries a label:
// record | your-input | model-judgment. A derived value takes the WEAKEST label
// of its inputs.
//
//   node scripts/contrib/2026fa/contactshyam14-code-em-pm-supply-chain-soc-resolver/soc-resolver.mjs \
//     --posting p.json [--posting q.json …] [--liveness-log ats-liveness.txt …] \
//     [--persona persona.json] [--rules rules.json] [--out-dir dir] [--as-of YYYY-MM-DD] \
//     [--local-wage script|skip] [--python exe] [--soc-file f] [--national-file f] \
//     [--metro-file f] [--rpp-file f] [--crosswalk-file f] [--h1b-file f]
//
// Exit codes: 0 ok (STOP verdicts are results, not errors) · 2 usage / out-dir
// refused · 3 input gate failed · 4 scorer or local-wage script failed.
// On exit 2 or 3 nothing is written.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION = '0.1.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const SCORER = path.join(REPO, 'scripts/score/role-scorer.mjs');
const LOCAL_WAGE = path.join(REPO, 'scripts/bls/local-wage-adjustment.py');

const DEFAULTS = {
  persona: path.join(HERE, 'inputs/persona.em-pm-supply-chain.json'),
  rules: path.join(HERE, 'rules/resolver-rules.json'),
  outDir: path.join(REPO, 'course/2026fa/submissions/contactshyam14-code/runs/latest'),
  soc: path.join(REPO, 'data/bls/compact/soc_occupation_compact.csv'),
  national: path.join(HERE, 'data/national_oews_candidates.csv'),
  metro: path.join(HERE, 'data/metro_oews.csv'),
  rpp: path.join(HERE, 'data/bea_rpp.csv'),
  crosswalk: path.join(HERE, 'data/bls_bea_msa_crosswalk.csv'),
  h1b: path.join(REPO, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv'),
};

// Real path of p even when its tail doesn't exist yet (resolves symlinks / 8.3 names).
function realish(p) {
  let cur = path.resolve(p); const rest = [];
  while (!fs.existsSync(cur)) { const up = path.dirname(cur); if (up === cur) break; rest.unshift(path.basename(cur)); cur = up; }
  return path.join(fs.realpathSync.native(cur), ...rest);
}
const caseKey = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
const inside = (p, root) => { const a = caseKey(realish(p)), r = caseKey(realish(root)); return a === r || a.startsWith(r + path.sep); };

// Outputs may only land in my own namespaces, or — outside the repository — the
// OS temp dir (tests). Tracked data/ paths are never writable.
const OUT_ROOTS = [
  path.join(REPO, 'course/2026fa/submissions/contactshyam14-code'),
  HERE,
];
export const outAllowed = (p) => {
  if (inside(p, REPO)) return !inside(p, path.join(REPO, 'data')) && OUT_ROOTS.some((r) => inside(p, r)) && !inside(p, path.join(HERE, 'data'));
  return inside(p, os.tmpdir());
};

const LABEL = { record: 'record', input: 'your-input', model: 'model-judgment' };
const STRENGTH = { record: 3, 'your-input': 2, 'model-judgment': 1 };
const weakest = (...labels) => labels.filter(Boolean).reduce((w, l) => (STRENGTH[l] < STRENGTH[w] ? l : w));
const v = (value, label, source) => ({ value, label, source });

export class Stop extends Error {
  constructor(gate, message, code = 3) { super(message); this.gate = gate; this.code = code; }
}

// ── small parsers ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { posting: [], livenessLog: [] };
  const map = { '--posting': 'posting', '--liveness-log': 'livenessLog', '--persona': 'persona', '--rules': 'rules',
    '--out-dir': 'outDir', '--as-of': 'asOf', '--local-wage': 'localWage', '--python': 'python', '--soc-file': 'soc',
    '--national-file': 'national', '--metro-file': 'metro', '--rpp-file': 'rpp', '--crosswalk-file': 'crosswalk', '--h1b-file': 'h1b' };
  for (let i = 0; i < argv.length; i++) {
    const key = map[argv[i]];
    if (!key) throw new Stop('usage', `unknown argument: ${argv[i]}`, 2);
    if (argv[i + 1] == null || argv[i + 1].startsWith('--')) throw new Stop('usage', `${argv[i]} needs a value`, 2);
    const val = argv[++i];
    if (Array.isArray(out[key])) out[key].push(val); else out[key] = val;
  }
  if (!out.posting.length) throw new Stop('usage', 'give at least one --posting file', 2);
  if (out.localWage && !['script', 'skip'].includes(out.localWage)) throw new Stop('usage', '--local-wage must be script or skip', 2);
  return out;
}

// RFC-4180-style CSV: quoted fields, doubled quotes, newlines inside quotes.
export function parseCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); rows.push(row); row = []; f = '';
    } else f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}
function readCsvObjects(file, what, needCols = []) {
  if (!fs.existsSync(file)) throw new Stop('G0', `${what} not found: ${rel(file)}`);
  const rows = parseCsv(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  const head = rows[0] || [];
  for (const c of needCols) if (!head.includes(c)) throw new Stop('G0', `${what} lacks column "${c}": ${rel(file)}`);
  return { header: head, rows: rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))) };
}

// Exact-match key for company names. No fuzzy or substring matching, by design:
// "zipline" is a substring of two unrelated companies in the 80 Days file.
const SUFFIXES = new Set(['inc', 'incorporated', 'llc', 'ltd', 'limited', 'corp', 'corporation', 'co', 'company', 'lp', 'plc']);
export function normalizeName(name) {
  const toks = String(name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  while (toks.length > 1 && SUFFIXES.has(toks[toks.length - 1])) toks.pop();
  return toks.join('');
}

// Typographic quotes/dashes → ASCII so rules written with ' and - match.
export const normText = (s) => String(s || '').replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
  .replace(/[‐-―−]/g, '-').replace(/ /g, ' ');
const phrase = (s) => ` ${normText(s).toLowerCase().replace(/[^a-z0-9'+/]+/g, ' ').trim()} `;
const has = (hay, kw) => hay.includes(phrase(kw));

const readDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');
const money = (n) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`);
function readJson(file, what) {
  if (!fs.existsSync(file)) throw new Stop('G0', `${what} not found: ${rel(file)}`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Stop('G0', `${what} is not valid JSON (${rel(file)}): ${e.message}`); }
}

// OEWS tokens: * = wage not available, ** = employment not available,
// # = wage ≥ $239,200/yr (top-coded). Definitions quoted from the field-
// description rows of data/bls/oesm24nat/national_M2024_dl.xlsx.
export const OEWS_TOKENS = { '*': 'not-available (*)', '**': 'employment-not-available (**)', '#': 'top-coded (#: ≥ $239,200/yr)' };
export function wageCell(raw) {
  const t = String(raw ?? '').trim().replace(/,/g, '');
  if (t in OEWS_TOKENS) return { value: null, token: t, missing: OEWS_TOKENS[t] };
  if (t === '') return { value: null, token: '', missing: 'blank' };
  const n = Number(t);
  return Number.isFinite(n) ? { value: n, token: null, missing: null } : { value: null, token: t, missing: `unparseable (${t})` };
}

// ── gate 1: liveness (saved `npm run ats:liveness` stdout) ─────────────────

export function parseLivenessLog(text) {
  const out = []; const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\S+\s+(active|expired|uncertain)\s+(https?:\/\/\S+)\s*$/);
    if (!m) continue;
    const next = lines[i + 1] || '';
    const reason = m[1] !== 'active' && /^\s{6,}\S/.test(next) ? next.trim() : null;
    out.push({ result: m[1], url: m[2], reason });
  }
  return out;
}

function livenessFor(posting, observations) {
  if (!posting.url) return { gate: 'STOP', result: 'missing', reason: 'no URL (sample posting) — a missing URL is a hard stop for live status', label: LABEL.input };
  const hits = observations.filter((o) => o.url === posting.url);
  if (!hits.length) return { gate: 'STOP', result: 'unknown', reason: 'no saved `npm run ats:liveness` result for this exact URL', label: LABEL.input };
  const o = hits[hits.length - 1];
  return {
    gate: o.result === 'active' ? 'PASS' : 'STOP', result: o.result, reason: o.reason,
    checked_at: o.checked_at ?? null, log: o.log, label: LABEL.record,
  };
}

// ── gate 2: role scope ──────────────────────────────────────────────────────

export function scopeCheck(title, rules) {
  const t = phrase(title);
  const inc = rules.scope.title_include.filter((k) => has(t, k));
  const exc = rules.scope.title_exclude.filter((k) => has(t, k));
  if (exc.length) return { verdict: 'OUT-OF-SCOPE', matched_include: inc, matched_exclude: exc, why: `title matches excluded term(s) ${exc.map((k) => `"${k}"`).join(', ')}` };
  if (!inc.length) return { verdict: 'OUT-OF-SCOPE', matched_include: [], matched_exclude: [], why: 'title matches no project-management or supply-chain keyword' };
  return { verdict: 'IN-SCOPE', matched_include: inc, matched_exclude: [], why: `title matches ${inc.map((k) => `"${k}"`).join(', ')}` };
}

// ── text structure: headings → sections ─────────────────────────────────────

function sectionsOf(text, rules) {
  const ex = rules.experience;
  const lines = normText(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let section = 'other';
  return lines.map((line) => {
    const bare = line.replace(/[:\s]+$/, '');
    const words = bare.split(/\s+/).length;
    const looksHeading = words <= 8 && !/[.!?]$/.test(line) && !/^[-*•\d]/.test(line);
    if (looksHeading) {
      const low = ` ${bare.toLowerCase()} `;
      const isPref = ex.preferred_section_headings.some((h) => low.includes(` ${h} `) || low.trim().startsWith(h));
      const isReq = ex.required_section_headings.some((h) => low.includes(` ${h} `) || low.trim().startsWith(h));
      section = isPref ? 'preferred' : isReq ? 'required' : 'other';
      return { line, section, heading: true };
    }
    return { line, section, heading: false };
  });
}

const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const NUM = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)';
const YEARS_RE = new RegExp(`(?:\\b(at least|a minimum of|minimum of|minimum|min\\.|no less than)\\s+)?\\b${NUM}(?:\\s*(?:-|to)\\s*${NUM})?\\s*(\\+|or more)?\\s*(?:years?|yrs?)\\b`, 'gi');
const UNITLESS_RE = new RegExp(`\\b${NUM}\\s*(\\+)?\\s*(preferred|desired|required)\\b`, 'gi');
const toNum = (s) => (s == null ? null : /^\d+$/.test(s) ? Number(s) : WORDNUM[s.toLowerCase()] ?? null);
const anyWord = (s, words) => { const p = phrase(s); return words.filter((w) => has(p, w)); };

// ── gate 4: experience (≤ max REQUIRED years) ───────────────────────────────

export function parseExperience(text, rules, maxYears) {
  const ex = rules.experience;
  const hits = []; const ignored = [];
  for (const { line, section, heading } of sectionsOf(text, rules)) {
    if (heading) continue;
    for (const sentence of line.split(/(?<=[.;!?])\s+/)) {
      const clauses = sentence.split(/,\s+/);
      let sentenceHasYears = false;
      const pending = [];
      for (const clause of clauses) {
        YEARS_RE.lastIndex = 0; let m;
        let found = false;
        while ((m = YEARS_RE.exec(clause))) {
          found = true; sentenceHasYears = true;
          const min = toNum(m[2]); const max = toNum(m[3]);
          const ctx = anyWord(clause, ex.experience_context_words);
          if (!ctx.length && section === 'other') { ignored.push({ phrase: m[0].trim(), clause: clause.trim(), why: 'no experience context word and not under a requirements heading' }); continue; }
          hits.push(classify({ phrase: m[0].trim(), clause: clause.trim(), sentence: sentence.trim(), min, max: max ?? null, plus: !!m[4] || !!m[1], section }, ex));
        }
        if (!found) pending.push(clause);
      }
      if (!sentenceHasYears) continue;
      for (const clause of pending) {
        UNITLESS_RE.lastIndex = 0; let m;
        while ((m = UNITLESS_RE.exec(clause)))
          hits.push(classify({ phrase: m[0].trim(), clause: clause.trim(), sentence: sentence.trim(), min: toNum(m[1]), max: null, plus: !!m[2], section, unitless: true }, ex));
      }
    }
  }
  const required = hits.filter((h) => h.kind === 'required');
  const preferred = hits.filter((h) => h.kind === 'preferred');
  const max = Number.isInteger(maxYears) ? maxYears : ex.max_required_years_default;
  if (!required.length) {
    return { verdict: 'EXPERIENCE-UNSTATED', min_required_years: null, max_allowed_years: max, evidence: null, required, preferred, ignored,
      why: preferred.length ? `only preferred years found (${preferred.map((h) => `"${h.phrase}"`).join(', ')}); preferred years are never treated as required — unknown, not entry-level` : 'no years-of-experience statement found — unknown, not entry-level' };
  }
  const best = required.reduce((a, b) => (b.min < a.min ? b : a));
  const verdict = best.min <= max ? 'EXPERIENCE-FIT' : 'EXPERIENCE-OVER-TARGET';
  return {
    verdict, min_required_years: best.min, max_allowed_years: max, evidence: best.sentence, matched_phrase: best.phrase, required, preferred, ignored,
    why: `minimum required ${best.min} year(s) ${verdict === 'EXPERIENCE-FIT' ? '≤' : '>'} ${max} (matched "${best.phrase}" in "${best.clause}"${best.kind_basis === 'unlabelled' ? '; no required/preferred wording, so treated as required' : ''})${preferred.length ? `; preferred noted: ${preferred.map((h) => `"${h.phrase}"`).join(', ')}` : ''}`,
  };
}
function classify(h, ex) {
  const pref = anyWord(h.clause, ex.preferred_words);
  const req = anyWord(h.clause, ex.required_words);
  if (pref.length) return { ...h, kind: 'preferred', kind_basis: `clause word "${pref[0]}"` };
  if (req.length) return { ...h, kind: 'required', kind_basis: `clause word "${req[0]}"` };
  if (h.section === 'preferred') return { ...h, kind: 'preferred', kind_basis: 'under a preferred/desirable heading' };
  if (h.section === 'required') return { ...h, kind: 'required', kind_basis: 'under a requirements heading' };
  return { ...h, kind: 'required', kind_basis: 'unlabelled' };
}

// ── gate 6: degree requirement ──────────────────────────────────────────────

const DEGREE_RE = /\b(bachelor'?s?|ba\/bs|bs\/ba|b\.s\.|b\.a\.)|\b(undergraduate|4-year|four-year|college|university|advanced|master'?s?|associate'?s?|graduate)\s+degree\b|\bdegree\s+(?:in|required)\b/i;
const HS_RE = /\bhigh school( diploma)?\b|\bged\b/i;

export function checkDegree(text, rules) {
  const d = rules.degree;
  const mentions = [];
  for (const { line, section, heading } of sectionsOf(text, rules)) {
    if (heading) continue;
    for (const sentence of line.split(/(?<=[.;!?])\s+(?=[A-Z])/)) {
      const deg = sentence.match(DEGREE_RE); const hs = sentence.match(HS_RE);
      if (!deg && !hs) continue;
      const level = hs && !deg ? 'high-school' : /bachelor|ba\/bs|bs\/ba|b\.s\.|b\.a\.|undergraduate|4-year|four-year|college|university/i.test(sentence) ? 'bachelor' : /advanced|master|graduate/i.test(sentence) ? 'advanced' : /associate/i.test(sentence) ? 'associate' : 'unspecified';
      const notReq = anyWord(sentence, d.not_required_words); const eq = anyWord(sentence, d.equivalent_words); const req = anyWord(sentence, d.required_words);
      const status = notReq.length || section === 'preferred' ? 'preferred'
        : eq.length ? 'equivalent-accepted'
        : req.length || section === 'required' ? 'required' : 'unlabelled';
      const field = (sentence.match(/\b(?:degree|bachelor'?s?)\s+(?:degree\s+)?(?:(?:is\s+)?required\s+)?in\s+([^.;()]+?)(?:[.;(]|,?\s+or equivalent|,?\s+with\b|$)/i) || [])[1]?.replace(/\s+(?:is\s+)?(?:required|preferred)$/i, '').trim() || null;
      mentions.push({ sentence: sentence.trim(), section, level, status, field, basis: notReq[0] || eq[0] || req[0] || section });
    }
  }
  const reqBach = mentions.find((m) => m.status === 'required' && ['bachelor', 'advanced'].includes(m.level));
  if (reqBach) {
    return { verdict: 'DEGREE-REQUIRED', field: reqBach.field, field_specific: !!reqBach.field, evidence: reqBach.sentence, mentions,
      flag: reqBach.field ? null : 'DEGREE-FIELD-UNSPECIFIED: a degree is required but no specific field is named (rule inference, not a legal conclusion)' };
  }
  // Every reason that applies, so "Desirable: … or equivalent combination" shows both.
  const eqHit = (m) => anyWord(m.sentence, d.equivalent_words).length > 0;
  const reasons = [
    mentions.some((m) => m.level === 'high-school') && 'high-school-diploma',
    mentions.some((m) => m.status === 'preferred') && 'stated-as-preferred-or-bonus-only',
    mentions.some(eqHit) && 'equivalent-experience-accepted',
    mentions.some((m) => m.status === 'unlabelled') && 'mentioned-without-required-wording',
  ].filter(Boolean);
  const reason = reasons.length ? reasons.join('+') : 'no-degree-named';
  const ev = mentions.find((m) => m.level === 'high-school') || mentions.find(eqHit) || mentions[0] || null;
  return { verdict: 'DEGREE-NOT-REQUIRED', reason, field: null, field_specific: false, evidence: ev?.sentence ?? null, mentions,
    flag: `DEGREE-NOT-REQUIRED (${reason}): specialty-occupation risk — rule inference from the posting text, never a legal conclusion` };
}

// ── step 4: candidate SOCs from the keyword table ───────────────────────────

export function candidateSocs(posting, rules) {
  const t = phrase(posting.title); const x = phrase(posting.text);
  const out = new Map();
  for (const r of rules.soc_rules) {
    const g = (list, hay) => (list ? list.filter((k) => has(hay, k)) : null);
    const a = g(r.title_any, t), b = g(r.title_also_any, t), c = g(r.text_any, x);
    if ((a && !a.length) || (b && !b.length) || (c && !c.length)) continue;
    for (const soc of r.socs) {
      if (!out.has(soc)) out.set(soc, { soc, rules: [] });
      out.get(soc).rules.push({ id: r.id, matched: [...(a || []), ...(b || []), ...(c || []).map((k) => `text:${k}`)], why: r.why });
    }
  }
  return [...out.values()];
}

// ── step 5: per-SOC evidence ─────────────────────────────────────────────────

function socEvidence(cand, posting, ctx) {
  const { compact, national, metroRows, rules } = ctx;
  const rows = compact.filter((r) => r.bls_soc_code === cand.soc);
  const hintCode = rules.onet_hints?.[cand.soc];
  const primary = rows.find((r) => r.onet_soc_code === hintCode) || rows.find((r) => r.onet_soc_code.endsWith('.00')) || rows[0];
  // Title only: posting text names colleagues' titles ("works with Demand Planners"),
  // which say nothing about how THIS role is filed.
  const t = phrase(posting.title);
  const altSupport = [];
  for (const r of rows) for (const alt of (r.alternate_titles_sample || '').split(';').map((s) => s.trim()).filter(Boolean)) {
    const ap = phrase(alt.replace(/\s*\([^)]*\)/g, ''));
    if (ap.trim().split(' ').length < 2) continue;
    if (t.includes(ap) || ap.includes(t)) altSupport.push({ onet_soc_code: r.onet_soc_code, alternate_title: alt, where: 'title' });
  }
  const nat = national.find((r) => r.OCC_CODE === cand.soc && r.O_GROUP === 'detailed');
  const parent = `${cand.soc.slice(0, 6)}0`;
  const natParent = parent !== cand.soc ? national.find((r) => r.OCC_CODE === parent) : null;
  const pct = (row, k) => (row ? wageCell(row[k]) : { value: null, token: null, missing: 'no-oews-row' });
  const metro = metroRows.find((r) => r.AREA_TITLE.toLowerCase() === String(posting.metro || '').toLowerCase() && r.OCC_CODE === cand.soc && r.O_GROUP === 'detailed');
  const jz = primary ? (primary.job_zone || (rows.find((r) => r.job_zone)?.job_zone ?? '')) : '';
  return {
    soc: cand.soc,
    known: !!primary,
    title: v(primary ? (rows.find((r) => r.onet_soc_code.endsWith('.00'))?.title ?? primary.title) : null, LABEL.record, rel(ctx.files.soc)),
    onet_detail_used: v(primary?.onet_soc_code ?? null, LABEL.model, hintCode ? 'rules.onet_hints' : 'the .00 row'),
    onet_detail_title: v(primary?.title ?? null, LABEL.record, rel(ctx.files.soc)),
    job_zone: v(jz === '' ? null : Number(jz), LABEL.record, `${rel(ctx.files.soc)} job_zone (${primary?.onet_soc_code ?? '—'}${primary && !primary.job_zone && jz ? '; blank on that row, first non-blank row used' : ''})`),
    cognitive_pivot_score: v(primary?.cognitive_pivot_score ? Number(primary.cognitive_pivot_score) : null, LABEL.record, `${rel(ctx.files.soc)} cognitive_pivot_score (${primary?.onet_soc_code ?? '—'})`),
    compact_median: v(primary ? wageCell(primary.annual_median_wage).value : null, LABEL.record, `${rel(ctx.files.soc)} annual_median_wage`),
    rules: v(cand.rules, LABEL.model, 'rules/resolver-rules.json soc_rules'),
    onet_alternate_title_support: v(altSupport, LABEL.record, `${rel(ctx.files.soc)} alternate_titles_sample — a truncated SAMPLE: absence there is not evidence`),
    national: {
      source: `${rel(ctx.files.national)} (trimmed from data/bls/oesm24nat/national_M2024_dl.xlsx)`, label: LABEL.record,
      row_found: !!nat,
      p10: pct(nat, 'A_PCT10'), p25: pct(nat, 'A_PCT25'), median: pct(nat, 'A_MEDIAN'), p75: pct(nat, 'A_PCT75'), p90: pct(nat, 'A_PCT90'),
      broad_parent_row: natParent ? { occ_code: parent, title: natParent.OCC_TITLE, median: wageCell(natParent.A_MEDIAN).value, note: 'shown for context only — a broader aggregate is never substituted for the detailed code' } : null,
    },
    metro_raw: {
      source: `${rel(ctx.files.metro)} (trimmed from BLS oesm24ma MSA_M2024_dl.xlsx)`, label: LABEL.record, row_found: !!metro,
      p10: pct(metro, 'A_PCT10'), p25: pct(metro, 'A_PCT25'), median: pct(metro, 'A_MEDIAN'), p75: pct(metro, 'A_PCT75'),
    },
    metro_band: null,
  };
}

// local-wage-adjustment.py, run unmodified once per posting over its candidates.
function runLocalWage(posting, socs, ctx) {
  if (ctx.localWage === 'skip') return { ran: false, why: '--local-wage skip', rows: {} };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'soc-resolver-'));
  const sample = path.join(tmp, 'pairs.csv');
  fs.writeFileSync(sample, `AREA_TITLE,soc_code\n${socs.map((s) => `"${posting.metro}",${s}`).join('\n')}\n`);
  const args = [LOCAL_WAGE, '--sample', sample, '--oews', ctx.files.metro, '--rpp', ctx.files.rpp, '--crosswalk', ctx.files.crosswalk, '--national', ctx.files.soc];
  const r = spawnSync(ctx.python, args, { cwd: REPO, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  const command = `${ctx.pythonShown} ${rel(LOCAL_WAGE)} --sample <tmp pairs.csv: ${socs.length} × "${posting.metro}"> --oews ${rel(ctx.files.metro)} --rpp ${rel(ctx.files.rpp)} --crosswalk ${rel(ctx.files.crosswalk)} --national ${rel(ctx.files.soc)}`;
  if (r.error || r.status !== 0) throw new Stop('local-wage', `local-wage script failed (${r.error?.message ?? `exit ${r.status}`}): ${(r.stderr || '').trim().split('\n').slice(-3).join(' | ')}`, 4);
  const rows = readCsvText(r.stdout);
  return { ran: true, command, stderr: (r.stderr || '').trim(), rows: Object.fromEntries(rows.map((x) => [x.soc_code, x])) };
}
function readCsvText(text) {
  const rows = parseCsv(text); const head = rows[0] || [];
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// ── employer H-1B lookup (exact normalized name only) ───────────────────────

export function matchEmployer(names, h1b) {
  const keys = new Map(names.map((n) => [normalizeName(n), n]).filter(([k]) => k));
  const exact = h1b.rows.filter((r) => keys.has(normalizeName(r.company_name)));
  const loose = [];
  for (const n of names) {
    const needle = String(n).toLowerCase().trim(); if (!needle) continue;
    for (const r of h1b.rows) if (r.company_name.toLowerCase().includes(needle) && !exact.includes(r)) loose.push({ alias: n, company_name: r.company_name });
  }
  const socCols = h1b.header.filter((h) => /\bsoc\b|occupation/i.test(h));
  return {
    exact_matches: exact.map((r) => ({ company_name: r.company_name, city: r.city, state: r.state, total_approvals: r['Total Approvals'] || null, total_denials: r['Total Denials'] || null, approval_rate: r.Approval_Rate || null, median_salary_offered: r.median_salary_offered || null, latest_funding_date: r.latest_funding_date || null })),
    rejected_loose_matches: loose,
    per_soc_field: socCols.length ? socCols : null,
    per_soc_note: socCols.length ? null : `the 80 Days file has no SOC/occupation column (columns: ${h1b.header.join(', ')}) — per-SOC H-1B history is MISSING, not approximated`,
  };
}

// ── step 7: spread check ─────────────────────────────────────────────────────

function spreadOf(values) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  return { min, max, usd: max - min, ratio: min > 0 ? (max - min) / min : null };
}
export function spreadVerdict(cands, rules) {
  const s = rules.spread; const reasons = [];
  if (!cands.length) return { result: 'STOP', reasons: ['no candidate SOC: the title matches no rule in the keyword table'] };
  const unknown = cands.filter((c) => !c.known);
  if (unknown.length) return { result: 'STOP', reasons: [`unknown SOC ${unknown.map((c) => c.soc).join(', ')}: no row in the BLS/O*NET compact file`] };
  const nat = cands.filter((c) => c.national_median != null);
  const natMissing = cands.filter((c) => c.national_median == null).map((c) => `${c.soc} (${c.national_missing})`);
  const metroCk = cands.filter((c) => c.metro_median !== 'not-checked');
  const metro = metroCk.filter((c) => c.metro_median != null);
  const metroMissing = metroCk.filter((c) => c.metro_median == null).map((c) => `${c.soc} (${c.metro_missing})`);
  const ns = spreadOf(nat.map((c) => c.national_median));
  const ms = spreadOf(metro.map((c) => c.metro_median));
  const sc = spreadOf(cands.filter((c) => c.vote_sum != null).map((c) => c.vote_sum));
  const over = (sp) => sp && (sp.usd > s.wage_spread_usd_max || (sp.ratio != null && sp.ratio > s.wage_spread_ratio_max));
  if (over(ns)) reasons.push(`national median spread ${money(ns.usd)} (${(ns.ratio * 100).toFixed(1)}%) exceeds ${money(s.wage_spread_usd_max)} or ${s.wage_spread_ratio_max * 100}%`);
  if (over(ms)) reasons.push(`metro median spread ${money(ms.usd)} (${(ms.ratio * 100).toFixed(1)}%) exceeds ${money(s.wage_spread_usd_max)} or ${s.wage_spread_ratio_max * 100}%`);
  if (sc && sc.usd > s.score_spread_max) reasons.push(`scorer vote-sum spread ${sc.usd.toFixed(3)} exceeds ${s.score_spread_max}`);
  const base = { national_spread: ns, metro_spread: ms, score_spread: sc, missing_national: natMissing, missing_metro: metroMissing };
  if (reasons.length) {
    if (natMissing.length || metroMissing.length) reasons.push(`missing data (${[...natMissing, ...metroMissing].join('; ')}) can only widen the disagreement, never resolve it`);
    return { result: 'AMBIGUOUS-REFUSE', reasons, ...base, ask: 'Ask the recruiter or employer which SOC code this role would be filed under (for an H-1B/LCA) before using any wage floor or score for it.' };
  }
  if (natMissing.length || metroMissing.length)
    return { result: 'STOP', reasons: [`cannot confirm the candidates agree: missing ${[...natMissing, ...metroMissing].join('; ')} — never interpolated, never replaced by a national or broader value`], ...base };
  return { result: 'RESOLVED', reasons: [cands.length === 1 ? 'one candidate SOC' : `candidates agree within ${money(s.wage_spread_usd_max)} / ${s.wage_spread_ratio_max * 100}% and score spread ≤ ${s.score_spread_max}`], ...base };
}

// ── gate 8: visa timeline (human-entered only) ───────────────────────────────

function visaGate(persona) {
  const vz = persona.visa || {};
  const entered = readDate(vz.ead_valid_from) && readDate(vz.ead_card_expires) && vz.ead_valid_from < vz.ead_card_expires && String(vz.ead_entered_by || '').trim();
  const ead = entered
    ? { gate: 'CLEARED', why: `EAD Valid From ${vz.ead_valid_from} / Card Expires ${vz.ead_card_expires}, entered by ${vz.ead_entered_by}`, label: LABEL.input }
    : { gate: 'STOP', why: `enter the EAD card's "Valid From" and "Card Expires" dates (and who entered them) — the requested start ${vz.requested_start ?? '(none)'} is not the card; if approval comes later the card starts on the approval date. No timeline ranking until then.`, label: LABEL.input };
  const stem = String(vz.stem_extension?.dso_answer || '').trim()
    ? { gate: 'RECORDED', why: `DSO answer recorded by ${vz.stem_extension.recorded_by || '(unnamed)'}: ${vz.stem_extension.dso_answer}`, label: LABEL.input }
    : { gate: 'HOLD', why: 'ask your DSO (Northeastern OGS) whether the degree\'s CIP code is STEM-eligible — this tool draws no conclusion about visa law', label: LABEL.input };
  return { ead, stem, timeline_factor: ead.gate === 'CLEARED' ? 1 : 0 };
}

// ── third-party claims (job boards etc.): recorded, never evidence ──────────

function claimChecks(posting, experience) {
  const out = [];
  const text = normText(posting.text);
  const pm = text.match(/\$\s?([\d,]{4,})(?:\.\d+)?\s*(?:-|to)\s*\$\s?([\d,]{4,})/);
  const postedPay = pm ? [Number(pm[1].replace(/,/g, '')), Number(pm[2].replace(/,/g, ''))] : null;
  for (const c of posting.third_party_claims || []) {
    const row = { claim: c.claim, value: c.value, source: c.source, label: LABEL.input, status: 'unverified — not from the employer or the repository' };
    if (c.claim === 'pay_range') {
      const m = String(c.value).match(/\$?\s?([\d.]+)\s*k?\s*(?:-|to)\s*\$?\s?([\d.]+)\s*k?/i);
      const claimed = m ? [Number(m[1]) * (/k/i.test(c.value) ? 1000 : 1), Number(m[2]) * (/k/i.test(c.value) ? 1000 : 1)] : null;
      if (!postedPay) row.check = 'posting text states no pay range — claim cannot be checked';
      else if (claimed && claimed.every((n, i) => Math.abs(n - postedPay[i]) / postedPay[i] <= 0.01)) row.check = `consistent with the posting text ${money(postedPay[0])}–${money(postedPay[1])} (within rounding) — the posting text is the record`;
      else row.check = `CONFLICT: posting text says ${money(postedPay[0])}–${money(postedPay[1])}`;
    } else if (c.claim === 'seniority' && experience?.verdict === 'EXPERIENCE-FIT' && /senior|lead|staff|principal/i.test(c.value)) {
      row.check = `CONFLICT: label says "${c.value}" but the posting text's minimum required years is ${experience.min_required_years} ("${experience.matched_phrase}"). The label is not evidence; the text is.`;
    } else row.check = 'not checkable from the posting text or repository data';
    out.push(row);
  }
  return { posted_pay_range: postedPay ? v(postedPay, LABEL.record, 'posting text') : v(null, LABEL.record, 'posting text states no pay range'), claims: out };
}

// ── one posting ──────────────────────────────────────────────────────────────

function resolvePosting(posting, ctx) {
  const textLabel = posting.kind === 'real' ? LABEL.record : LABEL.input;
  const live = livenessFor(posting, ctx.observations);
  const scope = scopeCheck(posting.title, ctx.rules);
  const metroKnown = ctx.metroTitles.has(String(posting.metro || '').toLowerCase());
  const metroTarget = (ctx.persona.target_metros || []).map((m) => m.toLowerCase()).includes(String(posting.metro || '').toLowerCase());
  const inXwalk = ctx.xwalkTitles.has(String(posting.metro || '').toLowerCase());
  const metroGate = !posting.metro ? { gate: 'STOP', why: 'no metro given' }
    : !metroTarget ? { gate: 'STOP', why: `"${posting.metro}" is not one of the target metros` }
    : !metroKnown ? { gate: 'STOP', why: `"${posting.metro}" is not an AREA_TITLE in the BLS metro file (no-metro-match)` }
    : !inXwalk ? { gate: 'STOP', why: `"${posting.metro}" has no exact BLS AREA = BEA GeoFIPS crosswalk row` }
    : { gate: 'PASS', why: `exact BLS AREA_TITLE and BEA crosswalk row found; place → MSA mapping "${posting.place ?? ''}" → "${posting.metro}" is your-input (no OMB delineation file in the repo)` };

  const res = {
    id: posting.id, kind: posting.kind, title: v(posting.title, textLabel, posting.source?.what ?? 'posting file'), company: v(posting.company, textLabel, posting.source?.what ?? 'posting file'),
    url: posting.url ?? null, place: v(posting.place ?? null, textLabel, 'posting'), metro: v(posting.metro ?? null, LABEL.input, 'place → MSA mapping in the posting meta file'),
    source: posting.source ?? null,
    gates: { liveness: live, scope: { gate: scope.verdict === 'IN-SCOPE' ? 'PASS' : 'STOP', ...scope, label: LABEL.model }, metro: { ...metroGate, label: LABEL.input } },
  };
  if (scope.verdict === 'OUT-OF-SCOPE') return finish(res, 'STOP', 'scope', 'OUT-OF-SCOPE — not scored');

  const exp = parseExperience(posting.text, ctx.rules, ctx.persona.max_required_years);
  res.gates.experience = { gate: exp.verdict === 'EXPERIENCE-FIT' ? 'PASS' : exp.verdict === 'EXPERIENCE-UNSTATED' ? 'HOLD' : 'STOP', ...exp, label: weakest(textLabel, LABEL.model) };
  res.third_party = claimChecks(posting, exp);
  if (exp.verdict === 'EXPERIENCE-OVER-TARGET') return finish(res, 'STOP', 'experience', `EXPERIENCE-OVER-TARGET — minimum required ${exp.min_required_years} years > ${exp.max_allowed_years}; not ranked as a target`);

  res.degree = { ...checkDegree(posting.text, ctx.rules), label: weakest(textLabel, LABEL.model) };
  const cands = candidateSocs(posting, ctx.rules);
  res.candidates = cands.map((c) => socEvidence(c, posting, ctx));
  res.employer = { names_tried: v(posting.employer_names || [posting.company], LABEL.input, 'posting meta'), ...matchEmployer(posting.employer_names || [posting.company], ctx.h1b), label: LABEL.record, source: rel(ctx.files.h1b) };
  res.employer.verdict = res.employer.exact_matches.length ? 'MATCHED' : 'MISSING';

  const known = res.candidates.filter((c) => c.known).map((c) => c.soc);
  const lw = known.length && metroGate.gate === 'PASS' ? runLocalWage(posting, known, ctx) : { ran: false, why: known.length ? `metro gate ${metroGate.gate}` : 'no known candidate SOC', rows: {} };
  res.local_wage = { ran: lw.ran, why: lw.why ?? null, command: lw.command ?? null, stderr: lw.stderr ?? null };
  for (const c of res.candidates) {
    const row = lw.rows[c.soc];
    if (!lw.ran) { c.metro_band = { status: 'not-checked', why: lw.why, label: LABEL.record }; continue; }
    const raw = c.metro_raw.median;
    c.metro_band = row ? {
      status: row.status, missing_reason: row.missing_reason || null,
      nominal_median: row.nominal_wage_median ? Number(row.nominal_wage_median) : null,
      rpp: row.bea_rpp_value ? Number(row.bea_rpp_value) : null,
      adjusted_p25: row.adjusted_wage_band_low ? Number(row.adjusted_wage_band_low) : null,
      adjusted_median: row.adjusted_wage_median ? Number(row.adjusted_wage_median) : null,
      adjusted_p75: row.adjusted_wage_band_high ? Number(row.adjusted_wage_band_high) : null,
      plausibility_flag: row.plausibility_flag || null,
      label: LABEL.record, source: 'scripts/bls/local-wage-adjustment.py (unmodified)',
      reason_code_note: row.missing_reason === 'suppressed-small-sample' && raw.token === '#' ? 'the raw OEWS cell is "#" (top-coded: ≥ $239,200/yr), not a small-sample suppression — the script\'s reason code mislabels it (logged defect); still missing as a number, never filled' : null,
    } : { status: 'missing', missing_reason: 'no row returned by the script', label: LABEL.record };
  }

  // flags (failure modes the mode exists to surface)
  const flags = [];
  const fl = ctx.rules.flags;
  for (const c of res.candidates) {
    if (fl.clerical_major_groups.includes(c.soc.slice(0, 2)) || (c.job_zone.value != null && c.job_zone.value <= fl.max_job_zone_for_flag))
      flags.push({ flag: 'CLERICAL-OR-JZ2-CANDIDATE', soc: c.soc, why: `${c.soc} ${c.title.value} (job zone ${c.job_zone.value ?? '—'}) — if the role is filed under this code the wage floor drops and the specialty-occupation case is much harder (rule inference, not a legal conclusion)`, label: LABEL.model });
    if (fl.manager_major_groups.includes(c.soc.slice(0, 2)) && exp.verdict === 'EXPERIENCE-FIT')
      flags.push({ flag: 'MANAGER-CODE-AT-EARLY-CAREER', soc: c.soc, why: `${c.soc} is a management code on a posting that requires ≤ ${exp.max_allowed_years} years; the typical experience BLS expects for it is NOT in the repository ([TODO] BLS Employment Projections table) — check before trusting the "Manager" title`, label: LABEL.model });
  }
  if (res.degree.flag) flags.push({ flag: res.degree.verdict === 'DEGREE-REQUIRED' ? 'DEGREE-FIELD-UNSPECIFIED' : 'DEGREE-NOT-REQUIRED', why: res.degree.flag, label: LABEL.model });
  if (res.employer.rejected_loose_matches.length) flags.push({ flag: 'NAME-COLLISION-REJECTED', why: `a substring match would have attached ${res.employer.rejected_loose_matches.map((m) => m.company_name).join(', ')} — different companies; not attached`, label: LABEL.record });
  for (const c of res.third_party.claims) if (/^CONFLICT/.test(c.check || '')) flags.push({ flag: 'THIRD-PARTY-CONFLICT', why: `${c.claim}: ${c.check}`, label: LABEL.input });
  if (exp.verdict === 'EXPERIENCE-UNSTATED') flags.push({ flag: 'EXPERIENCE-UNSTATED', why: exp.why, label: LABEL.model });
  res.flags = flags;
  return res;
}

function finish(res, verdict, stoppedAt, why) {
  res.verdict = verdict; res.stopped_at = stoppedAt; res.verdict_why = why; res.flags = res.flags || [];
  return res;
}

// After the scorer ran: spread check + final verdict per posting.
function decide(res, ctx) {
  if (res.verdict) return res;
  const cands = res.candidates.map((c) => ({
    soc: c.soc, known: c.known,
    national_median: c.national.median.value, national_missing: c.national.row_found ? c.national.median.missing : 'no detailed OEWS row',
    metro_median: c.metro_band.status === 'not-checked' ? 'not-checked' : c.metro_band.adjusted_median ?? null,
    metro_missing: c.metro_band.missing_reason ?? c.metro_band.status,
    vote_sum: c.scorer?.vote_sum ?? null,
  }));
  res.spread = { ...spreadVerdict(cands, ctx.rules), label: LABEL.model, thresholds: ctx.rules.spread };
  const stopGate = ['liveness', 'metro'].find((g) => res.gates[g].gate === 'STOP');
  if (stopGate) return finish(res, 'STOP', stopGate, `${stopGate} gate: ${res.gates[stopGate].reason || res.gates[stopGate].why || res.gates[stopGate].result} — the spread analysis below is shown for information only (${res.spread.result})`);
  if (res.spread.result === 'STOP') return finish(res, 'STOP', 'data', res.spread.reasons.join('; '));
  if (res.spread.result === 'AMBIGUOUS-REFUSE') { res.score = null; return finish(res, 'AMBIGUOUS-REFUSE', 'spread', `${res.spread.reasons.join('; ')}. ${res.spread.ask}`); }
  const lowest = res.candidates.reduce((a, b) => ((b.scorer?.composite ?? 1) < (a.scorer?.composite ?? 1) ? b : a));
  res.score = { composite: lowest.scorer?.composite ?? null, recommendation: lowest.scorer?.recommendation ?? null, soc: lowest.soc, label: LABEL.model, note: 'lowest composite among agreeing candidates (conservative)' };
  return finish(res, 'RESOLVED', null, res.spread.reasons.join('; '));
}

// ── human report ─────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const cell = (w) => (w.value != null ? money(w.value) : `missing: ${w.missing}`);

function renderReport(log) {
  const o = []; const P = log.postings;
  const by = (k) => P.filter((p) => p.verdict === k).length;
  o.push(`# Early-career PM & supply-chain SOC resolver — run ${log.run.as_of}`);
  o.push('\n## Executive summary\n');
  o.push(`This report takes ${P.length} job postings (${P.filter((p) => p.kind === 'real').length} real, ${P.filter((p) => p.kind !== 'real').length} written as samples or break tests) and asks one question the postings never answer: which government occupation code would the employer file this job under? That code sets the official wage floor and decides which of an employer's past visa filings are even relevant. When the plausible codes disagree by more than a set amount, the tool refuses to give a single score and says to ask the recruiter instead.`);
  o.push(`\nResult: **${by('RESOLVED')} resolved · ${by('AMBIGUOUS-REFUSE')} refused as ambiguous · ${by('STOP')} stopped** at a gate or for missing data. Nothing is ranked yet, because the work-permit card dates have not been entered — that is a human step, not something this tool can fill in. Every number below is labelled as a record, your input, or a model judgment; missing values are shown as missing.`);
  o.push('\n## Run record\n');
  o.push(`- Tool: \`${log.run.tool}\` v${log.run.version} · as of ${log.run.as_of} · local-wage script: ${log.run.local_wage_mode}`);
  o.push(`- Thresholds (your-input, from the rules file): wage spread > ${money(log.run.thresholds.wage_spread_usd_max)} or > ${log.run.thresholds.wage_spread_ratio_max * 100}% · score spread > ${log.run.thresholds.score_spread_max} → refuse`);
  o.push(`- Scorer: ${log.scorer.ran ? `\`${log.scorer.command}\` → ${esc(log.scorer.stdout.split('\n')[0])}` : `not run — ${log.scorer.why_not}`}`);
  o.push(`- Visa timeline gate: EAD **${log.visa.ead.gate}** — ${esc(log.visa.ead.why)} · STEM **${log.visa.stem.gate}** — ${esc(log.visa.stem.why)}`);
  o.push('\n| Posting | Kind | Liveness | Scope | Experience (min required) | Degree | Candidate SOCs | Verdict |');
  o.push('|---|---|---|---|---|---|---|---|');
  for (const p of P) {
    const e = p.gates.experience;
    o.push(`| ${esc(p.title.value)} — ${esc(p.company.value)} | ${p.kind} | ${p.gates.liveness.result} | ${p.gates.scope.verdict} | ${e ? `${e.verdict}${e.min_required_years != null ? ` (${e.min_required_years})` : ''}` : '—'} | ${p.degree ? `${p.degree.verdict}${p.degree.reason ? ` (${p.degree.reason})` : ''}` : '—'} | ${p.candidates ? p.candidates.map((c) => c.soc).join(', ') || 'none' : '—'} | **${p.verdict}**${p.stopped_at ? ` at ${p.stopped_at}` : ''} |`);
  }
  for (const p of P) {
    o.push(`\n## ${esc(p.title.value)} — ${esc(p.company.value)} (${p.kind})\n`);
    o.push(`**Verdict: ${p.verdict}.** ${esc(p.verdict_why)}`);
    if (p.verdict === 'AMBIGUOUS-REFUSE') o.push('\n> No single score is given for this posting. Ask the recruiter or employer which SOC code the role would be filed under.');
    o.push(`\n- Place → metro: ${esc(p.place.value ?? '—')} → ${esc(p.metro.value ?? '—')} [your-input]; metro gate ${p.gates.metro.gate}: ${esc(p.gates.metro.why)}`);
    o.push(`- Liveness [${p.gates.liveness.label}]: ${p.gates.liveness.result}${p.gates.liveness.reason ? ` — ${esc(p.gates.liveness.reason)}` : ''}${p.gates.liveness.log ? ` (from \`${p.gates.liveness.log}\`)` : ''}`);
    o.push(`- Scope [model-judgment rule]: ${p.gates.scope.verdict} — ${esc(p.gates.scope.why)}`);
    if (p.gates.experience) {
      const e = p.gates.experience;
      o.push(`- Experience [${e.label}]: **${e.verdict}** — ${esc(e.why)}`);
      if (e.evidence) o.push(`  - quoted: "${esc(e.evidence)}"`);
    }
    if (p.degree) o.push(`- Degree [${p.degree.label}]: **${p.degree.verdict}**${p.degree.field ? ` in ${esc(p.degree.field)}` : ''}${p.degree.evidence ? ` — quoted: "${esc(p.degree.evidence)}"` : ''}`);
    if (p.third_party) {
      o.push(`- Pay range in the posting text [record]: ${p.third_party.posted_pay_range.value ? `${money(p.third_party.posted_pay_range.value[0])}–${money(p.third_party.posted_pay_range.value[1])}` : 'none stated'}`);
      for (const c of p.third_party.claims) o.push(`- Third-party claim [${c.label}, ${esc(c.source)}]: ${esc(c.claim)} = "${esc(c.value)}" — ${esc(c.status)}; ${esc(c.check)}`);
    }
    if (p.employer) {
      o.push(`- Employer H-1B record [${p.employer.label}, \`${p.employer.source}\`]: **${p.employer.verdict}** for ${p.employer.names_tried.value.map((n) => `"${esc(n)}"`).join(', ')} (exact normalized-name match only)${p.employer.exact_matches.length ? `: ${p.employer.exact_matches.map((m) => `${esc(m.company_name)} — approvals ${m.total_approvals ?? '—'}, denials ${m.total_denials ?? '—'}`).join('; ')}` : ''}`);
      if (p.employer.rejected_loose_matches.length) o.push(`  - rejected substring matches (different companies): ${p.employer.rejected_loose_matches.map((m) => `${esc(m.company_name)} (via "${esc(m.alias)}")`).join(', ')}`);
      o.push(`  - per-SOC H-1B history: ${esc(p.employer.per_soc_note ?? `columns ${p.employer.per_soc_field.join(', ')}`)}`);
    }
    if (p.candidates?.length) {
      o.push('\n| SOC | Occupation (O*NET row used) | Job zone | National p10 / p25 / median / p75 [record] | Metro nominal p25 / median [record] | Metro RPP-adjusted p25 / median / p75 [local-wage script] | Scorer vote-sum → composite, rec | Why a candidate [model-judgment] | O*NET alt-title support [record] |');
      o.push('|---|---|---|---|---|---|---|---|---|');
      for (const c of p.candidates) {
        const n = c.national, m = c.metro_raw, b = c.metro_band;
        const mm = (x, raw) => (x != null ? money(x) : `missing${raw?.token ? ` (${raw.token})` : ''}`);
        const band = b.status === 'ok' ? `${mm(b.adjusted_p25, m.p25)} / ${mm(b.adjusted_median, m.median)} / ${mm(b.adjusted_p75, m.p75)} (RPP ${b.rpp})` : b.status === 'not-checked' ? `not checked (${esc(b.why)})` : `missing: ${esc(b.missing_reason)}${b.reason_code_note ? ` ⚠ ${esc(b.reason_code_note)}` : ''}`;
        o.push(`| ${c.soc} | ${esc(c.title.value ?? 'UNKNOWN SOC')} (${esc(c.onet_detail_used.value ?? '—')}) | ${c.job_zone.value ?? '—'} | ${n.row_found ? `${cell(n.p10)} / ${cell(n.p25)} / **${cell(n.median)}** / ${cell(n.p75)}` : `missing: no detailed OEWS row${n.broad_parent_row ? ` (OEWS publishes ${n.broad_parent_row.occ_code} ${esc(n.broad_parent_row.title)} ${money(n.broad_parent_row.median)} — not substituted)` : ''}`} | ${m.row_found ? `${cell(m.p25)} / ${cell(m.median)}` : 'missing: no metro row'} | ${band} | ${c.scorer ? `${c.scorer.vote_sum} → ${c.scorer.composite}, ${c.scorer.recommendation}` : '—'} | ${c.rules.value.map((r) => `${r.id} (${esc(r.matched.join(', '))})`).join('; ')} | ${c.onet_alternate_title_support.value.map((a) => `${esc(a.alternate_title)} [${a.onet_soc_code}, ${a.where}]`).join('; ') || 'none in the truncated sample'} |`);
      }
    }
    if (p.spread) {
      const f = (s) => (s ? `${money(s.min)}–${money(s.max)} (spread ${money(s.usd)}, ${(s.ratio * 100).toFixed(1)}%)` : 'fewer than two values');
      o.push(`\n- Spread check [${p.spread.label}]: **${p.spread.result}** — national medians ${f(p.spread.national_spread)}; metro adjusted medians ${f(p.spread.metro_spread)}; scorer vote-sum ${p.spread.score_spread ? `${p.spread.score_spread.min}–${p.spread.score_spread.max}` : '—'}`);
      for (const r of p.spread.reasons) o.push(`  - ${esc(r)}`);
    }
    if (p.flags?.length) { o.push('\n**Flags**'); for (const f of p.flags) o.push(`- ${f.flag}${f.soc ? ` (${f.soc})` : ''} [${f.label}]: ${esc(f.why)}`); }
  }
  o.push('\n## What this run cannot tell you\n');
  for (const c of log.cannot_verify) o.push(`- ${c}`);
  o.push('\n## Label key\n');
  o.push('| Label | Meaning |\n|---|---|\n| record | read from a file or script output in the repository (BLS, BEA, O*NET, 80 Days, saved `ats:liveness` output, a fetched real posting) |\n| your-input | entered by the person: metro mapping, thresholds, sample postings, EAD dates, third-party claims copied from a job board |\n| model-judgment | a rule written for this mode (keyword tables, experience/degree parsing, flags) or a normalisation choice — readable, but a judgment |');
  return o.join('\n') + '\n';
}

// ── main ─────────────────────────────────────────────────────────────────────

const CANNOT_VERIFY = [
  'Which SOC code an employer will actually file — only the employer or its LCA can say. The candidate list is a keyword inference.',
  'Per-SOC H-1B history for any employer: the 80 Days file has no SOC column ([TODO] DOL OFLC LCA disclosure data).',
  'Whether a posting\'s place is in the stated metro: the repo has no OMB delineation file; the mapping is your-input.',
  'Typical experience BLS expects for each SOC: not in the repository ([TODO] BLS Employment Projections education/training table).',
  'Any visa-law conclusion: degree and specialty-occupation flags are rule inferences from posting text; STEM eligibility is a DSO question.',
  'What a specific employer pays: OEWS is an occupation survey, not an offer.',
];

export function run(argv) {
  const opt = parseArgs(argv);
  const files = Object.fromEntries(Object.keys(DEFAULTS).filter((k) => k !== 'outDir').map((k) => [k, path.resolve(opt[k] ?? DEFAULTS[k])]));
  const outDir = path.resolve(opt.outDir ?? DEFAULTS.outDir);
  if (!outAllowed(outDir)) throw new Stop('usage', `refusing to write to ${outDir}: outputs go under course/2026fa/submissions/contactshyam14-code/, this script's folder (not its data/), or the OS temp dir — never tracked data/ paths`, 2);
  const asOf = opt.asOf ?? today();
  if (!readDate(asOf)) throw new Stop('G0', `--as-of must be YYYY-MM-DD, got ${asOf}`);

  const rules = readJson(files.rules, 'rules file');
  const persona = readJson(files.persona, 'persona file');
  if (persona.max_required_years != null && !Number.isInteger(persona.max_required_years)) throw new Stop('G0', 'persona max_required_years must be an integer');
  const compact = readCsvObjects(files.soc, 'BLS/O*NET compact file', ['onet_soc_code', 'bls_soc_code', 'title', 'job_zone', 'alternate_titles_sample', 'annual_median_wage', 'cognitive_pivot_score']).rows;
  const national = readCsvObjects(files.national, 'national OEWS file', ['OCC_CODE', 'O_GROUP', 'A_PCT10', 'A_PCT25', 'A_MEDIAN', 'A_PCT75']).rows;
  const metroRows = readCsvObjects(files.metro, 'metro OEWS file', ['AREA', 'AREA_TITLE', 'OCC_CODE', 'O_GROUP', 'A_MEDIAN', 'A_PCT25', 'A_PCT75']).rows;
  const xwalk = readCsvObjects(files.crosswalk, 'BLS-BEA crosswalk', ['AREA', 'GeoFIPS']).rows;
  readCsvObjects(files.rpp, 'BEA RPP file', ['GeoFIPS', 'rpp_all_items_2024']);
  const h1b = readCsvObjects(files.h1b, '80 Days company file', ['company_name', 'Total Approvals', 'Total Denials']);
  const areaTitle = new Map(metroRows.map((r) => [r.AREA, r.AREA_TITLE]));
  const xwalkTitles = new Set(xwalk.map((r) => (areaTitle.get(r.AREA) || r.AREA_TITLE || '').toLowerCase()).filter(Boolean));

  const observations = [];
  for (const f of opt.livenessLog) {
    if (!fs.existsSync(f)) throw new Stop('G0', `liveness log not found: ${f}`);
    const text = fs.readFileSync(f, 'utf8');
    const at = (text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/m) || [])[1] ?? null;
    for (const o of parseLivenessLog(text)) observations.push({ ...o, checked_at: at, log: rel(path.resolve(f)) });
  }
  const postings = opt.posting.map((f) => {
    const p = readJson(path.resolve(f), 'posting file');
    for (const k of ['id', 'kind', 'title', 'company', 'text']) if (!p[k] || typeof p[k] !== 'string') throw new Stop('G0', `posting ${f}: "${k}" must be a non-empty string`);
    if (!['real', 'sample', 'break-test'].includes(p.kind)) throw new Stop('G0', `posting ${f}: kind must be real, sample or break-test`);
    return { ...p, _file: path.resolve(f) };
  });

  let python = opt.python ?? process.env.PYTHON;
  if (!python) { const win = path.join(REPO, '.venv/Scripts/python.exe'); python = process.platform === 'win32' && fs.existsSync(win) ? win : 'python3'; }
  const ctx = { rules, persona, compact, national, metroRows, h1b, observations, files, localWage: opt.localWage ?? 'script', python, pythonShown: path.isAbsolute(python) ? rel(python) : python,
    metroTitles: new Set(metroRows.map((r) => r.AREA_TITLE.toLowerCase())), xwalkTitles };
  const visa = visaGate(persona);

  const results = postings.map((p) => resolvePosting(p, ctx));

  // roles.json for the EXISTING scorer — one role per (posting, candidate SOC)
  const roles = [];
  for (const r of results) for (const c of r.candidates || []) {
    if (!c.known) continue;
    const role = { role_id: `${r.id}::${c.soc}`, company: r.company.value, title: `${r.title.value} [as ${c.soc}]`,
      liveness: { factor: r.gates.liveness.gate === 'PASS' ? 1 : 0, source: r.gates.liveness.label },
      timeline: { factor: visa.timeline_factor, source: LABEL.input } };
    if (c.cognitive_pivot_score.value != null) role.role_quality = { p: Number((c.cognitive_pivot_score.value / 7).toFixed(3)), source: LABEL.model };
    roles.push(role);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const rolesPath = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify({ _note: 'written by soc-resolver.mjs for scripts/score/role-scorer.mjs (unmodified). role_quality.p = cognitive_pivot_score / 7 (model-judgment normalisation; O*NET level scale tops out at 7). No sponsorship vote: no per-SOC H-1B record exists. No fit vote: not judged. liveness = 1 only when the saved ats:liveness result is active. timeline = 0 until EAD dates are entered.', roles }, null, 2));
  const scorer = { ran: false };
  if (roles.length && !fs.existsSync(SCORER)) scorer.why_not = `${rel(SCORER)} is not present (e.g. an unzipped submission without the repository) — no composite is reported`;
  else if (roles.length) {
    scorer.command = `node ${rel(SCORER)} ${rel(rolesPath)} --out-dir ${rel(outDir)}`;
    try { scorer.stdout = execFileSync(process.execPath, [SCORER, rolesPath, '--out-dir', outDir], { cwd: REPO, encoding: 'utf8' }); }
    catch (e) { throw new Stop('scorer', `scorer failed: ${e.message}`, 4); }
    scorer.ran = true;
    const scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
    scorer.config_role_quality_weight = scored.config?.weights?.role_quality ?? null;
    const byId = new Map(scored.roles.map((s) => [s.role_id, s]));
    for (const r of results) for (const c of r.candidates || []) {
      const s = byId.get(`${r.id}::${c.soc}`);
      if (s) c.scorer = { composite: s.composite, vote_sum: s.trace.vote_sum, recommendation: s.recommendation, reason: s.reason, arithmetic: s.trace.arithmetic, label: LABEL.model, source: 'scripts/score/role-scorer.mjs → role-scores.json' };
    }
  } else scorer.why_not = 'no in-scope posting reached the candidate-SOC step';

  for (const r of results) decide(r, ctx);

  const log = {
    run: { tool: rel(fileURLToPath(import.meta.url)), version: VERSION, as_of: asOf, generated_at: new Date().toISOString(), local_wage_mode: ctx.localWage, python: ctx.pythonShown, thresholds: rules.spread, max_required_years: persona.max_required_years ?? rules.experience.max_required_years_default, argv },
    inputs: [
      ...Object.entries(files).filter(([k]) => k !== 'persona' || fs.existsSync(files.persona)).map(([k, f]) => ({ role: k, path: rel(f), sha256: fs.existsSync(f) ? sha256(f) : null })),
      ...postings.map((p) => ({ role: `posting:${p.id}`, path: rel(p._file), sha256: sha256(p._file), kind: p.kind, fetched: p.source ?? null })),
      ...opt.livenessLog.map((f) => ({ role: 'liveness-log', path: rel(path.resolve(f)), sha256: sha256(f) })),
    ],
    visa, scorer: { ...scorer, note: scorer.ran ? `scorer role_quality weight is ${scorer.config_role_quality_weight}; with no sponsorship or fit vote, every candidate's vote-sum is identical, so the score spread cannot separate SOCs — the wage spread does that work` : undefined },
    postings: results,
    summary: { postings: results.length, by_verdict: Object.fromEntries(['RESOLVED', 'AMBIGUOUS-REFUSE', 'STOP'].map((k) => [k, results.filter((r) => r.verdict === k).length])), ranked: 0, ranked_why: `visa timeline gate ${visa.ead.gate}` },
    cannot_verify: CANNOT_VERIFY,
  };
  fs.writeFileSync(path.join(outDir, 'soc-resolver.json'), JSON.stringify(log, null, 2));
  fs.writeFileSync(path.join(outDir, 'soc-resolver.md'), renderReport(log));
  return { log, outDir };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { log, outDir } = run(process.argv.slice(2));
    console.log(`soc-resolver ${VERSION} · as of ${log.run.as_of} · ${log.summary.postings} postings → RESOLVED ${log.summary.by_verdict.RESOLVED} · AMBIGUOUS-REFUSE ${log.summary.by_verdict['AMBIGUOUS-REFUSE']} · STOP ${log.summary.by_verdict.STOP}`);
    for (const p of log.postings) console.log(`  ${p.verdict.padEnd(16)} ${p.title.value} — ${p.company.value} [${p.kind}]${p.stopped_at ? ` (at ${p.stopped_at})` : ''}${p.spread && p.verdict === 'STOP' && p.stopped_at !== 'data' ? ` · spread analysis: ${p.spread.result}` : ''}`);
    console.log(`  visa timeline: EAD ${log.visa.ead.gate} · STEM ${log.visa.stem.gate} → ranked ${log.summary.ranked}`);
    if (log.scorer.ran) console.log(`  scorer: ${log.scorer.stdout.split('\n')[0]}`);
    if (!log.scorer.ran) console.log(`  scorer: not run — ${log.scorer.why_not}`);
    console.log(`  wrote ${rel(path.join(outDir, 'soc-resolver.json'))} + soc-resolver.md + roles.json${log.scorer.ran ? ' + role-scores.json/.md' : ''}`);
  } catch (e) {
    if (e instanceof Stop) { console.error(`STOP [${e.gate}] ${e.message}`); process.exit(e.code); }
    throw e;
  }
}
