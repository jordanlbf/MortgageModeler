"""
Property calculation engine.

Handles:
- Property value appreciation over time
- Rental income projections with annual growth
- Investment property running costs
- Stamp duty estimation (QLD)
"""
import math

from app.config.property import QLD_STAMP_DUTY_CONCESSION_BRACKETS, \
    QLD_STAMP_DUTY_BASE_BRACKETS, LMI_ESTIMATE, QLD_REGISTRATION_FEE_THRESHOLD, QLD_REGISTRATION_FEE_BASE, \
    QLD_REGISTRATION_FEE_PER_10K, QLD_MORTGAGE_REGISTRATION_FEE, DEFAULT_CONVEYANCING_FEE, \
    DEFAULT_BUILDING_PEST_INSPECTION_FEE, DEFAULT_LOAN_ESTABLISHMENT_FEE


def calculate_qld_stamp_duty_with_bracket(purchase_price: float,
                                          bracket: list[tuple[float, float, float]]) -> float:
    """
    Calculate QLD stamp duty amount from the given bracket.

    Args:
        purchase_price: Property purchase price
        bracket: Which stamp duty bracket to use (concession or standard)

    Returns:
        Estimated stamp duty base amount (before concessions)
    """
    # QLD Stamp Duty rates apply to units of $100 or part thereof,
    # so we round up to the next $100
    purchase_price = math.ceil(purchase_price / 100) * 100

    prev_threshold = 0
    for (threshold, rate, base) in bracket:
        if purchase_price <= threshold:
            return base + (purchase_price - prev_threshold) * (rate / 100)
        prev_threshold = threshold


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
    for (threshold, rate) in LMI_ESTIMATE:
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
        return (QLD_REGISTRATION_FEE_BASE + math.ceil(excess / 10_000) *
                QLD_REGISTRATION_FEE_PER_10K)


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
    """Calculate loan-to-value ratio (LVR) for a property purchase."""
    loan_amount = purchase_price - deposit
    return loan_amount / purchase_price if purchase_price > 0 else 0.0


# ─────────────────────────────────────────────────────────────────────────────────
# ----------------------ON-GOING PROPERTY COST CALCULATIONS------------------------
# ─────────────────────────────────────────────────────────────────────────────────

def calculate_property_value(year: int, purchase_price: float, growth_rate: float) -> float:
    """Calculate property value for a given year."""
    return purchase_price * ((1 + growth_rate) ** (year - 1))


def calculate_rental_income(year: int, weekly_rent: float, vacancy_weeks: int,
                            growth_rate: float) -> float:
    """Calculate annual rental income for a given year, accounting for vacancy."""
    annual_rent = weekly_rent * (52 - vacancy_weeks)
    return annual_rent * ((1 + growth_rate) ** (year - 1))


def compound_annual_cost(year: int, base_rate: float, growth_rate: float) -> float:
    """Apply annual compounding growth to a base cost."""
    return base_rate * ((1 + growth_rate) ** (year - 1))


def calculate_council_rates(year: int, base_rate: float, growth_rate: float) -> float:
    """Calculate council rates for a given year."""
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_water_rates(year: int, base_rate: float, growth_rate: float) -> float:
    """Calculate water rates for a given year."""
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_building_insurance(year: int, base_rate: float, growth_rate: float) -> float:
    """Calculate building insurance cost for a given year."""
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_strata_fees(year: int, base_rate: float, growth_rate: float) -> float:
    """Calculate strata fees for a given year."""
    return compound_annual_cost(year, base_rate, growth_rate)


def calculate_landlord_insurance(year: int, base_rate: float,
                                 growth_rate: float, is_investment: bool) -> float:
    """Calculate landlord insurance cost for a given year. Returns 0 for PPOR."""
    return compound_annual_cost(year, base_rate, growth_rate) if is_investment else 0.0


def calculate_maintenance_cost(year: int, purchase_price: float, maintenance_rate: float,
                               growth_rate: float) -> float:
    """Calculate maintenance cost for a given year based on appreciated property value."""
    property_value = calculate_property_value(year, purchase_price, growth_rate)
    return property_value * maintenance_rate


def calculate_management_fee(year: int, weekly_rent: float, vacancy_weeks: int,
                             management_rate: float, growth_rate: float,
                             is_investment: bool) -> float:
    """Calculate property management fee for a given year. Returns 0 for PPOR."""
    if not is_investment:
        return 0.0
    rental_income = calculate_rental_income(year, weekly_rent, vacancy_weeks, growth_rate)
    return rental_income * management_rate
