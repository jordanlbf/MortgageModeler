"""
Upfront costs estimation service.

Resolves upfront costs for a property purchase. Fields set to None on
PurchaseCosts or BorrowingCosts are auto-estimated using engine functions.
Explicit values (including 0.0) are preserved as-is.
"""

from app.engine.property import (
    calculate_building_pest_inspection_fee,
    calculate_conveyancing_fee,
    calculate_loan_establishment_fee,
    calculate_mortgage_registration_fee,
    calculate_registration_fee,
    estimate_lmi,
    estimate_qld_stamp_duty,
)
from app.models.loan import BorrowingCosts
from app.models.mortgage import Mortgage
from app.models.property import PurchaseCosts, UpfrontCosts


def resolve_borrowing_costs(
    loan_amount: float,
    lvr: float,
    is_investment: bool,
    borrowing_costs: BorrowingCosts,
) -> BorrowingCosts:
    """Resolve None borrowing cost fields to auto-estimated values.

    For each field:
    - None -> auto-estimated from engine functions
    - 0.0 -> explicitly zero (e.g. LMI waived)
    - Any value -> user override, preserved as-is

    Args:
        loan_amount: Loan principal for LMI estimation.
        lvr: Loan-to-value ratio for LMI estimation.
        is_investment: Whether the property is an investment (affects LMI).
        borrowing_costs: Unresolved borrowing costs (may contain None fields).

    Returns:
        Fully resolved BorrowingCosts with no None values.
    """
    return BorrowingCosts(
        lmi=borrowing_costs.lmi if borrowing_costs.lmi is not None else estimate_lmi(loan_amount, lvr, is_investment),
        mortgage_registration_fee=borrowing_costs.mortgage_registration_fee
        if borrowing_costs.mortgage_registration_fee is not None
        else calculate_mortgage_registration_fee(),
        loan_establishment_fee=borrowing_costs.loan_establishment_fee
        if borrowing_costs.loan_establishment_fee is not None
        else calculate_loan_establishment_fee(),
        capitalise_lmi=borrowing_costs.capitalise_lmi,
        capitalise_mortgage_registration_fee=borrowing_costs.capitalise_mortgage_registration_fee,
        capitalise_loan_establishment_fee=borrowing_costs.capitalise_loan_establishment_fee,
    )


def build_upfront_cost_estimate(mortgage: Mortgage) -> UpfrontCosts:
    """
    Resolve and estimate all upfront costs for a property purchase.

    For each cost field:
    - None → auto-estimated from engine functions
    - 0.0 → explicitly zero (e.g. LMI waived)
    - Any value → user override, preserved as-is

    Args:
        mortgage: Mortgage aggregate with property and loan details

    Returns:
        Fully resolved UpfrontCosts with no None values
    """
    loan_amount = max(mortgage.property.purchase_price - mortgage.loan.config.deposit, 0.0)
    lvr = loan_amount / mortgage.property.purchase_price if mortgage.property.purchase_price > 0 else 0.0
    is_investment = not mortgage.property.is_ppor

    # Resolve purchase costs — None means auto-estimate
    src_pc = mortgage.property.purchase_costs
    purchase_costs = PurchaseCosts(
        stamp_duty=src_pc.stamp_duty
        if src_pc.stamp_duty is not None
        else estimate_qld_stamp_duty(mortgage.property.purchase_price, is_investment),
        legal_fees=src_pc.legal_fees if src_pc.legal_fees is not None else calculate_conveyancing_fee(),
        building_pest_inspection=src_pc.building_pest_inspection
        if src_pc.building_pest_inspection is not None
        else calculate_building_pest_inspection_fee(),
        registration_fee=src_pc.registration_fee
        if src_pc.registration_fee is not None
        else calculate_registration_fee(mortgage.property.purchase_price),
        other_costs=src_pc.other_costs,
    )

    # Resolve borrowing costs — None means auto-estimate
    borrowing_costs = resolve_borrowing_costs(loan_amount, lvr, is_investment, mortgage.loan.config.borrowing_costs)

    return UpfrontCosts(
        purchase_costs=purchase_costs,
        borrowing_costs=borrowing_costs,
    )
