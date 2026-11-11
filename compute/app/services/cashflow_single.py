"""
Single property cashflow projection service.

Orchestrates year-by-year cashflow projections for a single property
across all four mode × property_use combinations:
- new × ppor
- new × investment
- existing × ppor
- existing × investment
"""

from dataclasses import replace

from app.models.cashflow import CashFlowSingleResult
from app.models.financial import FinancialYear
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.services.cashflow import (
    _build_projection_inputs,
    _calculate_cashflow_summary,
    _calculate_cashflow_year,
    _calculate_investment_cashflow_summary,
    _calculate_investment_cashflow_year,
    _calculate_sale_cgt,
    _tax_profile_for_year,
)
from app.services.ongoing_costs import build_ongoing_cost_projection
from app.services.tax_deductions import build_tax_deduction_summary


def build_single_cashflow(
    mortgage: Mortgage,
    mode: str,
    property_use: str,
) -> CashFlowSingleResult:
    """Build a year-by-year cashflow projection for a single property.

    Supports both new purchases and existing properties, for PPOR and
    investment use. Delegates to the shared year-calculation functions
    from the cashflow service.

    Args:
        mortgage: Mortgage aggregate with property, loan, tax profile,
            and ongoing cost details.
        mode: "new" or "existing".
        property_use: "ppor" or "investment".

    Returns:
        CashFlowSingleResult with year-by-year breakdown, optional
        upfront costs and CGT, and summary.
    """
    is_investment = property_use == "investment"

    # Build projection inputs — upfront costs only for new purchases
    if mode == "new":
        upfront_costs, cost_projection = _build_projection_inputs(mortgage)
        cumulative_cash_position = -upfront_costs.total_cash_at_settlement
    else:
        upfront_costs = None
        cost_projection = build_ongoing_cost_projection(mortgage)
        cumulative_cash_position = 0.0

    # Year-by-year projection
    hecs_balance = mortgage.person.tax_profile.hecs_balance
    offset_balance = mortgage.loan.config.offset_balance
    cashflow_years = []
    for year in range(mortgage.projection_years):
        year_rows = mortgage.loan.rows_for_year(year)
        year_costs = cost_projection.annual_costs[year]
        year_profile = _tax_profile_for_year(mortgage.person.tax_profile, year, hecs_balance)

        if is_investment:
            # Derive financial year from purchase date + year offset
            fy_year = mortgage.property.purchase_date.year + year + 1
            financial_year = FinancialYear(fy_year)

            # Calculate tax deductions for this year
            year_mortgage = replace(mortgage, person=Person(tax_profile=year_profile))
            tax_deduction = build_tax_deduction_summary(
                mortgage=year_mortgage,
                year=year,
                ongoing_costs=year_costs,
                financial_year=financial_year,
            )

            cashflow_year = _calculate_investment_cashflow_year(
                year=year,
                tax_profile=year_profile,
                schedule_rows=year_rows,
                ongoing_costs=year_costs,
                previous_cumulative=cumulative_cash_position,
                tax_deduction_detail=tax_deduction,
                opening_offset_balance=offset_balance,
            )
            cashflow_year.cgt_if_sold = _calculate_sale_cgt(
                mortgage, year + 1, cashflow_year.hecs_balance
            ).cgt_payable
        else:
            cashflow_year = _calculate_cashflow_year(
                year=year,
                tax_profile=year_profile,
                schedule_rows=year_rows,
                ongoing_costs=year_costs,
                previous_cumulative=cumulative_cash_position,
                opening_offset_balance=offset_balance,
            )

        cumulative_cash_position = cashflow_year.cumulative_position
        hecs_balance = cashflow_year.hecs_balance
        offset_balance = cashflow_year.offset_balance
        cashflow_years.append(cashflow_year)

    # CGT only for investment properties
    cgt = None
    if is_investment:
        cgt = _calculate_sale_cgt(mortgage, mortgage.projection_years, hecs_balance)

    # Build appropriate summary
    if is_investment:
        summary = _calculate_investment_cashflow_summary(cashflow_years)
    else:
        summary = _calculate_cashflow_summary(cashflow_years)

    return CashFlowSingleResult(
        mode=mode,
        property_use=property_use,
        projection_years=mortgage.projection_years,
        upfront_costs=upfront_costs,
        years=cashflow_years,
        cgt=cgt,
        summary=summary,
    )
