"""
Ongoing property costs service.

Orchestrates engine calculations into year-by-year cost projections.
calculate_year_cost builds a single year's costs; build_ongoing_cost_projection
assembles the full multi-year projection.
"""

from app.engine.property import (
    calculate_building_insurance,
    calculate_council_rates,
    calculate_landlord_insurance,
    calculate_maintenance_cost,
    calculate_management_fee,
    calculate_property_value,
    calculate_rental_income,
    calculate_strata_fees,
    calculate_water_rates,
)
from app.models.mortgage import Mortgage
from app.models.property import OngoingCostProjection, YearCost


def calculate_year_cost(year: int, mortgage: Mortgage) -> YearCost:
    """
    Calculate a single year's ongoing property costs.

    Calls individual engine functions for each cost component and
    assembles into a YearCost. Investment-specific costs (landlord
    insurance, management fee) are controlled by property.is_ppor.

    Args:
        year: Projection year (0 = purchase year)
        mortgage: Mortgage aggregate with property and ongoing cost details

    Returns:
        YearCost with itemised cost breakdown for this year
    """
    is_investment = not mortgage.property.is_ppor
    ongoing_costs = mortgage.ongoing_costs

    cr = calculate_council_rates(year, ongoing_costs.council_rates, ongoing_costs.annual_cost_growth_rate)
    wr = calculate_water_rates(year, ongoing_costs.water_rates, ongoing_costs.annual_cost_growth_rate)
    bi = calculate_building_insurance(year, ongoing_costs.building_insurance, ongoing_costs.annual_cost_growth_rate)
    li = calculate_landlord_insurance(
        year, ongoing_costs.landlord_insurance, ongoing_costs.annual_cost_growth_rate, is_investment
    )
    sf = calculate_strata_fees(year, ongoing_costs.strata_fees, ongoing_costs.annual_cost_growth_rate)
    mc = calculate_maintenance_cost(
        year, mortgage.property.purchase_price, ongoing_costs.maintenance_rate, mortgage.property.annual_appreciation
    )
    mf = calculate_management_fee(
        year,
        mortgage.property.rental.weekly_rent,
        mortgage.property.rental.vacancy_weeks,
        ongoing_costs.management_rate,
        mortgage.property.rental.annual_growth_rate,
        is_investment,
    )
    pv = calculate_property_value(year, mortgage.property.purchase_price, mortgage.property.annual_appreciation)
    ri = calculate_rental_income(
        year,
        mortgage.property.rental.weekly_rent,
        mortgage.property.rental.vacancy_weeks,
        mortgage.property.rental.annual_growth_rate,
    )

    total = cr + wr + bi + li + sf + mc + mf

    return YearCost(
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


def build_ongoing_cost_projection(mortgage: Mortgage) -> OngoingCostProjection:
    """
    Build a full ongoing cost projection over N years.

    Calls calculate_year_cost per year and assembles into a projection
    with summary stats.

    Args:
        mortgage: Mortgage aggregate with property, ongoing cost, and projection year details

    Returns:
        OngoingCostProjection with per-year breakdowns and summary stats
    """
    is_investment = not mortgage.property.is_ppor
    annual_costs = [calculate_year_cost(year, mortgage) for year in range(mortgage.projection_years)]

    year_one = annual_costs[0]

    return OngoingCostProjection(
        annual_costs=annual_costs,
        total_annual_cost=year_one.total_costs,
        total_monthly_cost=year_one.total_costs / 12,
        total_deductible_cost=year_one.total_costs if is_investment else 0.0,
    )
