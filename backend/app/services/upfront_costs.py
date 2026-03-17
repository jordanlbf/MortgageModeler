"""
Upfront costs estimation service.

Orchestrates engine calculations to estimate all upfront costs for a
QLD property purchase, split into property acquisition costs (CGT cost
base) and loan borrowing costs (deductible over 5 years).
"""

from app.engine.property import (
    estimate_qld_stamp_duty,
    estimate_lmi,
    calculate_registration_fee,
    calculate_mortgage_registration_fee,
    calculate_conveyancing_fee,
    calculate_building_pest_inspection_fee,
    calculate_loan_establishment_fee,
)
from app.models.loan import BorrowingCosts
from app.models.property import PurchaseCosts, UpfrontCosts


def build_upfront_cost_estimate(
    purchase_price: float,
    deposit: float,
    is_investment: bool,
    lmi_exempt: bool,
) -> UpfrontCosts:
    """
    Estimate all upfront costs for a QLD property purchase.

    Calls individual engine functions to calculate each cost component
    and assembles them into purchase costs and borrowing costs.

    Args:
        purchase_price: Property purchase price
        deposit: Upfront deposit amount
        is_investment: Whether the property is an investment (standard stamp duty rates)
        lmi_exempt: Whether the loan is exempt from LMI

    Returns:
        UpfrontCosts with itemised purchase costs and borrowing costs
    """
    loan_amount = purchase_price - deposit
    lvr = loan_amount / purchase_price if purchase_price > 0 else 0.0

    purchase_costs = PurchaseCosts(
        stamp_duty=estimate_qld_stamp_duty(purchase_price, is_investment),
        legal_fees=calculate_conveyancing_fee(),
        building_pest_inspection=calculate_building_pest_inspection_fee(),
        registration_fee=calculate_registration_fee(purchase_price),
    )

    borrowing_costs = BorrowingCosts(
        lmi=0.0 if lmi_exempt else estimate_lmi(loan_amount, lvr, is_investment),
        mortgage_registration_fee=calculate_mortgage_registration_fee(),
        loan_establishment_fee=calculate_loan_establishment_fee(),
    )

    return UpfrontCosts(
        purchase_costs=purchase_costs,
        borrowing_costs=borrowing_costs,
    )
