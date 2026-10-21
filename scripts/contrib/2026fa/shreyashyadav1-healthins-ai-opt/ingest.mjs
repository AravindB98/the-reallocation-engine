#!/usr/bin/env node
// ingest.mjs — the ONLY networked step of healthins-ai-opt (SNICKERDOODLE P2:
// only ingest scripts touch the network; run.mjs reads the snapshot offline).
//
// For each board in a portals file it:
//   1. fetches the offers with the repo's own provider layer (scripts/ats/providers/*.mjs),
//   2. resolves the board to ONE row of the 80 Days CSV (exact normalised name; sibling check),
//   3. keeps software-type, level-eligible, US-or-unclear-location roles   (all offline, cheap),
//   4. fetches each survivor's posting text and screens it (jd-screen.mjs),
//   5. only then runs the repo's liveness checker (scripts/ats/liveness-browser.mjs,
//      Playwright, one page at a time) — the slow step goes last.
// A board that fails to load is recorded as failed, never as "0 jobs".
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/ingest.mjs \
//        [--portals f.yml] [--persona p.json] [--csv f] [--out snapshot.json] [--raw-dir private/real-postings]
//        [--no-liveness] [--max-per-board 12] [--fetched-on YYYY-MM-DD]
//
// Writes: the reduced snapshot (--out; titles, URLs, locations, findings — no posting text)
//         and the raw snapshot with posting text under private/ (gitignored, never committed).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import yaml from 'js-yaml';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import lever from '../../../ats/providers/lever.mjs';
import ashby from '../../../ats/providers/ashby.mjs';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';
import {
  SRC, parseCsv, normalizeName, buildHostIndex, entitySiblings, boardCorroboration, postingIsSoftwareType, levelOf,
  DEFAULT_EXCLUDE_LEVELS, classifyLocation, isoDate, parseDate,
} from './lib.mjs';
import { screenPosting, htmlToText } from './jd-screen.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(ROOT, p) || '.';
export const INGEST_VERSION = '0.2.0';
export const PROVIDERS = { greenhouse, lever, ashby };
export const LIVENESS_METHOD = 'scripts/ats/liveness-browser.mjs checkUrlLiveness (Playwright)';

export const localDate = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in the machine's zone

export function boardSlug(entry) {
  const u = entry.careers_url || '';
  const pick = (re) => (u.match(re) || [])[1] || null;
  if (entry.provider === 'greenhouse') return pick(/greenhouse\.io\/([^/?#]+)/);
  if (entry.provider === 'lever') return pick(/jobs\.lever\.co\/([^/?#]+)/);
  if (entry.provider === 'ashby') return pick(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  return null;
}

// url → posting text, from the same public board APIs the providers use. One request per board.
export async function fetchDescriptions(entry, ctx) {
  const slug = boardSlug(entry);
  const map = new Map();
  if (!slug) return map;
  if (entry.provider === 'greenhouse') {
    const j = await ctx.fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { redirect: 'error' });
    for (const x of j.jobs || []) if (x.absolute_url) map.set(x.absolute_url, htmlToText(x.content));
  } else if (entry.provider === 'lever') {
    const j = await ctx.fetchJson(`https://api.lever.co/v0/postings/${slug}`);
    for (const x of Array.isArray(j) ? j : []) {
      if (!x.hostedUrl) continue;
      const lists = (x.lists || []).map((l) => `${l.text}\n${htmlToText(l.content)}`);
      map.set(x.hostedUrl, [x.descriptionPlain, ...lists, x.additionalPlain].filter(Boolean).join('\n'));
    }
  } else if (entry.provider === 'ashby') {
    const j = await ctx.fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
    for (const x of j.jobs || []) if (x.jobUrl) map.set(x.jobUrl, x.descriptionPlain || htmlToText(x.descriptionHtml));
  }
  return map;
}

function roleId(boardName, url, title) {
  const m = url.match(/gh_jid=(\d+)/) || url.match(/\/jobs\/(\d+)/) || url.match(/\/([0-9a-f]{8}-[0-9a-f-]{27})(?:[/?#]|$)/i);
  return `${normalizeName(boardName)}-${m ? m[1].slice(0, 12) : normalizeName(title).slice(0, 12)}`;
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// Everything that touches the world is injected, so the offline tests can drive
// the exact same code with fakes (see test/ingest.test.mjs).
//   providers: { id: { fetch(entry, ctx) } }   describe(entry, ctx) → Map(url → text)
//   liveness:  async (url) → { result: active|expired|uncertain, code?, reason? }  | null to skip
export async function runIngest({ portals, persona = {}, csvRows, csvRel, providers = PROVIDERS, describe = fetchDescriptions,
  liveness = null, ctx = makeHttpCtx(), fetchedOn = localDate(), maxPerBoard = 12, log = () => {} }) {
  const byName = new Map();
  for (const r of csvRows) {
    const k = normalizeName(r.company_name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(r);
  }
  const hostIndex = buildHostIndex(csvRows);
  const levels = Array.isArray(persona.exclude_levels) ? persona.exclude_levels : DEFAULT_EXCLUDE_LEVELS;
  const entries = (portals.tracked_companies || []).filter((e) => e && e.enabled !== false);

  // 1+2+3: boards, entity gate, cheap filters (no browser, no posting text yet)
  const boards = await pool(entries, 6, async (entry) => {
    const board = { name: entry.name, provider: entry.provider, careers_url: entry.careers_url, csv_company_claimed: entry.csv_company || entry.name,
      bucket: entry.bucket || null, note: entry.note || null, status: 'ok', error: null, offers_found: 0,
      funnel: { software_type: 0, level_excluded: 0, non_us_location: 0, eligible: 0, truncated: 0 }, entity: null, entity_block: null };
    let offers = [];
    try {
      const provider = providers[entry.provider];
      if (!provider) throw new Error(`unknown provider: ${entry.provider}`);
      offers = await provider.fetch(entry, ctx);
      if (!Array.isArray(offers)) throw new Error(`${entry.provider}: fetch() did not return an array`);
    } catch (e) {
      board.status = 'failed'; board.error = String(e.message || e).slice(0, 200);
      return { board, roles: [], offers: [] };
    }
    board.offers_found = offers.length;

    const matches = byName.get(normalizeName(entry.csv_company || entry.name)) || [];
    if (matches.length === 0) board.entity = { status: 'not-found', reason: 'entity-not-found' };
    else if (matches.length > 1) board.entity = { status: 'ambiguous', reason: 'entity-ambiguous', rows: matches.length };
    else {
      const row = matches[0];
      const sib = entitySiblings(row, hostIndex);
      board.entity = { status: 'matched', csv_company: row.company_name, industry: { value: row.industry, source: SRC.record, file: csvRel },
        website: row.website || null, siblings: sib, corroboration: boardCorroboration(boardSlug(entry), row.website) };
      if (sib.has_approvals) board.entity_block = 'entity-sibling-has-approvals';
    }

    const software = offers.filter((o) => postingIsSoftwareType(o.title || ''));
    board.funnel.software_type = software.length;
    const scoreable = board.entity.status === 'matched' && !board.entity_block;
    const roles = [];
    // level / location / cap counts exist only for boards the entity gate let through:
    // a blocked board's roles are never looked at one by one
    for (const o of scoreable ? software : []) {
      const level = levelOf(o.title, levels);
      const locationClass = classifyLocation(o.location);
      let pre = null;
      if (level) { pre = { stage: 'level', reason: `title level "${level}" is excluded for this persona (persona.exclude_levels)` }; board.funnel.level_excluded++; }
      else if (locationClass === 'non-us') { pre = { stage: 'location', reason: `location "${o.location}" is outside the U.S.; OPT work must be in the U.S.` }; board.funnel.non_us_location++; }
      else board.funnel.eligible++;
      roles.push({ role_id: roleId(entry.name, o.url, o.title), company: entry.name, csv_company: board.entity.csv_company, title: o.title,
        posting_url: o.url, location: o.location || '', location_class: locationClass, level, bucket: entry.bucket || null,
        pre_excluded: pre, jd_screen: null, liveness: null, source: `ats-provider:${entry.provider}`, fetched_on: fetchedOn });
    }
    // cap the eligible roles per board (the cap is logged, never silent)
    const eligible = roles.filter((r) => !r.pre_excluded);
    if (eligible.length > maxPerBoard) {
      board.funnel.truncated = eligible.length - maxPerBoard;
      for (const r of eligible.slice(maxPerBoard)) r.pre_excluded = { stage: 'cap', reason: `beyond --max-per-board ${maxPerBoard}` };
    }
    return { board, roles, offers };
  });

  // 4+5: only for roles that survived every offline gate
  const raw = { fetched_on: fetchedOn, boards: [], descriptions: {} };
  const roles = [];
  const live = { checked: 0, active: 0, expired: 0, uncertain: 0 };
  const jd = { fetched: 0, missing: 0, excluded: 0, experience_excluded: 0 };
  for (const { board, roles: rs, offers } of boards) {
    raw.boards.push({ name: board.name, status: board.status, error: board.error, offers });
    const eligible = rs.filter((r) => !r.pre_excluded);
    if (eligible.length) {
      const entry = entries.find((e) => e.name === board.name);
      let texts = new Map();
      try { texts = await describe(entry, ctx); } catch (e) { board.describe_error = String(e.message || e).slice(0, 200); }
      for (const r of eligible) {
        const text = texts.get(r.posting_url);
        if (text) raw.descriptions[r.posting_url] = text;
        r.jd_screen = screenPosting(text);
        if (r.jd_screen.status === 'missing') jd.missing++; else jd.fetched++;
        if (r.jd_screen.requirement_found) {
          r.pre_excluded = { stage: 'posting-screen', reason: 'the posting states a citizenship, clearance or U.S.-person requirement (quoted in jd_screen)' };
          jd.excluded++;
          continue;
        }
        // the posting's own quoted years-of-experience requirement, against what this person has
        const maxYears = Number.isInteger(persona.max_years_experience_ok) ? persona.max_years_experience_ok : null;
        const asked = r.jd_screen.min_years_experience;
        if (maxYears != null && asked?.found && asked.value > maxYears) {
          r.pre_excluded = { stage: 'experience', reason: `the posting asks for ${asked.value}+ years of experience; persona.max_years_experience_ok is ${maxYears}` };
          jd.experience_excluded++;
          continue;
        }
        if (!liveness) { r.liveness = { status: 'unchecked' }; continue; }
        log(`  liveness ${r.company} | ${r.title}`);
        const res = await liveness(r.posting_url);
        live.checked++; live[res.result] = (live[res.result] || 0) + 1;
        r.liveness = { status: res.result, code: res.code || null, reason: res.reason || null, checked_on: fetchedOn, method: LIVENESS_METHOD, source: SRC.record };
      }
    }
    roles.push(...rs);
  }

  const sum = (f) => boards.reduce((s, b) => s + f(b.board), 0);
  const funnel = {
    boards: boards.length, boards_failed: boards.filter((b) => b.board.status === 'failed').length,
    offers_found: sum((b) => b.offers_found), software_type: sum((b) => b.funnel.software_type),
    boards_entity_blocked: boards.filter((b) => b.board.status === 'ok' && (b.board.entity.status !== 'matched' || b.board.entity_block)).length,
    software_type_on_entity_blocked_boards: boards.filter((b) => b.board.status === 'ok' && (b.board.entity.status !== 'matched' || b.board.entity_block)).reduce((s, b) => s + b.board.funnel.software_type, 0),
    level_excluded: sum((b) => b.funnel.level_excluded), non_us_location: sum((b) => b.funnel.non_us_location),
    over_cap: sum((b) => b.funnel.truncated),
    posting_text_fetched: jd.fetched, posting_text_missing: jd.missing, posting_screen_excluded: jd.excluded, experience_excluded: jd.experience_excluded,
    liveness_checked: live.checked, liveness_active: live.active || 0, liveness_expired: live.expired || 0, liveness_uncertain: live.uncertain || 0,
  };
  const snapshot = {
    _meta: { snapshot: true, screened: true, recipe: 'healthins-ai-opt', ingest_version: INGEST_VERSION, fetched_on: fetchedOn,
      csv: csvRel, liveness_checker: liveness ? LIVENESS_METHOD : null,
      note: 'Reduced snapshot: titles, URLs, locations and screen findings only. Posting text lives in private/real-postings/ (gitignored).' },
    funnel, boards: boards.map((b) => b.board), roles,
  };
  return { snapshot, raw };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def;
}
const flag = (name) => process.argv.includes(`--${name}`);

async function main() {
  const fetchedOn = arg('fetched-on', localDate());
  if (!parseDate(fetchedOn)) { console.error('✗ --fetched-on must be YYYY-MM-DD'); process.exit(2); }
  const portalsPath = path.resolve(arg('portals', path.join(HERE, 'inputs/portals.healthins.yml')));
  const personaPath = path.resolve(arg('persona', path.join(HERE, 'inputs/persona.example.json')));
  const csvPath = path.resolve(arg('csv', path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv')));
  const outPath = path.resolve(arg('out', path.join(ROOT, 'assignments/submissions/shreyashyadav1/runs', fetchedOn, 'candidates.snapshot.json')));
  const rawDir = path.resolve(arg('raw-dir', path.join(ROOT, 'private/real-postings')));
  const maxPerBoard = Number(arg('max-per-board', '12'));

  const relOut = path.relative(ROOT, outPath);
  const okOut = relOut.startsWith('..') || /^(course\/2026fa\/submissions\/shreyashyadav1|assignments\/submissions\/shreyashyadav1|scripts\/contrib\/2026fa\/shreyashyadav1-healthins-ai-opt|output)(\/|$)/.test(relOut);
  if (!okOut) { console.error(`✗ --out ${relOut} is inside the repo but outside this contribution's namespaces; refusing to write there`); process.exit(2); }
  const relRaw = path.relative(ROOT, rawDir);
  if (!relRaw.startsWith('..') && !/^private(\/|$)/.test(relRaw)) { console.error(`✗ --raw-dir ${relRaw} must be under private/ (raw postings are never committed)`); process.exit(2); }
  for (const [p, what] of [[portalsPath, 'portals file'], [personaPath, 'persona'], [csvPath, '80 Days CSV']]) {
    if (!fs.existsSync(p)) { console.error(`✗ ${what} not found: ${rel(p)}`); process.exit(2); }
  }

  const portals = yaml.load(fs.readFileSync(portalsPath, 'utf8'));
  const persona = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
  const csvRows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  console.log(`healthins-ai-opt ingest ${INGEST_VERSION} · ${fetchedOn} · portals ${rel(portalsPath)}`);

  let liveness = null, closeBrowser = async () => {};
  if (!flag('no-liveness')) {
    const { chromium } = await import('playwright');
    const { checkUrlLiveness } = await import('../../../ats/liveness-browser.mjs');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    liveness = (url) => checkUrlLiveness(page, url); // sequential by construction: one page, awaited in a loop
    closeBrowser = () => browser.close();
  }
  let result;
  try {
    result = await runIngest({ portals, persona, csvRows, csvRel: rel(csvPath), liveness, fetchedOn, maxPerBoard, log: (m) => console.log(m) });
  } finally { await closeBrowser(); }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result.snapshot, null, 2) + '\n');
  fs.mkdirSync(rawDir, { recursive: true });
  const rawPath = path.join(rawDir, `healthins-${fetchedOn}.json`);
  fs.writeFileSync(rawPath, JSON.stringify(result.raw));

  const f = result.snapshot.funnel;
  console.log(`\nboards ${f.boards} (failed ${f.boards_failed}) · offers ${f.offers_found} · software-type ${f.software_type}`);
  console.log(`  boards the entity gate stopped: ${f.boards_entity_blocked} (${f.software_type_on_entity_blocked_boards} software-type offers never scored)`);
  console.log(`  on scoreable boards: level-excluded ${f.level_excluded} · non-U.S. ${f.non_us_location} · over cap ${f.over_cap}`);
  console.log(`  posting text fetched ${f.posting_text_fetched} · missing ${f.posting_text_missing} · screen-excluded ${f.posting_screen_excluded} · asks too much experience ${f.experience_excluded}`);
  console.log(`  liveness checked ${f.liveness_checked}: active ${f.liveness_active} · expired ${f.liveness_expired} · uncertain ${f.liveness_uncertain}`);
  for (const b of result.snapshot.boards.filter((x) => x.status === 'failed')) console.log(`  ✗ board failed: ${b.name} — ${b.error}`);
  console.log(`  wrote ${rel(outPath)} (reduced) and ${rel(rawPath)} (raw, gitignored)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(`✗ ${e.message}`); process.exit(1); });
}
