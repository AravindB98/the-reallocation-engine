// lib.mjs — pure functions for the healthins-ai-opt recipe (v0.2.0).
// No network, no file writes. Everything here is deterministic so the offline
// test can drive it from fixtures.
//
// Every value this module produces is labeled with one of the engine's three
// source types (SNICKERDOODLE / Ch.11):
//   record          — read from a file or page (the path/URL is carried with it)
//   your-input      — typed by the person, or a rule/threshold the person chose
//   model-judgment  — produced by a model. This recipe calls no model, so
//                     nothing it emits carries this label.

export const SRC = { record: 'record', input: 'your-input', model: 'model-judgment' };

// ── CSV ─────────────────────────────────────────────────────────────────────
// Minimal RFC-4180 reader: quoted fields, doubled quotes, commas and newlines
// inside quotes. The 80 Days CSV needs all three (executive lists are quoted).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// ── entity names ────────────────────────────────────────────────────────────
// Exact match after normalisation only. No prefix or fuzzy matching: "Abridge AI"
// must NOT resolve to "ABRIDGED INC" (a different company in the CSV).
const LEGAL_SUFFIX = /\b(inc|incorporated|llc|l\.l\.c|corp|corporation|co|company|ltd|limited|lp|l\.p|pbc|plc)\b\.?/g;
export function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/&/g, ' and ').replace(LEGAL_SUFFIX, ' ')
    .replace(/[^a-z0-9]/g, '');
}

// "['Software Engineer 2', 'Data Analyst']" (a Python list repr) → array
export function parseTitleList(s) {
  const out = [];
  for (const m of String(s || '').matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) out.push((m[1] ?? m[2]).trim());
  return out.filter(Boolean);
}

// A company's website is the only column that can corroborate "same company"
// across two CSV rows. Host only, no www.
export function websiteHost(w) {
  const s = String(w || '').trim().toLowerCase();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//.test(s) ? s : `https://${s}`);
    return u.hostname.replace(/^www\./, '') || null;
  } catch { return null; }
}

export function buildHostIndex(rows) {
  const m = new Map();
  for (const r of rows) {
    const h = websiteHost(r.website);
    if (!h) continue;
    if (!m.has(h)) m.set(h, []);
    m.get(h).push(r);
  }
  return m;
}

// Other CSV rows that share the matched row's website. A sibling WITH approvals
// means the sponsorship history may sit on a different legal entity than the one
// the name gate picked (Lemonade Inc vs Lemonade Technology Inc), so the role
// is held for a human. A sibling without approvals is shown, not blocking.
// Hosts shared by many rows are too generic to corroborate anything.
export function entitySiblings(row, hostIndex, maxGroup = 6) {
  const host = websiteHost(row?.website);
  if (!host) return { host: null, siblings: [], has_approvals: false, skipped: null };
  const group = hostIndex.get(host) || [];
  if (group.length > maxGroup) return { host, siblings: [], has_approvals: false, skipped: `host shared by ${group.length} rows — too generic to corroborate` };
  const siblings = group.filter((r) => r !== row).map((r) => ({
    company_name: r.company_name, industry: r.industry,
    total_approvals: r['Total Approvals'] === '' ? null : Number(r['Total Approvals']),
    source: SRC.record,
  }));
  return { host, siblings, has_approvals: siblings.some((s) => (s.total_approvals ?? 0) > 0), skipped: null };
}

// Does the board's own name agree with the matched CSV row's website? Equality after dropping the TLD,
// hyphens and case. A mismatch is shown, never a gate: "kin" vs kininsurance.com is a legitimate pair,
// "abridge" vs abridged.com (a different company) is the case this exists for. The name gate checks that a
// claimed company RESOLVES; this is the only mechanical hint that the claim is TRUE.
export function boardCorroboration(slug, website) {
  const host = websiteHost(website);
  if (!slug || !host) return { status: 'unknown', slug: slug || null, host: host || null, source: SRC.record };
  const label = host.split('.').slice(0, -1).join('').replace(/[^a-z0-9]/g, '');
  const s = String(slug).toLowerCase().replace(/[^a-z0-9]/g, '');
  return { status: label === s ? 'match' : 'mismatch', slug, host, source: SRC.record };
}

// ── SOC 15-1252 title proxy (your-input rule) ───────────────────────────────
// The CSV has NO SOC column. The only role signal is top_job_titles_sponsored.
// This regex is a rule the recipe author chose; it is a proxy, not a record.
// The exclusion list exists because medtech "engineer" titles (Quality,
// Manufacturing, Supplier…) are not software work.
export const TITLE_RULE = {
  // AI/ML/NLP count only next to engineer/developer/scientist: a bare "AI" matched
  // "Enterprise Business Operations Manager - AI" on the first run (fixed 2026-10-03).
  include: /software|developer|full[- ]?stack|back[- ]?end|front[- ]?end|machine learning|\b(ai|ml|nlp)\b[^,]*\b(engineer|developer|scientist)|\b(engineer|developer|scientist)\b[^,]*\b(ai|ml|nlp)\b|data engineer|platform engineer|devops|site reliability|mobile engineer|\bios\b|android|scala engineer/i,
  exclude: /quality|manufactur|supplier|sourcing|mechanical|optomechanical|electrical|clinical|process development|industrial|biomedical|sustaining/i,
};
export function titleMatches(title) {
  return TITLE_RULE.include.test(title) && !TITLE_RULE.exclude.test(title);
}

// The same rule decides whether a POSTING is software-type, with extra exclusions
// for engineering that is not 15-1252 (QA and test are 15-1253; field service,
// firmware, hardware and sales engineering are other occupations). A bare
// "Solutions Engineer" already fails TITLE_RULE.include; listing it here also
// excluded "Software Engineer II, Solutions Engineering" (a team suffix) in the
// 2026-10-20 smoke run, so it is not listed. Kept separate
// from TITLE_RULE so the sponsorship tiers do not change when this list does.
export const POSTING_EXCLUDE = /\bqa\b|\bsdet\b|quality assurance|test (automation )?engineer|field service|firmware|hardware|sales engineer|support engineer|\bit (engineer|support|operations)\b/i;
export function postingIsSoftwareType(title) {
  return titleMatches(title) && !POSTING_EXCLUDE.test(title);
}

// Level words the persona excludes before scoring. This persona has no
// professional experience, so a title that asks for it is not viable; the
// list is the person's to edit (persona.exclude_levels). "Member of Technical
// Staff" is a title, not a level, and is not excluded.
export const DEFAULT_EXCLUDE_LEVELS = ['intern', 'senior', 'sr', 'staff', 'principal', 'lead', 'manager', 'director', 'head', 'vp', 'vice president', 'architect', 'distinguished', 'fellow'];
export function levelOf(title, levels = DEFAULT_EXCLUDE_LEVELS) {
  const t = String(title || '');
  for (const w of levels) {
    const re = w === 'staff' ? /(?<!technical\s)\bstaff\b/i : new RegExp(`\\b${w.replace(/\./g, '\\.')}\\b`, 'i');
    if (re.test(t)) return w;
  }
  return null;
}

// ── location (your-input word lists; ambiguous stays ambiguous) ─────────────
const US_STATES = 'al|ak|az|ar|ca|co|ct|de|dc|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy';
const US_PLACE = new RegExp(`\\b(united states|usa|u\\.s\\.a?\\.?|us|nyc|new york|ny office|sf office|san francisco|bay area|silicon valley|mountain view|boston|cambridge|chicago|chi office|seattle|austin|denver|lehi|durham|los angeles|san jose|san diego|san mateo|burlington)\\b|,\\s*(${US_STATES})\\b`, 'i');
const NON_US_PLACE = /\b(india|israel|tlv|tel aviv|london|uk|united kingdom|germany|berlin|munich|france|paris|eu|europe|emea|dach|nordics|bangladesh|dhaka|brazil|rio de janeiro|s[aã]o paulo|mexico|tijuana|canada|toronto|vancouver|tokyo|japan|singapore|australia|sydney|pune|bengaluru|bangalore|hyderabad|mumbai|delhi|gurgaon|noida|chennai|portugal|lisbon|poland|warsaw|spain|madrid|ireland|dublin|netherlands|amsterdam|china|shanghai|beijing|korea|seoul)\b/i;
// us      — an explicit US marker is present (a list offering a US option counts)
// non-us  — an explicit non-US marker and no US marker: OPT cannot be used there
// ambiguous — "Remote", "Hybrid", blank: kept, flagged, a human reads the posting
export function classifyLocation(loc) {
  const s = String(loc || '');
  if (US_PLACE.test(s)) return 'us';
  if (NON_US_PLACE.test(s)) return 'non-us';
  return 'ambiguous';
}

// ── fit and process days: the author's rules, used only when the candidate
//    carries no value of its own. Both are your-input and printed in the log. ──
export const FIT_RULE = [
  { re: /\b(llm|large language|agent|agents|agentic|gen\s?ai|generative|rag|retrieval|prompt)\b/i, p: 0.9, why: 'LLM, agent or retrieval work named in the title' },
  { re: /\b(applied (ai|ml|scientist)|ai engineer|machine learning engineer|ml engineer|nlp|natural language|ai\/ml|ml\/ai|ambient ai|forward deployed)\b/i, p: 0.8, why: 'applied AI or ML engineering named in the title' },
  { re: /\b(machine learning|ml|ai|artificial intelligence)\b/i, p: 0.7, why: 'AI or ML named in the title' },
  { re: /\b(software|back-?end|full[- ]?stack|platform|data) (engineer|developer)|software developer/i, p: 0.5, why: 'general software engineering' },
  { re: /\b(site reliability|sre|devops|infrastructure|mobile|ios|android|front-?end)\b/i, p: 0.4, why: 'adjacent engineering' },
];
export function fitFromTitle(title) {
  for (const r of FIT_RULE) {
    if (r.re.test(String(title || ''))) return { p: r.p, why: r.why, source: SRC.input, rule: 'FIT_RULE in lib.mjs' };
  }
  return null;
}

export function processDaysForBucket(persona, bucket) {
  const d = persona?.process_days_by_bucket?.[bucket];
  if (!Number.isInteger(d) || d < 0) return null;
  return { days: d, basis: `bucket "${bucket}" in persona.process_days_by_bucket (${persona.process_days_source || 'your-input'})` };
}

// ── sponsorship tier (your-input mapping over record inputs) ────────────────
// Thresholds are the author's, stated in config so a reviewer can change them.
export const TIER_RULE = {
  proven_min_approvals: 4,       // raw CSV count; every count in the CSV is even (possible 2× join) — see report
  proven_min_approval_rate: 90,
  likely_min_approvals: 2,
  p: { Proven: 0.9, Likely: 0.6 }, // same p values as data/examples/ch11-roles.json
};

export function sponsorshipEvidence(csvRow, csvPath) {
  if (!csvRow) {
    return { status: 'missing', reason: 'entity-not-found', tier: null, p: null,
      note: 'No exact normalised-name match in the 80 Days CSV. This is NOT evidence of non-sponsorship: it may be a name-resolution miss. A human resolves the entity before any decision.' };
  }
  const approvals = csvRow['Total Approvals'] === '' ? null : Number(csvRow['Total Approvals']);
  const denials = csvRow['Total Denials'] === '' ? null : Number(csvRow['Total Denials']);
  const rate = csvRow.Approval_Rate === '' ? null : Number(csvRow.Approval_Rate);
  const titles = parseTitleList(csvRow.top_job_titles_sponsored);
  const matched = titles.filter(titleMatches);
  const rec = (value) => ({ value, source: SRC.record, file: csvPath });
  const inputs = {
    total_approvals: rec(approvals),
    total_denials: rec(denials),
    approval_rate: rec(rate),
    top_job_titles_sponsored: rec(titles),
    titles_matching_15_1252_rule: { value: matched, source: SRC.input, rule: 'TITLE_RULE in lib.mjs' },
  };
  if (approvals == null || approvals === 0) {
    return { status: 'ok', tier: 'Unknown', tier_source: SRC.input, p: null, inputs,
      note: 'Company is in the CSV but has no H-1B approval record. Unknown, not Avoid: absence from this join is not proof the company refuses to sponsor.' };
  }
  let tier;
  if (approvals >= TIER_RULE.proven_min_approvals && rate != null && rate >= TIER_RULE.proven_min_approval_rate && matched.length > 0) tier = 'Proven';
  else if (approvals >= TIER_RULE.likely_min_approvals) tier = 'Likely';
  else tier = 'Unknown';
  const why = tier === 'Proven' ? 'approvals, approval rate and a 15-1252-like sponsored title all clear the rule'
    : matched.length === 0 ? 'has sponsored, but no sponsored title matches the 15-1252 rule (capped at Likely)'
      : 'has sponsored, but approvals or approval rate below the Proven bar';
  return { status: 'ok', tier, tier_source: SRC.input, p: TIER_RULE.p[tier] ?? null, p_source: SRC.input, inputs, note: why };
}

// ── funding recency (outside the scorer: the scorer has no funding term) ────
export function monthsBetween(a, b) {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

// The CSV only knows funding it has seen. The newest latest_funding_date in the
// file is the data horizon: nothing after it is visible, so a company with an
// older date is "not recent in the dataset", never "stale" (it may have raised since).
export function dataHorizon(rows) {
  let max = null;
  for (const r of rows) {
    const d = parseDate(r.latest_funding_date);
    if (d && (!max || d > max)) max = d;
  }
  return max;
}

export function fundingEvidence(csvRow, csvPath, formDHit, today, recentMonths, horizon = null) {
  const out = { csv: null, form_d_sample: null, recency: 'missing' };
  if (csvRow && csvRow.latest_funding_date) {
    const d = parseDate(csvRow.latest_funding_date);
    out.csv = {
      latest_funding_date: { value: csvRow.latest_funding_date, source: SRC.record, file: csvPath },
      latest_funding_stage: { value: csvRow.latest_funding_stage || null, source: SRC.record, file: csvPath },
      months_since: d ? monthsBetween(d, today) : null, months_since_source: SRC.input,
    };
  }
  if (formDHit) {
    const d = parseDate(formDHit.date_filed);
    out.form_d_sample = {
      date_filed: { value: formDHit.date_filed, source: SRC.record, file: formDHit.file },
      months_since: d ? monthsBetween(d, today) : null, months_since_source: SRC.input,
    };
  }
  const months = [out.csv?.months_since, out.form_d_sample?.months_since].filter((m) => m != null);
  if (months.length) out.recency = Math.min(...months) <= recentMonths ? 'recent' : 'not-recent-in-dataset';
  if (horizon) {
    const gap = monthsBetween(horizon, today);
    out.data_horizon = { date: isoDate(horizon), months_before_today: gap, source: SRC.record, months_source: SRC.input };
    // when the data ends before the recency window even starts, no company can be
    // called recent or not recent: refuse the label instead of defaulting it
    if (gap > recentMonths) out.recency = 'unknown-beyond-horizon';
  }
  out.recency_source = SRC.input;
  out.recency_rule = { recent_if_months_le: recentMonths, source: SRC.input };
  return out;
}

const MON = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
// accepts 2025-09-11 and SEC's 31-MAR-2026; returns null rather than guessing
export function parseDate(s) {
  if (!s) return null;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null;
  }
  m = /^(\d{2})-([A-Z]{3})-(\d{4})$/.exec(String(s).toUpperCase());
  if (m && m[2] in MON) return new Date(Date.UTC(+m[3], MON[m[2]], +m[1]));
  return null;
}

export const isoDate = (d) => d.toISOString().slice(0, 10);
const DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((b - a) / DAY);

// ── persona validation: named failure case "OPT dates unusable" ─────────────
// Throws instead of returning a factor. A timeline gate computed from a bad
// date is the chapter's catastrophic error (Ch.10), so the run stops.
export function validatePersona(p, today) {
  const errs = [];
  const v = p?.visa || {};
  const ead = parseDate(v.ead_start_date);
  if (!ead) errs.push('visa.ead_start_date missing or not YYYY-MM-DD');
  const end = v.auth_end_date ? parseDate(v.auth_end_date) : null;
  if (v.auth_end_date && !end) errs.push('visa.auth_end_date is not a valid YYYY-MM-DD');
  if (end && end < today) errs.push(`visa.auth_end_date ${v.auth_end_date} is already past (today ${isoDate(today)}) — no timeline can be computed`);
  if (ead && end && end <= ead) errs.push('visa.auth_end_date is not after visa.ead_start_date');
  for (const k of ['unemployment_days_used', 'unemployment_ceiling', 'buffer_target_days']) {
    if (!Number.isInteger(v[k]) || v[k] < 0) errs.push(`visa.${k} must be a non-negative integer`);
  }
  if (Number.isInteger(v.unemployment_days_used) && Number.isInteger(v.unemployment_ceiling) && v.unemployment_days_used >= v.unemployment_ceiling)
    errs.push(`unemployment_days_used (${v.unemployment_days_used}) has reached the ceiling (${v.unemployment_ceiling})`);
  if (Number.isInteger(v.buffer_target_days) && Number.isInteger(v.unemployment_ceiling) && v.buffer_target_days >= v.unemployment_ceiling)
    errs.push('buffer_target_days must be smaller than unemployment_ceiling');
  if (!p?.target_soc) errs.push('target_soc missing');
  return errs;
}

// ── timeline gate (your-input formula, proposed — Ch.10 names the inputs but
//    pins no formula) ────────────────────────────────────────────────────────
// expected_start = max(today + process_days, EAD start)   (cannot start before EAD)
// unemployed_at_start = days_used + max(0, expected_start − max(today, EAD start))
// factor = 1                     if unemployed_at_start ≤ ceiling − buffer
//        = (ceiling − u) / buffer if inside the buffer
//        = 0                     if u ≥ ceiling or expected_start > auth_end
export function timelineFactor(visa, processDays, today) {
  if (!Number.isInteger(processDays) || processDays < 0) {
    return { status: 'missing', reason: 'process-days-missing', factor: null };
  }
  const ead = parseDate(visa.ead_start_date);
  const end = visa.auth_end_date ? parseDate(visa.auth_end_date) : addDays(ead, 364);
  const ceiling = visa.unemployment_ceiling;
  const buffer = visa.buffer_target_days;
  const earliest = addDays(today, processDays);
  const start = earliest > ead ? earliest : ead;
  // days_used already covers EAD→today once OPT has started, so count only the
  // days still ahead: from max(today, EAD) to the start. (First version counted
  // from EAD and double-counted — caught by the 2027-02-20 scenario run.)
  const clockFrom = today > ead ? today : ead;
  const u = visa.unemployment_days_used + Math.max(0, daysBetween(clockFrom, start));
  let factor, band;
  if (start > end) { factor = 0; band = 'past-authorization-end'; }
  else if (u >= ceiling) { factor = 0; band = 'past-unemployment-ceiling'; }
  else if (u <= ceiling - buffer) { factor = 1; band = 'comfortable'; }
  else { factor = Number(((ceiling - u) / buffer).toFixed(3)); band = 'inside-buffer'; }
  return {
    status: 'ok', factor, band, source: SRC.input,
    dates: {
      today: isoDate(today), process_days: processDays, earliest_offer_start: isoDate(earliest),
      ead_start: isoDate(ead), expected_start: isoDate(start), auth_end: isoDate(end),
      unemployment_days_at_start: u, ceiling, buffer_target_days: buffer,
      auth_end_source: visa.auth_end_date ? SRC.input : 'your-input (derived: EAD start + 364 days, initial OPT)',
    },
  };
}

// The process-days estimate is the weakest input in the gate (a startup's six
// weeks copied onto an insurer). This asks the estimate-free question instead:
// how long may the hiring loop run before this person's clock gives out?
// Found by walking timelineFactor itself, so it cannot drift from the gate.
// gateZero mirrors CONFIG.gate_zero in scripts/score/role-scorer.mjs (a test
// reads the scorer's source to catch drift).
export function timelineSlack(visa, today, gateZero = 0.05, maxDays = 730) {
  let narrows = null, scorerClosed = null, zero = null;
  for (let p = 0; p <= maxDays; p++) {
    const f = timelineFactor(visa, p, today).factor;
    if (narrows == null && f < 1) narrows = p;
    if (scorerClosed == null && f <= gateZero) scorerClosed = p;
    if (f === 0) { zero = p; break; }
  }
  return { buffer_narrows_at_days: narrows, scorer_gate_closes_at_days: scorerClosed, factor_zero_at_days: zero, gate_zero: gateZero, source: SRC.input };
}

// ── liveness gate ──────────────────────────────────────────────────────────
// The scorer treats a MISSING liveness term as factor 1.0 (role-scorer.mjs:
// `num(role.liveness?.factor) ?? 1`). So an unchecked posting must never reach
// the scorer: it is held back as BLOCKED for a human.
//
// Statuses come from scripts/ats/liveness-browser.mjs: active | expired | uncertain
// (v0.1.0's hand-typed closed | not-found still work). `uncertain` is never a
// factor. Liveness perishes: evidence older than maxAgeDays, or dated after
// the decision day, is not evidence for that day.
//
// A `record` label is earned, not asserted: it needs the repo checker named in
// `method`. Anything else claiming `record` is relabeled your-input.
const REPO_CHECKER = /^scripts\/ats\/(liveness-browser|check-liveness)\.mjs/;
export function livenessGate(l, today = null, maxAgeDays = null) {
  if (!l || !l.status || l.status === 'unchecked') return { status: 'missing', reason: 'liveness-unchecked', factor: null };
  const when = parseDate(l.checked_on);
  if (!when) return { status: 'missing', reason: 'liveness-check-undated', factor: null };
  if (today) {
    if (when > today) return { status: 'missing', reason: 'liveness-dated-after-today', factor: null };
    if (maxAgeDays != null && daysBetween(when, today) > maxAgeDays)
      return { status: 'missing', reason: 'liveness-stale', factor: null, age_days: daysBetween(when, today), max_age_days: maxAgeDays };
  }
  if (l.status === 'uncertain') return { status: 'missing', reason: `liveness-uncertain${l.code ? `:${l.code}` : ''}`, factor: null, detail: l.reason || null };
  const f = { active: 1, closed: 0, 'not-found': 0, expired: 0 }[l.status];
  if (f == null) return { status: 'missing', reason: `liveness-status-unknown:${l.status}`, factor: null };
  const claimsRecord = l.source === SRC.record;
  const earned = claimsRecord && typeof l.method === 'string' && REPO_CHECKER.test(l.method);
  const out = { status: 'ok', factor: f, source: claimsRecord && !earned ? SRC.input : (l.source || SRC.input), checked_on: l.checked_on, method: l.method || null, reason: l.reason || null };
  if (claimsRecord && !earned) out.note = 'claimed record without the repo checker named in method — relabeled your-input';
  return out;
}

// ── next action (the 3-3-2 hand-off) ───────────────────────────────────────
export function nextAction({ blocked, recommendation, gateClosed, tier, fundingRecency, excluded }) {
  if (excluded) return { block: 'skip', action: `Skip — ${excluded}. Nothing to do on this role.`, source: SRC.input };
  if (blocked) return { block: 'human-gate', action: `Resolve the block (${blocked}) before this role is scored.`, source: SRC.input };
  if (gateClosed) return { block: 'reallocate', action: `Drop now — ${gateClosed} gate closed. Move the hours to networking or credibility work.`, source: SRC.input };
  if (recommendation === 'Apply') return { block: '2h apply', action: 'Tailor the application. Ask the recruiter about E-Verify (needed for STEM OPT) before the final round.', source: SRC.input };
  if (recommendation === 'Consider') return { block: '3h network', action: 'Find a contact first; confirm sponsorship for this role type and E-Verify, then decide.', source: SRC.input };
  if (tier === 'Unknown' && fundingRecency === 'recent') return { block: '3h network', action: 'Funded but no sponsorship record: informational chat to ask directly. Do not apply cold.', source: SRC.input };
  return { block: 'skip', action: 'Skip. Time is better spent elsewhere.', source: SRC.input };
}
