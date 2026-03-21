"""
Amortisation service.

Provides three functions:
- build_amortisation_schedule: raw schedule only (used by cashflow service)
- build_year_chart_point: single year's chart data point
- build_schedule_result: schedule + chart data (used by amortisation endpoint)
"""

from app.engine.amortisation import generate_schedule
from app.models.amortisation import AmortisationSchedule, ScheduleResult, YearChartPoint
from app.models.mortgage import Mortgage


def build_amortisation_schedule(mortgage: Mortgage) -> AmortisationSchedule:
    """
    Generate a raw amortisation schedule without chart data.

    Derives loan_amount from property and loan config. Calls the engine
    to produce the period-by-period schedule.

    Args:
        mortgage: Mortgage aggregate with property and loan details

    Returns:
        AmortisationSchedule with per-period rows and summary stats
    """
    loan_amount = max(mortgage.property.purchase_price - mortgage.loan.deposit, 0.0)
    loan_amount += mortgage.loan.borrowing_costs.total_capitalised

    return generate_schedule(
        principal=loan_amount,
        annual_rate=mortgage.loan.annual_rate,
        loan_term_years=mortgage.loan.loan_term_years,
        frequency=mortgage.loan.frequency,
        offset_balance=mortgage.loan.offset_balance,
        extra_repayment=mortgage.loan.extra_repayment,
        rate_changes=mortgage.loan.rate_changes or None,
        offset_contribution=mortgage.loan.offset_contribution,
    )


def build_year_chart_point(
    year: int,
    mortgage: Mortgage,
    schedule: AmortisationSchedule,
    loan_amount: float,
) -> YearChartPoint:
    """
    Build a single year's chart data point.

    Calculates property value, loan balance, cumulative interest,
    equity, and projected offset for the given year.

    Args:
        year: Projection year (0 = purchase year)
        mortgage: Mortgage aggregate with property and loan details
        schedule: Full amortisation schedule to read balances from
        loan_amount: Pre-calculated loan principal (including capitalised costs)

    Returns:
        YearChartPoint for the given year
    """
    ppy = schedule.periods_per_year

    if year == 0:
        return YearChartPoint(
            year=0,
            balance=loan_amount,
            total_interest=0.0,
            property_value=mortgage.property.purchase_price,
            equity=round(mortgage.loan.deposit, 2),
            offset_balance=round(mortgage.loan.offset_balance, 2),
        )

    property_value = mortgage.property.purchase_price * (1 + mortgage.property.annual_appreciation) ** year

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
    projected_offset = mortgage.loan.offset_balance + mortgage.loan.offset_contribution * max(periods_elapsed - 1, 0)

    return YearChartPoint(
        year=year,
        balance=round(balance, 2),
        total_interest=round(cumulative_interest, 2),
        property_value=round(property_value, 2),
        equity=round(equity, 2),
        offset_balance=round(projected_offset, 2),
    )


def build_schedule_result(mortgage: Mortgage) -> ScheduleResult:
    """
    Generate a full amortisation schedule with chart data.

    Delegates to build_amortisation_schedule for the raw schedule,
    then builds yearly chart points via build_year_chart_point.

    Args:
        mortgage: Mortgage aggregate with property and loan details

    Returns:
        ScheduleResult with per-period schedule, summary stats, and yearly chart data
    """
    loan_amount = max(mortgage.property.purchase_price - mortgage.loan.deposit, 0.0)
    loan_amount += mortgage.loan.borrowing_costs.total_capitalised
    lvr = loan_amount / mortgage.property.purchase_price if mortgage.property.purchase_price > 0 else 0.0

    schedule = build_amortisation_schedule(mortgage)

    chart_data = [
        build_year_chart_point(year, mortgage, schedule, loan_amount)
        for year in range(mortgage.loan.loan_term_years + 1)
    ]

    return ScheduleResult(
        schedule=schedule,
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        purchase_price=mortgage.property.purchase_price,
        deposit=mortgage.loan.deposit,
        loan_amount=round(loan_amount, 2),
        lvr=round(lvr, 4),
        annual_appreciation=mortgage.property.annual_appreciation,
        chart_data=chart_data,
    )
