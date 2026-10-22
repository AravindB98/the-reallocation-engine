// lib.mjs — pure helpers for the data-engineer-h1b sponsor-screen prototype.
//
// Everything here is deterministic and offline: CSV parsing, name
// normalization, title-family matching, the sponsorship tier rule, the OPT
// timeline rule, the ats:liveness log parser and the Greenhouse cross-check. No function in this file
// computes an Apply/Consider/Skip decision — that is role-scorer.mjs's job.
//
// Source labels used throughout (SNICKERDOODLE P3, role-scorer.mjs SRC):
//   record          read directly from a repo file or a script's output
//   model-judgment  a rule or rating proposed by Claude
//   your-input      a persona value or a rule chosen by the author

export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input' };

// ── CSV ─────────────────────────────────────────────────────────────────────
// RFC 4180 parser: quoted fields, doubled quotes, commas and newlines inside
// quotes. Returns an array of objects keyed by the header row.
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
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
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// ── company names ───────────────────────────────────────────────────────────
// Exact matching after normalization only — no fuzzy matching (CHANGE-BRIEF G1).
export function normalizeName(name, suffixes) {
  let s = String(name || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ');
  let words = s.split(/\s+/).filter(Boolean);
  while (words.length > 1 && suffixes.includes(words[words.length - 1])) words.pop();
  return words.join(' ');
}

export function buildCompanyIndex(rows, suffixes) {
  const index = new Map();
  for (const r of rows) {
    const key = normalizeName(r.company_name, suffixes);
    if (!key) continue;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(r);
  }
  return index;
}

// ── brand → legal-name aliases (v0.5.0) ─────────────────────────────────────
// A job-seeker types "Gemini"; the visa filings say "GEMINI SPACE STATION LLC".
// An alias is a reviewed, one-to-one pointer from a typed name to ONE exact
// csv company_name. It is consulted only when exact matching did not give
// exactly one row, so it can never override an exact match, and it never
// fuzzes: the target must equal a CSV company_name character for character.
export function parseAliases(json, suffixes) {
  const list = json?.aliases;
  if (!Array.isArray(list)) return { error: 'aliases file has no "aliases" array' };
  const byKey = new Map();
  for (const [i, a] of list.entries()) {
    for (const k of ['typed_name', 'csv_company_name', 'proposed_by']) {
      if (typeof a?.[k] !== 'string' || !a[k].trim()) return { error: `alias #${i + 1} is missing "${k}"` };
    }
    if (typeof a.reviewed_by_person !== 'boolean') return { error: `alias #${i + 1} ("${a.typed_name}") needs reviewed_by_person: true | false` };
    if (a.reviewed_by_person && !parseDate(a.reviewed_on)) return { error: `alias #${i + 1} ("${a.typed_name}") is marked reviewed but has no reviewed_on date` };
    const key = normalizeName(a.typed_name, suffixes);
    if (byKey.has(key)) return { error: `two aliases share the typed name "${key}"` };
    byKey.set(key, { ...a, source: a.reviewed_by_person ? SRC.input : SRC.model });
  }
  return { byKey };
}

export function buildExactNameIndex(rows) {
  const index = new Map();
  for (const r of rows) {
    if (!index.has(r.company_name)) index.set(r.company_name, []);
    index.get(r.company_name).push(r);
  }
  return index;
}

// Gate G1's matching step. Returns { status: 'ok', row, matched_via } or
// { status: 'fail', reason, ... }. Unreviewed aliases are reported, not used,
// when the rules require review.
export function matchCompany(name, { index, exactIndex, aliases, suffixes, requireReview }) {
  const key = normalizeName(name, suffixes);
  const hits = index.get(key) || [];
  if (hits.length === 1) return { status: 'ok', row: hits[0], matched_via: 'exact', normalized_name: key };
  const exactMiss = hits.length === 0
    ? { reason: 'not-in-csv' }
    : { reason: 'ambiguous-match', csv_names: hits.map((h) => h.company_name) };
  const alias = aliases?.get(key);
  if (!alias) return { status: 'fail', normalized_name: key, ...exactMiss };
  const aliasInfo = { typed_name: alias.typed_name, csv_company_name: alias.csv_company_name, reviewed_by_person: alias.reviewed_by_person, reviewed_on: alias.reviewed_on ?? null, source: alias.source };
  const targets = exactIndex.get(alias.csv_company_name) || [];
  if (targets.length === 0) return { status: 'fail', normalized_name: key, reason: 'alias-target-not-in-csv', exact_miss: exactMiss.reason, alias: aliasInfo };
  if (targets.length > 1) return { status: 'fail', normalized_name: key, reason: 'ambiguous-match', exact_miss: exactMiss.reason, alias: aliasInfo, csv_names: targets.map((t) => t.company_name) };
  if (requireReview && !alias.reviewed_by_person) return { status: 'fail', normalized_name: key, reason: 'alias-pending-review', exact_miss: exactMiss.reason, alias: aliasInfo, proposed_row: targets[0] };
  return { status: 'ok', row: targets[0], matched_via: 'alias', normalized_name: key, exact_miss: exactMiss.reason, alias: aliasInfo };
}

// ── titles ──────────────────────────────────────────────────────────────────
// top_job_titles_sponsored is a Python-list-shaped string: "['A', 'B']".
export function parseTitleList(cell) {
  const out = [];
  for (const m of String(cell || '').matchAll(/'([^']*)'|"([^"]*)"/g)) {
    const t = (m[1] ?? m[2] ?? '').trim();
    if (t) out.push(t);
  }
  return out;
}

export function compileFamily(rules) {
  return {
    include: rules.family_patterns.map((p) => new RegExp(p, 'i')),
    exclude: rules.exclusion_patterns.map((p) => new RegExp(p, 'i')),
  };
}

export function isFamilyTitle(title, family) {
  return family.include.some((re) => re.test(title)) && !family.exclude.some((re) => re.test(title));
}

// ── numbers from the CSV ────────────────────────────────────────────────────
// Empty cell → null (missing), never 0.
export function numOrNull(cell) {
  const s = String(cell ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ── sponsorship evidence for one CSV row ────────────────────────────────────
// Returns either { status: 'ok', tier, p, ... } or { status: 'missing', reason }.
export function sponsorshipEvidence(row, family, rules) {
  const approvals = numOrNull(row['Total Approvals']);
  const denials = numOrNull(row['Total Denials']);
  const rate = numOrNull(row['Approval_Rate']);
  const titles = parseTitleList(row['top_job_titles_sponsored']);
  const familyTitles = titles.filter((t) => isFamilyTitle(t, family));
  const recordFields = {
    csv_company_name: { value: row.company_name, source: SRC.record },
    hq_state: { value: row.state || null, source: SRC.record },
    total_approvals: { value: approvals, source: SRC.record },
    total_denials: { value: denials, source: SRC.record },
    approval_rate_pct: { value: rate, source: SRC.record },
    median_salary_offered: { value: numOrNull(row.median_salary_offered), source: SRC.record },
    top_titles_sponsored: { value: titles, source: SRC.record },
    family_titles_matched: { value: familyTitles, source: SRC.model },
  };
  if (approvals == null || approvals < 1) {
    return { status: 'missing', reason: 'no-h1b-record', evidence: recordFields };
  }
  const t = rules.tiers;
  let tier;
  if (familyTitles.length && approvals >= t.proven.min_approvals) tier = 'Proven';
  else if (familyTitles.length && approvals >= t.likely.min_approvals) tier = 'Likely';
  else tier = 'Possible';
  const p = t[tier.toLowerCase()].p;
  return {
    status: 'ok',
    tier,
    p,
    p_source: rules.sponsorship_source_label,
    note: familyTitles.length ? null
      : 'no Data Engineer-family title among the listed top sponsored titles; the list holds only ~5 titles, so absence is not proof',
    evidence: recordFields,
  };
}

// ── dates (UTC, YYYY-MM-DD) ─────────────────────────────────────────────────
export function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const fmtDate = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
export const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 86400000);
// The person's calendar date, not UTC. Every script stamps "today" with this,
// so a check run in the evening (US time) is not dated tomorrow (v0.5.1 fix).
export function localToday(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── OPT timeline gate ───────────────────────────────────────────────────────
// practical deadline = OPT start + (limit − used) − buffer
// earliest start     = later of (today + hiring lag) and OPT start
export function timelineFactor(vt, today, rules) {
  const optStart = parseDate(vt.opt_start);
  if (!optStart) return { status: 'missing', reason: 'persona-opt-start-invalid' };
  for (const k of ['unemployment_limit_days', 'unemployment_days_used', 'buffer_days', 'assumed_hiring_lag_days']) {
    if (typeof vt[k] !== 'number' || !Number.isFinite(vt[k])) return { status: 'missing', reason: `persona-${k}-missing` };
  }
  const legalDeadline = addDays(optStart, vt.unemployment_limit_days - vt.unemployment_days_used);
  const practicalDeadline = addDays(legalDeadline, -vt.buffer_days);
  const byLag = addDays(today, vt.assumed_hiring_lag_days);
  const earliestStart = byLag > optStart ? byLag : optStart;
  const slack = daysBetween(earliestStart, practicalDeadline);
  const tl = rules.timeline;
  const factor = slack < 0 ? tl.closed_factor : slack < tl.tight_window_days ? tl.tight_factor : tl.open_factor;
  return {
    status: 'ok',
    factor,
    source: SRC.input,
    detail: {
      today: fmtDate(today),
      opt_start: fmtDate(optStart),
      hiring_lag_days: vt.assumed_hiring_lag_days,
      buffer_days: vt.buffer_days,
      legal_deadline: fmtDate(legalDeadline),
      practical_deadline: fmtDate(practicalDeadline),
      earliest_start: fmtDate(earliestStart),
      earliest_start_bound_by: byLag > optStart ? 'hiring lag' : 'OPT start (cannot work before OPT begins)',
      slack_days: slack,
    },
  };
}

// ── ats:liveness output parser ──────────────────────────────────────────────
// Reads the saved stdout of `npm run ats:liveness`. The first line must be a
// "# checked: YYYY-MM-DD" header written by the person who ran it.
export function parseLivenessLog(text) {
  const lines = String(text || '').split(/\r?\n/);
  const header = lines.find((l) => /^#\s*checked:\s*\d{4}-\d{2}-\d{2}/.test(l));
  const checked = header ? header.match(/(\d{4}-\d{2}-\d{2})/)[1] : null;
  const verdicts = new Map();
  for (const l of lines) {
    const m = l.match(/\b(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (m) verdicts.set(m[2], m[1]);
  }
  return { checked, verdicts };
}

export function livenessFactor(url, live, today, rules) {
  if (!live.checked) return { status: 'missing', reason: 'liveness-log-has-no-checked-date' };
  const verdict = live.verdicts.get(url);
  if (!verdict) return { status: 'missing', reason: 'url-not-in-liveness-log' };
  const checked = parseDate(live.checked);
  const age = daysBetween(checked, today);
  const stale = age > rules.liveness.max_age_days || age < 0;
  const factor = verdict === 'active' && !stale ? 1 : 0;
  return {
    status: 'ok',
    factor,
    source: SRC.record,
    detail: { verdict, checked_on: live.checked, age_days: age, stale },
    human_check: 'confirm the final page after redirects is this specific job, not a general careers page (ats:liveness can report a redirected dead posting as active)',
  };
}

// ── Greenhouse cross-check (closes the redirect false positive) ─────────────
// ats:liveness loads the page; a dead Greenhouse job ID redirects to the
// company's careers page, which loads fine, so it reports "active". The public
// job-board API answers directly: 200 = the job exists, 404 = it is gone.
export const GREENHOUSE_API_HOST = 'boards-api.greenhouse.io';

// Returns { board, jobId, boardFrom } or null. Never guesses a board name:
// company-hosted pages (…?gh_jid=<id>) carry no board, so it must be supplied.
export function parseGreenhouseUrl(url, boardHint = null) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  if (host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') {
    const m = u.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
    if (m && m[1] !== 'embed') return { board: m[1], jobId: m[2], boardFrom: 'url' };
    const forBoard = u.searchParams.get('for');
    const token = u.searchParams.get('token') || u.searchParams.get('gh_jid');
    if (forBoard && /^\d+$/.test(token || '')) return { board: forBoard, jobId: token, boardFrom: 'url' };
    return null;
  }
  const ghJid = u.searchParams.get('gh_jid');
  if (/^\d+$/.test(ghJid || '') && boardHint) return { board: boardHint, jobId: ghJid, boardFrom: 'candidate greenhouse_board' };
  return null;
}

export function apiVerdict(httpStatus) {
  if (httpStatus === 200) return 'exists';
  if (httpStatus === 404) return 'gone';
  return 'unknown';
}

// Reads the saved output of fetch-greenhouse-status.mjs.
export function parseGreenhouseStatus(json) {
  const byUrl = new Map();
  for (const r of json?.results || []) byUrl.set(r.url, r);
  return { checked: json?.checked ?? null, byUrl };
}

// Adjusts an ok liveness result. Only a definite 404 can close an open gate;
// a missing, stale or failed check changes nothing (it is never assumed 200).
export function applyGreenhouseCheck(lv, url, gh, today, rules) {
  if (lv.status !== 'ok') return lv;
  if (!gh) return { ...lv, cross_check: { status: 'not-run' } };
  const r = gh.byUrl.get(url);
  if (!r) return { ...lv, cross_check: { status: 'not-checked', note: 'URL not in the Greenhouse status file (not a Greenhouse link, or not fetched)' } };
  const checked = parseDate(gh.checked);
  const age = checked ? daysBetween(checked, today) : null;
  if (age == null || age < 0 || age > rules.liveness.max_age_days) return { ...lv, cross_check: { status: 'stale', checked_on: gh.checked } };
  const cc = { status: 'checked', http_status: r.http_status ?? null, verdict: apiVerdict(r.http_status), checked_on: gh.checked, board: r.board, job_id: r.job_id, source: SRC.record };
  if (cc.verdict === 'gone' && lv.factor > 0) {
    return { ...lv, factor: 0, cross_check: cc, closed_by: 'greenhouse-api-404', detail: { ...lv.detail, note: 'ats:liveness said active, but the Greenhouse API has no such job (redirected dead posting)' } };
  }
  return { ...lv, cross_check: cc };
}

// ── candidate-row validation (gate G0) ──────────────────────────────────────
export function validateCandidate(c) {
  const problems = [];
  for (const k of ['role_id', 'company', 'title', 'url']) if (!c || typeof c[k] !== 'string' || !c[k].trim()) problems.push(`missing ${k}`);
  const fp = c?.fit?.p;
  if (typeof fp !== 'number' || fp < 0 || fp > 1) problems.push('fit.p must be a number in [0,1]');
  if (!c?.fit?.reason || !String(c.fit.reason).trim()) problems.push('fit.reason missing');
  return problems;
}
