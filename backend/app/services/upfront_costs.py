"""
Upfront costs estimation service.

Resolves upfront costs for a property purchase. Fields set to None on
PurchaseCosts or BorrowingCosts are auto-estimated using engine functions.
Explicit values (including 0.0) are preserved as-is.
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
from app.models.mortgage import Mortgage
from app.models.property import PurchaseCosts, UpfrontCosts


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
    loan_amount = max(mortgage.property.purchase_price - mortgage.loan.deposit, 0.0)
    lvr = loan_amount / mortgage.property.purchase_price if mortgage.property.purchase_price > 0 else 0.0
    is_investment = not mortgage.property.is_ppor

    # Resolve purchase costs — None means auto-estimate
    src_pc = mortgage.property.purchase_costs
    purchase_costs = PurchaseCosts(
        stamp_duty=src_pc.stamp_duty if src_pc.stamp_duty is not None else estimate_qld_stamp_duty(mortgage.property.purchase_price, is_investment),
        legal_fees=src_pc.legal_fees if src_pc.legal_fees is not None else calculate_conveyancing_fee(),
        building_pest_inspection=src_pc.building_pest_inspection if src_pc.building_pest_inspection is not None else calculate_building_pest_inspection_fee(),
        registration_fee=src_pc.registration_fee if src_pc.registration_fee is not None else calculate_registration_fee(mortgage.property.purchase_price),
        other_costs=src_pc.other_costs,
    )

    # Resolve borrowing costs — None means auto-estimate
    src_bc = mortgage.loan.borrowing_costs
    borrowing_costs = BorrowingCosts(
        lmi=src_bc.lmi if src_bc.lmi is not None else estimate_lmi(loan_amount, lvr, is_investment),
        mortgage_registration_fee=src_bc.mortgage_registration_fee if src_bc.mortgage_registration_fee is not None else calculate_mortgage_registration_fee(),
        loan_establishment_fee=src_bc.loan_establishment_fee if src_bc.loan_establishment_fee is not None else calculate_loan_establishment_fee(),
    )

    return UpfrontCosts(
        purchase_costs=purchase_costs,
        borrowing_costs=borrowing_costs,
    )
