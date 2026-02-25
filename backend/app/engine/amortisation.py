"""
Amortisation engine.

Interest is compounded daily (as per Australian bank practice),
with repayments made at the chosen frequency (weekly/fortnightly/monthly).

Builds incrementally:
1. Periodic P&I repayment calculation with daily compounding
"""

from app.models.loan import RepaymentFrequency


def calculate_periodic_repayment(
    principal: float,
    annual_rate: float,
    loan_term_years: int,
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
) -> float:
    """
    Calculate the fixed P&I repayment with daily compounding.

    Interest accrues daily, payments are made at the given frequency.
    The effective periodic rate is derived from daily compounding:

        daily_rate = annual_rate / 365
        effective_rate = (1 + daily_rate) ^ days_per_period - 1

    Then the standard annuity formula is applied:
        M = P * r * (1 + r)^n / ((1 + r)^n - 1)

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

    daily_rate = annual_rate / 365
    r = (1 + daily_rate) ** frequency.days_per_period - 1

    return principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
