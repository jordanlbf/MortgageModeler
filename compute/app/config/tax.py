"""
AUSTRALIAN TAX CONFIGURATION

Tax brackets, Medicare levy, Medicare levy surcharge, HECS/HELP repayment
thresholds and tax offsets for the 2026-27 income year (1 July 2026 to
30 June 2027). Used by the tax engine, the Tax calculator and the cashflow
projections, which hold these rates for every year they project.

Checked against ato.gov.au on 11 November 2026. Update together with
frontend/src/lib/tax-brackets.ts.
"""

# ──────────────────────────────────────────────
# 2026-27 resident tax rates
# ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
# ──────────────────────────────────────────────

TAX_BRACKETS = [
    (18_200, 0.00),  # Nil on the first $18,200
    (45_000, 0.15),  # 15c for each $1 over $18,200
    (135_000, 0.30),  # $4,020 plus 30c for each $1 over $45,000
    (190_000, 0.37),  # $31,020 plus 37c for each $1 over $135,000
    (float("inf"), 0.45),  # $51,370 plus 45c for each $1 over $190,000
]

# ──────────────────────────────────────────────
# 2026-27 HECS/HELP repayment thresholds, on repayment income
# ato.gov.au/tax-rates-and-codes/study-and-training-support-loans-rates-and-repayment-thresholds
# ──────────────────────────────────────────────
# Nil up to the first band. Each band is (repayment income over, base amount,
# rate on the excess), with the base as published rather than derived.
HECS_BANDS = [
    (69_528, 0.0, 0.15),  # 15c for each $1 over $69,528
    (129_717, 9_028.0, 0.17),  # $9,028 plus 17c for each $1 over $129,717
]
HECS_TOP_THRESHOLD = 186_050  # Above it: a flat rate on all repayment income
HECS_TOP_RATE = 0.10  # 10% of total repayment income

# HECS/HELP debts are indexed each 1 June by the lower of CPI and WPI
# (3.2% in 2025, 2.8% in 2026). Default long-run assumption used for
# projections; callers can override it.
HECS_INDEXATION_RATE = 0.03

# ──────────────────────────────────────────────
# Medicare levy, on taxable income
# Low-income thresholds for singles are the latest published (2025-26); the
# ATO publishes each year's after it ends.
# ato.gov.au: medicare-levy-reduction-for-low-income-earners
# ──────────────────────────────────────────────
MEDICARE_PHASE_IN_RATE = 0.10  # 10c for each $1 over the lower threshold
MEDICARE_LOWER_THRESHOLD = 28_011  # Nil at or below $28,011
MEDICARE_HIGH_THRESHOLD = 35_013  # The full 2% from $35,013
MEDICARE_LEVY_RATE = 0.02

# ──────────────────────────────────────────────
# 2026-27 Medicare levy surcharge, singles, on income for MLS purposes
# A flat rate on the whole income, by tier.
# ato.gov.au: medicare-levy-surcharge-income-thresholds-and-rates
# ──────────────────────────────────────────────
MLS_THRESHOLDS = [
    (105_000, 0.00),  # Base tier: $105,000 or less
    (123_000, 0.01),  # Tier 1: $105,001 - $123,000
    (164_000, 0.0125),  # Tier 2: $123,001 - $164,000
    (float("inf"), 0.015),  # Tier 3: $164,001 or more
]

# ──────────────────────────────────────────────
# Low income tax offset (LITO)
# Non-refundable: cannot reduce income tax below zero.
#   TI <= $37,500:            $700
#   $37,501 - $45,000:        $700 less 5c per $1 over $37,500
#   $45,001 - $66,667:        $325 less 1.5c per $1 over $45,000
#   > $66,667:                $0
# ato.gov.au: low-income-tax-offset
# ──────────────────────────────────────────────
LITO_MAX_OFFSET = 700
LITO_FULL_THRESHOLD = 37_500  # Full $700 for TI <= $37,500
LITO_PHASE_OUT_1_RATE = 0.05  # 5c per $1 over $37,500
LITO_PHASE_OUT_1_END = 45_000  # At $45,000: $700 - ($7,500 x 0.05) = $325
LITO_MID_OFFSET = 325  # Offset at exactly $45,000 (start of second phase-out)
LITO_PHASE_OUT_2_RATE = 0.015  # 1.5c per $1 over $45,000
LITO_ZERO_THRESHOLD = 66_667  # At $66,667: $325 - ($21,667 x 0.015) = ~$0

# ──────────────────────────────────────────────
# Seniors and Pensioners Tax Offset (SAPTO), singles only
# Non-refundable: cannot reduce income tax below zero.
# ──────────────────────────────────────────────
SAPTO_MAX_OFFSET = 2_230  # Maximum offset for singles
SAPTO_LOWER_THRESHOLD = 33_532  # Full offset for rebate income <= $33,532
SAPTO_PHASE_OUT_RATE = 0.125  # Reduces by 12.5c per $1 over lower threshold
SAPTO_ZERO_THRESHOLD = 51_372  # No offset above $51,372
