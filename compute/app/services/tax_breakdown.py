"""
Tax service.

Orchestrates engine tax calculations into a complete breakdown
using the TaxProfile model for accurate multi-component results.
"""

from dataclasses import dataclass

from app.engine.tax import (
    calculate_hecs_repayment,
    calculate_income_tax,
    calculate_lito,
    calculate_marginal_rate,
    calculate_medicare_levy,
    calculate_medicare_levy_surcharge,
    calculate_sapto,
)
from app.models.tax import TaxBreakdown, TaxInputs, TaxProfile


@dataclass
class _OffsetResult:
    """Intermediate result from applying tax offsets."""

    lito: float
    sapto_offset: float
    franking_offset: float
    total_offsets: float
    income_tax_after_offsets: float


def _apply_offsets(income_tax: float, profile: TaxProfile) -> _OffsetResult:
    """Apply tax offsets to income tax.

    Non-refundable offsets (LITO, SAPTO) are applied first and cannot
    reduce income tax below zero. Franking credits are refundable and
    can push the result negative (creating a refund).

    Args:
        income_tax: Raw income tax before offsets.
        profile: Taxpayer profile with franking and SAPTO eligibility.

    Returns:
        Offset amounts and income tax after all offsets applied.
    """
    lito = calculate_lito(profile.taxable_income)
    sapto_offset = calculate_sapto(profile.taxable_income) if profile.sapto else 0.0
    franking_offset = profile.franking

    # Non-refundable first — floor at zero
    after_non_refundable = max(0.0, income_tax - lito - sapto_offset)
    # Refundable — can go negative (franking refund)
    income_tax_after_offsets = after_non_refundable - franking_offset

    total_offsets = lito + sapto_offset + franking_offset

    return _OffsetResult(
        lito=lito,
        sapto_offset=sapto_offset,
        franking_offset=franking_offset,
        total_offsets=total_offsets,
        income_tax_after_offsets=income_tax_after_offsets,
    )


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
        franking=inputs.franking,
        sapto=inputs.sapto,
    )


def build_tax_breakdown(profile: TaxProfile) -> TaxBreakdown:
    """Build a complete tax breakdown from a TaxProfile.

    Uses the correct income measure for each tax component:
    taxable_income for income tax and Medicare levy,
    mls_income for MLS, and repayment_income for HECS.
    Applies tax offsets (LITO, SAPTO, franking) after income tax.

    Args:
        profile: Taxpayer configuration with all income measures.

    Returns:
        TaxBreakdown with itemised components and net income.
    """
    raw_income_tax = calculate_income_tax(profile.taxable_income)
    medicare_levy = calculate_medicare_levy(profile.taxable_income)
    medicare_levy_surcharge = calculate_medicare_levy_surcharge(profile.mls_income, profile.has_private_health)
    hecs_repayment = calculate_hecs_repayment(profile.repayment_income, profile.hecs_balance)

    offsets = _apply_offsets(raw_income_tax, profile)

    total_tax = offsets.income_tax_after_offsets + medicare_levy + medicare_levy_surcharge + hecs_repayment
    net_income = profile.taxable_income - total_tax

    marginal_rate = calculate_marginal_rate(profile.taxable_income)
    effective_rate = max(0.0, total_tax / profile.assessable_income) if profile.assessable_income > 0 else 0.0

    return TaxBreakdown(
        taxable_income=profile.taxable_income,
        income_tax=offsets.income_tax_after_offsets,
        medicare_levy=medicare_levy,
        medicare_levy_surcharge=medicare_levy_surcharge,
        hecs_repayment=hecs_repayment,
        lito=offsets.lito,
        sapto_offset=offsets.sapto_offset,
        franking_offset=offsets.franking_offset,
        total_offsets=offsets.total_offsets,
        total_tax=total_tax,
        net_income=net_income,
        marginal_rate=marginal_rate,
        effective_rate=effective_rate,
    )
