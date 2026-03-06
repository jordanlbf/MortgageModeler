"""
AUSTRALIAN TAX CONFIGURATION

This module defines the tax brackets, Medicare levy, and HECS/HELP repayment thresholds for
the 2025-26 financial year. These constants are used by the tax calculation engine to
compute income tax, Medicare levy, and HECS repayments based on a person's taxable income
and repayment income.
"""

# ──────────────────────────────────────────────
# 2025-26 Australian Tax Brackets
# Updated rates effective 1 July 2025
# ──────────────────────────────────────────────

TAX_BRACKETS = [
    (18_200, 0.00),      # 0% on first $18,200
    (45_000, 0.16),      # 16% on $18,201 – $45,000
    (135_000, 0.30),     # 30% on $45,001 – $135,000
    (190_000, 0.37),     # 37% on $135,001 – $190,000
    (float("inf"), 0.45) # 45% on $190,001+
]
MEDICARE_LEVY_RATE = 0.02

# ──────────────────────────────────────────────
# 2025-26 HECS/HELP Repayment Thresholds
# Based on Repayment Income (RI)
# ──────────────────────────────────────────────
HECS_THRESHOLDS = [
    (67_000, 0.00),         # No HECS repayment below $67,000
    (125_000, 0.15),        # 15% of RI above $67,000 up to $125,000
    (179_285, 0.17),        # 17% of RI above $125,000 up to $179,285
    (float("inf"), 0.10),   # 10% of RI above $179,285
]