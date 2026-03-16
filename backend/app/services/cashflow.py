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


def _calculate_cashflow_summary(years: list[CashFlowYear]) -> CashFlowSummary:
    """
    Calculate summary stats across the full projection from yearly entries.

    Derives all summary fields from the CashFlowYear list — final property
    value, loan balance, and cumulative position come from the last year.

    Args:
        years: Year-by-year cash flow breakdown

    Returns:
        CashFlowSummary with totals, final position, and net wealth
    """
    total_income = sum(year.net_income for year in years)
    total_outflows = sum(year.total_outflows for year in years)
    total_interest_paid = sum(year.mortgage_interest for year in years)
    total_rent_paid = sum(year.rent_paid for year in years)
    total_rental_income = sum(year.rental_income for year in years)
    total_tax_saving = sum(year.tax_saving for year in years)

    last_year = years[-1] if years else None
    final_property_value = last_year.property_value if last_year else 0.0
    final_loan_balance = last_year.loan_balance if last_year else 0.0
    final_equity = final_property_value - final_loan_balance
    cumulative_position = last_year.cumulative_position if last_year else 0.0
    average_annual_net = sum(year.net_position for year in years) / len(years) if years else 0.0
    net_wealth = final_equity + cumulative_position

    return CashFlowSummary(
        total_income=total_income,
        total_outflows=total_outflows,
        total_interest_paid=total_interest_paid,
        total_rent_paid=total_rent_paid,
        total_rental_income=total_rental_income,
        total_tax_saving=total_tax_saving,
        final_property_value=final_property_value,
        final_loan_balance=final_loan_balance,
        final_equity=final_equity,
        average_annual_net=average_annual_net,
        net_wealth=net_wealth,
    )


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
