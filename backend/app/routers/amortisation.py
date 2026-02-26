"""
Amortisation API routes.
"""

from fastapi import APIRouter
from app.schemas.amortisation import (
    ScheduleRequest,
    ScheduleResponse,
    ScheduleRowResponse,
    ChartPoint,
)
from app.models.loan import RateChange
from app.engine.amortisation import generate_schedule

router = APIRouter(prefix="/amortisation", tags=["amortisation"])


@router.post("/schedule", response_model=ScheduleResponse)
def get_schedule(req: ScheduleRequest) -> ScheduleResponse:
    """Generate a full amortisation schedule with chart data."""

    # Map API rate changes to domain model
    rate_changes = [
        RateChange(from_period=rc.from_period, annual_rate=rc.annual_rate)
        for rc in req.rate_changes
    ]

    schedule = generate_schedule(
        principal=req.principal,
        annual_rate=req.annual_rate,
        loan_term_years=req.loan_term_years,
        frequency=req.frequency,
        offset_balance=req.offset_balance,
        extra_repayment=req.extra_repayment,
        rate_changes=rate_changes or None,
    )

    # Build row responses
    rows = [
        ScheduleRowResponse(
            period=r.period,
            opening_balance=round(r.opening_balance, 2),
            interest=round(r.interest, 2),
            principal_paid=round(r.principal_paid, 2),
            extra_paid=round(r.extra_paid, 2),
            closing_balance=round(r.closing_balance, 2),
            annual_rate=r.annual_rate,
            scheduled_repayment=round(r.scheduled_repayment, 2),
        )
        for r in schedule.rows
    ]

    # Build yearly chart data
    ppy = req.frequency.periods_per_year
    chart_data: list[ChartPoint] = [
        ChartPoint(year=0, balance=req.principal, total_interest=0.0, equity=0.0)
    ]

    cumulative_interest = 0.0
    for year in range(1, req.loan_term_years + 1):
        idx = min(year * ppy - 1, len(schedule.rows) - 1)
        row = schedule.rows[idx]
        cumulative_interest = sum(r.interest for r in schedule.rows[: idx + 1])
        chart_data.append(
            ChartPoint(
                year=year,
                balance=round(row.closing_balance, 2),
                total_interest=round(cumulative_interest, 2),
                equity=round(req.principal - row.closing_balance, 2),
            )
        )

    return ScheduleResponse(
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        total_interest=round(schedule.total_interest, 2),
        total_periods=schedule.total_periods,
        rows=rows,
        chart_data=chart_data,
    )
