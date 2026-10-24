"""Run the B4 regression test against the OLD (pre-fix) stop message to prove it would have failed."""
import importlib.util, sys, unittest
from pathlib import Path
d = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("t", d / "test_cap_exempt_triage.py")
t = importlib.util.module_from_spec(spec); spec.loader.exec_module(t)
# pre-fix behaviour: the stop text only mentioned OPT days left, never the failing check
t.cet.failed_checks_text = lambda g2: f"{g2['days_left_on_opt']['value']} days left"
suite = unittest.TestSuite([t.TimelineGate("test_unemployed_clock_stops")])
r = unittest.TextTestRunner(verbosity=2).run(suite)
print("RESULT on pre-fix behaviour:", "test FAILED (good: it catches the old bug)" if r.failures else "test passed (bad)")
