// find-boards.mjs: propose a public job board for each shortlisted company (live step L0).
//
// The company table has names but no careers pages, so the live step needs board addresses from somewhere. This
// helper tries a few board names made from the company name on the three public job-board APIs the repository's
// scanner supports (Greenhouse, Lever, Ashby), through the scanner's own provider modules, and keeps the first one
// that answers with at least one job. A hit is a proposal, not a fact: a short board name can belong to a different
// company (COHERE HEALTH INC and the board "cohere" are not the same employer), so a person confirms the company
// before gate H1 clears (recipe, gate H1).
//
//   node find-boards.mjs --scores <role-scores.json> --out-dir <dir> [--max-companies N]
//
// Reads the base run's role-scores.json and keeps the Apply and Consider rows. Writes <dir>/boards.json (every
// attempt, labelled) and <dir>/live-portals.yml (the scanner's input, hits only). Network: GET requests to the
// three public job-board APIs only, through scripts/ats/providers/*.mjs. Nothing else is read or written.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../..');
const PROVIDERS = path.join(REPO, 'scripts/ats/providers');

// Board address patterns the providers auto-detect (scripts/ats/providers/*.mjs), tried in this order.
export const BOARD_URL = {
  greenhouse: (slug) => `https://job-boards.greenhouse.io/${slug}`,
  lever: (slug) => `https://jobs.lever.co/${slug}`,
  ashby: (slug) => `https://jobs.ashbyhq.com/${slug}`,
};

const LEGAL = new Set(['inc', 'incorporated', 'corp', 'corporation', 'co', 'company', 'llc', 'ltd', 'limited',
  'lp', 'plc', 'holdings', 'holding', 'group', 'usa', 'us', 'america', 'the']);
const GENERIC = new Set(['technologies', 'technology', 'tech', 'labs', 'lab', 'software', 'systems', 'solutions',
  'platform', 'global', 'industries', 'intelligent', 'ai']);

/**
 * Board names to try for one company, strongest first. Each carries how it was made, because a name made from the
 * first word alone is the weakest guess and the report says so.
 */
export function slugCandidates(company) {
  const words = String(company).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/).filter(Boolean);
  const core = words.filter((w) => !LEGAL.has(w));
  const out = [];
  const add = (slug, made_from) => {
    if (slug && /^[a-z0-9-]+$/.test(slug) && !out.some((o) => o.slug === slug)) out.push({ slug, made_from });
  };
  if (!core.length) return out;
  add(core.join(''), 'full name');
  add(core.join('-'), 'full name, hyphenated');
  add(core.filter((w, i) => i === 0 || !GENERIC.has(w)).join(''), 'name without generic words');
  if (core.length > 1) add(core[0], 'first word only (weakest guess)');
  return out;
}

/** The Apply and Consider companies of a base run, best composite first, one row per company name. */
export function shortlistFrom(scores) {
  const seen = new Set();
  return [...(scores.roles || [])]
    .filter((r) => r.recommendation === 'Apply' || r.recommendation === 'Consider')
    .sort((a, b) => b.composite - a.composite || a.company.localeCompare(b.company))
    .filter((r) => (seen.has(r.company) ? false : seen.add(r.company)))
    .map((r) => ({ company: r.company, recommendation: r.recommendation, composite: r.composite }));
}

async function loadProviders() {
  const out = {};
  for (const id of Object.keys(BOARD_URL)) {
    out[id] = (await import(pathToFileURL(path.join(PROVIDERS, `${id}.mjs`)).href)).default;
  }
  const { makeHttpCtx } = await import(pathToFileURL(path.join(PROVIDERS, '_http.mjs')).href);
  return { providers: out, ctx: makeHttpCtx() };
}

/** Try each board name on each provider until one answers with jobs. Every attempt is kept. */
export async function findBoard(company, { providers, ctx }) {
  const attempts = [];
  for (const { slug, made_from } of slugCandidates(company)) {
    for (const [id, provider] of Object.entries(providers)) {
      const careers_url = BOARD_URL[id](slug);
      try {
        const jobs = await provider.fetch({ name: company, careers_url }, ctx);
        attempts.push({ provider: id, slug, made_from, careers_url, result: jobs.length ? 'jobs' : 'empty', jobs: jobs.length });
        if (jobs.length) return { company, hit: { provider: id, slug, made_from, careers_url, jobs: jobs.length }, attempts };
      } catch (err) {
        attempts.push({ provider: id, slug, made_from, careers_url, result: 'no board', error: String(err.message || err).slice(0, 160) });
      }
    }
  }
  return { company, hit: null, attempts };
}

function yamlString(s) {
  return JSON.stringify(String(s)); // a JSON string is a valid YAML double-quoted string
}

/** The scanner's input for the hits. Title and location filters stay broad; select-postings.mjs applies the rule. */
export function portalsYaml(found) {
  const lines = [
    '# Scanner input for the live step, written by find-boards.mjs. Board ownership is a proposal:',
    '# a person confirms each company at gate H1. Filters are broad on purpose; select-postings.mjs',
    '# applies the role-family rule from role-families.json.',
    'title_filter:',
    '  positive: ["engineer", "developer", "sre", "devops"]',
    '  negative: ["intern"]',
    'tracked_companies:',
  ];
  for (const f of found.filter((x) => x.hit)) {
    lines.push(`  - name: ${yamlString(f.company)}`, '    enabled: true',
      `    provider: ${f.hit.provider}`, `    careers_url: ${f.hit.careers_url}`);
  }
  return lines.join('\n') + '\n';
}

function parseArgs(argv) {
  const a = { max: Infinity };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--scores') a.scores = argv[++i];
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
    else if (argv[i] === '--max-companies') a.max = Number(argv[++i]);
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!a.scores || !a.outDir) throw new Error('usage: find-boards.mjs --scores <role-scores.json> --out-dir <dir> [--max-companies N]');
  if (!(a.max > 0)) throw new Error('--max-companies must be a positive number');
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scores = JSON.parse(fs.readFileSync(args.scores, 'utf8'));
  const shortlist = shortlistFrom(scores).slice(0, args.max);
  const env = await loadProviders();
  const found = [];
  for (const row of shortlist) { // sequential and polite: one company at a time
    const f = await findBoard(row.company, env);
    found.push({ ...row, ...f });
    console.log(`${f.hit ? 'board ' : 'none  '} ${row.company}${f.hit ? `  -> ${f.hit.provider}/${f.hit.slug} (${f.hit.jobs} jobs; ${f.hit.made_from})` : ''}`);
  }
  fs.mkdirSync(args.outDir, { recursive: true });
  const record = {
    _about: 'Board proposals for the live step. label: record (the API answered with jobs) for the job count; model-judgment (a name rule by the assistant) for which company a board belongs to. A person confirms the company at gate H1.',
    generated: new Date().toISOString(),
    scores_file: path.basename(args.scores),
    shortlisted: shortlist.length,
    with_board: found.filter((f) => f.hit).length,
    companies: found,
  };
  fs.writeFileSync(path.join(args.outDir, 'boards.json'), JSON.stringify(record, null, 2) + '\n');
  fs.writeFileSync(path.join(args.outDir, 'live-portals.yml'), portalsYaml(found));
  console.log(`\n${record.with_board} of ${record.shortlisted} shortlisted companies have a board on Greenhouse, Lever or Ashby (proposals; a person confirms each at gate H1).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(`find-boards: ${err.message}`); process.exit(2); });
}
