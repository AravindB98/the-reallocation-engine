// lib.mjs — pure functions for the decgrad-swe1-sponsor-level triage.
// No network, no file writes. Every function either returns a labeled value
// or a { missing: <reason-code> } object — it never fills a gap with a guess.
//
// Labels (SNICKERDOODLE P3 / role-scorer SRC):
//   record         — read from a shipped data file, or derived from one by a fixed rule
//   your-input     — typed by the person (scenario/persona file), including assumptions
//   model-judgment — produced by an AI; this prototype produces NONE (see README)

export const LABEL = { record: 'record', input: 'your-input', model: 'model-judgment' };

// ── CSV (RFC 4180: quoted fields, doubled quotes, newlines inside quotes) ──
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  return body.map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ''])));
}

// ── exact company-name normalization (no fuzzy matching, by design) ──
const SUFFIX = /\b(INC|INCORPORATED|LLC|L L C|CORP|CORPORATION|CO|COMPANY|LTD|LIMITED|LP|L P|PBC|PLC)\b/g;
export function normalizeName(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// G1 — resolve a candidate company to exactly one 80 Days row.
// State is used only to break a tie between identically-normalized names.
export function resolveCompany(rows, name, state) {
  const key = normalizeName(name);
  if (!key) return { missing: 'no-company-match', detail: 'empty company name' };
  let hits = rows.filter((r) => normalizeName(r.company_name) === key);
  if (hits.length === 0) return { missing: 'no-company-match', detail: `no row normalizes to "${key}"` };
  if (hits.length > 1 && state) {
    const inState = hits.filter((r) => (r.state || '').toUpperCase() === state.toUpperCase());
    if (inState.length === 1) hits = inState;
  }
  if (hits.length > 1) {
    return { missing: 'ambiguous-company-match', detail: `${hits.length} rows normalize to "${key}": ${hits.map((h) => `${h.company_name} (${h.state})`).join('; ')}` };
  }
  return { row: hits[0], key };
}

// top_job_titles_sponsored is a Python-literal list: "['Software Engineer', \"Lead's Title\"]"
export function parseTitleList(s) {
  const out = [];
  for (const m of String(s || '').matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    out.push((m[1] ?? m[2]).trim());
  }
  return out;
}

// SOC 15-1252 family. QA/test titles are SOC 15-1253 and are excluded on purpose.
export const SWE_FAMILY = /\b(software|developer|programmer|sde|full[- ]?stack|back[- ]?end|front[- ]?end)\b/i;
export const NOT_15_1252 = /\b(test|tester|testing|qa|quality)\b/i;
// Above the level a ~24-month-experience SWE I/II candidate is hired at.
export const ABOVE_LEVEL = /\b(senior|sr|staff|principal|lead|manager|director|architect|head|chief|vp|president|iii|iv|v|3|4)\b/i;

// "Software Engineering Manager" is SOC 11-3021 (management), not 15-1252. A title that
// names a management role and no engineer/developer/programmer is not counted as SWE.
// (Found in the 2026-10-01 worked run: it had tiered Ginkgo Bioworks as "senior-only SWE".)
export const MANAGEMENT = /\b(manager|director|head|vp|chief|president)\b/i;
export const IC_WORD = /\b(engineer|developer|programmer|sde)\b/i;

export function classifyTitle(t) {
  if (!SWE_FAMILY.test(t) || NOT_15_1252.test(t)) return 'other';
  if (MANAGEMENT.test(t) && !IC_WORD.test(t)) return 'other';
  return ABOVE_LEVEL.test(t) ? 'swe-above-level' : 'swe-at-level';
}

// G2 + tier. Blank approvals = the row never joined to a DOL/USCIS record. That is
// ABSENCE OF A RECORD, not a record of zero, so it is NOT scored.
export function sponsorshipTier(row, params) {
  const raw = row['Total Approvals'];
  if (raw === undefined || String(raw).trim() === '') {
    return { missing: 'no-sponsorship-record', detail: `"${row.company_name}" is in the CSV but has no H-1B approvals field (no DOL/USCIS join)` };
  }
  const approvals = Number(raw);
  if (!Number.isFinite(approvals)) return { missing: 'no-sponsorship-record', detail: `unparseable Total Approvals "${raw}"` };
  const titles = parseTitleList(row.top_job_titles_sponsored);
  const classes = titles.map((t) => ({ title: t, class: classifyTitle(t) }));
  const atLevel = classes.filter((c) => c.class === 'swe-at-level').map((c) => c.title);
  const above = classes.filter((c) => c.class === 'swe-above-level').map((c) => c.title);

  let tier, basis;
  if (approvals === 0) { tier = 'None'; basis = 'approvals recorded as 0'; }
  else if (atLevel.length && approvals >= params.min_approvals_for_proven) { tier = 'Proven'; basis = `at-level SWE title sponsored and approvals ${approvals} ≥ ${params.min_approvals_for_proven}`; }
  else if (atLevel.length) { tier = 'Likely'; basis = `at-level SWE title sponsored but thin record (approvals ${approvals} < ${params.min_approvals_for_proven})`; }
  else if (above.length) { tier = 'Likely'; basis = 'sponsors SWE titles, but only above this candidate\'s level'; }
  else { tier = 'Possible'; basis = 'sponsors H-1Bs, but no SOC 15-1252 title in the top-titles list'; }

  const p = params.tier_p[tier];
  if (typeof p !== 'number') return { missing: 'no-tier-mapping', detail: `tier_p has no value for "${tier}"` };
  return {
    tier, basis, p,
    approvals, denials: row['Total Denials'] === '' ? null : Number(row['Total Denials']),
    approval_rate: row.Approval_Rate === '' ? null : Number(row.Approval_Rate),
    titles_listed: titles.length, at_level_titles: atLevel, above_level_titles: above,
  };
}

// ── liveness: parse the saved stdout of `npm run ats:liveness -- <urls…>` ──
// Lines look like "✅ active     <url>", "❌ expired    <url>", "⚠️ uncertain  <url>".
export function parseLivenessLog(text) {
  const byUrl = new Map();
  const meta = {};
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m0 = line.match(/^#\s*([a-z_]+):\s*(.+)$/i);
    if (m0) { meta[m0[1]] = m0[2].trim(); continue; }
    const m = line.match(/(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (!m) continue;
    const next = lines[i + 1] || '';
    const reason = m[1] !== 'active' && /^\s{6,}\S/.test(next) ? next.trim() : null;
    byUrl.set(m[2], { result: m[1], reason });
  }
  return { byUrl, meta };
}

export function livenessFor(parsed, url) {
  if (!url) return { missing: 'no-liveness-record', detail: 'role has no posting_url' };
  const hit = parsed.byUrl.get(url);
  if (!hit) return { missing: 'no-liveness-record', detail: `URL not in the saved ats:liveness log` };
  if (hit.result === 'uncertain') return { missing: 'liveness-uncertain', detail: hit.reason || 'checker returned uncertain — a human must open the posting' };
  return { factor: hit.result === 'active' ? 1.0 : 0.0, result: hit.result, reason: hit.reason };
}

// ── timeline gate for a December graduate on post-completion OPT ──
const DAY = 86400000;
const d = (s) => { const t = Date.parse(`${s}T00:00:00Z`); if (!Number.isFinite(t)) throw new Error(`bad date "${s}"`); return t; };
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const ym = (s) => String(s).slice(0, 7);

export function timelineFactor(persona, role, params, asOf) {
  const out = { inputs: {}, closures: [], flags: [] };
  const optStart = d(persona.opt_start_date);
  const used = persona.unemployment_days_used || 0;
  const remaining = persona.unemployment_ceiling_days - used - (persona.buffer_days || 0);
  // The clock runs from OPT start, or from today if OPT has already started.
  const clockFrom = Math.max(d(asOf), optStart);
  const deadline = clockFrom + remaining * DAY;
  if (d(asOf) > optStart && used === 0) {
    out.flags.push('as_of is after the OPT start date but unemployment_days_used is 0 — confirm the persona is current; the deadline may be too generous');
  }
  out.inputs = {
    as_of: asOf, opt_start_date: persona.opt_start_date, unemployment_ceiling_days: persona.unemployment_ceiling_days,
    unemployment_days_used: persona.unemployment_days_used || 0, buffer_days: persona.buffer_days || 0,
    hiring_lag_days: role.hiring_lag_days ?? params.default_hiring_lag_days,
    hiring_lag_source: role.hiring_lag_days == null ? 'scenario default (assumption)' : 'role-specific (your-input)',
    comfort_days: params.comfort_days,
  };

  // eligibility checks read from the posting text by the person (your-input)
  const gw = role.posting?.grad_window;
  if (gw && (ym(persona.program_end_date) < ym(gw.earliest) || ym(persona.program_end_date) > ym(gw.latest))) {
    out.closures.push(`grad-window-excludes: posting accepts ${gw.earliest}…${gw.latest}, program ends ${ym(persona.program_end_date)}`);
  }
  const cap = role.posting?.experience_cap_months;
  if (cap != null && persona.prior_experience_months > cap) {
    out.closures.push(`experience-cap-excludes: posting caps prior experience at ${cap} months, candidate has ${persona.prior_experience_months}`);
  }
  const fixedStart = role.posting?.start_date ? d(role.posting.start_date) : null;
  if (fixedStart != null && fixedStart < optStart) {
    out.closures.push(`start-before-work-authorization: posting start ${role.posting.start_date} is before OPT start ${persona.opt_start_date}`);
  }

  const lagStart = d(asOf) + out.inputs.hiring_lag_days * DAY;
  const expected = Math.max(fixedStart ?? lagStart, optStart);
  const slack = Math.round((deadline - expected) / DAY);
  out.expected_start = iso(expected);
  out.unemployment_deadline = iso(deadline);
  out.slack_days = slack;
  if (slack <= 0) out.closures.push(`unemployment-clock-exceeded: expected start ${iso(expected)} is after ${iso(deadline)} (${iso(clockFrom)} + ${remaining} usable days)`);

  if (out.closures.length) { out.factor = 0; return out; }
  out.factor = Number(Math.min(1, slack / params.comfort_days).toFixed(3));
  out.arithmetic = `min(1, slack ${slack}d / comfort ${params.comfort_days}d) = ${out.factor}`;
  return out;
}

// ── report-only context (never enters the scorer) ──
export function formDSampleHits(sampleDocs, key) {
  const hits = [];
  const compact = key.replace(/\s+/g, '').toLowerCase();
  for (const doc of sampleDocs) {
    for (const c of doc.companies || []) {
      const n1 = (c.company?.company_name_normalized || '').toLowerCase();
      const n2 = normalizeName(c.company?.name).replace(/\s+/g, '').toLowerCase();
      if (n1 === compact || n2 === compact) {
        hits.push({ quarter: c.filing?.quarter, date_filed: c.filing?.date_filed, total_amount_sold: c.funding?.total_amount_sold ?? null });
      }
    }
  }
  return hits;
}

// A current posting that says "we will not sponsor" outranks a historical record.
// Routed through the scorer's own override mechanism (decision + documented reason),
// so the machine recommendation stays visible beside it.
export function noSponsorOverride(role, persona) {
  const st = role.posting?.states_no_sponsorship;
  if (!st) return null;
  const needs = !/citizen|permanent|green card/i.test(persona.authorization || '');
  if (!needs) return null;
  return {
    decision: 'Skip',
    reason: `Posting text states no H-1B sponsorship ("${st.quote}", read ${st.read_on}) [your-input]. A historical approval record does not override a current statement.`,
  };
}

export function nextAction(rec, reason, sponsorTier, override) {
  if (override) return 'SKIP THIS POSTING: it says it will not sponsor. The company\'s sponsorship history is real, so if you still want this employer, ask a contact whether the policy is team-specific — during networking hours, not research hours.';
  if (rec === 'Apply') return 'TAILOR: spend a research-and-apply block on this application; ask for a referral during networking hours before submitting.';
  if (rec === 'Consider') return `NETWORK FIRST: resolve the soft spot (${reason}) in a 20-minute informational conversation, then decide.`;
  if (/gated: liveness/.test(reason) && (sponsorTier === 'Proven' || sponsorTier === 'Likely'))
    return 'NETWORK, DON\'T APPLY: the posting is closed but the sponsorship record is real — add the company to the networking list for the next opening.';
  if (/gated: timeline/.test(reason)) return 'SKIP: the timeline does not fit the OPT window; do not spend tailoring time.';
  return 'SKIP: evidence does not justify tailoring time.';
}

export const MISSING_ACTION = {
  'no-company-match': 'HUMAN CHECK: not in the 80 Days CSV — look the employer up on the USCIS H-1B Employer Data Hub by hand before spending time; absence here is not evidence of no sponsorship.',
  'ambiguous-company-match': 'HUMAN CHECK: several CSV rows share this name — add the state, or confirm the entity by its website, then re-run.',
  'no-sponsorship-record': 'HUMAN CHECK: the company is in the CSV but never joined to a DOL/USCIS record — check the USCIS H-1B Employer Data Hub by hand; do NOT treat this as "does not sponsor".',
  'no-liveness-record': 'RUN: npm run ats:liveness -- <posting_url>, save the output, re-run this triage.',
  'liveness-uncertain': 'HUMAN CHECK: open the posting in a browser and confirm it is live; record the result in the liveness log.',
  'no-fit-input': 'YOUR INPUT: read the posting and enter a fit estimate (0–1) with a one-line basis.',
  'no-tier-mapping': 'FIX SCENARIO: tier_p must map every tier to a number.',
};
