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
    QLD_STAMP_DUTY_BASE_BRACKETS, LMI_ESTIMATE
from app.models import Property


def calculate_property_value(purchase_price: float, annual_growth_rate: float, year: int) -> float:
    """Calculate property value after N years of compound growth."""
    pass


def calculate_annual_rental_income(
        weekly_rent: float,
        annual_growth_rate: float,
        year: int,
        vacancy_weeks: int = 2,
) -> float:
    """
    Calculate annual rental income for a given year.

    Args:
        weekly_rent: Initial weekly rent at purchase
        annual_growth_rate: Annual rent increase rate
        year: Which year (0-based: year 0 = first year)
        vacancy_weeks: Assumed vacancy per year (default 2 weeks)

    Returns:
        Annual rental income after vacancy allowance
    """
    pass


def calculate_annual_investment_costs(prop: Property, year: int) -> dict:
    """
    Calculate annual holding costs for an investment property.

    Costs are assumed to grow at 2.5% p.a. (general inflation).
    Management fees are calculated as a percentage of rental income.

    Returns a dict with keys: management_fees, insurance, maintenance,
    council_rates, water_rates, strata, total
    """
    pass


def calculate_total_deductible_expenses(
        annual_interest: float,
        prop: Property,
        year: int,
) -> float:
    """
    Calculate total deductible expenses for an investment property.

    Deductible items:
    - Loan interest (not principal)
    - Property management fees
    - Insurance
    - Maintenance and repairs
    - Council rates
    - Water rates
    - Strata/body corporate

    Note: Depreciation is excluded from V1 for simplicity.
    """
    pass


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


def estimate_qld_stamp_duty(purchase_price: float, is_first_home: bool = False) -> float:
    """
    Estimate QLD stamp duty (transfer duty).

    Args:
        purchase_price: Property purchase price
        is_first_home: Whether first home buyer concessions apply

    Returns:
        Estimated stamp duty amount
    """
    if is_first_home:
        return calculate_qld_stamp_duty_with_bracket(purchase_price, QLD_STAMP_DUTY_CONCESSION_BRACKETS)
    else:
        return calculate_qld_stamp_duty_with_bracket(purchase_price, QLD_STAMP_DUTY_BASE_BRACKETS)


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
