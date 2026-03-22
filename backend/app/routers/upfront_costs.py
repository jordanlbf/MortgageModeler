"""
Upfront costs API routes.

Exposes the upfront cost estimation endpoint for QLD property purchases.
Auto-estimates costs when not provided, respects explicit overrides.
"""

from datetime import date

from fastapi import APIRouter

from app.models.loan import LoanConfig, BorrowingCosts
from app.models.mortgage import Mortgage
from app.models.property import Property, PurchaseCosts
from app.schemas.upfront_costs import UpfrontCostRequest, UpfrontCostResponse
from app.services.amortisation import build_loan
from app.services.upfront_costs import build_upfront_cost_estimate

router = APIRouter(prefix="/upfront-costs", tags=["upfront-costs"])


@router.post("/estimate", response_model=UpfrontCostResponse)
def get_upfront_costs(req: UpfrontCostRequest) -> UpfrontCostResponse:
    """
    Estimate upfront costs for a QLD property purchase.

    Args:
        req: Purchase price, deposit, investment flag, and optional cost overrides

    Returns:
        Fully resolved cost breakdown with purchase costs, borrowing costs, and totals
    """
    property = Property(
        purchase_date=date.today(),
        purchase_price=req.purchase_price,
        is_new_property=False,
        is_ppor=not req.is_investment,
        purchase_costs=PurchaseCosts(
            stamp_duty=req.stamp_duty,
            legal_fees=req.legal_fees,
            building_pest_inspection=req.building_pest_inspection,
            registration_fee=req.registration_fee,
            other_costs=req.other_costs,
        ),
    )

    loan_config = LoanConfig(
        deposit=req.deposit,
        annual_rate=0.0,
        loan_term_years=30,
        borrowing_costs=BorrowingCosts(
            lmi=req.lmi,
            mortgage_registration_fee=req.mortgage_registration_fee,
            loan_establishment_fee=req.loan_establishment_fee,
        ),
    )

    mortgage = Mortgage(property=property, loan=build_loan(property, loan_config))
    result = build_upfront_cost_estimate(mortgage)

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
