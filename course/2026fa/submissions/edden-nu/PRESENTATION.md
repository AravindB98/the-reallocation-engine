# Five-minute live demonstration

## Executive summary

Show one command, its report, a failure case, and the evidence boundary. This is a live demonstration of an offline prototype; it requires no internet or browser. Practice once before class and choose a new run-directory name each time.

## 0:00–0:45 — Problem

Explain that early-career Information Systems applicants can confuse company-level sponsorship history with individual job policy. Software, analytics and design roles may differ. The public sample uses the repository's fictional persona, not the student's personal immigration information.

## 0:45–2:00 — Run it live

From repository root:

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/run.py --out-dir course/2026fa/submissions/edden-nu/runs/class-demo-01
```

Use class-demo-02 if that directory already exists. Open its report.md. Show the real CSV values versus synthetic policy and timing inputs. Explain Apply is pending human review, not a guarantee.

## 2:00–3:00 — Read three outcomes

S1: historical data does not override a policy restriction. S4: blank history is not a veto. S9: missing timeline blocks a decision rather than silently passing.

## 3:00–4:00 — Show tests and correction

```bash
python3 scripts/contrib/2026fa/edden-nu-sponsor-fit/test_offline.py
```

Explain the 403 + Apply-button failure. The wrapper now blocks error pages and leaves the original tool output visible. Point to the saved failed test if asked.

## 4:00–5:00 — Limits and allocation

No live employer policy or visa eligibility is verified. Exact skill tokens do not prove proficiency. Consider can feed networking questions or credibility projects; Apply can feed tailoring after review. The time-saving estimate is a proposal, not a measurement. Be ready to explain run.py rather than memorize this outline.
