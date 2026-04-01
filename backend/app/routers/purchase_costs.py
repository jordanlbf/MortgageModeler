"""
Purchase costs API routes.

Exposes the multi-state property purchase costs endpoint with
grant concession support.
"""

from fastapi import APIRouter

from app.models.purchase_costs import BuyerType, PropertyType, PurchaseCostsInputs
from app.schemas.purchase_costs import (
    GrantAppliedResponse,
    PurchaseCostsRequest,
    PurchaseCostsResponse,
)
from app.services.purchase_costs import calculate_purchase_costs

router = APIRouter(prefix="/purchase-costs", tags=["purchase-costs"])


@router.post("/calculate", response_model=PurchaseCostsResponse)
def get_purchase_costs(req: PurchaseCostsRequest) -> PurchaseCostsResponse:
    """Calculate itemised property purchase costs with grant concessions.

    Computes stamp duty (multi-state), LMI, fees, and applies selected
    grant effects (cash grants, duty exemptions/concessions, LMI waivers,
    equity contributions).

    Args:
        req: Property details, buyer profile, and selected grants.

    Returns:
        Itemised breakdown with base costs, concessions, and totals.
    """
    inputs = PurchaseCostsInputs(
        state=req.state,
        region=req.region,
        price=req.price,
        deposit_percent=req.deposit_percent,
        property_type=PropertyType(req.property_type) if req.property_type else None,
        buyer_type=BuyerType(req.buyer_type) if req.buyer_type else None,
        owner_occupier=req.owner_occupier,
        first_home_buyer=req.first_home_buyer,
        selected_grants=req.selected_grants,
        income=req.income,
        partner_income=req.partner_income,
    )

    b = calculate_purchase_costs(inputs)

    return PurchaseCostsResponse(
        stamp_duty_base=b.stamp_duty_base,
        stamp_duty_concession=b.stamp_duty_concession,
        stamp_duty_payable=b.stamp_duty_payable,
        lmi_base=b.lmi_base,
        lmi_waived=b.lmi_waived,
        lmi_payable=b.lmi_payable,
        legal_fees=b.purchase_costs.legal_fees or 0.0,
        registration_fee=b.purchase_costs.registration_fee or 0.0,
        mortgage_registration_fee=b.borrowing_costs.mortgage_registration_fee or 0.0,
        building_pest_inspection=b.purchase_costs.building_pest_inspection or 0.0,
        loan_establishment_fee=b.borrowing_costs.loan_establishment_fee or 0.0,
        total_fees=b.total_fees,
        grants_applied=[
            GrantAppliedResponse(
                scheme_id=g.scheme_id,
                scheme_name=g.scheme_name,
                category=g.category,
                effect_type=g.effect_type,
                amount=g.amount,
                description=g.description,
            )
            for g in b.grants_applied
        ],
        total_grant_savings=b.total_grant_savings,
        equity_contribution=b.equity_contribution,
        effective_loan_amount=b.effective_loan_amount,
        deposit_amount=b.deposit_amount,
        min_deposit_percent=b.min_deposit_percent,
        total_upfront_cost=b.total_upfront_cost,
        lvr=b.lvr,
    )
