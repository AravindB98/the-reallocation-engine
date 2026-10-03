// lib.mjs — pure functions for data-role-sponsor-match (no I/O, no network).
//
// The question this answers: "This company sponsors H-1Bs — but has it ever
// sponsored a DATA role?" The 80 Days CSV carries a company-wide approval
// count and a short list of the top sponsored job titles. A large approval
// count says nothing about whether an analytics/data-engineering hire was ever
// sponsored; the title list is the only record that does.
//
// Every value this module emits is wrapped as { value, source } where source is
// one of SRC below. Rule for derived values: the LOWEST-trust input wins — a
// number computed from a record plus one of my assumptions is labeled
// your-input, not record.

export const SRC = Object.freeze({
  record: 'record',
  model: 'model-judgment',
  input: 'your-input',
});

export const v = (value, source, extra = {}) => ({ value, source, ...extra });

// ── CSV ────────────────────────────────────────────────────────────────────
// RFC-4180-ish: quoted fields, "" escapes, commas/newlines inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, q = false;
  if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
  for (; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
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
  // line = 1-based line in the file (header is line 1); valid while no field spans lines
  return body.map((r, idx) => {
    const o = { _line: idx + 2 };
    header.forEach((h, k) => { o[h] = r[k] ?? ''; });
    return o;
  });
}

// ── company names ──────────────────────────────────────────────────────────
// Exact match after normalization. No fuzzy matching: a near-miss is reported
// as no-company-match, never guessed.
const SUFFIXES = new Set(['INC', 'INCORPORATED', 'LLC', 'CORP', 'CORPORATION', 'CO',
  'COMPANY', 'LTD', 'LP', 'LLP', 'PBC', 'PLC']);

export function normalizeCompany(name) {
  const t = String(name || '').toUpperCase().replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (t[0] === 'THE') t.shift();
  while (t.length && SUFFIXES.has(t[t.length - 1])) t.pop();
  return t.join(' ');
}

export function indexCompanies(rows) {
  const idx = new Map();
  for (const r of rows) {
    const k = normalizeCompany(r.company_name);
    if (!k) continue;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push(r);
  }
  return idx;
}

// Returns { ok, row } or { ok:false, reason, candidates? }.
// `csvName` is an exact company_name a human chose to break a tie (your-input).
export function lookupCompany(idx, company, csvName) {
  if (csvName) {
    const hits = (idx.get(normalizeCompany(csvName)) || []).filter((r) => r.company_name === csvName);
    return hits.length === 1 ? { ok: true, row: hits[0], resolvedBy: 'csv_company_name' }
      : { ok: false, reason: 'no-company-match', detail: `csv_company_name "${csvName}" not found verbatim` };
  }
  const hits = idx.get(normalizeCompany(company)) || [];
  if (hits.length === 0) return { ok: false, reason: 'no-company-match', detail: `"${company}" → "${normalizeCompany(company)}" has no row` };
  if (hits.length > 1) return {
    ok: false, reason: 'ambiguous-company-match',
    detail: `${hits.length} rows normalize to "${normalizeCompany(company)}"`,
    candidates: hits.map((r) => ({ company_name: r.company_name, state: r.state, line: r._line })),
  };
  return { ok: true, row: hits[0], resolvedBy: 'normalized-name' };
}

// ── sponsored titles ───────────────────────────────────────────────────────
// The CSV stores top_job_titles_sponsored as a Python list literal.
export function parseTitleList(s) {
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(String(s || '')))) out.push((m[1] ?? m[2]).replace(/\\(.)/g, '$1').trim());
  return out.filter(Boolean);
}

export function compilePatterns(list) {
  return (list || []).map((p) => new RegExp(p, 'i'));
}

export function isDataTitle(title, include, exclude) {
  return include.some((re) => re.test(title)) && !exclude.some((re) => re.test(title));
}

// Sponsorship tier for THIS kind of role:
//   proven   — the company has a sponsored-title record matching a data pattern
//   likely   — the company sponsors (approvals on record) but no data title is
//              in its recorded top titles (the list is truncated, so this is
//              NOT evidence it never sponsored one)
//   no-sponsorship-record — the sponsorship columns are blank. NOT "None":
//              the CSV covers some DOL years and companies; blank ≠ refused.
export function sponsorshipEvidence(row, include, exclude) {
  const approvalsRaw = (row['Total Approvals'] || '').trim();
  if (!approvalsRaw) return { ok: false, reason: 'no-sponsorship-record' };
  const titles = parseTitleList(row.top_job_titles_sponsored);
  const matched = titles.filter((t) => isDataTitle(t, include, exclude));
  return {
    ok: true,
    total_approvals: Number(approvalsRaw),
    total_denials: Number((row['Total Denials'] || '').trim() || NaN),
    approval_rate: Number((row.Approval_Rate || '').trim() || NaN),
    median_salary_offered: Number((row.median_salary_offered || '').trim() || NaN),
    sponsored_titles: titles,
    matched_titles: matched,
    tier: matched.length ? 'Proven' : 'Likely',
  };
}

// ── visa timeline gate ─────────────────────────────────────────────────────
// runway_days = days from as_of until the last day the person can still be
// unemployed on OPT:
//   before OPT starts:  (opt_start − as_of) + (ceiling − used)
//   after OPT starts:   (ceiling − used), capped by days left until opt_end
// factor: 1 if runway ≥ 2·lag; 0 if runway ≤ lag; linear in between.
// The formula and the lag are MY assumptions → your-input.
const DAY = 86400000;
const d = (s) => { const t = Date.parse(`${s}T00:00:00Z`); return Number.isFinite(t) ? t : NaN; };

export function timelineGate(p) {
  const asOf = d(p.as_of), start = d(p.opt_start_date), end = d(p.opt_end_date);
  const ceiling = Number(p.unemployment_ceiling_days), used = Number(p.unemployment_days_used);
  const lag = Number(p.hiring_lag_days);
  for (const [k, x] of Object.entries({ as_of: asOf, opt_start_date: start, opt_end_date: end, unemployment_ceiling_days: ceiling, unemployment_days_used: used, hiring_lag_days: lag }))
    if (!Number.isFinite(x)) return { ok: false, reason: 'timeline-input-missing', detail: `profile.${k} is missing or not a date/number` };
  if (end <= asOf) return { ok: false, reason: 'opt-window-closed', detail: `opt_end_date ${p.opt_end_date} is on/before as_of ${p.as_of}` };
  const left = ceiling - used;
  if (left <= 0) return { ok: false, reason: 'unemployment-days-exhausted', detail: `${used} of ${ceiling} unemployment days used` };
  const untilEnd = Math.round((end - asOf) / DAY);
  const runway = asOf < start
    ? Math.min(Math.round((start - asOf) / DAY) + left, untilEnd)
    : Math.min(left, untilEnd);
  let factor;
  if (runway >= 2 * lag) factor = 1;
  else if (runway <= lag) factor = 0;
  else factor = Number(((runway - lag) / lag).toFixed(3));
  return { ok: true, runway_days: runway, hiring_lag_days: lag, factor };
}

// ── liveness gate ──────────────────────────────────────────────────────────
// Two independent observations:
//   playwright — output of `npm run ats:liveness` (repo script), per URL
//   greenhouse — HTTP status from the public Greenhouse job API for this job id
// Rule: a Greenhouse 404 closes the gate even if the page "looked" active
// (careers sites redirect dead job ids to a search page full of Apply buttons).
// No observation at all → unresolved. NEVER default to open: the scorer
// treats a missing liveness factor as 1.0.
export function parseLivenessLog(text) {
  const map = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/\b(active|expired|uncertain)\s+(https?:\/\/\S+)/);
    if (m) map.set(m[2], m[1]);
  }
  return map;
}

export function greenhouseJobId(url) {
  try {
    const u = new URL(url);
    const q = u.searchParams.get('gh_jid');
    if (q && /^\d+$/.test(q)) return q;
    const m = u.pathname.match(/\/jobs\/(\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

export function livenessGate(role, pwMap, ghMap) {
  const pw = role.url ? pwMap.get(role.url) ?? null : null;
  const id = role.url ? greenhouseJobId(role.url) : null;
  const gh = role.greenhouse_board && id ? ghMap[`${role.greenhouse_board}/${id}`] ?? null : null;
  const obs = { playwright: pw, greenhouse_api_status: gh ? gh.status : null, greenhouse_api_title: gh?.title ?? null };
  if (!role.url) return { ok: false, reason: 'liveness-unchecked', detail: 'no posting URL supplied', obs };
  if (gh && gh.status === 404) return { ok: true, factor: 0, basis: 'greenhouse-api-404', conflict: pw === 'active', obs };
  if (pw === 'expired') return { ok: true, factor: 0, basis: 'playwright-expired', obs };
  if (pw === 'active' && (!role.greenhouse_board || (gh && gh.status === 200)))
    return { ok: true, factor: 1, basis: gh ? 'playwright-active+greenhouse-200' : 'playwright-active', obs };
  if (pw === 'active' && role.greenhouse_board && !gh)
    return { ok: false, reason: 'liveness-unconfirmed', detail: 'Greenhouse board named but no API observation for this job id', obs };
  if (pw === 'uncertain') return { ok: false, reason: 'liveness-uncertain', detail: 'ats:liveness returned uncertain', obs };
  return { ok: false, reason: 'liveness-unchecked', detail: 'URL not present in the liveness log', obs };
}

// ── role quality context (OUTSIDE the scorer — role_quality weight is 0.0) ──
export function socForTitle(title, socMap) {
  for (const m of socMap || []) if (new RegExp(m.pattern, 'i').test(title)) return m.onet_soc_code;
  return null;
}

export function roleQuality(onetSoc, blsIdx) {
  if (!onetSoc) return { ok: false, reason: 'no-soc-mapping' };
  const r = blsIdx.get(onetSoc);
  if (!r) return { ok: false, reason: 'no-soc-row', onet_soc_code: onetSoc };
  const num = (x) => (String(x).trim() === '' ? null : Number(x));
  return {
    ok: true, onet_soc_code: onetSoc, title: r.title, line: r._line,
    oews_year: r.oews_year,
    annual_median_wage: num(r.annual_median_wage),
    cognitive_pivot_score: num(r.cognitive_pivot_score),
  };
}

// ── next action (the 3-3-2 hook) ───────────────────────────────────────────
export function nextAction(rec, unresolvedReason) {
  if (unresolvedReason) return 'HUMAN CHECK before any time is spent — resolve the named gap first (see reason)';
  if (rec === 'Apply') return 'TAILOR an application (the 2 research-and-apply hours)';
  if (rec === 'Consider') return 'NETWORK first — find a data-team contact and ask about sponsorship for this role (the 3 networking hours)';
  return 'SKIP — no time this week';
}
