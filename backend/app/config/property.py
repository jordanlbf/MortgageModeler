"""
QLD PROPERTY PURCHASE CONFIGURATION

This module defines the stamp duty brackets, LMI tiers, and default fees for
Queensland (QLD) as of the 2025-26 financial year. Used by the property
calculation engine to estimate upfront costs when purchasing a property in QLD.

Note: Stamp duty rates use "per $100 or part thereof" — the engine must
round up to the next $100 (math.ceil) before applying the rate.
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

# ──────────────────────────────────────────────
# QLD PPOR Home Concession Stamp Duty
# ──────────────────────────────────────────────
QLD_STAMP_DUTY_CONCESSION_BRACKETS = [
    (350_000, 1.0, 0.00),               # $1 per $100 up to $350,000
    (540_000, 3.50, 3_500.00),          # $3,500 + $3.50 per $100 (or part thereof) over $350,000
    (1_000_000, 4.50, 10_150.00),       # $10,150 + $4.50 per $100 (or part thereof) over $540,000
    (float("inf"), 5.75, 30_850.00),    # $30,850 + $5.75 per $100 (or part thereof) over $1,000,000
]
