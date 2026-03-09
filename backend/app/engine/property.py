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


def calculate_total_upfront_costs(purchase_price: float, deposit: float,
                                  is_investment: bool, lmi_exempt: bool = False) -> float:
    """
    Calculate total upfront costs for a property purchase.

    This includes:
    - Stamp duty
    - Title registration fee
    - Mortgage registration fee
    - Conveyancing fees
    - Building and pest inspection fees
    - Loan establishment fees
    - LMI (if applicable)

    Args:
        purchase_price: Property purchase price
        deposit: Dollar amount of the deposit
        is_investment: Whether the property is an investment
        lmi_exempt: Whether the buyer is exempt from LMI

    Returns:
        Total estimated upfront costs
    """
    loan_amount = purchase_price - deposit
    lvr = loan_amount / purchase_price if purchase_price > 0 else 0.0

    lmi = 0.0 if lmi_exempt else estimate_lmi(loan_amount, lvr, is_investment)

    return (estimate_qld_stamp_duty(purchase_price, is_investment) +
            calculate_registration_fee(purchase_price) +
            calculate_mortgage_registration_fee() +
            calculate_conveyancing_fee() +
            calculate_building_pest_inspection_fee() +
            calculate_loan_establishment_fee() +
            lmi)


def calculate_lvr(purchase_price: float, deposit: float) -> float:
    """Calculate loan-to-value ratio (LVR) for a property purchase."""
    loan_amount = purchase_price - deposit
    return loan_amount / purchase_price if purchase_price > 0 else 0.0
