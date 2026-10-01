// lib.mjs — pure functions for the newgrad-swe-bigsponsor triage.
// No network, no file writes. Everything here is deterministic so the offline
// test can pin it. The composite score is NOT computed here — that is the
// existing scripts/score/role-scorer.mjs, run as a CLI by triage.mjs.

export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input' };

// ── CSV (RFC 4180: quoted fields, doubled quotes, commas/newlines inside quotes) ──
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])));
}

const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : null; };

// ── G1 company match: exact on an uppercase alphanumeric key. No suffix stripping,
//    no fuzzy match: "Meta" must NOT resolve to "META CO" (an unrelated company). ──
export const nameKey = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function buildIndex(rows) {
  const idx = new Map();
  for (const r of rows) {
    const k = nameKey(r.company_name);
    if (!k) continue;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push(r);
  }
  return idx;
}

export function matchCompany(idx, name) {
  const hits = idx.get(nameKey(name)) || [];
  if (hits.length === 1) return { status: 'ok', row: hits[0] };
  if (hits.length === 0) return { status: 'missing', reason: 'no-company-match', candidates: [] };
  return { status: 'missing', reason: 'ambiguous-company-match', candidates: hits.map((h) => h.company_name) };
}

// ── Sponsored-title evidence. The CSV stores a Python-style list literal of the
//    company's TOP sponsored titles (no per-title counts). ──
export function parseTitleList(s) {
  if (!s || !String(s).trim()) return [];
  return [...String(s).matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((m) => (m[1] ?? m[2]).trim()).filter(Boolean);
}

// Keyword rule v0.1 (a rule I chose — see recipe §Title rule; it WILL misread some titles).
const SWE = /\b(software|developer|swe|sde|back-?end|front-?end|full[- ]?stack|programmer)\b/i;
const SENIOR = /\b(senior|sr|staff|principal|lead|manager|director|architect|head|vp|iii|iv|v|[3-9])\b/i;
const MID = /\b(ii|2)\b/i;
const ENTRY = /\b(i|1|junior|jr|associate|new ?grad|entry|graduate|university|early career)\b/i;

export function classifyTitle(t) {
  if (!SWE.test(t)) return 'non-swe';
  if (SENIOR.test(t)) return 'senior';
  if (MID.test(t)) return 'mid';
  if (ENTRY.test(t)) return 'entry';
  return 'unlevelled'; // plain "Software Engineer": level not stated
}

// Tier → p mapping for ENTRY-LEVEL SWE sponsorship (recipe §Tier map, [TODO: DEFINE] closed there).
export const TIER_MAP = {
  'entry-explicit': { tier: 'Proven', p: 0.9 },
  'unlevelled-swe': { tier: 'Likely', p: 0.6 },
  'senior-only-swe': { tier: 'Unknown', p: 0.3 },
  'no-swe-title': { tier: 'Unknown', p: 0.15 },
};

export function sponsorshipEvidence(row, minApprovals) {
  const approvals = num(row['Total Approvals']);
  const denials = num(row['Total Denials']);
  const rate = num(row['Approval_Rate']);
  const titles = parseTitleList(row.top_job_titles_sponsored);
  const classified = titles.map((t) => ({ title: t, class: classifyTitle(t) }));
  const evidence = {
    total_approvals: { value: approvals, source: SRC.record },
    total_denials: { value: denials, source: SRC.record },
    approval_rate: { value: rate, source: SRC.record },
    top_titles: { value: titles, source: SRC.record },
    title_classes: { value: classified, source: SRC.input, rule: 'keyword rule v0.1 (lib.mjs classifyTitle)' },
  };
  if (approvals == null || approvals < minApprovals)
    return { status: 'missing', reason: 'below-big-sponsor-threshold', evidence };
  if (!titles.length) return { status: 'missing', reason: 'no-title-evidence', evidence };
  const has = (c) => classified.some((x) => x.class === c);
  const bucket = has('entry') ? 'entry-explicit'
    : has('unlevelled') ? 'unlevelled-swe'
    : (has('mid') || has('senior')) ? 'senior-only-swe'
    : 'no-swe-title';
  const { tier, p } = TIER_MAP[bucket];
  return { status: 'ok', bucket, tier, p, evidence };
}

// ── Dates (UTC, ISO yyyy-mm-dd) ──
const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function parseISO(s) {
  if (typeof s !== 'string' || !ISO.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}
export const isoOf = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
export const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000);

// ── Persona validation: fail clearly, never default a missing date. ──
const REQUIRED = ['program_end_date', 'opt_start_date', 'unemployment_limit_days', 'unemployment_days_used',
  'start_buffer_days', 'hiring_lag_days', 'big_sponsor_min_approvals'];

export function validatePersona(p) {
  const errors = [];
  for (const k of REQUIRED) if (p?.[k]?.value == null) errors.push(`persona.${k}.value is missing`);
  for (const k of ['program_end_date', 'opt_start_date'])
    if (p?.[k]?.value != null && !parseISO(p[k].value)) errors.push(`persona.${k}.value is not a valid yyyy-mm-dd date: ${p[k].value}`);
  if (!errors.length) {
    const end = parseISO(p.program_end_date.value), start = parseISO(p.opt_start_date.value);
    const d = daysBetween(end, start);
    if (d < 0 || d > 60) errors.push(`persona.opt_start_date must fall 0–60 days after program_end_date (got ${d} days)`);
  }
  return errors;
}

// G0: the latest date the persona can start work without exceeding the unemployment limit.
export function unemploymentDeadline(p, today) {
  const optStart = parseISO(p.opt_start_date.value);
  const clockFrom = today > optStart ? today : optStart;
  const remaining = p.unemployment_limit_days.value - p.unemployment_days_used.value;
  return { deadline: addDays(clockFrom, remaining), remaining, clockFrom, optStart };
}

// G3 timeline factor. Start date is the posting's stated date (your-input, read off the posting)
// or, when absent, an ESTIMATE = max(today + hiring_lag, OPT start) — labeled as an estimate.
export function timelineFactor(p, posting, today) {
  const { deadline, optStart } = unemploymentDeadline(p, today);
  const buffer = p.start_buffer_days.value;
  let start, basis;
  const stated = posting.start_date?.value;
  if (stated != null) {
    start = parseISO(stated);
    if (!start) return { status: 'missing', reason: 'invalid-start-date', detail: String(stated) };
    basis = 'stated-on-posting';
  } else {
    const est = addDays(today, p.hiring_lag_days.value);
    start = est > optStart ? est : optStart;
    basis = `estimated: max(today + ${p.hiring_lag_days.value}d hiring lag, OPT start)`;
  }
  let factor, why;
  if (start > deadline) { factor = 0.0; why = `start ${isoOf(start)} is after the unemployment deadline ${isoOf(deadline)}`; }
  else if (start < optStart) { factor = 0.5; why = `start ${isoOf(start)} is before OPT start ${isoOf(optStart)} — employer would have to defer`; }
  else if (start > addDays(deadline, -buffer)) { factor = 0.5; why = `start ${isoOf(start)} is within the ${buffer}-day buffer before ${isoOf(deadline)}`; }
  else { factor = 1.0; why = `start ${isoOf(start)} is inside [${isoOf(optStart)}, ${isoOf(addDays(deadline, -buffer))}]`; }
  return { status: 'ok', factor, start_date: isoOf(start), basis, deadline: isoOf(deadline), why, source: SRC.input };
}

// G2 liveness: only an ats:liveness run with a date counts as a record.
export function livenessGate(posting) {
  const l = posting.liveness;
  if (!l || !l.status || l.status === 'unchecked') return { status: 'missing', reason: 'liveness-unchecked' };
  if (!['active', 'expired'].includes(l.status)) return { status: 'missing', reason: 'liveness-unknown-status', detail: l.status };
  const isRecord = l.method === 'npm run ats:liveness' && !!parseISO(l.checked_on);
  return { status: 'ok', factor: l.status === 'active' ? 1.0 : 0.0, source: isRecord ? SRC.record : SRC.input,
    checked_on: l.checked_on ?? null, method: l.method ?? null };
}

// Next action per decision — the link to the 3-3-2 day.
export function nextAction(scored, role) {
  const gatedBy = /gated: (\w+)/.exec(scored.reason || '')?.[1];
  const strongTier = ['Proven', 'Likely'].includes(role.sponsorship?.tier);
  if (scored.recommendation === 'Apply') return { action: 'tailor-and-apply', block: '2h research/apply' };
  if (scored.recommendation === 'Consider') return { action: 'network-first', block: '3h networking' };
  if (gatedBy === 'timeline' && strongTier) return { action: 'network-dont-apply', block: '3h networking', note: 'strong entry-level sponsor, start date does not fit OPT window — ask about an earlier or off-cycle start' };
  return { action: 'skip', block: null };
}
