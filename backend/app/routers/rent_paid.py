"""
Rental expense (rent paid) API routes.

Exposes the rent paid endpoint for tenants, projecting annual rental
costs over multiple years with compound growth.
"""

from fastapi import APIRouter

from app.engine.rental import calculate_gross_annual_rent, calculate_weekly_rent_from_annual

from app.schemas.rent_paid import RentPaidRequest, YearByYearRentPaidResponse, RentPaidResponse

router = APIRouter(prefix="/rental", tags=["rental"])


@router.post("/rent-paid", response_model=RentPaidResponse)
def get_rent_paid(req: RentPaidRequest) -> RentPaidResponse:
    """
    Calculate rent paid with year-by-year projections.

    Args:
        req: Weekly rent, growth rate, and projection period

    Returns:
        First-year summary and per-year rental cost projections
    """
    projections: list[YearByYearRentPaidResponse] = []

    for year in range(req.projection_years):
        gross_annual_rent = calculate_gross_annual_rent(year, req.weekly_rent, req.annual_growth_rate)
        weekly_rent = calculate_weekly_rent_from_annual(gross_annual_rent)
        projections.append(
            YearByYearRentPaidResponse(
                year=year,
                weekly_rent=weekly_rent,
                annual_rent_paid=gross_annual_rent,
            )
        )

    return RentPaidResponse(
        annual_rent_paid=projections[0].annual_rent_paid,  # Total rent paid in the first year
        projections=projections,
    )
