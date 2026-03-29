"""
Australian tax calculation engine.

All functions are pure — no side effects or external dependencies.
"""

from app.config.tax import (
    HECS_THRESHOLDS,
    HECS_TOP_THRESHOLD,
    MEDICARE_HIGH_THRESHOLD,
    MEDICARE_LEVY_RATE,
    MEDICARE_LOWER_THRESHOLD,
    MEDICARE_PHASE_IN_RATE,
    MLS_THRESHOLDS,
    TAX_BRACKETS,
)
from app.models.tax import TaxProfile


def calculate_income_tax(taxable_income: float) -> float:
    """
    Calculate Australian income tax for a given taxable income.

    Uses marginal tax brackets defined in TAX_BRACKETS config.

    Args:
        taxable_income: Assessable income minus allowable deductions

    Returns:
        Income tax owing (0 if taxable_income <= 0)
    """

    # Guard against future bracket changes for negative incomes (e.g., from deductions exceeding income)
    if taxable_income <= 0:
        return 0

    # Calculate tax by iterating through brackets until we find the correct one
    prev_threshold = 0
    tax_owing = 0
    for taxable_cap, tax_rate in TAX_BRACKETS:
        if taxable_income > taxable_cap:
            tax_owing += (taxable_cap - prev_threshold) * tax_rate
            prev_threshold = taxable_cap
        else:
            tax_owing += (taxable_income - prev_threshold) * tax_rate
            break

    return tax_owing


def calculate_medicare_levy(taxable_income: float) -> float:
    """
    Calculate Medicare levy based on taxable income and thresholds.

    Applies a phase-in rate between the lower and upper thresholds,
    then the full levy rate above the upper threshold.

    Args:
        taxable_income: Assessable income minus allowable deductions

    Returns:
        Medicare levy amount (0 if below lower threshold)
    """
    if taxable_income <= MEDICARE_LOWER_THRESHOLD:
        return 0
    elif taxable_income < MEDICARE_HIGH_THRESHOLD:
        return (taxable_income - MEDICARE_LOWER_THRESHOLD) * MEDICARE_PHASE_IN_RATE
    else:
        return taxable_income * MEDICARE_LEVY_RATE


def calculate_medicare_levy_surcharge(mls_income: float, has_private_health: bool) -> float:
    """
    Calculate Medicare Levy Surcharge based on MLS income and thresholds.

    Returns 0 immediately if the taxpayer has private health insurance.

    Args:
        mls_income: Medicare Levy Surcharge income
        has_private_health: Whether the taxpayer holds private health insurance

    Returns:
        MLS amount (0 if has_private_health or below first threshold)

    Raises:
        ValueError: If MLS_THRESHOLDS config is missing a catch-all bracket
    """
    if has_private_health:
        return 0
    for threshold, rate in MLS_THRESHOLDS:
        if mls_income <= threshold:
            return mls_income * rate
    raise ValueError("MLS_THRESHOLDS config missing catch-all bracket (e.g. float('inf'))")


def calculate_hecs_repayment(repayment_income: float, hecs_balance: float) -> float:
    """
    Calculate annual HECS/HELP repayment based on repayment income.

    Uses marginal thresholds up to HECS_TOP_THRESHOLD, then 10% of total
    repayment income above that. The result is capped at the remaining balance.

    Args:
        repayment_income: Taxable income plus reportable fringe benefits etc.
        hecs_balance: Outstanding HECS/HELP debt

    Returns:
        Annual HECS repayment (capped at hecs_balance)
    """
    repayment_owing = 0.0
    prev_threshold = 0
    for threshold, rate in HECS_THRESHOLDS:
        if repayment_income < threshold:
            repayment_owing += (repayment_income - prev_threshold) * rate
            break
        else:
            repayment_owing += (threshold - prev_threshold) * rate
        prev_threshold = threshold

    # Above max threshold, it becomes 10% of total RI, not marginal
    # Need to add 5 cents to bring marginal rates up to exactly 10%
    if repayment_income > HECS_TOP_THRESHOLD:
        repayment_owing += 0.05

    return min(repayment_owing, hecs_balance)


def calculate_marginal_rate(taxable_income: float) -> float:
    """
    Determine the marginal income tax rate for a given taxable income.

    Returns the rate of the bracket the income falls into.

    Args:
        taxable_income: Assessable income minus allowable deductions.

    Returns:
        Marginal tax rate as decimal (e.g. 0.30 for 30%).
    """
    if taxable_income <= 0:
        return 0.0

    for threshold, rate in TAX_BRACKETS:
        if taxable_income <= threshold:
            return rate

    return TAX_BRACKETS[-1][1]


def calculate_total_tax(tax_profile: TaxProfile) -> float:
    """
    Calculate total tax owing.

    Sums income tax, Medicare levy, Medicare Levy Surcharge, and HECS repayment,
    using the correct income measure for each component.

    Args:
        tax_profile: Taxpayer configuration with all income measures

    Returns:
        Total tax owing (sum of all components)
    """
    return (
        calculate_income_tax(tax_profile.taxable_income)
        + calculate_medicare_levy(tax_profile.taxable_income)
        + calculate_medicare_levy_surcharge(tax_profile.mls_income, tax_profile.has_private_health)
        + calculate_hecs_repayment(tax_profile.repayment_income, tax_profile.hecs_balance)
    )


def calculate_tax_saving(tax_profile: TaxProfile, net_rental_income: float) -> float:
    """
    Calculate tax saving from an investment property using two-pass approach.

    Compares total tax without the property against total tax with the
    property's net rental income. Uses the correct income measure for
    each component: TI for income tax and Medicare levy, RI and MLSI
    for HECS and MLS (with rental losses added back).

    A positive result means tax saved (negatively geared).
    A negative result means extra tax owed (positively geared).

    Args:
        tax_profile: Taxpayer's base income profile (without property income)
        net_rental_income: Rental income minus total deductions (negative if negatively geared)

    Returns:
        Tax saving amount (positive = saving, negative = extra tax owed)
    """
    # Tax without the investment property
    tax_without = calculate_total_tax(tax_profile)

    # Adjusted incomes with the investment property
    # TI: reduced by rental loss (or increased by rental profit)
    # RI and MLSI: rental losses are added back, profits are kept
    adjusted_profile = TaxProfile(
        taxable_income=tax_profile.taxable_income + net_rental_income,
        repayment_income=tax_profile.repayment_income + max(net_rental_income, 0),
        mls_income=tax_profile.mls_income + max(net_rental_income, 0),
        hecs_balance=tax_profile.hecs_balance,
        has_private_health=tax_profile.has_private_health,
    )

    # Tax with the investment property
    tax_with = calculate_total_tax(adjusted_profile)

    return tax_without - tax_with
