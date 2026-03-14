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
from app.models.property import YearCost, OngoingCostProjection


def build_ongoing_cost_projection(
    projection_years: int,
    council_rates: float,
    water_rates: float,
    building_insurance: float,
    landlord_insurance: float,
    strata_fees: float,
    purchase_price: float,
    maintenance_rate: float,
    annual_growth_rate: float,
    weekly_rent: float,
    vacancy_weeks: int,
    management_rate: float,
    annual_rent_growth_rate: float,
    annual_cost_growth_rate: float,
    is_investment: bool,
) -> OngoingCostProjection:
    """
    Build a full ongoing cost projection over N years.

    Calls individual engine functions per year and assembles
    the result into domain models.
    """
    annual_costs: list[YearCost] = []

    for year in range(projection_years):
        cr = calculate_council_rates(year, council_rates, annual_cost_growth_rate)
        wr = calculate_water_rates(year, water_rates, annual_cost_growth_rate)
        bi = calculate_building_insurance(year, building_insurance, annual_cost_growth_rate)
        li = calculate_landlord_insurance(year, landlord_insurance, annual_cost_growth_rate, is_investment)
        sf = calculate_strata_fees(year, strata_fees, annual_cost_growth_rate)
        mc = calculate_maintenance_cost(year, purchase_price, maintenance_rate, annual_growth_rate)
        mf = calculate_management_fee(year, weekly_rent, vacancy_weeks, management_rate, annual_rent_growth_rate, is_investment)
        pv = calculate_property_value(year, purchase_price, annual_growth_rate)
        ri = calculate_rental_income(year, weekly_rent, vacancy_weeks, annual_rent_growth_rate)

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
                total=total,
            )
        )

    year_one = annual_costs[0]

    return OngoingCostProjection(
        annual_costs=annual_costs,
        total_annual_cost=year_one.total,
        total_monthly_cost=year_one.total / 12,
        total_deductible_cost=year_one.total if is_investment else 0.0,
    )
