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
    (18_200, 0.00),  # 0% on first $18,200
    (45_000, 0.16),  # 16% on $18,201 – $45,000
    (135_000, 0.30),  # 30% on $45,001 – $135,000
    (190_000, 0.37),  # 37% on $135,001 – $190,000
    (float("inf"), 0.45),  # 45% on $190,001+
]

# ──────────────────────────────────────────────
# 2025-26 HECS/HELP Repayment Thresholds
# Based on Repayment Income (RI)
# ──────────────────────────────────────────────
HECS_THRESHOLDS = [
    (67_000, 0.00),  # No HECS repayment below $67,000
    (125_000, 0.15),  # 15% of RI above $67,000 up to $125,000
    (179_285, 0.17),  # 17% of RI above $125,000 up to $179,285
    (float("inf"), 0.10),  # 10% of RI (not marginal at this threshold)
]
HECS_TOP_THRESHOLD = 179_285

# ──────────────────────────────────────────────
# 2025-26 Medicare Levy (ML) Thresholds
# Based on Taxable Income (TI)
# ──────────────────────────────────────────────
MEDICARE_PHASE_IN_RATE = 0.10  # 10% of TI above lower threshold up to upper threshold
MEDICARE_LOWER_THRESHOLD = 27_222  # No ML below $27,222 TI
MEDICARE_HIGH_THRESHOLD = 34_027  # 2% of TI above $34,027
MEDICARE_LEVY_RATE = 0.02  # 2% of TI for Medicare levy

# ──────────────────────────────────────────────
# 2025-26 Medicare Levy Surcharge (MLS) Thresholds
# Based on Medicare Levy Surcharge Income (MLSI)
# ──────────────────────────────────────────────
MLS_THRESHOLDS = [
    (101_000, 0.00),  # No MLS if MLSI below $101,000
    (118_000, 0.01),  # 1% of MLSI if income between $101,000 and $118,000
    (158_000, 0.0125),  # 1.25% of MLSI if income between $118,000 and $158,000
    (float("inf"), 0.015),  # 1.5% of MLSI if income above $158,000
]
