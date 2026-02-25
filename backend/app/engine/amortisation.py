"""
Amortisation engine.

Interest is compounded daily (as per Australian bank practice),
with repayments made at the chosen frequency (weekly/fortnightly/monthly).

Builds incrementally:
1. Periodic P&I repayment calculation with daily compounding
2. Interest-only repayment calculation
"""

from app.models.loan import RepaymentFrequency


def effective_periodic_rate(annual_rate: float, frequency: RepaymentFrequency) -> float:
    """
    Convert an annual rate to an effective periodic rate using daily compounding.

        daily_rate = annual_rate / 365
        effective_rate = (1 + daily_rate) ^ days_per_period - 1

    Args:
        annual_rate: Annual interest rate as decimal (e.g. 0.062 for 6.2%)
        frequency: Repayment frequency

    Returns:
        Effective interest rate per period
    """
    daily_rate = annual_rate / 365
    return (1 + daily_rate) ** frequency.days_per_period - 1


def calculate_periodic_repayment(
    principal: float,
    annual_rate: float,
    loan_term_years: int,
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
) -> float:
    """
    Calculate the fixed P&I repayment with daily compounding.

    Args:
        principal: Loan amount in dollars
        annual_rate: Annual interest rate as decimal (e.g. 0.062 for 6.2%)
        loan_term_years: Loan term in years
        frequency: Repayment frequency (weekly, fortnightly, monthly)

    Returns:
        Repayment amount per period
    """
    if principal <= 0:
        return 0.0

    n = loan_term_years * frequency.periods_per_year

    if annual_rate <= 0:
        return principal / n

    r = effective_periodic_rate(annual_rate, frequency)

    return principal * r * (1 + r) ** n / ((1 + r) ** n - 1)


def calculate_io_repayment(
    principal: float,
    annual_rate: float,
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
) -> float:
    """
    Calculate the interest-only repayment per period.

    No principal reduction — just the interest cost each period.

    Args:
        principal: Loan amount (balance stays the same)
        annual_rate: Annual interest rate as decimal
        frequency: Repayment frequency

    Returns:
        Interest-only repayment per period
    """
    if principal <= 0 or annual_rate <= 0:
        return 0.0

    r = effective_periodic_rate(annual_rate, frequency)

    return principal * r
