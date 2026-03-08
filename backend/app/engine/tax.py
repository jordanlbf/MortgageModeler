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


def calculate_medicare_levy_surcharge(mls_income: float) -> float:
    """Calculate Medicare Levy Surcharge based on MLS income and thresholds."""
    for (threshold, rate) in MLS_THRESHOLDS:
        if mls_income <= threshold:
            return mls_income * rate


def calculate_total_medicare_tax(taxable_income: float, mls_income: float,
                             has_private_health: bool) -> float:
    """Calculate total Medicare levy including surcharge."""
    return (calculate_medicare_levy(taxable_income) +
            (0 if has_private_health else calculate_medicare_levy_surcharge(mls_income)))


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
