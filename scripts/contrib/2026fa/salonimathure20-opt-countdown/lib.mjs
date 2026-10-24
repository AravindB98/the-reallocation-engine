// lib.mjs — pure functions for the opt-countdown prototype.
// No network, no file writes. Every value returned carries a source label:
//   record          — read from a repo data file or a checker's saved output
//   model-judgment  — an AI's bounded judgment, reviewed by the human
//   your-input      — a value the person (or their stated assumption) supplied
// Nothing here invents a number: a missing input returns status "missing" with
// a reason code, and the caller blocks the role instead of scoring it.

export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input' };
export const LABELS = new Set(Object.values(SRC));

// Sponsorship mapping (DEFINE closed in the recipe, §Sponsorship mapping).
// Tier cut-offs are the SDD's (docs/chapter-research-map.md: Proven ≥ 0.65,
// Likely ≥ 0.35). VOLUME_SATURATION is this recipe's own choice.
export const VOLUME_SATURATION = 20;
export const TIERS = [['Proven', 0.65], ['Likely', 0.35], ['Possible', 0]];

// Timeline factor: full credit with ≥ 30 days of slack, 0.5 at zero slack,
// closed gate (0) when hiring cannot finish inside the runway.
export const SLACK_FULL_CREDIT_DAYS = 30;

// ── CSV (RFC-4180-ish: quoted fields, doubled quotes, commas/newlines in quotes)
export function parseCsv(text) {
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
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export function indexBy(rows, key) {
  const m = new Map();
  for (const r of rows) m.set(String(r[key]).trim().toUpperCase(), r);
  return m;
}

const numOrNull = (s) => (s === '' || s == null || !isFinite(Number(s)) ? null : Number(s));

// ── Sponsorship from one 80 Days CSV row (exact company_name match only).
export function sponsorshipFromRow(row, targetKeywords = []) {
  if (!row) return { status: 'missing', reason: 'no-company-row' };
  const approvals = numOrNull(row['Total Approvals']);
  const denials = numOrNull(row['Total Denials']);
  const rate = numOrNull(row['Approval_Rate']);
  if (approvals == null || rate == null) {
    // Blank in the mapped CSV means "no H-1B record was joined to this name",
    // not "this company never sponsors". Unknown, not None.
    return { status: 'missing', reason: 'no-h1b-record-joined', tier: 'Unknown' };
  }
  const p = Number(((rate / 100) * Math.min(1, approvals / VOLUME_SATURATION)).toFixed(3));
  const tier = TIERS.find(([, floor]) => p >= floor)[0];
  const titles = row.top_job_titles_sponsored || '';
  const matched = targetKeywords.filter((k) => titles.toLowerCase().includes(k.toLowerCase()));
  return {
    status: 'ok', p, tier, source: SRC.record,
    derivation: `(Approval_Rate ${rate.toFixed(2)} / 100) × min(1, Total Approvals ${approvals} / ${VOLUME_SATURATION})`,
    record: { total_approvals: approvals, total_denials: denials, approval_rate_pct: Number(rate.toFixed(2)),
      median_salary_offered: numOrNull(row.median_salary_offered), top_job_titles_sponsored: titles },
    title_keyword_match: { matched, source: SRC.record },
    odd_count_check: approvals % 2 === 0 && (denials ?? 0) % 2 === 0 ? 'both-even' : 'has-odd',
  };
}

// ── Funding context (not a scorer vote — the scorer has no funding term).
export function fundingFromRow(row) {
  if (!row || !row.latest_funding_date) return { status: 'missing', reason: row ? 'no-funding-date' : 'no-company-row' };
  return { status: 'ok', source: SRC.record, latest_funding_date: row.latest_funding_date,
    latest_funding_amount: numOrNull(row.latest_funding_amount), latest_funding_stage: row.latest_funding_stage || null };
}

// ── Role-quality context from the BLS/O*NET compact table (exact O*NET code).
// Weight 0 in the scorer (DOMAIN.md known gap 3) — reported, never scored.
export function roleQualityFromRow(row, socCode) {
  if (!row) return { status: 'missing', reason: 'no-occupation-row', soc: socCode };
  return { status: 'ok', source: SRC.record, soc: socCode, title: row.title,
    national_median_wage: numOrNull(row.annual_median_wage), oews_year: row.oews_year,
    cognitive_pivot_score: numOrNull(row.cognitive_pivot_score),
    cognitive_pivot_status: numOrNull(row.cognitive_pivot_score) == null ? 'missing-in-table' : 'ok' };
}

// ── Runway: days the person can still spend searching before a job must start.
const DAY = 86400000;
export const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

export function runway(persona) {
  const v = persona.visa || {};
  const asOf = persona.as_of;
  for (const [k, val] of [['as_of', asOf], ['visa.opt_end_date', v.opt_end_date]])
    if (!val || isNaN(Date.parse(val))) return { status: 'halt', reason: `missing-or-invalid-${k}` };
  for (const k of ['unemployment_ceiling', 'unemployment_days_used', 'buffer_target'])
    if (typeof v[k] !== 'number') return { status: 'halt', reason: `missing-visa.${k}` };
  const daysToOptEnd = daysBetween(asOf, v.opt_end_date);
  if (daysToOptEnd <= 0) return { status: 'halt', reason: 'opt-end-date-already-past', days_to_opt_end: daysToOptEnd };
  const unemploymentLeft = v.unemployment_ceiling - v.unemployment_days_used - v.buffer_target;
  if (unemploymentLeft <= 0) return { status: 'halt', reason: 'unemployment-clock-exhausted-after-buffer', unemployment_left_after_buffer: unemploymentLeft };
  const days = Math.min(daysToOptEnd, unemploymentLeft);
  const startBy = new Date(Date.parse(asOf) + days * DAY).toISOString().slice(0, 10);
  return { status: 'ok', source: SRC.input, days, start_by: startBy,
    binding: unemploymentLeft <= daysToOptEnd ? 'unemployment-clock' : 'opt-end-date',
    days_to_opt_end: daysToOptEnd, unemployment_left_after_buffer: unemploymentLeft };
}

export function timelineFactor(runwayDays, hiringLagDays) {
  if (typeof hiringLagDays !== 'number' || hiringLagDays < 0) return { status: 'missing', reason: 'no-hiring-lag-assumption' };
  const slack = runwayDays - hiringLagDays;
  const factor = slack < 0 ? 0 : Math.min(1, 0.5 + slack / (2 * SLACK_FULL_CREDIT_DAYS));
  return { status: 'ok', factor: Number(factor.toFixed(3)), slack_days: slack, source: SRC.input };
}

// ── Liveness: parse the saved stdout of `npm run ats:liveness -- --file urls.txt`.
export function parseLivenessOutput(text) {
  const m = new Map();
  for (const line of text.split('\n')) {
    const hit = line.match(/^\S+\s+(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (hit) m.set(hit[2], hit[1]);
  }
  return m;
}

// Saved output of the documented curl loop: "<http_code> <board>/<job_id>" per line.
export function parseGreenhouseApi(text) {
  const m = new Map();
  for (const line of text.split('\n')) {
    const hit = line.trim().match(/^(\d{3})\s+([\w-]+\/\d+)$/);
    if (hit) m.set(hit[2], Number(hit[1]));
  }
  return m;
}

// Gate rule (recipe §Gate G3): the Greenhouse API status is the stronger
// record when present — the browser checker reads a dead job that redirects
// to the careers page as "active" (observed 2026-10-03).
export function livenessGate(url, checker, greenhouseKey, api) {
  const c = url ? checker.get(url) : undefined;
  const a = greenhouseKey ? api.get(greenhouseKey) : undefined;
  const flags = [];
  if (a !== undefined) {
    if (c && ((c === 'active') !== (a === 200))) flags.push(`checker said "${c}", Greenhouse API said ${a}`);
    if (a === 200) return { status: 'ok', factor: 1.0, source: SRC.record, basis: `greenhouse-api ${a}; checker ${c ?? 'not run'}`, flags };
    if (a === 404) return { status: 'ok', factor: 0.0, source: SRC.record, basis: `greenhouse-api 404; checker ${c ?? 'not run'}`, flags };
    return { status: 'missing', reason: `greenhouse-api-unexpected-${a}`, flags };
  }
  if (!c) return { status: 'missing', reason: 'liveness-unchecked', flags };
  if (c === 'active') return { status: 'ok', factor: 1.0, source: SRC.record, basis: 'checker active (single source)',
    flags: ['single-source liveness: checker can read a redirect-to-careers-page as active'] };
  if (c === 'expired') return { status: 'ok', factor: 0.0, source: SRC.record, basis: 'checker expired', flags };
  return { status: 'missing', reason: 'liveness-uncertain', flags };
}

// ── Next action per outcome (the 3-3-2 hand-off).
export function nextAction(outcome) {
  const { recommendation, blocked, gated_by } = outcome;
  if (blocked) return { bucket: 'human-check', action: `Resolve before scoring: ${blocked.join(', ')}`, hours: '2 (research)' };
  if (recommendation === 'Apply') return { bucket: 'apply', action: 'Tailor and submit this week; ask one contact for a referral first', hours: '2 (apply) + 3 (network)' };
  if (recommendation === 'Consider') return { bucket: 'network-first', action: 'Informational chat with someone on the team before applying', hours: '3 (network)' };
  if (gated_by === 'timeline') return { bucket: 'network-not-apply', action: 'Sponsor fits but hiring is slower than your runway: keep warm, revisit after bridge employment starts', hours: '3 (network)' };
  if (gated_by === 'liveness') return { bucket: 'skip', action: 'Dead or ghost posting: do not apply', hours: '0' };
  if (gated_by === 'sponsorship-policy') return { bucket: 'skip', action: 'Posting says it will not sponsor: do not apply here; the employer may still sponsor other roles', hours: '0' };
  return { bucket: 'skip', action: 'Skip: time is better spent elsewhere', hours: '0' };
}

// ── v0.2 ─────────────────────────────────────────────────────────────────────
// Posting evidence: facts read from a posting's own text, saved by
// posting-evidence.mjs (the only network step). The text is read, never
// judged: a phrase either matches or it does not.

// Liveness evidence older than this (days before as_of) is stale and blocks
// the role. Found in the 2026-10-21 re-check: 2 of the 6 postings that were
// live on 2026-10-03, including the only Apply, had closed within 18 days.
export const MAX_EVIDENCE_AGE_DAYS = 2;
// A posting open longer than this is flagged (evergreen or ghost requisition).
export const LONG_OPEN_DAYS = 90;

// Explicit "we will not sponsor this role" language. Kept narrow on purpose:
// a bare /sponsor/ also matches "sponsored professional development" (Formlabs).
export const SPONSORSHIP_EXCLUSION_PATTERNS = [
  /not (?:be )?eligible for (?:any )?(?:immigration |visa |h-?1b )?sponsorship/i,
  /(?:unable|not able) to (?:offer|provide|support) (?:any )?(?:immigration |visa |h-?1b )?sponsorship/i,
  /(?:(?:does|do|will|can|is|are) not|cannot|can't|won't|don't|doesn't) (?:currently )?(?:offer|provide|support) (?:any )?(?:immigration |visa |h-?1b )?sponsorship/i,
  /(?:(?:does|do|will|can|is|are) not|cannot|can't|won't|don't|doesn't|unable to) (?:currently )?sponsor (?:any )?(?:applicants|candidates|employment visas|visas|h-?1b)/i,
  /without (?:the )?(?:need|requirement) for (?:current or future |now or in the future )?(?:immigration |visa )?sponsorship/i,
  /no (?:immigration |visa |h-?1b )?sponsorship (?:is |will be )?(?:available|offered|provided)/i,
  /(?:u\.?s\.? citizenship|us citizen(?:ship)?) (?:is )?required/i,
];

export function htmlToText(html = '') {
  const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&nbsp;/g, ' ').replace(/&mdash;|&ndash;/g, '-').replace(/&amp;/g, '&');
  return dec(dec(html)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const clip = (s, n = 160) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function extractPostingFacts(text = '') {
  const excl = SPONSORSHIP_EXCLUSION_PATTERNS.map((re) => text.match(re)).find(Boolean);
  const yrs = text.match(/(\d{1,2})\s*(?:\+|[-–—]|to)?\s*(?:\d{1,2}\s*)?\+?\s*years?(?: of)?[^.]{0,60}?experience/i);
  const pay = text.match(/\$\s?\d{2,3},\d{3}(?:\s*(?:[-–—]|to)\s*\$?\s?\d{2,3},\d{3})?/);
  return {
    sponsorship_exclusion: excl ? { matched: true, phrase: clip(excl[0]) } : { matched: false },
    years_required: yrs ? { min: Number(yrs[1]), phrase: clip(yrs[0]) } : { min: null },
    pay_range_text: pay ? pay[0].replace(/\s+/g, ' ') : null,
  };
}

// Liveness from saved posting evidence, with a freshness check against as_of.
export function livenessFromEvidence(ev, asOf, checker, url) {
  if (!ev) return null; // caller falls back to the v0.1 rule
  const c = url ? checker.get(url) : undefined;
  const flags = [];
  const age = daysBetween(ev.checked_at.slice(0, 10), asOf);
  if (age > MAX_EVIDENCE_AGE_DAYS || age < 0)
    return { status: 'missing', reason: `liveness-stale (checked ${ev.checked_at.slice(0, 10)}, ${age} d before as_of; max ${MAX_EVIDENCE_AGE_DAYS})`, flags };
  if (c && ((c === 'active') !== (ev.http_status === 200))) flags.push(`checker said "${c}", Greenhouse API said ${ev.http_status}`);
  const basis = `greenhouse-api ${ev.http_status} at ${ev.checked_at}; checker ${c ?? 'not run'}`;
  if (ev.http_status === 200) return { status: 'ok', factor: 1.0, source: SRC.record, basis, checked_at: ev.checked_at, flags };
  if (ev.http_status === 404) return { status: 'ok', factor: 0.0, source: SRC.record, basis, checked_at: ev.checked_at, flags };
  return { status: 'missing', reason: `greenhouse-api-unexpected-${ev.http_status}`, flags };
}

export function postingAge(ev, asOf) {
  if (!ev?.first_published) return { status: 'missing', reason: 'no-first-published' };
  const days = daysBetween(ev.first_published.slice(0, 10), asOf);
  return { status: 'ok', source: SRC.record, first_published: ev.first_published.slice(0, 10), days_open: days,
    long_open: days > LONG_OPEN_DAYS };
}

// Gate G2b: the posting itself says it will not sponsor. A company's H-1B
// history cannot outvote the posting's own words, so the role is not scored.
export function sponsorshipPolicyGate(ev) {
  if (!ev || ev.http_status !== 200) return { status: 'unchecked' };
  const x = ev.facts?.sponsorship_exclusion;
  if (x?.matched) return { status: 'closed', source: SRC.record, phrase: x.phrase };
  return { status: 'open', source: SRC.record, note: 'no exclusion phrase found (absence is not a promise to sponsor)' };
}

// Experience gap: years the posting asks for (record) vs. the person's (your-input).
export function experienceGap(ev, personaYears) {
  if (!ev?.facts) return { status: 'missing', reason: 'no-posting-text' }; // 404 or never fetched
  const min = ev.facts.years_required?.min;
  if (min == null) return { status: 'missing', reason: 'no-years-phrase-in-posting' };
  if (typeof personaYears !== 'number') return { status: 'missing', reason: 'no-persona-experience-years' };
  return { status: 'ok', required_min: min, persona_years: personaYears, gap: min - personaYears,
    phrase: ev.facts.years_required.phrase, source: `${SRC.record} vs ${SRC.input}` };
}

// Alias table: posting name → CSV name, each with a basis (your-input).
export function aliasFor(company, aliases = []) {
  return aliases.find((a) => a.posting_name.toUpperCase() === company.toUpperCase()) || null;
}
