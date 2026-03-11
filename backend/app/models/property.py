"""
Property domain models — ongoing cost projections and related types.
"""

from dataclasses import dataclass


# ──────────────────────────────────────────────
# Ongoing costs
# ──────────────────────────────────────────────

@dataclass
class YearCost:
    """A single year's breakdown of ongoing property costs."""
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
    """Full ongoing cost projection with summary stats."""
    annual_costs: list[YearCost]
    total_annual_cost: float
    total_monthly_cost: float
    total_deductible_cost: float
