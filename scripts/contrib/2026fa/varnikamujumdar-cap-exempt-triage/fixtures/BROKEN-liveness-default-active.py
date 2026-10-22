"""BROKEN mutant — never use outside the test suite.

Reproduces the defect from my previous submission: a posting nobody checked
for liveness is treated as live (an open gate) instead of being held. The
test suite installs this mutant and asserts that its invariant check catches it.
"""


def install(mod):
    original = mod.triage_target

    def broken(t, liveness, *rest):
        liveness = dict(liveness)
        liveness.setdefault(mod.normalize_url(t["url"]), {"result": "active", "reason": "UNCHECKED"})
        return original(t, liveness, *rest)

    mod.triage_target = broken
    return original
