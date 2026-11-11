"""
Cash flow projection services.

Orchestrates engine and service calls into year-by-year cash flow
projections for PPOR and rentvesting scenarios. Each function generates
the amortisation schedule upfront, loops year by year to build
CashFlowYear entries, then computes the projection summary.
"""

from dataclasses import replace
from datetime import timedelta

from app.engine.cgt import calculate_cgt
from app.engine.property import calculate_property_value
from app.engine.tax import calculate_hecs_repayment, calculate_total_tax, index_hecs_balance
from app.models.amortisation import ScheduleRow
from app.models.cashflow import (
    CashFlowPPORResult,
    CashFlowRentvestResult,
    CashFlowSummary,
    CashFlowSummaryInvestment,
    CashFlowYear,
    CashFlowYearInvestment,
)
from app.models.cgt import CGTResult
from app.models.deductions import PropertyTaxDeductionSummary
from app.models.financial import FinancialYear
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import OngoingCostProjection, PurchaseCosts, RentvestConfig, UpfrontCosts, YearCost
from app.models.tax import TaxProfile
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

    last_year = years[-1] if years else None
    final_property_value = last_year.property_value if last_year else 0.0
    final_loan_balance = last_year.loan_balance if last_year else 0.0
    final_equity = final_property_value - final_loan_balance
    average_annual_net = sum(year.net_position for year in years) / len(years) if years else 0.0
    net_wealth = last_year.net_wealth if last_year else 0.0

    return CashFlowSummary(
        total_income=total_income,
        total_outflows=total_outflows,
        total_interest_paid=total_interest_paid,
        final_property_value=final_property_value,
        final_loan_balance=final_loan_balance,
        final_equity=final_equity,
        average_annual_net=average_annual_net,
        net_wealth=net_wealth,
        total_tax_paid=sum(year.income_tax for year in years),
    )


def _calculate_investment_cashflow_summary(years: list[CashFlowYearInvestment]) -> CashFlowSummaryInvestment:
    """
    Calculate investment summary stats, extending the base summary with
    rental income, rent paid, and tax saving totals.

    Args:
        years: Year-by-year investment cash flow breakdown

    Returns:
        CashFlowSummaryInvestment with base totals plus investment fields
    """
    base = _calculate_cashflow_summary(years)
    total_tax_saving = sum(year.tax_saving for year in years)
    return CashFlowSummaryInvestment(
        total_income=base.total_income,
        total_outflows=base.total_outflows,
        total_interest_paid=base.total_interest_paid,
        final_property_value=base.final_property_value,
        final_loan_balance=base.final_loan_balance,
        final_equity=base.final_equity,
        average_annual_net=base.average_annual_net,
        net_wealth=base.net_wealth,
        total_tax_paid=base.total_tax_paid - total_tax_saving,
        total_rent_paid=sum(year.rent_paid for year in years),
        total_rental_income=sum(year.rental_income for year in years),
        total_tax_saving=total_tax_saving,
    )


def _build_projection_inputs(
    mortgage: Mortgage,
) -> tuple[UpfrontCosts, OngoingCostProjection]:
    """
    Build shared inputs for both PPOR and rentvesting projections.

    Args:
        mortgage: Mortgage aggregate with property, loan, and ongoing cost details.

    Returns:
        Tuple of (resolved upfront costs, ongoing cost projection).
    """
    upfront_costs = build_upfront_cost_estimate(mortgage)
    cost_projection = build_ongoing_cost_projection(mortgage)
    return upfront_costs, cost_projection


def _grow_tax_profile(tax_profile: TaxProfile, year: int, hecs_balance: float | None = None) -> TaxProfile:
    """
    Grow a tax profile's income measures by the income growth rate for a given year.

    Args:
        tax_profile: Base year tax profile
        year: Number of years of growth to apply
        hecs_balance: HECS/HELP debt outstanding in that year (defaults to the
            base profile's balance)

    Returns:
        New TaxProfile with grown income measures
    """
    growth_factor = (1 + tax_profile.income_growth_rate) ** year
    return TaxProfile(
        taxable_income=tax_profile.taxable_income * growth_factor,
        repayment_income=tax_profile.repayment_income * growth_factor,
        mls_income=tax_profile.mls_income * growth_factor,
        hecs_balance=tax_profile.hecs_balance if hecs_balance is None else hecs_balance,
        has_private_health=tax_profile.has_private_health,
        income_growth_rate=tax_profile.income_growth_rate,
        hecs_indexation_rate=tax_profile.hecs_indexation_rate,
    )


def _tax_profile_for_year(tax_profile: TaxProfile, year: int, hecs_balance: float) -> TaxProfile:
    """
    Build the tax profile for a projection year: grown income, and the HECS/HELP
    debt carried in from the previous year with that year's indexation applied.

    Args:
        tax_profile: Base year tax profile
        year: Projection year (0 = purchase year)
        hecs_balance: HECS/HELP debt remaining at the end of the previous year

    Returns:
        TaxProfile for the year, ready for the tax engine
    """
    indexed_balance = index_hecs_balance(hecs_balance, tax_profile.hecs_indexation_rate)
    return _grow_tax_profile(tax_profile, year, hecs_balance=indexed_balance)


def _offset_position(schedule_rows: list[ScheduleRow], opening_offset_balance: float) -> tuple[float, float]:
    """
    Work out the offset account's closing balance and the cash paid into it over a year.

    Args:
        schedule_rows: Amortisation schedule rows for the year (empty once the schedule ends)
        opening_offset_balance: Offset balance at the start of the year

    Returns:
        Tuple of (closing offset balance, contributions made during the year)
    """
    if not schedule_rows:
        return opening_offset_balance, 0.0
    closing_offset_balance = schedule_rows[-1].offset_balance
    return closing_offset_balance, closing_offset_balance - opening_offset_balance


def _closing_property_value(mortgage: Mortgage, year: int) -> float:
    """
    Property value at the end of a projection year, to line up with the
    end-of-year loan balance and cash position.

    Args:
        mortgage: Mortgage aggregate with property details
        year: Projection year (0 = purchase year)

    Returns:
        Property value after year + 1 years of growth
    """
    value_base = mortgage.property.value_base or mortgage.property.purchase_price
    return calculate_property_value(year + 1, value_base, mortgage.property.annual_appreciation)


def _calculate_sale_cgt(
    mortgage: Mortgage,
    years_held: int,
    hecs_balance: float,
    purchase_costs: PurchaseCosts | None = None,
) -> CGTResult:
    """
    Calculate the CGT payable if the investment property were sold after a number of years.

    Args:
        mortgage: Mortgage aggregate with property and tax profile details
        years_held: Whole projection years completed at the time of sale
        hecs_balance: HECS/HELP debt outstanding at the time of sale
        purchase_costs: Resolved purchase costs for the cost base, so auto-estimated
            costs (e.g. stamp duty) are included. Defaults to the property's own.

    Returns:
        CGTResult for a sale at that point
    """
    sold_property = mortgage.property
    if purchase_costs is not None:
        sold_property = replace(sold_property, purchase_costs=purchase_costs)
    sale_price = _closing_property_value(mortgage, years_held - 1)
    sale_date = mortgage.property.purchase_date + timedelta(days=365 * years_held)
    return calculate_cgt(
        property=sold_property,
        sale_price=sale_price,
        sale_date=sale_date,
        tax_profile=_grow_tax_profile(mortgage.person.tax_profile, years_held, hecs_balance=hecs_balance),
        is_ppor=False,
    )


def _calculate_cashflow_year(
    year: int,
    tax_profile: TaxProfile,
    schedule_rows: list,
    ongoing_costs: YearCost,
    previous_cumulative: float,
    opening_offset_balance: float = 0.0,
    closing_property_value: float | None = None,
) -> CashFlowYear:
    """
    Calculate a single year's cash flow breakdown for a PPOR scenario.

    Expects a pre-grown tax_profile for this year. Calculates net income
    by subtracting total tax from the profile's taxable income.

    Args:
        year: Projection year (0 = purchase year)
        tax_profile: Tax profile for this year (income grown, HECS balance as owed this year)
        schedule_rows: Pre-sliced amortisation schedule rows for this year
        ongoing_costs: YearCost breakdown for this year
        previous_cumulative: Cumulative position from the previous year
        opening_offset_balance: Offset account balance at the start of this year
        closing_property_value: Property value at the end of this year (defaults to
            the value the year's costs were based on)

    Returns:
        CashFlowYear with summary and detail breakdowns for this year
    """
    salary = tax_profile.taxable_income
    income_tax = calculate_total_tax(tax_profile)
    net_income = salary - income_tax
    hecs_repayment = calculate_hecs_repayment(tax_profile.repayment_income, tax_profile.hecs_balance)

    mortgage_interest = sum(r.interest for r in schedule_rows)
    mortgage_principal = sum(r.principal_paid + r.extra_paid for r in schedule_rows)
    mortgage_repayment = mortgage_interest + mortgage_principal

    loan_balance = schedule_rows[-1].closing_balance if schedule_rows else 0.0
    offset_balance, offset_contributions = _offset_position(schedule_rows, opening_offset_balance)

    property_costs = ongoing_costs.total_costs
    property_value = ongoing_costs.property_value if closing_property_value is None else closing_property_value

    total_inflows = net_income
    total_outflows = mortgage_repayment + property_costs + offset_contributions
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
        offset_contributions=offset_contributions,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
        salary=salary,
        income_tax=income_tax,
        hecs_repayment=hecs_repayment,
        hecs_balance=tax_profile.hecs_balance - hecs_repayment,
        ongoing_costs_detail=ongoing_costs,
        schedule_rows_detail=schedule_rows,
    )


def _calculate_investment_cashflow_year(
    year: int,
    tax_profile: TaxProfile,
    schedule_rows: list,
    ongoing_costs: YearCost,
    previous_cumulative: float,
    rentvest: RentvestConfig | None = None,
    tax_deduction_detail: PropertyTaxDeductionSummary | None = None,
    opening_offset_balance: float = 0.0,
    closing_property_value: float | None = None,
) -> CashFlowYearInvestment:
    """
    Calculate a single year's cash flow breakdown for an investment scenario.

    Extends the base calculation with rental income, tax deductions, and
    optionally rent paid (for rentvesting).

    Args:
        year: Projection year (0 = purchase year)
        tax_profile: Tax profile for this year (income grown, HECS balance as owed this year)
        schedule_rows: Pre-sliced amortisation schedule rows for this year
        ongoing_costs: YearCost breakdown for this year (includes rental_income)
        previous_cumulative: Cumulative position from the previous year
        rentvest: Tenant rental config (None unless rentvesting)
        tax_deduction_detail: Tax deduction breakdown for this year
        opening_offset_balance: Offset account balance at the start of this year
        closing_property_value: Property value at the end of this year (defaults to
            the value the year's costs were based on)

    Returns:
        CashFlowYearInvestment with investment-specific fields
    """
    salary = tax_profile.taxable_income
    income_tax = calculate_total_tax(tax_profile)
    net_income = salary - income_tax

    # A rental profit adds to repayment income; a rental loss is added back, so it never lowers it.
    net_rental_income = tax_deduction_detail.net_rental_income if tax_deduction_detail else 0.0
    hecs_repayment = calculate_hecs_repayment(
        tax_profile.repayment_income + max(net_rental_income, 0), tax_profile.hecs_balance
    )

    mortgage_interest = sum(r.interest for r in schedule_rows)
    mortgage_principal = sum(r.principal_paid + r.extra_paid for r in schedule_rows)
    mortgage_repayment = mortgage_interest + mortgage_principal

    loan_balance = schedule_rows[-1].closing_balance if schedule_rows else 0.0
    offset_balance, offset_contributions = _offset_position(schedule_rows, opening_offset_balance)

    property_costs = ongoing_costs.total_costs
    property_value = ongoing_costs.property_value if closing_property_value is None else closing_property_value
    rental_income = ongoing_costs.rental_income
    rent_paid = rentvest.weekly_rent_paid * 52 * (1 + rentvest.annual_rent_paid_growth) ** year if rentvest else 0.0
    tax_saving = tax_deduction_detail.tax_saving if tax_deduction_detail else 0.0

    total_inflows = net_income + rental_income + tax_saving
    total_outflows = mortgage_repayment + property_costs + rent_paid + offset_contributions
    net_position = total_inflows - total_outflows
    cumulative_position = previous_cumulative + net_position
    equity = property_value - loan_balance

    return CashFlowYearInvestment(
        year=year,
        net_income=net_income,
        total_inflows=total_inflows,
        mortgage_repayment=mortgage_repayment,
        mortgage_interest=mortgage_interest,
        mortgage_principal=mortgage_principal,
        property_costs=property_costs,
        offset_contributions=offset_contributions,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
        salary=salary,
        income_tax=income_tax,
        hecs_repayment=hecs_repayment,
        hecs_balance=tax_profile.hecs_balance - hecs_repayment,
        ongoing_costs_detail=ongoing_costs,
        schedule_rows_detail=schedule_rows,
        rental_income=rental_income,
        tax_saving=tax_saving,
        rent_paid=rent_paid,
        tax_deduction_detail=tax_deduction_detail,
    )


def build_ppor_cashflow(mortgage: Mortgage) -> CashFlowPPORResult:
    """
    Build a year-by-year cash flow projection for the PPOR scenario.

    Owner lives in the property. No rental income, no tax deductions, no CGT.

    Growth rates are sourced from domain models:
    - Income growth from mortgage.person.tax_profile.income_growth_rate
    - Property appreciation from mortgage.property.annual_appreciation
    - Cost inflation from mortgage.ongoing_costs.annual_cost_growth_rate

    Args:
        mortgage: Mortgage aggregate with property, loan, tax profile, and ongoing cost details

    Returns:
        CashFlowPPORResult with year-by-year breakdown and summary
    """

    # Build shared projection inputs
    upfront_costs, cost_projection = _build_projection_inputs(mortgage)

    # Build list of CashFlowYear models for each year
    cumulative_cash_position = -upfront_costs.total_cash_at_settlement
    hecs_balance = mortgage.person.tax_profile.hecs_balance
    offset_balance = mortgage.loan.config.offset_balance
    cashflow_years = []
    for year in range(mortgage.projection_years):
        year_profile = _tax_profile_for_year(mortgage.person.tax_profile, year, hecs_balance)

        cashflow_year = _calculate_cashflow_year(
            year=year,
            tax_profile=year_profile,
            schedule_rows=mortgage.loan.rows_for_year(year),
            ongoing_costs=cost_projection.annual_costs[year],
            previous_cumulative=cumulative_cash_position,
            opening_offset_balance=offset_balance,
            closing_property_value=_closing_property_value(mortgage, year),
        )
        cumulative_cash_position = cashflow_year.cumulative_position
        hecs_balance = cashflow_year.hecs_balance
        offset_balance = cashflow_year.offset_balance
        cashflow_years.append(cashflow_year)

    return CashFlowPPORResult(
        projection_years=mortgage.projection_years,
        upfront_costs=upfront_costs,
        years=cashflow_years,
        summary=_calculate_cashflow_summary(cashflow_years),
    )


def build_rentvest_cashflow(mortgage: Mortgage) -> CashFlowRentvestResult:
    """
    Build a year-by-year cash flow projection for the rentvesting scenario.

    Owner rents where they live and owns an investment property elsewhere.
    Includes rental income, tax deductions, tax saving, and CGT at sale.

    Growth rates are sourced from domain models:
    - Income growth from mortgage.person.tax_profile.income_growth_rate
    - Property appreciation from mortgage.property.annual_appreciation
    - Rental income growth from mortgage.property.rental.annual_growth_rate
    - Rent paid growth from mortgage.rentvest.annual_rent_paid_growth
    - Cost inflation from mortgage.ongoing_costs.annual_cost_growth_rate

    Args:
        mortgage: Mortgage aggregate with property, loan, tax profile, ongoing cost,
            and rentvest details

    Returns:
        CashFlowRentvestResult with year-by-year breakdown, CGT, and summary
    """
    # Build shared projection inputs
    upfront_costs, cost_projection = _build_projection_inputs(mortgage)

    # Build list of CashFlowYear models for each year
    cumulative_cash_position = -upfront_costs.total_cash_at_settlement
    hecs_balance = mortgage.person.tax_profile.hecs_balance
    offset_balance = mortgage.loan.config.offset_balance
    cashflow_years = []
    for year in range(mortgage.projection_years):
        year_rows = mortgage.loan.rows_for_year(year)
        year_costs = cost_projection.annual_costs[year]

        # Derive financial year from purchase date + year offset
        fy_year = mortgage.property.purchase_date.year + year + 1
        financial_year = FinancialYear(fy_year)

        # Tax profile for this year: grown income, HECS debt carried in and indexed
        year_profile = _tax_profile_for_year(mortgage.person.tax_profile, year, hecs_balance)

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
            rentvest=mortgage.rentvest,
            tax_deduction_detail=tax_deduction,
            opening_offset_balance=offset_balance,
            closing_property_value=_closing_property_value(mortgage, year),
        )
        cumulative_cash_position = cashflow_year.cumulative_position
        hecs_balance = cashflow_year.hecs_balance
        offset_balance = cashflow_year.offset_balance
        cashflow_year.cgt_if_sold = _calculate_sale_cgt(
            mortgage, year + 1, hecs_balance, upfront_costs.purchase_costs
        ).cgt_payable
        cashflow_years.append(cashflow_year)

    # CGT on a sale at the end of the projection
    cgt = _calculate_sale_cgt(mortgage, mortgage.projection_years, hecs_balance, upfront_costs.purchase_costs)

    return CashFlowRentvestResult(
        projection_years=mortgage.projection_years,
        upfront_costs=upfront_costs,
        years=cashflow_years,
        cgt=cgt,
        summary=_calculate_investment_cashflow_summary(cashflow_years),
    )
