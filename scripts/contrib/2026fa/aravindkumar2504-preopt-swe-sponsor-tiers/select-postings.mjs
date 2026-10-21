// select-postings.mjs: choose which live postings go to gate H1 (live step L2).
//
// Reads the scan the repository's scanner wrote (scan-history.tsv, one row per posting it found) and keeps, per
// shortlisted company, the posting that best fits the candidate: a backend-family title (role-families.json, the
// same rule the sponsorship-title match uses), a United States location, and a title with no senior marker for a
// candidate who has not started work yet (no senior marker is not the same as entry level: "Software Engineer II" passes). Every rule is a your-input rule proposed by the assistant (live-params.json), so
// the output says, for every posting, which rule kept or dropped it.
//
//   node select-postings.mjs --history <scan-history.tsv> --boards <boards.json> --out-dir <dir>
//                            [--families role-families.json] [--params live-params.json]
//
// Writes <dir>/selected-postings.json (every posting and its rule outcomes) and <dir>/h1-urls.txt (the chosen
// URLs, one per line, for npm run ats:liveness -- --file). Offline: reads local files only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const US_STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware',
  'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma',
  'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont',
  'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'district of columbia'];
const US_CODES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
// Places that make a "Remote" posting non-U.S. (a remote role in Canada does not help a U.S. visa plan).
const NON_US = ['canada', 'toronto', 'vancouver', 'montreal', 'united kingdom', 'uk', 'london', 'ireland', 'dublin',
  'germany', 'berlin', 'france', 'paris', 'netherlands', 'amsterdam', 'spain', 'poland', 'india', 'bangalore',
  'bengaluru', 'hyderabad', 'pune', 'singapore', 'japan', 'tokyo', 'australia', 'sydney', 'brazil', 'mexico',
  'israel', 'tel aviv', 'emea', 'apac', 'latam', 'europe'];

/** Is this location in the United States (or remote within it)? A rule, not a fact: the report labels it. */
export function usLocation(location) {
  const raw = String(location || '');
  const loc = raw.toLowerCase();
  if (!loc.trim()) return { us: false, why: 'no location given' };
  const nonUs = NON_US.find((w) => new RegExp(`\\b${w}\\b`).test(loc));
  const usWord = /\b(united states|usa|u\.s\.|us)\b/.test(loc) ? 'United States named' : null;
  const state = US_STATES.find((s) => new RegExp(`\\b${s}\\b`).test(loc));
  const code = US_CODES.find((c) => new RegExp(`(^|[,(\\s-])${c}($|[,)\\s;•])`).test(raw));
  if (nonUs && !usWord && !state && !code) return { us: false, why: `non-U.S. place (${nonUs})` };
  if (usWord) return { us: true, why: usWord };
  if (state) return { us: true, why: `U.S. state (${state})` };
  if (code) return { us: true, why: `U.S. state code (${code})` };
  if (/\bremote\b/.test(loc) && !nonUs) return { us: true, why: 'remote, no country given (assumed U.S.; a person checks)' };
  return { us: false, why: 'no U.S. place recognised' };
}

/** Title rule from role-families.json: include hit, no exclude hit; senior markers flag the level. */
export function titleRule(title, family) {
  const re = (p) => new RegExp(p, 'i');
  const inc = family.include.find((p) => re(p).test(title));
  const exc = family.exclude.find((p) => re(p).test(title));
  const senior = (family.senior_markers || []).find((p) => re(p).test(title));
  return { family: Boolean(inc) && !exc, included_by: inc || null, excluded_by: exc || null, senior: Boolean(senior) };
}

/** scan-history.tsv rows (header: url first_seen portal title company status location). */
export function parseHistory(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split('\t');
  const need = ['url', 'title', 'company', 'location'];
  for (const k of need) if (!head.includes(k)) throw new Error(`scan history has no "${k}" column (header: ${head.join(', ')})`);
  return lines.slice(1).map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']));
  });
}

// Within a company: titles without a senior marker first, then titles that name the backend family most directly, then a stable order.
const DIRECT = /\b(back[\s-]?end|platform|infrastructure|distributed|systems)\b/i;
function rank(a, b) {
  return (a.rule.senior - b.rule.senior)
    || (DIRECT.test(b.title) - DIRECT.test(a.title))
    || a.title.localeCompare(b.title) || a.url.localeCompare(b.url);
}

export function select({ history, boards, family, params }) {
  const order = boards.companies.filter((c) => c.hit).map((c) => c.company); // base-run order, best composite first
  const byCompany = new Map(order.map((c) => [c, []]));
  const postings = history.map((h) => {
    const rule = titleRule(h.title, family);
    const loc = usLocation(h.location);
    const liveExclude = (params.exclude_title_patterns?.value || []).find((pat) => new RegExp(pat, 'i').test(h.title)) || null;
    const keep = rule.family && !liveExclude && loc.us && (params.allow_senior.value || !rule.senior);
    const why = liveExclude ? `title excluded by the author's live rule ${liveExclude}`
      : !rule.family ? (rule.excluded_by ? `title excluded by ${rule.excluded_by}` : 'title outside the backend family')
      : !loc.us ? `location: ${loc.why}`
      : (!params.allow_senior.value && rule.senior) ? 'senior-level title (the candidate has not started work)'
      : `kept: ${loc.why}`;
    const p = { company: h.company, title: h.title, location: h.location, url: h.url, rule, live_exclude: liveExclude, location_rule: loc, eligible: keep, why };
    if (keep && byCompany.has(h.company)) byCompany.get(h.company).push(p);
    return p;
  });
  const chosen = [];
  const perCompany = [];
  for (const company of order) {
    const pool = byCompany.get(company).sort(rank);
    const take = pool.slice(0, params.max_postings_per_company.value);
    const kept = take.slice(0, Math.max(0, params.max_postings_total.value - chosen.length));
    perCompany.push({ company, postings_found: postings.filter((p) => p.company === company).length,
      eligible: pool.length, chosen: kept.map((p) => p.url), past_total_cap: take.length - kept.length });
    chosen.push(...kept);
  }
  return { postings, perCompany, chosen };
}

function parseArgs(argv) {
  const a = { families: path.join(HERE, 'role-families.json'), params: path.join(HERE, 'live-params.json') };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (['--history', '--boards', '--out-dir', '--families', '--params'].includes(k)) a[k.slice(2).replace('-dir', 'Dir')] = argv[++i];
    else throw new Error(`unknown argument ${k}`);
  }
  if (!a.history || !a.boards || !a.outDir) throw new Error('usage: select-postings.mjs --history <scan-history.tsv> --boards <boards.json> --out-dir <dir>');
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const history = parseHistory(fs.readFileSync(a.history, 'utf8'));
  const boards = JSON.parse(fs.readFileSync(a.boards, 'utf8'));
  const family = JSON.parse(fs.readFileSync(a.families, 'utf8')).families['backend-platform-swe'];
  const params = JSON.parse(fs.readFileSync(a.params, 'utf8'));
  const res = select({ history, boards, family, params });
  fs.mkdirSync(a.outDir, { recursive: true });
  fs.writeFileSync(path.join(a.outDir, 'selected-postings.json'), JSON.stringify({
    _about: 'Postings found by the repository scanner and the rule outcome for each. Title, location and URL: record (the job board). Kept or dropped: your-input rules from live-params.json (each value labelled with who decided it) and role-families.json (the title rule, proposed by the assistant). Chosen: the first posting per company by the ranking in select-postings.mjs, companies in base-run order until the total cap is reached; past_total_cap counts a company\'s fitting postings the cap left out.',
    generated: new Date().toISOString(),
    params: Object.fromEntries(Object.entries(params).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, v.value])),
    postings_scanned: res.postings.length,
    postings_eligible: res.postings.filter((p) => p.eligible).length,
    companies: res.perCompany,
    chosen: res.chosen,
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(a.outDir, 'h1-urls.txt'),
    `# Postings for gate H1, chosen by select-postings.mjs (one per company, at most ${params.max_postings_total.value}).\n`
    + res.chosen.map((p) => p.url).join('\n') + '\n');
  for (const c of res.perCompany) console.log(`${String(c.eligible).padStart(3)} eligible of ${String(c.postings_found).padStart(4)}  ${c.company}${c.chosen.length ? '  -> chosen' : c.past_total_cap ? '  -> left out by the total cap' : ''}`);
  console.log(`\nchosen for gate H1: ${res.chosen.length} postings`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (err) { console.error(`select-postings: ${err.message}`); process.exit(2); }
}
