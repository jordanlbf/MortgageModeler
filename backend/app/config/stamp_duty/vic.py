"""
VICTORIA STAMP DUTY BRACKETS

Land transfer duty rates for VIC as of 2025-26 (effective 1 July 2021).
Uses percentage rates (not per $100). No rounding to $100.

The $960,001–$2,000,000 general bracket is a FLAT 5.5% of the total
dutiable value (not marginal). This is flagged with flat_rate=True.

PPOR concession rates apply only to properties up to $550,000.
Above $550,000, general rates apply for the full calculation.

Source: SRO Victoria — sro.vic.gov.au
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

VIC_SCHEDULE = StampDutySchedule(
    state="VIC",
    round_to_100=False,
    brackets=[
        StampDutyBracket(25_000, 0.014, 0.00),
        StampDutyBracket(130_000, 0.024, 350.00),
        StampDutyBracket(960_000, 0.06, 2_870.00),
        StampDutyBracket(2_000_000, 0.055, 0.00, flat_rate=True),
        StampDutyBracket(float("inf"), 0.065, 110_000.00),
    ],
    ppor_brackets=[
        StampDutyBracket(25_000, 0.014, 0.00),
        StampDutyBracket(130_000, 0.024, 350.00),
        StampDutyBracket(440_000, 0.05, 2_870.00),
        StampDutyBracket(550_000, 0.06, 18_370.00),
        # Above $550,000: PPOR concession does not apply — use general rates
    ],
)
