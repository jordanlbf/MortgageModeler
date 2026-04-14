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
        income_growth_rate: Annual salary/wage growth rate as decimal
    """

    taxable_income: float = Field(default=0.0, ge=0, description="Annual taxable income")
    repayment_income: float = Field(default=0.0, ge=0, description="Annual income used for HECS repayment calculations")
    mls_income: float = Field(default=0.0, ge=0, description="Annual income used for MLS calculations")
    hecs_balance: float = Field(default=0.0, ge=0, description="Current HECS debt balance")
    has_private_health: bool = Field(default=False, description="Whether the individual has private health insurance")
    income_growth_rate: float = Field(default=0.03, ge=0, le=1, description="Annual salary/wage growth rate as decimal")


class PurchaseCostsRequest(BaseModel):
    """
    Property acquisition costs — maps to PurchaseCosts domain model.

    Fields default to None (auto-estimated by upfront costs service).
    Set to 0.0 to explicitly waive. Set to a value to override.

    Attributes:
        stamp_duty: Override stamp duty (None = auto-estimate)
        legal_fees: Override legal fees (None = auto-estimate)
        building_pest_inspection: Override inspection fees (None = auto-estimate)
        registration_fee: Override registration fee (None = auto-estimate)
        other_costs: Other acquisition costs (no auto-estimate)
    """

    stamp_duty: float | None = Field(default=None, ge=0, description="Override stamp duty (None = auto-estimate)")
    legal_fees: float | None = Field(default=None, ge=0, description="Override legal fees (None = auto-estimate)")
    building_pest_inspection: float | None = Field(
        default=None, ge=0, description="Override inspection fees (None = auto-estimate)"
    )
    registration_fee: float | None = Field(
        default=None, ge=0, description="Override registration fee (None = auto-estimate)"
    )
    other_costs: float = Field(default=0.0, ge=0, description="Other acquisition costs")


class BorrowingCostsRequest(BaseModel):
    """
    Loan-related upfront costs — maps to BorrowingCosts domain model.

    Fields default to None (auto-estimated by upfront costs service).
    Set to 0.0 to explicitly waive (e.g. LMI exempt). Set to a value to override.

    Attributes:
        lmi: Override LMI (None = auto-estimate)
        mortgage_registration_fee: Override mortgage registration (None = auto-estimate)
        loan_establishment_fee: Override loan establishment (None = auto-estimate)
    """

    lmi: float | None = Field(default=None, ge=0, description="Override LMI (None = auto-estimate)")
    mortgage_registration_fee: float | None = Field(
        default=None, ge=0, description="Override mortgage registration (None = auto-estimate)"
    )
    loan_establishment_fee: float | None = Field(
        default=None, ge=0, description="Override loan establishment (None = auto-estimate)"
    )
    capitalise_lmi: bool = Field(default=True, description="Add LMI to loan principal")
    capitalise_mortgage_registration_fee: bool = Field(
        default=True, description="Add mortgage registration to loan principal"
    )
    capitalise_loan_establishment_fee: bool = Field(
        default=True, description="Add loan establishment to loan principal"
    )


class RentalConfigRequest(BaseModel):
    """
    Investment property rental configuration — maps to RentalConfig domain model.

    Defaults to zeros for PPOR (no tenants).

    Attributes:
        weekly_rent: Weekly rental amount from investment property
        annual_growth_rate: Annual rental income growth rate as decimal
        vacancy_weeks: Expected vacant weeks per year (0–52)
    """

    weekly_rent: float = Field(default=0.0, ge=0, description="Weekly rental amount")
    annual_growth_rate: float = Field(
        default=0.03, ge=0, le=1, description="Annual rental income growth rate as decimal"
    )
    vacancy_weeks: int = Field(default=2, ge=0, le=52, description="Expected vacant weeks per year")


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

    Depreciation items default to empty lists for PPOR.

    Attributes:
        purchase_price: Property purchase price
        purchase_date: Date of property purchase
        is_new_property: Whether the owner is the first occupant/investor
        annual_appreciation: Annual property value growth rate as decimal
        purchase_costs: Upfront acquisition costs
        rental: Rental income configuration (defaults to zeros for PPOR)
        depreciable_buildings: Div 43 buildings/constructions (empty for PPOR)
        depreciable_assets: Div 40 plant/equipment (empty for PPOR)
    """

    purchase_price: float = Field(ge=0, description="Property purchase price")
    purchase_date: date = Field(description="Date of property purchase")
    is_new_property: bool = Field(default=False, description="Whether the owner is the first occupant")
    is_ppor: bool = Field(default=False, description="Whether the property is a primary place of residence")
    annual_appreciation: float = Field(
        default=0.0, ge=0, le=1, description="Annual property value growth rate as decimal"
    )
    purchase_costs: PurchaseCostsRequest = Field(default_factory=PurchaseCostsRequest)
    rental: RentalConfigRequest = Field(default_factory=RentalConfigRequest)
    depreciable_buildings: list[DepreciableBuildingRequest] = Field(
        default_factory=list, description="Div 43 buildings/constructions"
    )
    depreciable_assets: list[DepreciableAssetRequest] = Field(
        default_factory=list, description="Div 40 plant/equipment"
    )


class LoanRequest(BaseModel):
    """
    Mortgage loan configuration — maps to LoanConfig domain model.

    Attributes:
        deposit: Initial deposit amount
        annual_rate: Mortgage interest rate as decimal (required)
        loan_term_years: Loan term in years
        frequency: Repayment frequency
        offset_balance: Initial offset account balance
        offset_contribution: Per-period offset addition
        extra_repayment: Per-period additional repayment
        rate_changes: Scheduled interest rate changes
        borrowing_costs: Upfront loan-related costs (LMI, registration, establishment)
    """

    deposit: float = Field(default=0.0, ge=0, description="Initial deposit amount")
    annual_rate: float = Field(ge=0, le=1, description="Annual interest rate as decimal (e.g. 0.05 for 5%)")
    loan_term_years: int = Field(default=30, ge=1, description="Loan term in years")
    frequency: RepaymentFrequency = Field(default=RepaymentFrequency.MONTHLY)
    offset_balance: float = Field(default=0.0, ge=0, description="Initial offset account balance")
    offset_contribution: float = Field(default=0.0, ge=0, description="Per-period offset contribution")
    extra_repayment: float = Field(default=0.0, ge=0, description="Per-period additional repayment")
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)
    borrowing_costs: BorrowingCostsRequest = Field(default_factory=BorrowingCostsRequest)


class OngoingCostsRequest(BaseModel):
    """
    Ongoing property cost configuration — maps to OngoingCostsConfig domain model.

    Investment-only fields (landlord_insurance, management_rate) default to 0
    and are ignored for PPOR scenarios.

    Attributes:
        council_rates: Base annual council rates
        water_rates: Base annual water rates
        building_insurance: Base annual building insurance
        strata_fees: Base annual strata fees
        maintenance_rate: Annual maintenance as fraction of property value
        landlord_insurance: Base annual landlord insurance (0 for PPOR)
        management_rate: Management fee as fraction of rental income (0 for PPOR)
        annual_cost_growth_rate: Annual growth rate for ongoing costs as decimal
    """

    council_rates: float = Field(default=0.0, ge=0, description="Base annual council rates")
    water_rates: float = Field(default=0.0, ge=0, description="Base annual water rates")
    building_insurance: float = Field(default=0.0, ge=0, description="Base annual building insurance")
    strata_fees: float = Field(default=0.0, ge=0, description="Base annual strata fees")
    maintenance_rate: float = Field(
        default=0.01, ge=0, le=1, description="Annual maintenance as fraction of property value"
    )
    landlord_insurance: float = Field(default=0.0, ge=0, description="Base annual landlord insurance (0 for PPOR)")
    management_rate: float = Field(
        default=0.0, ge=0, le=1, description="Management fee as fraction of rental income (0 for PPOR)"
    )
    annual_cost_growth_rate: float = Field(
        default=0.03, ge=0, le=1, description="Annual growth rate for ongoing costs as decimal"
    )


# ── Requests ───────────────────────────────────


class CashFlowPPORRequest(BaseModel):
    """
    Request parameters for a PPOR cash flow projection.

    All growth rates and rental config live on their respective sub-models.

    Attributes:
        tax_profile: Taxpayer income configuration (with income_growth_rate)
        property: Property details (with annual_appreciation and rental config)
        loan: Mortgage loan configuration
        ongoing_costs: Ongoing property cost configuration
        projection_years: Number of years to project
    """

    tax_profile: TaxProfileRequest = Field(default_factory=TaxProfileRequest)
    property: PropertyRequest
    loan: LoanRequest
    ongoing_costs: OngoingCostsRequest = Field(default_factory=OngoingCostsRequest)
    projection_years: int = Field(default=30, ge=1, le=50, description="Number of years to project")


class CashFlowRentvestRequest(CashFlowPPORRequest):
    """
    Request parameters for a rentvesting cash flow projection.

    Inherits all PPOR fields and adds tenant rental config.
    Depreciation items are configured via property sub-model.
    Investment property rental income is configured via property.rental.
    Investment-specific ongoing costs (landlord_insurance, management_rate) are
    set via the inherited ongoing_costs sub-model.

    Attributes:
        weekly_rent_paid: Weekly rent where the investor lives
        annual_rent_paid_growth: Annual rent paid growth rate as decimal
    """

    weekly_rent_paid: float = Field(ge=0, description="Weekly rent where the investor lives")
    annual_rent_paid_growth: float = Field(
        default=0.03, ge=0, le=1, description="Annual rent paid growth rate as decimal"
    )


# ── Responses ──────────────────────────────────


class OngoingCostsDetailResponse(BaseModel):
    """Itemised ongoing property costs for a single year."""

    council_rates: float
    water_rates: float
    building_insurance: float
    landlord_insurance: float
    strata_fees: float
    maintenance_cost: float
    management_fee: float


class TaxDeductionDetailResponse(BaseModel):
    """Tax deduction breakdown for a single year (investment properties only)."""

    mortgage_interest: float
    depreciation_building: float
    depreciation_plant: float
    deductible_expenses: float
    total_deductions: float
    net_rental_income: float
    is_negatively_geared: bool
    tax_saving: float
    borrowing_costs_deduction: float = 0.0


class CashFlowYearResponse(BaseModel):
    """
    A single year's cash flow breakdown — shared by both scenarios.

    Attributes:
        year: Projection year (0 = purchase year)
        net_income: Salary minus total tax
        total_inflows: Sum of all income sources for the year
        mortgage_repayment: Total mortgage payments for the year
        mortgage_interest: Interest portion of mortgage payments
        mortgage_principal: Principal portion of mortgage payments
        property_costs: Ongoing property costs for the year
        offset_contributions: Cash added to offset account this year
        rent_paid: Annual rent where the investor lives (rentvesting only, 0 for PPOR)
        rental_income: Annual rental income received (rentvesting only, 0 for PPOR)
        tax_saving: Tax benefit from deductions (rentvesting only, 0 for PPOR)
        salary: Gross taxable income (grown by income_growth_rate) for this year
        income_tax: Total tax payable for this year (income tax + Medicare levy)
        ongoing_costs_detail: Itemised ongoing property costs breakdown
        tax_deduction_detail: Tax deduction breakdown (investment only)
        total_outflows: Sum of all expenses for the year
        net_position: total_inflows - total_outflows
        cumulative_position: Running total of net_position (year 0 offset by upfront costs)
        property_value: Appreciated property value at end of year
        loan_balance: Remaining mortgage balance at end of year
        equity: Property value minus loan balance
        offset_balance: Offset account balance at end of year
    """

    year: int
    net_income: float
    total_inflows: float
    mortgage_repayment: float
    mortgage_interest: float
    mortgage_principal: float
    property_costs: float
    offset_contributions: float = 0.0
    rent_paid: float = 0.0
    rental_income: float = 0.0
    tax_saving: float = 0.0
    total_outflows: float
    net_position: float
    cumulative_position: float
    property_value: float
    loan_balance: float
    equity: float
    offset_balance: float
    salary: float = 0.0
    income_tax: float = 0.0
    ongoing_costs_detail: OngoingCostsDetailResponse | None = None
    tax_deduction_detail: TaxDeductionDetailResponse | None = None


class CashFlowSummaryResponse(BaseModel):
    """
    Summary stats across the full projection — shared by both scenarios.

    Attributes:
        total_income: Sum of net income across all years
        total_outflows: Sum of all outflows across all years
        total_interest_paid: Sum of mortgage interest across all years
        total_rent_paid: Sum of rent paid across all years (0 for PPOR)
        total_rental_income: Sum of rental income across all years (0 for PPOR)
        total_tax_saving: Sum of tax saving across all years (0 for PPOR)
        final_property_value: Property value at end of projection
        final_loan_balance: Remaining mortgage at end of projection
        final_equity: Property value minus loan balance at end of projection
        average_annual_net: Average net position per year
        net_wealth: Final equity plus cumulative cash position
    """

    total_income: float
    total_outflows: float
    total_interest_paid: float
    total_rent_paid: float = 0.0
    total_rental_income: float = 0.0
    total_tax_saving: float = 0.0
    final_property_value: float
    final_loan_balance: float
    final_equity: float
    average_annual_net: float
    net_wealth: float


class CGTResponse(BaseModel):
    """
    Capital gains tax result at end of projection — rentvesting only.

    Attributes:
        cost_base: Adjusted cost base of the property
        capital_gain: Sale price minus cost base
        cgt_discount: 50% discount amount (if held > 12 months)
        discounted_gain: Capital gain after discount
        cgt_payable: Tax payable on the discounted gain
        net_proceeds: Sale price minus CGT payable
    """

    cost_base: float
    capital_gain: float
    cgt_discount: float
    discounted_gain: float
    cgt_payable: float
    net_proceeds: float


class PurchaseCostsResponse(BaseModel):
    """
    Itemised property acquisition costs in the response.

    Attributes:
        stamp_duty: State transfer duty
        legal_fees: Conveyancing and legal fees
        building_pest_inspection: Building and pest inspection fees
        registration_fee: Title registration fee
        other_costs: Any other acquisition costs
        total: Sum of all property acquisition costs
    """

    stamp_duty: float
    legal_fees: float
    building_pest_inspection: float
    registration_fee: float
    other_costs: float
    total: float


class BorrowingCostsResponse(BaseModel):
    """
    Itemised loan-related costs in the response.

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


class UpfrontCostsResponse(BaseModel):
    """
    All upfront costs — purchase costs and borrowing costs combined.

    Attributes:
        purchase_costs: Itemised property acquisition costs (CGT cost base)
        borrowing_costs: Itemised loan-related costs (deductible over 5 years)
        total: Total cash out at settlement
    """

    purchase_costs: PurchaseCostsResponse
    borrowing_costs: BorrowingCostsResponse
    total: float


class CashFlowPPORResponse(BaseModel):
    """
    PPOR cash flow projection response.

    Attributes:
        scenario: Always "ppor"
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs
        years: Year-by-year cash flow breakdown
        summary: Summary stats across the full projection
    """

    scenario: str = "ppor"
    projection_years: int
    upfront_costs: UpfrontCostsResponse
    years: list[CashFlowYearResponse]
    summary: CashFlowSummaryResponse


class CashFlowRentvestResponse(BaseModel):
    """
    Rentvesting cash flow projection response.

    Attributes:
        scenario: Always "rentvesting"
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs
        years: Year-by-year cash flow breakdown
        cgt: Capital gains tax result
        summary: Summary stats across the full projection
    """

    scenario: str = "rentvesting"
    projection_years: int
    upfront_costs: UpfrontCostsResponse
    years: list[CashFlowYearResponse]
    cgt: CGTResponse
    summary: CashFlowSummaryResponse
