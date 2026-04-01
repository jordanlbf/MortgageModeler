"""
NEW SOUTH WALES STAMP DUTY BRACKETS

Transfer duty rates for NSW as of 2025-26.
Single rate table — no separate PPOR concession schedule.
Thresholds are CPI-indexed annually (Section 33AF, Duties Act 1997).

Source: Revenue NSW — revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

NSW_SCHEDULE = StampDutySchedule(
    state="NSW",
    brackets=[
        StampDutyBracket(17_000, 0.0125, 0.00),
        StampDutyBracket(37_000, 0.015, 212.00),
        StampDutyBracket(99_000, 0.0175, 512.00),
        StampDutyBracket(372_000, 0.035, 1_597.00),
        StampDutyBracket(1_240_000, 0.045, 11_152.00),
        StampDutyBracket(3_721_000, 0.055, 50_212.00),
        StampDutyBracket(float("inf"), 0.07, 186_667.00),
    ],
    ppor_brackets=None,
)
