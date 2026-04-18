"""
STAMP DUTY REGISTRY

Collects all state stamp duty schedules into a single lookup.
NT is handled separately — it uses a quadratic formula, not brackets.
"""

from app.config.stamp_duty._types import StampDutySchedule
from app.config.stamp_duty.act import ACT_SCHEDULE
from app.config.stamp_duty.nsw import NSW_SCHEDULE
from app.config.stamp_duty.qld import QLD_SCHEDULE
from app.config.stamp_duty.sa import SA_SCHEDULE
from app.config.stamp_duty.tas import TAS_SCHEDULE
from app.config.stamp_duty.vic import VIC_SCHEDULE
from app.config.stamp_duty.wa import WA_SCHEDULE

_SCHEDULES: dict[str, StampDutySchedule] = {
    "QLD": QLD_SCHEDULE,
    "NSW": NSW_SCHEDULE,
    "VIC": VIC_SCHEDULE,
    "WA": WA_SCHEDULE,
    "SA": SA_SCHEDULE,
    "TAS": TAS_SCHEDULE,
    "ACT": ACT_SCHEDULE,
}


def get_schedule(state: str) -> StampDutySchedule | None:
    """Look up the stamp duty schedule for a state.

    Args:
        state: State code (e.g. ``"QLD"``).

    Returns:
        StampDutySchedule for that state, or None if not found.
        Note: NT is not included — it uses a formula-based calculation.
        Use ``engine/stamp_duty.py`` for NT.
    """
    return _SCHEDULES.get(state)
