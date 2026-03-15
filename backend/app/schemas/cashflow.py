"""
API request/response schemas for the cash flow projection endpoints.

Defines contracts for both PPOR and rentvesting scenarios.
Separate from domain models — these define the API contract.
"""
from datetime import date

from pydantic import BaseModel, Field

from app.models.deductions import DepreciationMethod
from app.models.loan import RepaymentFrequency
from app.schemas.amortisation import RateChangeRequest


# ── Nested request models ─────────────────────

class TaxProfileRequest(BaseModel):
    """
    Taxpayer income configuration — maps to TaxProfile domain model.

    Attributes:
        taxable_income: Assessable income minus allowable deductions
        repayment_income: Income used for HECS repayment calculation
        mls_income: Income used for Medicare Levy Surcharge calculation
        hecs_balance: Outstanding HECS/HELP debt
        has_private_health: Whether the taxpayer holds private health insurance
    """
    taxable_income: float = Field(default=0.0, ge=0, description="Annual taxable income")
    repayment_income: float = Field(default=0.0, ge=0, description="Annual income used for HECS repayment calculations")
    mls_income: float = Field(default=0.0, ge=0, description="Annual income used for MLS calculations")
    hecs_balance: float = Field(default=0.0, ge=0, description="Current HECS debt balance")
    has_private_health: bool = Field(default=False, description="Whether the individual has private health insurance")


class PurchaseCostsRequest(BaseModel):
    """
    Upfront acquisition costs — maps to PurchaseCosts domain model.

    Attributes:
        stamp_duty: State transfer duty (cost base)
        legal_fees: Conveyancing and legal fees (cost base)
        building_pest_inspection: Building and pest inspection fees (cost base)
        registration_fee: Title registration fee (cost base)
        mortgage_registration_fee: Mortgage registration fee (borrowing cost)
        loan_establishment_fee: Loan establishment fee (borrowing cost)
        other_costs: Any other acquisition costs (cost base)
    """
    stamp_duty: float = Field(default=0.0, ge=0, description="State transfer duty")
    legal_fees: float = Field(default=0.0, ge=0, description="Conveyancing and legal fees")
    building_pest_inspection: float = Field(default=0.0, ge=0, description="Building and pest inspection fees")
    registration_fee: float = Field(default=0.0, ge=0, description="Title registration fee")
    mortgage_registration_fee: float = Field(default=0.0, ge=0, description="Mortgage registration fee")
    loan_establishment_fee: float = Field(default=0.0, ge=0, description="Loan establishment fee")
    other_costs: float = Field(default=0.0, ge=0, description="Any other acquisition costs")


class DepreciableBuildingRequest(BaseModel):
    """
    A depreciable building/construction — maps to DepreciableBuilding domain model.

    Attributes:
        name: Description of the building or construction
        construction_cost: Original cost of constructing the building
        purchase_date: Date the building was purchased by the current owner
        construction_start_date: Date construction commenced
    """
    name: str = Field(description="Description of the building or construction")
    construction_cost: float = Field(ge=0, description="Original construction cost")
    purchase_date: date = Field(description="Date the building was purchased")
    construction_start_date: date = Field(description="Date construction commenced")


class DepreciableAssetRequest(BaseModel):
    """
    A depreciable plant/equipment asset — maps to DepreciableAsset domain model.

    Attributes:
        name: Description of the asset
        cost: Original cost of the asset
        effective_life_years: ATO effective life in years
        purchase_date: Date the asset was purchased/installed
        method: Depreciation method (diminishing_value or prime_cost)
        written_down_value: Remaining book value after prior deductions
    """
    name: str = Field(description="Description of the asset")
    cost: float = Field(ge=0, description="Original cost of the asset")
    effective_life_years: int = Field(ge=1, description="ATO effective life in years")
    purchase_date: date = Field(description="Date the asset was purchased/installed")
    method: DepreciationMethod = Field(default=DepreciationMethod.DIMINISHING_VALUE, description="Depreciation method")
    written_down_value: float = Field(default=0.0, ge=0, description="Remaining book value after prior deductions")


class PropertyRequest(BaseModel):
    """
    Property details — maps to Property domain model.

    Attributes:
        purchase_price: Property purchase price
        purchase_date: Date of property purchase
        is_new_property: Whether the owner is the first occupant/investor
        purchase_costs: Upfront acquisition costs
    """
    purchase_price: float = Field(ge=0, description="Property purchase price")
    purchase_date: date = Field(description="Date of property purchase")
    is_new_property: bool = Field(default=False, description="Whether the owner is the first occupant")
    purchase_costs: PurchaseCostsRequest = Field(default_factory=PurchaseCostsRequest)


class LoanRequest(BaseModel):
    """
    Mortgage loan configuration — maps to generate_schedule engine params.

    Attributes:
        deposit: Initial deposit amount
        annual_rate: Mortgage interest rate as decimal (required)
        loan_term_years: Loan term in years
        frequency: Repayment frequency
        offset_balance: Initial offset account balance
        offset_contribution: Per-period offset addition
        extra_repayment: Per-period additional repayment
        rate_changes: Scheduled interest rate changes
    """
    deposit: float = Field(default=0.0, ge=0, description="Initial deposit amount")
    annual_rate: float = Field(ge=0, le=1, description="Annual interest rate as decimal (e.g. 0.05 for 5%)")
    loan_term_years: int = Field(default=30, ge=1, description="Loan term in years")
    frequency: RepaymentFrequency = Field(default=RepaymentFrequency.MONTHLY)
    offset_balance: float = Field(default=0.0, ge=0, description="Initial offset account balance")
    offset_contribution: float = Field(default=0.0, ge=0, description="Per-period offset contribution")
    extra_repayment: float = Field(default=0.0, ge=0, description="Per-period additional repayment")
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)


class OngoingCostsRequest(BaseModel):
    """
    Ongoing property cost configuration — maps to build_ongoing_cost_projection params.

    Attributes:
        council_rates: Base annual council rates
        water_rates: Base annual water rates
        building_insurance: Base annual building insurance
        strata_fees: Base annual strata fees
        maintenance_rate: Annual maintenance as fraction of property value
        annual_cost_growth_rate: Annual growth rate for ongoing costs as decimal
    """
    council_rates: float = Field(default=0.0, ge=0, description="Base annual council rates")
    water_rates: float = Field(default=0.0, ge=0, description="Base annual water rates")
    building_insurance: float = Field(default=0.0, ge=0, description="Base annual building insurance")
    strata_fees: float = Field(default=0.0, ge=0, description="Base annual strata fees")
    maintenance_rate: float = Field(default=0.01, ge=0, le=1, description="Annual maintenance as fraction of property value")
    annual_cost_growth_rate: float = Field(default=0.03, ge=0, le=1, description="Annual growth rate for ongoing costs as decimal")


# ── Requests ───────────────────────────────────

class CashFlowPPORRequest(BaseModel):
    """
    Request parameters for a PPOR cash flow projection.

    Attributes:
        tax_profile: Taxpayer income configuration
        property: Property details including purchase costs
        loan: Mortgage loan configuration
        ongoing_costs: Ongoing property cost configuration
        annual_appreciation: Property growth rate as decimal
        projection_years: Number of years to project
    """
    tax_profile: TaxProfileRequest = Field(default_factory=TaxProfileRequest)
    property: PropertyRequest
    loan: LoanRequest
    ongoing_costs: OngoingCostsRequest = Field(default_factory=OngoingCostsRequest)
    annual_appreciation: float = Field(default=0.0, ge=0, le=1, description="Annual property appreciation rate as decimal")
    projection_years: int = Field(default=30, ge=1, le=50, description="Number of years to project")


class CashFlowRentvestRequest(CashFlowPPORRequest):
    """
    Request parameters for a rentvesting cash flow projection.

    Inherits all PPOR fields and adds depreciation, rental, management, and CGT configuration.

    Attributes:
        depreciable_buildings: Div 43 buildings/constructions for the investment property
        depreciable_assets: Div 40 plant/equipment for the investment property
        weekly_rent_paid: Weekly rent where the investor lives
        annual_rent_paid_growth: Annual rent paid growth rate as decimal
        weekly_rent_received: Weekly rent from investment property
        annual_rent_received_growth: Annual rental income growth rate as decimal
        vacancy_weeks: Expected vacant weeks per year (0–52)
        management_rate: Management fee as fraction of rental income
        landlord_insurance: Base annual landlord insurance
        include_cgt: Whether to calculate CGT at end of projection
    """
    depreciable_buildings: list[DepreciableBuildingRequest] = Field(default_factory=list, description="Div 43 buildings/constructions")
    depreciable_assets: list[DepreciableAssetRequest] = Field(default_factory=list, description="Div 40 plant/equipment")
    weekly_rent_paid: float = Field(ge=0, description="Weekly rent where the investor lives")
    annual_rent_paid_growth: float = Field(default=0.03, ge=0, le=1, description="Annual rent paid growth rate as decimal")
    weekly_rent_received: float = Field(ge=0, description="Weekly rent from investment property")
    annual_rent_received_growth: float = Field(default=0.03, ge=0, le=1, description="Annual rental income growth rate as decimal")
    vacancy_weeks: int = Field(default=2, ge=0, le=52, description="Expected vacant weeks per year")
    management_rate: float = Field(default=0.08, ge=0, le=1, description="Management fee as fraction of rental income")
    landlord_insurance: float = Field(default=0.0, ge=0, description="Base annual landlord insurance")
    include_cgt: bool = Field(default=True, description="Whether to calculate CGT at end of projection")
