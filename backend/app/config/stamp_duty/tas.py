"""
TASMANIA STAMP DUTY BRACKETS

Transfer duty rates for TAS. Unchanged since 21 October 2013.
Single rate table — no separate PPOR concession schedule.

Note: first bracket ($0–$3,000) is a flat $50 minimum duty.
Modelled as rate=0 with base_amount=50.

Source: SRO Tasmania — sro.tas.gov.au/property-transfer-duties/rates-of-duty
Verified: March 2026
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

TAS_SCHEDULE = StampDutySchedule(
    state="TAS",
    brackets=[
        StampDutyBracket(3_000, 0.0, 50.00),       # flat $50 minimum
        StampDutyBracket(25_000, 0.0175, 50.00),
        StampDutyBracket(75_000, 0.0225, 435.00),
        StampDutyBracket(200_000, 0.035, 1_560.00),
        StampDutyBracket(375_000, 0.04, 5_935.00),
        StampDutyBracket(725_000, 0.0425, 12_935.00),
        StampDutyBracket(float("inf"), 0.045, 27_810.00),
    ],
    ppor_brackets=None,
)
