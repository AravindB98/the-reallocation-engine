"""data-titles-h1b-entry prototype library (stdlib only)."""


class RunFailure(Exception):
    """A whole-run failure: the run stops, exit code 1, no results are claimed."""
