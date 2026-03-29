"""
Tax service.

Orchestrates engine tax calculations into a complete breakdown
using the TaxProfile model for accurate multi-component results.
"""

from app.engine.tax import (
    calculate_hecs_repayment,
    calculate_income_tax,
    calculate_marginal_rate,
    calculate_medicare_levy,
    calculate_medicare_levy_surcharge,
)
from app.models.tax import TaxProfile
from app.schemas.tax import TaxBreakdownResponse


def build_tax_breakdown(profile: TaxProfile) -> TaxBreakdownResponse:
    """
    Build a complete tax breakdown from a TaxProfile.

    Uses the correct income measure for each tax component:
    taxable_income for income tax and Medicare levy,
    mls_income for MLS, and repayment_income for HECS.

    Args:
        profile: Taxpayer configuration with all income measures

    Returns:
        TaxBreakdownResponse with itemised components and net income
    """
    income_tax = calculate_income_tax(profile.taxable_income)
    medicare_levy = calculate_medicare_levy(profile.taxable_income)
    medicare_levy_surcharge = calculate_medicare_levy_surcharge(profile.mls_income, profile.has_private_health)
    hecs_repayment = calculate_hecs_repayment(profile.repayment_income, profile.hecs_balance)

    total_tax = income_tax + medicare_levy + medicare_levy_surcharge + hecs_repayment
    net_income = profile.taxable_income - total_tax

    marginal_rate = calculate_marginal_rate(profile.taxable_income)

    return TaxBreakdownResponse(
        taxable_income=profile.taxable_income,
        income_tax=income_tax,
        medicare_levy=medicare_levy,
        medicare_levy_surcharge=medicare_levy_surcharge,
        hecs_repayment=hecs_repayment,
        total_tax=total_tax,
        net_income=net_income,
        marginal_rate=marginal_rate,
    )
