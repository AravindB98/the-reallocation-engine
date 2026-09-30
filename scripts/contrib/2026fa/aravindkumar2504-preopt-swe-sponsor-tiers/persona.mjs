// persona.mjs: read a persona profile and check it, without inventing anything.
//
// The gate G1 rule: every field the run depends on must be present and well-typed, or the
// run stops and names every problem at once. There are no silent defaults.
//
// Only the fields the run needs are returned. Contact details (name, email, phone, links)
// are never read into the result, so they cannot leak into an output file.
//
// A few values may be supplied on the command line when a persona file does not carry them
// (the four older personas have no SOC code or hiring-lag estimate). Any such value is
// recorded as coming from the command line. Both routes are the candidate's own input.

import fs from 'node:fs';
import yaml from 'js-yaml';
import { InputError, isoToDay } from './timeline.mjs';

const SOC = /^\d{2}-\d{4}$/;

/** Parse YAML with the core schema so 2027-06-01 stays a string, not a JS Date. */
export function parsePersonaText(text) {
  const doc = yaml.load(text, { schema: yaml.CORE_SCHEMA });
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new InputError('persona file is not a YAML mapping', ['top level must be a mapping']);
  }
  return doc;
}

const get = (o, path) => path.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);

/**
 * @param {object} doc          parsed persona document
 * @param {object} overrides    values from the command line: { soc, family, daysUsed, daysToStart }
 * @returns persona summary with a `sources` map saying where each value came from
 */
export function validatePersona(doc, overrides = {}) {
  const problems = [];
  const sources = {};

  const pick = (key, fileValue, overrideValue) => {
    if (overrideValue !== undefined && overrideValue !== null) {
      sources[key] = 'command-line';
      return overrideValue;
    }
    sources[key] = 'persona-file';
    return fileValue;
  };

  const needsSponsorship = doc.needs_sponsorship;
  if (typeof needsSponsorship !== 'boolean') {
    problems.push('needs_sponsorship must be true or false (an explicit field; free text is not read)');
  }
  sources.needs_sponsorship = 'persona-file';

  const soc = pick('soc', get(doc, 'target_role.soc'), overrides.soc);
  if (typeof soc !== 'string' || !SOC.test(soc)) problems.push('target_role.soc must be a SOC code like "15-1252" (or pass --soc)');

  const family = pick('family', get(doc, 'target_role.family'), overrides.family);
  if (typeof family !== 'string' || family === '') problems.push('target_role.family must name a role family in role-families.json (or pass --family)');

  const visa = {
    type: get(doc, 'visa.type'),
    ead_start_date: get(doc, 'visa.ead_start_date'),
    opt_end_date: get(doc, 'visa.opt_end_date'),
    unemployment_days_used: pick('unemployment_days_used', get(doc, 'visa.unemployment_days_used'), overrides.daysUsed),
    unemployment_ceiling: get(doc, 'visa.unemployment_ceiling'),
    buffer_target: get(doc, 'visa.buffer_target'),
    stem_eligible: get(doc, 'visa.stem_eligible'),
  };
  sources.visa = 'persona-file';
  for (const k of ['ead_start_date', 'opt_end_date']) {
    try { isoToDay(visa[k]); } catch { problems.push(`visa.${k} must be an ISO date (YYYY-MM-DD)`); }
  }
  if (!Number.isInteger(visa.unemployment_days_used) || visa.unemployment_days_used < 0) problems.push('visa.unemployment_days_used must be a whole number >= 0 (or pass --days-used)');
  if (!Number.isInteger(visa.unemployment_ceiling) || visa.unemployment_ceiling < 1) problems.push('visa.unemployment_ceiling must be a whole number >= 1');
  if (!Number.isInteger(visa.buffer_target) || visa.buffer_target < 0) problems.push('visa.buffer_target must be a whole number >= 0');
  if (typeof visa.stem_eligible !== 'boolean') problems.push('visa.stem_eligible must be true or false');

  const daysToStart = pick('expected_days_to_start', get(doc, 'timeline_assumptions.expected_days_to_start'), overrides.daysToStart);
  if (!Number.isInteger(daysToStart) || daysToStart < 0) problems.push('timeline_assumptions.expected_days_to_start must be a whole number >= 0 (or pass --days-to-start)');

  if (problems.length) throw new InputError(`persona check failed (${problems.length} problem${problems.length === 1 ? '' : 's'})`, problems);

  return {
    label: 'your-input',
    needs_sponsorship: needsSponsorship,
    target_role: { primary: get(doc, 'target_role.primary') ?? null, soc, family },
    visa,
    expected_days_to_start: daysToStart,
    sources,
  };
}

export function loadPersona(path, overrides = {}) {
  let text;
  try { text = fs.readFileSync(path, 'utf8'); } catch (e) { throw new InputError(`cannot read persona file ${path}: ${e.code || e.message}`); }
  return validatePersona(parsePersonaText(text), overrides);
}
