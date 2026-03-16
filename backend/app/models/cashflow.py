"""
Cash flow domain models — year-by-year projection results for PPOR and rentvesting scenarios.
"""

from dataclasses import dataclass

from app.models.cgt import CGTResult


@dataclass
class CashFlowYear:
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
        rent_paid: Annual rent where the investor lives (0 for PPOR)
        rental_income: Annual rental income received (0 for PPOR)
        tax_saving: Tax benefit from deductions (0 for PPOR, negative if positively geared)
        total_outflows: Sum of all expenses for the year
        net_position: total_inflows minus total_outflows
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
    rent_paid: float
    rental_income: float
    tax_saving: float
    total_outflows: float
    net_position: float
    cumulative_position: float
    property_value: float
    loan_balance: float
    equity: float
    offset_balance: float


@dataclass
class CashFlowSummary:
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
    total_rent_paid: float
    total_rental_income: float
    total_tax_saving: float
    final_property_value: float
    final_loan_balance: float
    final_equity: float
    average_annual_net: float
    net_wealth: float


@dataclass
class CashFlowPPORResult:
    """
    Complete PPOR cash flow projection result.

    Attributes:
        projection_years: Number of years projected
        upfront_costs: Total upfront acquisition costs
        years: Year-by-year cash flow breakdown
        summary: Summary stats across the full projection
    """
    projection_years: int
    upfront_costs: float
    years: list[CashFlowYear]
    summary: CashFlowSummary


@dataclass
class CashFlowRentvestResult:
    """
    Complete rentvesting cash flow projection result.

    Attributes:
        projection_years: Number of years projected
        upfront_costs: Total upfront acquisition costs
        years: Year-by-year cash flow breakdown
        cgt: Capital gains tax result at end of projection
        summary: Summary stats across the full projection
    """
    projection_years: int
    upfront_costs: float
    years: list[CashFlowYear]
    cgt: CGTResult
    summary: CashFlowSummary
