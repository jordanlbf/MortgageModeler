"""
API request/response schemas for the rent received endpoint.

Models a single rental property's income projections.
Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

from app.config.rental import DEFAULT_PROJECTION_YEARS


# ── Request ───────────────────────────────────

class RentReceivedRequest(BaseModel):
    """
    Request parameters for projecting rental income received by a landlord.

    Attributes:
        weekly_rent: Weekly rent amount
        annual_growth_rate: Expected annual rent growth rate as decimal
        vacancy_rate: Expected vacancy rate as decimal (e.g. 0.05 for 5%)
        projection_years: Number of years to project
    """
    weekly_rent: float = Field(default=0.0, ge=0, description="Total rent received per week")
    annual_growth_rate: float = Field(default=0.0, ge=0, le=1, description="Expected annual growth rate of rent (as a decimal, e.g., 0.05 for 5%)")
    vacancy_rate: float = Field(default=0.0, ge=0, le=1, description="Expected vacancy rate (as a decimal, e.g., 0.05 for 5%)")
    projection_years: int = Field(default=DEFAULT_PROJECTION_YEARS, ge=1, description="Number of years to project rent growth")


# ── Response ──────────────────────────────────

class YearByYearRentReceivedResponse(BaseModel):
    """
    A single year's rental income breakdown.

    Attributes:
        year: Projection year (0 = first year)
        weekly_rent: Weekly rent at this year
        gross_rental_income: Annual rent before vacancy adjustment
        effective_rental_income: Annual rent after vacancy adjustment
    """
    year: int
    weekly_rent: float
    gross_rental_income: float
    effective_rental_income: float


class RentReceivedResponse(BaseModel):
    """
    Rental income projection response.

    Attributes:
        gross_rental_income: First year gross rental income (before vacancy)
        effective_rental_income: First year effective rental income (after vacancy)
        projections: Per-year rental income breakdowns
    """
    gross_rental_income: float
    effective_rental_income: float
    projections: list[YearByYearRentReceivedResponse]
