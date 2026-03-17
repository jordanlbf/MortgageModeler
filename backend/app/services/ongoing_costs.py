"""
Ongoing property costs service.

Orchestrates engine calculations into a full year-by-year projection.
"""

from app.engine.property import (
    calculate_council_rates,
    calculate_water_rates,
    calculate_building_insurance,
    calculate_landlord_insurance,
    calculate_strata_fees,
    calculate_maintenance_cost,
    calculate_management_fee,
    calculate_property_value,
    calculate_rental_income,
)
from app.models.property import Property, OngoingCostsConfig, YearCost, OngoingCostProjection


def build_ongoing_cost_projection(
    property: Property,
    ongoing_costs: OngoingCostsConfig,
    projection_years: int,
) -> OngoingCostProjection:
    """
    Build a full ongoing cost projection over N years.

    Calls individual engine functions per year and assembles
    the result into domain models. Investment-specific costs
    (landlord insurance, management fee) are controlled by
    property.is_ppor.

    Args:
        property: Property details with purchase price, appreciation, and rental config
        ongoing_costs: Base ongoing cost rates and growth rate
        projection_years: Number of years to project

    Returns:
        OngoingCostProjection with per-year breakdowns and summary stats
    """
    is_investment = not property.is_ppor
    annual_costs: list[YearCost] = []

    for year in range(projection_years):
        cr = calculate_council_rates(year, ongoing_costs.council_rates, ongoing_costs.annual_cost_growth_rate)
        wr = calculate_water_rates(year, ongoing_costs.water_rates, ongoing_costs.annual_cost_growth_rate)
        bi = calculate_building_insurance(year, ongoing_costs.building_insurance, ongoing_costs.annual_cost_growth_rate)
        li = calculate_landlord_insurance(year, ongoing_costs.landlord_insurance, ongoing_costs.annual_cost_growth_rate, is_investment)
        sf = calculate_strata_fees(year, ongoing_costs.strata_fees, ongoing_costs.annual_cost_growth_rate)
        mc = calculate_maintenance_cost(year, property.purchase_price, ongoing_costs.maintenance_rate, property.annual_appreciation)
        mf = calculate_management_fee(year, property.rental.weekly_rent, property.rental.vacancy_weeks,
                                      ongoing_costs.management_rate, property.rental.annual_growth_rate, is_investment)
        pv = calculate_property_value(year, property.purchase_price, property.annual_appreciation)
        ri = calculate_rental_income(year, property.rental.weekly_rent, property.rental.vacancy_weeks,
                                     property.rental.annual_growth_rate)

        total = cr + wr + bi + li + sf + mc + mf

        annual_costs.append(
            YearCost(
                year=year,
                council_rates=cr,
                water_rates=wr,
                building_insurance=bi,
                landlord_insurance=li,
                strata_fees=sf,
                maintenance_cost=mc,
                management_fee=mf,
                property_value=pv,
                rental_income=ri,
                total_costs=total,
            )
        )

    year_one = annual_costs[0]

    return OngoingCostProjection(
        annual_costs=annual_costs,
        total_annual_cost=year_one.total_costs,
        total_monthly_cost=year_one.total_costs / 12,
        total_deductible_cost=year_one.total_costs if is_investment else 0.0,
    )
