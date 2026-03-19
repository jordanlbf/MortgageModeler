"""
Cash flow projection services.

Orchestrates engine and service calls into year-by-year cash flow
projections for PPOR and rentvesting scenarios. Each function generates
the amortisation schedule upfront, loops year by year to build
CashFlowYear entries, then computes the projection summary.
"""

from typing import Optional

from datetime import timedelta

from app.engine.cgt import calculate_cgt
from app.engine.property import calculate_property_value
from app.models.amortisation import AmortisationSchedule, ScheduleRow
from app.models.cashflow import CashFlowYear, CashFlowSummary, CashFlowPPORResult, CashFlowRentvestResult
from app.models.deductions import PropertyTaxDeductionSummary
from app.models.financial import FinancialYear
from app.models.loan import LoanConfig
from app.models.property import Property, OngoingCostsConfig, OngoingCostProjection, RentvestConfig, YearCost, UpfrontCosts
from app.models.tax import TaxProfile
from app.services.amortisation import build_amortisation_schedule
from app.services.ongoing_costs import build_ongoing_cost_projection
from app.services.tax_deductions import build_tax_deduction_summary
from app.services.upfront_costs import build_upfront_cost_estimate


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


def _build_projection_inputs(
    property: Property,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    projection_years: int,
) -> tuple[UpfrontCosts, AmortisationSchedule, OngoingCostProjection]:
    """
    Build shared inputs for both PPOR and rentvesting projections.

    Args:
        property: Property details
        loan: Loan configuration
        ongoing_costs: Ongoing cost rates
        projection_years: Number of years to project

    Returns:
        Tuple of (resolved upfront costs, amortisation schedule, ongoing cost projection)
    """
    upfront_costs = build_upfront_cost_estimate(property=property, loan=loan)
    schedule = build_amortisation_schedule(property=property, loan=loan)
    cost_projection = build_ongoing_cost_projection(property=property, ongoing_costs=ongoing_costs, projection_years=projection_years)
    return upfront_costs, schedule, cost_projection


def _get_year_rows(schedule: AmortisationSchedule, year: int) -> list[ScheduleRow]:
    """
    Slice amortisation schedule rows for a specific year.

    Args:
        schedule: Full amortisation schedule
        year: Projection year (0-indexed)

    Returns:
        List of ScheduleRow for this year
    """
    ppy = schedule.periods_per_year
    start = year * ppy
    end = min((year + 1) * ppy, len(schedule.rows))
    return schedule.rows[start:end]


def _grow_tax_profile(tax_profile: TaxProfile, year: int) -> TaxProfile:
    """
    Grow a tax profile's income measures by the income growth rate for a given year.

    Args:
        tax_profile: Base year tax profile
        year: Number of years of growth to apply

    Returns:
        New TaxProfile with grown income measures
    """
    growth_factor = (1 + tax_profile.income_growth_rate) ** year
    return TaxProfile(
        taxable_income=tax_profile.taxable_income * growth_factor,
        repayment_income=tax_profile.repayment_income * growth_factor,
        mls_income=tax_profile.mls_income * growth_factor,
        hecs_balance=tax_profile.hecs_balance,
        has_private_health=tax_profile.has_private_health,
        income_growth_rate=tax_profile.income_growth_rate,
    )


def _calculate_cashflow_year(
    year: int,
    tax_profile: TaxProfile,
    schedule_rows: list,
    ongoing_costs: YearCost,
    previous_cumulative: float,
    rentvest: Optional[RentvestConfig] = None,
    tax_deduction_detail: Optional[PropertyTaxDeductionSummary] = None,
) -> CashFlowYear:
    """
    Calculate a single year's cash flow breakdown.

    Expects a pre-grown tax_profile for this year. Calculates net income
    by subtracting total tax from the profile's taxable income.

    Args:
        year: Projection year (0 = purchase year)
        tax_profile: Pre-grown tax profile for this year (income already adjusted)
        schedule_rows: Pre-sliced amortisation schedule rows for this year
        ongoing_costs: YearCost breakdown for this year (includes rental_income)
        previous_cumulative: Cumulative position from the previous year
        rentvest: Tenant rental config (None for PPOR)
        tax_deduction_detail: Tax deduction breakdown for this year (None for PPOR)

    Returns:
        CashFlowYear with summary and detail breakdowns for this year
    """
    # Calculate net income from pre-grown tax profile
    from app.engine.tax import calculate_total_tax
    net_income = tax_profile.taxable_income - calculate_total_tax(tax_profile)

    # Sum mortgage payments from this year's rows
    mortgage_interest = sum(r.interest for r in schedule_rows)
    mortgage_principal = sum(r.principal_paid + r.extra_paid for r in schedule_rows)
    mortgage_repayment = mortgage_interest + mortgage_principal

    # Loan balance and offset from last row of this year (or 0 if paid off)
    if schedule_rows:
        loan_balance = schedule_rows[-1].closing_balance
        offset_balance = schedule_rows[-1].offset_balance
    else:
        loan_balance = 0.0
        offset_balance = 0.0

    # Derive from domain models
    property_costs = ongoing_costs.total_costs
    property_value = ongoing_costs.property_value
    rental_income = ongoing_costs.rental_income
    rent_paid = rentvest.weekly_rent_paid * 52 * (1 + rentvest.annual_rent_paid_growth) ** year if rentvest else 0.0
    tax_saving = tax_deduction_detail.tax_saving if tax_deduction_detail else 0.0

    # Assemble totals
    total_inflows = net_income + rental_income + tax_saving
    total_outflows = mortgage_repayment + property_costs + rent_paid
    net_position = total_inflows - total_outflows
    cumulative_position = previous_cumulative + net_position
    equity = property_value - loan_balance

    return CashFlowYear(
        year=year,
        net_income=net_income,
        total_inflows=total_inflows,
        mortgage_repayment=mortgage_repayment,
        mortgage_interest=mortgage_interest,
        mortgage_principal=mortgage_principal,
        property_costs=property_costs,
        rent_paid=rent_paid,
        rental_income=rental_income,
        tax_saving=tax_saving,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
        ongoing_costs_detail=ongoing_costs,
        schedule_rows_detail=schedule_rows,
        tax_deduction_detail=tax_deduction_detail,
    )


def build_ppor_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    projection_years: int,
) -> CashFlowPPORResult:
    """
    Build a year-by-year cash flow projection for the PPOR scenario.

    Owner lives in the property. No rental income, no tax deductions, no CGT.

    Growth rates are sourced from domain models:
    - Income growth from tax_profile.income_growth_rate
    - Property appreciation from property.annual_appreciation
    - Cost inflation from ongoing_costs.annual_cost_growth_rate

    Args:
        property: Property details with purchase price, costs, and appreciation rate
        tax_profile: Taxpayer base income configuration (year 0) with income growth rate
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        projection_years: Number of years to project

    Returns:
        CashFlowPPORResult with year-by-year breakdown and summary
    """

    # Build shared projection inputs
    upfront_costs, schedule, cost_projection = _build_projection_inputs(
        property, loan, ongoing_costs, projection_years
    )

    # Build list of CashFlowYear models for each year
    cumulative_cash_position = -upfront_costs.total_cash_at_settlement
    cashflow_years = []
    for year in range(projection_years):
        grown_profile = _grow_tax_profile(tax_profile, year)

        cashflow_year = _calculate_cashflow_year(
            year=year,
            tax_profile=grown_profile,
            schedule_rows=_get_year_rows(schedule, year),
            ongoing_costs=cost_projection.annual_costs[year],
            previous_cumulative=cumulative_cash_position,
        )
        cumulative_cash_position = cashflow_year.cumulative_position
        cashflow_years.append(cashflow_year)

    return CashFlowPPORResult(
        projection_years=projection_years,
        upfront_costs=upfront_costs,
        years=cashflow_years,
        summary=_calculate_cashflow_summary(cashflow_years),
    )


def build_rentvest_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    rentvest: RentvestConfig,
    projection_years: int,
) -> CashFlowRentvestResult:
    """
    Build a year-by-year cash flow projection for the rentvesting scenario.

    Owner rents where they live and owns an investment property elsewhere.
    Includes rental income, tax deductions, tax saving, and CGT at sale.

    Growth rates are sourced from domain models:
    - Income growth from tax_profile.income_growth_rate
    - Property appreciation from property.annual_appreciation
    - Rental income growth from property.rental.annual_growth_rate
    - Rent paid growth from rentvest.annual_rent_paid_growth
    - Cost inflation from ongoing_costs.annual_cost_growth_rate

    Args:
        property: Investment property with purchase details, appreciation rate,
            rental config, depreciable buildings, and depreciable assets
        tax_profile: Taxpayer base income configuration (year 0) with income growth rate
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        rentvest: Tenant rental configuration (rent paid and growth rate)
        projection_years: Number of years to project

    Returns:
        CashFlowRentvestResult with year-by-year breakdown, CGT, and summary
    """
    # Build shared projection inputs
    upfront_costs, schedule, cost_projection = _build_projection_inputs(
        property, loan, ongoing_costs, projection_years
    )

    # Build list of CashFlowYear models for each year
    cumulative_cash_position = -upfront_costs.total_cash_at_settlement
    cashflow_years = []
    for year in range(projection_years):
        year_rows = _get_year_rows(schedule, year)
        year_costs = cost_projection.annual_costs[year]

        # Derive financial year from purchase date + year offset
        fy_year = property.purchase_date.year + year + 1
        financial_year = FinancialYear(fy_year)

        # Grow tax profile for this year
        grown_profile = _grow_tax_profile(tax_profile, year)

        # Calculate tax deductions for this year
        mortgage_interest = sum(r.interest for r in year_rows)
        tax_deduction = build_tax_deduction_summary(
            property=property,
            mortgage_interest=mortgage_interest,
            ongoing_costs=year_costs,
            rental_income=year_costs.rental_income,
            tax_profile=grown_profile,
            financial_year=financial_year,
            loan=loan,
        )

        cashflow_year = _calculate_cashflow_year(
            year=year,
            tax_profile=grown_profile,
            schedule_rows=year_rows,
            ongoing_costs=year_costs,
            previous_cumulative=cumulative_cash_position,
            rentvest=rentvest,
            tax_deduction_detail=tax_deduction,
        )
        cumulative_cash_position = cashflow_year.cumulative_position
        cashflow_years.append(cashflow_year)

    # Calculate CGT at end of projection
    sale_price = calculate_property_value(
        projection_years, property.purchase_price, property.annual_appreciation
    )
    sale_date = property.purchase_date + timedelta(days=365 * projection_years)
    grown_profile = _grow_tax_profile(tax_profile, projection_years)
    cgt = calculate_cgt(
        property=property,
        sale_price=sale_price,
        sale_date=sale_date,
        tax_profile=grown_profile,
        is_ppor=False,
    )

    return CashFlowRentvestResult(
        projection_years=projection_years,
        upfront_costs=upfront_costs,
        years=cashflow_years,
        cgt=cgt,
        summary=_calculate_cashflow_summary(cashflow_years),
    )
