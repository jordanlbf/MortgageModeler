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
from app.models.tax import TaxBreakdown, TaxInputs, TaxProfile


def compute_income_measures(inputs: TaxInputs) -> TaxProfile:
    """Derive ATO income measures from raw tax inputs.

    Computes assessable income, taxable income, repayment income (HRI),
    and MLS income. Long-term capital gains receive the 50% CGT discount.
    Net investment losses are added back for HRI/MLS.

    Args:
        inputs: Raw tax inputs matching the UI form fields.

    Returns:
        TaxProfile with all derived income measures.
    """
    net_capital_gain = inputs.capital_gain_short + (inputs.capital_gain_long * 0.5)

    assessable = (
        inputs.salary
        + inputs.rental
        + inputs.interest
        + inputs.dividend
        + inputs.franking
        + net_capital_gain
    )

    total_deductions = inputs.rental_deductions + inputs.work_deductions
    taxable_income = max(0.0, assessable - total_deductions)

    net_investment_loss = max(0.0, inputs.rental_deductions - inputs.rental)

    repayment_income = (
        taxable_income
        + inputs.rfb
        + inputs.sal_sac
        + net_investment_loss
    )

    mls_income = repayment_income

    return TaxProfile(
        assessable_income=assessable,
        total_deductions=total_deductions,
        taxable_income=taxable_income,
        repayment_income=repayment_income,
        mls_income=mls_income,
        net_investment_loss=net_investment_loss,
        hecs_balance=inputs.hecs_bal,
        has_private_health=inputs.phi,
    )


def build_tax_breakdown(profile: TaxProfile) -> TaxBreakdown:
    """Build a complete tax breakdown from a TaxProfile.

    Uses the correct income measure for each tax component:
    taxable_income for income tax and Medicare levy,
    mls_income for MLS, and repayment_income for HECS.

    Args:
        profile: Taxpayer configuration with all income measures.

    Returns:
        TaxBreakdown with itemised components and net income.
    """
    income_tax = calculate_income_tax(profile.taxable_income)
    medicare_levy = calculate_medicare_levy(profile.taxable_income)
    medicare_levy_surcharge = calculate_medicare_levy_surcharge(profile.mls_income, profile.has_private_health)
    hecs_repayment = calculate_hecs_repayment(profile.repayment_income, profile.hecs_balance)

    total_tax = income_tax + medicare_levy + medicare_levy_surcharge + hecs_repayment
    net_income = profile.taxable_income - total_tax

    marginal_rate = calculate_marginal_rate(profile.taxable_income)

    return TaxBreakdown(
        taxable_income=profile.taxable_income,
        income_tax=income_tax,
        medicare_levy=medicare_levy,
        medicare_levy_surcharge=medicare_levy_surcharge,
        hecs_repayment=hecs_repayment,
        total_tax=total_tax,
        net_income=net_income,
        marginal_rate=marginal_rate,
    )
