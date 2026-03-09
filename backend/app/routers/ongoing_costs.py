"""
Property ongoing_costs API routes.
"""

from fastapi import APIRouter

from app.engine.property import calculate_council_rates, calculate_water_rates, calculate_building_insurance, \
    calculate_landlord_insurance, calculate_strata_fees, calculate_maintenance_cost, calculate_management_fee, \
    calculate_property_value, calculate_rental_income
from app.schemas.ongoing_costs import OngoingCostResponse, OngoingPropertyCostRequest, YearByYearCostResponse

router = APIRouter(prefix="/ongoing-costs", tags=["ongoing-costs"])


@router.post("/estimate", response_model=OngoingCostResponse)
def get_ongoing_costs(req: OngoingPropertyCostRequest) -> OngoingCostResponse:
    """Generate a full Ongoing Property Cost Response"""
    annual_costs: list[YearByYearCostResponse] = []

    for i in range(1, req.projection_years + 1):
        council_rates = calculate_council_rates(i, req.council_rates, req.annual_cost_growth_rate)
        water_rates = calculate_water_rates(i, req.water_rates, req.annual_cost_growth_rate)
        building_insurance = calculate_building_insurance(i, req.building_insurance, req.annual_cost_growth_rate)
        landlord_insurance = calculate_landlord_insurance(i, req.landlord_insurance, req.annual_cost_growth_rate,
                                                          req.is_investment)
        strata_fees = calculate_strata_fees(i, req.strata_fees, req.annual_cost_growth_rate)
        maintenance_cost = calculate_maintenance_cost(i, req.purchase_price, req.maintenance_rate,
                                                      req.annual_growth_rate)
        management_fee = calculate_management_fee(i, req.weekly_rent, req.vacancy_weeks, req.management_rate,
                                                  req.annual_rent_growth_rate, req.is_investment)
        property_value = calculate_property_value(i, req.purchase_price, req.annual_growth_rate)
        rental_income = calculate_rental_income(i, req.weekly_rent, req.vacancy_weeks, req.annual_rent_growth_rate)

        year_cost = YearByYearCostResponse(
            year=i,
            council_rates=council_rates,
            water_rates=water_rates,
            building_insurance=building_insurance,
            landlord_insurance=landlord_insurance,
            strata_fees=strata_fees,
            maintenance_cost=maintenance_cost,
            management_fee=management_fee,
            property_value=property_value,
            rental_income=rental_income,
            total=council_rates + water_rates + building_insurance + landlord_insurance +
                  strata_fees + maintenance_cost + management_fee
        )

        annual_costs.append(year_cost)

    total_annual_cost = annual_costs[0].total
    total_monthly_cost = total_annual_cost / 12
    total_deductible_cost = annual_costs[0].total if req.is_investment else 0.0

    return OngoingCostResponse(
        annual_costs=annual_costs,
        total_annual_cost=total_annual_cost,
        total_monthly_cost=total_monthly_cost,
        total_deductible_cost=total_deductible_cost,
    )
