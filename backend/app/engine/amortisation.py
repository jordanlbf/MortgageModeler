"""
Amortisation engine.

Interest is compounded daily (as per Australian bank practice),
with repayments made at the chosen frequency (weekly/fortnightly/monthly).

Builds incrementally:
1. Periodic P&I repayment calculation with daily compounding
2. Interest-only repayment calculation
3. Offset account support (reduces balance that interest is charged on)
4. Full amortisation schedule generation (P&I with offset + extra repayments)
"""

from dataclasses import dataclass
from app.models.loan import RepaymentFrequency


# ──────────────────────────────────────────────
# Output types
# ──────────────────────────────────────────────

@dataclass
class ScheduleRow:
    """A single period in the amortisation schedule."""
    period: int
    opening_balance: float
    interest: float
    principal_paid: float
    extra_paid: float
    closing_balance: float


@dataclass
class AmortisationSchedule:
    """Full amortisation schedule with summary stats."""
    rows: list[ScheduleRow]
    scheduled_repayment: float
    total_interest: float
    total_periods: int


# ──────────────────────────────────────────────
# Core calculations
# ──────────────────────────────────────────────

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

    Note: Offset does not change the scheduled P&I repayment amount.
    Its effect is seen in the amortisation schedule where less interest
    accrues, so more of each payment goes to principal (paying off sooner).

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
    offset_balance: float = 0.0,
) -> float:
    """
    Calculate the interest-only repayment per period.

    Interest is charged on (principal - offset), never less than zero.

    Args:
        principal: Loan amount (balance stays the same)
        annual_rate: Annual interest rate as decimal
        frequency: Repayment frequency
        offset_balance: Funds in offset account reducing interest-bearing balance

    Returns:
        Interest-only repayment per period
    """
    if principal <= 0 or annual_rate <= 0:
        return 0.0

    effective_balance = max(principal - offset_balance, 0.0)

    if effective_balance == 0.0:
        return 0.0

    r = effective_periodic_rate(annual_rate, frequency)

    return effective_balance * r


# ──────────────────────────────────────────────
# Amortisation schedule
# ──────────────────────────────────────────────

def generate_schedule(
    principal: float,
    annual_rate: float,
    loan_term_years: int,
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY,
    offset_balance: float = 0.0,
    extra_repayment: float = 0.0,
) -> AmortisationSchedule:
    """
    Generate a full P&I amortisation schedule with daily compounding.

    Supports offset accounts and extra repayments. The scheduled repayment
    is fixed based on the original loan terms (no offset/extra). Offset
    reduces interest each period so more goes to principal. Extra repayments
    are applied on top of the scheduled amount.

    The loan terminates early if the balance reaches zero.

    Args:
        principal: Loan amount in dollars
        annual_rate: Annual interest rate as decimal
        loan_term_years: Loan term in years
        frequency: Repayment frequency
        offset_balance: Funds in offset account (assumed constant for now)
        extra_repayment: Additional repayment per period on top of scheduled

    Returns:
        AmortisationSchedule with per-period rows and summary stats
    """
    scheduled = calculate_periodic_repayment(principal, annual_rate, loan_term_years, frequency)
    r = effective_periodic_rate(annual_rate, frequency)
    max_periods = loan_term_years * frequency.periods_per_year

    rows: list[ScheduleRow] = []
    balance = principal
    total_interest = 0.0

    for period in range(1, max_periods + 1):
        if balance <= 0:
            break

        # Interest on effective balance (after offset)
        effective_balance = max(balance - offset_balance, 0.0)
        interest = effective_balance * r

        # Principal from scheduled repayment
        principal_component = scheduled - interest

        # Extra repayment on top
        extra = extra_repayment

        # Cap total principal reduction to remaining balance
        total_reduction = principal_component + extra
        if total_reduction >= balance:
            # Final period — adjust to pay off exactly
            principal_component = min(principal_component, balance)
            extra = balance - principal_component
            balance = 0.0
        else:
            balance -= total_reduction

        total_interest += interest

        rows.append(ScheduleRow(
            period=period,
            opening_balance=balance + principal_component + extra,
            interest=interest,
            principal_paid=principal_component,
            extra_paid=extra,
            closing_balance=balance,
        ))

    return AmortisationSchedule(
        rows=rows,
        scheduled_repayment=scheduled,
        total_interest=total_interest,
        total_periods=len(rows),
    )
