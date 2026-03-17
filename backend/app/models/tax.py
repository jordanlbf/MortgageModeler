"""
Tax domain models — taxpayer profile for multi-component tax calculations.
"""

from dataclasses import dataclass


@dataclass
class TaxProfile:
    """
    Taxpayer configuration for calculating all tax components.

    Encapsulates the different income measures and thresholds required
    by income tax, Medicare levy, MLS, and HECS calculations. These
    can diverge due to negative gearing and reportable fringe benefits.

    Attributes:
        taxable_income: Assessable income minus allowable deductions
        repayment_income: Income used for HECS repayment calculation
        mls_income: Income used for Medicare Levy Surcharge calculation
        hecs_balance: Outstanding HECS/HELP debt
        has_private_health: Whether the taxpayer holds private health insurance
        income_growth_rate: Annual salary/wage growth rate as decimal
    """
    taxable_income: float
    repayment_income: float
    mls_income: float
    hecs_balance: float
    has_private_health: bool
    income_growth_rate: float = 0.03
