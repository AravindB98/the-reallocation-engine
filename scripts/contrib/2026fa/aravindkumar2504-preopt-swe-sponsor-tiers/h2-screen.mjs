// h2-screen.mjs: quote the sentences a person must weigh at gate H2 (live step L4, machine assist; closes the
// recipe's "automate the reading part of gate H2" proposal).
//
// For each chosen posting it fetches the posting text from the job board's public API (Greenhouse or Lever) and
// quotes every sentence that mentions sponsorship, citizenship or U.S.-person status, clearance or export control,
// work authorization, degree level, a graduation window or start date, or contract terms. It decides nothing. A
// screen that finds no such sentence is NOT a pass: a person still reads the posting and decides H2.
//
//   node h2-screen.mjs --selected <selected-postings.json> --boards <boards.json> --out-dir <dir>
//
// Writes <dir>/h2-screen.json. Only the quoted sentences and a SHA-256 of the posting text are kept, not the
// posting itself. Network: GET to boards-api.greenhouse.io and api.lever.co only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256Buffer } from './evidence.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');

export const CATEGORIES = [
  ['sponsorship', /\bsponsor(ship|ed|ing|s)?\b/i],
  ['citizenship or U.S.-person status', /\b(u\.?\s?s\.?|united states)\s+(citizen(ship)?s?|persons?|nationals?)\b|\bpermanent resident|\bgreen card\b/i],
  ['clearance or export control', /\b(security\s+)?clearance\b|\bITAR\b|\bexport[\s-]control|\bdeemed export\b/i],
  ['work authorization', /\b(authori[sz]ed|eligible)\s+to\s+work\b|\bwork\s+authori[sz]ation\b|\bright\s+to\s+work\b|\bemployment\s+authori[sz]ation\b/i],
  ['degree level', /\bph\.?\s?d\.?\b|\bdoctora(l|te)\b|\bmaster'?s\b|\bbachelor'?s\b/i],
  ['graduation window or start date', /\bgraduat(e|es|ed|ing|ion)\b.{0,80}\b(20\d\d|spring|summer|fall|autumn|winter|december|may|june)\b|\bstart(ing)?\s+date\b/i],
  ['contract terms', /\bcontract(or|ors)?\b|\btemporary\b|\bc2c\b|\b1099\b|\bw-?2\b/i],
];

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&ndash;': '–', '&mdash;': '—' };
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash);/g, (m) => ENTITIES[m])
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

/** Posting HTML (possibly entity-escaped, as Greenhouse sends it) to plain sentences. */
export function sentences(html) {
  let s = decode(decode(String(html || ''))); // Greenhouse escapes once; a second pass handles &amp;nbsp; and similar
  s = s.replace(/<\s*(br|\/p|\/li|\/div|\/h\d|li)\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ');
  return [...new Set(s.split(/\n+|(?<=[.!?])\s+(?=[A-Z(])/).map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x.length > 2))];
}

export function screen(text) {
  const flags = [];
  for (const sentence of sentences(text)) {
    for (const [category, re] of CATEGORIES) {
      if (re.test(sentence)) flags.push({ category, sentence: sentence.length > 300 ? `${sentence.slice(0, 297)}...` : sentence });
    }
  }
  return flags;
}

/** Where the posting text lives: Greenhouse board + job id, or Lever company + posting id. */
export function apiFor(url, boardSlug, provider) {
  const u = new URL(url);
  if (provider === 'greenhouse') {
    const id = u.searchParams.get('gh_jid') || (u.pathname.match(/\/jobs\/(\d+)/) || [])[1];
    return id ? `https://boards-api.greenhouse.io/v1/boards/${boardSlug}/jobs/${id}` : null;
  }
  if (provider === 'lever') {
    const m = u.hostname === 'jobs.lever.co' && u.pathname.match(/^\/([^/]+)\/([0-9a-f-]{20,})/i);
    return m ? `https://api.lever.co/v0/postings/${m[1]}/${m[2]}?mode=json` : null;
  }
  return null;
}

const ALLOWED = new Set(['boards-api.greenhouse.io', 'api.lever.co']);

async function fetchPostingText(api, fetchJson) {
  if (!ALLOWED.has(new URL(api).hostname)) throw new Error(`untrusted host for ${api}`);
  const j = await fetchJson(api, { redirect: 'error' });
  if (typeof j?.content === 'string') return j.content; // Greenhouse
  const parts = [j?.descriptionPlain, j?.additionalPlain, ...(j?.lists || []).map((l) => `${l.text}\n${l.content}`)];
  const text = parts.filter(Boolean).join('\n');
  if (text) return text; // Lever
  throw new Error('the API answered without posting text');
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--selected') a.selected = argv[++i];
    else if (argv[i] === '--boards') a.boards = argv[++i];
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!a.selected || !a.boards || !a.outDir) throw new Error('usage: h2-screen.mjs --selected <selected-postings.json> --boards <boards.json> --out-dir <dir>');
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const chosen = JSON.parse(fs.readFileSync(a.selected, 'utf8')).chosen || [];
  const boards = new Map(JSON.parse(fs.readFileSync(a.boards, 'utf8')).companies.filter((c) => c.hit).map((c) => [c.company, c.hit]));
  const { fetchJson } = await import(pathToFileURL(path.join(REPO, 'scripts/ats/providers/_http.mjs')).href);
  const out = [];
  for (const p of chosen) {
    const hit = boards.get(p.company);
    const api = hit ? apiFor(p.url, hit.slug, hit.provider) : null;
    const row = { company: p.company, title: p.title, url: p.url, api, fetched: false };
    if (!api) { row.note = 'no text API for this board; read the posting'; out.push(row); continue; }
    try {
      const text = await fetchPostingText(api, fetchJson);
      row.fetched = true;
      row.text_sha256 = sha256Buffer(Buffer.from(text));
      row.flags = screen(text);
    } catch (err) {
      row.note = `could not fetch the posting text (${String(err.message || err).slice(0, 120)}); read the posting`;
    }
    out.push(row);
    console.log(`${row.fetched ? `${String(row.flags.length).padStart(2)} quoted` : 'no text  '}  ${p.company} | ${p.title}`);
  }
  fs.mkdirSync(a.outDir, { recursive: true });
  fs.writeFileSync(path.join(a.outDir, 'h2-screen.json'), JSON.stringify({
    _about: 'Gate H2, machine assist. flags: record (sentences quoted word for word from the posting text the job board API returned; text_sha256 identifies that text). category: a your-input pattern from h2-screen.mjs, proposed by the assistant. The screen decides nothing; finding no sentence is not a pass. A person reads each posting and decides H2.',
    generated: new Date().toISOString(),
    postings: out,
  }, null, 2) + '\n');
  console.log('\nThe screen decides nothing: a person reads each posting and decides gate H2.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(`h2-screen: ${err.message}`); process.exit(2); });
}
