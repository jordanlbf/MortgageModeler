"""
API request/response schemas for the property purchase costs endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field, model_validator


# ── Request ───────────────────────────────────

class PropertyCostRequest(BaseModel):
    """
    Request parameters for estimating upfront property purchase costs.

    Attributes:
        purchase_price: Property purchase price
        deposit: Upfront deposit amount
        is_investment: Whether the property is an investment (standard stamp duty rates)
        lmi_exempt: Whether the loan is exempt from LMI
    """
    purchase_price: float = Field(default=0.0, ge=0, description="Property purchase price")
    deposit: float = Field(default=0.0, ge=0, description="Upfront deposit amount")
    is_investment: bool = Field(default=False, description="Whether the property is an investment property")
    lmi_exempt: bool = Field(default=False, description="Whether the loan is exempt from LMI (Lenders Mortgage Insurance)")

    @model_validator(mode="after")
    def deposit_not_exceeding_price(self):
        """Validate that deposit does not exceed purchase price."""
        if self.deposit > self.purchase_price:
            raise ValueError("Deposit cannot exceed purchase price")
        return self

    @property
    def loan_amount(self) -> float:
        """
        Calculate loan amount from purchase price and deposit.

        Returns:
            Loan principal (purchase_price - deposit)
        """
        return self.purchase_price - self.deposit

    @property
    def lvr(self) -> float:
        """
        Calculate loan-to-value ratio.

        Returns:
            LVR as decimal (e.g. 0.80), or 0 if purchase price is zero
        """
        if self.purchase_price <= 0:
            return 0.0
        return self.loan_amount / self.purchase_price


# ── Response ──────────────────────────────────

class PropertyCostResponse(BaseModel):
    """
    Itemised breakdown of upfront property purchase costs.

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
