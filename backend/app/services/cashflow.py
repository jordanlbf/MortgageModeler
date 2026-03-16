"""
Cash flow projection services.

Orchestrates engine and service calls into year-by-year cash flow
projections for PPOR and rentvesting scenarios. Each function generates
the amortisation schedule upfront, loops year by year to build
CashFlowYear entries, then computes the projection summary.
"""

from app.models.cashflow import CashFlowYear, CashFlowSummary, CashFlowPPORResult, CashFlowRentvestResult
from app.models.loan import LoanConfig
from app.models.property import Property, OngoingCostsConfig, RentvestConfig
from app.models.tax import TaxProfile


def build_ppor_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    annual_appreciation: float,
    projection_years: int,
) -> CashFlowPPORResult:
    """
    Build a year-by-year cash flow projection for the PPOR scenario.

    Owner lives in the property. No rental income, no tax deductions, no CGT.

    Generates the amortisation schedule upfront, then loops year by year
    computing net income, mortgage payments, ongoing costs, and property
    appreciation. Assembles into CashFlowYear entries and a summary.

    Args:
        property: Property details with purchase price and costs
        tax_profile: Taxpayer income configuration
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        annual_appreciation: Annual property growth rate as decimal
        projection_years: Number of years to project

    Returns:
        CashFlowPPORResult with year-by-year breakdown and summary
    """
    pass


def build_rentvest_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    rentvest: RentvestConfig,
    annual_appreciation: float,
    projection_years: int,
) -> CashFlowRentvestResult:
    """
    Build a year-by-year cash flow projection for the rentvesting scenario.

    Owner rents where they live and owns an investment property elsewhere.
    Includes rental income, tax deductions, tax saving, and CGT at sale.

    Generates the amortisation schedule upfront, then loops year by year
    computing net income, rent paid, mortgage payments, ongoing costs,
    rental income, tax deductions, and property appreciation. Calculates
    CGT at the end of the projection. Assembles into CashFlowYear entries
    and a summary.

    Args:
        property: Investment property details with purchase price, costs,
            depreciable buildings, and depreciable assets
        tax_profile: Taxpayer income configuration (base, without property income)
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        rentvest: Rental configuration (rent paid, rent received, vacancy, management, landlord insurance)
        annual_appreciation: Annual property growth rate as decimal
        projection_years: Number of years to project

    Returns:
        CashFlowRentvestResult with year-by-year breakdown, CGT, and summary
    """
    pass
