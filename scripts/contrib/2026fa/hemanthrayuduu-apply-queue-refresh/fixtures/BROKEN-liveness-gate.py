"""BROKEN-* mutant (CONTRIBUTING: break attempts live in fixtures/ as BROKEN-*).

A liveness gate that treats every non-closed posting as live — 'uncertain' and page/API
disagreements included. The test suite must catch it: with this gate, a posting whose
liveness was never established reaches the scorer with factor 1.0.
"""


def liveness_gate(page, api, rules):
    if page == "expired" and api == "gone":
        return 0.0, "closed", "BROKEN: both checks say closed"
    return 1.0, "live", "BROKEN: anything not closed counts as live"
