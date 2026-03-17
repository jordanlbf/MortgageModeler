"""
Property purchase costs API routes.

Exposes the upfront cost estimation endpoint for QLD property purchases,
including stamp duty, LMI, registration fees, and other settlement costs.
"""

from fastapi import APIRouter

from app.schemas.purchase_costs import PropertyCostRequest, PropertyCostResponse
from app.services.purchase_costs import build_purchase_cost_estimate

router = APIRouter(prefix="/purchase-costs", tags=["purchase-costs"])


@router.post("/estimate", response_model=PropertyCostResponse)
def get_upfront_costs(req: PropertyCostRequest) -> PropertyCostResponse:
    """
    Estimate upfront costs for a QLD property purchase.

    Args:
        req: Purchase price, loan details, and investment/PPOR flag

    Returns:
        Itemised cost breakdown with total upfront cost
    """
    result = build_purchase_cost_estimate(
        purchase_price=req.purchase_price,
        deposit=req.deposit,
        is_investment=req.is_investment,
        lmi_exempt=req.lmi_exempt,
    )

    return PropertyCostResponse(
        stamp_duty=result.stamp_duty,
        lmi=result.lmi,
        registration_fee=result.registration_fee,
        mortgage_registration_fee=result.mortgage_registration_fee,
        conveyancing_fee=result.conveyancing_fee,
        building_pest_inspection_fee=result.building_pest_inspection_fee,
        loan_establishment_fee=result.loan_establishment_fee,
        total_upfront_cost=result.total_upfront_cost,
        lvr=result.lvr,
    )
