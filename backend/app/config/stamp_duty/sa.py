"""
SOUTH AUSTRALIA STAMP DUTY BRACKETS

Stamp duty (conveyance) rates for SA as of 2025-26.
Single rate table — no separate PPOR concession schedule.

Source: RevenueSA — revenuesa.sa.gov.au/stamp-duty-land/rate-of-stamp-duty
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

SA_SCHEDULE = StampDutySchedule(
    state="SA",
    brackets=[
        StampDutyBracket(12_000, 0.01, 0.00),
        StampDutyBracket(30_000, 0.02, 120.00),
        StampDutyBracket(50_000, 0.03, 480.00),
        StampDutyBracket(100_000, 0.035, 1_080.00),
        StampDutyBracket(200_000, 0.04, 2_830.00),
        StampDutyBracket(250_000, 0.0425, 6_830.00),
        StampDutyBracket(300_000, 0.0475, 8_955.00),
        StampDutyBracket(500_000, 0.05, 11_330.00),
        StampDutyBracket(float("inf"), 0.055, 21_330.00),
    ],
    ppor_brackets=None,
)
