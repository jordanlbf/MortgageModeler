"""
Australian tax calculation engine.

All functions are pure — no side effects or external dependencies.
"""

from app.config.tax import TAX_BRACKETS, MEDICARE_LOWER_THRESHOLD, MEDICARE_HIGH_THRESHOLD, MEDICARE_PHASE_IN_RATE, \
    MEDICARE_LEVY_RATE, MLS_THRESHOLDS, HECS_THRESHOLDS, HECS_TOP_THRESHOLD


def calculate_income_tax(taxable_income: float) -> float:
    """
    Calculate Australian income tax for a given taxable income.
    Uses marginal tax brackets.
    """

    # Guard against future bracket changes for negative incomes (e.g., from deductions exceeding income)
    if taxable_income <= 0:
        return 0

    # Calculate tax by iterating through brackets until we find the correct one
    prev_threshold = 0
    tax_owing = 0
    for (taxable_cap, tax_rate) in TAX_BRACKETS:

        if taxable_income > taxable_cap:
            tax_owing += (taxable_cap - prev_threshold) * tax_rate
            prev_threshold = taxable_cap
        else:
            tax_owing += (taxable_income - prev_threshold) * tax_rate
            break

    return tax_owing


def calculate_medicare_levy(taxable_income: float) -> float:
    """Calculate Medicare levy based on taxable income and thresholds."""
    if taxable_income <= MEDICARE_LOWER_THRESHOLD:
        return 0
    elif taxable_income < MEDICARE_HIGH_THRESHOLD:
        return (taxable_income - MEDICARE_LOWER_THRESHOLD) * MEDICARE_PHASE_IN_RATE
    else:
        return taxable_income * MEDICARE_LEVY_RATE


def calculate_medicare_levy_surcharge(mls_income: float, has_private_health: bool) -> float:
    """Calculate Medicare Levy Surcharge based on MLS income and thresholds."""
    if has_private_health:
        return 0
    for (threshold, rate) in MLS_THRESHOLDS:
        if mls_income <= threshold:
            return mls_income * rate


def calculate_hecs_repayment(repayment_income: float, hecs_balance: float) -> float:
    """
    Calculate annual HECS/HELP repayment based on repayment income.
    Repayment income = taxable income + any reportable fringe benefits etc.
    Returns the lesser of the calculated repayment or remaining balance.
    """
    repayment_owing = 0.0
    prev_threshold = 0
    for (threshold, rate) in HECS_THRESHOLDS:
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


def calculate_total_tax(
        taxable_income: float,
        repayment_income: float,
        mls_income: float,
        hecs_balance: float,
        has_private_health: bool
) -> float:
    """
    Calculate total tax owing.

    This is the summation of:
    - Income tax
    - Medicare Levy
    - Medicare Levy Surcharge
    - HECS Repayment
    """
    return (
        calculate_income_tax(taxable_income) +
        calculate_medicare_levy(taxable_income) +
        calculate_medicare_levy_surcharge(mls_income, has_private_health) +
        calculate_hecs_repayment(repayment_income, hecs_balance)
    )
