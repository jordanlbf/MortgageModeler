"""
API request/response schemas for the ongoing property costs endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

from app.config.property import (
    DEFAULT_ANNUAL_COST_GROWTH_RATE,
    DEFAULT_MAINTENANCE_RATE,
    DEFAULT_MANAGEMENT_RATE,
    DEFAULT_PROJECTION_YEARS,
    DEFAULT_VACANCY_WEEKS,
)

# ── Request ───────────────────────────────────


class OngoingPropertyCostRequest(BaseModel):
    """
    Request parameters for estimating ongoing property costs.

    Attributes:
        purchase_price: Property purchase price
        annual_growth_rate: Expected annual property value growth rate as decimal
        weekly_rent: Expected weekly rental income
        annual_rent_growth_rate: Expected annual rent growth rate as decimal
        vacancy_weeks: Expected vacant weeks per year (0–52)
        is_investment: Whether the property is an investment
        projection_years: Number of years to project costs (1–50)
        annual_cost_growth_rate: Expected annual growth rate for ongoing costs as decimal
        council_rates: Annual council rates
        water_rates: Annual water rates
        building_insurance: Annual building insurance premium
        landlord_insurance: Annual landlord insurance premium
        strata_fees: Annual strata/body corporate fees
        maintenance_rate: Annual maintenance as fraction of property value (e.g. 0.01 for 1%)
        management_rate: Annual management fee as fraction of rental income (e.g. 0.08 for 8%)
    """

    purchase_price: float = Field(default=0.0, ge=0, description="Property purchase price")
    annual_growth_rate: float = Field(
        default=0.0, ge=0, le=1, description="Expected annual property growth rate (as a decimal, e.g., 0.05 for 5%)"
    )
    weekly_rent: float = Field(default=0.0, ge=0, description="Expected weekly rental income")
    annual_rent_growth_rate: float = Field(
        default=0.0, ge=0, le=1, description="Expected annual rent growth rate (as a decimal, e.g., 0.05 for 5%)"
    )
    vacancy_weeks: int = Field(
        default=DEFAULT_VACANCY_WEEKS,
        ge=0,
        le=52,
        description="Expected number of weeks the property will be vacant per year",
    )
    is_investment: bool = Field(default=False, description="Whether the property is an investment property")
    projection_years: int = Field(
        default=DEFAULT_PROJECTION_YEARS, ge=1, le=50, description="Number of years to project ongoing costs for"
    )
    annual_cost_growth_rate: float = Field(
        default=DEFAULT_ANNUAL_COST_GROWTH_RATE,
        ge=0,
        le=1,
        description="Expected annual growth rate for ongoing costs (as a decimal, e.g., 0.03 for 3%)",
    )
    council_rates: float = Field(default=0.0, ge=0, description="Annual council rates")
    water_rates: float = Field(default=0.0, ge=0, description="Annual water rates")
    building_insurance: float = Field(default=0.0, ge=0, description="Annual building insurance cost")
    landlord_insurance: float = Field(default=0.0, ge=0, description="Annual landlord insurance cost (if applicable)")
    strata_fees: float = Field(default=0.0, ge=0, description="Annual strata fees (if applicable)")
    maintenance_rate: float = Field(
        default=DEFAULT_MAINTENANCE_RATE,
        ge=0,
        le=1,
        description="Annual maintenance cost as a percentage of property value (as a decimal, e.g., 0.01 for 1%)",
    )
    management_rate: float = Field(
        default=DEFAULT_MANAGEMENT_RATE,
        ge=0,
        le=1,
        description="Annual property management fee as a percentage of rental income (as a decimal, e.g., 0.08 for 8%)",
    )


# ── Response ──────────────────────────────────


class YearByYearCostResponse(BaseModel):
    """
    A single year's ongoing cost breakdown.

    Attributes:
        year: Projection year (0 = purchase year)
        council_rates: Annual council rates at this year
        water_rates: Annual water rates at this year
        building_insurance: Annual building insurance at this year
        landlord_insurance: Annual landlord insurance at this year (0 for PPOR)
        strata_fees: Annual strata fees at this year
        maintenance_cost: Annual maintenance cost at this year
        management_fee: Annual management fee at this year (0 for PPOR)
        property_value: Appreciated property value at this year
        rental_income: Annual rental income at this year
        total: Total of all cost fields for this year
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


class OngoingCostResponse(BaseModel):
    """
    Ongoing property cost projection response.

    Attributes:
        annual_costs: Per-year cost breakdowns
        total_annual_cost: Year 1 total ongoing cost
        total_monthly_cost: Year 1 total ongoing cost divided by 12
        total_deductible_cost: Year 1 total deductible cost (for investment properties)
    """

    annual_costs: list[YearByYearCostResponse]
    total_annual_cost: float
    total_monthly_cost: float
    total_deductible_cost: float
