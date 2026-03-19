"""
Amortisation service.

Provides three functions:
- build_amortisation_schedule: raw schedule only (used by cashflow service)
- build_year_chart_point: single year's chart data point
- build_schedule_result: schedule + chart data (used by amortisation endpoint)
"""

from app.engine.amortisation import generate_schedule
from app.models.amortisation import AmortisationSchedule, ScheduleResult, YearChartPoint
from app.models.loan import LoanConfig
from app.models.property import Property


def build_amortisation_schedule(
    property: Property,
    loan: LoanConfig,
) -> AmortisationSchedule:
    """
    Generate a raw amortisation schedule without chart data.

    Derives loan_amount from property and loan config. Calls the engine
    to produce the period-by-period schedule.

    Args:
        property: Property details with purchase price
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)

    Returns:
        AmortisationSchedule with per-period rows and summary stats
    """
    loan_amount = max(property.purchase_price - loan.deposit, 0.0)

    return generate_schedule(
        principal=loan_amount,
        annual_rate=loan.annual_rate,
        loan_term_years=loan.loan_term_years,
        frequency=loan.frequency,
        offset_balance=loan.offset_balance,
        extra_repayment=loan.extra_repayment,
        rate_changes=loan.rate_changes or None,
        offset_contribution=loan.offset_contribution,
    )


def build_year_chart_point(
    year: int,
    property: Property,
    loan: LoanConfig,
    schedule: AmortisationSchedule,
) -> YearChartPoint:
    """
    Build a single year's chart data point.

    Calculates property value, loan balance, cumulative interest,
    equity, and projected offset for the given year.

    Args:
        year: Projection year (0 = purchase year)
        property: Property details with purchase price and annual appreciation
        loan: Loan configuration (deposit, offset balance/contribution, frequency)
        schedule: Full amortisation schedule to read balances from

    Returns:
        YearChartPoint for the given year
    """
    loan_amount = max(property.purchase_price - loan.deposit, 0.0)
    ppy = schedule.periods_per_year

    if year == 0:
        return YearChartPoint(
            year=0,
            balance=loan_amount,
            total_interest=0.0,
            property_value=property.purchase_price,
            equity=round(loan.deposit, 2),
            offset_balance=round(loan.offset_balance, 2),
        )

    property_value = property.purchase_price * (1 + property.annual_appreciation) ** year

    if schedule.rows:
        idx = min(year * ppy - 1, len(schedule.rows) - 1)
        row = schedule.rows[idx]
        balance = row.closing_balance
        cumulative_interest = sum(r.interest for r in schedule.rows[: idx + 1])
    else:
        balance = 0.0
        cumulative_interest = 0.0

    equity = property_value - balance

    periods_elapsed = year * ppy
    projected_offset = loan.offset_balance + loan.offset_contribution * max(periods_elapsed - 1, 0)

    return YearChartPoint(
        year=year,
        balance=round(balance, 2),
        total_interest=round(cumulative_interest, 2),
        property_value=round(property_value, 2),
        equity=round(equity, 2),
        offset_balance=round(projected_offset, 2),
    )


def build_schedule_result(
    property: Property,
    loan: LoanConfig,
) -> ScheduleResult:
    """
    Generate a full amortisation schedule with chart data.

    Delegates to build_amortisation_schedule for the raw schedule,
    then builds yearly chart points via build_year_chart_point.

    Args:
        property: Property details with purchase price and annual appreciation
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)

    Returns:
        ScheduleResult with per-period schedule, summary stats, and yearly chart data
    """
    loan_amount = max(property.purchase_price - loan.deposit, 0.0)
    lvr = loan_amount / property.purchase_price if property.purchase_price > 0 else 0.0

    schedule = build_amortisation_schedule(property=property, loan=loan)

    chart_data = [
        build_year_chart_point(year, property, loan, schedule)
        for year in range(loan.loan_term_years + 1)
    ]

    return ScheduleResult(
        schedule=schedule,
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        purchase_price=property.purchase_price,
        deposit=loan.deposit,
        loan_amount=round(loan_amount, 2),
        lvr=round(lvr, 4),
        annual_appreciation=property.annual_appreciation,
        chart_data=chart_data,
    )
