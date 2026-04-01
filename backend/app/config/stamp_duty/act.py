"""
ACT CONVEYANCE DUTY BRACKETS

Conveyance duty rates for ACT as of 2025–26.
ACT has TWO separate rate schedules: general and owner-occupier.

Above $1,455,000: flat 4.54% applied to the entire dutiable value.
Certain concessions (e.g. pensioner) may apply a deduction (e.g. up to $35,238),
handled separately from the base rate calculation.

Source: ACT Revenue Office — revenue.act.gov.au/duties/conveyance-duty
Legislation: Disallowable Instrument DI2025-145

Verified: March 2026

Confidence: High — structure and marginal rates align with official sources.
Note: ACT rates are updated annually via disallowable instruments and should
be reviewed each financial year.
"""

from app.config.stamp_duty._types import StampDutyBracket, StampDutySchedule

ACT_SCHEDULE = StampDutySchedule(
    state="ACT",
    brackets=[
        StampDutyBracket(200_000, 0.012, 0.00),
        StampDutyBracket(300_000, 0.024, 2_400.00),
        StampDutyBracket(500_000, 0.033, 4_800.00),
        StampDutyBracket(750_000, 0.0432, 11_400.00),
        StampDutyBracket(1_000_000, 0.0415, 22_200.00),
        StampDutyBracket(1_455_000, 0.0735, 32_575.00),
        StampDutyBracket(float("inf"), 0.0454, 0.00, flat_rate=True),
    ],
    ppor_brackets=[
        StampDutyBracket(260_000, 0.0028, 0.00),
        StampDutyBracket(300_000, 0.022, 728.00),
        StampDutyBracket(500_000, 0.034, 1_608.00),
        StampDutyBracket(750_000, 0.0432, 8_408.00),
        StampDutyBracket(1_000_000, 0.059, 19_208.00),
        StampDutyBracket(1_455_000, 0.064, 33_958.00),
        # Above $1,455,000: flat 4.54% of total value minus $35,238
    ],
)

# ACT PPOR premium deduction — applied when value > $1,455,000
ACT_PPOR_PREMIUM_DEDUCTION = 35_238.00
