"""Liveness and timeline gates (CHANGE-BRIEF §7, decisions Q9, Q10, Q17).
The scorer treats a missing gate as 1.0, so a role missing either value is refused here."""
from datetime import date, timedelta

TIMELINE_FIELDS = ("opt_start", "window_days", "hiring_lag_days", "as_of")


def _is_num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def liveness(posting):
    lv = posting.get("liveness")
    if not isinstance(lv, dict) or not _is_num(lv.get("factor")):
        return None, "liveness.factor missing or not numeric"
    label = lv.get("label")
    if label not in ("record", "your-input"):
        return None, "liveness.label missing (must be 'record' or 'your-input')"
    return {"factor": float(lv["factor"]), "label": label, "determined_by": lv.get("determined_by")}, None


def timeline(config, factors):
    """Returns (result, problems). result carries the factor and the arithmetic shown;
    problems is a list of messages naming each missing or unparseable input."""
    missing = [f"timeline input '{f}' missing" for f in TIMELINE_FIELDS if config.get(f) in (None, "")]
    if missing:
        return None, missing
    try:
        opt_start = date.fromisoformat(config["opt_start"])
        as_of = date.fromisoformat(config["as_of"])
        window = int(config["window_days"])
        lag = int(config["hiring_lag_days"])
    except (TypeError, ValueError) as e:
        return None, [f"timeline input not parseable: {e}"]
    projected = as_of + timedelta(days=lag)
    end = opt_start + timedelta(days=window)
    ok = projected <= end
    factor = factors["on_or_before_window_end"] if ok else factors["after_window_end"]
    deferred_days = (opt_start - projected).days if projected < opt_start else 0
    arithmetic = (f"projected_start = as_of {as_of} + hiring_lag_days {lag} = {projected}; "
                  f"window_end = opt_start {opt_start} + window_days {window} = {end} (inclusive); "
                  f"{projected} {'<=' if ok else '>'} {end} -> factor {factor}")
    deferred_note = (f"deferred start: employer must accept a start {deferred_days} days after offer "
                     f"(projected {projected}, opt_start {opt_start})") if deferred_days else None
    return {"factor": factor, "projected_start": projected.isoformat(), "opt_start": opt_start.isoformat(),
            "window_end": end.isoformat(), "within_window_end": ok, "deferred_start_days": deferred_days,
            "deferred_note": deferred_note, "arithmetic": arithmetic}, []
