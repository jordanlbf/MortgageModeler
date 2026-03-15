"""
Property domain models — property, ongoing cost projections and related types.
"""

from dataclasses import dataclass
from datetime import date


@dataclass
class Property:
    """
    Core property details.

    Attributes:
        purchase_date: Date the property was purchased
        is_new_property: Whether the owner is the first occupant/investor
    """
    purchase_date: date
    is_new_property: bool


# ──────────────────────────────────────────────
# Ongoing costs
# ──────────────────────────────────────────────

@dataclass
class YearCost:
    """
    A single year's breakdown of ongoing property costs.

    Attributes:
        year: Projection year (0 = purchase year)
        council_rates: Annual council rates
        water_rates: Annual water rates
        building_insurance: Annual building insurance premium
        landlord_insurance: Annual landlord insurance premium (0 for PPOR)
        strata_fees: Annual strata/body corporate fees
        maintenance_cost: Annual maintenance cost
        management_fee: Annual property management fee (0 for PPOR)
        property_value: Appreciated property value at this year
        rental_income: Annual rental income at this year
        total: Total of all cost fields
    """
    year: int
    council_rates: float
    water_rates: float
    building_insurance: float
    landlord_insurance: float
    strata_fees: float
    maintenance_cost: float
    management_fee: float
    property_value: float
    rental_income: float
    total: float


@dataclass
class OngoingCostProjection:
    """
    Full ongoing cost projection with summary stats.

    Attributes:
        annual_costs: Per-year cost breakdowns
        total_annual_cost: Sum of all costs across all years
        total_monthly_cost: Average monthly cost across projection
        total_deductible_cost: Sum of tax-deductible costs across all years
    """
    annual_costs: list[YearCost]
    total_annual_cost: float
    total_monthly_cost: float
    total_deductible_cost: float
