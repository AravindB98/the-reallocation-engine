# Role Scorer report — 2026-10-03

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 5 roles → Apply 1 · Consider 3 · Skip 1. **Skip rate 20%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| NORTHWIND ANALYTICS INC — Data Scientist I | 0.555 | **Apply** | composite 0.555 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| KITE METRICS CORP — Applied Scientist | 0.450 | **Consider** | above threshold (0.450) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.8·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| BLUEFIN ROBOTICS LLC — Data Scientist | 0.420 | **Consider** | above threshold (0.420) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| CEDAR LOOP HEALTH INC — Data Scientist | 0.210 | **Consider** | composite 0.210 in the Consider band [0.2, 0.3) | sponsorship 0·0.35 [record]; fit 0.7·0.3 [your-input] × liveness 1[record]×timeline 1[your-input] |
| BLUEFIN ROBOTICS LLC — Senior Data Scientist | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.6·0.35 [record]; fit 0.9·0.3 [your-input] × liveness 0[record]×timeline 1[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
