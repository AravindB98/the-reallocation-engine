// Offline tests for jd-screen.mjs. Every posting sentence below is written for this test (synthetic);
// none is copied from a real posting.

import test from 'node:test';
import assert from 'node:assert/strict';
import { screenPosting, htmlToText } from '../jd-screen.mjs';

const PAD = ' The team builds claims software for a mid-sized insurer, works in small groups, ships weekly, and values clear writing, careful testing and plain language. Candidates will join an onboarding program and pair with a mentor for the first quarter.';
const screen = (t) => screenPosting(t + PAD);

test('explicit citizenship, clearance and U.S.-person requirements are found, with the quote', () => {
  const must = {
    'Applicants must be a U.S. citizen to be considered.': 'citizenship_required',
    'U.S. citizenship is required for this role.': 'citizenship_required',
    'Only U.S. citizens may apply.': 'citizenship_required',
    'An active Top Secret clearance is required.': 'clearance_required',
    'The role needs the ability to obtain a security clearance.': 'clearance_required',
    'You will need to obtain and maintain a US public trust clearance.': 'clearance_required',
    'This role is subject to ITAR; applicants must be a U.S. person.': 'us_person_required',
    'We will not sponsor visas. Applicants must be a U.S. citizen.': 'citizenship_required', // a negation in the previous sentence must not hide this one
  };
  for (const [text, field] of Object.entries(must)) {
    const r = screen(text);
    assert.equal(r.requirement_found, true, text);
    assert.equal(r[field].found, true, `${field}: ${text}`);
    assert.ok(r[field].snippet.length > 10 && r[field].snippet.length <= 205, 'a short quote travels with the finding');
  }
});

test('boilerplate, negations and soft wording are not requirements', () => {
  const not = [
    'We do not discriminate on the basis of race, religion, national origin, citizenship status, or veteran status.',
    'We do not require U.S. citizenship for this role.',
    'All qualified applicants will be considered regardless of citizenship; no U.S. citizenship required.',
    'A security clearance is a plus but not needed.',
    'U.S. citizens and permanent residents are encouraged to apply.',
    'Candidates must be legally authorized to work in the United States.',
  ];
  for (const text of not) assert.equal(screen(text).requirement_found, false, text);
});

test('information that is shown but never a gate: E-Verify, no-sponsorship wording, work authorization, years asked', () => {
  const r = screen('Acme participates in E-Verify. We are unable to sponsor work visas at this time. 5+ years of experience building ML systems. Must be legally authorized to work in the United States.');
  assert.equal(r.requirement_found, false);
  assert.equal(r.e_verify_mentioned.found, true); assert.equal(r.e_verify_mentioned.negated, false);
  assert.equal(r.no_sponsorship_statement.found, true);
  assert.equal(r.authorized_to_work_statement.found, true);
  assert.equal(r.min_years_experience.value, 5);
  assert.equal(screen('We do not participate in E-Verify.').e_verify_mentioned.negated, true);
  assert.equal(screen('2 years of experience or 4+ years of relevant experience.').min_years_experience.value, 4, 'the strictest stated minimum wins');
});

test('missing or tiny text is "missing", never "no requirement"', () => {
  assert.equal(screenPosting('').status, 'missing');
  assert.equal(screenPosting(undefined).status, 'missing');
  assert.equal(screenPosting('Apply now.').status, 'missing');
  assert.equal(screenPosting('Apply now.').requirement_found, undefined);
});

test('a finding is a record with its provenance; the meaning is the rule', () => {
  const r = screen('Nothing special here.');
  assert.equal(r.source, 'record');
  assert.match(r.method, /jd-screen\.mjs screenPosting/);
  assert.match(r.note, /Silence|says none of this/i);
});

test('html from a Greenhouse-style payload is decoded, stripped and still screened', () => {
  const html = '&lt;p&gt;Role overview&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Must be a U.S. citizen &amp;amp; resident&lt;/li&gt;&lt;/ul&gt;';
  assert.equal(htmlToText(html), 'Role overview\nMust be a U.S. citizen & resident');
  assert.equal(screen(htmlToText(html)).requirement_found, true);
});

test('years asked: the minimum of a range, number words, bullet-start phrases, long lines — the shapes found in real postings', () => {
  const v = (text) => screen(text).min_years_experience;
  assert.equal(v('1–4 years of professional software development experience. Strong new grads who learn quickly are encouraged to apply.').value, 1, 'a range asks for its minimum, not its upper bound');
  assert.equal(v('2–4 years of backend software experience, primarily in Python.').value, 2);
  assert.equal(v('\n - 3–5 years writing readable, tested, and efficient production code\n').value, 3, 'a bullet that starts with the number counts without the word experience');
  assert.equal(v('\n - 3+ years building full-stack applications, with a track record of shipping.\n').value, 3);
  assert.equal(v('2+ years of professional software development industry experience in a product team.').value, 2, 'a long line is read to its end');
  assert.equal(v('Two or more years of professional software development experience, with a degree in Computer Science.').value, 2, 'number words count');
  assert.equal(v('Experience: At least 5+ years of hands-on software development experience. It is not the years, it is the miles.').value, 5);
  assert.equal(v('2 to 4 years of experience with Python.').value, 2);
});

test('years asked: soft wording, company history and salary are not requirements', () => {
  const v = (text) => screen(text).min_years_experience;
  assert.equal(v('5+ years of experience is preferred but not required.').found, false);
  assert.equal(v('Experience with Rails is a plus, ideally 6 years of it.').found, false);
  assert.equal(v('We were founded 12 years ago and have grown steadily every year since.').found, false);
  assert.equal(v('The base salary ranges from $115,000/year to $168,000/year depending on location.').found, false);
  const both = v('\n - 2+ years of professional experience\n - 5+ years of experience is a plus\n');
  assert.equal(both.value, 2, 'a soft line never raises the requirement');
  assert.equal(both.mentions.length, 2, 'but every mention is kept for the reader');
});

test('a new-grad invitation is shown, never a gate', () => {
  assert.equal(screen('Strong new grads who can show they pick up new technologies quickly are encouraged to apply.').invites_new_grads.found, true);
  assert.equal(screen('This is an entry-level position on a friendly team.').invites_new_grads.found, true);
  assert.equal(screen('We are hiring an experienced engineer.').invites_new_grads.found, false);
});
