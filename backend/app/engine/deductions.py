"""
Property tax deduction engine.

Division 43 (building depreciation) and Division 40 (plant & equipment)
calculations. All functions are pure — no side effects or external dependencies.
"""

from datetime import date

from app.config.deductions import DIV43_CONSTRUCTION_CUTOFF_DATE, DIV40_SECONDHAND_CUTOFF_DATE


def calculate_division_43_deduction(
    construction_cost: float,
    days_held: int,
    days_in_financial_year: int = 365,
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
    if days_in_financial_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_financial_year}) must be 365 or 366")
    if days_held > days_in_financial_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_financial_year})")
    return (construction_cost * 0.025) * (days_held / days_in_financial_year)


def calculate_division_40_prime_cost(
    cost: float,
    effective_life_years: int,
    days_held: int,
    days_in_financial_year: int = 365,
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

    if days_in_financial_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_financial_year}) must be 365 or 366")
    if days_held > days_in_financial_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_financial_year})")

    return cost * (1 / effective_life_years) * (days_held / days_in_financial_year)


def calculate_division_40_diminishing_value(
    written_down_value: float,
    effective_life_years: int,
    days_held: int,
    days_in_financial_year: int = 365,
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

    if days_in_financial_year not in (365, 366):
        raise ValueError(f"days_in_year ({days_in_financial_year}) must be 365 or 366")
    if days_held > days_in_financial_year:
        raise ValueError(f"days_held ({days_held}) exceeds days in year ({days_in_financial_year})")

    return written_down_value * (2 / effective_life_years) * (days_held / days_in_financial_year)


def is_building_depreciable(construction_start_date: date) -> bool:
    """
    Check if a building qualifies for Division 43 depreciation.

    Only buildings with construction commencing on or after 16 September 1987
    are eligible.

    Args:
        construction_start_date: Date construction commenced

    Returns:
        True if eligible for Div 43 depreciation
    """
    return construction_start_date >= DIV43_CONSTRUCTION_CUTOFF_DATE


def is_asset_depreciable(asset_purchase_date: date, property_purchase_date: date) -> bool:
    """
    Check if a Div 40 asset is claimable based on purchase dates.

    For properties purchased on or after 9 May 2017, second-hand assets
    (those already in the property at purchase) cannot be depreciated.

    Args:
        asset_purchase_date: Date the asset was purchased/installed
        property_purchase_date: Date the property was purchased

    Returns:
        True if the asset is eligible for Div 40 depreciation
    """
    is_secondhand = asset_purchase_date < property_purchase_date
    return not (is_secondhand and property_purchase_date >= DIV40_SECONDHAND_CUTOFF_DATE)
