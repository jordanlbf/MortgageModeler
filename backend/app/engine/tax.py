"""
Australian tax calculation engine.

Covers:
- Income tax brackets (2024-25 rates)
- Medicare levy (2%)
- HECS/HELP repayment thresholds
- Negative gearing tax benefit for investment properties

All functions are pure — no side effects or external dependencies.
"""

# ──────────────────────────────────────────────
# 2024-25 Australian Tax Brackets
# Updated rates effective 1 July 2024
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
# 2024-25 HECS/HELP Repayment Thresholds
# Based on Repayment Income (RI)
# ──────────────────────────────────────────────

HECS_THRESHOLDS = [
    (54_435, 0.00),
    (62_850, 0.01),
    (66_620, 0.02),
    (70_618, 0.025),
    (74_855, 0.03),
    (79_346, 0.035),
    (84_107, 0.04),
    (89_154, 0.045),
    (94_503, 0.05),
    (100_174, 0.055),
    (106_185, 0.06),
    (112_556, 0.065),
    (119_309, 0.07),
    (126_467, 0.075),
    (134_056, 0.08),
    (142_100, 0.085),
    (150_626, 0.09),
    (159_663, 0.095),
    (float("inf"), 0.10),
]


def calculate_income_tax(taxable_income: float) -> float:
    """
    Calculate Australian income tax for a given taxable income.
    Uses marginal tax brackets.
    """
    pass


def calculate_medicare_levy(taxable_income: float) -> float:
    """Calculate Medicare levy at 2% of taxable income."""
    pass


def calculate_hecs_repayment(repayment_income: float, hecs_balance: float) -> float:
    """
    Calculate annual HECS/HELP repayment based on repayment income.
    Repayment income = taxable income + any reportable fringe benefits etc.
    Returns the lesser of the calculated repayment or remaining balance.
    """
    pass


def calculate_marginal_rate(taxable_income: float) -> float:
    """
    Get the marginal tax rate for a given taxable income.
    Used to calculate the tax benefit of deductions (e.g., negative gearing).
    """
    pass


def calculate_negative_gearing_benefit(
    annual_salary: float,
    rental_income: float,
    deductible_expenses: float,
) -> float:
    """
    Calculate the tax benefit from negative gearing.

    When investment property expenses exceed rental income, the loss
    reduces taxable income, resulting in a tax saving at the marginal rate.

    Args:
        annual_salary: Gross employment income
        rental_income: Annual rental income from investment property
        deductible_expenses: Total deductible expenses (interest, management,
                           insurance, depreciation, rates, maintenance, etc.)

    Returns:
        Annual tax saving from negative gearing (0 if positively geared)
    """
    pass
