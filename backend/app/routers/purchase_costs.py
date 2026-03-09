"""
Property API routes.
"""

from fastapi import APIRouter

from app.schemas.purchase_costs import PropertyCostRequest, PropertyCostResponse

from app.engine.property import (estimate_qld_stamp_duty, estimate_lmi, calculate_registration_fee,
                                 calculate_mortgage_registration_fee, calculate_conveyancing_fee,
                                 calculate_building_pest_inspection_fee, calculate_loan_establishment_fee)

router = APIRouter(prefix="/purchase-costs", tags=["purchase-costs"])


@router.post("/estimate", response_model=PropertyCostResponse)
def get_upfront_costs(req: PropertyCostRequest) -> PropertyCostResponse:
    """Generate a full PropertyCost Response"""

    stamp_duty = estimate_qld_stamp_duty(req.purchase_price, req.is_investment)
    lmi = 0.0 if req.lmi_exempt else estimate_lmi(req.loan_amount, req.lvr, req.is_investment)
    registration_fee = calculate_registration_fee(req.purchase_price)
    mortgage_registration_fee = calculate_mortgage_registration_fee()
    conveyancing_fee = calculate_conveyancing_fee()
    building_pest_inspection_fee = calculate_building_pest_inspection_fee()
    loan_establishment_fee = calculate_loan_establishment_fee()

    return PropertyCostResponse(
        stamp_duty=stamp_duty,
        lmi=lmi,
        registration_fee=registration_fee,
        mortgage_registration_fee=mortgage_registration_fee,
        conveyancing_fee=conveyancing_fee,
        building_pest_inspection_fee=building_pest_inspection_fee,
        loan_establishment_fee=loan_establishment_fee,
        total_upfront_cost=(stamp_duty + lmi + registration_fee + mortgage_registration_fee +
                            conveyancing_fee + building_pest_inspection_fee + loan_establishment_fee),
        lvr=req.lvr,
    )
