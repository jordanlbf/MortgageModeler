"""
API request/response schemas for the rent paid endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

from app.config.rental import DEFAULT_PROJECTION_YEARS


# ── Request ───────────────────────────────────

class RentPaidRequest(BaseModel):
    """
    Request parameters for projecting rent paid by a tenant.

    Attributes:
        weekly_rent: Weekly rent amount
        annual_growth_rate: Expected annual rent growth rate as decimal
        projection_years: Number of years to project
    """
    weekly_rent: float = Field(default=0.0, ge=0, description="Total rent paid per week")
    annual_growth_rate: float = Field(default=0.0, ge=0, le=1, description="Expected annual growth rate of rent (as a decimal, e.g., 0.05 for 5%)")
    projection_years: int = Field(default=DEFAULT_PROJECTION_YEARS, ge=1, description="Number of years to project rent growth")


# ── Response ──────────────────────────────────

class YearByYearRentPaidResponse(BaseModel):
    """
    A single year's rent paid breakdown.

    Attributes:
        year: Projection year (0 = first year)
        weekly_rent: Weekly rent at this year
        annual_rent_paid: Total annual rent at this year
    """
    year: int
    weekly_rent: float
    annual_rent_paid: float


class RentPaidResponse(BaseModel):
    """
    Rent paid projection response.

    Attributes:
        annual_rent_paid: Total rent paid in the first year
        projections: Per-year rent paid breakdowns
    """
    annual_rent_paid: float
    projections: list[YearByYearRentPaidResponse]
