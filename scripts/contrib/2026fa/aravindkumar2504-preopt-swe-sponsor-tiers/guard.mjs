// guard.mjs: may this run write where it was asked to? (The privacy guard, as one function so it can be tested alone.)
//
// The repository is public, and committing real data cannot be undone (DATA_CONTRACT.md, Zero-Conditions). So:
//   * if EVERY input is a committed sample, the output may go inside the repository only in this recipe's own
//     runs folder (never over some other tracked file), in private/ (gitignored), or outside the repository;
//   * if ANY input is not a committed sample (a persona outside search/examples/, a watchlist, company table,
//     wage file or Form D folder that is not one of the committed ones), it is treated as real data, and the
//     output must go to private/ or outside the repository.
// An input counts as a committed sample only by where it really is (see paths.mjs), never by its spelling.

import { InputError } from './timeline.mjs';
import { displayPath, relativeInside } from './paths.mjs';

const startsWithDir = (rel, dir) => rel !== null && (rel === dir || rel.startsWith(`${dir}/`));

/**
 * @param {object} p
 * @param {string} p.repoRoot    absolute path of the repository
 * @param {string} p.recipeDir   absolute path of this prototype's folder (its sample-inputs/ and fixtures/ are samples)
 * @param {object} p.defaults    repository-relative paths: { csv, bls, formdDir, ownRuns }
 * @param {object} p.inputs      absolute paths in use: { persona, csv, bls, formdDir, watchlist (or null) }
 * @param {string} p.outDir      absolute output folder
 * @returns {{treatedAsReal: boolean, reasons: string[]}}  throws InputError when the output location is not allowed
 */
export function checkWriteLocation({ repoRoot, recipeDir, defaults, inputs, outDir }) {
  const inRepo = (p) => relativeInside(p, repoRoot);
  const inRecipe = (p) => relativeInside(p, recipeDir);
  const isFixture = (p) => { const r = inRecipe(p); return startsWithDir(r, 'fixtures'); };
  const isDefault = (p, dflt) => inRepo(p) === dflt;

  const reasons = [];
  if (!startsWithDir(inRepo(inputs.persona), 'search/examples')) reasons.push('this persona is outside search/examples/');
  if (inputs.watchlist && !(startsWithDir(inRecipe(inputs.watchlist), 'sample-inputs') || isFixture(inputs.watchlist))) reasons.push('this watchlist is not one of the committed samples');
  if (!(isDefault(inputs.csv, defaults.csv) || isFixture(inputs.csv))) reasons.push('this company table is neither the repository\'s table nor a committed fixture');
  if (!(isDefault(inputs.bls, defaults.bls) || isFixture(inputs.bls))) reasons.push('this wage file is neither the repository\'s extract nor a committed fixture');
  if (!(isDefault(inputs.formdDir, defaults.formdDir) || isFixture(inputs.formdDir))) reasons.push('this Form D folder is neither the repository\'s samples nor a committed fixture');
  const treatedAsReal = reasons.length > 0;

  const out = inRepo(outDir); // null: outside the repository
  const outIsPrivate = out === null || startsWithDir(out, 'private');
  const outIsOwnRuns = startsWithDir(out, defaults.ownRuns);
  const shown = (p) => displayPath(p, repoRoot);

  if (treatedAsReal && !outIsPrivate) {
    throw new InputError(`${reasons[0]}, so it is treated as real data, and the output folder is inside the repository but not under private/`, [
      ...reasons,
      `persona: ${shown(inputs.persona)}`,
      ...(inputs.watchlist ? [`watchlist: ${shown(inputs.watchlist)}`] : []),
      `output folder: ${shown(outDir)}`,
      'pass --out-dir private/<name> (gitignored) or a folder outside the repository; committing a real persona\'s dates or a real watchlist is a zero-condition offense (DATA_CONTRACT.md)',
    ]);
  }
  if (!treatedAsReal && !outIsPrivate && !outIsOwnRuns) {
    throw new InputError('the output folder is inside the repository but outside this recipe\'s own runs folder, so the run could overwrite another tracked file', [
      `output folder: ${shown(outDir)}`,
      `use ${defaults.ownRuns}/<name>, private/<name>, or a folder outside the repository`,
    ]);
  }
  return { treatedAsReal, reasons };
}
