"""
Tax API routes.
"""

from fastapi import APIRouter
from app.schemas.tax import TaxBreakdownRequest, TaxBreakdownResponse
from app.engine.tax import calculate_income_tax,\
    calculate_medicare_levy, calculate_hecs_repayment, \
    calculate_total_tax, calculate_medicare_levy_surcharge

router = APIRouter(prefix="/tax", tags=["tax"])


@router.post("/breakdown", response_model=TaxBreakdownResponse)
def get_tax_breakdown(req: TaxBreakdownRequest) -> TaxBreakdownResponse:
    """Generate a full TaxBreakdown Response"""
    total_tax = calculate_total_tax(req.gross_income, req.gross_income,
                                    req.gross_income, req.hecs_balance, req.has_private_health)
    return TaxBreakdownResponse(
        gross_income=req.gross_income,
        income_tax=calculate_income_tax(req.gross_income),
        medicare_levy=calculate_medicare_levy(req.gross_income),
        medicare_levy_surcharge=calculate_medicare_levy_surcharge(req.gross_income, req.has_private_health),
        hecs_repayment=calculate_hecs_repayment(req.gross_income, req.hecs_balance),
        net_income=req.gross_income-total_tax,
        total_tax=total_tax
    )
