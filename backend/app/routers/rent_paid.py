"""
Rental rent_paid API routes.
"""

from fastapi import APIRouter

from app.engine.rental import calculate_gross_annual_rent, calculate_weekly_rent_from_annual

from app.schemas.rent_paid import RentPaidRequest, YearByYearRentPaidResponse, RentPaidResponse

router = APIRouter(prefix="/rental", tags=["rental"])


@router.post("/rent-paid", response_model=RentPaidResponse)
def get_rent_paid(req: RentPaidRequest) -> RentPaidResponse:
    """Calculate the total rent paid over the first year and projections for future years."""
    projections: list[YearByYearRentPaidResponse] = []

    for year in range(1, req.projection_years + 1):
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
