"""
API request/response schemas for the upfront costs estimation endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field, model_validator

# ── Request ───────────────────────────────────


class UpfrontCostRequest(BaseModel):
    """
    Request parameters for estimating upfront property purchase costs.

    Cost fields default to None (auto-estimated by engine). Set to 0.0
    to explicitly waive. Set to a value to override the estimate.

    Attributes:
        purchase_price: Property purchase price
        deposit: Upfront deposit amount
        is_investment: Whether the property is an investment
        stamp_duty: Override stamp duty (None = auto-estimate)
        legal_fees: Override legal fees (None = auto-estimate)
        building_pest_inspection: Override inspection fees (None = auto-estimate)
        registration_fee: Override registration fee (None = auto-estimate)
        other_costs: Other acquisition costs (no auto-estimate)
        lmi: Override LMI (None = auto-estimate)
        mortgage_registration_fee: Override mortgage registration (None = auto-estimate)
        loan_establishment_fee: Override loan establishment (None = auto-estimate)
    """

    purchase_price: float = Field(default=0.0, ge=0, description="Property purchase price")
    deposit: float = Field(default=0.0, ge=0, description="Upfront deposit amount")
    is_investment: bool = Field(default=False, description="Whether the property is an investment")
    stamp_duty: float | None = Field(default=None, ge=0, description="Override stamp duty (None = auto-estimate)")
    legal_fees: float | None = Field(default=None, ge=0, description="Override legal fees (None = auto-estimate)")
    building_pest_inspection: float | None = Field(
        default=None, ge=0, description="Override inspection fees (None = auto-estimate)"
    )
    registration_fee: float | None = Field(
        default=None, ge=0, description="Override registration fee (None = auto-estimate)"
    )
    other_costs: float = Field(default=0.0, ge=0, description="Other acquisition costs")
    lmi: float | None = Field(default=None, ge=0, description="Override LMI (None = auto-estimate)")
    mortgage_registration_fee: float | None = Field(
        default=None, ge=0, description="Override mortgage registration (None = auto-estimate)"
    )
    loan_establishment_fee: float | None = Field(
        default=None, ge=0, description="Override loan establishment (None = auto-estimate)"
    )

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


class UpfrontCostResponse(BaseModel):
    """
    Fully resolved upfront costs — no None values.

    Attributes:
        purchase_costs: Itemised property acquisition costs (CGT cost base)
        borrowing_costs: Itemised loan-related costs (deductible over 5 years)
        total: Total cash out at settlement
        lvr: Loan-to-value ratio as decimal
    """

    class PurchaseCostsDetail(BaseModel):
        """
        Itemised property acquisition costs.

        Attributes:
            stamp_duty: QLD transfer duty amount
            legal_fees: Conveyancing/legal fees
            building_pest_inspection: Building and pest inspection fees
            registration_fee: QLD title registration fee
            other_costs: Any other acquisition costs
            total: Sum of all property acquisition costs
        """

        stamp_duty: float
        legal_fees: float
        building_pest_inspection: float
        registration_fee: float
        other_costs: float
        total: float

    class BorrowingCostsDetail(BaseModel):
        """
        Itemised loan-related costs.

        Attributes:
            lmi: Lenders Mortgage Insurance
            mortgage_registration_fee: Mortgage registration fee
            loan_establishment_fee: Loan establishment fee
            total: Sum of all borrowing costs
        """

        lmi: float
        mortgage_registration_fee: float
        loan_establishment_fee: float
        total: float

    purchase_costs: PurchaseCostsDetail
    borrowing_costs: BorrowingCostsDetail
    total: float
    lvr: float
