"""
QLD PROPERTY PURCHASE CONFIGURATION

This module defines the stamp duty brackets, LMI tiers, and default fees for
Queensland (QLD) as of the 2025-26 financial year. Used by the property
calculation engine to estimate upfront costs when purchasing a property in QLD.

Note: Stamp duty rates use "per $100 or part thereof" — the engine must
round up to the next $100 (math.ceil) before applying the rate.
"""


# ─────────────────────────────────────────────────────────────────────────────────
# QLD Stamp Duty Brackets
# ─────────────────────────────────────────────────────────────────────────────────

QLD_STAMP_DUTY_BASE_BRACKETS = [
    (5_000, 0.0, 0.00),                 # $0 on first $5,000
    (75_000, 1.50, 0.00),               # $0      + $1.50 per $100 (or part thereof) over $5,000
    (540_000, 3.50, 1_050.00),          # $1,050  + $3.50 per $100 over $75,000
    (1_000_000, 4.50, 17_325.00),       # $17,325 + $4.50 per $100 over $540,000
    (float("inf"), 5.75, 38_025.00),    # $38,025 + $5.75 per $100 over $1,000,000
]

# ─────────────────────────────────────────────────────────────────────────────────
# QLD PPOR Home Concession Stamp Duty
# ─────────────────────────────────────────────────────────────────────────────────
QLD_STAMP_DUTY_CONCESSION_BRACKETS = [
    (350_000, 1.0, 0.00),               # $1 per $100 up to $350,000
    (540_000, 3.50, 3_500.00),          # $3,500 + $3.50 per $100 (or part thereof) over $350,000
    (1_000_000, 4.50, 10_150.00),       # $10,150 + $4.50 per $100 (or part thereof) over $540,000
    (float("inf"), 5.75, 30_850.00),    # $30,850 + $5.75 per $100 (or part thereof) over $1,000,000
]

# ─────────────────────────────────────────────────────────────────────────────────
# LMI Estimates - actual LMI premiums depend on the lender and borrower profile.
# ─────────────────────────────────────────────────────────────────────────────────
LMI_ESTIMATE = [
    (0.80, 0.00),   # ≤80% LVR: No LMI
    (0.85, 0.011),  # >80% to ≤85% LVR: ~1.1% of loan amount
    (0.90, 0.02),   # >85% to ≤90% LVR: ~2% of loan amount
    (0.95, 0.045),  # >90% to ≤95% LVR: ~4.5% of loan amount
    (1.00, 0.06),   # >95% to ≤100% LVR: ~6% of loan amount
]

# ─────────────────────────────────────────────────────────────────
# QLD Title Registration Fees (effective 1 July 2025)
# ─────────────────────────────────────────────────────────────────
QLD_REGISTRATION_FEE_BASE = 238.14          # Flat fee if price ≤ $180,000
QLD_REGISTRATION_FEE_THRESHOLD = 180_000
QLD_REGISTRATION_FEE_PER_10K = 44.71        # Per $10,000 (or part thereof) above threshold
QLD_MORTGAGE_REGISTRATION_FEE = 238.14

# ─────────────────────────────────────────────────────────────────────────────────
# Default Flat Fees (estimates)
# ─────────────────────────────────────────────────────────────────────────────────
DEFAULT_CONVEYANCING_FEE = 2_000.00
DEFAULT_BUILDING_PEST_INSPECTION_FEE = 600.00
DEFAULT_LOAN_ESTABLISHMENT_FEE = 300.00
