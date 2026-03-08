"""
QLD STAMP DUTY CONFIGURATION

This module defines the stamp duty brackets and rates for Queensland (QLD)
as of the 2025-26 financial year. The stamp duty is calculated based on the
purchase price of the property, with different rates and fixed amounts
applying to different price ranges. This configuration is used by the
property calculation engine to estimate the stamp duty payable when purchasing
a property in QLD.
"""


# ──────────────────────────────────────────────
# QLD Stamp Duty Brackets
# ──────────────────────────────────────────────

QLD_STAMP_DUTY_BRACKETS = [
    (5_000, 0.0, 0.00),                 # $0 on first $5,000
    (75_000, 1.50, 0.00),               # $1.50 per $100 (or part thereof) over $5,000
    (540_000, 3.50, 1_050.00),          # $1,050 + $3.50 per $100 over $75,000
    (1_000_000, 4.50, 17_325.00),       # $17,325 + $4.50 per $100 over $540,000
    (float("inf"), 5.75, 38_025.00),    # $38,025 + $5.75 per $100 over $1,000,000
]