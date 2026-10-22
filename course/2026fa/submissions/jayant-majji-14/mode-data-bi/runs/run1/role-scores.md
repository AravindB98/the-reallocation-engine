# Role Scorer report — 2026-10-20

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 3 roles → Apply 1 · Consider 1 · Skip 1. **Skip rate 33%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| GUSTO INC — Data Scientist, Risk | 0.615 | **Apply** | composite 0.615 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 1·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| SNOWFLAKE INC — Business Intelligence Analyst | 0.510 | **Consider** | above threshold (0.510) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [your-input]; fit 1·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| PINTEREST INC — Sr. Data Scientist, Core | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [your-input]; fit 0·0.3 [your-input] × liveness 0[record]×timeline 1[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
