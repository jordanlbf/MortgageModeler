"""
Australian tax calculation engine.

All functions are pure — no side effects or external dependencies.
"""

from app.config.tax import TAX_BRACKETS

def calculate_income_tax(taxable_income: float) -> float:
    """
    Calculate Australian income tax for a given taxable income.
    Uses marginal tax brackets.
    """
    
    for (income_cap, tax_rate) in TAX_BRACKETS:
        if taxable_income > income_cap:
            continue
        else:

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
