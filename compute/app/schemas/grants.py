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


class EligibilityResult(BaseModel):
    eligible: bool
    reasons: list[str]


class SchemeWithEligibility(BaseModel):
    scheme: SchemeResponse
    result: EligibilityResult


class GrantsEligibilityResponse(BaseModel):
    schemes: list[SchemeWithEligibility]


class GrantsSchemesResponse(BaseModel):
    schemes: list[SchemeResponse]
