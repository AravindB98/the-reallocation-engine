// evidence.mjs: read the repo's data files and turn them into labelled evidence.
//
// Everything here is deterministic and offline. It never guesses: an unreadable value
// becomes an explicit "missing" with a reason, never a number.
//
// Labels used in outputs (the repo's three): record, model-judgment, your-input.
//   record         read from a repo data file, or plain arithmetic on record values
//   your-input     the candidate's persona values and the run's parameters (tiers and funding window
//                  confirmed by the author on 2026-10-19; the rest proposed by the assistant)
//   model-judgment none is produced by this prototype
//
// Files read: the 80 Days CSV, the BLS compact extract, and the shipped Form D samples.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { InputError, isoToDay, monthsBetween } from './timeline.mjs';

const REQUIRED_COLUMNS = [
  'company_name', 'industry', 'total_funding', 'latest_funding_amount', 'latest_funding_stage',
  'latest_funding_date', 'Total Approvals', 'Total Denials', 'Approval_Rate',
  'median_salary_offered', 'top_job_titles_sponsored',
];
const BLS_REQUIRED_COLUMNS = ['bls_soc_code', 'title', 'oews_year', 'annual_median_wage'];

export const sha256Buffer = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
export const sha256File = (p) => sha256Buffer(fs.readFileSync(p));

const round1 = (x) => Math.round(x * 10) / 10;
const round2 = (x) => Math.round(x * 100) / 100;

/** A number from a CSV cell, or null when the cell is blank or not numeric. Never NaN. */
export function toNumber(cell) {
  const s = String(cell ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ── CSV ────────────────────────────────────────────────────────────────────

/** Minimal RFC 4180 parser: quoted fields, doubled quotes, embedded commas and newlines. `what` names the file in error messages. */
export function parseCsv(text, what = 'CSV') {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n') { record.push(field); records.push(record); record = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (inQuotes) throw new InputError(`${what} ends inside an open quote (file truncated or corrupt)`);
  if (field !== '' || record.length) { record.push(field); records.push(record); }
  if (records.length === 0) throw new InputError(`${what} is empty`);
  const header = records.shift();
  const rows = [];
  for (const [n, r] of records.entries()) {
    if (r.length === 1 && r[0] === '') continue; // blank line
    if (r.length !== header.length) throw new InputError(`${what} row ${n + 2} has ${r.length} fields, header has ${header.length}`);
    const o = {};
    header.forEach((h, k) => { o[h] = r[k]; });
    rows.push(o);
  }
  return { header, rows };
}

/** Read the 80 Days CSV and stop, naming every missing column, if the schema has drifted. */
export function loadCompanies(csvPath) {
  let buf;
  try { buf = fs.readFileSync(csvPath); } catch (e) { throw new InputError(`cannot read CSV ${csvPath}: ${e.code || e.message}`); }
  const { header, rows } = parseCsv(buf.toString('utf8'), 'the company table');
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new InputError(`CSV schema drift: missing column(s): ${missing.join(', ')}`, missing);
  return { header, rows, sha256: sha256Buffer(buf) };
}

// ── names ──────────────────────────────────────────────────────────────────
// A port of normalize_company_name in scripts/sec/entity-resolution.py (lines 26 and 44-92), checked against the
// Python original on all 30,569 real names in the company table and the Form D samples (0 differences). It is not
// byte-for-byte identical on exotic Unicode: Python's re.IGNORECASE folds the dotless i and dotted I to "i", and
// its \s and strip() also treat U+0085 and U+001C to U+001F as spaces, while JavaScript's \s and trim() also treat
// U+FEFF as a space. No real name in the data contains those characters. Exact equality after this normalization
// is the only match rule: no fuzzy matching, so an ambiguous name stays ambiguous.

const NULLS = new Set(['', 'null', 'NULL', 'None', 'none', 'NaN', 'nan', 'N/A', 'n/a']);
const SUFFIXES = [
  /\s+inc\.?$/i, /\s+incorporated$/i, /\s+llc\.?$/i, /\s+l\.?l\.?c\.?$/i, /\s+ltd\.?$/i,
  /\s+limited$/i, /\s+corp\.?$/i, /\s+corporation$/i, /\s+co\.?$/i, /\s+company$/i,
  /\s+l\.?p\.?$/i, /\s+lp$/i, /\s+plc\.?$/i,
];

export function normalizeName(name) {
  if (name === null || name === undefined) return '';
  let cleaned = String(name).trim();
  if (NULLS.has(cleaned)) return '';
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of SUFFIXES) {
      const next = cleaned.replace(re, '');
      if (next !== cleaned) { cleaned = next.trim(); changed = true; }
    }
  }
  return cleaned.replace(/[,.\s\-&']/g, '').toLowerCase();
}

/** normalized name -> array of row indexes. More than one index means an ambiguous name. */
export function buildNameIndex(rows) {
  const index = new Map();
  rows.forEach((r, i) => {
    const key = normalizeName(r.company_name);
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(i);
  });
  return index;
}

export const slugify = (name) => normalizeName(name) || 'unnamed';

// ── sponsored titles and role family ───────────────────────────────────────

const SIMPLE_ESCAPES = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"' };

/** Decode one backslash escape at s[i], exactly as a Python string literal would; refuse any other escape. */
function decodeEscape(s, i, end) {
  const n = s[i + 1];
  if (i + 1 >= end) throw new InputError('title list ends with a lone backslash');
  if (n in SIMPLE_ESCAPES) return { text: SIMPLE_ESCAPES[n], next: i + 2 };
  const hex = (len) => { const h = s.slice(i + 2, i + 2 + len); return h.length === len && /^[0-9a-fA-F]+$/.test(h) ? parseInt(h, 16) : null; };
  if (n === 'x' && hex(2) !== null) return { text: String.fromCharCode(hex(2)), next: i + 4 };
  if (n === 'u' && hex(4) !== null) return { text: String.fromCharCode(hex(4)), next: i + 6 };
  if (n === 'U' && hex(8) !== null) return { text: String.fromCodePoint(hex(8)), next: i + 10 };
  throw new InputError(`title list has an escape this parser does not decode: \\${n}`);
}

/**
 * Parse the CSV's list column, a Python list-of-strings repr such as ['A', "B's"], decoding the escapes
 * Python writes (\\xNN, \\uNNNN, \\UNNNNNNNN, \\n, \\t, \\r, \\\\, \\' and \\"). Items are separated by exactly ", ", as Python
 * writes them. Returns null for a blank cell; throws InputError for anything that is not that shape or has an
 * escape it cannot decode, never a guess.
 */
export function parseTitles(cell) {
  const s = String(cell ?? '').trim();
  if (s === '') return null;
  if (s[0] !== '[' || s[s.length - 1] !== ']') throw new InputError(`title list is not a bracketed list: ${s.slice(0, 40)}`);
  const out = [];
  const end = s.length - 1; // the closing bracket
  let i = 1;
  if (i === end) return out; // "[]"
  for (;;) {
    const q = s[i];
    if (q !== "'" && q !== '"') throw new InputError(`title list has an unexpected character at ${i}: ${JSON.stringify(q)}`);
    i += 1;
    let buf = '';
    while (i < end && s[i] !== q) {
      if (s[i] === '\\') {
        const decoded = decodeEscape(s, i, end);
        buf += decoded.text;
        i = decoded.next;
      } else { buf += s[i]; i += 1; }
    }
    if (i >= end || s[i] !== q) throw new InputError('title list has an unterminated string');
    i += 1;
    out.push(buf);
    if (i === end) return out;
    if (s[i] === ',' && s[i + 1] === ' ') { i += 2; continue; }
    throw new InputError(`title list has an unexpected separator at ${i}: ${JSON.stringify(s.slice(i, i + 2))}`);
  }
}

export function compileFamily(def) {
  const re = (list) => list.map((p) => new RegExp(p, 'i'));
  return { soc: def.soc, include: re(def.include), exclude: re(def.exclude), senior: re(def.senior_markers || []) };
}

export const titleMatches = (title, fam) => fam.include.some((r) => r.test(title)) && !fam.exclude.some((r) => r.test(title));

export function splitTitles(titles, fam) {
  const matched = [];
  const unmatched = [];
  for (const t of titles) (titleMatches(t, fam) ? matched : unmatched).push(t);
  return { matched, unmatched };
}

/** For a new-graduate reader: do the matched titles show any entry-level evidence at all? */
export function levelNote(matched, fam) {
  if (matched.length === 0) return null;
  return matched.every((t) => fam.senior.some((r) => r.test(t)))
    ? 'all-matched-titles-senior-marked'
    : 'includes-titles-without-a-senior-marker';
}

// ── sponsorship tier ───────────────────────────────────────────────────────

/**
 * Turn an H-1B record into a tier. Only Proven, Likely and Thin are scored; the two
 * unscored outcomes are deliberate: a record whose titles do not match tells us about
 * other roles, not about this one, and the title list is capped, so absence is not proof.
 */
export function tierFor({ approvals, denials, matchedTitles }, tiers) {
  const total = approvals + denials;
  const rate = total === 0 ? null : (100 * approvals) / total;
  const base = { approvals, denials, total_decisions: total, rate_pct: rate === null ? null : round2(rate) };
  if (matchedTitles.length === 0) {
    return { ...base, tier: 'role-type-unverified', p: null, scored: false,
      reason: 'the record lists sponsored titles, but none of them match this role family; the list is capped, so this is not evidence that the company does not sponsor it' };
  }
  const { proven, likely, thin } = tiers;
  if (approvals >= proven.min_approvals && rate >= proven.min_rate_pct) {
    return { ...base, tier: 'Proven', p: proven.p, scored: true, reason: `${approvals} approvals at ${round2(rate)}% with a matching title` };
  }
  if (approvals >= likely.min_approvals && rate >= likely.min_rate_pct) {
    return { ...base, tier: 'Likely', p: likely.p, scored: true, reason: `${approvals} approvals at ${round2(rate)}% with a matching title, below the Proven bar` };
  }
  const why = approvals === 0 && denials > 0
    ? `the record shows 0 approvals and ${denials} denial${denials === 1 ? '' : 's'}, a negative record, below the Likely bar`
    : `${approvals} approvals at ${rate === null ? 'n/a' : round2(rate) + '%'} is below the Likely bar`;
  return { ...base, tier: 'Thin', p: thin.p, scored: true, reason: `a matching title exists but ${why}` };
}

// ── one company row -> evidence ────────────────────────────────────────────

/** Days of the newest funding date in the file (the data's own vintage). */
export function vintageOf(rows) {
  let best = null;
  let bad = 0;
  for (const r of rows) {
    const d = (r.latest_funding_date || '').trim();
    if (!d) continue;
    let day;
    try { day = isoToDay(d); } catch { bad += 1; continue; }
    if (best === null || day > best.day) best = { day, iso: d };
  }
  if (best === null) throw new InputError('CSV has no readable latest_funding_date values, so the data vintage cannot be determined');
  return { ...best, unreadable_dates: bad };
}

export function fundingFacts(row, vintageDay, windowMonths, daysPerMonth) {
  const stage = (row.latest_funding_stage || '').trim() || null;
  const amount = toNumber(row.latest_funding_amount);
  const d = (row.latest_funding_date || '').trim();
  if (!d) return { status: 'no-funding-record', date: null, stage, amount, months_before_vintage: null, within_window: null };
  let day;
  try { day = isoToDay(d); } catch { return { status: 'unreadable-funding-date', date: d, stage, amount, months_before_vintage: null, within_window: null }; }
  const months = monthsBetween(day, vintageDay, daysPerMonth);
  return { status: 'ok', date: d, stage, amount, months_before_vintage: round1(months), within_window: months >= 0 && months <= windowMonths };
}

/** The H-1B part of a row: 'no-record', 'empty-record' (0 and 0), 'incomplete-record', or the parsed counts. */
export function sponsorshipRecord(row) {
  const a = (row['Total Approvals'] || '').trim();
  const d = (row['Total Denials'] || '').trim();
  if (a === '' && d === '') return { status: 'no-record' };
  const approvals = toNumber(a);
  const denials = toNumber(d);
  if (approvals === null || denials === null || !Number.isInteger(approvals) || !Number.isInteger(denials) || approvals < 0 || denials < 0) {
    return { status: 'incomplete-record', raw: { approvals: a, denials: d } };
  }
  if (approvals + denials === 0) return { status: 'empty-record' }; // listed with 0 approvals and 0 denials: no evidence either way
  const given = toNumber(row.Approval_Rate);
  const total = approvals + denials;
  const recomputed = total === 0 ? null : (100 * approvals) / total;
  const rateConsistent = given === null || recomputed === null ? null : Math.abs(given - recomputed) <= 0.01;
  return { status: 'record', approvals, denials, given_rate_pct: given, rate_consistent: rateConsistent, median_salary_offered: toNumber(row.median_salary_offered) };
}

// ── BLS wage reference (role quality, shown but not scored) ─────────────────

export function loadBlsRow(blsPath, soc) {
  let buf;
  try { buf = fs.readFileSync(blsPath); } catch (e) { throw new InputError(`cannot read BLS extract ${blsPath}: ${e.code || e.message}`); }
  const { header, rows } = parseCsv(buf.toString('utf8'), 'the BLS extract');
  const missing = BLS_REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) throw new InputError(`BLS schema drift: missing column(s): ${missing.join(', ')}`, missing);
  const hit = rows.filter((r) => r.bls_soc_code === soc);
  const source = { file: blsPath, sha256: sha256Buffer(buf), rows: rows.length };
  if (hit.length === 0) return { status: 'missing', reason: 'no-soc-row', soc, source };
  if (hit.length > 1) return { status: 'missing', reason: 'ambiguous-soc-rows', soc, source };
  const median = toNumber(hit[0].annual_median_wage);
  if (median === null) return { status: 'missing', reason: 'median-not-numeric', soc, raw: hit[0].annual_median_wage, source };
  return { status: 'ok', soc, title: hit[0].title, oews_year: hit[0].oews_year, annual_median_wage: median, source };
}

/** Offered wage over the national median for the SOC code: arithmetic on two records, no threshold. */
export function wageComparison(offered, bls) {
  if (bls.status !== 'ok') return { status: 'missing', reason: `bls-${bls.reason}`, offered };
  if (offered === null) return { status: 'missing', reason: 'no-offered-wage', offered: null };
  return { status: 'ok', offered, oews_median: bls.annual_median_wage, ratio: round2(offered / bls.annual_median_wage) };
}

// ── Form D samples: an independent check on the CSV's funding fields ────────

const MONTHS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };

/** The sample files write a filing date as 30-JUN-2025; return YYYY-MM-DD, or null when it is not in that shape. */
export function filingDateToIso(text) {
  const m = /^(\d{2})-([A-Z]{3})-(\d{4})$/.exec(String(text ?? ''));
  if (!m || !MONTHS[m[2]]) return null;
  try { isoToDay(`${m[3]}-${MONTHS[m[2]]}-${m[1]}`); } catch { return null; }
  return `${m[3]}-${MONTHS[m[2]]}-${m[1]}`;
}

export function loadFormD(dir) {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return { status: 'no-directory', files: [], records: [] };
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const files = [];
  const records = [];
  for (const f of names) {
    const p = path.join(dir, f);
    const buf = fs.readFileSync(p);
    let doc;
    try { doc = JSON.parse(buf.toString('utf8')); } catch { throw new InputError(`Form D sample is not valid JSON: ${p}`); }
    if (!Array.isArray(doc.companies)) throw new InputError(`Form D sample has no companies list: ${p}`);
    files.push({ file: p, sha256: sha256Buffer(buf), records: doc.companies.length });
    for (const c of doc.companies) {
      const firstSale = c?.funding?.date_of_first_sale;
      records.push({
        file: f,
        accession: c?.accession_number ?? null,
        name: c?.company?.name ?? '',
        norm: normalizeName(c?.company?.name),
        first_sale: typeof firstSale === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(firstSale) ? firstSale : null,
        filed: filingDateToIso(c?.filing?.date_filed),
        offering: toNumber(c?.funding?.total_offering_amount),
      });
    }
  }
  return { status: files.length ? 'ok' : 'no-files', files, records };
}

/**
 * Compare each Form D sample record with the CSV company of the same normalized name.
 * Only unambiguous name matches are compared. A table can only miss what had been filed by the time it was made,
 * so the FILING date (not the first-sale date) is compared with the table's newest funding date. Classes:
 *   agrees                        same first-sale date and same offering amount as the CSV's latest round
 *   form-d-missed-by-table        the first sale is later than the table's date for that company and the Form D was
 *                                 filed on or before the table's newest funding date, so the table could have held
 *                                 it and did not (the funding column lagged)
 *   form-d-filed-after-table-end  the first sale is later than the table's date for that company, but the Form D was
 *                                 filed after the table's newest funding date (or no filing date is given and the
 *                                 first sale itself is later), so the table may simply predate it: not counted as a miss
 *   form-d-older                  an earlier first sale (a different or earlier round)
 *   same-date-amount-differs      same date, different amount
 *   csv-has-no-funding            the CSV row has no funding date to compare
 *   form-d-has-no-first-sale      the Form D record has no first-sale date
 */
export function crossCheckFormD(rows, index, formd, vintageIso) {
  const counts = { agrees: 0, 'form-d-missed-by-table': 0, 'form-d-filed-after-table-end': 0, 'form-d-older': 0, 'same-date-amount-differs': 0, 'csv-has-no-funding': 0, 'form-d-has-no-first-sale': 0 };
  const pairs = [];
  let unmatched = 0;
  let ambiguous = 0;
  for (const rec of formd.records) {
    const hits = rec.norm ? index.get(rec.norm) || [] : [];
    if (hits.length === 0) { unmatched += 1; continue; }
    if (hits.length > 1) { ambiguous += 1; continue; }
    const row = rows[hits[0]];
    const csvDate = (row.latest_funding_date || '').trim() || null;
    const csvAmount = toNumber(row.latest_funding_amount);
    let cls;
    if (!csvDate) cls = 'csv-has-no-funding';
    else if (!rec.first_sale) cls = 'form-d-has-no-first-sale';
    else if (rec.first_sale === csvDate) cls = csvAmount !== null && csvAmount === rec.offering ? 'agrees' : 'same-date-amount-differs';
    else if (rec.first_sale > csvDate) cls = vintageIso && (rec.filed ?? rec.first_sale) > vintageIso ? 'form-d-filed-after-table-end' : 'form-d-missed-by-table';
    else cls = 'form-d-older';
    counts[cls] += 1;
    pairs.push({ company: row.company_name, norm: rec.norm, class: cls, csv_date: csvDate, csv_amount: csvAmount, form_d_first_sale: rec.first_sale, form_d_filed: rec.filed, form_d_offering: rec.offering, accession: rec.accession });
  }
  return { status: formd.status, records_examined: formd.records.length, matched: pairs.length, ambiguous, unmatched, counts, pairs };
}
