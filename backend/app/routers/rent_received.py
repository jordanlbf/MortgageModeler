"""
Rental income (rent received) API routes.

Exposes the rent received endpoint for landlords, projecting gross and
effective (vacancy-adjusted) rental income over multiple years.
"""

from fastapi import APIRouter

from app.engine.rental import calculate_gross_annual_rent, calculate_weekly_rent_from_annual, calculate_effective_annual_rent

from app.schemas.rent_received import RentReceivedRequest, YearByYearRentReceivedResponse, RentReceivedResponse

router = APIRouter(prefix="/rental", tags=["rental"])


@router.post("/rent-received", response_model=RentReceivedResponse)
def get_rent_received(req: RentReceivedRequest) -> RentReceivedResponse:
    """
    Calculate rent received with year-by-year projections.

    Args:
        req: Weekly rent, vacancy rate, growth rate, and projection period

    Returns:
        First-year summary and per-year gross/effective rental income projections
    """
    projections: list[YearByYearRentReceivedResponse] = []

    for year in range(req.projection_years):
        gross_annual_rent = calculate_gross_annual_rent(year, req.weekly_rent, req.annual_growth_rate)
        weekly_rent = calculate_weekly_rent_from_annual(gross_annual_rent)
        effective_annual_rent = calculate_effective_annual_rent(year, req.vacancy_rate, req.weekly_rent, req.annual_growth_rate)
        projections.append(
            YearByYearRentReceivedResponse(
                year=year,
                weekly_rent=weekly_rent,
                gross_rental_income=gross_annual_rent,
                effective_rental_income=effective_annual_rent,
            )
        )

    return RentReceivedResponse(
        gross_rental_income=projections[0].gross_rental_income,  # Total rent paid in the first year
        effective_rental_income=projections[0].effective_rental_income,  # Total effective rent received in the first year
        projections=projections,
    )
