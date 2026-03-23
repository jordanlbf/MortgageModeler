"""
Property calculation engine.

Handles:
- Property value appreciation over time
- Rental income projections with annual growth
- Investment property running costs
- Stamp duty estimation (QLD)
"""

import math

from app.config.property import (
    DEFAULT_BUILDING_PEST_INSPECTION_FEE,
    DEFAULT_CONVEYANCING_FEE,
    DEFAULT_LOAN_ESTABLISHMENT_FEE,
    LMI_ESTIMATE,
    QLD_MORTGAGE_REGISTRATION_FEE,
    QLD_REGISTRATION_FEE_BASE,
    QLD_REGISTRATION_FEE_PER_10K,
    QLD_REGISTRATION_FEE_THRESHOLD,
    QLD_STAMP_DUTY_BASE_BRACKETS,
    QLD_STAMP_DUTY_CONCESSION_BRACKETS,
)


def calculate_qld_stamp_duty_with_bracket(purchase_price: float, bracket: list[tuple[float, float, float]]) -> float:
    """
    Calculate QLD stamp duty amount from the given bracket.

    Args:
        purchase_price: Property purchase price
        bracket: Which stamp duty bracket to use (concession or standard)

    Returns:
        Estimated stamp duty base amount (before concessions)

    Raises:
        ValueError: If bracket config is missing a catch-all (float('inf')) entry
    """
    # QLD Stamp Duty rates apply to units of $100 or part thereof,
    # so we round up to the next $100
    purchase_price = math.ceil(purchase_price / 100) * 100

    prev_threshold = 0
    for threshold, rate, base in bracket:
        if purchase_price <= threshold:
            return base + (purchase_price - prev_threshold) * (rate / 100)
        prev_threshold = threshold
    raise ValueError("Stamp duty bracket config missing catch-all bracket (e.g. float('inf'))")


def estimate_qld_stamp_duty(purchase_price: float, is_investment: bool = True) -> float:
    """
    Estimate QLD stamp duty (transfer duty).

    Args:
        purchase_price: Property purchase price
        is_investment: Whether the property is an investment (standard rates)
                       or PPOR (home concession rates)

    Returns:
        Estimated stamp duty amount
    """
    if is_investment:
        return calculate_qld_stamp_duty_with_bracket(purchase_price, QLD_STAMP_DUTY_BASE_BRACKETS)
    else:
        return calculate_qld_stamp_duty_with_bracket(purchase_price, QLD_STAMP_DUTY_CONCESSION_BRACKETS)


def estimate_lmi(loan_amount: float, lvr: float, is_investment: bool) -> float:
    """
    Estimate Lenders Mortgage Insurance (LMI) for a given loan amount and LVR.

    This is a very rough estimate based on typical LMI rates, which can vary
    widely based on the lender, loan type, and borrower profile. For simplicity,
    we use a flat rate that increases with LVR.

    Args:
        loan_amount: The amount of the loan
        lvr: Loan-to-value ratio (e.g., 0.95 for 95%)
        is_investment: Whether the property is an investment (LMI is often higher)

    Returns:
        Estimated LMI cost
    """
    lmi_amount = 0.0
    for threshold, rate in LMI_ESTIMATE:
        if lvr <= threshold:
            lmi_amount = loan_amount * rate
            break

    # Investment properties often have higher LMI premiums, so we apply a multiplier
    return lmi_amount if not is_investment else lmi_amount * 1.15


def calculate_registration_fee(purchase_price: float) -> float:
    """
    Calculate QLD title registration fee based on purchase price.

    Args:
        purchase_price: Property purchase price

    Returns:
        Estimated title registration fee
    """
    if purchase_price <= QLD_REGISTRATION_FEE_THRESHOLD:
        return QLD_REGISTRATION_FEE_BASE
    else:
        excess = purchase_price - QLD_REGISTRATION_FEE_THRESHOLD
        return QLD_REGISTRATION_FEE_BASE + math.ceil(excess / 10_000) * QLD_REGISTRATION_FEE_PER_10K


def calculate_mortgage_registration_fee() -> float:
    """
    Calculate QLD mortgage registration fee.

    Returns:
        Estimated mortgage registration fee
    """
    return QLD_MORTGAGE_REGISTRATION_FEE


def calculate_conveyancing_fee() -> float:
    """
    Estimate conveyancing/legal fees for a property purchase.

    Returns:
        Estimated conveyancing fee
    """
    return DEFAULT_CONVEYANCING_FEE  # Flat estimate for simplicity


def calculate_building_pest_inspection_fee() -> float:
    """
    Estimate building and pest inspection fees.

    Returns:
        Estimated building and pest inspection fee
    """
    return DEFAULT_BUILDING_PEST_INSPECTION_FEE  # Flat estimate for simplicity


def calculate_loan_establishment_fee() -> float:
    """
    Estimate loan establishment fees.

    Returns:
        Estimated loan establishment fee
    """
    return DEFAULT_LOAN_ESTABLISHMENT_FEE  # Flat estimate for simplicity


def calculate_lvr(purchase_price: float, deposit: float) -> float:
    """
    Calculate loan-to-value ratio (LVR) for a property purchase.

    Args:
        purchase_price: Property purchase price
        deposit: Deposit amount in dollars

    Returns:
        LVR as a decimal (e.g. 0.80 for 80%)
    """
    loan_amount = purchase_price - deposit
    return loan_amount / purchase_price if purchase_price > 0 else 0.0


# ─────────────────────────────────────────────────────────────────────────────────
# ----------------------ON-GOING PROPERTY COST CALCULATIONS------------------------
# ─────────────────────────────────────────────────────────────────────────────────


def calculate_property_value(year: int, purchase_price: float, growth_rate: float) -> float:
    """
    Calculate property value for a given year.

    Args:
        year: Projection year (0 = purchase year)
        purchase_price: Original purchase price
        growth_rate: Annual capital growth rate as decimal (e.g. 0.05 for 5%)

    Returns:
        Appreciated property value at the given year

    Raises:
        ValueError: If year < 0
    """
    if year < 0:
        raise ValueError("year must be >= 0")
    return purchase_price * ((1 + growth_rate) ** year)


def calculate_rental_income(year: int, weekly_rent: float, vacancy_weeks: int, growth_rate: float) -> float:
    """
    Calculate annual rental income for a given year, accounting for vacancy.

    Args:
        year: Projection year (0 = purchase year)
        weekly_rent: Weekly rental amount in dollars
        vacancy_weeks: Expected vacant weeks per year (0–52)
        growth_rate: Annual rental growth rate as decimal

    Returns:
        Annual rental income at the given year

    Raises:
        ValueError: If vacancy_weeks is not between 0 and 52
        ValueError: If year < 0
    """
    if vacancy_weeks < 0 or vacancy_weeks > 52:
        raise ValueError("vacancy_weeks must be between 0 and 52")
    if year < 0:
        raise ValueError("year must be >= 0")
    annual_rent = weekly_rent * (52 - vacancy_weeks)
    return annual_rent * ((1 + growth_rate) ** year)


def compound_annual_cost(year: int, base_rate: float, growth_rate: float) -> float:
    """
    Apply annual compounding growth to a base cost.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual cost in dollars
        growth_rate: Annual cost growth rate as decimal

    Returns:
        Compounded cost at the given year

    Raises:
        ValueError: If year < 0
    """
    if year < 0:
        raise ValueError("year must be >= 0")
    return base_rate * ((1 + growth_rate) ** year)


def calculate_council_rates(year: int, base_rate: float, growth_rate: float) -> float:
    """
    Calculate council rates for a given year.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual council rate in dollars
        growth_rate: Annual cost growth rate as decimal

    Returns:
        Council rates at the given year
    """
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_water_rates(year: int, base_rate: float, growth_rate: float) -> float:
    """
    Calculate water rates for a given year.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual water rate in dollars
        growth_rate: Annual cost growth rate as decimal

    Returns:
        Water rates at the given year
    """
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_building_insurance(year: int, base_rate: float, growth_rate: float) -> float:
    """
    Calculate building insurance cost for a given year.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual insurance premium in dollars
        growth_rate: Annual cost growth rate as decimal

    Returns:
        Building insurance cost at the given year
    """
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_strata_fees(year: int, base_rate: float, growth_rate: float) -> float:
    """
    Calculate strata fees for a given year.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual strata fee in dollars
        growth_rate: Annual cost growth rate as decimal

    Returns:
        Strata fees at the given year
    """
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_landlord_insurance(year: int, base_rate: float, growth_rate: float, is_investment: bool) -> float:
    """
    Calculate landlord insurance cost for a given year.

    Args:
        year: Projection year (0 = purchase year)
        base_rate: Base annual landlord insurance premium in dollars
        growth_rate: Annual cost growth rate as decimal
        is_investment: Whether the property is an investment (returns 0 for PPOR)

    Returns:
        Landlord insurance cost at the given year, or 0.0 for PPOR
    """
    return compound_annual_cost(year, base_rate, growth_rate) if is_investment else 0.0


def calculate_maintenance_cost(year: int, purchase_price: float, maintenance_rate: float, growth_rate: float) -> float:
    """
    Calculate maintenance cost for a given year based on appreciated property value.

    Args:
        year: Projection year (0 = purchase year)
        purchase_price: Original purchase price
        maintenance_rate: Annual maintenance as a fraction of property value (e.g. 0.01 for 1%)
        growth_rate: Annual capital growth rate as decimal

    Returns:
        Maintenance cost at the given year
    """
    property_value = calculate_property_value(year, purchase_price, growth_rate)
    return property_value * maintenance_rate


def calculate_management_fee(
    year: int, weekly_rent: float, vacancy_weeks: int, management_rate: float, growth_rate: float, is_investment: bool
) -> float:
    """
    Calculate property management fee for a given year.

    Args:
        year: Projection year (0 = purchase year)
        weekly_rent: Weekly rental amount in dollars
        vacancy_weeks: Expected vacant weeks per year (0–52)
        management_rate: Management fee as a fraction of rental income (e.g. 0.08 for 8%)
        growth_rate: Annual rental growth rate as decimal
        is_investment: Whether the property is an investment (returns 0 for PPOR)

    Returns:
        Property management fee at the given year, or 0.0 for PPOR
    """
    if not is_investment:
        return 0.0
    rental_income = calculate_rental_income(year, weekly_rent, vacancy_weeks, growth_rate)
    return rental_income * management_rate
