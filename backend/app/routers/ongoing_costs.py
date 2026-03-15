"""
Property ongoing costs API routes.

Exposes the ongoing cost estimation endpoint for annual property holding
costs including rates, insurance, strata, maintenance, and management fees.
"""

from fastapi import APIRouter

from app.schemas.ongoing_costs import OngoingCostResponse, OngoingPropertyCostRequest, YearByYearCostResponse
from app.services.ongoing_costs import build_ongoing_cost_projection

router = APIRouter(prefix="/ongoing-costs", tags=["ongoing-costs"])


@router.post("/estimate", response_model=OngoingCostResponse)
def get_ongoing_costs(req: OngoingPropertyCostRequest) -> OngoingCostResponse:
    """
    Estimate ongoing property costs with year-by-year projections.

    Args:
        req: Base costs, growth rates, rental details, and projection period

    Returns:
        Annual cost breakdown with summary totals
    """
    projection = build_ongoing_cost_projection(
        projection_years=req.projection_years,
        council_rates=req.council_rates,
        water_rates=req.water_rates,
        building_insurance=req.building_insurance,
        landlord_insurance=req.landlord_insurance,
        strata_fees=req.strata_fees,
        purchase_price=req.purchase_price,
        maintenance_rate=req.maintenance_rate,
        annual_growth_rate=req.annual_growth_rate,
        weekly_rent=req.weekly_rent,
        vacancy_weeks=req.vacancy_weeks,
        management_rate=req.management_rate,
        annual_rent_growth_rate=req.annual_rent_growth_rate,
        annual_cost_growth_rate=req.annual_cost_growth_rate,
        is_investment=req.is_investment,
    )

    return OngoingCostResponse(
        total_annual_cost=projection.total_annual_cost,
        total_monthly_cost=projection.total_monthly_cost,
        total_deductible_cost=projection.total_deductible_cost,
        annual_costs=[
            YearByYearCostResponse(
                year=yc.year,
                council_rates=yc.council_rates,
                water_rates=yc.water_rates,
                building_insurance=yc.building_insurance,
                landlord_insurance=yc.landlord_insurance,
                strata_fees=yc.strata_fees,
                maintenance_cost=yc.maintenance_cost,
                management_fee=yc.management_fee,
                property_value=yc.property_value,
                rental_income=yc.rental_income,
                total=yc.total,
            )
            for yc in projection.annual_costs
        ],
    )
