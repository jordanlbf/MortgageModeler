"""
Amortisation API routes.
"""

from fastapi import APIRouter
from app.schemas.amortisation import (
    ScheduleRequest,
    ScheduleResponse,
    ScheduleRowResponse,
    ScheduleSummary,
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
        principal=req.loan_amount,
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

    # Build yearly chart data with appreciation
    ppy = req.frequency.periods_per_year
    chart_data: list[ChartPoint] = [
        ChartPoint(
            year=0,
            balance=req.loan_amount,
            total_interest=0.0,
            property_value=req.purchase_price,
            equity=round(req.deposit, 2),
        )
    ]

    for year in range(1, req.loan_term_years + 1):
        idx = min(year * ppy - 1, len(schedule.rows) - 1)
        row = schedule.rows[idx]
        cumulative_interest = sum(r.interest for r in schedule.rows[: idx + 1])
        property_value = req.purchase_price * (1 + req.annual_appreciation) ** year
        equity = property_value - row.closing_balance

        chart_data.append(
            ChartPoint(
                year=year,
                balance=round(row.closing_balance, 2),
                total_interest=round(cumulative_interest, 2),
                property_value=round(property_value, 2),
                equity=round(equity, 2),
            )
        )

    return ScheduleResponse(
        summary=ScheduleSummary(
            purchase_price=req.purchase_price,
            deposit=req.deposit,
            loan_amount=round(req.loan_amount, 2),
            lvr=round(req.lvr, 4),
            annual_appreciation=req.annual_appreciation,
        ),
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        total_interest=round(schedule.total_interest, 2),
        total_periods=schedule.total_periods,
        rows=rows,
        chart_data=chart_data,
    )
