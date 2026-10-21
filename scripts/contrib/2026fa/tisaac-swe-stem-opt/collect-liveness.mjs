import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import greenhouse from '../../../ats/providers/greenhouse.mjs';
import { makeHttpCtx } from '../../../ats/providers/_http.mjs';
import { checkUrlLiveness } from '../../../ats/liveness-browser.mjs';

// collect-liveness.mjs — the only network step of this mode.
// Collects two liveness signals per job, both from code already in the repo:
//   1. board:   is the job id still listed on the company's Greenhouse board?
//               (scripts/ats/providers/greenhouse.mjs → boards-api.greenhouse.io)
//   2. browser: does the posting page look open? (scripts/ats/liveness-browser.mjs,
//               the same check `npm run ats:liveness` runs)
// Writes one evidence file; index.js turns it into the liveness gate offline.
//
// Usage (from repo root):
//   node scripts/contrib/2026fa/tisaac-swe-stem-opt/collect-liveness.mjs --jobs <jobs.json> --out <liveness.json>

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function argValue(flag, fallback) {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
}
const JOBS_PATH = argValue('--jobs', path.join(__dirname, 'jobs-2026-10-21.json'));
const OUT_PATH = argValue('--out', path.join(__dirname, 'liveness-2026-10-21.json'));

const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
const ctx = makeHttpCtx();

// 1. Board signal: one board fetch per company, then look up each job id.
const boards = {};
for (const board of [...new Set(jobs.map(j => j.greenhouse_board).filter(Boolean))]) {
    try {
        const listed = await greenhouse.fetch({ name: board, careers_url: `https://job-boards.greenhouse.io/${board}` }, ctx);
        boards[board] = { ok: true, job_count: listed.length, urls: listed.map(j => j.url) };
        console.log(`board ${board}: ${listed.length} jobs listed`);
    } catch (error) {
        boards[board] = { ok: false, error: error.message };
        console.warn(`[WARNING] board ${board} could not be fetched: ${error.message}`);
    }
}

// 2. Browser signal: sequential, one page (project rule: never Playwright in parallel).
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];
for (const job of jobs) {
    let board_listed = null;
    const b = boards[job.greenhouse_board];
    const idPattern = new RegExp(`(gh_jid=|/jobs/)${job.greenhouse_job_id}(?!\\d)`);
    if (b && b.ok) board_listed = b.urls.some(u => idPattern.test(u));
    const { result, reason } = await checkUrlLiveness(page, job.url);
    console.log(`${job.id}: board_listed=${board_listed} browser=${result}`);
    results.push({ id: job.id, url: job.url, board: job.greenhouse_board || null, board_listed, browser_result: result, browser_reason: reason || null });
}
await browser.close();

fs.writeFileSync(OUT_PATH, JSON.stringify({ checked_at: new Date().toISOString(), jobs_file: path.basename(JOBS_PATH), results }, null, 2) + '\n');
console.log(`✅ Saved liveness evidence to ${path.relative(path.resolve(__dirname, '../../../../'), OUT_PATH)}`);
