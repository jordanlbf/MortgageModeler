"""
Amortisation service.

Orchestrates the amortisation engine and builds chart data
with cumulative interest, property appreciation, and offset projections.
"""

from app.engine.amortisation import generate_schedule
from app.models.amortisation import ScheduleResult, YearChartPoint
from app.models.loan import RateChange, RepaymentFrequency


def build_schedule_result(
    purchase_price: float,
    deposit: float,
    loan_amount: float,
    lvr: float,
    annual_rate: float,
    loan_term_years: int,
    frequency: RepaymentFrequency,
    offset_balance: float,
    offset_contribution: float,
    extra_repayment: float,
    annual_appreciation: float,
    rate_changes: list[RateChange] | None,
) -> ScheduleResult:
    """
    Generate a full amortisation schedule with chart data.

    Calls the engine to produce the raw schedule, then builds
    yearly chart points with cumulative interest, appreciation,
    and offset projections.
    """
    schedule = generate_schedule(
        principal=loan_amount,
        annual_rate=annual_rate,
        loan_term_years=loan_term_years,
        frequency=frequency,
        offset_balance=offset_balance,
        extra_repayment=extra_repayment,
        rate_changes=rate_changes or None,
        offset_contribution=offset_contribution,
    )

    # Build yearly chart data with appreciation
    ppy = frequency.periods_per_year
    chart_data: list[YearChartPoint] = [
        YearChartPoint(
            year=0,
            balance=loan_amount,
            total_interest=0.0,
            property_value=purchase_price,
            equity=round(deposit, 2),
            offset_balance=round(offset_balance, 2),
        )
    ]

    for year in range(1, loan_term_years + 1):
        property_value = purchase_price * (1 + annual_appreciation) ** year

        if schedule.rows:
            idx = min(year * ppy - 1, len(schedule.rows) - 1)
            row = schedule.rows[idx]
            balance = row.closing_balance
            cumulative_interest = sum(r.interest for r in schedule.rows[: idx + 1])
        else:
            balance = 0.0
            cumulative_interest = 0.0

        equity = property_value - balance

        # Offset keeps growing even after loan is paid off
        periods_elapsed = year * ppy
        projected_offset = offset_balance + offset_contribution * max(periods_elapsed - 1, 0)

        chart_data.append(
            YearChartPoint(
                year=year,
                balance=round(balance, 2),
                total_interest=round(cumulative_interest, 2),
                property_value=round(property_value, 2),
                equity=round(equity, 2),
                offset_balance=round(projected_offset, 2),
            )
        )

    return ScheduleResult(
        schedule=schedule,
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        purchase_price=purchase_price,
        deposit=deposit,
        loan_amount=round(loan_amount, 2),
        lvr=round(lvr, 4),
        annual_appreciation=annual_appreciation,
        chart_data=chart_data,
    )
