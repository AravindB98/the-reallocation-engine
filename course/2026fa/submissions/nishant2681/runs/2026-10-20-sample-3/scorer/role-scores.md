# Role Scorer report — 2026-10-20

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 8 roles → Apply 1 · Consider 4 · Skip 3. **Skip rate 38%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Affinity Solutions — Data Analyst | 0.555 | **Apply** | composite 0.555 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 1[your-input] |
| Adept ID — Data Scientist | 0.406 | **Consider** | above threshold (0.406) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.75·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 0.9333333333333333[your-input] |
| Wayfair — Data Analyst | 0.360 | **Consider** | above threshold (0.360) but one soft spot: sponsorship tier "Possible" | sponsorship 0.3·0.35 [record]; fit 0.85·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 1[your-input] |
| Deloitte — Consultant, Data Analytics | 0.315 | **Consider** | above threshold (0.315) but one soft spot: sponsorship tier "Possible" | sponsorship 0.3·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 1[your-input] |
| Adept ID — Data Analyst | 0.225 | **Consider** | composite 0.225 in the Consider band [0.2, 0.3) | sponsorship 0.6·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 0.5[your-input (fixture)]×timeline 1[your-input] |
| 0xCord — Data Engineer | 0.150 | **Skip** | composite 0.150 < 0.2 — time is better spent elsewhere | fit 0.5·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 1[your-input] |
| Affinity Solutions — Data Scientist | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 0[your-input (fixture)]×timeline 1[your-input] |
| Affinity Solutions — Analytics Engineer | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.9·0.3 [your-input] × liveness 1[your-input (fixture)]×timeline 0[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
