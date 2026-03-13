"""
Property tax deduction engine.

Division 43 (building depreciation) and Division 40 (plant & equipment)
calculations. All functions are pure — no side effects or external dependencies.
"""


def calculate_division_43_deduction(
    construction_cost: float,
    days_held: int,
    leap_year: bool,
) -> float:
    """
    Calculate the Division 43 building depreciation deduction for a given year.

    Args:
        construction_cost: Original cost of constructing the building
        days_held: Number of days the property was held during the year (must be <= 365, or <= 366 for leap year)
        leap_year: Whether the year is a leap year (affects daily deduction)

    Returns:
        Deduction amount for the current year

    Raises:
        ValueError: If days_held exceeds the number of days in the year
    """
    days_in_year = 366 if leap_year else 365
    if days_held > days_in_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_year})")
    return (construction_cost * 0.025) * (days_held / days_in_year)
