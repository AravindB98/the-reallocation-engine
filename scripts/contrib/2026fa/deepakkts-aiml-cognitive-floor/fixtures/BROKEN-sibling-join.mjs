// BROKEN mutant (break attempt). Joins on the 6-digit BLS SOC instead of the
// O*NET-SOC detailed code and takes the first sibling that carries a score.
// For 15-2051.00 Data Scientists (unrated) this silently returns the profile of
// 15-2051.01 Business Intelligence Analysts.
import { evaluateSoc } from '../run.mjs';
export function evaluateSocViaBls(code, soc, cutoff, title) {
  const bls = code.slice(0, 7);
  const sib = [...soc.byCode.values()].find((r) => r.bls_soc_code === bls && r.cognitive_pivot_score !== '');
  return { ...evaluateSoc(sib ? sib.onet_soc_code : code, soc, cutoff, title), code };
}
