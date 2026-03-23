"""
Amortisation engine.

Interest is compounded daily (as per Australian bank practice),
with repayments made at the chosen frequency (weekly/fortnightly/monthly).

Builds incrementally:
1. Periodic P&I repayment calculation with daily compounding
2. Interest-only repayment calculation
3. Offset account support (reduces balance that interest is charged on)
4. Full amortisation schedule generation (P&I with offset + extra repayments)
5. Rate changes mid-loan (recalculates repayment on remaining balance/term)
"""

from app.models.amortisation import AmortisationSchedule, ScheduleRow
from app.models.loan import RateChange, RepaymentFrequency

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

    Args:
        principal: Loan amount in dollars
        annual_rate: Annual interest rate as decimal (e.g. 0.062 for 6.2%)
        loan_term_years: Loan term in years
        frequency: Repayment frequency (weekly, fortnightly, monthly)

    Returns:
        Repayment amount per period

    Raises:
        ValueError: If loan_term_years <= 0
    """
    if principal <= 0:
        return 0.0

    if loan_term_years <= 0:
        raise ValueError("loan_term_years must be > 0")

    n = loan_term_years * frequency.periods_per_year

    if annual_rate <= 0:
        return principal / n

    r = effective_periodic_rate(annual_rate, frequency)

    return principal * r * (1 + r) ** n / ((1 + r) ** n - 1)


def _recalculate_repayment(
    balance: float,
    annual_rate: float,
    remaining_periods: int,
    frequency: RepaymentFrequency,
) -> float:
    """
    Recalculate repayment for remaining balance and term at a new rate.

    Args:
        balance: Remaining loan balance in dollars
        annual_rate: New annual interest rate as decimal
        remaining_periods: Number of repayment periods left
        frequency: Repayment frequency (weekly, fortnightly, monthly)

    Returns:
        Recalculated repayment amount per period

    Raises:
        ValueError: If remaining_periods <= 0
    """
    if balance <= 0:
        return 0.0

    if remaining_periods <= 0:
        raise ValueError("remaining_periods must be > 0")

    if annual_rate <= 0:
        return balance / remaining_periods

    r = effective_periodic_rate(annual_rate, frequency)

    return balance * r * (1 + r) ** remaining_periods / ((1 + r) ** remaining_periods - 1)


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
    rate_changes: list[RateChange] | None = None,
    offset_contribution: float = 0.0,
) -> AmortisationSchedule:
    """
    Generate a full P&I amortisation schedule with daily compounding.

    Supports offset accounts, extra repayments, and mid-loan rate changes.
    When a rate change occurs, the repayment is recalculated based on the
    remaining balance and remaining periods at the new rate.

    The offset account starts at offset_balance and grows by
    offset_contribution each period. Interest floors at zero when offset
    exceeds the loan balance, but the offset itself keeps growing.

    The loan terminates early if the balance reaches zero.

    Args:
        principal: Loan amount in dollars
        annual_rate: Annual interest rate as decimal
        loan_term_years: Loan term in years
        frequency: Repayment frequency
        offset_balance: Starting funds in offset account
        extra_repayment: Additional repayment per period on top of scheduled
        rate_changes: List of RateChange objects (from_period, annual_rate)
        offset_contribution: Amount added to offset each period

    Returns:
        AmortisationSchedule with per-period rows and summary stats
    """
    max_periods = loan_term_years * frequency.periods_per_year

    # Build a lookup: period -> new annual rate
    rate_change_map: dict[int, float] = {}
    if rate_changes:
        for rc in rate_changes:
            rate_change_map[rc.from_period] = rc.annual_rate

    # Initial values
    current_rate = annual_rate
    r = effective_periodic_rate(current_rate, frequency)
    scheduled = calculate_periodic_repayment(principal, current_rate, loan_term_years, frequency)

    rows: list[ScheduleRow] = []
    balance = principal
    total_interest = 0.0
    current_offset = offset_balance

    for period in range(1, max_periods + 1):
        if balance <= 0:
            break

        # Check for rate change at this period
        if period in rate_change_map:
            current_rate = rate_change_map[period]
            r = effective_periodic_rate(current_rate, frequency)
            remaining = max_periods - period + 1
            scheduled = _recalculate_repayment(balance, current_rate, remaining, frequency)

        # Grow offset each period (balance keeps growing uncapped)
        if period > 1:
            current_offset += offset_contribution

        # Interest on effective balance (offset can't reduce below zero)
        effective_balance = max(balance - current_offset, 0.0)
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

        rows.append(
            ScheduleRow(
                period=period,
                opening_balance=balance + principal_component + extra,
                interest=interest,
                principal_paid=principal_component,
                extra_paid=extra,
                closing_balance=balance,
                annual_rate=current_rate,
                scheduled_repayment=scheduled,
                offset_balance=current_offset,
            )
        )

    return AmortisationSchedule(
        rows=rows,
        total_interest=total_interest,
        total_periods=len(rows),
        periods_per_year=frequency.periods_per_year,
    )
