_Sanitized record: C1 mutation results; names, links, ids and local paths are replaced by references such as <posting 1 url> or <host A>._

## Executive summary

Ten deliberate one-line mutations were applied, one at a time, to a throwaway copy of the gate script. In round 1, eight of the ten turned the unit tests red and two survived. Two tests were added, and in round 2 all ten were caught.

## Mutation table

| # | Mutation | Line changed | Round 1 (24 tests): red tests | Caught | Round 2 (26 tests): red tests | Caught |
|---|---|---|---|---|---|---|
| 1 | void rule inverted: host VOID only when a control is expired | 313: `verdicts[controls[p["url"]]]["verdict"] == "active") for p in inputs["postings"])}` -> `verdicts[controls[p["url"]]]["verdict"] == "expired") for p in inputs["postings"])}` | test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_control_expired_keeps_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_replay_with_real_scorer | yes | test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_control_expired_keeps_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_raw_url_in_a_human_note_stops_the_run, test_replay_with_real_scorer, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 2 | "expired + insufficient content" maps to FAIL | 260: `return "UNRESOLVED", None, "insufficient_content"` -> `return "FAIL", 0.0, "insufficient_content"` | test_five_outcomes, test_replay_with_real_scorer | yes | test_five_outcomes, test_raw_url_in_a_human_note_stops_the_run, test_replay_with_real_scorer, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 3 | CANDIDATE uses a raw string prefix | 294: `cands = list(index.first.get(first, [])) if first else []` -> `cands = [r for k, rs in index.exact.items() if first and k.startswith(first) for r in rs]` | test_candidate_prefix_is_whole_word | yes | test_candidate_prefix_is_whole_word | yes |
| 4 | AMBIGUOUS reported as MATCH | 292: `return "AMBIGUOUS", rows, []` -> `return "MATCH", rows, []` | test_states | yes | test_states | yes |
| 5 | HOLD postings allowed into the scorer input | 361: `if not holds:` -> `if True:` | test_candidates_private_file_and_no_csv_names_in_outputs, test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_json_contract, test_replay_of_saved_real_output_is_live_mode, test_replay_with_real_scorer, test_report_first_heading_is_executive_summary | yes | test_candidates_private_file_and_no_csv_names_in_outputs, test_confirmed_candidate_keeps_label_on_rule_hold, test_control_active_voids_host, test_five_outcomes, test_hold_never_reaches_scorer_input, test_json_contract, test_raw_url_in_a_human_note_stops_the_run, test_replay_of_saved_real_output_is_live_mode, test_replay_with_real_scorer, test_report_first_heading_is_executive_summary, test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 6 | timeline validation accepts a string | 147: `if not _is_unit_number(timeline["factor"]):` -> `if not (isinstance(timeline["factor"], str) or _is_unit_number(timeline["factor"])):` | test_timeline | yes | test_timeline | yes |
| 7 | rule v0.1 approvals threshold 50 becomes 5 | 48: `APPROVALS_THRESHOLD = 50` -> `APPROVALS_THRESHOLD = 5` | test_all_seven_rows | yes | test_all_seven_rows | yes |
| 8 | unresolved liveness gets factor 1.0 instead of being excluded | 332: `holds.append("liveness_unresolved")` -> `live.update(factor=1.0)` | none | **no** | test_unresolved_liveness_alone_holds_with_no_factor | yes |
| 9 | leak self-check disabled | 485: `leaks = leak_scan(outputs, tokens)` -> `leaks = []` | none | **no** | test_raw_url_in_a_human_note_stops_the_run | yes |
| 10 | profile guard disabled | 156: `if SCORER_NO_SPONSOR_RE.search(auth.lower()):` -> `if False:` | test_profile_guard | yes | test_profile_guard | yes |
