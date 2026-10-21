// BROKEN mutant (break attempt). Parses a rating with plain Number(), the
// natural one-liner. Number('') is 0, so a blank O*NET rating silently becomes
// a recorded zero and an unrated occupation scores 0 instead of "no evidence".
export const parseRating = (s) => Number(s);
