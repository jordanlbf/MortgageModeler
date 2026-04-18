"""
WESTERN AUSTRALIA STAMP DUTY BRACKETS

Transfer duty rates for WA as of 2025-26.
Single rate table — no separate PPOR concession schedule.

Source: wa.gov.au — Duties Act 2008, Schedule 2
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

WA_SCHEDULE = StampDutySchedule(
    state="WA",
    brackets=[
        StampDutyBracket(120_000, 0.019, 0.00),
        StampDutyBracket(150_000, 0.0285, 2_280.00),
        StampDutyBracket(360_000, 0.038, 3_135.00),
        StampDutyBracket(725_000, 0.0475, 11_115.00),
        StampDutyBracket(float("inf"), 0.0515, 28_453.00),
    ],
    ppor_brackets=None,
)
