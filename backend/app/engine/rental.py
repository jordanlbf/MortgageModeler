"""
Pure calculation functions for rental modelling.

Covers both rent-paid (tenant housing costs) and rent-received
(landlord rental income), with compound annual growth and vacancy adjustments.
"""


def calculate_gross_annual_rent(year: int, weekly_rent: float, growth_rate: float) -> float:
    """Calculate total annual rent paid/received for a given year."""
    if year < 0:
        raise ValueError("year must be >= 0")
    return weekly_rent * 52 * ((1 + growth_rate) ** year)


def calculate_effective_annual_rent(year: int, vacancy_rate: float, weekly_rent: float, growth_rate: float) -> float:
    """Calculate effective annual rent received for a given year, accounting for vacancy."""
    if vacancy_rate < 0 or vacancy_rate > 1:
        raise ValueError("vacancy_rate must be between 0 and 1")
    gross_rent = calculate_gross_annual_rent(year, weekly_rent, growth_rate)
    return gross_rent * (1 - vacancy_rate)


def calculate_weekly_rent_from_annual(annual_rent: float) -> float:
    """Convert annual rent back to weekly rent."""
    return annual_rent / 52
