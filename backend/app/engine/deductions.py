"""
Property tax deduction engine.

Division 43 (building depreciation) and Division 40 (plant & equipment)
calculations. All functions are pure — no side effects or external dependencies.
"""


def calculate_division_43_deduction(
    construction_cost: float,
    days_held: int,
    days_in_year: int = 365,
) -> float:
    """
    Calculate the Division 43 building depreciation deduction for a given year.

    Args:
        construction_cost: Original cost of constructing the building
        days_held: Number of days the property was held during the year (must be <= days_in_year)
        days_in_year: Number of days in the year (365 or 366)

    Returns:
        Deduction amount for the current year

    Raises:
        ValueError: If days_held exceeds days_in_year
        ValueError: If days_in_year is not 365 or 366
    """
    if days_in_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_year}) must be 365 or 366")
    if days_held > days_in_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_year})")
    return (construction_cost * 0.025) * (days_held / days_in_year)


def calculate_division_40_prime_cost(
    cost: float,
    effective_life_years: int,
    days_held: int,
    days_in_year: int = 365,
) -> float:
    """
    Calculate Division 40 depreciation using the prime cost (straight-line) method.

    Args:
        cost: Original cost of the asset
        effective_life_years: ATO effective life of the asset in years (must be >= 1)
        days_held: Number of days the asset was held during the year (must be <= days_in_year)
        days_in_year: Number of days in the year (365 or 366)

    Returns:
        Deduction amount for the current year

    Raises:
        ValueError: If days_held exceeds days_in_year
        ValueError: If days_in_year is not 365 or 366
        ValueError: If effective_life_years is less than 1
    """
    if effective_life_years < 1:
        raise ValueError(f"effective_life_years ({effective_life_years}) must be at least 1")

    if days_in_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_year}) must be 365 or 366")
    if days_held > days_in_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_year})")

    return cost * (1 / effective_life_years) * (days_held / days_in_year)


def calculate_division_40_diminishing_value(
    written_down_value: float,
    effective_life_years: int,
    days_held: int,
    days_in_year: int = 365,
) -> float:
    """
    Calculate Division 40 depreciation using the diminishing value method.

    Args:
        written_down_value: Remaining book value of the asset after prior deductions
        effective_life_years: ATO effective life of the asset in years (must be >= 1)
        days_held: Number of days the asset was held during the year (must be <= days_in_year)
        days_in_year: Number of days in the year (365 or 366)

    Returns:
        Deduction amount for the current year

    Raises:
        ValueError: If days_held exceeds days_in_year
        ValueError: If days_in_year is not 365 or 366
        ValueError: If effective_life_years is less than 1
    """
    if effective_life_years < 1:
        raise ValueError(f"effective_life_years ({effective_life_years}) must be at least 1")

    if days_in_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_year}) must be 365 or 366")
    if days_held > days_in_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_year})")

    return written_down_value * (2 / effective_life_years) * (days_held / days_in_year)
