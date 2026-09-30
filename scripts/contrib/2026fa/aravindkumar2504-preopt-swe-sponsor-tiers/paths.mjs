// paths.mjs: where is a path really?
//
// The privacy guard must know whether an output folder is inside the repository. Comparing the text of two
// paths is not enough. A symlink, the macOS /tmp alias, or a different upper/lower case can make one place look
// like two, and a folder literally named "..leak" is inside the repository even though its name starts with
// two dots. So every path is first turned into the real path of its deepest existing part (symlinks followed,
// the real case read from the disk) and only then compared.

import fs from 'node:fs';
import path from 'node:path';

/** The real path of p. p need not exist: its deepest existing parent is resolved and the missing names are added back. */
export function canonicalPath(p) {
  const start = path.resolve(p);
  let cur = start;
  const missing = [];
  for (;;) {
    try {
      const real = fs.realpathSync.native(cur);
      return missing.length ? path.join(real, ...missing.reverse()) : real;
    } catch { /* this part does not exist yet */ }
    const up = path.dirname(cur);
    if (up === cur) return start;
    missing.push(path.basename(cur));
    cur = up;
  }
}

/** Where child is below parent, written 'a/b/c' ('' when they are the same place); null when child is not inside parent. */
export function relativeInside(child, parent) {
  const r = path.relative(canonicalPath(parent), canonicalPath(child));
  if (r === '') return '';
  if (r === '..' || r.startsWith(`..${path.sep}`) || path.isAbsolute(r)) return null;
  return r.split(path.sep).join('/');
}

export const isInside = (child, parent) => relativeInside(child, parent) !== null;

/** A path as it may appear in an output file: repository-relative, or only its last name when it is outside the repository. */
export function displayPath(p, repoRoot) {
  const r = relativeInside(p, repoRoot);
  if (r !== null) return r || '.';
  return `<outside the repository>/${path.basename(path.resolve(p))}`;
}
