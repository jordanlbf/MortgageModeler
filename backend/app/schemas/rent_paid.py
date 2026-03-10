"""
API request/response schemas for the rent_paid endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

from app.config.rental import DEFAULT_PROJECTION_YEARS


# REQUESTS

class RentPaidRequest(BaseModel):
    weekly_rent: float = Field(default=0.0, ge=0, description="Total rent paid per week")
    annual_growth_rate: float = Field(default=0.0, ge=0, le=1, description="Expected annual growth rate of rent (as a decimal, e.g., 0.05 for 5%)")
    projection_years: int = Field(default=DEFAULT_PROJECTION_YEARS, ge=1, description="Number of years to project rent growth")


# RESPONSES

class YearByYearRentPaidResponse(BaseModel):
    year: int
    weekly_rent: float
    annual_rent_paid: float


class RentPaidResponse(BaseModel):
    annual_rent_paid: float  # Total rent paid in the first year
    projections: list[YearByYearRentPaidResponse]
