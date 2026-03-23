"""
Tax API routes.

Exposes the tax breakdown endpoint for calculating Australian income tax,
Medicare levy, Medicare Levy Surcharge, and HECS repayments.
"""

from fastapi import APIRouter

from app.models.tax import TaxProfile
from app.schemas.tax import TaxBreakdownRequest, TaxBreakdownResponse
from app.services.tax_breakdown import build_tax_breakdown

router = APIRouter(prefix="/tax", tags=["tax"])


@router.post("/breakdown", response_model=TaxBreakdownResponse)
def get_tax_breakdown(req: TaxBreakdownRequest) -> TaxBreakdownResponse:
    """
    Generate a full tax breakdown for the given income details.

    Args:
        req: Income measures, HECS balance, and private health status

    Returns:
        Itemised tax breakdown with net income
    """
    profile = TaxProfile(
        taxable_income=req.taxable_income,
        repayment_income=req.repayment_income,
        mls_income=req.mls_income,
        hecs_balance=req.hecs_balance,
        has_private_health=req.has_private_health,
    )

    return build_tax_breakdown(profile)
