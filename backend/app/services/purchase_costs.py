"""
Purchase costs estimation service.

Orchestrates engine calculations to estimate upfront costs for a
QLD property purchase, including stamp duty, LMI, registration fees,
and other settlement costs.
"""

from dataclasses import dataclass

from app.engine.property import (
    estimate_qld_stamp_duty,
    estimate_lmi,
    calculate_registration_fee,
    calculate_mortgage_registration_fee,
    calculate_conveyancing_fee,
    calculate_building_pest_inspection_fee,
    calculate_loan_establishment_fee,
)


@dataclass
class PurchaseCostEstimate:
    """
    Itemised estimate of upfront property purchase costs.

    Attributes:
        stamp_duty: QLD transfer duty amount
        lmi: Lenders Mortgage Insurance estimate (0 if exempt or LVR <= 80%)
        registration_fee: QLD title registration fee
        mortgage_registration_fee: QLD mortgage registration fee
        conveyancing_fee: Estimated conveyancing/legal fees
        building_pest_inspection_fee: Estimated building and pest inspection fees
        loan_establishment_fee: Estimated loan establishment fees
        total_upfront_cost: Sum of all upfront cost components
        lvr: Loan-to-value ratio as decimal
    """
    stamp_duty: float
    lmi: float
    registration_fee: float
    mortgage_registration_fee: float
    conveyancing_fee: float
    building_pest_inspection_fee: float
    loan_establishment_fee: float
    total_upfront_cost: float
    lvr: float


def build_purchase_cost_estimate(
    purchase_price: float,
    deposit: float,
    is_investment: bool,
    lmi_exempt: bool,
) -> PurchaseCostEstimate:
    """
    Estimate upfront costs for a QLD property purchase.

    Calls individual engine functions to calculate each cost component
    and assembles the result.

    Args:
        purchase_price: Property purchase price
        deposit: Upfront deposit amount
        is_investment: Whether the property is an investment (standard stamp duty rates)
        lmi_exempt: Whether the loan is exempt from LMI

    Returns:
        PurchaseCostEstimate with itemised breakdown and total
    """
    loan_amount = purchase_price - deposit
    lvr = loan_amount / purchase_price if purchase_price > 0 else 0.0

    stamp_duty = estimate_qld_stamp_duty(purchase_price, is_investment)
    lmi = 0.0 if lmi_exempt else estimate_lmi(loan_amount, lvr, is_investment)
    registration_fee = calculate_registration_fee(purchase_price)
    mortgage_registration_fee = calculate_mortgage_registration_fee()
    conveyancing_fee = calculate_conveyancing_fee()
    building_pest_inspection_fee = calculate_building_pest_inspection_fee()
    loan_establishment_fee = calculate_loan_establishment_fee()

    total_upfront_cost = (
        stamp_duty + lmi + registration_fee + mortgage_registration_fee +
        conveyancing_fee + building_pest_inspection_fee + loan_establishment_fee
    )

    return PurchaseCostEstimate(
        stamp_duty=stamp_duty,
        lmi=lmi,
        registration_fee=registration_fee,
        mortgage_registration_fee=mortgage_registration_fee,
        conveyancing_fee=conveyancing_fee,
        building_pest_inspection_fee=building_pest_inspection_fee,
        loan_establishment_fee=loan_establishment_fee,
        total_upfront_cost=total_upfront_cost,
        lvr=lvr,
    )
