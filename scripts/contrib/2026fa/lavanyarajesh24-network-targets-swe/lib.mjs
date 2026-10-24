// lib.mjs — small helpers shared by network-targets.mjs and capture-boards.mjs.
// No network, no file writes.

// Every value this prototype emits is wrapped so its provenance travels with it.
export const SRC = { record: 'record', model: 'model-judgment', input: 'your-input' };
export const L = (value, source, from) => ({ value, source, from });

// Company-name key used for snapshot filenames and the Form D join.
// Lowercase, alphanumerics only, then trailing corporate suffixes dropped.
// Exact match on this key only — no fuzzy matching (a near-miss is reported, not guessed).
const SUFFIXES = ['incorporated', 'corporation', 'company', 'limited', 'inc', 'llc', 'corp', 'ltd', 'co', 'lp', 'pbc'];
export function nameKey(name) {
  let k = String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (let changed = true; changed;) {
    changed = false;
    for (const s of SUFFIXES) {
      if (k.length > s.length && k.endsWith(s)) { k = k.slice(0, -s.length); changed = true; break; }
    }
  }
  return k;
}

// Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, embedded commas/newlines).
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', i = 0, q = false;
  if (text.charCodeAt(0) === 0xfeff) i = 1; // BOM
  for (; i < text.length; i++) {
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
  return {
    header,
    records: rows.filter((r) => r.length > 1 || r[0] !== '').map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? '']))),
  };
}

// Dates are handled as UTC calendar days to keep the arithmetic exact and testable.
export function parseDay(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const DAY = 86400000;
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);
export const iso = (d) => d.toISOString().slice(0, 10);
export function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const toNum = (s) => {
  if (s == null || String(s).trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// The candidate filter, shared by network-targets.mjs and discover-boards.mjs so both
// see the same companies: target state, ≥ 1 approval, sponsored-title pattern.
export function selectCandidates(rows, target) {
  const states = new Set(target.states.map((s) => s.toUpperCase()));
  const titleRe = new RegExp(target.sponsored_title_pattern, 'i');
  return rows.filter((r) => states.has(String(r.state).toUpperCase()) && (toNum(r['Total Approvals']) ?? 0) > 0 && titleRe.test(r.top_job_titles_sponsored));
}

// Does a discovered board belong to this company? A slug alone proves nothing
// ("cmt" could be anyone's). Greenhouse returns the board's own display name, so the
// check is an exact name-key match. Lever's public API returns no company name, so a
// Lever hit stays unverified until a person confirms it.
//   name-match   → usable (record)
//   name-mismatch → not usable; both names kept for the person to judge
//   board-not-found → the slug has no board (HTTP 404); not usable
//   unverified   → not usable unless entry.confirmed_by is set (your-input)
export function boardIdentity(company, provider, boardName, httpStatus = null) {
  if (provider === 'greenhouse' && httpStatus === 404) return { status: 'board-not-found', board_name: null };
  if (provider === 'greenhouse' && typeof boardName === 'string' && boardName.trim()) {
    return nameKey(boardName) === nameKey(company)
      ? { status: 'name-match', board_name: boardName }
      : { status: 'name-mismatch', board_name: boardName };
  }
  return { status: 'unverified', board_name: boardName ?? null };
}
export const identityUsable = (e) => e?.identity?.status === 'name-match' || Boolean(e?.confirmed_by);
