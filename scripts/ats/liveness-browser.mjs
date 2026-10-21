/**
 * liveness-browser.mjs — Playwright-driven liveness check for a single URL.
 *
 * Shared by check-liveness.mjs (CLI tool) and scan.mjs (--verify flag).
 * Returns the same shape as classifyLiveness: { result, reason }.
 */

import { classifyLiveness } from './liveness-core.mjs';

const NAVIGATE_TIMEOUT_MS = 15_000;
const HYDRATION_WAIT_MS = 2_000;

// Defensive guards: URLs come from ATS feeds (mostly trusted) but a misconfigured
// portals.yml entry or a hijacked feed shouldn't be able to point Playwright at
// internal infrastructure. Only allow http(s) and reject loopback/private/link-local.
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe80:/i,
];

// Returns null when the URL is safe to fetch, otherwise a structured guard
// result with a stable `code` (used for routing in scan.mjs) plus a human
// `reason`. Stable codes — not regex on reason strings — drive downstream
// dispatch so the wording can change freely without breaking callers.
function rejectPrivateOrInvalid(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { code: 'invalid_url', reason: 'invalid URL' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { code: 'unsupported_protocol', reason: `unsupported protocol ${parsed.protocol}` };
  }
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    return { code: 'blocked_host', reason: `blocked host ${parsed.hostname}` };
  }
  return null;
}

// A job URL that lands on a page whose URL no longer carries the job's ID has
// been redirected off the posting (typically to a careers search page, which
// has apply-like controls and would otherwise read as "active"). Observed
// 2026-10-03: boards.greenhouse.io/klaviyo/jobs/1000000003 (no such job) →
// Klaviyo careers page → "active". IDs: gh_jid / jobId-style query params, or
// a path segment of 5+ digits or a UUID. A URL with no ID is never flagged.
export function jobIdsIn(url) {
  let u;
  try { u = new URL(url); } catch { return []; }
  const ids = [];
  for (const [k, v] of u.searchParams) if (/^(gh_jid|jobid|job_id|jid|id)$/i.test(k) && v) ids.push(v);
  for (const seg of u.pathname.split('/')) if (/^\d{5,}$/.test(seg) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) ids.push(seg);
  return [...new Set(ids)];
}

export function redirectedOffJob(requestedUrl, finalUrl) {
  const ids = jobIdsIn(requestedUrl);
  if (!ids.length || !finalUrl) return null;
  if (ids.some((id) => finalUrl.includes(id))) return null;
  return { result: 'uncertain', code: 'redirected_off_job', reason: `redirected off the job: no job ID (${ids.join(', ')}) in final URL ${finalUrl}` };
}

export async function checkUrlLiveness(page, url) {
  const guardError = rejectPrivateOrInvalid(url);
  if (guardError) {
    return { result: 'uncertain', code: guardError.code, reason: guardError.reason };
  }
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAVIGATE_TIMEOUT_MS });
    const status = response?.status() ?? 0;

    // Give SPAs (Ashby, Lever, Workday) time to hydrate
    await page.waitForTimeout(HYDRATION_WAIT_MS);

    const finalUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText ?? '');
    const applyControls = await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll('a, button, input[type="submit"], input[type="button"], [role="button"]')
      );

      return candidates
        .filter((element) => {
          if (element.closest('nav, header, footer')) return false;
          if (element.closest('[aria-hidden="true"]')) return false;

          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (!element.getClientRects().length) return false;

          return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
        })
        .map((element) => {
          const label = [
            element.innerText,
            element.value,
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          return label;
        })
        .filter(Boolean);
    });

    const classified = classifyLiveness({ status, finalUrl, bodyText, applyControls });
    // Only an "active" verdict can be a redirect false positive; an expired
    // verdict (404, expired text) stands on its own evidence.
    return (classified.result === 'active' && redirectedOffJob(url, finalUrl)) || classified;
  } catch (err) {
    // Transient failures (timeout, DNS, TLS, 5xx) shouldn't be treated as expired —
    // doing so would cause scan --verify to drop the URL and write it to scan-history,
    // permanently filtering it out on subsequent scans.
    return {
      result: 'uncertain',
      code: 'navigation_error',
      reason: `navigation error: ${err.message.split('\n')[0]}`,
    };
  }
}
