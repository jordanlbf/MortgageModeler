"""
Property ongoing costs API routes.

Exposes the ongoing cost estimation endpoint for annual property holding
costs including rates, insurance, strata, maintenance, and management fees.
"""

from datetime import date

from fastapi import APIRouter

from app.models.loan import LoanConfig
from app.models.mortgage import Mortgage
from app.models.property import OngoingCostsConfig, Property, RentalConfig
from app.schemas.ongoing_costs import OngoingCostResponse, OngoingPropertyCostRequest, YearByYearCostResponse
from app.services.amortisation import build_loan
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
    property = Property(
        purchase_date=date.today(),
        purchase_price=req.purchase_price,
        is_new_property=False,
        is_ppor=not req.is_investment,
        annual_appreciation=req.annual_growth_rate,
        rental=RentalConfig(
            weekly_rent=req.weekly_rent,
            annual_growth_rate=req.annual_rent_growth_rate,
            vacancy_weeks=req.vacancy_weeks,
        ),
    )

    ongoing_costs = OngoingCostsConfig(
        council_rates=req.council_rates,
        water_rates=req.water_rates,
        building_insurance=req.building_insurance,
        strata_fees=req.strata_fees,
        maintenance_rate=req.maintenance_rate,
        landlord_insurance=req.landlord_insurance,
        management_rate=req.management_rate,
        annual_cost_growth_rate=req.annual_cost_growth_rate,
    )

    loan_config = LoanConfig(deposit=0, annual_rate=0.0, loan_term_years=30)
    mortgage = Mortgage(
        property=property,
        loan=build_loan(property, loan_config),
        ongoing_costs=ongoing_costs,
        projection_years=req.projection_years,
    )
    projection = build_ongoing_cost_projection(mortgage)

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
                total=yc.total_costs,
            )
            for yc in projection.annual_costs
        ],
    )
