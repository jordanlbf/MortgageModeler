"""
API request/response schemas for the purchase costs endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

# ── Request ───────────────────────────────────


class PurchaseCostsRequest(BaseModel):
    """User inputs for calculating property purchase costs.

    Attributes:
        state: State code (e.g. ``"QLD"``).
        price: Property purchase price.
        deposit_percent: Deposit as decimal (e.g. 0.10 for 10%).
        property_type: ``"new"``, ``"existing"``, ``"land"``, or null.
        buyer_type: ``"individual"``, ``"couple"``, or null.
        owner_occupier: Whether the property is a PPOR.
        first_home_buyer: Whether the buyer is a first home buyer.
        selected_grants: Scheme IDs to apply.
        income: Primary applicant annual income.
        partner_income: Partner annual income (couples only).
    """

    state: str = Field(description="State code: NSW, VIC, QLD, WA, SA, TAS, ACT, NT")
    price: float = Field(ge=0, description="Property purchase price")
    deposit_percent: float = Field(ge=0, le=1, description="Deposit as decimal (e.g. 0.10)")
    property_type: str | None = Field(default=None, description="'new', 'existing', 'land', or null")
    buyer_type: str | None = Field(default=None, description="'individual', 'couple', or null")
    owner_occupier: bool = Field(default=True, description="Principal place of residence")
    first_home_buyer: bool = Field(default=False, description="First home buyer")
    selected_grants: list[str] = Field(default_factory=list, description="Scheme IDs to apply")
    income: float = Field(default=0, ge=0, description="Primary applicant annual income")
    partner_income: float = Field(default=0, ge=0, description="Partner annual income")


# ── Response ──────────────────────────────────


class GrantAppliedResponse(BaseModel):
    """A grant applied to the purchase with its dollar impact."""

    scheme_id: str
    scheme_name: str
    category: str
    effect_type: str
    amount: float
    description: str


class PurchaseCostsResponse(BaseModel):
    """Itemised purchase cost breakdown.

    All dollar values are positive. Concessions and savings are shown
    separately — the total reflects the final amount payable.
    """

    # Stamp duty
    stamp_duty_base: float
    stamp_duty_concession: float
    stamp_duty_payable: float

    # LMI
    lmi_base: float
    lmi_waived: bool
    lmi_payable: float

    # Fees
    legal_fees: float
    registration_fee: float
    mortgage_registration_fee: float
    building_pest_inspection: float
    loan_establishment_fee: float
    total_fees: float

    # Grants
    grants_applied: list[GrantAppliedResponse]
    total_grant_savings: float

    # Equity and loan
    equity_contribution: float
    effective_loan_amount: float

    # Deposit and totals
    deposit_amount: float
    min_deposit_percent: float
    total_upfront_cost: float
    lvr: float
