"""
Amortisation API routes.

Exposes the amortisation schedule endpoint for generating P&I repayment
schedules with offset, extra repayments, and rate change support.
"""

from datetime import date

from fastapi import APIRouter
from app.models.loan import RateChange, LoanConfig
from app.models.mortgage import Mortgage
from app.models.property import Property
from app.schemas.amortisation import (
    ScheduleRequest,
    ScheduleResponse,
    ScheduleRowResponse,
    ScheduleSummary,
    ChartPoint,
)
from app.services.amortisation import build_schedule_result

router = APIRouter(prefix="/amortisation", tags=["amortisation"])


@router.post("/schedule", response_model=ScheduleResponse)
def get_schedule(req: ScheduleRequest) -> ScheduleResponse:
    """
    Generate a full amortisation schedule with chart data.

    Args:
        req: Loan parameters including principal, rate, term, and optional
            offset/extra repayment/rate change configuration

    Returns:
        Full schedule with per-period rows, summary stats, and yearly chart data
    """
    mortgage = Mortgage(
        property=Property(
            purchase_date=date.today(),
            purchase_price=req.purchase_price,
            is_new_property=False,
            annual_appreciation=req.annual_appreciation,
        ),
        loan=LoanConfig(
            deposit=req.deposit,
            annual_rate=req.annual_rate,
            loan_term_years=req.loan_term_years,
            frequency=req.frequency,
            offset_balance=req.offset_balance,
            offset_contribution=req.offset_contribution,
            extra_repayment=req.extra_repayment,
            rate_changes=[
                RateChange(from_period=rc.from_period, annual_rate=rc.annual_rate)
                for rc in req.rate_changes
            ],
        ),
        tax_profile=None,
        ongoing_costs=None,
    )

    result = build_schedule_result(mortgage)

    return ScheduleResponse(
        summary=ScheduleSummary(
            purchase_price=result.purchase_price,
            deposit=result.deposit,
            loan_amount=result.loan_amount,
            lvr=result.lvr,
            annual_appreciation=result.annual_appreciation,
        ),
        payment=result.payment,
        total_interest=round(result.schedule.total_interest, 2),
        total_periods=result.schedule.total_periods,
        rows=[
            ScheduleRowResponse(
                period=r.period,
                opening_balance=round(r.opening_balance, 2),
                interest=round(r.interest, 2),
                principal_paid=round(r.principal_paid, 2),
                extra_paid=round(r.extra_paid, 2),
                closing_balance=round(r.closing_balance, 2),
                annual_rate=r.annual_rate,
                scheduled_repayment=round(r.scheduled_repayment, 2),
                offset_balance=round(r.offset_balance, 2),
            )
            for r in result.schedule.rows
        ],
        chart_data=[
            ChartPoint(
                year=cp.year,
                balance=cp.balance,
                total_interest=cp.total_interest,
                property_value=cp.property_value,
                equity=cp.equity,
                offset_balance=cp.offset_balance,
            )
            for cp in result.chart_data
        ],
    )
