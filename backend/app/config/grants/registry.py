"""
GRANT SCHEME REGISTRY

Collects all scheme definitions into a single lookup structure.
Import helpers from here rather than individual state modules.
"""

from app.config.grants._types import GrantScheme, State
from app.config.grants.federal import FEDERAL_SCHEMES
from app.config.grants.nsw import NSW_SCHEMES
from app.config.grants.vic import VIC_SCHEMES
from app.config.grants.qld import QLD_SCHEMES
from app.config.grants.wa import WA_SCHEMES
from app.config.grants.sa import SA_SCHEMES
from app.config.grants.tas import TAS_SCHEMES
from app.config.grants.act import ACT_SCHEMES
from app.config.grants.nt import NT_SCHEMES

# ── Build lookup structures at import time ───────────

_STATE_SCHEMES: dict[State, list[GrantScheme]] = {
    State.NSW: NSW_SCHEMES,
    State.VIC: VIC_SCHEMES,
    State.QLD: QLD_SCHEMES,
    State.WA:  WA_SCHEMES,
    State.SA:  SA_SCHEMES,
    State.TAS: TAS_SCHEMES,
    State.ACT: ACT_SCHEMES,
    State.NT:  NT_SCHEMES,
}

_ALL_SCHEMES: list[GrantScheme] = [
    *FEDERAL_SCHEMES,
    *NSW_SCHEMES,
    *VIC_SCHEMES,
    *QLD_SCHEMES,
    *WA_SCHEMES,
    *SA_SCHEMES,
    *TAS_SCHEMES,
    *ACT_SCHEMES,
    *NT_SCHEMES,
]

_BY_ID: dict[str, GrantScheme] = {s.id: s for s in _ALL_SCHEMES}

# Verify uniqueness at import time
assert len(_BY_ID) == len(_ALL_SCHEMES), (
    f"Duplicate scheme IDs detected: {len(_ALL_SCHEMES)} schemes but {len(_BY_ID)} unique IDs"
)


# ── Public helpers ───────────────────────────────────

def get_scheme(scheme_id: str) -> GrantScheme | None:
    """Look up a single scheme by ID."""
    return _BY_ID.get(scheme_id)


def get_federal_schemes() -> list[GrantScheme]:
    """Return all federal schemes."""
    return list(FEDERAL_SCHEMES)


def get_schemes_for_state(state: str) -> list[GrantScheme]:
    """Return all schemes for a given state/territory."""
    try:
        key = State(state)
    except ValueError:
        return []
    return list(_STATE_SCHEMES.get(key, []))


def get_schemes_for_states(states: list[str]) -> list[GrantScheme]:
    """Return federal schemes plus schemes for all specified states."""
    result: list[GrantScheme] = []
    seen_ids: set[str] = set()

    if "Federal" in states:
        for s in FEDERAL_SCHEMES:
            result.append(s)
            seen_ids.add(s.id)

    for state_code in states:
        if state_code == "Federal":
            continue
        for s in get_schemes_for_state(state_code):
            if s.id not in seen_ids:
                result.append(s)
                seen_ids.add(s.id)

    return result


def get_all_schemes() -> list[GrantScheme]:
    """Return every scheme across all jurisdictions."""
    return list(_ALL_SCHEMES)
