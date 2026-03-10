"""
API request/response schemas for the rent_received endpoint.

This models a single rental property.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

from app.config.rental import DEFAULT_PROJECTION_YEARS


# REQUESTS

class RentReceivedRequest(BaseModel):
    weekly_rent: float = Field(default=0.0, ge=0, description="Total rent received per week")
    annual_growth_rate: float = Field(default=0.0, ge=0, le=1, description="Expected annual growth rate of rent (as a decimal, e.g., 0.05 for 5%)")
    vacancy_rate: float = Field(default=0.0, ge=0, le=1, description="Expected vacancy rate (as a decimal, e.g., 0.05 for 5%)")
    projection_years: int = Field(default=DEFAULT_PROJECTION_YEARS, ge=1, description="Number of years to project rent growth")


# RESPONSES

class YearByYearRentReceivedResponse(BaseModel):
    year: int
    weekly_rent: float
    gross_rental_income: float  # Before accounting for vacancy
    effective_rental_income: float  # After accounting for vacancy


class RentReceivedResponse(BaseModel):
    gross_rental_income: float  # Total gross rental income in the first year (before vacancy)
    effective_rental_income: float  # Total effective rental income in the first year (after vacancy)
    projections: list[YearByYearRentReceivedResponse]
