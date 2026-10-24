// lib.mjs — pure functions for the OPT-window countdown prototype.
// No network, no file writes. Everything here is unit-tested from fixtures.
//
// Labels used on every value (SNICKERDOODLE / Ch.11 convention):
//   record          — read directly from a repo data file or a tool's saved output
//   your-input      — a date, rating, or rule the student supplied
//   model-judgment  — produced by an LLM. THIS PROTOTYPE CALLS NO MODEL, so it
//                     emits none; the label exists so the report can say so.

export const LABEL = { record: 'record', input: 'your-input', model: 'model-judgment' };

// ───────────────────────── CSV (RFC-4180, quoted fields) ─────────────────────────
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, k) => [h, r[k] ?? ''])));
}

// ───────────────────────── dates ─────────────────────────
const DAY = 86400000;
export function parseDate(s, what) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`${what}: expected a YYYY-MM-DD date, got ${JSON.stringify(s)}`);
  }
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw new Error(`${what}: not a real calendar date: ${s}`);
  return d;
}
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);

// ───────────────────────── G0: the OPT window (run-level) ─────────────────────────
// Regulatory figures are carried as your-input because this prototype did not read
// them from a regulation; the student confirms them with her DSO. Defaults:
//   OPT may start up to 60 days after program end; 90 days of unemployment on post-completion OPT.
export function optWindow(profile, asOf) {
  const programEnd = parseDate(profile.program_end_date, 'profile.program_end_date');
  const optStart = parseDate(profile.opt_start_date, 'profile.opt_start_date');
  const maxLag = profile.opt_start_max_days_after_program_end ?? 60;
  const allowance = profile.unemployment_days_allowed ?? 90;
  if (optStart < programEnd) {
    throw new GateError('G0', `OPT start ${iso(optStart)} is before program end ${iso(programEnd)} — post-completion OPT cannot start before the program ends`);
  }
  if (daysBetween(programEnd, optStart) > maxLag) {
    throw new GateError('G0', `OPT start ${iso(optStart)} is ${daysBetween(programEnd, optStart)} days after program end; the stated limit is ${maxLag}`);
  }
  const deadline = addDays(optStart, allowance);
  if (asOf > deadline) {
    throw new GateError('G0', `OPT window already closed: run date ${iso(asOf)} is after the ${allowance}-day unemployment deadline ${iso(deadline)}. This recipe cannot help; talk to your DSO today.`);
  }
  return {
    program_end: { value: iso(programEnd), label: LABEL.input },
    opt_start: { value: iso(optStart), label: LABEL.input },
    unemployment_days_allowed: { value: allowance, label: LABEL.input, note: 'regulatory figure as stated by the student; confirm with DSO' },
    unemployment_deadline: { value: iso(deadline), label: LABEL.input, note: 'derived: opt_start + allowance' },
    days_until_opt_start: daysBetween(asOf, optStart),
  };
}

export class GateError extends Error {
  constructor(gate, msg) { super(msg); this.gate = gate; }
}

// ───────────────────────── G3: timeline factor for one role ─────────────────────────
// Rule (your-input, stated in the profile so it can be argued with):
//   earliest_work = max(opt_start, as_of + hiring_lag_days, posting_start)
//   closed (0)  if posting_start < opt_start and the posting is not flexible  → can't legally start
//   closed (0)  if earliest_work > deadline                                   → hire can't finish in time
//   soft        if slack < soft_slack_days  (factor = soft_factor, < 0.6 so the scorer demotes to Consider)
//   open (1.0)  otherwise
export function timelineFactor(role, win, asOf, rules) {
  const optStart = parseDate(win.opt_start.value, 'opt_start');
  const deadline = parseDate(win.unemployment_deadline.value, 'deadline');
  const lag = role.hiring_lag_days ?? rules.default_hiring_lag_days;
  if (typeof lag !== 'number' || lag < 0) throw new Error(`${role.role_id}: hiring_lag_days must be a non-negative number`);
  const lagLabel = role.hiring_lag_days != null ? LABEL.input : `${LABEL.input} (profile default)`;
  let postingStart = null;
  if (role.start_date && role.start_date !== 'asap') postingStart = parseDate(role.start_date, `${role.role_id}.start_date`);
  const asap = role.start_date === 'asap';
  const flexible = role.start_flexible === true;

  const earliestOffer = addDays(asOf, lag);
  const candidates = [optStart, earliestOffer];
  if (postingStart) candidates.push(postingStart);
  const earliestWork = new Date(Math.max(...candidates.map((d) => d.getTime())));
  const slack = daysBetween(earliestWork, deadline);

  const base = {
    hiring_lag_days: { value: lag, label: lagLabel },
    posting_start: { value: asap ? 'asap' : postingStart ? iso(postingStart) : null, label: role.start_date_source || LABEL.input },
    earliest_work_date: { value: iso(earliestWork), label: LABEL.input, note: 'derived from your-input dates' },
    slack_days: slack,
  };

  const startsTooEarly = !flexible && (asap || (postingStart && postingStart < optStart));
  if (startsTooEarly && (asap ? earliestOffer < optStart : true)) {
    return { ...base, factor: 0, state: 'closed', reason: `role starts ${asap ? 'ASAP' : iso(postingStart)}, before OPT start ${iso(optStart)} — cannot legally start` };
  }
  if (slack < 0) {
    return { ...base, factor: 0, state: 'closed', reason: `earliest start ${iso(earliestWork)} is ${-slack} days after the unemployment deadline ${iso(deadline)}` };
  }
  if (slack < rules.soft_slack_days) {
    return { ...base, factor: rules.soft_factor, state: 'soft', reason: `only ${slack} days of slack before the deadline (< ${rules.soft_slack_days})` };
  }
  return { ...base, factor: 1.0, state: 'open', reason: `${slack} days of slack before the deadline` };
}

// ───────────────────────── G1: company lookup + sponsorship tier ─────────────────────────
const SUFFIX = new Set(['INC', 'INCORPORATED', 'LLC', 'L', 'P', 'LP', 'LLP', 'CORP', 'CORPORATION', 'CO', 'LTD', 'PBC', 'PLC', 'THE']);
export function normName(s) {
  return String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9]+/g, ' ')
    .trim().split(/\s+/).filter((t) => t && !SUFFIX.has(t)).join(' ');
}

export function indexCompanies(rows) {
  const idx = new Map();
  for (const r of rows) {
    const k = normName(r.company_name);
    if (!k) continue;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push(r);
  }
  return idx;
}

export function lookupCompany(idx, name) {
  const key = normName(name);
  const hits = idx.get(key) || [];
  if (hits.length === 0) return { status: 'company-not-found', key };
  if (hits.length > 1) return { status: 'ambiguous-company-match', key, candidates: hits.map((h) => h.company_name) };
  return { status: 'ok', key, row: hits[0] };
}

// top_job_titles_sponsored is a Python-list string, e.g. "['Data Analyst II', 'Engineer']".
export function parseTitles(s) {
  if (!s) return [];
  return [...String(s).matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => (m[1] ?? m[2]).trim()).filter(Boolean);
}

export function sponsorshipTier(row, rules) {
  const num = (x) => (x === '' || x == null ? null : Number(x));
  const approvals = num(row['Total Approvals']);
  const denials = num(row['Total Denials']);
  const titles = parseTitles(row.top_job_titles_sponsored);
  const kw = rules.analyst_title_keywords.map((k) => k.toLowerCase());
  // v0.1.1: a keyword alone is not enough — the title must also name an analyst
  // ("analyst", or "BI" as a word). Stops "Senior Analytics Engineer" or
  // "Data Scientist, Product Analytics" counting as analyst sponsorship.
  const analystTitles = titles.filter((t) => {
    const lower = t.toLowerCase();
    return kw.some((k) => lower.includes(k)) && /\banalyst\b|\bbi\b/.test(lower);
  });
  const hasAnalyst = analystTitles.length > 0;
  const T = rules.proven_min_approvals;
  let tier;
  if (approvals == null || approvals === 0) tier = 'None';
  else if (approvals >= T && hasAnalyst) tier = 'Proven';
  else if (approvals >= T || hasAnalyst) tier = 'Likely';
  else tier = 'Possible';
  return {
    tier,
    p: rules.tier_p[tier],
    raw: {
      total_approvals: { value: approvals, label: LABEL.record },
      total_denials: { value: denials, label: LABEL.record },
      approval_rate: { value: num(row.Approval_Rate), label: LABEL.record },
      top_job_titles_sponsored: { value: titles, label: LABEL.record, note: 'a sample of up to 5 titles, not a full list' },
      analyst_titles_matched: { value: analystTitles, label: LABEL.input, note: 'matched by your-input keyword list' },
      even_counts: approvals != null && approvals % 2 === 0 && (denials == null || denials % 2 === 0),
    },
    rule: { value: `Proven: approvals ≥ ${T} AND an analyst title (keyword + the word "analyst" or "BI") in the sample; Likely: one of the two; Possible: some approvals; None: no approvals on record`, label: LABEL.input },
    none_caveat: tier === 'None' ? 'No approvals on record in this CSV. Absence of a record is not a record of absence — the SEC↔DOL join does not prove entity resolution.' : null,
  };
}

export function fundingContext(row, asOf) {
  const date = row.latest_funding_date && /^\d{4}-\d{2}-\d{2}$/.test(row.latest_funding_date) ? row.latest_funding_date : null;
  return {
    latest_funding_date: { value: date, label: LABEL.record },
    latest_funding_stage: { value: row.latest_funding_stage || null, label: LABEL.record },
    latest_funding_amount: { value: row.latest_funding_amount ? Number(row.latest_funding_amount) : null, label: LABEL.record },
    months_since_funding: date ? Math.floor(daysBetween(parseDate(date, 'funding'), asOf) / 30.44) : null,
  };
}

// ───────────────────────── BLS / O*NET row (context only — Fact 1) ─────────────────────────
export function socContext(socRows, soc) {
  const row = socRows.find((r) => r.onet_soc_code === soc) || socRows.find((r) => r.bls_soc_code === soc);
  if (!row) return { status: 'missing', reason: 'no-occupation-row', soc };
  const n = (x) => (x === '' ? null : Number(x));
  return {
    status: 'ok', soc,
    title: { value: row.title, label: LABEL.record },
    annual_median_wage_national: { value: n(row.annual_median_wage), label: LABEL.record, note: `OEWS ${row.oews_year}, national, occupation-level (not this employer)` },
    cognitive_pivot_score: { value: n(row.cognitive_pivot_score), label: LABEL.record },
    job_zone: { value: n(row.job_zone), label: LABEL.record },
  };
}

// ───────────────────────── G2: liveness ─────────────────────────
// Parses the saved stdout of `npm run ats:liveness -- <urls>`:
//   "✅ active     https://…"   "❌ expired    https://…"   "⚠️ uncertain  https://…"
export function parseLivenessLog(text) {
  const out = new Map();
  for (const line of text.split('\n')) {
    const m = line.match(/(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (m) out.set(m[2], m[1]);
  }
  return out;
}

export function livenessGate(role, asOf, rules, logMap, logMeta) {
  let result = null, checkedOn = null, label = null, method = null;
  if (logMap && role.posting_url && logMap.has(role.posting_url)) {
    result = logMap.get(role.posting_url); checkedOn = logMeta.checked_on; label = LABEL.record; method = `npm run ats:liveness (saved output: ${logMeta.file})`;
  } else if (role.liveness && role.liveness.result) {
    result = role.liveness.result; checkedOn = role.liveness.checked_on || null;
    label = role.liveness.source || LABEL.input; method = role.liveness.method || 'stated in input file';
  }
  if (!result) return { status: 'blocked', reason: 'liveness-unchecked', next: `run: npm run ats:liveness -- ${role.posting_url || '<url>'}` };
  if (!checkedOn) return { status: 'blocked', reason: 'liveness-undated', next: 're-run the liveness check and record the date' };
  const age = daysBetween(parseDate(checkedOn, `${role.role_id}.liveness.checked_on`), asOf);
  if (age > rules.liveness_max_age_days) return { status: 'blocked', reason: `liveness-stale (${age} days old > ${rules.liveness_max_age_days})`, next: `re-run: npm run ats:liveness -- ${role.posting_url}` };
  if (result === 'uncertain') return { status: 'blocked', reason: 'liveness-uncertain', next: 'open the posting yourself; the checker could not decide' };
  return { status: 'ok', factor: result === 'active' ? 1.0 : 0.0, result, checked_on: checkedOn, label, method };
}

// ───────────────────────── next action (3-3-2) ─────────────────────────
export function nextAction(decision, ctx) {
  if (decision === 'Apply') return { bucket: '2h apply', action: 'Tailor this application (research is done — spend the time on the résumé/cover letter).' };
  if (decision === 'Consider') return { bucket: '3h network', action: 'Find one alum or analyst at this company before applying; ask about their sponsorship and start dates.' };
  if (ctx.timelineClosed && ['Proven', 'Likely'].includes(ctx.tier)) {
    return { bucket: '3h network', action: 'Skip this posting, but network now: a sponsor whose timing is wrong today may open a new-grad role in your window.' };
  }
  return { bucket: 'skip', action: 'Skip. The time goes back to networking and your credibility project.' };
}
