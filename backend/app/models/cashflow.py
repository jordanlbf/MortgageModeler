"""
Cash flow domain models — year-by-year projection results.

Base models cover any property owner (PPOR or investment). Investment
subclasses add rental income, tax deductions, and rent-paid fields.
"""

from dataclasses import dataclass, field

from app.models.amortisation import ScheduleRow
from app.models.cgt import CGTResult
from app.models.deductions import PropertyTaxDeductionSummary
from app.models.property import UpfrontCosts, YearCost


@dataclass
class CashFlowYear:
    """
    A single year's cash flow breakdown — shared by all scenarios.

    Attributes:
        year: Projection year (0 = purchase year)
        net_income: Salary minus total tax
        total_inflows: Sum of all income sources for the year
        mortgage_repayment: Total mortgage payments for the year
        mortgage_interest: Interest portion of mortgage payments
        mortgage_principal: Principal portion of mortgage payments
        property_costs: Ongoing property costs for the year
        offset_contributions: Cash added to offset account this year
        total_outflows: Sum of all expenses for the year
        net_position: total_inflows minus total_outflows
        cumulative_position: Running total of net_position (year 0 offset by upfront costs)
        property_value: Appreciated property value at end of year
        loan_balance: Remaining mortgage balance at end of year
        equity: Property value minus loan balance
        offset_balance: Offset account balance at end of year
        ongoing_costs_detail: Full ongoing cost breakdown for this year
        schedule_rows_detail: Per-period mortgage rows for this year
    """

    year: int
    net_income: float
    total_inflows: float
    mortgage_repayment: float
    mortgage_interest: float
    mortgage_principal: float
    property_costs: float
    offset_contributions: float
    total_outflows: float
    net_position: float
    cumulative_position: float
    property_value: float
    loan_balance: float
    equity: float
    offset_balance: float
    salary: float = 0.0
    income_tax: float = 0.0
    ongoing_costs_detail: YearCost | None = None
    schedule_rows_detail: list[ScheduleRow] = field(default_factory=list)


@dataclass
class CashFlowYearInvestment(CashFlowYear):
    """
    Investment-specific year fields — rental income, tax deductions, rent paid.

    Attributes:
        rental_income: Annual rental income received
        tax_saving: Tax benefit from deductions (negative if positively geared)
        rent_paid: Annual rent where the investor lives (rentvesting only)
        tax_deduction_detail: Tax deduction breakdown for this year
    """

    rental_income: float = 0.0
    tax_saving: float = 0.0
    rent_paid: float = 0.0
    tax_deduction_detail: PropertyTaxDeductionSummary | None = None


@dataclass
class CashFlowSummary:
    """
    Summary stats across the full projection — shared by all scenarios.

    Attributes:
        total_income: Sum of net income across all years
        total_outflows: Sum of all outflows across all years
        total_interest_paid: Sum of mortgage interest across all years
        final_property_value: Property value at end of projection
        final_loan_balance: Remaining mortgage at end of projection
        final_equity: Property value minus loan balance at end of projection
        average_annual_net: Average net position per year
        net_wealth: Final equity plus cumulative cash position
    """

    total_income: float
    total_outflows: float
    total_interest_paid: float
    final_property_value: float
    final_loan_balance: float
    final_equity: float
    average_annual_net: float
    net_wealth: float


@dataclass
class CashFlowSummaryInvestment(CashFlowSummary):
    """
    Investment-specific summary fields.

    Attributes:
        total_rent_paid: Sum of rent paid across all years (rentvesting only)
        total_rental_income: Sum of rental income across all years
        total_tax_saving: Sum of tax saving across all years
    """

    total_rent_paid: float = 0.0
    total_rental_income: float = 0.0
    total_tax_saving: float = 0.0


@dataclass
class CashFlowSingleResult:
    """
    Complete single-property cash flow projection result.

    Supports all four mode × property_use combinations. Nullable fields
    distinguish between modes: upfront_costs is None for existing properties,
    cgt is None for PPOR.

    Attributes:
        mode: "new" or "existing"
        property_use: "ppor" or "investment"
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs (None for existing)
        years: Year-by-year cash flow breakdown
        cgt: Capital gains tax result (None for PPOR)
        summary: Summary stats across the full projection
    """

    mode: str
    property_use: str
    projection_years: int
    upfront_costs: UpfrontCosts | None
    years: list[CashFlowYear]
    cgt: CGTResult | None
    summary: CashFlowSummary


@dataclass
class CashFlowPPORResult:
    """
    Complete PPOR cash flow projection result.

    Attributes:
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs
        years: Year-by-year cash flow breakdown
        summary: Summary stats across the full projection
    """

    projection_years: int
    upfront_costs: UpfrontCosts
    years: list[CashFlowYear]
    summary: CashFlowSummary


@dataclass
class CashFlowRentvestResult:
    """
    Complete rentvesting cash flow projection result.

    Attributes:
        projection_years: Number of years projected
        upfront_costs: Itemised purchase and borrowing costs
        years: Year-by-year cash flow breakdown
        cgt: Capital gains tax result at end of projection
        summary: Summary stats across the full projection
    """

    projection_years: int
    upfront_costs: UpfrontCosts
    years: list[CashFlowYearInvestment]
    cgt: CGTResult
    summary: CashFlowSummaryInvestment
