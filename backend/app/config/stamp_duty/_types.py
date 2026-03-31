"""
STAMP DUTY DATA TYPES

Frozen dataclasses defining bracket tables for stamp duty calculations.
Each state has a schedule with general brackets and optional PPOR
(owner-occupier) concession brackets.

Rates are stored as percentages (e.g. 0.035 = 3.5%). For states that
use "per $100 or part thereof" (QLD, NSW, WA, SA, NT), the engine
rounds the excess up to the next $100 before applying the rate.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class StampDutyBracket:
    """A single stamp duty bracket.

    Attributes:
        threshold: Upper bound of this bracket (use ``float("inf")`` for the top bracket).
        rate: Marginal rate as a decimal (e.g. 0.035 for 3.5%).
        base_amount: Cumulative duty from all prior brackets.
        flat_rate: If True, rate applies to the entire dutiable value (not marginal).
            Used for VIC's $960k-$2M bracket where duty is 5.5% of total value.
    """

    threshold: float
    rate: float
    base_amount: float
    flat_rate: bool = False


@dataclass(frozen=True)
class StampDutySchedule:
    """Stamp duty rate schedule for a state or territory.

    Attributes:
        state: State code (e.g. ``"QLD"``).
        brackets: General/investor transfer duty brackets.
        ppor_brackets: Owner-occupier concession brackets. None means PPOR
            uses the same brackets as general (no separate concession schedule).
        round_to_100: Whether to round the excess up to the next $100
            before applying the marginal rate. True for QLD, NSW, WA, SA, NT.
            False for VIC, TAS, ACT (percentage-based).
    """

    state: str
    brackets: list[StampDutyBracket] = field(default_factory=list)
    ppor_brackets: list[StampDutyBracket] | None = None
    round_to_100: bool = True
