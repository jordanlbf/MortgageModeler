"""
API request/response schemas for the single property cashflow endpoint.

Supports four mode × property_use combinations:
- new × ppor, new × investment, existing × ppor, existing × investment.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.models.loan import RepaymentFrequency
from app.schemas.amortisation import RateChangeRequest
from app.schemas.cashflow import (
    CashFlowSummaryResponse,
    CashFlowYearResponse,
    CGTResponse,
    DepreciableAssetRequest,
    DepreciableBuildingRequest,
    LoanRequest,
    OngoingCostsRequest,
    PropertyRequest,
    PurchaseCostsRequest,
    RentalConfigRequest,
    TaxProfileRequest,
    UpfrontCostsResponse,
)

# ── Existing property request models ─────────


class ExistingPropertyRequest(BaseModel):
    """
    Existing property details — combines historical purchase data (for CGT)
    with current state (for projections).

    Attributes:
        purchase_date: Original date of property purchase
        purchase_price: Original purchase price (CGT cost base)
        purchase_costs: Original acquisition costs (CGT cost base)
        is_new_property: Whether the owner was the first occupant/investor
        current_value: Current market value (appreciation/maintenance base)
        annual_appreciation: Annual property value growth rate as decimal
        depreciable_buildings: Div 43 buildings/constructions
        depreciable_assets: Div 40 plant/equipment (with current written_down_value)
        original_borrowing_costs_total: Total borrowing costs from original loan setup
        borrowing_costs_years_elapsed: Years of borrowing cost deductions already claimed
    """

    purchase_date: date = Field(description="Original date of property purchase")
    purchase_price: float = Field(ge=0, description="Original purchase price (CGT cost base)")
    purchase_costs: PurchaseCostsRequest = Field(default_factory=PurchaseCostsRequest)
    is_new_property: bool = Field(default=False, description="Whether the owner was the first occupant")
    current_value: float = Field(ge=0, description="Current market value")
    annual_appreciation: float = Field(
        default=0.0, ge=0, le=1, description="Annual property value growth rate as decimal"
    )
    depreciable_buildings: list[DepreciableBuildingRequest] = Field(
        default_factory=list, description="Div 43 buildings/constructions"
    )
    depreciable_assets: list[DepreciableAssetRequest] = Field(
        default_factory=list, description="Div 40 plant/equipment (include current written_down_value)"
    )
    original_borrowing_costs_total: float = Field(
        default=0.0, ge=0, description="Total borrowing costs from original loan setup"
    )
    borrowing_costs_years_elapsed: int = Field(
        default=0, ge=0, le=60, description="Years of borrowing cost deductions already claimed"
    )


class ExistingLoanRequest(BaseModel):
    """
    Existing loan details — current mid-loan state.

    No deposit, borrowing costs, or capitalise flags — those are
    purchase-time concepts not relevant to existing loan projections.

    Attributes:
        current_balance: Outstanding loan principal
        remaining_term_years: Years remaining on the loan
        annual_rate: Current annual interest rate as decimal
        frequency: Repayment frequency
        offset_balance: Current offset account balance
        offset_contribution: Per-period offset addition
        extra_repayment: Per-period additional repayment
        rate_changes: Scheduled future interest rate changes
    """

    current_balance: float = Field(ge=0, description="Outstanding loan principal")
    remaining_term_years: int = Field(ge=1, description="Years remaining on the loan")
    annual_rate: float = Field(ge=0, le=1, description="Annual interest rate as decimal")
    frequency: RepaymentFrequency = Field(default=RepaymentFrequency.MONTHLY)
    offset_balance: float = Field(default=0.0, ge=0, description="Current offset account balance")
    offset_contribution: float = Field(default=0.0, ge=0, description="Per-period offset contribution")
    extra_repayment: float = Field(default=0.0, ge=0, description="Per-period additional repayment")
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)


# ── Main request ─────────────────────────────


class CashFlowSingleRequest(BaseModel):
    """
    Request for a single property cashflow projection.

    Mode determines which property/loan fields are required:
    - "new": property + loan (standard purchase flow)
    - "existing": existing_property + existing_loan (mid-loan state)

    Property use determines tax treatment:
    - "ppor": no rental, no deductions, no CGT
    - "investment": rental required, includes deductions and CGT

    Attributes:
        mode: "new" or "existing"
        property_use: "ppor" or "investment"
        projection_years: Number of years to project
        tax_profile: Taxpayer income configuration
        ongoing_costs: Ongoing property cost configuration
        rental: Rental income configuration (required for investment)
        property: Property details (required for new mode)
        loan: Loan configuration (required for new mode)
        existing_property: Existing property details (required for existing mode)
        existing_loan: Existing loan details (required for existing mode)
    """

    mode: Literal["new", "existing"] = Field(description="Purchase mode")
    property_use: Literal["ppor", "investment"] = Field(description="Property use type")
    projection_years: int = Field(default=30, ge=1, le=50, description="Number of years to project")
    tax_profile: TaxProfileRequest = Field(default_factory=TaxProfileRequest)
    ongoing_costs: OngoingCostsRequest = Field(default_factory=OngoingCostsRequest)
    rental: RentalConfigRequest | None = Field(default=None, description="Rental config (required for investment)")

    # New purchase mode
    property: PropertyRequest | None = Field(default=None, description="Property details (new mode)")
    loan: LoanRequest | None = Field(default=None, description="Loan config (new mode)")

    # Existing property mode
    existing_property: ExistingPropertyRequest | None = Field(
        default=None, description="Existing property details (existing mode)"
    )
    existing_loan: ExistingLoanRequest | None = Field(
        default=None, description="Existing loan details (existing mode)"
    )

    @model_validator(mode="after")
    def validate_mode_fields(self):
        """Enforce that the correct fields are present for the chosen mode."""
        if self.mode == "new":
            if self.property is None:
                raise ValueError("property is required for new purchase mode")
            if self.loan is None:
                raise ValueError("loan is required for new purchase mode")
        elif self.mode == "existing":
            if self.existing_property is None:
                raise ValueError("existing_property is required for existing property mode")
            if self.existing_loan is None:
                raise ValueError("existing_loan is required for existing property mode")

        if self.property_use == "investment" and self.rental is None:
            raise ValueError("rental is required for investment property use")

        return self


# ── Response ─────────────────────────────────


class CashFlowSingleResponse(BaseModel):
    """
    Single property cashflow projection response.

    Nullable fields distinguish between modes:
    - upfront_costs: populated for new purchases, None for existing
    - cgt: populated for investment, None for PPOR

    Attributes:
        mode: Echoed from request
        property_use: Echoed from request
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs (None for existing)
        years: Year-by-year cash flow breakdown
        cgt: Capital gains tax result (None for PPOR)
        summary: Summary stats across the full projection
    """

    mode: str
    property_use: str
    projection_years: int
    upfront_costs: UpfrontCostsResponse | None = None
    years: list[CashFlowYearResponse]
    cgt: CGTResponse | None = None
    summary: CashFlowSummaryResponse
