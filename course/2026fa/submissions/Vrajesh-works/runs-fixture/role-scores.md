# Role Scorer report — 2026-10-02

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 4 roles → Apply 1 · Consider 1 · Skip 2. **Skip rate 50%** (healthy — a good run skips at least half).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| EXAMPLE PROVEN SOFT INC — Software Engineer I | 0.465 | **Apply** | composite 0.465 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| EXAMPLE BOUNDARY NINE LLC — Software Engineer | 0.360 | **Consider** | above threshold (0.360) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| EXAMPLE NO SPONSOR INC — Software Engineer | 0.150 | **Skip** | composite 0.150 < 0.2 — time is better spent elsewhere | sponsorship 0·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| EXAMPLE BOUNDARY TEN LLC — Software Developer | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.5·0.3 [your-input] × liveness 0[your-input]×timeline 1[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
