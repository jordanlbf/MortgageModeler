"""
Upfront costs API routes.

Exposes the upfront cost estimation endpoint for QLD property purchases,
including property acquisition costs and loan borrowing costs.
"""

from fastapi import APIRouter

from app.schemas.upfront_costs import UpfrontCostRequest, UpfrontCostResponse
from app.services.upfront_costs import build_upfront_cost_estimate

router = APIRouter(prefix="/upfront-costs", tags=["upfront-costs"])


@router.post("/estimate", response_model=UpfrontCostResponse)
def get_upfront_costs(req: UpfrontCostRequest) -> UpfrontCostResponse:
    """
    Estimate upfront costs for a QLD property purchase.

    Args:
        req: Purchase price, loan details, and investment/PPOR flag

    Returns:
        Itemised cost breakdown with purchase costs, borrowing costs, and totals
    """
    result = build_upfront_cost_estimate(
        purchase_price=req.purchase_price,
        deposit=req.deposit,
        is_investment=req.is_investment,
        lmi_exempt=req.lmi_exempt,
    )

    return UpfrontCostResponse(
        purchase_costs=UpfrontCostResponse.PurchaseCostsDetail(
            stamp_duty=result.purchase_costs.stamp_duty,
            legal_fees=result.purchase_costs.legal_fees,
            building_pest_inspection=result.purchase_costs.building_pest_inspection,
            registration_fee=result.purchase_costs.registration_fee,
            other_costs=result.purchase_costs.other_costs,
            total=result.purchase_costs.total,
        ),
        borrowing_costs=UpfrontCostResponse.BorrowingCostsDetail(
            lmi=result.borrowing_costs.lmi,
            mortgage_registration_fee=result.borrowing_costs.mortgage_registration_fee,
            loan_establishment_fee=result.borrowing_costs.loan_establishment_fee,
            total=result.borrowing_costs.total,
        ),
        total=result.total,
        lvr=req.lvr,
    )
