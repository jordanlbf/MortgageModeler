"""
QUEENSLAND STAMP DUTY BRACKETS

Transfer duty rates for Queensland as of 2025-26.
PPOR concession applies the "home concession" rate schedule.

Source: QRO — qro.qld.gov.au/duties/transfer-duty/calculate
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

QLD_SCHEDULE = StampDutySchedule(
    state="QLD",
    brackets=[
        StampDutyBracket(5_000, 0.0, 0.00),
        StampDutyBracket(75_000, 0.015, 0.00),
        StampDutyBracket(540_000, 0.035, 1_050.00),
        StampDutyBracket(1_000_000, 0.045, 17_325.00),
        StampDutyBracket(float("inf"), 0.0575, 38_025.00),
    ],
    ppor_brackets=[
        StampDutyBracket(350_000, 0.01, 0.00),
        StampDutyBracket(540_000, 0.035, 3_500.00),
        StampDutyBracket(1_000_000, 0.045, 10_150.00),
        StampDutyBracket(float("inf"), 0.0575, 30_850.00),
    ],
)
