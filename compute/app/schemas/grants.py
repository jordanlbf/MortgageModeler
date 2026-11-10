"""
API request/response schemas for the grants eligibility endpoints.

Separate from config types — these define the API contract.
"""

from pydantic import BaseModel, Field

# ── Request ───────────────────────────────────


class GrantsEligibilityRequest(BaseModel):
    """User inputs for evaluating grant scheme eligibility."""

    states: list[str] = Field(
        description="Region codes to include: 'Federal', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'"
    )
    region: str | None = Field(default=None, description="Region/city (e.g. 'Sydney', 'Regional QLD')")
    price: float = Field(default=0, ge=0, description="Purchase price")
    income: float = Field(default=0, ge=0, description="Primary applicant annual income")
    partner_income: float = Field(default=0, ge=0, description="Partner annual income (couples only)")
    property_type: str | None = Field(default=None, description="'new', 'existing', 'land', or null")
    buyer_type: str | None = Field(default=None, description="'individual', 'couple', or null")
    first_home_buyer: bool | None = Field(default=None, description="true, false, or null")
    owner_occupier: bool | None = Field(default=None, description="true, false, or null")
    single_parent: bool | None = Field(default=None, description="true, false, or null")
    owned_property_in_last_2_years: bool | None = Field(
        default=None, description="true, false, or null (ACT HBCS requirement)"
    )
    off_the_plan: bool | None = Field(default=None, description="true, false, or null")


# ── Response ──────────────────────────────────


class SchemeMetaResponse(BaseModel):
    deposit: str
    lmi: str
    buyer: str


class SchemeResponse(BaseModel):
    """A grant scheme with all display fields."""

    id: str
    name: str
    level: str
    state: str | None
    category: str
    benefit_pill: str
    meta: SchemeMetaResponse
    theme: str
    benefits: list[str]
    eligibility: list[str]
    summary: str
    details: str | None
    rules: list[str] | None
    valid_from: str | None
    valid_to: str | None


class BlockerResponse(BaseModel):
    """One failing rule, for a short label."""

    kind: str = Field(
        description="first_home, not_first_home, owner_occupier, single_parent, no_recent_property, "
        "price, income, property_type, individual or off_the_plan"
    )
    amount: float | None = Field(default=None, description="The cap, for price and income")
    options: list[str] | None = Field(default=None, description="Allowed property types, for property_type")


class EligibilityResult(BaseModel):
    eligible: bool
    reasons: list[str]
    blockers: list[BlockerResponse]


class SchemeValueResponse(BaseModel):
    """Rough worth of a scheme for this purchase."""

    amount: float | None = Field(
        description="Dollars: grant, duty saved, LMI avoided, super released. Null until a price is set; 0 if none"
    )
    share: float | None = Field(
        description="Government ownership share for co-ownership schemes (e.g. 0.4)"
    )


class SchemeWithEligibility(BaseModel):
    scheme: SchemeResponse
    result: EligibilityResult
    value: SchemeValueResponse


class GrantsEligibilityResponse(BaseModel):
    schemes: list[SchemeWithEligibility]


class GrantsSchemesResponse(BaseModel):
    schemes: list[SchemeResponse]
